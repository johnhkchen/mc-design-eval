// Les Mills Britomart: a four-storey stripped-classical commercial block of the 1920s-30s. Red brick walls on a
// dark volcanic basalt plinth, white plaster string courses and lintels, glass shopfronts at street level and
// sash-style windows above, a plastered parapet and cornice. The lidar roof is 17 blocks across the block, with
// 19 on the parapet ring and on the stair/lift plant, so those read as the 2-block parapet and rooftop plant.
// No interiors: each storey is a floor slab, and the air behind each pane is the room that is left open.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_909950278.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_909950278.nbt";
const g = new Voxels([39, 32, 57]);

// The footprint, and the lidar roof height per cell
const R = new Map();
for (const [x, z, , roof] of cells) R.set(`${x},${z}`, roof);
const inF = (x, z) => R.has(`${x},${z}`);
const key = (x, z) => `${x},${z}`;
const parse = (k) => k.split(",").map(Number);

// Outward normals; the name is the facing a door takes on that face
const SIDES = [
  { dx: 0, dz: -1, name: "north" },
  { dx: 0, dz: 1, name: "south" },
  { dx: -1, dz: 0, name: "west" },
  { dx: 1, dz: 0, name: "east" },
];
const exposed = (x, z) => SIDES.filter((s) => !inF(x + s.dx, z + s.dz));
// along-face coordinate: x on a north/south face, z on an east/west face
const uOf = (x, z, s) => (s.dx === 0 ? x : z);

// The planned blocks, set in one pass at the end so the pane and light passes can read the neighbours
const P = new Map();
const put = (x, y, z, block, state) => P.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => P.get(`${x},${y},${z}`);

const F = [...R.keys()].map(parse);
const side = new Map();                  // boundary cell -> its facade side
for (const [x, z] of F) { const ex = exposed(x, z); if (ex.length) side.set(key(x, z), ex[0]); }

// The entrance is on the face with the most facade cells
const count = new Map();
for (const s of side.values()) count.set(s.name, (count.get(s.name) ?? 0) + 1);
const entName = [...count].sort((a, b) => b[1] - a[1])[0][0];
const entSide = SIDES.find((s) => s.name === entName);
const entCells = [...side].filter(([, s]) => s.name === entName)
  .map(([k]) => { const [x, z] = parse(k); return { u: uOf(x, z, entSide), x, z }; })
  .sort((a, b) => a.u - b.u);
// a pair of adjacent facade cells nearest the middle of that face, for a double door
const mid = Math.floor(entCells.length / 2);
let pair = null;
for (let d = 0; d < entCells.length && !pair; d++) for (const i of [mid + d, mid - d]) {
  if (i < 0 || i + 1 >= entCells.length) continue;
  if (entCells[i + 1].u === entCells[i].u + 1) { pair = [entCells[i], entCells[i + 1]]; break; }
}
const doorKeys = new Set(pair ? pair.map((c) => key(c.x, c.z)) : []);

// 1. Floor slabs and roof deck across the whole footprint: basalt ground floor, then a slab per storey
for (const [x, z] of F) {
  put(x, 0, z, "polished_basalt");
  for (const y of [4, 8, 12, 16]) put(x, y, z, "smooth_stone");
}

// 2. The facade on every boundary cell, from its ground up to the cornice
function facade(u, y, s) {
  const k = Math.floor(y / 4), r = y % 4, m = ((u % 4) + 4) % 4;
  if (y === 0) return { block: "polished_basalt" };
  if (y === 16 || r === 0) return { block: "smooth_quartz" };     // cornice and storey string courses
  if (k === 0) {                                                   // shopfront: glass between quartz piers
    if (r === 3) return { block: "bricks" };
    return (m === 1 || m === 2) ? { block: "glass" } : { block: "smooth_quartz" };
  }
  if (m === 1 || m === 2) return r === 3 ? { block: "smooth_quartz" } : { block: "glass_pane", pane: true };
  return { block: "bricks" };                                      // brick piers, two wide
}

for (const [k, s] of side) {
  const [x, z] = parse(k), u = uOf(x, z, s);
  for (let y = 0; y <= 16; y++) {
    const f = facade(u, y, s);
    put(x, y, z, f.block, f.pane ? { north: "false", south: "false", east: "false", west: "false" } : undefined);
    if (f.pane) P.get(`${x},${y},${z}`).pane = s;
  }
}

// 3. The entrance: a double door in the shopfront, with its lintel over it
if (pair) {
  pair.forEach((c, i) => {
    const hinge = i === 0 ? "left" : "right";
    put(c.x, 1, c.z, "dark_oak_door", { facing: entName, half: "lower", hinge, open: "false", powered: "false" });
    put(c.x, 2, c.z, "dark_oak_door", { facing: entName, half: "upper", hinge, open: "false", powered: "false" });
    put(c.x, 3, c.z, "smooth_quartz");
  });
}

// 4. Roof: the parapet is the lidar's 18+ edge ring; the interior 19s are lidar noise on the flat deck, so they stay
// at 17 (scattered plant bumps read as noise, not as roof equipment)
for (const [k] of side) {
  const [x, z] = parse(k);
  if (R.get(k) < 18) continue;
  put(x, 17, z, "bricks");
  put(x, 18, z, "smooth_quartz");
}

// 5. Warm light in the room behind some windows: glowstone on the upper floors, shroomlight at the shopfront.
// Each light sits on the slab under it, and only where the room is open (not on another facade cell).
side.forEach((s, k) => {
  const [x, z] = parse(k), u = uOf(x, z, s), si = SIDES.indexOf(s);
  for (let y = 1; y <= 15; y++) {
    const pane = at(x, y, z);
    if (!pane || pane.block !== "glass_pane" && pane.block !== "glass") continue;
    const kk = Math.floor(y / 4), r = y % 4;
    if (r !== 1) continue;
    const ix = x - s.dx, iz = z - s.dz;
    if (!inF(ix, iz) || side.has(key(ix, iz)) || doorKeys.has(key(ix, iz))) continue;
    if (kk === 0 && pane.block === "glass" && Math.floor(u / 4) % 2 === 0 && ((u % 4) + 4) % 4 === 1) {
      put(ix, y, iz, "shroomlight");
    } else if (kk > 0 && pane.block === "glass_pane" && (Math.floor(u / 4) + kk + si) % 3 === 0) {
      put(ix, y, iz, "glowstone");
    }
  }
});

// 6. Pane connections: a pane joins the wall it sits in, along the facade (solid neighbours and panes connect)
const solid = new Set(["glass_pane", "bricks", "smooth_quartz", "glass"]);
for (const [k, v] of P) {
  if (!v.pane) continue;
  const [x, y, z] = k.split(",").map(Number), s = v.pane;
  const nb = (dx, dz) => { const o = at(x + dx, y, z + dz); return o && solid.has(o.block); };
  const along = s.dx === 0 ? [1, 0] : [0, 1];                  // the facade's own axis
  const a = nb(along[0], along[1]), b = nb(-along[0], -along[1]);
  const st = s.dx === 0
    ? { north: "false", south: "false", east: String(a), west: String(b) }
    : { north: String(b), south: String(a), east: "false", west: "false" };
  v.state = { ...st, waterlogged: "false" };
}

// 7. Write the planned blocks into the volume
for (const [k, v] of P) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}

const info = g.save(OUT);
console.log(`entrance ${entName}, ${pair ? "double door" : "no door"}, facade cells ${side.size}`, info);

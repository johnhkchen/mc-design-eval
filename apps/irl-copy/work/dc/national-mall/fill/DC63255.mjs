// DC63255: 100 F St NE, Washington DC 20549, as a 1.21.1 module. Commercial-office-large of the 1960s-70s: a
// light-stone (limestone-look) office slab with a window ribbon of glass bays between stone piers, a polished-granite
// base, a stone cornice, and a central tower one block above the main slab. The lidar roof is smoothed (3x3 median
// over the footprint) and snapped to four flat tiers: pavilions to y 9, wings to 15, the main slab to 18, the tower to
// 19. Storeys are 3 blocks (a stone floor line, then two rows of glass). Every column is solid from y 0 up to its tier,
// so nothing floats; interiors are air behind the glass, with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC63255.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC63255.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Tiers: the top y (exclusive) of each cell's massing, from the smoothed lidar roof.
const median = (vals) => vals.sort((a, b) => a - b)[vals.length >> 1];
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  const s = median(vals);
  c.top = s <= 9 ? 9 : s <= 15 ? 15 : s <= 18 ? 18 : 19;
}

// Palette
const STONE = "smooth_quartz";                 // facade: floor lines and the wall between glass
const PIER = "quartz_pillar";                  // window piers
const BASE = "polished_andesite";              // foundation, plinth, base course, canopy, parapet
const GLASS = "light_blue_stained_glass_pane";
const DARK = "gray_stained_glass_pane";        // every fourth bay, so the ribbon is not one colour
const FLOOR = "smooth_stone";                  // interior floor slabs
const ROOF = "stone";                          // roof membrane
const LAMP = "glowstone";                      // warm light behind some glass
const AC = "iron_block";                       // roof plant
const DOOR = "dark_oak_door";

// Open to the air on a side: outside the footprint, or above the neighbour's roof (a setback wall).
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => { const n = F.get(key(x + dx, z + dz)); return !n || y >= n.top; });

// Entrances: the south (+z) front at x 22, the north (-z) side at x 12, each on the outermost cell of its column.
const edgeZ = (x, sign) => {
  let best = null;
  for (const c of F.values()) if (c.x === x && (best === null || (sign > 0 ? c.z > best : c.z < best))) best = c.z;
  return best;
};
const bays = [
  { x: 22, z: edgeZ(22, 1), dz: 1 },
  { x: 12, z: edgeZ(12, -1), dz: -1 },
];
for (const b of bays) if (b.z === null || !inF(b.x, b.z)) throw new Error(`no entrance cell at x ${b.x}`);

const g = new Voxels([29, 31, 74]);
const panes = [];

for (const c of F.values()) {
  for (let y = 0; y < c.top; y++) {
    if (y < c.g || y < 2) { g.set(c.x, y, c.z, BASE); continue; }   // foundation, and a granite plinth to the floor line
    const ex = exposed(c.x, y, c.z);
    if (y === c.top - 1) { g.set(c.x, y, c.z, ex.length ? BASE : ROOF); continue; }   // parapet or roof membrane
    const face = ex.find((d) => d[1] !== 0) ?? ex[0];                                 // z-faces win on corners
    const zFace = face && face[1] !== 0 ? face : null;
    const bay = zFace && bays.find((b) => b.dz === zFace[1] && Math.abs(c.x - b.x) <= 2);
    const along = face && face[1] !== 0 ? c.x : c.z;
    const rel = (y - 2) % 3;
    if (rel === 0) {                                                                  // floor line
      let blk = ex.length ? (y === 2 ? BASE : STONE) : FLOOR;
      if (bay && y === 5) blk = BASE;                                                 // canopy over the entrance bay
      g.set(c.x, y, c.z, blk); continue;
    }
    if (!ex.length) continue;                                                         // interior air behind the glass
    if (bay && y < 5) {                                                               // ground-floor entrance: doors and shopfront
      if (c.x === bay.x) g.set(c.x, y, c.z, DOOR, { facing: zFace[1] > 0 ? "south" : "north", half: y === 3 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else if (Math.abs(c.x - bay.x) === 2) g.set(c.x, y, c.z, PIER);
      else g.set(c.x, y, c.z, GLASS);
      continue;
    }
    if (along % 3 === 0) { g.set(c.x, y, c.z, PIER); continue; }                      // stone pier between bays
    const block = Math.floor(along / 3) % 4 === 2 ? DARK : GLASS;
    g.set(c.x, y, c.z, block);
    panes.push({ x: c.x, y, z: c.z, block, axis: face[1] !== 0 ? "x" : "z", out: face, along, rel });
  }
}

// Glass panes join the stone and glass beside them in the wall plane.
for (const p of panes) {
  const st = { north: "false", south: "false", east: "false", west: "false" };
  if (p.axis === "x") { if (g.get(p.x + 1, p.y, p.z)) st.east = "true"; if (g.get(p.x - 1, p.y, p.z)) st.west = "true"; }
  else { if (g.get(p.x, p.y, p.z + 1)) st.south = "true"; if (g.get(p.x, p.y, p.z - 1)) st.north = "true"; }
  g.set(p.x, p.y, p.z, p.block, st);
}

// Warm light: a glowstone on the floor just inside some windows (lit bays are spread over the storeys).
for (const p of panes) {
  if (p.rel !== 1 || (Math.floor(p.along / 3) + Math.floor(p.y / 3)) % 3 !== 0) continue;
  const ix = p.x - p.out[0], iz = p.z - p.out[1];
  if (inF(ix, iz) && !g.get(ix, p.y, iz)) g.set(ix, p.y, iz, LAMP);
}

// Entrance lanterns, hung from the canopy's floor slab just inside each door.
for (const b of bays) g.set(b.x, 4, b.z - b.dz, "lantern", { hanging: "true" });

// Roof plant: a few units on the main slab and on the tower, set in from the edges so they stand on the roof.
const interior = (c, top) => DIRS.concat([[1, 1], [1, -1], [-1, 1], [-1, -1]]).every(([dx, dz]) => F.get(key(c.x + dx, c.z + dz))?.top === top);
for (const c of F.values()) {
  if (c.top === 18 && interior(c, 18) && c.x % 6 === 2 && c.z % 9 === 4) g.set(c.x, 18, c.z, AC);
  if (c.top === 19 && interior(c, 19) && c.x % 6 === 3 && c.z % 8 === 3) g.set(c.x, 19, c.z, AC);
}

console.log(g.save(OUT));

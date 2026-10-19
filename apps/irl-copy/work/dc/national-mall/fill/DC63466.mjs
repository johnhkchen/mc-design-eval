// DC63466: 355 E St SW, Washington DC. Mid-century (c.1960s-70s) federal-style office block:
// granite plinth, precast piers and spandrels in a 3-bay rhythm, ribbon glazing, a flat roof
// with a penthouse core and mechanical boxes. Storeys are 2 blocks (about 4.8 m at 0.42 bpm),
// so the 17-block main roof is 8 storeys with a parapet and the 19-block core a penthouse.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC63466.cells.json`, "utf8"));

const X = 20, Y = 31, Z = 36;
// blocks that read as solid when a glass pane connects to them
const FULL = new Set(["white_concrete", "light_gray_concrete", "polished_granite", "smooth_stone", "stone", "gray_concrete", "glowstone", "shroomlight"]);

// Lidar roof -> four flat tiers (block tops): 2 = one-storey wing, 15 = step, 17 = main slab, 19 = penthouse core.
const tierOf = r => (r >= 19 ? 19 : r >= 17 ? 17 : r >= 15 ? 15 : 2);
const roof = new Map();                                    // "x,z" -> tier top
for (const [x, z, , r] of cells) roof.set(`${x},${z}`, tierOf(r));
const roofAt = (x, z) => roof.get(`${x},${z}`) ?? 0;       // 0 = outside the footprint

// Per cell: facade starts at the lowest neighbouring top that sits below this cell's roof.
// Outside neighbours give 0 (full height); a step down to a lower tier gives that tier's top.
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];           // north, south, west, east
const info = new Map();
for (const [key, r] of roof) {
  const [x, z] = key.split(",").map(Number);
  let F = Infinity;
  const faces = [];
  for (const [dx, dz] of DIRS) {
    const n = roofAt(x + dx, z + dz);
    if (n < r) { F = Math.min(F, n); faces.push({ dx, dz, outside: n === 0 }); }
  }
  info.set(key, { x, z, r, F, faces });
}

const vox = new Map();                                     // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => vox.set(`${x},${y},${z}`, { block, state });
const panes = [];                                          // glass panes, connected in a second pass

for (const c of info.values()) {
  const { x, z, r, F, faces } = c;
  const top = r - 1;
  // piers on the 3-bay rhythm, always at corners
  const axes = new Set(faces.map(f => (f.dz ? "z" : "x")));
  const pier = axes.size === 2 || faces.some(f => (f.dz ? x : z) % 3 === 0);
  const inPlane = faces.length && faces[0].dz ? "x" : "z";   // the wall runs along this axis
  for (let y = 0; y <= top; y++) {
    if (y === top) { put(x, y, z, F === Infinity ? "gray_concrete" : "smooth_stone"); continue; }
    if (y >= F) {
      if (y === 0) put(x, y, z, "polished_granite");
      else if (pier) put(x, y, z, "white_concrete");
      else if (y % 2 === 1) { put(x, y, z, "glass_pane"); panes.push({ x, y, z, inPlane }); }
      else put(x, y, z, "light_gray_concrete");
    } else if (y % 2 === 0 || y === F - 1) {
      put(x, y, z, "stone");                               // floor slab per storey, and the course a facade stands on
    }
  }
}

// Entrance: iron double door on the south face, canopy over it
const DOOR_Z = Z - 1;
for (const dx of [10, 11]) {
  const hinge = dx === 10 ? "left" : "right";
  put(dx, 1, DOOR_Z, "iron_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  put(dx, 2, DOOR_Z, "iron_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
}
for (let x = 9; x <= 12; x++) put(x, 3, DOOR_Z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

// Warm lights just inside some windows (on the interior air cell behind the glass)
for (const p of panes) {
  if (vox.get(`${p.x},${p.y},${p.z}`)?.block !== "glass_pane") continue;   // the door/canopy replaced it
  if ((p.x * 7 + p.z * 11 + p.y * 5) % 17 !== 0) continue;                   // about one window in seventeen, not clumps
  const c = info.get(`${p.x},${p.z}`);
  const out = c.faces.find(f => f.outside);
  if (!out) continue;
  const ix = p.x - out.dx, iz = p.z - out.dz;
  const ic = info.get(`${ix},${iz}`);
  if (!ic || ic.F <= p.y || ic.r - 1 <= p.y || vox.has(`${ix},${p.y},${iz}`)) continue;
  put(ix, p.y, iz, (p.x + p.z) % 2 ? "glowstone" : "shroomlight");
}

// Mechanical boxes on the main roof, 2x2 footprints inside the slab, two blocks tall
for (const x0 of [4, 9, 14]) for (const z0 of [12, 18, 24]) {
  const quad = [[0, 0], [1, 0], [0, 1], [1, 1]];
  const ok = quad.every(([a, b]) => { const c = info.get(`${x0 + a},${z0 + b}`); return c && c.r === 17 && c.F === Infinity; });
  if (!ok) continue;
  for (const [a, b] of quad) for (const y of [17, 18]) put(x0 + a, y, z0 + b, "light_gray_concrete");
}

// Pane connections: link along the wall to neighbouring panes or solid blocks
for (const p of panes) {
  const cur = vox.get(`${p.x},${p.y},${p.z}`);
  if (cur?.block !== "glass_pane") continue;
  const link = (dx, dz) => { const nb = vox.get(`${p.x + dx},${p.y},${p.z + dz}`); return !!nb && (nb.block === "glass_pane" || FULL.has(nb.block)); };
  const east = p.inPlane === "x" && link(1, 0), west = p.inPlane === "x" && link(-1, 0);
  const north = p.inPlane === "z" && link(0, -1), south = p.inPlane === "z" && link(0, 1);
  cur.state = { east: String(east), north: String(north), south: String(south), west: String(west), waterlogged: "false" };
}

// Nothing floats: every block must reach the ground through a chain of solid neighbours.
// Interior floor slabs rest on the perimeter walls, so they pass this; a slab with no wall or column does not.
const seen = new Set();
const stack = [...vox.keys()].filter(k => k.split(",")[1] === "0");
for (const k of stack) seen.add(k);
while (stack.length) {
  const [x, y, z] = stack.pop().split(",").map(Number);
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const k = `${x + dx},${y + dy},${z + dz}`;
    if (vox.has(k) && !seen.has(k)) { seen.add(k); stack.push(k); }
  }
}
const floating = [...vox.keys()].filter(k => !seen.has(k));
if (floating.length) throw new Error(`disconnected from the ground: ${floating.length} blocks, e.g. ${floating.slice(0, 8).join(" ")}`);

const g = new Voxels([X, Y, Z]);
for (const [k, { block, state }] of vox) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
g.save(`${DIR}/DC63466.nbt`);
console.log(`DC63466: ${vox.size} blocks, ${cells.length} footprint cells, saved DC63466.nbt`);

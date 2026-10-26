// 2122 Decatur Place NW: a 1920s brick walk-up apartment block on a stone plinth, with calcite string courses,
// a calcite cornice, glazed bays on every exposed face, a recessed entry on the low south face, a stair bulkhead and chimneys.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC60059.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const OUT = `${DIR}/DC60059.nbt`;

const cell = new Map();                       // "x,z" -> { g, r, top }
for (const [x, z, g, r] of cells) cell.set(`${x},${z}`, { g, r, top: r });
const inF = (x, z) => cell.has(`${x},${z}`);
const D = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };   // outward normals; z grows to the south

// Flat tiers: the roof of each cell is the median of its footprint neighbourhood (lidar noise out, setbacks kept)
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number); const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = cell.get(`${x + dx},${z + dz}`); if (n) v.push(n.r); }
  v.sort((a, b) => a - b); c.top = v[v.length >> 1];
}

const ext = (x, z) => Object.values(D).some(([dx, dz]) => !inF(x + dx, z + dz));
const face = (x, z) => ["s", "n", "e", "w"].find((d) => !inF(x + D[d][0], z + D[d][1])) ?? null;

const vox = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => vox.set(key(x, y, z), { block, state });
const glass = [];                             // window panes, for the reveal voids and the pane joins

// Entry on the low south face: a dark oak door (lower and upper), calcite lintel, stone pilasters
const door = { x: 15, z: 19 };
const special = new Set();
for (const y of [2, 3]) for (const x of [door.x - 1, door.x, door.x + 1]) special.add(key(x, y, door.z));
for (const x of [door.x - 1, door.x, door.x + 1]) special.add(key(x, 4, door.z));

for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  const T = c.top - 1;                        // the top block row: parapet on the wall, roof membrane inside
  const f = face(x, z);
  for (let y = 0; y <= T; y++) {
    if (y < c.g) { put(x, y, z, "stone_bricks"); continue; }      // foundation up to the cell's ground
    if (y < 2) { put(x, y, z, "stone_bricks"); continue; }        // plinth course
    if (y === T) { put(x, y, z, f ? "bricks" : "stone"); continue }   // parapet / roof membrane
    if (f && y === T - 1) { put(x, y, z, "calcite"); continue }   // cornice
    if (!f) { put(x, y, z, "bricks"); continue }                  // interior: solid, floor slabs and all
    if (y % 2 === 1) { put(x, y, z, "calcite"); continue }        // string course between window rows
    // window row: panes in two bays of three, piers of brick between
    const t = f === "n" || f === "s" ? x : z;
    if (t % 3 !== 0 && !special.has(key(x, y, z))) { put(x, y, z, "glass_pane"); glass.push({ x, y, z, f }); }
    else put(x, y, z, "bricks");
  }
}

// Entry
for (const y of [2, 3]) {
  put(door.x, y, door.z, "dark_oak_door", { facing: "north", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
  put(door.x - 1, y, door.z, "stone_bricks"); put(door.x + 1, y, door.z, "stone_bricks");
}
for (const x of [door.x - 1, door.x, door.x + 1]) put(x, 4, door.z, "calcite");
// the entry lobby: two-high air behind the door, a lantern on the floor
vox.delete(key(door.x, 3, door.z - 1));
put(door.x, 2, door.z - 1, "lantern", { hanging: "false", waterlogged: "false" });

// Reveal voids behind the glazing (air gap), with a few lamps in them
for (const { x, y, z, f } of glass) {
  const [dx, dz] = D[f]; const ix = x - dx, iz = z - dz;
  if (!inF(ix, iz) || ext(ix, iz)) continue;
  vox.delete(key(ix, y, iz));
  const h = (x * 31 + z * 17 + y * 7) % 6;
  if (h === 0) put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  else if (h === 3) put(ix, y, iz, "glowstone");
}

// Glass pane joins: a pane connects to its neighbours in the wall plane
for (const { x, y, z } of glass) {
  const on = (xx, zz) => vox.has(key(xx, y, zz));
  put(x, y, z, "glass_pane", {
    north: String(on(x, z - 1)), south: String(on(x, z + 1)), east: String(on(x + 1, z)), west: String(on(x - 1, z)), waterlogged: "false",
  });
}

// Stair bulkhead on the roof and two chimneys
const slab = { type: "bottom", waterlogged: "false" };
for (const [x, z] of [[4, 11], [5, 11], [4, 12], [5, 12]]) {
  const T = cell.get(`${x},${z}`).top - 1;
  put(x, T + 1, z, "bricks"); put(x, T + 2, z, "bricks"); put(x, T + 3, z, "stone_brick_slab", slab);
}
for (const [x, z] of [[9, 11], [12, 13]]) {
  const T = cell.get(`${x},${z}`).top - 1;
  put(x, T + 1, z, "bricks"); put(x, T + 2, z, "bricks"); put(x, T + 3, z, "stone_brick_slab", slab);
}

const g = new Voxels([21, 22, 21]);
for (const [k, { block, state }] of vox) {
  if (block === "air") continue;
  const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, block, state);
}
const res = g.save(OUT);
console.log(`DC60059: ${res.blocks} blocks, ${res.palette} palette entries, ${glass.length} panes -> ${OUT}`);

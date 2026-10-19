// DC82292: vacant early-1900s brick-and-stone warehouse-office at 800 New Jersey Ave SE, as a 1.21.1 module.
// The lidar reads a low brick block (1 storey, 2-3 blocks above its ground) round the east and north edges, a two-storey
// pavilion mid-north, and one tall brick-and-stone tower at the south-east (roof ~35 blocks above y 0). Storeys are
// 4 blocks: a stone string course, two rows of glass in brick bays, a brick header. Walls are one block thick with an air
// gap behind the glass and a floor slab per storey; the ground storey's windows are boarded (vacant).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC82292.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const OUT = `${DIR}/DC82292.nbt`;

const key = (x, z) => `${x},${z}`;
const K = (x, y, z) => `${x},${y},${z}`;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, h: r - g }]));
const inF = (x, z) => F.has(key(x, z));

// Massing: lidar height above each cell's ground, median-smoothed over the 3x3 (tall cells keep their own top),
// snapped to 4-block storeys: 1 storey from 2 blocks up, 2 from 6, 8 to 9 at the tower top.
const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
for (const c of F.values()) {
  if (c.h >= 6) { c.hs = c.h; continue; }
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = F.get(key(c.x + dx, c.z + dz)); if (n) v.push(n.h); }
  c.hs = med(v);
}
for (const c of F.values()) c.n = c.hs < 2 ? 0 : Math.max(1, Math.round(c.hs / 4));
// Lidar noise leaves lone one-cell stubs: a built cell with no built neighbour goes back to open ground.
for (const c of F.values()) {
  if (c.n && !DIRS.some(([dx, dz]) => F.get(key(c.x + dx, c.z + dz))?.hs >= 2)) c.n = 0;
}

// Highest solid level of a column (the parapet level for a building, the paving for open ground).
const top = (c) => (c.n ? c.g + 4 * c.n : c.g - 1);
// Faces of (x, y, z) that look onto air: off the footprint, or over a neighbour that stops below y.
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => { const N = F.get(key(x + dx, z + dz)); return !N || y > top(N); });

const kind = new Map(), doorCands = [];
for (const c of F.values()) {
  const { x, z, g, n } = c;
  if (!n) { for (let y = 0; y < g; y++) kind.set(K(x, y, z), y === g - 1 ? "pave" : "stone"); continue; }   // open ground
  const T = g + 4 * n;
  for (let y = 0; y < g; y++) kind.set(K(x, y, z), "stone");                                              // foundation
  for (let y = g; y <= T; y++) {
    const rel = y - g, s = rel % 4, k = Math.floor(rel / 4), ex = exposed(x, y, z);
    if (y === T) { if (ex.length) kind.set(K(x, y, z), "cornice"); continue; }                             // parapet, shell only
    if (!ex.length) { if (s === 0 || y === T - 1) kind.set(K(x, y, z), "pave"); continue; }              // floor slab, roof slab
    if (s === 0) kind.set(K(x, y, z), k === 0 ? "stone" : "quartz");                                       // base, string courses
    else if (s === 3) kind.set(K(x, y, z), k === n - 1 ? "quartz" : "brick");                              // header, lintel
    else {
      const bay = ex.length === 1 && (ex[0][0] ? z : x) % 3 !== 0;                                        // piers every third block
      kind.set(K(x, y, z), !bay ? "brick" : k === 0 ? "board" : "glass");
      if (bay && k === 0 && s === 1 && ex[0][1] === -1) doorCands.push({ x, z, g });
    }
  }
}

// Entrance: a ground-floor bay on the north face nearest x 43, with a stone hood over it.
const door = doorCands.sort((a, b) => Math.abs(a.x - 43) - Math.abs(b.x - 43))[0];
if (door) {
  kind.set(K(door.x, door.g + 1, door.z), "door");
  kind.set(K(door.x, door.g + 2, door.z), "door2");
  kind.set(K(door.x, door.g + 3, door.z), "quartz");
}

// Warm light behind some upper-storey glass: the air cell inside the window.
for (const c of F.values()) {
  if (!c.n) continue;
  for (let y = c.g; y < c.g + 4 * c.n; y++) {
    if (kind.get(K(c.x, y, c.z)) !== "glass" || (c.x + c.z + y) % 7 !== 0) continue;
    const [dx, dz] = exposed(c.x, y, c.z)[0];
    const ix = c.x - dx, iz = c.z - dz;
    if (inF(ix, iz) && !kind.has(K(ix, y, iz))) kind.set(K(ix, y, iz), "light");
  }
}

// Roof equipment on the open roofs of the taller blocks, and a lightning rod on the tower top.
let units = 0, rod = null;
for (const c of F.values()) {
  if (c.n < 2) continue;
  const T = c.g + 4 * c.n;
  if (exposed(c.x, T - 1, c.z).length || exposed(c.x, T, c.z).length) continue;   // interior roof only
  if (units < 2 && (c.x * 5 + c.z * 3) % 11 === 0) { kind.set(K(c.x, T, c.z), "iron"); units++; }
  if (!rod || c.n > rod.n || (c.n === rod.n && c.x > rod.x)) rod = { x: c.x, z: c.z, n: c.n, T };
}
if (rod) kind.set(K(rod.x, rod.T, rod.z), "rod");

// Glass panes connect along their wall plane to whatever is solid beside them.
const solid = (x, y, z) => { const v = kind.get(K(x, y, z)); return v !== undefined && v !== "light"; };
const pane = (x, y, z) => {
  const s = { north: "false", south: "false", east: "false", west: "false" };
  const [, dz] = exposed(x, y, z)[0];
  if (dz) { s.east = String(solid(x + 1, y, z)); s.west = String(solid(x - 1, y, z)); }
  else { s.north = String(solid(x, y, z - 1)); s.south = String(solid(x, y, z + 1)); }
  return s;
};

const BLOCK = { stone: "stone_bricks", pave: "smooth_stone", quartz: "smooth_quartz", cornice: "smooth_quartz", brick: "bricks",
  board: "spruce_planks", iron: "iron_block", light: "glowstone" };
const maxT = Math.max(...[...F.values()].map((c) => (c.n ? c.g + 4 * c.n : 0)));
const g3 = new Voxels([48, maxT + 2, 23]);
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
for (const [id, v] of kind) {
  const [x, y, z] = id.split(",").map(Number);
  if (v === "glass") g3.set(x, y, z, "glass_pane", pane(x, y, z));
  else if (v === "door") g3.set(x, y, z, "dark_oak_door", doorState("lower"));
  else if (v === "door2") g3.set(x, y, z, "dark_oak_door", doorState("upper"));
  else if (v === "rod") g3.set(x, y, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  else g3.set(x, y, z, BLOCK[v]);
}

const out = g3.save(OUT);
console.log(`DC82292: ${out.blocks} blocks, palette ${out.palette}, size ${g3.size.join("x")}, top ${maxT}`);

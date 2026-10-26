// FR241937484: a residential Haussmann-style block, 1890, seven storeys in cream limestone under slate
// mansards. Built only on the footprint cells: a stone plinth, then storey lines every 4 blocks, windows on
// the odd bays, a solid roof on every tier, and interior columns so every floor stands on something.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241937484.cells.json", "utf8"));
const g = new Voxels([17, 48, 22]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, , roof] of cells) raw.set(key(x, z), roof);

// lidar noise -> flat tiers: the 3x3 median of the roof heights, then one of four cap rows
const median = (v) => { v.sort((a, b) => a - b); return v[v.length >> 1]; };
const tierOf = (r) => (r <= 8 ? 5 : r <= 23 ? 21 : r <= 29 ? 25 : 31);
const cap = new Map();
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number);
  const nb = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const v = raw.get(key(x + dx, z + dz)); if (v !== undefined) nb.push(v); }
  cap.set(k, tierOf(median(nb)));
}
const top = (x, z) => cap.get(key(x, z)); // undefined outside the footprint

const FLOOR = [5, 9, 13, 17, 21, 25, 29];   // storey lines: string course outside, floor slab inside
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const FACING = { N: "north", S: "south", W: "west", E: "east" };
const COLUMNS = (x, z) => [4, 8, 12].includes(x) && [4, 8, 12, 16].includes(z);

// the sides of this cell at height y that face open air (no footprint neighbour standing that high)
const faces = (x, z, y) => DIRS.filter(([, dx, dz]) => { const n = top(x + dx, z + dz); return n === undefined || n < y; }).map(([d]) => d);
const floorBelow = (y) => FLOOR.filter((f) => f < y).pop() ?? 0;
const inWindowBand = (y) => { const L = floorBelow(y), rel = y - L; return L === 0 ? rel === 2 || rel === 3 : rel === 1 || rel === 2; };
const pane = (d) => (d === "N" || d === "S" ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" } : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

for (const [k, R] of cap) {
  const [x, z] = k.split(",").map(Number);
  g.set(x, 0, z, "stone_bricks");                                   // plinth
  for (let y = 1; y <= R; y++) {
    const fs = faces(x, z, y);
    if (y === R) {                                                   // the cap: slate, with stair eaves on the outside edge
      const below = g.get(x, y - 1, z);
      const eave = fs.length && below && !/glass_pane|door/.test(below.block);
      if (eave) g.set(x, y, z, "deepslate_tile_stairs", { facing: FACING[fs[0]], half: "bottom", shape: "straight", waterlogged: "false" });
      else g.set(x, y, z, R === 5 ? "smooth_stone" : "deepslate_tiles");
      continue;
    }
    if (fs.length >= 2) { g.set(x, y, z, "smooth_quartz"); continue; }         // quoins at the corners
    if (fs.length === 1) {
      if (FLOOR.includes(y)) { g.set(x, y, z, "smooth_stone"); continue; }     // string course
      if (y <= 1) { g.set(x, y, z, "stone_bricks"); continue; }                // base course
      const along = fs[0] === "N" || fs[0] === "S" ? x : z;
      if (inWindowBand(y) && along % 2 === 1) { g.set(x, y, z, "glass_pane", pane(fs[0])); continue; }
      g.set(x, y, z, "calcite"); continue;
    }
    if (FLOOR.includes(y)) { g.set(x, y, z, "smooth_stone"); continue; }     // interior floor slab
    if (COLUMNS(x, z)) g.set(x, y, z, "stone_bricks");                       // interior columns hold the floors
  }
}

// the entrance on the north front: a dark oak double door, plus a warm lantern just inside
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
g.set(10, 1, 0, "dark_oak_door", door("lower"));
g.set(10, 2, 0, "dark_oak_door", door("upper"));
const lantern = { hanging: "false", waterlogged: "false" };
g.set(10, 1, 1, "lantern", lantern);

// warm lights behind the glass: ground floor bays, and the first interior ring on the upper storeys
for (const x of [3, 7, 11, 15]) {
  if (g.get(x, 1, 1) === null && g.get(x, 0, 1)) g.set(x, 1, 1, "lantern", lantern);
  for (const L of FLOOR) {
    const pane = g.get(x, L + 1, 0);
    if (pane && pane.block.endsWith("glass_pane") && g.get(x, L, 1) && g.get(x, L + 1, 1) === null) g.set(x, L + 1, 1, "lantern", lantern);
  }
}

// roof equipment: brick chimney stacks on the top tier
for (const [x, z] of [[4, 6], [12, 6], [8, 14], [4, 18], [12, 18]]) {
  if (top(x, z) !== 31) continue;
  g.set(x, 32, z, "bricks"); g.set(x, 33, z, "bricks");
  g.set(x, 34, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

console.log(g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241937484.nbt"));

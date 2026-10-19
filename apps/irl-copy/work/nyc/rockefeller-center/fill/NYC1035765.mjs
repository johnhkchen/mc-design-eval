// 57 East 54th Street (1900, mixed residential and commercial): a five-storey brick loft block on a stone plinth,
// a shopfront at street level on the front (z = 15) face, a stepped rear (low z), and a roof bulkhead.
// The shell is solid walls with an air gap behind the glass and a slab per storey; the lidar roof is snapped to three tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035765.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 6, D = 16, H = 31;
const FRONT = D - 1;                       // the street face (z = 15)
const FLOOR = 2;                           // ground-floor level: the highest ground under the footprint
const STRINGS = [5, 8, 11, 14, 17];        // storey lines
const WINDOW_ROWS = [[6, 7], [9, 10], [12, 13], [15, 16]];
const SIDE_PANELS = [[3, 4], [8, 9], [12, 13]];   // glass bays on the side walls
const SIDE_FRAMES = [2, 5, 7, 10, 11, 14];

// Lidar roof height snapped to three flat tiers: main roof, rear step, low rear wing.
const tier = (r) => (r >= 17 ? 19 : r >= 13 ? 16 : 9);
const roofAt = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, tier(r)]));
const roof = (x, z) => roofAt.get(`${x},${z}`);

const inWindowRow = (y) => WINDOW_ROWS.some(([a, b]) => y >= a && y <= b);
const pane = (axis) => ["glass_pane", axis === "ew"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" }];
const door = (y) => ["dark_oak_door", { facing: "north", half: y === 3 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];

// What a perimeter wall cell is at height y (above the base course, below its cornice).
function facade(x, y, z) {
  if (z === FRONT && y <= 4) {                       // shopfront
    if (x === 0 || x === W - 1) return ["polished_granite"];
    if (x === 2) return door(y);                     // entrance
    if (x === 4) return ["dark_oak_planks"];
    return ["glass"];                                // display windows
  }
  if (STRINGS.includes(y)) {
    if (z === FRONT && y === 5 && x >= 1 && x <= 4) return ["dark_oak_slab", { type: "top", waterlogged: "false" }];   // shop awning band
    return ["smooth_sandstone"];
  }
  if (y <= 4 || !inWindowRow(y)) return ["bricks"];
  if (z === FRONT) {                                 // street face: piers, frames, two glass panes
    if (x === 0 || x === W - 1) return ["bricks"];
    if (x === 1 || x === W - 2) return ["smooth_sandstone"];
    return pane("ew");
  }
  if (x === 0 || x === W - 1) {                      // side walls
    if (SIDE_PANELS.some(([a, b]) => z >= a && z <= b)) return pane("ns");
    if (SIDE_FRAMES.includes(z)) return ["smooth_sandstone"];
    return ["bricks"];
  }
  if (z === 0) {                                     // rear
    if (x === 2 || x === 3) return pane("ew");
    if (x === 1 || x === W - 2) return ["smooth_sandstone"];
  }
  return ["bricks"];
}

const g = new Voxels([W, H, D]);

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const r = roof(x, z);
  const perimeter = x === 0 || x === W - 1 || z === 0 || z === FRONT;

  // Foundation and base course on every cell: nothing floats on the slope, and the downhill cells show the plinth.
  g.set(x, 0, z, "stone_bricks");
  g.set(x, 1, z, "stone_bricks");
  g.set(x, FLOOR, z, "polished_andesite");

  if (!perimeter) {
    // Interior: floor slab per storey and the roof cap; air between, behind the glass.
    for (const y of STRINGS) if (y < r - 1) g.set(x, y, z, "stone");
    g.set(x, r - 1, z, "smooth_stone");
    continue;
  }

  for (let y = FLOOR + 1; y < r - 1; y++) g.set(x, y, z, ...facade(x, y, z));
  g.set(x, r - 1, z, "smooth_sandstone");                                                  // cornice band
  g.set(x, r, z, "smooth_sandstone_slab", { type: "bottom", waterlogged: "false" });        // coping
}

// Warm light behind some street-face windows (glowstone sits on the floor slab below each window).
for (const [x, y] of [[2, 6], [3, 9], [2, 12], [3, 15]]) g.set(x, y, FRONT - 1, "glowstone");
// A lantern inside the shop, on the ground-floor slab.
g.set(1, 3, FRONT - 1, "lantern", { hanging: "false", waterlogged: "false" });

// Roof bulkhead (stair and lift house) on the main roof cap, set back from the street.
for (const x of [2, 3]) for (const z of [3, 4]) {
  g.set(x, 19, z, "bricks");
  g.set(x, 20, z, "bricks");
  g.set(x, 21, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

const stats = g.save(`${DIR}/NYC1035765.nbt`);
console.log(JSON.stringify(stats));

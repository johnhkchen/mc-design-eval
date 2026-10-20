// Room 19, Aperture apartments north (interior designer): a flat on floor 1 with balcony doors on the north bays.
// Interior air box [203, 8, 3, 246, 11, 24]; the south wall (z 25) holds the way in from the corridor.
// Furniture is drawn as text (one character per block, rows along +x, successive rows along +z), placed with layers().
// Zones: kitchen along the west wall, a dining table with a hanging lantern in the middle, a bedroom on the east wall.
// The middle of the room (x 218..229) and the south lane stay clear for the walk.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const X0 = 203, X1 = 246, Z0 = 3, Z1 = 24, Y0 = 8;
const W = X1 - X0 + 1, D = Z1 - Z0 + 1;

// Legend: one character per block, drawn on the layers below (y 8, 9, 10, 11).
const LEGEND = {
  F: "oak_fence",                                              // table leg / post
  T: ["oak_slab", { type: "top" }],                           // table and counter tops
  K: "polished_andesite",                                      // counter base
  s: ["quartz_stairs", { facing: "south" }],                   // chair with back to the south
  n: ["quartz_stairs", { facing: "north" }],                   // chair with back to the north
  e: ["quartz_stairs", { facing: "east" }],                    // chair with back to the east
  w: ["quartz_stairs", { facing: "west" }],                    // chair with back to the west
  b: "birch_planks",                                           // kitchen storage, bedside chest (a barrel's solid cube)
  m: "polished_andesite",                                      // kitchen smoker on the west counter (a counter cube)
  r: ["smooth_stone_slab", { type: "bottom" }],                // rug under the dining set (a floor-level slab)
  c: ["lantern", { hanging: "false" }],                        // table candles (a standing lantern)
  p: ["azalea_leaves", { persistent: "true" }],                // pot on the counter (a potted plant)
  l: ["lantern", { hanging: "false" }],                        // standing lantern on a barrel
  L: ["lantern", { hanging: "true" }],                         // hanging lantern under the ceiling
};

// Grid helper: a full set of rows for one layer, blank by default.
const blank = () => Array.from({ length: D }, () => Array(W).fill(" "));
const layerSet = { 8: blank(), 9: blank(), 10: blank(), 11: blank() };
const put = (x, y, z, ch) => { layerSet[y][z - Z0][x - X0] = ch; };

// Kitchen: counter along the west wall (x 203), smoker and barrels at the north end.
for (let z = 4; z <= 7; z++) { put(203, 8, z, "K"); put(203, 9, z, "T"); }
put(203, 10, 5, "p"); put(203, 10, 7, "c");
put(203, 8, 3, "m");                                            // smoker at the corner
put(203, 8, 9, "b"); put(203, 8, 10, "b");                       // barrels for stores
put(203, 9, 10, "T");                                            // lid-level top for the barrels? (kept as a shelf top)
put(203, 10, 10, "p");

// Dining set in the living zone: a table (fence and top slab) with four chairs and a rug.
const tx = 214, tz = 12;
put(tx, 8, tz, "F"); put(tx, 9, tz, "T"); put(tx, 10, tz, "c");
put(tx - 1, 8, tz, "w"); put(tx + 1, 8, tz, "e");
put(tx, 8, tz - 1, "n"); put(tx, 8, tz + 1, "s");
for (let z = tz - 2; z <= tz + 2; z++) for (let x = tx - 2; x <= tx + 2; x++) {
  if (layerSet[8][z - Z0][x - X0] === " ") put(x, 8, z, "r");
}

// Bedroom on the east wall: nightstand barrel with a standing lantern; a chest of barrels at the far end.
put(246, 8, 11, "b"); put(246, 9, 11, "l");
put(246, 8, 15, "b"); put(246, 8, 16, "b"); put(246, 9, 16, "p");

// Hanging lanterns under the ceiling (y 12), on a grid so the whole floor is lit. The two at z 6 (x 206, 236) are
// already lanterns from an earlier part (the shell's corner lights), so they are not placed again: the grid would refuse them.
const LIT_ALREADY = new Set(["206,6", "236,6"]);
for (const x of [206, 216, 226, 236, 244]) for (const z of [6, 14, 22]) {
  if (LIT_ALREADY.has(`${x},${z}`)) continue;
  if (layerSet[11][z - Z0][x - X0] === " ") put(x, 11, z, "L");
}

export function build(g) {
  // Furniture first: any cell that holds a stair or wall is refused by the grid, never overwritten.
  layers(g, [X0, Y0, Z0], LEGEND, [layerSet[8], layerSet[9], layerSet[10], layerSet[11]]);
  // Bed: both halves as a low quartz slab (no bed block in the palette), the head against the east wall (x 246), in the bedroom zone.
  g.set(245, Y0, 12, ...B.slab("smooth_quartz", "bottom"));
  g.set(246, Y0, 12, ...B.slab("smooth_quartz", "bottom"));
}

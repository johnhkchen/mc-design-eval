// Interior designer for "Glasshouse hall" (room 22): the vault's walk under the hanging CHIHULY cloud.
// Inner air box [233,1,5]..[238,6,42]. Benches (smooth_quartz stairs) on both walls, two fence-and-slab tables, a
// sea-lantern-topped pedestal under the flower's centre as the focal piece, lamp posts down both edges for the light.
// Lanes stay clear: x234..237 from the north doorway (z4, x236..237) to the south one (z43, x234..235).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// the room's inner air: x 233..238 (6 cells, c0..c5), z 5..42 (38 rows); one string per z, '.' = nothing
const ORIGIN = [233, 1, 5];
const ROWS = 38;
const rows = (spec) => Array.from({ length: ROWS }, (_, r) => spec[5 + r] ?? "......");

const LEGEND = {
  w: ["smooth_quartz_stairs", { facing: "west", half: "bottom" }], // west bench, back to the wall
  e: ["smooth_quartz_stairs", { facing: "east", half: "bottom" }], // east bench, back to the wall
  f: "oak_fence", // lamp post and table leg
  t: ["smooth_quartz_slab", { type: "top" }], // table top on the fence
  p: "smooth_quartz", // pedestal
  S: "sea_lantern", // pedestal top, the focal light
  l: ["lantern", { hanging: "false" }], // standing lantern
  R: "red_stained_glass",
  O: "orange_stained_glass",
  Y: "yellow_stained_glass",
};

// y1: floor-level furniture
const Y1 = rows({
  5: "l.....", 6: "f.....", 7: "......", 8: ".....e", 9: "w.....", 10: "w.....", 11: ".f....",
  12: ".....f", 13: "w.....", 14: "w.....", 15: "w....e", 16: ".....e", 17: ".....e",
  18: "f.....", 20: "..pp..", 21: "..pp..", 22: "w.pp..", 23: "w.pp..", 24: "w....f",
  27: ".....e", 28: ".....e", 29: ".....e", 30: "f.....", 31: "....f.", 34: "w.....",
  35: "w.....", 36: "w....f", 38: ".....e", 39: "f....e", 40: ".l....",
});

// y2: table tops, the pedestal's sea lanterns, the lamp posts' middle
const Y2 = rows({
  6: "f.....", 11: ".t....", 12: ".....f", 18: "f.....", 20: "..SS..", 21: "..SS..",
  22: "..SS..", 23: "..SS..", 24: ".....f", 30: "f.....", 31: "....t.", 36: ".....f",
  39: "f.....",
});

// y3: the pedestal's glass column, table lanterns, the lamp posts' tops
const Y3 = rows({
  6: "f.....", 11: ".l....", 12: ".....f", 18: "f.....", 20: "...Y..", 21: "..R...",
  22: "...O..", 23: "..Y...", 24: ".....f", 30: "f.....", 31: "....l.", 36: ".....f",
  39: "f.....",
});

// y4: lamp lanterns on the posts, one orange cluster head over the pedestal
const Y4 = rows({
  6: "l.....", 12: ".....l", 18: "l.....", 21: "..O...", 24: ".....l", 30: "l.....",
  36: ".....l", 39: "l.....",
});

export function build(g) {
  layers(g, ORIGIN, LEGEND, [Y1, Y2, Y3, Y4]);
}

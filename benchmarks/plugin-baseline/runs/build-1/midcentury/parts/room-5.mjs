// ROOM atrium (interior designer): open-sky courtyard in the glass ring. Air box [17,1,12,21,4,17]; floor is the
// dirt at y=0 (shell, locked), so planting and paving sit at y=1. Doors x=19..20 at z=11 and z=18 stay clear.
// Layout: planting on the west (x=17..18) with a jungle sapling as the focal piece, a 2-wide stepping path down the
// middle (x=19..20), a birch bench on the east (x=21, stairs facing west), and a small side table at the south-west.
// One standing lantern under the tree is the brightest light in the room.
import { B, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// one character per block; rows along +x (x=17..21), successive rows along +z (z=12..17)
const LEGEND = {
  p: B.slab("smooth_stone", "bottom"),          // stepping path
  g: ["short_grass"],                           // grass tufts on the dirt
  f: ["large_fern", { half: "lower" }],         // two-high fern, lower half
  F: ["large_fern", { half: "upper" }],         // two-high fern, upper half
  c: ["potted_cactus"],
  l: B.lantern(false),                          // standing lantern: the light
  j: B.log("jungle", "y"),                      // sapling trunk
  J: ["jungle_leaves", { persistent: "true" }], // crown
  b: B.stairs("birch", "west", "bottom"),       // bench seats, backs to the east glass
  t: B.fence("spruce"),                         // side table leg
  S: B.slab("spruce", "bottom"),                // side table top
};

// y=1 floor: planting, path, bench, table leg
const Y1 = [
  "fgppg", // z=12
  "cgppb", // z=13
  "ljppb", // z=14
  "fgppb", // z=15
  "gcppc", // z=16
  "ltppc", // z=17
];
// y=2: fern tops, trunk, table top
const Y2 = [
  "F....", // z=12
  ".....", // z=13
  ".j...", // z=14
  "F....", // z=15
  ".....", // z=16
  ".S...", // z=17
];
// y=3: crown
const Y3 = [
  ".....", // z=12
  "JJJ..", // z=13
  "JJJ..", // z=14
  "JJJ..", // z=15
  ".....", // z=16
  ".....", // z=17
];
// y=4: crown top
const Y4 = [
  ".....", // z=12
  ".J...", // z=13
  "JJJ..", // z=14
  ".J...", // z=15
  ".....", // z=16
  ".....", // z=17
];

export function build(g) {
  layers(g, [17, 1, 12], LEGEND, [Y1, Y2, Y3, Y4]);
}

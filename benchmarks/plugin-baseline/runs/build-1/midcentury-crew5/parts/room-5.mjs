// ROOM atrium (interior designer): open-sky courtyard in the glass ring, inner air box [17,1,12,21,4,17].
// The floor is y=0 dirt (shell, locked), so the room's standing cells are y=1. Layout (x 17..21 across, z 12..17 down):
//   - the stepping path: smooth_stone slabs on x=19..20, the two columns between the doors (z=11 and z=18), kept clear;
//   - a jungle sapling tree at (18,14) is the focal piece, lit from three garden lamps on fence posts (no roof here);
//   - a bench of three spruce stair seats on x=21 facing west to the tree (their backs on the glass ring);
//   - grass tufts, a large fern, and potted cacti in the corners.
// Nothing sits over a doorway; the 2-high walk line x=19..20 is clear from z=12 to z=17.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  P: ["smooth_stone_slab", { type: "bottom" }], // stepping path
  g: "short_grass", // grass tufts on the dirt
  f: ["large_fern", { half: "lower" }],
  u: ["large_fern", { half: "upper" }],
  L: "dark_oak_fence", // garden lamp post
  l: ["lantern", { hanging: "false" }], // standing lantern
  J: ["jungle_log", { axis: "y" }], // sapling trunk
  j: ["jungle_leaves", { persistent: "true" }], // crown
  B: ["spruce_stairs", { facing: "east", half: "bottom" }], // bench seat, back to the glass
  c: "potted_cactus",
};

// y=1 floor layer, rows z=12..17, columns x=17..21
const FLOOR = [
  "LgPPL", // z=12: lamp NW, lamp NE on the floor
  "ggPPg", // z=13
  "gJPPB", // z=14: trunk at x=18, bench seat at x=21
  "fgPPB", // z=15: large fern lower half at x=17
  "ggPPB", // z=16
  "LgPPc", // z=17: lamp SW, potted cactus SE
];
// y=2: lamp posts, fern upper half, trunk
const BODY = [
  "L...L",
  ".....",
  ".J...",
  "u....",
  ".....",
  "L....",
];
// y=3: lanterns and the crown's lower ring
const LAMPS = [
  "l...l",
  "jjj..",
  "jJj..",
  "jjj..",
  ".....",
  "l....",
];
// y=4: crown top
const CROWN = [
  ".....",
  ".j...",
  "jjj..",
  ".j...",
  ".....",
  ".....",
];

export function build(g) {
  layers(g, [17, 1, 12], LEGEND, [FLOOR, BODY, LAMPS, CROWN]);
}

// Room: Stair hall (interior designer's part). Inner air x3..7, y5..11, z13..21; floor y5 (the plan's floor grid origin
// [2,5,12], rows z, columns x 2..8). Stair 1 is the joiner's: treads x3..4 z13..19, landing y12 z20..21, and its
// stair cells are never written here. Lane x6 stays clear from the north archway (z13) to the south one (z21).
// Focal piece: the console table at the foot of the stair, with a standing lantern on it. Hat pegs on the east wall,
// a stair seat on the west side of the lane, a stock barrel by the south arch, hanging lanterns down the centre line
// and one under the landing.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [2, 5, 12];

// one layer per height; rows run along +x (x2..x8, seven cells, the walls are not drawn), successive rows along +z
// (z12..z22). Characters not in the legend are left as they are.
const LEGEND_Y5 = {
  S: ["dark_oak_stairs", { facing: "west", half: "bottom" }], // seat facing the table
  F: "dark_oak_fence", // table post
  B: ["barrel", { facing: "up" }], // stock by the south arch
  L: ["lantern", { hanging: "false" }], // under the stair flight, on the floor: the dim corner
};
const LAYER_Y5 = [
  "       ", // z12
  "       ", // z13 the first cell inside the north arch stays clear
  "       ", // z14
  "       ", // z15
  " L     ", // z16 lantern under the stair flight (x3)
  "     F ", // z17 table post at x7
  "   S   ", // z18 seat at x5
  "       ", // z19
  "     B ", // z20 barrel at x7
  "       ", // z21 the first cell inside the south arch stays clear
  "       ", // z22
];

const LEGEND_Y6 = {
  P: "dark_oak_fence", // hat pegs on the east wall
  T: ["dark_oak_slab", { type: "bottom" }], // table top
};
const LAYER_Y6 = [
  "       ",
  "       ",
  "     P ", // z14
  "     P ", // z15
  "     P ", // z16
  "     T ", // z17
  "       ",
  "       ",
  "       ",
  "       ",
  "       ",
];

const LEGEND_Y7 = {
  L: ["lantern", { hanging: "false" }], // standing lantern on the table: the focal light
};
const LAYER_Y7 = [
  "       ",
  "       ",
  "       ",
  "       ",
  "       ",
  "     L ", // z17
  "       ",
  "       ",
  "       ",
  "       ",
  "       ",
];

const LEGEND_Y11 = {
  H: ["lantern", { hanging: "true" }], // hanging down the centre line; the floor above is solid
};
const LAYER_Y11 = [
  "       ",
  "       ",
  "       ",
  "       ",
  "    H  ", // z15 over the lane (x6)
  "       ",
  "       ",
  "       ",
  "    H  ", // z19 over the lane (x6)
  " H     ", // z20 under the landing (x3, the landing block is y12)
  "       ",
];

export function build(g) {
  layers(g, [ORIGIN[0], 5, ORIGIN[2]], LEGEND_Y5, [LAYER_Y5]);
  layers(g, [ORIGIN[0], 6, ORIGIN[2]], LEGEND_Y6, [LAYER_Y6]);
  layers(g, [ORIGIN[0], 7, ORIGIN[2]], LEGEND_Y7, [LAYER_Y7]);
  layers(g, [ORIGIN[0], 11, ORIGIN[2]], LEGEND_Y11, [LAYER_Y11]);
}

// Part "room: flat 2W front room" (parts/room-11.mjs): the upper sitting room of flat 2W, inside the box
// [4,19,12,11,22,18]. Entered from the back room through the opening at (7,19..20,11). Focal piece: the window seat
// under the oriel (7..9,18), in line with the doorway. Around it: a study desk and chair against the east wall, a
// sideboard with pots on the west wall, a small table with a chair, and a pouffe. Light: two floor lanterns and two
// table lamps (on the desk and the table), so the focal seat is the brightest spot. Interior furnisher's layout,
// drawn as text with layers(). Nothing sits over the doorway or the windows; the lane x 6..7 stays clear.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [4, 19, 12]; // the room's first cell: x 4, floor y 19, z 12

// One character per block. Rows run along +x (x 4..11), successive rows along +z (z 12..18).
const LEGEND = {
  C: "dark_oak_planks",                             // sideboard block
  F: "dark_oak_fence",                              // table and desk legs
  T: ["dark_oak_slab", { type: "bottom" }],         // table and desk tops
  a: ["dark_oak_stairs", { facing: "north", half: "bottom" }], // chair, sits facing south
  b: ["dark_oak_stairs", { facing: "south", half: "bottom" }], // window seat, sits facing north
  w: ["dark_oak_stairs", { facing: "west", half: "bottom" }],  // chair, sits facing east
  Y: "yellow_wool",                                 // pouffe
  P: "flower_pot",                                  // on the sideboard
  l: ["lantern", { hanging: "false" }],             // standing: on a table or desk top, or on the floor
};

// y 19: furniture on the floor
const Y19 = [
  "CC......", // z 12: sideboard along the north wall, doorway lane (x 7) clear
  "C.....a.", // z 13: sideboard end; chair at the desk (x 10)
  ".l....FF", // z 14: floor lantern (x 5), study desk on the east wall (x 10..11)
  "........", // z 15
  "l...wF..", // z 16: floor lantern in the west corner (x 4), chair and table (x 8..9)
  ".Y......", // z 17: pouffe
  "...bbb..", // z 18: window seat under the oriel (x 7..9), the focal piece
];
// y 20: table and desk tops, pots on the sideboard
const Y20 = [
  "PP......",
  "........",
  "......TT",
  "........",
  ".....T..",
  "........",
  "........",
];
// y 21: standing lamps on the desk and table
const Y21 = [
  "........",
  "........",
  ".......l",
  "........",
  ".....l..",
  "........",
  "........",
];

export function build(g) {
  layers(g, ORIGIN, LEGEND, [Y19, Y20, Y21]);
}

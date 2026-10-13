// Part "room: flat 2W back room" (parts/room-12.mjs): the bedroom and kitchen of flat 2W's back room, inner box
// [4,19,5,11,22,10]. Entered by the flat door at (8, 19..20, 5) from the corridor and by the opening at (7, 19..20, 11)
// from the front room. Focal piece: the kitchen hearth (lit campfire) on the south wall, in line with the door at x 8.
// Furniture stays against the walls; the lanes x 7..8 from the door to the opening, and the cells in front of each
// chair and table, stay clear. Light: the hearth, and a lantern standing on the table. Written with layers() (one
// character per block), rows along +x from x 4, successive rows along +z from z 6 (z 5 is the corridor wall, its door
// cell is the shell's).
// Legend: W dark_oak_planks (wardrobe), C oak_planks (kitchen counter), S/R dark_oak_stairs (chairs: S back to the
// west, sits facing east; R back to the east, sits facing west), F dark_oak_fence (table leg), T dark_oak_slab (table
// top), H lit campfire (hearth), Y hay_block (fuel and sacks), p flower_pot (herbs on the counter), L lantern (table).
// No bed: the palette has no bed block (see plan notes).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  W: "dark_oak_planks",
  C: "oak_planks",
  S: ["dark_oak_stairs", { facing: "west", half: "bottom" }],
  R: ["dark_oak_stairs", { facing: "east", half: "bottom" }],
  F: "dark_oak_fence",
  T: ["dark_oak_slab", { type: "bottom" }],
  H: ["campfire", { lit: "true" }],
  Y: ["hay_block", { axis: "y" }],
  p: "flower_pot",
  L: ["lantern", { hanging: "false" }],
};

// Layer y 19 (floor level, furniture bases), then y 20 (table top, wardrobe top, pots), then y 21 (the table lantern).
const FLOOR = [
  "W.......", // z 6
  "W......C", // z 7
  "SFR....C", // z 8
  ".......C", // z 9
  "....HYCC", // z 10: hearth on the south wall, in line with the door
];
const UPPER = [
  "W.......", // z 6
  "W......p", // z 7
  ".T......", // z 8
  ".......p", // z 9
  "......p.", // z 10
];
const TOP = [
  "........", // z 6
  "........", // z 7
  ".L......", // z 8
  "........", // z 9
  "........", // z 10
];

export function build(g) {
  layers(g, [4, 19, 6], LEGEND, [FLOOR, UPPER, TOP]);
}

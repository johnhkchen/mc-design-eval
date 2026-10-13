// Part "room: flat 2E front room" (parts/room-13.mjs): upper sitting room with an oriel window seat. Inner air x 13..20,
// y 19..22, z 12..18; the doorway is in the north wall at (15, 19..20, 11). Furniture is drawn as text (layers) on the
// floor grid from `mcd plan`: rows run along +x from x 13, successive rows along +z from z 12. Stairs face the way the
// back is (a chair facing south has facing "north"), so every seat's back is to the wall or the table's far side.
// Lights are standing lanterns on a block (table top, dresser, fence posts): the ceiling is not built over y 22, so
// nothing hangs.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const legend = {
  N: ["dark_oak_stairs", { facing: "north", half: "bottom" }],   // chair/bench seat facing south
  S: ["dark_oak_stairs", { facing: "south", half: "bottom" }],   // chair facing north
  W: ["dark_oak_stairs", { facing: "west", half: "bottom" }],    // chair facing east
  E: ["dark_oak_stairs", { facing: "east", half: "bottom" }],    // chair facing west
  F: "dark_oak_fence",                                          // table leg and lamp posts
  T: ["dark_oak_slab", { type: "bottom" }],                     // table top
  P: "dark_oak_planks",                                         // dresser
  Q: "flower_pot",                                              // on the dresser
  M: ["lantern", { hanging: "false" }],                         // standing on a table, dresser or post
};

// y 19 (floor level): the window bench under the oriel (x 15..17, z 18), a table at (16,16) with three chairs, an
// armchair against the west wall, a dresser on the east wall, and two lamp posts. The lane from the door runs down x 14.
const y19 = [
  "........",  // z 12: first cell inside the door (15,12) kept clear
  "WF.....P",  // z 13: armchair, lamp post by the corner
  ".......P",  // z 14
  "...N....",  // z 15: chair north of the table
  "..WFE...",  // z 16: table with chairs west and east
  "F.....F.",  // z 17: lamp posts at the south corners; lane between table and bench
  "..NNN...",  // z 18: window bench in front of the oriel
];

// y 20: lanterns on the posts and the dresser, a flower pot, the table top
const y20 = [
  "........",
  ".M.....M",  // z 13
  ".......Q",  // z 14
  "........",
  "...T....",  // z 16 table top
  "M.....M.",  // z 17
  "........",
];

// y 21: the table lantern on its top
const y21 = [
  "........",
  "........",
  "........",
  "........",
  "...M....",  // z 16
  "........",
  "........",
];

// y 22: empty (no ceiling to hang from)
const y22 = Array(7).fill("........");

export function build(g) {
  layers(g, [13, 19, 12], legend, [y19, y20, y21, y22]);
}

// Part "room: landing 2" (parts/room-16.mjs): the second-floor stair landing, inner air [22,19,3]..[25,22,11].
// Furnished as a bench landing: a window bench on the rear wall with a table and lamp, two chairs, a cupboard with a
// flower pot on the east wall. The west column (x 22) and the row z 11 stay clear: the lane from the corridor door
// (21,19..20,3) to flight 2's top (22..23,19,12) and to the doorway at (25,19,12).
// Light: standing lanterns on the floor (25,19,7), (23,19,10) and the table lamp at (24,20,5). Nothing hangs: the
// loft floor at y 23 is outside this box and not built by the shell.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  S: B.stairs("oak", "north", "bottom"),   // bench seats, back to the rear wall
  W: B.stairs("oak", "west", "bottom"),    // chair facing east, back to the west
  E: B.stairs("oak", "east", "bottom"),    // chair facing west, back to the east wall
  F: B.fence("dark_oak"),                  // table
  L: B.lantern(false),                     // standing lanterns: table lamp and floor lamps
  P: B.block("flower_pot"),                // pots on the bench and the cupboard
  C: B.block("dark_oak_planks"),           // cupboard
};

// Rows run along +z (z 3..11), columns along +x (x 22..25). '.' is left as it is.
const ROWS_19 = [
  ".SSP", // z 3: bench under the rear window, a pot at its east end
  "....", // z 4
  ".WFE", // z 5: chair, table, chair
  "....", // z 6
  "...L", // z 7: floor lantern in the east corner
  "....", // z 8
  "...C", // z 9: cupboard on the east wall
  ".L..", // z 10: floor lantern by the west lane
  "....", // z 11: kept clear for the lane
];
const ROWS_20 = [
  "....", // z 3
  "....", // z 4
  "..L.", // z 5: table lamp on the table
  "....", // z 6
  "....", // z 7
  "....", // z 8
  "...C", // z 9: cupboard, second course
  "....", // z 10
  "....", // z 11
];
const ROWS_21 = [
  "....", // z 3
  "....", // z 4
  "....", // z 5
  "....", // z 6
  "....", // z 7
  "....", // z 8
  "...P", // z 9: pot on the cupboard
  "....", // z 10
  "....", // z 11
];
// Nothing hangs: the loft floor (y 23) is outside this box and not built here, so no lantern hangs from it.
const ROWS_22 = [
  "....", "....", "....", "....", "....", "....", "....", "....", "....",
];

export function build(g) {
  layers(g, [22, 19, 3], LEGEND, [ROWS_19, ROWS_20, ROWS_21, ROWS_22]);
}

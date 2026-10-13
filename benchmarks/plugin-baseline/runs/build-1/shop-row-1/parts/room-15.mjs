// Part "room: landing 1" (parts/room-15.mjs): first-floor stair landing, inside the box x 22..25, y 14..17, z 3..9.
// Focal piece: a four-chair dining table (fence post, standing lantern on top) at the room's middle, where the
// door from the corridor (21,14..15,3) looks. Chairs are dark_oak_stairs facing their high back, away from the table.
// A flower pot in each east corner, two hanging lanterns along the ceiling. Lanes: the north row, the west column
// (x 22) down to the stairwell openings at z 10, and the south-east cells (24,8..9) to the east opening at x 25.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  W: ["dark_oak_stairs", { facing: "west", half: "bottom" }],  // chair west of the table, back to the west
  E: ["dark_oak_stairs", { facing: "east", half: "bottom" }],  // chair east of the table, back to the east
  N: ["dark_oak_stairs", { facing: "north", half: "bottom" }], // chair north of the table, back to the north
  S: ["dark_oak_stairs", { facing: "south", half: "bottom" }], // chair south of the table, back to the south
  T: "dark_oak_fence",                                        // table post
  L: ["lantern", { hanging: "false" }],                       // standing lantern on the table
  H: ["lantern", { hanging: "true" }],                        // lantern hanging from the ceiling at y 18
  P: "flower_pot",
};

// Rows run along +x (x 22..25), successive rows along +z (z 3..9).
const FLOOR_14 = [
  "....", // z 3: the door's row, kept clear
  "...P", // z 4
  "..N.", // z 5
  ".WTE", // z 6: the table row
  "..S.", // z 7
  "...P", // z 8
  "....", // z 9
];
const FLOOR_15 = [
  "....",
  "....",
  "....",
  "..L.", // z 6: the lantern on the table
  "....",
  "....",
  "....",
];
const CEILING_17 = [
  "....",
  ".H..", // z 4, x 23
  "....",
  "....",
  "....",
  "..H.", // z 8, x 24
  "....",
];

export function build(g) {
  layers(g, [22, 14, 3], LEGEND, [FLOOR_14, FLOOR_15]);
  layers(g, [22, 17, 3], LEGEND, CEILING_17);
}

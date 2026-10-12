// Part: room: Committee room east (parts/room-9.mjs). Mirror meeting room: a committee table with chairs on the north
// side, bookshelves on the north-east and north-west ends, a barrel and flower pot on the lane's end, and hanging lanterns.
// Inner air x23..35, y11..15, z11..13. The doorway is x25 z14; the lane z13 is kept clear from the door east.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const legend = {
  B: "bookshelf",
  R: "barrel",
  P: "flower_pot",
  F: "dark_oak_fence",
  S: ["dark_oak_slab", { type: "bottom" }],
  C: ["dark_oak_stairs", { facing: "north", half: "bottom" }], // chairs on the table's north side, back to the wall
  W: ["dark_oak_stairs", { facing: "west", half: "bottom" }], // end chair at x28, back to the west
  E: ["dark_oak_stairs", { facing: "east", half: "bottom" }], // end chair at x32, back to the east
};

// Rows: z11, z12, z13. Columns: x23..x35.
const floor = [
  "BB....CCC...B", // z11: bookshelves at each end, three chairs in front of the table
  "R....WFFFE..R", // z12: barrel, the table (fence legs), end chairs, barrel
  "P............", // z13: flower pot by the west corner; the lane from the door stays clear
];
const top = [
  "BB..........B", // z11: bookshelf tops at the ends
  "......SSS....", // z12: table top (dark oak slab)
  ".............", // z13
];

export function build(g) {
  layers(g, [23, 11, 11], legend, [floor, top]);
  // Hanging lanterns from the ceiling (y16), over the table and the two ends.
  for (const x of [26, 30, 34]) g.set(x, 15, 12, ...B.lantern(true));
}

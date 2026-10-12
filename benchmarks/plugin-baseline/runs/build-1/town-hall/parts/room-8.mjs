// Part: room: Committee room west (parts/room-8.mjs). Interior of the box x5..17, y11..15, z11..13 (floor y10, ceiling y16).
// Plan: a long dark-oak table along z12 (x7..12) with a lectern at its head, six chairs down its south side (z13), a
// town map board on the north wall above the table as the focal piece, bookshelves in the east corner, a barrel in the
// west corner. The z11 row is the walking lane from the doorway (x15 z14) to the west end and stays clear.
// Light: two hanging lanterns under the ceiling, one centred over the table (the focal piece), one at the doorway.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const legend = {
  R: ["red_carpet", {}],                       // runner under the lane
  F: B.fence("dark_oak"),                      // table legs
  S: B.slab("dark_oak", "bottom"),             // table tops
  C: B.stairs("dark_oak", "south", "bottom"),  // chairs, back to the south wall
  L: ["lectern", { facing: "east" }],          // the chairman's lectern at the table head
  B: ["bookshelf", {}],
  X: ["chiseled_bookshelf", { facing: "west" }],
  K: ["barrel", { facing: "up", open: "false" }],
  Z: B.lantern(true),                          // hanging lantern
};

export function build(g) {
  // y11 (floor level) and y12 (table tops, shelves), rows z11, z12, z13 along x5..x17
  layers(g, [5, 11, 11], legend, [
    [
      "..RRRRRR.....",
      ".LFFFFFF....B",
      "K.CCCCCC....X",
    ],
    [
      ".............",
      "..SSSSSS....B",
      "............B",
    ],
  ]);

  // y15: the hanging lanterns, under the ceiling at y16
  layers(g, [5, 15, 11], legend, [
    [
      ".............",
      ".Z...Z..Z..Z.",
      ".............",
    ],
  ]);

  // The map board: a wall sign on the north wall (z10) above the table, pointing into the room
  g.set(10, 13, 11, ...B.sign("dark_oak", ["TOWN", "MAP"], { facing: "south" }));
}

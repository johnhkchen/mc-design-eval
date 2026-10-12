// Part: room: Waiting bay (parts/room-4.mjs). Interior furnisher + lamplighter for the box x23..29, y4..9, z11..14.
// Focal piece: the notice board on the north wall between the two windows, read from the doorway (south).
// Benches: dark_oak_stairs along the side walls, backs to the wall. Two table-and-chair pairs in the middle, the chairs
// backed to the board and to the east wall line. Lane: x24 and x26..27 stay open; z14 (the doorway's first row) is clear.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const legend = {
    P: "flower_pot", // empty pot, the plant in the corners
    B: "dark_oak_planks", // notice board, two wide, floor to y8
    W: B.stairs("dark_oak", "west"), // west bench, back on the wall at x22
    E: B.stairs("dark_oak", "east"), // east bench, back on the wall at x30
    C: B.stairs("dark_oak", "north"), // chair, back to the board, seat facing the room
    T: B.fence("dark_oak"), // table post
    S: B.slab("dark_oak", "bottom"), // table top on the post
    L: B.lantern(true), // hanging lantern from the ceiling at y10
  };
  const origin = [23, 4, 11];
  const layersByY = [
    // y4: the floor furniture
    [
      "P.BB..P", // z11: pots in the corners, board x25..26
      "W.C..CE", // z12: benches, chairs
      "W.T..TE", // z13: benches, table posts
      ".......", // z14: the doorway's first row, kept clear
    ],
    // y5: the board's face and the table tops
    [
      "..BB...",
      ".......",
      "..S..S.",
      ".......",
    ],
    // y6..y8: the board only
    [
      "..BB...",
      ".......",
      ".......",
      ".......",
    ],
    [
      "..BB...",
      ".......",
      ".......",
      ".......",
    ],
    [
      "..BB...",
      ".......",
      ".......",
      ".......",
    ],
    // y9: hanging lanterns, under the ceiling
    [
      ".......",
      "...L.L.",
      ".L..L..",
      ".......",
    ],
  ];
  layers(g, origin, legend, layersByY);
}

// Part "room: flat 1E front room" (parts/room-9.mjs): sitting room, interior box [13,14,12]..[20,17,18].
// Focal piece: the oriel window seat (three stairs, facing the doorway's line) with a fence-and-slab table in front of it.
// Supporting: bookcases (planks with flower pots) on the west and east walls, lanterns hanging from the ceiling at y 18.
// Doorway (15,14..15,11) is at the north end; the lane runs down x 14 past the table to the seat.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [13, 14, 12];

const LEGEND = {
  B: "dark_oak_planks",                       // bookcase body
  p: "flower_pot",                            // pot plant on the bookcase
  W: ["dark_oak_stairs", { facing: "west", half: "bottom" }],   // chair, back to the west
  E: ["dark_oak_stairs", { facing: "east", half: "bottom" }],   // chair, back to the east
  S: ["dark_oak_stairs", { facing: "south", half: "bottom" }],  // window seat, back to the window
  F: "dark_oak_fence",                        // table post
  K: ["dark_oak_slab", { type: "bottom" }],   // table top
  L: ["lantern", { hanging: "true" }],        // hanging lantern under the ceiling at y 18
};

// Rows run along +x (x 13..20), successive rows along +z (z 12..18). Layers are y 14..17.
const LAYERS = [
  // y 14: floor furniture
  [
    "........",   // z 12 (doorway row, kept clear)
    "B......B",   // z 13
    "B......B",   // z 14
    "..WFE..B",   // z 15: chairs either side of the table
    ".......B",   // z 16
    ".......B",   // z 17
    "..SSS...",   // z 18: window seat under the oriel
  ],
  // y 15: bookcase tops, table top
  [
    "........",
    "B......B",
    "B......B",
    "...K...B",
    ".......B",
    ".......B",
    "........",
  ],
  // y 16: pots
  [
    "........",
    "p.......",
    ".......p",
    "........",
    ".......p",
    "........",
    "........",
  ],
  // y 17: lanterns
  [
    "........",
    ".L......",
    "........",
    "......L.",
    "........",
    "...L....",
    "........",
  ],
];

export function build(g) {
  LAYERS.forEach((rows, dy) => {
    layers(g, [ORIGIN[0], ORIGIN[1] + dy, ORIGIN[2]], LEGEND, rows);
  });
}

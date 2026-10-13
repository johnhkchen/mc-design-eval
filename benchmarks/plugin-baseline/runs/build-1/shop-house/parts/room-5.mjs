// SPDX-License-Identifier: AGPL-3.0-or-later
// Room: Living room (front parlour, first floor). Inner air box [9,14,7,18,17,15]; floor cells x10..18, z7..15 at y14,
// doorway in the west wall at x9 z9 (lane x10 z9 kept clear), hearth on the east wall (x18 z13..14, built by the
// hearth part: its lane x17 z13..14 stays clear). Focal piece: the hearth. Seating faces it: a sofa on the north wall
// (back north, seat south), two armchairs facing the hearth, a coffee table between. Bookshelves on the west wall, a
// barrel in the corner, a red carpet rug. Light: hanging lanterns from the second-floor ceiling (y18), a pot on the table.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  B: "bookshelf",
  S: ["spruce_stairs", { facing: "north", half: "bottom" }],      // sofa: seat faces south, back north
  A: ["oak_stairs", { facing: "west", half: "bottom" }],          // armchairs: seat faces east to the hearth
  K: "barrel",
  C: "red_carpet",
  F: "spruce_fence",                                              // table leg
  T: ["spruce_slab", { type: "top" }],                            // table top, a top slab so the pot stands on a full face
  P: "flower_pot",
  L: ["lantern", { hanging: "true" }],
};

// x 10..18 across each row, z 7..15 down the rows (origin [10, 14, 7]).
const LAYERS = [
  // y14: floor furniture
  [
    "B..SSS..K", // z7  bookshelf, sofa on the north wall, barrel in the corner
    "BCC......", // z8  bookshelf, rug
    ".CC...A..", // z9  rug, armchair
    ".CC.F....", // z10 rug, table leg
    ".CC...A..", // z11 rug, armchair
    ".........", // z12 lane: doorway x9 -> hearth
    ".........", // z13 hearth lane x17
    ".........", // z14
    ".........", // z15
  ],
  // y15: table top
  [
    ".........",
    ".........",
    ".........",
    "....T....",
    ".........",
    ".........",
    ".........",
    ".........",
    ".........",
  ],
  // y16: pot on the table
  [
    ".........",
    ".........",
    ".........",
    "....P....",
    ".........",
    ".........",
    ".........",
    ".........",
    ".........",
  ],
  // y17: hanging lanterns from the second-floor ceiling
  [
    ".........",
    ".........",
    ".........",
    "..L...L..", // z10
    ".........",
    "L........", // z12, over the doorway lane
    ".........",
    "..L...L..", // z14
    ".........",
  ],
];

export function build(g) {
  layers(g, [10, 14, 7], LEGEND, LAYERS);
}

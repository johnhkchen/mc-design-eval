// SPDX-License-Identifier: AGPL-3.0-or-later
// Room: Wing sitting room. Quiet sitting room over the kitchen: a bookshelf wall on the west, a small spruce table
// with four chairs at the centre (the focal piece, lit by a candle), a barrel for sewing stores, a red rug on the
// south side, and two hanging lanterns from the second-floor ceiling. Inner air box [5,14,23,10,17,29]; the door is
// at x7 z22 (north), so its first cell x7 z23 is kept clear and the walkway ring round the table stays open.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// origin [5, 14, 23]: rows run along +x (x 5..10), successive rows along +z (z 23..29).
const LEGEND = {
  "#": "bookshelf",
  "B": ["barrel", { facing: "up" }],
  "f": "spruce_fence",                              // table post
  "T": ["spruce_slab", { type: "top" }],            // table top, sits on the post
  "n": ["spruce_stairs", { facing: "north", half: "bottom" }], // chairs: back on the far side
  "s": ["spruce_stairs", { facing: "south", half: "bottom" }],
  "w": ["spruce_stairs", { facing: "west", half: "bottom" }],
  "e": ["spruce_stairs", { facing: "east", half: "bottom" }],
  "r": "red_carpet",
  "p": "flower_pot",
  "c": ["candle", { candles: "1", lit: "true" }],
  "L": ["lantern", { hanging: "true" }],
  "l": ["lantern", { hanging: "false" }],          // standing lamp on the shelf top
};

// y 14: floor furniture (bookshelves, barrel, table post, chairs, rug)
const Y14 = [
  "#....B",
  "#.....",
  "#..n..",
  "..wfe.",
  "...s..",
  ".rrrr.",
  "......",
];

// y 15: a pot and a lamp on the shelf tops (three shelves at most), and the table top
const Y15 = [
  "p.....",
  "......",
  "l.....",
  "...T..",
  "......",
  "......",
  "......",
];

// y 16: a lit candle on the table
const Y16 = [
  "......",
  "......",
  "......",
  "...c..",
  "......",
  "......",
  "......",
];

// y 17: hanging lanterns from the second-floor ceiling (y 18)
const Y17 = [
  "......",
  ".L....",
  "......",
  "......",
  "......",
  "......",
  "....L.",
];

export function build(g) {
  layers(g, [5, 14, 23], LEGEND, [Y14, Y15, Y16, Y17]);
}

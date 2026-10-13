// SPDX-License-Identifier: AGPL-3.0-or-later
// Room: Parents' bedroom (front bedroom, inner air box [9,19,7,18,22,11]; door x17 z12 from the corridor).
// The shell's west wall is the bricks column x 9 (the hall side), so the floor that is really free is x 10..18.
// Focal piece: the double bed against the west wall, head to the wall, centred on the room. Nightstands (barrels with
// candle and lantern) either side of the head, a chest barrel by the foot, a wardrobe (bookshelves) in the east
// corner, window boxes (flower pots) under the north windows, a white rug between the bed and the room. Light: candles
// and a lantern at the bed, a hanging lantern from the loft floor (y 23).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hangLantern } from "../vocab.mjs";

/** Furniture drawn as text: rows run along +x from x 9 (the wall column, always '.') to x 18, successive rows along +z from z 7. */
const LEGEND = {
  "B": ["red_bed", { facing: "west", part: "head" }],
  "F": ["red_bed", { facing: "west", part: "foot" }],
  "b": ["barrel", { facing: "up", open: "false" }],
  "p": "flower_pot",
  "w": "bookshelf",
  "r": "white_carpet",
  "c": ["candle", { candles: "2", lit: "true" }],
  "L": ["lantern", { hanging: "false" }],
};

// floor level, y 19: nightstand and chest barrels, window boxes under the north windows, bed, rug, wardrobe foot
const FLOOR = [
  ".bppb..ppw", // z 7
  "...rr....w", // z 8
  ".BFrr.....", // z 9: head against the west wall (x 10), foot at x 11
  "...rr.....", // z 10
  ".b........", // z 11: nightstand by the head
];

// one block up, y 20: candles on the barrels, lantern on the south nightstand, wardrobe
const SHELF = [
  ".c..c....w", // z 7: candles on the nightstand and the chest
  ".........w", // z 8
  "..........", // z 9
  "..........", // z 10
  ".L........", // z 11: lantern on the nightstand
];

// wardrobe top, y 21
const TOP = [
  ".........w", // z 7
  ".........w", // z 8
  "..........", // z 9
  "..........", // z 10
  "..........", // z 11
];

export function build(g) {
  layers(g, [9, 19, 7], LEGEND, [FLOOR, SHELF, TOP]);
  // hanging lanterns from the loft floor (y 23): the middle of the room, and the south-east corner by the door
  hangLantern(g, 14, 22, 9);
  hangLantern(g, 17, 22, 10);
}

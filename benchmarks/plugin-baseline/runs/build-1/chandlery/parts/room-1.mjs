// Room: Shop (interior designer's part, box [6,2,9,11,5,16]): the candle shop, warm and crowded. The focal piece is the
// counter at z=14 (dark oak planks, candles on top), with barrel-and-plank shelves on the west and south walls, a stool
// behind the counter, and lanterns hung from the upstairs floor. The lanes stay clear: x=11 from the shop door to the
// workshop doorway (10,17) and the partition opening (12,10), and x=6 at the window.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { candleCluster, HONEYCOMB_BLOCK } from "../vocab.mjs";

// Floor-level furniture, rows z=9..16, columns x=6..11 (origin [6, y, 9]). '.' is free floor.
const FLOOR = {
  "K": "dark_oak_planks",
  "B": "barrel",
  "S": ["dark_oak_stairs", { facing: "south", half: "bottom" }],
};
const FLOOR_ROWS = [
  "K.....", // z=9:  shelf base at the west wall, by the shop door's lane
  "K.....", // z=10: shelf base, lane x=11 kept for the partition opening
  "......", // z=11: window side, kept clear
  "......", // z=12
  "......", // z=13
  ".KKKK.", // z=14: the counter, x=7..10
  "BBS...", // z=15: barrels at x=6,7 (west wall), the shopkeeper's stool at (8,15) behind the counter
  "BBBB..", // z=16: barrels along the south wall x=6..9; (10,16) is the workshop doorway's cell, kept clear
];

// Shelf toppers and the counter's honeycomb accent, one level up (y=3).
const TOP = { "H": HONEYCOMB_BLOCK };
const TOP_ROWS = [
  "......",
  "......",
  "......",
  "......",
  "......",
  "..H...", // z=14: honeycomb accent on the counter between the candle clusters
  "......",
  "......",
];

export function build(g) {
  layers(g, [6, 2, 9], FLOOR, FLOOR_ROWS);
  layers(g, [6, 3, 9], TOP, TOP_ROWS);

  // lit candle clusters: the counter's display, and the shelves on the west and south walls
  candleCluster(g, 7, 3, 14, "yellow_candle", 3);
  candleCluster(g, 9, 3, 14, "white_candle", 2);
  candleCluster(g, 10, 3, 14, "candle", 3);
  candleCluster(g, 6, 3, 9, "white_candle", 3);
  candleCluster(g, 6, 3, 10, "yellow_candle", 2);
  candleCluster(g, 6, 3, 15, "white_candle", 2);
  candleCluster(g, 7, 3, 16, "yellow_candle", 3);
  candleCluster(g, 9, 3, 16, "candle", 2);

  // lanterns hung from the upstairs floor (y=6) over the counter, the shop floor and the bay side
  g.set(8, 5, 13, ...B.lantern(true));
  g.set(10, 5, 10, ...B.lantern(true));
  g.set(6, 5, 15, ...B.lantern(true));
  g.set(10, 5, 15, ...B.lantern(true)); // lifts the doorway lane (10..11, 15..16) out of the dim
}

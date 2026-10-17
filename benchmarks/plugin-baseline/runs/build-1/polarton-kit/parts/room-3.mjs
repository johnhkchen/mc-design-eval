// Part: room: gin loft (interior designer + lamplighter). Inner air x 2..9, z 10..15, y 7..9 (floor block y 6, stand y 7).
// Layout: hay store west (x 2..3, z 10..12) with a standing lantern on it; cotton-sorting table and chair in the middle
// (x 7, z 11..12) with a candle; the focal cotton store at the back right (x 8..9, z 15) with a lantern on top. The
// lane runs from the hay door (x 5..6, z 10) across x 4 to the ladder landing (2, 14). Fences ring the loft's shaft hole
// at (7, 6, 14) so nobody steps into it. Nothing over the windows at x 1 / x 10 (y 8) or in the door's first cell.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Legend: '.' is not in the legend, so it is left as it is (air).
const LEGEND = {
  h: "hay_block",                                  // hay bale, the store
  f: "spruce_fence",                               // table post and the shaft-hole rail
  s: ["spruce_slab", { type: "top" }],             // table top (top half: the table sits on the post)
  c: ["spruce_stairs", { facing: "south", half: "bottom" }], // chair, seat to the table
  b: ["barrel", { facing: "up" }],                 // cotton barrels, the focal store
  L: ["lantern", { hanging: "false" }],            // standing lanterns: on a bale, on a barrel
  k: ["candle", { candles: "1", lit: "true" }],    // candle on the table top
};

// Layers from the floor (y 7) up to y 9. Rows run along +z from z 10 to z 15; columns along +x from x 2 to x 9.
// y 7: floor level. The door's first cell (x 5..6, z 10) stays clear; the lane runs along x 4.
const LAYER_Y7 = [
  "hh......", // z 10: hay store
  "hh...f..", // z 11: hay; table post at x 7
  "hh...c..", // z 12: hay; chair at x 7
  ".....f..", // z 13: rail on the shaft hole's north side
  "....f.f.", // z 14: rail on the west and east side of the hole (7,6,14)
  ".....fbb", // z 15: rail on the back; cotton barrels at x 8..9 (focal store)
];
// y 8: the table top's course, the lantern on the bales, the barrel's second course.
const LAYER_Y8 = [
  ".L......", // z 10: lantern on the hay, lights the door corner
  ".L...s..",
  "........",
  "........",
  "........",
  "......b.",
];
const LAYER_Y9 = [
  "........",
  ".....k..",
  "........",
  "........",
  "........",
  "......L.",
];

export function build(g) {
  const placed = layers(g, [2, 7, 10], LEGEND, [LAYER_Y7, LAYER_Y8, LAYER_Y9]);
  return placed;
}

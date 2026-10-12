// Room: Parlour (interior designer's part, box [6,7,8,16,10,12]). Floor dark_oak_planks is the shell's (y=6); the
// furniture stands at y=7. Lanes: row z=12 stays clear from the stair head (16,7,12) to both bedchamber doorways (8,12)
// and (13,12). Focal piece: the lectern at (7,7,10) against the bookshelf wall (x=6), facing the room (east).
// Settle (dark oak stairs facing north) under the paired front windows, x=9..13 at z=8, nothing over the windows.
// Table and chairs at x=12..14, z=10; the candles on the table are the room's brightest light, with two lanterns
// standing on the floor to lift the corners.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// one character per block; rows run along +x (x=6..16), successive rows along +z (z=8..12)
const LEGEND = {
  B: "bookshelf",
  L: ["lectern", { facing: "east" }],
  N: ["lantern", { hanging: false }],
  C: "white_carpet",
  S: ["dark_oak_stairs", { facing: "north" }],   // settle seats, back to the north wall
  W: ["dark_oak_stairs", { facing: "west" }],    // chair west of the table, back to the west
  E: ["dark_oak_stairs", { facing: "east" }],    // chair east of the table, back to the east
  F: "dark_oak_fence",                            // table post
  T: ["dark_oak_slab", { type: "top" }],          // table top (its top face is y=9)
  K: ["candle", { candles: 3, lit: true }],       // candles on the table
};

// y=7: furniture at floor level
const FLOOR = [
  ".N.SSSSS...", // z=8
  "B.CCC......", // z=9
  "BLCCCNWFE..", // z=10 (the lantern lifts the middle of the room)
  "B.CCC......", // z=11
  "N..........", // z=12 (the lane: keep it clear past x=7)
];
// y=8: bookshelf top row and the table top slab
const UPPER = [
  "...........",
  "...........",
  "B......T...",
  "B..........",
  "...........",
];
// y=9: candles on the table top
const LIGHT = [
  "...........",
  "...........",
  ".......K...",
  "...........",
  "...........",
];

export function build(g) {
  layers(g, [6, 7, 8], LEGEND, [FLOOR, UPPER, LIGHT]);
}

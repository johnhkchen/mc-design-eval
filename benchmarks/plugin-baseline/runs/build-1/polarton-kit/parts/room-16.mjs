// Part: room: owner parlor and dining. Inner air x 87..91, y 2..5, z 10..14 (rooms.json box 87,2,10,91,5,14).
// Layout: the hearth (furnace, stove) is the focal piece on the back wall at (91,2,14), in line with the front door.
// A pale oak settee and armchairs face it; the dining table (fence + top slab) sits in the middle with four chairs
// (pale oak stairs, backs out); a barrel cabinet in the front corner and a side table by the east window.
// Lanes kept clear: door (89..90, z10) to the east lane x91, and the stair foot (87, 2, 13..14) via the back row.
// Light: a hanging lantern over the table, a lit candle on the stove, the barrel and the side table.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [87, 2, 10];

// y 2: floor-level furniture (rows z 10..14, columns x 87..91)
const FLOOR = [
  "B...T", // z10: barrel cabinet, door lane clear, side table by the east window
  "S.N..", // z11: settee end, chair north of the table, east lane clear
  "SWTE.", // z12: settee end, chair west, table, chair east
  "..Z..", // z13: chair south of the table, stair-foot lane clear
  "....H", // z14: stove on the back wall, in front of the hearth mouth (91,2,15)
];
// y 3: things on tops (candles on the barrel, the table and the stove; the side table's top slab)
const TOPS = [
  "c...Q",
  ".....",
  "..Q..",
  ".....",
  "....h",
];
// y 4: candle on the side table's top
const UPPER = [
  "....k",
  ".....",
  ".....",
  ".....",
  ".....",
];
// y 5: hanging lantern from the upper floor's ceiling, over the table
const HANG = [
  ".....",
  ".....",
  "..L..",
  ".....",
  ".....",
];

const LEGEND = {
  B: ["barrel", { facing: "up", open: "false" }],
  T: "spruce_fence",
  S: ["mangrove_stairs", { facing: "west", half: "bottom" }], // settee: back to the west wall, seat facing east
  N: ["mangrove_stairs", { facing: "north", half: "bottom" }], // chairs: backs out, seats toward the table
  W: ["mangrove_stairs", { facing: "west", half: "bottom" }],
  E: ["mangrove_stairs", { facing: "east", half: "bottom" }],
  Z: ["mangrove_stairs", { facing: "south", half: "bottom" }],
  Q: ["smooth_stone_slab", { type: "top" }],
  H: ["furnace", { facing: "north", lit: "false" }],
  c: ["candle", { candles: "1", lit: "true" }],
  h: ["candle", { candles: "1", lit: "true" }],
  k: ["candle", { candles: "1", lit: "true" }],
  L: ["lantern", { hanging: "true" }],
};

export function build(g) {
  layers(g, ORIGIN, LEGEND, [FLOOR, TOPS, UPPER, HANG]);
}

// Part: room: farmhouse kitchen ell. Interior designer's layout inside the air box [27,2,15,31,4,16].
// Door x31 z14 comes in at (31,15); the side door (26,16) comes in at (27,16). The walking lane runs along z16 from
// x30 to x27, and (30,15) keeps the way from the door clear. The stove (focal piece) sits in the far corner, in line
// with the door, and the work table is the one piece in the north row. A lantern on the table and the stove's own
// light give the room its glow.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [27, 2, 15];

const LEGEND = {
  B: "barrel",
  F: "spruce_fence",
  S: ["spruce_slab", { type: "top" }],
  L: ["lantern", { hanging: "false" }],
  C: ["candle", { candles: "1", lit: "true" }],
  U: ["furnace", { facing: "west", lit: "true" }],
};

// Rows run along +x (x27..31), successive rows along +z (z15, z16). Layer y2 is the floor stand, y3 and y4 above it.
const LAYERS = [
  ["BBF..", "....U"], // y2: two barrels (pantry), table post, lane, stove in the far corner
  [".CS..", "....."], // y3: candle on the barrel, table top slab on the post
  ["..L..", "....."], // y4: lantern standing on the table top
];

export function build(g) {
  layers(g, ORIGIN, LEGEND, LAYERS);
}

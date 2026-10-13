// Part: room: bedroom 6 (interior designer's part). Bedroom over the kitchen: the bed on the north wall as the focal
// piece, a barrel and a chest as storage, a nightstand each side, a reading table by the east window, a red rug, and one
// hanging lantern on an iron chain as the room's light, with candles on the tables. Only the inner air box
// [51,11,64]..[57,16,68] is written; the door is on the west wall at x50 z66 and the windows are on the east wall x58.
//
import { B, layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Floor row y11, origin (51, 11, 64): rows run along +x (x51..57), successive rows along +z (z64..68).
  // The bed is placed by bed() below, so its cells stay blank here.
  const legend = {
    b: "barrel",
    f: "dark_oak_fence",
    k: ["chest", { facing: "south", type: "single" }],
    R: "red_carpet",
    c: ["candle", { candles: "1", lit: "true" }],
    p: "flower_pot",
    L: ["lantern", { hanging: "false", waterlogged: "false" }],
    s: ["dark_oak_slab", { type: "top" }],
  };
  const rows11 = [
    "b f f k", // z64: barrel (51), nightstand (53) by the bed head, nightstand (55), chest dresser (57)
    "       ", // z65: bed foot at x54 (bed() below)
    "      f", // z66: table post (57) under the east window; the chair (56) is set below
    "  RR   ", // z67: red rug under the room's centre
    "  RR   ", // z68
  ];
  const rows12 = [
    "p L p c", // flower pot on the barrel, standing lantern on the nightstand, flower pot on the other nightstand, candle on the chest
    "       ",
    "      s", // table top slab (top half, sits on the fence post at 57,11,66)
    "       ",
    "       ",
  ];
  const rows13 = [
    "       ",
    "       ",
    "      c", // lit candle on the table
    "       ",
    "       ",
  ];
  layers(g, [51, 11, 64], legend, [rows11, rows12, rows13]);

  bed(g, [54, 11, 65], "north", "red"); // head at (54,11,64) against the north wall, foot toward the room
  g.set(56, 11, 66, ...B.stairs("dark_oak", "west", "bottom")); // chair: back on the west, seat toward the table

  // ---- lamplighter: three lights, every floor cell at 8+ (scratch measure: min 10, no dim cell; the bed head 54,11,64
  // is kept clear).
  g.set(54, 16, 67, ...B.chain("y")); // hanging lantern on a chain from the y17 ceiling, over the rug
  g.set(54, 15, 67, ...B.lantern(true));
  g.set(56, 11, 64, ...B.lantern(false)); // standing lantern on the floor between the nightstand (55) and the chest (57)
  g.set(51, 11, 67, ...B.lantern(false)); // door lantern: by the west door (x50 z66), lights the south-west corner
}

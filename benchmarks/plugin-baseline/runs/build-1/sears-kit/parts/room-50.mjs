// Room "P7 dining room" (interior designer's part). Inner air x 115..119, z 19..20, feet y 2 (floor layer y 1).
// Doorway on the north wall at x 116..119 z 18: the row z 19 in front of it stays clear (the walker's lane). The back
// door at x 119 z 21 is reached through (119,20), which also stays clear. The table is the focal piece on the south
// row: a spruce fence post with a dark oak top slab, two dark oak stair chairs facing it, a lit standing lantern on
// top. A barrel dresser with a lit candle stands against the west wall; the table lantern and the candle light the room. Nothing sits over a doorway or window.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const legend = {
    B: "barrel",
    K: ["candle", { candles: "1", lit: "true" }],
    C: ["dark_oak_stairs", { facing: "east", half: "bottom" }],
    E: ["dark_oak_stairs", { facing: "west", half: "bottom" }],
    F: "spruce_fence",
    T: ["dark_oak_slab", { type: "top" }],
    L: ["lantern", { hanging: "false" }],
  };
  // origin [115, y, 19]: rows run along +x (x 115..119), successive rows along +z (z 19, z 20)
  layers(g, [115, 2, 19], legend, [
    ["     ", "BCFE "],   // y 2: feet level (barrel, chairs, table post)
  ]);
  layers(g, [115, 3, 19], legend, [
    ["     ", "K T  "],   // y 3: lit candle on the barrel, table top slab
  ]);
  layers(g, [115, 4, 19], legend, [
    ["     ", "  L  "],   // y 4: standing lantern on the table
  ]);
}

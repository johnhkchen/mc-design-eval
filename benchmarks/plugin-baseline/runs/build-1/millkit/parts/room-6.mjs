// Room: P2 parlour (interior designer's part). Inner air x31..33, y3..6, z10..15; entered by the partition door x30 z14.
// Layout: the bed is the focal piece, on the east wall at the far end from the door (foot z14, head z15 toward the back
// wall). Along the front wall: a barrel shelf of potted poppy and a lantern-topped chest (dresser). A table of birch fence
// with an oak top slab, two oak stair chairs, a candle, and a white wool rug. Column x32 stays clear as the walking lane.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Floor level (y3): barrel dresser, chest, chairs, table post, rug.
  // Legend: B barrel (up), C chest (south), h chair facing north (back to the front wall), j chair facing south,
  // F birch fence post (table leg), W white carpet rug.
  const legend = {
    B: ["barrel", { facing: "up" }],
    C: ["chest", { facing: "south" }],
    h: ["oak_stairs", { facing: "north", half: "bottom" }],
    j: ["oak_stairs", { facing: "south", half: "bottom" }],
    F: "birch_fence",
    W: "white_carpet",
    // Table top (y4): a top slab sits on the fence post's top; the shelf of pots and the lantern sit above the barrel and chest.
    p: "potted_poppy",
    L: ["lantern", { hanging: "false" }],
    S: ["oak_slab", { type: "top" }],
    // Candle on the table (y5): four lit candles, the table's light.
    K: ["candle", { candles: "4", lit: "true" }],
  };
  const rows = [
    // y3: z10..15, x31..33
    [
      "B  ",
      "hW ",
      "FW ",
      "jW ",
      "   ",
      "L  ",
    ],
    // y4
    [
      "p  ",
      "   ",
      "S  ",
      "   ",
      "   ",
      "   ",
    ],
    // y5
    [
      "   ",
      "   ",
      "K  ",
      "   ",
      "   ",
      "   ",
    ],
  ];
  layers(g, [31, 3, 10], legend, rows);
  // The focal piece: the family bed, foot at x33 z14, head one step south (pillow end toward the back wall).
  bed(g, [33, 3, 14], "south", "red");
  bed(g, [33, 3, 11], "south", "white");
}

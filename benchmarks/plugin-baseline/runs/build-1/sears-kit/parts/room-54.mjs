// Room "P7 north-east bedroom" (interior designer's part): box x 121..124, y 6..8, z 14..17. Entered from the upper hall
// through the door at (120, 6..7, 15). The focal piece is the bed against the solid east wall (x 125), its head at (124,
// 6, 16). Barrels make the dresser along the north row (kept in front of the north window at x 122..123) and a nightstand
// at the bed head, carrying the lantern that lights the bed. A candle on the dresser and a brown carpet rug on the south
// row. The lane from the door runs (121,15) -> (122..123,15) -> the bed's foot at (123,16); (121..123,14) stay open.
import { bedSet } from "../vocab.mjs";
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // the bed, both halves, foot at (123,6,16), head at (124,6,16) against the east wall
  bedSet(g, [123, 6, 16], "east", "green");

  // furniture by layer, origin (121,6,14): rows run along +x (x 121..124), successive rows along +z (z 14..17)
  const legend = {
    B: ["barrel", { facing: "up", open: "false" }],
    P: "potted_poppy",
    C: ["candle", { candles: "1", lit: "true" }],
    L: ["lantern", { hanging: "false" }],
    R: "brown_carpet",
  };
  layers(g, [121, 6, 14], legend, [
    [
      "B..B", // y6 z14: dresser barrels at the north corners
      "...B", // z15: nightstand barrel at the bed head
      "....", // z16: the bed (placed by bedSet)
      "RR..", // z17: rug along the south row
    ],
    [
      "P..C", // y7 z14: pot on the west barrel, lit candle on the east barrel
      "...L", // z15: lantern standing on the nightstand, the room's light
      "....",
      "....",
    ],
  ]);
}

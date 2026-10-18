// Room "P4 bath and store" (interior designer's part): a 3 x 2 bath and linen store, box [69,6,19,71,8,20].
// Focal piece: the cauldron (the bath) in the far south-west corner. Two linen barrels stand along the north row, each
// lit from its lid (a lantern and a candle). The lane from the door runs (71,19) -> (71,20) -> (70,20) -> cauldron, clear
// at y6..7 so the door's first inside cell is open whichever wall the door is set in.
import { B, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const barrel = ["barrel", { facing: "up", open: "false" }];
  const candle = ["candle", { candles: "1", lit: "true", waterlogged: "false" }];
  const lantern = B.lantern(false);
  // y6: the two barrels (x69, x70 on z19) and the cauldron (x69 z20); x71 and the lane stay clear
  layers(g, [69, 6, 19], { B: barrel, K: "cauldron" }, [
    ["BB ",
     "K  "],
  ]);
  // y7: a lantern and a lit candle standing on the barrel lids
  layers(g, [69, 7, 19], { L: lantern, C: candle }, [
    ["LC ",
     "   "],
  ]);
}

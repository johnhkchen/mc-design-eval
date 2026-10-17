// Part: room: tobacco barn (interior designer). Inner air x 64..67, y 1..13, z 10..14; door x 65..66 z 9; firebox
// mouth (65, 1, 15) in the back wall; ladder (64, 1..9, 14) built earlier by the hearths part (locked).
// Layout: a clear 2-wide lane x 65..66 from the door to the ladder foot; storage and the stripping table along the
// east and west walls; tier poles with hung leaves overhead (the focal piece, seen from the door); lanterns low.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { tobaccoTier } from "../vocab.mjs";

export function build(g) {
  // the tobacco tiers: poles along x at y 5, 7, 9 on rows z 10, 12, 14, leaves hung under them (the ladder's cells skip)
  tobaccoTier(g, 64, 10, [5, 7, 9]);
  // the top tier is a walkway: poles at y 9 also on rows z 11 and 13, so the ladder's top reaches every top stand
  for (const z of [11, 13]) for (let x = 64; x <= 67; x++) g.set(x, 9, z, "minecraft:stripped_spruce_log", { axis: "x" });

  // floor layer y 1 (rows z 10..14, columns x 64..67; ' ' = leave as is: the ladder foot at (64,1,14) is locked)
  layers(g, [64, 1, 10], {
    b: "barrel",
    h: "hay_block",
    L: ["lantern", { hanging: "false" }],
  }, [
    ["b..b",   // z 10: leaf barrels in the two back corners
     "h..h",   // z 11: hay bales, storage and a seat for the stripping
     "L...",   // z 12: a standing lantern low on the west wall
     "...b",   // z 13: the stripping table (a barrel with a candle on it)
     "...."],  // z 14: clear, the ladder foot beside it
  ]);

  // y 2: candles lit on the barrel tops (warm light at the bench and the leaf store)
  const candle = ["candle", { candles: "4", lit: "true", waterlogged: "false" }];
  layers(g, [64, 2, 10], { c: candle }, [
    ["c..c",
     "....",
     "....",
     "...c",
     "...."],
  ]);

  // a hanging lantern under the west tier pole, for the room's height
  g.set(64, 4, 12, "lantern", { hanging: "true", waterlogged: "false" });
}

// Room: Schlafkammer (bedroom), inner air box [9,7,15,15,10,21]. Entered through the doorway (11..12,7..8,14) from the Stube.
// Quiet bedroom: red bed with its head to the back wall under the back windows, chest at the foot, a barrel nightstand
// with a lit candle, a bookshelf wall on the east side with a tulip pot, a brown rug, a water cauldron in the NE corner,
// and two hanging lanterns under the attic floor. Cells left blank ("."/" ") are not written: the stair rail (9,7,15..17)
// and the attic stair up the x=10 column (10,7..11,17..21) belong to the shell, so the rug keeps to x=11 and the
// nightstand stands at (13,7,21) on the far side of the bed head.
// Plan: floor y=7 (origin [9,7,15], rows along +z from z=15, columns along +x from x=9), layers y=7..10.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  layers(g, [9, 7, 15], {
    "b": ["red_bed", { facing: "south", part: "foot" }],
    "h": ["red_bed", { facing: "south", part: "head" }],
    "c": ["chest", { facing: "north" }],
    "n": ["barrel", { facing: "up", open: "false" }],
    "k": ["candle", { candles: "1", lit: "true" }],
    "s": "bookshelf",
    "p": "potted_red_tulip",
    "r": "brown_carpet",
    "w": ["water_cauldron", { level: "3" }],
    "l": ["lantern", { hanging: "true" }],
  }, [
    // y=7: floor furniture
    [
      " .....w", // z=15
      "  r....", // z=16
      "  r....", // z=17
      "..r...s", // z=18
      "...c..s", // z=19
      " ..b...", // z=20
      " ..hn..", // z=21 (head against the back wall z=22; nightstand barrel at (13,7,21))
    ],
    // y=8: candle on the nightstand, shelf second course
    [
      "       ",
      "       ",
      "       ",
      "      s",
      "      s",
      "       ",
      "    k  ",
    ],
    // y=9: flower pot on the shelf
    [
      "       ",
      "       ",
      "       ",
      "      p",
      "       ",
      "       ",
      "       ",
    ],
    // y=10: hanging lanterns under the attic floor
    [
      "       ",
      "  l    ",
      "       ",
      "l      ",
      "     l ",
      "       ",
      "       ",
    ],
  ]);
}

// Room "P2 loft east bedroom" (interior designer's part): Bedroom by the dormer, one bed. Inner air x42..43, z14..18,
// feet y6. The door is on the west partition (x41, z16); the stair lane is east at x44 (the stair joiner's). The bed
// lies along the west partition with its head against it at z14, away from the doorway. Lanes: x43 z15..16 from the
// door to the bed; the door's first cell (42,16) stays clear. Light: one lantern on a barrel by the bed, one lit candle
// on the chest.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // the bed: foot at (43,6,14), head at (42,6,14) against the west partition, facing west
  bed(g, [43, 6, 14], "west", "red");

  // floor layer y6: barrel (bedside), chest (dresser), potted poppy, red rug
  layers(g, [42, 6, 14], {
    "B": ["barrel", { facing: "up", open: "false" }],
    "C": ["chest", { facing: "east", type: "single" }],
    "P": "potted_poppy",
    "R": "red_carpet",
  }, [
    ["  ", "B ", "  ", "CR", "PR"],
  ]);

  // layer y7 (on the furniture's top faces): standing lantern on the barrel, lit candle on the chest
  layers(g, [42, 7, 14], {
    "L": ["lantern", { hanging: "false" }],
    "c": ["candle", { candles: "1", lit: "true" }],
  }, [
    ["  ", "L ", "  ", "c ", "  "],
  ]);
}

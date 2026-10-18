// Room "P3 rear bedroom" (interior designer's part): one bed on the east wall (the focal piece, opposite the west door),
// a barrel-and-chest dresser along the north partition, a lantern on the barrels, a candle on the chest, and a flower
// pot on a barrel. The floor layer is y6 (the room box's floor), so the furniture stands at y6 and the things on top at
// y7. The walk lane is the middle row z19 from the door to the bed. The roof's lower slope takes the back-west corner
// (x58, z20) at y6..7, so no nightstand stands there.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // the bed: foot at (59,6,20), head at (60,6,20) against the east wall x61; facing east
  bed(g, [59, 6, 20], "east", "red");

  // floor layer y6, origin (58,6,18): x58..60, z18..20
  //   z18: barrel, barrel, chest (facing south into the room)
  //   z19: lane (air)
  //   z20: foot and head of the bed (already placed); x58 is the roof's, left alone
  layers(g, [58, 6, 18], {
    "b": "barrel",
    "c": ["chest", { facing: "south" }],
  }, [
    ["bbc", "   ", "   "],
  ]);

  // top layer y7: the flower pot on the barrel, a standing lantern on the middle barrel, the candle on the chest
  layers(g, [58, 7, 18], {
    "p": "flower_pot",
    "k": ["candle", { candles: "1", lit: "true" }],
    "l": ["lantern", { hanging: "false" }],
  }, [
    ["plk", "   ", "   "],
  ]);
}

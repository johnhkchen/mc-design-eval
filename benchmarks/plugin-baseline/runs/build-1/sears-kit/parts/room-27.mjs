// Room "P3 west bedroom" (interior designer's part). Box x52..54, z14..20, feet y6, clear to y8.
// Two beds with their heads on the west wall (x52, against x51), foot cells at x53 facing west. The bed row runs
// north to south at z14 and z15. A three-barrel dresser runs down the west wall at z16..18. A bedside table (spruce
// fence post with a top slab) and a stair chair sit at z19 by the window pair; a lantern stands on the barrel at z16 and
// a lit candle on the barrel at z17, so the north end of the room is lit (the cell above the table is roof, no lamp).
// The x54 column is the 1-wide lane from
// the door (on the east wall) to both beds, so nothing stands on it.
import { bed, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [52, 6, 14];

export function build(g) {
  // the two beds: foot at x53, head at x52 (one step west, the pillow end against the solid west wall)
  bed(g, [53, 6, 14], "west", "red");
  bed(g, [53, 6, 15], "west", "blue");

  // floor layer (feet y6): barrels down the west wall, the stair chair and the table post at z19
  layers(g, ORIGIN, {
    "B": "barrel",
    "C": ["spruce_stairs", { facing: "west", half: "bottom", shape: "straight" }],
    "F": "spruce_fence",
  }, [
    ["   ", "   ", "B  ", "B  ", "B  ", "CF ", "   "],
  ]);

  // second layer (y7): the candle on the middle barrel, the table top slab
  layers(g, [52, 7, 14], {
    "c": ["candle", { candles: "4", lit: "true" }],
    "l": ["lantern", { hanging: "false" }],
    "T": ["spruce_slab", { type: "top" }],
  }, [
    ["   ", "   ", "l  ", "c  ", "   ", " T ", "   "],
  ]);

}

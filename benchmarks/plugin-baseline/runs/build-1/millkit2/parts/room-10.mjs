// Part: room: I-house east room. Dining/kitchen, inside the box x32..33, y3..6, z10..15 (door x31 z14 from the hall).
// The lane is the x32 column, kept clear from the door to the stove. Furniture stands in the x33 column: barrels by the
// window, a water cauldron, the stove on the chimney wall (z12), one chair, and a two-cell table at the south end.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hearth_nook, hanging_lantern } from "../vocab.mjs";

const LEGEND = {
  B: "barrel",
  W: ["water_cauldron", { level: "3" }],
  C: ["spruce_stairs", { facing: "south", half: "bottom", shape: "straight" }],
  T: "spruce_fence",
  S: ["spruce_slab", { type: "top" }],
};

export function build(g) {
  // Floor row (y3): one column per x (32, 33), one row per z (10..15). '.' = leave the cell alone (the lane).
  layers(g, [32, 3, 10], LEGEND, [
    [".B", ".W", "..", ".C", ".T", ".T"],
  ]);
  // Stove: a lit furnace at x33 z12 on the chimney wall, its stone mantle above (hearth_nook writes both cells).
  hearth_nook(g, 33, 3, 12, "west");
  // Table top row (y4) over the table legs at x33 z14..15, and a second barrel stacked on the first.
  layers(g, [32, 4, 10], LEGEND, [
    [".B", "..", "..", "..", ".S", ".S"],
  ]);
  // Lanterns hang from the ceiling (y7): one over the lane by the stove, one over the table.
  hanging_lantern(g, 32, 6, 12);
  hanging_lantern(g, 33, 6, 14);
}

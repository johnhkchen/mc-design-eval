// room: C bedrooms (interior designer): the C second-floor bedroom, inner air [20,13,13,26,16,23].
// Furnished from the plan's floor grid (origin [20,13,13]: x 20..26, z 13..23). The stair well x20..21 z19..23 stays
// clear (the stair joiner's flight and its foot at z=19). Focal piece: the dressing table on the north wall, lit by a
// standing lantern. Palette gap: no bed (or carpet, candle, barrel) is in palette.json, so the room has no bed yet.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  F: "spruce_fence",                              // table legs
  S: ["spruce_slab", { type: "top" }],            // table top, the stool top and the side table top
  c: ["spruce_stairs", { facing: "south" }],       // chair, back to the south, seat facing the table
  L: ["lantern", { hanging: "false" }],           // standing lantern on the table (the focal light)
  H: ["lantern", { hanging: "true" }],            // ceiling lanterns under the attic floor
  P: "potted_poppy",                              // flowers on the tables
  W: "dark_oak_planks",                           // wardrobe block against the east wall
};

// y=13 (floor level): table legs, chair, wardrobe, side-table leg
const FLOOR = [
  "...FF..", // z13: dressing table legs at x23..24, against the north wall
  "...c...", // z14: chair facing the table
  ".......", // z15: clear, in front of the east side window
  "......W", // z16: wardrobe against the east wall
  "......W", // z17
  ".......", // z18
  ".......", // z19: the stair well's foot row, kept clear
  ".......", // z20: stair well x20..21, kept clear
  ".......", // z21
  "....F..", // z22
  ".......", // z23
];
// y=14: table tops, wardrobe, side-table top
const MID = [
  "...SS..",
  ".......",
  ".......",
  "......W",
  "......W",
  ".......",
  ".......",
  ".......",
  ".......",
  "....S..",
  ".......",
];
// y=15: lantern and flowers on the tables, wardrobe top
const TOP = [
  "...LP..",
  ".......",
  ".......",
  "......W",
  "......W",
  ".......",
  ".......",
  ".......",
  ".......",
  "....P..",
  ".......",
];
// y=16: ceiling lanterns, hung from the attic floor
const CEIL = [
  ".....H.",
  ".......",
  ".......",
  ".......",
  "..H....",
  "......H", // z19: over the east wall, lifts the dim cells at the wardrobe end
  ".......",
  ".......",
  "...H...", // z21: over the south-east corner, clear of the stair well
  "......H", // z22: over the east wall, lifts the south-east corner
  ".......",
];

export function build(g) {
  layers(g, [20, 13, 13], LEGEND, [FLOOR, MID, TOP, CEIL]);
}

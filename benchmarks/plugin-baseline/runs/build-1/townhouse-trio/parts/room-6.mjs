// room: B drawing room (interior designer): the first-floor salon of B, inner air [12,8,13,18,11,23].
// Focal piece: a table on the axis of the French door (15,8..9,12), with seats around it and a lantern hung over it.
// Settee under the windows (z=13), a log sideboard on the east wall with pots, a card table in the south-east corner.
// The stair well x12..13 z20..23 and the chimney masonry at x12/x18 z18..19 stay clear (other parts own them).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Floor grid origin [12, 8, 13]: rows run along +z (z=13..23), columns along +x (x=12..18).
const LEGEND = {
  N: ["spruce_stairs", { facing: "north", half: "bottom", shape: "straight" }], // settee: back to the window wall
  W: ["spruce_stairs", { facing: "west", half: "bottom", shape: "straight" }], // chair west of a table
  E: ["spruce_stairs", { facing: "east", half: "bottom", shape: "straight" }], // chair east of a table
  F: "spruce_fence", // table legs
  C: "oak_log", // sideboard
  T: ["spruce_slab", { type: "top" }], // table tops (sit on the fence top)
  P: "potted_poppy",
  Q: "potted_cornflower",
  L: ["lantern", { hanging: "true" }],
};

const LAYERS = [
  // y=8: seating, tables, sideboard
  [
    ".NN.NN.", // z13: settee under the windows, the French door cell (15,13) left clear
    "......C", // z14
    "......C", // z15
    "..WFE.C", // z16: focal table at (15,16), chairs W and E
    ".......", // z17: south side of the table left open
    ".......", // z18: chimney masonry at x12/x18 is not ours
    ".......", // z19
    ".......", // z20: stair well x12..13 is not ours
    ".......", // z21
    "..WFE..", // z22: card table at (15,22)
    ".......", // z23
  ],
  // y=9: table tops, pots on the sideboard
  [
    ".......",
    "......P", // pot on the sideboard (18,9,14)
    ".......",
    "...T..Q", // table top (15,9,16), pot on the sideboard (18,9,16)
    ".......",
    ".......",
    ".......",
    ".......",
    ".......",
    "...T...", // card table top (15,9,22)
    ".......",
  ],
  // y=10: the focal flower
  [
    ".......",
    ".......",
    ".......",
    "...P...", // potted poppy on the table top (15,10,16)
    ".......",
    ".......",
    ".......",
    ".......",
    ".......",
    ".......",
    ".......",
  ],
  // y=11: lanterns hung from the floor above
  [
    "......L", // (18,11,13) corner, hanging from the ceiling at y=12
    ".L.....", // (13,11,14) hanging from the ceiling at y=12
    ".......",
    "...L...", // chandelier over the focal table (15,11,16)
    ".......",
    ".......",
    ".....L.", // (17,11,19) lifts the south-east corner
    ".......",
    ".......",
    "...L...", // over the card table (15,11,22)
    ".......",
  ],
];

export function build(g) {
  layers(g, [12, 8, 13], LEGEND, LAYERS);
}

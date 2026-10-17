// Part: room: gin wagon bay (interior of plot 0's grade-floor wagon bay, inner air x 2..9, y 1..5, z 10..12).
// Focal piece: the cotton bale stack on the west wall (hay pallets, white cotton on top), seen from the wagon door.
// East: the ginner's tally desk (fence + top slab), a chair as stairs, barrels of seed cotton. The wagon lane x 4..7
// stays clear from the door to the machine-room opening. Two hanging lanterns from the loft floor light the room.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [2, 1, 10];

// Floor y1 (stand level): bales west, tally desk and barrels east, the lane open.
const Y1 = [
  "hh    bb", // z10
  "hh    fc", // z11: fence post = desk leg, stairs = chair facing the desk
  "hh    bb", // z12
];

// Y2: cotton on top of the west bales (x3 only, so the window cell x2 at y2..3 stays open); the desk top slab at x8.
const Y2 = [
  " w      ", // z10
  " w    s ", // z11
  " w      ", // z12
];

// Y3: a candle on the desk top.
const Y3 = [
  "        ", // z10
  "      k ", // z11
  "        ", // z12
];

// Y5: hanging lanterns from the loft floor (y6), one over the bales, one over the desk.
const Y5 = [
  "        ", // z10
  " l    l ", // z11
  "        ", // z12
];

export function build(g) {
  const legend = {
    h: "hay_block",
    w: "white_concrete",
    b: "barrel",
    f: "spruce_fence",
    s: ["spruce_slab", { type: "top" }],
    c: ["spruce_stairs", { facing: "east", half: "bottom" }],
    k: ["candle", { candles: "2", lit: "true" }],
    l: ["lantern", { hanging: "true" }],
  };
  layers(g, ORIGIN, legend, Y1);
  layers(g, [ORIGIN[0], 2, ORIGIN[2]], legend, Y2);
  layers(g, [ORIGIN[0], 3, ORIGIN[2]], legend, Y3);
  layers(g, [ORIGIN[0], 5, ORIGIN[2]], legend, Y5);
}

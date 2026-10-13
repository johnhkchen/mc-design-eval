// Part: room: guest bedroom (plan.md ROOMS: Bedroom 8, ground floor, inner air x27..32 z54..60, y4..9).
// Door from the west corridor on the north wall (z53, x29..30); a second way in on the east wall (x33, z56..57).
// The bed is the focal piece, against the south wall opposite the north door. A chest dresser on the west wall, a
// barrel wardrobe on the east wall, a side table with a chair by the window, a red rug, and one hanging lantern.
// Lanes kept clear: x29..30 from z54 to the bed, and x32 z56..57 from the east door.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Rows run along +z (z54..60), columns along +x (x27..32). '.' is left as it is.
const LEGEND = {
  c: ["chest", { facing: "east" }],
  b: "barrel",
  f: "dark_oak_fence",
  T: ["dark_oak_slab", { type: "top" }],
  s: ["dark_oak_stairs", { facing: "west", half: "bottom" }],
  r: "red_carpet",
  k: ["candle", { candles: "2", lit: "true" }],
  L: ["lantern", { hanging: "false" }],
  h: ["lantern", { hanging: "true" }],
  i: ["iron_chain", { axis: "y" }],
  p: "flower_pot",
};

// Layers y4..y9 (index 0..5), each 7 rows (z54..z60) of 6 columns (x27..x32).
const LAYERS = [
  // y4: floor objects
  [
    "c....b", // z54: chest dresser (west), barrel (east)
    ".....b", // z55
    "fs....", // z56: table fence, chair facing west
    "..rrr.", // z57: rug
    "..rrr.", // z58
    "......", // z59
    "b...L.", // z60: barrel under the flower pot, bedside lantern on the floor
  ],
  // y5: things on top faces
  [
    "k....L", // z54: candle on the chest, standing lantern on the barrel
    "......",
    "T.....", // z56: top slab table top
    "......",
    "......",
    "......",
    "p.....", // z60: flower pot on the barrel
  ],
  // y6
  [
    "......",
    "......",
    "L.....", // z56: table lantern on the slab
    "......",
    "......",
    "......",
    "......",
  ],
  // y7
  ["......", "......", "......", "......", "......", "......", "......"],
  // y8
  ["......", "......", "......", "...h..", "......", "......", "......"], // z57: hanging lantern
  // y9
  ["......", "......", "......", "...i..", "......", "......", "......"], // z57: chain to the upper floor
];

// The shell leaves this room unclaimed, so the furniture and the bed are placed.
export function build(g) {
  layers(g, [27, 4, 54], LEGEND, LAYERS);
  // The bed: foot at (30, 4, 59), head one step south at (30, 4, 60), against the south wall.
  bed(g, [30, 4, 59], "south", "red");
}

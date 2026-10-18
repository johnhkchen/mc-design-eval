// Room "P1 living room" (interior designer's part). Plain stucco living room: a spruce sofa on the west wall facing east,
// a coffee table and side table, a red rug, a shelf of pots on a barrel in the north-west corner, and hanging lanterns.
// The focal piece is the sofa, set where the cased opening from the hall looks. Lanes: x21 stays clear for the whole
// depth, so the opening at x22 leads straight across the room to the sofa.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [19, 2, 14];

const LEGEND_FLOOR = {
  // sofa seats: stairs with their full-height back on the west wall, seats facing east into the room
  S: ["spruce_stairs", { facing: "west", half: "bottom", shape: "straight" }],
  // coffee and side tables: spruce fence posts (the table legs)
  F: "spruce_fence",
  // rug
  C: "red_carpet",
  // shelf of pots: a barrel as the stand
  B: "barrel",
};

const LEGEND_TOP = {
  // table tops: pressure plates on the fence posts
  Q: "spruce_pressure_plate",
  // pot on the shelf barrel
  P: "potted_poppy",
};

const LEGEND_LIGHT = {
  // hanging lanterns from the ceiling block
  L: ["lantern", { hanging: "true" }],
};

// rows run along +x (x19, x20, x21), successive rows along +z (z14..z20)
const FLOOR_ROWS = [
  "B..", // z14: barrel shelf, north-west corner
  "SC.", // z15: sofa seat, rug
  "SC.", // z16: sofa seat, rug
  "FF.", // z17: side table (west), coffee table (middle)
  "CC.", // z18: rug
  "CC.", // z19: rug
  "B..", // z20: barrel stand
];

const TOP_ROWS = [
  "P..", // z14: pot on the barrel
  "...", // z15
  "...", // z16
  "QQ.", // z17: table tops
  "...", // z18
  "...", // z19
  "...", // z20
];

const LIGHT_ROWS = [
  "...", // z14
  "...", // z15
  "L..", // z16: lantern over the sofa, the focal point
  "...", // z17
  "...", // z18
  ".L.", // z19: lantern over the rug, the room's second light
  "...", // z20
];

// the room's floor layer (feet y2), then the table tops (y3), then the hanging lanterns (y4)
// Not written yet: runParts locks every cell an earlier part wrote, air included, and shell west wrote air over the
// whole room volume (x19..21, y2..4, z14..20). Every write below was refused, so the rows stay as the design until the
// shell leaves the interior open for the rooms, and the layers are called again then.
export function build(g) {
  // lamplighter: the two hanging lanterns from the design (the sofa lantern and the rug lantern), under the upper floor
  // block at y5. Air only: a refused write is reported by runParts, never forced.
  g.set(19, 4, 16, ...B.lantern(true));
  g.set(20, 4, 19, ...B.lantern(true));
}

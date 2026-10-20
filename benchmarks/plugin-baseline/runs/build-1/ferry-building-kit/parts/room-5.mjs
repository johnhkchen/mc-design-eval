// Room: clock room (interior designer's part). The bare tower room behind the four dials, lit by their glowstone and by
// lanterns standing on barrel side tables. The ladder comes up at x18 z8 (landing cell 18,57,8, its column is not
// touched). Focal piece: the clockmaker's bench along z8 (barrels, a bell, a lantern), with one stool.
// The plan grid origin is [16, 57, 1]: rows run along +z from z 1, columns along +x from x 16. Layer 0 is the floor
// course y 57, layer 1 is y 58 (what stands on the barrels).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [16, 57, 1];

const LEGEND = {
  B: "barrel",                                                     // full block: side tables and bench
  C: ["quartz_stairs", { facing: "west", half: "bottom", shape: "straight" }],   // stool facing the bench
  G: ["bell", { attachment: "floor", facing: "south" }],           // the clock-maker's bell on the bench
  L: ["lantern", { hanging: "false" }],                            // standing lanterns on barrel tops
};

// y 57: barrels and the stool (rows z 1..15, columns x 16..30)
const FLOOR = [
  "               ",   // z 1 wall
  "               ",   // z 2
  "               ",   // z 3
  "               ",   // z 4
  "    B     B    ",   // z 5: side tables at x 20 and x 26
  "               ",   // z 6
  "               ",   // z 7
  "       CBBBB   ",   // z 8: stool x 23, bench barrels x 24..27 (ladder landing x 18 stays clear)
  "               ",   // z 9
  "               ",   // z 10
  "    B     B    ",   // z 11: side tables
  "               ",   // z 12
  "            BB ",   // z 13: storage barrels x 28, 29
  "               ",   // z 14
  "               ",   // z 15 wall
];

// y 58: what stands on the barrels
const TOPS = [
  "               ",
  "               ",
  "               ",
  "               ",
  "    L     L    ",   // lanterns over the side tables
  "               ",
  "               ",
  "         G L   ",   // bell on the bench at x 25, lantern at x 27
  "               ",
  "               ",
  "    L     L    ",
  "               ",
  "               ",
  "               ",
  "               ",
];

export function build(g) {
  layers(g, ORIGIN, LEGEND, [FLOOR, TOPS]);
}

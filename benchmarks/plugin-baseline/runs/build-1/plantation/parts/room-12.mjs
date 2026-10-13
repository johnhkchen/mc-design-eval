// Part: room: kitchen. Interior of the kitchen box x48..57 x z62..74, floor row y4 (the shell's floor is y3).
// Layout (x across, z down): the focal range (smoker, furnace, cauldron sink, barrel) on the east wall under the
// east window, a smooth_stone work counter along x56, a central work island x50..52 z68..69, a sink counter under
// the south windows, and barrels by the rear door. Lanes stay clear from the north openings (z61) to the rear door
// (x48 z75) and across the room to the west opening (x47). Light: three lanterns hung from chains under the ceiling
// (y10) plus the lit smoker and furnace.
import { B, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [48, 4, 62]; // x48, floor row y4, z62; rows run along +z, columns along +x

// y4: floor-standing pieces
const Y4 = [
  ".........B", // z62: barrel in the north-east corner
  "........#S", // z63: counter, smoker on the east wall
  "........#F", // z64: counter, furnace
  "........#C", // z65: counter, cauldron sink under the east window
  "........#B", // z66: counter, barrel
  "..........", // z67
  ".L###....L", // z68: standing lanterns by the island (x49) and on the east wall (x57); island x50..52
  "..###.....", // z69
  "..........", // z70
  "..........", // z71
  "..........", // z72
  ".B..##....", // z73: barrel, sink counter under the south window (x54..55)
  ".L........", // z74: lantern in the south-west corner; x48 stays clear in front of the rear door
];
const LEGEND4 = {
  S: ["smoker", { facing: "west", lit: "true" }],
  F: ["furnace", { facing: "west", lit: "true" }],
  C: "cauldron",
  B: "barrel",
  "#": "smooth_stone",
  L: ["lantern", { hanging: "false" }],
};

// y5: things standing on the counter tops and island (standing lanterns sit on the counter and island blocks)
const Y5 = [
  "..........",
  "........f.", // z63: flower pot on the counter (herb pot)
  "........L.", // z64: standing lantern on the counter (lights the range and the sink)
  "........k.", // z65: lit candle on the sink counter
  "..........",
  "..........",
  "..f.......", // z68: flower pot on the island
  "..L.k.....", // z69: standing lantern on the island (x50), lit candle (x52)
  "..........",
  "..........",
  "..........",
  "..........",
  "..........",
];
const LEGEND5 = {
  f: "flower_pot",
  k: ["candle", { candles: "3", lit: "true" }],
  L: ["lantern", { hanging: "false" }],
};

// y8 and y9: two hanging lanterns, each on an iron_chain from the ceiling (y10). One over the sink (x55 z64),
// one over the island (x51 z69). Lanterns hang at y8 under the chain cell at y9.
const Y8 = [
  "..........",
  "..........",
  ".......l..", // z64: lantern over the sink (x55)
  "..........",
  "..........",
  "..........",
  "..........",
  "...l......", // z69: lantern over the island (x51)
  "..........",
  "..........",
  "..........",
  "..........",
  "..........",
];
const Y9 = [
  "..........",
  "..........",
  ".......i..", // z64: chain up to the ceiling
  "..........",
  "..........",
  "..........",
  "..........",
  "...i......", // z69: chain
  "..........",
  "..........",
  "..........",
  "..........",
  "..........",
];

const LEGEND_HANG = {
  l: ["lantern", { hanging: "true" }],
  i: ["iron_chain", { axis: "y" }],
};

// The shell leaves the kitchen unclaimed, so the layout above is placed.
export function build(g) {
  layers(g, ORIGIN, LEGEND4, [Y4]);
  layers(g, [48, 5, 62], LEGEND5, [Y5]);
  layers(g, [48, 8, 62], LEGEND_HANG, [Y8]);
  layers(g, [48, 9, 62], LEGEND_HANG, [Y9]);
  // Lamplighter: one lantern hung from the upper floor (y10) over the north lane lifts the floor cells to 8+.
  g.set(49, 9, 62, ...B.lantern(true));
}

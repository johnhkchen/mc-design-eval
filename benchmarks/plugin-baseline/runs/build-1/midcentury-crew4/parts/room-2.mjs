// ROOM kitchen (interior designer): galley kitchen along the north wall (z=9), breakfast bar on z=12 with stools on z=13,
// the open south side to dining. Inner air box [11,2,9,15,4,13]; floor origin [11,2,9] (plan.md ROOMS, the kitchen plan).
//   - ways in: gallery doorway x=16 z=9..10 (the lane z=10 stays clear), utility door x=10 z=10 (lane z=10 again),
//     dining opening along z=13/14 (the bar's gap at x=13 lets the walker through to the stools' side).
//   - galley: counter on z=9 (counter, furnace hob at x=12, cauldron sink at x=14, iron_block fridge at x=15 two high),
//     spruce_trapdoor cabinets on the wall side at y=4 (x=11..14), a potted cactus and a flower pot on the worktop.
//   - bar: spruce fence legs at x=11, 12, 14, 15, spruce_slab top on z=12 except the gap at x=13; birch_slab stools on z=13.
//   - orange_carpet runner on z=11 (the accent); one hanging lantern over the lane at (13,4,11) hung from the beam.
// Each layer is drawn as text: rows along +x (x=11..15), successive rows along +z (z=9..13).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [11, 2, 9];

const LEGEND = {
  C: "white_concrete",
  F: ["furnace", { facing: "south", lit: "false" }],
  K: "cauldron",
  I: "iron_block",
  R: "orange_carpet",
  S: "spruce_fence",
  L: ["spruce_slab", { type: "bottom" }],
  B: ["birch_slab", { type: "bottom" }],
  T: ["spruce_trapdoor", { facing: "north", half: "top", open: "true" }],
  P: "potted_cactus",
  f: "flower_pot",
  H: ["lantern", { hanging: "true" }],
};

// y=2 floor: counter and fridge on the north wall, carpet runner, bar legs, stools
const FLOOR = [
  "CFCKI", // z=9 counter: white, hob, white, sink, fridge
  ".....", // z=10 lane from the gallery and the utility door
  ".RRR.", // z=11 orange runner
  "SS.SS", // z=12 bar legs (the gap at x=13 is the way through)
  "B.B.B", // z=13 stools
];

// y=3: worktop objects, fridge top, bar top
const WORK = [
  "P.f.I", // z=9 potted cactus, flower pot, fridge top
  ".....",
  ".....",
  "LL.LL", // z=12 bar top with the gap
  ".....",
];

// y=4: cabinets over the counter, the hanging lantern
const UPPER = [
  "TTTT.", // z=9 spruce trapdoor cabinets
  ".....",
  "..H..", // z=11 lantern at x=13
  ".....",
  ".....",
];

export function build(g) {
  return layers(g, ORIGIN, LEGEND, [FLOOR, WORK, UPPER]);
}

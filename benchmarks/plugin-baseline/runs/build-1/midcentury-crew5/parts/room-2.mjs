// ROOM kitchen (interior designer): galley along the north wall (z=9), a white counter with a sink, hob and oven,
// a fridge at the west end, spruce cabinets above, and a breakfast bar with birch-stair stools on its south side (z=12..13).
// Box [11,2,9,15,4,13]. Lanes stay open: x=15 z=9..10 (gallery), z=10 across the room (utility door at x=10 to the
// aisle), and x=11 / x=15 along z=11..13 (dining opening at z=14). Light: two hung lanterns from the beams.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hung_lantern } from "../vocab.mjs";

const X0 = 11, Y0 = 2, Z0 = 9;

const LEGEND = {
  F: "iron_block",                                   // fridge (y=2..3)
  c: "white_concrete",                               // counter block and bar base
  u: ["cauldron", {}],                               // sink on the counter
  h: ["furnace", { facing: "south", lit: "false" }], // hob
  m: ["smoker", { facing: "south", lit: "false" }],  // oven
  T: ["spruce_trapdoor", { facing: "south", half: "top", open: "false" }], // upper cabinets
  q: ["smooth_quartz_slab", { type: "bottom" }],     // bar cap
  S: ["birch_stairs", { facing: "south", half: "bottom" }], // stools (back to the south, face the bar)
  o: "orange_carpet",                                // orange rug accent
};

// rows run along +x (x=11..15), successive rows along +z (z=9..13)
const LAYERS = [
  // y=2: floor-level layer
  [
    "Fccc.",  // z=9: fridge, counter with sink, hob, oven; lane at x=15
    ".....",  // z=10: aisle from the utility door to the gallery
    "..o..",  // z=11: orange rug
    ".ccc.",  // z=12: breakfast bar base
    ".S.S.",  // z=13: stools
  ],
  // y=3: counter tops and the fridge top
  [
    "Fuhm.",  // z=9: fridge top; cauldron, furnace, smoker on the counter
    ".....",
    ".....",
    ".qqq.",  // z=12: bar cap
    ".....",
  ],
  // y=4: cabinets under the ceiling
  [
    ".....",
    ".TTT.",  // z=9: upper spruce cabinets over the counter
    ".....",
    ".....",
    ".....",
  ],
];

export function build(g) {
  let n = layers(g, [X0, Y0, Z0], LEGEND, LAYERS);
  // hung lanterns under the beams: over the aisle and over the bar
  n += hung_lantern(g, 13, 4, 10);
  n += hung_lantern(g, 11, 4, 12);
  n += hung_lantern(g, 15, 4, 10); // by the gallery opening, lifts the dim corner
  return n;
}

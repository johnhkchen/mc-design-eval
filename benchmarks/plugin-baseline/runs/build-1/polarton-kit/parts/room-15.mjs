// Part: room: granary (interior designer). Box x78..81, y2..6, z10..15; entered from the double door at z9.
// Layout by use: the lane x78..79 stays clear from the door to the back wall (and to the composter's front at (78,2,14),
// which the hearths part sets at (78,2,15)). East half: sacks on the wall, barrels for storage, a stool by the scale.
// Focal piece: the scale on the back wall (pan on a cobblestone pillar), under the brightest lantern. Two lanterns hang
// from two ceiling beams at y6.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  H: "hay_block",                                  // sacks
  B: ["barrel", { facing: "up", open: "false" }],  // storage barrels
  S: ["bamboo_stairs", { facing: "north", half: "bottom", shape: "straight" }], // stool (seat)
  P: "cobblestone",                                // scale pillar
  Q: "stone_pressure_plate",                       // scale pan
  L: ["lantern", { hanging: "true" }],
  T: ["stripped_oak_log", { axis: "x" }],          // ceiling beam
};

// Rows run along +x (x78..81), successive rows along +z (z10..15). '.' is left as it is.
const ROWS = {
  y2: [
    "..BH", // z10
    "..BH", // z11
    "...B", // z12 (under the east window)
    "..SB", // z13
    "...B", // z14 (the composter's front cell x78 stays clear)
    "..PH", // z15 (scale pillar, sack by it)
  ],
  y3: [
    "...H", // z10 sacks, two high
    "...H", // z11
    "....", // z12
    "....", // z13
    "....", // z14
    "..Q.", // z15 scale pan
  ],
  y4: ["....", "....", "....", "....", "....", "...."],
  y5: [
    "....",
    ".L..", // z11 lantern under the beam
    "....",
    "....",
    "..L.", // z14 lantern under the beam, over the scale
    "....",
  ],
  y6: [
    "....", // z10 (the door's inside cell stays open to the beams)
    "TTTT", // z11 beam
    "....",
    "....",
    "TTTT", // z14 beam
    "....",
  ],
};

export function build(g) {
  layers(g, [78, 2, 10], LEGEND, [ROWS.y2, ROWS.y3, ROWS.y4, ROWS.y5, ROWS.y6]);
}

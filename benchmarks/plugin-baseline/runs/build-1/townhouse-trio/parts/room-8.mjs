// room: B third floor (interior designer): a library and study under three tall windows. A desk on the centre line
// with a chair and a standing lantern, bookcases round the walls (planks with a slab shelf), a lounge pair in the
// south-east corner. Lanterns hang from the ceiling. The stair well (x12..13, z20..23) and the chimney cells stay clear.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// K planks (bookcase), T bottom slab (shelf, table top, window seat), F fence (table leg), C/A/E stairs as chairs
// (C back south, A back west, E back east), L hanging lantern, S standing lantern. '#' and '.' are left alone.
const LEGEND = {
  K: "spruce_planks",
  T: ["spruce_slab", { type: "bottom" }],
  F: "spruce_fence",
  C: ["spruce_stairs", { facing: "south", half: "bottom" }],
  A: ["spruce_stairs", { facing: "west", half: "bottom" }],
  E: ["spruce_stairs", { facing: "east", half: "bottom" }],
  L: ["lantern", { hanging: "true" }],
  S: ["lantern", { hanging: "false" }],
};

// Origin [12, 18, 13]: x12..18 across, z13..23 down. One list per storey (y18..21).
const Y18 = [
  "KTKTKTK",
  "K.....K",
  "K.FF..K",
  "K..C..K",
  "K.....K",
  "#.....#",
  "#.....#",
  "##.....",
  "##.....",
  "##..AFE",
  "##.....",
];
const Y19 = [
  "K.K.K.K",
  "K.....K",
  "K.TT..K",
  "K.....K",
  "K.....K",
  "#.....#",
  "#.....#",
  "##.....",
  "##.....",
  "##...T.",
  "##.....",
];
const Y20 = [
  "T.T.T.T",
  "T.....T",
  "T..S..T",
  "T.....T",
  "T.....T",
  "#.....#",
  "#.....#",
  "##.....",
  "##.....",
  "##.....",
  "##.....",
];
const Y21 = [
  ".......",
  ".L...L.",
  ".......",
  ".......",
  ".......",
  "#.....#",
  "#..L..#",
  "##.....",
  "##.....",
  "##...L.",
  "##.....",
];

export function build(g) {
  layers(g, [12, 18, 13], LEGEND, [Y18, Y19, Y20, Y21]);

  // Lamplighter: the ceiling of this floor is the roof-deck slab at y=23, not y=22. Each of the four hanging lanterns
  // at y=21 gets an iron chain at y=22 up to that slab, and the corner by the stair well (12,22,20) gets a lantern
  // hung straight from the slab (it lifts the two dim cells at x=12, z=21 and z=23 to 8+). Air only.
  for (const [x, z] of [[13, 14], [17, 14], [15, 19], [17, 22]]) g.set(x, 22, z, ...B.chain("y"));
  g.set(12, 22, 20, ...B.lantern(true));
}

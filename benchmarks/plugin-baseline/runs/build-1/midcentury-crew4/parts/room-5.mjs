// ROOM atrium (interior designer): the open-sky courtyard in the glass ring. Inner air box [17,1,12,21,4,17]; the floor is
// the shell's dirt at y=0, so feet stand at y=1. Doorways (19..20, z=11 and z=18) are reached at feet y=2 and step down.
// Layout: the 2-wide path (x=19..20) is stepping pads of smooth_stone at y=1 with dirt gaps, so the walk is clear at
// y=1..3. The west strip holds a grass patch, large ferns and a small jungle sapling (the focal piece, lit from above).
// The east strip holds a birch_stairs bench against the glass and potted cacti. Hung lanterns hang from the x=19 beam
// line; standing lanterns on the floor cover the corners. Drawn with layers(), one layer per y.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// origin = the first cell (x=17, y=1, z=12); rows run along +x (x=17..21), successive rows along +z (z=12..17)
const ORIGIN = [17, 1, 12];

const LEGEND = {
  g: "short_grass",
  f: ["large_fern", { half: "lower" }],
  u: ["large_fern", { half: "upper" }],
  P: "smooth_stone",
  c: "potted_cactus",
  l: ["lantern", { hanging: "false" }],
  h: ["lantern", { hanging: "true" }],
  b: ["birch_stairs", { facing: "east", half: "bottom", shape: "straight" }],
  T: ["jungle_log", { axis: "y" }],
  L: ["jungle_leaves", { persistent: "true" }],
};

// y=1: floor layer (feet of the floor-level walk, the stepping pads are the solid cells)
const Y1 = [
  "fgPP.",
  "lg..c",
  "ggPPb",
  "gT..b",
  "ggPP.",
  "cg..l",
];
// y=2: fern top, trunk
const Y2 = [
  "u....",
  ".....",
  ".....",
  ".T...",
  ".....",
  ".....",
];
// y=3: trunk and the crown's lower leaves (x=17..18 only, so the walk's head room over the pads at x=19 stays clear)
const Y3 = [
  ".....",
  ".....",
  "LL...",
  "LT...",
  "LL...",
  ".....",
];
// y=4: the crown, and the two hung lanterns on the x=19 beam line
const Y4 = [
  ".....",
  "..h..",
  "LLL..",
  "LLL..",
  "LLL..",
  "..h..",
];

export function build(g) {
  layers(g, ORIGIN, LEGEND, [Y1, Y2, Y3, Y4]);
}

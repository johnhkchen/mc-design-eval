// ROOM atrium (interior designer): an open-sky green court inside the glass ring. Inner air is x=17..21, z=12..17,
// y=1..4 (floor surface y=1, standing y=2). Grass planting at y=1, a 3-wide smooth_stone path x=18..20 between the two
// atrium door pairs (x=19..20 at z=11 and z=18), ferns and potted cacti at the corners, a spruce-stair bench on the west
// side facing the path, a small jungle tree as the focal piece on the east side, and three standing lanterns that
// light the court at night. Nothing sits over the doorways. Grid rows: origin [16,1,11], 7 columns (x=16..22, the
// first and last are the ring walls, '#'), 8 rows (z=11..18). Each layer is one y, from y=1 up to y=4.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const legend = {
  g: ["grass_block", {}],
  s: ["smooth_stone", {}],
  f: ["large_fern", { half: "lower" }],
  u: ["large_fern", { half: "upper" }],
  p: ["potted_cactus", {}],
  l: ["lantern", { hanging: "false" }],
  b: ["spruce_stairs", { facing: "east", half: "bottom", shape: "straight" }],
  T: ["jungle_log", { axis: "y" }],
  v: ["jungle_leaves", { persistent: "true" }],
};

// y=1: planting surface, the stepping path (x=18..20) in smooth_stone
const floor = [
  "#######",
  "#gsssg#",
  "#ggsgg#",
  "#gsssg#",
  "#ggsgg#",
  "#gsssg#",
  "#ggsgg#",
  "#######",
];

// y=2: player height: ferns, cacti, lanterns, the bench (two stairs facing east), the tree trunk
const low = [
  "#######",
  "#f...p#",
  "#l...l#",
  "#b....#",
  "#b...T#",
  "#....l#",
  "#f...p#",
  "#######",
];

// y=3: fern tops and the trunk
const mid = [
  "#######",
  "#u....#",
  "#.....#",
  "#.....#",
  "#....T#",
  "#.....#",
  "#u....#",
  "#######",
];

// y=4: the trunk top and a small canopy on the east side
const high = [
  "#######",
  "#.....#",
  "#.....#",
  "#...vv#",
  "#...vT#",
  "#...vv#",
  "#.....#",
  "#######",
];

export function build(g) {
  layers(g, [16, 1, 11], legend, [floor, low, mid, high]);
}

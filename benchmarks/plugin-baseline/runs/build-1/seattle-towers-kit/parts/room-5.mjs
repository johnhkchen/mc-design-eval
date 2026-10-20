// Room 5, KOMO E drum meeting room (interior designer): a glass round boardroom under the crown. Focal piece: the long
// table in the middle of the room (x 10..16, z 19..21), a quartz-stair chair on each side, four standing lanterns in the
// corners as the room's light. Drawn as text over the room's floor grid (origin [6, 39, 13], rows along +z, columns along +x).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [6, 39, 13];

// Floor level (y 39): table legs (fence posts), chairs (stairs facing the table), standing lanterns in the corners.
const FLOOR = [
  "...............",  // z 13
  ".L.............",  // z 14: lantern against the west wall (lifts the dim cells)
  "...............",  // z 15
  "..L.........L..",  // z 16: corner lanterns
  "...............",  // z 17
  "....N.N.N.N....",  // z 18: chairs on the north side, backs to the north
  "....F..F..F....",  // z 19: table legs
  "...WF..F..FE...",  // z 20: west and east chairs, middle legs
  "....F..F..F....",  // z 21: table legs
  "....Z.Z.Z.Z....",  // z 22: chairs on the south side, backs to the south
  "...............",  // z 23
  "..L.........L..",  // z 24: corner lanterns
  "...............",  // z 25
  ".L.............",  // z 26: lantern against the west wall (lifts the dim cells)
  "...............",  // z 27
];

// Table top (y 40): top quartz slabs over the table, x 10..16, z 19..21.
const TOP = [
  "...............",
  "...............",
  "...............",
  "...............",
  "...............",
  "...............",
  "....SSSSSSS....",
  "....SSSSSSS....",
  "....SSSSSSS....",
  "...............",
  "...............",
  "...............",
  "...............",
  "...............",
  "...............",
];

const LEGEND = {
  F: "oak_fence",
  S: ["smooth_quartz_slab", { type: "top" }],
  N: ["smooth_quartz_stairs", { facing: "north", half: "bottom", shape: "straight" }],
  Z: ["smooth_quartz_stairs", { facing: "south", half: "bottom", shape: "straight" }],
  W: ["smooth_quartz_stairs", { facing: "west", half: "bottom", shape: "straight" }],
  E: ["smooth_quartz_stairs", { facing: "east", half: "bottom", shape: "straight" }],
  L: ["lantern", { hanging: "false" }],
};

export function build(g) {
  layers(g, ORIGIN, LEGEND, [FLOOR, TOP]);
}

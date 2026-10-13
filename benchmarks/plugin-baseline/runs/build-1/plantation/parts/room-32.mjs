// Part 39: room: carriage loft (interior). Hay loft over the carriage bays, inside x77..90 z41..52, air y7..9.
// Focal piece: a 2x2 hay stack with a standing lantern on top, facing the ladder's line of sight (ladder x90 z52).
// Also: a hay bank along the west wall, a work table with two stair chairs and a chest, barrels in the corners,
// and three hanging lanterns under the loft ceiling (y10). The ladder foot and the lane north of it stay clear.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [77, 7, 41];

const LEGEND = {
  H: "hay_block",
  B: ["barrel", { facing: "up" }],
  f: "dark_oak_fence",
  t: ["dark_oak_slab", { type: "top" }],
  w: ["dark_oak_stairs", { facing: "west", half: "bottom" }],
  n: ["dark_oak_stairs", { facing: "north", half: "bottom" }],
  c: ["chest", { facing: "west" }],
  L: ["lantern", { hanging: "false" }],
  l: ["lantern", { hanging: "true" }],
};

// rows run along +x (x77..x90), successive rows along +z (z41..z52); one layer per y (y7, y8, y9)
const FLOOR = [
  "B............B", // z41
  "H.............", // z42
  "H..........n..", // z43
  "H.........wf.c", // z44
  "H...HH........", // z45
  "....HH........", // z46
  ".............B", // z47
  "..............", // z48
  "HH............", // z49
  "HH............", // z50
  "..............", // z51
  "..............", // z52
];

const MIDDLE = [
  "..............", // z41
  "H.............", // z42
  "H.............", // z43
  "H..........t..", // z44
  "H...HH........", // z45
  "....HH........", // z46
  "..............", // z47
  "..............", // z48
  "HH............", // z49
  "HH............", // z50
  "..............", // z51
  "..............", // z52
];

const TOP = [
  "..............", // z41
  "..l......l....", // z42
  "..............", // z43
  "...........L..", // z44
  "....L.........", // z45
  "..............", // z46
  "..l...........", // z47
  "..............", // z48
  "..............", // z49
  ".........l....", // z50
  "..............", // z51
  "..............", // z52
];

export function build(g) {
  layers(g, ORIGIN, LEGEND, [FLOOR, MIDDLE, TOP]);
  // lamplighter: a standing lantern on the loft boards against the west wall (lifts the SW corner),
  // and a hanging lantern under the ceiling over the east bays (lifts the cells by the ladder)
  g.set(77, 7, 51, ...B.lantern(false));
  g.set(85, 9, 48, ...B.lantern(true));
}

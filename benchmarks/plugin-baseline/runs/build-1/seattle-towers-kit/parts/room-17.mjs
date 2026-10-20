// Room 17, Aperture residents lobby (interior designer): the mail bank on the east wall is the focal piece (straight ahead
// from the west door), a bench row along the south wall, two table groups with quartz-stair chairs, and lanterns: hung from
// the ceiling on a grid, and standing on the table tops. Inner air x 203..228, z 16..27, floor y 1.
// Drawn as text: a row runs along +x from x 203 (column 0), successive rows along +z from z 16 (row 0). D(n) is n air cells.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  M: "polished_deepslate",                              // mail bank frame
  S: "black_concrete",                                  // mail slots
  F: "oak_fence",                                       // table post
  T: ["smooth_quartz_slab", { type: "top" }],           // table top
  N: ["lantern", { hanging: "false" }],                 // lantern standing on a table top
  L: ["lantern", { hanging: "true" }],                  // lantern hung from the ceiling
  b: ["quartz_stairs", { facing: "south" }],            // bench seat, back to the south wall
  w: ["quartz_stairs", { facing: "west" }],             // chair west of a table
  e: ["quartz_stairs", { facing: "east" }],             // chair east of a table
};

const D = (n) => ".".repeat(n);
const MAIL = D(25) + "M";                               // mail bank cell at column 25 (x 228)
const ROW = (...parts) => parts.join("");

// Floor furniture, y 1: mail bank (rows 3..8), table posts with chairs (row 8), bench row (row 11)
const FLOOR = [
  D(26),
  D(26),
  D(26),
  MAIL, MAIL, ROW(D(24), "N", "M"), MAIL,
  ROW(D(8), "N", D(5), "N", D(10), "M"),
  ROW(D(8), "w", "F", "e", D(3), "w", "F", "e", D(8), "M"),
  D(26),
  D(26),
  ROW(D(5), "bbbbbb", D(15)),
];

// Mail slots and table tops, y 2
const TOPS = [
  D(26),
  D(26),
  D(26),
  ROW(D(25), "S"),
  ROW(D(25), "M"),
  ROW(D(25), "S"),
  ROW(D(25), "M"),
  ROW(D(25), "S"),
  ROW(D(9), "T", D(5), "T", D(9), "M"),
  D(26),
  D(26),
  D(26),
];

// Lanterns standing on the table tops, y 3
const UPPER = [
  D(26),
  D(26),
  D(26),
  D(26),
  D(26),
  D(26),
  D(26),
  D(26),
  ROW(D(9), "N", D(5), "N", D(11)),
  D(26),
  D(26),
  D(26),
];

// Hanging lanterns, y 6 (under the ceiling at y 7), on a 7-block grid over the lanes
const HANG = [
  D(26),
  D(26),
  D(26),
  ROW(D(10), "L", D(6), "L", D(4), "L", D(3)),
  D(26),
  D(26),
  D(26),
  D(26),
  D(26),
  ROW(D(10), "L", D(6), "L", D(4), "L", D(3)),
  D(26),
  D(26),
];

const ORIGIN = [203, 0, 16];

export function build(g) {
  const at = (y) => [ORIGIN[0], y, ORIGIN[2]];
  layers(g, at(1), LEGEND, FLOOR);
  layers(g, at(2), LEGEND, TOPS);
  layers(g, at(3), LEGEND, UPPER);
  layers(g, at(6), LEGEND, HANG);
}

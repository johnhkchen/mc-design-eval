// Room 15, Hyatt rooftop plant room (interior designer). Interior air x 169..186, z 71..84, y 39..43. The room's own floor
// is laid at y 39 (smooth stone), so the walking surface is y 40 (the room tool's floor y 40); the equipment stands on it.
// Layout (grid i = x - 169 across, j = z - 71 down, drawn with layers() from [169, 39, 71]):
//   focal: a boiler (polished andesite, iron cap) on the north-centre, one hanging lantern over its cap;
//   two tanks (white concrete, quartz caps) west and south-centre, joined to the boiler by iron-chain pipes at y 42
//   (above the 2-high lanes); an operator's table (fence + top slab) with a quartz stair seat; a black console on the
//   east wall with its seat. Hanging lanterns sit on the lid at y 43 in a diamond lattice (radius 3) so no floor cell is dark.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [169, 39, 71];

const LEGEND = {
  P: "polished_andesite",                              // boiler body
  W: "white_concrete",                                 // tank walls
  Q: "smooth_quartz",                                  // tank caps
  I: "iron_block",                                     // boiler cap
  K: "black_concrete",                                 // console
  F: "oak_fence",                                      // table post
  T: ["smooth_stone_slab", { type: "top" }],          // table top
  S: ["smooth_quartz_stairs", { facing: "west", half: "bottom" }], // seats, backs to the west
  C: ["iron_chain", { axis: "x" }],                    // pipe along x
  Z: ["iron_chain", { axis: "z" }],                    // pipe along z
  L: ["lantern", { hanging: "true" }],                 // hangs from the lid at y 44
  R: "smooth_stone",                                   // the room's floor, y 39
};

// One row of 18 columns (i 0..17) from [start, end, char] runs; every other column is empty.
const row = (...runs) => {
  const cells = Array(18).fill(".");
  for (const [s, e, c] of runs) for (let i = s; i <= e; i++) cells[i] = c;
  return cells.join("");
};
const EMPTY = row();

// Each layer is 14 rows (j 0..13, z 71..84).
const FLOOR = [
  ...Array(14).fill(0).map((_, j) => row([0, 17, "R"])),
];

const Y40 = [
  EMPTY,
  EMPTY,
  row([2, 4, "W"], [7, 11, "P"]),
  row([2, 4, "W"], [7, 11, "P"]),
  row([2, 4, "W"], [7, 11, "P"], [13, 13, "S"], [14, 14, "F"]),
  EMPTY,
  row([16, 16, "K"]),
  row([15, 15, "S"], [16, 16, "K"]),
  row([16, 16, "K"]),
  row([8, 10, "W"]),
  row([8, 10, "W"]),
  row([8, 10, "W"]),
  EMPTY,
  EMPTY,
];

const Y41 = [
  EMPTY,
  EMPTY,
  row([2, 4, "W"], [7, 11, "P"]),
  row([2, 4, "W"], [7, 11, "P"]),
  row([2, 4, "W"], [7, 11, "P"], [14, 14, "T"]),
  EMPTY,
  row([16, 16, "K"]),
  row([16, 16, "K"]),
  row([16, 16, "K"]),
  row([8, 10, "W"]),
  row([8, 10, "W"]),
  row([8, 10, "W"]),
  EMPTY,
  EMPTY,
];

// Pipes and tank caps at y 42; the boiler's two-high body ends at y 41 under its iron cap here.
const Y42 = [
  EMPTY,
  EMPTY,
  row([2, 4, "Q"], [7, 11, "I"]),
  row([2, 4, "Q"], [5, 6, "C"], [7, 11, "I"]),
  row([2, 4, "Q"], [7, 11, "I"]),
  row([9, 9, "Z"]),
  row([9, 9, "Z"]),
  row([9, 9, "Z"]),
  row([9, 9, "Z"]),
  row([8, 10, "Q"]),
  row([8, 10, "Q"]),
  row([8, 10, "Q"]),
  EMPTY,
  EMPTY,
];

// Hanging lanterns: (i, j) on a diamond lattice, each lamp lights every floor cell within 3 steps of it.
const Y43 = [
  row([13, 13, "L"]),
  EMPTY,
  row([2, 2, "L"]),
  EMPTY,                                               // (178, 74) is the Grounds part's lantern: that lamp stands here
  row([16, 16, "L"]),
  EMPTY,
  row([5, 5, "L"]),
  row([12, 12, "L"]),
  EMPTY,
  row([1, 1, "L"]),
  row([8, 8, "L"]),
  row([15, 15, "L"]),
  EMPTY,
  row([4, 4, "L"]),
];

export function build(g) {
  layers(g, ORIGIN, LEGEND, [FLOOR, Y40, Y41, Y42, Y43]);
}

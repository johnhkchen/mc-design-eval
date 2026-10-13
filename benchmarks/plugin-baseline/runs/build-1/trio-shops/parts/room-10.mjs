// Part: room: H3 flat 1 (the ironmonger's flat, sturdy and sooty). Interior designer's pass, inside the flat's box
// x 2..12, y 9..12, z 9..23 (world frame; origin [1, 9, 8] is the plan's top-left corner, x 1 / z 8; the ceiling is
// the flat-2 floor at y 13).
// Focal piece: the forge, a lit campfire in a stone-brick surround with an anvil, set where the door at x 5, z 20
// looks. Storage (barrels, chests) along the partition, a spruce table with four stair chairs, a kitchen counter
// on the rear wall, ledger bookshelves on the east wall. Lanterns: two standing on barrels, three hanging from the
// ceiling. Lanes: x 7 from the door to the front, and z 20 across the back, stay clear.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  b: ["barrel", { facing: "up", open: "false" }],     // storage barrel
  c: ["chest", { facing: "north", type: "single" }],  // ironmonger's stock chest
  A: ["anvil", { facing: "west" }],                   // the forge's anvil
  C: ["campfire", { lit: "true", facing: "north", signal_fire: "false" }], // the lit forge hearth
  H: "stone_brick_wall",                              // hearth surround
  F: "spruce_fence",                                  // table post
  S: ["spruce_slab", { type: "top" }],                // table top
  w: ["spruce_stairs", { facing: "west" }],           // chair, back to the west
  e: ["spruce_stairs", { facing: "east" }],           // chair, back to the east
  n: ["spruce_stairs", { facing: "north" }],          // chair, back to the north
  s: ["spruce_stairs", { facing: "south" }],          // chair, back to the south
  B: "bookshelf",                                     // ledger shelves
  p: "spruce_planks",                                 // kitchen counter
  P: "flower_pot",                                    // a pot on the counter
  l: ["lantern", { hanging: "false" }],               // standing lanterns: on a barrel, and on the floor in the stair hall
  L: ["lantern", { hanging: "true" }],                // hanging lantern from the ceiling
};

// y 14 (the floor furniture). '#' walls, 'o' earlier parts, 'D'/'W' openings, '.' free: all skipped by layers().
const FLOOR = [
  "#####DDD#####", // z 8
  "#...ob....cH#", // z 9
  "#...ob.....H#", // z 10
  "#oo.oc....AC#", // z 11
  "#  oo......H#", // z 12
  "W  oo...n...#", // z 13
  "W  oo..wFe.B#", // z 14
  "#  oo...s..B#", // z 15
  "#  oo.......#", // z 16
  "#  .o.......#", // z 17
  "#l. o.......#", // z 18
  "#..oob.....p#", // z 19
  "#...........#", // z 20: the lane from the door
  "#...ob....pp#", // z 21
  "#...ob....p.#", // z 22
  "#...ol......#", // z 23
  "##WW#####WW##", // z 24
];

// y 15: the table top, a pot on the counter, lanterns on barrels
const ABOVE = [
  ".............", ".............", ".....l.......", ".............", ".............", ".............",
  "........S....", ".............", ".............", ".............", ".............", ".............",
  ".............", "...........P.", ".....l.......", ".............", ".............",
];

const EMPTY = Array(17).fill(".............");

// y 17: hanging lanterns (the ceiling above is the flat-2 floor)
const HANG = [
  ".............", ".L...........", ".............", ".............", "......L......", ".............",
  ".............", ".............", ".............", "..........L..", ".............", ".............",
  ".............", ".............", ".......L.....", ".............", ".............",
];

export function build(g) {
  layers(g, [1, 9, 8], LEGEND, [FLOOR, ABOVE, EMPTY, HANG]);
}

// Part: room: H1 flat 2 (interior designer + lamplighter). Parlour to the street (table with chairs, bookshelves, barrel),
// bedroom storage at the back (chests, barrels, table and chair), the landing x 34..36 z 9..14 kept clear for the ladder
// foot at (34, 14, 10). Lanterns hang from the loft floor (y 18) and stand on the floor against the walls.
// No bed: the palette has no bed block (see the Notes in plan.md / left in the report).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// y 14 (the floor level): furniture the player walks around. Columns x 26..36, rows z 9..23. Column x 33 is the partition
// (no furniture), the door is at z 20, and the landing (x 34..36, z 9..14) stays open for the ladder.
const FLOOR = {
  B: ["bookshelf", {}],
  R: ["barrel", { facing: "up", open: "false" }],
  F: ["dark_oak_fence", {}],
  W: ["dark_oak_stairs", { facing: "west", half: "bottom", shape: "straight" }],
  E: ["dark_oak_stairs", { facing: "east", half: "bottom", shape: "straight" }],
  N: ["dark_oak_stairs", { facing: "north", half: "bottom", shape: "straight" }],
  K: ["chest", { facing: "east", type: "single" }],
  P: ["potted_azalea_bush", {}],
  Q: ["potted_pink_tulip", {}],
  L: ["lantern", { hanging: "false" }],
};

const FLOOR_ROWS = [
  "BB........P", // z 9
  "B.........L", // z 10: lantern in the landing corner; x 34 clear (ladder foot)
  "B..N.......", // z 11
  "R.WFE......", // z 12: parlour table (fence) with chairs west and east
  "......L....", // z 13: lantern by the parlour table's east side
  "L.........Q", // z 14: standing lantern against the party wall, pot by the stair-hall window
  "...........", // z 15
  "K...L......", // z 16: chest against the party wall; lantern in the bedroom
  "K..........", // z 17
  "...........", // z 18
  "...WFE.....", // z 19: bedroom table (fence) with chairs west and east
  "...........", // z 20: door lane, kept clear
  "L..........", // z 21: standing lantern against the party wall
  "RPL........", // z 22: barrel, potted azalea, lantern at the rear
  "RL.........", // z 23: barrel, lantern
];

// y 15: table tops (spruce slabs on the table posts)
const TOP = {
  S: ["spruce_slab", { type: "bottom" }],
};

const TOP_ROWS = [
  "...........", // z 9
  "...........", // z 10
  "...........", // z 11
  "...S.......", // z 12
  "...........", // z 13
  "...........", // z 14
  "...........", // z 15
  "...........", // z 16
  "...........", // z 17
  "...........", // z 18
  "....S......", // z 19
  "...........", // z 20
  "...........", // z 21
  "...........", // z 22
  "...........", // z 23
];

// y 17: hanging lanterns from the loft floor (y 18 is solid above them)
const HANG = {
  H: ["lantern", { hanging: "true" }],
};

const HANG_ROWS = [
  "...........", // z 9
  "...........", // z 10
  ".........H.", // z 11: over the landing
  "...H.......", // z 12: over the parlour table
  "...........", // z 13
  "...........", // z 14
  ".....H.....", // z 15
  "...........", // z 16
  "...........", // z 17
  "...........", // z 18
  ".H.........", // z 19: bedroom
  ".........H.", // z 20: lantern hung over the lobby side of the door, lane kept clear
  ".H.........", // z 21
  "...........", // z 22
  "...........", // z 23
];

export function build(g) {
  layers(g, [26, 14, 9], FLOOR, FLOOR_ROWS);
  layers(g, [26, 15, 9], TOP, TOP_ROWS);
  layers(g, [26, 17, 9], HANG, HANG_ROWS);
}

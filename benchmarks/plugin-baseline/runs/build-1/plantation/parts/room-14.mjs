// Part: room: master bedroom. Interior of the largest east-front bedroom, inner air x52..63 x z43..49, floor row y11.
// Layout (x across, z down): dresser of two chests on the west wall with a flower pot; the big white bed with its
// headboard on the south wall, footboard toward the porch windows; a barrel nightstand with a lantern; a sitting group
// of three stair chairs round a fence-and-slab table, under a hanging lantern, by the chimney hearth on the east side.
// Blue carpet over the free floor. The lanes stay clear: the west door (x51 z46..47) and the east door (x64 z46..47)
// meet along the z45 row round the chimney; the south doorways (x54..55 z50) reach the same row up column x54..55.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { porchLantern } from "../vocab.mjs";

const ORIGIN = [52, 11, 43];

// one character per block: c carpet, h chest (dresser), P flower pot, f table post, s table top slab, C candle,
// k/K/N stair chairs (facing west / east / north), B barrel nightstand, L standing lantern on the barrel.
const LEGEND = {
  c: "blue_carpet",
  h: ["chest", { facing: "east" }],
  P: "flower_pot",
  f: "dark_oak_fence",
  s: ["dark_oak_slab", { type: "top" }],
  C: ["candle", { candles: "2", lit: "true" }],
  k: ["dark_oak_stairs", { facing: "west", half: "bottom", shape: "straight" }],
  K: ["dark_oak_stairs", { facing: "east", half: "bottom", shape: "straight" }],
  N: ["dark_oak_stairs", { facing: "north", half: "bottom", shape: "straight" }],
  B: "barrel",
  L: ["lantern", { hanging: "false" }],
};

// floor row y11 (z43..49, x52..63). '.' is left alone: bed cells, doorway first cells, chimney, and the lane.
const FLOOR = [
  "hccccccccccc", // z43: dresser chest, carpet; window front (x54..55, x60..61) kept open
  "hccccccccccc", // z44: dresser chest, carpet
  "cccccccccccc", // z45: the east-west lane (carpet is walkable)
  "ccccccNcc..c", // z46: chair north of the table, hearth-side carpet; chimney x61..62 left alone
  "ccccckfKc..c", // z47: chair west of the table (58,47 is the post), chair east, table post
  "cccc.cccc..c", // z48: bed foot at x56 (bed() places it), free cells round the table
  "cc...Bccc..c", // z49: doorway first cells x54..55 kept clear, bed head x56, barrel nightstand at x57
];

// row y12: flower pot on the dresser (52,43), table top slab (58,47), standing lantern on the barrel (57,49)
const Y12 = [
  "P...........",
  "............",
  "............",
  "............",
  "......s.....",
  "............",
  ".....L......",
];

// row y13: candle on the table top
const Y13 = [
  "............",
  "............",
  "............",
  "............",
  "......C.....",
  "............",
  "............",
];

// The shell leaves this room unclaimed, so the furniture, the bed and the hanging lanterns are placed.
export function build(g) {
  layers(g, ORIGIN, LEGEND, [FLOOR, Y12, Y13]);
  bed(g, [56, 11, 48], "south", "white");
  porchLantern(g, 58, 16, 47);
  porchLantern(g, 62, 16, 44);
  porchLantern(g, 53, 16, 44);
}

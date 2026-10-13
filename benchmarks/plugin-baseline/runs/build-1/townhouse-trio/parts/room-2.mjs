// room: A drawing room (interior designer). First floor of house A, inner air x4..10, y8..11, z13..23.
// Focal piece: a tea table with two chairs and a window bench under the bay opening (z=12), so the view from the
// well lands on the bay. Desk and chair at the back-west corner, a cabinet with pots on the west wall. Lanterns hang
// from the floor block at y=12; a table lantern and a desk lantern stand on their tops. The stair well x9..10 z20..23
// and the chimney masonry at x10 z18..19 are not written here.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN_X = 4;
const ORIGIN_Z = 13;

// Legend shared by every layer. Stairs name the side of the full-height back: facing north = back to the north.
const LEGEND = {
  b: ["spruce_stairs", { facing: "north", half: "bottom" }], // chair/bench, back to the north
  B: ["spruce_stairs", { facing: "south", half: "bottom" }], // chair, back to the south
  f: "spruce_fence",
  s: ["spruce_slab", { type: "bottom" }],
  k: "spruce_planks",
  P: "potted_poppy",
  C: "potted_cornflower",
  L: ["lantern", { hanging: "false" }],
  H: ["lantern", { hanging: "true" }],
};

// Rows run along +x (x4..10), successive rows along +z (z13..23). '.' is left as it is.
const FLOOR_8 = [
  ".P.bbbb", // z13: window bench under the bay opening
  ".......", // z14: lane
  "...b.b.", // z15: chairs
  "...fff.", // z16: tea table legs
  "...B.B.", // z17: chairs
  "kk.....", // z18: west cabinet
  "kk.....", // z19: west cabinet
  ".......", // z20
  ".......", // z21
  ".f.....", // z22: desk
  ".B.....", // z23: desk chair
];
const TOP_9 = [
  ".......",
  ".......",
  ".......",
  "...sss.", // table top
  ".......",
  "P......", // poppy on cabinet
  ".C.....", // cornflower on cabinet
  ".......",
  ".......",
  ".s.....", // desk top
  ".......",
];
const TABLE_10 = [
  ".......",
  ".......",
  ".......",
  "....L..", // table lamp on the table top
  ".......",
  ".......",
  ".......",
  ".......",
  ".......",
  ".L.....", // desk lamp
  ".......",
];
const HANG_11 = [
  ".H.....", // z14: hanging over the lane
  ".......",
  ".......",
  "....H..", // z17
  ".......",
  ".......",
  ".H.....", // z20
  ".......",
  "...H...", // z22
  ".......",
  ".......",
];

export function build(g) {
  // One call for all four levels: y8 furniture, y9 tops and pots, y10 lamps on tops, y11 hanging lanterns.
  layers(g, [ORIGIN_X, 8, ORIGIN_Z], LEGEND, [FLOOR_8, TOP_9, TABLE_10, HANG_11]);
}

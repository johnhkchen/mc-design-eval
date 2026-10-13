// room: C attic (interior designer): a maid's box room under the C mansard, dormer at x=23 on the north wall.
// Focal piece: a writing desk under the dormer (fence + top slab), a stair chair facing it, a lantern on it.
// Storage: a fenced cabinet with a top-slab shelf on the west wall, a flower pot on it.
// Keep clear: the stair well's access at x=20..21, z=20..23 (the floor hole at y=17 comes up into the attic there).
// Lane: the x=22 column and the z=22 row, from the access (21,18,20..22) to every piece.
// Lanterns stand on the floor (y=18) and on the desk: no hanging ceiling is needed.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  p: "potted_poppy",
  F: "spruce_fence",
  C: ["spruce_stairs", { facing: "north", half: "bottom" }],
  L: ["lantern", { hanging: "false" }],
  T: ["spruce_slab", { type: "top" }],
  P: "flower_pot",
};

// Origin [21,18,14]: x runs 21..25 (columns), z runs 14..22 (rows). Layer y=18 is the floor furniture, y=19 the
// tops of the fences (desk and shelf), y=20 what stands on those tops.
const FLOOR = [
  "L...p", // z14: floor lantern in the north-west corner, potted poppy in the north-east corner
  "..F..", // z15: desk leg under the dormer at x=23
  "..C..", // z16: chair facing north to the desk
  "L...L", // z17: floor lanterns on the west and east sides
  "F....", // z18: cabinet fence
  "F....", // z19: cabinet fence
  ".....", // z20: stair-well access, kept clear
  ".....", // z21: kept clear
  ".....", // z22: kept clear (lane)
];
const TOPS = [
  ".....", // z14
  "..T..", // z15: desk top
  ".....", // z16
  ".....", // z17
  "T....", // z18: shelf top
  "T....", // z19: shelf top
  ".....", // z20
  ".....", // z21
  ".....", // z22
];
const ON_TOPS = [
  ".....", // z14
  "..L..", // z15: desk lantern
  ".....", // z16
  ".....", // z17
  "P....", // z18: flower pot on the shelf
  ".....", // z19
  ".....", // z20
  ".....", // z21
  ".....", // z22
];

export function build(g) {
  layers(g, [21, 18, 14], LEGEND, [FLOOR, TOPS, ON_TOPS]);
}

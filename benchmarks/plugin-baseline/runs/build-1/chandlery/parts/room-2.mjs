// Room: Family hall and kitchen (interior designer's part, box [13,2,9,16,5,16]).
// Focal piece: the kitchen wall at the east, the furnace and smoker beside the hearth (firebox at x=17, z=11..12, built by
// the chimney part). A table (spruce fence post with a spruce slab top) with three dark oak stair seats, the potted poppy on
// it, a white rug under, and hanging lanterns over the lanes. Lanes kept clear: family door (15,2..3,9), shop opening
// (13,2..3,10), back door via the stair foot (16,2..3,16), and the cells across the room between them.
// Drawn as text: layers() origin [13,2,9]; rows run along +x (x 13..16), successive rows along +z (z 9..16); one
// layer per y from 2 to 5. Characters not in the legend (".", "o") are left as they are.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  b: ["barrel", { facing: "up" }],
  M: ["smoker", { facing: "west", lit: "true" }],
  F: ["furnace", { facing: "west", lit: "true" }],
  n: ["dark_oak_stairs", { facing: "north" }],
  s: ["dark_oak_stairs", { facing: "south" }],
  e: ["dark_oak_stairs", { facing: "east" }],
  T: ["spruce_fence", {}],
  k: ["spruce_slab", { type: "top" }],
  p: ["potted_poppy", {}],
  r: ["white_carpet", {}],
  L: ["lantern", { hanging: "true" }],
};

// y=2: the floor furniture. Rows z=9..16, columns x=13..16.
const FLOOR = [
  "b..M", // z 9: barrel in the north-west corner, smoker by the east wall; (15,9) kept clear for the family door
  "...F", // z 10: furnace by the hearth wall; the shop opening lane runs along this row
  ".n..", // z 11: bench north of the table, back to the north
  ".Te.", // z 12: the table; bench east of it, back to the east
  ".s..", // z 13: bench south of the table, back to the south
  "rr..", // z 14: rug
  "rr..", // z 15: rug
  "....", // z 16: the back door's foot (16,2,16) is the stair, skipped
];
// y=3: the table top, a spruce slab over the fence post at (14,3,12)
const TOP = ["....", "....", "....", ".k..", "....", "....", "....", "...."];
// y=4: the potted poppy on the table top at (14,4,12)
const POT = ["....", "....", "....", ".p..", "....", "....", "....", "...."];
// y=5: hanging lanterns under the y=6 floor: (16,5,11), (14,5,10), (14,5,14)
const HANG = ["....", ".L..", "...L", "....", "....", ".L..", "....", "...."];

export function build(g) {
  layers(g, [13, 2, 9], LEGEND, [FLOOR, TOP, POT, HANG]);
}

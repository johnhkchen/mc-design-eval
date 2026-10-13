// room: A bedrooms (interior designer): second floor, box [4,13,13,10,16,23]. Draws the furnishing as text with layers().
// Beds are NOT in palette.json, so the two bed footprints are left clear and marked in plan.md Notes: front bed
// (6..7,13,13) between the two bedside lamps, back bed (4,13,22..23) against the back wall.
// Stair well x9..10 z20..23 is the stair joiner's (blank in the rows, never written here); the foot cells at z19 stay clear.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [4, 13, 13];

// F table post (spruce fence), S table top (spruce slab, top half), L standing lantern on a table,
// H hanging lantern from the floor above, C chair (spruce stairs, back to the south), P / Q potted plants on a table,
// W a two-high cabinet of spruce planks against the west wall (its top carries the pot and a lantern).
const LEGEND = {
  F: "spruce_fence",
  S: ["spruce_slab", { type: "top" }],
  L: ["lantern", { hanging: "false" }],
  H: ["lantern", { hanging: "true" }],
  C: ["spruce_stairs", { facing: "south", half: "bottom", shape: "straight" }],
  P: "potted_cornflower",
  Q: "potted_poppy",
  W: "spruce_planks",
};

// Rows run along +x (x4..x10), successive rows along +z (z13..z23). Blank = the stair well (locked) or a bed footprint.
const LAYERS = [
  // y=13 floor level: table posts, cabinet, desk-side chair
  [
    ".F..F..", // z13 front bed clear at x6..7, lamps at x5 and x8
    "......F", // z14 washstand post at x10
    "W......", // z15 cabinet, west wall
    "W......", // z16 cabinet, west wall
    "...F...", // z17 desk
    "...C...", // z18 chair, back to the south
    ".......", // z19 lane from the stair foot
    ".....  ", // z20
    ".....  ", // z21
    ".....  ", // z22 back bed clear at x4
    ".F...  ", // z23 back lamp at x5
  ],
  // y=14: table tops and the cabinet's upper half
  [
    ".S..S..", // z13 lamp tops
    "......S", // z14 washstand top
    "W......", // z15 cabinet
    "W......", // z16 cabinet
    "...S...", // z17 desk top
    ".......",
    ".......",
    ".....  ",
    ".....  ",
    ".....  ",
    ".S...  ", // z23 back lamp top
  ],
  // y=15: lamps and pots standing on the tops
  [
    ".L..L..", // z13 lamps
    "......Q", // z14 poppy on the washstand
    "Q......", // z15 poppy on the cabinet
    "L......", // z16 lantern on the cabinet
    "...P...", // z17 cornflower on the desk
    ".......",
    ".......",
    ".....  ",
    ".....  ",
    ".....  ",
    ".L...  ", // z23 back lamp
  ],
  // y=16: hanging lanterns under the floor at y=17
  [
    ".......",
    ".......",
    ".......",
    "..H....", // z16 over the middle
    ".......",
    ".......",
    ".....H.", // z19 over the stair foot lane
    ".....  ",
    ".H...  ", // z21 over the back of the room
    ".....  ",
    ".....  ",
  ],
];

export function build(g) {
  layers(g, ORIGIN, LEGEND, LAYERS);
}

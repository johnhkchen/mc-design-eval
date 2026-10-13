// room: B bedrooms (interior designer): principal bedroom and dressing area, inner air box [12,13,13,18,16,23].
// Focal piece: the double bed against the front wall, head under the centre window, in view from the stair well.
// Furniture drawn as text: the origin is the plan grid's top-left corner [11,13,12] (x11, y13, z12), one layer per y.
// Stair well x12..13 z20..23 is left clear (the stair joiner's flight runs there).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  // red_bed is not in palette.json: the bed is a low spruce slab (closest palette shape), head and foot alike.
  B: ["spruce_slab", { type: "bottom" }],
  F: ["spruce_slab", { type: "bottom" }],
  p: "spruce_fence",
  L: ["lantern", { hanging: "false" }],
  H: ["lantern", { hanging: "true" }],
  S: ["spruce_slab", { type: "bottom" }],
  r: ["spruce_stairs", { facing: "east" }],
  s: ["spruce_stairs", { facing: "south" }],
  w: ["spruce_stairs", { facing: "west" }],
  c: "potted_cornflower",
};

// Rows run along +x from x11 (the wall column), successive rows along +z from z12 (the front wall row).
const Y13 = [
  "#########", // z12 front wall
  "#  pBp  #", // z13 bed head under the centre window, bedside posts
  "#   F   #", // z14 bed foot
  "#prsss  #", // z15 dressing table (x12), stool (x13), foot bench (x14..16)
  "#       #", // z16
  "#       #", // z17
  "#       #", // z18
  "#       #", // z19
  "#       #", // z20 stair well x12..13 left clear
  "#     wp#", // z21 desk: chair (x17) and fence post (x18)
  "#       #", // z22
  "#       #", // z23
  "#########", // z24 back wall
];
const Y14 = [
  "#########", // z12
  "#  L c  #", // z13 standing lantern on the bedside post, cornflower pot on the other
  "#       #", // z14
  "#S      #", // z15 dressing-table top
  "#       #", // z16
  "#       #", // z17
  "#       #", // z18
  "#       #", // z19
  "#       #", // z20
  "#      S#", // z21 desk top
  "#       #", // z22
  "#       #", // z23
  "#########", // z24
];
const Y15 = [
  "#########", // z12
  "#       #", // z13
  "#       #", // z14
  "#       #", // z15
  "#       #", // z16
  "#       #", // z17
  "#       #", // z18
  "#       #", // z19
  "#       #", // z20
  "#      L#", // z21 standing lantern on the desk top
  "#       #", // z22
  "#       #", // z23
  "#########", // z24
];
const Y16 = [
  "#########", // z12
  "#       #", // z13
  "#     H #", // z14 hanging lantern over the centre-front
  "#       #", // z15
  "#       #", // z16
  "#  H    #", // z17 hanging lantern over the west side
  "#       #", // z18
  "#       #", // z19
  "#       #", // z20
  "#       #", // z21
  "#     H #", // z22 hanging lantern over the south lane
  "#       #", // z23
  "#########", // z24
];

export function build(g) {
  layers(g, [11, 13, 12], LEGEND, [Y13, Y14, Y15, Y16]);
}

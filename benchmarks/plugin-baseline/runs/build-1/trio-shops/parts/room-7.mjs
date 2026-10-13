// Part: room: H2 flat 2 (upper flat: parlour to the street, bedroom to the rear). Furnished as text with layers():
// one character per block, rows along +x (x 14..20), successive rows along +z (z 9..23), one layer per y (14..17).
// The focal piece is the bookshelf wall on the west side (x 14, z 11..13), seen from the landing door at x 21, z 20.
// Lanes: z 20 runs straight from the door to the west wall; nothing sits in front of the windows at z 9.
// Stair hole (x 22, z 15..19; x 23..24, z 12..19) and the landing (x 22..24, z 9..14) are left empty.
// Palette: spruce_stairs/fence/slab, bookshelf, chest, barrel, flower_pot, potted_azalea_bush, lantern.
// No bed: the palette has no bed block (gap, see plan.md Notes).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  b: "bookshelf",
  f: "spruce_fence",
  S: ["spruce_slab", { type: "bottom" }],
  w: ["spruce_stairs", { facing: "west", half: "bottom" }],   // chair, back to the west wall
  e: ["spruce_stairs", { facing: "east", half: "bottom" }],   // chair, back to the east
  n: ["spruce_stairs", { facing: "north", half: "bottom" }],  // chair, back to the north (z 20)
  c: ["chest", { facing: "east" }],
  B: "barrel",
  p: "flower_pot",
  a: "potted_azalea_bush",
  L: ["lantern", { hanging: "false" }],                        // stands on a table top
  H: ["lantern", { hanging: "true" }],                         // hangs from the loft floor (y 18)
};

// y 14: floor-standing furniture (rows = z 9..23)
const Y14 = [
  ".......",
  ".wfe...",
  "b......",
  "b......",
  "b......",
  ".......", ".......", ".......", ".......", ".......", ".......", ".......",
  "....n..",
  "c...f..",
  "B......",
];

// y 15: table top, flower pot on the bookshelf, potted plant on the chest, desk top
const Y15 = [
  ".......",
  "..S....",
  ".......",
  "p......",
  ".......",
  ".......", ".......", ".......", ".......", ".......", ".......", ".......",
  ".......",
  "a...S..",
  ".......",
];

// y 16: standing lantern on each table top
const Y16 = [
  ".......",
  "..L....",
  ".......", ".......", ".......", ".......", ".......", ".......", ".......", ".......", ".......", ".......",
  ".......",
  "....L..",
  ".......",
];

// y 17: lanterns hanging from the loft floor over the parlour and the bedroom
const Y17 = [
  ".......", ".......", ".......",
  "...H...",
  ".......", ".......", ".......", ".......", ".......",
  ".......",
  ".......", ".......", ".......", ".......", ".......",
];

// The stair-side corner (x 22..24, z 17..21) is past the partition: two hanging lanterns from the loft floor light
// its dark cells (x 23 is the centre of that strip).
const Y17_EAST = [
  ".H.",
  "...",
  "...",
  "...",
  ".H.",
];

export function build(g) {
  layers(g, [14, 14, 9], LEGEND, [Y14, Y15, Y16, Y17]);
  layers(g, [22, 17, 17], LEGEND, Y17_EAST);
}

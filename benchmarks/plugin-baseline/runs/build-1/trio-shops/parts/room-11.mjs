// Part: room: H3 flat 2 (parlour to the street, bedroom at the back). Interior box x 2..12, y 14..17, z 9..23.
// Origin [2,14,9]; rows run along +x from x 2, successive rows along +z from z 9. The partition x 5 is wall, its
// door at z 20; the front window (x 6..8, z 8) and the stair well (x 2..3, z 12..17) are open: nothing there.
// Lane kept clear: x 6 from z 9 to z 20, and z 21 from x 6 to x 11. Beds are not in palette.json, so no bed here.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [2, 14, 9];
const FLOOR = {
  C: ["spruce_stairs", { facing: "west", half: "bottom" }], // chair, back to the west, seat faces the table
  E: ["spruce_stairs", { facing: "east", half: "bottom" }], // chair, back to the east
  F: "spruce_fence", // table post
  k: "bookshelf",
  L: ["lantern", { hanging: "false" }], // standing lantern on the floor by the stairs
  b: "barrel",
  h: ["chest", { facing: "west" }],
};
const TOP = {
  S: "spruce_slab",
  p: "flower_pot",
  a: "potted_azalea_bush",
  L: ["lantern", { hanging: "false" }],
};
const HANG = { H: ["lantern", { hanging: "true" }] };

// x 2..12 across (11 cells), z 9..23 down (15 rows). '.' = nothing placed.
const Y14 = [
  "..........k", // z 9   bookshelf on the party wall (x 12)
  "..........k", // z 10
  "L....CFE..k", // z 11  table at x 8, chairs at x 7 and x 9; lantern in the stair corner
  "..........b", // z 12  sideboard of barrels
  "..........b", // z 13
  "..........b", // z 14
  "...........", // z 15
  "..........L", // z 16  standing lantern by the east wall
  "...........", // z 17
  "...........", // z 18
  "...........", // z 19
  "...........", // z 20
  "...........", // z 21  lane
  "..........h", // z 22  chest in the bedroom
  "b..........", // z 23  barrel at x 2 (stair-side store)
];
const Y15 = [
  "...........", // z 9
  "...........", // z 10
  "......S....", // z 11  table top slab
  "...........", // z 12
  "..........p", // z 13  flower pot on the sideboard
  "..........a", // z 14  potted azalea
  "...........", // z 15
  "...........", // z 16
  "...........", // z 17
  "...........", // z 18
  "...........", // z 19
  "...........", // z 20
  "...........", // z 21
  "...........", // z 22
  "L..........", // z 23  lantern on the store barrel
];
const Y16 = [
  "...........", // z 9
  "...........", // z 10
  "......L....", // z 11  table lamp
];
const Y17 = [
  "...........", // z 9
  "...........", // z 10
  "...........", // z 11
  "...........", // z 12
  "...........", // z 13
  "......H....", // z 14  hanging lantern from the loft floor, parlour centre
  "...........", // z 15
  "...........", // z 16
  "..H..H.....", // z 17  hanging lanterns over the stair side and the sideboard
  "...........", // z 18
  "...........", // z 19
  "........H..", // z 20  hanging lantern over the bedroom door side
  "...........", // z 21
  "......H....", // z 22  hanging lantern over the chest
  "...........", // z 23
];

export function build(g) {
  const [x, y, z] = ORIGIN;
  layers(g, [x, 14, z], FLOOR, [Y14]);
  layers(g, [x, 15, z], TOP, [Y15]);
  layers(g, [x, 16, z], TOP, [Y16]);
  layers(g, [x, 17, z], HANG, [Y17]);
}

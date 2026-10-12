// ROOM corridor (interior designer): a calm spruce-and-white corridor, 2 wide (x=23..24) and 13 long (z=9..21), along the
// atrium's east glass to the bedrooms. The walking lane is x=23, kept clear end to end so every way in (gallery at z=9..10,
// living at z=19..20, master at z=21) and every bedroom and bath door (x=25 at z=10, 15, 19; the cell in front of each,
// x=24, stays clear) can be reached. The x=24 column holds the furniture: a birch sideboard with a potted cactus, a
// bookshelf focal wall, and potted plants. Light: hung lanterns from the spruce ceiling at z=9..13 and z=20..24, and a
// standing lantern on top of the bookshelf wall where the ceiling is open (z=14..19).
// Art: item frames are entities, not blocks, so no item-frame art here (see plan.md Notes).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// origin [23, 2, 9]: rows run along +z (z=9..21), two columns (x=23 lane, x=24 furniture). Layers are y=2, 3, 4.
const LEGEND = {
  P: "potted_cactus",                                  // flower pot on the floor, and on the sideboard
  B: "birch_planks",                                   // sideboard cabinet body
  S: ["birch_slab", { type: "bottom", waterlogged: "false" }], // sideboard top
  K: "bookshelf",                                      // focal bookshelf wall
  L: ["lantern", { hanging: "true", waterlogged: "false" }],  // hung from the spruce ceiling
  N: ["lantern", { hanging: "false", waterlogged: "false" }], // standing on the bookshelf top
};

// y=2: floor-level furniture. Column 0 (x=23) stays ".", the walking lane.
const Y2 = [
  ".P", // z=9   potted plant by the gallery entry
  "..", // z=10  clear: in front of the bed 1 door (x=25, z=10)
  ".B", // z=11  sideboard cabinet
  ".B", // z=12
  ".B", // z=13
  "..", // z=14
  "..", // z=15  clear: in front of the bath 1 door (x=25, z=15)
  ".K", // z=16  bookshelf focal wall
  ".K", // z=17
  ".K", // z=18
  "..", // z=19  clear: in front of the bed 2 door (x=25, z=19)
  ".P", // z=20  potted plant
  "..", // z=21  clear: the master bedroom opening
];

// y=3: the sideboard top and the bookshelf's upper shelf.
const Y3 = [
  "..",
  "..",
  ".S",
  ".S",
  ".S",
  "..",
  "..",
  ".K",
  ".K",
  ".K",
  "..",
  "..",
  "..",
];

// y=4: hung lanterns (from the spruce ceiling at y=5, z=9..13 and z=20..24), a potted cactus on the sideboard and a
// standing lantern on the bookshelf (z=17, the open-ceiling stretch, so it sits on the shelf and not from the beam).
const Y4 = [
  "..",
  "..",
  ".L", // z=11  hung
  ".P", // z=12  potted cactus on the sideboard top
  ".L", // z=13  hung
  "..",
  "..",
  "..",
  ".N", // z=17  standing on the bookshelf
  "..",
  "..",
  ".L", // z=20  hung from the ceiling at z=20
  "..", // z=21  clear: the master bedroom opening
];

export function build(g) {
  layers(g, [23, 2, 9], LEGEND, [Y2, Y3, Y4]);
}

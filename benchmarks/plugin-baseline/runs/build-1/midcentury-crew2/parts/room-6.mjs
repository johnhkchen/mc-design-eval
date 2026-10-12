// ROOM corridor (interior designer): calm spruce-and-white bedroom corridor, box [23,2,9,24,4,21].
// Plan of the floor: column x=23 (A, against the atrium glass) holds the furniture; column x=24 (B) stays clear as the
// walking lane, so every doorway (gallery z=9..10, living z=19..20, bed 1 z=10, bath 1 z=15, bed 2 z=19, master z=21)
// keeps a 2-high path. Hung lanterns on the ceiling sit over the storage run and the focal sideboard, and one over the lane.
import { B, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// one character per block; rows run along +z from z=9 (x=23 then x=24), '.' is clear floor
const legend = {
  b: B.block("bookshelf"),
  p: B.block("spruce_planks"),
  r: B.block("barrel"),
  c: B.block("potted_cactus"),
  L: B.lantern(false),
};

// lanterns stand at y=4 on full blocks (bookshelf stack, sideboard, plinth): the ceiling at y=5 is not this part's
const floor = [ // y=2
  "..", "..", "b.", "b.", "..", "p.", "p.", "..", "r.", "p.", "..", "..", "..",
];
const shelf = [ // y=3
  "..", "..", "b.", "b.", "..", "c.", "p.", "..", "c.", "p.", "..", "..", "..",
];
const stand = [ // y=4: a lantern on top of each stack
  "..", "..", "..", "L.", "..", "..", "L.", "..", "..", "L.", "..", "..", "..",
];

export function build(g) {
  layers(g, [23, 2, 9], legend, [floor, shelf, stand]);
}

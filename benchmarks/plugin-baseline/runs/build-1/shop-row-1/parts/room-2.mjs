// Part "room: keeper aisle 2" (parts/room-2.mjs): the service route behind tenant 2, inner air [13,6,3,20,12,4].
// Entered from the keeper door at (15,7..8,2) and from the openings in the south wall at x 16..20, z 5.
// Design: a keeper's desk at the west end (the focal piece, lit by a standing lantern on it), a chair beside it,
// a store along the north wall (hay sacks, a dresser with a flower pot), two hanging lanterns. The lane stays clear:
// the door cell (15,7..8,3), the row z 4 from x 15 to 20, and nothing in front of the openings at z 5.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Legend: P planks, S bottom slab, C chair stairs facing east (back to the east, sitter faces the desk),
// L standing lantern (on the desk), l hanging lantern (under the ceiling at y 13), H hay bale, f flower pot.
// "." is air and is left as it is.
const LEGEND = {
  P: "dark_oak_planks",
  S: ["dark_oak_slab", { type: "bottom" }],
  C: ["dark_oak_stairs", { facing: "east", half: "bottom" }],
  L: ["lantern", { hanging: "false" }],
  l: ["lantern", { hanging: "true" }],
  H: "hay_block",
  f: "flower_pot",
};

// Rows run along +x from x 13 to x 20 (8 cells); the first row is z 3 (against the rear wall), the second is z 4.
// Layers run y 6 (floor level) to y 12 (under the ceiling at y 13).
const FURNISH = [
  // y 6: desk base and chair, hay sacks and dresser on the north wall
  ["PP..HHPP",
   "PC......"],
  // y 7: desk top slabs, the desk lantern, a flower pot on the dresser, a slab on the end dresser
  ["SL....fS",
   "S......."],
  // y 9..12: nothing
  ["........", "........"],
  ["........", "........"],
  ["........", "........"],
  ["........", "........"],
  // y 12: two hanging lanterns under the ceiling, over the lane but clear of it
  ["...l....",
   "......l."],
];

export function build(g) {
  layers(g, [13, 6, 3], LEGEND, FURNISH);
}

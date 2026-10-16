// Part: room: Pyramid NW parlour. Front parlour, inner air x38..40, y3..6, z10..12 (rooms.json box).
// Entered from the vestibule at x41 z10 (first cell x40 z10 stays clear) and from the back hall door at x39 z13
// (first cell x39 z12 stays clear). The walk lane runs x39 z10..12. Furniture sits on the west column and the stove
// wall: a barrel cabinet with a standing lamp (NW), a chair facing the stove and a table (west), the stove itself
// (east, lit, against the hearth mass with a stone mantle, built by the chimneys part), and a second chair facing the stove from the south-east.
// Light: a standing lantern on the barrel, a standing lantern on the table top, and the lit stove. The parlour has no
// ceiling block to hang from (open to the pyramid roof), so nothing hangs.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  B: "barrel",
  L: ["lantern", { hanging: "false" }],
  H: ["lantern", { hanging: "true" }],
  W: ["spruce_stairs", { facing: "west", half: "bottom", shape: "straight" }],
  S: ["spruce_stairs", { facing: "south", half: "bottom", shape: "straight" }],
  f: "spruce_fence",
  t: ["spruce_slab", { type: "top" }],
};

// Layers bottom to top, rows along +x (x38..40), successive rows along +z (z10..12).
const ROWS = [
  // y3: barrel cabinet NW, chair west at z11, table leg SW, chair south-east at z12 (stove at x40 z11 is the chimneys part's)
  ["B..",
   "W..",
   "f.S"],
  // y4: standing lamp on the barrel, table top slab over the leg
  ["L..",
   "...",
   "t.."],
  // y5: standing lantern on the table top (x38 z12)
  ["...",
   "...",
   "L.."],
];

export function build(g) {
  layers(g, [38, 3, 10], LEGEND, ROWS);
}

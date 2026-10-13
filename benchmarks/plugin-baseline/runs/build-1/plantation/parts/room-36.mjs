// Part: room: gazebo. Interior of the octagonal pavilion (box x10..16, y2..6, z78..84), furnished by the interior designer.
// Layout: a round table on a dark-oak fence post at the centre (13,81) with a slab top and a flower pot on it; a ring of
// stair seats facing it (north and south seats at z79/z83, east and west seats at x11/x15); flower pots in the four
// corners; five hanging lanterns (four corners and the centre) under the solid cone ceiling at y7.
// The entrance lane runs down x13 from the north opening (13,2,77) to the table; (13,79) and (13,80) stay clear.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const legend = {
    F: "flower_pot", // corner pots on the balustrade posts (y3, standing on the birch rail at y2)
    P: "flower_pot", // the table's pot (y4, on the slab top)
    n: ["dark_oak_stairs", { facing: "north", half: "bottom" }], // seat on the north side, back to the north
    s: ["dark_oak_stairs", { facing: "south", half: "bottom" }], // seat on the south side, back to the south
    w: ["dark_oak_stairs", { facing: "west", half: "bottom" }], // seat on the west side, back to the west
    e: ["dark_oak_stairs", { facing: "east", half: "bottom" }], // seat on the east side, back to the east
    T: "dark_oak_fence", // table post (y2)
    t: ["dark_oak_slab", { type: "top" }], // table top (y3, top half)
    L: ["lantern", { hanging: "true" }], // hanging lanterns (y6), from the cone's solid ceiling at y7
  };
  // x10..16 across, z78..84 down; the outer ring is the pavilion's balustrade and columns, left alone.
  const blank = ["       ", "       ", "       ", "       ", "       ", "       ", "       "];
  const y2 = [
    "       ", // z78
    "  n n  ", // z79
    " w   e ", // z80
    " w T e ", // z81
    " w   e ", // z82
    "  s s  ", // z83
    "       ", // z84
  ];
  const y3 = ["       ", " F   F ", "       ", "   t   ", "       ", " F   F ", "       "];
  const y4 = ["       ", "       ", "       ", "   P   ", "       ", "       ", "       "];
  // corner lanterns sit one cell in from the octagon corners (those cells hold the earlier part's balustrade)
  const y6 = ["       ", "       ", "  L L  ", "   L   ", "  L L  ", "       ", "       "];
  // layers from y2: [floor furniture, table top, table pot, (y5 air), hanging lanterns]
  layers(g, [10, 2, 78], legend, [y2, y3, y4, blank, y6]);
}

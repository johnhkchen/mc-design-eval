// Part: room: Boarding house kitchen-hall (interior, inside box x50..57 y3..6 z10..15).
// Focal piece: the lit smoker at the chimney breast (x51 z12, set by the chimneys part), seen from the double door (x53..54 z9).
// Long table x52..55 z11..12 (spruce fence legs, top slabs at y4), benches south of it, barrels by the west wall.
// Lanes: front door -> z10 row -> east lane x56 down to z14 -> the stair's foot; the west yard door (x50 z16) gives the
// wing (smoker, barrels, x50..51) a through route along z14 to the east lane. The back door at x56 z16 is behind the
// stair flight's foot. A barrel cupboard sits at the wing's end (x52..54 z15). Light: smoker plus three hanging lanterns.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const legend = {
    b: ["barrel", { facing: "up" }],
    f: "spruce_fence",
    N:["spruce_stairs", { facing: "south" }],
    T: ["spruce_slab", { type: "top" }],
    C: "cauldron",
    L: ["lantern", { hanging: "true" }],
    l: ["lantern", { hanging: "false" }],
  };
  // Rows run along +x (x50..57), successive rows along +z (z10..15). Layers are y3, y4, y5, y6.
  layers(g, [50, 3, 10], legend, [
    // y3: barrel, table legs, smoker, benches
    ["b       ", "b f  f  ", "  f  f  ", "  f  N  ", "        ", "  bbb   "],
    // y4: table top (top slabs over x52..55 z11..12); a standing lantern on the barrel at x50 z10
    ["l       ", "  TTTT  ", "  TTTT  ", "        ", "        ", "        "],
    // y5: cauldron on the table
    ["        ", "    C   ", "        ", "        ", "        ", "        "],
    // y6: hanging lanterns under the ceiling
    [" L      ", "       L", "   L    ", "        ", "L     L ", "        "],
  ]);
}

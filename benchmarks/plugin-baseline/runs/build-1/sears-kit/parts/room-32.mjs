// Room "P4 parlour" (interior designer's part): front-right parlour, x 73..76, z 14..17, floor layer y 1 (feet y 2).
// Focal piece: the east hearth (mouth at 77,2,17); two armchairs (stairs) face it across the cell in front, kept clear.
// Supporting: a red rug between the chairs and the door lane, a bookshelf (the parlour's one shelf) in the NW corner,
// two barrel side tables with a standing lamp and a potted poppy, and two hanging lanterns under the upper floor.
// Lane: the doorway's first cell (73,2..3,15) and the cells (74,14..16), (75,14), (75,16), (76,15..17) stay clear.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const legend = {
    B: "bookshelf",                                   // parlour shelf (one)
    T: "barrel",                                      // side table
    R: "red_carpet",                                  // rug
    A: ["oak_stairs", { facing: "west", half: "bottom" }], // armchair facing the hearth (east)
    L: ["lantern", { hanging: "false" }],             // table lamp on the barrel
    P: "potted_poppy",                                // potted flower on the barrel
    H: ["lantern", { hanging: "true" }],              // hanging lantern under the upper floor
  };

  // origin [73, 2, 14]: rows run along +x (x 73..76), successive rows along +z (z 14..17)
  layers(g, [73, 2, 14], legend, [
    [  // y 2 (feet)
      "B..T",
      ".RA.",
      ".R..",
      "T.A.",
    ],
    [  // y 3 (table tops, the lamp and the pot)
      "...L",
      "....",
      "....",
      "P...",
    ],
    [  // y 4 (hanging lanterns, under the upper floor at y 5)
      "....",
      ".H..",
      "...H",
      "....",
    ],
  ]);
}

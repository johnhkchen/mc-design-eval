// P3 parlour: the best sitting room, inner air x 40..41, y 3..6, z 10..12 (the bay window looks north at z 9, the hall
// opening is (42,3..4,10), the front door comes in at (41,3,10)). A 2 x 3 room, so the layout is a column of furniture
// on the west (x 40) with a clear lane on the east (x 41) from the entrance to every seat.
//   z10: chair facing south (back to the bay wall)          (40,3,10) spruce_stairs
//   z11: table: spruce fence leg, spruce slab top, a flower pot   (40,3,11) fence, (40,4,11) slab, (40,5,11) pot
//   z12: chair facing north (back to the partition wall)    (40,3,12) spruce_stairs
// The lane x 41 z 10..12 stays air. One hanging lantern over the lane (41,5,11) on an iron chain up to the ceiling.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const legend = {
    c: ["spruce_stairs", { facing: "north", half: "bottom", shape: "straight" }], // chair by the bay, faces the table
    s: ["spruce_stairs", { facing: "south", half: "bottom", shape: "straight" }], // chair on the partition side, faces the table
    f: "spruce_fence", // table leg
    t: ["spruce_slab", { type: "top" }], // table top, a top slab so its face is at y 5
    p: "flower_pot", // on the table top
    l: ["lantern", { hanging: "true" }], // hangs from the chain above
    i: ["iron_chain", { axis: "y" }], // chain up to the upper floor's block (y 7)
  };
  // origin [40, 3, 10]: rows run along +x (x 40, x 41), successive rows along +z (z 10, 11, 12); '.' stays air.
  layers(g, [40, 3, 10], legend, [
    [ // y 3: floor layer, the two chairs and the table leg
      "c.",
      "f.",
      "s.",
    ],
    [ // y 4: the table top
      "..",
      "t.",
      "..",
    ],
    [ // y 5: the pot on the table, the lantern over the lane
      "..",
      "pl",
      "..",
    ],
    [ // y 6: the chain
      "..",
      ".i",
      "..",
    ],
  ]);
}

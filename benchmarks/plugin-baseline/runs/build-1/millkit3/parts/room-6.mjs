// P1 galerie: the front gallery under the Creole roof. Box x15..22, y3..5, z7..9; steps x17..18 from the lane (z6),
// French doors z10 (x16..17, x20..21). Posts and rail sit on z7 (other parts); the lane x17..18 stays clear from the
// steps to the doors. Furniture runs along the lane side (z8): two rockers west, a bench centre-east, a side table
// with a lamp and a pot at the east end. Hanging lantern centre; no cell on the door fronts (x16/17/20/21 z9).
import { hanging_lantern } from "../vocab.mjs";
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // y3: the seats and the table legs, rows along z (z7 north/lane .. z9 house side)
  layers(
    g,
    [15, 3, 7],
    {
      R: ["dark_oak_stairs", { facing: "south", half: "bottom", shape: "straight" }], // rocker seat, looks north
      B: ["spruce_stairs", { facing: "south", half: "bottom", shape: "straight" }], // bench seat, looks north
      F: "spruce_fence", // table leg
      L: ["lantern", { hanging: "false" }], // floor lamp on the deck, west corner
    },
    [
      ["........", "LR..BBFF", "........"], // y3
    ],
  );
  // y4: the table top (a top slab on the legs)
  layers(
    g,
    [15, 4, 7],
    { S: ["spruce_slab", { type: "top" }] },
    [["........", "......SS", "........"]],
  );
  // y5: standing lamp and a flower pot on the table
  layers(
    g,
    [15, 5, 7],
    { L: ["lantern", { hanging: "false" }], P: "flower_pot" },
    [["........", "......LP", "........"]],
  );
  // hanging lantern over the lane (chain up to the roof)
  hanging_lantern(g, 18, 5, 8);
  hanging_lantern(g, 16, 5, 8); // west corner: the rockers' light
}

// ROOM bedroom 1 (interior designer): guest/child room in blue-teal. Inner air box [26,2,9,30,4,12]; spruce floor
// (the shell lays it), doorway (25,2..3,10) on the west wall, east window x=31 z=10..12 (facades part). Plan:
//
//   x:    26 27 28 29 30        z=9   bookshelf | .      headboard | wardrobe fronts | wardrobe
//                                z=10  .        | nightstand | bed head | nightstand | .
//                                z=11  .        | (lantern)  | bed foot| (lantern)   | .
//                                z=12  .        | carpet     | carpet  | carpet      | .
//
// The bed is the focal piece: a light-blue double bed on the centre column, a spruce headboard on the north wall
// behind it, nightstands either side. The wardrobe sits on the east side of the north wall, clear of the window.
// Lanterns hang from the ceiling over the foot of the bed and over the wardrobe; the bookshelf wall gets a flower pot.
// The 2-high lane runs from the door along the south row (z=11..12) to the bed foot and the window side.
import { B, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hung_lantern } from "./../vocab.mjs";

const ORIGIN = [26, 2, 9];

export function build(g) {
  const legend = {
    B: "bookshelf",
    H: "spruce_planks",
    S: "spruce_planks",
    T: B.trapdoor("spruce", "east", "bottom", true),
    N: B.fence("spruce"),
    n: B.slab("birch", "bottom"),
    h: ["light_blue_bed", { facing: "north", part: "head" }],
    f: ["light_blue_bed", { facing: "north", part: "foot" }],
    C: "cyan_carpet",
    p: "flower_pot",
  };
  // floor level y=2: rows z=9..12, columns x=26..30
  // y=3: bookshelf and headboard continue up, nightstand tops, wardrobe body and fronts
  // y=4: flower pot on the bookshelf
  layers(g, ORIGIN, legend, [
    [
      ".BHTS",
      ".NhN.",
      "..f..",
      ".CCC.",
    ],
    [
      ".BHTS",
      ".n.n.",
      ".....",
      ".....",
    ],
    [
      ".p...",
      ".....",
      ".....",
      ".....",
    ],
  ]);
  // hanging lanterns over the foot of the bed and the wardrobe (the ceiling above is spruce planks)
  hung_lantern(g, 27, 11);
  hung_lantern(g, 30, 11);
}

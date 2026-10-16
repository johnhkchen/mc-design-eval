// P6 oven court: the working side of the bread oven. Inner air x73..77, y1..3, z13 (one row deep, between the
// stone apron and the oven's plinth). The way in is from the north (the path at x77..78), so the cells in front of
// the mouth (x74..75, x77) stay clear. Furniture sits at the west end and on the oven wall at head height.
// Light: one standing lantern on a barrel (x73, y2) lights the whole strip (levels 8+ at the feet).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Origin (73,1,13). Layers are y1, y2, y3; rows run along +x (x73..x77). '.' is left as it is (air).
  layers(g, [73, 1, 13], {
    B: ["barrel", { facing: "up" }],          // grain/water barrel: the west end
    L: ["lantern", { hanging: "false" }],      // standing on the barrel: the light of the court
    W: "white_wool",                           // flour sacks, stacked two high at x76
    T: ["spruce_trapdoor", { facing: "north", half: "top", open: "false" }], // peel rack shelves on the oven wall
  }, [
    ["B..W."],   // y1: barrel, sacks
    ["L..W."],   // y2: lantern on the barrel, sack top
    [".T.T."],   // y3: peel shelves against the oven wall (z14), clear of the mouth at x75
  ]);
}

// P6 pavilion: an open picnic pavilion. Focal piece: the long table under one hanging lantern on its iron chain,
// benches on both long sides, flower pots on the table, a water barrel in the corner. Floor (dark_oak_planks y0) and
// the posts/plates (y4, x74..81 on z7 and z11) are the shell's; the lanterns hang under those plates.
// Writes only into air. Post cells (74/81 x 7/9/11 z) and the lane rows z7 / z11 stay clear for walking.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { picnic_table } from "../vocab/h3.mjs";
import { hanging_lantern } from "../vocab/h3.mjs";

export function build(g) {
  // the long table and its two benches (benches at z8 and z10, seats facing the table at z9)
  picnic_table(g, 76, 79, 9);

  // focal light: one lantern on a chain from the roof over the table
  hanging_lantern(g, 77, 3, 9);

  // rows run along +z from z7 (north) to z11 (south); columns run along +x from x74 (west) to x81 (east)
  const legend = {
    P: "flower_pot",
    L: ["lantern", { hanging: "true" }],
    B: ["barrel", { facing: "up" }],
  };
  layers(g, [74, 1, 7], legend, [
    // y1: the water barrel in the south-east corner
    [
      "........",
      "........",
      "........",
      "........",
      "......B.",
    ],
    // y2: nothing (the table top and the benches are the layers below and beside)
    [
      "........",
      "........",
      "........",
      "........",
      "........",
    ],
    // y3: pots on the table top (x76, x79 at z9), lanterns under the north and south plates
    [
      "......L.",
      "........",
      "..P..P..",
      "........",
      ".L......",
    ],
  ]);
}

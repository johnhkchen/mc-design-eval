// Room "P7 south-east bedroom" (interior designer's part): one bed, a barrel dresser under the east window, a standing
// lantern on a fence post by the south window, and a rug. The door is at (120,19) on the west; the lane from it runs
// along x 121..122 to the bed's foot at (123,19). The bed head is against the south wall (z21, solid at x123..124).
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// floor layer y6 (feet): x121..124 across, z19 then z20 down
const LEGEND = {
  c: "brown_carpet",
  f: "spruce_fence",
  B: ["barrel", { facing: "up" }],
  L: ["lantern", { hanging: "false" }],
  p: "potted_poppy",
  k: ["candle", { candles: "2", lit: "true" }],
};

export function build(g) {
  // the bed: foot at (123,6,19), head one step south at (123,6,20), against the south wall
  bed(g, [123, 6, 19], "south", "red");

  // the rug in the lane, the post under the lantern, the barrels under the east window
  layers(g, [121, 6, 19], LEGEND, [
    [
      ".c.B", // z19: rug, bed foot (left empty for the bed), barrel
      "fc.B", // z20: post, rug, bed head (empty), barrel
    ],
    [
      "...p", // y7: flower pot on the barrel at z19
      "L..k", // y7: standing lantern on the post, lit candle on the barrel at z20
    ],
  ]);
}

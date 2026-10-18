// Room "P5 kitchen and living" (interior designer's part): the rear great room, inner air x84..91, z19..20, feet y2.
// Focal piece: the kitchen run on the west wall (furnace and smoker, lit, facing east into the room) with the table and
// stair-back chairs in front of the south window pair. The central hearth (88,1..2,18) is in the partition; its mouth
// cell (88,2,19) and the back-door front cell (88,2,20) stay clear. The passage (90,2..3,18) enters at (90,2,19).
// Lanterns hang from the upper floor's block layer at y5, so they clear the head room of 2 blocks.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const legend = {
    F: ["furnace", { facing: "east", lit: "true" }],
    S: ["smoker", { facing: "east", lit: "true" }],
    B: "barrel",
    E: ["spruce_stairs", { facing: "east", half: "bottom" }],
    P: "spruce_fence",
    T: ["spruce_slab", { type: "top" }],
    R: "red_carpet",
    N: ["candle", { candles: "3", lit: "true" }],
    L: ["lantern", { hanging: "true" }],
  };

  // x 84..91 along each row; row 1 is z 19 (against the partition), row 2 is z 20 (against the back wall).
  // The z 19 row is the lane: it stays clear from the passage (x90) to the stove front (x85) and the hearth front (x88).
  // The stove stands on x84 with its working cell at x85; the table and its one chair sit south of the lane.
  layers(g, [84, 2, 19], legend, [
    ["F.......", "S.PE.R.B"],   // y 2: stove, table and chair, carpet, barrel
    ["........", "..T....N"],   // y 3: table top slab, candle on the barrel
    ["L.......", "......L."],   // y 4: hanging lanterns (from the upper floor layer at y 5)
  ]);
}

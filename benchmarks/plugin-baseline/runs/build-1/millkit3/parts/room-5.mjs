// P0 shared porch: two rockers facing the lane, a barrel side table with a standing lantern at the west end and a
// flower pot at the east, and a hanging lantern under the eave over the steps. The doorway cells x4 and x7 (z8) and
// the lane cells x5..6 (z8) stay clear. Box x1..10, z7..8, y3..5; the posts, rail and beam are the fittings'.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hanging_lantern } from "../vocab.mjs";

export function build(g) {
  // y3, row z8: x1..10. Barrels (side tables) at x2 and x9, dark oak rockers (stairs, back to the wall) at x3 and x8.
  layers(g, [1, 3, 8], {
    B: ["barrel", { facing: "up" }],
    R: ["dark_oak_stairs", { facing: "south" }],
  }, [
    [".BR....RB."],
  ]);
  // y4, row z8: a standing lantern on each barrel, so both ends of the porch are lit.
  layers(g, [1, 4, 8], {
    L: ["lantern", { hanging: "false" }],
  }, [
    [".L......L."],
  ]);
  // Hanging lantern under the eave, over the lane between the doors (not over a doorway cell).
  hanging_lantern(g, 5, 5, 8);
}

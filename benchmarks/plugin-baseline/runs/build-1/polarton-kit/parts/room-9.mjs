// Part: room: forge shed (interior: the smithy in box [38,1,10,43,4,14])
// The hearth, anvil, smithing table and quench cauldron are already placed by the chimneys/job-sites part (hearths.mjs),
// so they are left as they are here (the layout marks them '.'). Doorway first cells x38/39 and x41..43 at z10 stay clear.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  L: ["lantern", { hanging: "false" }],                  // standing lamp on the floor stone
  F: "spruce_fence",                                    // bench post
  S: ["spruce_slab", { type: "top" }],                  // bench top
  K: ["candle", { candles: "4", lit: "true" }],         // bench light
  C: "coal_block",                                      // fuel pile by the west wall
  B: ["barrel", { facing: "up" }],                      // tool and nail barrel
  U: ["furnace", { facing: "north", lit: "true" }],     // lit furnace: the forge's glow
};

export function build(g) {
  // layers: y1 (floor stand), y2, y3; rows run along +x from x38, successive rows along +z from z10
  layers(g, [38, 1, 10], LEGEND, [
    [
      "..L...", // z10: lamp at x40; doorway first cells stay clear
      "F.....", // z11: bench post at x38
      "......", // z12: window front and anvil row, clear
      "CB....", // z13: coal and barrel
      "CU....", // z14: coal, lit furnace at x39; cauldron and smithing table already placed
    ],
    [
      "......",
      "S.....", // bench top slab on the post
      "......",
      "......",
      "......",
    ],
    [
      "......",
      "K.....", // four lit candles on the bench
      "......",
      "......",
      "......",
    ],
  ]);
}

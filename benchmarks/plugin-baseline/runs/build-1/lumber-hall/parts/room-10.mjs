// Room: Cart passage (interior designer's part). A covered wagon way through the block: the lane x37 stays clear from
// the north arch to the south arch; the stock sits on the two edges (barrels on the west, a log stack on the east), with
// the log stack as the focal piece at mid-passage (a lantern on its top). Light: standing lanterns on the podium along
// both edges (no ceiling block to hang from here). Rows z5 and z32 are the arch cells: kept clear.
// Layers are drawn as text: rows run along +x (x35..39), successive rows along +z (z5..32).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const legend = {
  B: ["barrel", { facing: "up" }],
  L: ["lantern", { hanging: "false" }],
  j: ["jungle_log", { axis: "x" }],
  k: ["acacia_log", { axis: "x" }],
  p: ["spruce_log", { axis: "x" }],
  q: ["birch_log", { axis: "x" }],
  r: ["oak_log", { axis: "x" }],
  s: ["dark_oak_log", { axis: "x" }],
};

// floor layer y 5: rows z5..z32. The grounds' woodpiles take the west edge at z10..14 and z22..26, so no barrels there.
const floor = [
  ".....", // z5  arch cell (kept clear)
  ".....", // z6
  "L....", // z7  west lantern
  "BB...", // z8
  "BB...", // z9
  ".....", // z10
  ".....", // z11
  "....L", // z12 east lantern
  ".....", // z13 (woodpile)
  ".....", // z14 (woodpile)
  ".....", // z15
  ".....", // z16
  "...pp", // z17 focal log stack, row 1 (spruce)
  "...qq", // z18 (birch)
  "...rr", // z19 (oak)
  "...ss", // z20 (dark oak)
  "L....", // z21 west lantern
  ".....", // z22
  ".....", // z23 (woodpile)
  ".....", // z24 (woodpile)
  ".....", // z25
  "....L", // z26 east lantern
  ".....", // z27
  "L....", // z28 west lantern
  "L..BB", // z29 west lantern, east barrels
  "...BB", // z30
  ".....", // z31
  ".....", // z32  arch cell (kept clear)
];

// second layer y 6: stacked barrels and the top course of the focal stack
const upper = [
  ".....", // z5
  ".....", // z6
  ".....", // z7
  "BB...", // z8
  ".....", // z9
  ".....", // z10
  ".....", // z11
  ".....", // z12
  ".....", // z13 (woodpile)
  ".....", // z14 (woodpile)
  ".....", // z15
  ".....", // z16
  "...kk", // z17 (acacia)
  "...pp", // z18 (spruce)
  "...qq", // z19 (birch)
  "...rr", // z20 (oak)
  ".....", // z21
  ".....", // z22
  ".....", // z23 (woodpile)
  ".....", // z24 (woodpile)
  ".....", // z25
  ".....", // z26
  ".....", // z27
  ".....", // z28
  "...BB", // z29
  ".....", // z30
  ".....", // z31
  ".....", // z32
];

export function build(g) {
  layers(g, [35, 5, 5], legend, floor);
  layers(g, [35, 6, 5], legend, upper);
  // the focal piece's lantern, on top of the log stack (y 7 stands on the log at y 6)
  layers(g, [35, 7, 18], legend, ["...L."]);
  // a hanging lantern under the passage ceiling (y10) lifts the two dim cells at x35 z13..14 to 8+
  layers(g, [35, 9, 8], { H: ["lantern", { hanging: "true" }] }, ["H"]);
}

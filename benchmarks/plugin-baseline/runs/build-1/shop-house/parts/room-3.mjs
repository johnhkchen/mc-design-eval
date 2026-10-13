// SPDX-License-Identifier: AGPL-3.0-or-later
// Room: Wing kitchen and scullery. Inner air box [5,6,23,10,12,29]; door x6 z22 (lobby), back door x11 z27, kitchen
// window x11 z24..25. The focal piece, the lit brick range on the south wall (x7..8 z29), is the hearth part's: this
// room leaves those cells alone. Drawn as text with layers(): origin [5,6,23], rows along +x (x5..10), successive rows
// along +z (z23..29). Pantry barrels on the west wall, a scullery sink and worktop under the window on the east wall,
// a worktable with two chairs in the middle. Hanging lanterns from the y13 floor light the room; the range adds warmth.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hangLantern } from "../vocab.mjs";

const origin = [5, 6, 23];

// floor layer y6: '.' is free floor. The door cells x6 z23 (lobby) and x10 z27 (back door) stay clear.
const legendFloor = {
  b: "barrel",                                               // pantry barrels, west wall
  W: ["water_cauldron", { level: "3" }],                     // scullery sink
  k: "spruce_planks",                                        // worktop base, east wall under the window
  f: "spruce_fence",                                         // worktable legs
  c: ["spruce_stairs", { facing: "north", half: "bottom" }], // chair north of the table (back to the north)
  C: ["spruce_stairs", { facing: "south", half: "bottom" }], // chair south of the table (back to the south)
};
const floorRows = [
  "b....W", // z23
  "b.c..k", // z24
  ".ff..k", // z25
  "..C...", // z26
  "......", // z27
  "b.....", // z28
  "b.....", // z29 the range (x7..8) is the hearth part's; x6 stays free floor
];

// layer y7 (origin y + 1): table top, worktop slabs, stacked pantry barrel
const legendTop = {
  b: "barrel",
  T: ["spruce_slab", { type: "bottom" }],
};
const topRows = [
  "b.....", // z23 stacked barrel over the floor barrel
  ".....T", // z24 worktop
  "..TT.T", // z25 table top and worktop
  "......", // z26
  "......", // z27
  "......", // z28
  "......", // z29 the range's brick breast at x7..8 is the hearth part's
];

export function build(g) {
  layers(g, origin, legendFloor, [floorRows]);
  layers(g, [origin[0], origin[1] + 1, origin[2]], legendTop, [topRows]);
  // hanging lanterns from the y13 floor: over the table, the pantry side, the sink and the back-door side
  hangLantern(g, 7, 12, 26);
  hangLantern(g, 6, 12, 25);
  hangLantern(g, 9, 12, 24);
  hangLantern(g, 9, 12, 28);
  hangLantern(g, 6, 12, 28);
  // a standing lantern on the pantry floor, on the bare cell by the west barrels, lifts the last dim cells
  g.set(5, 6, 27, ...B.lantern(false));
  return g;
}

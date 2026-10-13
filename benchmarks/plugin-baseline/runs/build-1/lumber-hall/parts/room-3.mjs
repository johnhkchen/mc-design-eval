// Room: Counting room (interior designer's part): wholesaler's office, inner air x3..7, y5..11, z22..31.
// Focal piece: the counting desk (x3..6, z26) in line with the north doorway and the south door.
// Clear lanes: row z22 (the north doorway's first cell), column x7 from z22 to z31, row z31 in front of the south door.
// Light: hanging lanterns on iron chains from the floor above, candles on the desk and on the ledger shelf.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const legend = {
  B: ["barrel", { facing: "up", open: "false" }],              // stock barrels under the ledger shelf
  S: ["dark_oak_slab", { type: "bottom" }],                    // ledger shelves; desk top
  P: ["dark_oak_planks", {}],                                  // desk body
  K: ["dark_oak_stairs", { facing: "south", half: "bottom" }], // keeper's stool, back to the south
  F: ["dark_oak_fence", {}],                                   // tally-stick post
  C: ["chest", { facing: "east" }],                            // strongbox
  A: ["candle", { candles: "4", lit: "true" }],                // desk candles (the focal light)
  E: ["candle", { candles: "3", lit: "true" }],
  D: ["candle", { candles: "2", lit: "true" }],                // shelf candles
  I: ["iron_chain", { axis: "y" }],                            // lantern chains from the floor above
  N: ["lantern", { hanging: "true" }],
};

// Layers from y5 (floor) to y11 (under the ceiling); rows run along z22..z31, columns along x3..x7.
const layersRows = [
  // y5: barrels on the west wall, desk body, keeper's stool, tally post, strongbox
  [".....", "B....", "B....", "B....", "PPPP.", "..K..", "F....", ".....", "C....", "....."],
  // y6: desk top slab, tally post's second cell
  [".....", ".....", ".....", ".....", "SSSS.", ".....", "F....", ".....", ".....", "....."],
  // y7: ledger shelf on the wall, desk candles standing on the top slab
  [".....", "S....", "S....", "S....", ".A.E.", ".....", ".....", ".....", ".....", "....."],
  // y8: candles on the ledger shelf
  [".....", "D....", ".....", "D....", ".....", ".....", ".....", ".....", ".....", "....."],
  // y9: upper ledger shelf; the lantern at x5 z30 hangs low over the dim corners (x6 z28, x3 z31)
  [".....", "S....", "S....", "S....", ".....", ".....", ".....", ".....", "..N..", "....."],
  // y10: hanging lanterns; chain under the low lantern
  [".....", ".N...", "...N.", ".....", "....N", ".....", ".....", ".N...", "..I..", "....N"],
  // y11: chains up to the floor above
  [".....", ".I...", "...I.", ".....", "....I", ".....", ".....", ".I...", "..I..", "....I"],
];

export function build(g) {
  layers(g, [3, 5, 22], legend, layersRows);
}

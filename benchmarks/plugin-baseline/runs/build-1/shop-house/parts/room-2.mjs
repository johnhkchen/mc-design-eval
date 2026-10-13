// SPDX-License-Identifier: AGPL-3.0-or-later
// Room: Keeper's aisle (x 10..13, z 16..21, y 6..12). A cold service route behind the shop machines: barrel stores
// along the back wall, a butcher's block as the focal piece, lanterns hung from the y13 floor. The lane from the
// lobby door (x9 z20) to the aisle doorway (x14 z20..21) stays clear at z 20..21.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN_X = 10;
const ORIGIN_Z = 16;

// Legend: one character per block. Rows run along +x (x 10..13), successive rows along +z (z 16..21).
const LEGEND = {
  "b": "barrel",
  "F": ["stripped_dark_oak_log", { axis: "y" }],
  "S": ["dark_oak_slab", { type: "bottom" }],
  "C": ["iron_chain", { axis: "y" }],
  "L": ["lantern", { hanging: "true" }],
  "l": ["lantern", { hanging: "false" }],
};

// One layer per y, drawn at y: 6 floor furniture, 7 stacked stores and the focal slab, 11 and 12 the hung lanterns at z19 and z21.
// The x12 z17 chain and lantern are the hearth part's (chain y10..12, lantern y9), so this part leaves that column alone.
const PLAN = [
  [6, [
    "b...",   // z16: service cells x11..13 stay clear for the keeper
    "b.Fb",   // z17: focal butcher's block at x12
    "b..b",   // z18: barrel stores
    "....",   // z19
    "....",   // z20: lane
    "....",   // z21: lane
  ]],
  [7, [
    "b...",   // z16: barrel stacked at the corner
    "l.S.",   // z17: the block's top slab; a standing lantern on the barrel at x10 lights the lane
    "....",
    "....",
    "....",
    "....",
  ]],
  [11, [
    "....",
    "....",   // z17: the hearth part's chain and lantern
    "....",
    "....",
    "....",
    "....",
  ]],
  [12, [
    "....",
    "....",   // z17: the hearth part's chain
    "....",
    ".L..",   // z19: lantern hung from the floor
    "....",
    "...L",   // z21: lantern hung from the floor, clear of the lane
  ]],
];

/** Keeper's aisle: barrel stores, a butcher's block, hung lanterns. Only writes inside the room box. */
export function build(g) {
  for (const [y, rows] of PLAN) {
    layers(g, [ORIGIN_X, y, ORIGIN_Z], LEGEND, rows);
  }
}

// Part: room: H2 flat 1 (the florist's flat, green and floral). Interior designer's pass: the flat's inner air is the
// box x 14..24, y 9..12, z 9..23 (world). Earlier parts own the partition at x 21 (doorway open at z 20), the flight-2
// stair at x 22 and the walls. Everything here goes into air, drawn as text with layers(): one character per block,
// rows along +x from x 14 (the first column), successive rows along +z from z 9.
//
// Layout: living to the street (sofa, table, two chairs, under the French window), a potting bench of barrels along
// the west wall, the focal piece where the door looks (campfire hearth with the barrels and pots either side), a
// bookshelf pair on the west wall and one at the rear. Hanging lanterns hang from the flat-2 floor at y 13.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const X0 = 14;   // first column of the rows below
const W = 11;    // x 14..24
const Z0 = 9;    // first row
const Z1 = 23;   // last row

// rows from a sparse spec: { z: { x: char } }, one 11-char string per z row Z0..Z1
function rowsFrom(spec) {
  const rows = [];
  for (let z = Z0; z <= Z1; z++) {
    const cells = spec[z] ?? {};
    let row = "";
    for (let i = 0; i < W; i++) row += cells[X0 + i] ?? " ";
    rows.push(row);
  }
  return rows;
}

const FURNITURE = {
  // y 9: the feet layer (sofa and chairs, bookshelves, barrels, the campfire hearth)
  y9: rowsFrom({
    9: { 14: "c", 16: "N" },
    10: { 14: "W", 16: "f", 17: "E" },
    11: { 14: "W", 16: "S" },
    14: { 14: "b" },
    15: { 14: "b" },
    16: { 14: "r" },
    18: { 14: "r" },
    19: { 14: "r" },
    20: { 14: "C" },
    21: { 14: "r" },
    22: { 14: "r" },
    23: { 18: "b" },
  }),
  // y 10: the table top and the flower pots on the barrels
  y10: rowsFrom({
    10: { 16: "t" },
    16: { 14: "z" },
    18: { 14: "z" },
    22: { 14: "a" },
  }),
  // y 12: lanterns hanging from the flat-2 floor (y 13)
  y12: rowsFrom({
    10: { 16: "L", 22: "L" },
    14: { 23: "L" },
    17: { 20: "L" },
    20: { 14: "L" },
    22: { 23: "L" },
  }),
};

export function build(g) {
  const legend = {
    c: ["chest", { facing: "east" }],
    N: ["spruce_stairs", { facing: "north", half: "bottom", shape: "straight" }],
    S: ["spruce_stairs", { facing: "south", half: "bottom", shape: "straight" }],
    E: ["spruce_stairs", { facing: "east", half: "bottom", shape: "straight" }],
    W: ["spruce_stairs", { facing: "west", half: "bottom", shape: "straight" }],
    f: "spruce_fence",
    t: ["spruce_slab", { type: "bottom" }],
    r: "barrel",
    b: "bookshelf",
    z: "potted_pink_tulip",
    a: "potted_azalea_bush",
    C: ["campfire", { lit: "true" }],
    L: ["lantern", { hanging: "true" }],
  };
  layers(g, [X0, 9, Z0], legend, FURNITURE.y9);
  layers(g, [X0, 10, Z0], legend, FURNITURE.y10);
  layers(g, [X0, 12, Z0], legend, FURNITURE.y12);
}

// Part 4, East shell and towers (plan.md PARTS 4, elements E1-E6): the trapezoid's planar walls (BODY rows), the flat-topped
// towers and the knife-edge prow (TOWERS, PROW), the atrium court carved out of the body (its glass roof is part 5), the
// entrance slot, the west recess and wedge paving, and the dark window bands. Solid body walls: the towers' interiors stay
// open from y 15 up, under the decks that part 5 lays at y 19.
import { carve } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { planarWall, towerPrism, entranceSlot, darkBand, groundAt } from "../vocab.mjs";

// BODY (plan.md): [z, x0, x1] per row, the west recess (x 105..107, z 9..21) left out so the wall plane steps back to x 108.
const BODY = [
  [0, 105, 105], [1, 105, 108], [2, 105, 111], [3, 105, 114], [4, 105, 117], [5, 105, 120], [6, 105, 123], [7, 105, 126],
  [8, 105, 129], [9, 108, 132], [10, 108, 135], [11, 108, 138], [12, 108, 141], [13, 108, 144], [14, 108, 147], [15, 108, 150],
  [27, 105, 114], [27, 116, 153], [28, 105, 111], [28, 116, 153], [29, 105, 108], [29, 116, 153], [30, 105, 105],
  [30, 116, 153], [31, 113, 153], [32, 110, 146], [33, 108, 146],
];
for (let z = 16; z <= 21; z++) BODY.push([z, 108, 153]);                    // z 16 to 21: the body reaches x 153
for (let z = 22; z <= 26; z++) BODY.push([z, 105, 153]);                    // the south-west rows, under the SW tower

// Towers: flat-topped, y 0..19 walls, coping y 20. Each replaces the body in its cells and stands 6 above the roof.
const NW = [[0, 105, 105], [1, 105, 108], [2, 105, 111], [9, 108, 112], [10, 111, 112]];
for (let z = 3; z <= 8; z++) NW.push([z, 105, 112]);
const SW = [[20, 111, 112], [21, 108, 112], [28, 105, 111], [29, 105, 108], [30, 105, 105]];
for (let z = 22; z <= 27; z++) SW.push([z, 105, 112]);
const NE = [[13, 143, 144], [14, 143, 147], [15, 143, 150], [20, 144, 153], [21, 147, 153], [22, 150, 153], [23, 153, 153]];
for (let z = 16; z <= 19; z++) NE.push([z, 143, 153]);
const SE = [];
for (let z = 24; z <= 31; z++) SE.push([z, 145, 153]);
// PROW: the signature 18-degree knife edge; its 1-cell tip at (108, 33) runs unbroken y 0..20 with no trim.
const PROW = [[28, 116, 123], [29, 116, 123], [30, 116, 123], [31, 113, 120], [32, 110, 117], [33, 108, 115]];

// The atrium court: [z, x0, x1] of the glass space frame's footprint; its void y 1..14 is left empty (part 5 fills the glass).
const ATRIUM = [[9, 114, 114], [10, 114, 117], [11, 114, 120], [12, 114, 123], [13, 114, 126], [14, 114, 129], [15, 114, 132],
  [16, 114, 135], [17, 114, 132], [18, 114, 129], [19, 114, 126], [20, 114, 123], [21, 114, 120], [22, 114, 117], [23, 114, 114]];

// Dark window bands (E5, E6): the west recess band over the slot, the south face bands at y 4 and y 10, and the north
// diagonal's exposed row ends at y 10 (x = 105 + 3z).
const RECESS_BAND = [[108, 11, 108, 19]];
const SOUTH_BAND = [[118, 33, 143, 33]];
const NORTH_DIAGONAL = [];
for (let z = 4; z <= 12; z++) NORTH_DIAGONAL.push([105 + 3 * z, z]);

// Every body and tower cell, so the wedge slot is found as the open cells of z 27..33 beside the prow.
function solidCells() {
  const s = new Set();
  for (const rows of [BODY, NW, SW, NE, SE, PROW]) for (const [z, x0, x1] of rows) for (let x = x0; x <= x1; x++) s.add(`${x},${z}`);
  return s;
}

export function build(g) {
  // BODY: solid white_terracotta to y 12, a calcite course at 13 and the coping at 14; the rows exclude the recess.
  planarWall(g, BODY);

  // Towers replace the body in their cells (replace: true); the prow's tip is its own unbroken column.
  towerPrism(g, NW, { replace: true });
  towerPrism(g, SW, { replace: true });
  towerPrism(g, NE, { replace: true });
  towerPrism(g, SE, { replace: true });
  towerPrism(g, PROW, { replace: true, tips: [[108, 33]] });

  // Atrium court: the body is carved out above the marble floor at y 0 (y 1..14 empty).
  for (const [z, x0, x1] of ATRIUM) carve(g, [x0, 1, z], [x1, 14, z]);

  // Entrance slot in the H's west wall: x 108..110, z 13..18, y 0..4, tinted glass back at x 111, lanterns hung at the ceiling.
  entranceSlot(g, 108, 13, "west");

  // Paving at the ground's top in the west recess and the wedge slot (open to the sky; part 6 walks join it).
  const solid = solidCells();
  const pave = (x, z) => {
    const top = groundAt(x, z);
    if (top !== null) g.set(x, top, z, "smooth_sandstone");
  };
  for (let z = 9; z <= 21; z++) for (let x = 105; x <= 107; x++) pave(x, z);
  for (let z = 27; z <= 33; z++) for (let x = 105; x <= 115; x++) if (!solid.has(`${x},${z}`)) pave(x, z);

  // Dark bands, flush in the walls (replace the body cells they sit in).
  darkBand(g, RECESS_BAND, 9, { replace: true });
  darkBand(g, SOUTH_BAND, 4, { replace: true });
  darkBand(g, SOUTH_BAND, 10, { replace: true });
  darkBand(g, NORTH_DIAGONAL, 10, { replace: true });
}

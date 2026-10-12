// Part 5, ornament (plan.md PARTS 5; elements 5, 9, 11, 22). Adds the front's trim and lights into air the earlier parts
// left: cream corner pilasters at x0/x15, plum brackets at y16, the gold fish-scale frieze, the bay ring's dentils,
// the two porch columns, the porch wainscot, the gold porch pediment, and the three lanterns.
// Every write goes to air only (earlier parts' cells are never replaced), so a cell another part filled is skipped.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { TRIM, PLUM, GOLD, GOLD_ALT, SITE, cornerBoard, bracket, column } from "../vocab.mjs";

const AIR = "minecraft:air";
// write only into air: the shell, front, roofs and openings parts own everything else around these cells
const put = (g, x, y, z, block, state) => { if (g.blockAt(x, y, z) === AIR) g.set(x, y, z, block, state); };

export function build(g) {
  // cream corner pilasters at x0 and x15 (z6, y4..16) with a block capital at y16 under the cornice
  for (const x of [SITE.partyW, SITE.partyE]) {
    cornerBoard(g, x, 6, 4, 15);
    put(g, x, 16, 6, ...B.block(TRIM));
  }

  // plum brackets at y16: pairs over the main wall (x9,10 and x13,14); the gold fish-scale frieze sits in the gap (x11,12)
  for (const x of [9, 10, 13, 14]) if (g.blockAt(x, 16, 6) === AIR) bracket(g, x, 6);
  // fish-scale frieze, two rows y15..16, gold/orange staggered (the y16 cells at x11,12 are the front's cream slab: skipped)
  for (const x of [11, 12]) {
    const alt = x === 11;
    put(g, x, 15, 6, alt ? GOLD_ALT : GOLD);
    put(g, x, 16, 6, alt ? GOLD : GOLD_ALT);
  }

  // bay ring: brackets over the bay corners on z3 (plus the two diagonal ring cells), dentils between them
  for (const x of [3, 6]) bracket(g, x, 3);
  // dentils at y16 on z3 between the brackets (x4,5 hold the front's cream slab: skipped)
  for (const x of [2, 4, 5, 7]) put(g, x, SITE.brackets.y, 3, ...B.trapdoor(PLUM, "south", "top", false));
  for (const x of [1, 8]) if (g.blockAt(x, 16, 4) === AIR) bracket(g, x, 4);

  // cream porch columns at (10,·,7) and (14,·,7)
  for (const x of SITE.porch.columnXs) column(g, x, SITE.porch.columnZ);

  // porch wainscot: cream bottom slabs at y5 on the inner face of the side walls (x10 and x14, z8..9)
  for (const x of [10, 14]) for (const z of SITE.porch.wainscotZs) put(g, x, 5, z, ...B.slab(TRIM, "bottom"));

  // gold porch pediment over the entry: cream stair ends, gold tympanum, at y10 z6
  put(g, 11, 10, 6, ...B.stairs(TRIM, "east", "bottom"));
  put(g, 12, 10, 6, GOLD);
  put(g, 13, 10, 6, ...B.stairs(TRIM, "west", "bottom"));

  // lanterns: one hanging in the porch ceiling, one standing on each stoop cheek top
  put(g, 12, 8, 8, ...B.lantern(true));
  put(g, 10, 5, 6, ...B.lantern(false));
  put(g, 14, 5, 6, ...B.lantern(false));
}

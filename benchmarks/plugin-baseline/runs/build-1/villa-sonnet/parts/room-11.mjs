// Room 11: Tablinum (the master's study), inner air [11,2,23,24,5,30]. Mosaic floor is P1's; this part only fills air.
// Layout: the axis x15..20 stays clear from the atrium opening (z=22) to the peristyle opening (z=31). Two matched study
// bays flank the axis on the garden side (south wall), mirrored about x=17.5 (x' = 35 - x): each has a desk of dark-oak
// slabs on fence legs, a lectern facing the axis, a dark-oak stair as the chair, and a standing bronze lamp. Scroll shelves
// (bookshelf, two high) line the north-west and north-east corners beside the doorways. Pots mark the far corners.
// Nothing stands over the doorways (10,2..3,27) and (25,2..3,27); their room cells (11,27) and (24,27) stay clear.
import { DARK_OAK_STAIRS, BOOKSHELF, LECTERN, table, lampStand, pot } from "../vocab.mjs";

// one study bay on the west side, with the mirror image built on the east side
function studyBay(g, mirror) {
  const x = (cx) => (mirror ? 35 - cx : cx);
  const facingToAxis = mirror ? "west" : "east";
  // desk: 2x2 dark-oak slab top (y3) on fence legs, cells x12..13 z29..30 (mirror: x22..23)
  table(g, mirror ? 22 : 12, 29, 2, 2);
  // lectern at the north side of the desk, turned to face the axis
  g.set(x(12), 2, 28, LECTERN, { facing: facingToAxis, has_book: "false" });
  // chair: a dark-oak stair facing the desk (sitting faces the desk, back to the wall)
  g.set(x(11), 2, 29, DARK_OAK_STAIRS, { facing: facingToAxis, half: "bottom" });
  // standing bronze lamp in the garden-side corner of the bay
  lampStand(g, x(14), 30);
}

export function build(g) {
  // scroll shelves: the wall run x11 z23..26 and the north bay x12..13 z23 (mirror x22..24)
  for (const z of [23, 24, 25, 26]) for (const y of [2, 3]) g.set(11, y, z, BOOKSHELF);
  for (const x of [12, 13]) for (const y of [2, 3]) g.set(x, y, 23, BOOKSHELF);
  for (const z of [23, 24, 25, 26]) for (const y of [2, 3]) g.set(24, y, z, BOOKSHELF);
  for (const x of [22, 23]) for (const y of [2, 3]) g.set(x, y, 23, BOOKSHELF);

  studyBay(g, false);
  studyBay(g, true);

  // potted plants in the two garden-side corners (outside the lamp and chair cells)
  pot(g, 11, 30, "fern");
  pot(g, 24, 30, "flowering_azalea");
}

// villa-haiku: room 3, shop W2 (box [9,2,1,14,5,7]), the shuttered trade room behind the street opening at x10..13 z=0.
// Layout: the counter across the front (z=1, built by the shell), a lantern on it as the focal light; barrels of
// goods stacked along the west side wall; a shelved wall of bookshelves along the back (z=7); one potted fern in
// the east back corner. The middle and east side stay open so the path runs from the street to every piece.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { BARREL, BOOKSHELF, pot } from "../vocab.mjs";

export function build(g) {
  // focal piece: the lantern standing on the counter top (y3), in the middle of the opening's front
  g.set(11, 3, 1, ...B.lantern(false));

  // storage along the west side wall (x9): two barrels and a stacked one at z3..4, the front and back of the wall kept open
  g.set(9, 2, 3, BARREL, { facing: "up", open: "false" });
  g.set(9, 2, 4, BARREL, { facing: "up", open: "false" });
  g.set(9, 3, 3, BARREL, { facing: "up", open: "false" });

  // the shelved wall: bookshelves two high across the back row (z=7), x10..13
  g.fill([10, 2, 7], [13, 3, 7], BOOKSHELF);

  // one pot in the east back corner (z=7 keeps the cell beside it reachable)
  pot(g, 14, 7, "fern");
  return g;
}

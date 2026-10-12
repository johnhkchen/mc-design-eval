// villa-haiku: room shop E1 (plan ROOMS: shuttered trade room, mirror of W1). Inner air x28..34, y2..5, z1..7.
// The shell has already built the street opening (x30..33, y2..4, z=0), the counter at z=1 (y2), and the shutters.
// The facade part puts the pot at (34,2,1), beside the counter; this part does not repeat it.
// Layout: the counter is the focal piece at the front; the shelved wall (bookshelves) fills the back wall (z=7);
// a barrel stack sits in the west corner; one standing lamp on each side lights the room. The floor in front of
// the counter (z=2..6) stays clear, so a player can walk from the street to the counter and across to the back.
import { BARREL, BOOKSHELF, lamp } from "../vocab.mjs";

export function build(g) {
  // the shelved wall: bookshelves on the back wall, x29..33, two high (the shopkeeper's stock)
  for (let x = 29; x <= 33; x++) for (let y = 2; y <= 3; y++) g.set(x, y, 7, BOOKSHELF);

  // the barrel stack: the west corner (x28, z6..7), two barrels on the floor and one on top
  g.set(28, 2, 6, BARREL, { facing: "up", open: "false" });
  g.set(28, 2, 7, BARREL, { facing: "up", open: "false" });
  g.set(28, 3, 7, BARREL, { facing: "up", open: "false" });

  // the light: a standing lamp on each side, away from the counter's front row (z=2) and the doorway line
  lamp(g, 28, 3);
  lamp(g, 34, 3);

  return g;
}

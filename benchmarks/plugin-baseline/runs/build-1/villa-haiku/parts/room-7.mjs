// villa-haiku: room 7, the tablinum (plan.md ROOMS). Inner air x13..22, y2..5, z22..25.
// The study: a desk on the back wall (z=24) with one seat facing it, bookshelves on the east and west walls,
// one standing lamp by the desk, potted plants at the front corners. Nothing over the doorways (atrium opening
// x14..21 at z=21, back doorway x16..19 at z=26).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { BOOKSHELF, PILLAR, lamp, pot } from "../vocab.mjs";

/** build: the tablinum's furniture, inside its air box only. */
export function build(g) {
  // desk: a dark oak slab top (y3) on a quartz pillar stub (y2) under each of its four cells, x16..19 at z=24
  for (let x = 16; x <= 19; x++) {
    g.set(x, 2, 24, ...B.pillar(PILLAR, "y"));
    g.set(x, 3, 24, ...B.slab("dark_oak", "bottom"));
  }
  // the seat: one dark oak stair at the desk's front, facing the desk (south)
  g.set(17, 2, 23, ...B.stairs("dark_oak", "south"));

  // the lamp beside the desk's west end (plan: (14,2,24)), on the shelves' side of the room
  lamp(g, 14, 24);

  // bookshelves on the west wall (x13) and the east wall (x22), z23..25, two high
  for (const x of [13, 22]) {
    for (let z = 23; z <= 25; z++) {
      g.set(x, 2, z, BOOKSHELF);
      g.set(x, 3, z, BOOKSHELF);
    }
  }

  // potted plants at the front corners, by the atrium opening
  pot(g, 13, 22, "fern");
  pot(g, 22, 22, "azalea");
  return g;
}

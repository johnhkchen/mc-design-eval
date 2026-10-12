// Shop W1 (room 2): shuttered trade room on the street. Inner air x1..7, y2..5, z1..7; entered through the street opening x2..5 at z=0.
// The shell's counter runs along z=1 under the opening. The front cells (z=1 beside the counter, and z=2) stay clear.
// The shelved wall is the back wall (z=7): bookshelves two high. Barrels line the west wall; a sales table stands mid-room;
// two standing lamps light it; one potted fern sits in the far corner.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { BARREL, BOOKSHELF, PILLAR, lamp, pot } from "../vocab.mjs";

export function build(g) {
  // the shelved wall: bookshelves two high across the back wall, the focal piece
  g.fill([2, 2, 7], [6, 3, 7], BOOKSHELF);

  // storage along the west wall: two barrels, one stacked on the first
  g.set(1, 2, 3, BARREL, { facing: "up", open: "false" });
  g.set(1, 2, 4, BARREL, { facing: "up", open: "false" });
  g.set(1, 3, 4, BARREL, { facing: "up", open: "false" });

  // the sales table: a dark oak slab top on two quartz pillar stubs, mid-room
  for (const x of [4, 5]) {
    g.set(x, 2, 4, ...B.pillar(PILLAR, "y"));
    g.set(x, 3, 4, ...B.slab("dark_oak", "bottom"));
  }

  // light: standing lamps in the west and east corners, clear of the front cells
  lamp(g, 1, 6);
  lamp(g, 7, 3);

  // one pot, in the far corner
  pot(g, 7, 7, "fern");
  return g;
}

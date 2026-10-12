// Room: Parlour bay (interior designer). Inner air box [3,5,5,6,8,6] plus (2..7,5..8,6), open south to the parlour
// along z=7. Layout: a window seat of oak stairs under the front glass (backs to the wall, steps into the room), a chair
// hugging each diagonal wall, a white carpet strip, and a small spruce-post table with a flower pot as the focal piece,
// lit by two hanging lanterns. Nothing sits over the windows or the doorway; the 2-high path from the parlour stays clear
// except at the table cell.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // window seat: four oak stairs at y5 under the bay glass, facing south so the high back sits on the bay wall
  for (const x of [3, 4, 5, 6]) g.set(x, 5, 5, ...B.stairs("oak", "south", "bottom"));

  // chairs: oak stairs against the diagonal walls (x=1 west, x=8 east), facing into the room
  g.set(2, 5, 6, ...B.stairs("oak", "east", "bottom"));
  g.set(7, 5, 6, ...B.stairs("oak", "west", "bottom"));

  // small table: a spruce fence post standing on the floor, an oak slab top (top half) at y6, so the top is at y7
  g.set(4, 5, 6, ...B.fence("spruce"));
  g.set(4, 6, 6, ...B.slab("oak", "top"));

  // focal piece: a flower pot on the table
  g.set(4, 7, 6, "flower_pot");

  // light: two lanterns hung one block under the bay ceiling (y8 is an earlier part's cyan terracotta), one beside the
  // table and one over the seat's east end; the pot's own cell is taken, so neither lantern sits over it
  g.set(3, 7, 6, ...B.lantern(true));
  g.set(6, 7, 6, ...B.lantern(true));
}

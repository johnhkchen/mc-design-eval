// room: Bedroom 3 bay (turret): the reading nook in the turret. Inner air x30..32, y6..8, z5..7; entered from bedroom 3
// through the open z8 row; N windows (30..32,7..8,4), side windows (29,7..8,6) and (33,7..8,6).
// Design: a window seat of oak stairs under the tall N windows (the focal piece, brightest light), white carpet cushions
// on it; a two-cell bookshelf on the west wall under a hanging lantern; a reading table (oak fence + oak slab top) with a
// lantern, and a stair chair facing it. The x31 column stays clear (no lantern over it), so the walk reaches the seat.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const WHITE_CARPET = "white_carpet", BOOKSHELF = "bookshelf", OAK_FENCE = "oak_fence", OAK_SLAB = "oak_slab";

export function build(g) {
  // window seat: three oak stairs whose back is the north wall, facing south into the room (the seat front is z6)
  for (let x = 30; x <= 32; x++) g.set(x, 6, 5, ...B.stairs("oak", "south", "bottom"));
  // cushions: white carpet on the seat (the windows are at z4, so the cushion row is clear of them)
  for (let x = 30; x <= 32; x++) g.set(x, 7, 5, WHITE_CARPET, {});

  // small bookshelf: two cells on the west wall
  g.set(30, 6, 6, BOOKSHELF, {});
  g.set(30, 6, 7, BOOKSHELF, {});

  // reading table: fence post at y6, oak slab top half at y7 (table surface y8), a standing lantern on it
  g.set(32, 6, 6, OAK_FENCE, {});
  g.set(32, 7, 6, OAK_SLAB, { type: "top", waterlogged: "false" });
  g.set(32, 8, 6, ...B.lantern(false));

  // stair chair at the table, back to the doorway, facing north at the table
  g.set(32, 6, 7, ...B.stairs("oak", "north", "bottom"));

  // hanging lamp over the bookshelf, at the ceiling: its head cell (30,8,7) blocks no seat, table or path cell
  g.set(30, 8, 7, ...B.lantern(true));
}

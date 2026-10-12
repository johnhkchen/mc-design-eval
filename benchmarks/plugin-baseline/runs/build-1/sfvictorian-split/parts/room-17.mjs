// Room: Top bay (third-storey bay alcove). Inner air box [3,14,5,6,16,6], open south to the top room at z=7; the
// diagonal cells (2,14..16,6) and (7,14..16,6) are air too. Design: a window seat under the bay's pair of windows
// (stairs, high back to the glass), a telescope on a fence post with a lantern on top aimed out the window, a barrel
// and lantern as the small stowage table, and a rug under the seat.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const PLUM = "crimson";
const RUG = "purple_carpet";

export function build(g) {
  // window seat: two plum stairs against the bay face (stairs facing = side of the full-height back = north, the glass)
  g.set(4, 14, 5, ...B.stairs(PLUM, "north", "bottom"));
  g.set(5, 14, 5, ...B.stairs(PLUM, "north", "bottom"));
  // rug in front of the seat, floor level so the path stays clear
  g.set(4, 14, 6, ...B.block(RUG));
  g.set(5, 14, 6, ...B.block(RUG));

  // telescope: a fence post on the window line at the bay's east end, a lantern standing on top
  g.set(6, 14, 5, ...B.fence(PLUM));
  g.set(6, 15, 5, ...B.lantern(false));

  // stowage table: a barrel with a lantern standing on its lid, at the west end of the bay (second light, on the
  // barrel rather than hung from the lid, so it does not depend on the bay lid being built)
  g.set(3, 14, 5, "barrel", { facing: "up", open: "false" });
  g.set(3, 15, 5, ...B.lantern(false));
}

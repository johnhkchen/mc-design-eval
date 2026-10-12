// ROOM corridor (interior designer): calm spruce-and-white passage along the atrium's east glass to the bedrooms.
// Inner air box [23,2,9,24,4,21]. Floor is the shell's (terrazzo, not rewritten here). Layout, x=23 is the furniture
// column against the glass, x=24 is a clear 1-wide lane (2 high) from the gallery (z=9..10) and the living doorway
// (z=19..20) to the bedroom doorways on x=25 (z=10, 15, 19) and the master opening (z=21/22). Nothing on x=24.
// Light: hung lanterns under the spruce ceiling (y=5, z=9..13 and z=20..24), standing lanterns on the floor for the
// vault stretch (z=14..19, no ceiling at y=5).
// Item frames are entities, not blocks: the wall art is left out (see plan.md Notes).
import { hung_lantern } from "../vocab.mjs";

export function build(g) {
  // focal: potted cactus under the hung lantern, by the glass (east of the gallery)
  g.set(23, 2, 11, "potted_cactus");
  hung_lantern(g, 23, 11, 4);

  // bench: two birch_slab bottoms on the floor, x=23, z=12..13 (seat, not blocking the lane)
  g.set(23, 2, 12, "birch_slab", { type: "bottom" });
  g.set(23, 2, 13, "birch_slab", { type: "bottom" });

  // stretch under the vault: standing lanterns on the floor, x=23
  g.set(23, 2, 16, "lantern", { hanging: "false" });
  g.set(23, 2, 18, "lantern", { hanging: "false" });

  // hung lantern over the master opening end, and one over the bedroom doorway run
  hung_lantern(g, 23, 21, 4);
  hung_lantern(g, 24, 9, 4);
}

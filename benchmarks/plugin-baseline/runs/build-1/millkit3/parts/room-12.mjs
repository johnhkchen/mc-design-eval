// P2 dining room (box x28..30, y3..6, z14..15; door x29 z13, open east at x31 z14..15).
// Focal piece: a two-cell spruce table in the view of the door (z15, x28..29), chairs on its open sides (a stair
// at (28,14) facing it, a stair at (30,15) facing it), a standing lantern and a flower pot on top. The lane stays
// clear: (29,14) is the door's first cell, (30,14) the way on to the kitchen opening.
// Hanging lantern from the ceiling block (29,7,14) lights the room.
import { chair, hanging_lantern } from "../vocab.mjs";

export function build(g) {
  // table: fence legs at the two ends, spruce top slabs on them (top halves, so the top face is at y5)
  g.set(28, 3, 15, "spruce_fence");
  g.set(29, 3, 15, "spruce_fence");
  g.set(28, 4, 15, "spruce_slab", { type: "top" });
  g.set(29, 4, 15, "spruce_slab", { type: "top" });

  // chairs: the sitter's facing is toward the table
  chair(g, 28, 3, 14, "south");
  chair(g, 30, 3, 15, "west");

  // focal items on the table top (y5)
  g.set(28, 5, 15, "lantern", { hanging: "false" });
  g.set(29, 5, 15, "flower_pot");

  // hanging light over the lane, from the ceiling block
  hanging_lantern(g, 29, 6, 14);
}

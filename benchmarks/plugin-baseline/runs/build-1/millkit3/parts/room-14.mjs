// P2 kitchen: box 31,3,13..32,6,15. The floor is all walk lanes (hall door x32 z12, dining opening x30 z14..15, back
// door x32 z16), so the kitchen's furniture is the stove on the back wall, shelves on the x31 partition at y5 (above
// head height, a top slab with a pot on it) and one hanging lantern over the stove. The flight at x33 is locked.
import { stove, shelf, hanging_lantern } from "../vocab.mjs";

export function build(g) {
  // focal piece: the lit range against the back wall, facing into the room; its flue plate sits on top
  stove(g, 31, 3, 15, "north");
  // light: one lantern hung from the ceiling over the stove-side lane, lifts the room to 8+
  hanging_lantern(g, 31, 6, 14);
  // shelves on the partition wall x31 (the wall is behind them, to the west), above the walk lanes
  shelf(g, 32, 5, 13, "east", "flower_pot", "spruce");
}

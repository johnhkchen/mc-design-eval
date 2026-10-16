// P1 salle: the west living room of the Creole cottage. Inner air x16..17, y3..6, z11..13 (2 x 3 cells).
// Entered by the French doors on z10 (x16 and x17) and the door at (17, 3..4, 14). The hearth mouth is the west wall
// cell (15, 3, 13); the stove stands in front of it. Lane kept clear: row z11 (both door first cells) and the x17
// column down to the south door, so every way in reaches every other.
import { stove, hanging_lantern } from "../vocab.mjs";

export function build(g) {
  // Focal piece: the lit stove in front of the hearth, its front to the room (east).
  stove(g, 16, 3, 13, "east");

  // No work table: the only free cell off the lane, (16, 12), is held by the chimneys part's stove, so the table
  // is dropped rather than refused. The lantern hangs from the ceiling over the room, clear of the lane.
  hanging_lantern(g, 16, 5, 12);
}

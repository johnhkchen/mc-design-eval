// P2 landing: upper landing at the stair top, rail along x32. Box [32,8,10, 33,11,10]: two floor cells (x32 and x33 at
// z10), the door from the front bedroom at (31,8..9,10) and the stair top arriving from the south at z11. Both floor cells
// stay clear (the walk runs door -> x32 -> x33 -> stair). The room is a passage, so it gets no furniture: only light,
// hung from the ceiling above the walk so no floor cell is dark and nothing stands in a lane.
import { hanging_lantern } from "../vocab.mjs";

export function build(g) {
  // Two hanging lanterns under the ceiling, one over each floor cell, at y10 (above head height, below the ceiling
  // chain). Each hangs from the first solid block above it (chain fills the air between).
  hanging_lantern(g, 32, 10, 10);
  hanging_lantern(g, 33, 10, 10);
}

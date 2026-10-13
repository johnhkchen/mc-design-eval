// Part: room: east ground corridor. Service passage from the hall (x51) to the dining room, pantry and powder room.
// Inner air x52..68 z51..52, floor y4, ceiling y9. The z52 row is the lane from every doorway to every other, so it
// stays clear; furniture stands on the z51 row against the north wall. Focal piece: the dark oak bench (stairs as
// seats) with a standing lantern on each fence post and a barrel with a flower pot.
// Hanging lanterns sit under the ceiling along the lane (y9) so the floor is lit at night.
//
// NOTHING IS PLACED HERE. The mansion shell carves all of the house's interior air, and runParts locks every cell an
// earlier part wrote (air included), so every fitting below was refused (13 of 13). No cell in this corridor is free
// for furniture. The fix belongs upstream: the shell must leave room air unwritten, or runParts must stop locking air.
// The design is kept below so it can be restored once that is done (rows as layers() reads them, index 0 = x52):
//   y4  z51 "....F..BSSS.F....": dark_oak_fence posts x56 and x64, barrel x59, dark_oak_stairs bench x60..62 (north, bottom)
//   y5  z51 "....L..P....L....": standing lanterns on the posts x56 and x64, flower_pot on the barrel x59
//   y9  z52 ".h....h....h...h.": hanging lanterns x53, x58, x63, x67
// Lamplighter: hanging lanterns down the z52 lane under the upper floor (y10), one every 3 cells. A hung lantern at y9
// lights its own floor cell at 10 and the cell two steps away at 8, so z52 and z51 stay at 8+ from x52 to x68.
// Four lanterns (the design's 53/58/63/67) leave min 7 with 5 dim cells, so six are needed. On an unlocked scratch copy
// the six give min 8, 0 dark, 0 dim. In the real build runParts refuses all six ("air" under the shell's lock), so they
// are placed here but not yet in the saved build: the lock must let the lamplighter into the room's air.
const LANTERN_X = [53, 56, 59, 62, 65, 68];

export function build(g) {
  for (const x of LANTERN_X) g.set(x, 9, 52, "lantern", { hanging: "true" });
}

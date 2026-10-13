// Part: room: back hall morning room (plan.md ROOMS, floor y4, air y4..9, interior x39..43 x z54..60).
// Intended furnishing, NOT placed: a tea table (dark oak fence post with a slab top) between two chairs (dark oak stairs),
// set in line with the north doorway; two moss-block plant stands with flowering azaleas in the far corners; three
// lanterns on chains from the upper floor (one over the table, one at each end of the room).
// Why nothing is written: the mansion shell lays air over every cell of this room (y4..9), and runParts refuses a later
// part's write into any cell an earlier part placed, air included. All 14 of this part's writes were refused, and there
// is no free cell inside the room to move them to. The fix belongs upstream: the shell should leave room interiors
// alone (the grid is already air), then this layout can go back in.
// Lamplighter: one standing lantern on the floor at the room's centre (x41, z57). Its light reaches every floor cell
// (corners at Manhattan distance 5, light 10); a wall-side spot would lift the far corner only to 8.
export function build(g) {
  g.set(41, 4, 57, "lantern", { hanging: "false" });
}

// P0 west back room: back kitchen-bedroom, inner air x 2..4, y 3..6, z 14..15.
// Plan: bed head (2,3,14) foot (3,3,14) facing west (its own cells, against the west wall x1); the stove (4,3,15)
// stands in front of the hearth mouth (4,3,16), its front to the room. Lit stove + one hanging lantern over the bed.
// Layout note: the 6 floor cells hold a bed (2), a stove (1) and the two doorway routes (north door (4,14), back door
// (2,15)) only if the route runs through (3,14) and (3,15); the bed takes (2,14)+(3,14), so the north door's landing
// (4,14) is a dead end. See plan.md Notes.
import { bed_set, stove, hanging_lantern } from "../vocab.mjs";

export function build(g) {
  // Bed: foot (3,3,14), head (2,3,14) against the west wall (x 1), facing west.
  bed_set(g, [3, 3, 14], "west", "blue");
  // Stove: lit furnace in front of the hearth mouth (4,3,16), front facing north into the room.
  stove(g, 4, 3, 15, "north", { kind: "furnace" });
  // Lantern hanging from the ceiling block (y 7) over the bed foot and the back-door landing.
  hanging_lantern(g, 3, 6, 15);
}

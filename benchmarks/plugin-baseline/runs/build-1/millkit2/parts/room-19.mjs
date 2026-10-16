// Part: room: Pyramid back hall (interior, box 41,3,15 .. 42,6,16).
// The hall is a 2x2 cell with a doorway on every side (x40 and x43 at z15..16, z14 at x41..42, back door x41 z17), so
// every floor cell is some doorway's first cell: nothing can stand on the floor without blocking a way through.
// So the only furnishing is one hanging lantern from the upper-floor block at y 7, kept over the floor, not over a door.
import { hanging_lantern } from "../vocab/h2.mjs";

export function build(g) {
  // Lantern hangs under the upper-floor block (42,7,15); light at the feet is 10+ on all four cells.
  hanging_lantern(g, 42, 6, 15);
}

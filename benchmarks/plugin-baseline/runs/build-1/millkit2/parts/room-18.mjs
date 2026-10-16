// Part: room: Pyramid vestibule (plan.md FLOORS/ROOMS: box x41..42, y3..6, z10).
// The vestibule is two air cells on the through-route: front door (z9) to the NW parlour opening (x40 z10) and the
// NE kitchen opening (x43 z10). Both cells stay clear, so the only furnishing is light: one hanging lantern from the
// ceiling over the middle of the room. No furniture: a lane needs both cells.
import { hanging_lantern } from "../vocab/h2.mjs";

export function build(g) {
  // Lantern centre of the vestibule, hung from the ceiling block above (x41, y7, z10 is the roof/tie beam).
  hanging_lantern(g, 41, 6, 10);
}

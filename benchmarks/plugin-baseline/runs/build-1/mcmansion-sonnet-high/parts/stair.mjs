// Foyer stair and chandelier (P6): the 3-wide dark_oak flight rising south at x20..22 with its bullnose, banister and
// gallery rail (plan stairFlight, E31), and the chandelier hung in the foyer void (plan chandelier, E32). Everything
// here sits inside the void (x20..25, y2..8, z9..14); the helpers only write into air.
import { stairFlight, chandelier } from "../vocab.mjs";

export function build(g) {
  stairFlight(g);
  chandelier(g);
}

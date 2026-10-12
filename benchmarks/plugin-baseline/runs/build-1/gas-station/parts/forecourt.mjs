// Part "Forecourt fittings" (parts/forecourt.mjs): the price pylon at the east verge, the air/water station, the ice chest
// and propane cage in front of the service block, the dumpster enclosure at the back east corner, and the two EV chargers
// on the west parking edge. Every element is a vocab helper at its plan.md coordinate; nothing is written outside them.
import { price_pylon, air_station, ice_chest, propane_cage, dumpster_enclosure, ev_charger } from "../vocab.mjs";

export function build(g) {
  // Price pylon: footing 38..39 y1..2, panel x37..40 z8..9 y4..13 (plan.md FACADES).
  price_pylon(g, 37, 8);

  // Air/water station: plinth x36..37 y1 at z23 (plan.md SITE table).
  air_station(g, 36, 23);

  // Ice chest in front of the service block, 3 wide x25..27 on z23.
  ice_chest(g, 25, 23);

  // Propane cage, 2x2 at x28..29 z22..23, y1..2 (plan.md: ice chest + propane cage x25..30 z22..23).
  propane_cage(g, 28, 22);

  // Dumpster enclosure x35..39 z29..33, y1..2, open on the west side (plan.md SITE table).
  dumpster_enclosure(g, 35, 29, 39, 33);

  // EV chargers on the west parking edge, x=1 at z25 and z28 (plan.md RESERVED).
  ev_charger(g, 1, 25);
  ev_charger(g, 1, 28);
}

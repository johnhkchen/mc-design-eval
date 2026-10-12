// ROOM kitchen (interior designer): galley along the north wall z=9 (fridge, quartz counter with smoker/cauldron/furnace,
// spruce upper cabinets), breakfast bar on z=12 with birch-slab stools on z=13. Orange carpet cooking mat in front of
// the hob. Hung lanterns at y=4 light the room; the hob is the brightest spot. Inner air box [11,2,9,15,4,13].
import { galley_kitchen, hung_lantern } from "../vocab.mjs";

export function build(g) {
  // galley run: fridge at x=11, counters x=12..15 on z=9, bar z=12 (x=12..14), stools z=13 (x=12..14)
  galley_kitchen(g, 11, 15, 9, 2);
  // orange accent: a cooking mat in front of the hob (carpet is walkable floor)
  for (let x = 12; x <= 14; x++) g.set(x, 2, 10, "orange_carpet");
  // lanterns hang under the ceiling at y=5; the hob is the focal light
  hung_lantern(g, 13, 10, 4);
  hung_lantern(g, 11, 12, 4);
  hung_lantern(g, 11, 10, 4);
}

// Room: Mudroom and laundry (interior designer). Inner air x2..16, y1..4, z19..23 (plan.md ROOMS).
// Layout: lockers along the garage partition (z=19) with a bench and boot tray in front; the laundry corner in the
// NE (washer, dryer, counter, sink) is the focal piece, lit by a lantern hung over it. The door (15,1..2,18), the
// tunnel (16,1..2,21) and the back door (12,1..2,24) stay clear, with a 2-high path between them.
import { B } from "../vocab.mjs";

const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);

export function build(g) {
  // Lockers: dark oak cabinets, three blocks tall, along the north (garage) partition.
  for (let x = 2; x <= 7; x++) for (let y = 1; y <= 3; y++) put(g, x, y, 19, B.block("dark_oak_planks"));
  // Standing lanterns on the locker tops, one per bank.
  put(g, 3, 4, 19, B.lantern(false));
  put(g, 6, 4, 19, B.lantern(false));

  // Bench: oak stairs as seats, back against the lockers (facing = open front, toward the room).
  for (let x = 3; x <= 6; x++) put(g, x, 1, 20, B.stairs("oak", "south", "bottom"));

  // Boot tray on the floor in front of the bench.
  for (let x = 3; x <= 6; x++) put(g, x, 1, 21, B.slab("stone_brick", "bottom"));

  // Laundry corner (NE): washer and dryer on the east wall, folding counter and sink beside them.
  put(g, 16, 1, 19, B.block("white_concrete"));          // washer
  put(g, 16, 2, 19, B.block("iron_bars"));                // washer porthole
  put(g, 16, 1, 20, B.block("white_concrete"));          // dryer
  put(g, 16, 2, 20, B.block("iron_bars"));                // dryer vent
  put(g, 14, 1, 19, B.block("white_concrete"));          // counter pedestals
  put(g, 14, 1, 20, B.block("white_concrete"));
  put(g, 14, 2, 19, B.slab("smooth_quartz", "bottom"));  // folding counter top
  put(g, 14, 2, 20, B.slab("smooth_quartz", "bottom"));
  put(g, 13, 1, 19, B.block("cauldron"));                 // sink basin

  // Hanging lanterns from the ceiling: one over the laundry corner (the focal piece), two over the passage.
  put(g, 14, 4, 21, B.lantern(true));
  put(g, 9, 4, 21, B.lantern(true));
  put(g, 4, 4, 22, B.lantern(true));
}

// Room 17: Storeroom C8 (apotheca), inner air [30,2,39,34,5,44]. Entered from the colonnade by the doorway (29,2..3,41) on the
// west wall; the window (32,3..4,45) sits in the back wall. Stores: decorated pots (amphorae) along the solid north wall
// (z=38), barrels and chests round the side walls, one slab counter for the stock-taker, bronze lamps hung from the ceiling.
// The walk line runs from the doorway (30,41) east and north, so the chest at (32,39) and the counter at (34,42) are both
// reached from clear cells. Nothing stands at the doorway cells or at (32,2..4,44) in front of the window.
import { DECORATED_POT, BARREL, CHEST, STONE_BRICK_SLAB, hangLamp } from "../vocab.mjs";

export function build(g) {
  // North wall row (against the solid z=38 gap wall): amphorae, with the chest at the centre of the row.
  for (const x of [30, 31, 33, 34]) g.set(x, 2, 39, DECORATED_POT, { facing: "south" });
  g.set(32, 2, 39, CHEST, { facing: "south", type: "single", waterlogged: "false" });

  // West wall (the doorway is at z=41, so z=41..42 stay clear): barrels north, a chest and an amphora south.
  g.set(30, 2, 40, BARREL, { facing: "up", open: "false" });
  g.set(30, 2, 43, CHEST, { facing: "east", type: "single", waterlogged: "false" });
  g.set(30, 2, 44, DECORATED_POT, { facing: "east" });

  // East wall: barrels north and south, and the stock-taker's counter (slab) with an amphora on it.
  g.set(34, 2, 40, BARREL, { facing: "up", open: "false" });
  g.set(34, 2, 43, BARREL, { facing: "up", open: "false" });
  g.set(34, 2, 42, STONE_BRICK_SLAB, { type: "bottom", waterlogged: "false" });
  g.set(34, 3, 42, DECORATED_POT, { facing: "west" });

  // Bronze light: two hung lanterns over the clear floor, away from the window cells.
  hangLamp(g, 31, 42);
  hangLamp(g, 33, 44);
}

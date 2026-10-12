// Room 9: Cubiculum C3 (NE). Box [27,2,10,34,5,14]; floor y1 and walls are P1's. Doorway (26,2..3,12) on the west wall
// from the atrium, window (35,3..4,12) on the east wall (P6 grille). Mirror of C1: a bed against the north wall (headboard
// on the wall, foot toward the room), a bedside stand with a candle, a chest at the far end, a rug and a potted fern.
// Light: one hanging lamp over the middle of the path and a standing lamp in the far corner.
// Walking line: doorway (27,12) east along z=12 to the rug, then north to the bed foot at (31,11).
import { CANDLE, CHEST, RED_BED, RED_CARPET, pot, hangLamp, lampStand, table } from "../vocab.mjs";

export function build(g) {
  // Bed: head on the north wall (z=10), foot toward the room (z=11). facing = the way from foot to head.
  g.set(31, 2, 10, RED_BED, { facing: "north", part: "head" });
  g.set(31, 2, 11, RED_BED, { facing: "north", part: "foot" });

  // Bedside stand (1x1 table: fence legs and a slab top) with a lit candle.
  table(g, 30, 10, 1, 1);
  g.set(30, 4, 10, CANDLE, { candles: "1", lit: "true" });

  // Storage: a chest at the far end of the bed, front facing into the room (west).
  g.set(34, 2, 11, CHEST, { facing: "west", type: "single", waterlogged: "false" });

  // Rug in front of the bed (walkable carpet on the floor).
  for (const [x, z] of [[30, 12], [31, 12], [30, 13], [31, 13]]) g.set(x, 2, z, RED_CARPET);

  // Potted plant in the north-west corner.
  pot(g, 28, 10, "fern");

  // Light: hanging lamp over the middle of the room, standing lamp in the south-east corner.
  hangLamp(g, 30, 12);
  lampStand(g, 33, 14, 2);
}

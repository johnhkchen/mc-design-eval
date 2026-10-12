// Room 8: Cubiculum C2 (SW), a bedroom off the atrium's west side. Inner air x1..8, y2..5, z16..21; the doorway is in the
// east wall at (9,2..3,18), the window in the west wall at (0,3..4,18). Designed as a sleeping corner on the north wall
// (bed as the focal piece, lampstand beside it, chest at the foot), a bookcase along the west wall, and a small dressing
// table by the door side. Only air cells are written; the floor and walls belong to P1.
import { CANDLE, CHEST, BOOKSHELF, RED_BED, DECORATED_POT, hangLamp, lampStand, pot, table } from "../vocab.mjs";

export function build(g) {
  // The bed on the north wall: foot at x3, head at x4, both on z16, facing east (foot to head, as vocab couch).
  g.set(3, 2, 16, RED_BED, { facing: "east", part: "foot" });
  g.set(4, 2, 16, RED_BED, { facing: "east", part: "head" });

  // A bronze lamp beside the bed head, a chest at the foot-side corner facing into the room.
  lampStand(g, 5, 16);
  g.set(1, 2, 16, CHEST, { facing: "south", type: "single", waterlogged: "false" });

  // A bookcase two high along the west wall (z19..21), kept clear of the window cell (1,3..4,18).
  for (const z of [19, 20, 21]) for (const y of [2, 3]) g.set(1, y, z, BOOKSHELF);

  // A small dressing table on the door side: dark-oak legs and top, a candle and a pot on the top.
  table(g, 6, 19, 2, 1);
  g.set(6, 4, 19, CANDLE, { candles: "1", lit: "false", waterlogged: "false" });
  g.set(7, 4, 19, DECORATED_POT);

  // A potted fern in the corner by the bed, and a bronze hanging lamp over the room's middle.
  pot(g, 8, 16, "fern");
  hangLamp(g, 4, 19);
}

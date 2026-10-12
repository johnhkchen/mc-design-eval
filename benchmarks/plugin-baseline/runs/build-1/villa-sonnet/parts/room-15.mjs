// Room C6 (Lararium): a quiet household shrine inside [1,2,39,5,5,44]. Entered from the colonnade at the east doorway
// (6,2..3,41); the window on the back wall is (3,3..4,45).
// Layout (x east, z south; the altar niche is on the west wall, x = 0):
//   - altar: stone_brick plinth (x1, y2) with a stone_brick_stairs step facing the room (x2, y2), a quartz_block top
//     (x1, y3) and three lit candles on it (y4), z41..43, centred on the axis of the doorway.
//   - bronze lamp standing at the NW corner beside the altar (lampStand at (1,40)); a copper lantern hangs from the
//     ceiling over the floor (hangLamp at (3,40)).
//   - two potted plants on stone_brick pedestals at the north corners (1,39) and (5,39).
//   - a barrel for oil at the SE corner (5,44), a red_carpet in front of the altar (x3..4, z41..43).
// The 2-high path runs from the doorway (5,41) across the carpet to the altar step (2,41..43); nothing sits over the
// doorway (6,41) or the window (3,45).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  BARREL, CANDLE, QUARTZ_BLOCK, RED_CARPET, STONE_BRICKS, lampStand, hangLamp, pot,
} from "../vocab.mjs";

export function build(g) {
  // altar: plinth against the west wall, step facing the room, quartz top, candles
  for (let z = 41; z <= 43; z++) {
    g.set(1, 2, z, STONE_BRICKS);
    g.set(2, 2, z, ...B.stairs("stone_brick", "east", "bottom"));
    g.set(1, 3, z, QUARTZ_BLOCK);
    g.set(1, 4, z, CANDLE, { candles: "1", lit: "true" });
  }

  // floor carpet in front of the altar; the walk line runs over it
  for (let x = 3; x <= 4; x++) for (let z = 41; z <= 43; z++) g.set(x, 2, z, RED_CARPET);

  // bronze light: a standing lamp by the altar and a hanging lantern over the floor
  lampStand(g, 1, 40, 2);
  hangLamp(g, 3, 40);

  // potted plants at the north corners
  pot(g, 1, 39, "fern");
  pot(g, 5, 39, "azalea");

  // oil barrel at the SE corner
  g.set(5, 2, 44, BARREL, { facing: "up", open: "false" });
}

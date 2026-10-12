// Cubiculum C4 (SE): a bedroom off the atrium, mirror of C2. Inner air x27..34, y2..5, z16..21; doorway in the west wall at
// (26,2..3,18), window in the east wall at (35,3..4,18). Layout: the bed's headboard against the north wall, a bedside table
// with a lantern beside its head, a chest in the NE corner, a red rug at the foot, two hanging lamps, a potted plant in the
// SW corner. The walk line runs straight in from the doorway along z18 and up to the bed foot, table and chest.
import { WHITE_BED, RED_CARPET, CHEST, COPPER_LANTERN, table, hangLamp, pot } from "../vocab.mjs";

export function build(g) {
  // bed: headboard (head) at the north wall z16, foot at z17; facing = foot -> head direction (north)
  g.set(31, 2, 16, WHITE_BED, { facing: "north", part: "head" });
  g.set(31, 2, 17, WHITE_BED, { facing: "north", part: "foot" });

  // bedside table at the head's west side, with a bronze lantern standing on its top slab
  table(g, 30, 16, 1, 1);
  g.set(30, 4, 16, COPPER_LANTERN, { hanging: "false" });

  // chest in the NE corner, front facing into the room
  g.set(33, 2, 16, CHEST, { facing: "south" });

  // red rug in front of the bed (carpets stay walkable)
  for (const x of [30, 31]) for (const z of [19, 20]) g.set(x, 2, z, RED_CARPET);

  // bronze hanging lamps: one over the rug, one over the chest end of the room (clear of the window and doorway)
  hangLamp(g, 30, 19);
  hangLamp(g, 33, 20);

  // potted plant on a pedestal in the SW corner, off the walk line
  pot(g, 27, 21, "fern");
}

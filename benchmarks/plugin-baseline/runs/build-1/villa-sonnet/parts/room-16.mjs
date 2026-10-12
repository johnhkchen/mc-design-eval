// Room 16: Cubiculum C7 (SE of the peristyle court), the mirror of C5. Inner air x30..34, y2..5, z32..37.
// Entered through the doorway (29,2..3,35) on the west wall; the window (35,3..4,35) on the east wall is left clear.
// Layout: bed against the north wall with its head to the wall (head z32, foot z33); bronze lampstand at the head;
// chest by the foot on the east wall; hanging lamp over a red rug in the middle; potted plant in the SW corner. The
// 2-high line from the doorway (30,35) runs across the room along x31 and x33 to the bed foot and the chest.
import { RED_BED, CHEST, RED_CARPET, lampStand, hangLamp, pot } from "../vocab.mjs";

const span = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export function build(g) {
  // bed: foot at (32,2,33), head at (32,2,32); facing = the way from foot to head (north)
  g.set(32, 2, 33, RED_BED, { facing: "north", part: "foot" });
  g.set(32, 2, 32, RED_BED, { facing: "north", part: "head" });

  // bronze lampstand at the bed head, on the west side (not in the path)
  lampStand(g, 31, 32, 2);

  // chest against the east wall by the foot, front facing the room (west)
  g.set(34, 2, 33, CHEST, { facing: "west", type: "single", waterlogged: "false" });

  // rug under the hanging lamp, in the middle of the room
  for (const x of span(31, 33)) for (const z of span(35, 36)) g.set(x, 2, z, RED_CARPET);

  // hanging lamp over the rug (lantern at y4, clear of the 2-high path)
  hangLamp(g, 32, 35);

  // potted plant in the SW corner (off the path from the doorway)
  pot(g, 30, 37, "azalea", 2);
}

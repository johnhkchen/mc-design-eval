// Taberna E4 (mirror of W1): a corner shop. Inner air x28..34, y2..5, z3..8; entered from E3 through the doorway (27,2..3,6);
// the street window is x30..32 in the z=2 wall. Layout, by use:
//   sales, street side: a masonry counter in front of the window (x30..32, z3) with two amphorae and a standing lamp on it;
//     the shopkeeper stands at z4, the customer comes in from the window.
//   stock, east wall: two barrels with one stacked on the first (x34).
//   shelves, back wall: a low dark-oak slab shelf (x29..33, z8) carrying amphorae, a chest in the corner (x28, z8).
//   light: two bronze hanging lamps over the walk (x31, x33) and a standing lampstand by the counter (x29, z4).
// The walk runs from the doorway (28,2,6) along z5..6 to the counter's front at (31,2,4); nothing stands on that line.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  STONE_BRICKS, COPPER_LANTERN, BARREL, CHEST, DECORATED_POT, hangLamp, lampStand, pot,
} from "../vocab.mjs";

export function build(g) {
  // Sales counter in front of the street window: masonry base, two amphorae and a standing bronze lamp on top.
  for (const x of [30, 31, 32]) g.set(x, 2, 3, STONE_BRICKS);
  g.set(30, 3, 3, DECORATED_POT);
  g.set(32, 3, 3, DECORATED_POT);
  g.set(31, 3, 3, COPPER_LANTERN, { hanging: "false" });

  // Stock on the east wall: barrel pair (the lower one carries the upper), facing up.
  g.set(34, 2, 3, BARREL, { facing: "up", open: "false" });
  g.set(34, 3, 3, BARREL, { facing: "up", open: "false" });
  g.set(34, 2, 4, BARREL, { facing: "up", open: "false" });

  // Back-wall shelf: dark-oak top slabs (half-height, flat top at y3) with amphorae standing on them.
  for (const x of [29, 30, 31, 32, 33]) g.set(x, 2, 8, ...B.slab("dark_oak", "top"));
  g.set(30, 3, 8, DECORATED_POT);
  g.set(32, 3, 8, DECORATED_POT);

  // Corner storage: a chest against the back wall and a potted fern in the front corner.
  g.set(28, 2, 8, CHEST, { facing: "north", type: "single", waterlogged: "false" });
  pot(g, 28, 3, "fern");

  // Light: two hanging bronze lamps over the walk and a standing lampstand between the door and the counter.
  hangLamp(g, 31, 6);
  hangLamp(g, 33, 6);
  lampStand(g, 29, 4);
}

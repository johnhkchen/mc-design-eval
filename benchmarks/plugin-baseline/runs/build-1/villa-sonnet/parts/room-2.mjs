// Room: Taberna W1 (plan ROOMS row "Taberna W1", box [1,2,3,7,5,8]). Corner cloth/oil shop: the street window (z2, x3..5) is
// P3's masonry counter; inside, a working counter stands behind it with the merchant's stock (amphorae, barrels), a
// wall shelf of pots on the west side, a loom for the cloth trade and oil barrels, a red carpet in front of the counter.
// Entered from the east through the doorway at (8,2..3,6) (P4). Walkway: x2 and x6 columns and the z6 row stay clear.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { BARREL, DARK_OAK_FENCE, DECORATED_POT, LOOM, RED_CARPET, STONE_BRICKS, hangLamp, pot } from "../vocab.mjs";

export function build(g) {
  // Working counter across the room at z4 (x3..5): masonry block with slab tops, one amphora on the middle cell.
  for (const x of [3, 4, 5]) g.set(x, 2, 4, STONE_BRICKS);
  g.set(3, 3, 4, ...B.slab("stone_brick", "bottom"));
  g.set(5, 3, 4, ...B.slab("stone_brick", "bottom"));
  g.set(4, 3, 4, DECORATED_POT);

  // Stock behind the counter at z3, the merchant's space between the counter and the street window: two barrels and an amphora.
  g.set(3, 2, 3, BARREL, { facing: "up" });
  g.set(4, 2, 3, DECORATED_POT);
  g.set(5, 2, 3, BARREL, { facing: "up" });

  // Red carpet in front of the counter (walkable), the customers' side.
  for (const x of [3, 4, 5]) g.set(x, 2, 5, RED_CARPET);

  // West wall shelving: fence posts at y2 under a dark-oak slab shelf at y3, with two pots standing on it.
  for (const z of [3, 4, 5]) {
    g.set(1, 2, z, DARK_OAK_FENCE);
    g.set(1, 3, z, ...B.slab("dark_oak", "top"));
  }
  g.set(1, 4, 3, DECORATED_POT);
  g.set(1, 4, 5, DECORATED_POT);

  // Cloth trade: a loom in the south-west corner (facing east into the room), an oil barrel beside it on the west wall.
  g.set(1, 2, 8, LOOM, { facing: "east" });
  g.set(1, 2, 6, BARREL, { facing: "up" });

  // East wall: two more barrels beside the doorway's inner side (the doorway row z6 stays clear).
  g.set(7, 2, 3, BARREL, { facing: "up" });
  g.set(7, 2, 4, BARREL, { facing: "up" });

  // A standing potted fern in the south-east corner.
  pot(g, 7, 8, "fern");

  // Bronze lamps hung from the ceiling for light.
  hangLamp(g, 3, 7);
  hangLamp(g, 6, 4);
}

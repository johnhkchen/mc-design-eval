// Room: Cellar store (inner air box [1,1,21,12,3,29]). Buried back storage on the garage level: the focal piece is the
// barrel-and-chest bank on the back wall under the small window, with a work table and two stools in the middle, a
// bookshelf-and-chest wall on the west, and barrels by the laundry door. Entries: doorways (4,1..2,20) and (11,1..2,20)
// on the north wall; the cellar stair opens east at z25..28, so x11..12 there stays clear. Lanterns hang from the
// ceiling slab at y4 so the room is lit at night.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const PLANK = "spruce";

/** build(g): the cellar store interior, written into air only (earlier parts' blocks are locked). */
export function build(g) {
  // focal bank on the back wall (z29): barrels stacked at x6, x8, x10; chests at x7, x9, x11 facing the room (north)
  for (const x of [6, 8, 10]) for (const y of [1, 2]) g.set(x, y, 29, "barrel", { facing: "up", open: "false" });
  for (const x of [7, 9, 11]) {
    g.set(x, 1, 29, "chest", { facing: "north", type: "single", waterlogged: "false" });
    g.set(x, 2, 29, "flower_pot");
  }

  // west wall (x1): bookshelves at z22..23 and z28, a chest with a pot at z25
  for (const z of [22, 23, 28]) for (const y of [1, 2]) g.set(1, y, z, "bookshelf");
  g.set(1, 1, 25, "chest", { facing: "east", type: "single", waterlogged: "false" });
  g.set(1, 2, 25, "flower_pot");

  // east, by the laundry doorway: barrel stack at x12 z21..22 (the doorway column x11 stays clear)
  g.set(12, 1, 21, "barrel", { facing: "up", open: "false" });
  g.set(12, 2, 21, "barrel", { facing: "up", open: "false" });
  g.set(12, 1, 22, "barrel", { facing: "up", open: "false" });

  // work table in the middle: spruce fence post at y1 under a spruce top-slab at y2, a pot on top, stools either side
  g.set(6, 1, 23, ...B.fence(PLANK));
  g.set(6, 2, 23, ...B.slab(PLANK, "top"));
  g.set(6, 3, 23, "flower_pot");
  g.set(5, 1, 23, ...B.stairs("stone_brick", "west", "bottom"));
  g.set(7, 1, 23, ...B.stairs("stone_brick", "east", "bottom"));

  // hanging lanterns from the ceiling slab (y4): one over the focal bank, the rest spread to light every floor cell
  g.set(8, 3, 28, ...B.lantern(true));
  g.set(3, 3, 24, ...B.lantern(true));
  g.set(11, 3, 25, ...B.lantern(true));
  g.set(7, 3, 21, ...B.lantern(true));                  // the dim north-west corner by the doorways
  g.set(2, 3, 28, ...B.lantern(true));                  // the dim back-west corner
}

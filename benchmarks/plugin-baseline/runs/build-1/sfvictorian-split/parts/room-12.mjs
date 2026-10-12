// Room: Study (P-room 12; plan.md ROOMS; inner air x10..14 y10..12 z8..9, doorway (11,10..11,10) from the landing).
// Two rows of furniture against the window wall (z=8), a clear 2-high aisle along z=9 from the doorway to every piece:
// bookshelves W, a chair under the window, the lectern (focal, under the window pair), a slab desk E. One hanging
// lantern and a wall torch light it; the aisle carries a red carpet runner.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const WOOD = "spruce";                     // stairs / slab tables, planks floor is P1's

export function build(g) {
  // west: tall bookshelf stack, y10..12 (shelves, no access needed)
  for (const y of [10, 11, 12]) g.set(10, y, 8, "bookshelf");

  // chair under the window, seat facing south into the aisle (high back on the north/window side)
  g.set(11, 10, 8, ...B.stairs(WOOD, "north", "bottom"));

  // focal: the lectern under the window pair, book open toward the aisle
  g.set(12, 10, 8, "lectern", { facing: "south", has_book: "true", powered: "false" });

  // east: slab desk (table) at y10
  g.set(13, 10, 8, ...B.slab(WOOD, "bottom"));
  g.set(14, 10, 8, ...B.slab(WOOD, "bottom"));

  // the aisle: red carpet runner (walkable), entry cell (11,10,9) left bare
  g.set(12, 10, 9, "red_carpet");
  g.set(13, 10, 9, "red_carpet");

  // light: two hanging lanterns from the birch ceiling at y13 (the west x=9 cells are open, so no wall torch)
  g.set(10, 12, 9, ...B.lantern(true));
  g.set(12, 12, 9, ...B.lantern(true));
}

// Room: Laundry and workshop (inner air box [10,1,11,14,3,19]; plain stone, practical mood).
// Layout (x 10..14 W->E, z 11..19 N->S; front is north):
//   north wall: barrel, washer cauldron (the focal piece, lit by the lantern straight above it), barrel
//   west wall (the garage side): grindstone, crafting-table workbench, anvil; doorway (10,1..2,13) stays clear
//   east wall: chest and two barrels on the party side; a slab drying table with a stair stool in the middle
//   south: barrels on the garden side; doorway (11,1..2,20) and the cell in front of it (11,19) stay clear
// Every workstation has a 1-wide clear aisle beside it, and the two doorways are joined by a 2-high clear path.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const STONE = "stone_bricks";
const STONE_FAMILY = "stone_brick";

export function build(g) {
  // north wall: a barrel, the washer cauldron, a barrel
  g.set(10, 1, 11, "barrel", { facing: "up", open: "false" });
  g.set(12, 1, 11, "cauldron", {});
  g.set(14, 1, 11, "barrel", { facing: "up", open: "false" });

  // west wall (garage side): grindstone, workbench, anvil; the doorway cell (10,1..2,13) stays clear
  g.set(10, 1, 14, "grindstone", { face: "floor", facing: "east" });
  g.set(10, 1, 16, "crafting_table", {});
  g.set(10, 1, 18, "anvil", { facing: "east" });

  // east wall (party side): a chest and two barrels
  g.set(14, 1, 13, "chest", { facing: "west", type: "single", waterlogged: "false" });
  g.set(14, 1, 14, "barrel", { facing: "up", open: "false" });
  g.set(14, 1, 15, "barrel", { facing: "up", open: "false" });

  // middle: a slab drying table with a stair stool on its garden side
  g.set(12, 1, 16, ...B.slab(STONE_FAMILY, "top"));
  g.set(12, 1, 17, ...B.stairs(STONE_FAMILY, "south", "bottom"));

  // south: barrels on the garden side; the doorway cell (11,19) stays clear
  g.set(13, 1, 19, "barrel", { facing: "up", open: "false" });
  g.set(14, 1, 19, "barrel", { facing: "up", open: "false" });

  // lanterns hang from the ceiling: one over the cauldron (the focal piece), one over the bench, one on the south side
  g.set(12, 3, 11, ...B.lantern(true));
  g.set(12, 3, 16, ...B.lantern(true));
  g.set(13, 3, 18, ...B.lantern(true));
}

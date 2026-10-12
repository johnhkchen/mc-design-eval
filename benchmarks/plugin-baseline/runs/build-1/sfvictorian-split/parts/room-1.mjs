// Room: Garage (plan.md ROOMS row 1; inner air box [2,1,5,7,3,19]). Stone floor from the shell, dim and practical:
// a small car as the focal piece (under the brightest lantern), bikes on the west wall, a workbench along the east
// wall, a small table with two stone-stair seats, barrels by the street door, hanging lanterns. Paths stay clear:
// street door (x3..6, z=4) across to the laundry doorway (x=9, z13 via x=7) and to the store doorway (x=4, z=20).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { BODY, GLASS, IRON, LANTERN, STONE_FAMILY, TIMBER } from "../vocab.mjs";

export function build(g) {
  // ---- the car (focal piece): cyan body 2x4 on the floor, glass cabin on top, under the lantern at (3,3,9) ----
  for (const x of [3, 4]) for (const z of [8, 9, 10, 11]) g.set(x, 1, z, BODY);
  for (const x of [3, 4]) for (const z of [9, 10]) g.set(x, 2, z, GLASS);

  // ---- bikes on the west wall: two iron-bar hangers per bike, wheels at y2..3 ----
  for (const z of [14, 16, 18]) for (const y of [2, 3]) g.set(2, y, z, IRON);

  // ---- workbench along the east wall (x=7, z6..9): crafting table, grindstone, barrel, anvil ----
  g.set(7, 1, 6, "crafting_table");
  g.set(7, 1, 8, "barrel", { facing: "up", open: "false" });
  g.set(7, 1, 9, "anvil", { facing: "west" });

  // ---- barrels by the street door on the west wall ----
  g.set(2, 1, 5, "barrel", { facing: "up", open: "false" });
  g.set(2, 1, 6, "barrel", { facing: "up", open: "false" });

  // ---- small table (spruce fence leg, spruce slab top) at x6 z15, stone-stair seats either side ----
  g.set(6, 1, 15, ...B.fence(TIMBER));
  g.set(6, 2, 15, ...B.slab(TIMBER, "bottom"));
  g.set(5, 1, 15, ...B.stairs(STONE_FAMILY, "west", "bottom"));
  g.set(7, 1, 15, ...B.stairs(STONE_FAMILY, "east", "bottom"));

  // ---- hanging lanterns from the ceiling slab (y4); the car's lantern is the brightest point ----
  g.set(3, 3, 9, LANTERN, { hanging: "true", waterlogged: "false" });
  g.set(6, 3, 8, LANTERN, { hanging: "true", waterlogged: "false" });
  g.set(7, 1, 5, LANTERN, { hanging: "false", waterlogged: "false" });   // standing in the street-door corner
  g.set(6, 3, 15, LANTERN, { hanging: "true", waterlogged: "false" });
  g.set(4, 3, 18, LANTERN, { hanging: "true", waterlogged: "false" });
}

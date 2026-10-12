// Room: garage (interior designer's room, box [2,1,8,13,3,18]).
// Car bay x2..5 z8..13 stays clear; the workbench and tool shelves sit on the back-west corner, bins along the east wall,
// a wash cauldron and a small work table by the window. Lanterns hang from the main-floor slab at y4 (drop 1, y3).
// Ways in: carriage doors (2..5,1..2,7), laundry door (7,1..2,19), base stair (13,1..3,15..17).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { BOOKSHELF, BARREL, CRAFTING_TABLE, WATER_CAULDRON, DARK_OAK_FENCE, SPRUCE_PRESSURE_PLATE, hangLamp } from "../vocab.mjs";

const isAir = (g, x, y, z) => ["minecraft:air", "minecraft:cave_air"].includes(g.blockAt(x, y, z));
// Add into air only: the box's cells are the room's own, but earlier parts' blocks are locked.
function put(g, x, y, z, block, state) {
  if (!isAir(g, x, y, z)) return false;
  g.set(x, y, z, block, state);
  return true;
}

export function build(g) {
  // Tool shelves on the west wall (x2) beside the bench.
  for (const z of [14, 15]) for (const y of [1, 2]) put(g, 2, y, z, BOOKSHELF);

  // Workbench in the back-west corner, the focal piece, lit by the lantern hung straight above it.
  put(g, 3, 1, 18, CRAFTING_TABLE);
  hangLamp(g, 3, 3, 18, { drop: 1 });

  // Bins: barrels along the back wall and down the east wall.
  put(g, 2, 1, 18, BARREL, { facing: "up" });
  put(g, 5, 1, 18, BARREL, { facing: "up" });
  for (const z of [8, 9, 10]) put(g, 13, 1, z, BARREL, { facing: "up" });

  // Wash cauldron near the front window (window at 8,2,7; its cells 8,1..3,8 stay clear).
  put(g, 11, 1, 8, WATER_CAULDRON, { level: "3" });

  // Small work table by the back-middle: fence post with a plate on top, a stair seat facing it.
  put(g, 9, 1, 16, DARK_OAK_FENCE);
  put(g, 9, 2, 16, SPRUCE_PRESSURE_PLATE);
  put(g, 8, 1, 16, ...B.stairs("dark_oak", "east", "bottom"));

  // Hanging lanterns across the room so no floor cell is dark.
  hangLamp(g, 4, 3, 9, { drop: 1 });
  hangLamp(g, 6, 3, 12, { drop: 1 });
  hangLamp(g, 11, 3, 15, { drop: 1 });
  hangLamp(g, 10, 3, 10, { drop: 1 });
}

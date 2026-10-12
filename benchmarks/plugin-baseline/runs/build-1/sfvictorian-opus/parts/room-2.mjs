// Room: laundry & workshop (interior designer's room, box [2,1,20,13,3,29]).
// Utilitarian garden-level room: washer (cauldron) and laundry counter on the west, a workbench on the east wall,
// bookshelves of jars along the west wall, a drying line strung across the middle, storage barrels by the garden door.
// Spine: the x7 aisle runs from the garage door (z19) straight to the garden door (z30) with y1..2 kept clear.
// Only adds into air (vocab.mjs put()); every workstation keeps a clear 1-wide aisle in front of it.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { BARREL, BOOKSHELF, CAULDRON, CRAFTING_TABLE, FLOWER_POT, POTTED_FERN, hangLamp } from "../vocab.mjs";

const BOX = [2, 1, 20, 13, 3, 29];
const inside = ([x, y, z]) => x >= BOX[0] && x <= BOX[3] && y >= BOX[1] && y <= BOX[4] && z >= BOX[2] && z <= BOX[5];
const isAir = (g, x, y, z) => ["minecraft:air", "minecraft:cave_air"].includes(g.blockAt(x, y, z));
// Add into air, inside the room box only. Skips cells another part already owns.
function put(g, x, y, z, block, state) {
  if (!inside([x, y, z]) || !isAir(g, x, y, z)) return false;
  g.set(x, y, z, block, state);
  return true;
}
const barrelUp = (g, x, y, z) => put(g, x, y, z, BARREL, { facing: "up", open: "false" });
const fence = (g, x, y, z) => put(g, x, y, z, ...B.fence("spruce"));

export function build(g) {
  // West wall: laundry counter of barrels (tops read as worktop), washer cauldron beside them, and a potted fern at the end.
  for (const z of [21, 22, 23]) barrelUp(g, 2, 1, z);
  put(g, 3, 1, 22, CAULDRON);
  put(g, 2, 2, 21, FLOWER_POT);
  put(g, 2, 2, 23, POTTED_FERN);

  // West wall, back half: shelves of jars (bookshelves two high, flower pots as the jars on top).
  for (let z = 26; z <= 28; z++) {
    put(g, 2, 1, z, BOOKSHELF);
    put(g, 2, 2, z, BOOKSHELF);
  }
  put(g, 2, 3, 26, FLOWER_POT);
  put(g, 2, 3, 28, FLOWER_POT);

  // Drying line: two spruce posts (y1..3) at x3 and x11 on z24, an iron chain strung across at y3.
  for (const x of [3, 11]) for (const y of [1, 2, 3]) fence(g, x, y, 24);
  for (let x = 4; x <= 10; x++) put(g, x, 3, 24, ...B.chain("x"));

  // East wall: workbench, crafting table at the end with a barrel run as the bench, aisle x12 kept clear.
  put(g, 13, 1, 21, CRAFTING_TABLE);
  for (const z of [22, 23, 24]) barrelUp(g, 13, 1, z);

  // East wall, garden end: storage barrels stacked by the garden door, the window cells (10,2,29) kept clear.
  barrelUp(g, 13, 1, 27);
  barrelUp(g, 13, 1, 28);
  barrelUp(g, 13, 2, 28);
  barrelUp(g, 13, 1, 29);

  // Light: hanging lanterns under the ceiling (y4) on a grid, so every floor cell is lit and the washer sits in the brightest spot.
  for (const [x, z] of [[3, 22], [7, 22], [11, 22], [7, 26], [11, 27], [3, 28]]) hangLamp(g, x, 3, z, { drop: 1 });
}

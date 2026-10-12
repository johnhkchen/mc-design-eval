// Room: front parlour, inner air box [2,5,8,9,7,17] (x2..9, y5..7, z8..17). Formal Victorian: a quartz-mantled hearth on the
// west party wall (firebox (1,5,13), lit campfire), a crimson settee and two armchairs facing it across a dark oak table on
// a red rug, an upright piano against the south partition, bookcases in the east corners, a potted fern in the bay corner.
// Light: the lit campfire, two hanging lanterns over the seating and a standing lantern on the north-east bookcase.
// Adds into air only (put()); the cased entry (10,5..7,12..13), the pocket to the dining room (5..7,5..7,18) and the front
// window (8,5..7,7) are left clear, and nothing hangs over them.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  SMOOTH_QUARTZ, CAMPFIRE, DARK_OAK_FENCE, SPRUCE_PRESSURE_PLATE, BOOKSHELF, POTTED_FERN, POTTED_RED_TULIP, RED_CARPET,
  hangLamp,
} from "../vocab.mjs";

const isAir = (g, x, y, z) => ["minecraft:air", "minecraft:cave_air"].includes(g.blockAt(x, y, z));
// Add into air only: a cell an earlier part owns is skipped, never overwritten.
function put(g, x, y, z, block, state) {
  if (!isAir(g, x, y, z)) return false;
  g.set(x, y, z, block, state);
  return true;
}

export function build(g) {
  // Hearth on the west wall: firebox (1,5..6,13) is air from the shell; the campfire sits in its floor cell, lit.
  put(g, 1, 5, 13, CAMPFIRE, { lit: "true", facing: "east" });
  // Jambs flank the opening; the quartz mantel shelf sits on them at y7 (top half). The centre of the shelf is left
  // open: a flower pot there would float over the hearth (no support below), so the pot sits on the north-east bookcase.
  for (const z of [12, 14]) for (const y of [5, 6]) put(g, 2, y, z, SMOOTH_QUARTZ);
  for (const z of [12, 13, 14]) put(g, 2, 7, z, ...B.stairs("quartz", "west", "top"));

  // Seating faces the hearth (west): crimson settee of three stairs in front of the mantel, armchairs either side.
  for (const z of [12, 13, 14]) put(g, 4, 5, z, ...B.stairs("crimson", "west", "bottom"));
  put(g, 4, 5, 10, ...B.stairs("dark_oak", "west", "bottom"));
  put(g, 4, 5, 16, ...B.stairs("dark_oak", "west", "bottom"));

  // Occasional table between the settee and the window: fence post with a pressure-plate top.
  put(g, 6, 5, 13, DARK_OAK_FENCE, {});
  put(g, 6, 6, 13, SPRUCE_PRESSURE_PLATE, {});

  // Upright piano against the south partition (z18), keys facing into the room; top half reads as the lid.
  put(g, 3, 5, 17, ...B.stairs("dark_oak", "north", "bottom"));
  put(g, 3, 6, 17, ...B.stairs("dark_oak", "north", "top"));

  // Bookcases in the east corners, clear of the cased entry at z12..13.
  for (const z of [8, 9]) for (const y of [5, 6]) put(g, 9, y, z, BOOKSHELF);
  for (const z of [16, 17]) for (const y of [5, 6]) put(g, 9, y, z, BOOKSHELF);
  put(g, 9, 7, 8, ...B.lantern(false));
  put(g, 9, 7, 9, POTTED_RED_TULIP);

  // Palm (potted fern) in the bay corner, by the window.
  put(g, 2, 5, 8, POTTED_FERN);

  // Hanging lanterns over the seating (chain at y7, lantern at y6, ceiling is the second-floor slab at y8).
  hangLamp(g, 7, 7, 11);
  hangLamp(g, 7, 7, 15);

  // Red rug under the seating, laid last so it only fills the cells the furniture left open.
  for (let x = 3; x <= 8; x++) for (let z = 9; z <= 16; z++) put(g, x, 5, z, RED_CARPET);
}

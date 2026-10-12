// Interior designer's room: "top-floor studio" (box [2,13,8,13,15,17] + bay alcove [2,13,6,5,15,6]).
// Artist's studio under the roof, open to the rafters. Easel focal piece in front of the bay, daybed on the party wall,
// worktable with barrel storage by the entry, a sketch table by the front windows, bookshelves on the east party wall,
// plants in the bay and at the windows, lanterns for light. Only ever writes into air (put()), inside the box and bay.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { CRAFTING_TABLE, BARREL, BOOKSHELF, WHITE_BED, RED_CARPET, WHITE_WOOL, DARK_OAK_FENCE, SPRUCE_PRESSURE_PLATE,
  POTTED_FERN, POTTED_RED_TULIP } from "../vocab.mjs";

const isAir = (g, x, y, z) => ["minecraft:air", "minecraft:cave_air"].includes(g.blockAt(x, y, z));
// Add into air only: a cell an earlier part owns is skipped, never overwritten.
function put(g, x, y, z, block, state) {
  if (!isAir(g, x, y, z)) return false;
  g.set(x, y, z, block, state);
  return true;
}

// A bed is two cells: the foot is placed first and the head one cell along `facing` (vanilla convention).
function bed(g, x, y, z, facing) {
  const [dx, dz] = facing === "south" ? [0, 1] : [0, -1];
  put(g, x, y, z, WHITE_BED, { facing, part: "foot", occupied: "false" });
  put(g, x + dx, y, z + dz, WHITE_BED, { facing, part: "head", occupied: "false" });
}

// Plant pot on the floor (potted plants are single blocks).
const pot = (g, x, y, z, id) => put(g, x, y, z, id, {});

// Easel: two fence legs and a canvas block on top, the focal piece in the bay's light.
function easel(g, x, y, z) {
  put(g, x, y, z, DARK_OAK_FENCE, {});
  put(g, x, y + 1, z, DARK_OAK_FENCE, {});
  put(g, x, y + 2, z, WHITE_WOOL, {});
}

// Table: fence post with a pressure plate on top (the deck-table pattern), with a stair chair facing it.
function table(g, x, y, z) {
  put(g, x, y, z, DARK_OAK_FENCE, {});
  put(g, x, y + 1, z, SPRUCE_PRESSURE_PLATE, {});
}

export function build(g) {
  // Bay alcove (x2..5 z6): two pots flank a lantern; the middle of the bay stays clear.
  pot(g, 2, 13, 6, POTTED_FERN);
  put(g, 3, 13, 6, ...B.lantern(false));
  pot(g, 5, 13, 6, POTTED_RED_TULIP);

  // Focal piece: easel facing the room, in the bay's light.
  easel(g, 3, 13, 9);

  // Daybed on the west party wall (foot at z11, head at z12, both facing south), with a red rug on the floor beside it.
  bed(g, 2, 13, 11, "south");
  for (const x of [4, 5]) for (const z of [11, 12, 13]) put(g, x, 13, z, RED_CARPET, {});

  // Sketch table by the front window with a chair facing it.
  table(g, 8, 13, 12);
  put(g, 8, 13, 13, ...B.stairs("spruce", "north", "bottom"));
  pot(g, 8, 13, 8, POTTED_FERN);
  pot(g, 12, 13, 8, POTTED_RED_TULIP);

  // Worktable by the entry, lantern on top, barrel storage beside it.
  put(g, 9, 13, 15, CRAFTING_TABLE, {});
  put(g, 9, 14, 15, ...B.lantern(false));
  put(g, 10, 13, 15, BARREL, { facing: "up", open: "false" });

  // Bookshelf wall on the east party wall.
  for (const z of [9, 10, 11]) for (const y of [13, 14]) put(g, 13, y, z, BOOKSHELF, {});

  // Standing lanterns for a second pool of light by the east side and the dim south-west corner.
  put(g, 12, 13, 14, ...B.lantern(false));
  put(g, 3, 13, 16, ...B.lantern(false));
}

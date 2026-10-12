// Room: upper hall (interior designer). Box [11,9,11,13,11,24]: x11..13, y9..11, z11..24; floor spruce_planks at y8,
// ceiling y12. The stairwell (x13, z13..19) is owned by P1 (E20) and its banister at (12,9,13..15). Layout:
// x11 is a clear 2-high walkway from the north door to the south door; x12..13 hold the furniture by use.
// North: linen chest (barrels) by the sewing door. Middle: the stairwell banister with a hanging lamp as the focal piece.
// South: reading corner (bookshelves on the party wall, a stair seat and a table) by the back bedroom door.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { BARREL, LANTERN, POTTED_RED_TULIP, POTTED_FERN, BOOKSHELF, DARK_OAK_FENCE, SPRUCE_PRESSURE_PLATE, RED_CARPET, hangLamp } from "../vocab.mjs";

// Add into air only: a cell another element already owns is skipped, never overwritten.
const isAir = (g, x, y, z) => ["minecraft:air", "minecraft:cave_air"].includes(g.blockAt(x, y, z));
function put(g, x, y, z, block, state) {
  if (!isAir(g, x, y, z)) return false;
  g.set(x, y, z, block, state);
  return true;
}

export function build(g) {
  // Runner: a red carpet down the walkway (x11) from the north door to the south door.
  for (let z = 11; z <= 24; z++) put(g, 11, 9, z, RED_CARPET, {});

  // North: linen chest of two barrels on the east side, a lantern on the lower one, a potted flower on the top (the
  // "picture" on the landing). (12,9,11) stays clear: it is the cell in front of the sewing room door.
  put(g, 13, 9, 11, BARREL, { facing: "up" });
  put(g, 13, 9, 12, BARREL, { facing: "up" });
  put(g, 13, 10, 11, POTTED_RED_TULIP, {});
  put(g, 13, 10, 12, LANTERN, { hanging: "false", waterlogged: "false" });

  // Focal piece: the stairwell banister (P1, x12 z13..15) with a hanging lamp over it.
  hangLamp(g, 12, 11, 14);

  // South: a second hanging lamp, a potted fern by the stair foot, and the reading corner against the party wall.
  hangLamp(g, 12, 11, 20);
  put(g, 13, 9, 20, POTTED_FERN, {});
  for (let y = 9; y <= 10; y++) for (let z = 21; z <= 22; z++) put(g, 13, y, z, BOOKSHELF, {});
  put(g, 12, 9, 23, DARK_OAK_FENCE, {});
  put(g, 12, 10, 23, SPRUCE_PRESSURE_PLATE, {});
  put(g, 13, 9, 23, ...B.stairs("dark_oak", "west", "bottom"));
}

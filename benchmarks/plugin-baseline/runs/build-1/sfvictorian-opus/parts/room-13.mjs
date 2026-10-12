// Room: top landing (interior designer's room, inner air box [4,13,19,13,15,24]).
// Reading nook at the stair head: crimson armchair facing the lightwell window (3,13..15,21), a lamp table beside it,
// bookshelves along the north and south walls, a carpet, a barrel with a lantern by the stair arrival. The way in
// (door (11,13..14,18), stair arrival (13,13,20), door (12,13..14,25)) and the stairhole x13 z18..19 stay clear.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const BOOKSHELF = "bookshelf";
const BARREL = "barrel";
const RED_CARPET = "red_carpet";
const POTTED_FERN = "potted_fern";

// Add into air only: a cell another element already owns is skipped, never overwritten.
const isAir = (g, x, y, z) => ["minecraft:air", "minecraft:cave_air"].includes(g.blockAt(x, y, z));
function put(g, x, y, z, block, state) {
  if (!isAir(g, x, y, z)) return false;
  g.set(x, y, z, block, state);
  return true;
}

export function build(g) {
  // Bookshelf wall on the north side (z19), two high, with a lantern on top of the west end.
  for (let x = 4; x <= 9; x++) for (let y = 13; y <= 14; y++) put(g, x, y, 19, BOOKSHELF, {});
  put(g, 5, 15, 19, ...B.lantern(false));

  // Armchair by the lightwell window: crimson stair with its back to the east, seat facing the window (west).
  put(g, 4, 13, 21, ...B.stairs("crimson", "west", "bottom"));
  // Lamp table beside the armchair: birch fence leg with a lantern on top.
  put(g, 4, 13, 22, ...B.fence("birch"));
  put(g, 4, 14, 22, ...B.lantern(false));

  // Rug in the middle of the room.
  for (let x = 5; x <= 7; x++) for (let z = 21; z <= 23; z++) put(g, x, 13, z, RED_CARPET, {});

  // Bookshelves on the south side (z24), with a lantern on the middle one; potted fern in the south-west corner.
  for (let x = 6; x <= 9; x++) put(g, x, 13, 24, BOOKSHELF, {});
  put(g, 8, 14, 24, ...B.lantern(false));
  put(g, 4, 13, 24, POTTED_FERN, {});

  // Storage barrel against the party wall by the stair arrival (kept off x13 z18..20), lantern on top.
  put(g, 13, 13, 23, BARREL, { facing: "up", open: "false" });
  put(g, 13, 14, 23, ...B.lantern(false));
}

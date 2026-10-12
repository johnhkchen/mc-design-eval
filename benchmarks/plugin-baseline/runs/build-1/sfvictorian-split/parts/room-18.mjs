// Box room (attic storage and guest bed). Inner air x1..14, y14..16, z23..29; floor birch slab at y13 (stand y14).
// Ways in: the upper stair lands at (13..14,14,23); the doorway (6,14..15,23) to the top room.
// Layout: guest cot on the W wall under a hanging lantern (the focal piece); bedside stand; trunks and barrels
// along the S wall; bookshelves on the E wall; a central table on a red rug. The walk path runs along z24..28.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// the room's lanterns hang from the roof deck (y17), so the lamps sit at y16 and clear the 2-high path
const LAMP = { y: 16 };

export function build(g) {
  // --- guest cot (focal): head at x1 against the W wall, foot at x2, facing west (head = foot + facing) ---
  g.set(2, 14, 26, "white_bed", { facing: "west", part: "foot", occupied: "false" });
  g.set(1, 14, 26, "white_bed", { facing: "west", part: "head", occupied: "false" });
  g.set(2, LAMP.y, 26, ...B.lantern(true));                  // hanging lantern over the cot

  // --- bedside stand: spruce fence post with a spruce slab top, a candle on it ---
  g.set(1, 14, 25, "spruce_fence", {});
  g.set(1, 15, 25, "spruce_slab", { type: "top", waterlogged: "false" });
  g.set(1, 16, 25, "candle", { candles: "1", lit: "true", waterlogged: "false" });

  // --- rug and central work table: fence post, slab top, flower pot ---
  for (let x = 8; x <= 10; x++) g.set(x, 14, 26, "red_carpet", {});
  g.set(9, 14, 25, "spruce_fence", {});
  g.set(9, 15, 25, "spruce_slab", { type: "top", waterlogged: "false" });
  g.set(9, 16, 25, "flower_pot", {});
  g.set(9, LAMP.y, 27, ...B.lantern(true));                  // hanging lantern over the table

  // --- E wall shelving: bookshelves two high ---
  for (let z = 26; z <= 28; z++) {
    g.set(14, 14, z, "bookshelf", {});
    g.set(14, 15, z, "bookshelf", {});
  }
  g.set(13, LAMP.y, 25, ...B.lantern(true));                 // hanging lantern by the stair foot

  // --- S wall storage: trunks (chests) and barrels ---
  g.set(9, 14, 29, "chest", { facing: "north", type: "single", waterlogged: "false" });
  g.set(13, 14, 29, "chest", { facing: "north", type: "single", waterlogged: "false" });
  g.set(7, 14, 29, "barrel", { facing: "up", open: "false" });
  g.set(8, 14, 29, "barrel", { facing: "up", open: "false" });
}

// Top room: a studio under the flat roof (plan.md ROOMS; inner air x1..12, y14..16, z7..22).
// Birch floor (shell). Skylight x6..9 z15..17 (openings part) is the light over the drafting desk, the focal piece.
// The fireplace breast sits on the W party wall at z11..13 (x=1, storeys 3). The stair head x13..14 z18..22 is
// railed along the room's east edge (x=12), so the open stair side is not a drop beside the room.
// Furniture grouped by use: reading corner by the fireplace, drafting pair under the skylight, bookshelves on the
// E wall, a workbench and supply barrels at the S end by the doorway (6,14..15,23).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { BRICK } from "../vocab.mjs";

export function build(g) {
  // fireplace breast on the W wall, z11..13 (y14..16)
  for (let z = 11; z <= 13; z++) for (let y = 14; y <= 16; y++) g.set(1, y, z, BRICK);

  // reading corner by the fireplace: a seat facing the hearth, a side table with a lantern
  g.set(2, 14, 12, ...B.stairs("birch", "east", "bottom"));
  g.set(2, 14, 10, ...B.fence("dark_oak"));
  g.set(2, 15, 10, ...B.slab("birch", "top"));
  g.set(2, 16, 10, ...B.lantern(false));

  // rug in front of the hearth
  for (let x = 3; x <= 6; x++) for (let z = 11; z <= 13; z++) g.set(x, 14, z, "minecraft:purple_carpet");

  // drafting desk under the skylight (focal): a 2x2 slab top on four dark-oak fence legs
  for (const [x, z] of [[7, 15], [8, 15], [7, 16], [8, 16]]) {
    g.set(x, 14, z, ...B.fence("dark_oak"));
    g.set(x, 15, z, ...B.slab("birch", "top"));
  }
  g.set(7, 16, 15, ...B.lantern(false));
  g.set(8, 16, 15, "minecraft:flower_pot");
  g.set(7, 16, 16, "minecraft:candle", { candles: "1", lit: "true", waterlogged: "false" });
  // easel (lectern) on the W side of the desk, two stool-stairs on the E side as seats
  g.set(6, 14, 15, "minecraft:lectern", { facing: "east", has_book: "false", powered: "false" });
  g.set(9, 14, 15, ...B.stairs("birch", "east", "bottom"));
  g.set(9, 14, 16, ...B.stairs("birch", "east", "bottom"));

  // bookshelves on the E wall (two high), with a paper barrel at the N end
  for (let z = 9; z <= 11; z++) for (let y = 14; y <= 15; y++) g.set(12, y, z, "minecraft:bookshelf");
  g.set(12, 14, 8, "minecraft:barrel", { facing: "up", open: "false" });
  g.set(12, 15, 8, "minecraft:bookshelf");
  g.set(11, 14, 8, ...B.lantern(false));

  // workbench and supply store at the S end, by the doorway
  g.set(4, 14, 20, "minecraft:crafting_table");
  g.set(1, 14, 20, "minecraft:barrel", { facing: "up", open: "false" });
  g.set(1, 14, 21, "minecraft:barrel", { facing: "up", open: "false" });
  g.set(4, 15, 20, ...B.lantern(false));
  g.set(11, 14, 19, ...B.lantern(false));

  // stair head rail: the open east edge of the room over the upper stair
  for (let z = 18; z <= 22; z++) g.set(12, 14, z, ...B.fence("dark_oak"));

  // wall torches on the W party wall for the room's light (y15)
  g.set(1, 15, 18, ...B.wallTorch("east"));
  g.set(1, 15, 22, ...B.wallTorch("east"));
}

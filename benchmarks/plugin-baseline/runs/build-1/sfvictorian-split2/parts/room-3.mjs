// room: Laundry and store (garage level, inner air [2,1,21,13,3,31]).
// Back of the garage level: a laundry bank of cauldrons on the west wall (the focal piece, under a hanging lantern),
// a furnace and blast furnace boiler, barrels and chests for stores, a fold table in the middle, and a garden-tool
// corner in the south-east. The stair up (x12..13 z21..23, foot z24) stays clear, as do the doorway (x6..7 z20), the
// back door (x3 z32) and the window (x7..8 y2..3 z32).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { table } from "../vocab.mjs";

const BARREL = ["barrel", { facing: "up", open: "false" }];
const chest = (facing) => ["chest", { facing, type: "single", waterlogged: "false" }];
const LANTERN_HANGING = B.lantern(true);

export function build(g) {
  // West wall: the laundry bank (focal piece). Two cauldrons either side of a water cauldron.
  g.set(2, 1, 21, ...BARREL);
  g.set(2, 1, 22, "cauldron", {});
  g.set(2, 1, 23, "water_cauldron", { level: "3" });
  g.set(2, 1, 24, "cauldron", {});
  g.set(2, 3, 23, ...LANTERN_HANGING);

  // West wall, south of the bank: storage and the boiler.
  g.set(2, 1, 25, ...chest("east"));
  g.set(2, 1, 26, ...BARREL);
  g.set(2, 1, 28, "furnace", { facing: "east", lit: "true" });
  g.set(2, 1, 29, "blast_furnace", { facing: "east", lit: "true" });
  g.set(2, 1, 30, ...BARREL);
  g.set(2, 1, 31, ...BARREL);

  // North wall, west of the doorway (x6..7 stays clear): stores.
  g.set(3, 1, 21, ...BARREL);
  g.set(4, 1, 21, ...chest("south"));
  g.set(5, 1, 21, ...BARREL);

  // North wall, east of the doorway: a second store, kept off the stair.
  g.set(8, 1, 21, ...chest("south"));
  g.set(9, 1, 21, ...BARREL);

  // Middle: the fold table with a basket of linen beside it.
  table(g, 7, 1, 26);
  g.set(9, 1, 27, "white_wool", {});
  g.set(9, 1, 26, "white_wool", {});

  // South-east: the garden-tool corner. Stonecutter bench, a chest of tools, and a potted fern on a barrel.
  g.set(13, 1, 31, "stonecutter", { facing: "north" });
  g.set(11, 1, 31, ...chest("north"));
  g.set(12, 1, 30, ...BARREL);
  g.set(12, 2, 30, "potted_fern", {});

  // Hanging lanterns under the main floor: the focal bank first, then spread through the room.
  g.set(6, 3, 24, ...LANTERN_HANGING);
  g.set(10, 3, 25, ...LANTERN_HANGING);
  g.set(10, 3, 29, ...LANTERN_HANGING);
  g.set(5, 3, 29, ...LANTERN_HANGING);
}

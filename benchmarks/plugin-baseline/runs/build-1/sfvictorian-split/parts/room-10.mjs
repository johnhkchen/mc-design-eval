// Room: Front bedroom (interior designer). Inner air box [1,10,7,8,12,15]; doorway (9,10..11,12) from the landing.
// Layout: fireplace breast on the W wall (x1..2, z11..13) with a mantel; a double bed (two red beds, head E against the
// party partition x=9, feet W) with a barrel nightstand; a purple rug on the floor; a bookshelf stack on the N corner;
// a chest wardrobe along the S wall (x6..8, z15); a lectern and a stair-seat chair at the SW; hanging lanterns for light.
// Walk path: doorway (8,10,12) -> (7,10,11) -> (7,10,10) reaches the bed foot side; the bay opens along z7 x2..7 (kept clear).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const BREAST = "bricks";
const MANTEL = B.slab("smooth_quartz", "bottom");
const BED = "red_bed";
const RUG = "purple_carpet";

export function build(g) {
  // fireplace on the W party wall: breast x1 z11..13 y10..12, firebox at (2,10,12), bricks around, mantel shelf y12
  for (const y of [10, 11, 12]) for (const z of [11, 12, 13]) g.set(1, y, z, BREAST);
  g.set(2, 10, 11, BREAST); g.set(2, 11, 11, BREAST);
  g.set(2, 10, 13, BREAST); g.set(2, 11, 13, BREAST); g.set(2, 11, 12, BREAST);
  g.set(2, 10, 12, "furnace", { facing: "east", lit: "true" });
  for (const z of [11, 12, 13]) g.set(2, 12, z, ...MANTEL);

  // bookshelf stack on the N corner (x1, z8): z7 is the front wall (the shell's siding), so the room's N row is z8
  g.set(1, 10, 8, "bookshelf");
  g.set(1, 11, 8, "bookshelf");

  // double bed: two red beds side by side at z8..9; foot W (x7), head E (x8) against the partition; facing = foot to head
  for (const z of [8, 9]) {
    g.set(7, 10, z, BED, { facing: "east", part: "foot", occupied: "false" });
    g.set(8, 10, z, BED, { facing: "east", part: "head", occupied: "false" });
  }
  // nightstand S of the bed: barrel with a standing lantern on top
  g.set(8, 10, 10, "barrel", { facing: "up", open: "false" });
  g.set(8, 11, 10, "lantern", { hanging: "false", waterlogged: "false" });

  // purple rug across the middle of the floor (carpet is walkable)
  for (const x of [3, 4, 5]) for (const z of [9, 10, 11]) g.set(x, 10, z, RUG);

  // wardrobe: three chests along the S wall, fronts to the room
  for (const x of [6, 7, 8]) g.set(x, 10, 15, "chest", { facing: "north", type: "single", waterlogged: "false" });

  // writing corner SW: lectern on the S wall, a stair seat in front of it
  g.set(3, 10, 15, "lectern", { facing: "north", has_book: "true", powered: "false" });
  g.set(3, 10, 14, "spruce_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });

  // light: hanging lanterns from the ceiling slab (y13), one over the bed, one over the rug, one by the wardrobe
  g.set(7, 12, 9, "lantern", { hanging: "true", waterlogged: "false" });
  g.set(4, 12, 10, "lantern", { hanging: "true", waterlogged: "false" });
  g.set(4, 12, 14, "lantern", { hanging: "true", waterlogged: "false" });
}

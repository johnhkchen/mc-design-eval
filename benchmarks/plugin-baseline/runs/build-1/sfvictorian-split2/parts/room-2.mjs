// room: Cellar workshop (plan.md ROOMS: inner air [10,1,8,13,3,19], entered from the garage through (10,1..2,12)).
// The x10 partition and the z20 wall are the stairs part's, so the usable floor is x11..13 (party wall at x14).
// Layout: wine store barrels and bookshelves at the north (front) end, a reading lectern and cauldron mid-room,
// the workbenches along the back wall with the smithing table as the focal piece. The aisle is x12, kept clear
// from the doorway at z12 up to every station. Hanging lanterns on the ceiling beams light the whole floor.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { BARREL, BOOKSHELF, LECTERN, CAULDRON, GRINDSTONE, CRAFTING_TABLE, SMITHING_TABLE, table } from "../vocab.mjs";

export function build(g) {
  // West shelves: a two-high bookshelf wall at x11, z8..10.
  for (let z = 8; z <= 10; z++)
    for (let y = 1; y <= 2; y++) g.set(11, y, z, BOOKSHELF);

  // East wine store: barrels along x13, z8..10, two of them stacked.
  for (let z = 8; z <= 10; z++) g.set(13, 1, z, BARREL, { facing: "up", open: "false" });
  for (let z = 8; z <= 9; z++) g.set(13, 2, z, BARREL, { facing: "up", open: "false" });

  // Reading lectern on the west wall, facing the aisle.
  g.set(11, 1, 14, LECTERN, { facing: "east", has_book: "false" });

  // Wine press: a cauldron on the east wall.
  g.set(13, 1, 13, CAULDRON);

  // Grindstone and a tasting table with a stair seat, all on the east wall.
  g.set(13, 1, 15, GRINDSTONE, { face: "floor", facing: "west" });
  g.set(13, 1, 16, ...B.stairs("dark_oak", "south", "bottom"));
  table(g, 13, 1, 17);

  // Back wall workbenches: a crafting table on the west, the smithing table as the focal piece in the middle.
  g.set(11, 1, 18, CRAFTING_TABLE);
  g.set(12, 1, 19, SMITHING_TABLE);

  // Hanging lanterns from the ceiling (y4 floor above): one over the focal bench, two spaced along the aisle.
  for (const z of [10, 14, 19]) g.set(12, 3, z, ...B.lantern(true));
}

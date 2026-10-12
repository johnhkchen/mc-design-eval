// PART 5: INTERIOR (stairs, hearth, furniture, lanterns) of the farmhouse. The shell part already built walls, floors, partition, chimney breast.
// Ticks elements.md: E20 (stairs), E21 (hearth), E22 (kitchen), E23 (parlour), E24 (bedrooms), E25 (interior lights).
// Import from ../vocab.mjs: table, chair, bed, barrel, chest, hearth, furnace, bookshelf, waterCauldron, pot, lantern, B.
// Cells: ground-floor rooms y=2..4 (walk y=2), upper rooms y=6..7 (walk y=6, open to the rafters above). Write ONLY into air. Keep doorways clear:
// (9,2..3,13), (9,6..7,13), the front door (8,2..3,11) and the east door (15,2..3,15) with the cell inside each.
// chair(g,x,y,z,facing): `facing` is the way the SITTER looks (toward the table). bed(g,x,y,z,facing,color): foot at (x,z), head one cell on in `facing`.
//
// STAIRS (rise south along the west wall x=2): g.set(2,2,13,...B.stairs("oak","south")), (2,3,14), (2,4,15), (2,5,16) (the last replaces the floor at the landing;
//   (2,5,14) and (2,5,15) are already open). Rail: g.set(x,6,z,...B.fence("oak")) at (3,6,14), (3,6,15), (2,6,13). Barrels under the stair: barrel(g,2,2,15), (2,2,16).
//
// GROUND FLOOR
//  Parlour (x=2..8, z=12..18): table(g,5,2,15), table(g,6,2,15); chair(g,5,2,14,"south"), (6,2,14,"south"), (5,2,16,"north"), (6,2,16,"north"), (4,2,15,"east"), (7,2,15,"west");
//    bookshelf at (6,2,18), (6,3,18), (7,2,18), (7,3,18); chest(g,3,2,18,"north"); pot(g,3,2,12,"potted_fern"); lantern(g,5,4,15,true).
//  Kitchen (x=10..14, z=12..18): hearth(g,10,2,15,"east") in the brick niche; g.set(11,2,15,...B.stairs("stone_brick","west")) as the hearth step;
//    counter on z=12: barrel(g,11,2,12), g.set(12,2,12,"crafting_table"), furnace(g,13,2,12,"south","smoker"), furnace(g,14,2,12,"south","furnace");
//    waterCauldron(g,14,2,13); table(g,13,2,16), table(g,13,2,17); chair(g,12,2,16,"east"), (12,2,17,"east"), (14,2,16,"west"), (14,2,17,"west"), (13,2,18,"north");
//    lantern(g,13,4,16,true); barrel(g,14,2,18), barrel(g,10,2,18); pot(g,11,2,18,"potted_poppy").
//
// UPPER FLOOR
//  West bedroom + landing (x=2..8, z=12..18): bed(g,5,6,17,"south","red"); bed(g,7,6,17,"south","white"); barrel(g,6,6,18) with lantern(g,6,7,18) on it;
//    chest(g,3,6,18,"north"); red_carpet at (5,6,14), (6,6,14), (5,6,15), (6,6,15) (g.set(x,6,z,"red_carpet")).
//  East bedroom (x=10..14, z=12..18; the chimney breast fills x=9..10, z=14..15): bed(g,13,6,17,"east","blue"); barrel(g,14,6,13), barrel(g,14,6,14) with lantern(g,14,7,14);
//    bookshelf(g,12,6,18); pot(g,11,6,12,"potted_oxeye_daisy").
// Check: `node <mcd> render build.nbt --eye 8,3.5,12.5 --look 6,2.5,18 --label parlour --eye 12,3.5,13 --look 13,2,18 --label kitchen` and Read the PNGs.
import { table, chair, bed, barrel, chest, hearth, furnace, bookshelf, waterCauldron, pot, lantern, B } from "../vocab.mjs";

export function build(g) {
  // E20: STAIRS
  g.set(2, 2, 13, ...B.stairs("oak", "south"));
  g.set(2, 3, 14, ...B.stairs("oak", "south"));
  g.set(2, 4, 15, ...B.stairs("oak", "south"));
  g.set(2, 5, 16, ...B.stairs("oak", "south"));
  // Stair rail
  g.set(3, 6, 14, ...B.fence("oak"));
  g.set(3, 6, 15, ...B.fence("oak"));
  g.set(2, 6, 13, ...B.fence("oak"));
  // Barrels under stair
  barrel(g, 2, 2, 15);
  barrel(g, 2, 2, 16);

  // E23: PARLOUR (x=2..8, z=12..18, y=2..4)
  table(g, 5, 2, 15);
  table(g, 6, 2, 15);
  chair(g, 5, 2, 14, "south");
  chair(g, 6, 2, 14, "south");
  chair(g, 5, 2, 16, "north");
  chair(g, 6, 2, 16, "north");
  chair(g, 4, 2, 15, "east");
  chair(g, 7, 2, 15, "west");
  // Bookshelves 2x2
  bookshelf(g, 6, 2, 18);
  bookshelf(g, 6, 3, 18);
  bookshelf(g, 7, 2, 18);
  bookshelf(g, 7, 3, 18);
  // Chest and pot
  chest(g, 3, 2, 18, "north");
  pot(g, 3, 2, 12, "potted_fern");
  // Parlour hanging lantern
  lantern(g, 5, 4, 15, true);

  // E21: HEARTH (in the brick niche at x=9..10, z=14..15)
  hearth(g, 10, 2, 15, "east");
  // Hearth step
  g.set(11, 2, 15, ...B.stairs("stone_brick", "west"));

  // E22: KITCHEN (x=10..14, z=12..18, y=2..4)
  // Counter on z=12
  barrel(g, 11, 2, 12);
  g.set(12, 2, 12, "crafting_table");
  furnace(g, 13, 2, 12, "south", "smoker");
  furnace(g, 14, 2, 12, "south", "furnace");
  // Water cauldron
  waterCauldron(g, 14, 2, 13);
  // Dining table
  table(g, 13, 2, 16);
  table(g, 13, 2, 17);
  // Dining chairs
  chair(g, 12, 2, 16, "east");
  chair(g, 12, 2, 17, "east");
  chair(g, 14, 2, 16, "west");
  chair(g, 14, 2, 17, "west");
  chair(g, 13, 2, 18, "north");
  // Kitchen hanging lantern
  lantern(g, 13, 4, 16, true);
  // Barrels
  barrel(g, 14, 2, 18);
  barrel(g, 10, 2, 18);
  // Pot
  pot(g, 11, 2, 18, "potted_poppy");

  // E24: WEST BEDROOM (x=2..8, z=12..18, y=6..7)
  bed(g, 5, 6, 17, "south", "red");
  bed(g, 7, 6, 17, "south", "white");
  barrel(g, 6, 6, 18);
  lantern(g, 6, 7, 18, false);
  chest(g, 3, 6, 18, "north");
  // Red carpets
  g.set(5, 6, 14, "red_carpet");
  g.set(6, 6, 14, "red_carpet");
  g.set(5, 6, 15, "red_carpet");
  g.set(6, 6, 15, "red_carpet");

  // E24: EAST BEDROOM (x=10..14, z=12..18, y=6..7)
  bed(g, 13, 6, 17, "east", "blue");
  barrel(g, 14, 6, 13);
  barrel(g, 14, 6, 14);
  lantern(g, 14, 7, 14, false);
  bookshelf(g, 12, 6, 18);
  pot(g, 11, 6, 12, "potted_oxeye_daisy");
}

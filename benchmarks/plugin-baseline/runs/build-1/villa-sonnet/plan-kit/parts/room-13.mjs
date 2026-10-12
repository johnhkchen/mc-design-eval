// STUB: build(g) does nothing yet. The part's worker replaces this file.
//
// Scope:
//   You are the INTERIOR DESIGNER of the Triclinium: Festive dining room. Three couches (red beds with dark-oak
//   rails) on the west, north and east sides and a low table in the middle, open to the south doorway. Niche lamps;
//   meander mosaic with an orange emblem at x29..31,z25..27.. Its inner air is the box [26,2,23,34,5,30]
//   (x0,y0,z0,x1,y1,z1); it is entered through Doorway (25,2..3,27) from the tablinum; opening (27..28,2..4,31) to
//   the colonnade; window (35,3..4,26).. Design it for its purpose and build it, inside that box only: a layout that
//   reads at a glance (a focal piece, furniture grouped by use), real blocks with correct states (stairs as seats,
//   slabs and trapdoors as tables and shelves, beds with facing and part, barrels, lanterns, carpets, flower pots,
//   item frames are not blocks), light so it isn't dark, nothing over the doorways or windows. Keep it WALKABLE: a
//   2-high clear path from every way in across the room and up to every bed, table and workstation; check with `$MCD
//   walk build.nbt --rooms rooms.json` that your room reads ok.
//
// plan.md ROOMS row:
//   | Triclinium | [26,2,23,34,5,30] | border `black_terracotta` ring, meander `red_terracotta`/`yellow_terracotta`,
//   emblem 3x3 `orange_glazed_terracotta` at x29..31,z25..27 | festive, warm; 3 couches W/N/E, table, niche lamps |
//   doorway (25,2..3,27); opening (27..28,2..4,31) to the colonnade | (35,3..4,26) |
export function build(g) {}

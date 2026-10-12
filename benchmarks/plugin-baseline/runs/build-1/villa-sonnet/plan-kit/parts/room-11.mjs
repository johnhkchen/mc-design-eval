// STUB: build(g) does nothing yet. The part's worker replaces this file.
//
// Scope:
//   You are the INTERIOR DESIGNER of the Tablinum: The master's study on the main axis, open at both ends (to the
//   atrium and to the garden). It holds a desk of lectern and bookshelves, scroll shelves, a chair and a brazier or
//   lamp. Mosaic panel: white field, red and black borders, blue emblem at x17..18,z26..27. Keep the axis x15..20
//   clear to walk through.. Its inner air is the box [11,2,23,24,5,30] (x0,y0,z0,x1,y1,z1); it is entered through
//   Atrium opening (15..20,2..5,22); peristyle opening (15..20,2..5,31); doorways (10,2..3,27) to the kitchen and
//   (25,2..3,27) to the triclinium.. Design it for its purpose and build it, inside that box only: a layout that
//   reads at a glance (a focal piece, furniture grouped by use), real blocks with correct states (stairs as seats,
//   slabs and trapdoors as tables and shelves, beds with facing and part, barrels, lanterns, carpets, flower pots,
//   item frames are not blocks), light so it isn't dark, nothing over the doorways or windows. Keep it WALKABLE: a
//   2-high clear path from every way in across the room and up to every bed, table and workstation; check with `$MCD
//   walk build.nbt --rooms rooms.json` that your room reads ok.
//
// plan.md ROOMS row:
//   | Tablinum | [11,2,23,24,5,30] | field `white_terracotta`, border `red_terracotta`, 2nd ring `black_terracotta`,
//   emblem 2x2 `blue_glazed_terracotta` at x17..18,z26..27 | study / master's office on the axis; desk, scroll
//   shelves (`bookshelf`), lectern, chair; open both ends | atrium (15..20,2..5,22), peristyle (15..20,2..5,31),
//   doorways (10,2..3,27),(25,2..3,27) | none |
export function build(g) {}

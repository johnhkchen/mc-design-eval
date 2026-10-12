// STUB: build(g) does nothing yet. The part's worker replaces this file.
//
// Scope:
//   You are the INTERIOR DESIGNER of the Taberna W2: Inner shop or tavern next to the fauces: bar along the street
//   window, barrels, stools, a hanging lamp.. Its inner air is the box [9,2,3,14,5,8] (x0,y0,z0,x1,y1,z1); it is
//   entered through Doorway (15,2..3,6) from the fauces and (8,2..3,6) to W1; street window x10..13.. Design it for
//   its purpose and build it, inside that box only: a layout that reads at a glance (a focal piece, furniture
//   grouped by use), real blocks with correct states (stairs as seats, slabs and trapdoors as tables and shelves,
//   beds with facing and part, barrels, lanterns, carpets, flower pots, item frames are not blocks), light so it
//   isn't dark, nothing over the doorways or windows. Keep it WALKABLE: a 2-high clear path from every way in across
//   the room and up to every bed, table and workstation; check with `$MCD walk build.nbt --rooms rooms.json` that
//   your room reads ok.
//
// plan.md ROOMS row:
//   | Taberna W2 | [9,2,3,14,5,8] | `polished_andesite` | shop/tavern: bar, barrels, stools | doorway (15,2..3,6)
//   from the fauces; (8,2..3,6) | street x10..13 |
export function build(g) {}

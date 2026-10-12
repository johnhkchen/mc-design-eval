// STUB: build(g) does nothing yet. The part's worker replaces this file.
//
// Scope:
//   You are the INTERIOR DESIGNER of the Taberna W1: Corner shop on the street: a masonry counter in the window,
//   amphorae (decorated pots), barrels and shelves; a working cloth or oil merchant.. Its inner air is the box
//   [1,2,3,7,5,8] (x0,y0,z0,x1,y1,z1); it is entered through Doorway (8,2..3,6) from Taberna W2; street window x3..5
//   (counter, not a door).. Design it for its purpose and build it, inside that box only: a layout that reads at a
//   glance (a focal piece, furniture grouped by use), real blocks with correct states (stairs as seats, slabs and
//   trapdoors as tables and shelves, beds with facing and part, barrels, lanterns, carpets, flower pots, item frames
//   are not blocks), light so it isn't dark, nothing over the doorways or windows. Keep it WALKABLE: a 2-high clear
//   path from every way in across the room and up to every bed, table and workstation; check with `$MCD walk
//   build.nbt --rooms rooms.json` that your room reads ok.
//
// plan.md ROOMS row:
//   | Taberna W1 | [1,2,3,7,5,8] | `polished_andesite` | shop: counter at the window, amphorae (`decorated_pot`,
//   `barrel`), shelves | doorway (8,2..3,6) from W2; street window x3..5 (counter, not a door) | street x3..5 |
export function build(g) {}

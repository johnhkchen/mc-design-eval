// STUB: build(g) does nothing yet. The part's worker replaces this file.
//
// Scope:
//   You are the INTERIOR DESIGNER of the Storeroom C8 (apotheca): Store: amphorae (decorated pots), barrels, chests,
//   sacks; plain stone-brick floor.. Its inner air is the box [30,2,39,34,5,44] (x0,y0,z0,x1,y1,z1); it is entered
//   through Doorway (29,2..3,41) from the colonnade; window (32,3..4,45).. Design it for its purpose and build it,
//   inside that box only: a layout that reads at a glance (a focal piece, furniture grouped by use), real blocks
//   with correct states (stairs as seats, slabs and trapdoors as tables and shelves, beds with facing and part,
//   barrels, lanterns, carpets, flower pots, item frames are not blocks), light so it isn't dark, nothing over the
//   doorways or windows. Keep it WALKABLE: a 2-high clear path from every way in across the room and up to every
//   bed, table and workstation; check with `$MCD walk build.nbt --rooms rooms.json` that your room reads ok.
//
// plan.md ROOMS row:
//   | Storeroom C8 (apotheca) | [30,2,39,34,5,44] | `stone_bricks` | amphorae (`decorated_pot`), barrels, chests |
//   doorway (29,2..3,41) | (32,3..4,45) |
export function build(g) {}

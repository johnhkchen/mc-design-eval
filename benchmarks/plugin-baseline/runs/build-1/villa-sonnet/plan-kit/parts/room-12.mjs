// STUB: build(g) does nothing yet. The part's worker replaces this file.
//
// Scope:
//   You are the INTERIOR DESIGNER of the Culina (kitchen): Working kitchen, warm and smoky. Hearth at the west wall:
//   pad (1..3,y2,25..27), lit campfire at (2,3,26), stone-brick-stair hood at y5 around (2,5,26) under the open
//   flue. Counter with smoker, furnace and crafting table; water cauldron, barrels, a table.. Its inner air is the
//   box [1,2,23,9,5,30] (x0,y0,z0,x1,y1,z1); it is entered through Doorway (10,2..3,27) from the tablinum; opening
//   (7..8,2..4,31) to the colonnade; window (0,3..4,26).. Design it for its purpose and build it, inside that box
//   only: a layout that reads at a glance (a focal piece, furniture grouped by use), real blocks with correct states
//   (stairs as seats, slabs and trapdoors as tables and shelves, beds with facing and part, barrels, lanterns,
//   carpets, flower pots, item frames are not blocks), light so it isn't dark, nothing over the doorways or windows.
//   Keep it WALKABLE: a 2-high clear path from every way in across the room and up to every bed, table and
//   workstation; check with `$MCD walk build.nbt --rooms rooms.json` that your room reads ok.
//
// plan.md ROOMS row:
//   | Culina (kitchen) | [1,2,23,9,5,30] | `stone_bricks`/`cobblestone` hash | hearth at W wall (E19), counter with
//   `smoker`/`furnace`, `water_cauldron`, `barrel`s, table | doorway (10,2..3,27) from the tablinum; opening
//   (7..8,2..4,31) to the colonnade | (0,3..4,26) |
export function build(g) {}

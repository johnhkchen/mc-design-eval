// STUB: build(g) does nothing yet. The part's worker replaces this file.
//
// Scope:
//   You are the INTERIOR DESIGNER of the Fauces (entrance passage): Recessed, dim and solemn entrance corridor
//   between the shops. Double spruce doors stand at z=4 with a fanlight above; a lampstand and a potted fern sit at
//   each side (x16, x19 at z=3); the floor has a black centre strip. The whole axis to the garden is visible down
//   it.. Its inner air is the box [16,2,2,19,5,9] (x0,y0,z0,x1,y1,z1); it is entered through Street opening
//   (16..19,2..5,z2) up the step (16..19,1,1); exits into the atrium through (16..19,2..5,z9); side doorways
//   (15,2..3,6) to the west inner shop and (20,2..3,6) to the east inner shop.. Design it for its purpose and build
//   it, inside that box only: a layout that reads at a glance (a focal piece, furniture grouped by use), real blocks
//   with correct states (stairs as seats, slabs and trapdoors as tables and shelves, beds with facing and part,
//   barrels, lanterns, carpets, flower pots, item frames are not blocks), light so it isn't dark, nothing over the
//   doorways or windows. Keep it WALKABLE: a 2-high clear path from every way in across the room and up to every
//   bed, table and workstation; check with `$MCD walk build.nbt --rooms rooms.json` that your room reads ok.
//
// plan.md ROOMS row:
//   | Fauces (entrance passage) | [16,2,2,19,5,9] | `smooth_stone` with `black_terracotta` centre strip x17..18 |
//   solemn, dim; doors at z=4; lampstands + pots at x16/x19, z=3 | street (16..19,2..5,z2); atrium (16..19,2..5,z9)
//   | none |
export function build(g) {}

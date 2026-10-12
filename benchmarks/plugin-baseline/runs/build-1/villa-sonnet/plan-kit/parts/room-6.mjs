// STUB: build(g) does nothing yet. The part's worker replaces this file.
//
// Scope:
//   You are the INTERIOR DESIGNER of the Atrium: The grand, bright reception hall, open to the sky. The impluvium
//   pool x15..20,z14..17 and its coping are built by the atrium part; keep them clear. Four dark-oak Tuscan columns
//   stand at the compluvium corners. Statues in niches at (11,12) and (24,12), a marble table or bench, pots at the
//   corners, hanging bronze lamps in the roofed ring. Black-and-white checker mosaic with a red border.. Its inner
//   air is the box [10,2,10,25,5,21] (x0,y0,z0,x1,y1,z1); it is entered through Fauces opening (16..19,2..5,9);
//   tablinum opening (15..20,2..5,22); doorways (9,2..3,12), (9,2..3,18), (26,2..3,12), (26,2..3,18) to the
//   cubicula.. Design it for its purpose and build it, inside that box only: a layout that reads at a glance (a
//   focal piece, furniture grouped by use), real blocks with correct states (stairs as seats, slabs and trapdoors as
//   tables and shelves, beds with facing and part, barrels, lanterns, carpets, flower pots, item frames are not
//   blocks), light so it isn't dark, nothing over the doorways or windows. Keep it WALKABLE: a 2-high clear path
//   from every way in across the room and up to every bed, table and workstation; check with `$MCD walk build.nbt
//   --rooms rooms.json` that your room reads ok.
//
// plan.md ROOMS row:
//   | Atrium | [10,2,10,25,5,21] | black/white checker (`quartz_block`/`polished_blackstone`), 1-cell
//   `red_terracotta` border ring just inside the walls, `yellow_terracotta` ring around the coping | grand, bright
//   pool-light; impluvium + coping x14..21,z13..18, 4 Tuscan columns, bench/marble table, statues at
//   (11,12),(24,12), pots at corners | fauces opening (16..19,2..5,9); tablinum (15..20,2..5,22); doorways
//   (9,2..3,12),(9,2..3,18),(26,2..3,12),(26,2..3,18) | none (sky) |
export function build(g) {}

// STUB: build(g) does nothing yet. The part's worker replaces this file.
//
// Scope:
//   You are the INTERIOR DESIGNER of the Peristyle colonnade (covered walkway): Calm, shaded cloister around the
//   open garden. Benches, potted plants and hanging bronze lamps between the white columns, statues at the corners
//   (8,33) and (27,33). The garden court x11..24,z35..41 in the middle is open sky and belongs to the peristyle
//   part; keep it unbuilt.. Its inner air is the box [7,2,32,28,5,44] (x0,y0,z0,x1,y1,z1); it is entered through
//   Tablinum opening (15..20,2..5,31); kitchen opening (7..8,2..4,31); triclinium opening (27..28,2..4,31); doorways
//   (6,2..3,35), (6,2..3,41), (29,2..3,35), (29,2..3,41); rear door (17..18,2..3,45).. Design it for its purpose and
//   build it, inside that box only: a layout that reads at a glance (a focal piece, furniture grouped by use), real
//   blocks with correct states (stairs as seats, slabs and trapdoors as tables and shelves, beds with facing and
//   part, barrels, lanterns, carpets, flower pots, item frames are not blocks), light so it isn't dark, nothing over
//   the doorways or windows. Keep it WALKABLE: a 2-high clear path from every way in across the room and up to every
//   bed, table and workstation; check with `$MCD walk build.nbt --rooms rooms.json` that your room reads ok.
//
// plan.md ROOMS row:
//   | Peristyle colonnade (walkway) | [7,2,32,28,5,44] (the court x11..24,z35..41 in its middle is OPEN garden) |
//   `cut_sandstone`, a `terracotta` line along the column rectangle | calm, shaded cloister; benches, pots, lamps;
//   walkway cells x7..9, x26..28, z32..33, z43..44 and the column lines | tablinum (15..20,2..5,31); kitchen
//   (7..8,2..4,31); triclinium (27..28,2..4,31); rooms C5..C8; rear door (17..18,2..3,45) | open to court |
export function build(g) {}

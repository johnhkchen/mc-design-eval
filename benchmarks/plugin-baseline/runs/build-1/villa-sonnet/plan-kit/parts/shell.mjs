// STUB: build(g) does nothing yet. The part's worker replaces this file.
//
// Scope:
//   Foundation y0 across x0..35, z2..45, and the mosaic floors at y1 per the ROOMS table. Every wall line y1..6
//   (outer walls z=2, z=45, x=0, x=35; inner walls z=9, 15, 22, 31, x=8, 9, 10, 15, 20, 25, 26, 27, 6, 29) using
//   wallCell roles (stone_bricks plinth, red_terracotta dado y2..3, plaster hash y4..5, cut_sandstone cornice y6).
//   Leave every opening in the OPENINGS table unset, including the plane z=4 in the fauces. Fauces pilasters at
//   (15,z2) and (20,z2). A spruce_planks ceiling at y6 over all rooms and walkways, with the holes at compluvium
//   x14..21,z13..18, garden x11..24,z35..41 and flue (2,6,26). Leave unset: the garden floor and the pool cells
//   x15..20,z14..17 at y1 (P4 and P5 fill them). Use wallLine, wallCell, pilaster, mosaic.
//
// plan.md PARTS entry:
//   1. P1 `parts/shell.mjs` - MASSING AND SHELL. Foundation y0 (stone_bricks; dirt under the garden;
//   `blue_terracotta` under the pool), floor y1 laid per ROOMS (mosaic helper; not at the garden court / pool
//   cells), every wall line with its openings left unset (wallLine, ROOMS/OPENINGS lists), outer walls, fauces side
//   walls, pilasters at (15,z2),(20,z2) (`pilaster`), ceiling y6 `spruce_planks` over every room, the ring walkways,
//   with the holes listed (compluvium, garden court, flue (2,6,26)), y6 cornice. Ticks E1, E2 (walls), E5 (rooms),
//   E7 (ceiling hole), E10, E11 (court void), E19, E21, E22, E23, E26 (opening).
export function build(g) {}

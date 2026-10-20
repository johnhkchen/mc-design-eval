# National Gallery of Art — West Building (plot 0) and East Building (plot 1)

All coordinates are in the brief's plot frame: plot 0 x 0..100, z 0..39 (world x 769+x, z 594+z); plot 1 x 105..153, z 0..33 (world x 812+x, z 597+z). North = low z, east = high x. Neither module is turned.
Ground rule: the ground block of a cell sits at y = its GROUND value; a wall's footing replaces that block and nothing floats. Plot 0 ground is 1–2 (podium fills down to y 0). Plot 1 ground is 0 (walls start at y 0).

## SITE

West Building: a long, low, symmetrical temple about the axis **x = 50**, running along x. It has a 99-long spine, end pavilions projecting north and south, a central portico on each long face, and a low copper dome on a drum at the centre. Mall (south, z 39) and Constitution Ave (north, z 0) both get a portico. The east end face (x 99) is the face in the concept photo: plain wall, central door.
East Building: Pei's trapezoid. The west face (x 105) faces the West Building, the north edge is the Pennsylvania Ave diagonal (1 in x per 1/3 z: x = 105 + 3z), the south face (z 33) faces the Mall. It is cut into an isosceles triangle (west, galleries) and a right triangle (south-east, study centre). Between them, at the south-west, an open wedge slot ends in the knife-edge prow.

### Plot 0 masses (West Building)

| mass | x | z | y | notes |
|---|---|---|---|---|
| podium / footing | under every mass below | — | 0..3 | solid to the ground; y 3 is the floor course, walk level y 4 |
| spine (wings) | 1..99 | 9..30 | 4..14 | cornice y 12, attic y 13..14, coping y 15 |
| west end pavilion | 9..27 | 1..38 | 4..14 | projects 8 north (z 1..8) and 8 south (z 31..38) of the spine |
| east end pavilion | 73..91 | 1..38 | 4..14 | mirror of the west pavilion |
| central block | 40..60 | 9..30 | 4..17 | raised attic y 13..16, coping y 17; carries the drum |
| north portico | 42..58 | 3..8 | 4..16 | 8 columns at z 4, pediment over |
| south portico | 42..58 | 31..36 | 4..16 | 8 columns at z 35, pediment over |
| drum | circle r 7 about (50, 19), so x 43..57, z 12..26 | — | 18..20 | cornice ring y 21 |
| dome | stepped rings about (50, 19) | — | 21..24 | lantern y 25..26 |
| north steps | 41..59 | 0..2 | 2..3 | half-steps (see OPENINGS) |
| south steps | 41..59 | 37..39 | 2..3 | half-steps down to the Mall ground |
| podium terrace, south | 28..72 | 31..32 | 0..3 | a 2-deep terrace along each wing between the pavilions, flush with walk y 4 |
| podium terrace, north | 28..72 | 7..8 | 0..3 | same, north side |

Circle rows (half-widths in x about x 50, for dz = 0,1,2,… from z 19 both ways):
r 8: 8,8,8,7,7,6,5,4,2 · r 7: 7,7,7,6,6,5,4,2 · r 6: 6,6,6,5,4,3,2 · r 5: 5,5,5,4,3,2 · r 4: 4,4,3,3,1 · r 1: 1,0 (dz runs to the last entry, e.g. r 7 spans z 12..26).

### Plot 1 masses (East Building)

BODY: x ranges per row, y 0..13 walls, coping y 14. Rows not listed are empty.

| z | x | z | x |
|---|---|---|---|
| 0 | 105 | 17..26 | 105..153 |
| 1 | 105..108 | 27 | 105..114, 116..153 |
| 2 | 105..111 | 28 | 105..111, 116..153 |
| 3 | 105..114 | 29 | 105..108, 116..153 |
| 4 | 105..117 | 30 | 105, 116..153 |
| 5 | 105..120 | 31 | 113..153 |
| 6 | 105..123 | 32 | 110..146 |
| 7 | 105..126 | 33 | 108..146 |
| 8..16 | 105..(129,132,135,138,141,144,147,150,153) | | |

These rows exclude the west entrance recess (x 105..107, z 9..21: empty, the wall plane steps back to x 108) and the entrance slot (below).
The **wedge slot** (empty, open to the sky) runs z 27..33 between the isosceles triangle's SW corner and the prow. It is already left out of the rows above.

TOWERS: flat-topped parallelogram prisms, y 0..19, coping y 20. Each one replaces the body in its cells and rises 6 above the main roof.

| tower | cells (x per z) |
|---|---|
| NW (iso NW corner) | z0 105 · z1 105..108 · z2 105..111 · z3..8 105..112 · z9 108..112 · z10 111..112 |
| SW (iso SW corner) | z20 111..112 · z21 108..112 · z22..27 105..112 · z28 105..111 · z29 105..108 · z30 105 |
| NE (iso apex, east) | z13 143..144 · z14 143..147 · z15 143..150 · z16..19 143..153 · z20 144..153 · z21 147..153 · z22 150..153 · z23 153 |
| PROW / KNIFE EDGE (right triangle SW) | z28..30 116..123 · z31 113..120 · z32 110..117 · z33 108..115. The 1-cell tip at (108, 33) runs unbroken y 0..20. This is the signature 18° knife edge, with no trim and no coping step at the tip. |
| SE (right angle) | x 145..153, z 24..31 |

ATRIUM (glass space-frame roof, between the triangles): rows at y 14. z9 114 · z10 114..117 · z11 114..120 · z12 114..123 · z13 114..126 · z14 114..129 · z15 114..132 · z16 114..135 · then mirrored (z17 = z15 … z23 = z9). The void under it, y 1..13, is open (the atrium court).

## ROOFS

| roof | form | how |
|---|---|---|
| West spine, pavilions | flat deck of bottom slabs (smooth_stone_slab) at y 13 behind the attic. Long **skylight monitors** set into it (below) | by hand. Not a `$MCD roof` preset: the deck must stay below the attic so the silhouette stays a flat temple |
| West skylights | glass strips at y 13 with a raised middle row at y 14 (a low glass prism). Light grey frame ribs cross every 4 x (x ≡ 2 mod 4), y 13..14 | spine strips z 13..15 and z 24..26, x 2..39 and x 61..98. Pavilion strips z 3..5 and z 34..36, x 11..25 and x 75..89 |
| West central block | flat deck, bottom slabs at y 16 behind the attic, around the drum | by hand |
| Porticos (2) | `$MCD roof` preset **temple** (colonnades, porticos, museums), low gable, ridge along z at x 50. Eaves y 13 on the entablature, ridge y 16 (rise 3 over 8). Overhang 1 at the gable front (z 3 north / z 36 south), verge = raking cornice. **material overridden** to smooth_quartz (the preset's red tile is wrong here: Pope's pediment is plain marble), tympanum calcite | footprint x 42..58, z 3..8 and z 31..36. The back of each roof dies into the central block's attic face (attic top 17 > ridge 16) |
| Drum + dome | Pantheon-shallow stepped dome, by hand (or `$MCD roof --style dome --drum` capped `maxHeight 4`, if it matches these rings). Drum wall ring r 7, y 18..20. Cornice ring r 8 at y 21 (smooth_quartz_stairs, upside-down, out). Dome rings: r 7 y 21 (weathered_cut_copper_stairs facing out), r 6 y 22, r 5 y 23, r 4 y 24 as a weathered_cut_copper deck. Each ring is filled solid inside. Oculus lantern: r 1 (3x3, x 49..51, z 18..20) y 25 glass panes, weathered_cut_copper corners, y 26 weathered_cut_copper_slab cap. Top y 26, which is 24 above the ground |
| East body | flat, bottom slabs (smooth_stone_slab) at y 13, coping course y 14 flush with the wall (no overhang, no cornice) | by hand |
| East towers | flat, bottom-slab deck at y 19 inside a 1-cell coping ring at y 20 (calcite) | by hand |
| East atrium | glass at y 14 on a triangular grid. Light-grey ribs (light_gray_concrete) along z 16 (the spine), along x 114 (the base), and along lines parallel to both diagonals every 4 cells. Glass panes in the triangles between. Every rib crossing lifts one glass block to y 15, so the roof reads as a field of little pyramids | by hand |

No roof has eaves or overhangs except the two pediments. Crisp flat skylines are the form.

## FACADES

### West Building (pale rose temple, symmetric about x 50)

Course hierarchy on every face, bottom to top:

| y | course | material | depth |
|---|---|---|---|
| 0..2 | podium / plinth | polished_granite | flush with the wall above, steps out 1 at the porticos |
| 3 | base course (floor line) | smooth_quartz | flush |
| 4..10 | wall body | white_terracotta | wall plane |
| 11 | plain frieze | calcite | flush |
| 12 | cornice | smooth_quartz behind, smooth_quartz_stairs upside-down 1 proud all round | +1 |
| 13..14 | attic (spine and pavilions) | calcite | set back 0 (flush with the wall plane) |
| 15 | coping | smooth_quartz_slab (bottom) | flush |
| 13..16, 17 | central block attic, coping | calcite, smooth_quartz_slab at 17 | flush |

- **Pilasters** (tall, shallow, the wings' rhythm): smooth_quartz, 1 proud, y 4..10, capped by the frieze. Spine north face (wall z 9, pilasters at z 8) and south face (wall z 30, pilasters at z 31): x 4, 30, 34, 38, 62, 66, 70, 96. Pavilion end faces (north z 1, pilasters at z 0; south z 38, pilasters at z 39) at x 10, 13, 23, 26 and x 74, 77, 87, 90. The spine's end faces x 1 (pilasters at x 0) and x 99 (pilasters at x 100) at z 10, 14, 25, 29.
- **Blind niche panels** (no windows: the galleries are skylit): on each pavilion end face, x 16..20 and x 80..84, y 5..9. Recessed 1 by exclusion (the wall cell left out), the back calcite, framed flush by smooth_quartz at x 15 and 21 (79 and 85) and at y 4 and 10.
- **Porticos** (north and south, identical): 8 Ionic columns, quartz_pillar (axis y), y 4..10, at x 43, 45, 47, 49, 51, 53, 55, 57, front row z 4 (north) / z 35 (south). Return columns x 43 and 57 at z 6 (north) / z 33 (south). Architrave y 11 smooth_quartz across x 42..58 over the columns. Cornice y 12 smooth_quartz_stairs, upside-down, facing out. Plain pediment above (ROOFS). Portico floor: the podium top y 3 smooth_quartz. The back wall of the portico is the body wall (z 9 / z 30).
- **Drum**: white_terracotta y 18..19, calcite y 20 (paler upward), 8 flush smooth_quartz pilasters on the drum ring at the 8 compass points of r 7.
- **Pink graduates paler upward**: granite base → white_terracotta body → calcite frieze/attic → smooth_quartz trim. No random mixing.

### East Building (planar, no ornament)

- Every wall is white_terracotta y 0..12 with a calcite top course y 13 (body) / y 19 (towers), and calcite coping y 14 / y 20. No cornice, no overhang, no pilasters, no quoins. The crispness of the edges is the ornament.
- **West face (x 105)**: an H. Two blank towers (NW z 0..8, SW z 22..30) and between them the recessed central wall at x 108, z 9..21, set back 3. The entrance slot sits in that wall (OPENINGS). Over the slot, a dark band at y 9 runs x 108, z 11..19 (gray_stained_glass, 1 high).
- **South face (z 33, x 116..146)**: blank, with 2 dark horizontal bands of gray_stained_glass, 1 high, at y 4 and y 10, x 118..143. The knife-edge prow tower and the SE tower stay blank.
- **North diagonal face**: one dark band y 10 on the exposed diagonal wall cells for z 4..12 (x 117..141), 1 high.
- **East face (x 153)**: blank.
- Tower faces: blank, full height. The tower tops step 6 above the body roof: that step is the silhouette.

## MATERIALS

| role | block |
|---|---|
| marble body, both buildings | white_terracotta |
| upper courses, frieze, attic, East coping | calcite |
| West cornice, pilasters, trim, base course, pediment | smooth_quartz, smooth_quartz_stairs, smooth_quartz_slab |
| West columns | quartz_pillar |
| West podium / plinth | polished_granite |
| pediment tympanum | calcite |
| dome, lantern | weathered_cut_copper, weathered_cut_copper_stairs, weathered_cut_copper_slab |
| roof decks | smooth_stone_slab (bottom: no spawning) |
| skylight glass (West) | glass (strips), light_gray_stained_glass (raised middle row) |
| skylight frames / atrium ribs | smooth_stone (West), light_gray_concrete (East) |
| atrium glass (East) | glass, with glass_pane for the raised pyramid cells |
| dark window bands (East) | gray_stained_glass |
| entrance doorways (dark recess backs) | tinted_glass |
| hidden / interior light | pearlescent_froglight (flush in the floors), shroomlight (warm uplights at the bases) |
| exterior lamps | lantern on posts or hanging from iron_chain (written `chain` for 1.21.1: build with iron_chain, swap with --version 1.21.1 before delivery) |
| ground: lawn | grass_block |
| ground: walks, East plaza | smooth_sandstone (the warm tan paving in the concept) |

All ids checked with `$MCD blocks --check`. All exist in 1.21.1 (copper and calcite are 1.17, froglights 1.19). None is 1.21.4+.

## OPENINGS

| building | opening | cells | fill |
|---|---|---|---|
| West | north main door | x 49..51, y 4..8, in wall z 9, recessed 1 (z 9 empty, back at z 10) | tinted_glass back at z 10. Smooth_quartz surround flush at x 48 and 52, y 4..9, and a lintel at y 9 x 48..52 |
| West | south main door | x 49..51, y 4..8, in wall z 30, recessed 1 (back at z 29) | as north |
| West | east end door (the concept view) | x 99 face, z 19..20, y 4..8, recessed 1 (back at x 98) | tinted_glass. Smooth_quartz surround at z 18 and 21, y 4..9, and a lintel y 9; a smooth_quartz_slab hood at y 10, z 17..22, 1 proud (x 100) |
| West | west end door | x 1 face, z 19..20, y 4..8 (back at x 2) | as east |
| West | north steps | x 41..59: z 2 smooth_quartz_slab bottom y 3 · z 1 smooth_quartz y 2 · z 0 smooth_quartz_slab bottom y 2 | half steps to the Constitution Ave ground |
| West | south steps | x 41..59: z 37 smooth_quartz y 3 (landing) · z 38 smooth_quartz_slab bottom y 3 · z 39 smooth_quartz_slab bottom y 2 | half steps to the Mall ground. Check with `$MCD approach` |
| West | windows | none: the galleries are lit by the skylights | — |
| East | entrance slot | x 108..110, z 13..18, y 0..4: empty, a deep dark recess 3 deep | tinted_glass back wall at x 111, z 13..18, y 0..4. Its ceiling (y 5, x 108..110) white_terracotta |
| East | west recess | x 105..107, z 9..21, y 0..20 empty (the H between the towers) | paving at y 0 only |
| East | wedge slot | the open cells of z 27..33 left out of BODY | paving at y 0, open to the sky |
| East | dark bands | as in FACADES | gray_stained_glass, flush |

## RESERVED (the shell leaves these empty; later parts fill them)

- West pilasters: every pilaster cell listed in FACADES (z 8, z 31, z 0, z 39, x 0, x 100 at the given x/z, y 4..10), plus the drum pilasters.
- West cornice stairs: the 1-proud ring at y 12 outside every wall face, and the portico cornices.
- West columns: x 43,45,…,57 at z 4 and z 35, y 4..10; return columns (43/57, z 6) and (43/57, z 33).
- West niche backs: x 16..20 / 80..84, y 5..9 on the pavilion end faces: the face cell stays air, the back cell is calcite.
- West door recesses and surrounds as in OPENINGS.
- West skylight strips (deck cells at y 13 and the y 14 middle row): the deck part skips them.
- West portico lights: shroomlight flush in the podium top at y 3, between each column pair (x 44, 48, 52, 56 at z 3 and z 36), and lanterns standing on smooth_quartz_slab posts at the step heads x 41 and 59.
- East: the entrance slot, the west recess, the wedge slot, the atrium void x/z rows above × y 1..13 and its glass at y 14..15. The tower coping rings at y 20 and the body coping at y 14 belong to the shell; the bottom-slab decks inside them are the roof part's.

## FLOORS and interior volumes (exterior-only build: the interiors are hollow, mob-proof and lit)

| mass | floor (block) | walk | ceiling / roof | interior volume |
|---|---|---|---|---|
| West spine + pavilions | y 3 | y 4 | deck y 13 | inside the walls (wall 1 thick), y 4..12. Pearlescent_froglight flush in the floor every 6 cells, so the galleries glow under the skylights at dusk |
| West central block (rotunda) | y 3 | y 4 | dome | x 41..59, z 10..29, y 4..17 open up into the drum to y 20. A ring of pearlescent froglights on the floor at r 5 lights the rotunda; the oculus glows |
| West porticos | y 3 | y 4 | pediment soffit y 12 | open loggias. Hanging lanterns from the soffit at x 46, 50, 54 on iron_chain |
| East body | y 0 | y 1 | deck y 13 | hollow, y 1..12. Froglights flush in the floor every 6 cells |
| East atrium | y 0 | y 1 | glass y 14 | void y 1..13, lit by a froglight grid in the floor every 4 cells, plus lanterns hung from the ribs at y 13. This is the glow at dusk |
| East towers | y 0 | y 1 | deck y 19 | hollow, y 1..18, a froglight in the floor of each |

Outside lighting (no dark ground cells): lamp posts (a fence post 3 high with a lantern) every 10 blocks along the walks round both buildings. Shroomlights are set flush in the West podium face at y 1 under every second pilaster, as warm uplight at the base. At the East entrance slot, 3 lanterns hang from its ceiling at z 14, 16, 18. Every horizontal surface left unlit is a bottom slab, glass or water.


# DESIGNER SECTIONS

## PALETTE
(Architect's MATERIALS ids kept exactly; all checked with `$MCD blocks --check`. NOT existing: calcite_stairs, white_terracotta_stairs — never use.)
- Marble body: white_terracotta. Upper/frieze/attic/East coping: calcite (full, only; use smooth_quartz_slab for a stepped edge).
- Trim: smooth_quartz, smooth_quartz_stairs, smooth_quartz_slab; quartz_slab alt. Columns: quartz_pillar (axis y).
- Podium: polished_granite (+ polished_granite_stairs/_slab for the step flanks).
- Dome: weathered_cut_copper, _stairs, _slab. Roof decks smooth_stone_slab (type bottom). Skylights: glass, light_gray_stained_glass, glass_pane, ribs smooth_stone (West) / light_gray_concrete (East).
- Dark bands gray_stained_glass; recess backs tinted_glass.
- Light: pearlescent_froglight, shroomlight, lantern (hanging true/false), iron_chain (axis y), oak_fence/cobblestone_wall posts.
- Ground: grass_block, smooth_sandstone, smooth_sandstone_slab (bottom), dirt_path.

## VOCABULARY
- marbleWall(g, box, {ground}): footing polished_granite from ground to y2, smooth_quartz y3, white_terracotta y4..10, calcite y11, y12 smooth_quartz; hollow, 1 thick.
- pilaster(g, x, z, face): smooth_quartz column y4..10, 1 proud of wall.
- corniceRing(g, rect, y12): smooth_quartz_stairs half=top, facing out, 1 proud on every edge; corners stair shape outer.
- nichePanel(g, x0,x1, face, y5..9): leave face cells empty, back calcite; frame smooth_quartz at ends and y4,y10.
- ionicColumn(g, x, z): quartz_pillar y4..10 with smooth_quartz_stairs half=top cap ring? no: single smooth_quartz_slab top at y10 capital, bottom slab at y4 base.
- pediment(g, front): smooth_quartz gable via roof preset temple, calcite tympanum, verge smooth_quartz_stairs.
- slabSteps(g, rows): smooth_quartz_slab type bottom / smooth_quartz as listed in OPENINGS.
- domeRing(g, r, y, mat): filled circle from the circle rows; edge ring weathered_cut_copper_stairs facing out.
- oculusLantern(g): 3x3 at y25: corners weathered_cut_copper, sides glass_pane, centre glass; y26 weathered_cut_copper_slab.
- skylightStrip(g, x0,x1, z0,z1): glass at y13, light_gray_stained_glass at y14 middle row, smooth_stone ribs at x≡2 mod 4.
- recessDoor(g, x,z,face,w): empty recess 1, tinted_glass back, smooth_quartz surround + lintel y9.
- uplight(g, x,y,z): shroomlight flush in a floor/podium cell. hangLamp(g,x,y,z): iron_chain axis y then lantern hanging=true. lampPost(g,x,z): fence 3 high, lantern on top.
- planarWall(g, rows): per-row x ranges y0..12 white_terracotta, calcite y13, coping y14.
- towerPrism(g, rows): per-row cells y0..19 white_terracotta, calcite y19, coping y20 (no coping at the prow tip).
- entranceSlot(g): per OPENINGS, with lanterns hanging from the y5 ceiling.
- darkBand(g, cells, y): gray_stained_glass flush.
- atriumRoof(g): glass y14, light_gray_concrete ribs along z16, x114 and diagonals every 4, glass_pane lifted to y15 at crossings.

## ROOMS
Exterior-only; interiors hollow, mob-proof, lit by flush froglights per the FLOORS table. Rotunda and atrium are the only visible volumes.
- Rotunda: x41..59, z10..29, y4..20. Ring of pearlescent_froglight at r5. Ways in: N door (49..51,z9), S door (49..51,z30).
- West galleries: x2..98 minus central block, z10..29, y4..12, froglights every 6.
- East atrium court: x114..135, z9..23 (triangle), y1..13, glow at dusk.

## PARTS
1. [x] West shell — parts/west-shell.mjs: podium, spine, pavilions, central block, door recesses, niche panels (marbleWall, recessDoor, nichePanel).
2. West roofs, porticos, dome — parts/west-roof.mjs: decks, skylights, porticos, pediments, steps, drum, dome, lantern.
3. West trim and lights — parts/west-trim.mjs: pilasters, cornice ring, coping, uplights, hanging lamps.
4. East shell and towers — parts/east-shell.mjs: body rows, towers, prow, slot, recess, dark bands.
5. East roofs and atrium — parts/east-roof.mjs: decks, tower decks, atrium space frame, interior lights.
6. Grounds and lighting — parts/grounds.mjs: grass, sandstone walks and plaza, lamp posts, froglight floors.

## Notes for workers
- Stay within plot boxes; build down to ground values. Leave reserved cells. Bottom slabs only on roofs. No signs. Use iron_chain (swap for 1.21.1 if needed). Recessions by exclusion. Check with `$MCD check`.

# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
1. West shell — parts/west-shell.mjs: podium, spine, pavilions, central block, door recesses, niche panels (marbleWall, recessDoor, nichePanel).
2. West roofs, porticos, dome — parts/west-roof.mjs: decks, skylights, porticos, pediments, steps, drum, dome, lantern.
3. West trim and lights — parts/west-trim.mjs: pilasters, cornice ring, coping, uplights, hanging lamps.
4. East shell and towers — parts/east-shell.mjs: body rows, towers, prow, slot, recess, dark bands.
5. East roofs and atrium — parts/east-roof.mjs: decks, tower decks, atrium space frame, interior lights.
6. Grounds and lighting — parts/grounds.mjs: grass, sandstone walks and plaza, lamp posts, froglight floors.

## Notes for workers
- Stay within plot boxes; build down to ground values. Leave reserved cells. Bottom slabs only on roofs. No signs. Use iron_chain (swap for 1.21.1 if needed). Recessions by exclusion. Check with `$MCD check`.
```

### elements.md

```markdown
# REQUIRED ELEMENTS — National Gallery of Art (plot 0 West, plot 1 East)
Coordinates are plot-frame (plan.md). Parts: P1 west shell, P2 west roofs+dome+porticos, P3 west trim+lights, P4 east shell+towers, P5 east roofs+atrium, P6 grounds+lights.
Vocab names are in plan.md VOCABULARY.

- [ ] W1 Long low symmetric rose-pink temple (spine x1..99,z9..30,y4..14, pavilions, central block) — hollow white_terracotta walls 1 thick on a polished_granite podium y0..2, smooth_quartz base y3. P1. `marbleWall`
- [ ] W2 Pink graduating paler upward — granite → white_terracotta y4..10 → calcite y11 frieze, y13..14 attic → smooth_quartz trim. P1. `marbleWall`
- [ ] W3 Pilasters (tall shallow) — smooth_quartz 1 proud, y4..10, at the plan's x/z lists. P3. `pilaster`
- [ ] W4 Plain frieze + cornice — calcite y11; y12 smooth_quartz_stairs upside-down (half=top) facing outward 1 proud all round; coping smooth_quartz_slab y15. P3. `corniceRing`
- [ ] W5 End pavilions projecting 8 N and S (x9..27, x73..91) with blind niche panels x16..20/x80..84 — niche face cells left out, calcite back, quartz frame. P1/P3. `nichePanel`
- [ ] W6 Two Ionic porticos, 8 columns each (x43..57 odd, z4 / z35) — quartz_pillar axis y y4..10, return columns, smooth_quartz architrave y11, upside-down stair cornice y12. P2. `ionicColumn`
- [ ] W7 Plain pediments over porticos — `$MCD roof` temple preset, smooth_quartz, calcite tympanum, eaves y13 ridge y16. P2. `pediment`
- [ ] W8 Wide steps to porticos — half steps (bottom slabs) per OPENINGS; accessible. P2. `slabSteps`
- [ ] W9 Central low dome on drum — drum r7 y18..20, cornice ring r8 y21, copper stepped rings y21..24, lantern y25..26 (glass panes, copper corners, slab cap) = top y26. P2. `domeRing`, `oculusLantern`
- [ ] W10 Flat roof with long glass skylight rows, light grey frames — glass strips y13, raised light_gray_stained_glass y14, smooth_stone ribs x≡2 mod 4. P2. `skylightStrip`
- [ ] W11 Main doors (N,S,E,W) recessed 1, tinted_glass back, quartz surround, lintel; E door hood slab. P1. `recessDoor`
- [ ] W12 Warm floodlights at portico/base — shroomlight flush in podium top (x44,48,52,56 at z3/z36), podium face y1 under every second pilaster, lanterns on quartz slab posts at step heads, hanging lanterns on iron_chain in loggias. P3. `uplight`, `hangLamp`
- [ ] E1 Trapezoid body in two triangles — white_terracotta y0..12 per BODY rows, calcite y13, coping y14. P4. `planarWall`
- [ ] E2 Sharp prismatic towers (NW, SW, NE, SE, PROW) y0..19, calcite y19, coping y20, flat-topped. P4. `towerPrism`
- [ ] E3 Knife-edge prow, 1-cell tip at (108,33) unbroken y0..20, no trim. P4. `towerPrism`
- [ ] E4 Deep dark recessed entrance slot x108..110, z13..18, y0..4, tinted_glass back x111, ceiling y5, 3 hanging lanterns z14,16,18. P4. `entranceSlot`
- [ ] E5 West recess (H) x105..107,z9..21 open; dark band y9 gray_stained_glass. P4. `darkBand`
- [ ] E6 Dark horizontal window bands (south y4,y10; north diagonal y10). P4. `darkBand`
- [ ] E7 Glass space-frame atrium roof, triangular grid, ribs light_gray_concrete, glass y14, pyramids at crossings y15, glowing via froglights/lanterns. P5. `atriumRoof`
- [ ] E8 Roof decks smooth_stone_slab bottom inside coping. P5.
- [ ] G1 Lawn, smooth_sandstone walks and East plaza, lamp posts every 10 blocks, no dark cells. P6. `lampPost`
```

### rooms.json

```json
{"entrance":[49,4,38],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "marble": ["white_terracotta"],
    "stone_upper": ["calcite"],
    "trim": ["smooth_quartz", "smooth_quartz_stairs", "smooth_quartz_slab", "quartz_slab"],
    "column": ["quartz_pillar"],
    "podium": ["polished_granite", "polished_granite_stairs", "polished_granite_slab"],
    "dome": ["weathered_cut_copper", "weathered_cut_copper_stairs", "weathered_cut_copper_slab"],
    "roof_deck": ["smooth_stone_slab"],
    "skylight_glass": ["glass", "light_gray_stained_glass", "glass_pane"],
    "skylight_frame": ["smooth_stone", "light_gray_concrete"],
    "dark_band": ["gray_stained_glass"],
    "recess_back": ["tinted_glass"],
    "light": ["pearlescent_froglight", "shroomlight"],
    "ground": ["grass_block", "smooth_sandstone", "smooth_sandstone_slab", "dirt_path"]
  },
  "objects": ["lantern", "chain", "oak_fence", "cobblestone_wall"]
}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build to a temp file in this directory, then move it into place.
set -e
cd "$(dirname "$0")"
tmp="build.tmp.$$.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// The National Gallery of Art, West and East Buildings (plan.md): the ground, then the six parts in order, saved to argv[2].
// The ground is laid before runParts so later parts may replace its surface (walks, plaza, lawn); runParts locks each
// part's blocks from the parts after it, reports off-palette ids, and lays roof.json (the two porticos) after the first
// part once it exists.
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SIZE, GROUND_ROWS_0, GROUND_ROWS_1, PLOT0, PLOT1 } from "./vocab/base.mjs";

// The sub-grade under the grass (not in palette.json: no part builds with it, it is out of sight).
const SUBGRADE = "dirt";

// Each plot's ground: grass at its mapped height, solid sub-grade below it down to y 0, so nothing floats.
function layGround(g) {
  for (const [rows, plot] of [[GROUND_ROWS_0, PLOT0], [GROUND_ROWS_1, PLOT1]]) {
    rows.forEach((row, dz) => [...row].forEach((ch, dx) => {
      const x = plot.x0 + dx, z = plot.z0 + dz, top = ch === "." ? 0 : Number(ch);
      for (let y = 0; y < top; y++) g.set(x, y, z, SUBGRADE);
      g.set(x, top, z, "grass_block");
    }));
  }
}

// A part whose file is not written yet (its worker is still on it) is a no-op, so make.sh never fails on a missing part.
async function partBuild(module) {
  const url = new URL(module, import.meta.url);
  if (!existsSync(url)) return () => {};
  return (await import(url.href)).build ?? (() => {});
}

const PARTS = [
  ["West shell", "./parts/west-shell.mjs"],
  ["West roofs, porticos, dome", "./parts/west-roof.mjs"],
  ["West trim and lights", "./parts/west-trim.mjs"],
  ["East shell and towers", "./parts/east-shell.mjs"],
  ["East roofs and atrium", "./parts/east-roof.mjs"],
  ["Grounds and lighting", "./parts/grounds.mjs"],
];

const out = process.argv[2] ?? "build.nbt";
const g = new Grid(SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });
layGround(g);

const list = [];
for (const [name, module] of PARTS) list.push([name, await partBuild(module)]);
runParts(g, list, { palette: "palette.json", roof: "roof.json" });

g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Site constants, palette names and a seeded rng for the National Gallery of Art (plan.md). Every block id here is in
// palette.json (1.21.1 names: chain, not iron_chain); every coordinate is the plot frame of plan.md and the brief.

// ---- site ------------------------------------------------------------------------------------------------------------

// ---- site ------------------------------------------------------------------------------------------------------------
export const SIZE = [154, 35, 40];                    // the full site: x 0..153, y 0..34 (the brief's ceiling), z 0..39

export const PLOT0 = { x0: 0, x1: 100, z0: 0, z1: 39 };     // West Building plot; GROUND_ROWS_0 is its height map

export const PLOT1 = { x0: 105, x1: 153, z0: 0, z1: 33 };   // East Building plot; GROUND_ROWS_1 is its height map

export const AXIS_X = 50;                             // West Building's axis: every mass is symmetric about x 50

export const LAMP_EVERY = 10;                         // lamp post every 10 blocks along the walks round both buildings

// Ground height above y 0, one character per cell (rows run along z, columns along x). A digit is the y of the grass
// block; "." is y 0. Cells outside both plots have no ground (x 101..104 is the gap).
export const GROUND_ROWS_0 = [

export const GROUND_ROWS_1 = [

// ---- West Building (plot 0) ------------------------------------------------------------------------------------------
export const WEST = {
  spine: { x0: 1, x1: 99, z0: 9, z1: 30, y0: 4, y1: 14 },        // the wings: cornice y 12, attic y 13..14, coping y 15
  pavilionW: { x0: 9, x1: 27, z0: 1, z1: 38, y0: 4, y1: 14 },    // projects 8 north and 8 south of the spine
  pavilionE: { x0: 73, x1: 91, z0: 1, z1: 38, y0: 4, y1: 14 },   // mirror of pavilionW
  central: { x0: 40, x1: 60, z0: 9, z1: 30, y0: 4, y1: 17 },     // raised attic y 13..16, coping y 17; carries the drum
  porticoN: { x0: 42, x1: 58, z0: 3, z1: 8, y0: 4, y1: 16 },     // 8 columns at z 4, pediment over
  porticoS: { x0: 42, x1: 58, z0: 31, z1: 36, y0: 4, y1: 16 },   // 8 columns at z 35, pediment over
  stepsN: { x0: 41, x1: 59, z0: 0, z1: 2, y0: 2, y1: 3 },        // half-steps down to Constitution Ave
  stepsS: { x0: 41, x1: 59, z0: 37, z1: 39, y0: 2, y1: 3 },      // half-steps down to the Mall
  drum: { x: 50, z: 19, r: 7, y0: 18, y1: 20 },                  // drum wall ring r 7; cornice ring r 8 at y 21
  dome: { x: 50, z: 19, y0: 21, y1: 24, lantern: 25, top: 26 },  // stepped dome rings (r 7 at y 21 down to r 4 at y 24)
  deckY: 13,                                                     // West spine and pavilion decks (bottom slabs)
  doorX: [49, 51],                                               // north and south main doors, y 4..8
};

export const WEST_LEVEL = { floor: 3, walk: 4, wallTop: 10, frieze: 11, cornice: 12, deck: 13, coping: 15, centralTop: 17 };

// ---- East Building (plot 1) ------------------------------------------------------------------------------------------
export const EAST = {
  bodyTop: 12, bodyCap: 13, coping: 14,                          // body walls y 0..12, calcite course 13, coping 14
  towerTop: 19, towerCoping: 20,                                 // towers y 0..19, coping 20 (6 above the body roof)
  slot: { x0: 108, x1: 110, z0: 13, z1: 18, y0: 0, y1: 4 },      // entrance slot, empty; tinted glass back at x 111
  recess: { x0: 105, x1: 107, z0: 9, z1: 21 },                   // west recess (the H between the towers), paving at y 0
  wedge: { z0: 27, z1: 33 },                                     // open wedge slot ending in the prow; paving at y 0
  atrium: { x0: 114, x1: 135, z0: 9, z1: 23, y0: 1, y1: 13 },    // atrium court under the glass space frame (y 14)
  atriumGlass: 14,                                               // space frame glass course; ribs at y 14, lifts to y 15
};

// ---- palette names (palette.json ids only) ---------------------------------------------------------------------------
export const WHITE_TERRACOTTA = "white_terracotta";            // marble body, both buildings

export const CALCITE = "calcite";                              // upper courses, frieze, attic, East coping, tympanum

export const SMOOTH_QUARTZ = "smooth_quartz";                  // West trim: cornice, pilasters, base course, surrounds

export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";    // West cornice ring, upside down, facing out

export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";        // West coping, step treads, stepped edges

export const QUARTZ_SLAB = "quartz_slab";                      // alternate trim slab

export const QUARTZ_PILLAR = "quartz_pillar";                  // West portico columns, axis y

export const POLISHED_GRANITE = "polished_granite";            // West podium and plinth

export const POLISHED_GRANITE_STAIRS = "polished_granite_stairs"; // podium step flanks

export const POLISHED_GRANITE_SLAB = "polished_granite_slab";  // podium step flanks, slab form

export const WEATHERED_CUT_COPPER = "weathered_cut_copper";    // dome and lantern

export const WEATHERED_CUT_COPPER_STAIRS = "weathered_cut_copper_stairs"; // dome ring edges, facing out

export const WEATHERED_CUT_COPPER_SLAB = "weathered_cut_copper_slab";     // lantern cap

export const SMOOTH_STONE_SLAB = "smooth_stone_slab";          // roof decks (bottom type only)

export const GLASS = "glass";                                  // skylight strips and atrium panes

export const LIGHT_GRAY_STAINED_GLASS = "light_gray_stained_glass"; // raised middle row of the West skylights

export const GLASS_PANE = "glass_pane";                        // oculus sides, raised atrium pyramid cells

export const SMOOTH_STONE = "smooth_stone";                    // West skylight frame ribs

export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";      // East atrium ribs

export const GRAY_STAINED_GLASS = "gray_stained_glass";        // East dark window bands

export const TINTED_GLASS = "tinted_glass";                    // recess backs of the doorways

export const PEARLESCENT_FROGLIGHT = "pearlescent_froglight";  // hidden floor light, flush

export const SHROOMLIGHT = "shroomlight";                      // warm uplights at the bases

export const LANTERN = "lantern";                              // hanging and post lamps

export const CHAIN = "chain";                                  // hanging-lamp chain, axis y (1.21.1 name for iron_chain)

export const OAK_FENCE = "oak_fence";                          // lamp post shaft

export const COBBLESTONE_WALL = "cobblestone_wall";            // alternate lamp post shaft

export const GRASS_BLOCK = "grass_block";                      // lawn: the ground's top course

export const SMOOTH_SANDSTONE = "smooth_sandstone";            // walks and the East plaza

export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";  // walk edges, slab form

export const DIRT_PATH = "dirt_path";                          // worn walk paths

// ---- rng -------------------------------------------------------------------------------------------------------------
/** A seeded rng(seed) (mulberry32): returns a function giving floats in [0, 1), the same sequence for the same seed. */
export function rng(seed)

/** The ground's height above y 0 at (x, z) (0 for "."), or null outside both plots. */
export function groundAt(x, z)
```

### vocab/h1.mjs

```js
// Vocabulary part 1 (plan.md VOCABULARY): ten helpers the part workers call for the National Gallery of Art.
// Each takes its own position (and facing where it has one) as arguments and writes only its own footprint.
// Writes go into air only: a cell that already holds a block is refused and listed in `refused`, never overwritten.
// Two exceptions follow the plan's ground rule: a wall's own base replaces the ground block under it (marbleWall's
// footing, planarWall's y 0), and an opening replaces the wall it is cut into (recessDoor, entranceSlot).
// Every helper returns { placed, refused: [[x, y, z, was], ...] } so the caller can see what was skipped.
// Block ids are 1.21.1 names (chain, not iron_chain); stair, slab, pillar, chain and lantern states come from B.

/**
 * The West marble wall round a rectangle [x0, z0, x1, z1], hollow and 1 thick: polished_granite footing from `ground`
 * to y 2 (replaces the ground block), smooth_quartz base y 3, white_terracotta y 4..10, calcite frieze y 11,
 * smooth_quartz y 12 (the cornice ring sits outside it, see corniceRing).
 */
export function marbleWall(g, rect, { ground = 0 } = {})

/**
 * The 1-proud cornice course round the walls of rect [x0, z0, x1, z1] at height y (default 12): smooth_quartz_stairs
 * upside down (half top), each facing into the wall, corners shaped outer. rect is the wall's footprint, not the ring.
 * Writes the ring one cell outside rect.
 */
export function corniceRing(g, [x0, z0, x1, z1], y = 12)

/** One Ionic portico column at (x, z): smooth_quartz slab base at y 4, quartz_pillar shaft y 5..9, slab capital at y 10. */
export function ionicColumn(g, x, z)

/**
 * Half steps from rows of { x0, x1, z, y, kind } (the OPENINGS table): kind "slab" = smooth_quartz_slab bottom,
 * kind "block" = smooth_quartz. Each row is one z line of the flight, x0..x1 inclusive.
 */
export function slabSteps(g, rows)

/**
 * The 3x3 oculus lantern centred on (cx, cz): copper corners, glass pane sides (each joined to the copper beside it),
 * a glass centre at y (default 25), and a 3x3 weathered_cut_copper_slab cap at y + 1.
 */
export function oculusLantern(g, cx, cz, y = 25)

/**
 * A doorway recessed 1 into a wall (plan OPENINGS). (x, z) is the door's centre cell in the wall's plane; face is the
 * way it opens ("north" = out to -z). w cells wide along the wall (default 3): the plane cells y 4..8 are carved to
 * air, the tinted_glass back sits one cell in, smooth_quartz flanks run y 4..9 two cells out from the centre, and a
 * smooth_quartz lintel at y 9. The opening replaces the wall cells it is cut into.
 */
export function recessDoor(g, x, z, face, w = 3)

/**
 * A lantern hung from a block above (plan: hanging lanterns on iron chain): chain at (x, y, z) under the solid block at
 * y + 1, the lantern at y - 1. Places nothing unless there is a block above and the two cells under the lantern (y - 2,
 * y - 3) are air, so a 2-high lane stays clear under it.
 */
export function hangLamp(g, x, y, z)

/**
 * The East body's planar walls from rows [z, x0, x1] (plan BODY): white_terracotta y 0..12, a calcite course at y 13 and
 * a calcite coping at y 14, flush and without overhang. The ground block at y 0 is replaced (plot 1 walls start at y 0).
 * Rows leave out the entrance slot, the west recess and the wedge slot.
 */
export function planarWall(g, rows)

/**
 * The East entrance slot (plan OPENINGS): a dark recess depth cells deep and len cells wide, open to `face`. (x, z) is
 * its mouth cell on the wall plane (default west: 108, 13, so the slot runs x 108..110, z 13..18). The slot is carved to
 * air from y0 up to h cells, a white_terracotta ceiling course sits over it at y0 + h, tinted_glass closes the back,
 * and three lanterns hang from the ceiling at the 2nd, 4th and 6th cells across (z 14, 16, 18).
 */
export function entranceSlot(g, x, z, face = "west", { depth = 3, len = 6, h = 5, y0 = 0 } = {})

/**
 * The East atrium's glass space frame over the triangle given as rows [z, x0, x1] (plan ATRIUM), at height y (default
 * 14). Glass everywhere in the triangle except the ribs, light_gray_concrete on: the spine (the middle row), the base
 * (the least x), and two families of diagonals every 4 cells, parallel to the two sloped edges (3 cells across per row).
 * Where two rib lines cross, a glass_pane is lifted to y + 1 on that cell.
 */
export function atriumRoof(g, rows, y = 14)
```

### vocab/h2.mjs

```js
// The nine plan.md VOCABULARY helpers: pilaster, nichePanel, pediment, domeRing, skylightStrip, uplight, lampPost,
// towerPrism, darkBand. Each takes its position as arguments and returns the number of blocks it placed.
// Writes go only into air (a solid cell is left as it is) unless an option says replace, and nothing is written
// below a helper's footprint, so the ground, sand and floors stay with the earlier parts. Coordinates are structure
// local: x east, y up, z south. `face` is the way a wall faces out (north = -z).

/** Pilaster: smooth_quartz column y4..10, one cell proud of the wall at (x, z). */
export function pilaster(g, x, z, face)

/**
 * Blind niche on a pavilion end face. The panel runs x0..x1 along the face (x for north or south, z for east or west)
 * and y0..y1 at the wall plane `wall` (z or x). The face cells are left empty (recessed one, by exclusion), the back
 * cells one step in are calcite, and a smooth_quartz frame runs round the panel on the wall plane. The shell must
 * leave the frame and the face cells out: a frame cell it already built is refused.
 */
export function nichePanel(g, x0, x1, face, wall, y0 = 5, y1 = 9)

/**
 * Plain pediment over a portico: a four-row gable on the plane `plane` (z for a north or south front, x for east or
 * west), spanning a0..a1 along the front, eave row at y0 (the ridge is y0 + 3). The raking edge is smooth_quartz_stairs
 * facing in (lip out), the tympanum is calcite. Only the gable front: the roof behind it is the roof part's.
 */
export function pediment(g, front, a0, a1, plane, y0 = 13)

/**
 * Filled stepped dome ring: the disc of radius r about (cx, cz) at layer y, solid `mat` (a base name such as
 * weathered_cut_copper). edge: true puts `${mat}_stairs` on the outside ring, lip out (the plan's r 7 step).
 */
export function domeRing(g, cx, cz, r, y, mat, { edge = false } = {})

/**
 * West skylight strip: glass at y13 over x0..x1 by z0..z1, a raised light_gray_stained_glass row at y14 down the
 * middle, and smooth_stone ribs (y13..14) at every x = 2 mod 4 across the whole strip.
 */
export function skylightStrip(g, x0, x1, z0, z1)

/** Warm uplight: shroomlight flush in a floor or podium cell. It needs replace: true, since that cell is solid. */
export function uplight(g, x, y, z, { replace = false } = {})

/** Lamp post on a walk at ground y: a 3-high oak fence from y+1, a standing lantern on top at y+4. */
export function lampPost(g, x, y, z)

/**
 * Flat-topped tower as a hollow shell. rows: [z, x0, x1] per z row of its footprint. The perimeter is white_terracotta
 * y0..18, a calcite course at y19 and coping at y20; the interior stays open (floors and decks belong to other parts).
 * tips: [x, z] cells that run unbroken white_terracotta y0..20 (the knife-edge prow tip, no trim). replace: write over
 * the body that the same cells were given.
 */
export function towerPrism(g, rows, { replace = false, tips = [] } = {})

/** Dark band of gray_stained_glass flush in a wall at height y. cells: [x0, z0] or [x0, z0, x1, z1] inclusive boxes. */
export function darkBand(g, cells, y, { replace = false } = {})
```

## The build library (/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs): outline

### build.mjs (library)

```js
// Authoring builds as CODE: design one bay, tile it; mirror for symmetry; protect function with a guard.
// Coordinate bookkeeping is where design time and errors go — write a short generator script with these helpers
// instead of typing hundreds of coordinates.
//
//   import { load, Grid, guard, tile, mirrorX, B, face } from "<plugin>/tools/src/build.mjs"
//   const g = guard(load("in.nbt"))                 // refuses writes into functional cells (see check.mjs)
//   runParts(g, [["shell", shellPart], ["porch", porchPart]], { palette: "palette.json" })  // later parts only add
//   tile(g, { from: 1, step: 4, count: 5, axis: "z" }, (z) => bay(g, z))
//   g.save("out.nbt")

// ---- directions -------------------------------------------------------------------------------------------------
export const DIRS = { north: [0, 0, -1], south: [0, 0, 1], west: [-1, 0, 0], east: [1, 0, 0] };

export const OPPOSITE = { north: "south", south: "north", east: "west", west: "east", up: "down", down: "up" };

export const face = {
  opposite: (f) => ...
  cw: (f) => ...
  ccw: (f) => ...
  mirrorX: (f) => ...
  mirrorZ: (f) => ...
};

// ---- block helpers: return [block, state] pairs for g.set(x, y, z, ...B.stairs(...)) ----------------------------
// Stairs `facing` = the side of the full-height back; a cornice/bracket lip toward the street uses
// facing = the INWARD direction with half: "top".
export const B = {
  stairs: (mat, facing, half = "bottom", shape = "straight") => ...
  slab: (mat, type = "bottom") => ...
  log: (mat, axis = "y") => ...
  wood: (mat, axis = "y") => ...
  pillar: (block, axis = "y") => ...
  trapdoor: (mat, facing, half = "bottom", open = false) => ...
  door: (mat, facing, half = "lower", hinge = "left") => ...
  fence: (mat) => ...
  wall: (mat) => ...
  pane: (block = "glass_pane") => ...
  lantern: (hanging = false) => ...
  chain: (axis = "y", version26 = true) => ...
  wallTorch: (facing) => ...
  block: (name) => ...
  banner: (color, patterns = [], { wall = true, facing = "north", rotation = 0, legacy = false } = {}) => ...
  sign: (wood = "oak", lines = [], { wall = true, facing = "north", rotation = 0, hanging = false, color = "black", glow = false, back = [], dataVersion = 4189 } = {}) => ...
};

// ---- placement helpers ------------------------------------------------------------------------------------------
/** Call fn(pos, i) for count positions from `from`, `step` apart (the bay rhythm). */
export function tile(_g, { from = 0, step, count, to }, fn)

/** Run `paint(set)` twice: as written, and mirrored across x = cx (x' = 2cx - x), flipping east/west facings. */
export function mirrorX(g, cx, paint)

export function mirrorZ(g, cz, paint)

/** Hollow box: walls (and optional floor/ceiling) of a cuboid. */
export function shell(g, a, b, block, { floor = true, ceiling = true, state } = {})

/** Set a box to air (carving). Air is stored, so it clears the cell when the structure is placed. */
export const carve = (g, a, b) => ...

/** Replace only where the current block matches `from` (a name or a predicate). */
export function replace(g, a, b, from, block, state)

/**
 * Wrap a grid so writes into protected cells are refused (counted, never thrown), so a decor script cannot
 * break function. protect: Set of "x,y,z" — default: the grid's own functional cells and the cells that must stay
 * clear around them (check.mjs functionalCells). `g.refused` lists what was blocked; report it.
 */
export function guard(g, protect)

/**
 * Draw blocks from text, the way Litematica stores a schematic (a palette, then one index per cell): one character per
 * block, a legend for the characters. Far fewer tokens than a set() per block, and the layout is visible as written.
 *   layers(g, [x, y, z], { "#": "oak_planks", "b": ["red_bed", { facing: "south", part: "head" }], "c": "chest" }, [
 *     ["#####", "#b c#", "#b  #"],      // y: rows run along +x, successive rows along +z
 *     ["#####", "#   #", "#   #"],      // y + 1 ...
 *   ])
 * A single layer may be passed as one array of rows. Characters not in the legend (space, ".") are left as they are.
 * Writes go through g.set, so runParts' lock and palette report apply. Returns the number of blocks placed.
 */
export function layers(g, [x0, y0, z0], legend, rowsOrLayers)

/**
 * Run a build's parts in order so each part can only ADD to what earlier parts built: a write into a cell an earlier
 * part placed (air included, so no carving) is refused, counted, never thrown, so a later part can't knock holes in
 * a wall. Cells set before runParts (the ground) stay writable: farmland and paths may replace grass. With a palette
 * (palette.json, or its object: { roles: { role: [blocks] }, objects: [blocks] }), every block placed outside it is
 * reported. Prints one line per part, writes the reports to `report` (default parts-report.json; null for none) and
 * returns them.
 * roof: a roof spec (roof.json, as for `mcd roof --spec`) laid right after the FIRST part (the shell), so every later
 * part builds around the finished roof instead of the roof tool clearing the attic, gables and lofts after them. No
 * file yet (the roof part writes it, maybe in another copy at the same time): skipped with a note, never an error.
 * sockets.json in the working directory (or reserve: a layout or path; null for none) reserves the redstone shops'
 * envelopes: every write into one is refused. A part given { carve: true } (the stair joiner) may cut through earlier parts' floors and ceilings for its
 * stairwells: cells with air straight above or below. Walls stay refused.
 *   runParts(g, [["shell", shell.build], ["stairs", stairs.build, { carve: true }], ["garden", garden.build]],
 *     { palette: "palette.json", roof: "roof.json" })
 */
export function runParts(g, list, { palette, roof, reserve, log = console.log, report = "parts-report.json" } = {})

/** Lettering in a band: plaque(g, "LEAGUE HALL", { at, face, width, height, letter?, material?, frame?, style?, relief? }) */
export const plaque = (g, text, o) => ...

/** A bed, both halves: foot at [x,y,z], the head one step toward facing (the pillow end), same colour and facing.
 *  Both cells must be air (a bed never replaces a wall block); the head goes against a solid wall, never a window or
 *  a door. Returns true when placed, false (placing nothing) when a cell is taken. */
export const bed = (g, [x, y, z], facing, color = "red") => ...

/** A straight flight of stairs a player walks up without jumping: from = the first step's cell (standing on the lower
 *  floor), facing = the way you walk up, to = the y of the UPPER FLOOR's own block layer. The last step is set in that
 *  layer, flush with the floor you step out onto, so a storey of h (floor to floor) takes h steps. Clears 2 blocks of
 *  headroom over every step (cutting the floor above where the flight passes) and hangs an upside-down stair under each
 *  step as a stringer. width runs to the right of facing. Returns { steps, landing: [x,y,z] (feet on the upper floor), notes }. */
export const flight = (g, { from: [x, y, z], facing, to, material = "oak", width = 1, stringer = true }) => ...

/** A hearth and its chimney: the fire at the BOTTOM, smoke up a flue, the stack set INTO the wall so the room loses no
 *  space. Give wall = [x, floor level, z], a cell of the outside wall at the hearth's floor level, and into = the side the
 *  room is on: the campfire goes one cell OUTSIDE the wall (an exterior chimney), the wall cell becomes the hearth's
 *  mouth with a lintel over it, and the flue rises outside the wall with the house wall as its room side. (Or give
 *  at = the campfire's cell and open = the side its mouth faces, for an interior chimney set into a partition.)
 *  top = the flue's last course (1-2 over the roof where it leaves it; the mouth is open above). The flue is a 1 x 1
 *  column of air walled on all four sides at every level: the house wall below the roof, and from the roof up the
 *  chimney's own masonry (never the roof's tiles), or with thin: "iron" | "copper" | a wood, an open trapdoor lying
 *  flat against the flue where there is only air beside it (a slim pipe above the roof). Build it after the roof.
 *  It lays its own footing down to the ground and overwrites what is in its cells: call it directly, never through a
 *  helper that writes only into air (that helper refuses the whole stack over one filled cell). */
export const chimney = (g, { wall, into, at, open = "south", top, material = "bricks", thin = null, lintel = true, roofY }) => ...

/** A window shutter: an open trapdoor in the cell in front of the wall (on the face side), lying flat against it.
 *  face: the way the wall looks (north for a north front); the trapdoor's facing is the face, so it lies on the wall. */
export const shutter = (g, [x, y, z], face, wood = "spruce", { height = 1 } = {}) => ...

/** A word in banner letters hung on a board, in reading order for its face: bannerWord(g, "BUTCHER", { center: [14, 10, 4], face: "north" }). */
export const bannerWord = (g, word, o) => ...

/** The sockets' fit-out (glass wall lines and back walls, spawn-proof pit floor, counters): fitSockets(g, layout, { counter, glass }) */
export const fitSockets = (g, layout, o) => ...

/** A clock face on a tower: clock(g, { center, face, radius?: 2-4, dial?, bezel?, hands?, time?: "10:10", out?: 0|1 }) */
export const clock = (g, o) => ...

/** A shop sign: signboard(g, "BAKERY", { at, face, mode: "wall"|"hanging", width?, height?, wood? }) */
export const signboard = (g, text, o) => ...

/** Banners along a row: bunting(g, { from, to, face, colors?, every?, pattern? }) */
export const bunting = (g, o) => ...

/** A profiled pilaster: pilaster(g, { at, face, height, width?, out?, material?, profile?, shoulder? }) */
export const pilaster = (g, o) => ...

/** An opening surround: surround(g, { at, face, width, height, preset?, trim?, keystone?, reveal?, door?, arch? }) */
export const surround = (g, o) => ...

/** Glazing: glazing(g, { at, face, width, height, preset: grid|shopfront|transom|sidelights, frame?, door? }) */
export const glazing = (g, o) => ...

/** A light fitting: fixture(g, { at, face, mount: bracket|arm|top|hang, lamp? }) */
export const fixture = (g, o) => ...

/** A planter: planter(g, { at, face, width, kind: box|ground, depth?, plants? }) */
export const planter = (g, o) => ...
```

## The toolkit reference (references/toolkit.md)

# Toolkit reference

`MCD="node ${CLAUDE_PLUGIN_ROOT}/tools/bin/mcd.mjs"` — pure Node 20+, no install. First use downloads the
Minecraft client jar for the needed version from Mojang (sha1-verified) into `~/.cache/minecraft-design/`, or
uses `$MC_CLIENT_JAR`, the official launcher's or Prism Launcher's local jars. Nothing copyrighted ships here.

## Coordinates and facing (read this once)

- Files: every command reads a structure `.nbt` or a Litematica `.litematic` (all regions, in one box); `g.save()`
  and `mcd convert` write either, by extension. Block-entity data and entities survive both ways.
- Structure-local: `x` east, `y` up, `z` south. `0 ≤ x < size[0]` etc.
- Conventional front for new builds: **north (−z)**, the street at `z < 0`. `mcd render` auto-detects the front
  from exposed windows/doors; override with `--front n|s|e|w`.
- Walking into a building that faces north, you face **south (+z)**; east (+x) is on your **left**.
- `facing` on blocks:
  - **stairs**: the side of the full-height back. A cornice/bracket whose lip points at the street:
    `half: "top"`, `facing` = the direction *into* the wall. A roof slope rising to the north: `facing: "north"`.
  - **trapdoor**: the side it hinges from when open; closed `half: "top"` sits in the top of the cell.
  - **wall torch / wall sign / wall banner**: the direction it *points out* (away from the wall).
  - **repeater / comparator**: `facing` points toward the *input* (signal flows the opposite way).
  - **logs**: `axis: x|y|z`.
- `mcd states <block>` lists every valid property and value for a block in the target version; `mcd blocks
  --grep <re>` lists valid ids (ids change: 26.x renamed `chain` → `iron_chain`); `mcd blocks --check a,b,c` says
  which ids are real and suggests near names for the rest. Use them instead of guessing.
- `mcd walk build.nbt --rooms rooms.json` floods the cells a player can stand in (jump one up with headroom, drop up
  to three, through doors and gates, up ladders, vines, scaffolding and water columns such as a soul-sand water
  elevator) from the entrance and says, per room box, whether it's reached, unreachable, or
  partly blocked by furniture. rooms.json: `{"entrance": [x,y,z], "rooms": [{"name", "box": [x0,y0,z0,x1,y1,z1]}]}`.
- `mcd rooms build.nbt --rooms rooms.json [--only name,...] [--out rooms.png]` shows every room: a dollhouse view
  (everything above the room cut away, from a front corner) and, for rooms 5+ wide both ways, an eye view inside.
- `layers(g, [x, y, z], legend, rows)` (build library) draws blocks from text the way Litematica stores them: a
  legend of characters, one character per block, rows along +x, successive rows along +z, layer by layer. Use it for any
  layout of many different blocks (a furnished room, a facade panel); it costs a fraction of a set() per block.
  `mcd plan build.nbt --rooms rooms.json [--only name]` prints each room's floor as that grid ('#' wall, 'D' doorway,
  'W' window, 'o' already there, '.' free floor) with the origin to pass to layers().
- `mcd room build.nbt --rooms rooms.json --only "<room>"` is a room designer's one check after each rebuild: the walk
  verdict with the floor cells a player can't reach (marked `x` on the floor grid, which shows the furniture as `o`),
  the light levels at the feet, and lantern spots (hanging under the ceiling where there's headroom, else against a
  wall) that would lift the dark and dim cells to 8+. Exits 1 until the room is walkable with no dark cell.
- `mcd light build.nbt --rooms rooms.json [--only name]` (or `--y <feet y>` for a whole floor level) maps block light
  the way the game spreads it (each source at its vanilla level, one less per block, stopped by full blocks): each
  floor cell's level as 0-9/A-F, with min, mean and the DARK (0, mobs spawn) and dim (1-7) counts. Design lighting
  with it: the renderer has no night.

## Commands

| Command | Does |
|---|---|
| `render <f.nbt> [--out s.png] [--front d] [--ground y] [--cut y] [--eye x,y,z --look x,y,z [--label t]]... [--view "name:x,y,z->x,y,z"]... [--tiles dir]` | The look sheet: 3 street views at eye height, 4 elevations, 2 front-corner isos, optional cutaway and interior eye views. `--view` adds a named exterior camera with sun shadows (e.g. `"downstream:28,14.5,40->31,18,22"`, the iconic view of a house over a waterfall). `--tiles` also writes each view as its own PNG (zoom into one with Read). |
| `compare <before> <after> [--out c.png]` | Before \| after sheets side by side, same cameras. |
| `convert <in> <out>` | Structure `.nbt` ↔ Litematica `.litematic`, by extension (schematic version 7 for 1.20.5+, 6 before). Use `.litematic` for builds over 48 blocks a side, which a structure block can't place in one go. |
| `roof <in.nbt> <out.nbt> --style <s> [--pitch p] [--eave e] [--material m] [--ridge r] [--dormers 2:e] [--pediment n] [--tower x,z,w,h,top] [--chimney x,z] [--keep box] [--spec roof.json]` / `roof <in.nbt> --detect` | Re-roof a build by style name: detects the eave and footprint, strips the old roof, builds the new one (see roofs.md). `--detect` only reports what it found. |
| `check <f.nbt> [after.nbt] [--contract c.json] [--site site.json] [--json]` | (A contract file adds to the automatic redstone protection.) Census, walkability, largest blank surfaces (interior and exterior separately); with two files the FUNCTION report: protected cells unchanged, keep-clear cells clear, warnings for new conductive/triggering/feeding neighbours. `--site` adds the landscape checks (see landscaping.md). Exit 1 on any violation. |
| `info <f.nbt>` | Size, DataVersion → version, census, block entities, functional cell count, unknown block ids. |
| `blocks [--grep re]` / `states <block>` | Valid ids / states for the version. |
| `new <build.mjs> [--from in.nbt] [--size x,y,z] [--out out.nbt]` | Scaffold a generator script wired to the build library (with `--from`, writes are guarded). |
| `concept "<subject>" --out c.png [--size s] [--palette p] [--provider codex\|gemini] [--ref img]... [--model m] [--raw]` | A builder's reference sheet (front elevation + 3/4, one scale, no scene). Codex CLI image tool when installed (ChatGPT plan, no key, ~1 min; `--ref` redraws from a given image), else Gemini (`GEMINI_API_KEY`, Nano Banana 2.1 by default). Measured: this prompt shape matters more than the model; 2–3 candidates across providers, picked against the brief, add useful variety. |
| `assets [--version v]` | Pre-fetch the client jar. |

Version: `--version` › `$MCD_VERSION` › the file's DataVersion › latest release.

Render notes: no light engine (light sources show as blocks, not glow); interior eye views skip sun shadows;
block-entity blocks (chests, signs, beds, banners, heads) render as simple textured boxes; entities (item
frames, armour stands) are not drawn. Keep `--look` inside the build for interior views.

## Build library (`tools/src/build.mjs`)

```js
import { load, Grid, guard, tile, mirrorX, mirrorZ, shell, carve, replace, B, face, DIRS } from ".../tools/src/build.mjs";
const g = guard(load("in.nbt"));          // or: new Grid([w, h, d], { dataVersion })
g.set(x, y, z, ...B.stairs("dark_oak", "south", "top"));   // [block, state] helpers: stairs slab log wood trapdoor door fence wall lantern chain wallTorch pane block
g.fill([x0, y0, z0], [x1, y1, z1], "stone_bricks");
tile(g, { from: 1, step: 4, to: 19 }, (z, i) => bay(z, i));  // the bay rhythm
mirrorX(g, cx, (set) => set(x, y, z, block, state));          // symmetric pair, facings mirrored
shell(g, a, b, "spruce_planks", { floor: true, ceiling: false });
carve(g, a, b);                            // stores air (clears the cell on placement)
replace(g, a, b, "spruce_planks", "stone_bricks");
g.save("out.nbt");                          // never overwrite the input
console.log(g.refused);                     // guarded writes that were refused (report them)
```

Shape brushes (also exported from `build.mjs`): curved forms — `dome`, `cylinder`, `minaret`, `arch` (+ `circleCells`,
`ring`, `disc`, `revolve`) — see `shapes-curved.md`; massing — `setbacks`, `gableRoof`, `hipRoof`, `fins`, `parapet`,
`cornice`, `falseFront`, `stepGable` — see `shapes-massing.md`. Each is `fn(g, opts)`, writes through `g.set` (so
`guard()` still protects function), and returns `{cells, refused, bounds}`.

`guard(grid)` refuses writes into the grid's functional cells and their keep-clear cells (or a set you pass);
it never throws — check `g.refused`. `runParts(g, [["shell", shell.build], ["garden", garden.build]], { palette:
"palette.json" })` runs a build's parts in order so each can only add into air: writes into an earlier part's cells
(air included) are refused and reported, the ground laid before it stays writable, and blocks outside the palette
are reported per part. With `roof: "roof.json"` (a `mcd roof --spec` file) it lays the roof right after the first
part, so later parts build around it instead of the roof tool clearing attics and gables after them; no file yet means
the roof is skipped with a note. A part given `{ carve: true }` as a third element (the stair joiner) may cut through
earlier floors and ceilings (cells with air straight above or below), never walls. `mcd reskin in.nbt out.nbt --swap
spruce=dark_oak,red=blue[,bricks=mud_bricks] [--box ...]` swaps materials on a finished build, form for form, states
kept (a wood or dye word swaps every block named with it; a full block id swaps itself and its stairs, slab and wall);
`mcd variant <run> --name n [--swap ...] [--roof '{json}']` does it into `<run>/variants/n/` with a card, re-running
the build's code when the roof changes. `mcd overworld palette.json [--write]` lists (drops) nether and end blocks. The Grid keeps block-entity NBT (sign text, chest contents) and entities and
writes them back unchanged; cells you don't touch round-trip byte-for-byte.

Grow the box with `g.resize([w, h, d], [dx, dy, dz])` (a shift grows toward −); a shift moves every coordinate,
so re-derive any contract coordinates after shifting.

## Banners, signs and other block entities

Banners, signs, chests, beds, bells, mob heads, decorated pots and shulker boxes are entity-rendered in vanilla, and
`mcd render` draws them with their entity models and textures:
- **Banners:** the cloth in its base colour plus every dyed pattern from the block entity.
- **Signs:** their text, glowing text drawn brighter.
- **Other entity-rendered blocks:** a neutral box, listed under `unknownBlocks` as "entity-rendered, approximated".

Author banners and signs with the build helpers. Each returns `[block, state, nbt]` with valid block-entity NBT
that round-trips through save and load:

```js
g.set(x, y, z, ...B.banner("cyan", [["stripe_center", "white"], ["border", "black"]], { facing: "north" }));   // wall banner
g.set(x, y, z, ...B.banner("red", [["cross", "yellow"]], { wall: false, rotation: 8 }));                       // standing, faces north
g.set(x, y, z, ...B.sign("spruce", ["PERMIT", "OFFICE"], { facing: "north", color: "black", glow: false }));
```
- **Banner patterns:** `stripe_center`, `stripe_top`, `stripe_bottom`, `stripe_left`, `stripe_right`,
  `stripe_middle`, `border`, `curly_border`, `cross`, `straight_cross`, `rhombus`, `circle`, `flower`, `globe`,
  `gradient`, `gradient_up`, `half_horizontal`, `half_vertical`, `triangle_top`, `triangle_bottom`, `bricks`,
  `small_stripes`, `diagonal_left`, `diagonal_right` (the full list is under `textures/entity/banner/`).
- **Colours:** the 16 dye names.
- **NBT format:** banners use the 1.20.5+ `patterns` list (`legacy: true` writes the older `Patterns` /
  `Pattern` / `Color` form). Sign text is written as JSON components below data version 4325 (1.21.5) and as plain
  string components from 1.21.5 on (`dataVersion` option; the grid's default is 1.21.4).
- **Standing `rotation`:** 0 faces south, 4 west, 8 north, 12 east. Wall banners and signs hang on the block behind
  them and face `facing`.

## How things sit: `mcd fit`

`$MCD fit build.nbt --rooms rooms.json` (and the FIT lines of `$MCD room`) lists what a player sees wrong from inside,
each with its cell: anything **on a bottom slab** (half a block of air under it), floor decor **floating** over air,
a **broken bed** (one half, or halves that don't match), a **bed in the wall** (set into the wall line), a **bed
against an opening** (its head at a window, a pane or a door, or at nothing), a **bed backwards** (foot against the
wall, head out in the room), **stairs end short** (a walked flight whose top step is a full block under the floor it
leads to: a jump), a **chimney fire** fault (a campfire on top of a stack, shut in a stack with no
firebox mouth, its smoke blocked before the sky, a flue open at the side, or roof tiles walling the flue), a
**chimney in the room** (a hearth or flue in a room's floor space instead of set into the wall), a **floating shutter** (an open trapdoor with air behind it), **bookshelf overuse** (more
than 3 outside a library, study or office) and a **hallway to nowhere** (a hall with one way in, or a long stretch no
walk between its openings passes). With `street` in rooms.json it also walks the **way in**, street to main door (with `entrances`, each building's or
module's, from the street straight in front of it),
and lists a **steep approach** (a stair or a full-block step on it, more than 3 half-steps without a 2-long landing,
1 wide, or no level cell before the door): the approach standard, `$MCD approach` alone. The shop sockets' boxes are skipped.
Helpers that get it right: `bed(g, [x, y, z], facing, color)` (both halves; refuses a cell that isn't air and returns
false), `flight(g, { from, facing, to, material, width })` (a flight whose last step is in the upper floor's own layer,
headroom cut, stringer under it), `chimney(g, { wall: [x, floorY, z], into, top, material, thin })` (an exterior chimney: the fire
just outside the wall, its mouth cut through it, hay in the floor, a 1 x 1 air flue to the sky, masonry through the
roof, thin trapdoors above it, its own footing; call it directly, never through an air-only helper), `shutter(g, [x, y, z], face, wood, { height })`
(flat on the wall), `bannerWord(g, word, { center, face })` (letters in reading order).

## Review card

One image of a build for a glance or a reviewer (prints one JSON object; non-zero exit and a stderr message on error):

- `mcd card <f.nbt> --out card.png [--tiles dir] [--front n] [--reuse]` — render (close-ups, `MCD_TILE_SCALE=2`) and compose the card (street | front-left, front-right | back, plus the roof close-up row; tiles fit 700x700, white). `--reuse` skips the render when `dir/street.png` exists. `{"card","tiles","views":[...]}`
- `mcd card <f.nbt> --out eye.png --tiles dir --layout eye` — the eye-level card: only what a player sees from the ground (street | down-the-street left, right | back), sky trimmed, so a roof weighs what it weighs in the game.

## Inspection

Cheap, deterministic checks to run after every pass, before judging a render by eye. Each has `--json`.

- **Glance and close-ups** — `$MCD render house.nbt --closeups --tiles tiles/` adds a row of tiles to the sheet: a
  *glance* tile (the street view at 320 px: what reads at a glance) and close-ups at ≥ 12 px per block of the
  entrance (door cells), the eave band, each facade's busiest region, and every small feature visible from outside
  (signs, banners, lanterns, pots, finials). Each tile is labelled with what it frames and its px/block; the JSON lists
  the box and side of each. For any other spot:
  `$MCD zoom house.nbt --at 12,3,0 [--radius 3] [--from n|s|e|w] [--out zoom.png]` (default side: the one with a clear
  line of sight, front first; cells far in front of the spot are left out so they cannot hide it).
- **Change report** — `$MCD diff before.nbt after.nbt --png diff.png [--json] [--fail-empty]`: changed cells by kind
  (added / removed / replaced / state) and block, their groups and boxes, the faces they show on, how many are enclosed
  (never show) or interior-only; with `--png`, changed pixels per standard view and a BEFORE | AFTER pair cropped to
  the change for the two views that changed most. `--fail-empty` exits 1 when nothing changed, when no view shows a
  pixel of the change, or when every changed cell is enclosed — a pass that wrote nothing is a failure, not a no-op.
- **Palette** — `$MCD palette house.nbt`: visible blocks classed into roles by where they sit (walls field, trim and
  edges, roof, base, openings, accents, plants), each with its main materials and measured tone (texture average
  from the client jar). Flags, each with a concrete suggestion: roof in the walls' tone; trim invisible on its wall
  (`trim: stone_bricks on stone_bricks walls -> tuff_bricks or smooth_stone`); an outlier block used a handful of
  times that clashes with everything around it; more than 3 accent colour families; dark detail on a dark ground
  (or light on light).
- **Structure** — `$MCD check house.nbt` now always reports STRUCTURE: floating groups (not connected to the
  lowest layer through face or edge contact), unsupported hanging/mounted blocks (a hanging lantern with nothing
  above, a standing banner or lantern on air, a wall sign with nothing behind), orphans (one block sticking out
  sideways or dangling, touching the build on one face), and enclosed cells (a change there never shows; with two
  files, how many changed cells are enclosed). Report only; the exit code is unchanged.

# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# Radio City Music Hall block: architect's plan (form)

All coordinates use the brief's shared module frame. Plot 0 is x0..33, plot 1 x38..100, plot 2 x105..155, and all three share z0..54. In the world the plots stand edge to edge: plot 0 x33 adjoins plot 1 x38, and plot 1 x100 adjoins plot 2 x105. y0 is each plot's lowest ground. Map columns are 2 blocks wide: plot 0 column c → x 2c..2c+1; plot 1 → x 38+2c; plot 2 → x 105+2c. Row r → z 2r..2r+1.
North (51st St) is z0. South (50th St, the hero face) is high z. Sixth Ave is west (low x); Fifth Ave and Rockefeller Plaza are east (high x).
The camera is high over Fifth Ave, looking west and down. It sees the roofs, the east faces and the south (50th St) faces most, so the 50th St marquee, the blade sign and every roof deck are the priority. The Sixth Ave marquee is built too.
The brief's "front faces NORTH" does not apply: these buildings stand in their site orientation. The street fronts are south (50th St) and west (Sixth Ave), plus north (51st St) and east (Rockefeller Plaza) on plot 2.

## SITE

| Plot | Ground | Streets / open ground |
|---|---|---|
| 0 | flat, ground 0 everywhere: the sidewalk course is y0, walking level is y1 | Sixth Ave (west): x0..1 is the sidewalk zone under the marquee. 50th St (south): z52..53 is the sidewalk under the marquee. The service court x30..33 z20..53 and the sidewalk x10..33 z52..53 are paved at y0 and lit; the lidar shows nothing built there |
| 1 | ground 0 at x38..~58, ground 1 east of that: the foundation course follows the ground, and walking level is ground+1 | alley x38..39 z24..54 (open, paved, lit). The 50th St sidewalk z52..54 sits under the marquee |
| 2 | ground 0 at x105..126, ground 1 east of that | light well x117..126 z38..39 (open to the sky, paved, lit). Plaza bits open at x153..155 z14..15 and z38..41 |

### Plot 0: 1270 Avenue of the Americas and the Radio City corner (cap y124)

| Mass | x | z | y (top block) | Notes |
|---|---|---|---|---|
| P0-A 51st St podium | 2..17 / 18..33 | 0..3 | 0..21 / 0..25 | flat deck one below the top block, parapet as the top block |
| P0-B NW podium | 2..5 (+6..7 at z4..5) | 4..9 | 0..21 | |
| P0-C NE podium | 28..33 / 30..33 | 4..9 / 10..19 | 0..26 / 0..28 | |
| P0-D main slab | 2..29 | 10..45 | 0..104 | deck y103, parapet y104; a string course at y28 marks the Music Hall podium line on its west face |
| P0-E north wing | 6..27 (x6..7 only from z6) | 4..9 | 0..99 | deck y98 |
| P0-F south wing (the 50th St tower face) | 6..27 | 46..49 | 0..99 | deck y98 |
| P0-G crown | 6..23 | 14..39 | 104..112 | deck y111; floodlit lantern box x13..16 z25..28 y112..114 |
| P0-H Music Hall corner block | 2..5 at z46..51, plus 6..9 at z50..51 | 46..51 | 0..21 | deck y20; the grand entrance |
| P0-M marquee, west run | 1..2 body, banners in x0 | 4..51 | 6..10 | rounded north end at z4..5 |
| P0-M marquee, south run | 2..27, body at z50..52 (corner-block part z51..52), banners in z53 | 50..53 | 6..10 | joins the west run at a rounded corner (cell x1 z52 left as air, a quarter round); rounded east end x26..27 |
| P0-S vertical blade sign | 0..4 | 51..52 (banners in z53) | 11..32, stepped cap y33 (x1..3) and y34 (x2) | rises from the marquee top at the corner: 2 west and 1 south of the wall faces, free-standing above the corner block's roof (y22..32) against the tower behind |

Deviation, stated: the lidar's 2-wide y28 strip along Sixth Ave (x0..1) becomes the marquee zone. Its height survives as the y28 string course on the slab's west face, which stands at x2.

### Plot 1: Radio City Music Hall auditorium (cap y45)

| Mass | x | z | y (top block) | Notes |
|---|---|---|---|---|
| H-A 51st St strip | 40..83 | 0..3 | 0..25 | deck y24 |
| H-B north band (lobby/office front) | 38..65 / 66..100, plus 84..100 at z0..3 | 4..13 | 0..33 / 0..34 | |
| H-C auditorium | 40..100 (x38..39 only z4..23, to y31) | 14..49 | 0..32 | deck y31: the broad flat deck |
| H-D stage house | 88..97 | 16..39 | 0..34 | deck y33, raised over the hall deck |
| H-E 50th St front | 40..100 | 50..51 | 11..25 | stands on the marquee; deck y24; the hall's south wall z49 shows above it from y26 to y32 |
| H-M marquee | 40..86, body at z50..52, banners in z53 | 50..53 | 6..10 | rounded ends x40..41 and x85..86 |
| H-G stage-door canopy | 89..94 | 50..52 | 6..7 | small canopy |

### Plot 2: east end, toward Rockefeller Plaza (cap y78)

| Mass | x | z | y (top block) | Notes |
|---|---|---|---|---|
| E-A base | 105..155 at z0..13 and z38..54 (z54 only to x154); 105..150 at z14..37 | 0..54 | 0..19 | deck y18, parapet y19; minus the light well |
| E-B party strip (against the Music Hall stage) | 105..106 | 0..17 and 38..54 | 0..33 | blind wall |
| E-C west wing | 105..124 | 18..37 | 0..45 | deck y44 |
| E-D tower | 127..150 | 10..45 | 0..63 | deck y62 |
| E-D' east returns | 151..152 | 10..15 and 38..45 | 0..63 | they frame the recessed Plaza front at x150 |
| E-E west step | 125..126 | 10..43 | 0..55 | deck y54 |
| E-F north setback | 127..150 | 4..9 | 0..52 | deck y51 |
| E-G south setback | 127..150 | 46..51 | 0..52 | deck y51 |
| E-H east crown | 145..150 | 14..43 | 63..67 | deck y66; floodlit |
| E-I mechanical penthouse | 131..142 | 22..33 | 63..64 | |

## ROOFS

Every roof is flat with a parapet, Rockefeller Center style. Use the `$MCD roof` preset `flat-parapet` (`modern` where it allows the coping below), with no dentils, no iron rail and no overhang. The parts build each deck by hand where a deck sits inside a parapet ring.

| Roof | Deck y | Parapet | Surface | Light / features |
|---|---|---|---|---|
| P0 crown | 111 | y112: wall body plus smooth_sandstone_slab coping | light_gray_concrete with gray_concrete bands every 6 | lantern box x13..16 z25..28 y112..114 of sea_lantern behind light_gray_stained_glass; lightning_rod mast on top at x14 z26 y115..118 |
| P0 slab ring (the setback round the crown) | 103 | y104 | light_gray_concrete | a sea_lantern in the deck every 4 along the foot of the crown wall (it floodlights the crown) and a grid every 8 |
| P0 wings | 98 | y99 | light_gray_concrete | sea_lantern grid every 6; two iron_trapdoor vent hoods per wing |
| P0 podia and corner block | 20 / 24 / 25 / 27 | top block | gray_concrete | sea_lantern every 6 |
| Marquee tops | 10 | none | smooth_quartz_slab top layer | end_rod bulbs upright every 2 along the front edge; sea_lantern every 4 |
| H-C hall deck | 31 | y32, low | gray_concrete field with light_gray_concrete walk strips on a 6-grid | three skylight strips (light_gray_stained_glass over glowstone) at x50..74, z22/30/38, each 2 deep; 6 vent boxes (iron_block with iron_trapdoor lids) at x46, 58, 70, 82 on z18 and z44 |
| H-D stage house | 33 | y34 | gray_concrete | sea_lantern ring; a fly-loft vent row of iron_trapdoor along x92..93 |
| H-B / H-A / H-E | 32 / 33 / 24 | top block | gray_concrete | sea_lantern every 6 |
| E crown / tower / setbacks / west wing / base | 66 / 62 / 51 / 44 / 18 | top block, slab coping | light_gray_concrete | sea_lanterns as above; floodlights on the setback decks at the foot of each wall above |
| Roof gardens (plot 2) | on decks y18 (x107..125 z2..12 and z40..52) and y44 | top block | moss_block beds 3 wide in smooth_sandstone kerbs, persistent oak_leaves hedges, azalea / flowering_azalea | lanterns standing on the kerbs every 6 |

No roof is pitched. Roofs meet as stepped setbacks: each higher mass's wall rises sheer from the lower deck, with no overhangs.

## FACADES

The Rockefeller language, on every office face of plot 0 and plot 2:

- **Piers.** Continuous vertical limestone piers, 1 wide, set in the face plane. One pier every 3 blocks; at the corners a double pier (2 wide).
- **Window strips.** Recessed 1 behind the face plane, between the piers. Each storey is 2 glass rows plus 1 spandrel row.
- **Spandrels** are dark, so each strip reads as one continuous dark vertical line.
- **Parapet band.** A 1-row frieze (cut_sandstone) runs under each parapet.

Storey rhythm:

| Where | Glass rows | Spandrel rows | Frieze | Glass rows by mass |
|---|---|---|---|---|
| Plot 0 | (y−11) mod 3 = 0 or 1 | (y−11) mod 3 = 2 | under every parapet | slab 11..99 (then a solid attic y100..102), wings 11..96, crown 104..108 |
| Plot 2 | (y−8) mod 3 = 0 or 1 | (y−8) mod 3 = 2 | under every parapet | base 8..15 (frieze y17), wing 8..42, tower 8..60, setbacks 8..49 |

### Plot 0

| Face | Base (y0..10) | Middle | Top |
|---|---|---|---|
| West (Sixth Ave), slab x2 | granite plinth y0. Ground storey glazing recessed to x3, y1..5. Marquee y6..10 at x1..2 | piers at z10,13,…,43; double pier z44..45. String course y28: smooth_sandstone_stairs, upside down, 1 proud at x1 | attic y100..102, parapet y104 |
| South (50th St) corner block, face z51 (x2..9) | glazed grand entrance recessed to z50, y1..5. Marquee y6..10 | limestone wall y11..20 with tall narrow windows x6 and x8 (1 wide, y12..19, waxed_cut_copper frames). The blade replaces x2..4 at z51..52 | parapet y21 |
| South wing, face z49 (x6..27) | glazing recessed to z48, y1..5. Marquee body z50..52, y6..10 | y11..21 is the Music Hall band: plain limestone with 2 round enamel plaques and tall narrow windows (see below). From y22 the piers start at x6 (double 6..7), 10, 13, 16, 19, 22, 25 and double 26..27 | frieze y97, parapet y99 |
| East, slab x29 | court side z20..45: lit service and shop doors | piers every 3 on z, from y1 at z20..45 and from y29 at z10..19 | |
| North wing z4 and podium A z0 (51st St) | shopfronts y1..5 at z0, bronze frames | piers every 3; the podium's own windows follow the same rhythm | |
| Crown, all four faces (x6, x23, z14, z39) | | piers every 3; glass 104..108 | frieze y110; sea_lantern floodlights on the deck below |

**Marquee** (every run on plots 0 and 1, the same section; listed here from the street inward):

| y | Front row (x1 west / z52 south) | Behind |
|---|---|---|
| 10 (top) | smooth_quartz_slab | sea_lantern every 4; end_rod bulbs on top every 2 |
| 9 | blue neon: blue_stained_glass | sea_lantern |
| 7..8 | letter band: light_gray_concrete face (silver), banner letters hung on it (wall banners at y8 in the banner row, x0 west / z53 south) | light_gray_concrete |
| 6 | red neon: red_stained_glass | shroomlight |
| 6, soffit underside | alternating glowstone / sea_lantern | |

- Ends and the corner are rounded by leaving the outer corner cell air. The end faces are iron_block cheeks.
- **Words alternate along the runs.** RADIO CITY is red letters on white banners. MUSIC HALL is white letters on blue banners. Use `bannerWord`, which sets the reading order.

| Run | Word placements |
|---|---|
| Plot 0 south | RADIO CITY x3..12, MUSIC HALL x16..25 |
| Plot 0 west | RADIO CITY z8..17, MUSIC HALL z22..31, RADIO CITY z36..45 |
| Plot 1 | MUSIC HALL x44..53, RADIO CITY x58..67, MUSIC HALL x72..81 |

**Blade sign** P0-S (x0..4, z51..52, y11..32):

- A border ring of sea_lantern on the outer columns x0 and x4 and the rows y11 and y32, on both faces.
- Inside the ring: blue_concrete at x1 and x3, with a light_gray_concrete (silver) centre column at x2.
- On the south face, one banner letter per 2 rows hangs at x2 in the banner row z53. Each banner's cell y: R 31, A 29, D 27, I 25, O 23, then C 19, I 17, T 15, Y 13. Letters are red on white banners.
- The north face (z51, visible only above y21) is blue_concrete with a sea_lantern ring.
- The stepped cap is iron_block with an end_rod on top.

**Round enamel plaques (plot 0):**

- Two discs on the wing face z49, each 7 wide, centres at (x14, y16) and (x23, y16).
- The rim is waxed_cut_copper, 1 proud at z50.
- The disc is light_blue_terracotta in the face plane, with a simple figure in orange_terracotta, yellow_terracotta and white_terracotta.
- Tall narrow windows: x10, x18, x19 and x27, each 1 wide, y11..21, with waxed_cut_copper frames.

### Plot 1 (Music Hall)

| Face | Treatment |
|---|---|
| South (50th St), H-E face z51, y11..25 | Plain smooth_sandstone with a granite plinth at y0. Ground storey y1..5: glazed doors recessed to z49 under the marquee. A cut_sandstone frieze runs at y23, coping at y25. **Three great roundels** (Dance, Drama, Song) are set into the wall. Each is 9 wide and 9 tall, centres at (x52, y17), (x70, y17) and (x88, y17). The rim is waxed_cut_copper, 1 proud at z52, but only y12..22, above the marquee. Discs: light_blue / orange / yellow / purple / lime terracotta figures, each roundel with its own dominant colour (blue, orange, purple). Tall bronze-framed windows, 1 wide, y12..22: pairs at x44/46, x60/62, x78/80 and x96/98 (waxed_cut_copper frame, glass). The hall wall above, z49 at y26..32, is plain limestone with piers every 4 |
| Stage door | x90..93, y2..4 (ground 1), recessed 1 into z49; canopy H-G with a sea_lantern underside; a hanging-sign bracket at x94 |
| North (51st St) | H-A face z0 to y25, then H-B at z4 to y33/34. Limestone piers every 4 (1 proud). Tall narrow windows y8..22 in every other bay. Two lit service doors at x56..57 and x76..77 (y1..3 / y2..4) |
| West (alley) | x38/x40: limestone with piers every 4 and a granite plinth; blind above y10 apart from 4 tall slit windows |
| East | party wall against plot 2: plain limestone, no openings |

### Plot 2

| Face | Base (y0..19) | Middle (piers every 3) | Top |
|---|---|---|---|
| South (50th St) z54 | shopfront storey y1..6 (y2..6 east of x126): bronze-framed glass, recessed 1, lit shops behind. Fascia band at y6 in cut_sandstone. Granite plinth y0 | base windows y8..15; tower south setback face z51 and tower face z45 above | friezes, parapets |
| North (51st St) z0 | the same shopfront treatment | setback face z4, tower face z10 | |
| East (Rockefeller Plaza) | x155 at z0..13 and z42..53: shopfronts. The recessed Plaza front x150 at z16..37 is the tower's main entrance: a 3-storey lit lobby y2..11, glass in waxed_cut_copper mullions, with a polished_granite surround 1 proud | piers rise uninterrupted to y62 on the east tower face x150 (z10..45) | crown E-H floodlit |
| West | blind party strip; the wing face x124 shows above the Music Hall roof (y33..45) with piers every 3 | | |

## MATERIALS

| Role | Block |
|---|---|
| Limestone body, piers, walls | smooth_sandstone |
| Friezes, string courses, sills | cut_sandstone; smooth_sandstone_stairs (cornice); smooth_sandstone_slab (coping) |
| Base plinth, entrance surrounds | polished_granite (polished_granite_slab for steps and kerbs) |
| Spandrels (dark strips) | polished_deepslate |
| Office glass, dark | gray_stained_glass |
| Lit windows (about 25%, in clusters of 2..6 cells, more on low floors, never a whole face) | glass in the strip, with shroomlight directly behind it |
| Shopfront and lobby glass | glass_pane / glass, lit behind with shroomlight ceilings |
| Bronze frames, mullions, plaque rims | waxed_cut_copper |
| Marquee silver | light_gray_concrete; iron_block (cheeks, blade cap) |
| Blue neon | blue_stained_glass over sea_lantern; blue_concrete on the blade |
| Red neon | red_stained_glass over shroomlight |
| Gold/white bulbs | end_rod, glowstone, sea_lantern |
| Banner letters | white_banner with a red letter (RADIO CITY); blue_banner with a white letter (MUSIC HALL) |
| Roundel discs | light_blue_terracotta, orange_terracotta, yellow_terracotta, white_terracotta, purple_terracotta, lime_terracotta |
| Roof decks | light_gray_concrete (towers), gray_concrete (hall and podia) |
| Skylights | light_gray_stained_glass over glowstone |
| Vents | iron_block, iron_trapdoor |
| Roof lights | sea_lantern |
| Gardens | moss_block, oak_leaves (persistent), azalea, flowering_azalea |
| Sidewalk / ground | smooth_stone, with a polished_andesite kerb on the outer row |
| Lamps on the ground | lantern on fence-free posts: polished_granite wall stub with a lantern on top |

All of these pass `$MCD blocks --check`.

- Do not use `chain`. The toolkit does not know the 1.21.1 name, so hang things from blocks or use iron_bars.
- Nothing newer than 1.21.1.

## OPENINGS

All are left as air by the shell and glazed by later parts. Ground storey heights are given from walking level.

| Plot | Opening | Coordinates |
|---|---|---|
| 0 | Grand entrance doors, south | x3..9 z50, y1..4 (glass doors), transom y5 |
| 0 | Grand entrance doors, west | x3 z42..51, y1..4 |
| 0 | Sixth Ave shopfronts / lobby | x3, z6..41 in bays of 3 between the ground piers, y1..5 |
| 0 | 50th St wing glazing | z48, x10..27, y1..5 |
| 0 | Court doors, east | x29, z22..23 / 30..31 / 38..39, y1..3 |
| 0 | 51st St shopfronts | z0, x4..31 in bays of 3, y1..5 |
| 0 | Corner block tall windows | x6 and x8, z51, y12..19 |
| 0 | Wing band tall windows | x10, x18, x19, x27, z49, y11..21 |
| 0 | Office strips | every strip between piers, per the storey rhythm |
| 1 | 50th St doors | z49, x42..83 in pairs every 4, y1..4 (y2..4 east of x58) |
| 1 | Tall windows | z51, x44, 46, 60, 62, 78, 80, 96, 98, y12..22 |
| 1 | Stage door | x90..93, z48..49, y2..4 |
| 1 | North service doors | x56..57 and x76..77, z0, at walking level, 3 tall |
| 1 | North tall windows | z0 / z4, every other pier bay, y8..22 |
| 2 | Shopfronts | z54 and z0, x107..154 in bays of 3; x155 at z1..12 and z43..53; y1..5 (y2..5 east of x126) |
| 2 | Plaza lobby | x150, z18..35, y2..11 |
| 2 | Office strips | per the storey rhythm on every face above y7 |

## RESERVED

The shell leaves these empty; later parts fill them.

- Marquee volumes: plot 0 x0..2 z4..51 y6..10 and x0..27 z50..53 y6..10; plot 1 x40..86 z50..53 y6..10. Every banner cell is in these (x0 or z53).
- Blade: x0..4 z51..53 y11..34. This includes the corner block's wall cells x2..4 z51 y11..21, which the blade replaces.
- Roundel discs and rims: plot 0 x11..17 and x20..26 at z49..50, y13..19. Plot 1, around centres x52/70/88: z51..52, y13..21, each disc 9 wide.
- Lit-window backing: the cell behind each chosen lit strip cell, for the shroomlight.
- Roof features: lantern box x13..16 z25..28 y112..114; the mast x14 z26 y115..118.
- Skylight strips and vent boxes on H-C (listed in ROOFS).
- Garden beds on plot 2's decks.

## FLOORS

Exterior only. These levels are for lit lobbies and window backing, not rooms.

| Plot | Level (y) |
|---|---|
| 0 | ground storey floor y0 (walk y1), lobby ceiling y5; offices from y11, one storey every 3 (y11, 14, 17, … 98); crown floors y104 and y107 |
| 0 | the lobbies behind the glazing (1 deep, lit ceilings): corner lobby x3..9 z46..49, y1..5 |
| 1 | lobby y0/1 at walking level, ceiling y5; the auditorium is one blind volume y1..30 inside H-C (no glazing shows it); the stage house volume y1..32 |
| 2 | shops at walking level (ceiling y6); offices from y8, one storey every 3, to the top of each mass; Plaza lobby y2..11 (3 storeys, lit) |

---
# DESIGNER SECTIONS

## PALETTE (all ids checked with `$MCD blocks --check`: no unknowns)
- Limestone: smooth_sandstone (+ _stairs, _slab); friezes cut_sandstone (+ cut_sandstone_slab).
- Plinth/surrounds: polished_granite (+ _stairs, _slab). Spandrels: polished_deepslate (+ _slab).
- Glass: gray_stained_glass (office strips), glass, glass_pane (shops, doors), light_gray_stained_glass (skylights, lantern box).
- Bronze: waxed_cut_copper (+ _stairs, _slab) for frames, mullions, rims, sills.
- Marquee: light_gray_concrete, iron_block, blue_stained_glass, red_stained_glass, blue_concrete, smooth_quartz_slab; light: sea_lantern, shroomlight, glowstone, end_rod (facing up).
- Banners: white_banner, blue_banner (letters via bannerWord).
- Roundels: light_blue/orange/yellow/white/purple/lime_terracotta.
- Roofs: light_gray_concrete, gray_concrete, iron_trapdoor, iron_block, lightning_rod, iron_bars.
- Garden: moss_block, oak_leaves (persistent=true), azalea, flowering_azalea. Ground: smooth_stone, polished_andesite (+slab), lantern (hanging=false on a polished_granite stub).
- No `chain`, nothing newer than 1.21.1.

## VOCABULARY
- limestone_mass(g, box, {plinth}) : hollow-free solid smooth_sandstone box to its top block; polished_granite at y0 (y1 where ground 1); no interior needed beyond 1 wall thickness behind glazing.
- setback_deck(g, box, {y, ground:'light_gray_concrete'|'gray_concrete', lightEvery}) : deck at y, parapet one above in smooth_sandstone with smooth_sandstone_slab coping on top of parapet? No: parapet is the top block, slab coping only where plan says; sea_lantern flush in deck every lightEvery.
- pier_wall(g, {face, from, to, y0, y1, phase, pierEvery:3, corners:'double'}) : piers smooth_sandstone in face plane; between them recess 1 and set glass rows gray_stained_glass where (y-phase)%3 in {0,1}, polished_deepslate where ==2; strip never has air.
- frieze_band(g, box) : cut_sandstone one row under parapet; string course = smooth_sandstone_stairs half=top facing outward.
- lit_window_cluster(g, face, x|z, y, n): n (2..6) adjacent strip glass cells get shroomlight in the cell directly behind.
- crown_lantern(g): 4x4x3 box sea_lantern core, light_gray_stained_glass skin, lightning_rod mast.
- marquee_run(g, {axis, from, to, front}) : section per plan (soffit y6 alternate glowstone/sea_lantern; y6 front red_stained_glass backed by shroomlight; y7..8 light_gray_concrete; y9 blue_stained_glass backed by sea_lantern; y10 smooth_quartz_slab, end_rod every 2 on the front edge, sea_lantern every 4 behind).
- marquee_corner(g): quarter round at x0..2 z50..53 (cell x1 z52 left air; neighbours stairs/slabs for round), same bands.
- marquee_end(g, cell): iron_block cheek.
- marquee_word(g, word, {center, face, letter, base}) : bannerWord on the banner row; RADIO CITY red/white, MUSIC HALL white/blue.
- blade_sign(g): as plan section Blade sign; both faces; letters via bannerWord stacked (one char per 2 rows, face south, x2 z53).
- roundel(g, {center, face, r:3|4, dominant, rim}) : disc of terracotta in face plane, rim waxed_cut_copper 1 proud, figure of 3 other terracottas (sun, mask, lyre abstract: ring + cross + dots).
- tall_window(g, {pos, face, y0, y1}) : 1-wide glass_pane framed by waxed_cut_copper both sides, sill waxed_cut_copper_stairs top.
- glazed_front(g, box, {mullionEvery}) : glass_pane with waxed_cut_copper mullions, shroomlight ceiling course, doors as glass panes (no door block needed).
- shopfront_bay(g, {face, x|z, w:3}) : glazed_front + cut_sandstone fascia at y6, shroomlight behind, polished_granite plinth.
- stage_door(g) : recess 1, waxed_cut_copper frame, canopy slab + sea_lantern underside.
- hall_deck / skylight_strip / vent_box : per ROOFS table; vent_box = iron_block 2x2x1 with iron_trapdoor lid (open=false).
- garden_bed(g, box) : kerb smooth_sandstone, moss_block fill, persistent oak_leaves hedge, azalea/flowering_azalea on moss, lanterns on kerb every 6.
- roof_lights(g, deck, every) / floodlight(g, deckY, wallFoot) : sea_lantern in deck; floodlights along the foot of higher wall.
- sidewalk(g, box) : smooth_stone with polished_andesite kerb outer row. lamp_stub(g, x, z) : polished_granite stub 2 high + lantern.

## ROOMS (exterior only: lit lobbies seen through glass; nothing walkable beyond)
See rooms in the JSON answer. Floors smooth_stone / polished_granite; each lit by shroomlight ceiling.

## PARTS
1. P1 Plot 0 tower shell (parts/tower.mjs): masses P0-A..H, piers, strips, friezes, string course, decks, crown. Elements 1-4.
2. P2 Plot 1 Music Hall shell (parts/hall.mjs): H-A..H-G, hall deck, skylights, vents, stage house, piers. Element 11.
3. P3 Plot 2 east end (parts/east.mjs): E-A..I, piers, decks, gardens, penthouse. Elements 13, 16, 20.
4. P4 Marquees (parts/marquee.mjs): all runs, corner, ends, words. Elements 5-6.
5. P5 Blade, roundels, glazing, doors (parts/facade.mjs): elements 7-10, 12, 14, 15.
6. P6 Lights and grounds (parts/lights.mjs): lit windows, roof lights, floodlights, sidewalks, lamps. Elements 17-19.

Checklist: [ ] P1 [ ] P2 [ ] P3 [ ] P4 [ ] P5 [ ] P6

## NOTES
- Build in site orientation; plot offsets: plot 1 x38.., plot 2 x105.. in this frame.
- Build shells in order; later parts only fill RESERVED volumes and OPENINGS. Never write outside a plot or above its cap (124 / 45 / 78).
- Letters: always bannerWord, never by hand. Banner row: x0 (west run), z53 (south runs).
- Light every deck and sidewalk (sea_lantern/lantern) so nothing spawns; lit lobbies behind glass.
- Camera is aerial: roofs, setbacks and the marquee tops (end_rods) matter most.
```

### elements.md

```markdown
# Required elements: Radio City block

Frame: plot 0 x0..33, plot 1 x38..100, plot 2 x105..155, all z0..54, y0 = ground. South (50th St) = high z, west (Sixth Ave) = low x. Vocabulary names refer to plan.md VOCABULARY. Parts: P1 tower shell, P2 hall shell, P3 east shell, P4 marquees, P5 blade+roundels+glazing, P6 lights+grounds.

| # | Element | Real construction (block by block) | Coordinates | Part | Vocab |
|---|---|---|---|---|---|
| 1 | Plot 0 tower, 31 storeys, setbacks | smooth_sandstone masses per plan P0-A..H, polished_granite plinth y0, flat deck + parapet | plan P0 table; slab x2..29 z10..45 y0..104 | P1 | limestone_mass, setback_deck |
| 2 | Vertical piers + dark window strips | 1-wide smooth_sandstone pier every 3; between: strip recessed 1 = gray_stained_glass (2 rows) + polished_deepslate spandrel (1 row) | all office faces; rhythm (y-11)%3 plot0, (y-8)%3 plot2 | P1,P3 | pier_wall |
| 3 | Frieze, string course, cornice | cut_sandstone row under parapet; y28 west string course = smooth_sandstone_stairs half=top, 1 proud at x1 | under every parapet; x1..2 z10..45 y28 | P1,P3 | frieze_band |
| 4 | Crown + lantern box + mast | crown x6..23 z14..39 y104..111; lantern box 4x4 sea_lantern core behind light_gray_stained_glass; lightning_rod x14 z26 y115..118 | x13..16 z25..28 y112..114 | P1 | crown_lantern |
| 5 | MARQUEE (west, south, plot 1) | section y6..10: soffit glowstone/sea_lantern alternating; red_stained_glass over shroomlight y6 front row; light_gray_concrete letter band y7..8 with banners hung at y8; blue_stained_glass over sea_lantern y9; smooth_quartz_slab top y10 with end_rod every 2 and sea_lantern every 4; iron_block cheeks; rounded corner (x1 z52 air) | plan RESERVED marquee volumes | P4 | marquee_run, marquee_corner, marquee_end |
| 6 | "RADIO CITY" red on white / "MUSIC HALL" white on blue letters | banner letters (white_banner+red letter; blue_banner+white letter) via bannerWord, wall banners on x0 / z53 at y8 | plan Word placements table | P4 | marquee_word |
| 7 | Vertical blade sign RADIO CITY | x0..4 z51..52 y11..32; sea_lantern ring; blue_concrete x1,x3 with light_gray_concrete x2; stacked red-on-white banner letters R31 A29 D27 I25 O23 C19 I17 T15 Y13 at x2 z53; iron_block stepped cap y33 x1..3, y34 x2, end_rod on top | x0..4 z51..53 y11..34 | P5 | blade_sign |
| 8 | Grand entrance doors | glass_pane doors + waxed_cut_copper mullions recessed to z50; transom y5; lit shroomlight ceiling | x3..9 z50 y1..5 (corner), x3 z42..51 west | P5 | glazed_front |
| 9 | Round enamel plaques / roundels (Dance, Drama, Song) | disc of terracotta ring-rastered, waxed_cut_copper rim 1 proud; figures in orange/yellow/white terracotta | plot0 (14,16),(23,16) z49; plot1 (52,17),(70,17),(88,17) z51 | P5 | roundel |
| 10 | Tall narrow bronze-framed windows | 1-wide glass with waxed_cut_copper frame and sill stair | per plan OPENINGS | P5 | tall_window |
| 11 | Music Hall auditorium block, broad deck | smooth_sandstone walls, gray_concrete deck with light_gray walk strips, 3 skylight strips, 6 vent boxes, stage house y33 vent row | plan P1 / ROOFS | P2 | hall_deck, skylight_strip, vent_box |
| 12 | Plot 1 stage door + canopy | recessed 1, waxed_cut_copper frame, canopy slab with sea_lantern underside, bracket at x94 | x89..94 z48..52 y2..7 | P5 | stage_door |
| 13 | East end office block, setbacks, tower, crown | plan P2 table, pier_wall, deck/parapets | plot 2 | P3 | as 1-3 |
| 14 | Shopfronts and lit lobbies (Sixth, 50th, 51st, Rockefeller Plaza) | bronze-framed glass recessed 1, shroomlight ceiling, fascia cut_sandstone | plan OPENINGS | P5 | shopfront_bay |
| 15 | Plaza lobby, 3 storeys, polished_granite surround | glass in waxed_cut_copper mullions, shroomlight | x150 z18..35 y2..11 | P5 | glazed_front |
| 16 | Roof gardens | moss_block beds in smooth_sandstone kerbs, oak_leaves persistent hedge, azalea | plot 2 decks y18, y44 | P3 | garden_bed |
| 17 | Roof lighting (no spawns) | sea_lantern grid on every deck; floodlights at foot of each setback wall | all decks | P6 | roof_lights, floodlight |
| 18 | Lit office windows (about 25%) | clusters 2..6: glass + shroomlight behind | all tower faces | P6 | lit_window_cluster |
| 19 | Sidewalk, kerb, lamps, service court, alley, light well | smooth_stone, polished_andesite kerb outer row, polished_granite stub + lantern | plan SITE | P6 | sidewalk, lamp_stub |
| 20 | Roof vents, penthouse (plot 2 E-I) | iron_block + iron_trapdoor | x131..142 z22..33 y63..64 | P3 | vent_box |
```

### rooms.json

```json
{"entrance":[6,1,51],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "limestone": ["smooth_sandstone", "smooth_sandstone_stairs", "smooth_sandstone_slab"],
    "frieze": ["cut_sandstone", "cut_sandstone_slab"],
    "plinth": ["polished_granite", "polished_granite_stairs", "polished_granite_slab"],
    "spandrel": ["polished_deepslate", "polished_deepslate_slab"],
    "glass": ["gray_stained_glass", "glass", "glass_pane", "light_gray_stained_glass"],
    "bronze": ["waxed_cut_copper", "waxed_cut_copper_stairs", "waxed_cut_copper_slab"],
    "marquee": ["light_gray_concrete", "iron_block", "blue_stained_glass", "red_stained_glass", "blue_concrete", "smooth_quartz_slab"],
    "light": ["sea_lantern", "shroomlight", "glowstone", "end_rod"],
    "banner": ["white_banner", "blue_banner", "white_wall_banner", "blue_wall_banner"],
    "roundel": ["light_blue_terracotta", "orange_terracotta", "yellow_terracotta", "white_terracotta", "purple_terracotta", "lime_terracotta"],
    "roof": ["light_gray_concrete", "gray_concrete", "iron_block", "iron_trapdoor", "lightning_rod", "iron_bars"],
    "garden": ["moss_block", "oak_leaves", "azalea", "flowering_azalea"],
    "ground": ["smooth_stone", "polished_andesite", "polished_andesite_slab", "lantern"]
  },
  "objects": ["end_rod", "lightning_rod", "iron_trapdoor", "lantern", "white_banner", "blue_banner", "white_wall_banner", "blue_wall_banner"]
}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, and it replaces build.nbt only once the build has finished.
set -e
cd "$(dirname "$0")"
tmp=build.nbt.tmp
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// Radio City build: the site ground, then the six parts in plan.md order, saved to the path given as the first argument.
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE, Z_SOUTH, PLOT1, PLOT1_RAISED_FROM, PLOT2_RAISED_FROM, SIDEWALK } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// Part order and module files, as plan.md. A part whose file is not there yet is skipped, not an error.
const PARTS = [
  ["Plot 0 tower shell", "parts/tower.mjs"],
  ["Music Hall shell", "parts/hall.mjs"],
  ["East end shell", "parts/east.mjs"],
  ["Marquees", "parts/marquee.mjs"],
  ["Blade, roundels, glazing", "parts/facade.mjs"],
  ["Lights and grounds", "parts/lights.mjs"],
];

// The ground: sidewalk course on y0 across the whole site; where plot 1 and plot 2 stand on ground 1, y1 too.
function layGround(g) {
  const [sx] = SITE_SIZE;
  for (let x = 0; x < sx; x++) for (let z = 0; z <= Z_SOUTH; z++) {
    g.set(x, 0, z, SIDEWALK);
    const raised = (x >= PLOT1_RAISED_FROM && x <= PLOT1.x1) || x >= PLOT2_RAISED_FROM;
    if (raised) g.set(x, 1, z, SIDEWALK);
  }
}

const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });   // the server is 1.21.1
layGround(g);

const list = [];
for (const [name, file] of PARTS) {
  if (!existsSync(file)) { console.log(`part ${name}: ${file} not there yet, skipped`); continue; }
  const { build } = await import(`./${file}`);
  list.push([name, build]);
}

// The roof is laid right after the first part, and the roof tool needs walls to find its eave: while that part is a stub
// (it places nothing) the roof waits. Probed on a scratch grid so the real one is untouched.
const probe = new Grid(SITE_SIZE);
if (list.length) list[0][1](probe);
const roof = probe.cells.size ? "roof.json" : undefined;
if (!roof) console.log("roof: waits, the first part places no blocks yet");

runParts(g, list, { palette: "palette.json", roof });
g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for every part: palette ids (the ones in palette.json only), plan.md's site coordinates, and rng.
// Ids are bare names; stairs and slabs need their own state, which the part sets.

// ---- palette: limestone, trim, glass ----

// ---- palette: limestone, trim, glass ----
export const LIMESTONE = "smooth_sandstone";                // limestone body, piers, walls

export const LIMESTONE_STAIRS = "smooth_sandstone_stairs";  // cornice; string course (upside down, 1 proud)

export const LIMESTONE_SLAB = "smooth_sandstone_slab";      // parapet coping where the plan says

export const FRIEZE = "cut_sandstone";                      // frieze band under each parapet, fascias, sills

export const FRIEZE_SLAB = "cut_sandstone_slab";            // half-height frieze course

export const PLINTH = "polished_granite";                   // base plinth, entrance surrounds

export const PLINTH_STAIRS = "polished_granite_stairs";     // plinth steps

export const PLINTH_SLAB = "polished_granite_slab";         // steps and kerbs at the entrances

export const SPANDREL = "polished_deepslate";               // dark spandrel rows in the window strips

export const SPANDREL_SLAB = "polished_deepslate_slab";     // half-height spandrel

export const GLASS_OFFICE = "gray_stained_glass";           // office window strips (dark)

export const GLASS = "glass";                               // lit shopfront and lobby glass, door panes

export const GLASS_PANE = "glass_pane";                     // tall narrow windows, shopfront panes

export const GLASS_SKYLIGHT = "light_gray_stained_glass";   // skylights, the crown lantern skin

// ---- palette: bronze, marquee, light ----
export const BRONZE = "waxed_cut_copper";                   // frames, mullions, roundel rims, sills

export const BRONZE_STAIRS = "waxed_cut_copper_stairs";     // tall-window sills

export const BRONZE_SLAB = "waxed_cut_copper_slab";         // thin bronze trim

export const SILVER = "light_gray_concrete";                // marquee letter band (silver face), tower decks

export const IRON = "iron_block";                           // marquee end cheeks, blade cap, vent boxes

export const NEON_BLUE = "blue_stained_glass";              // blue neon line over sea_lantern

export const NEON_RED = "red_stained_glass";                // red neon line over shroomlight

export const BLUE_CONCRETE = "blue_concrete";               // blade faces

export const QUARTZ_SLAB = "smooth_quartz_slab";            // marquee top layer

export const SEA_LANTERN = "sea_lantern";                   // roof lights, floodlights, marquee backing

export const SHROOMLIGHT = "shroomlight";                   // lit-window backing, red neon backing, ceilings

export const GLOWSTONE = "glowstone";                       // soffit bulbs, skylight backing

export const END_ROD = "end_rod";                           // marquee bulbs (facing up), crown and blade caps

// ---- palette: banners, roundels, roofs, garden, ground ----
export const WHITE_BANNER = "white_banner";                 // standing white banner (RADIO CITY letters)

export const BLUE_BANNER = "blue_banner";                   // standing blue banner (MUSIC HALL letters)

export const WHITE_WALL_BANNER = "white_wall_banner";       // wall banner on the banner row

export const BLUE_WALL_BANNER = "blue_wall_banner";         // wall banner on the banner row

export const TERRA_LIGHT_BLUE = "light_blue_terracotta";    // roundel discs, dominant blue

export const TERRA_ORANGE = "orange_terracotta";            // roundel figures and dominant orange

export const TERRA_YELLOW = "yellow_terracotta";            // roundel figures

export const TERRA_WHITE = "white_terracotta";              // roundel figures

export const TERRA_PURPLE = "purple_terracotta";            // roundel dominant purple

export const TERRA_LIME = "lime_terracotta";                // roundel figures

export const DECK_LIGHT = "light_gray_concrete";            // tower and setback roof decks

export const DECK_DARK = "gray_concrete";                   // hall and podium roof decks

export const TRAPDOOR = "iron_trapdoor";                    // vent lids, fly-loft vent row

export const LIGHTNING_ROD = "lightning_rod";               // crown mast

export const RAIL = "iron_bars";                            // parapet rails (none in this build; for the roof tool)

export const MOSS = "moss_block";                           // roof garden beds

export const HEDGE = "oak_leaves";                          // roof garden hedges (persistent=true)

export const AZALEA = "azalea";                             // roof garden planting

export const AZALEA_FLOWERING = "flowering_azalea";         // roof garden planting

export const SIDEWALK = "smooth_stone";                     // ground and sidewalk course

export const KERB = "polished_andesite";                    // kerb on the outer sidewalk row

export const KERB_SLAB = "polished_andesite_slab";          // half-height kerb

export const LANTERN = "lantern";                           // lamp on a polished_granite stub; garden kerb lanterns

// ---- site coordinates (plan.md; x, y, z in the shared module frame) ----
export const SITE_SIZE = [156, 125, 55];                    // grid size: x 0..155, y 0..124, z 0..54

export const Z_NORTH = 0;                                   // 51st St edge

export const Z_SOUTH = 54;                                  // 50th St edge (the hero face)

export const PLOT0 = { x0: 0, x1: 33, cap: 124 };           // 1270 Avenue of the Americas and the Radio City corner

export const PLOT1 = { x0: 38, x1: 100, cap: 45 };          // Radio City Music Hall auditorium

export const PLOT2 = { x0: 105, x1: 155, cap: 78 };         // east end toward Rockefeller Plaza

export const PLOT1_RAISED_FROM = 59;                        // plot 1 ground is 1 from this x east (plan says ~58)

export const PLOT2_RAISED_FROM = 127;                       // plot 2 ground is 1 from this x east

export const MARQUEE_Y = [6, 10];                           // marquee volume y range, inclusive

export const SIDEWALK_Y = 0;                                // sidewalk course on plot 0 and the open ground

// ---- seeded random ----
/** rng(seed) returns a function giving floats in [0, 1); the same seed repeats the same sequence (mulberry32). */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Radio City block, helper set H1 (plan.md VOCABULARY): limestone_mass, frieze_band, marquee_run, marquee_word,
// tall_window, stage_door, vent_box, floodlight.
// Every helper takes its position (and facing) as arguments and writes only into air inside its own footprint.
// A cell that is not air (an earlier part's cell) is refused and listed in `refused`; it is never overwritten.
// Each returns { placed, refused }.

/**
 * Solid limestone box to its top block. The bottom row is polished_granite when plinth (pass the box's bottom at
 * the plinth level: y0, or y1 where the ground is 1).
 */
export function limestone_mass(g, box, { plinth = true } = {})

/**
 * One row of cut_sandstone (the frieze under a parapet; the box is that row). With stringCourse = the direction the
 * lip points (the street), the row is a string course of smooth_sandstone_stairs half=top, back into the wall.
 */
export function frieze_band(g, box, { stringCourse } = {})

/**
 * One straight marquee run, 2 deep, from `from` to `to` along the run (z for axis "z", x for axis "x").
 * `at` is the front row's coordinate across the run (x for axis "z", z for axis "x"); `front` is the street side
 * (west/east for axis "z", south/north for axis "x"). Section per plan, from the top: y10 smooth_quartz_slab top
 * layer with sea_lantern every 4 behind and end_rod every 2 on the front edge (y11); y9 blue_stained_glass over
 * sea_lantern; y7..8 light_gray_concrete letter band; y6 red_stained_glass over shroomlight; the soffit under the
 * front row at y0-1 alternates glowstone and sea_lantern.
 */
export function marquee_run(g, { axis, from, to, at, front, y0 = 6 })

/**
 * RADIO CITY / MUSIC HALL letters on the banner row (wall banners hung on the letter band), reading along `face`.
 * center is the middle letter's cell; the colours default from the word. bannerWord writes a letter only into air.
 */
export function marquee_word(g, word, { center, face, letter, base } = {})

/**
 * A 1-wide glass_pane in a wall, framed by waxed_cut_copper on both sides, rows y0..y1; the bottom glass row is a
 * waxed_cut_copper_stairs sill (top half, back into the wall). pos = [x, z] of the glass column; face = the street
 * side (north/south for a wall running along x, east/west for one running along z).
 */
export function tall_window(g, { pos: [px, pz], face, y0, y1 })

/**
 * The stage door in a wall running along x at plane z (face south or north): glass_pane across x0..x1, rows y0..y1;
 * waxed_cut_copper jambs and head around it; an optional canopy { x0, x1, z0, z1, y }: sea_lantern on every other
 * x in row y (the underside), smooth_quartz_slab bottom at y+1 across the canopy.
 */
export function stage_door(g, { x0, x1, z, y0, y1, face = "south", canopy })

/** A 2x2 vent: iron_block at y with a closed iron_trapdoor lid on each of its four cells at y+1. */
export function vent_box(g, { x, y, z })

/**
 * Sea lanterns standing on a deck (deckY is the deck's top block) along the foot of a higher wall: the row at
 * coordinate `at` (z for axis "x", x for axis "z") from `from` to `to`, every `every` cells.
 */
export function floodlight(g, { deckY, axis, at, from, to, every = 4 })
```

### vocab/h2.mjs

```js
// H2 vocabulary (plan.md VOCABULARY): setback_deck, lit_window_cluster, marquee_corner, blade_sign, glazed_front,
// garden_bed, sidewalk. Every helper takes its footprint (and facing, where it has one) as arguments, writes only
// inside that footprint, and only into air unless it is given { replace: true }.
// Block ids are the plan.md PALETTE as literals; nothing is imported from the other vocab/ files.

// A roof deck at y over the footprint [x0, z0, x1, z1]: ground material in the deck, sea_lantern flush in it every
// lightEvery cells (on the foot of the parapet too), and a smooth_sandstone parapet one block above the deck on the
// outer ring. Writes only at y and y + 1.
export function setback_deck(g, [x0, z0, x1, z1], { y, ground = "light_gray_concrete", lightEvery = 6, replace = false } = {})

// n (2..6) adjacent strip glass cells lit from behind: shroomlight in the cell directly inside each one. face is the way
// the wall looks out (north, south, east, west); plane is the glass cell's z (north/south faces) or x (east/west faces).
// The cluster is the first run of n strip glass cells on that row, or the run starting at `at` (its coordinate along
// the face). clear: also turn those glass cells to clear glass (the lit look); that is the one non-air write.
// Returns the number of blocks placed.
export function lit_window_cluster(g, face, plane, y, n, { at, clear = false, replace = false } = {})

// The rounded south-west corner of plot 0's marquee. [x, z] is the air cell left out for the round (plan: x1 z52); the
// runs leave it toward -z (west run, front column x) and +x (south run, front row z). The corner body is the other three
// cells of the 2x2. Bands per plan: y6 front red neon over shroomlight, y7..8 silver, y9 blue neon over sea_lantern,
// y10 quartz slab top with sea_lantern behind, end_rod bulbs at y11 on the front; soffit lights at y5 under the body.
export function marquee_corner(g, [x, z], { y = 6, replace = false } = {})

// The vertical blade sign over the box [x0, y0, z0, x1, y1, z1] (plan: 0,11,51,4,34,52). The body runs y0..y1-2; the
// stepped cap is iron_block (y1-1 across the inner columns, y1 at the centre) with end_rod on top. Sea_lantern ring on
// both faces; the south face (z1) is blue_concrete with a silver centre column; the north face (z0) is all blue_concrete.
// Letters are red on white wall banners on the row z1 + 1, one per two rows from y1-3 down, a blank row for each space.
// replace: the blade replaces the mass wall cells it stands on (the plan says it does; pass it from the facade part).
export function blade_sign(g, [x0, y0, z0, x1, y1, z1], { word = "RADIO CITY", replace = false } = {})

// A glazed front on the box [x0, y0, z0, x1, y1, z1], which is one block deep on the facing axis, glass at its outer face.
// facing is the way the glass looks out (required). Glass panes, waxed_cut_copper mullions every mullionEvery cells,
// and a shroomlight ceiling course on the inside of the top row. No door block: the doors are panes.
export function glazed_front(g, [x0, y0, z0, x1, y1, z1], { facing, mullionEvery = 3, replace = false } = {})

// A roof garden bed on the footprint [x0, z0, x1, z1] at y (the planting layer, one above the deck): smooth_sandstone
// kerb on the outer ring, moss_block soil inside, a persistent oak_leaves hedge down the middle along the long side,
// azalea and flowering_azalea in the rest, and a lantern on the kerb every 6 cells round the rim.
export function garden_bed(g, [x0, z0, x1, z1], { y, replace = false } = {})

// A sidewalk course at y over the footprint [x0, z0, x1, z1]: smooth_stone, with a polished_andesite kerb on the outer row.
export function sidewalk(g, [x0, z0, x1, z1], { y, replace = false } = {})
```

### vocab/h3.mjs

```js
// Exterior helpers for the Radio City block (plan.md VOCABULARY): pier_wall, crown_lantern, marquee_end, roundel,
// shopfront_bay, skylight_strip, roof_lights, lamp_stub.
//
// Every helper takes its position as arguments and writes only its own footprint, and only into air. A cell that
// holds something else is skipped (and counted) unless the caller lists that block in `over`, the option for
// facade work that sits in a solid body. Ground and floor are never replaced unless listed in `over`.
// Each helper returns { placed, skipped, box }: `box` is the footprint [x0, y0, z0, x1, y1, z1] it may write.

/**
 * Piers in the face plane with recessed window strips between them. o: { face, at, from, to, y0, y1, phase = 0,
 * pierEvery = 3, corners = "double", over = [] }. `at` is the face plane, `from`..`to` the run along it. Piers
 * every `pierEvery` from `from`, double at both ends. Between piers the face plane is carved to air and the strip
 * sits one behind it: glass where (y - phase) % 3 is 0 or 1, polished_deepslate spandrel where it is 2.
 */
export function pier_wall(g, { face, at, from, to, y0, y1, phase = 0, pierEvery = 3, corners = "double", over = [] })

/**
 * Crown lantern: a 4 x 3 x 4 box whose min corner is (x, y, z). Skin light_gray_stained_glass, core sea_lantern
 * (the middle layer, inside the skin), and a lightning_rod mast on top at (x + 1, z + 1) from y + 3 to y + 6.
 * Plan spot: x 13, y 112, z 25.
 */
export function crown_lantern(g, { x, y, z, over = [] })

/**
 * Marquee end cheek: iron_block, a column of `height` cells (plan: 5, y6..10) from cell = [x, y, z] upward.
 */
export function marquee_end(g, [x, y, z], { height = 5, over = [] } = {})

/**
 * Round enamel roundel: a disc of `dominant` terracotta of radius r (3 gives 7 wide, 4 gives 9) in the face plane
 * through center = [x, y, z]. A ring and a cross of two other terracottas sit inside it. With rim, a
 * waxed_cut_copper rim runs round the disc edge, 1 proud on the outward side. face: the wall it sits on.
 */
export function roundel(g, { center: [cx, cy, cz], face, r = 3, dominant = "light_blue", rim = true, over = [] })

/**
 * Shopfront bay, `w` cells along the run from `from`, on the glazing plane `at` (the shell carves it to air). A
 * waxed_cut_copper mullion on the first cell, glass on the rest, rows y0..y1. A shroomlight lobby ceiling sits on
 * row y1 just behind the glass, and a cut_sandstone fascia runs along row `fascia` on the glazing plane.
 */
export function shopfront_bay(g, { face, at, from, w = 3, y0 = 1, y1 = 5, fascia = 6, over = [] })

/**
 * Skylight strip in a deck: light_gray_stained_glass in the deck's top row y, glowstone under it at y - 1 (glow:
 * false to skip). Runs from x0 to x1, `depth` cells deep from z0. Plan: x 50..74, z 22 / 30 / 38, depth 2, y 31.
 */
export function skylight_strip(g, { x0, x1, z0, depth = 2, y, glow = true, over = [] })

/**
 * Sea lanterns in a deck's top row. deck = { x0, x1, z0, z1, y }; one lantern every `every` cells on both axes,
 * counted from x0 and z0. The footprint is the whole deck top, and only lantern cells are written into air.
 */
export function roof_lights(g, { x0, x1, z0, z1, y }, every, { over = [] } = {})

/**
 * Ground lamp: a 2-high polished_granite stub standing on walking level y (default 1), with a standing lantern on
 * top. One column only, so the rest of the walk stays clear. Writes only into air, so the ground course stays.
 */
export function lamp_stub(g, x, z, { y = 1, over = [] } = {})
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

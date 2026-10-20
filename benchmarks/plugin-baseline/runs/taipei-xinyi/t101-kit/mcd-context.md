# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# Taipei 101 — architect's plan (three tiling modules)

All coordinates are PLOT-LOCAL (x, z from the plot's own corner; y 0 = the plot's floor). Plot 1 world x = local + 197, plot 2 world x = local + 277. North = low z, south = high z, east = high x. Exterior only (no rooms); hollow behind the glass.

Common vocabulary used below:
- **inset k**: a square ring k cells in from the module's 76 x 76 tower box (ring cells at x = k and x = 75-k, z = k and z = 75-k, in box-local numbers).
- **double-sawtooth notch** (segments and pedestal): at each corner, with a = cells along one face from the band's outer corner and b = along the other, the band's plan leaves out the cells with (a<2 and b<4) or (a<4 and b<2). The wall ring follows that outline, giving three salient noses per corner: (4,0), (2,2), (0,4). The middle nose (2,2) is the corner light strip.
- **grid**: mullions run up at box-local x (or z) ≡ 1 mod 4 on every face, at the same absolute positions in every band, so the vertical lines stay straight while the wall flares. A dark floor band at every floor line. Glass is 1 thick; the inside stays hollow.
- **lit window**: a glass cell with a light block placed in the cell directly inside it.
- The floor lines line up across all three modules: pedestal floor lines at world y ≡ 2 (mod 6) (y 2, 8, … 152); segment 1's foot is pedestal y 158 (158 ≡ 2 mod 6), and segment floor lines fall every 6.

## SITE

### Plot 0: pedestal and podium mall (x 0..192, z 0..205, height cap y 161)
Ground (top block): 2 over most of the lot; 4 at x 0..14, 3 at x 15..19 (west street), 1 at x 165..192 (east) and on the north forecourt x 65..99 z 0..9. Footings go down to the ground. Nothing is built on `.` cells.

| mass | x | y | z | notes |
|---|---|---|---|---|
| TOWER PEDESTAL (truncated pyramid, box-local = x-96, z-108) | 96..171 | 1..157 | 108..183 | 76 sq at ground, steps IN 1 per side every 24 courses (table below); roof y 157 = 62 sq x 103..164, z 115..176, solid |
| Pedestal band inset 0 | 96..171 | 1..25 | 108..183 | plinth course y 1, ground-floor course y 2 |
| inset 1 | 97..170 | 26..49 | 109..182 | step course at y 26 |
| inset 2 | 98..169 | 50..73 | 110..181 | step course at y 50 |
| inset 3 | 99..168 | 74..97 | 111..180 | step course at y 74 |
| inset 4 | 100..167 | 98..121 | 112..179 | step course at y 98 |
| inset 5 | 101..166 | 122..145 | 113..178 | step course at y 122 |
| inset 6 | 102..165 | 146..156 | 114..177 | step course at y 146; lit band y 155..156 |
| roof (inset 7) | 103..164 | 157 | 115..176 | solid flat roof, the first segment's foot stands exactly on it |
| Coin medallion SOUTH | 123..144 | 130..151 | 179..180 | disc 22 across, 2 proud of the inset-5 wall (z 178); back fill at z 178 for y 146..151 where the wall steps back |
| Coin medallion NORTH | 123..144 | 130..151 | 111..112 | back fill z 114, y 146..151 |
| Coin medallion EAST | 167..168 | 130..151 | 135..156 | back fill x 165, y 146..151 |
| Coin medallion WEST | 99..100 | 130..151 | 135..156 | back fill x 102, y 146..151 |
| Medallion uplight ledges | the disc's cells in front of the wall, 18 long (x or z centred: 125..142 / 137..154) | 129 | as the disc | a row of shroomlight under each disc |
| North tower hall (glazed, 2-storey-plus) | 120..147 on the z 108 face (follows the taper) | 3..40 | wall plane | all clear glass, fine mullions every 2 |
| East tower hall | z 120..147 on the x 171 face | 3..40 | wall plane | as north |
| MALL BASE (3 storeys, roof deck y 35) | every `#` cell with z ≤ 101, plus every `#` cell with x ≤ 95 | 2..36 | 0..189 | not on the north forecourt bump (x 65..99, z 0..9), which is open paving. Its north face is z 10 |
| MALL MIDDLE terrace (4 storeys, deck y 46) | 10..129 | 2..47 | 15..94 | L-shape, part 1 |
| | 10..84 | 2..47 | 95..164 | L-shape, part 2 |
| MALL NORTH-WEST block (6 storeys, deck y 68) | 10..74 | 2..70 | 20..84 | the highest step |
| North forecourt + entrance canopy (Xinyi Road) | 65..99 | 1 (paving), canopy deck 12 | 0..9 | canopy x 65..99 z 0..9 at y 12, glass on a quartz frame, columns at x 66, 74, 82, 90, 98 on z 1, y 2..11 |
| North drive / drop-off lane (open, paved) | 96..174 | 2 | 102..107 | between the mall and the pedestal's north face, open to the east plaza |
| EAST PLAZA (open) | 172..192 on `#` cells | 1 | 102..199 | paving, planters, lamp posts every 9 |
| East entrance canopy | 172..186 | 12 | 124..147 | glass deck on 4 quartz columns at x 185, z 125/134/138/146 |
| SOUTH PLAZA strip (open) | 90..179 on `#` cells | 2 | 184..189 | paving and planters |
| South porte-cochère canopy | 125..139 | 12 | 184..204 | glass deck on columns at x 125/139, z 192, 203 |
| West street raised floor | 0..19 | ground floor course y 4 | all mall `#` z | the street is higher here; the mall's ground floor is at y 4 in this strip |

Every other `#` cell with x ≥ 96 and z ≥ 102 outside the pedestal box is plaza (open paving at the ground).

### Plot 1: one segment (box x 0..75, z 0..75, y 0..46; stacked eight times, pitch 47)
| part | x / z | y | notes |
|---|---|---|---|
| FOOT floor (solid course) | 7..68 square, notched | 0 | stands on the pedestal roof / previous ledge |
| band inset 7 (62 sq) | 7..68 | 0..5 | y 0 is the floor course |
| band inset 6 (64 sq) | 6..69 | 6..11 | step course y 6 |
| band inset 5 (66 sq) | 5..70 | 12..17 | step course y 12 |
| band inset 4 (68 sq) | 4..71 | 18..23 | step course y 18 |
| band inset 3 (70 sq) | 3..72 | 24..29 | step course y 24 |
| band inset 2 (72 sq) | 2..73 | 30..35 | step course y 30 |
| band inset 1 (74 sq) | 1..74 | 36..41 | step course y 36 |
| band inset 0 (76 sq) | 0..75 | 42..45 | step course y 42; lit band y 44; fascia y 45 |
| TOP LEDGE (solid) | 0..75, notched | 46 | the next segment's foot sits in its middle (x/z 7..68); the outer ring (inset 0..6) is the pagoda overhang |
| step course (each band) | 2 wide: the new ring + the ring below it | y 6, 12 … 42 | closes the soffit of each outward step; it is also the floor line |
| corner light strips | the (2,2) nose of each corner, every band | 1..45 | continuous white-gold column up each flared corner (steps out 1 with each band) |
| RUYI ornaments | S: x 34..41 on the face; N: same x; E/W: z 34..41 | 0..8 | 1 cell proud of the LOCAL wall: S at z 69 for y 0..5, z 70 for y 6..8; N at z 6 / z 5; E at x 69 / x 70; W at x 6 / x 5 |

Ruyi shape (8 wide, rows top to bottom, X = block):
```
y8 ..XXXX..
y7 .XXXXXX.
y6 XXX..XXX   (the two gaps are dark: gray_concrete set in)
y5 XXXXXXXX
y4 .XXXXXX.
y3 ..XXXX..
y2 ...XX...
y1 ...XX...
y0 ..XXXX..
```

### Plot 2: crown, pinnacle and spire (box x 0..75, z 0..75, y 0..175)
| part | x / z | y | notes |
|---|---|---|---|
| Crown foot floor | 7..68 (62 sq) | 0 | on the 8th segment's ledge |
| OBSERVATORY (floors 88–91) | 12..63 (52 sq), single 2 x 2 corner notch (a<2 and b<2 left out) | 1..11 | base course y 1, glass y 2..9, lit band y 10, fascia y 11 |
| Observatory deck (outdoor) | 12..63 solid | 12 | rail on its perimeter at y 13 |
| PINNACLE tier P1 | 25..50 (26 sq) y 13..19; 24..51 (28) y 20..27; 23..52 (30) y 28..34 | 13..35 | ledge y 35 = 30 sq solid |
| tier P2 | 26..49 (24) y 36..42; 25..50 (26) y 43..49; 24..51 (28) y 50..56 | 36..57 | ledge y 57 = 28 sq |
| tier P3 | 27..48 (22) y 58..64; 26..49 (24) y 65..71; 25..50 (26) y 72..79 | 58..80 | ledge y 80 = 26 sq |
| pinnacle corner notches | each band leaves out its 1 corner cell | 13..79 | strips on the two noses beside it |
| CAP (stepped) | 28..47 (20 sq) y 81..84; 30..45 (16) y 85..88; 32..43 (12) y 89..92 | 81..92 | solid |
| SPIRE lower | 37..38 (2 x 2) | 93..122 | |
| SPIRE upper | x 37, z 37 (1 x 1) | 123..175 | lightning rod at y 175 |
| aircraft lights | collars, see FACADES | 100, 115, 140, 160, 171 | |

## ROOFS
| roof | form | how |
|---|---|---|
| Mall base deck y 35, middle deck y 46, NW deck y 68 | flat terraces stepping down to the street | `$MCD roof` preset `modern` (flat-parapet-modern) per terrace rect; parapet 1 course (y 36 / 47 / 69..70 for the NW block, 2 courses); smooth stone coping |
| Mall roof gardens | on each deck: patches of moss_block and grass_block (2 x 2 to 6 x 6, not continuous), oak trees (trunk 4, persistent leaves) every ~14, skylight strips of light_blue_stained_glass 3 wide down the middle of each terrace (base: z 50..52 x 20..160; middle: x 60..62 z 20..90; NW: x 40..44 z 30..74) | by hand |
| Canopies (north, east, south) | flat glass decks 1 thick at y 12, quartz edge beam all round | by hand |
| Pedestal roof y 157 | solid flat, entirely under segment 1 | by hand (part of the pedestal) |
| Pedestal step ledges | 1-wide sill at every step (y 26, 50, 74, 98, 122, 146), outer cell a BOTTOM slab | by hand; slabs keep mobs off |
| Segment top ledge y 46 | flat 76 sq notched slab, visible outer ring 7 wide | by hand; sea lanterns flush in the ledge on the inset-3 ring every 5 cells |
| Observatory deck y 12, pinnacle ledges y 35/57/80, cap steps | flat ledges | by hand; flush sea lanterns every 4 on each exposed ring |
No pitched roofs anywhere. All tower roofs are hand-built.

## FACADES

### Tower glass (pedestal, every segment, pinnacle): the same grid
| role | where | block |
|---|---|---|
| glass body | every wall cell not listed below | cyan_stained_glass |
| upper glass row | the course under each floor line (pedestal y ≡ 1 mod 6; segment y 5, 11, 17, 23, 29, 35, 41) | light_blue_stained_glass |
| mullions | x or z ≡ 1 mod 4 (box-local), all glass courses | light_gray_concrete |
| floor line / step course | pedestal y ≡ 2 mod 6 ring; segment y 0, 6, 12 … 42 (2 wide at steps) | dark_prismarine |
| corner noses (outer two) | (4,0) and (0,4) per corner | light_gray_concrete |
| corner light strip | (2,2) nose per corner | ochre_froglight |
| lit offices | about 12% of glass cells, in clumps 2–4 wide x 1–2 rows, more on the S and E faces than N and W; 2 warm to 1 cool | light behind glass: ochre_froglight (warm), pearlescent_froglight (cool) |

### Pedestal (plot 0)
- Plinth y 1: polished_andesite all round. Ground-floor course y 2.
- Grid as above all the way up; the taper steps sit on floor lines, each with a bottom-slab sill (dark_prismarine_slab).
- Halls (north and east, y 3..40): clear glass, mullions every 2 (light_gray_concrete), no floor bands, lit warm inside (ochre_froglight one cell behind every 3rd cell, and a grid on the hall floor).
- Coin medallions (all four faces): circle of radius 11 around the disc's centre (S/N centre x 133.5, y 140.5; E/W centre z 145.5). Outer rim 2 cells: gold_block. Field: raw_gold_block, with a ring of yellow_terracotta 3 cells in from the rim. Square hole 6 x 6 open (S/N x 131..136, y 138..143; E/W z 143..148) framed by a 1-cell gold_block border; the wall glass shows through it. 2 deep (both courses the same block). Shroomlight uplight row at y 129, in front of the wall.
- Top lit band y 155..156: light_blue_stained_glass with sea_lantern directly inside.

### Segment (plot 1), bottom to top
| level | y | treatment |
|---|---|---|
| foot floor | 0 | dark_prismarine perimeter ring, smooth_stone inside, sea_lantern flush every 8 x 8 inside (lights the hollow) |
| 8 floors of grid | 1..43 | grid as above, flaring 1 out per 6 courses; RUYI at the foot centre of each face |
| lit band | 44 | light_blue_stained_glass ring, sea_lantern ring directly inside |
| ledge fascia | 45 | smooth_quartz ring |
| top ledge | 46 | light_gray_concrete, sea_lantern flush on the inset-3 ring every 5 |
- RUYI: iron_block body, a smooth_quartz outline on the head rows (y 5..8 outermost cells), gray_concrete in the two eye cells; 1 deep.
- Nothing projects past the 76 x 76 box.

### Crown (plot 2)
| part | treatment |
|---|---|
| foot floor y 0 | light_gray_concrete; sea_lantern flush every 5 on the ring x/z 8..10 (the visible ledge) |
| observatory y 1..11 | base course dark_prismarine; glass light_blue_stained_glass on light_gray_concrete mullions every 4; brightly lit: sea_lantern directly inside every other glass cell of y 3 and y 7; lit band y 10 (glass + sea_lantern inside); fascia y 11 smooth_quartz |
| deck y 12 | smooth_stone, rail of iron_bars on the 52 sq perimeter at y 13 |
| pinnacle P1–P3 | same grid but light_blue_stained_glass body with cyan_stained_glass under each floor band; floor bands dark_prismarine every 6 (y 19, 27, 34 …); lit brightly: sea_lantern directly inside every other glass cell on 2 courses per band; corner strips ochre_froglight on the notch noses; each ledge smooth_quartz with a sea_lantern-behind-glass band in the course under it |
| cap | smooth_quartz y 81..84 with a lit band at y 83 (sea_lantern); iron_block y 85..88; light_gray_concrete y 89..92 |
| spire | y 93..122 iron_block 2 x 2; y 123..150 light_gray_concrete 1 x 1; y 151..170 iron_bars; y 171..174 end_rod; y 175 lightning_rod |
| aircraft lights | y 100 and 115: the 2 x 2 cells sea_lantern, ringed by red_stained_glass (12 cells); y 140 and 160: the mast cell sea_lantern with red_stained_glass on its 4 sides; y 171: red_stained_glass on the 4 sides of the end rod; cap corners y 92: red_stained_glass over a sea_lantern at each corner |

### Mall (plot 0)
- Rhythm: piers every 8 cells along every face (polished_diorite, flush), 6-wide glass bays between.
- Ground floor (y 3..12): shopfronts of clear glass y 3..10, lit warm inside (ochre_froglight or lanterns behind most bays), a fascia band y 11..12 of smooth_quartz. Plinth course y 2 polished_andesite.
- Upper storeys (11 tall: y 13–23, 24–34, 35–45, 46–56, 57–67): spandrel smooth_stone 3 courses at each floor (floor y to y+2), glass light_blue_stained_glass 8 courses; about one bay in four lit (cool pearlescent_froglight behind).
- Cornice at each deck: smooth_quartz course flush at the deck y, parapet above per ROOFS.
- Sign: on the base's north face (z 10), a dark sign band gray_concrete x 40..130, y 26..34; letters "TAIPEI 101 MALL", 5-row block font, sea_lantern, centred, by `plaque` (reads left to right from the street).
- Entrance canopy fascia (north, x 65..99, z 0 face, y 12..13): smooth_quartz with "101" banner letters optional.

## MATERIALS
| role | block id |
|---|---|
| tower glass body | cyan_stained_glass |
| tower glass upper row / pinnacle & observatory glass | light_blue_stained_glass |
| mullions, corner noses, ledge top | light_gray_concrete |
| floor line / step course / base course | dark_prismarine |
| pedestal step sills | dark_prismarine_slab (bottom) |
| corner light strips | ochre_froglight |
| lit offices | ochre_froglight (warm), pearlescent_froglight (cool) |
| lit bands, deck lights | sea_lantern |
| medallion uplights | shroomlight |
| fascias, coping, canopy frames, columns | smooth_quartz |
| ruyi | iron_block, smooth_quartz, gray_concrete eyes |
| coin medallions | gold_block, raw_gold_block, yellow_terracotta |
| spire | iron_block, light_gray_concrete, iron_bars, end_rod, lightning_rod |
| aircraft lights | red_stained_glass over sea_lantern |
| mall piers | polished_diorite |
| mall spandrels, roof decks, foot floor | smooth_stone |
| plinths, paving | polished_andesite (plinth); smooth_stone and polished_andesite checkered paving |
| mall shop glass / hall glass | glass |
| mall sign band | gray_concrete |
| roof gardens | moss_block, grass_block, oak_log, oak_leaves (persistent) |
| rails | iron_bars |
All checked with `$MCD blocks --check`: known. Do NOT use `chain` (the toolkit doesn't know it, so it is left out) or anything newer than 1.21.1.

## OPENINGS
Floor courses are the y given; openings are air (or doors / glass doors) above them.
| opening | face | x / z | y (air) | size |
|---|---|---|---|---|
| Mall main entrance (Xinyi Road) | north, z 10 | x 74..90 | 3..10 | 17 wide; slab ramp: bottom smooth_stone_slab at z 8 (y 2), landing full block at z 9 (y 2), x 72..92 |
| Mall west entrance | west, x 0 | z 60..69 | 5..12 (floor y 4) | 10 wide; level with the street (ground 4) |
| Mall south entrance | south, z 189 | x 22..31 | 3..10 | 10 wide; one bottom-slab step at z 190 where the ground is 2 → none needed (ground 2 = floor course) |
| Mall east doors (north block) | east, x 174 | z 30..37 | 3..10 | 8 wide, onto the east street |
| Pedestal north doors | north, z 108 | x 128..139 | 3..8 | 12 wide, in the north hall, off the drive |
| Pedestal east doors | east, x 171 | z 130..141 | 3..8 | 12 wide, under the east canopy; ramp: bottom slab at x 173 (y 2), landing x 172 (y 2) |
| Pedestal south doors | south, z 183 | x 128..139 | 3..8 | 12 wide, under the south canopy |
| Shopfront windows | all mall faces | every bay between piers | 3..10 | glazed, not open |
| Tower windows | everywhere | grid cells | — | glazed, not open |
| Medallion holes | 4 faces | see FACADES | 6 x 6 | open through the disc only (the wall stays glass) |

## RESERVED
| cells | for |
|---|---|
| Plot 1: the ruyi cells (S z 69 / 70, N z 6 / 5, E x 69 / 70, W x 6 / 5, across 34..41, y 0..8) | the ruyi part; the shell leaves them empty |
| Plot 1: the (2,2) nose column of each corner, every band, y 1..45 | corner light strips |
| Plot 0: the medallion boxes (incl. back fill cells) and the y 129 uplight rows | the medallion part |
| Plot 0: the 4 canopy column cells and deck rects (north, east, south) | the canopy part |
| Plot 0: the sign band rect on the north face (gray_concrete) | the sign writer |
| Plot 1 top ledge x/z 7..68 at y 46 top face | next segment's foot (keep clear of fittings); same for plot 0 roof y 157 and plot 2 foot |
| Plot 2: x/z 37..38, y 93..175 | spire only |

## FLOORS
Exterior-only build: no rooms. Floor levels for lit windows and slabs:
| mass | floor courses (y) | interior |
|---|---|---|
| Mall base | 2 (4 at x 0..19), 13, 24; deck 35 | hollow above slabs, 10 clear per storey |
| Mall middle | + 35; deck 46 | |
| Mall NW block | + 46, 57; deck 68 | |
| Pedestal | ground 2; a slab at every step course (26, 50, 74, 98, 122, 146) is fine; otherwise hollow | lobby y 3..40 behind the halls; sea_lantern grid every 8 in the y 2 floor |
| Segment | foot 0; floors every 6 (6 … 42) as glass-line bands only, no slabs needed | hollow, lit by the foot-floor lanterns |
| Crown | foot 0, deck 12, ledges 35, 57, 80 | hollow, observatory and pinnacle lit inside the glass |

---
# DESIGNER'S SECTIONS (below the architect's form; nothing above is changed)

## PALETTE
Architect's MATERIALS kept exactly (ids unchanged). Variants, all checked with `$MCD blocks --check` (known; `chain` is unknown to the toolkit, so not used):
| role | ids | variants / states |
|---|---|---|
| glass body | cyan_stained_glass, light_blue_stained_glass | blocks, not panes (towers) |
| mullion, nose, ledge top | light_gray_concrete | — |
| floor line, base course | dark_prismarine | dark_prismarine_slab (type bottom) sills |
| fascia, coping, columns, canopy frame | smooth_quartz | smooth_quartz_slab, smooth_quartz_stairs, quartz_pillar (axis y) for columns |
| lit things | ochre_froglight, pearlescent_froglight, sea_lantern, shroomlight | froglights are placed one cell inside the glass |
| ruyi / spire | iron_block, gray_concrete, light_gray_concrete, iron_bars, end_rod (facing up), lightning_rod (facing up) | — |
| aircraft | red_stained_glass over sea_lantern | — |
| coin | gold_block, raw_gold_block, yellow_terracotta | — |
| mall | polished_diorite piers, smooth_stone, smooth_stone_slab, polished_andesite, polished_andesite_slab, glass, light_blue_stained_glass, gray_concrete, glass_pane | panes with connection states from toolkit |
| gardens | moss_block, grass_block, oak_log (axis y), oak_leaves (persistent true), lantern (hanging false, on a block) | — |
| rails | iron_bars | — |
Additional: orange_terracotta (not used), `light` (not used: survival-safe, prefer lantern/sea_lantern). 1.21.1-safe throughout.

## VOCABULARY
All in box-local coordinates (bx = x - plot origin). `g` = grid. Every helper writes only inside its own box.
- **notchRing(x0,z0,x1,z1)**: returns the cell set of the band's plan ring (1 thick) for the square x0..x1,z0..z1 with the double-sawtooth corner notch (a<2&&b<4 or a<4&&b<2 left out, a,b measured from the band's corner along each face). Wall cells are the outer boundary of the notched plan (cells in plan with a 4-neighbour outside it). The crown observatory uses a single 2x2 notch; pinnacle bands omit 1 corner cell.
- **glassCell(g, x,y,z, ctx)**: picks the block for a wall cell: floor-line y -> dark_prismarine; box-local x or z ≡ 1 mod 4 on the face -> light_gray_concrete mullion; nose cells (4,0),(0,4) -> light_gray_concrete; (2,2) nose -> ochre_froglight; course under a floor line -> light_blue_stained_glass; else cyan_stained_glass (pinnacle/observatory swap: body light_blue, cyan under floor bands).
- **bandRing(g, {box, inset, y0, y1, ctx})**: for y0..y1 place notchRing(box shrunk by inset) through glassCell. Whole-tower shells call it per band.
- **stepCourse(g, {insetNew, y})**: at a flare/taper step course, fills the plan ring 2 wide (new ring + ring below) with dark_prismarine, closing the soffit; pedestal steps add the outer cell as dark_prismarine_slab (bottom).
- **ledgeSlab(g, {box, y, notch, top:"light_gray_concrete"|"smooth_quartz"|"smooth_stone", lanternRing, every})**: solid flat slab, notched, with sea_lantern flush on the named ring every `every` cells.
- **cornerStrip(g, {box, bands})**: ochre_froglight column on each corner's (2,2) nose through every band, stepping out with the band.
- **litBand(g, {y, ring})**: glass ring light_blue_stained_glass at y, sea_lantern ring 1 cell inside it.
- **litWindow(g, [x,y,z], inward, kind)**: kind warm = ochre_froglight, cool = pearlescent_froglight, placed in the cell `inward` of a glass cell (must be air).
- **litClump(g, face, seed, density)**: scatters clumps 2-4 wide x 1-2 rows of litWindow on glass, ~12% of cells, 2 warm : 1 cool, double density on S and E faces; never on mullion/floor-line cells; seeded (deterministic).
- **ruyi(g, face, center, z0)**: the 8-wide shape in plan.md, iron_block, smooth_quartz outline on y5..8 outer cells, gray_concrete eyes, set 1 proud of the local wall (z/x per RESERVED).
- **coin(g, face, center)**: radius-11 disc by distance: r>=9 gold_block, r 5..8.x raw_gold_block with yellow_terracotta ring at r 6..7.5, 6x6 hole open framed by gold_block, 2 deep; back fill at wall step.
- **uplightRow(g, face, from, to, y)**: shroomlight row at y129 in front of the wall.
- **hallGlazing(g, face, range, y0, y1)**: glass blocks with light_gray_concrete mullions every 2, door gap 12 wide, ochre_froglight behind every 3rd cell.
- **mallMass(g, box, deckY, roofSpec)**: shell walls on `#` cells, slabs at floor courses, deck, parapet 1-2 courses with smooth_quartz coping. **mallFacade(g, face, range)**: polished_diorite piers every 8, 6-wide bays of light_blue_stained_glass over smooth_stone spandrel 3 courses per floor; ground floor shopBay.
- **shopBay(g, bay)**: glass y3..10 with warm light (lantern standing on a slab or ochre_froglight) behind, smooth_quartz fascia y11..12.
- **canopy(g, rect, y, columns)**: glass deck at y, smooth_quartz edge beam, quartz_pillar columns from ground to y-1.
- **slabRamp(g, ...)**: bottom smooth_stone_slab then full-block landing as in OPENINGS.
- **mallSign(g)**: gray_concrete band, `plaque(g,"TAIPEI 101 MALL",{face:"north",material:null,letter:"sea_lantern"})`.
- **roofGarden(g, deckRect)**: moss/grass patches, oak tree (oak_log trunk 4 axis y, oak_leaves persistent), skylight strip of light_blue_stained_glass, a lantern per 6 on the parapet.
- **lampPost(g,x,y,z)**: cobblestone_wall x2 + lantern (standing). **planter(g,...)**: smooth_quartz box with oak_leaves.
- **capStep(g, tiers)**: solid stepped smooth_quartz/iron_block/light_gray_concrete per architect table.
- **spireSection(g, y0,y1, kind)**: iron_block 2x2 / light_gray_concrete / iron_bars / end_rod / lightning_rod.
- **aircraftLight(g, [x,y,z], kind)**: sea_lantern centre with red_stained_glass around (ring of 12 for 2x2, 4 sides for 1x1).
- **deckLights(g, rect, ring, every)**: flush sea_lantern in roofs/ledges so light >= 8 on walkable tops.
- **deckRail(g, box, y)**: iron_bars on the perimeter.

## ROOMS
Exterior-only build: no interior rooms; interiors are hollow glass shells lit by foot-floor lanterns and froglights. `rooms` is empty.
Way in: Mall main entrance on Xinyi Road, plot 0 x74..90, door cells y3..10 on z10, forecourt paving y1, bottom smooth_stone_slab ramp z8, landing z9; street cell [82,2,0], entrance cell [82,3,9]. Second way in: pedestal north hall [133,3,106] off the drive.

## PARTS
1. **Tower pedestal** (parts/pedestal.mjs, plot 0): bandRing x7 insets, stepCourse, solid roof y157, step slabs, hallGlazing on N/E, doors, lit band y155..156. Ticks 2,3,4,5,11.
2. **Segment** (parts/segment.mjs, plot 1): foot floor, 8 bands with flare, notches, stepCourse, ledge, litBand, cornerStrip, ruyi x4. Ticks 1,3-7,9.
3. **Crown and spire** (parts/crown.mjs, plot 2): foot, observatory, deck, pinnacle P1..P3, cap, spire, aircraft lights. Ticks 17-21.
4. **Podium mall** (parts/mall.mjs, plot 0): mallMass for base/middle/NW, mallFacade, shopBay, openings, parapets, entrances. Ticks 12,13,16.
5. **Medallions, canopies, grounds** (parts/grounds.mjs, plot 0): coin x4, uplightRow, canopies, slabRamp, mallSign, roofGarden, paving, lampPost, planter. Ticks 10,13,14,15,23,24.
6. **Dusk lighting** (parts/dusk.mjs, plots 0-2): litClump on pedestal and segment and pinnacle, mall lit bays, deckLights, final aircraft check. Ticks 8,16,22.

- [ ] P1 pedestal  - [ ] P2 segment  - [ ] P3 crown  - [ ] P4 mall  - [ ] P5 grounds  - [ ] P6 dusk

## Notes for workers
- Alignment is the contract: pedestal roof, segment foot and crown foot are the SAME 62 sq (7..68 in box-local, plot 0 103..164 x 115..176); segment top and crown ledge 76 sq.
- Keep mullion positions at the same absolute x/z ≡ 1 mod 4 box-local in every band (the plot-0 box-local origin is x96, z108).
- Respect heights: plot 0 <= y161, plot 1 <= y46, plot 2 <= y175. Build only on `#` cells; footings to ground (2 mostly, 4 west, 1 east).
- Leave RESERVED cells empty for their part; the ledge middle (x/z 7..68 at y46) stays clear.
- Only 1.21.1 blocks; no chain, no pale oak. No interiors, no villagers. Light every walkable top.
- Run `$MCD check` after each part.
```

### elements.md

```markdown
# Taipei 101 — REQUIRED ELEMENTS

Coordinates are plot-local (plan.md). Parts: P1 tower-pedestal, P2 segment, P3 crown, P4 mall, P5 medallions-canopies-grounds, P6 dusk-lighting. Vocab names are the helpers in plan.md VOCABULARY.

| # | element | real construction, block by block | where | part | vocab |
|---|---|---|---|---|---|
| 1 | Eight-segment bamboo/pagoda read | ONE segment: 8 bands of inverted-frustum glass wall, 1 block out per 6 courses (62 sq at y0 to 76 sq at y42..45), each band's step course 2 wide closing the soffit; top ledge y46 76 sq overhangs the next foot | plot 1 y0..46 | P2 | bandRing, stepCourse, ledgeSlab |
| 2 | Pedestal: truncated pyramid, 26 floors | 7 rings stepping in 1 per side every 24 courses from 76 sq to 62 sq, glass grid, bottom-slab dark_prismarine_slab sill at each step, solid flat roof y157 62 sq | plot 0 x96..171 z108..183 y1..157 | P1 | bandRing, stepCourse, ledgeSlab |
| 3 | Green-blue glass grid | cyan_stained_glass body, light_blue_stained_glass course under each floor line, light_gray_concrete mullions at box-local x or z = 1 mod 4 (same absolute positions in every band), dark_prismarine floor-line ring; glass 1 thick, hollow behind | pedestal, segment, pinnacle | P1 P2 P3 | glassCell |
| 4 | Darker band at each floor line | dark_prismarine ring at pedestal y = 2 mod 6, segment y 0,6..42 (2 wide where the wall steps) | same | P1 P2 | glassCell, stepCourse |
| 5 | Notched corners (double sawtooth) | leave out cells (a<2,b<4) or (a<4,b<2) per corner of each band; wall follows outline; noses (4,0),(0,4) light_gray_concrete, (2,2) corner strip | segment, pedestal | P1 P2 | notchRing |
| 6 | White-gold corner light strips | ochre_froglight column on the (2,2) nose of each corner, every band, y1..45, stepping out 1 with each band | segment corners | P2 | cornerStrip |
| 7 | Lit band at each segment top ledge | y44 light_blue_stained_glass ring, sea_lantern ring directly inside (1 in); y45 smooth_quartz fascia | segment | P2 | litBand |
| 8 | Scatter of lit office floors | ~12% of glass cells in clumps 2-4 x 1-2 rows: ochre_froglight (warm) or pearlescent_froglight (cool) in the cell one inside the glass; 2 warm:1 cool, denser S and E | pedestal, segment, pinnacle | P6 | litWindow, litClump |
| 9 | Ruyi ornaments | 8 x 9 iron_block cloud-scroll over short stem, smooth_quartz outline on head, gray_concrete eyes, 1 deep, proud of wall | segment foot, 4 faces centred | P2 | ruyi |
| 10 | Giant coin medallions (4) | disc r11, gold_block rim 2, raw_gold_block field, yellow_terracotta ring, 6x6 hole framed by gold_block, 2 deep, back fill so it stands on wall; shroomlight uplight row y129 | pedestal 4 faces | P5 | coin, uplightRow |
| 11 | Tall glazed entrance halls | clear `glass` panes/blocks with light_gray_concrete mullions every 2, y3..40 on N and E faces following the taper; doors 12 wide; warm ochre_froglight behind every 3rd cell | pedestal N z108, E x171 | P1 | hallGlazing |
| 12 | Podium mall (6 storeys, stepped roofs) | MALL BASE y2..36 deck 35, MIDDLE deck 46, NW block deck 68; smooth_stone spandrels, light_blue glass bays between polished_diorite piers every 8 | plot 0 | P4 | mallMass, mallFacade |
| 13 | Mall entrance on Xinyi Road + glass canopy | opening x74..90 y3..10; canopy glass deck y12 x65..99 z0..9 on 5 quartz columns, quartz edge beam; slab ramp z8, landing z9 | north | P4 P5 | canopy, slabRamp |
| 14 | Mall sign | gray_concrete band x40..130 y26..34 on z10 face, sea_lantern block letters TAIPEI 101 MALL via plaque | north mall face | P5 | mallSign |
| 15 | Roof gardens, skylights | moss_block/grass_block patches, oak trees (trunk 4, persistent leaves), light_blue glass skylight strips, parapet + smooth_quartz coping; light blocks hidden under leaves not needed: lanterns | each deck | P4 P5 | roofGarden |
| 16 | Lit shopfronts, lobbies | glass y3..10, ochre_froglight or lanterns one cell behind most bays; smooth_quartz fascia y11..12 | all mall faces, pedestal halls | P4 P6 | shopBay |
| 17 | Crown observatory | 52 sq glass box y1..11, lit band y10, fascia y11, outdoor deck y12 with iron_bars rail y13 | plot 2 | P3 | bandRing, litBand, deckRail |
| 18 | Stepped pinnacle (3 tiers) | 26/28/30 sq flared bands y13..80, light_blue glass with cyan under floor bands, corner notches, ledges at 35/57/80 | plot 2 | P3 | bandRing, ledgeSlab |
| 19 | Cap | 20/16/12 sq stepped solid smooth_quartz / iron_block / light_gray_concrete y81..92 | plot 2 | P3 | capStep |
| 20 | Spire + lightning rod | 2x2 iron_block y93..122, light_gray_concrete 1x1 y123..150, iron_bars y151..170, end_rod y171..174, lightning_rod y175 | x37..38 | P3 | spireSection |
| 21 | Red aircraft lights | red_stained_glass around a sea_lantern at y100,115,140,160,171 and cap corners y92 | spire, cap | P3 P6 | aircraftLight |
| 22 | Light on every roof/terrace | sea_lantern flush in ledges every 4-5 cells; mall decks: lanterns on parapet every 6; no dark cell >= light 0 on any walkable top | all roofs | P6 | deckLights |
| 23 | Plaza, paving, lamp posts, planters | smooth_stone/polished_andesite checker, planters of oak_leaves in smooth_quartz, lamp posts (cobblestone_wall + lantern) every 9 | east/south plaza, drive | P5 | lampPost, planter |
| 24 | East and south canopies | glass deck y12 on 4 quartz columns | pedestal E, S | P5 | canopy |
```

### rooms.json

```json
{"entrance":null,"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "tower_glass": ["cyan_stained_glass", "light_blue_stained_glass"],
    "trim": ["light_gray_concrete", "dark_prismarine", "dark_prismarine_slab", "smooth_quartz", "smooth_quartz_slab", "smooth_quartz_stairs", "quartz_pillar"],
    "lit": ["ochre_froglight", "pearlescent_froglight", "sea_lantern", "shroomlight"],
    "spire": ["iron_block", "gray_concrete", "iron_bars", "end_rod", "lightning_rod"],
    "aircraft": ["red_stained_glass"],
    "coin": ["gold_block", "raw_gold_block", "yellow_terracotta"],
    "mall": ["polished_diorite", "smooth_stone", "smooth_stone_slab", "polished_andesite", "polished_andesite_slab", "glass", "glass_pane", "gray_concrete"],
    "garden": ["moss_block", "grass_block", "oak_log", "oak_leaves"],
    "ground": ["smooth_stone", "polished_andesite"],
    "rails": ["iron_bars"]
  },
  "objects": ["lantern", "cobblestone_wall"]
}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build to a temp file, then move it into place. Parts still being written don't fail it.
set -e
cd "$(dirname "$0")"
tmp="build.tmp.$$.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
echo "build.nbt written"
```

### build.mjs

```js
// Builds the Taipei 101 site: full-size grid, ground, then the six parts in plan.md order. Usage: node build.mjs <out.nbt>
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, PLOTS, POLISHED_ANDESITE, SMOOTH_STONE } from "./vocab/base.mjs";

const PARTS = [
  ["Tower pedestal", "./parts/pedestal.mjs"],
  ["Segment", "./parts/segment.mjs"],
  ["Crown and spire", "./parts/crown.mjs"],
  ["Podium mall", "./parts/mall.mjs"],
  ["Medallions, canopies, grounds", "./parts/grounds.mjs"],
  ["Dusk lighting", "./parts/dusk.mjs"],
];

// Ground top y for a world column (plan.md SITE): plot 0 is 2 over most of the lot, 4 on the west street x 0..14,
// 3 at x 15..19, 1 on the east side and the north forecourt; plots 1 and 2 stand on y 0 (their foot floor).
function groundTop(x, z) {
  const p0 = PLOTS[0];
  if (x >= p0.x0 && x <= p0.x1 && z >= p0.z0 && z <= p0.z1) {
    let top = 2;
    if (x <= 14) top = 4;
    else if (x <= 19) top = 3;
    if (x >= 165 || (x >= 65 && x <= 99 && z <= 9)) top = 1;
    return top;
  }
  for (const p of [PLOTS[1], PLOTS[2]]) if (x >= p.x0 && x <= p.x1 && z >= p.z0 && z <= p.z1) return 0;
  return null;
}

function layGround(g) {
  for (let x = 0; x < SITE[0]; x++) for (let z = 0; z < SITE[2]; z++) {
    const top = groundTop(x, z);
    if (top === null) continue;
    for (let y = 0; y < top; y++) g.set(x, y, z, SMOOTH_STONE);
    g.set(x, top, z, POLISHED_ANDESITE);
  }
}

// A part whose file isn't written yet (its worker still building it in another copy) is an empty build, not a failure.
// Only a missing module is skipped; a syntax or runtime error still fails the build.
async function partBuild(file, name) {
  try {
    return (await import(file)).build;
  } catch (e) {
    if (e.code !== "ERR_MODULE_NOT_FOUND") throw e;
    console.log(`part ${name}: ${file} not found (${String(e.message).split("\n")[0]}); built as empty`);
    return () => {};
  }
}

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(2);
}

const g = new Grid(SITE, { dataVersion: DATA_VERSIONS["1.21.1"] });
layGround(g);
const list = [];
for (const [name, file] of PARTS) list.push([name, await partBuild(file, name)]);
// roof.json: absent on purpose. plan.md's only roof preset (flat-parapet-modern) is per mall terrace at three deck
// heights (y 35, 46, 68), and the mall part lays those through mallMass, so no single roof spec applies to the site.
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for the Taipei 101 parts: palette blocks, site coordinates (plan.md), and a seeded rng.

// ---- palette (palette.json ids only) ----------------------------------------------------------------------------

// ---- palette (palette.json ids only) ----------------------------------------------------------------------------
/** Cyan stained glass: the tower glass body. */
export const CYAN_GLASS = "minecraft:cyan_stained_glass";

/** Light blue stained glass: the glass course under each floor line, pinnacle and observatory body, lit bands. */
export const LIGHT_BLUE_GLASS = "minecraft:light_blue_stained_glass";

/** Light gray concrete: mullions, corner noses, ledge tops, spire middle. */
export const LIGHT_GRAY_CONCRETE = "minecraft:light_gray_concrete";

/** Dark prismarine: floor lines, step courses, base courses. */
export const DARK_PRISMARINE = "minecraft:dark_prismarine";

/** Dark prismarine slab (bottom): pedestal step sills. */
export const DARK_PRISMARINE_SLAB = "minecraft:dark_prismarine_slab";

/** Smooth quartz: fascias, coping, canopy frames, cap steps. */
export const SMOOTH_QUARTZ = "minecraft:smooth_quartz";

/** Smooth quartz slab. */
export const SMOOTH_QUARTZ_SLAB = "minecraft:smooth_quartz_slab";

/** Smooth quartz stairs. */
export const SMOOTH_QUARTZ_STAIRS = "minecraft:smooth_quartz_stairs";

/** Quartz pillar (axis y): canopy and mall columns. */
export const QUARTZ_PILLAR = "minecraft:quartz_pillar";

/** Ochre froglight: warm lit offices, corner light strips. */
export const OCHRE_FROGLIGHT = "minecraft:ochre_froglight";

/** Pearlescent froglight: cool lit offices. */
export const PEARLESCENT_FROGLIGHT = "minecraft:pearlescent_froglight";

/** Sea lantern: lit bands, deck lights, sign letters, aircraft centres. */
export const SEA_LANTERN = "minecraft:sea_lantern";

/** Shroomlight: coin medallion uplights. */
export const SHROOMLIGHT = "minecraft:shroomlight";

/** Iron block: ruyi bodies, spire lower section, cap middle. */
export const IRON_BLOCK = "minecraft:iron_block";

/** Gray concrete: ruyi eyes, mall sign band. */
export const GRAY_CONCRETE = "minecraft:gray_concrete";

/** Iron bars: spire upper section, observatory and deck rails. */
export const IRON_BARS = "minecraft:iron_bars";

/** End rod (facing up): spire tip. */
export const END_ROD = "minecraft:end_rod";

/** Lightning rod (facing up): spire top. */
export const LIGHTNING_ROD = "minecraft:lightning_rod";

/** Red stained glass: aircraft light rings. */
export const RED_STAINED_GLASS = "minecraft:red_stained_glass";

/** Gold block: coin medallion rim and frame. */
export const GOLD_BLOCK = "minecraft:gold_block";

/** Raw gold block: coin medallion field. */
export const RAW_GOLD_BLOCK = "minecraft:raw_gold_block";

/** Yellow terracotta: coin medallion inner ring. */
export const YELLOW_TERRACOTTA = "minecraft:yellow_terracotta";

/** Polished diorite: mall piers. */
export const POLISHED_DIORITE = "minecraft:polished_diorite";

/** Smooth stone: mall spandrels, roof decks, foot floor, ground body. */
export const SMOOTH_STONE = "minecraft:smooth_stone";

/** Smooth stone slab: the entrance ramp's first step. */
export const SMOOTH_STONE_SLAB = "minecraft:smooth_stone_slab";

/** Polished andesite: plinths, paving, ground top. */
export const POLISHED_ANDESITE = "minecraft:polished_andesite";

/** Polished andesite slab. */
export const POLISHED_ANDESITE_SLAB = "minecraft:polished_andesite_slab";

/** Clear glass: mall shopfronts and halls. */
export const GLASS = "minecraft:glass";

/** Glass pane. */
export const GLASS_PANE = "minecraft:glass_pane";

/** Moss block: roof gardens. */
export const MOSS_BLOCK = "minecraft:moss_block";

/** Grass block: roof gardens. */
export const GRASS_BLOCK = "minecraft:grass_block";

/** Oak log (axis y): roof-garden tree trunks. */
export const OAK_LOG = "minecraft:oak_log";

/** Oak leaves (persistent): roof-garden trees, planters. */
export const OAK_LEAVES = "minecraft:oak_leaves";

/** Lantern: standing lamps and hanging garden lights. */
export const LANTERN = "minecraft:lantern";

/** Cobblestone wall: lamp post posts. */
export const COBBLESTONE_WALL = "minecraft:cobblestone_wall";

// ---- site (plan.md; world x = plot-local x + plot origin; world y = plot-local y) --------------------------------
/** Full site size [x, y, z] of the grid: plot 2 reaches x 352, the crown reaches y 175, plot 0 reaches z 205. */
export const SITE = [353, 176, 206];

/** Plot footprints in world coordinates: the lot's x0..x1 and z0..z1, inclusive. */
export const PLOTS = {
  0: { x0: 0, x1: 192, z0: 0, z1: 205 },
  1: { x0: 197, x1: 272, z0: 0, z1: 75 },
  2: { x0: 277, x1: 352, z0: 0, z1: 75 },
};

/** Plot 1 (segment) and plot 2 (crown) world x offset from plot 0's origin. */
export const PLOT_ORIGIN = { 0: [0, 0, 0], 1: [197, 0, 0], 2: [277, 0, 0] };

/** Pedestal footprint at the ground, world x and z (76 square, box-local origin x 96, z 108). */
export const PEDESTAL_BOX = { x0: 96, x1: 171, z0: 108, z1: 183 };

/** Pedestal roof y: the solid flat roof the first segment's foot stands on. */
export const PEDESTAL_ROOF_Y = 157;

/** Pedestal roof footprint in world x/z, 62 square; the segment and crown feet are the same 62 square (box-local 7..68). */
export const FOOT = { x0: 103, x1: 164, z0: 115, z1: 176 };

/** Segment box size: 76 square in plot 1 (box-local 0..75), 46 tall. */
export const SEGMENT_SIZE = 76;

/** Segment top ledge y. */
export const SEGMENT_TOP_Y = 46;

/** Crown top y: the spire's lightning rod. */
export const CROWN_TOP_Y = 175;

/** Mall deck y: base, middle and NW terraces. */
export const MALL_DECK_Y = { base: 35, middle: 46, nw: 68 };

/** Mall north face z (Xinyi Road front) and main entrance x range. */
export const MALL_NORTH_Z = 10;

export const MALL_ENTRANCE_X = { x0: 74, x1: 90 };

/** Medallion uplight row y, in front of each coin medallion's wall. */
export const UPLIGHT_Y = 129;

/** Lit-band rows on the pedestal: y 155..156. */
export const PEDESTAL_LIT_Y = { y0: 155, y1: 156 };

// ---- seeded rng --------------------------------------------------------------------------------------------------
/** Seeded PRNG (mulberry32): rng(seed)() returns a float in [0, 1), the same sequence for the same seed. */
export function rng(seed)
```

### vocab/h1.mjs

```js
// vocab/h1.mjs: the part helpers from plan.md VOCABULARY (notchRing, stepCourse, litBand, ruyi, hallGlazing, shopBay,
// mallSign, planter, aircraftLight). Coordinates are the grid's own (plot-local). Faces: "north" | "south" | "east" | "west".
// Writes go only into air inside the helper's own footprint; `over: true` replaces what is there, still inside it.
// Each writer returns { placed, refused }; refused lists [x, y, z] cells skipped because they were not air.

/** Plan ring of a band: the square x0..x1, z0..z1 with the double-sawtooth notch at each corner (cells with (a<2 && b<4)
 *  or (a<4 && b<2) left out, a and b counted from that corner). Returns [[x, z], ...]: the cells of the notched plan that
 *  have a 4-neighbour outside it, so noses sit at (4,0), (2,2), (0,4) from each corner. */
export function notchRing(x0, z0, x1, z1)

/** Step course at height y where the band steps: the new ring (inset insetNew of box) and the ring below it are
 *  dark_prismarine, which closes the soffit. taper (pedestal, stepping in): the ring below is the outer cell, a bottom
 *  dark_prismarine_slab sill. box = [x0, z0, x1, z1], the module's outer square. */
export function stepCourse(g, { box, insetNew, y, taper = false, over = false })

/** Lit band at height y: light_blue_stained_glass on the ring of `ring` = [x0, z0, x1, z1], sea_lantern on the ring
 *  one cell inside it. */
export function litBand(g, { y, ring: box, over = false })

/** Ruyi ornament on a face, 8 wide: cells center-4 .. center+3 along the wall (so plan.md's 34..41 is center 38). Its foot
 *  is at y0 (default 0, a segment's foot) and its lower part sits one cell proud of the wall, at z0 (or x0 on east and
 *  west); the head (y 6..8) steps one further out. Smooth_quartz outlines the head, iron_block fills the rest. */
export function ruyi(g, face, center, z0, { y0 = 0, over = false } = {})

/** Tower hall glazing on a face: glass across range = [a, b] (along the wall) for y0..y1, with light_gray_concrete
 *  mullions every 2 (on the module's parity, like the grid), a door gap left open up to gapTop, and an ochre_froglight one
 *  cell inside every 3rd cell (every 3rd row too). box = the module's outer square; insetAt(y) is the taper inset at
 *  height y (default 0, a straight wall). Replacing the tower's own glass needs over: true. */
export function hallGlazing(g, face, [a, b], y0, y1, { box, insetAt = () => ...

/** Ground-floor shopfront bay: glass y3..10 on the wall plane across range = [a, b], one ochre_froglight one cell inside the
 *  middle, smooth_quartz fascia y11..12. bay = { face, range, plane, over? }. */
export function shopBay(g, { face, range: [a, b], plane, over = false })

/** Sign band on a face of the mall: gray_concrete across range = [a, b] for y0..y1 on the wall plane, with `text` in
 *  sea_lantern block letters centred on it (plaque). The band is the sign writer's own cells, so it replaces what is there. */
export function mallSign(g, { face, range: [a, b], y0, y1, plane, text = "TAIPEI 101 MALL", letter = "sea_lantern" })

/** Planter: a smooth_quartz box over box = [x0, z0, x1, z1] at height y, with a smooth_quartz rim at y + 1 and persistent
 *  oak_leaves inside it. Two high with the leaves, so keep the lane clear past it. */
export function planter(g, [x0, z0, x1, z1], y, { over = false } = {})

/** Aircraft warning light at [x, y, z]. kind "2x2": a 2x2 sea_lantern (x..x+1, z..z+1) ringed by 12 red_stained_glass.
 *  kind "1x1": a sea_lantern at [x, y, z] with red_stained_glass on its 4 sides. centre: the block for the lit cells;
 *  null leaves them alone (an end rod already there). The spire's own cells need over: true. */
export function aircraftLight(g, [x, y, z], kind, { over = false, centre = "sea_lantern" } = {})
```

### vocab/h2.mjs

```js
// vocab/h2.mjs: the nine plan.md VOCABULARY helpers this session owns (glassCell, ledgeSlab, litWindow, coin,
// mallMass, canopy, roofGarden, capStep, deckLights). Written to plan.md as specified.
//
// Conventions every helper keeps:
//   - positions are grid (structure-local) x/y/z; a rect is {x0, z0, x1, z1}, inclusive; a box adds y0 (and y1)
//   - a write goes only into air and inside the grid (g.isAir); any other cell is left alone and not counted
//   - nothing is written under the helper's own footprint (no ground, sand or floor); an option named in the call
//     is the only exception
//   - leaves are persistent=true; no helper here hangs a light, places a door, or places furniture

// ---- glass grid ---------------------------------------------------------------------------------------------------
/**
 * The block for one wall cell of a band, placed into air. Returns the block id, or null if the cell was not air.
 * ctx: { box: {x0,z0,x1,z1} (the module's outer box), inset (the band's ring, 0 = outer), kind: "pedestal" |
 * "segment" (the floor-line rule), floor(y) (overrides kind, e.g. a pinnacle's bands), body, under (the glass ids;
 * default cyan_stained_glass and light_blue_stained_glass; a pinnacle swaps them) }.
 * Order (plan.md): floor line, mullion (box-local x on N/S faces or z on E/W faces, ≡ 1 mod 4), outer noses
 * (4,0) and (0,4), corner froglight (2,2), course under a floor line, body.
 */
export function glassCell(g, x, y, z, ctx)

// ---- slabs and ledges ---------------------------------------------------------------------------------------------
/**
 * A solid flat slab over the notched plan of box at height y, placed into air.
 * box: {x0,z0,x1,z1}; top: light_gray_concrete | smooth_quartz | smooth_stone; notch: "double" | "single" | false;
 * lanternRing: an inset k, where sea_lantern goes flush in the slab on every `every`-th cell of that ring.
 */
export function ledgeSlab(g, { box, y, notch = false, top = "smooth_stone", lanternRing, every = 5 })

/**
 * A lit window: a froglight in the cell `inward` of the glass cell at [x, y, z], placed into air.
 * inward: a direction name (north | south | east | west | up | down) or a [dx, dy, dz] step; kind: "warm"
 * (ochre_froglight) or "cool" (pearlescent_froglight). Returns true if placed.
 */
export function litWindow(g, [x, y, z], inward, kind)

// ---- medallions ---------------------------------------------------------------------------------------------------
/**
 * A giant coin on a wall: a disc of radius 11 two blocks proud of the wall. face: north | south | east | west.
 * center: [x, y, z] of the disc centre; the wall plane is center's coordinate on the face's axis (z for north and
 * south, x for east and west), and the disc sits outward of it. Rim (r >= 9) gold_block; a 6x6 hole open through
 * both layers (the glass shows through) framed by a 1-cell gold_block border; yellow_terracotta at r 6..7.5;
 * raw_gold_block field. opts.wallAt(y): the wall plane at row y when the wall steps; the gap behind the disc is
 * filled with raw_gold_block.
 */
export function coin(g, face, center, { wallAt } = {})

// ---- mall ---------------------------------------------------------------------------------------------------------
/**
 * A mall mass: walls on the footprint's outer ring from box.y0 up to the deck, a floor slab every 11 courses from
 * box.y0 (2, 13, 24 … below the deck), a solid deck at deckY with a coping ring at its edge, and roofSpec.parapet
 * courses of coping on the ring above it. box: {x0, y0, z0, x1, z1}. roofSpec: { parapet = 1, coping = "smooth_quartz",
 * wall = "smooth_stone", floor = "smooth_stone" (a bottom slab), deck = "smooth_stone", plan = (x, z) => bool } where
 * plan is the footprint mask (the `#` cells); the default footprint is the whole box.
 */
export function mallMass(g, box, deckY, roofSpec = {})

// ---- canopies -----------------------------------------------------------------------------------------------------
/**
 * A canopy: a glass deck at y with a smooth_quartz edge beam all round, and a quartz_pillar at each listed [x, z]
 * running from the deck down to the first solid block below it. A column with no ground under it is not built.
 */
export function canopy(g, rect, y, columns = [])

// ---- roofs --------------------------------------------------------------------------------------------------------
/**
 * A roof garden on a deck. deck: {x0, z0, x1, z1, y}, y being the deck's top course; its outline is the parapet.
 * Planting sits on y + 1: moss_block and grass_block patches (2 to 6 square, about two tiles in three, inset 1 from
 * the parapet); oak trees about every 14 cells (grass base, 4-log trunk, persistent leaves).
 * opts.skylight: a rect whose deck cells at y become light_blue_stained_glass. This replaces existing deck blocks,
 * so it is the one explicit overwrite here. opts.parapet (default 1): standing lanterns on the parapet every 6 cells,
 * only where the parapet is solid below.
 */
export function roofGarden(g, deck, { skylight = null, parapet = 1 } = {})

// ---- caps and lights ----------------------------------------------------------------------------------------------
/**
 * A solid stepped cap. tiers: [{x0, z0, x1, z1, y0, y1, block}] in grid coordinates, each tier filled solid into air
 * (the architect's table gives smooth_quartz, iron_block, light_gray_concrete tiers).
 */
export function capStep(g, tiers)

/**
 * Sea lanterns on a walkable top: every `every`-th cell of the rect's ring `ring` (inset k), at the rect's y.
 * Air only, unless opts.flush: then the deck's own top block there is replaced, so the light sits flush in the
 * surface (the plan's "flush sea_lantern").
 */
export function deckLights(g, rect, ring, every, { flush = false } = {})
```

### vocab/h3.mjs

```js
// Taipei 101 helpers, the plan.md VOCABULARY names that the parts call (bandRing, cornerStrip, litClump, uplightRow,
// mallFacade, slabRamp, lampPost, spireSection, deckRail). All coordinates are the grid's own (box-local).
// Each helper plans its cells first, then writes only the ones that are air and inside the grid: an earlier part's
// block, the ground under a fitting, and out-of-grid cells are left alone (the count returned is what was written).

// One band of the tower shell: the notched ring of the box shrunk by inset, from y0 to y1, glass by glassCell.
export function bandRing(g, { box, inset = 0, y0, y1, ctx = {}, notch = "double" })

// The (2,2) nose of each corner, through each band, as an ochre_froglight column (stepping out with the band).
export function cornerStrip(g, { box, bands })

// Scattered lit offices on the glass that faces `face` (exposed outside, hollow inside). Clumps are 2-4 wide and
// 1-2 rows high, ~density of the glass cells (doubled on south and east), 2 warm : 1 cool per clump, one froglight in
// the cell inside each glass cell it lights. Seeded and deterministic. box (optional) limits the footprint.
export function litClump(g, face, seed, density, box = null)

// A row of shroomlight at height y, from..to along the face, one cell in front of the wall plane at `wall`.
export function uplightRow(g, face, from, to, y, wall)

// The mall facade on the wall plane `wall` between from..to, up to height top: y2 polished_andesite plinth, polished
// diorite piers 2 wide every 8 (absolute x or z), shopfront glass y3..10 with a smooth_quartz fascia y11..12, then
// storeys of 11 from y13: smooth_stone spandrel 3 courses, light_blue glass 8 courses.
export function mallFacade(g, face, { from, to, wall, top })

// The entrance ramp: a bottom smooth_stone_slab at depth `slab`, a full-block landing at depth `landing`, both at y,
// from..to along the face. Depth is z for north and south faces, x for east and west.
export function slabRamp(g, { face, from, to, y, slab, landing, block = "smooth_stone" })

// A lamp post: cobblestone_wall twice, a standing lantern on top. Writes its own three cells only.
export function lampPost(g, x, y, z)

// A spire section at (x, z), size x size cells, y0..y1. kind: iron_block, light_gray_concrete, iron_bars, end_rod or
// lightning_rod (rods face up). Lower spire is iron_block size 2; upper is size 1.
export function spireSection(g, { x, z, y0, y1, kind, size = 1 })

// Iron bars around the perimeter of box at height y, each joined to its ring neighbours.
export function deckRail(g, box, y)
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

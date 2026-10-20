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

- [x] P1 pedestal  - [ ] P2 segment  - [ ] P3 crown  - [ ] P4 mall  - [ ] P5 grounds  - [ ] P6 dusk

## Notes for workers
- Alignment is the contract: pedestal roof, segment foot and crown foot are the SAME 62 sq (7..68 in box-local, plot 0 103..164 x 115..176); segment top and crown ledge 76 sq.
- Keep mullion positions at the same absolute x/z ≡ 1 mod 4 box-local in every band (the plot-0 box-local origin is x96, z108).
- Respect heights: plot 0 <= y161, plot 1 <= y46, plot 2 <= y175. Build only on `#` cells; footings to ground (2 mostly, 4 west, 1 east).
- Leave RESERVED cells empty for their part; the ledge middle (x/z 7..68 at y46) stays clear.
- Only 1.21.1 blocks; no chain, no pale oak. No interiors, no villagers. Light every walkable top.
- Run `$MCD check` after each part.

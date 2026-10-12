# Plan: Roman domus (villa urbana) "villa-sonnet"

Identity: a single-storey Pompeian town house on a street, windowless to the street except four shuttered shops and a recessed entrance
(fauces) in the middle; behind it the atrium (open to the sky, rain pool), the tablinum on the same axis, and a peristyle garden with a
white colonnade, fountain, statues and clipped hedges. Cream plaster, red dado, red-tile roofs sloping into the courts, bronze lamps.
Site x 0..35 (36), z 0..47 (48), y 0..9 (ridges; one chimney may reach y10). Front = NORTH (-z), street at z<0.
Ground y=0. HOUSE FLOOR y=1 (podium), so inside a player stands at y=2. All ranges inclusive. Mirror rule: x' = 35 - x (axis between x17|x18).
Workers: read `vocab.mjs` first, then only your own part file. `make.sh` rebuilds everything. Later parts only ADD into air: a part never
writes into a cell an earlier part filled; P1 therefore leaves every opening (and every cell listed "left to Pn") unset.
HARD RULE: nothing but P2 (roofs) stands at y>=7 inside x0..35, z2..45. Walls/columns/ceilings stop at y=6.

## SITE (masses)
| mass | x | y | z | notes |
|---|---|---|---|---|
| street + sidewalk | 0..35 | 0 | 0..1 | `andesite`/`polished_andesite` hash; kerb row at z=0 (P3) |
| rear lane | 0..35 | 0 | 46..47 | `gravel` 70 / `dirt_path` 30 (P6) |
| foundation | 0..35 | 0 | 2..45 | P1: `stone_bricks`; garden court x11..24,z35..41 = `dirt`; pool x15..20,z14..17 = `blue_terracotta` |
| floor layer | 0..35 | 1 | 2..45 | P1: per-room mosaic/floor (ROOMS); NOT laid at: garden court x11..24,z35..41; pool x15..20,z14..17 (left to P5/P4) |
| outer walls | | 1..6 | z=2, z=45, x=0, x=35 | wallCell roles; ceiling plane y=6 |
| front block (4 shops + fauces) | 0..35 | 2..6 | 2..9 | depth: wall z2, rooms z3..8, wall z9 |
| atrium block | 0..35 | 2..6 | 10..21 | atrium x10..25; cubicula W x1..8, E x27..34 |
| tablinum block | 0..35 | 2..6 | 22..31 | kitchen x1..9, tablinum x11..24, triclinium x26..34 |
| peristyle block | 0..35 | 2..6 | 32..45 | rooms x1..5 / x30..34, ring walkway x7..28, court x11..24,z35..41 |
| compluvium (open) | 14..21 | 6..9 | 13..18 | hole in ceiling and roof |
| garden court (open) | 11..24 | 1..9 | 35..41 | open sky |
| roofs | 0..35 | 7..9 | 2..45 | 16 pieces (table below), `red-tile` palette |

### Roof pieces (P2). Preset base: `temple` (red-tile palette, low pitch, quartz raking cornice) with these overrides per piece (pitch half; roof sits on wall top y6 so first roof course is y7; ridge max y9). Chosen by building type: Mediterranean colonnaded house -> `temple` preset (red-tile), not `cottage`.
| id | rect x0..x1, z0..z1 | style | slope / ridge | notes |
|---|---|---|---|---|
| R1 front block | 0..35, 2..9 | gable | ridge along x (z=5..6), falls N to the street and S to the atrium wall | overhang north 1 only; the visible street roof |
| R2 NW wing | 0..9, 10..21 | gable | ridge along z (x=4..5) | overhang 0 |
| R3 NE wing | 26..35, 10..21 | gable | ridge along z (x=30..31) | overhang 0 |
| R4 atrium N | 10..21, 10..12 | shed | low = south | inward to the compluvium |
| R5 atrium E | 22..25, 10..18 | shed | low = west | |
| R6 atrium S | 14..25, 19..21 | shed | low = north | |
| R7 atrium W | 10..13, 13..21 | shed | low = east | pinwheel: R4..R7 do not overlap, hole x14..21,z13..18 stays open |
| R8 kitchen | 0..9, 22..31 | gable | ridge along z (x=4..5) | chimney E31 |
| R9 tablinum | 10..25, 22..31 | gable | ridge along x (z=26..27) | |
| R10 triclinium | 26..35, 22..31 | gable | ridge along z (x=30..31) | |
| R11 peristyle N | 7..24, 32..34 | shed | low = south | falls to the column line z=34 |
| R12 peristyle E | 25..28, 32..41 | shed | low = west | |
| R13 peristyle S | 11..28, 42..45 | shed | low = north | covers back wall z=45 |
| R14 peristyle W | 7..10, 35..45 | shed | low = east | pinwheel: hole x11..24, z35..41 stays open |
| R15 SW rooms | 0..6, 32..45 | gable | ridge along z (x=3) | |
| R16 SE rooms | 29..35, 32..45 | gable | ridge along z (x=32) | |
Overhang: only R1 north=1 (over the sidewalk). All others 0 (party walls, inner edges): use `--why "adjoining roof pieces share walls; plot boundary"`. Eaves `plain`, ridge `slab`, verge `smooth_quartz`. Pediment over the fauces (E30): x14..21 on z=2, stepped y7..9. Roof pieces must not roof the open holes: compluvium x14..21,z13..18 and garden x11..24,z35..41.

## PALETTE (every id checked with `mcd blocks --check`; unknown ids: none left. NB `brick` is not a block: use `bricks`; `chain` is `copper_chain`)
| role | blocks | where / share |
|---|---|---|
| plaster (60%) | `smooth_sandstone` 70 / `end_stone_bricks` 20 / `sandstone` 10 per-cell hash, stairs `smooth_sandstone_stairs`, slab `smooth_sandstone_slab` | wall y4..5 inside and out |
| dado | `red_terracotta` | wall y2..3 inside and out |
| plinth/base (10%) | `stone_bricks`, `stone_brick_stairs`, `stone_brick_slab`, `stone_brick_wall`, `chiseled_stone_bricks` | wall y1, steps, pedestals, hearth, foundation |
| cornice | `cut_sandstone`, `cut_sandstone_slab` | y6 top course |
| white marble (10%) | `quartz_block`, `smooth_quartz`, `quartz_pillar`, `chiseled_quartz_block`, `quartz_stairs`, `quartz_slab`, `smooth_quartz_slab`, `smooth_quartz_stairs`, `diorite_wall`, `polished_diorite` | columns, pilasters, architrave, fountain, statues |
| roof (15%) | `red-tile` palette via the roof tool (`bricks`, `granite`, `polished_granite`, `mangrove_planks`, eave `mud_bricks`, verge `smooth_quartz`) | roofs |
| timber (5%) | `spruce_planks`/`slab`/`stairs`/`trapdoor`/`door`/`fence`, `dark_oak_planks`/`log`/`slab`/`stairs`/`fence`/`trapdoor`/`door` | ceilings (spruce_planks), doors, beams (dark_oak), furniture |
| bronze | `copper_lantern`, `copper_chain`, `copper_bars`, `copper_block`, `cut_copper`, `cut_copper_slab`, `cut_copper_stairs`, `copper_trapdoor` | lamps, window grilles, lampstands |
| mosaic tesserae | `quartz_block`, `polished_blackstone`, `red_terracotta`, `black_terracotta`, `white_terracotta`, `yellow_terracotta`, `blue_terracotta`, `terracotta`, `orange_terracotta`, `cyan_glazed_terracotta`, `blue_glazed_terracotta`, `orange_glazed_terracotta`, `smooth_stone`, `polished_andesite` | floors |
| ground / garden | `grass_block`, `dirt`, `gravel`, `dirt_path`, `andesite`, `polished_andesite`, `coarse_dirt`, `podzol` | street, lane, court |
| plants | `azalea_leaves`, `flowering_azalea_leaves`, `poppy`, `azure_bluet`, `allium`, `cornflower`, `red_tulip`, `white_tulip`, `rose_bush`, `lilac`, `peony`, `short_grass`, `fern`, `potted_fern`, `potted_azalea_bush`, `potted_flowering_azalea_bush`, `potted_cornflower`, `potted_allium`, `potted_poppy`, `potted_cactus` | beds, pots |
| water | `water`, `water_cauldron`, `cauldron` | pool, fountain, kitchen |
| furniture/functional | `red_bed`, `white_bed`, `campfire`, `furnace`, `smoker`, `crafting_table`, `barrel`, `chest`, `bookshelf`, `lectern`, `decorated_pot`, `candle`, `red_carpet`, `white_carpet`, `black_carpet`, `yellow_carpet`, `item_frame`, `skeleton_skull`, `loom`, `brewing_stand`, `end_rod` | rooms |
Contrast: cream walls vs red tile roof vs red dado vs white marble vs dark-oak/spruce wood vs bronze. Quartz columns pop against the red dado/cream.

## VOCABULARY (helpers in `vocab.mjs`; facing = direction a stair rises / a door faces out of the room)
| helper | parameters | construction |
|---|---|---|
| `wallCell(x,y,z,kind)` | kind: ext/int | y1 `stone_bricks`; y2..3 `red_terracotta`; y4..5 plaster hash (positional: (x*7+z*13+y*5)%10 -> <7 smooth_sandstone, <9 end_stone_bricks, else sandstone); y6 `cut_sandstone`. |
| `wallLine(x0,z0,x1,z1,{open:[boxes]})` | straight 1-thick wall y1..6 | wallCell for every cell except listed openings (left unset). |
| `pilaster(x,z)` | wall cell | y2 `quartz_block`, y3..4 `quartz_pillar` axis=y, y5 `chiseled_quartz_block`, y6 `smooth_quartz`. |
| `column(x,z)` | | y1 `smooth_stone` (stylobate), y2 `quartz_block` base, y3..4 `quartz_pillar` axis=y, y5 `chiseled_quartz_block` capital; architrave at y6 is `beamLine`. |
| `beamLine(x0,z0,x1,z1,block)` | y6 | row of `smooth_quartz` (marble) or `dark_oak_log` (axis along the line) at y6. |
| `tuscanColumn(x,z)` | | y2 `stone_bricks`, y3..4 `dark_oak_log` axis=y, y5 `dark_oak_planks`. |
| `shopWindow(x0,x1)` | opening cells x0..x1 at z=2, y2..4 | y2 `stone_brick_slab` type=bottom across; one `decorated_pot` at (x0+1, y3, 2) on the counter; lintel y5 plaster (P1). |
| `shutter(x,y,z)` | | `spruce_trapdoor` facing=north open=true half=bottom at (x,y,z=1) lying against the wall face; a stack of two (y3,y4). |
| `windowGrille(x,y,z,axis)` | 1x2 opening y3..4 | `copper_bars` at y3 and y4 (no state; `fixConnections` after). |
| `doorway(x,z,axis)` | interior opening 1 wide, y2..3 | `spruce_door` (lower+upper) facing out of the room, hinge left, open=false; lintel y4 plaster; no frame. |
| `doorPair(x,z)` | 2 wide opening | two `spruce_door`, hinge=left on the first and hinge=right on the second, open=true. Used for the fauces (two pairs) and the rear door. |
| `step(x0,x1,z)` | | `stone_brick_stairs` facing=south half=bottom at y1. |
| `hangLamp(x,z)` | under ceiling y6 | `copper_chain` at y5, `copper_lantern` hanging=true at y4. |
| `lampStand(x,z)` | | `cut_copper_slab` type=bottom y2, `copper_bars` y3, `copper_lantern` hanging=false y4. |
| `pot(x,z,plant)` | plant: fern/azalea/flowering_azalea/cornflower/allium/poppy | `stone_bricks` pedestal y2 + `potted_<plant>` at y3 (on the sidewalk, one level lower: pedestal y1, pot y2). |
| `statue(x,z,rot)` | | y2 `stone_bricks`, y3 `diorite_wall`, y4 `quartz_pillar` axis=y, y5 `skeleton_skull` rotation=rot (8 = faces the garden axis). |
| `hedge(x,z)` | | `azalea_leaves` y2; every 4th cell `flowering_azalea_leaves`. |
| `gardenBed(x0,z0,x1,z1)` | 3x5 | ground y1 `grass_block`; border y2 hedge cells; interior cells flowers (`poppy`,`azure_bluet`,`allium`, alternating) y2. |
| `fountain(x0,z0,x1,z1)` | 6x5 | rim ring y2 `smooth_quartz`; interior y1 `blue_terracotta`, y2 `water`; pedestal (17..18,z38): `quartz_pillar` y2..3 + `water_cauldron` level=3 y4. |
| `impluvium()` | | water y1 at x15..20,z14..17; coping `smooth_quartz_slab` type=bottom y2 on the ring x14..21,z13..18 except the 4 column cells. |
| `mosaic(box,style)` | style names in ROOMS | checker(a,b): (x+z)%2; border(field,b1,b2): outer ring b1, second ring b2, field; emblem(centre,block): a 2x2 or 3x3 glazed terracotta; meander(a,b): ring where cells alternate pairs. |
| `couch(x,z,facing,len)` | | `red_bed` pieces end to end along a wall (len 2 per bed), `dark_oak_slab` rail behind. Designer-owned. |
| `table(x,z,w,d)` | | `dark_oak_fence` legs at corners y2, `dark_oak_slab` type=top y3 over the area (designer-owned). |

## ROOMS (inner air boxes; every room: floor y1, ceiling `spruce_planks` y6, air y2..5)
| room | box [x0,y0,z0,x1,y1,z1] | floor (y1) | mood / key pieces | ways in | windows |
|---|---|---|---|---|---|
| Fauces (entrance passage) | [16,2,2,19,5,9] | `smooth_stone` with `black_terracotta` centre strip x17..18 | solemn, dim; doors at z=4; lampstands + pots at x16/x19, z=3 | street (16..19,2..5,z2); atrium (16..19,2..5,z9) | none |
| Taberna W1 | [1,2,3,7,5,8] | `polished_andesite` | shop: counter at the window, amphorae (`decorated_pot`, `barrel`), shelves | doorway (8,2..3,6) from W2; street window x3..5 (counter, not a door) | street x3..5 |
| Taberna W2 | [9,2,3,14,5,8] | `polished_andesite` | shop/tavern: bar, barrels, stools | doorway (15,2..3,6) from the fauces; (8,2..3,6) | street x10..13 |
| Taberna E3 | [21,2,3,26,5,8] | `polished_andesite` | mirror of W2 | doorway (20,2..3,6) from the fauces; (27,2..3,6) | street x22..25 |
| Taberna E4 | [28,2,3,34,5,8] | `polished_andesite` | mirror of W1 | doorway (27,2..3,6) | street x30..32 |
| Atrium | [10,2,10,25,5,21] | black/white checker (`quartz_block`/`polished_blackstone`), 1-cell `red_terracotta` border ring just inside the walls, `yellow_terracotta` ring around the coping | grand, bright pool-light; impluvium + coping x14..21,z13..18, 4 Tuscan columns, bench/marble table, statues at (11,12),(24,12), pots at corners | fauces opening (16..19,2..5,9); tablinum (15..20,2..5,22); doorways (9,2..3,12),(9,2..3,18),(26,2..3,12),(26,2..3,18) | none (sky) |
| Cubiculum C1 (NW) | [1,2,10,8,5,14] | `smooth_sandstone` with `red_terracotta` border | small bedroom: bed, chest, lamp | doorway (9,2..3,12) | (0,3..4,12) |
| Cubiculum C2 (SW) | [1,2,16,8,5,21] | same | bedroom/dressing | doorway (9,2..3,18) | (0,3..4,18) |
| Cubiculum C3 (NE) | [27,2,10,34,5,14] | same | mirror of C1 | doorway (26,2..3,12) | (35,3..4,12) |
| Cubiculum C4 (SE) | [27,2,16,34,5,21] | same | mirror of C2 | doorway (26,2..3,18) | (35,3..4,18) |
| Tablinum | [11,2,23,24,5,30] | field `white_terracotta`, border `red_terracotta`, 2nd ring `black_terracotta`, emblem 2x2 `blue_glazed_terracotta` at x17..18,z26..27 | study / master's office on the axis; desk, scroll shelves (`bookshelf`), lectern, chair; open both ends | atrium (15..20,2..5,22), peristyle (15..20,2..5,31), doorways (10,2..3,27),(25,2..3,27) | none |
| Culina (kitchen) | [1,2,23,9,5,30] | `stone_bricks`/`cobblestone` hash | hearth at W wall (E19), counter with `smoker`/`furnace`, `water_cauldron`, `barrel`s, table | doorway (10,2..3,27) from the tablinum; opening (7..8,2..4,31) to the colonnade | (0,3..4,26) |
| Triclinium | [26,2,23,34,5,30] | border `black_terracotta` ring, meander `red_terracotta`/`yellow_terracotta`, emblem 3x3 `orange_glazed_terracotta` at x29..31,z25..27 | festive, warm; 3 couches W/N/E, table, niche lamps | doorway (25,2..3,27); opening (27..28,2..4,31) to the colonnade | (35,3..4,26) |
| Cubiculum C5 (SW court) | [1,2,32,5,5,37] | `smooth_sandstone` + `red_terracotta` border | bedroom | doorway (6,2..3,35) | (0,3..4,35) |
| Lararium C6 | [1,2,39,5,5,44] | `polished_diorite` | house shrine: altar niche W wall, candles, lamp, pots | doorway (6,2..3,41) | (3,3..4,45) |
| Cubiculum C7 (SE court) | [30,2,32,34,5,37] | same as C5 | mirror of C5 | doorway (29,2..3,35) | (35,3..4,35) |
| Storeroom C8 (apotheca) | [30,2,39,34,5,44] | `stone_bricks` | amphorae (`decorated_pot`), barrels, chests | doorway (29,2..3,41) | (32,3..4,45) |
| Peristyle colonnade (walkway) | [7,2,32,28,5,44] (the court x11..24,z35..41 in its middle is OPEN garden) | `cut_sandstone`, a `terracotta` line along the column rectangle | calm, shaded cloister; benches, pots, lamps; walkway cells x7..9, x26..28, z32..33, z43..44 and the column lines | tablinum (15..20,2..5,31); kitchen (7..8,2..4,31); triclinium (27..28,2..4,31); rooms C5..C8; rear door (17..18,2..3,45) | open to court |
No stairs (single storey). The roof space is not an interior.

## OPENINGS (all left AIR by P1; later parts fill them as listed)
Wall y1 plinth is always built. Heights: "full" = y2..5 (lintel y6 from P1).
| wall | opening (x,y,z) | filled by |
|---|---|---|
| z=2 front | fauces x16..19, y2..5 | open (doors set back at z=4, P3) |
| z=2 front | shop windows x3..5, x10..13, x22..25, x30..32, y2..4 | P3 `shopWindow` + `shutter` |
| z=4 (inside fauces) | whole plane x16..19, y2..5 left AIR by P1 | P3: `doorPair` x2 at y2..3; fanlight `spruce_trapdoor` half=top open=false at y4; y5 `dark_oak_planks` lintel row |
| z=9 | x16..19, y2..5 | open (arch frame: `pilaster` at x15 and x20 on z=9 is P4) |
| x=15, x=20 (z=6) | (15,2..3,6),(20,2..3,6) | P4 `doorway` |
| x=8, x=27 (z=6) | (8,2..3,6),(27,2..3,6) | P4 `doorway` |
| x=9, x=26 | (9,2..3,12),(9,2..3,18),(26,2..3,12),(26,2..3,18) | P4 `doorway` |
| z=22 | x15..20, y2..5 | open; P4 `pilaster` at x14 and x21 on z=22 (y2..5) |
| x=10, x=25 | (10,2..3,27),(25,2..3,27) | P4 `doorway` |
| z=31 | tablinum x15..20, y2..5; kitchen x7..8, y2..4; triclinium x27..28, y2..4 | open; P5 `pilaster` at x14, x21 on z=31 |
| x=6, x=29 | (6,2..3,35),(6,2..3,41),(29,2..3,35),(29,2..3,41) | P5 `doorway` |
| z=45 back | rear door x17..18, y2..3; windows (3,3..4,45),(32,3..4,45) | P6 `doorPair`; `windowGrille` |
| x=0 | windows (0,3..4,12),(0,3..4,18),(0,3..4,26),(0,3..4,35) | P6 `windowGrille` |
| x=35 | windows (35,3..4,12),(35,3..4,18),(35,3..4,26),(35,3..4,35) | P6 `windowGrille` |
| ceiling y6 | compluvium x14..21, z13..18; garden x11..24, z35..41; kitchen flue (2,6,26) | left AIR (P1) |

## OUTDOOR ROOMS
- Street front: sidewalk z0..1 y0 (hash `andesite` 60 / `polished_andesite` 40), kerb row z=0: `stone_brick_slab` type=bottom at y1, x0..35 except x16..19 (the step). Entrance step (16..19,1,1) stairs facing south. Two lampstands (sidewalk level: slab y1, bars y2, lantern y3) at (14,1) and (21,1); `pot` with `potted_fern` at (13,1) and (22,1). Keep x15..20 at z=1 clear except the step (16..19).
- Peristyle garden court x11..24, z35..41 (ground y1): outer ring `gravel` (all cells with x=11, x=24, z=35, z=41); lawn `grass_block`; beds W x12..14,z36..40 and E x21..23,z36..40 (`gardenBed`, flowers: W bed `poppy` at z37, `azure_bluet` at z39; E bed `allium` at z37, `cornflower` at z39; hedge border); fountain x15..20,z36..40 (the cells x15..20 z36..40 between beds, rim ring and 4x3 water); statues at (13,38) and (22,38) in the bed centres, and at the walkway corners (8,33) and (27,33); `rose_bush` at (11,2,35),(24,2,35) and `lilac` at (11,2,41),(24,2,41) (they stand on the gravel ring corners: replace those four gravel cells with `grass_block` y1 first).
- Walkway benches: `quartz_stairs` facing the court at (13,2,43),(22,2,43) (south walkway) and (13,2,33),(22,2,33) (north walkway), stairs half=bottom.
- Lamps (bronze): hangLamp at colonnade: (12,33),(15,33),(20,33),(23,33),(8,36),(8,40),(27,36),(27,40),(12,43),(15,43),(20,43),(23,43) (12 lamps, chain y5, lantern y4) - these cells are walkway cells. Atrium: hangLamp at (12,11),(23,11),(12,20),(23,20) in the ring ceilings (cells under y6 ceiling) = 4 more. Fauces: lampStand at (16,3) and (19,3). Rear: lampStand at (16,44) and (19,44).
- Pots (`pot`): at the four atrium corners (10,10),(25,10),(10,21),(25,21), at the tablinum south pilasters (14,32),(21,32), on the walkway at (9,33),(26,33),(9,43),(26,43), rear lane (16,46),(19,46). Plants cycle fern, azalea, flowering_azalea, cornflower, allium.
- Rear lane z46..47: `gravel`/`dirt_path`, nothing else.

## PARTS (each a 12-minute job; order = build order)
1. P1 `parts/shell.mjs` - MASSING AND SHELL. Foundation y0 (stone_bricks; dirt under the garden; `blue_terracotta` under the pool), floor y1 laid per ROOMS (mosaic helper; not at the garden court / pool cells), every wall line with its openings left unset (wallLine, ROOMS/OPENINGS lists), outer walls, fauces side walls, pilasters at (15,z2),(20,z2) (`pilaster`), ceiling y6 `spruce_planks` over every room, the ring walkways, with the holes listed (compluvium, garden court, flue (2,6,26)), y6 cornice. Ticks E1, E2 (walls), E5 (rooms), E7 (ceiling hole), E10, E11 (court void), E19, E21, E22, E23, E26 (opening).
2. P2 `parts/roofs.mjs` - ROOFS. All 16 pieces in the table, via `mcd roof` / `roof()` with preset `temple` + overrides, dry-run first; compluvium and garden holes open; pediment (E30); kitchen chimney stack (E31). Ticks E20, E30, E31.
3. P3 `parts/street.mjs` - STREET FRONT. Sidewalk, kerb, step, fauces doors + fanlight + lintel row, shopWindow counters and pots, shutters, lampstands and pots on the sidewalk. Ticks E3, E4, E5 (counters), E6, E29.
4. P4 `parts/atrium.mjs` - ATRIUM + INTERIOR JOINERY. Impluvium water and coping, tuscanColumn x4, dark-oak edge beams, atrium niches/statues (11,12),(24,12), pilasters framing atrium/tablinum/fauces openings, ALL interior `doorway`s on the OPENINGS table marked P4, atrium hangLamps and corner pots. Ticks E7 (beams), E8, E9, E10 (pilasters), E16 (niches), E24 (atrium lamps), E25 (atrium pots).
5. P5 `parts/peristyle.mjs` - PERISTYLE GARDEN. 18 columns, architrave y6, stylobate, garden ground, gravel ring, beds with hedges and flowers, fountain, 4 statues, benches, doorways on x=6/x=29, pilasters at z=31 (x14,x21), colonnade hangLamps. Ticks E11..E16, E12, E24 (colonnade lamps).
6. P6 `parts/finish.mjs` - FINISH. Window grilles on all x=0/x=35/z=45 windows, rear door pair and rear lane, back-wall windows, remaining lampstands and pots, final look: render from the street, down the axis (`--eye 17.5,3.6,0 --look 17.5,3.6,40`), and from above. Ticks E24, E25, E26, E28, E27 (shell only).

Checklist (workers tick):
- [x] P1 shell  - [ ] P2 roofs  - [ ] P3 street  - [ ] P4 atrium  - [ ] P5 peristyle  - [ ] P6 finish

## NOTES for workers
- Windows line up with rooms: shop windows with shops, x=0/x=35 windows with the rooms named in ROOMS.
- Doors: `spruce_door` facing = the side the door faces when closed, open them (`open=true`) in the fauces so the player walks in; interior doorways may stay closed (inspector walk treats a door as passable) but prefer open=true for the inspector.
- Water: the pool (x15..20,z14..17) and fountain (x16..19,z37..39) are the only water; both are enclosed below and on all four sides by non-air blocks. `water_cauldron` is not a water source: it is just a block.
- The roof tool strips y>=7 in its footprint: run it once, after P1. Nothing else may exceed y6 in the house footprint (statues reach y5; chimney is P2's).
- Mirror everything with x' = 35 - x; asymmetric items: none, except the lararium (C6, SW) vs storeroom (C8, SE).
- Room designers: floors and walls are done; place furniture only on y2.. in air, keep a 1-wide walkable line from each door to the room's centre, never in a doorway cell or a window cell.
- P1 (shell) built: foundation y0, floors y1 per ROOMS, wall lines y1..6 with every OPENINGS cell air (interior doorways at y2..3 too), fauces pilasters + smooth_quartz lintel (x16..19, y6, z2), spruce ceiling y6 with the compluvium, garden court and flue holes. Elements touched by P1: E1, E2, E5, E7 (hole), E10, E11 (court void), E19 (room shell), E21, E22, E23, E26 (opening). P1 additions/simplifications: solid z=38 gap walls at x1..5 and x30..34 (between C5/C6 and C7/C8, not in the PARTS list); triclinium border depth-1 ring is `red_terracotta` (the meander is not built); garden court and column stylobate cells at y1 left unset for P5.
- CONFLICT for P4/P5: P1's wall lines already occupy y2..6 at the pilaster cells (15,9),(20,9),(14,22),(21,22),(14,31),(21,31) as plaster, so those pilaster writes will be REFUSED by runParts. Decide in P4/P5 whether to keep the plaster or to write the pilasters there (P1 cannot leave them air without opening the wall).

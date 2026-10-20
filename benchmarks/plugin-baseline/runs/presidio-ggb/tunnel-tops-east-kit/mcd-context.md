# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# Presidio Tunnel Tops, east half: plan

## SITE

Plot 0: x 0..85 (west to east), z 0..145 (north to south), y 0..30. The plan is in site orientation: north (-z) is the low Crissy Field / Bay side and south (+z) is the high Main Post side. This is a landscape module, so there is no street front. The hero view looks north over it toward the Bay.

**Reading the maps.** Each map character covers 2 x 2 blocks: map column c is x 2c..2c+1, and map row r is z 2r..2r+1. "Map height" H(x,z) means the digit of that cell.

**Ground rule (every column, every part):**

| layer | block |
|---|---|
| y 1 | stone (clay under water cells) |
| y 2 .. H-1 | dirt |
| y H | the surface: grass_block on lawns and beds, smooth_sandstone on park paths, the paving on W cells |
| H = 1 | the surface block sits at y 1 itself |

- The outermost 2 blocks of every edge (x 0..1, x 84..85, z 0..1, z 144..145) stay exactly at map height. Inside the park, regrade by 1-2 blocks at most, and only where this plan says so.
- **On paths,** a 1-block rise is a smooth_sandstone_slab half step: 3 half steps, then a level landing 2 long.
- **On lawns,** a 1-block rise gets a ring of mossy_cobblestone_slab on the lower cell, which reads as low stone edging.
- **In planting beds,** a rise is softened by a moss_block or azalea_leaves mound.
- **Under B cells ('?' on the height map):** flat grass_block at the most common height of the cells around the footprint, with nothing on top. These footprints are B1 x 16..33 z 16..23, the Main Post blocks at z 84..145 x 64..85, and z 120..145 x 4..47.

**West seam at x 0..1 (it meets the sister west-half module):**

| z | at x 0..1 |
|---|---|
| 18..42 | Outpost gravel |
| 46..48 | the main path, smooth_sandstone, 3 wide |
| 54..84 | big-lawn grass |
| all other z | grass planting bed |

All of it at map height.

**Masses and features:**

| # | feature | x0..x1 | y0..y1 | z0..z1 | notes |
|---|---|---|---|---|---|
| 1 | Field Station pavilion | 4..14 | 3..9 | 23..32 | floor block y3 (stand y4), walls y4..8, flat roof deck y9; roof overhang to x3..15, z21..33 |
| 1a | Station deck (front, north) | 4..14 | 3 | 19..22 | spruce_planks flush at y3; z21..22 lies under the roof overhang |
| 2 | Outpost play area (east end) | 0..20 | 3..7 | 34..44 + 16..20 / 24..33 (east of station) | gravel at map height (y3; y4 at x0..7 z40..43, step softened with andesite_slab) |
| 3 | Big Lawn (east end) | 0..9 | 6..7 | 54..84 | open mown grass_block at map height, no plants |
| 4 | East Meadow mound | centre (22, 73) | 7..8 | | lawn r < 9.5; raised to y8 inside r < 6 (slab ring at r 6); ring path 2 wide at 9.5 <= r < 11.5, surface y7 |
| 5 | Picnic terraces | 20..58 | 4..6 | 40..59 | terrace A y4 z40..44; B y5 z45..50; C y6 z51..59 |
| 6 | Campfire circle (sunken) | centre (48, 97), r 10 | 4..8 | 87..107 | floor y4 r < 3.5; seat rings y5 / y6 / y7; rim path y7 at 8 <= r < 10 |
| 7 | East tunnel portal face | 74..75 | 2..7 | 46..65 | east-facing concrete face; park lid above at y6 |
| 7a | North bore (mouth + tunnel) | 65..75 | 3..5 air | 48..53 | road y2, back wall at x65 |
| 7b | South bore | 65..75 | 3..5 air | 57..62 | as 7a; centre pier z54..56 |
| 7c | North wing retaining wall | 74..75 | 2..6 | 36..45 | top steps from y6 at z45 down to y4 at z36 (follows map) |
| 7d | South wing retaining wall | 74..75 | 2..6 | 66..83 | top steps from y6 at z66 to y4 at z83 |
| 7e | Parkway apron (road) | 76..83 | 2 | 46..63 | gray_concrete; x84..85 at map height via slab |
| 7f | Lid walk (W cells on the lid) | 66..73 | 6 | 50..55 | smooth_stone paving to the parapet |
| 8 | Overlook terraces | 2..44 | 6..8 | 94..112 | 3 levels: y6 z94..99, y7 z100..105, y8 z106..110; promenade = W band south of it |
| 9 | Planting drifts | all remaining P and '.' cells | H | | see MATERIALS for the drift recipes |
| 10 | Roads and walks outside the park | W cells | H | | see MATERIALS |

**Paths** are pale decomposed granite: smooth_sandstone, following the ground, curving through the waypoints below. Widths are in blocks. Each path is a smooth curve (Catmull-Rom) through its points (x, z).

| path | width | waypoints |
|---|---|---|
| P1 main spine | 3 | (40,13) (39,24) (32,34) (22,44) (10,47) (0,47) |
| P2 meadow ring | 2 | circle around (22,73), 9.5 <= r < 11.5 |
| P3 east spine | 3 | (62,13) (63,28) (58,40) (52,50) (42,60) (32,67) (meets P2) |
| P4 picnic link (terrace A's walk) | 3 | (22,44) (34,43) (48,43) (58,40) |
| P5 west descent | 2 | (12,82) (10,90) (12,96) (14,100), into the overlook |
| P6 campfire north | 2 | (32,77) (40,82) (48,87) (campfire north aisle) |
| P7 campfire south | 2 | (48,107) (50,112) (into the W promenade) |
| P8 lid path | 2 | (52,50) (62,52) (66,52) (joins 7f) |
| P9 picnic stair-ramps | 3 | x 30..32 and x 46..48 crossing terrace walls z44/45 and z50/51 by slab half steps |
| P10 overlook link | 2 | (22,84) (26,92) (34,98) (40,98) (campfire west rim) |

## ROOFS

There is one roof, on the Field Station: a flat cantilever deck, preset `cafe`, with these overrides:

| key | value |
|---|---|
| material | dark_oak |
| footprint | x4..14, z23..32 |
| y | 9 |
| overhang | N2 S1 E1 W1 (deck x3..15, z21..33) |
| fascia | stripped_dark_oak_log |

- The soffit (spruce) shows over the deck.
- There are no other roofs.
- Umbrellas at the picnic tables are banners on fence poles, placed by hand.

## FACADES

**Field Station.** A low modern pavilion: dark timber posts, glass between them, and a deep dark roof slab.

| face | composition |
|---|---|
| North (z23, faces the view) | Posts of stripped_dark_oak_log (axis y) at x4, 7, 11, 14, y4..8. Glass x5..6, 8..10, 12..13 at y4..7. Head band y8 in dark_oak_planks over the glass. The door replaces the glass at x9..10, y4..5. |
| East (x14) | Posts at z23, 27, 32. Glass z24..26 and 28..31, y4..7. Head band y8. |
| West (x4) | dark_oak_planks cladding y4..8, one window z27..29 y5..6 (glass). |
| South (z32) | dark_oak_planks cladding, service door x6 y4..5, glass slot x9..12 y6..7. |
| Base | The floor y3 of polished_andesite runs 1 proud under every face as a plinth line. There are no quoins or cornice: the roof slab is the cornice. |

**Seating walls (picnic terraces and overlook).**
- Body: white_terracotta, rising from the lower terrace to the upper terrace level.
- Cap: a birch_slab (bottom) on top, half a block above the upper terrace. It reads as a pale concrete wall with a timber seat.
- Each wall is 1 thick and curves gently along its line (±1 z over 10 x).

**Tunnel portal (x75 face, facing east).**
- Face: light_gray_concrete, y2..6, z46..65, 2 thick (x74..75).
- Mouths: recessed through the face, 6 wide x 3 high (y3..5), framed by a 1-wide smooth_stone surround standing 1 proud at x76 (jambs y3..5 plus a lintel y6).
- Centre pier: z54..56.
- Coping: smooth_stone at y6 along x74..75.
- Rail: iron_bars at y7, x75, z36..83, along the coping and the wing walls.
- Lights: 3 hanging lanterns inside each mouth's ceiling, at x73, z49 / 51 / 53 and z57 / 59 / 61.
- Tunnel interior: walls light_gray_concrete; back wall black_concrete at x65, so the mouths read dark.

## MATERIALS

| role | block |
|---|---|
| ground fill | stone (y1), dirt |
| lawn / bed surface | grass_block (beds may take 15% coarse_dirt / rooted_dirt mulch patches) |
| park paths | smooth_sandstone; smooth_sandstone_slab half steps; smooth_sandstone_stairs in campfire aisles only |
| seating walls | white_terracotta body, birch_slab seat cap |
| benches | birch_stairs as seats (opening north, stair facing south) with birch_slab ends; 3-5 long on the overlook and terraces |
| picnic tables | birch_fence legs + birch_slab (type top) table; birch_stairs benches either side |
| umbrellas | birch_fence pole 3 tall + orange_banner on top (alternate white_banner) |
| lamp posts | polished_blackstone_wall x3 + lantern (standing) on top |
| wall lanterns | lantern hung under the seat cap's overhang or set on the wall top at path ends |
| hidden light | shroomlight as the surface block under a moss_carpet, inside beds |
| Field Station | stripped_dark_oak_log posts and fascia, dark_oak_planks cladding, glass panes / glass, polished_andesite floor, dark_oak roof (cafe preset), spruce_planks deck, dark_oak_door double |
| Outpost | gravel ground; stripped_spruce_log play logs; spruce_log posts; andesite / tuff boulders with moss_carpet |
| campfire circle | floor stone_bricks; ring of stone_brick_slab around a lit campfire; treads smooth_sandstone; risers white_terracotta; birch_slab seats |
| portal | light_gray_concrete face, smooth_stone surround and coping, black_concrete tunnel back, iron_bars rail |
| roads (W, long straight) | gray_concrete; white_concrete dashed centre; yellow_concrete double line on the parkway median line z55..56 |
| walks and plazas (W, other) | smooth_stone with light_gray_concrete bands every 6 |
| water (T) | none on this map |
| Monterey cypress | dark_oak_log trunk (2-3 high, sometimes forked); flat, layered, wind-swept crown of dark_oak_leaves + spruce_leaves (2:1), 7-11 wide, 3 layers thick, top flat, leaning north-east |
| Monterey pine | spruce_log trunk 6-8; umbrella crown of spruce_leaves 7-9 wide, 2 layers |
| young meadow trees | birch_log 4 + azalea_leaves / birch_leaves crown 3-5 |
| coastal shrubs | azalea_leaves, spruce_leaves, flowering_azalea_leaves mounds 1-2 high, 2-4 wide |

All leaves are persistent.

**Drift recipes.** Each bed is 6-20 blocks long, with irregular edges. Neighbouring beds differ. Mix by area:

| drift | mix |
|---|---|
| grey-green | moss_carpet 40%, azalea_leaves mounds, fern, short_grass |
| ochre | tall_grass, short_grass, dead_bush, a few sunflowers (≤1 per 40 cells) |
| purple-blue | allium, cornflower, flowering_azalea_leaves mounds, lilac |
| coastal scrub | sweet_berry_bush (age 3), fern, spruce_leaves mounds |
| accent (sparingly, near the paths) | torchflower and orange_tulip (the concept's orange pincushions) |

## OPENINGS

**Field Station** (the only building):

| opening | position | size |
|---|---|---|
| main door | north face z23, x9..10, y4..5 | double dark_oak_door, faces north onto the deck; the deck at y3 is flush with the floor y3 (no step) |
| service door | south face z32, x6, y4..5 | single door |
| north glass | z23: x5..6, x8 (y4..7); x9..10 (y6..7, over the door); x12..13 (y4..7) | |
| east glass | x14: z24..26, z28..31, y4..7 | |
| west window | x4: z27..29, y5..6 | |
| south slot | z32: x9..12, y6..7 | |

**Tunnel mouths** (open voids, nothing in them):

| mouth | x | z | y |
|---|---|---|---|
| north | 74..75 | 48..53 | 3..5 |
| south | 74..75 | 57..62 | 3..5 |

## RESERVED

| cells | for |
|---|---|
| bores x65..75, z48..53 and z57..62, y3..5 | air; road surface y2 inside; nothing planted or filled |
| campfire hearth (48, 5, 97) | lit campfire on the floor block (48, 4, 97); stone_brick_slab ring on the 8 cells around it at y5 |
| campfire aisles x47..49 (north z87..94, south z100..107) | stairs/slabs only, kept clear of seats |
| lid over the bores x65..73, z48..62 | surface only (1 block of soil over the bores): no tree trunks, only low planting, the lid walk and P8 |
| Field Station footprint x4..14 z23..32, y4..8 | the station alone (no planting); deck x4..14 z19..22 kept clear |
| B footprints | flat ground, nothing on them |
| picnic table spots | terrace A: (32,42), (44,42); terrace C: (26,54), (34,56), (42,54), (50,56); each table 2x1 along x with a bench row either side (z ±1) |
| tree trunks | see the list below |

**Tree trunks:**

| type | trunks (x, z) |
|---|---|
| Cypress | (62,18) (68,24) (64,32) (70,38) (66,43) (24,14) (44,16) (54,14) (62,70) (67,76) (60,82) (56,86) (36,95) (40,87) (56,87) (60,96) (58,104) (38,104) (4,92) (30,92) |
| Pine | (56,26) (46,30) (8,52) (44,70) (58,62) |
| Young meadow trees | (22,59) (35,66) (36,80) (9,80) (8,66) (22,87) |

Shift a trunk 1-2 blocks if it lands on a path.

**Lighting** (nothing may spawn):
- Lamp posts every 8 blocks along every path, alternating sides, 1 cell off the path edge.
- Lamp posts at every path fork and every seating wall's ends.
- 6 lamp posts on the campfire rim (r 9) and 8 on the meadow ring's outer edge.
- Lanterns on the seating wall tops every 6 blocks.
- 2 lanterns on posts at the station deck's north corners (x4 and x14, z19).
- Inside beds and the big lawn's planting margins: a shroomlight under moss_carpet at every cell with x ≡ 6 (mod 12) and z ≡ 6 (mod 12) that is more than 8 blocks from a lamp.
- On W roads: lamp posts on the walk edges every 10 blocks.

## FLOORS

| volume | floor y (stand on) | interior |
|---|---|---|
| Field Station, single tall storey | floor block y3, stand y4 | x5..13, z24..31, y4..8 (5 clear), ceiling under the y9 roof deck; no upper storey |
| Station deck | y3 (stand y4) | x4..14, z19..22 |
| Picnic terrace A / B / C | y4 / y5 / y6 surface | x20..58; A z40..44, B z45..50, C z51..59 |
| Campfire circle | floor y4, rings y5 / y6 / y7 | centre (48,97); floor r < 3.5; seat rings 3.5-5, 5-6.5, 6.5-8 |
| Overlook levels | y6 / y7 / y8 | x2..44; z94..99 / z100..105 / z106..110; seating walls at z99/100 (x8..36) and z105/106 (x4..40), benches on each level facing north |
| Meadow mound | y7 lawn, y8 crown | r < 6 crown, r < 9.5 lawn |
| Tunnel road | y2 | bores and apron x65..83 |

# DESIGNER SECTIONS

## PALETTE

Architect's ids kept exactly; every id checked with `$MCD blocks --check` (all known).

| role | blocks (with variants) |
|---|---|
| ground | stone, dirt, grass_block, coarse_dirt, rooted_dirt, podzol, gravel, clay |
| paths | smooth_sandstone, smooth_sandstone_slab (bottom, half steps), smooth_sandstone_stairs (aisles) |
| lawn edge | mossy_cobblestone_slab |
| seating | white_terracotta, birch_slab (bottom), birch_stairs (facing south, half bottom), birch_fence |
| campfire | stone_bricks, stone_brick_slab, campfire (lit true, signal_fire true), hay_block hidden under it |
| station | stripped_dark_oak_log (axis y), dark_oak_planks, dark_oak_slab, glass, glass_pane, dark_oak_door, polished_andesite, spruce_planks, spruce_slab |
| outpost | gravel, stripped_spruce_log (axis x/z), spruce_log (axis y), andesite, tuff, andesite_slab, moss_carpet |
| portal | light_gray_concrete, black_concrete, smooth_stone, smooth_stone_slab, iron_bars, lantern (hanging true), gray_concrete, white_concrete, yellow_concrete |
| lights | polished_blackstone_wall, lantern (hanging false), shroomlight, moss_carpet |
| planting | moss_block, moss_carpet, azalea_leaves, flowering_azalea_leaves, spruce_leaves, dark_oak_leaves, birch_leaves (all persistent true), fern, short_grass, tall_grass, dead_bush, sunflower, allium, cornflower, lilac, sweet_berry_bush (age 3), torchflower, orange_tulip |
| trees | dark_oak_log, spruce_log, birch_log |
| umbrellas | orange_banner, white_banner on birch_fence |

## VOCABULARY

- `groundColumn(x,z,H,surface)`: y1 stone, y2..H-1 dirt, y H surface block.
- `pathRibbon(points, width, step)`: Catmull-Rom sampled every 0.5; stamp smooth_sandstone width wide at the surface; where H rises by 1 along the path, the lower cell becomes smooth_sandstone_slab (bottom) half step, 3 then a 2-long landing.
- `roadStrip(box, axis)`: gray_concrete surface; white_concrete dash every 4 on the centre; yellow_concrete double line z55..56 on the apron.
- `walkPaving(box)`: smooth_stone, with a light_gray_concrete row every 6.
- `moundLawn(cx,cz,rLawn,rCrown,y)`: grass_block discs, crown +1, mossy_cobblestone_slab ring at the crown edge.
- `seatingWall(x0,x1,z,yLow,yHigh)`: white_terracotta from the lower surface to the upper level, birch_slab (bottom) cap, ±1 z wobble per 10 x; a lantern on the cap every 6.
- `amphitheatreRing(cx,cz)`: disc floor stone_bricks r<3.5; rings by radius 3.5-5 / 5-6.5 / 6.5-8 stepped y5/y6/y7, each ring a smooth_sandstone tread with a white_terracotta riser and a birch_slab seat row on the outer cells; campfire hearth; rim path r8..10 at y7.
- `portalFace()` and `tunnelBore(z0,z1)`: face, 6x3 mouths, surround, coping, rail, black back wall, hanging lanterns.
- `stationShell()`, `stationRoof()` (roof.json: preset cafe, dark_oak, footprint x4..14 z23..32, y9, overhang N2 S1 E1 W1, fascia stripped_dark_oak_log), `deck()`.
- `playLog(x,z,len,axis)`: stripped_spruce_log lying at y4 on gravel; `boulder(x,z,r)`: andesite/tuff blob 2-3 wide, moss_carpet on top.
- `drift(kind, polygon)`: irregular bed by plan recipe; shrubs are leaf mounds 1-2 high.
- `cypress(x,z)`: dark_oak_log 2-3, flat 3-layer crown 7-11 wide of dark_oak_leaves and spruce_leaves 2:1, leaning NE; `pine(x,z)`: spruce_log 6-8, 2-layer umbrella 7-9 wide; `youngTree(x,z)`: birch_log 4, azalea or birch leaves 3-5.
- `bench(x,y,z,len)`: birch_stairs facing south in a row, birch_slab ends; `picnicTable(x,y,z)`: 2 birch_fence legs, top birch_slab on them, benches z±1; `umbrella(x,y,z,colour)`: birch_fence 3 tall + banner on top.
- `lampPost(x,y,z)`: polished_blackstone_wall x3 + standing lantern; `wallLantern(x,y,z)`; `hiddenLight(x,y,z)`: shroomlight surface under moss_carpet.

## ROOMS

One room: the Field Station interior, x5..13, y4..8, z24..31, floor polished_andesite at y3. Visitor hall of the park's nature pavilion: a bench-and-table area, a small counter, a pinned-plan display of the park (dark timber, light and glass, mood quiet and modern). Ways in: double door x9..10 z23 y4..5 from the deck; service door x6 z32. Windows per the architect. Light inside: hanging lanterns from the soffit.

Entrance: (9,4,21) on the deck. Street: (9,4,17), where link path L1 (2 wide smooth_sandstone, (9,17) to (9,14) to (38,14), flat at y3) joins the main spine P1. The deck is flush with the street ground (no steps).

## PARTS

1. Ground and paths `parts/ground.mjs`: groundColumn over the box, roads, walks, paths P1-P10 + L1, west seam, B cells.
2. Earthworks `parts/earthworks.mjs`: terraces, seating walls, meadow mound, campfire circle, overlook, slab ramps.
3. Tunnel portal `parts/portal.mjs`: face, bores, wings, apron markings, lid walk.
4. Field Station and Outpost `parts/station.mjs`: shell, glazing, doors, deck, roof.json, play logs, boulders.
5. Planting and trees `parts/planting.mjs`: drifts, cypress, pine, young trees.
6. Furnishings and lighting `parts/furnish.mjs`: benches, tables, umbrellas, lamp posts, wall lanterns, hidden lights, hearth campfire.

## NOTES

- Build order matters: ground first; later parts overwrite their cells. Keep y <= 30 and inside x0..85, z0..145.
- Leave bores, B footprints and the station footprint free of planting. Trunks not on the lid, shift 1-2 off paths.
- Nothing stands on a bottom slab except a slab seat placed on a full block. Check with `$MCD check` and `$MCD light`.
- Only 1.21.1 blocks; no pale oak.
```

### elements.md

```markdown
# Required elements (Tunnel Tops east). Coordinates are module x,y,z from plan.md; heights per its ground rule.

Parts: P1 ground, P2 earthworks, P3 portal, P4 station, P5 planting, P6 furnishings. Vocab names in `code`.

- [ ] **Ground, whole box** (P1, `groundColumn`): every column y1 stone, dirt to H-1, surface at H (grass_block / smooth_sandstone / paving). Edges x0..1, x84..85, z0..1, z144..145 exactly at map height. B cells flat grass, empty.
- [ ] **Roads and walks outside the park** (P1, `roadStrip`, `walkPaving`): gray_concrete roads with white_concrete dashes, yellow_concrete double line z55..56 on the parkway apron x76..85; walks smooth_stone with light_gray_concrete band every 6.
- [ ] **Curving decomposed-granite paths P1..P10** (P1, `pathRibbon`): Catmull-Rom through the plan's waypoints, smooth_sandstone, 2-3 wide; rises as smooth_sandstone_slab half steps (3, then landing 2). Forks at P1/P4, P3/P2, P6/P10.
- [ ] **West seam** (P1): Outpost gravel z18..42, main path z46..48 3 wide, big-lawn grass z54..84, planting bed elsewhere, at x0..1.
- [ ] **Field Station** (P4, `stationShell`, `stationRoof`): dark_oak posts, glass walls N and E, dark_oak_planks W and S, polished_andesite floor y3, flat dark_oak cafe roof y9 with deep overhang (roof.json), double dark_oak_door N (x9..10), service door S x6.
- [ ] **Station deck** (P4, `deck`): spruce_planks x4..14 z19..22 y3, under the roof overhang at z21..22; lamp posts at x4 and x14, z19.
- [ ] **Outpost play area east end** (P4, `playLog`, `boulder`): gravel; stripped_spruce_log play logs lying (axis x/z) 3-5 long at y4, a log platform with spruce_log posts, a stripped-log stepping row, andesite/tuff boulders with moss_carpet; x0..20 z18..44 outside the station and deck footprints.
- [ ] **East Meadow mound** (P2, `moundLawn`): lawn r<9.5 about (22,73), crown y8 r<6, mossy_cobblestone_slab ring at r6, pale ring path r 9.5..11.5 (P2), 6 young birch trees on the plan's list.
- [ ] **Big Lawn east end** (P1): open grass_block x0..9 z54..84, no plants, light only by lamp posts at its margins.
- [ ] **Campfire circle** (P2, `amphitheatreRing`): sunken, floor stone_bricks y4 r<3.5; three seat rings (smooth_sandstone treads + white_terracotta risers + birch_slab seats) y5/y6/y7; lit campfire (48,5,97) on (48,4,97) with 8 stone_brick_slab around; aisles x47..49 with smooth_sandstone_stairs; rim path y7; ringed by cypress; 6 lamp posts at r9.
- [ ] **Picnic terraces** (P2, `seatingWall`, P6 `picnicTable`, `umbrella`): terraces A/B/C y4/y5/y6, white_terracotta seating walls with birch_slab caps, P9 slab ramps, 6 tables on the plan's spots, umbrellas, planting beds.
- [ ] **Tunnel portal** (P3, `portalFace`, `tunnelBore`): light_gray_concrete face x74..75 y2..6 z46..65, two mouths 6x3 with smooth_stone surround proud at x76, pier z54..56, smooth_stone coping y6, iron_bars rail y7, 3 hanging lanterns per mouth at x73, black_concrete back wall x65, road y2, lid walk 7f, wing walls 7c/7d.
- [ ] **Overlook terraces** (P2, `seatingWall`; P6 `bench`): levels y6/y7/y8, white_terracotta walls with birch_slab caps at z99/100 and z105/106, birch benches facing north, promenade, planters, lamps.
- [ ] **Native planting drifts** (P5, `drift`): grey-green, ochre, purple-blue, scrub, accent per plan recipes in irregular beds 6-20 long between paths; leaf shrubs 1-2 high.
- [ ] **Monterey cypress and pine** (P5, `cypress`, `pine`): trunks per the plan list; clumps heavy on the east edge; all leaves persistent.
- [ ] **Benches** (P6, `bench`): birch_stairs seats + birch_slab ends, 3-5 long, opening north.
- [ ] **Lamp posts and lanterns** (P6, `lampPost`, `wallLantern`, `hiddenLight`): per plan Lighting; no dark spawnable cell.
```

### rooms.json

```json
{"entrance":[9,4,21],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "ground": ["stone", "dirt", "grass_block", "coarse_dirt", "rooted_dirt", "podzol", "gravel", "clay"],
    "paths": ["smooth_sandstone", "smooth_sandstone_slab", "smooth_sandstone_stairs"],
    "lawnEdge": ["mossy_cobblestone_slab"],
    "seating": ["white_terracotta", "birch_slab", "birch_stairs", "birch_fence"],
    "campfire": ["stone_bricks", "stone_brick_slab", "campfire", "hay_block"],
    "station": ["stripped_dark_oak_log", "dark_oak_planks", "dark_oak_slab", "glass", "glass_pane", "dark_oak_door", "polished_andesite", "spruce_planks", "spruce_slab"],
    "outpost": ["gravel", "stripped_spruce_log", "spruce_log", "andesite", "tuff", "andesite_slab", "moss_carpet"],
    "portal": ["light_gray_concrete", "black_concrete", "smooth_stone", "smooth_stone_slab", "iron_bars", "lantern", "gray_concrete", "white_concrete", "yellow_concrete"],
    "lights": ["polished_blackstone_wall", "lantern", "shroomlight", "moss_carpet"],
    "planting": ["moss_block", "moss_carpet", "azalea_leaves", "flowering_azalea_leaves", "spruce_leaves", "dark_oak_leaves", "birch_leaves", "fern", "short_grass", "tall_grass", "dead_bush", "sunflower", "allium", "cornflower", "lilac", "sweet_berry_bush", "torchflower", "orange_tulip"],
    "trees": ["dark_oak_log", "spruce_log", "birch_log"],
    "umbrellas": ["birch_fence"]
  },
  "objects": ["orange_banner", "white_banner"]
}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build to a temp file in this directory, then move it into place (so a failed run
# never leaves a half-written build.nbt). Runs the same in every part copy; the stubs or unfinished parts never fail it.
set -eu
cd "$(dirname "$0")"
tmp=$(mktemp ./build.tmp.XXXXXX)
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
chmod 644 "$tmp"
mv "$tmp" build.nbt
trap - EXIT
```

### build.mjs

```js
// Presidio Tunnel Tops, east half: the full site grid, the base stone layer, then the six parts in plan order.
// Usage: node build.mjs <out.nbt>   (make.sh writes a temp file and moves it into place)
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_X, SITE_Z, SITE_Y_MAX, GROUND_BASE_Y, STONE } from "./vocab/base.mjs";
import { build as ground } from "./parts/ground.mjs";
import { build as earthworks } from "./parts/earthworks.mjs";
import { build as portal } from "./parts/portal.mjs";
import { build as station } from "./parts/station.mjs";
import { build as planting } from "./parts/planting.mjs";
import { build as furnish } from "./parts/furnish.mjs";

const out = process.argv[2] ?? "build.nbt";

// the full site: x 0..85, y 0..30, z 0..145 (86 x 31 x 146), 1.21.1 data version for the server
const g = new Grid([SITE_X[1] + 1, SITE_Y_MAX + 1, SITE_Z[1] + 1], { dataVersion: DATA_VERSIONS["1.21.1"] });

// base layer: stone at y1 over the whole site. The ground part lays groundColumn over it up to the height map; cells
// set here stay writable for it (runParts only locks what the parts place).
g.fill([SITE_X[0], GROUND_BASE_Y, SITE_Z[0]], [SITE_X[1], GROUND_BASE_Y, SITE_Z[1]], STONE);

runParts(g, [
  ["Ground and paths", ground],
  ["Earthworks", earthworks],
  ["Tunnel portal", portal],
  ["Field Station and Outpost", station],
  ["Planting and trees", planting],
  ["Furnishings and lighting", furnish],
], { palette: "palette.json", roof: "roof.json" });

g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for every part: the palette's block ids (palette.json only), plan.md's site coordinates, a seeded rng.
// Coordinates are module x, y, z. Boxes are [x0, x1, z0, z1] (inclusive) unless the name says otherwise.

// ---- site ---------------------------------------------------------------------------------------------------------

// ---- site ---------------------------------------------------------------------------------------------------------
/** Site x range, inclusive: x 0..85 (west to east). */
export const SITE_X = [0, 85];

/** Site z range, inclusive: z 0..145 (north at z 0, south at z 145). */
export const SITE_Z = [0, 145];

/** Highest y a part may build: y 0..30. */
export const SITE_Y_MAX = 30;

/** Base stone layer y (the ground rule's y1); build.mjs lays it, the ground part lays the rest up to the height map. */
export const GROUND_BASE_Y = 1;

// ---- palette: ground ----------------------------------------------------------------------------------------------
/** ground: y1 fill and the body under the surface. */
export const STONE = "stone";

/** ground: subsoil y2..H-1. */
export const DIRT = "dirt";

/** ground: lawn and bed surface. */
export const GRASS_BLOCK = "grass_block";

/** ground: bed mulch patches (15%). */
export const COARSE_DIRT = "coarse_dirt";

/** ground: bed mulch patches (15%). */
export const ROOTED_DIRT = "rooted_dirt";

/** ground: bed mulch patches. */
export const PODZOL = "podzol";

/** ground: Outpost play area ground. */
export const GRAVEL = "gravel";

/** ground: fill under water cells (no water on this map). */
export const CLAY = "clay";

// ---- palette: paths and lawn edge ---------------------------------------------------------------------------------
/** paths: pale decomposed granite surface. */
export const SMOOTH_SANDSTONE = "smooth_sandstone";

/** paths: half steps (bottom type). */
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";

/** paths: campfire aisles only. */
export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";

/** lawnEdge: low stone edging on the lower cell of a lawn rise. */
export const MOSSY_COBBLESTONE_SLAB = "mossy_cobblestone_slab";

// ---- palette: seating and earthworks ------------------------------------------------------------------------------
/** seating: body of seating walls. */
export const WHITE_TERRACOTTA = "white_terracotta";

/** seating: wall cap and bench ends (bottom type). */
export const BIRCH_SLAB = "birch_slab";

/** seating: bench seats (facing south, half bottom). */
export const BIRCH_STAIRS = "birch_stairs";

/** seating: picnic table legs, umbrella poles. */
export const BIRCH_FENCE = "birch_fence";

// ---- palette: campfire --------------------------------------------------------------------------------------------
/** campfire: circle floor. */
export const STONE_BRICKS = "stone_bricks";

/** campfire: ring around the hearth, seat rows. */
export const STONE_BRICK_SLAB = "stone_brick_slab";

/** campfire: lit hearth (lit true, signal_fire true). */
export const CAMPFIRE = "campfire";

/** campfire: hidden under the campfire. */
export const HAY_BLOCK = "hay_block";

// ---- palette: Field Station ---------------------------------------------------------------------------------------
/** station: posts and fascia (axis y). */
export const STRIPPED_DARK_OAK_LOG = "stripped_dark_oak_log";

/** station: cladding. */
export const DARK_OAK_PLANKS = "dark_oak_planks";

/** station: cladding caps. */
export const DARK_OAK_SLAB = "dark_oak_slab";

/** station: glazing. */
export const GLASS = "glass";

/** station: glazing panes. */
export const GLASS_PANE = "glass_pane";

/** station: double door. */
export const DARK_OAK_DOOR = "dark_oak_door";

/** station: floor and plinth line. */
export const POLISHED_ANDESITE = "polished_andesite";

/** station: deck. */
export const SPRUCE_PLANKS = "spruce_planks";

/** station: deck edge. */
export const SPRUCE_SLAB = "spruce_slab";

// ---- palette: Outpost ---------------------------------------------------------------------------------------------
/** outpost: play logs lying on gravel (axis x or z). */
export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log";

/** outpost posts (axis y); also the Monterey pine trunks (6-8 high). */
export const SPRUCE_LOG = "spruce_log";

/** outpost: boulders. */
export const ANDESITE = "andesite";

/** outpost: boulders. */
export const TUFF = "tuff";

/** outpost: step softening. */
export const ANDESITE_SLAB = "andesite_slab";

/** outpost, lights, planting: moss on boulders, beds, and under shroomlights. */
export const MOSS_CARPET = "moss_carpet";

// ---- palette: tunnel portal ---------------------------------------------------------------------------------------
/** portal: the east-facing face and the wing walls' concrete. */
export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";

/** portal: the tunnel back wall (mouths read dark). */
export const BLACK_CONCRETE = "black_concrete";

/** portal: mouth surround, coping, lid walk paving. */
export const SMOOTH_STONE = "smooth_stone";

/** portal: half-step surround and lid edges. */
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";

/** portal: parapet rail on the coping and wing walls. */
export const IRON_BARS = "iron_bars";

/** portal and lights: hanging lanterns (hanging true) and standing lanterns (hanging false). */
export const LANTERN = "lantern";

/** portal, roads: road and apron body. */
export const GRAY_CONCRETE = "gray_concrete";

/** portal, roads: dashed centre line and walk bands. */
export const WHITE_CONCRETE = "white_concrete";

/** portal, roads: double line on the parkway median. */
export const YELLOW_CONCRETE = "yellow_concrete";

// ---- palette: lights ----------------------------------------------------------------------------------------------
/** lights: lamp post column (three blocks). */
export const POLISHED_BLACKSTONE_WALL = "polished_blackstone_wall";

/** lights: hidden light, the surface block under moss carpet. */
export const SHROOMLIGHT = "shroomlight";

// ---- palette: planting --------------------------------------------------------------------------------------------
/** planting: moss mounds and carpets. */
export const MOSS_BLOCK = "moss_block";

/** planting: shrub mounds (persistent). */
export const AZALEA_LEAVES = "azalea_leaves";

/** planting: shrub mounds, purple-blue drift (persistent). */
export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves";

/** planting: shrub mounds, cypress and pine crowns (persistent). */
export const SPRUCE_LEAVES = "spruce_leaves";

/** planting: cypress crowns (persistent). */
export const DARK_OAK_LEAVES = "dark_oak_leaves";

/** planting: young meadow tree crowns (persistent). */
export const BIRCH_LEAVES = "birch_leaves";

/** planting: grey-green drift. */
export const FERN = "fern";

/** planting: grey-green and ochre drifts. */
export const SHORT_GRASS = "short_grass";

/** planting: ochre drift. */
export const TALL_GRASS = "tall_grass";

/** planting: ochre drift. */
export const DEAD_BUSH = "dead_bush";

/** planting: ochre drift, at most 1 per 40 cells. */
export const SUNFLOWER = "sunflower";

/** planting: purple-blue drift. */
export const ALLIUM = "allium";

/** planting: purple-blue drift. */
export const CORNFLOWER = "cornflower";

/** planting: purple-blue drift. */
export const LILAC = "lilac";

/** planting: coastal scrub drift (age 3). */
export const SWEET_BERRY_BUSH = "sweet_berry_bush";

/** planting: accent drift near the paths. */
export const TORCHFLOWER = "torchflower";

/** planting: accent drift near the paths. */
export const ORANGE_TULIP = "orange_tulip";

// ---- palette: trees -----------------------------------------------------------------------------------------------
/** trees: Monterey cypress trunks (2-3 high). */
export const DARK_OAK_LOG = "dark_oak_log";

// Monterey pine trunks (6-8 high) use SPRUCE_LOG, documented under outpost above.
/** trees: young meadow tree trunks (4 high). */
export const BIRCH_LOG = "birch_log";

// ---- palette: umbrellas -------------------------------------------------------------------------------------------
/** umbrellas: canopy banner (on a birch fence pole). */
export const ORANGE_BANNER = "orange_banner";

/** umbrellas: alternate canopy banner. */
export const WHITE_BANNER = "white_banner";

// ---- site coordinates (plan.md) -----------------------------------------------------------------------------------
/** Field Station pavilion footprint [x0, x1, z0, z1]: walls y4..8, floor y3, roof deck y9. */
export const STATION_BOX = [4, 14, 23, 32];

/** Field Station roof overhang footprint [x0, x1, z0, z1]: deck x3..15, z21..33. */
export const STATION_ROOF_BOX = [3, 15, 21, 33];

/** Station deck [x0, x1, z0, z1] at y3, under the roof overhang at z21..22. */
export const STATION_DECK = [4, 14, 19, 22];

/** Main (north) door x range at z23, y4..5. */
export const STATION_DOOR_N_X = [9, 10];

/** Service (south) door position [x, y, z] at z32, y4..5. */
export const STATION_DOOR_S = [6, 4, 32];

/** Visitor entrance cell on the deck [x, y, z]. */
export const ENTRANCE = [9, 4, 21];

/** Street cell where link L1 joins the main spine [x, y, z]. */
export const STREET = [9, 4, 17];

/** Outpost play area footprints [x0, x1, z0, z1] (east end, two parts). */
export const OUTPOST_BOXES = [[0, 20, 34, 44], [16, 20, 24, 33]];

/** Outpost gravel strip at the west seam, z range (x 0..20). */
export const OUTPOST_GRAVEL_Z = [18, 42];

/** Big Lawn box [x0, x1, z0, z1] at y6..7 (east end; joins the west seam at z 54..84). */
export const BIG_LAWN = [0, 9, 54, 84];

/** Picnic terraces x range; A z40..44 (y4), B z45..50 (y5), C z51..59 (y6). */
export const TERRACE_X = [20, 58];

export const TERRACE_A_Z = [40, 44];

export const TERRACE_B_Z = [45, 50];

export const TERRACE_C_Z = [51, 59];

/** Picnic table spots [x, z]: terrace A, then terrace C (each 2x1 along x, bench row at z +-1). */
export const PICNIC_TABLES = [[32, 42], [44, 42], [26, 54], [34, 56], [42, 54], [50, 56]];

/** East Meadow mound centre [x, z]: lawn r < 9.5 at y7, crown r < 6 at y8, ring path 9.5 <= r < 11.5 at y7. */
export const MEADOW_CENTRE = [22, 73];

export const MEADOW_R = { lawn: 9.5, crownSlab: 6, ringIn: 9.5, ringOut: 11.5 };

/** Campfire circle centre [x, z] and radius: floor y4 r < 3.5; seat rings y5/y6/y7; rim path r 8..10 at y7. */
export const CAMPFIRE_CENTRE = [48, 97];

export const CAMPFIRE_R = 10;

/** Lit campfire [x, y, z]: stands on the floor block y4, so the hearth sits at y5. */
export const CAMPFIRE_HEARTH = [48, 5, 97];

/** Campfire aisles, x range 47..49: north z87..94, south z100..107 (stairs and slabs only). */
export const CAMPFIRE_AISLE_X = [47, 49];

export const CAMPFIRE_AISLE_N_Z = [87, 94];

export const CAMPFIRE_AISLE_S_Z = [100, 107];

/** Overlook terraces [x0, x1, z0, z1]: y6 z94..99, y7 z100..105, y8 z106..110. */
export const OVERLOOK = [2, 44, 94, 110];

/** East tunnel portal face [x0, x1, z0, z1] (concrete, y2..6). */
export const PORTAL_FACE = [74, 75, 46, 65];

/** Tunnel mouths, open voids y3..5 (air). Each is [x0, x1, z0, z1]. */
export const BORE_NORTH = [65, 75, 48, 53];

export const BORE_SOUTH = [65, 75, 57, 62];

export const BORE_Y = [3, 5];

/** Centre pier between the mouths, z range. */
export const PORTAL_PIER_Z = [54, 56];

/** Lid over the bores [x0, x1, z0, z1], surface only at y6. */
export const LID_BOX = [65, 73, 48, 62];

/** Lid walk, W cells on the lid [x0, x1, z0, z1] at y6. */
export const LID_WALK = [66, 73, 50, 55];

/** Parkway apron road box [x0, x1, z0, z1] at y2 (x84..85 at map height via slab). */
export const APRON = [76, 83, 46, 63];

/** North and south wing retaining walls [x0, x1, z0, z1]: x74..75, top y6 stepping to y4. */
export const WING_NORTH = [74, 75, 36, 45];

export const WING_SOUTH = [74, 75, 66, 83];

/** Overlook seating wall z pairs (wall on the lower level's edge, bench on the upper): upper z99/100, lower z105/106. */
export const OVERLOOK_WALL_Z = { upper: [99, 100], lower: [105, 106] };

/** Tree trunk cells [x, z] by type. Shift 1-2 blocks if on a path; not on the lid. */
export const CYPRESS_TRUNKS = [[62, 18], [68, 24], [64, 32], [70, 38], [66, 43], [24, 14], [44, 16], [54, 14], [62, 70], [67, 76], [60, 82], [56, 86], [36, 95], [40, 87], [56, 87], [60, 96], [58, 104], [38, 104], [4, 92], [30, 92]];

export const PINE_TRUNKS = [[56, 26], [46, 30], [8, 52], [44, 70], [58, 62]];

export const YOUNG_TRUNKS = [[22, 59], [35, 66], [36, 80], [9, 80], [8, 66], [22, 87]];

/** Ground-rule building footprints [x0, x1, z0, z1]: flat grass at the surrounding height, nothing on top. */
export const B_FOOTPRINTS = [[16, 33, 16, 23], [64, 85, 84, 145], [4, 47, 120, 145]];

// ---- rng ----------------------------------------------------------------------------------------------------------
/** rng(seed): a seeded generator (mulberry32) returning floats in [0, 1); the same seed gives the same sequence. */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Helpers from plan.md VOCABULARY: groundColumn, walkPaving, amphitheatreRing, stationShell, playLog, cypress, bench,
// lampPost. Each takes the grid first, then its position (and facing where it has one). Each writes only its own
// footprint, and only into air: a filled cell is refused, not overwritten, and the call returns { placed, refused }
// with refused as [x, y, z, block] for every cell it left alone. A surface helper laid over ground an earlier part put
// there (walkPaving, amphitheatreRing, stationShell's floor) takes { over: true }: it may then replace a ground-surface
// block at its own y, and never a cell below it.

/**
 * Ground column at (x, z) up to map height H: stone at y1, dirt y2..H-1, the surface block at y H. H = 1 puts the
 * surface at y1 itself. surface: grass_block on lawns and beds, a path or paving block on the W and path cells.
 */
export function groundColumn(g, x, z, H, surface = "grass_block")

/**
 * Walk paving on the rect [x0, z0, x1, z1] at surface y: smooth_stone, with a light_gray_concrete row every 6 (the rows
 * where z is a multiple of 6, so neighbouring boxes line up).
 */
export function walkPaving(g, [x0, z0, x1, z1], y, { over = false } = {})

/**
 * Sunken amphitheatre centred on (cx, cz), floor at y (4 on the plan). Floor stone_bricks for r < 3.5 with a lit
 * campfire at the centre (hay_block under it, a ring of stone_brick_slab round it at y+1). Seat rings 3.5-5, 5-6.5 and
 * 6.5-8 step up to y+1, y+2, y+3: white_terracotta riser, smooth_sandstone tread, and a birch_slab seat on the outer
 * cell of each ring. Rim path of smooth_sandstone at y+3 for 8 <= r < 10.
 */
export function amphitheatreRing(g, cx, cz, y = 4, { over = false } = {})

/**
 * Field Station shell, footprint x0..x0+10 by z0..z0+9, floor at y0 (3 on the plan), walls y0+1..y0+5 (head band at
 * y0+5). Stripped dark oak posts, glass and dark oak planks as plan.md's FACADES; the double north door (x0+5, x0+6)
 * and the single south door (x0+2) write both halves, facing outward. The roof is stationRoof's, not this helper's.
 */
export function stationShell(g, x0, y0, z0, { over = false } = {})

/**
 * A play log lying at y (4 on the plan) on gravel: stripped_spruce_log, len 3-5, from (x, z) along axis x or z.
 */
export function playLog(g, x, z, len, axis, y = 4)

/**
 * Monterey cypress at (x, z), the trunk standing at y (the first cell above the ground): dark_oak_log, trunk 2 or 3
 * high; a flat three-layer crown 9 / 11 / 9 wide of dark_oak_leaves and spruce_leaves (2:1), each layer leaning
 * north-east by one cell per layer. Leaves are persistent.
 */
export function cypress(g, x, y, z, { trunk = 3 } = {})

/**
 * Bench on the row from (x, y, z) along +x, len 3-5: birch_slab (bottom) at each end, birch_stairs (bottom) between,
 * all facing `facing` (south by default, so the seat opens north). Nothing is placed above the seat row, so the 2-high
 * lane past it stays clear.
 */
export function bench(g, x, y, z, len, facing = "south")

/**
 * Lamp post at (x, y, z), y the first cell above the ground: three polished_blackstone_wall posts at y..y+2 and a
 * standing lantern on top at y+3.
 */
export function lampPost(g, x, y, z)
```

### vocab/h2.mjs

```js
// Vocabulary helpers from plan.md (VOCABULARY): pathRibbon, moundLawn, portalFace, stationRoof, boulder, pine,
// picnicTable, wallLantern. Each takes the grid first, then its position and size, and returns { placed, refused }.
// Writes stay in the helper's own footprint and follow one rule:
//   - air is free;
//   - a ground-surface block (grass, dirt, paving, gravel...) is replaced only at the helper's own surface y
//     (surfaceAt), or anywhere inside a volume the helper owns when it passes { over: true };
//   - nothing is written below the helper's surface, so the stone and dirt the ground part laid stay put.
// Refused writes are listed as [x, y, z, block, why], never thrown.

/**
 * A pale decomposed-granite path: Catmull-Rom through `points`, `width` wide, smooth_sandstone on the surface at
 * heightAt(x, z). Where the surface rises by 1 to the next cell along the path, the lower cell gets a bottom
 * smooth_sandstone_slab on top (a half step). The 3-step / 2-long-landing rule is the height map's job; `steep`
 * counts rises bigger than 1, which the caller should fix in the map.
 */
export function pathRibbon(g, points, width, step = 0.5, { heightAt } = {})

/**
 * Grass mound on a lawn: grass_block disc of radius rLawn at surface y, a crown of grass one block higher inside
 * rCrown, and a mossy_cobblestone_slab ring on the lawn cells just outside the crown (the edging).
 */
export function moundLawn(g, cx, cz, rLawn, rCrown, y)

/**
 * The tunnel portal face: a light_gray_concrete wall at x..x+depth-1 (z0..z1, yLo..yHi), two mouths carved
 * through it (mouthY, each [za, zb]), a 1-proud smooth_stone surround on the outer face with jambs and a lintel,
 * a smooth_stone coping on the top course, and an iron_bars rail one block above (rail: [zA, zB]).
 * The face is its own volume, so it may replace the ground inside it; it writes nothing below yLo.
 */
export function portalFace(g, { x, depth = 2, z0, z1, yLo, yHi, mouthY, mouths, rail, facing = "east" })

/**
 * The Field Station roof as a spec file: runParts lays it right after the shell (build.mjs, roof: "roof.json").
 * It places no blocks itself. footprint [x0, z0, x1, z1] is the wall footprint; overhang {north, south, east, west}.
 */
export function stationRoof(outPath, { footprint, y, material, overhang, fascia, preset = "cafe" })

/**
 * A boulder: andesite and tuff blob (radius r; two courses when r >= 1.5) sitting on the ground at surface y, with
 * moss_carpet on the top course. The mix is set by position, so the same call always gives the same blob.
 */
export function boulder(g, x, y, z, r)

/**
 * A Monterey pine on the ground at surface y: spruce_log trunk (height 6-8) and a two-course umbrella of
 * persistent spruce_leaves, 9 wide under and 5 wide on top, round the trunk.
 */
export function pine(g, x, y, z, height = 7)

/**
 * A picnic table on the ground at surface y: two birch_fence legs and a birch_slab top (type top) over the
 * 2 x 1 table along x, with a birch_stairs bench on each side (z - 1 facing north, z + 1 facing south), so the
 * seats open onto the table. Only its own 2 x 3 footprint is written; the cells past it stay clear.
 */
export function picnicTable(g, x, y, z)

/**
 * A wall lantern at (x, y, z). hanging: it hangs from the block above (a seat cap), so place it after that cap;
 * otherwise it stands on the block below (a wall top). Refused, and reported, when that block is missing.
 */
export function wallLantern(g, x, y, z, { hanging = false } = {})
```

### vocab/h3.mjs

```js
// Vocabulary helpers, batch h3 (plan.md VOCABULARY): roadStrip, seatingWall, tunnelBore, deck, drift, youngTree,
// umbrella, hiddenLight.
//
// Every helper takes its position as arguments and returns { placed, refused, footprint }:
//   footprint  [x0, y0, z0, x1, y1, z1], the only cells the helper writes
//   refused    [[x, y, z, blockThere], ...], cells it wanted but found not empty
// Writes go into air only. A cell that is not air is refused and listed, not overwritten, unless the caller passes
// { over: true } (still inside the footprint). tunnelBore alone carves its own bore cells: that is what a bore is.
// Nothing is written below a helper's own lowest layer, so no ground, sand or floor is touched.
//
// The y argument is the layer the helper's own blocks start in. Surface helpers (roadStrip, deck, hiddenLight) take the
// surface layer itself. Planting, trees, furniture and seating take the ground-top y and build above it.

/**
 * Road surface in the layer box[1] (box = [x0, y, z0, x1, y1, z1]; only y is written). Gray concrete, a white dash on the
 * centre line (2 on, 2 off along the road), and yellow concrete on the cross-axis coordinates in `yellow` (e.g. [55, 56]).
 * axis "x": the road runs east-west, so the cross axis is z. Replaces ground surface only with { over: true }.
 */
export function roadStrip(g, box, axis, { over = false, yellow = null } = {})

/**
 * Seating wall along x from x0 to x1 on row z, rising from the lower terrace (surface yLow) to the upper level (yHigh).
 * Body white_terracotta at y yLow+1..yHigh, birch_slab bottom cap at yHigh+1, the row drifting ±1 in z over each 10 x.
 * A lantern every 6 blocks stands on the upper side of the cap (nothing stands on a bottom slab, so not on the cap).
 * The caller leaves the wall row at yLow. Footprint: x0..x1, z-2..z+2, yLow+1..yHigh+1.
 */
export function seatingWall(g, x0, x1, z, yLow, yHigh, { over = false } = {})

/**
 * One tunnel bore from the east portal face, z0..z1 (6 wide, 3 high at y3..5). Carved air through the face (x74..75) and
 * the tunnel (x66..73); black_concrete back wall at x65; gray_concrete road at y2; light_gray_concrete side walls at
 * z0-1 and z1+1; smooth_stone surround standing proud at x76 (jambs y3..5, lintel y6); hanging lanterns at x73 under the
 * lid (y6). lanternZ defaults to z0+1, z0+3, z0+5 (the north mouth: 49/51/53). The south mouth is 57/59/61, so pass that.
 * The bore's own cells are written regardless of what is there (force). Only the surround is air-only.
 * Coping and rail run the length of the face, so the portal face helper owns them. Footprint: x65..76, y2..6, z0-1..z1+1.
 */
export function tunnelBore(g, z0, z1, { lanternZ = [z0 + 1, z0 + 3, z0 + 5] } = {})

/** Deck of spruce_planks in the layer box[1] (box = [x0, y, z0, x1, y1, z1]; only y is written). Air only. */
export function deck(g, box, { over = false } = {})

/**
 * Irregular planting bed. kind: "grey-green" | "ochre" | "purple-blue" | "coastal scrub" | "accent" (plan recipes).
 * polygon: [[x, z], ...] the bed outline. y: the ground-top y; plants sit at y+1 (tall plants also at y+2).
 * Leaf mounds (shrubs) are 1-2 high. Sunflowers are capped at one per 40 cells. Footprint: the polygon's bounding box, y+1..y+2.
 */
export function drift(g, kind, polygon, y, { over = false, seed } = {})

/**
 * Young meadow tree: birch_log trunk 4 high at y+1..y+4 (y = ground top), crown of leaves 3-5 wide over three layers:
 * y+4 the ring of 8 around the trunk, y+5 a 5x5 with the corners cut, y+6 a plus. Leaves persistent, birch_leaves by
 * default (pass { leaves: "azalea_leaves" } for the other). Footprint: x-2..x+2, y+1..y+6, z-2..z+2.
 */
export function youngTree(g, x, y, z, { leaves = "birch_leaves", over = false } = {})

/**
 * Picnic umbrella: birch_fence pole 3 high at y+1..y+3 (y = ground top), a standing banner of `colour` on top at y+4.
 * colour: one of the 16 dye names (orange_banner, white_banner for the plan's alternation). Footprint: x, y+1..y+4, z.
 */
export function umbrella(g, x, y, z, colour, { rotation = 0, over = false } = {})

/**
 * Hidden light in a bed: shroomlight as the surface block at y, moss_carpet on it at y+1. The shroomlight replaces the
 * ground surface, so it is refused unless the caller passes { over: true }. Footprint: x, y..y+1, z.
 */
export function hiddenLight(g, x, y, z, { over = false } = {})
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

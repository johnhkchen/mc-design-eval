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

1. [x] Ground and paths `parts/ground.mjs`: groundColumn over the box, roads, walks, paths P1-P10 + L1, west seam, B cells.
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
- Ground part: heights/site maps live in parts/heights.txt, parts/site.txt. '?' height cells take the nearest mapped digit; B footprints flattened to their modal height (edges kept). Whole box is filled, so Earthworks/Portal must carve/overwrite ground themselves (bores y3..5, terraces). Mossy slab edging is laid on lawn rises outside terraces/mound/campfire/overlook/lid. Gravel at x0..20 z34..44, x16..20 z24..33, x0..3 z18..42; W cells smooth_stone + light_gray band at z%6==0 (no roadStrip lines other than apron x76..85, H=2 cells).

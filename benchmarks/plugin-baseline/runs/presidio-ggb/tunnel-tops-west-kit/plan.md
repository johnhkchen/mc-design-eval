# Presidio Tunnel Tops, WEST HALF — landscape module (plot 0, x 0..119, z 0..145, y ≤ 30)

The concept photo (Main Post's white clapboard houses with red roofs) sets the scene south of the park and its palette: lawn green, white and pale trim, dark cypress. The park is built from the maps below.

## SITE

**Grid and datum.** Each map character covers 2 × 2 blocks: map column c covers x = 2c..2c+1 and map row r covers z = 2r..2r+1. Module y 0 is world y 2. North is low z and the land falls to the north (the Bay).

**Ground rule (every column).**
- y 1 is stone (clay under water).
- From y 2 up to the mapped height minus 1 is dirt.
- At the mapped height H is the surface block for the role below.
- `?` cells take the height of the nearest digit neighbours (8 at x 80..99 z 90..103, 8 at x 66..79 z 122..133, 9 at x 0..17 z 108..140).
- **Edge lock.** The outer 2 blocks of every edge (x 0..1, x 118..119, z 0..1, z 144..145) stay exactly at the mapped height and role. Reshaping (±1..2) happens only inside the park and at least 3 blocks from the edges. Every 1-block change in surface on a lawn or path is softened with a slab, or a stair on a bank.

**Ground zones (from the maps).**

| zone | x | z | H (surface y) | surface |
|---|---|---|---|---|
| Crissy Field edge: roads, walks, marsh | 0..119 | 0..15 | 2–3 | W → gray_concrete roads / smooth_stone walks; `.` → grass; T → water |
| Marsh water (T) | 0..13 (row 0), 0..11 (row 1), 8..9 & 8 (z 4..5) | 0..5 | 2 | water at y 2 over clay y 1 |
| Low flat: Outpost and meadow | 50..119 | 16..44 | 3 (mounds 4 at x 80..85 z 28..41 and x 100..107 z 28..43) | play ground / meadow |
| North bluff (steep) | 58..119 | 44..58 | 3→7 northward fall | coastal scrub |
| West bluff (wraps south) | 50..61 | 46..78 | 3→7 eastward | coastal scrub, cypress |
| Big Lawn plateau | 62..119 | 58..89 | 7 | grass_block |
| South rise / overlook | 50..119 | 88..135 | 8 | terraces, promenade |
| West W band (Parkway, roads, parking) | 0..49 | 16..95 | 3–5 | paving |
| SW Presidio forest edge | 0..50 | 92..145 | 5–9 | park (P) and grass (`.`), cypress groves |
| Building pads (B: leave flat, build NOTHING) | see RESERVED | | mapped | grass_block, flat |

**Masses and features (block coordinates; y = the surface or the structure's own blocks).**

| feature | x0..x1 | z0..z1 | y0..y1 | notes |
|---|---|---|---|---|
| **Parkway roadway** (two carriageways) | 0..40 | 80..91 | 4 | NB lanes z 80..84, median barrier z 85..86 (polished_andesite, 1 high at y 5), SB lanes z 87..91; white dashed lane line (every other 3) at z 82 and z 89, yellow edge lines at z 80 and z 91; road at y 4 everywhere (reshape the 3/5 cells by 1) |
| Parkway shoulders/walks | 0..40 | 76..79 and 92..95 | 4 | smooth_stone walk; slab ramps where mapped H differs |
| **West tunnel portal face** (faces WEST) | 41..42 | 76..95 | 5..10 | 2 thick. Body smooth_stone, coping course calcite at y 10, plinth course polished_andesite at y 5 |
| Tunnel mouths (air) | 41..49 | 80..84 and 87..91 | 5..8 | two mouths, each 5 wide × 4 high. Pier z 85..86 between them |
| Tunnel lid (park over it) | 41..53 | 76..95 | surface 9 (raised +1) | ceiling slab of smooth_stone at y 9 over the mouths, grass on top at y 10 with planting. Lid soil reaches y 10 only from x 43 east; x 41..42 is the coping |
| Tunnel back (dark fade) | 50 | 80..91 | 5..8 | black_concrete wall, a sea_lantern ceiling strip at y 8, x 43..49, every 3rd cell, on the centre line of each bore (z 82 and z 89) |
| Retaining walls of the cut | 28..40 | 78..79 (north) and 92..93 (south) | from y 5 up to the cut slope | smooth_stone with a calcite coping. Height steps down westward: y 5..9 at x 37..40, y 5..8 at x 33..36, y 5..7 at x 28..32. Earth bank behind them |
| **Outpost play ground** (continues east) | 68..119 | 20..42 | 3 | coarse_dirt/gravel/sand patches. Low timber fence (spruce_fence, y 4) at z 19, x 68 and z 43, with gates where paths cross |
| Fort lookout tower | 80..85 | 28..33 | 4..16 | on the h4 mound. Corner posts are stripped_spruce_log (4..15). Deck floor spruce_planks at y 12 (8 above ground), spruce_fence rail at y 13. Low hip cap of spruce_stairs/slab y 15..16. Ladder on the inside of the north face at x 82, z 29, y 5..12, with a hatch (spruce_trapdoor) in the deck. Mid platform y 8 on the south half (x 80..85 z 31..33) |
| Fort rope net | 80..85 | 34..35 | 5..11 | spruce_fence lattice (no chains, no cobwebs) climbing from the ground to the mid platform |
| Climbing log pile | 100..107 | 28..35 | 4..8 | on the h4 mound. Crisscrossed stripped_oak_log / spruce_log, alternating x/z each layer, stepped so it can be climbed; mangrove_roots tangles at 2 corners |
| Balance logs | 70..79 | 34..41 | 4 | 5 stripped_oak_log beams 5–7 long, crisscrossed |
| Sand pit | 92..99 | 21..27 | 3 | sand surface, tuff/andesite boulders on the rim |
| Water play runnel | 90..117 | 38 | 3 | 1-wide water at y 3 in a stone channel (stone at y 2 and on both sides at y 3; smooth_stone_slab lip). Runs east across x 119 |
| Boulders | scattered | 20..42 | 4..5 | 6–8 clusters of stone/tuff/andesite, 2–4 blocks each |
| **Outpost Meadow** | 50..67 | 18..46 | 3 (bluff toe to 4..5) | tall_grass / short_grass with cornflower, allium, dandelion drifts. Mown loop of grass_block (no plants) 2 wide; 3 picnic tables at (54,3,24) (62,3,30) (56,3,40) |
| **Lower Bluff Walk** (toe path) | 50..119 | 44..46 | 3→4 | smooth_sandstone 3 wide, gentle S-bend (z 44..46 at x 50..80, z 43..45 at x 81..100, z 44..46 at x 101..119) |
| North bluff scrub | 58..119 | 47..57 | 4..6 | azalea, flowering azalea and spruce-leaf mounds 1–2 high; sweet berry, dead bush, fern, moss |
| **Cliff Walk** | 62..119 | 58..60 | 7 | smooth_sandstone 3 wide. Timber railing on the north edge (z 57): stripped_spruce_log posts every 4 with a spruce_fence rail at y 8. West end bends SW down the west bluff: x 50..61, z 60..72, slab half-steps 7→3, to the toe path at (50,3,46) |
| Overlook West deck | 74..81 | 50..56 | floor y 7 | spruce_planks floor level with the walk. Under it, stripped_spruce_log posts down to ground at the 4 corners and at mid points. spruce_fence rail y 8 on N/E/W. 2 benches (spruce_stairs facing S, so they look north) at z 51 |
| Overlook East deck | 100..107 | 50..56 | floor y 7 | the same |
| Bluff switchback (Outpost ↔ Cliff Walk) | 88..96 | 46..58 | 3→7 | 2-wide smooth_sandstone path in two diagonal legs (88→96 rising, then back), half steps of smooth_sandstone_slab |
| **Big Lawn** (continues east) | 66..119 | 62..85 | 7, mound +1 at x 82..112 z 68..78 | mowed grass_block only, no flowers. The +1 mound rises in single-block steps with the rise staggered, so its outline wanders and reads as a soft swell, not a terrace |
| Lawn edge paths | 63..65 (west edge, z 60..88); 64..119 (south edge, z 86..88) | | 7 | smooth_sandstone 3 wide. The north edge is the Cliff Walk |
| **Overlook terraces, west bank** | 52..77 | 89..103 | 7→9 | tier 1 z 99..102 y 9, tier 2 z 94..98 y 8, tier 3 z 89..93 y 7. The north edge of tiers 1 and 2 is a seating wall (see FACADES). Aisle of slab half-steps at x 64..65 |
| **Overlook terraces, east bank** | 100..115 | 89..103 | 7→9 | the same tiers. Aisle at x 107..108. At x 116..119 the ground stays at the mapped 8 with a planter |
| **Overlook Promenade** (continues east) | 50..119 | 104..107 | 8 | light_gray_concrete paving with a calcite band at each edge. Planters (calcite box 1 high, grasses) every 10 along z 103 |
| South park paths | | | | 3-wide smooth_sandstone: from the promenade at (56,8,107) SW to (24,7,118) (the `.`-edge walk); from (90,8,107) S to the W walk at (88,8,140); from the west bank (52,8,96) down the west slope to the Parkway walk at (40,5,95) with slab half-steps |
| Lid path | 44..60 | 96..100 → 76 | 9→7 | a path over the tunnel lid linking the lawn's west edge (63,7,76) to the lid crest and down to the promenade |
| Cypress / pine groves (6–10 trees each) | 10..40 | 96..140 | | SW forest edge |
| | 50..60 | 60..76 | | west bluff |
| | 44..54 | 78..94 | | over the lid |
| | 60..75 | 108..135 | | south, between pads |
| | 104..117 | 110..132 | | SE |
| | 0..10 | 140..145 (`.`) | | |
| | 52..58 | 18..26 | | NW meadow |
| Native planting drifts | | | | all remaining P cells between paths (see MATERIALS) |
| West paved area: Crissy Field Ave | 0..49 | 22..29 | 3 | gray_concrete, yellow double centre line z 25..26 (dashed white is wrong here: solid yellow), white edge lines z 22 and z 29 |
| Parking lot | 0..45 | 30..75 | 3 | gray_concrete with white stall lines every 3 along x, rows at z 34, 44, 54, 64. `.` islands (x 12..31 z 30..43, H 2 = sunken bioswale) are native planting: tall_grass, fern, dead_bush, 2 cypress |
| Park-edge walk | 46..49 | 22..77 | 3 | smooth_stone, lamp posts every 10 |
| North roads (z 6..15) | W cells | 6..15 | 2–3 | Mason St: gray_concrete with a yellow centre line along z 11 where W is continuous (x 0..27); walks smooth_stone |
| Small pond (T) | 38..39 | 24..25 | 2 | water over clay, smooth_stone kerb |

## ROOFS

Only the Fort has a roof, built by hand in its part: a low hip of spruce_stairs (pitch 1:1) over the deck posts, x 79..86 z 27..34, eaves y 15 overhanging 1, apex slabs y 16. No other roofs. No `$MCD roof` preset applies; there are no buildings in this module (the B pads are placed separately).

## FACADES

| element | hierarchy and depth | material |
|---|---|---|
| Portal face (W) | plinth y 5 (polished_andesite, flush) / body y 6..9 smooth_stone / coping y 10 calcite, 1 proud (x 40) / lintel over each mouth y 9 calcite. Mouth reveals 1 deep: face at x 41, mouth walls set back at x 42. Pier z 85..86 with a lantern on its face at y 7 (x 40) | smooth_stone, calcite, polished_andesite |
| Portal name band | on the coping band at y 9..10 over the pier: none (keep clean) | — |
| Retaining walls | the same courses as the portal, stepping down in 3 steps, coping calcite slab on top | smooth_stone, smooth_stone_slab cap |
| Seating walls (terraces) | the riser at each tier's north edge: calcite 1 high (the tier's surface block) + spruce_slab (bottom) seat on top, running the tier's whole width with 2-wide aisle breaks | calcite, spruce_slab |
| Freestanding seat walls (lawn edge, promenade) | calcite 1 high, spruce_slab top, 6–10 long, at (70..79, 8, 85), (92..101, 8, 85), (104..113, 8, 85) on the lawn's south path edge, facing north | calcite, spruce_slab |
| Benches | spruce_stairs facing away from the view (so the seat faces the Bay) with spruce_trapdoor arms; 2 per overlook, 6 along the promenade at z 103 | spruce |
| Picnic tables | spruce_fence post + spruce_slab top (type top), spruce_stairs seats each side | spruce |
| Cliff Walk railing | stripped_spruce_log posts every 4 (y 8), spruce_fence between at y 8 | spruce |
| Outpost fence | spruce_fence 1 high, stripped_spruce_log posts every 6 at y 4 | spruce |
| Lamp posts | 3 high: dark_oak_fence ×3 + lantern on top (y H+1..H+4). Every 9–10 along every path, at every path fork, 2 per overlook deck, on the Fort deck corners (hanging lanterns under the cap) | dark_oak_fence, lantern |

## MATERIALS

| role | block id |
|---|---|
| Paths (decomposed granite) | smooth_sandstone (slab: smooth_sandstone_slab; bank steps: smooth_sandstone_stairs) |
| Promenade paving | light_gray_concrete, edge band calcite |
| Seating walls / portal trim / planter boxes | calcite |
| Portal and retaining wall body | smooth_stone; plinth polished_andesite |
| Tunnel interior | smooth_stone walls, black_concrete back, sea_lantern ceiling lights |
| Roads | gray_concrete; markings white_concrete (lanes, stalls, edges), yellow_concrete (centre lines) |
| Walks (outside the park) | smooth_stone (slab: smooth_stone_slab) |
| Lawn | grass_block |
| Planting bed ground | grass_block with patches of moss_block, podzol, rooted_dirt and coarse_dirt (~1 in 4) |
| Planting: coastal shrub mounds | azalea_leaves, flowering_azalea_leaves (persistent), 1–2 high, 3–7 across |
| Planting: grey-green and ochre drifts | tall_grass, short_grass, fern, large_fern, dead_bush (ochre), sweet_berry_bush, moss_carpet |
| Planting: purples and blues | allium, cornflower (in drifts of 5–12, never single dots); sunflower only in 3 clumps of 3 |
| Shrubs as plants | azalea, flowering_azalea |
| Monterey cypress | trunk dark_oak_log 4–6 high, often leaning 1; crown dark_oak_leaves (persistent) flat-topped, 7–11 wide, 2–3 thick, asymmetric (wind-shorn, longer to the east) |
| Pine | trunk spruce_log 5–7; crown spruce_leaves, an umbrella 5–7 wide, 2 thick at the top |
| Play timber | stripped_spruce_log, stripped_oak_log, spruce_log, spruce_planks, mangrove_roots |
| Play ground | coarse_dirt, gravel, sand |
| Boulders | stone, tuff, andesite |
| Fencing / rails | spruce_fence, spruce_fence_gate, stripped_spruce_log posts |
| Lamps | dark_oak_fence posts, lantern |
| Hidden light | light (level 15) |
| Water | water over clay |
| Fill | dirt; stone at y 1 |

All are checked with `$MCD blocks --check` and exist in 1.21.1. Do NOT use chain/iron_chain (the toolkit and 1.21.1 names differ), pale oak, short_bush, leaf_litter, firefly_bush, or cobwebs.

## OPENINGS

| opening | coordinates | size |
|---|---|---|
| Tunnel mouth N (northbound) | x 41..49, z 80..84, y 5..8 | 5 wide × 4 high, 9 deep |
| Tunnel mouth S (southbound) | x 41..49, z 87..91, y 5..8 | 5 wide × 4 high, 9 deep |
| Fort ladder hatch | x 82, z 29, y 12 | 1 × 1 |
| Fort entry (ground) | x 82..83, z 28, y 4..6 | 2 wide × 3 |
| Outpost fence gates | on the toe path (x 68, z 44..46 not fenced: open gap); spruce_fence_gate at (75, 4, 19), (110, 4, 19), (90..92, 4, 43) | gaps 2–3 wide |
| Cliff Walk rail gaps | at the overlook decks (x 76..79 and x 102..105, z 57) | 4 wide |

## RESERVED

| cells | kept for |
|---|---|
| B pad x 78..99, z 88..103 (rows 44–51, exact B cells) | building, flat at 8, NOTHING on it, no trees within 1 |
| B pad x 20..29, z 100..109 | building, flat at mapped H |
| B pads x 0..17, z 106..141 (exact B cells) | Main Post buildings |
| B pads x 66..79, z 112..133 and x 94..103, z 122..137 (exact B cells) | buildings |
| Path crossings at x 118..119 (continue straight into the east module): toe path z 44..46 y 4; Cliff Walk z 58..60 y 7; lawn south path z 86..88 y 7; promenade z 104..107 y 8; runnel z 38 y 3 | the sister module |
| Tunnel bore air x 43..49, z 80..84 / 87..91, y 5..8 | no planting roots or light blocks |

## FLOORS

| level | y | volume |
|---|---|---|
| Parkway and tunnel floor | 4 | bores x 41..49, y 5..8 headroom |
| Outpost play ground | 3 (mounds 4) | open |
| Fort mid platform / deck / cap | 8 / 12 / 15..16 | x 80..85 z 28..33 |
| Overlook decks | 7 (walk level) | x 74..81 and x 100..107, z 50..56 |
| Big Lawn / Cliff Walk | 7 (mound 8) | |
| Terrace tiers | 7 / 8 / 9 | x 52..77 and x 100..115, z 89..102 |
| Promenade | 8 | z 104..107 |

Lighting: lamp posts on every path every 9–10. A `light` block (level 15) at H+1 on an 11-block grid over every lawn and meadow cell that a lamp doesn't reach, and in the planting drifts and bluff scrub; in the planting, ring the light blocks with moss_carpet. The bores are lit by their sea lanterns.


---
# DESIGNER SECTIONS

## PALETTE
Architect's ids kept exactly. Variants needed (all checked with `$MCD blocks --check`: no unknowns):
- Paths: smooth_sandstone, smooth_sandstone_slab, smooth_sandstone_stairs. Walks: smooth_stone, smooth_stone_slab. Roads: gray_concrete, white_concrete, yellow_concrete.
- Masonry: smooth_stone, smooth_stone_slab, calcite, polished_andesite, black_concrete, sea_lantern, light_gray_concrete, stone, tuff, andesite.
- Timber (spruce): spruce_planks, spruce_slab, spruce_stairs, spruce_fence, spruce_fence_gate, spruce_trapdoor, stripped_spruce_log, spruce_log, ladder; stripped_oak_log, mangrove_roots; dark_oak_fence, dark_oak_log.
- Ground: grass_block, dirt, stone, clay, coarse_dirt, gravel, sand, podzol, rooted_dirt, moss_block, water.
- Planting: azalea_leaves, flowering_azalea_leaves, dark_oak_leaves, spruce_leaves (all persistent=true), azalea, flowering_azalea, tall_grass, short_grass, fern, large_fern, dead_bush, sweet_berry_bush (age 2..3), moss_carpet, allium, cornflower, dandelion, sunflower.
- Light: lantern (hanging true/false), sea_lantern, light (level 15).
No chain, no cobweb, no pale oak. Stairs/slab states: bottom unless noted; never put anything on a bottom slab.

## VOCABULARY
Helpers (each in the part that uses it; coordinates are module coords, y = module y):
- mapHeight(x,z): decode the 60x73 height map (cell = floor(x/2), floor(z/2)); `?` per RESERVED rule. P1 exports it as a shared data file `heights.json` for all parts.
- groundColumn(x,z,surface): y1 stone (clay under water), dirt y2..H-1, `surface` at H. Every column, whole box. Edge 2 blocks exact.
- roadStrip(x0,z0,x1,z1,{axis}): gray_concrete; lane lines white_concrete dashed 3-on/3-off; edge lines solid; centre lines yellow_concrete solid.
- walkStrip / halfStep(x,z,dir): smooth_stone / smooth_sandstone; where H changes by 1 put the lower cell's bottom slab (smooth_sandstone_slab, type bottom) on a full block under it; banks use smooth_sandstone_stairs facing up-slope.
- curvePath(points[],width 2..3): sweep a width-wide brush along a polyline with 1-2 block bends, forks as a second polyline; surface block smooth_sandstone on the ground column's top.
- moundLawn: grass_block +1 patches, staggered rows so the outline wanders; every step is on lawn, softened with nothing (no raw terrace: use spans of 3+ cells).
- portalFace(x0): plinth polished_andesite y5, smooth_stone y6..9, calcite coping y10 (and calcite lintel y9 over mouths), mouths open air x41..49 z80..84 / 87..91 y5..8, pier z85..86 with a wall lantern (hanging false, on face x40 y7).
- tunnelBore(z0): smooth_stone side walls/floor, ceiling smooth_stone_slab y9 (top of bore y8 clear), black_concrete x50, sea_lantern at y8, x43,46,49 on the centre line.
- retainWall(x0,x1,z0,z1,hTop): smooth_stone body from y5 to hTop, calcite top course, smooth_stone_slab cap; earth bank behind.
- fortTower: posts stripped_spruce_log axis y at (80,28)(85,28)(80,33)(85,33) y4..15; mid platform spruce_planks y8 on x80..85 z31..33; deck y12 x80..85 z28..33 with hatch at (82,12,29) = spruce_trapdoor open true; ladder facing south on the inside of the north face at x82 z29 y5..12 (backed by a spruce_planks cell at z28); spruce_fence rail y13 around the deck except at the hatch; hip roof: spruce_stairs rings y15 (x79..86 z27..34 eaves), y16 inner ring, spruce_slab apex; lantern hanging under the cap at each deck corner.
- fenceNet: spruce_fence cells at every (x,z) in x80..85 z34..35 where (x+y) is even, y5..11 rising south to north to meet the platform, anchored on the ground.
- logPile: layers y4..8 each shrinking 1 from ends; layer even: stripped_oak_log axis x, odd: spruce_log axis z, gaps every 3rd to climb; mangrove_roots (waterlogged false) at 2 corners.
- balanceLog(x,z,len,axis): stripped_oak_log axis along, y4 (on top of coarse dirt/podzol ground), 5 crisscrossed.
- boulder(x,z,r): 2-4 block cluster of stone/tuff/andesite, 1-2 high.
- runnel: stone floor y2, stone side walls y3, water source y3 in the 1-wide channel, smooth_stone_slab (top) lip beside; keep it filled at x119.
- lowFence(line): spruce_fence y4, stripped_spruce_log post (axis y) every 6; spruce_fence_gate at gaps.
- picnicTable(x,z): spruce_fence post at the centre, spruce_slab type top above it (x..x+1 wide ok), spruce_stairs seats each side facing the table.
- bench(x,y,z,facing): spruce_stairs facing away from the view (seat faces north), spruce_trapdoor (open, flat) as arms either end; stands on a full block.
- overlookDeck(x0,z0): spruce_planks y7 x74..81 z50..56 (E: 100..107), posts stripped_spruce_log axis y to the ground at corners and mid, spruce_fence rail y8 on N/E/W, 2 benches at z51, 2 lamp posts at corners.
- cliffRail: stripped_spruce_log posts axis y y8 every 4 on z57, spruce_fence y8 between; gap x76..79 and x102..105.
- seatWall(x0,x1,y,z): calcite 1 high then spruce_slab (bottom) seat on top, 2-wide aisle breaks of smooth_sandstone_slab half-steps.
- tier(x0,x1,z0,z1,y): surface light_gray_concrete or smooth_sandstone with calcite edging, seatWall on the north edge.
- promenade: light_gray_concrete z104..107 y8, calcite band along z104 and z107.
- planter(x,z): calcite box 1 high, soil, tall_grass/short_grass/fern; every 10 on z103.
- shrubMound(cx,cz,w,d,h): leaf blocks azalea_leaves/flowering_azalea_leaves (persistent true) as a domed heap 1-2 high on grass, ground under patched with moss_block/podzol.
- drift(kind,area): plants in clumps of 5-12; kinds grey-green (tall_grass, fern, short_grass), ochre (dead_bush, sweet_berry_bush), purple (allium, cornflower), meadow (also dandelion). Plants only on grass/dirt/podzol/moss.
- cypress(x,z,seed): dark_oak_log 4-6 (one block leaning), crown dark_oak_leaves flat 7-11 wide, 2-3 thick, longer to the east, persistent true.
- pine(x,z): spruce_log 5-7, umbrella spruce_leaves 5-7 wide, 2 thick at the top.
- lampPost(x,z): dark_oak_fence x3 at H+1..H+3, lantern (hanging false) at H+4... (plan says H+1..H+4): standing on the fence top.
- hiddenLight(x,z): `light` level 15 at H+1 inside a ring of moss_carpet in planting, or on the lawn at the 11-block grid.

## ROOMS
None: a landscape module has no interior rooms. Spaces to be walked are the outdoor areas listed in the plan (Outpost, meadow, Cliff Walk, Big Lawn, terraces, promenade, tunnel bores). The bores are not rooms but are kept lit by their sea_lanterns.

## PARTS
1. terrain.mjs: ground + paving + paths + lawn + water (elements 1-6, 10 ground, 18 base).
2. portal.mjs: portal, bores, retaining walls, parkway details (7-9).
3. outpost.mjs: Fort, net, logs, sand, runnel, boulders, fence, picnic tables (11-19).
4. terraces.mjs: cliff walk rail, decks, switchback furniture, terraces, promenade, seat walls, benches (20-24).
5. planting.mjs: scrub, drifts, meadow, cypress and pine groves (25-26, 18).
6. lighting.mjs: lamp posts, hidden light, bore check (27).

## Checklist
- [x] P1 terrain  - [ ] P2 portal  - [ ] P3 outpost  - [ ] P4 terraces  - [ ] P5 planting  - [ ] P6 lighting

## Notes for workers
- Every part writes only inside x0..119 z0..145 y1..30. Never touch the B pads or the bore air (RESERVED). Run P1 first; later parts read heights.json.
- A part writing over ground replaces: keep the outer 2 edge blocks as mapped.
- Paths cross x119 straight at the RESERVED rows.
- Check: `$MCD check`, render from the north at the Fort and the portal. No lamp inside bores except sea_lantern.
- P1 note: heights.json is written by parts/terrain.mjs from parts/heights-data.mjs (run `node -e` once before make.sh if it is missing: build.mjs reads it before the parts). Reshaped: parkway x2..40 z76..95 at 4; x41..42 z76..95 and x43..50 z79..92 left hollow at height 4 (road laid as bore floor) so P2 builds portal, walls, ceiling into air; the lid soil/earth bank over x43..50 z76..78 and the lid above y8 is P2's. West-bank path ends at (43,97), not (40,95). Pond cells sunk to 2.
- v2 (comment-v2.txt): parking lot removed; parkway(x,z)/verge(x,z) in parts/heights-data.mjs sweep the divided highway (3+3 lanes, median barrier) on one arc from the west edge into the cut (2+2 lanes in the cut, the bores fix the width); left-over lot paving is planted verge. Planting: densePlant() bands + clumped Monterey cypress (2x2 trunks, flat layered crowns blown east) and tall pines. Outpost: lower lookout deck + log bridge + net, log crib, log scramble, more boulders. Terraces: curved banks, spruce-slab bench fronts, end planters. Cliff rail 2 courses. Paths Chaikin-smoothed.

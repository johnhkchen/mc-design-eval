# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
- [ ] P1 terrain  - [ ] P2 portal  - [ ] P3 outpost  - [ ] P4 terraces  - [ ] P5 planting  - [ ] P6 lighting

## Notes for workers
- Every part writes only inside x0..119 z0..145 y1..30. Never touch the B pads or the bore air (RESERVED). Run P1 first; later parts read heights.json.
- A part writing over ground replaces: keep the outer 2 edge blocks as mapped.
- Paths cross x119 straight at the RESERVED rows.
- Check: `$MCD check`, render from the north at the Fort and the portal. No lamp inside bores except sea_lantern.
```

### elements.md

```markdown
# REQUIRED ELEMENTS: Tunnel Tops west (all coordinates from plan.md SITE/RESERVED; module x0..119 z0..145)

Part keys: P1 terrain.mjs, P2 portal.mjs, P3 outpost.mjs, P4 terraces.mjs, P5 planting.mjs, P6 lighting.mjs. Vocab names are in plan.md VOCABULARY.

| # | element | real construction, block by block | where | part | vocab |
|---|---|---|---|---|---|
| 1 | Ground of the whole box | y1 stone (clay under T); dirt y2..H-1; surface at H per map (2x2 cells; `?` per RESERVED rule); outer 2 blocks of every edge exactly at mapped H | x0..119 z0..145 | P1 | groundColumn, mapHeight |
| 2 | Roads and markings | gray_concrete; white_concrete dashed (every other 3) lanes, solid white edge lines, yellow_concrete centre lines (Mason St z11, Crissy Field Ave z25..26) | W cells z6..15, z22..29, parkway z80..91 | P1 | roadStrip |
| 3 | Walks and parking | smooth_stone walks, smooth_stone_slab at 1-steps; parking gray_concrete + white stall lines every 3, bioswale islands | x0..49 z30..75 | P1 | walkStrip, stallLines |
| 4 | Marsh and pond | water at y2 over clay y1; smooth_stone kerb on the pond | x0..13 z0..5; x38..39 z24..25 | P1 | waterCell |
| 5 | Curving pale paths | smooth_sandstone 2-3 wide, bends and forks as per plan (toe path, bluff switchback, lid path, south park paths); smooth_sandstone_slab half-steps where H changes by 1, stairs on banks | plan.md SITE | P1 | curvePath, halfStep |
| 6 | Big Lawn | grass_block only, mound +1 at x82..112 z68..78 in staggered single-block steps, wandering outline, edged by 3-wide pale path | x66..119 z62..85 | P1 | moundLawn |
| 7 | West tunnel portal | polished_andesite plinth y5; smooth_stone body y6..9; calcite coping y10 (1 proud, x40); calcite lintels y9 over mouths; 2 thick, mouth reveals at x42; pier z85..86 with wall lantern y7 | x41..42 z76..95 | P2 | portalFace |
| 8 | Two tunnel bores | smooth_stone walls and floor/ceiling slab y9, black_concrete back x50, sea_lantern strip y8 at x43..49 every 3rd on z82 and z89; air kept clear | x41..50 z80..91 y5..8 | P2 | tunnelBore |
| 9 | Retaining walls of the cut | smooth_stone + calcite coping; steps down westward (y9 x37..40, y8 x33..36, y7 x28..32); earth bank behind | x28..40 z78..79, z92..93 | P2 | retainWall |
| 10 | Park over the lid | dirt to y9, grass_block y10, planting; lid path | x43..60 z76..100 | P2/P5 | lidCover |
| 11 | Fort lookout | 4 corner stripped_spruce_log posts y4..15, spruce_planks decks y8 (S half) and y12, spruce_fence rail y13, ladder x82 z29 y5..12 + spruce_trapdoor hatch, spruce_stairs hip y15..16 with slab apex, hanging lanterns under the cap | x80..85 z28..33 | P3 | fortTower, ladder |
| 12 | Rope net | spruce_fence lattice (alternate rows/columns) ground to platform y8 | x80..85 z34..35 | P3 | fenceNet |
| 13 | Climbing log pile | alternating-axis stripped_oak_log/spruce_log layers, stepped, mangrove_roots at 2 corners | x100..107 z28..35 | P3 | logPile |
| 14 | Balance logs | 5 stripped_oak_log beams 5-7 long, crisscrossed at y4 on podzol/coarse dirt | x70..79 z34..41 | P3 | balanceLog |
| 15 | Sand pit and play ground | sand, coarse_dirt, gravel patches; tuff/andesite rim boulders | x92..99 z21..27; x68..119 z20..42 | P3 | playGround, boulder |
| 16 | Water runnel | stone channel: stone floor y2, stone sides y3, 1-wide water y3, smooth_stone_slab lip; runs across x119 | x90..119 z38 | P3 | runnel |
| 17 | Outpost fence | spruce_fence y4, stripped_spruce_log post every 6, spruce_fence_gate at gaps | per OPENINGS | P3 | lowFence |
| 18 | Meadow and mown loop | tall_grass/short_grass, cornflower/allium/dandelion drifts; 2-wide mown grass_block loop | x50..67 z18..46 | P3/P5 | meadowDrift |
| 19 | Picnic tables (3) | spruce_fence post, top spruce_slab, spruce_stairs seat each side | (54,3,24) (62,3,30) (56,3,40) | P3 | picnicTable |
| 20 | Cliff Walk and railing | smooth_sandstone 3 wide z58..60 y7; stripped_spruce_log posts every 4, spruce_fence y8 on z57 | x62..119 | P4 | cliffRail |
| 21 | Two overlook decks | spruce_planks y7, stripped_spruce_log posts to ground, rail N/E/W, 2 benches facing north, 2 lamp posts each | x74..81 and x100..107 z50..56 | P4 | overlookDeck, bench |
| 22 | Seating terraces | 3 tiers (y7/8/9); calcite riser + spruce_slab seat, 2-wide aisle breaks of slab half-steps | x52..77 and x100..115 z89..103 | P4 | seatWall, tier |
| 23 | Promenade and planters | light_gray_concrete, calcite edge band, calcite planters 1 high with grasses every 10 on z103, 6 benches | x50..119 z104..107 | P4 | promenade, planter, bench |
| 24 | Freestanding seat walls | calcite + spruce_slab top, 6-10 long | (70..79,92..101,104..113; 8; 85) | P4 | seatWall |
| 25 | Coastal scrub and drifts | azalea/flowering_azalea leaves mounds 1-2 high, ferns, dead_bush, sweet_berry_bush, moss_block/moss_carpet, allium/cornflower in 5-12 drifts, sunflower 3 clumps of 3 | bluff, beds | P5 | shrubMound, drift |
| 26 | Cypress and pine groves | dark_oak_log 4-6 + flat wind-shorn dark_oak_leaves; spruce_log 5-7 + umbrella of spruce_leaves; groves per plan table | plan.md | P5 | cypress, pine |
| 27 | Lamp posts and hidden light | dark_oak_fence x3 + lantern every 9-10 on paths and forks; `light` blocks on 11-block grid ringed by moss_carpet; none in bores or on B pads | all paths | P6 | lampPost, hiddenLight |
```

### rooms.json

```json
{"entrance":null,"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "path": ["smooth_sandstone", "smooth_sandstone_slab", "smooth_sandstone_stairs"],
    "walk": ["smooth_stone", "smooth_stone_slab"],
    "promenade_paving": ["light_gray_concrete"],
    "trim": ["calcite"],
    "seat": ["spruce_slab"],
    "portal_body": ["smooth_stone", "smooth_stone_slab", "polished_andesite"],
    "tunnel": ["smooth_stone", "black_concrete", "sea_lantern"],
    "road": ["gray_concrete"],
    "road_marking": ["white_concrete", "yellow_concrete"],
    "lawn": ["grass_block"],
    "planting_ground": ["grass_block", "moss_block", "podzol", "rooted_dirt", "coarse_dirt"],
    "shrub": ["azalea_leaves", "flowering_azalea_leaves", "azalea", "flowering_azalea"],
    "drift": ["tall_grass", "short_grass", "fern", "large_fern", "dead_bush", "sweet_berry_bush", "moss_carpet", "allium", "cornflower", "dandelion", "sunflower"],
    "cypress": ["dark_oak_log", "dark_oak_leaves"],
    "pine": ["spruce_log", "spruce_leaves"],
    "timber": ["spruce_planks", "spruce_slab", "spruce_stairs", "spruce_trapdoor", "ladder"],
    "play_timber": ["stripped_spruce_log", "stripped_oak_log", "spruce_log", "spruce_planks", "mangrove_roots"],
    "play_ground": ["coarse_dirt", "gravel", "sand"],
    "boulder": ["stone", "tuff", "andesite"],
    "fence": ["spruce_fence", "spruce_fence_gate", "stripped_spruce_log"],
    "lamp": ["dark_oak_fence", "lantern"],
    "hidden_light": ["light"],
    "water": ["water"],
    "fill": ["dirt", "stone", "clay"]
  },
  "objects": [
    "smooth_sandstone", "smooth_sandstone_slab", "smooth_sandstone_stairs",
    "smooth_stone", "smooth_stone_slab", "gray_concrete", "white_concrete", "yellow_concrete",
    "calcite", "polished_andesite", "black_concrete", "sea_lantern", "light_gray_concrete", "stone", "tuff", "andesite",
    "spruce_planks", "spruce_slab", "spruce_stairs", "spruce_fence", "spruce_fence_gate", "spruce_trapdoor",
    "stripped_spruce_log", "spruce_log", "ladder", "stripped_oak_log", "mangrove_roots", "dark_oak_fence", "dark_oak_log",
    "grass_block", "dirt", "clay", "coarse_dirt", "gravel", "sand", "podzol", "rooted_dirt", "moss_block", "water",
    "azalea_leaves", "flowering_azalea_leaves", "dark_oak_leaves", "spruce_leaves", "azalea", "flowering_azalea",
    "tall_grass", "short_grass", "fern", "large_fern", "dead_bush", "sweet_berry_bush", "moss_carpet",
    "allium", "cornflower", "dandelion", "sunflower", "lantern", "light"
  ]
}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which then replaces build.nbt. Safe to run with parts missing.
set -eu
cd "$(dirname "$0")"
tmp=$(mktemp "${TMPDIR:-/tmp}/build.XXXXXX.nbt")
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
chmod 644 "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// Tunnel Tops west half (plot 0): the grid, the ground, then the six parts in order. Usage: node build.mjs <out.nbt>
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SIZE, STONE, DIRT, GRASS_BLOCK } from "./vocab/base.mjs";

const PARTS = [
  ["Terrain and paving", "parts/terrain.mjs"],
  ["Tunnel portal and cut", "parts/portal.mjs"],
  ["Outpost play area", "parts/outpost.mjs"],
  ["Overlooks, terraces and promenade", "parts/terraces.mjs"],
  ["Planting and trees", "parts/planting.mjs"],
  ["Lamps and hidden light", "parts/lighting.mjs"],
];

const here = (file) => fileURLToPath(new URL(file, import.meta.url));
const noop = () => {};

// A part whose file is not written yet (or does not load yet, e.g. it imports a vocab file still in progress) builds
// as a no-op, so make.sh still yields a build. The log says which parts were skipped.
async function loadPart(name, module) {
  const url = new URL(module, import.meta.url);
  if (!existsSync(fileURLToPath(url))) { console.log(`part ${name}: ${module} not written yet, built as a no-op`); return [name, noop]; }
  try {
    const mod = await import(url.href);
    return [name, mod.build ?? noop];
  } catch (e) {
    console.error(`part ${name}: ${module} failed to load (${String(e.message).split("\n")[0]}), built as a no-op`);
    return [name, noop];
  }
}

// The ground the parts build on: y 1 stone, dirt up to the surface, grass at the surface. The surface comes from
// heights.json ([z][x] = module y), which the terrain part writes; until it exists the box is left empty.
function layGround(g) {
  const file = here("heights.json");
  if (!existsSync(file)) { console.log("ground: heights.json not written yet, no ground laid"); return; }
  const heights = JSON.parse(readFileSync(file, "utf8"));
  for (let z = 0; z < SIZE[2]; z++) for (let x = 0; x < SIZE[0]; x++) {
    const top = heights[z][x];
    g.set(x, 1, z, STONE);
    for (let y = 2; y < top; y++) g.set(x, y, z, DIRT);
    g.set(x, top, z, GRASS_BLOCK);
  }
  console.log(`ground: laid from heights.json (${SIZE[0]} x ${SIZE[2]})`);
}

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }

const g = new Grid(SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });
layGround(g);
const list = [];
for (const [name, module] of PARTS) list.push(await loadPart(name, module));
runParts(g, list, { palette: here("palette.json"), roof: here("roof.json") });
g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for every part: palette ids (palette.json only), plan.md site coordinates, a seeded rng.
// Coordinates are module coordinates (x 0..119, z 0..145, y 0..30; module y 0 = world y 2). Ranges are inclusive.

// ---- palette: block ids, one constant per palette.json id ---------------------------------------------------
// Paths (decomposed granite): smooth_sandstone, smooth_sandstone_slab, smooth_sandstone_stairs

// ---- palette: block ids, one constant per palette.json id ---------------------------------------------------
// Paths (decomposed granite): smooth_sandstone, smooth_sandstone_slab, smooth_sandstone_stairs
export const SMOOTH_SANDSTONE = "smooth_sandstone";

export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";

export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";

// Walks and masonry: smooth_stone, smooth_stone_slab, polished_andesite, stone, tuff, andesite
export const SMOOTH_STONE = "smooth_stone";

export const SMOOTH_STONE_SLAB = "smooth_stone_slab";

export const POLISHED_ANDESITE = "polished_andesite";

export const STONE = "stone";

export const TUFF = "tuff";

export const ANDESITE = "andesite";

// Calcite (seating walls, portal trim, planters) and light paving
export const CALCITE = "calcite";

export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";

// Roads and markings: gray_concrete, white_concrete, yellow_concrete
export const GRAY_CONCRETE = "gray_concrete";

export const WHITE_CONCRETE = "white_concrete";

export const YELLOW_CONCRETE = "yellow_concrete";

// Tunnel interior: black_concrete back wall, sea_lantern ceiling lights
export const BLACK_CONCRETE = "black_concrete";

export const SEA_LANTERN = "sea_lantern";

// Timber, spruce: spruce_planks, spruce_slab, spruce_stairs, spruce_fence, spruce_fence_gate, spruce_trapdoor, ladder
export const SPRUCE_PLANKS = "spruce_planks";

export const SPRUCE_SLAB = "spruce_slab";

export const SPRUCE_STAIRS = "spruce_stairs";

export const SPRUCE_FENCE = "spruce_fence";

export const SPRUCE_FENCE_GATE = "spruce_fence_gate";

export const SPRUCE_TRAPDOOR = "spruce_trapdoor";

export const LADDER = "ladder";

// Timber, logs: stripped_spruce_log, spruce_log, stripped_oak_log, mangrove_roots, dark_oak_fence, dark_oak_log
export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log";

export const SPRUCE_LOG = "spruce_log";

export const STRIPPED_OAK_LOG = "stripped_oak_log";

export const MANGROVE_ROOTS = "mangrove_roots";

export const DARK_OAK_FENCE = "dark_oak_fence";

export const DARK_OAK_LOG = "dark_oak_log";

// Ground: grass_block, dirt, clay, coarse_dirt, gravel, sand, podzol, rooted_dirt, moss_block, water
export const GRASS_BLOCK = "grass_block";

export const DIRT = "dirt";

export const CLAY = "clay";

export const COARSE_DIRT = "coarse_dirt";

export const GRAVEL = "gravel";

export const SAND = "sand";

export const PODZOL = "podzol";

export const ROOTED_DIRT = "rooted_dirt";

export const MOSS_BLOCK = "moss_block";

export const WATER = "water";

// Planting, leaves and shrubs: azalea_leaves, flowering_azalea_leaves, dark_oak_leaves, spruce_leaves (persistent)
export const AZALEA_LEAVES = "azalea_leaves";

export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves";

export const DARK_OAK_LEAVES = "dark_oak_leaves";

export const SPRUCE_LEAVES = "spruce_leaves";

// Planting, plants: azalea, flowering_azalea, tall_grass, short_grass, fern, large_fern, dead_bush, sweet_berry_bush, moss_carpet
export const AZALEA = "azalea";

export const FLOWERING_AZALEA = "flowering_azalea";

export const TALL_GRASS = "tall_grass";

export const SHORT_GRASS = "short_grass";

export const FERN = "fern";

export const LARGE_FERN = "large_fern";

export const DEAD_BUSH = "dead_bush";

export const SWEET_BERRY_BUSH = "sweet_berry_bush";

export const MOSS_CARPET = "moss_carpet";

// Planting, flowers: allium, cornflower, dandelion, sunflower
export const ALLIUM = "allium";

export const CORNFLOWER = "cornflower";

export const DANDELION = "dandelion";

export const SUNFLOWER = "sunflower";

// Light: lantern (lamp heads), light (hidden light, level 15)
export const LANTERN = "lantern";

export const LIGHT = "light";

// ---- site: the plot ----------------------------------------------------------------------------------------
/** Grid size [x, y, z] for the whole plot: x 0..119, y 0..30 (module), z 0..145. */
export const SIZE = [120, 31, 146];

/** World y = module y + WORLD_Y_OFFSET (module y 0 is the land model's world y 2). */
export const WORLD_Y_OFFSET = 2;

/** Outer blocks of every edge that stay exactly at the mapped height and role. */
export const EDGE_LOCK = 2;

/** Path crossings at x 119 that continue straight into the east module: { z0, z1, y }. */
export const CROSSINGS = {
  toePath: { z0: 44, z1: 46, y: 4 },
  cliffWalk: { z0: 58, z1: 60, y: 7 },
  lawnSouth: { z0: 86, z1: 88, y: 7 },
  promenade: { z0: 104, z1: 107, y: 8 },
  runnel: { z0: 38, z1: 38, y: 3 },
};

// ---- site: roads, parking, water ---------------------------------------------------------------------------
/** Parkway roadway (two carriageways): x 0..40, z 80..91, road at y 4. */
export const PARKWAY = { x0: 0, x1: 40, z0: 80, z1: 91, y: 4 };

/** Parkway median barrier (polished_andesite, 1 high at y 5): x 0..40, z 85..86. */
export const PARKWAY_MEDIAN = { x0: 0, x1: 40, z0: 85, z1: 86 };

/** Crissy Field Avenue (gray_concrete, yellow double centre line z 25..26): x 0..49, z 22..29, y 3. */
export const CRISSY_AVE = { x0: 0, x1: 49, z0: 22, z1: 29, y: 3 };

/** Parking lot (white stall lines every 3 along x, rows at z 34, 44, 54, 64): x 0..45, z 30..75, y 3. */
export const PARKING = { x0: 0, x1: 45, z0: 30, z1: 75, y: 3 };

/** Marsh water (water over clay): x 0..13 at z 0, x 0..11 at z 1, x 8..9 at z 4..5. y 2. */
export const MARSH = { z0: 0, z1: 5, y: 2 };

/** Small pond (water over clay, smooth_stone kerb): x 38..39, z 24..25, y 2. */
export const POND = { x0: 38, x1: 39, z0: 24, z1: 25, y: 2 };

/** Water play runnel (stone channel, water source at y 3): x 90..117, z 38, y 3 (continues to x 119). */
export const RUNNEL = { x0: 90, x1: 117, z: 38, y: 3 };

// ---- site: tunnel portal and cut ---------------------------------------------------------------------------
/** West tunnel portal face (faces west): x 41..42, z 76..95, y 5..10. */
export const PORTAL_FACE = { x0: 41, x1: 42, z0: 76, z1: 95, y0: 5, y1: 10 };

/** North mouth (northbound) air: x 41..49, z 80..84, y 5..8. */
export const MOUTH_N = { x0: 41, x1: 49, z0: 80, z1: 84, y0: 5, y1: 8 };

/** South mouth (southbound) air: x 41..49, z 87..91, y 5..8. */
export const MOUTH_S = { x0: 41, x1: 49, z0: 87, z1: 91, y0: 5, y1: 8 };

/** Pier between the two mouths (lantern on its face at x 40, y 7): x 41..49, z 85..86. */
export const PIER = { z0: 85, z1: 86 };

/** Centre lines of the two bores (sea_lantern at y 8, x 43, 46, 49). */
export const BORE_Z = [82, 89];

/** Black_concrete back wall of the bores at x 50, y 5..8. */
export const BORE_BACK_X = 50;

/** Tunnel lid (park over it, ceiling slab y 9, grass on top at y 10): x 41..53, z 76..95. Soil to y 10 from x 43. */
export const LID = { x0: 41, x1: 53, z0: 76, z1: 95, y: 9, soilFromX: 43 };

/** Bore air (no planting roots or light blocks): x 43..49 over both mouths, y 5..8. */
export const BORE_AIR = { x0: 43, x1: 49, y0: 5, y1: 8 };

/** Retaining walls of the cut: north z 78..79, south z 92..93, x 28..40; height steps down west. */
export const RETAIN = { x0: 28, x1: 40, zN: [78, 79], zS: [92, 93] };

// ---- site: outpost, fort and play ground -------------------------------------------------------------------
/** Fort lookout tower: posts x 80..85 z 28..33, y 4..15. Deck y 12, mid platform y 8. */
export const FORT = { x0: 80, x1: 85, z0: 28, z1: 33, deckY: 12, midY: 8 };

/** Fort rope net (spruce_fence lattice): x 80..85, z 34..35, y 5..11. */
export const FORT_NET = { x0: 80, x1: 85, z0: 34, z1: 35, y0: 5, y1: 11 };

/** Fort entry (ground): x 82..83, z 28, y 4..6. */
export const FORT_ENTRY = { x0: 82, x1: 83, z: 28, y0: 4, y1: 6 };

/** Fort ladder hatch: x 82, z 29, y 12. */
export const FORT_HATCH = { x: 82, z: 29, y: 12 };

/** Climbing log pile: x 100..107, z 28..35, y 4..8. */
export const LOG_PILE = { x0: 100, x1: 107, z0: 28, z1: 35, y0: 4, y1: 8 };

/** Balance logs: x 70..79, z 34..41, y 4. */
export const BALANCE_LOGS = { x0: 70, x1: 79, z0: 34, z1: 41, y: 4 };

/** Sand pit (sand surface, boulders on the rim): x 92..99, z 21..27, y 3. */
export const SAND_PIT = { x0: 92, x1: 99, z0: 21, z1: 27, y: 3 };

/** Outpost play ground (coarse_dirt, gravel, sand patches): x 68..119, z 20..42, y 3. */
export const OUTPOST = { x0: 68, x1: 119, z0: 20, z1: 42, y: 3 };

/** Low timber fence lines (spruce_fence y 4): fence at z 19 and z 43, and at x 68; gates at (75,4,19) (110,4,19) (90..92,4,43). */
export const OUTPOST_FENCE = { zN: 19, zS: 43, xW: 68, y: 4 };

/** Boulder clusters (stone, tuff, andesite; 4..5 high) scattered in the outpost: z 20..42. */
export const BOULDER_BAND = { z0: 20, z1: 42, y0: 4, y1: 5 };

// ---- site: meadow, bluffs, lawn, terraces ------------------------------------------------------------------
/** Outpost Meadow (tall_grass, short_grass, flower drifts): x 50..67, z 18..46, y 3. */
export const MEADOW = { x0: 50, x1: 67, z0: 18, z1: 46, y: 3 };

/** Mown loop of grass_block, 2 wide (no plants): inside MEADOW. */
export const MEADOW_MOWN_LOOP_WIDTH = 2;

/** Picnic tables (centre x, z; y 3): (54, 24), (62, 30), (56, 40). */
export const PICNIC_TABLES = [[54, 24], [62, 30], [56, 40]];

/** Lower Bluff Walk (toe path, smooth_sandstone 3 wide, gentle S-bend): x 50..119, z 44..46, y 3..4. */
export const TOE_PATH = { x0: 50, x1: 119, z0: 44, z1: 46 };

/** North bluff scrub (steep, coastal scrub): x 58..119, z 47..57, y 4..6. */
export const NORTH_BLUFF = { x0: 58, x1: 119, z0: 47, z1: 57, y0: 4, y1: 6 };

/** West bluff (wraps south, coastal scrub and cypress): x 50..61, z 46..78, rising 3 to 7 eastward. */
export const WEST_BLUFF = { x0: 50, x1: 61, z0: 46, z1: 78 };

/** Cliff Walk (smooth_sandstone 3 wide, y 7): x 62..119, z 58..60. Railing on z 57. */
export const CLIFF_WALK = { x0: 62, x1: 119, z0: 58, z1: 60, y: 7 };

/** Cliff Walk railing line: z 57, posts every 4 (y 8). Rail gaps at x 76..79 and x 102..105. */
export const CLIFF_RAIL = { z: 57, y: 8, gaps: [[76, 79], [102, 105]] };

/** Overlook West deck (spruce_planks, floor y 7): x 74..81, z 50..56. */
export const OVERLOOK_W = { x0: 74, x1: 81, z0: 50, z1: 56, deckY: 7 };

/** Overlook East deck (spruce_planks, floor y 7): x 100..107, z 50..56. */
export const OVERLOOK_E = { x0: 100, x1: 107, z0: 50, z1: 56, deckY: 7 };

/** Bluff switchback (2-wide smooth_sandstone, two diagonal legs, half steps): x 88..96, z 46..58. */
export const SWITCHBACK = { x0: 88, x1: 96, z0: 46, z1: 58 };

/** Big Lawn (grass_block only, y 7): x 66..119, z 62..85. */
export const BIG_LAWN = { x0: 66, x1: 119, z0: 62, z1: 85, y: 7 };

/** Big Lawn mound (+1, staggered single-block rows, the outline wanders): x 82..112, z 68..78. */
export const LAWN_MOUND = { x0: 82, x1: 112, z0: 68, z1: 78 };

/** Lawn edge paths (smooth_sandstone 3 wide, y 7): west edge x 63..65 z 60..88; south edge x 64..119 z 86..88. */
export const LAWN_EDGE = { west: { x0: 63, x1: 65, z0: 60, z1: 88 }, south: { x0: 64, x1: 119, z0: 86, z1: 88 } };

/** Overlook terraces, west bank: x 52..77, z 89..103, y 7..9 (tiers at y 9, 8, 7). */
export const TERRACE_W = { x0: 52, x1: 77, z0: 89, z1: 103 };

/** Overlook terraces, east bank: x 100..115, z 89..103, y 7..9. Aisle x 107..108. */
export const TERRACE_E = { x0: 100, x1: 115, z0: 89, z1: 103 };

/** Terrace tiers (z ranges, y): tier 1 z 99..102 y 9; tier 2 z 94..98 y 8; tier 3 z 89..93 y 7. */
export const TIERS = [{ z0: 99, z1: 102, y: 9 }, { z0: 94, z1: 98, y: 8 }, { z0: 89, z1: 93, y: 7 }];

/** Overlook Promenade (light_gray_concrete, calcite edge bands at z 104 and z 107, y 8): x 50..119, z 104..107. */
export const PROMENADE = { x0: 50, x1: 119, z0: 104, z1: 107, y: 8 };

/** Freestanding seat walls on the lawn's south path edge (calcite 1 high, spruce_slab top, facing north), at z 85. */
export const SEAT_WALLS = [{ x0: 70, x1: 79 }, { x0: 92, x1: 101 }, { x0: 104, x1: 113 }];

/** Lid path over the tunnel lid, linking the lawn's west edge to the lid crest and down to the promenade. */
export const LID_PATH = { x0: 44, x1: 60, z0: 76, z1: 100 };

// ---- site: planting and reserved cells ---------------------------------------------------------------------
/** Cypress and pine groves (6-10 trees each): SW forest edge x 10..40 z 96..140; west bluff x 50..60 z 60..76; over the lid x 44..54 z 78..94; south x 60..75 z 108..135; SE x 104..117 z 110..132; x 0..10 z 140..145; NW meadow x 52..58 z 18..26. */
export const GROVES = [

/** B pads, kept flat for buildings placed separately (build NOTHING on them, no trees within 1). */
export const B_PADS = [

// ---- rng ------------------------------------------------------------------------------------------------------
/** Seeded PRNG (mulberry32): rng(seed)() returns a float in [0, 1). Same seed, same sequence. */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Part H1 helpers (plan.md VOCABULARY): mapHeight, halfStep, tunnelBore, logPile, lowFence, cliffRail, planter, pine.
// Module coordinates (x 0..119, z 0..145, y 0..30; module y 0 = world y 2), inclusive ranges.
// Each helper takes the grid first, then its position (and facing or axis where it has one), and writes only the
// cells of its own footprint, only into air, unless opts.replace is set. It never writes below its own footprint,
// so the ground and floors under it stay as the earlier part laid them. Returns { cells, refused }: the cells it
// wrote, and the writes it refused (occupied cells, or cells a guarded grid would not take).

/** Surface y of the ground at module (x, z): the map digit for the 2x2 cell that holds it. */
export function mapHeight(x, z)

/** A paved walk cell at (x, y, z): a bottom slab (flat), or with opts.bank a stair facing up-slope (dir). */
export function halfStep(g, x, y, z, dir = "north", opts = {})

/**
 * One tunnel bore: air x0..x0+6, y0..y0+3, z0..z0+4 (plan: x 43..49, y 5..8, z 80..84 or 87..91). Writes its side walls
 * (z0-1, z0+5), the black back wall (x0+7), the smooth_stone_slab ceiling at y0+4 and sea_lantern strip at y0+3 on the
 * centre line (x0, x0+3, x0+6). The floor (y0-1) is the parkway road laid by the terrain part, so it is not written.
 */
export function tunnelBore(g, x0, y0, z0, opts = {})

/**
 * A stepped log pile on the square x0..x0+size-1, z0..z0+size-1 (default 8), layers y0..y0+layers-1 (default 5).
 * Each layer is inset 1 more from every side (to 3, then held) so it can be climbed. Even layers are stripped_oak_log
 * along x, odd layers spruce_log along z, with a gap every third log to climb through. mangrove_roots at the two
 * bottom corners (x0,z0) and (x1,z1).
 */
export function logPile(g, x0, y0, z0, opts = {})

/**
 * A straight low spruce fence from (x0, z0) to (x1, z1) at y (plan: y 4). stripped_spruce_log posts at the ends and
 * every 6th cell. opts.gates: [x, z] cells that become spruce_fence_gate instead (the gate lies across the line).
 * Fence cells carry their connections to the neighbouring cells of the line.
 */
export function lowFence(g, x0, z0, x1, z1, y, opts = {})

/**
 * A timber rail along z at y (plan: y 8) from x0 to x1: stripped_spruce_log posts every 4 cells and at x1, spruce_fence
 * between. opts.gaps: [a, b] inclusive x ranges with no rail (the overlook openings). Nothing is written in a gap.
 */
export function cliffRail(g, x0, x1, z, y, opts = {})

/**
 * A square planter box with its corner at (x, y, z) (y = the surface it stands on): a calcite ring 1 high at y+1, dirt
 * inside at y+1, and plants at y+2 (tall_grass takes y+3 too). opts.size (default 3), opts.plants cycled over the
 * interior (default tall_grass, short_grass, fern).
 */
export function planter(g, x, y, z, opts = {})

/**
 * A pine on the ground surface y at (x, z): spruce_log trunk y+1..y+height (5-7), and an umbrella of spruce_leaves
 * (persistent) with two layers at the top: radius floor(width/2) one below the top, radius one less at the top.
 * Width 5 to 7 (rounds down to odd). The trunk is never overwritten.
 */
export function pine(g, x, y, z, opts = {})
```

### vocab/h2.mjs

```js
// Helper set 2 (plan.md VOCABULARY): ground column, curved path, retaining wall, balance log, picnic table, seat wall,
// shrub mound, lamp post. Each takes its position as arguments and returns { box, placed, refused }: the footprint it
// may write and what it did. Writes go only into air unless `over` names what the helper may replace (the ground's
// own part passes over: true). A refused cell is counted and listed, never thrown, so no helper knocks out an
// earlier part's ground, sand or floor. Block ids are literals from plan.md PALETTE.

/** Ground column at (x, z): stone at y 1 (clay under water), dirt y 2..H-1, `surface` at H. */
export function groundColumn(g, x, z, surface, H, { over = false } = {})

/** A pale path swept along a polyline, `width` wide, its surface block at row y (the ground's top; nothing below). */
export function curvePath(g, points, { width = 2, y, block = "smooth_sandstone", over = GROUND } = {})

/** Retaining wall over x0..x1, z0..z1: smooth_stone from y0 to hTop-1, calcite course at hTop, smooth_stone_slab cap above. */
export function retainWall(g, x0, x1, z0, z1, hTop, { y0 = 5, over = false } = {})

/** One stripped oak beam of `len` along axis x or z, from (x, y, z). Stack five crosswise for the balance logs. */
export function balanceLog(g, x, z, len, axis, { y = 4, over = false } = {})

/** Picnic table centred on (x, y, z), y the first air level above the ground. Top runs along `axis`, seats on both sides.
 *  Footprint 3x3 x 2 high; nothing is written above y+1 outside it, so a 2-high lane stays clear past it. */
export function picnicTable(g, x, y, z, { axis = "x", over = false } = {})

/** Seat wall along x0..x1 at row z: calcite riser at y, spruce_slab seat on it at y+1. `aisles` ([a, b] x ranges) get a
 *  smooth_sandstone_slab half-step at y instead. */
export function seatWall(g, x0, x1, y, z, { aisles = [], over = false } = {})

/** Domed shrub heap w x d, h layers high, its first layer at y, centred on (cx, cz). Persistent leaves, flowering on a
 *  deterministic 1-in-4 (seed shifts it). The ground under it is not touched. */
export function shrubMound(g, cx, cz, w, d, h, y, { seed = 0, over = false } = {})

/** Lamp post on (x, y, z): dark_oak_fence y..y+2, lantern standing on it at y+3. y is the first air level above the ground. */
export function lampPost(g, x, y, z, { over = false } = {})
```

### vocab/h3.mjs

```js
// Landscape helpers for Tunnel Tops west (plan.md VOCABULARY): the eight names, nothing else.
// Module coordinates (x 0..119, z 0..145, y 0..30). A helper takes its position as arguments, writes only inside the
// footprint it is given, and writes only into air. The one exception is the surface row of roadStrip and tier:
// { over: true } lets them replace the ground block at their own y, never any other y. Each returns { placed, refused }.
// A `y` argument is the y of the surface block the helper stands on (the mapped H); the helper builds above it.

/** A grey road strip on the surface row y. axis: the direction the road runs ("x" or "z"). Edges white solid, a yellow
 *  centre line (two for an even width), white dashed lane lines (3 on, 3 off) between edge and centre when the road is 7+
 *  wide. Pass { over: true } to lay it over the ground at y. */
export function roadStrip(g, x0, z0, x1, z1, y, { axis = "x", over = false } = {})

/** A lawn mound one block high (grass_block at y + 1) over the rectangle, its outline wandering: odd rows are staggered
 *  half a block and the edge is wobbled, so it reads as a soft swell, not a terrace. Air only, so it sits on the lawn. */
export function moundLawn(g, x0, z0, x1, z1, y, { seed = 1 } = {})

/** The Fort lookout on a 6 x 6 deck. (x, z) = the NW post cell, y = the mound's surface (4). Posts y+1..y+11, a mid
 *  platform at y+4 (south half), the deck at y+8 with an open spruce trapdoor hatch in it, a fence rail at y+9, a ladder
 *  on the inside of the north face (y+1..y+7, backed by planks at y+3..y+7), a hip cap of stair rings at y+11 and y+12
 *  with a 2 x 2 slab apex, and a hanging lantern under each eave corner. Footprint x-1..x+6, z-1..z+6, y+1..y+12. */
export function fortTower(g, x, z, y)

/** A boulder of 2..4 blocks (stone, tuff or andesite) on the square of side 2r at (x, z), on the surface y, one or two
 *  high. r = 1 gives a 2 x 2 footprint; the blocks nearest the centre are chosen first. seed varies it; tall forces or
 *  forbids the second course. Air only. */
export function boulder(g, x, z, y, r = 1, { seed = 1, tall } = {})

/** A bench at (x, y, z), the seat block on the surface y - 1 (the support must be solid, or nothing is placed). facing:
 *  the way the seat looks (toward the view). Spruce stairs with their back to the view, an open trapdoor arm either end.
 *  Writes its own three cells only, so the 2-high lane in front of it stays clear. */
export function bench(g, x, y, z, facing)

/** A terrace tier over x0..x1, z0..z1 with its surface at y: light_gray_concrete (or `surface`), calcite edging, and a
 *  seat wall on the north edge (calcite riser at y + 1, spruce slab seat at y + 2). aisles: x starts of 2-wide gaps in
 *  the seat wall. Pass { over: true } to lay the surface over the ground at y. */
export function tier(g, x0, x1, z0, z1, y, { surface = "light_gray_concrete", seat = true, aisles = [], over = false } = {})

/** Plants in clumps on the surface y over the rectangle: the area is cut into 3 x 3 patches, about 60% of them planted,
 *  each cell ragged. kind: "grey-green" | "ochre" | "purple" | "meadow". Plants stand on grass, dirt, podzol or moss
 *  only (other cells are skipped). Tall grass writes both halves. */
export function drift(g, kind, x0, z0, x1, z1, y, { seed = 1 } = {})

/** A hidden light (level 15) at (x, y + 1), y the surface under it. ring: moss carpet on the eight cells round it, for
 *  planting; on the lawn leave ring off. Nothing is placed if there is no ground under it. */
export function hiddenLight(g, x, z, y, { ring = false } = {})
```

### vocab/h4.mjs

```js
// Tunnel Tops west, helpers h4 (plan.md VOCABULARY): walkStrip, portalFace, fenceNet, runnel, overlookDeck,
// promenade, cypress. Each takes the grid first, then its position (and facing) as arguments, and returns
// { placed, refused }. Writes go only into air unless `over: true` (then they may replace a surface cell
// an earlier part laid); anything refused is listed as [x, y, z] so the caller can see it.

/**
 * A walk at surface height `height` (a number or (x, z) => H) over the box x0..x1 by z0..z1. Each cell gets the full
 * `block` at its H. Where H changes by 1 along `dir` ("x" or "z"), the lower cell gets a bottom slab at H+1 on its own
 * full block (the half-step). Covers y H and H+1 only.
 */
export function walkStrip(g, x0, z0, x1, z1, { height, dir = "x", block = "smooth_stone", over = false } = {})

/**
 * The west tunnel portal face: face columns x0..x0+1 over z0..z1. Plinth polished_andesite y5, smooth_stone y6..9,
 * calcite coping y10 (and calcite lintel y9 over each mouth). The coping is proud at x0-1. Mouths are left open
 * (air) at y5..8. The pier between the mouths carries a wall lantern at (x0-1, 7, pier start) on a stone bracket.
 * mouths: [[z0, z1], ...] (plan: [[80, 84], [87, 91]]).
 */
export function portalFace(g, x0, z0, z1, { mouths = [[80, 84], [87, 91]], over = false } = {})

/**
 * A spruce fence lattice over x0..x1 by z0..z1 (rows run north at z0 to south at z1). Each row's top rises linearly
 * from ySouth at z1 to yNorth at z0, and the lattice fills y yLow..top where (x + y) is even.
 */
export function fenceNet(g, x0, z0, x1, z1, { yLow = 5, yNorth = 11, ySouth = 8, over = false } = {})

/**
 * A water runnel: stone bed at y-1 along z, 1-wide water source at y in the channel, stone side walls at y on z-1 and
 * z+1, and a top-half stone slab lip on z-2 and z+2. The water at x1 is always written (it runs out into the sister
 * module), even over ground, so it is never refused.
 */
export function runnel(g, x0, x1, z, { y = 3, over = false } = {})

/**
 * An overlook deck over x0..x0+7 by z0..z0+6 with its floor at `floor` (plan: 7). Spruce planks floor, stripped spruce
 * posts down to the ground at the corners and the edge midpoints, a spruce fence rail at floor+1 on the north, east and
 * west edges (the south edge is open to the Cliff Walk), two benches on row z0+1 (stairs facing south, so the seat
 * looks north, with open trapdoor arms), and two dark oak lamp posts at the inner south corners. Nothing above the
 * benches, so the lane past them stays clear.
 */
export function overlookDeck(g, x0, z0, { floor = 7, over = false } = {})

/**
 * A promenade over x0..x1 by z0..z1 at surface y: light_gray_concrete paving with a calcite band on the z0 and z1 edges.
 */
export function promenade(g, x0, z0, x1, z1, { y = 8, over = false } = {})

/**
 * A Monterey cypress rooted at (x, y, z), y being the first air cell above the ground. Trunk dark_oak_log 4-6 high; the
 * top block sometimes leans one east (a horizontal log). The crown is a flat-topped dark_oak_leaves disc 7-11 wide,
 * 2-3 thick, longer to the east, persistent.
 */
export function cypress(g, x, y, z, seed = 1, { over = false } = {})
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

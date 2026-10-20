# Plan: Rockefeller Center Lower Plaza + Channel Gardens (landscape modules)

All coordinates are in the brief's shared frame: plot 0 = x 0..50, z 0..53; plot 1 = x 55..108, z 0..15. Each plot has its own y 0 (its lowest ground). North = low z, Fifth Avenue = high x. A "surface at g" means the top solid block sits at y = g; you stand at g+1.
Ground map: each map cell = 2x2 blocks (map column i = x 2i..2i+1 of the plot, map row j = z 2j..2j+1). Fill solid `stone` from y 0 to the cell's height minus 1, and put the surface block at that height. Where two neighbouring cells differ by 1, the higher one's edge row is a bottom slab of the surface material (a half step). **Outermost 2 blocks of every edge stay exactly at the mapped heights.**

## SITE

### Plot 0: Rockefeller Plaza (the street) and the Sunken Lower Plaza (y 0 = rink floor, max y 22)

| Mass | x | y | z | Notes |
|---|---|---|---|---|
| West sidewalk (foot of 30 Rock) | 0..3 | surface 4/5 per map | 0..53 | pavers; lamps |
| Rockefeller Plaza roadway | 4..12 | surface 5 for z 0..19, 4 for z 22..53; z 20..21 = bottom slab at y5 (half-step ramp) | 0..53 | gray concrete, curbs x 4 and x 12 are smooth_stone_slab-edged |
| Crosswalks | 4..12 | on road surface | 2..4 and 49..51 | smooth_stone stripes every other x |
| East sidewalk | 13..16 | per map (4/5) | 0..53 | pavers; lamps |
| West promenade strip | 17..19 | 4/5 per map | 0..53 except the Prometheus wall | flag line x 17 |
| North promenade (roof of north restaurant) | 17..50 | surface 4 (map 5 at z 0..3 where mapped) | 0..9 | flag line z 7 |
| South promenade (roof of south restaurant) | 17..50 | surface 4 (5 where mapped at z 50..53) | 46..53 | flag line z 48 |
| East promenade | 46..50 | surface 4 | 0..53 | flag line x 48; stair head cut z 20..33 |
| THE WELL (sunken lower plaza) | 20..45 | floor surface 0 | 10..45 | retaining walls up to y 4 on all sides |
| North restaurant (under promenade) | 22..43 | floor block 0, interior 1..3, ceiling = promenade slab y 4 | 3..9 | glass front at z 9 facing the rink; back wall z 3 |
| South restaurant (under promenade) | 22..43 | floor 0, interior 1..3, ceiling y 4 | 46..51 | glass front at z 46; back wall z 51 |
| North dining terrace | 20..41 | floor surface 0 | 10..12 | umbrellas |
| South dining terrace | 20..41 | floor surface 0 | 43..45 | umbrellas |
| Ice rink | 24..39 | ice surface at y 0 | 14..41 | 16 x 28, long axis N-S |
| Rink rim (dasher board) | ring x 23..40, z 13..42 | y 1 | — | white; gap x 40, z 25..28 (rink gate to the stairs); west side z 20..35 is the fountain's dark rim instead |
| East aisle (rink to stairs) | 41 | floor 0 | 13..42 | 1-wide landing at stair foot |
| Channel Gardens steps | 42..47 | treads: x 42..43 top y1, x 44..45 top y2, x 46..47 top y3; landing x 48 at y4 | 20..33 | 14 wide, 2-deep treads, solid stone under each tread; cheek walls z 19 and z 34 |
| Stair-head planters | 46..48 | box y 4..5 (curb top y5), soil y5, shrubs y6..7 | 17..19 and 34..36 | flank the axis |
| PROMETHEUS back wall | 18..19 | 0..10 | 18..37 | dark granite, zodiac ring + inscription on east face (x 19) |
| Prometheus basin | 20..22 | floor y0, water y1 | 20..35 | dark rim at x 23, y 1..2 |
| Cascade ledges | 20 | ledge slab y 5, water source on it y 6 | 20..23 and 32..35 | water falls into basin either side of the statue |
| Gilded mount (pedestal) | 20..22 | 1..4 | 26..29 | stepped gold cone rising from water |
| Gold ring | plane x 21 | 2..9 | 24..31 | vertical ring (8 across), seen face-on from the east/gardens |
| Prometheus figure | 20..22 | body 5..6, raised arm to 8, fire at 9 | 25..30 (arm z 30..31) | flying horizontally along z, head south-ish at z 30, faces east |

Parapet lines (y 5, on the promenade at the well's lip): north on z 9 for x 20..45 (sits over the restaurant glass head); south on z 46 for x 20..45; west on x 19 for z 10..17 and z 38..45; east on x 46 for z 10..19 and z 34..45 (open across the stair head z 20..33).

Flagpoles (the ring): white poles y 5..11 (7 tall, standing on the y 4 promenade), one every 2 blocks:
| Line | Poles at | Flags (wool 2 out x 2 tall, y 10..11) point |
|---|---|---|
| North | z 7, x 20,22,...,46 (14) | north: z 5..6 |
| South | z 48, x 20,22,...,46 (14) | south: z 49..50 |
| West | x 17, z 8,10,...,48 (21) | west: x 15..16 |
| East | x 48, z 8,10,...,16 and 38,40,...,48 (11) | east: x 49..50 |
Corner poles shared (x 17/48 rows supply the corners). No pole on the stair head landing z 18..36 at x 48.

Street lamps: lamp posts (post y g+1..g+4, lantern g+5) at x 2 and x 14, z 5, 15, 25, 35, 45.

### Plot 1: The Channel Gardens (y 0 = lowest ground at the west/plaza end, max y 14)

Ground levels used (snap the lidar to three level terraces, edges kept at the map): **g = 0 for x 55..74, g = 1 for x 75..96, g = 2 for x 97..108.** The step-ups are bottom-slab half steps in the crosswalks at x 73..74 and x 97..98 across the full width.

| Mass | x | y | z | Notes |
|---|---|---|---|---|
| North walk (along British Empire Bldg) | 55..108 | surface g | 0..3 | pavers, lamps at z 2 |
| North planter | 59..104, broken at crosswalks | curb top g+1, soil g+1, plants g+2..g+3 | 4..5 | curb on its outer edge z 4 side and ends |
| Pools (centre line) | see table | rim g+1, water g+1, floor g | 6..9 | rim z 6 and z 9 + ends; water z 7..8 |
| South planter | 59..104, broken at crosswalks | as north | 10..11 | |
| South walk (along La Maison Francaise) | 55..108 | surface g | 12..15 | lamps at z 13 |
| West head (top of the steps to the Lower Plaza) | 55..58 | surface 0 | 0..15 | open paved landing |
| East opening onto Fifth Avenue | 105..108 | surface 2 | 0..15 | open paved forecourt |

| Pool | x | g | Crosswalk after it |
|---|---|---|---|
| P1 | 59..64 | 0 | 65..66 |
| P2 | 67..72 | 0 | 73..74 (half step 0→1) |
| P3 | 75..80 | 1 | 81..82 |
| P4 | 83..88 | 1 | 89..90 |
| P5 | 91..96 | 1 | 97..98 (half step 1→2) |
| P6 | 99..104 | 2 | — |
Each pool 6 long (outer), water 4 long x 2 wide. Fountain jet: at each pool's EAST end, inside the water at x = pool x1−1, z 7..8: a bronze figure block at g+1 with a water source on it at g+2 (pouring west down the pool).

Planter segments match the pools (x 59..64, 67..72, 75..80, 83..88, 91..96, 99..104), so each crosswalk runs straight across from walk to walk.
Lamps: posts y g+1..g+4, lantern at g+5, at x 58, 66, 74, 82, 90, 98, 106, on z 2 and z 13.
Benches: `polished_andesite_stairs` benches backed against the planter curbs, at z 3 (facing north) and z 12 (facing south), two per planter segment.

## ROOFS
No buildings, so no `$MCD roof` preset. The only "roofs" are hand-built by the ground part:
- North and south restaurant ceilings = the promenade slab itself (solid smooth_stone surface at y 4, stone below to y 4 over the interior; interior air y 1..3). Flat, flush, walkable, lit.
- Umbrellas on the dining terraces (hand-built): `birch_fence` pole y 1..2, a 3x3 canopy of `white_wool` at y 3, a lantern hanging under a canopy corner at y 2. Umbrella centres: north terrace z 11, x 25, 30, 35; south terrace z 44, x 25, 30, 35 (their canopies stay below street level y 4: read from above as white squares in the well).
- Prometheus wall top: flat, top course y 10 `polished_blackstone_bricks`, nothing above it, so the gold figure reads against dark stone; lanterns stand on it at z 18, 23, 32, 37.

## FACADES
Plot 0 faces seen from above and from the rink:
- **Prometheus wall (east face x 19, z 18..37, y 0..10):** base course y 0 `polished_blackstone`; body `polished_blackstone_bricks` with `deepslate_tiles` panels; ZODIAC RING set flush in the face: a circle of `gold_block` radius ~4.5 centred (y 5.5, z 27.5) spanning z 23..32, y 1..10, with 12 `chiseled_polished_blackstone` sign marks on it (reserved cells, see RESERVED); INSCRIPTION band at y 9 across z 19..36: alternating `raw_gold_block` and `polished_blackstone_bricks` (reads as gilded lettering at distance), not crossing the ring cells; top course y 10 `polished_blackstone_bricks`. Depth: all flush; the ring is flush gold in the dark face.
- **Restaurant fronts (north at z 9, south at z 46; x 22..43, y 1..3):** piers of `polished_andesite` at x 22, 26, 30, 34, 38, 42 (and 43), y 1..3, flush with the well wall; between them full-height glass `glass_pane` y 1..3 (3 wide bays); head = the promenade slab edge at y 4 in `polished_andesite` (a dark band under the parapet); inside each bay warm light (an `ochre_froglight` in the ceiling at y 3, one per bay, 1 back from the glass) and a few tables. Door: one double glass door per restaurant at the centre bay (see OPENINGS).
- **Well retaining walls (elsewhere):** `polished_andesite` from y 0 to y 3, top course y 4 `smooth_stone` (promenade surface), parapet y 5: `polished_andesite_wall` posts every 4th cell with `iron_bars` railing between, a lantern standing on every post.
- **Rink rim:** `white_concrete` y 1 ring; `lantern` standing on every 4th rim cell.
- **Fountain rim:** `polished_blackstone` y 1, `polished_blackstone_slab` y 2 cap, x 23, z 20..35.
- **Steps:** treads full `polished_andesite` blocks (no slabs); cheek walls z 19 and z 34 `polished_andesite`, top flush with the tread beside it, each cheek stepping with the treads.
- **Street:** road `gray_concrete`, curbs `smooth_stone`, sidewalks `polished_andesite` with `smooth_stone` paver bands every 4 z.
- **Promenade:** `smooth_stone` field with `polished_andesite` bands every 6 blocks (a grid read from the air), a 1-wide `polished_andesite` border inside each parapet.
Plot 1:
- **Pool rims:** `polished_andesite` blocks at g+1 (long sides and ends), flush tops; pool floor `prismarine_bricks` (the turquoise-tiled floor of the photo).
- **Planter curbs:** `polished_blackstone` at g+1 on the walk side and ends (the pool rim serves as the inner curb), soil `grass_block`/`moss_block` mix at g+1 inside.
- **Walks:** `smooth_stone` with `polished_andesite` cross bands at every crosswalk line and at x 58 and x 105.

## MATERIALS
| Role | Block id |
|---|---|
| Fill under all ground | `stone` |
| Promenade / garden walk field (pale granite) | `smooth_stone` |
| Granite bands, borders, parapets, retaining walls, piers, steps, rims | `polished_andesite` (+ `polished_andesite_slab`, `polished_andesite_stairs`, `polished_andesite_wall`) |
| Railing | `iron_bars` |
| Road | `gray_concrete` |
| Curbs, crosswalk stripes | `smooth_stone`, `smooth_stone_slab` |
| Prometheus wall body | `polished_blackstone_bricks` |
| Prometheus wall panels | `deepslate_tiles` |
| Wall base, fountain rim | `polished_blackstone`, `polished_blackstone_slab` |
| Zodiac sign marks | `chiseled_polished_blackstone` |
| Statue gilding (body, ring, mount, zodiac ring) | `gold_block` |
| Statue modelling / shadow, inscription | `raw_gold_block`, accent `yellow_terracotta` |
| The fire in his hand | `shroomlight` |
| Water (basin, pools, jets) | `water` |
| Rink | `packed_ice` (surface); `ice` not used |
| Rink rim | `white_concrete` |
| Restaurant glass | `glass_pane` |
| Restaurant interior glow | `ochre_froglight` |
| Umbrellas | `white_wool`, pole `birch_fence` |
| Flagpoles | `end_rod` (axis y, stacked y 5..11; they glow at dusk) |
| Flags (2 tall: top/bottom colour pairs like national flags) | `red_wool`, `white_wool`, `blue_wool`, `green_wool`, `yellow_wool`, `black_wool`, `orange_wool`, `light_blue_wool` |
| Pool floor | `prismarine_bricks` |
| Planter curb | `polished_blackstone` |
| Planter soil | `grass_block`, `moss_block` |
| Clipped shrubs | `azalea`, `flowering_azalea`, `azalea_leaves`, `flowering_azalea_leaves`, `oak_leaves` (persistent) |
| Flowers | `allium`, `red_tulip`, `orange_tulip`, `pink_tulip`, `white_tulip`, `peony`, `rose_bush`, `lilac`, `cornflower`, `oxeye_daisy` |
| Bronze jets | `waxed_exposed_copper` |
| Lamps | post `polished_blackstone_wall` (both plots), head `lantern` standing on top |
| Benches | `polished_andesite_stairs`, `smooth_stone_slab` |
All checked with `$MCD blocks --check` (all known). **1.21.1:** if any part hangs a lantern from a chain, the id is `chain` (the toolkit only knows `iron_chain`; swap before delivery). Nothing pale oak or 1.21.4+.
Colour scheme (keep): pale grey granite field, darker andesite grid and edges; a black stone backdrop with GOLD at the west end; the white rink and white umbrellas in the well; a ring of white poles with bright mixed flags; the Channel Gardens a green-and-flower band with turquoise pools down its centre.

## OPENINGS
| Opening | Location | Size |
|---|---|---|
| North restaurant door (glass double door, facing south onto the terrace) | x 32..33, y 1..2, z 9 | 2 wide x 2 |
| South restaurant door (facing north) | x 32..33, y 1..2, z 46 | 2 wide x 2 |
| Restaurant glass bays | between piers, x 23..25, 27..29, 31..33 (door bay 32..33 doors, 31 glass), 35..37, 39..41, y 1..3, at z 9 and z 46 | 3 x 3 each |
| Rink gate | rim gap x 40, z 25..28 | 4 wide |
| Gaps in the rink rim to each terrace | rim north z 13 gap x 30..33; south z 42 gap x 30..33 | 4 wide |
| Stair head opening | parapet open on x 46, z 20..33 | 14 wide |
| Street access into the promenade | parapet-free everywhere on the outer side; no barrier between sidewalk x 16 and promenade x 17 | — |
Plot 1: crosswalks x 65..66, 73..74, 81..82, 89..90, 97..98 open from walk to walk (z 0..15), no curb across them.

## RESERVED
Shell (ground/wall part) leaves these cells as AIR for later parts:
- Rink ice: x 24..39, y 0, z 14..41 (the ice part lays packed ice; the ground part leaves y 0 empty there).
- Prometheus basin water: x 20..22, y 1, z 20..35 except the mount x 20..22, z 26..29; basin floor y 0 is `polished_blackstone` laid by the shell.
- Mount + figure + ring volume: x 20..22, y 1..9, z 24..31 (air for the statue part).
- Cascade ledges: x 20, y 5..6, z 20..23 and 32..35.
- Zodiac ring cells in the wall face: x 19, the circle on z 23..32, y 1..10 (shell leaves them air; the ornament part fills gold + 12 chiseled marks). Inscription band x 19, y 9, z 19..22 and 33..36 likewise air.
- Restaurant glass bays and doors (above) and interiors x 23..42, y 1..3, z 4..8 and z 47..50.
- Flag pole cells and flag cells (listed in SITE) above the promenade: air already.
- Plot 1 pools: water cells x pool x0+1..x1−1, y g+1, z 7..8; jet figure cell + its water source.
- Plot 1 planter soil: inside the curbs at y g+1 (soil) and g+2.. (plants), z 4..5 and 10..11 within each segment.
- Planter boxes at the stair head (plot 0): x 46..48, y 5..7, z 17..19 and 34..36 (curb + soil at y 5, shrubs 6..7; surface y 4 stays).

## FLOORS
| Level | y | Where |
|---|---|---|
| Rink / lower plaza floor (surface) | 0 (stand at 1) | well x 20..45, z 10..45 |
| Restaurant floors | 0 (interior 1..3) | x 23..42, z 4..8 and 47..50 |
| Step treads | 1, 2, 3 | x 42..47, z 20..33 |
| Street-level promenade | 4 (stand at 5); 5 where the map says 5 | ring around the well |
| Rockefeller Plaza road | 5 north of z 19, 4 south of z 22 | x 4..12 |
| Prometheus wall top | 10 | x 18..19, z 18..37 |
| Flag tops | 11 | ring |
| Channel Gardens terraces | 0 / 1 / 2 (plot 1's own datum) | x 55..74 / 75..96 / 97..108 |
No interiors beyond the two restaurant strips seen through glass. Light: lanterns on parapet posts every 4, on the rink rim every 4, under each umbrella, on every lamp post; end_rod poles glow; restaurants lit by froglights; planter and pool rims within 7 of a lamp. No dark ground cell anywhere.

# DESIGNER SECTIONS

## PALETTE
Architect's MATERIALS table kept exactly, with ONE FIX: `polished_andesite_wall` does not exist; use `andesite_wall` (wall posts, matching stone). Variants: `polished_andesite_slab/stairs` (type bottom/top, facing, half), `smooth_stone_slab`, `polished_blackstone_slab`, `polished_blackstone_wall`, `andesite_wall`, `birch_fence`, `glass_pane` (set connections), `birch_door` (lower/upper, facing north/south out of the restaurant), `iron_bars`. Decor: `lantern` (hanging false on posts), `shroomlight`, `ochre_froglight`, `waxed_exposed_copper` jets, `candle` (lit) on restaurant tables with `spruce_trapdoor`... use `birch_pressure_plate` on fence for tables. Flower ids checked. Banners not used (wool flags). Use `chain` not `iron_chain`. All other ids checked OK with `$MCD blocks --check`.

## VOCABULARY
- groundColumn(x,z,h): stone y0..h-1, surface block at h (smooth_stone or per role); outer 2 edge blocks exact.
- halfStep(x,z,h): bottom polished_andesite_slab/smooth_stone_slab at h on the higher cell's edge row.
- roadStrip(x0,x1): gray_concrete surface, smooth_stone_slab curbs at x0, x1.
- crosswalk(z0,z1): smooth_stone stripes every other x on road.
- paverBand(axis,pos): polished_andesite line across smooth_stone.
- lampPost(x,z,g): polished_blackstone_wall g+1..g+4, lantern hanging=false g+5.
- wellWall(): polished_andesite y0..3, smooth_stone y4 course on the well perimeter.
- rinkRim(): white_concrete ring y1; lantern on every 4th.
- gardenSteps(): polished_andesite full blocks, solid below, treads y1,2,3.
- planterBox(x0,z0): blackstone curb y5, moss_block/grass_block soil, azalea/flowering_azalea above.
- glassFront(z,facing): andesite piers every 4, glass_pane bays y1..3 with connection states, double birch_door at x32..33.
- froglightBay(x): ochre_froglight at y3 one back from glass; table = birch_fence + top polished_andesite_slab, lit candle.
- umbrella(x,z): birch_fence y1..2, white_wool 3x3 at y3.
- parapet(line): andesite_wall posts every 4th, iron_bars between, lantern on posts.
- promenadeField(): smooth_stone with andesite bands every 6 and border.
- darkWall(): blackstone base y0, bricks body, deepslate_tiles panels, top y10.
- zodiacRing(): gold_block circle plus 12 chiseled_polished_blackstone marks.
- inscriptionBand(): alternating raw_gold_block / blackstone bricks at y9.
- basin()/cascade(): blackstone floor/rim, water sources, ledge sources.
- goldMount(), prometheus(), goldRing(): gold_block shapes, raw_gold/yellow_terracotta modelling, shroomlight fire.
- flagPole(x,z,dir,colours): end_rod y5..11, 2x2 wool at y10..11 pointing dir.
- pool(x0,g): andesite rim g+1, prismarine_bricks floor g, water 4x2.
- jet(x,g): waxed_exposed_copper g+1, water source g+2.
- plantBed(x0,x1,z0,g): blackstone curb, soil, mixed flowers/shrubs.
- bench(x,z,facing): polished_andesite_stairs.

## ROOMS
None (landscape; no interiors beyond the glass-fronted restaurant strips, which are decor behind glass, not rooms).

## PARTS
1. Ground (modules/ground.mjs): both plots' terrain, street, promenade, walks.
2. Well (parts/well.mjs): walls, rink, steps, restaurants, terraces, parapets, planters.
3. Prometheus (parts/prometheus.mjs): wall, zodiac, basin, figure, ring.
4. Flags (parts/flags.mjs): pole ring and flags.
5. Gardens (parts/gardens.mjs): pools, planters, benches, jets.
6. Lighting (parts/lights.mjs): lamps, lanterns, check dark cells.

## Notes
Entrance x/z are in the brief frame; plot 0 local. Keep within plot. Do not touch reserved cells outside owning part.
- ground part: well perimeter cells (x20/45,z10/45 ring), steps x42..47 z20..33, Prometheus wall x18..19 z18..37 and rink are left AIR; basin x20..22 z20..35 floor y0 is smooth_stone; restaurant strips have floor y0 and ceiling y4 only (walls z3/z51, x22/x43 solid y0..4).

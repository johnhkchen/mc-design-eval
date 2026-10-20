# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
```

### elements.md

```markdown
# REQUIRED ELEMENTS (coordinates from plan.md; plot 0 frame x0..50 z0..53, plot 1 frame x55..108 z0..15)
Parts: P1 ground, P2 well, P3 prometheus, P4 flags, P5 gardens, P6 lights. Vocab names in brackets.

- [ ] Ground of every column to the map (stone fill, surface per plan, half-step slabs, outer 2 blocks exact) - P1 - `groundColumn`, `halfStep`
- [ ] Rockefeller Plaza street: gray_concrete road x4..12, smooth_stone_slab curbs x4/x12, crosswalk stripes z2..4 and 49..51, andesite-paved sidewalks x0..3 and 13..16 - P1 - `roadStrip`, `crosswalk`, `paverBand`
- [ ] Street lamps x2,x14 z5,15,25,35,45: polished_blackstone_wall post 4 high + lantern(hanging=false) on top - P6 - `lampPost`
- [ ] Sunken well 20..45 x 10..45, floor y0, andesite retaining walls y0..3 and smooth_stone surface y4 - P2 - `wellWall`
- [ ] Ice rink packed_ice x24..39 y0 z14..41 with white_concrete rim ring y1 (gates x40 z25..28, z13/z42 x30..33), lanterns every 4th rim cell - P2 - `rinkRim`
- [ ] Stepped granite edge / Channel Gardens steps x42..47 z20..33, full polished_andesite blocks, cheeks z19/z34 - P2 - `gardenSteps`
- [ ] Stair-head planters x46..48 z17..19, 34..36 (blackstone curb, moss/grass soil, azalea shrubs) - P2 - `planterBox`
- [ ] Sunken restaurants N/S: piers, glass_pane bays, double doors x32..33, ochre_froglight glow, tables - P2 - `glassFront`, `froglightBay`
- [ ] Dining terraces with 6 umbrellas (birch_fence pole, 3x3 white_wool, hanging-free lantern) - P2 - `umbrella`
- [ ] Parapets y5 with andesite_wall posts every 4th + iron_bars railing + lantern on posts - P2 - `parapet`
- [ ] Pale granite promenade: smooth_stone field, polished_andesite grid bands every 6 and border - P1 - `promenadeField`
- [ ] PROMETHEUS dark wall x18..19 y0..10 z18..37, blackstone bricks + deepslate_tiles panels, top course y10 - P3 - `darkWall`
- [ ] Zodiac gold ring r4.5 on wall face x19 centre (y5.5,z27.5), 12 chiseled_polished_blackstone marks - P3 - `zodiacRing`
- [ ] Inscription band y9 alternating raw_gold_block / blackstone bricks - P3 - `inscriptionBand`
- [ ] Fountain basin x20..22 z20..35, polished_blackstone floor/rim, water, cascade ledges with water sources - P3 - `basin`, `cascade`
- [ ] Gilded mount: stepped gold cone x20..22 y1..4 z26..29 - P3 - `goldMount`
- [ ] Prometheus figure: flying body along z, gold_block with raw_gold_block / yellow_terracotta modelling, raised arm, shroomlight fire y9 - P3 - `prometheus`
- [ ] Gold ring plane x21 y2..9 z24..31 - P3 - `goldRing`
- [ ] Water jets in basin (water source columns) - P3 - `basin`
- [ ] Flag ring: end_rod poles y5..11 every 2 blocks on 4 sides, wool flags 2x2 mixed colours - P4 - `flagPole`
- [ ] Channel Gardens: terraces 0/1/2, step-up slabs, walks, west head, east forecourt - P5 - `groundColumn`, `halfStep`, `paverBand`
- [ ] Six granite pools with prismarine_bricks floor, water, andesite rims, bronze jet - P5 - `pool`, `jet`
- [ ] Planters with flowers/shrubs, blackstone curbs - P5 - `plantBed`
- [ ] Benches (andesite stairs backed on curb) - P5 - `bench`
- [ ] Garden lamps x58..106 step 8, z2 and z13 - P6 - `lampPost`
- [ ] Dusk light: every walk, terrace, roof lit; no dark cell - P6 - `lampPost`, lanterns on parapet/rim
```

### rooms.json

```json
{"entrance":[10,5,26],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "fill": ["stone"],
    "field": ["smooth_stone", "smooth_stone_slab"],
    "granite": ["polished_andesite", "polished_andesite_slab", "polished_andesite_stairs", "andesite_wall"],
    "railing": ["iron_bars"],
    "road": ["gray_concrete"],
    "dark_stone": ["polished_blackstone_bricks", "deepslate_tiles", "polished_blackstone", "polished_blackstone_slab", "chiseled_polished_blackstone"],
    "gold": ["gold_block", "raw_gold_block", "yellow_terracotta"],
    "water": ["water"],
    "rink": ["packed_ice", "white_concrete"],
    "glass": ["glass_pane"],
    "birch": ["birch_fence", "birch_door", "birch_pressure_plate"],
    "pool_floor": ["prismarine_bricks"],
    "planter": ["grass_block", "moss_block"],
    "flag_wool": ["red_wool", "white_wool", "blue_wool", "green_wool", "yellow_wool", "black_wool", "orange_wool", "light_blue_wool"]
  },
  "objects": [
    "lantern", "candle", "ochre_froglight", "shroomlight", "end_rod", "waxed_exposed_copper",
    "azalea", "flowering_azalea", "azalea_leaves", "flowering_azalea_leaves", "oak_leaves",
    "allium", "red_tulip", "orange_tulip", "pink_tulip", "white_tulip", "peony", "rose_bush", "lilac", "cornflower", "oxeye_daisy",
    "polished_blackstone_wall"
  ]
}
```

### make.sh

```sh
#!/usr/bin/env bash
# Makes build.nbt from scratch: build.mjs writes a temp file, which replaces build.nbt only once the build succeeds.
set -euo pipefail
cd "$(dirname "$0")"
tmp=".build.$$.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv -f "$tmp" build.nbt
```

### build.mjs

```js
// Builds the plaza from its parts, in order, into the path given as the first argument.
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE } from "./vocab/base.mjs";

// [name, module] in build order; the ground lays the terrain first, then each part only adds to what came before
const PARTS = [
  ["ground", "parts/ground.mjs"],
  ["sunken well", "parts/well.mjs"],
  ["prometheus", "parts/prometheus.mjs"],
  ["flags", "parts/flags.mjs"],
  ["channel gardens", "parts/gardens.mjs"],
  ["lighting", "parts/lights.mjs"],
];

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }

// a part whose module isn't written yet (another copy of the build) is laid as an empty stub, never an error
const list = [];
for (const [name, file] of PARTS) {
  if (!existsSync(file)) { console.log(`part ${name}: ${file} missing, laid as an empty stub`); list.push([name, () => {}]); continue; }
  const { build } = await import(new URL(`./${file}`, import.meta.url).href);
  list.push([name, build]);
}

const g = new Grid(SITE, { dataVersion: DATA_VERSIONS["1.21.1"] });
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`wrote ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for the Rockefeller Center plaza parts: palette ids (palette.json), plan.md site coordinates, rng.

// Grid size [x, y, z]: plot 0 x 0..50 and plot 1 x 55..108 (z 0..53 and 0..15), y 0..22; plot 1 keeps its own y 0 datum

// Grid size [x, y, z]: plot 0 x 0..50 and plot 1 x 55..108 (z 0..53 and 0..15), y 0..22; plot 1 keeps its own y 0 datum
export const SITE = [109, 23, 54];

export const PLOT0 = { x0: 0, x1: 50, z0: 0, z1: 53 };  // Rockefeller Plaza and the Sunken Lower Plaza

export const PLOT1 = { x0: 55, x1: 108, z0: 0, z1: 15 };  // the Channel Gardens

export const PROMENADE_Y = 4;  // promenade surface; you stand at 5

export const WELL = { x0: 20, x1: 45, z0: 10, z1: 45 };  // sunken lower plaza, floor surface y 0

export const RINK = { x0: 24, x1: 39, z0: 14, z1: 41 };  // ice rink, packed ice at y 0

export const RINK_RIM_Y = 1;  // white rim ring around the rink

export const RINK_GATE = { x: 40, z0: 25, z1: 28 };  // rim gap onto the stairs

export const STAIR_HEAD = { x0: 42, x1: 47, z0: 20, z1: 33, landingX: 48 };  // Channel Gardens steps; landing at y 4

export const PROMETHEUS_WALL = { x0: 18, x1: 19, z0: 18, z1: 37, top: 10 };  // dark wall; x 19 is its east face

export const BASIN = { x0: 20, x1: 22, z0: 20, z1: 35 };  // Prometheus basin: floor y 0, water y 1

export const MOUNT = { x0: 20, x1: 22, z0: 26, z1: 29 };  // gilded mount, in the basin

export const GOLD_RING = { x: 21, y0: 2, y1: 9, z0: 24, z1: 31 };  // vertical gold ring, plane x 21

export const ZODIAC = { y: 5.5, z: 27.5, radius: 4.5 };  // zodiac ring centre and radius on the wall face

export const INSCRIPTION_Y = 9;  // inscription band row on the wall face

export const CASCADE_LEDGE_Y = 5;  // cascade ledge slab; water source on it at y 6

export const ROAD = { x0: 4, x1: 12, z0: 0, z1: 53 };  // Rockefeller Plaza roadway

export const ROAD_Y = { north: 5, south: 4, rampZ0: 20, rampZ1: 21 };  // road surface: 5 north of z 19, 4 south of z 22

export const CROSSWALK_Z = { north: [2, 4], south: [49, 51] };  // crosswalk bands on the road

export const RESTAURANTS = { x0: 22, x1: 43, northZ: 9, southZ: 46, doorX: [32, 33] };  // glass fronts and double doors

export const DINING = { x0: 20, x1: 41, north: { z0: 10, z1: 12 }, south: { z0: 43, z1: 45 } };  // terraces, floor y 0

export const UMBRELLAS = [[25, 11], [30, 11], [35, 11], [25, 44], [30, 44], [35, 44]];  // [x, z] umbrella centres

export const FLAG_RING = { base: 5, top: 11, north: 7, south: 48, west: 17, east: 48, spacing: 2 };  // flagpole lines

export const LAMPS_PLOT0 = { xs: [2, 14], zs: [5, 15, 25, 35, 45] };  // lamp posts on plot 0 (ground surface + 1..5)

export const LAMPS_PLOT1 = { xs: [58, 66, 74, 82, 90, 98, 106], zs: [2, 13] };  // lamp posts on plot 1

// Plot 1 ground levels (y 0 = lowest ground at the west end), by x range
export const PLOT1_LEVELS = [{ x0: 55, x1: 74, g: 0 }, { x0: 75, x1: 96, g: 1 }, { x0: 97, x1: 108, g: 2 }];

// Channel Gardens pools: rim at g+1, prismarine floor at g, water 4 long x 2 wide at z 7..8
export const POOLS = [

export const PLANTER_Z = { north: [4, 5], south: [10, 11] };  // planter curb rows on plot 1

export const WALKS_Z = { north: [0, 3], south: [12, 15] };  // walks on plot 1

export const CROSSWALK_X = [65, 73, 81, 89, 97];  // open crosswalks on plot 1 (two cells each, walk to walk)

// Seeded rng(seed): a function returning floats in [0, 1); the same seed gives the same sequence (mulberry32).
export function rng(seed)

// Palette: fill and ground
export const STONE = "stone";  // fill under all ground

export const SMOOTH_STONE = "smooth_stone";  // promenade and walk field, curbs

export const SMOOTH_STONE_SLAB = "smooth_stone_slab";  // curbs, crosswalk stripes, bench seats

export const POLISHED_ANDESITE = "polished_andesite";  // granite bands, borders, parapets, piers, steps, rims

export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";  // half steps and slab caps

export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs";  // benches

export const ANDESITE_WALL = "andesite_wall";  // parapet posts and lamp-free wall posts (not polished_andesite_wall)

export const IRON_BARS = "iron_bars";  // railing between parapet posts

export const GRAY_CONCRETE = "gray_concrete";  // road

// Palette: dark stone (Prometheus wall, fountain rim)
export const POLISHED_BLACKSTONE_BRICKS = "polished_blackstone_bricks";  // Prometheus wall body

export const DEEPSLATE_TILES = "deepslate_tiles";  // Prometheus wall panels

export const POLISHED_BLACKSTONE = "polished_blackstone";  // wall base, fountain rim, planter curb

export const POLISHED_BLACKSTONE_SLAB = "polished_blackstone_slab";  // fountain rim cap

export const CHISELED_POLISHED_BLACKSTONE = "chiseled_polished_blackstone";  // zodiac sign marks

// Palette: gold and fire
export const GOLD_BLOCK = "gold_block";  // statue gilding, gold ring, mount, zodiac ring

export const RAW_GOLD_BLOCK = "raw_gold_block";  // statue modelling, inscription band

export const YELLOW_TERRACOTTA = "yellow_terracotta";  // statue accent

// Palette: water, rink, glass
export const WATER = "water";  // basin, pools, jets

export const PACKED_ICE = "packed_ice";  // rink surface

export const WHITE_CONCRETE = "white_concrete";  // rink rim

export const GLASS_PANE = "glass_pane";  // restaurant glass

// Palette: birch (umbrellas, door, tables)
export const BIRCH_FENCE = "birch_fence";  // umbrella poles, table legs

export const BIRCH_DOOR = "birch_door";  // restaurant double doors

export const BIRCH_PRESSURE_PLATE = "birch_pressure_plate";  // restaurant table tops

// Palette: pool floor, planters, flags
export const PRISMARINE_BRICKS = "prismarine_bricks";  // pool floors

export const GRASS_BLOCK = "grass_block";  // planter soil

export const MOSS_BLOCK = "moss_block";  // planter soil

export const RED_WOOL = "red_wool";  // flag colour

export const WHITE_WOOL = "white_wool";  // flag colour, umbrella canopies

export const BLUE_WOOL = "blue_wool";  // flag colour

export const GREEN_WOOL = "green_wool";  // flag colour

export const YELLOW_WOOL = "yellow_wool";  // flag colour

export const BLACK_WOOL = "black_wool";  // flag colour

export const ORANGE_WOOL = "orange_wool";  // flag colour

export const LIGHT_BLUE_WOOL = "light_blue_wool";  // flag colour

// Palette: decor objects (fixtures, light, plants)
export const LANTERN = "lantern";  // lamp heads, parapet and rim lanterns, umbrella lanterns

export const CANDLE = "candle";  // lit candles on restaurant tables

export const OCHRE_FROGLIGHT = "ochre_froglight";  // restaurant ceiling glow

export const SHROOMLIGHT = "shroomlight";  // the fire in Prometheus's hand

export const END_ROD = "end_rod";  // flagpoles

export const WAXED_EXPOSED_COPPER = "waxed_exposed_copper";  // bronze fountain jets

export const AZALEA = "azalea";  // clipped shrubs

export const FLOWERING_AZALEA = "flowering_azalea";  // clipped shrubs

export const AZALEA_LEAVES = "azalea_leaves";  // shrub leaves

export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves";  // shrub leaves

export const OAK_LEAVES = "oak_leaves";  // shrub leaves (persistent)

export const ALLIUM = "allium";  // flowers

export const RED_TULIP = "red_tulip";  // flowers

export const ORANGE_TULIP = "orange_tulip";  // flowers

export const PINK_TULIP = "pink_tulip";  // flowers

export const WHITE_TULIP = "white_tulip";  // flowers

export const PEONY = "peony";  // flowers

export const ROSE_BUSH = "rose_bush";  // flowers

export const LILAC = "lilac";  // flowers

export const CORNFLOWER = "cornflower";  // flowers

export const OXEYE_DAISY = "oxeye_daisy";  // flowers

export const POLISHED_BLACKSTONE_WALL = "polished_blackstone_wall";  // lamp posts (both plots)
```

### vocab/h1.mjs

```js
// Landscape vocabulary, part 1: ground column, road crosswalk, well wall, stair-head planter, umbrella, Prometheus
// wall, basin, statue, pool, bench. Every helper takes the grid first, then its position; each returns
// { box, placed, refused } where box is the footprint it was given. Writes go into air only, except where a
// helper replaces its own floor or surface cell (named in its options); a write into anything else is refused.

/** Ground column at (x, z): stone from y 0 to h-1, the surface block at h. Writes that column only. */
export function groundColumn(g, x, z, h, { surface = "smooth_stone", overwrite } = {})

/**
 * Stripes across a road strip, z0..z1 (x0..x1): smooth_stone on every other x, on the road's top block. Only that
 * top block is replaced, and only where it is road; any other cell is left alone.
 */
export function crosswalk(g, z0, z1, { x0 = 4, x1 = 12, stripe = "smooth_stone", road = "gray_concrete" } = {})

/** Retaining wall on the perimeter of x0..x1 by z0..z1: polished_andesite from base to top-1, a smooth_stone cap at top. */
export function wellWall(g, x0, z0, x1, z1, { base = 0, top = 4, wall = "polished_andesite", cap = "smooth_stone" } = {})

/**
 * Stair-head planter, 3x3 at (x0, z0): a polished_blackstone curb ring at y = base (default 5), a grass_block soil
 * cell in the middle, and a clipped shrub (azalea leaves) on it at base+1 and base+2.
 */
export function planterBox(g, x0, z0, { base = 5 } = {})

/**
 * Umbrella centred on (x, z): birch_fence pole at base and base+1 (default 1), a 3x3 white_wool canopy at base+2,
 * and a hanging lantern under the canopy's corner at base+1. The 2-high lane past the pole stays air.
 */
export function umbrella(g, x, z, { base = 1 } = {})

/**
 * Prometheus back wall: x0..x1 by z0..z1, base (y 0) polished_blackstone, top course polished_blackstone_bricks,
 * body polished_blackstone_bricks with deepslate_tiles panels. The east face (x1) keeps the zodiac ring cells
 * (radius 4.5 about the wall's centre) and the inscription cells at top-1 air for the ornament parts.
 */
export function darkWall(g, x0, z0, x1, z1, { base = 0, top = 10 } = {})

/**
 * Fountain basin x0..x1 by z0..z1: polished_blackstone floor at y 0 (replacing only the well's surface block there),
 * water sources at y 1 except over the statue's mount (mount = [z0, z1] of it), a dark rim at x1+1 (blackstone y 1,
 * slab cap y 2), and cascade ledges on x0 (slab at y 5, water source on it at y 6) for each [za, zb] in cascades.
 */
export function basin(g, { x0 = 20, x1 = 22, z0 = 20, z1 = 35, mount = [26, 29], cascades = [[20, 23], [32, 35]] } = {})

/**
 * Prometheus statue on the basin: x0..x0+2 by z0..z0+7, from base (y 1). Gilded mount (stepped gold_block cone at
 * base..base+3 on z0+2..z0+5), flying body along z (gold_block at base+4..base+5, z0+1..z0+6, raw_gold_block shadow
 * on the outer edges of the top course, yellow_terracotta on the head), raised arm at z0+6..z0+7 and a shroomlight
 * fire at base+8. The gold ring stands in the plane x0+1, centred at (base+4.5, z0+3.5), radius 3.5; it fills only air.
 */
export function prometheus(g, x0, z0, { base = 1 } = {})

/**
 * Pool 6 long by 4 wide, from (x0, z0), floor at gy (prismarine_bricks, replacing the surface there only).
 * Rim polished_andesite at gy+1 on the outer ring; still water source at gy+1 inside (4 x 2).
 */
export function pool(g, x0, z0, gy)

/**
 * One bench at (x, z): a polished_andesite stair on the walk, its full-height back toward the curb. `facing` is the
 * way the sitter faces, so the stair's facing is the opposite. y defaults to one above the top block of the column.
 */
export function bench(g, x, z, facing, { y, material = "polished_andesite" } = {})
```

### vocab/h2.mjs

```js
// Landscape and architecture helpers from plan.md VOCABULARY: halfStep, paverBand, rinkRim, glassFront, parapet,
// zodiacRing, cascade, goldRing, jet. Block ids are literals from plan.md's PALETTE. Every helper takes the grid g
// first, then its position (and facing) as arguments, and returns { placed, refused }. It writes only its own footprint,
// and only into air: a cell an earlier part already filled is refused and listed, never overwritten, unless opts.overwrite
// is true (the surface block a half step or a paver band replaces, the pool water a jet stands in). Nothing below a
// helper's own cells is ever touched. Circles are read in block-index coordinates, as plan.md gives them (zodiac centre
// y 5.5, z 27.5 spans y 1..10, z 23..32).

/** Half step: a bottom slab of `material` (polished_andesite, or smooth_stone) at (x, h, z), on the higher cell's edge row.
 *  Lays that one cell; the stone under it is the ground's and is never touched. */
export function halfStep(g, x, z, h, { material = "polished_andesite", overwrite = false } = {})

/** Paver band: a one-block line of polished_andesite at height y across a smooth_stone field, from..to along the line
 *  (see `at`). overwrite replaces the field block at y; nothing below y is touched. */
export function paverBand(g, axis, pos, from, to, y, { block = "polished_andesite", overwrite = false } = {})

/** Rink rim: a ring of white_concrete at y on the box x0..x1 × z0..z1 (its outer cells only). gaps: boxes [x0, z0, x1, z1]
 *  left open (the rink gate, the terrace gaps, the fountain's dark rim). A lantern stands on every lanternEvery-th rim cell,
 *  counted round the ring. */
export function rinkRim(g, x0, x1, z0, z1, y, { gaps = [], block = "white_concrete", lanternEvery = 4, overwrite = false } = {})

/** Restaurant front on the wall line z, from x0 to x1 and y0..y1: polished_andesite piers at x0, every 4th cell, and at x1;
 *  glass_pane bays between them (arms along x). With door = [xa, xb], a double birch_door there (left and right hinge, both
 *  halves) with glass above it. facing: the way the front looks out (south for the north restaurant). */
export function glassFront(g, z, facing, { x0, x1, door = null, y0 = 1, y1 = 3, pier = "polished_andesite", overwrite = false } = {})

/** Parapet: andesite_wall posts every `every` cells along the line, iron_bars railing between them, and a lantern standing on
 *  each post, at y (lanterns at y+1). axis, pos, from, to as in paverBand. Arms point along the line to neighbouring cells. */
export function parapet(g, axis, pos, from, to, y, { every = 4, overwrite = false } = {})

/** Zodiac ring: a circle of gold_block of radius r about centre [cy, cz] in the plane x (the wall face), with `marks`
 *  chiseled_polished_blackstone set evenly round it, the first at the top and going round. centre [5.5, 27.5], r 4.5 spans
 *  y 1..10, z 23..32 as plan.md has it. */
export function zodiacRing(g, x, centre, r, { block = "gold_block", mark = "chiseled_polished_blackstone", marks = 12, overwrite = false } = {})

/** Gold ring: a plain circle of gold_block of radius r about centre [cy, cz] in the plane x, face-on from the gardens.
 *  centre [5.5, 27.5], r 3.5 spans y 2..9, z 24..31 as plan.md has it. */
export function goldRing(g, x, centre, r, { block = "gold_block", overwrite = false } = {})

/** Cascade ledge: a bottom slab of `material` at (x, y, z0..z1), with a water source on it at y+1 pouring into the basin
 *  beside it. */
export function cascade(g, x, y, z0, z1, { material = "polished_blackstone", overwrite = false } = {})

/** Fountain jet: a bronze figure (waxed_exposed_copper) at (x, ground+1, z) with a water source on it at ground+2, pouring
 *  down the pool. The figure stands in the pool's water, so lay the jet after the pool with overwrite: true; otherwise it
 *  is refused where the water is. */
export function jet(g, x, z, ground, { overwrite = false } = {})
```

### vocab/h3.mjs

```js
// Landscape helpers from plan.md VOCABULARY: roadStrip, lampPost, gardenSteps, froglightBay, promenadeField,
// inscriptionBand, goldMount, flagPole, plantBed. Block ids are literals from plan.md's PALETTE.
// Every helper takes the grid g first, then its position (and facing) as arguments, and returns { placed, refused }.
// It writes only its own footprint, and only into air: a cell an earlier part already filled is refused and listed,
// never overwritten, unless opts.overwrite is true. gardenSteps' treads fill down through air only and stop at the
// first solid block (the ground an earlier part laid), so nothing solid is ever replaced below a tread.

/** Rockefeller Plaza roadway: gray_concrete over x0..x1 × z0..z1 with its top block at y; the x0 and x1 edges are smooth_stone_slab curbs. */
export function roadStrip(g, x0, x1, z0, z1, y, { overwrite = false } = {})

/** Lamp post at (x, z) on a surface at `base`: polished_blackstone_wall post at base+1..base+4, a standing lantern at base+5. */
export function lampPost(g, x, z, base, { overwrite = false } = {})

/** Channel Gardens steps over x0..x1 × z0..z1: full polished_andesite treads rising 1 every 2 blocks (top y1, y2, y3 from x0),
 *  each filled down to the ground through air. Cheek walls sit one cell outside z0 and z1, flush with the tread beside them. */
export function gardenSteps(g, x0, x1, z0, z1, { cheeks = true, overwrite = false } = {})

/** Restaurant bay behind glass at glassZ: an ochre_froglight in the ceiling at y3 one cell in from the glass, and a table two
 *  cells in (birch_fence at y1, polished_andesite_slab top at y2). into = the direction from the glass into the room. */
export function froglightBay(g, x, glassZ, into, { overwrite = false } = {})

/** Pale granite promenade over x0..x1 × z0..z1 with its top block at y: smooth_stone, polished_andesite bands every 6 blocks
 *  (counted from x0 and z0) and a 1-wide polished_andesite border. */
export function promenadeField(g, x0, x1, z0, z1, y, { overwrite = false } = {})

/** Inscription band on the wall face at x: alternating raw_gold_block and polished_blackstone_bricks along z0..z1 at y,
 *  gold first. Call it once per run that stays off the zodiac ring (the ring cells are not written here). */
export function inscriptionBand(g, x, z0, z1, y, { overwrite = false } = {})

/** Gilded mount: a stepped gold_block cone over x0..x1 × z0..z1, `layers` tall from y0. Each layer insets one cell from every side. */
export function goldMount(g, x0, x1, z0, z1, y0, { layers = 4, overwrite = false } = {})

/** Flagpole at (x, z): end_rod stacked from base to top (default y5..y11), and a 2x2 wool flag pointing dir: cells 1 and 2 out
 *  from the pole on the top two rows. colours = [top row, bottom row] as dye names ("red", "white"). */
export function flagPole(g, x, z, dir, [topColour, bottomColour], { base = 5, top = 11, overwrite = false } = {})

/** Planter bed over x0..x1 × z0..z1 with its surface at base+1: polished_blackstone curb on the rectangle's edge (except the
 *  sides listed in open, where the soil runs to the edge), grass/moss soil inside, a shrub or flower on each soil cell at base+2,
 *  and persistent leaves on the azalea shrubs at base+3. */
export function plantBed(g, x0, x1, z0, z1, base, { open = [], overwrite = false } = {})
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

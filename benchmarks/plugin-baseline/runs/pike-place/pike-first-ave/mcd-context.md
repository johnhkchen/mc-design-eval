# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# Pike Place: hotels and brick blocks (six modules), plan of form

## SITE

Six separate modules. Each one has its own local frame: x0..x1 and z0..z1 come from the plot box, and y 0 is that plot's lowest ground. Every lot is turned to the downtown grid, so **every face is a staircase**: straight runs ("treads", mostly 8 long) joined by 2-block steps ("risers"). That staircase is the real form. Build it; never square a lot off.

**Footprint mask M** = the brief's FOOTPRINT map, exactly. Block (x,z) is in M when map row z//2, column x//2 is `#`. **G(x,z)** = the GROUND value of that cell.
**Rings**: ring k = cells of M whose 4-neighbour distance to the nearest cell outside M is k+1. So ring 0 is the outermost cell, ring 1 the next one in, and so on.

| plane | ring | what goes there |
|---|---|---|
| proud plane | 0 | plinth/base course, pilasters on risers, bay windows, cornice, awnings, fire escapes, sign boards, sills. Air wherever nothing proud is listed. |
| wall plane | 1 | the main wall of every storey (1 thick) with its glass. |
| interior | ≥2 | hollow. Floor slabs at each storey y. Window lights at ring 3 (see OPENINGS). |

**Ground rule**: each column of the shell starts at y = G(x,z) (its lowest block sits at the ground value) and rises from there. Floors below G at that column simply do not exist there (they are buried in the hill on purpose). Where G is below the street storey's floor (the downhill, low-x side), the base and basement storeys are built down to G, never left floating.

### Masses per plot (x, y, z local to each plot)

| plot | mass | cells | y |
|---|---|---|---|
| 0 Inn | podium/base | ring 0 where G < 9 | G..9 |
| 0 Inn | hotel body | walls on ring 1 of M; bbox x0..61, z0..53 | G..29 (deck slab y29) |
| 0 Inn | courtyard (void) | x24..37, z18..33 | y10..up stays open; y9 = paved courtyard floor |
| 0 Inn | rooftop pavilion | x40..51, z8..19 (all ring ≥2) | y30..34, flat roof y35 |
| 0 Inn | stair/lift tower | x44..47, z22..25 | y30..38 |
| 1 101 Stewart | base + shops | ring 0/1 of M; bbox x0..63, z0..73 | G..8 |
| 1 101 Stewart | tower body | walls on ring 1 | y9..48, roof y49 |
| 1 101 Stewart | terrace T1 | walls on ring 5 | y49..58, roof deck y59 |
| 1 101 Stewart | terrace T2 | walls on ring 9 | y59..63, roof deck y64 |
| 1 101 Stewart | terrace T3 | walls on ring 13 | y64..68, roof deck y69 |
| 1 101 Stewart | mechanical penthouse | walls on ring 18 | y70..74, roof y75 |
| 2 Palihotel | base | ring 0 where G < 3 | G..3 |
| 2 Palihotel | hotel body | walls on ring 1; bbox x0..59, z0..61 | G..28, roof y29 |
| 2 Palihotel | cornice + parapet | ring 0 cornice; parapet on ring 1 | y28..31 |
| 3 The Fix | warehouse body | walls on ring 1; bbox x0..63, z0..63 | G..36, roof y36 |
| 3 The Fix | parapet | ring 1 | y37..38 |
| 3 The Fix | stepped parapet crests | west treads x=8 z16..23 and x=2 z36..43 (ring 1 behind them) | y39..41 |
| 3 The Fix | water tank + stair bulkhead | tank x30..34, z30..34; bulkhead x40..44, z36..40 | tank y37..43 on 4 legs; bulkhead y37..41 |
| 4 Hahn | base | ring 0 where G < 4 | G..4 |
| 4 Hahn | body | walls on ring 1; bbox x0..57, z0..37 | G..19, roof y20 |
| 4 Hahn | cornice + parapet | ring 0 cornice; parapet ring 1 | y20..22 |
| 5 Pike St Comm. | body | walls on ring 1; bbox x0..61, z0..61 | G..15, roof y15 |
| 5 Pike St Comm. | neon band | ring 0 on every face | y8..9 |
| 5 Pike St Comm. | parapet | ring 1 | y16..17 |
| 5 Pike St Comm. | HVAC boxes | x20..24 z20..23; x34..37 z30..33; x26..28 z40..42 | y16..18 |

**Streets.** The north and west faces are the fronts (the hero render looks from the bay, the low-x side, and from low z), but all four faces get dressed. The street for each plot is its longest tread, listed under OPENINGS.

## ROOFS

All six are flat roofs behind parapets, as commercial blocks of 1900-1986 are. No `$MCD roof` preset fits a stepped mask (presets take rects), so **the roof part builds every roof by hand**. The look follows the `flat-parapet` and `modern` presets:

| plot | deck | parapet / coping | on the roof |
|---|---|---|---|
| 0 Inn | M ring ≥1 at y29, spruce_planks deck | ring 1 y30 smooth_sandstone with iron_bars rail on top (y31), smooth_sandstone_slab coping | pergolas (dark_oak_fence posts with a dark_oak_slab grid at y33) over x30..39 z6..14 and x26..36 z36..44; 6 white umbrellas (a dark_oak_fence pole y30..31, a 3x3 white_wool canopy at y32) beside the pergolas; azalea planters (flowering_azalea_leaves on spruce trapdoor boxes) along the west parapet every 4; the pavilion is glazed on all sides with a smooth_quartz flat roof at y35 and a 1-proud slab eave |
| 1 101 Stewart | each terrace deck is smooth_stone, ring ≥ the next setback | every setback edge: smooth_sandstone parapet 1 high + iron_bars rail | planters of flowering_azalea_leaves every 5 along each terrace edge; penthouse in bricks with a smooth_sandstone cap y75 |
| 2 Palihotel | gray_concrete deck y29 | brick parapet y30..31 on ring 1, polished_andesite_slab coping y32 | 2 HVAC boxes (light_gray_concrete 3x3x2) at x26..28 z26..28 and x36..38 z36..38; a few azalea tubs |
| 3 The Fix | gray_concrete deck y36 | brick parapet y37..38, stone_brick_slab coping; crests step up 1 per 2 cells to y41 at the tread centre | wooden water tank: spruce_planks cylinder of radius 2, dark_oak_fence legs, spruce_slab cone top |
| 4 Hahn | gray_concrete deck y20 | cornice at y20 (see FACADES), brick parapet y21..22, smooth_stone_slab coping | a skylight (glass 4x2) at x30..33 z14..15 |
| 5 Pike St Comm. | gray_concrete deck y15 | cut_sandstone parapet y16..17, smooth_sandstone_slab coping | the HVAC boxes in light_gray_concrete with iron_trapdoor vents |

There are no pitched roofs, overhangs or verges. The cornices are the eaves line, built by the facade part.

## FACADES

**Rhythm rule (all plots):** each tread (a straight run on the wall plane, ring 1) is one bay unit.
- 8-long tread: pier 1 · window 2 · pier 2 · window 2 · pier 1.
- 6-long: pier 2 · window 2 · pier 2.
- 10-14 long: windows 2 wide every 3 blocks, centred, with piers of at least 1 at the ends.
- 4 or less, and every riser: solid, with a pilaster/quoin strip at ring 0 the full height of the body.

This gives each face a sawtooth of bays, which is the reading of the turned grid. Windows: y floor+1..floor+3 (3 tall). In 6- and 7-tall storeys: floor+1..floor+4.

### Plot 0: Inn at the Market (cream stucco hotel)
- **Base**: on the downhill west and south, from G to y8, a smooth_stone plinth at ring 0 with a polished_andesite course on top at y9. Lower-level L0 (floor y4) windows 2x2 at y5..6.
- **L1** (y9..13): the cafe and lobby. Glass from y10..12 in every window slot, with dark_oak doors.
- **String course** y14: smooth_sandstone_slab at ring 0, all round.
- **L2-L4** (y14..28): smooth_sandstone wall with cut_sandstone quoins on the risers. **Bay windows**: on every 8-long tread facing W, N or S, the middle 4 cells of the tread at ring 0 project as a bay, y15..27 (three storeys stacked). Each bay is glazed on its front 2 and its 1-wide sides, with a smooth_sandstone panel at each floor line and a smooth_sandstone_stairs (upside down) corbel under it at y14. Treads without a bay get a black iron_bars juliet balcony at ring 0 under each window (y floor+1).
- **Cornice** y28: cut_sandstone at ring 0, smooth_sandstone_stairs upside down under it at y27 every other cell.
- **Awnings** (L1, y13..14) at ring 0 over every L1 window on N z=0 x32..59 and E x=55 z18..27: green_wool / white_wool alternating stripes (one wool per cell, slab-sloped look with green_carpet edge), 1 deep.
- **Courtyard walls** (facing the void): the same smooth_sandstone, windows on the same rhythm, iron_bars balconies.

### Plot 1: 101 Stewart (brick and beige office tower)
- **Base L1** (y3..8): shopfront glass y4..7 in a polished_andesite frame. Piers on ring 0 every 7 along the long treads. smooth_sandstone fascia band y8 at ring 0.
- **Office storeys** (L2-L13, 5 tall): per storey, floor y = smooth_sandstone beige band at ring 1. y+1 bricks spandrel. y+2..y+3 the **ribbon window**: a continuous glass run along each tread, broken by a bricks pier every 7 cells and on every riser. y+4 smooth_sandstone band. The beige band is recessed 0; the ribbons are flush. Every 2nd storey the beige band also projects at ring 0 as smooth_sandstone_slab (a shadow line).
- **Corners/risers**: bricks full height, as pilasters at ring 0.
- **Terraces**: each setback deck carries a rail and planters (ROOFS). The terrace walls repeat the ribbon pattern.

### Plot 2: Palihotel (Edwardian red brick)
- **Base**: polished_andesite plinth at ring 0 from G to y3. Downhill basement windows 2x2.
- **L1 shops** (y3..8): glass y4..7 between polished_andesite pilasters (ring 0). Dark green fascia board (green_terracotta) y8 at ring 0. Awnings at y9 over the shop treads.
- **Belt course** y9: stone_brick_slab at ring 0.
- **L2-L5** (y9..28): bricks. Windows 2x3 with a smooth_stone_slab sill (ring 0, y floor) and a stone_brick_stairs upside-down lintel pair (ring 0, y floor+4). **Bay windows (oriels)**: on the west treads x=6 z18..25, x=4 z26..33, x=2 z34..43 and on N z=6 x34..41, the middle 4 cells project at ring 0 from y10..27, in bricks with glass faces. A corbel of brick_stairs upside down at y9 and a polished_andesite cap at y28.
- **Sheet-metal cornice** y28..29: polished_andesite at ring 0. Brackets (polished_andesite_stairs upside down) at y27 every 2 cells. A second slab course at y30.
- **Vertical sign**: PALIHOTEL on N z=10 x53..55 (ring 0, 3 wide, 1 proud). red_concrete board y9..28, the 9 letters as white banner letters stacked top to bottom (P at y26..27 down to L at y10..11), facing north. Edges are glowstone at x53 and x55, every 2 rows (lit blade).

### Plot 3: The Fix (red-brown brick warehouse, apartments)
- **Base**: stone_bricks at ring 0 from G to y1 (and to y8 on the west treads: a rusticated ground storey with polished_andesite pier caps).
- **L1** (y1..7, Western Ave): large openings 2 wide × 5 tall (y2..6), glazed.
- **L2-L5** (7 tall each): bricks. **Large multi-pane windows** 2 wide × 4 tall (floor+1..floor+4) in glass_pane (the pane grid reads as multi-pane). Each window gets a smooth_stone_slab sill at ring 0 and a terracotta lintel (1 row, ring 1, y floor+5).
- **Belt courses** at y8 and y29: stone_brick_slab, ring 0.
- **Fire escapes** on the west treads x=8 z16..23 and x=2 z36..43: at ring 0 (the tread's own cells), a landing per storey at y floor (iron_trapdoor, closed, top half) with iron_bars railing at y floor+1, and a 1-wide dark stairs run (polished_blackstone_stairs) zig-zagging between landings, plus a hanging ladder (iron_bars) under the L2 landing to y4.
- **Parapet**: bricks y37..38. Crests step up over the two fire-escape treads to y41, capped with stone_brick_slab.

### Plot 4: The Hahn Building (3-storey brick, GREEN TORTOISE)
- **Base**: polished_andesite at ring 0 from G to y4.
- **L1 shops** (y4..9): glass y5..8 on every tread, polished_andesite pilasters on the risers. Green awnings (green_wool, 1 deep, ring 0) at y10.
- **L2-L3** (y10..19): bricks. Windows 2x3, smooth_stone_slab sills.
- **Cornice** y20: smooth_sandstone at ring 0, brackets (smooth_sandstone_stairs upside down) at y19 every 2 cells.
- **Sign**: green_concrete board at ring 0, y11..14. GREEN on S z=29 x14..25 (white banner letters centred, y12..13), TORTOISE on S z=31 x26..33 (8 letters filling the tread, y12..13). It reads as one sign stepping along Pike Street. A lantern under each end.

### Plot 5: Pike Street Commercial Building (brick + terracotta, 1923)
- **Base**: smooth_stone course at ring 0 from G to y2.
- **L1 shops** (y2..8): big shop windows y3..7 on every tread. Transoms of glass, mullions of cut_sandstone (ring 1) every 3. Doors on the S treads.
- **Neon sign band** y8..9: red_concrete at ring 0 on every face. Letters as white banner letters, one word per south tread, reading west to east from the street: PIKE on S z=51 x4..11, PLACE on S z=55 x18..25, SUPPLY on S z=59 x32..39, CO. on S z=61 x40..47. Lanterns hang from the band at y7 over every pier.
- **L2** (y10..14): cut_sandstone (the terracotta) piers with bricks spandrel panels. Windows 2x3 (y11..13).
- **Parapet** y16..17: cut_sandstone, a smooth_sandstone_slab coping, a chiseled_sandstone panel centred on each tread at y16.

## MATERIALS

| role | block |
|---|---|
| Inn body (cream stucco) | smooth_sandstone |
| Inn trim/quoins/cornice | cut_sandstone, smooth_sandstone_stairs, smooth_sandstone_slab |
| Inn awnings | green_wool + white_wool stripes, green_carpet edge |
| Inn rails | iron_bars |
| 101 Stewart body / bands | bricks / smooth_sandstone |
| Palihotel body | bricks |
| Palihotel cornice/base | polished_andesite, polished_andesite_stairs, stone_brick_slab |
| Palihotel fascia / sign | green_terracotta / red_concrete + white banners, glowstone |
| Fix body / base / lintel | bricks / stone_bricks / terracotta |
| Fix fire escape | iron_trapdoor, iron_bars, polished_blackstone_stairs |
| Hahn body / cornice / sign | bricks / smooth_sandstone / green_concrete + white banners |
| Pike St Comm. terracotta / panel / band | cut_sandstone, chiseled_sandstone / bricks / red_concrete + white banners |
| base courses | smooth_stone, polished_andesite, stone_bricks |
| glass | glass_pane (warm light behind it) |
| doors | dark_oak_door |
| window light | ochre_froglight (warm), shroomlight (alternate) |
| roofs | gray_concrete deck, spruce_planks (Inn deck), smooth_stone (terraces) |
| planting | flowering_azalea_leaves (persistent), azalea in spruce_trapdoor boxes |
| exterior light | lantern |

All of these are checked with `$MCD blocks --check` and exist in 1.21.1. No pale oak and no copper bulbs.

## OPENINGS

- **Windows**: per the rhythm rule on every tread of the wall plane (ring 1), at the storey y values in FLOORS. Every window: glass_pane in ring 1.
- **Lit windows**: about 70% of the windows (the pattern: skip every 3rd window, staggered by storey) get an ochre_froglight at ring 3 at y floor+2 behind them, and a hanging lantern at ring 2. The others stay dark. Every L1 shop window is lit (shop interior at ring 2-3: a counter of spruce_slab top and shelves with lanterns and candles).

**Doors** (2 wide, dark_oak, both halves, in ring 1; threshold = the floor y; slab steps at ring 0 where G is 1 below):

| plot | door | at (x, z), y of floor |
|---|---|---|
| 0 | hotel entrance | x55, z22..23 (wall ring 1 = x54), y9 |
| 0 | cafe doors | N wall z1 at x40..41 and x50..51, y9 (slab step where G=8) |
| 0 | courtyard gate (arched opening 3 wide, 4 tall) | S tread z=49 x24..26, y5..8, then open stair inside to y9 |
| 1 | lobby | N wall z1, x32..33, y3 |
| 1 | shop doors | N wall z1 x24..25 and x42..43; E wall x62 z10..11 and z16..17; y3 |
| 2 | hotel entrance | E wall x54 z28..29, y3 (G 2: one slab step) |
| 2 | shop doors | W x=3 z38..39 at y1 (downhill shop); N wall z7 x37..38 at y3 |
| 3 | apartment entrance | W wall x3 z38..39, y1 (G 0: one slab step) |
| 3 | shop doors | W wall x9 z18..19 and z22..23, y1 |
| 4 | hostel door | S wall z30 x18..19, y4 (G 2: two slab steps along the tread) |
| 4 | shop doors | S wall z26 x8..9, z34 x36..37, y4 |
| 5 | shop doors | S walls: z50 x6..7, z54 x20..21, z58 x34..35, z60 x42..43; y2 |

## RESERVED

The shell leaves these as air:
- Every window and door cell above.
- Plot 0: the courtyard void x24..37 z18..33, y10 up. The bay window cells at ring 0 are the bay part's. The pergola and umbrella cells on the roof deck y30..34.
- Plot 2: the blade-sign cells x53..55 z10 y9..28.
- Plot 3: the fire-escape cells (ring 0 of the two west treads, y2..38).
- Plots 4 and 5: the sign-band cells (ring 0 of the named treads).
- Ring 0 everywhere above the base: air unless FACADES puts something proud there.

## FLOORS (floor block y; interior = rings ≥2 of M, hollow except floor slabs and window lights)

| plot | storeys (floor y) | roof |
|---|---|---|
| 0 Inn | L0 4 (only where G≤4), L1 9 (street, cafe), L2 14, L3 19, L4 24 | deck 29, pavilion 30..34 (roof 35), tower to 38 |
| 1 101 Stewart | L1 3 (shops, 6 tall), L2 9, L3 14, L4 19, L5 24, L6 29, L7 34, L8 39, L9 44, L10 49, L11 54 (T1), L12 59 (T2), L13 64 (T3) | 69; penthouse 70..74, roof 75 |
| 2 Palihotel | L0 0 (basement, downhill only), L1 3 (shops, 6 tall), L2 9, L3 14, L4 19, L5 24 | 29, parapet to 31 |
| 3 The Fix | L1 1 (Western Ave, 7 tall), L2 8, L3 15, L4 22, L5 29 | 36, parapet 38, crests 41, tank 43 |
| 4 Hahn | L0 1 (downhill only), L1 4 (shops, 6 tall), L2 10, L3 15 | 20, parapet 22 |
| 5 Pike St Comm. | L1 2 (shops, 7 tall incl. band), L2 10 | 15, parapet 17 |

All heights are inside the caps (60 / 85 / 43 / 71 / 37 / 31) and close to the lidar roof heights.

---
# DESIGNER SECTIONS (the architect's sections above are unchanged)

Coordinate convention: plan-local per plot as above. Module-space (what rooms/entrances in the JSON use) = local x + plot offset (P0 0, P1 65, P2 133, P3 196, P4 265, P5 326); z, y unchanged.

## PALETTE
Every id checked with `$MCD blocks --check`: all exist in 1.21.1 (`hanging_sign` alone is not an id; use `dark_oak_hanging_sign`).

| role | block | shape variants |
|---|---|---|
| Inn stucco | smooth_sandstone | smooth_sandstone_stairs, smooth_sandstone_slab |
| Inn trim | cut_sandstone | cut_sandstone_slab, chiseled_sandstone |
| Brick (Stewart, Palihotel, Fix, Hahn, Pike St) | bricks | brick_stairs, brick_slab, brick_wall |
| Base stone | smooth_stone, stone_bricks, polished_andesite | smooth_stone_slab, stone_brick_slab, stone_brick_stairs, polished_andesite_stairs, polished_andesite_slab |
| Fix lintel | terracotta | |
| Fascia / signs | green_terracotta, red_concrete, green_concrete, black_concrete | |
| Glass | glass_pane, glass (skylight, pavilion), white_stained_glass_pane | |
| Doors | dark_oak_door | dark_oak_trapdoor, dark_oak_stairs |
| Awnings | green_wool, white_wool, green_carpet | |
| Rails / ironwork | iron_bars, iron_trapdoor, polished_blackstone_stairs, iron_chain, ladder | |
| Decks | gray_concrete, light_gray_concrete, spruce_planks, smooth_stone, smooth_quartz | spruce_slab, dark_oak_slab, smooth_quartz_slab |
| Roof furniture | dark_oak_fence, spruce_fence, spruce_planks (tank), spruce_trapdoor | |
| Planting | flowering_azalea_leaves (persistent true) | |
| Light | lantern (hanging true/false), ochre_froglight, shroomlight, glowstone, candle (lit), campfire not used | |
| Signs | white_banner (letters via bannerWord / plaque), dark_oak_wall_sign, dark_oak_hanging_sign | |
Rule: no light blocks, no sea_lantern on faces; dusk glow = froglight behind glass + lanterns + glowstone blade sign + lit candles in shop windows.

## VOCABULARY
Each helper has a plain signature; all take plot-local coordinates. Write them in `vocab.mjs` under these names.

- **ringOf(plot)**: returns for each (x,z) its ring k (4-neighbour BFS distance to outside M, 0 = outermost) and `faceDir` (N/S/E/W, from the outward neighbour). Treads = maximal runs of ring-1 cells with the same faceDir; risers = the 2-block joins.
- **groundColumn(g, plot, {x,z,top,block})**: fills x,z from y=G(x,z) to `top` with `block` (G from the GROUND map; if G is '.', use nearest neighbour G); nothing below G.
- **plinth(g, plot, {top, block, cap})**: ring 0 columns from G to `top` in `block`, optional `cap` course at y=top+1.
- **bayRhythm(g, tread, {floorY, h, sill, lintel})**: per the architect's rhythm rule (8 long: pier1 win2 pier2 win2 pier1; 6: 2/2/2; 10-14: 2-wide windows every 3, centred; <=4 and risers solid). Window = glass_pane in ring 1 y floor+1..floor+h, sill slab at ring 0 y=floor, lintel pair of upside-down stairs at y floor+h+1. Panes get connection states (north/south/east/west true to neighbouring panes).
- **windowLit(g, window, {every:3, stagger})**: for window n of storey s, if (n+s)%3 != 0 put ochre_froglight at ring 3, y floor+2, centred behind the glass, and a lantern hanging=true at ring 2, y floor+3 (needs a block above: put a smooth_stone_slab top at y floor+4 at ring 2). Alternate shroomlight for every 5th lit window.
- **shopGlow(g, window)**: behind each L1 shop window: ring 2 counter = spruce_slab type=top, y floor+1; ring 2 y floor+3 hanging lantern; on counter a lit candle (candles 3, lit true); ring 3 shelf: spruce_trapdoor open against the wall with flower_pot / candle on a spruce_slab top. Always lit.
- **doorPair(g, {x,z,y,face,doorBlock:"dark_oak_door"})**: two-wide door, each half lower/upper, same facing/hinge (left/right), opening in ring 1, ring 0 cell in front = threshold; if G is 1-2 below floor: bottom-slab ramp, slab-slab-slab then 2-long level landing, 2 wide; never stairs.
- **doorLantern(g, door)**: ring 0, both sides of the door: dark_oak_fence post y+1..y+2 with lantern on top (hanging false), or lantern hanging under an awning slab.
- **cornice(g, tread, {y, course, brackets, slabY})**: ring 0 course block at y; upside-down stairs of matching family at y-1 every other cell (facing the wall, half top); slab top course above if listed.
- **quoin(g, riser, {y0,y1,long,short})**: at ring 0 along a riser, alternating 2-wide and 1-wide blocks every course (offset 1 per course).
- **pilaster(g, riser, {y0,y1,block})**: ring 0, 1 wide, full height.
- **deckAndParapet(g, plot, {deckY, deck, parapet, parapetH, coping, rail})**: slab-layer `deck` on all ring>=1 cells at deckY, parapet on ring 1 for parapetH, coping slab (type top) above; optional iron_bars rail layer.
- **shopfront(g, tread, {baseY, h, frame, pierEvery, fascia, fasciaY})**: glass_pane y baseY+1..baseY+h in ring 1, frame/pilaster block piers at ring 0 every `pierEvery` and on risers, fascia band of block at ring 0 y fasciaY.
- **awning(g, tread, {y, colors:[a,b], depth:1})**: ring 0 cell per bay-cell at y, alternating stripe wool per cell (a,b), with a carpet in matching colour on the outer edge y-1 as a hem; or a single colour for Hahn/Palihotel. Slopes: stairs (upside down) in wool-colour terracotta are NOT used; keep wool.
- **stuccoBay(g, tread)**: middle 4 cells of an 8-tread, ring 0, y15..27: front row = glass_pane (4 wide), side columns 1 wide glass_pane, ring-1 wall cells behind are window openings; smooth_sandstone panel (full block) at y19 and y24 across the front; corbel = smooth_sandstone_stairs half top, facing outward-down, at y14 under the bay; top = smooth_sandstone_slab roof at y28.
- **orielBay(g, tread)**: same plan as stuccoBay but bricks piers at the 4 corners, glass faces, corbel brick_stairs half top at y9, polished_andesite cap at y28.
- **julietBalcony(g, window)**: iron_bars row 2 wide at ring 0 y floor+1 under the window plus iron_bars end posts; connection states set.
- **archGate(g, {x,z,w:3,h:4,y})**: air cells in ring 1 and ring>=2 along the passage; upside-down stairs (facing inward) at the springers, full smooth_sandstone lintel row; slab-step floor up to y9.
- **courtyardWall(g, faceCells)**: same bay rhythm as street faces, smooth_sandstone, iron_bars balconies at y floor+1, extra warm lit windows (every storey, 70%), potted flowering_azalea_leaves on spruce_trapdoor boxes at the paved floor.
- **ribbonStorey(g, tread, {floorY})**: y floorY smooth_sandstone band; floorY+1 bricks spandrel; floorY+2..+3 glass_pane run along the tread with bricks piers every 7 and on each riser; floorY+4 smooth_sandstone band; flag `project` adds smooth_sandstone_slab type bottom/top at ring 0 under the band.
- **terrace(g, plot, {ring, y0, y1, deck, rail, planterEvery:5})**: walls on `ring` from y0 to y1 repeating ribbonStorey; deck smooth_stone at y1+1 on ring>=ring+... , parapet ring + iron_bars; planters.
- **azaleaPlanter(g, [x,y,z])**: spruce_trapdoor closed top-half ring around (4 sides) with flowering_azalea_leaves persistent=true in the centre cell on a dirt block floor. 
- **bladeSign(g, {x0,z,y0,y1,board:"red_concrete", lamp:"glowstone", word})**: 3 wide, 1 proud (ring 0 plus 1 more cell outward would break the staircase: keep it IN the ring-0 cell); board columns x0..x0+2; glowstone in the outer columns every 2 rows (and plain red between); middle column letter-by-letter banners from the top, each letter via `bannerWord`/`plaque` for the vertical stack in reading order (one banner letter per 2 rows, white on red).
- **bannerSign(g, tread, {text, y0, y1, board, letter, base:"white"})**: board of `board` block at ring 0 over the band rows; letters with `bannerWord(g, text, {center, face, letter:"white", base:"<board colour>"})` or `plaque(..., material:null)` so they read left to right from the street; one cell margin; lantern under each end.
- **fireEscape(g, tread, {z0, z1, x, floors:[1|8,15,22,29]})**: ring 0 column of cells for the tread. Landing: iron_trapdoor half top closed at (x, floor, z) for 3 cells of z; rail iron_bars y floor+1 on outer side and ends; run: polished_blackstone_stairs half bottom, facing the direction walked up, 1 wide, climbing floor-to-floor along the tread in alternating directions (each flight = h steps, last step flush with the landing); drop-ladder: iron_bars column from the L2 landing down to y4; support each stair step on iron_bars/blackstone beneath so it floats nowhere.
- **steppedCrest(g, tread, {y0:39, y1:41})**: bricks column on ring 1 rising 1 per 2 cells in each direction from the tread centre to y41, then a stone_brick_slab (type bottom) on each top.
- **waterTank(g, {cx,cz,r:2,y0,y1})**: 4 dark_oak_fence legs at corners y37, floor of spruce_planks y38, wall ring of spruce_planks radius 2 (disc outline, y38..42), iron_bars hoops at y39 and y41 as outward ring, cone: spruce_slab type bottom ring r2 at y43, spruce_planks top cell y44 ... inside caps.
- **bulkhead(g, box)**: bricks box, dark_oak_door on one side, smooth_stone_slab cap.
- **hvacBox(g, box, {block:"light_gray_concrete", vent:"iron_trapdoor"})**: filled box, vents are open iron_trapdoors on two faces; optional iron_bars pipes.
- **pergola(g, box)**: dark_oak_fence posts at the 4 corners (3 tall) plus midposts every 3, dark_oak_slab grid (type top) at y33 on alternate cells.
- **umbrella(g, [x,y,z])**: dark_oak_fence pole 2 tall, white_wool 3x3 at y+2 with the corners cut (plus shape + 4 carpets white_carpet as the hem).
- **pavilion(g, box)**: floor spruce_planks, glass_pane walls on the 4 sides with smooth_quartz corner posts, door opening on the SW, smooth_quartz roof slab, one hanging lantern inside, 1-proud smooth_quartz_slab eave.
- **hostelLanterns, neon lighting**: lantern hanging=true from iron_chain under a band end.

## ROOMS
Exterior-only brief. The only rooms are the lit shop and lobby bays just behind the L1 windows (depth ring 2..3 or a little more), so each reads at dusk through its glass. Floor material is spruce_planks (polished_andesite in lobbies). Each room's designer furnishes it as a shop display, not for walking.

| room | box (module space x,y,z) | entered through |
|---|---|---|
| Inn cafe | [36,10,2,57,12,5] | N doors x40..41, x50..51 z1 y9 |
| Inn lobby | [48,10,20,53,12,25] | hotel door x54 z22..23 |
| 101 Stewart shop and lobby | [89,4,2,111,7,5] | N doors z1 x32..33 (lobby) / x24..25 / x42..43, y3 |
| Palihotel shop | [167,4,8,179,7,11] | N door z7 x37..38 y3 |
| Fix west shop | [206,2,18,211,6,23] | W doors x9 z18..19 and z22..23 y1 |
| Hahn shop | [299,5,31,313,8,33] | S doors, snap rule |
| Pike St shop | [332,3,46,337,7,49] | S door z50 x6..7 y2 |

Interior stairs/floors above are not built: floors above ring 2 are slabs at the architect's storey y's behind lit windows.

## PARTS (<= 6, 12 minutes each, in build order)
1. **P-INN** (`parts/inn.mjs`, plot 0): shell, plinth, bays, courtyard, gate, string/cornice, awnings, roof deck and pavilion. Ticks I1-I13, A1-A4.
2. **P-STW** (`parts/stewart.mjs`, plot 1): shell, shop base, ribbon storeys, 3 terraces, penthouse. Ticks S1-S6.
3. **P-PAL** (`parts/palihotel.mjs`, plot 2): shell, base, bays, cornice, blade sign, HVAC. Ticks P1-P9.
4. **P-FIX** (`parts/fix.mjs`, plot 3): shell, base, windows, belts, fire escapes, crests, tank, bulkhead. Ticks F1-F10.
5. **P-LOW** (`parts/low.mjs`, plots 4 and 5): both small brick blocks, signs, neon band, HVAC. Ticks H1-H5, K1-K6.
6. **P-DUSK** (`parts/dusk.mjs`, all plots, LAST): windowLit, shopGlow, doorLantern, azalea planters on ground floors, courtyard dressing, lamp posts at doors. Ticks A5, A6, I3 dressing.

## Notes for workers
- Lot geometry first: compute M and ring from the footprint map in `ringOf` once, put it in `parts/common.mjs`, and use the same function in every part. Cell (x,z) in M iff footprint row z//2, col x//2 is `#`. A hand-coded rectangle is wrong.
- **Snap rule**: a door, window or sign listed in the architect's table that lands on a cell not in ring 1/0 of M (e.g. Hahn hostel door z30 x18..19 sits in a notch of the mask) moves to the nearest 2-wide tread run of the same face; report the new coordinates.
- Build only on `#` cells; never write outside the plot box. Each column starts at G; a stepped footprint of proud elements (ring 0) must sit on ground too: extend ring-0 plinth down to G.
- Entrance floors where G is below the floor y use slab ramps (slab-slab-slab, then a 2-long landing); where G is above the floor y, cut nothing: put the door at G and the sill at the floor y.
- Dusk: every part lays the lit-window pattern only through P-DUSK; the shell parts leave window and ring 2-3 cells air.
- Vocabulary files are shared: don't redefine a helper under another name. Check `$MCD check` (nothing floating) and render the W face (bay side) and N face for each plot.

## CHECKLIST
- [ ] P-INN  - [ ] P-STW  - [ ] P-PAL  - [ ] P-FIX  - [ ] P-LOW  - [ ] P-DUSK
```

### elements.md

```markdown
# REQUIRED ELEMENTS (coordinates are PLOT-LOCAL as in plan.md; module-space = local x + plot offset: P0 0, P1 65, P2 133, P3 196, P4 265, P5 326; z and y unchanged)

Part keys: P-INN, P-STW, P-PAL, P-FIX, P-LOW (Hahn + Pike St Commercial), P-DUSK (lights, shop fronts, planting, all plots).

## Whole set
| # | element | construction (block by block) | where | part | vocab |
|---|---|---|---|---|---|
| A1 | Stepped lot walls ("every face a staircase") | 1-thick wall on ring 1 of M, every column from y=G(x,z) up; never squared off; ring 0 proud only where listed | all plots | each shell part | groundColumn, ringOf |
| A2 | Downhill storeys built down to G | basement/base columns start at G; plinth ring 0 smooth_stone / polished_andesite / stone_bricks from G up to the base top | W and S faces | each shell part | groundColumn |
| A3 | Flat roof deck + parapet + coping | deck slab layer on ring>=1 (concrete/planks/smooth_stone), parapet 1-2 high on ring 1, slab coping | all | each shell part | deckAndParapet |
| A4 | Windows of the bay rhythm | glass_pane in ring 1 (pane states connected), sill slab at ring 0, upside-down stair lintel | all | shell parts | bayRhythm, windowLit |
| A5 | Dusk glow | ochre_froglight at ring 3 behind ~70% of windows, hanging lantern at ring 2; every shop window lit | all | P-DUSK | windowLit, shopGlow |
| A6 | Lanterns at doors and under awnings/bands | lantern hanging from slab/stair/chain at ring 0 | all doors | P-DUSK | doorLantern |

## Plot 0 Inn at the Market
| # | element | construction | where | part | vocab |
|---|---|---|---|---|---|
| I1 | cream stucco body | smooth_sandstone wall ring 1, y G..28 | x0..61 z0..53 | P-INN | groundColumn |
| I2 | plinth + polished course | smooth_stone ring 0 G..8, polished_andesite y9 | W, S faces | P-INN | plinth |
| I3 | courtyard | void x24..37 z18..33 from y10; paved y9 floor = stone_bricks with polished_andesite border; walls dressed like the street faces, iron_bars balconies; potted azaleas; 2 lantern posts | x24..37 z18..33 | P-INN (void) / P-DUSK (dress) | courtyardWall |
| I4 | courtyard gate | 3 wide x 4 tall arch, y5..8 at S z=49 x24..26: ring 1 cells air, upside-down smooth_sandstone_stairs as arch head; slab-step ramp inside to y9 | x24..26 z49 | P-INN | archGate |
| I5 | stacked bay windows | middle 4 of every 8-long W/N/S tread at ring 0, y15..27: glass_pane front 2 + 1-wide sides, smooth_sandstone panel at each floor line (y19, y24), upside-down smooth_sandstone_stairs corbel at y14 | W,N,S 8-treads | P-INN | stuccoBay |
| I6 | juliet balconies | iron_bars at ring 0, y floor+1, under windows of treads with no bay | other treads L2-L4 | P-INN | julietBalcony |
| I7 | string course y14, cornice y28 | smooth_sandstone_slab (top) y14; cut_sandstone y28 + upside-down smooth_sandstone_stairs y27 every other cell | ring 0 | P-INN | cornice |
| I8 | cut_sandstone quoins | alternating 1/2 wide cut_sandstone at every riser, y9..28 | risers | P-INN | quoin |
| I9 | cafe awnings | green_wool / white_wool alternating by cell, 1 deep, at y13..14 ring 0 over each L1 window; green_carpet edge; N z=0 x32..59, E x=55 z18..27 | as listed | P-INN | awning |
| I10 | hotel entrance + cafe doors | dark_oak_door both halves: x55 z22..23 (wall x54) y9; N z1 x40..41 and x50..51 y9; slab-step ramps | as listed | P-INN | doorPair |
| I11 | rooftop deck + pergolas + umbrellas | spruce_planks deck y29; ring-1 smooth_sandstone parapet y30 + iron_bars y31 + coping; pergolas dark_oak_fence posts y30..32 + dark_oak_slab grid y33 over x30..39 z6..14 and x26..36 z36..44; 6 umbrellas (dark_oak_fence pole y30..31, 3x3 white_wool y32) | roof | P-INN | pergola, umbrella |
| I12 | azalea planters | spruce_trapdoor box (closed ring) with flowering_azalea_leaves (persistent) every 4 along W parapet | roof W | P-INN | azaleaPlanter |
| I13 | glazed rooftop pavilion + lift tower | x40..51 z8..19 y30..34 glass_pane walls, smooth_quartz roof y35, 1-proud smooth_quartz_slab eave; tower x44..47 z22..25 y30..38 smooth_sandstone with a lit slit | roof | P-INN | pavilion |

## Plot 1 101 Stewart
| # | element | construction | where | part | vocab |
|---|---|---|---|---|---|
| S1 | brick + beige tower | bricks wall ring 1 y9..48; roof deck y49 | whole | P-STW | groundColumn |
| S2 | shop base | glass_pane y4..7 in polished_andesite frame, piers ring 0 every 7 on long treads, smooth_sandstone fascia y8 ring 0 | G..8 | P-STW | shopfront |
| S3 | ribbon windows | per 5-tall storey: smooth_sandstone band at floor, bricks spandrel y+1, continuous glass_pane y+2..y+3 per tread broken by a bricks pier every 7 cells and every riser, band y+4; every 2nd storey band projects as smooth_sandstone_slab at ring 0 | L2..L13 | P-STW | ribbonStorey |
| S4 | brick pilasters at risers | bricks ring 0 full height | risers | P-STW | pilaster |
| S5 | three terraces + penthouse | setbacks at ring 5 (y49..58, deck 59), ring 9 (59..63, deck 64), ring 13 (64..68, deck 69), penthouse ring 18 bricks y70..74, smooth_sandstone cap y75; smooth_stone decks, smooth_sandstone parapet + iron_bars rail, azalea planters every 5 | roof | P-STW | terrace, azaleaPlanter |
| S6 | lobby + shop doors | dark_oak_door pairs: N z1 x32..33 (lobby), x24..25, x42..43; E x62 z10..11, z16..17; y3 | listed | P-STW | doorPair |

## Plot 2 Palihotel
| # | element | construction | where | part | vocab |
|---|---|---|---|---|---|
| P1 | red brick body | bricks ring 1 G..28, roof deck gray_concrete y29 | whole | P-PAL | groundColumn |
| P2 | plinth, shop glass, green fascia | polished_andesite ring 0 G..3; glass y4..7 between polished_andesite pilasters; green_terracotta fascia y8 ring 0; belt course stone_brick_slab y9 | L1 | P-PAL | shopfront |
| P3 | awnings | green_wool 1-deep slab-edge at y9 over shop treads | L1 | P-PAL | awning |
| P4 | windows 2x3 + sills + lintels | glass_pane, smooth_stone_slab sill ring 0 at floor, upside-down stone_brick_stairs pair lintel at floor+4 | L2-L5 | P-PAL | bayRhythm |
| P5 | oriel bay windows | W treads x=6 z18..25, x=4 z26..33, x=2 z34..43, N z=6 x34..41: middle 4 cells at ring 0 y10..27 bricks with glass faces, upside-down brick_stairs corbel y9, polished_andesite cap y28 | listed | P-PAL | orielBay |
| P6 | sheet-metal cornice | polished_andesite ring 0 y28..29, upside-down polished_andesite_stairs brackets y27 every 2, slab course y30, brick parapet y30..31, polished_andesite_slab coping y32 | roofline | P-PAL | cornice |
| P7 | lit blade sign PALIHOTEL | N z=10 x53..55, 1 proud: red_concrete board y9..28, 9 white banner letters stacked top to bottom (P y26..27 ... L y10..11) facing north, glowstone at x53 and x55 every 2 rows | x53..55 z10 | P-PAL | bladeSign |
| P8 | doors | dark_oak_door: E x54 z28..29 y3 (entrance), W x=3 z38..39 y1, N z7 x37..38 y3 | listed | P-PAL | doorPair |
| P9 | rooftop HVAC + tubs | light_gray_concrete 3x3x2 at x26..28 z26..28 and x36..38 z36..38; azalea tubs | roof | P-PAL | hvacBox |

## Plot 3 The Fix
| # | element | construction | where | part | vocab |
|---|---|---|---|---|---|
| F1 | brick warehouse | bricks ring 1 G..36, deck gray_concrete y36 | whole | P-FIX | groundColumn |
| F2 | rusticated base | stone_bricks ring 0 G..1, to y8 on W treads, polished_andesite pier caps | base | P-FIX | plinth |
| F3 | large openings L1 | 2 wide x 5 tall y2..6 glass_pane | L1 | P-FIX | bayRhythm |
| F4 | multi-pane windows | 2 x 4 glass_pane at floor+1..+4 each storey L2-L5 (floors 8,15,22,29), smooth_stone_slab sill ring 0, terracotta lintel ring 1 at floor+5 | L2-L5 | P-FIX | bayRhythm |
| F5 | belt courses | stone_brick_slab ring 0 at y8, y29 | all | P-FIX | cornice |
| F6 | fire escapes | W treads x=8 z16..23 and x=2 z36..43, ring 0: landing per storey at y floor = iron_trapdoor closed half top; iron_bars rail y floor+1; polished_blackstone_stairs 1 wide zig-zag between landings (facing = walk-up direction); iron_bars hanging ladder under L2 landing to y4 | listed | P-FIX | fireEscape |
| F7 | stepped parapet crests | bricks parapet y37..38; over both fire-escape treads steps up 1 per 2 cells to y41, stone_brick_slab coping | roofline | P-FIX | steppedCrest |
| F8 | water tank | spruce_planks cylinder radius 2 at x30..34 z30..34 y38..43 on 4 dark_oak_fence legs y37, spruce_slab cone top, iron_bars hoops | roof | P-FIX | waterTank |
| F9 | stair bulkhead | x40..44 z36..40 y37..41 bricks, one door, slab roof | roof | P-FIX | bulkhead |
| F10 | doors | dark_oak_door W x3 z38..39 y1 (apartments, entrance), W x9 z18..19 and z22..23 y1 | listed | P-FIX | doorPair |

## Plot 4 Hahn and Plot 5 Pike St Commercial
| # | element | construction | where | part | vocab |
|---|---|---|---|---|---|
| H1 | Hahn brick body | bricks ring 1 G..19, deck gray_concrete y20 | plot 4 | P-LOW | groundColumn |
| H2 | andesite base + shop glass + green awnings | polished_andesite ring 0 G..4; glass y5..8, pilasters on risers; green_wool awnings y10 | L1 | P-LOW | shopfront, awning |
| H3 | cornice + parapet + skylight | smooth_sandstone ring 0 y20, upside-down smooth_sandstone_stairs brackets y19 every 2; bricks parapet y21..22, smooth_stone_slab coping; glass skylight 4x2 x30..33 z14..15 | roof | P-LOW | cornice |
| H4 | GREEN TORTOISE hostel sign | green_concrete board ring 0 y11..14: GREEN S z=29 x14..25, TORTOISE S z=31 x26..33, white banner letters y12..13 via bannerWord (reads west-to-east from the street), lantern at each end | S treads | P-LOW | bannerSign |
| H5 | Hahn windows + doors | 2x3 glass_pane smooth_stone_slab sills L2-L3; doors S z30 x18..19 (hostel; snap rule), S z26 x8..9, S z34 x36..37 | listed | P-LOW | bayRhythm, doorPair |
| K1 | Pike St body | bricks ring 1 G..15, deck gray_concrete y15 | plot 5 | P-LOW | groundColumn |
| K2 | shop level | smooth_stone ring 0 G..2; big glass y3..7, transom, cut_sandstone mullions ring 1 every 3 | L1 | P-LOW | shopfront |
| K3 | neon band | red_concrete ring 0 y8..9 all faces; words PIKE (S z=51 x4..11), PLACE (z=55 x18..25), SUPPLY (z=59 x32..39), CO. (z=61 x40..47) white banner letters; sea_lantern behind not allowed on facade (no light block): lanterns hang at y7 over each pier | band | P-LOW | bannerSign, doorLantern |
| K4 | terracotta L2 | cut_sandstone piers, bricks spandrels, windows 2x3 y11..13 | L2 | P-LOW | bayRhythm |
| K5 | parapet + HVAC | cut_sandstone y16..17, smooth_sandstone_slab coping, chiseled_sandstone panel centred per tread; light_gray_concrete boxes with iron_trapdoor vents at x20..24 z20..23, x34..37 z30..33, x26..28 z40..42 | roof | P-LOW | deckAndParapet, hvacBox |
| K6 | shop doors | dark_oak_door S z50 x6..7, z54 x20..21, z58 x34..35, z60 x42..43 y2 | listed | P-LOW | doorPair |
```

### rooms.json

```json
{"entrance":[55,9,22],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{"roles":{"inn_stucco":["smooth_sandstone","smooth_sandstone_stairs","smooth_sandstone_slab"],"inn_trim":["cut_sandstone","cut_sandstone_slab","chiseled_sandstone"],"brick":["bricks","brick_stairs","brick_slab","brick_wall"],"base_stone":["smooth_stone","smooth_stone_slab","stone_bricks","stone_brick_slab","stone_brick_stairs","polished_andesite","polished_andesite_stairs","polished_andesite_slab"],"lintel":["terracotta"],"fascia":["green_terracotta","red_concrete","green_concrete","black_concrete"],"glass":["glass_pane","glass","white_stained_glass_pane"],"door":["dark_oak_door","dark_oak_trapdoor","dark_oak_stairs"],"awning":["green_wool","white_wool","green_carpet","white_carpet"],"ironwork":["iron_bars","iron_trapdoor","polished_blackstone_stairs","chain","ladder"],"deck":["gray_concrete","light_gray_concrete","spruce_planks","smooth_quartz","smooth_quartz_slab","spruce_slab","dark_oak_slab"],"roof_furniture":["dark_oak_fence","spruce_fence","spruce_trapdoor"],"ground":["dirt"],"Brick façades and parapets":["bricks","brick_stairs","brick_slab","brick_wall","terracotta"],"Cream façades and beige panels":["smooth_sandstone","smooth_sandstone_stairs","smooth_sandstone_slab"],"Trim, bays and cornices":["smooth_quartz","smooth_quartz_stairs","smooth_quartz_slab","stone_bricks","stone_brick_stairs","stone_brick_slab","stone_brick_wall"],"Roofs and equipment":["gray_concrete","smooth_stone","smooth_stone_slab","iron_bars","dark_oak_trapdoor"],"Windows and storefronts":["glass_pane","gray_stained_glass_pane","dark_oak_door"],"Railings, fire escapes and deck furniture":["iron_bars","dark_oak_trapdoor","dark_oak_fence","dark_oak_stairs","dark_oak_slab"],"Awnings and rooftop parasols":["green_wool","white_wool","dark_oak_fence"],"Lighting and illuminated signs":["lantern","sea_lantern","green_concrete","red_concrete","red_stained_glass","green_stained_glass","yellow_stained_glass"],"Planting and shop details":["oak_leaves","azalea_leaves","flower_pot","potted_fern","barrel","bookshelf"]},"objects":["flowering_azalea_leaves","flower_pot","lantern","ochre_froglight","shroomlight","glowstone","candle","white_banner","dark_oak_wall_sign","dark_oak_hanging_sign","sea_lantern","iron_bars","dark_oak_trapdoor","dark_oak_fence","dark_oak_stairs","dark_oak_slab","dark_oak_door","glass_pane","gray_stained_glass_pane","green_wool","white_wool","green_concrete","red_concrete","red_stained_glass","green_stained_glass","yellow_stained_glass","oak_leaves","azalea_leaves","potted_fern","barrel","bookshelf"]}
```

### make.sh

```sh
#!/bin/sh
# Make build.nbt from scratch: build into a temp file in this folder, then move it into place.
set -eu
cd "$(dirname "$0")"
tmp="build.tmp.$$.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// Pike Place build: the site grid, the ground under each plot, then the six parts in build order.
// Usage: node build.mjs <out.nbt>   (make.sh runs it into a temp file, then moves it into place)
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, PLOTS, GROUND_BLOCK } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }
const outPath = resolve(out);
process.chdir(fileURLToPath(new URL(".", import.meta.url)));   // palette.json, roof.json, site.json are read from here

// Parts in build order. A part whose module file is not there yet builds as nothing (its worker's copy may be a stub).
const PARTS = [
  { name: "Inn at the Market", module: "parts/inn.mjs" },
  { name: "101 Stewart tower", module: "parts/stewart.mjs" },
  { name: "Palihotel", module: "parts/palihotel.mjs" },
  { name: "The Fix building", module: "parts/fix.mjs" },
  { name: "Hahn and Pike Street Commercial", module: "parts/low.mjs" },
  { name: "Dusk lighting and grounds", module: "parts/dusk.mjs" },
];

// The brief's GROUND height at block (x, z) of a plot: one map cell is 2x2 blocks; '.' takes the nearest known cell.
function groundAt(map, row, col) {
  const known = (r, c) => { const v = map[r]?.[c]; return v !== undefined && v !== "." ? Number(v) : null; };
  for (let r = 0; r < 64; r++) {
    for (let dr = -r; dr <= r; dr++) for (let dc = -r; dc <= r; dc++) {
      if (Math.max(Math.abs(dr), Math.abs(dc)) !== r) continue;
      const h = known(row + dr, col + dc);
      if (h != null) return h;
    }
  }
  return 0;
}

// Lay the ground: each plot's place box filled from y 0 up to its GROUND height. Nothing lies below the ground.
function layGround(g, site) {
  for (const [key, p] of Object.entries(PLOTS)) {
    const map = site.plots[key].ground;
    for (let z = 0; z < p.d; z++) for (let x = 0; x < p.w; x++) {
      const h = groundAt(map, z >> 1, x >> 1);
      for (let y = 0; y < h; y++) g.set(p.offset + x, y, z, GROUND_BLOCK);
    }
  }
}

async function loadPart({ name, module }) {
  const file = new URL(module, import.meta.url);
  if (!existsSync(fileURLToPath(file))) {
    console.log(`part ${name}: ${module} not there yet, built as nothing`);
    return () => {};
  }
  const mod = await import(file.href);
  return mod.build ?? (() => {});
}

const site = JSON.parse(readFileSync(new URL("./site.json", import.meta.url), "utf8"));
const g = new Grid([SITE.x, SITE.y, SITE.z], { dataVersion: DATA_VERSIONS["1.21.1"] });
layGround(g, site);
const list = [];
for (const p of PARTS) list.push([p.name, await loadPart(p)]);
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(outPath);
console.log(`saved ${outPath}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for every part: palette block ids (palette.json only), site coordinates, seeded rng.

// ---- site (module space: x = plot offset + local x, y = height, z unchanged) ----

// ---- site (module space: x = plot offset + local x, y = height, z unchanged) ----
export const SITE = { x: 388, y: 86, z: 73 };                 // grid size: x 0..387, y 0..85, z 0..72

export const PLOTS = {                                         // plot: offset along x, place box w x d, height cap

export const GROUND_BLOCK = "dirt";                            // fill under the ground surface (G); not a shell material

// ---- palette: the ids of palette.json, by name ----
export const STUCCO = "smooth_sandstone";                      // Inn body

export const STUCCO_STAIRS = "smooth_sandstone_stairs";        // Inn corbels and lintel pairs (upside down)

export const STUCCO_SLAB = "smooth_sandstone_slab";            // Inn string course, shadow lines, coping

export const CUT_SANDSTONE = "cut_sandstone";                  // Inn quoins and cornice; Pike St terracotta piers

export const CUT_SANDSTONE_SLAB = "cut_sandstone_slab";        // cut sandstone course caps

export const CHISELED_SANDSTONE = "chiseled_sandstone";        // Pike St parapet panels

export const BRICKS = "bricks";                                // brick bodies: Stewart, Palihotel, Fix, Hahn, Pike St

export const BRICK_STAIRS = "brick_stairs";                    // brick corbels (Palihotel oriel)

export const BRICK_SLAB = "brick_slab";                        // brick slab caps

export const BRICK_WALL = "brick_wall";                        // brick wall caps

export const SMOOTH_STONE = "smooth_stone";                    // base course, Inn deck-area base, terrace decks

export const SMOOTH_STONE_SLAB = "smooth_stone_slab";          // sills, coping, Hahn skylight coping

export const STONE_BRICKS = "stone_bricks";                    // Fix base and rusticated ground storey

export const STONE_BRICK_SLAB = "stone_brick_slab";            // Palihotel belt course, Fix belt courses and crests

export const STONE_BRICK_STAIRS = "stone_brick_stairs";        // Palihotel window lintels (upside down)

export const POLISHED_ANDESITE = "polished_andesite";          // Palihotel plinth, cornice, pilasters; Hahn base

export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs";  // Palihotel cornice brackets

export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";      // Palihotel cap and coping

export const TERRACOTTA = "terracotta";                        // Fix window lintels

export const GREEN_TERRACOTTA = "green_terracotta";            // Palihotel fascia board

export const RED_CONCRETE = "red_concrete";                    // Palihotel and Pike St sign boards

export const GREEN_CONCRETE = "green_concrete";                // Hahn sign board

export const BLACK_CONCRETE = "black_concrete";                // sign backing and trim

export const GLASS_PANE = "glass_pane";                        // every window glass

export const GLASS = "glass";                                  // skylight and pavilion glass

export const WHITE_STAINED_GLASS_PANE = "white_stained_glass_pane";  // pavilion and light panes

export const DARK_OAK_DOOR = "dark_oak_door";                  // every door, both halves

export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";          // bulkhead and hatch doors

export const DARK_OAK_STAIRS = "dark_oak_stairs";              // door steps

export const GREEN_WOOL = "green_wool";                        // green awning stripes

export const WHITE_WOOL = "white_wool";                        // white awning stripes; umbrella canopies

export const GREEN_CARPET = "green_carpet";                    // awning hem (green)

export const WHITE_CARPET = "white_carpet";                    // umbrella hem

export const IRON_BARS = "iron_bars";                          // rails, juliet balconies, ladders, hoops

export const IRON_TRAPDOOR = "iron_trapdoor";                  // fire-escape landings, HVAC vents

export const POLISHED_BLACKSTONE_STAIRS = "polished_blackstone_stairs";  // fire-escape stair runs

export const CHAIN = "chain";                                  // hanging lanterns (1.21.1 name; iron_chain is 1.21.2+)

export const LADDER = "ladder";                                // drop-ladders

export const GRAY_CONCRETE = "gray_concrete";                  // roof deck (non-Inn)

export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";      // HVAC boxes

export const SPRUCE_PLANKS = "spruce_planks";                  // Inn deck, pavilion floor, water tank

export const SMOOTH_QUARTZ = "smooth_quartz";                  // pavilion corner posts and roof

export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";        // pavilion eave

export const SPRUCE_SLAB = "spruce_slab";                      // water tank cone, shop counters

export const DARK_OAK_SLAB = "dark_oak_slab";                  // pergola grid

export const DARK_OAK_FENCE = "dark_oak_fence";                // pergola posts, umbrella poles, lamp posts

export const SPRUCE_FENCE = "spruce_fence";                    // roof furniture

export const SPRUCE_TRAPDOOR = "spruce_trapdoor";              // planter boxes, shop shelves

export const DIRT = GROUND_BLOCK;                              // planter floors (same id as GROUND_BLOCK)

export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves";  // planting (persistent)

export const FLOWER_POT = "flower_pot";                        // shop shelf pots

export const LANTERN = "lantern";                              // door, awning and band lanterns

export const OCHRE_FROGLIGHT = "ochre_froglight";              // lit-window light behind the glass

export const SHROOMLIGHT = "shroomlight";                      // alternate window light (every 5th lit)

export const GLOWSTONE = "glowstone";                          // lit edges of the blade sign

export const CANDLE = "candle";                                // lit candles in shop windows

export const WHITE_BANNER = "white_banner";                    // sign letters (banner words)

export const DARK_OAK_WALL_SIGN = "dark_oak_wall_sign";        // wall sign carriers

export const DARK_OAK_HANGING_SIGN = "dark_oak_hanging_sign";  // hanging sign carriers

// ---- rng ----
// rng(seed): returns a function giving floats in [0, 1); the same seed always gives the same sequence (mulberry32).
export function rng(seed)
```

### vocab/h1.mjs

```js
// H1 helpers from plan.md VOCABULARY: ringOf, windowLit, cornice, shopfront, julietBalcony, terrace, fireEscape, hvacBox.
//
// Plot-local coordinates throughout (x, z per plot as in plan.md; y as in plan.md). Every helper takes its position
// (and facing, where it has one) as arguments; nothing is fixed to a spot. Writes go only into AIR; an option `over`
// lists block ids a helper may replace. A refused write (occupied or out of the grid) is collected, never thrown, and
// each helper returns the refusals as [x, y, z, block] so the caller can report them. Panes and iron bars get their
// connection states when the helper finishes, so lay the neighbours first. Leaves are persistent=true.
//
// Shapes the helpers share:
//   plot    { footprint: string[] }       FOOTPRINT rows: row z//2, column x//2, "#" = build here
//   tread   { face, wall: [[x,z], ...] }  ring-1 wall cells of one straight run, in order along it. face is the outward
//                                         direction (north/south/east/west); the proud ring-0 cell is cell + face.
//   window  { face, cells: [[x,z], ...], floor, h, n, s, seq? }
//                                         ring-1 glass cells of one opening, in order along the run. n = its index on
//                                         the tread, s = its storey index, seq = its index among all lit windows
//                                         (defaults to n + s).

/**
 * Ring of every cell of the footprint M: ring k = cells whose 4-neighbour distance to the nearest cell outside M is
 * k+1 (ring 0 is the outermost). faceDir is the direction toward the outside (for a ring-0 cell, its outside
 * neighbour; at a corner, the first of north, south, east, west). Returns Map "x,z" -> { ring, faceDir }.
 */
export function ringOf(plot)

/**
 * Dusk glow behind one window: ochre_froglight at ring 3, y floor+2, centred behind the glass, and a hanging lantern at
 * ring 2, y floor+3, under a bottom slab at floor+4 (a lantern needs a block above it). Lit when (n + s + stagger) % every
 * != 0; every fifth lit window (seq % 5 === 4) takes a shroomlight instead. The centre of an even-length window is its
 * lower cell. Leaves ring 2 air at floor+1..floor+2, so the room stays walkable under the lantern.
 */
export function windowLit(g, window, { every = 3, stagger = 0, over = [] } = {})

/**
 * Cornice along one tread, at ring 0 (proud of the wall). `course` is a full block at y (an id, or [id, state]);
 * `brackets` is a stairs family (e.g. "smooth_sandstone") with upside-down stairs at bracketsY (default y-1), every
 * `every` cells, facing into the wall; `slab` is a slab family (e.g. "smooth_sandstone") with a top slab course at slabY.
 */
export function cornice(g, tread, { y, course, brackets, bracketsY = y - 1, slab, slabY, every = 2, over = [] } = {})

/**
 * Shopfront along one tread: glass_pane in ring 1 at y baseY+1..baseY+h; frame piers (block id `frame`) at ring 0 on
 * every `pierEvery`-th cell and on both risers (the tread's ends) over the same rows; a fascia course of `fascia` at
 * ring 0, y fasciaY (put it above baseY+h).
 */
export function shopfront(g, tread, { baseY, h, frame, pierEvery = 7, fascia, fasciaY, over = [] } = {})

/**
 * Juliet balcony under one window: iron_bars across the window's width at ring 0, y floor+1, plus a 2-high iron_bars
 * post just beyond each end of the window (along the wall). window.cells must be in order along the run.
 */
export function julietBalcony(g, window, { over = [] } = {})

/**
 * One terrace (plan.md PLOT 1 S5). Walls on ring k from y0 to y1 in the 5-tall ribbon (band at y0 and y0+4,
 * bricks at +1, glass_pane at +2..+3). Deck `deck` at y1+1 on the rings between k and `next` (the next terrace's ring;
 * omit for the top). A parapet block on ring k at y1+1 with an iron_bars rail above it. A planter every `planterEvery`
 * cells two rings in from the wall: four spruce trapdoors on the deck around dirt with flowering azalea on top.
 */
export function terrace(g, plot, { ring: k, next = Infinity, y0, y1, parapet = "smooth_sandstone", rail = "iron_bars", deck = "smooth_stone", planterEvery = 5, over = [] } = {})

/**
 * Fire escape on one tread (plan.md F6): ring-0 column x, from z0 to z1. Landings are 2 cells long, one per floor in
 * `floors` (iron_trapdoor closed half top at the landing cells). Each flight rises 1 per cell, 6 polished_blackstone_stairs
 * facing the walk-up direction, alternating ends, to the next landing; iron_bars support under each step down to its
 * flight's floor. iron_bars rail on the outer side of each landing and at its back end. ladderTo: an iron_bars drop from
 * the first landing down to that y. Direction of the first flight is +z; the tread face gives the outer side.
 */
export function fireEscape(g, tread, { x, z0, z1, floors = [8, 15, 22, 29], ladderTo, over = [] } = {})

/**
 * A filled box of `block` (x0,y0,z0 .. x1,y1,z1). Two faces (default north and east) carry an open iron_trapdoor vent at
 * the middle of the face, at mid height. pipes: two iron_bars on the box's north-west top corner.
 */
export function hvacBox(g, box, { block = "light_gray_concrete", vent = "iron_trapdoor", vents = ["north", "east"], pipes = false, over = [] } = {})
```

### vocab/h2.mjs

```js
// plan.md VOCABULARY, part two: groundColumn, shopGlow, quoin, awning, archGate, azaleaPlanter, steppedCrest, pergola.
// Plot-local coordinates everywhere (y is the build's y). Shapes the callers pass:
//   plot   = { ground } where ground[z >> 1][x >> 1] is the GROUND value of that 2x2 cell (null where the map has '.')
//   tread  = { cells: [[x, z], ...], face: "N" | "S" | "E" | "W" }   ring-1 wall cells, in order along the face
//   riser  = [[x, z], ...] (or { cells }), ring-0 cells in order
//   window = { x, z, floor, face }                                   ring-1 cell of the window and its outward face
// Writes go to air only, unless an option says otherwise; every helper returns the number of cells it wrote.

/** GROUND value of a cell; a '.' (null) takes the nearest cell that has one. */
export function groundAt(plot, x, z)

/** One column of the shell from the ground up to `top`; nothing below G. */
export function groundColumn(g, plot, { x, z, top, block })

/** The lit counter, candle and hanging lantern behind one L1 shop window (ring 2), and a shelf on ring 3. Only the
 *  window's own column is written, so the 2-high lane beside the counter stays clear. */
export function shopGlow(g, { x, z, floor, face: f })

/** Stones down a riser (ring 0): each course alternates `long` and `short` widths, and the next course starts on the
 *  other width, so the joints stagger. */
export function quoin(g, riser, { y0, y1, long = 2, short = 1, block = "cut_sandstone" })

/** A wool awning one cell out from each tread cell at y, colours alternating per cell, with a carpet hem at y-1 on the
 *  same outer cell. Depth is ring 0 only, so depth must be 1. */
export function awning(g, tread, { y, colors: [a, b], depth = 1 })

/** A passage through the wall: `w` wide, `h` tall from y, `depth` cells in from ring 1 (ring 1 and ring 2 by default).
 *  The wall-plane cell (x, z) is the left end of the opening as seen from outside; `face` is the outward face. Springers
 *  (upside-down stairs facing in) sit at the top corners and a smooth_sandstone lintel row closes the top. With `carve`,
 *  the opening is cut through the wall and the arch overwrites what is there; otherwise only air is written. */
export function archGate(g, { x, z, w = 3, h = 4, y, face: f = "S", depth = 2, carve = false })

/** A 3x3 planter: spruce trapdoor rim (closed, top half) at y, dirt soil in the centre at y, and a persistent azalea
 *  bush on the soil at y+1. */
export function azaleaPlanter(g, [x, y, z])

/** Bricks on each cell of a tread (ring 1). The centre rises to y1 and each step away from it drops 1 per 2 cells, down
 *  to y0. Each column is capped by a bottom stone_brick slab at its top cell. */
export function steppedCrest(g, tread, { y0 = 39, y1 = 41 } = {})

/** A pergola over box [x0, y0, z0, x1, y1, z1]: dark_oak_fence posts on a lattice every 3 cells (box edges included),
 *  posts from y0 up to y1-1, and dark_oak_slab beams (top half) on every lattice line at y1. */
export function pergola(g, [x0, y0, z0, x1, y1, z1])
```

### vocab/h3.mjs

```js
// Pike First Ave: the eight plan.md VOCABULARY helpers in this file (plinth, doorPair, pilaster, stuccoBay,
// courtyardWall, bladeSign, waterTank, umbrella). Each takes its position as arguments (plot-local, as in plan.md)
// and writes only into air inside its own footprint, never ground under it. Each returns the cells it placed, [x, y, z].
// Inputs without ringOf/groundColumn (those live in vocab.mjs, which this file does not import):
//   plot  = { ring0: [[x, z, G], ...] }     ring-0 columns with their ground value G
//   tread = { cells: [[x, z], ...], face }  ring-1 wall cells in run order; face = outward (north|south|east|west)

/** plinth: ring-0 columns from G up to `top` in `block`, with an optional `cap` block at top + 1. Nothing below G. */
export function plinth(g, plot, { top, block = "smooth_stone", cap = null } = {})

/**
 * doorPair: a 2-wide, 2-high door in the wall plane. (x, z) is the first ring-1 cell of the opening; face is the
 * way the door faces (outward, the street side). Both columns get a lower and an upper half with the same facing
 * and hinge. ground = the walking level outside (the first air cell at ring 0). If it is 1 or 2 below the floor y,
 * three bottom slabs run out in front of each column (on smooth_stone where the ground is lower). Never stairs.
 */
export function doorPair(g, { x, z, y, face: f, doorBlock = "dark_oak_door", ground = y } = {})

/** pilaster: a 1-wide column of `block` on each ring-0 cell of a riser (riser = [[x, z], ...]), from y0 to y1. */
export function pilaster(g, riser, { y0, y1, block = "bricks" } = {})

/**
 * stuccoBay: the middle 4 cells of an 8-long tread, projected at ring 0 from y15 to y27. Glass in front, smooth_sandstone
 * panels at y19 and y24, an upside-down stair corbel at y14 (lip out), a slab roof at y28.
 */
export function stuccoBay(g, tread)

/**
 * courtyardWall: the street bay rhythm on a courtyard face. faceCells = { cells, face } with face pointing into the void.
 * Each window is glass_pane on ring 1 from floor+1 to floor+3, with iron_bars balconies at ring 0 on floor+1. When lit,
 * a warm light (ochre_froglight, every 5th shroomlight) sits behind it on floor+2, and 2 of every 3 windows are lit,
 * staggered by storey.
 */
export function courtyardWall(g, faceCells, { floors = [14, 19, 24], lit = true } = {})

/**
 * bladeSign: a 3-wide blade at ring 0 in the plane z, from y0 to y1 (x0 is the left edge when facing `face`).
 * Board in `board`, glowstone in the outer columns every 2 rows, and one white banner per 2-row slot in the middle
 * column, reading down from the top (word[0] at y1-2). Air only.
 */
export function bladeSign(g, { x0, z, y0, y1, face: f = "north", board = "red_concrete", lamp = "glowstone", word = "" } = {})

/**
 * waterTank: a spruce_planks tank on a disc of radius r around (cx, cz), standing on dark_oak_fence legs at the four
 * diagonal cells at y0 (under the floor). Floor at y0+1, rim walls to y0+5 with iron_bars hoops at y0+2 and y0+4,
 * spruce_slab cap at y0+6. The legs sit on the disc's diagonals, not at the box corners, which lie outside the disc.
 */
export function waterTank(g, { cx, cz, r = 2, y0 = 37 } = {})

/** umbrella: a dark_oak_fence pole on y and y+1, a plus-shaped white_wool canopy on y+2, white_carpet on the corners. */
export function umbrella(g, [x, y, z])
```

### vocab/h4.mjs

```js
// Eight helpers from plan.md VOCABULARY: bayRhythm, doorLantern, deckAndParapet, orielBay, ribbonStorey, bannerSign,
// bulkhead, pavilion. Each one plans its own cells first, then writes only the cells that land in air. A cell that is
// already built is skipped and reported, never overwritten; { over: true } replaces blocks in the helper's own cells
// (the storey's wall, for ribbonStorey) and nothing else. Coordinates are the grid's own (plot-local for a plot).
// Each returns { placed, skipped: [{ pos, why }] }; bannerSign also returns the number of letters it hung.
//
// A tread is { cells: [[x, z], ...] (ring-1 cells of one straight run of wall), face: "north"|"south"|"east"|"west" }.
// The face is the outward direction; ring 0 (the proud plane) is one cell out from each tread cell.

/** Windows of one storey on a tread: glass_pane in ring 1 (floor+1..floor+h), a slab sill at ring 0 on the floor line,
 *  and an upside-down stair lintel pair at ring 0 above the window. Air only: the shell leaves window cells open. */
export function bayRhythm(g, tread, { floorY, h = 3, sill = "smooth_stone", lintel = "stone_brick", over = false } = {})

/** A lantern beside a door, on the ring-0 cells either side of its 2-wide opening (the lane in front stays clear).
 *  door: { x, z, y, face } as doorPair takes it: the first ring-1 door cell (lower coordinate) and the floor y.
 *  mode "post": dark_oak_fence y+1..y+2 with a standing lantern on top; "hang": a hanging lantern at y+2 under a
 *  support block at y+3 (default a full smooth_stone). */
export function doorLantern(g, door, { mode = "post", support = "smooth_stone", over = false } = {})

/** Flat roof behind a parapet. The deck (a full block) fills every block of the footprint at ring >= `ring` at deckY;
 *  the parapet is `parapet` on ring `ring` for parapetH blocks; the coping is a `coping` slab on the parapet top; an
 *  optional iron_bars rail stands on the coping. The coping is type bottom: a top-type slab on the parapet would hang
 *  half a block in air. plot: { footprint } (rows of '#'/'.'). skip(x, z) leaves a cell alone (a courtyard, a void). */
export function deckAndParapet(g, plot, { deckY, deck = "gray_concrete", parapet = "smooth_sandstone", parapetH = 1, coping = "smooth_sandstone", rail = false, ring = 1, skip = () => ...

/** Stacked bay on ring 0 of a tread: the middle 4 tread cells project as a bay, y from..to. Bricks at the 2 corners, glass
 *  on the 2 middle faces (and in the ring-1 cells behind them), brick_stairs corbel (upside down) at corbelY, and a
 *  polished_andesite cap at capY. */
export function orielBay(g, tread, { from = 10, to = 27, corbelY = 9, capY = 28, over = false } = {})

/** One storey of ribbon windows on a tread: smooth_sandstone band at floorY, bricks spandrel at floorY+1, a continuous
 *  glass run at floorY+2..+3 broken by bricks piers at both ends and every 7 cells, smooth_sandstone band at floorY+4.
 *  project: a smooth_sandstone_slab (type top) at ring 0 under the band, the shadow line. */
export function ribbonStorey(g, tread, { floorY, project = false, over = false } = {})

/** A sign on ring 0 of a tread: a board of `board` over rows y0..y1 with one cell margin at each end, lanterns hanging
 *  under the two end cells, and the words in white wall banners hung in front of the board's middle (bannerWord reads
 *  left to right from the street). base is the banner's base dye: default the board's own colour. */
export function bannerSign(g, tread, { text, y0, y1, board = "red_concrete", letter = "white", base = board.replace(/_(concrete|terracotta|wool)$/, ""), lantern = true, over = false } = {})

/** A stair bulkhead on a flat roof: a hollow brick box (box = [x0, y0, z0, x1, y1, z1]) with a solid top, a slab cap on
 *  top, and one dark_oak_door on the `door` face in the middle, standing on the box's floor layer. */
export function bulkhead(g, box, { door = "south", block = "bricks", cap = "smooth_stone", over = false } = {})

/** A glazed rooftop pavilion over box = [x0, y0, z0, x1, y1, z1]: spruce_planks floor at y0, glass_pane walls on y0+1..y1
 *  with smooth_quartz corner posts, a 2-wide doorway in the south wall near the west corner (y0+1..y0+2), a smooth_quartz
 *  roof at y1+1, a 1-proud smooth_quartz_slab eave on the four sides, and one hanging lantern under the roof. */
export function pavilion(g, box, { floor = "spruce_planks", eave = true, over = false } = {})
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

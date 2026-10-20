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
- [x] P-INN  - [ ] P-STW  - [ ] P-PAL  - [ ] P-FIX  - [ ] P-LOW  - [ ] P-DUSK

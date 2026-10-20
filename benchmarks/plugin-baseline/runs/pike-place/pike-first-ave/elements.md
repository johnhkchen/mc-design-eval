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

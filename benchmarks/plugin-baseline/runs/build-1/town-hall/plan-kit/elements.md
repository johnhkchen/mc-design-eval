# Required elements — Town hall

Coordinates from plan.md. "Part" = the PARTS entry that builds it; "Vocab" = helper in plan.md VOCABULARY. Every object is built block by block.

| # | Element | Construction | Coordinates | Part | Vocab |
|---|---|---|---|---|---|
| 1 | Brick body, two storeys on plinth | `bricks` walls y4..9 and 11..15, polished_andesite y1..2, stone_bricks y3 with upside-down stone_brick_stairs proud +1, smooth_quartz string y10 with top quartz_slab proud +1 on front, quartz_block cornice y16 | x4..36, z10..26 (pavilions z9) | 1 shell, 3 dressings | quoinColumn, stringCourse |
| 2 | Four-column portico | podium stone_bricks y1..3 x15..25 z6..9; 4 `quartz_pillar` axis y (y5..14) on chiseled_quartz_block base y4 at x15,18,22,25 z6; entablature y15 smooth_quartz, y16 quartz_block, x14..26 z6..9 | see plan | 3 dressings | portico column, entablatureBand |
| 3 | Pediment with oculus | roof tool `temple`, slate, smooth_quartz tympanum; oculus = 3x3 ring: chiseled_quartz_block centre-ring with a glass_pane eye at apex-1, x20 | x14..26 z6..10, y17..22 | 2 roofs | pedimentOculus |
| 4 | TOWN HALL lettering | `plaque(g,"TOWN HALL",{at:[15,15,6],face:"north",width:11,height:2,letter:"black_concrete"... use dark: `polished_andesite`})` on the entablature north face; fallback 1-row wall signs `dark_oak_wall_sign` | z6, x15..25, y15..16 | 4 fittings | townHallLetters |
| 5 | Main door + fanlight | `dark_oak_door` x20 y4..5 facing north (both halves), glass_pane sidelights x19,x21 y4..5, 3-wide glass_pane fanlight y6..8, upside-down quartz_stairs arch y9 with chiseled keystone x20; stone step | z10, x19..21 | 4 fittings | mainDoor |
| 6 | Windows, all faces | glass_pane set per OPENINGS, quartz_slab sill (bottom) proud +1 at y4 (ground), flat arch at y9, upper hood at y15 | OPENINGS table | 4 fittings | windowBay, flatArch, windowHood |
| 7 | Clock tower | brick shaft x18..22 z10..14 y17..35 (hollow x19..21 z11..13), quartz quoins corners, bands y27, y31, cornice y35 with upside-down quartz_stairs proud +1 | see plan | 1 shell (shaft), 3 dressings (bands) | towerBand |
| 8 | Clock faces (4) | 3x3 white_concrete y28..30 centred on each face, black_concrete hands at centre y29 and cell above y30; chiseled_quartz_block frame columns | z10 x19..21; z14; x18 z11..13; x22 | 3 dressings | clockFace |
| 9 | Belfry + bell | 3-wide openings y32..33 each face, upside-down quartz_stairs arch y34 over outer two cells; `bell` attachment ceiling at x20 y34 z12 hung under a dark_oak_slab/log beam y35 | belfry x19..21 z11..13 | 3 dressings | belfryOpening, bellHang |
| 10 | Copper spire + finial | `$MCD roof` pyramid steep, copper palette (weathered/oxidized/cut copper), `lightning_rod` x20 z12 y42..43 | x17..23 z9..15 y36..41 | 2 roofs | copperSpire |
| 11 | Hip slate roof, dentil cornice | `$MCD roof` civic, slate palette, quartz trim, keeps for tower and chimneys | x4..36 z10..26 y17.. | 2 roofs | — |
| 12 | Dormers (2 N, 3 S) | gable dormers 3 wide 2 high, glass_pane, slate cheeks, quartz trim | N x12,x28; S x12,20,28 | 2 roofs | dormer |
| 13 | Chimney stacks (2) | bricks 2x2 own footing y1..23, deepslate_bricks band y21, stone_brick_slab cap y23 stepped out 1, lit `campfire` y24 (hay under NOT used) | x5..6 z17..18; x34..35 | 5 chimneys | chimneyStack |
| 14 | Fireplaces (4) | firebox x6/x34 z17..18 y4..5, y11..12: stone_bricks floor, lit campfire against back, upside-down brick_stairs lintel | see RESERVED | 5 chimneys | fireplace |
| 15 | Grand stairs | two straight flights in the hall x11..12 and x28..29, z24->18, dark_oak... `stone_brick_stairs` facing north, rail `dark_oak_fence` | hall | 1 shell | stairFlight |
| 16 | Tower ladder | `ladder` facing north at x21 z13 y4..32 with holes in y10 and y31 slabs | tower | 1 shell | ladderShaft |
| 17 | Front steps + forecourt | stone_brick_stairs facing south y1 (z4), y2 (z5) x16..24; forecourt stone_bricks/polished_andesite | z4..5 | 6 grounds | frontSteps |
| 18 | Rear steps, door, garden | door x20 z26 facing south, glass transom y6; steps z27..29; gravel path x19..21 z30..36; back gate dark_oak_fence_gate z36 | plan | 4 fittings, 6 grounds | rearDoor |
| 19 | Street, sidewalk, lawns | andesite road z0..2 with gravel kerb, smooth_stone sidewalk z3, grass lawns | plan | 6 grounds | — |
| 20 | Flagpoles (2) | stone_brick_wall base y1, dark_oak_fence to y10, blue_banner at top | x7,x33 z6 | 6 grounds | flagpole |
| 21 | Lamp posts | dark_oak_fence on stone_brick_wall, lantern on top | x14,26 z4; x2,38 z3 | 6 grounds | lampPost |
| 22 | Oaks (2) | oak_log axis y trunk, persistent oak_leaves crown, coarse_dirt patch | x8,x32 z32 | 6 grounds | oakTree |
| 23 | Interior: hall, offices, council chamber | by the room designers | ROOMS | rooms | furniture helpers |
| 24 | Door lanterns | lanterns each side of main door on fence arms | x18, x22 z9 y7 | 6 grounds / 4 fittings | doorLantern |

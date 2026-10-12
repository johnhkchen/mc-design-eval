# Plan: suburban McMansion "mcmansion-sonnet-high"

Identity: a 1990s-2000s builder-grade McMansion on a cul-de-sac lot: beige lap siding over a stone-veneer base, white trim and quoins, black shutters, a jumble of dark asphalt-shingle roofs (tall front gable on a two-storey columned portico, L-plan hip, garage cross-gable, turret cone, dormers), a three-car garage wing facing the street, a big stone chimney, manicured lawn, wide driveway, back deck.
Grid: x 0..43 (street frontage), y 0..14, z 0..31. FRONT = NORTH (z=0 is the street), x runs along the street. All ranges are inclusive.
LEVELS: y0 ground. y1 = floor-1 block layer (a player stands on it at y2). Storey 1 air y2..4. y5 = floor-2 block layer (player stands at y6). Storey 2 air y6..8. y9 = top plate / ceiling / cornice. Roofs start y10 (`roof(g, rects, style, {y:10})`) and never exceed y14. Attic = hollow roof, no interior.
Workers: read `vocab.mjs` first, then only your own part. `make.sh` rebuilds everything. A later part only ADDS into air; P1 therefore leaves every opening, void and reserved cell unset.

## SITE (masses)
| mass | x | y | z | notes |
|---|---|---|---|---|
| street | 0..43 | 0 | 0 | `gray_concrete` 70 / `black_concrete` 30 hash (P4) |
| sidewalk | 0..43 | 0 | 1 | `polished_andesite`; kerb `stone_brick_slab` bottom at y1 x13..43 (P4) |
| front lawn | 0..43 | 0 | 2..31 minus paved/planted/footprint | `grass_block` (P4) |
| driveway | 0..12 | 0 | 1..5 | P4 |
| garage wing G | 0..12 | 1..9 | 6..19 | walls y1..9, floor y1, bonus floor y5, ceiling y9 (P1) |
| centre block C | 12..33 | 1..9 | 8..23 | x12 is the wall shared with the garage for z8..19 |
| east wing E | 33..43 | 1..9 | 12..27 | x33 is the wall shared with C for z12..23; z24..27 is exterior |
| turret bay T | 29..33 | 1..9 | 4..8 | cells (29,4) and (33,4) omitted (chamfers); inner air x30..32, z5..7 |
| portico | 19..26 | 1..9 | 4..7 | columns (19,5),(21,5),(24,5),(26,5); platform y1 x19..26, z5..7; steps z4 x20..25 (P3) |
| chimney | 37..39 | 1..14 | 10..12 | built by P1, the roof KEEPS it; z12 row is the east-wing front wall line |
| foundation | house footprint | 0 | | `stone_bricks` y0 under G, C, E, T (P1), P4 must not write y0 there |
| back deck | 14..32 | 1 | 24..30 | P5 |
| roofs | | 10..14 | | table below (P2) |

Footprint cells (walls y1..9): G x0..12,z6..19; C x12..33,z8..23; E x33..43,z12..27; T x29..33,z4..8 (minus chamfers (29,4),(33,4)).

### ROOF PIECES (P2). Preset chosen by building type: a house = `cottage` preset, overridden per piece: palette `dark-slate` (not the cottage's spruce), styles below, `--why "concept: dark asphalt shingle over beige siding; roof heights capped by the 14-block size limit"` on any guard bypass. Always `--dry-run` first.
| id | rects (x0,z0,x1,z1) | style | pitch | notes |
|---|---|---|---|---|
| R3 garage | [0,6,12,19] | gable, ridge along x | half | overhang N1 W1 S1 E0, ridge y13, `dormers {face north, count 2, style gable, width 3, height 2, window}`, gable end walls `smooth_sandstone`; build FIRST |
| R1 main L-hip | [12,8,33,23] + [33,12,43,27] | hip (true hips and valley) | half | overhang 1 all round, eave plain, ridge `slab`, ridge y13 on C and lower on E, `dormers {face south, count 2, width 3, height 2}` on the rear slope of C; `keep` box (37,1,10)-(39,14,12) (chimney) |
| R2 entry gable | [18,4,27,14] | gable, ridge along z | 45 (stairs 1:1) | rises y10..14, ridge top y14 (the tallest point); `gable` wall + `verge` = `smooth_quartz`, `eave: cornice` trim `smooth_quartz`; if it tunnels badly through R1, shorten to z4..12; built AFTER R1 (wins on overlap) |
| R5 turret cone | [29,4,33,8] | cone (`tower-cap` look) | maxHeight 4 | peak y13, `finial` `lightning_rod` at y14, eave plain; built LAST |
Overhang rule: 1 cell, 0 on any side that touches another roof. Ridge never above y14; everything but R2 and the chimney is at most y13.

## PALETTE (every id checked with `mcd blocks --check`; unknown ids replaced: `quartz_wall` -> `diorite_wall`, `cut_sandstone_stairs` -> `sandstone_stairs`)
| role | blocks | where / share |
|---|---|---|
| stone veneer (20%) | `stone_bricks` 55 / `andesite` 25 / `cobblestone` 20 per-cell hash; `stone_brick_stairs`, `stone_brick_slab`, `stone_brick_wall`, `cobblestone_wall` | north-facing walls y1..4, plinth y1 elsewhere, chimney, lamp posts, steps |
| beige siding (40%) | `smooth_sandstone` (y even), `sandstone` (y odd); `smooth_sandstone_stairs`, `smooth_sandstone_slab`, `sandstone_stairs`, `sandstone_slab` | walls y2..4 sides, y6..8 all |
| white trim (15%) | `smooth_quartz`, `quartz_block`, `quartz_pillar`, `chiseled_quartz_block`, `quartz_stairs`, `smooth_quartz_stairs`, `quartz_slab`, `smooth_quartz_slab`, `quartz_bricks` | belt y5, cornice y9, quoins, sills, jambs, columns, verges, tympanum |
| roof (15%) | `dark-slate` palette via the roof tool: `deepslate_tiles` (+ stairs/slab), `cobbled_deepslate`, `blackstone`, `polished_blackstone`; ridge `polished_blackstone_slab` | all roofs |
| black accents | `dark_oak_trapdoor` (shutters, straps), `dark_oak_door`, `dark_oak_fence`, `dark_oak_planks`, `dark_oak_stairs`, `dark_oak_slab`, `dark_oak_fence_gate`, `iron_bars`, `polished_blackstone_slab`, `black_concrete` (street, TV only) | shutters, doors, rails, lamps |
| glass | `glass_pane` (all windows), `glass` (none), `white_stained_glass_pane` (baths) | |
| interior wood/floors | `oak_planks`, `spruce_planks`, `birch_planks`, `birch_door`, `birch_trapdoor`, `oak_stairs`, `spruce_stairs`, `spruce_slab`, `oak_slab`, `oak_door`, `oak_trapdoor`, `oak_fence`, `bookshelf`, `smooth_stone`, `polished_andesite`, `gray_concrete`, `light_gray_concrete`, `light_gray_terracotta`, `white_terracotta`, `gray_terracotta`, `stone` | rooms |
| ground / paving | `grass_block`, `coarse_dirt`, `gravel`, `polished_andesite`, `polished_andesite_stairs`, `polished_andesite_slab`, `light_gray_concrete`, `gray_concrete`, `black_concrete`, `stone`, `andesite`, `smooth_stone`, `smooth_stone_slab` | site |
| plants | `azalea_leaves`, `flowering_azalea_leaves`, `birch_log`, `birch_leaves`, `oak_leaves`, `short_grass`, `fern`, `allium`, `pink_tulip`, `red_tulip`, `white_tulip`, `azure_bluet`, `cornflower`, `poppy`, `peony`, `rose_bush`, `lilac`, `potted_azalea_bush`, `potted_fern`, `potted_allium`, `potted_red_tulip`, `potted_poppy`, `potted_cornflower`, `flower_pot` | beds, tree, pots |
| lights | `lantern`, `copper_lantern`, `iron_chain`, `copper_chain`, `end_rod`, `candle`, `white_candle`, `campfire`, `lightning_rod` | lamps, chandelier |
| furniture/functional | `white_bed`, `red_bed`, `blue_bed`, `gray_bed`, `light_blue_bed`, `white_carpet`, `gray_carpet`, `light_gray_carpet`, `brown_carpet`, `red_carpet`, `blue_carpet`, `crafting_table`, `furnace`, `smoker`, `blast_furnace`, `barrel`, `chest`, `cauldron`, `water_cauldron`, `lectern`, `stonecutter`, `grindstone`, `loom`, `brewing_stand`, `jukebox`, `hopper`, `item_frame`, `oak_sign`, `oak_wall_sign`, `oak_hanging_sign`, `oak_pressure_plate`, `stone_pressure_plate`, `stone_button`, `daylight_detector`, `lever`, `scaffolding`, `ladder`, `black_stained_glass_pane`, `gray_stained_glass_pane`, `white_wool`, `light_gray_wool`, `black_wool`, `black_carpet`, `moss_carpet`, `iron_block`, `quartz_bricks`, `water`, `netherrack` | rooms |
Contrast: dark roof / beige walls / white trim / black shutters+doors / grey stone base. Shutters are `dark_oak_trapdoor` because no black trapdoor exists.

## VOCABULARY (helpers in `vocab.mjs`; facing = direction a stair rises/ a door faces out; stairs `facing` = side of the full-height back)
| helper | parameters | construction |
|---|---|---|
| `wallCell(x,y,z,kind)` | kind from position | y0 (foundation) `stone_bricks`; y1 `stone_bricks`; y2..4: if the cell is on a NORTH-FACING plane (z=6 garage, z=8 centre, z=4/chamfers turret, z=12 east wing, portico back wall z=8 x19..26) -> veneer hash ((x*7+z*13+y*5)%20: <11 `stone_bricks`, <16 `andesite`, else `cobblestone`), else siding; y5 `smooth_quartz` belt; y6..8 siding; y9 `smooth_quartz`. Siding: y even `smooth_sandstone`, y odd `sandstone`. Interior partitions: `smooth_sandstone` all y (no belt). |
| `quoin(x,z,dirs)` | corner cell + the two directions along the walls | y2..4 and y6..8: corner cell `smooth_quartz`; neighbour along the front face at even y, along the side face at odd y, also `smooth_quartz`. Corners: (0,6),(12,6),(0,19),(12,23),(33,12),(43,12),(33,27),(43,27). |
| `window(x0,y0,z|x,face,w,h)` | opening cells x0..x0+w-1, y0..y0+h-1 | shell leaves the opening AIR and builds the white sill row (`smooth_quartz`) at y0-1 across w cells; P3/P5 fill: `glass_pane` in every opening cell (panes in the wall plane), no state needed (call fixConnections). |
| `archWin(x0,y0,z,face,w,h)` | w 3 or 4, h 2 or 3 | `window` + top-row corners = `smooth_quartz_stairs` half=top, facing = outward (the left corner faces WEST, the right EAST on a north/south wall; on an east/west wall use north/south) so the opening reads as an arch; interior cells `glass_pane`. |
| `shutterPair(x0,x1,y0,y1,z,face)` | the window's x range and y range, face of the wall | one cell beside the window on each side (x0-1 and x1+1) in the AIR cell just outside the wall plane (z-1 on a north wall, z+1 on a south wall, x+1 / x-1 on side walls), for each y: `dark_oak_trapdoor` open=true half=bottom, facing = the outward direction (north on a north wall), so it lies flat against the wall face. Skip any side whose cell is not air or is a quoin cell. |
| `column(x,z)` | | y2 `quartz_block`; y3..7 `quartz_pillar` axis=y; y8 `chiseled_quartz_block`. |
| `portico()` | | 4 `column`s at (19,5),(21,5),(24,5),(26,5); y9 `smooth_quartz` over x19..26,z5..7 (ceiling + entablature); floor y1 x19..26,z5..7 `smooth_stone` with a border ring of `smooth_quartz` (x19,x26,z5 cells); steps `stone_brick_stairs` y1 z4 x20..25 facing SOUTH. |
| `entryDoor()` | | `dark_oak_door` lower+upper at (22,2..3,8) hinge=left and (23,2..3,8) hinge=right, facing=north, open=true; transom `glass_pane` (22..23,4,8). |
| `fanlight()` | | `glass_pane` (21..24,5,8); `glass_pane` (22..23,6,8); `smooth_quartz_stairs` half=top facing=west at (21,6,8) and facing=east at (24,6,8). Then `archWin(21,7,8,north,4,2)` above. |
| `carriageDoor(x0)` | x0 = left cell of a 3-wide opening | leaf plane z=7 (inside the garage air): y2..3 `birch_planks` x0..x0+2; y4 `glass_pane` x0..x0+2. Straps: `dark_oak_trapdoor` open=true facing=north at (x0,2,6),(x0,3,6),(x0+2,2,6),(x0+2,3,6) (in the opening plane, hugging the jamb); the cells (x0..x0+2,4,6) stay air (the window strip shows through). |
| `wallLamp(x,y,z,face)` | | `dark_oak_fence` at (x,y,z) next to the wall (it connects to it), `lantern` hanging=true at (x,y-1,z). |
| `plaque(x,y,z)` | | `oak_wall_sign` facing=north, text "1428" / "OAK CT". |
| `planter(x,z)` | | `stone_brick_wall` y1, `potted_azalea_bush` y2. |
| `chimneyStack()` | | x37..39, z10..12: y1..13 `stone_bricks`/`andesite` hash 3x3 solid except the firebox cells (37..39,2..3,12) and the flue ghost none; y13 ring of `stone_brick_slab` type=bottom at x36..40, z9..13 on the 16 outer cells (centre 3x3 stays `stone_bricks`); y14: `stone_brick_wall` at (37,14,10),(39,14,10),(37,14,12),(39,14,12), `campfire` lit=true at (38,14,11). |
| `turret()` | | walls y1..9 on x29..33,z4..8 minus the two chamfer cells; same `wallCell` rules (veneer y1..4 on its north-facing faces); openings left air per OPENINGS. |
| `stairFlight()` | | see P6. |
| `chandelier()` | | `iron_chain` (23,7..8,11); `iron_bars` (22..24,6,11) and (23,6,10),(23,6,12); `lantern` hanging=true at (22,5,11),(24,5,11),(23,5,10),(23,5,12),(23,5,11). |
| `shrub(x,z,kind)` | kind: plain/flower | `azalea_leaves` y1..2 persistent=true; `flower` kind puts `flowering_azalea_leaves` at y2; mulch `coarse_dirt` at y0 of the cell. |
| `bed(x0,z0,x1,z1,front)` | | mulch `coarse_dirt` y0 over the rectangle; shrubs on the back row, every 3rd flowering; front row y1 flowers cycling `allium`,`pink_tulip`,`azure_bluet`. |
| `youngTree(x,z)` | | trunk `birch_log` axis=y y1..5; `birch_leaves` persistent=true: y4,y5 = 5x5 around the trunk minus the 4 corners (trunk cell stays log up to y5); y6 3x3; y7 plus (5 cells); two `oak_fence` stakes at (x-2,1..2,z),(x+2,1..2,z); `coarse_dirt` y0 3x3. |
| `lampPost(x,z)` | | `stone_brick_wall` y1..3; `lantern` hanging=false y4. |
| `driveway(...)` | | per cell hash `light_gray_concrete` 75 / `stone` 15 / `andesite` 10; every cell with z%4==1 is `smooth_stone`. |
| `lawn(...)` | | `grass_block` y0; where hash(x,z)%10==0 and not within 1 of a path, `short_grass` at y1. |
| `deck(x0,z0,x1,z1)` | | y1 boards: z even `spruce_planks`, z odd `oak_planks`; coarse_dirt y0 below; rail `dark_oak_fence` y2 along the open edges; corner posts y2..3 `dark_oak_fence` + `dark_oak_slab` cap type=bottom at y4. |
| `patioSet(x,z)` | | table: `dark_oak_fence` (x,2,z) + `oak_pressure_plate` (x,3,z); chairs `spruce_stairs` y2 at (x-1,z) facing west, (x+1,z) facing east, (x,z-1) facing north, (x,z+1) facing south. |
| `frenchDoor(x,z)` | | two `birch_door` at (x,2..3,z),(x+1,2..3,z) facing=south hinge left/right open=true; transom `glass_pane` y4. |
| `roofPiece(id)` | | one `roof()` call per table row with the options listed there. |
Interior furniture (bed, table, sofa, island, TV, desk...) is NOT in this vocabulary: each room's designer builds it from the palette.

## ROOMS (inner air boxes [x0,y0,z0,x1,y1,z1]; floors are the y1 layer (S1) or y5 layer (S2) blocks; P1 lays the floor material)
| room | box | floor | mood / key pieces | ways in | windows |
|---|---|---|---|---|---|
| Foyer (double height) | [20,2,9,25,8,13] | `polished_andesite` with `smooth_quartz` checker | grand, bright, formal; stair on the west side (RESERVED x20..24,z9..13,y2..6), chandelier (RESERVED), a console table + mirror (`item_frame`) and a runner on the east half x23..25 | entry door (22..23,2..4,8); cased opening to the dining room (26,2..4,10..12); French doors to the office (19,2..3,10..11); open south to the foyer hall | the entry fanlight + arch window (21..24,5..8,8) |
| Foyer hall | [20,2,14,25,4,15] | same | passage under the gallery; bench, coats, a lamp; leads to the kitchen | open north to the foyer, open south to the kitchen (no wall at z15, x20..25) | none |
| Home office | [13,2,9,18,4,14] | `dark_oak_planks` | quiet, studious: desk, `bookshelf` wall, `lectern`, leather chair (`dark_oak_stairs`), lamp | French doors (19,2..3,10..11) | N (14..16,3..4,8) |
| Formal dining room | [27,2,9,32,4,14] | `dark_oak_planks` with `spruce_planks` border ring | formal evening: long table for 6 (`dark_oak_slab` on `dark_oak_fence`), chairs, sideboard, hanging lanterns | cased opening from the foyer (26,2..4,10..12); door to the kitchen (29,2..3,15); open to the bay (30..32,2..4,8) | E (33,3..4,10..11) |
| Dining bay (turret) | [30,2,5,32,4,7] | `spruce_planks` | sunny window nook, window seat of `spruce_stairs`/`oak_slab`, plant | open from the dining room (30..32,2..4,8) | N (30..32,2..4,4) tall arched; (29,3..4,6) and (33,3..4,6) |
| Kitchen (open plan) | [20,2,16,32,4,22] | `light_gray_terracotta` checker `white_terracotta` | bright, busy: counters along the N wall and S wall, 3x1 island at x25..27,z18..19 with stools, `cauldron` sink under the S windows, `smoker`/`blast_furnace` cooktop, pendant lanterns; wide opening to the family room | foyer hall (open at z15,x20..25); dining (29,2..3,15); mudroom (19,2..3,19); family room opening (33,2..4,17..21); deck French doors (25..26,2..4,23) | S (21..23,3..4,23), S (29..31,3..4,23), French doors |
| Family room | [34,2,13,42,4,26] | `spruce_planks` with `gray_carpet` rug zone (designer) | cosy and big: fireplace on the N wall in the chimney (firebox cells (37..39,2..3,12) are AIR, hearth y1 `stone_bricks`), mantel `dark_oak_slab` at y4, big TV 4x2 on the SOUTH wall z26 x37..40 y3..4, sectional sofa facing it, shelves | opening from the kitchen (33,2..4,17..21) | N (34..36,3..4,12) and (40..42,3..4,12); E (43,3..4,15..17); S tall (35..37,2..4,27),(39..41,2..4,27); W (33,3..4,24..25) |
| Mudroom | [13,2,16,18,4,22] | `stone_bricks` | practical: bench + cubbies (`oak_trapdoor`, `barrel`, `chest`), laundry (`cauldron`, `barrel`), hooks | garage door (12,2..3,18); kitchen door (19,2..3,19) | S (14..16,3..4,23); W (12,3..4,21..22) |
| Garage (3 cars) | [1,2,7,11,4,18] | `smooth_stone` with `gray_concrete` stripe lines at x4,x8 (z7..18) | cold, practical: 3 car bays, workbench (`crafting_table`, `barrel`), shelves (`barrel` + `oak_trapdoor`), tools, lanterns | street carriage doors (x1..3,x5..7,x9..11, y2..4, z6, leaf at z7); mudroom door (12,2..3,18); side door (0,2..3,16) | W (0,3..4,9..11); S (5..7,3..4,19) |
| Upper hall / gallery | [20,6,14,25,8,22] | `oak_planks` | bright landing overlooking the foyer: iron-bar gallery rail along the void edge z14 x23..25 (P6), console, art, runner, lamps | the stair top (20..22,6,14); corridors (19,6..8,16..17) and (26,6..8,16..17); doors (19,6..7,14),(26,6..7,14),(19,6..7,20) | S arched (21..24,7..8,23) |
| Bedroom 2 | [13,6,9,18,8,14] | `oak_planks` | teenage/kid, light blue; bed, desk, dresser | door (19,6..7,14) | N (14..16,7..8,8) shuttered |
| Bedroom 3 (turret) | [27,6,9,32,8,14] + bay [30,6,5,32,8,7] | `oak_planks` | guest/girl's room, pink; bed, reading bay with a window seat | door (26,6..7,14); bay opening (30..32,6..8,8) | bay N (30..32,7..8,4), sides (29,7..8,6),(33,7..8,6); E (33,7..8,10..11) |
| Corridor W | [13,6,16,18,8,17] | `oak_planks` | runner, pictures, linen cupboard | opening from the upper hall (19,6..8,16..17); bonus door (12,6..7,16) | none |
| Corridor E | [27,6,16,32,8,17] | `oak_planks` | runner, pictures | opening from the upper hall (26,6..8,16..17) | none |
| Bedroom 4 | [13,6,19,18,8,22] | `oak_planks` | office-guest / hobby bedroom, green; bed, desk | door (19,6..7,20) | S (14..16,7..8,23); W (12,7..8,21..22) |
| Hall bathroom | [27,6,19,32,8,22] | `white_terracotta` checker `light_gray_terracotta` | clean white: tub (`quartz_slab` + `water`-in-`cauldron`), vanity (`cauldron` + `dark_oak_slab`), mirror | door (29,6..7,18) from corridor E | S (29..30,7..8,23) `white_stained_glass_pane` |
| Bonus room (over the garage) | [1,6,7,11,8,18] | `spruce_planks` | game/media room: sectional sofa facing a big TV on the S wall z18, mini-bar, beanbags (carpet-topped slabs), open play floor | door (12,6..7,16) from corridor W | N (1..3,7..8,6),(5..7,7..8,6),(9..11,7..8,6); W (0,7..8,10..12); S (5..7,7..8,19) |
| Primary bedroom | [34,6,13,42,8,21] | `oak_planks`, rug zone | luxurious, calm, warm neutrals: king bed (2 `white_bed` side by side) with a headboard on the S/E wall, sitting area by the front windows, dressers, chandelier-style hanging lanterns | double door (33,6..7,16..17) from corridor E; closet door (36,6..7,22); bath door (40,6..7,22) | N (34..36,7..8,12),(40..42,7..8,12) shuttered; E (43,7..8,15..17),(43,7..8,19..20) |
| Walk-in closet | [34,6,23,37,8,26] | `oak_planks` | racks of `iron_bars` rods, shelves, bench, mirror | door (36,6..7,22) | W (33,7..8,24..25); S (35..36,7..8,27) |
| Primary bath | [39,6,23,42,8,26] | `quartz_bricks` + `white_terracotta` | spa: soaking tub (`quartz_slab` ring + `water`), double vanity, shower with `glass_pane`, candles | door (40,6..7,22) | E (43,7..8,24..25); S (40..41,7..8,27) |
STAIRS BETWEEN FLOORS: foyer flight, 3 wide x20..22, `dark_oak_stairs` facing=south half=bottom at (z10,y2),(z11,y3),(z12,y4),(z13,y5); the top step meets the floor-2 layer at z14 (the player steps off onto (20..22,6,14)); bullnose first tread `smooth_quartz_slab` type=bottom at (20..24,2,9); banister `iron_bars` at (23,3,10),(23,4,11),(23,5,12),(23,6,13) on the open side, and a gallery rail `iron_bars` (23..25,6,14). Floor 2 (y5 layer) is NOT laid on x20..25,z9..13 (the void); it is laid under the stair top at z14.

## OPENINGS (shell leaves every cell below AIR; the listed part fills it)
Windows: sill row (`smooth_quartz`) at y0-1 is built by P1; fill = glass by the listed part. S1 window cells y3..4 (sill y2), S2 window cells y7..8 (sill y6), tall S1 windows y2..4 (no sill). Lintel = belt y5 / cornice y9 (P1).
| wall | opening (x,y,z) | filled by |
|---|---|---|
| N z6 garage | doors x1..3, x5..7, x9..11, y2..4 | P3 `carriageDoor` |
| N z6 garage S2 | x1..3, x5..7, x9..11, y7..8 | P3 `archWin` |
| N z8 centre | entry x22..23, y2..4; fanlight x21..24, y5..6; arch x21..24, y7..8 | P3 `entryDoor`, `fanlight`, `archWin` |
| N z8 centre | office x14..16, y3..4 and bedroom 2 x14..16, y7..8 | P3 `archWin` + `shutterPair` |
| N z8 centre | bay openings x30..32, y2..4 and y6..8 | open (air) |
| N z4 turret | x30..32, y2..4 (tall) and y7..8; sides (29,3..4,6),(33,3..4,6),(29,7..8,6),(33,7..8,6) | P3 `archWin` / `window` |
| N z12 east wing | x34..36 and x40..42, y3..4 and y7..8 | P3 `archWin` + `shutterPair` |
| W x0 garage | window (0,3..4,9..11), (0,7..8,10..12); side door (0,2..3,16) | P5 `window`; P5 `dark_oak_door` facing=west |
| W x12 (z20..23) | (12,3..4,21..22), (12,7..8,21..22) | P5 `window` |
| E x33 (z9..11) | (33,3..4,10..11), (33,7..8,10..11) | P5 `window` |
| E x43 | (43,3..4,15..17), (43,3..4,21..23), (43,7..8,15..17), (43,7..8,19..20), (43,7..8,24..25) | P5 `window` |
| W x33 (z24..27) | (33,3..4,24..25), (33,7..8,24..25) | P5 `window` |
| S z23 centre | mudroom (14..16,3..4); kitchen (21..23,3..4), (29..31,3..4); French (25..26,2..4); S2: (14..16,7..8), arched (21..24,7..8), (29..30,7..8) | P5 `window`, `frenchDoor`, `archWin` |
| S z27 east wing | tall (35..37,2..4),(39..41,2..4); S2 (35..36,7..8),(40..41,7..8) | P5 `archWin`/`window` |
| S z19 garage | (5..7,3..4,19), (5..7,7..8,19) | P5 `window` |
| x12 shared | mudroom door (12,2..3,18); bonus door (12,6..7,16) | P5 `birch_door` |
| x19 | office French doors (19,2..3,10..11); mudroom-kitchen door (19,2..3,19); bedroom 2 door (19,6..7,14); bedroom 4 door (19,6..7,20); opening (19,6..8,16..17) | left AIR for room designers (they may place `birch_door`) |
| x26 | dining cased opening (26,2..4,10..12); bedroom 3 door (26,6..7,14); opening (26,6..8,16..17) | air |
| z15 | dining-kitchen door (29,2..3,15); x20..25 NO wall (foyer hall open to kitchen) | air |
| x33 | kitchen-family opening (33,2..4,17..21); primary double door (33,6..7,16..17) | air |
| z18 / z22 | hall bath door (29,6..7,18); closet door (36,6..7,22); primary bath door (40,6..7,22) | air |
| floor 2 void | x20..25, y5, z9..13 | air (P6 adds stair cells inside) |

## RESERVED (the shell leaves these EMPTY; a later part builds in them)
- Foyer void and stair: floor-2 layer absent at x20..25, y5, z9..13; stair/bullnose cells x20..24, y2..5, z9..13 (P6); banister (23,3..6,10..13), gallery rail (23..25,6,14), chandelier (22..24,5..8,10..12) (P6).
- Firebox (37..39,2..3,12): air; hearth `stone_bricks` at (37..39,1,13) is P1.
- Portico platform x19..26, y1, z4..7 and the column cells (19,5),(21,5),(24,5),(26,5) y2..9, entablature y9 (P3). P1 builds only the wall z8 and pilasters (20,2..8,8),(25,2..8,8) = `quartz_pillar` axis=y.
- Garage door leaf plane z7, x1..11, y2..4 (inside the garage air, P3); strap cells in the opening plane z6.
- Shutter cells: air cells beside every shuttered window just outside the wall plane (P3/P5).
- Chimney x37..39, y1..14, z10..12 is BUILT by P1 and listed in the roof `keep` box.
- Deck footprint x14..32, y1, z24..30 and steps (22..24,1,31): nothing from P1/P4 there (P5).
- Tree and beds: P4 only; P1 builds none of them.
- Ground y0 inside the house footprint is P1's `stone_bricks`; P4 must not write y0 on those cells.

## OUTDOOR ROOMS (P4, P5)
- Street edge: z0 asphalt, z1 sidewalk, kerb slabs y1 along z1 x13..43. Driveway x0..12 z1..5 (apron).
- Front walk: x22..23 z1..3 `polished_andesite`, border x21 and x24 `stone_bricks` (y0), steps at z4 (P3). Lamp posts at (20,2),(25,2),(13,2).
- Beds (each uses `bed`): F1 x13..18, z6..7 (mulch + shrubs on z7, flowers on z6; gap none); F2 x27..28, z5..7; F3 front of the bay x29..33, z2..3 (low shrubs `azalea_leaves` y1 only on z3, flowers z2); F4 x34..36 and x40..42, z10..11 (shrubs both sides of the chimney, y1..2); F5 walk border x21,x24 at z2..3 (flowering shrub row `flowering_azalea_leaves` y1); the bay and garage bases get a 1-cell flower strip (`allium`,`azure_bluet`) at z5 x30..32 only if air.
- Young tree at (38,5): `youngTree`, with lawn all around x34..43, z2..9.
- Lawn: all remaining y0 not under the house, driveway, paths, beds, deck: `grass_block` + tufts; rear lawn z24..31 and the side strip x0..11, z20..31.
- Deck (P5) x14..32, z24..30 with steps (22..24,1,31) `spruce_stairs` facing=north, patio set at (18,27), grill `blast_furnace` (30,2,25) facing west + `barrel` (30,2,26), `potted_fern` on the rail posts at (14,3,30) and (32,3,30); a second two-chair lounge `spruce_stairs` at (27,2,28),(28,2,28) facing south.
- Lamps: lamp posts (20,2),(25,2),(13,2); wall lamps at (21,4,7),(24,4,7) and the garage piers (4,4,5),(8,4,5),(0,4,5),(12,4,5); a hanging `lantern` over the deck door at (25,4,24).

## PARTS (each a 12-minute job; order = build order)
1. P1 `parts/shell.mjs` - MASSING AND SHELL. Foundation y0 (`stone_bricks`) under G, C, E, T; floor-1 layer y1 per ROOMS floor materials (inside walls only; not the porch); floor-2 layer y5 over G, C, E (not the foyer void x20..25,z9..13; not the turret's z4..7 beyond what the rooms need: turret floors y1 and y5 ARE laid for the bay x30..32,z5..7); ceiling y9 `smooth_quartz` over every room; ALL walls y1..9 with `wallCell` (veneer on north faces y1..4, siding, belt y5, cornice y9), `quoin` at the 8 corners, sills, pilasters (20,8),(25,8), the turret, the `chimneyStack`, every interior partition (1 thick; S1 = y2..4, S2 = y6..8, top plate y9): S1: x12 z6..19 (garage east wall), x19 z9..22, x26 z9..15, z15 x12..19 and x26..33 (none at x20..25), x33 z8..23; S2: x12 z6..19, x19 z9..15 and z18..22, x26 z9..15 and z18..22, z15 x12..19 and x26..33, z18 x12..19 and x26..33, x33 z8..23, and in the east wing z22 x34..42 and x38 z23..26; every OPENING left unset. Ticks E03 walls, E09..E13, E17, E30 (void).
2. P2 `parts/roofs.mjs` - ROOFS. The four pieces in the roof table, in the order R3, R1, R2, R5, each with `--dry-run` first and fixes for every warning; dormers; the gable attic window (22..23,11,4); keep the chimney. Dark-slate palette, ridge <= y14. Ticks E01..E05.
3. P3 `parts/front.mjs` - FRONT ELEVATION. `portico`, `entryDoor`, `fanlight`, entry arch window, `plaque`, `planter` x2, `carriageDoor` x3 + garage window arches, the turret glass, every N window with `shutterPair`, `wallLamp`s. Ticks E06..E08, E14, E15 (N), E16 (N), E18..E20.
4. P4 `parts/grounds.mjs` - GROUNDS. Street, sidewalk, kerb, driveway, lawn, walk, beds + shrubs, young tree, lamp posts. Not the deck, not y0 under the house. Ticks E21..E27.
5. P5 `parts/rear.mjs` - SIDES, REAR AND DECK. Every window and door on the W, E and S walls (OPENINGS table) with shutters where flagged; the garage side door; French doors; the deck, its steps, `patioSet`, grill, lounge, pots. Ticks E15, E16, E28, E29.
6. P6 `parts/stair.mjs` - FOYER STAIR. Stair flight, bullnose, banister, gallery rail, `chandelier`. Check `mcd walk`: entrance to the upper hall. Ticks E31, E32.

Checklist (workers tick):
- [x] P1 shell  - [ ] P2 roofs  - [ ] P3 front  - [ ] P4 grounds  - [ ] P5 rear  - [ ] P6 stair

## NOTES for workers
- Vocabulary first: build every helper in `vocab.mjs`, test it on a tiny grid, then your part. Never invent a new colour or block outside PALETTE.
- Mirror: nothing is symmetric except the entry: portico/door centre is x22.5 (door x22..23), the east wing is centred on x38 (chimney x37..39).
- Stair facing: a stair rises toward its `facing`. South-facing stairs rise toward +z. The portico steps and the foyer flight both rise toward the south. The deck steps rise toward the north (facing=north).
- Trapdoor shutters: `facing` = the outward direction; verify by rendering a close-up (`mcd zoom --at 14,3,7`) that the panel lies flat on the wall; if not, flip facing.
- Doors in entry and exterior doors: `open=true` so the inspector's `mcd walk` passes. Doors never sit in a cell later parts fill.
- Roof tool owns y>=10 inside the footprint; nothing else writes above y9 except the chimney (P1), turret finial (P2) and column tops (nothing; columns end y9).
- Roof heights are capped by the 14-block size; if a roof piece is too steep, lower the pitch, never raise the walls.
- Water: the deck/baths use `cauldron` only (not water sources); no water on the site. Tubs are `quartz_slab` rings around `water_cauldron`.
- Room designers: floors and walls are done; furnish only inside your box, keep a 1-wide path from each door to the middle, never block an OPENING cell, window cell or the foyer void/stair.
- Persistent leaves: always `persistent=true` on every leaf block (shrubs, tree).

- P1 shell notes (mcmansion-sonnet-high): every opening is reserved via `reserve()` and `window()` (sills built), so later parts only fill. Shell does NOT build E03's cone (P2) or glass (P3), nor E13's doors (P3/P5), nor E30's stair cells (P6). Turret sides use one-cell `window()` on the W/E faces, sills at y2/y6.

# Polarton hillside kit: one sample row of 8 modules

## SITE

- Row 96 wide (x 0..95), 19 deep (z 0..18). Front faces NORTH (-z), the lane side; x runs along the lane. Plot i = x 12i..12i+11, z 5..18.
- Ground: y -2 stone, y -1 dirt, surface **y 0** (grass_block patched with coarse_dirt; podzol + rooted_dirt by fences and work sheds; packed_mud / cobblestone floors in the work buildings). Standing level outdoors y 1.
- Lane z 0..4, y 0, x 0..95: gravel centre z 1..3, coarse_dirt ruts at z 1 and z 3, coarse_dirt edges z 0 and z 4.
- **Plot edge (the pad's own, copied exactly):** spruce_fence at y 1 all round the ring x 12i and 12i+11 (z 5..18), z 5 and z 18 (x 12i..12i+11); a 2-wide `spruce_fence_gate` (facing north, closed) at x 12i+5..6, z 5, y 1; lantern posts at the two front corners (12i, 5) and (12i+11, 5): spruce_fence y 1..3 + standing lantern y 4. No other fence on the ring. Nothing crosses the ring; eaves at y 6+ may sit over a ring column.
- **Common section (raised-floor buildings):** floor block y 1 (stand y 2, one above the yard); ground walls y 2..5; upper floor block y 6 (stand y 7); upper walls y 7..10.
- **The way in (every raised main door):** gate z 5 (stand y 1) -> `x_slab` bottom at y 1, z 6, 2+ wide -> level landing of full blocks y 1 at z 7..8 (2 long, 2+ wide) -> door at z 9 (or z 10 behind a deeper porch). Two half steps, no stair, no full-block step. Grade-floor work buildings: a level gravel path gate -> door.

| plot | mass | x0..x1 | y0..y1 | z0..z1 |
|---|---|---|---|---|
| 0 cotton gin | body (2 storeys, front gable), grade floor | 1..10 | 0..9 (+roof to ~17) | 9..16 |
| 0 | wagon bay (front room, under the 4-wide door) | 2..9 | 1..5 | 10..12 |
| 0 | machine room (clear bay, no fittings) | 2..9 | 1..5 | 13..15 |
| 0 | loft (hay, cotton bales) | 2..9 | 7..9 (+roof space) | 10..15 |
| 0 | hoist beam (projecting 2 from the gable) | 6 | 10 | 7..9 |
| 0 | wagon path (gravel, level) | 4..7 | 0 | 6..8 |
| 0 | yard: cotton bales west / hay + barrels east | 1..3 / 8..10 | 1..2 | 6..8 |
| 1 schoolhouse | classroom (1 room, front gable) | 13..22 | 1..6 (+roof to 12) | 12..17 |
| 1 | cloakroom porch (enclosed, own lower gable) | 15..20 | 1..4 (+roof to 8) | 9..12 |
| 1 | bell cupola on the ridge (base through the roof, open belfry, cap) | 16..19 | 11..18 (+finial 19) | 13..16 |
| 1 | slab ramp + landing | 17..18 | 1 | 6 / 7..8 |
| 1 | yard bench (west) / flower bed (east) | 13..14 / 20..22 | 1 | 7 / 6..8 |
| 2 hill farmhouse | body (1½ storeys, front gable) | 25..34 | 1..7 knee (+roof to 13) | 10..14 |
| 2 | deep front porch (3 deep, shed roof) | 25..34 | 1..6 | 7..9 |
| 2 | kitchen ell (1 storey, shares wall z 14) | 26..32 | 1..4 (+roof to 8) | 14..17 |
| 2 | exterior chimney on the ell's east wall | 33..34 | 0..13 | 14..16 |
| 2 | slab step | 29..30 | 1 | 6 |
| 3 blacksmith + wheelwright | forge shed (open front, grade floor) | 37..44 | 0..5 (+roof to 9) | 9..15 |
| 3 | forge chimney (exterior, back wall) | 39..41 | 0..12 | 16..17 |
| 3 | cart lean-to (east, open front and east) | 45..46 | 0..5 | 9..15 |
| 3 | wheelwright's yard (wheel on a stand, spokes, stock) | 37..39 | 1..2 | 6..8 |
| 3 | coal + cordwood store beside the stack | 42..46 | 1..2 | 16..17 |
| 4 church | nave (front gable) | 49..56 | 1..7 (+roof to 12) | 9..17 |
| 4 | steeple tower (rises from the front of the nave, face flush with the gable) | 51..54 | 8..18 | 9..12 |
| 4 | spire (tower-cap) + finial | 51..54 | 19..24 (+25..26) | 9..12 |
| 4 | slab ramp (3 wide) + landing | 52..54 | 1 | 6 / 7..8 |
| 4 | graveyard: front corner + east strip, white picket | 56..58 + 57..58 | 1 | 6..8 + 9..17 |
| 5 tobacco barn | barn (tall, narrow, grade floor) | 63..68 | 0..10 (+roof to 14) | 9..15 |
| 5 | stripping shed lean-to (west, open) | 61..62 | 0..6 | 9..15 |
| 5 | firebox + flue stack (back) | 64..66 | 0..13 | 16..17 |
| 5 | cordwood ricks (east) | 69..70 | 1..3 | 10..15 |
| 6 corn crib | slatted crib on piers | 73..75 | 1..7 (+roof to 10) | 9..16 |
| 6 | granary (raised 1) | 77..82 | 1..6 (+roof to 10) | 9..16 |
| 6 | granary ramp: slab + loading dock | 77..78 / 77..80 | 1 | 6 / 7..8 |
| 7 owner's house | body (2 storeys, brick, hip) | 85..92 | 1..10 (+roof to 15) | 9..15 |
| 7 | front bay (2 storeys, 1 proud) | 85..88 | 1..10 | 8 |
| 7 | wraparound porch: front leg / east leg | 85..94 / 93..94 | 1..6 | 7..8 / 9..15 |
| 7 | rear balcony (looks downhill to the village on the real site) | 85..88 | 6..7 | 16..17 |
| 7 | exterior chimney (back) | 90..92 | 0..16 | 16..17 |
| 7 | slab step | 89..90 | 1 | 6 |

## ROOFS

| building | form | preset / style | ridge | height | overhang | notes |
|---|---|---|---|---|---|---|
| 0 gin | tall front gable to the lane with a louvred monitor on the ridge (the gin's vent) | `granary`, `ridgeAxis: z`, `front: n`, material `deepslate_tiles` (slate), verge `stripped_spruce_log` | along z at x 5..6, z 8..17 | eaves y 10 (x 0 / x 11), ridge y 15, monitor to ~17 | 1 all round | front gable triangle z 9 y 10..14 is wall (birch boards); keep the hoist beam (6,10,7..9); trusses `stripped_spruce_log` (king post, seen from the loft) |
| 1 classroom | steep front gable | `cottage`, `ridgeAxis: z`, `front: n`, material `andesite` (galvanised tin, auto-mixed), verge `stripped_spruce_log` | along z at x 17..18, z 11..18 | eaves y 7 (x 12 / x 23), ridge y 12 | 1 | keep the cupola x 16..19 z 13..16 from y 10 up; front gable z 12 above the cloakroom roof is wall |
| 1 cloakroom | small front gable, lower | own rect x 15..20 z 9..12, `gable`, `ridgeAxis: z`, andesite, same verge + overhang | x 17..18 | eaves y 5, ridge y 8 | 1 front (z 8) and sides; dies into the classroom gable at z 12 | |
| 1 cupola | 4x4 cone cap | by hand / `lantern-cap`, andesite, finial `lightning_rod` y 19 | apex over x 17..18 z 14..15 | ring y 16, apex y 18 | 1 slab ring (x 15..20 z 12..17) | bell under it |
| 2 farmhouse body | front gable, 45° | `cottage`, `ridgeAxis: z`, `front: n`, material `mangrove` (red-brown cedar shingle, auto-mixed), verge `stripped_spruce_log` | along z at x 29..30, z 9..15 | eaves y 8 (x 24 / x 35, over the knee wall y 7), ridge y 13 | 1 | keep the stack x 33..34 z 14..16; gables z 10 / z 14 are wall; trusses `stripped_spruce_log` collar over the loft |
| 2 porch | shed | by hand: `mangrove_stairs` facing south at z 7 y 6, slabs y 6..7 up to the body wall z 10 (below the loft window y 8) | — | y 6..7 | 0 | brackets under the beam y 5 |
| 2 ell | low gable | own rect x 26..32 z 14..17, `gable`, `ridgeAxis: z`, mangrove | along z at x 29 | eaves y 5, ridge y 8 | W 1 (x 25), S 1 (z 18 over the fence), E 0 (stops against the stack) | meets the body's back gable below its eave |
| 3 forge shed | side gable, open front | `gable`, `ridgeAxis: x`, material `deepslate_tiles`, verge `stripped_spruce_log` | along x at z 12, x 36..44 | eaves y 5 (z 8 / z 16), ridge y 9 | N 1, S 1 (keep stack x 39..41 z 16..17), W 1 (x 36), E 0 | trusses `stripped_spruce_log` (king post, seen from the forge) |
| 3 lean-to | shed off the east wall | by hand: deepslate_tile_stairs facing west, y 5 at x 45, y 4 at x 46, z 8..16 | — | y 4..5 | 1 N/S | on posts |
| 4 church nave | steep front gable | `church` is a stave preset (wrong): use `cottage` with `ridgeAxis: z`, `front: n`, palette `slate`, verge `calcite` (white barge board) | along z at x 52..53, z 8..18 | eaves y 8 (x 48 / x 57), ridge y 12 | 1 | keep the tower x 51..54 z 8..12 from y 8 up; trusses `stripped_spruce_log` (scissor/king post open to the nave) |
| 4 spire | tall pyramid/cone | `tower-cap`, material `slate`, finial `lightning_rod` + a cross (spruce fence) y 25..26 | apex over x 52..53 z 10..11 | ring y 18 (calcite slab cornice proud 1, x 50..55 z 8..13), apex y 24 | 1 | the steeple is what the village below sees |
| 5 tobacco barn | tall steep gable to the lane | `gable`, `ridgeAxis: z`, `front: n`, pitch 1, material `waxed_exposed_cut_copper` (rusty tin), verge `stripped_dark_oak_log` | along z at x 65..66, z 8..16 | eaves y 11 (x 62 / x 69), ridge y 14 | 1 (back stops against the stack x 64..66 z 16) | ridge vent: 2 open spruce_trapdoor in the gables y 12 |
| 5 stripping shed | shed | by hand: waxed_exposed_cut_copper stairs facing east, y 5 at x 61, y 6 at x 62, z 8..16 | — | y 5..6 | 1 N/S | under the barn eave (y 11) |
| 6 corn crib | narrow gable | `gable`, `ridgeAxis: z`, `front: n`, material `bamboo_planks` (pale shake), verge `stripped_oak_log` | along z at x 74 | eaves y 8 (x 72 / x 76), ridge y 10 | 1 | |
| 6 granary | gable | `gable`, `ridgeAxis: z`, `front: n`, bamboo_planks, verge `stripped_oak_log` | along z at x 79..80 | eaves y 7 (x 77 / x 83), ridge y 10 | W 0 (crib eave sits at x 76 y 8), E 1, N/S 1 | front gable z 9 y 7..9 wall with a loft door |
| 7 owner's house | hip, 45° | `hip`, pitch 1, material `waxed_oxidized_cut_copper` (verdigris), ridge `waxed_oxidized_cut_copper_slab`, eave course `calcite` fascia | short ridge along x at z 12, x 88..89 | eaves y 11, ridge y 15 | 1 all round (x 84, x 93, z 8 over the bay top, z 16) | keep the stack x 90..92 z 16..17; trusses `stripped_spruce_log` |
| 7 bay | sits under the main eave | bay walls stop at y 10; the main eave (z 8, y 11) caps it | — | y 11 | — | |
| 7 porch | low hip, wraps the corner | by hand: waxed_oxidized_cut_copper_stairs y 6 round x 85..94 z 7 and x 94 z 7..15, hip corner at (94,6,7), slabs y 6 back to the walls | — | y 6 | 0 | under the upper windows (y 8) |

## FACADES

Common: windows `glass_pane` 1 wide x 2 high (ground y 3..4, upper y 8..9) unless stated, set in the wall plane, top slab sill 1 out (not over a porch deck). Corner boards flush. Shutters, where named, `*_trapdoor` open flat on the wall either side.

**0 Cotton gin (x 1..10):** plinth `cobblestone` y 1 round the walls (not in the doors); posts `stripped_spruce_log` (axis y) at the four corners and the wagon-door jambs x 3 and x 8 (z 9) y 1..9; wall body `birch_planks` (yellow board) y 2..9; a floor beam `stripped_spruce_log` (axis x/z) at y 6 all round (the loft line, flush); head plate `stripped_spruce_log` y 9. Front (z 9): wagon door x 4..7 y 1..4 (open; a `stripped_spruce_log` lintel y 5 x 3..8), board doors folded open flat on the wall at x 2..3 and x 8..9 (spruce_trapdoor, y 1..4); hay door x 5..6 y 7..8 with spruce_trapdoor leaves folded at x 4 and x 7; hoist beam `stripped_spruce_log` axis z (6, 10, 7..9) with `iron_chain` (6, 9, 7) and a hay_block (6, 8, 7) on it; gable triangle birch boards with a 2-wide louvre (spruce_trapdoor) x 5..6 y 12. Sides x 1 / x 10: windows z 11 (y 2..3) and z 11, z 14 (y 8). East wall: the **shaft port** (10, 2, 14), 1x1 open, framed by `stripped_spruce_wood` at (10,1,14),(10,3,14),(10,2,13),(10,2,15). Back (z 16): door x 5..6 y 1..3, windows x 3 and x 8 y 2..3.

**1 Schoolhouse (x 13..22):** sill `stone_bricks` y 1 round both masses; walls `white_concrete` (white clapboard) y 2..6 and both gable triangles; corner boards `stripped_spruce_log`; cornice board `spruce_slab` (top) y 7 along the side eaves. Cloakroom front (z 9): door x 17..18 y 2..3 (`mangrove_door` pair, red, hinges outward), transom glass y 4; a small `calcite` pediment band at y 5 under the gable. Cloakroom sides x 15 / x 20: one window z 10 y 3..4 each. Classroom front gable z 12 above the cloakroom roof: a 2-wide round-headed window x 17..18 y 9..10. Classroom sides x 13 / x 22: two tall windows z 13 and z 15, y 3..5 (1x3), spruce_trapdoor shutters on the outer sides only (z 12 and z 16), z 14 plain wall between. Back (z 17): solid (blackboard wall), one small window x 17..18 y 5. Cupola: base x 16..19 z 13..16 y 11..13 `white_concrete` (stands through the roof, roof stops against it), corner posts `pale_oak_fence` y 14..15 at the 4 corners, open sides with louvres (spruce_trapdoor open) on the lower half, slab ring y 16, cap above. Yard bench: `spruce_stairs` facing south at (13..14, 1, 7) against the west ring fence.

**2 Hill farmhouse (x 25..34):** stone piers `cobblestone` at the corners and every 3 along the walls (y 1 in the wall line), between them the floor's edge `spruce_planks`; walls board-and-batten: `spruce_planks` field with `stripped_spruce_log` battens (axis y) every 3rd column, y 2..7; head plate `stripped_spruce_log` y 5 (axis x/z, flush). Front (z 10): door x 29 (`dark_oak_door`) y 2..3 with a glass sidelight x 30 y 2..3; windows x 26..27 and x 32..33 (2 wide, y 3..4) with `mangrove_trapdoor` shutters at x 25/28 and x 31/34; loft window x 29..30 y 8..9 in the gable. Porch (z 7..9): deck `mangrove_planks` y 1; posts `stripped_spruce_log` y 2..4 at (25,7), (28,7), (31,7), (34,7); beam `stripped_spruce_log` axis x y 5; brackets `spruce_stairs` upside-down each side of each post under the beam; rail `spruce_fence` y 2 along z 7 except x 29..30 (the step) and along x 25 / x 34 z 8..9. Sides x 25 / x 34: one window z 12 y 3..4 each. Back gable (z 14) above the ell roof: solid boards (bed heads), a 1x1 vent y 11. Ell: same walls y 2..4; west door x 26 z 16 y 2..3 (to the side yard); back window x 29..30 y 3..4 z 17. Chimney: `bricks` with a `deepslate_bricks` band 2 below the top, standing on its own footing.

**3 Blacksmith (x 37..44):** plinth `cobblestone` y 1 on the back and side walls; walls `dark_oak_planks` with `stripped_spruce_log` battens every 3rd column, y 2..4; posts `stripped_spruce_log` (axis y) y 1..4 at (37,9), (40,9), (44,9) and the back corners; head beam `stripped_spruce_log` axis x y 5 across the open front z 9 x 37..44. Front open between the posts (forge seen from the lane, glow at night). West wall x 37: one shuttered opening z 12 y 2..3 (no glass, spruce_trapdoor shutters). East wall x 44: open archway z 11..12 y 1..2 to the lean-to. Back (z 15): the forge mouth only. Chimney `bricks`, band `deepslate_bricks`. Lean-to posts `stripped_spruce_log` y 1..3 at (46,9), (46,12), (46,15).

**4 Church (x 49..56):** plinth `stone_bricks` y 1; walls `white_concrete` y 2..7 and gable; corner pilasters `calcite` flush at the x 49 / x 56 corners, y 2..7; a `calcite` slab cornice under the side eaves y 8. Front gable (z 9): double door x 52..53 y 2..3 (`spruce_door`), glass transom y 4, `calcite` lintel stairs (upside-down) y 5 x 51..54; above it the tower face is the same plane: round window x 52..53 y 11..12 in the tower shaft. Tower x 51..54 z 9..12: shaft y 8..15 white_concrete, corners calcite; belfry y 16..17 open 2-wide on every face (x 52..53 on z 9 and z 12, z 10..11 on x 51 and x 54) with spruce_trapdoor louvres (open) in the lower course y 16, bell (52, 17, 10) `attachment: ceiling` hung from the y 18 deck; cornice ring y 18 calcite slabs proud 1; spire above. Sides x 49 / x 56: three tall lancets z 11, z 13, z 15, y 3..6 (1x4) with an upside-down stair head pair at y 7. Back (z 17): small round window x 52..53 y 9..10 over the altar. Graveyard: white picket `pale_oak_fence` y 1 along x 55 z 6..8 with a `pale_oak_fence_gate` at (55, 1, 7); headstones (polished_andesite wall / slab) at (57,1,7), (58,1,10), (58,1,12), (58,1,14), (58,1,16), (57,1,16) with mounds of coarse_dirt/podzol.

**5 Tobacco barn (x 63..68):** sill `cobblestone` y 1 (bottom course, mossy 1 in 10); walls vertical boards `stripped_dark_oak_log` (axis y) y 2..10 with **vent slots**: on x 63 and x 68 at z 10, 12, 14 the column y 3..9 is `spruce_trapdoor` (open, in the wall plane: dark gaps you can see the leaves through); gable triangles same boards; head plate `stripped_spruce_log` y 10. Front (z 9): door opening x 65..66 y 1..3 (`spruce_door` pair y 1..2, `stripped_spruce_log` lintel y 4, y 3 open as a vent); gable vent x 65..66 y 12. Back (z 15): the firebox mouth (65, 1, 15). Stripping shed: posts `stripped_spruce_log` y 1..4 at (61,9), (61,12), (61,15), a work bench along x 62.

**6 Corn crib + granary (x 73..82):** Crib: piers `cobblestone` y 1 at (73,9), (75,9), (73,12), (75,12), (73,16), (75,16), air between (vermin gap); floor `oak_planks` y 2; corner posts `stripped_oak_log` y 3..7; slat walls `bamboo_fence` y 3..7 on all four faces (pale slats with the yellow corn showing between); plate `stripped_oak_log` y 7; front hatch (74, 3..4, 9) `oak_trapdoor`. Granary: sill `cobblestone` y 1; walls `oak_planks` y 2..6 with `stripped_oak_log` corner posts and door jambs; front (z 9): double door x 78..79 y 2..3 (`oak_door`), loft door x 79..80 y 7..8 in the gable; sides: one window z 12 y 3..4 on x 82 (x 77 faces the crib: solid). Loading dock: `spruce_planks` y 1 x 77..80 z 7..8, `spruce_fence` rail y 2 along x 80 z 7..8.

**7 Owner's house (x 85..92):** plinth `stone_bricks` y 1 (the floor's edge; porch piers `stone_bricks` under each post); walls `bricks` y 2..10; belt course `calcite` y 6 (flush, the floor line); lintels `calcite` slab (top) over every opening, sills `smooth_stone_slab` (top); cornice: calcite fascia at y 11 under the eave. Front (z 9): double door x 89..90 y 2..3 (`dark_oak_door`), transom glass y 4; upper window pair x 90..91 y 8..9. Bay (x 85..88, z 8): brick corners x 85 and x 88, glazed x 86..87 at y 3..4 and y 8..9, calcite panel between storeys y 5..7. Porch: deck `mangrove_planks` y 1; columns `calcite` y 2..4 at (85,7), (88,7), (91,7), (94,7), (94,11), (94,15); beam `pale_oak_log` (axis x/z) y 5; spindle frieze `pale_oak_trapdoor` (top, closed) under the beam between posts; balustrade `pale_oak_fence` y 2 along z 7 (gaps x 89..90) and x 94. East (x 92): ground windows z 11 and z 13 (onto the porch), upper windows z 11 and z 13 (between the bed heads). West (x 85): ground window z 12, upper window z 12. Back (z 15): balcony doors x 86..87 y 7..8 (`dark_oak_door` pair), ground window x 88 y 3..4, hearth mouth (91, 2, 15). Balcony: deck `mangrove_planks` y 6 x 85..88 z 16..17 on posts `pale_oak_log` (85, 1..5, 17), (88, 1..5, 17) with upside-down `pale_oak_stairs` brackets under the deck at the wall; rail `pale_oak_fence` y 7 round z 17 and x 85 / x 88. Chimney `bricks`, band `deepslate_bricks`.

## MATERIALS

| role | block |
|---|---|
| ground | grass_block 60%, coarse_dirt 25%, podzol + rooted_dirt by fences, sheds and the barn |
| lane | gravel centre, coarse_dirt ruts and edges |
| plot ring | spruce_fence, spruce_fence_gate, lantern posts (spruce_fence + lantern) |
| porch decks / landings | mangrove_planks (kits 1-3 used oak, spruce, dark oak) |
| interior floors | spruce_planks (houses, school, church), cobblestone / packed_mud (gin, forge, barn) |
| ramps | the building's own `*_slab` bottom: mangrove_slab (houses), stone_brick_slab (school, church), spruce_slab (granary) |
| 0 gin | birch_planks body / stripped_spruce_log frame / cobblestone plinth / deepslate_tiles roof / spruce_trapdoor leaves |
| 1 school | white_concrete / stripped_spruce_log trim / stone_bricks sill / andesite (tin) roof / mangrove_door (red) / pale_oak_fence cupola posts |
| 2 farmhouse | spruce_planks + stripped_spruce_log battens / cobblestone piers / mangrove roof + porch / mangrove_trapdoor shutters / dark_oak_door |
| 3 smithy | dark_oak_planks + stripped_spruce_log / cobblestone / deepslate_tiles roof |
| 4 church | white_concrete / calcite trim / stone_bricks plinth / slate palette roof and spire / pale_oak_fence pickets / polished_andesite headstones |
| 5 tobacco barn | stripped_dark_oak_log boards / spruce_trapdoor vents / cobblestone sill / waxed_exposed_cut_copper roof |
| 6 crib + granary | bamboo_fence slats / stripped_oak_log posts / oak_planks / cobblestone piers / bamboo_planks roof |
| 7 owner's house | bricks / calcite trim / stone_bricks plinth / pale_oak posts + rails / waxed_oxidized_cut_copper roof |
| chimneys | bricks, deepslate_bricks band, constant width, no crown; fire = lit campfire (`signal_fire: true`) on a hay_block in the floor layer |
| glass | glass_pane |

All ids checked with `mcd blocks --check` (known in 26.3).

## OPENINGS

(x, y, z; doors 1 wide x 2 high, both halves; "open" = left as air)

| plot | opening | coords |
|---|---|---|
| 0 | wagon door (open) | x 4..7, y 1..4, z 9 |
| 0 | hay door (open, leaves folded) | x 5..6, y 7..8, z 9 |
| 0 | gable louvre | x 5..6, y 12, z 9 |
| 0 | side windows | x 1 and x 10 at z 11 y 2..3; at z 11 and z 14 y 8 |
| 0 | shaft port (east wall) | (10, 2, 14) |
| 0 | back door / windows | door x 5..6 y 1..3; windows x 3 and x 8 y 2..3; z 16 |
| 1 | cloakroom door pair + transom | x 17..18, y 2..3 (+ y 4), z 9 |
| 1 | cloakroom windows | x 15 and x 20, z 10, y 3..4 |
| 1 | cloakroom -> classroom doorway | x 17..18, y 2..3, z 12 |
| 1 | gable window | x 17..18, y 9..10, z 12 |
| 1 | classroom tall windows | x 13 and x 22 at z 13 and z 15, y 3..5 |
| 1 | back high window | x 17..18, y 5, z 17 |
| 2 | front door + sidelight | door x 29 y 2..3; glass x 30 y 2..3; z 10 |
| 2 | front windows | x 26..27 and x 32..33, y 3..4, z 10 |
| 2 | loft window | x 29..30, y 8..9, z 10 |
| 2 | side windows | x 25 and x 34, z 12, y 3..4 |
| 2 | body -> kitchen door | x 31, y 2..3, z 14 |
| 2 | ell side door / back window | door x 26 z 16 y 2..3; window x 29..30 y 3..4 z 17 |
| 2 | back gable vent | x 29..30, y 11, z 14 |
| 2 | hearth mouth | (32, 2, 15) (the chimney cuts it) |
| 3 | open front | x 38..39 and x 41..43, y 1..4, z 9 (between the posts) |
| 3 | west shuttered opening | x 37, z 12, y 2..3 |
| 3 | archway to the lean-to | x 44, z 11..12, y 1..2 |
| 3 | forge mouth | (40, 1, 15) |
| 4 | double door + transom | x 52..53, y 2..3 (+ y 4), z 9 |
| 4 | tower round window | x 52..53, y 11..12, z 9 |
| 4 | belfry openings | x 52..53 at z 9 and z 12; z 10..11 at x 51 and x 54; y 16..17 |
| 4 | lancets | x 49 and x 56 at z 11, z 13, z 15, y 3..6 |
| 4 | altar round window | x 52..53, y 9..10, z 17 |
| 4 | graveyard gate | (55, 1, 7) |
| 5 | barn doors / transom vent | x 65..66, y 1..2 doors, y 3 open, z 9 |
| 5 | vent slots (open trapdoors) | x 63 and x 68 at z 10, 12, 14, y 3..9 |
| 5 | gable vents | x 65..66, y 12, z 9 and z 15 |
| 5 | firebox mouth | (65, 1, 15) |
| 6 | crib hatch | (74, 3..4, 9) |
| 6 | granary doors | x 78..79, y 2..3, z 9 |
| 6 | granary loft door | x 79..80, y 7..8, z 9 |
| 6 | granary window | x 82, z 12, y 3..4 |
| 7 | front door pair + transom | x 89..90, y 2..3 (+ y 4), z 9 |
| 7 | bay glazing | x 86..87, y 3..4 and y 8..9, z 8 |
| 7 | front upper windows | x 90..91, y 8..9, z 9 |
| 7 | east windows | x 92 at z 11 and z 13, y 3..4 and y 8..9 |
| 7 | west windows | x 85, z 12, y 3..4 and y 8..9 |
| 7 | balcony doors | x 86..87, y 7..8, z 15 |
| 7 | back ground window | x 88, y 3..4, z 15 |
| 7 | hearth mouth | (91, 2, 15) |
| all | ring gates | x 12i+5..6, y 1, z 5 |

## RESERVED

The shell leaves these empty; the named part builds them.

| what | coords | part |
|---|---|---|
| chimneys (`chimney(g, { wall: <mouth>, into, top })`, after the roof; own footing, fire 1 outside the wall on a hay_block in the floor layer, 1x1 flue to the mouth) | 2: mouth (32, 2, 15) into west, fire (33, 2, 15), stack x 33..34 z 14..16, top y 13. 3 forge: mouth (40, 1, 15) into north, fire (40, 1, 16) on hay (40, 0, 16), stack x 39..41 z 16..17, top y 12. 5 flue: mouth (65, 1, 15) into north, fire (65, 1, 16), stack x 64..66 z 16..17, top y 13. 7: mouth (91, 2, 15) into north, fire (91, 2, 16), stack x 90..92 z 16..17, top y 16 | chimney |
| gin floor shaft (open to y -2, 1x1) with its marking frame `stripped_spruce_wood` round it at y 0 | hole (7, -2..0, 14); frame x 6..8 z 13..15 y 0 except the hole | shell (leave), gin bay |
| gin loft-floor shaft hole (in line) | (7, 6, 14) | shell (leave) |
| gin machine room: NO furniture, posts or decor | x 2..9, y 1..5, z 13..15 | everyone |
| gin loft ladder | ladder (2, 1..6, 15) facing east on wall x 1; hole (2, 6, 15) | stairs |
| farmhouse flight | x 26..30 at z 13, facing east, steps y 2..6 (top step (30, 6, 13) IN the loft floor); headroom hole y 6 x 27..29 z 13; rail y 7 at x 28..29 z 12 | stairs |
| farmhouse beds (loft, heads south against the back gable z 14) | (26, 7, 12..13), (27, 7, 12..13), (32, 7, 12..13), (33, 7, 12..13) | rooms |
| school bell | (17, 15, 14) `attachment: ceiling` under the y 16 cap deck | tower |
| church tower deck (on beams over the narthex) | y 8 (beam deck x 51..54 z 9..12) and belfry deck y 15, bell (52, 17, 10) under y 18 | tower |
| church tower ladder | on the tower back wall inside: ladder (52, 9..15, 11) facing north on wall z 12, hole in decks (52, 8, 11) and (52, 15, 11); reached by a ladder (55, 2..7, 16) facing west on the nave wall x 56 to a gallery deck y 7 x 50..55 z 10..11 | stairs |
| tobacco tier poles | `stripped_spruce_log` axis x, x 64..67 at y 5, 7, 9, z 10, 12, 14 | barn interior |
| tobacco barn ladder | (64, 1..9, 14) facing east on wall x 63 | stairs |
| owner's flight | x 86 at z 14 -> z 10, facing north, steps y 2..6 (top step (86, 6, 10) IN the upper floor); headroom hole y 6 x 86 z 11..12; rail y 7 x 87 z 11..12 | stairs |
| owner's beds (upper) | heads east against x 92: (90..91, 7, 10), (90..91, 7, 12), (90..91, 7, 14); head south against z 15: (88, 7, 13..14) | rooms |
| porch posts, columns, balcony posts | as listed in FACADES | porch |
| slab ramps + landings | 0 none (level gravel); 1 slab x 17..18 z 6, landing z 7..8; 2 slab x 29..30 z 6, porch deck z 7..9; 4 slab x 52..54 z 6, landing x 52..54 z 7..8; 6 slab x 77..78 z 6, dock x 77..80 z 7..8; 7 slab x 89..90 z 6, porch deck z 7..8 | porch / ground |
| yard pieces | 0 bales x 1..3 z 6..8 and x 8..10 z 6..8 (not on the path x 4..7); 3 wheel stand x 37..39 z 6..8, cart x 45..46 z 10..13; 4 graves; 5 woodpile x 69..70 z 10..15 | yard |
| job sites | 1 cartographer table (21, 2, 16); 3 smithing table (43, 1, 14), anvil (42, 1, 12); 4 lectern (52, 2, 16); 6 composter (78, 2, 15) | rooms |

## FLOORS

| plot | level | y (floor block / stand) | interior volume |
|---|---|---|---|
| 0 gin | ground (grade: wagon bay + machine room) | 0 / 1 | x 2..9, z 10..15, y 1..5 |
| 0 | loft | 6 / 7 | x 2..9, z 10..15, y 7..9 + roof space to ~14 |
| 1 school | cloakroom | 1 / 2 | x 16..19, z 10..11, y 2..4 |
| 1 | classroom | 1 / 2 | x 14..21, z 13..16, y 2..6 (open to the trusses) |
| 2 farmhouse | ground: living room / kitchen ell | 1 / 2 | x 26..33 z 11..13 y 2..5 / x 27..31 z 15..16 y 2..4 |
| 2 | loft (4 beds) | 6 / 7 | x 26..33, z 11..13, y 7..roof (2 clear above beds at x 26..27, 32..33) |
| 3 smithy | forge shed / lean-to | 0 / 1 | x 38..43 z 10..14 y 1..4 / x 45..46 z 9..15 y 1..3 |
| 4 church | nave | 1 / 2 | x 50..55, z 10..16, y 2..7 (open to y 11) |
| 4 | gallery / tower decks | 7 / 8; 8; 15 | gallery x 50..55 z 10..11; tower interior x 52..53 z 10..11 |
| 5 tobacco barn | floor (tiers above) | 0 / 1 | x 64..67, z 10..14, y 1..13 |
| 6 crib | corn bin | 2 / 3 | x 74, z 10..15, y 3..7 |
| 6 | granary | 1 / 2 | x 78..81, z 10..15, y 2..6 |
| 7 owner's house | ground (parlor + hearth, dining, kitchen) | 1 / 2 | x 86..91 z 10..14 + bay x 86..87 z 8 (y 2..5) |
| 7 | upper (4 beds, balcony doors) | 6 / 7 | x 86..91 z 10..14 + bay x 86..87 z 8 (y 7..10) |

## PALETTE

Architect's MATERIALS kept exactly. Shape variants (all checked with `mcd blocks --check`, unknown: none):
| role | base | variants |
|---|---|---|
| ring/fence | spruce_fence, spruce_fence_gate, lantern | - |
| gin | birch_planks, stripped_spruce_log, stripped_spruce_wood, cobblestone, deepslate_tiles | deepslate_tile_stairs/slab, spruce_trapdoor, iron_chain, hay_block, barrel, ladder |
| school | white_concrete, stone_bricks, andesite, calcite, mangrove_door | stone_brick_slab, andesite_stairs/slab, pale_oak_fence, spruce_trapdoor, bell, lightning_rod, cartography_table, glass_pane |
| farm | spruce_planks, mangrove_planks, mangrove (roof), cobblestone, dark_oak_door | mangrove_stairs/slab/trapdoor, spruce_stairs, spruce_fence, campfire, furnace |
| smith | dark_oak_planks, cobblestone, bricks, deepslate_bricks | deepslate_tile_stairs, anvil, smithing_table, water_cauldron, coal_block, iron_bars |
| church | white_concrete, calcite, stone_bricks, polished_andesite, spruce_door | calcite_stairs/slab, slate palette stairs, pale_oak_fence(+gate), polished_andesite_wall/slab, bell, lectern |
| barn | stripped_dark_oak_log, cobblestone, waxed_exposed_cut_copper | its stairs/slab, spruce_trapdoor, spruce_door, hay_block |
| crib/granary | oak_planks, stripped_oak_log, bamboo_fence, bamboo_planks, cobblestone | oak_trapdoor, oak_door, bamboo_stairs/slab, spruce_slab, composter, stone_pressure_plate |
| owner | bricks, calcite, stone_bricks, pale_oak_log, waxed_oxidized_cut_copper | its stairs/slab, pale_oak_fence/trapdoor/stairs, smooth_stone_slab, dark_oak_door, mangrove_planks |
| hearth | bricks, deepslate_bricks, campfire (lit, signal_fire), hay_block | brick_stairs (lintel, upside-down) |
| interior | spruce_planks floor, beds (red/white/blue wool), lanterns, candles | - |

## VOCABULARY

- `laneRow(g, x0, x1)`: gravel z1..3, coarse_dirt z1 and z3 (alternate 2 of 3), z0/z4 coarse_dirt, y0.
- `ringFence(g, i)`: spruce_fence y1 ring of plot i (x 12i / 12i+11, z5..18; z5 and z18), gate x 12i+5..6 z5 facing north, posts fence y1..3 + lantern y4 at (12i,5),(12i+11,5). Only on the ring.
- `slabRamp(g, x, z, width, floorY)`: bottom slabs of the building's slab at z6 (+z7 if floor 2 above), full-block landing y1 z7..8 width>=2, level to the door. Never stairs.
- `boardWall(g, box, {plank, post, batten:3})`: planks field, stripped_log (axis y) posts at corners, battens every 3rd column, beam rows (axis along run) at floor and plate lines.
- `pierRow(g, x0, x1, z, y)`: cobblestone block piers every 3, air/skirt between.
- `wagonDoor(g)`: clear x4..7 y1..4 z9, lintel y5 x3..8, folded leaves: spruce_trapdoor open, facing so it lies flat on wall (check `mcd states`), at x2..3 and x8..9.
- `hayDoor(g)`: opening x5..6 y7..8 z9, open trapdoor leaves at x4,x7.
- `hoistBeam(g)`: stripped_spruce_log axis z at (6,10,7..9); iron_chain (6,9,7); hay_block (6,8,7) hanging; brace stair underneath at (6,9,8..) optional.
- `shaftFrame(g)`: stripped_spruce_wood at y0 x6..8 z13..15 except the hole (7,0,14) open down to y-2; wall port frame around (10,2,14).
- `louvre(g, x, y, z, face, w)`: spruce_trapdoor open, in the wall plane, w wide.
- `doorPair(g, x, y, z, facing, block)`: lower+upper halves same facing, hinge left/right mirrored; transom glass_pane above.
- `shutterPair(g, x, y, z, face, wood)`: shutter() either side of a window.
- `lancet(g, x, z, y0, y1)`: 1xN glass_pane, upside-down stairs pair on top, slab sill.
- `ventSlot(g, x, z)`: column y3..9 spruce_trapdoor open in the wall plane.
- `porchDeep(g)`: deck, 4 posts, beam, brackets, rail, shed roof stairs (farm). `porchWrap(g)`: columns, pale_oak beam, spindle trapdoors, balustrade, roof.
- `bellCupola(g)`, `belfry(g)`, `spireCap(g)`: as FACADES; clock-free; bell attachment ceiling; spire steps in 1 per row.
- `bayWindow(g)`, `balcony(g)`: as FACADES.
- `slatCrib(g)`: bamboo_fence slats on 4 faces y3..7 on oak floor on piers.
- `picketYard(g, box)`, `headstone(g, x, z, kind)`: polished_andesite_wall (tall) or slab (low), coarse_dirt mound in front.
- `wheelStand(g)`: fence post + iron_bars/trapdoor ring wheel on edge; `cart(g)`: oak_trapdoor bed, spruce_trapdoor wheels on edge, fence shafts.
- `baleStack(g)`, `woodRick(g)`, `sackStack(g)`, `tobaccoTier(g)`: hay_block stacks; stripped_oak_log axis x stacks; hay_block with white_wool top; tobacco leaves hang under tier poles (oak_leaves persistent over chains).
- `chimney(g, {wall, into, top, material:'bricks', band:'deepslate_bricks'})` per RESERVED; `flight(g, ...)`; `bedAt(g, foot, facing, colour)`; `jobSite(g, block, pos)`; `yardBench(g)`.

## ROOMS

Floors per FLOORS. Detail room boxes are in the JSON answer. Doors/openings per OPENINGS. Stairs: farm flight x26..30 z13 (steps y2..6); owner flight x86 z14->10; gin ladder (2,1..6,15); church tower ladder (52,9..15,11); barn ladder (64,1..9,14).

## PARTS

1. P1 shells 0-3 (parts/shell-a.mjs): plinths, walls, floors, posts, shaft frame, leaving all OPENINGS and RESERVED.
2. P2 shells 4-7 (parts/shell-b.mjs): same, plus church tower shaft/belfry, cupola base, crib, bay.
3. P3 roofs (parts/roofs.mjs): roof.json per ROOFS, trusses, cupola cap, spire, lean-tos, porch roofs.
4. P4 openings, porches, ways in (parts/fittings.mjs): doors, glass, shutters, vents, porches, balcony, slab ramps.
5. P5 chimneys, stairs, hearths, job sites (parts/hearths.mjs): chimney() after roof; flights, ladders, stoves.
6. P6 grounds (parts/grounds.mjs): lane, ring, yards, graves, lanterns.

Checklist: [ ] P1 [ ] P2 [ ] P3 [ ] P4 [ ] P5 [ ] P6

## NOTES
- Do not move the architect's coordinates. Nothing may leave its plot (x 12i..12i+11, z 5..18); eaves over the ring at y6+ only.
- Chimney after roof; call chimney() directly, count lit campfires (plots 2, 3, 5, 7). Hearths inside need no interior footing.
- Way in checked with `mcd approach`; run `mcd fit` and `mcd check`.
- Gin machine room stays empty.

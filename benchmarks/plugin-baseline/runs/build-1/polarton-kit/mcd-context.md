# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
```

### elements.md

```markdown
# REQUIRED ELEMENTS (Polarton hillside kit)
Parts: P1 shells 0-3, P2 shells 4-7, P3 roofs, P4 openings+porches+ways in, P5 chimneys+stairs+job sites, P6 grounds. Vocab names in plan.md VOCABULARY.

## Every plot (ring, lane)
- [ ] Lane z0..4 y0: gravel centre z1..3, coarse_dirt ruts z1,z3, edges z0,z4 | P6 | laneRow
- [ ] Plot ring: spruce_fence y1 on x=12i,12i+11 (z5..18) and z5,z18; 2-wide spruce_fence_gate (north, closed) x12i+5..6 z5; lantern posts (12i,5),(12i+11,5) fence y1..3 + standing lantern y4. Nothing else on the ring | P6 | ringFence
- [ ] Way in: gate z5 -> bottom slabs z6 (2+ wide) -> full-block landing y1 z7..8 -> door. Gin is level gravel | P4 | slabRamp
- [ ] Beds 3-4 per house: whole, head vs solid wall, 2 clear above | rooms designers | bedAt
## 0 Cotton gin
- [ ] Two storeys, plinth cobblestone y1, birch_planks y2..9, stripped_spruce_log corner/jamb posts + y6 floor beam + y9 plate | P1 | boardWall, framePosts
- [ ] Wagon bay: open door x4..7 y1..4 z9, lintel y5 x3..8, 4 spruce_trapdoor leaves folded open flat at x2..3, x8..9 | P4 | wagonDoor
- [ ] Hay door x5..6 y7..8 z9, leaves folded at x4,x7 | P4 | hayDoor
- [ ] Hoist beam stripped_spruce_log axis z (6,10,7..9), iron_chain (6,9,7) hanging, hay_block (6,8,7) | P4 | hoistBeam
- [ ] Gable louvre x5..6 y12 z9; roof monitor with louvres on ridge | P3/P4 | louvre
- [ ] Machine room x2..9 y1..5 z13..15 CLEAR; floor shaft hole (7,-2..0,14) framed stripped_spruce_wood x6..8 z13..15 y0; loft hole (7,6,14); wall port (10,2,14) framed | P1 | shaftFrame
- [ ] Loft ladder (2,1..6,15) facing east, hole (2,6,15); loft bales/hay | P5 | ladderRun
- [ ] Yard bales x1..3 / x8..10 z6..8 (hay_block), barrels | P6 | baleStack
## 1 Schoolhouse
- [ ] white_concrete clapboard walls, stone_bricks sill, trim stripped_spruce_log, cornice spruce_slab top y7 | P2 | boardWall
- [ ] Cloakroom porch x15..20 z9..12 enclosed, red mangrove_door pair x17..18 z9, transom glass y4, calcite pediment band y5; coat hooks (inside) | P2/P4 | doorPair
- [ ] Bell cupola x16..19 z13..16 y11..19: concrete base, pale_oak_fence posts, open louvres, bell (17,15,14) ceiling, slab ring y16, cone cap, lightning_rod y19 | P2/P3 | bellCupola
- [ ] Yard bench spruce_stairs facing south (13..14,1,7); flower bed x20..22 z6..8 | P6 | yardBench
- [ ] Cartographer table (21,2,16) | P5 | jobSite
## 2 Hill farmhouse
- [ ] Board-and-batten spruce_planks + stripped_spruce_log battens every 3rd col; cobblestone piers | P1 | boardWall, pierRow
- [ ] Deep porch z7..9: mangrove deck y1, 4 posts, beam y5, upside-down stair brackets, fence rail, shed roof | P4 | porchDeep
- [ ] Kitchen ell x26..32 z14..17; stove/hearth; composter-free (farmer's composter in kitchen yard optional) | P1/P5
- [ ] Exterior chimney east of ell, mouth (32,2,15) | P5 | chimney
- [ ] Loft flight x26..30 z13, 4 beds loft | P5 | flight
## 3 Blacksmith + wheelwright
- [ ] Open forge shed: posts y1..4, head beam y5 z9, dark_oak walls back/sides | P1 | boardWall
- [ ] Forge: forge mouth (40,1,15), chimney outside back wall; anvil (42,1,12); smithing table (43,1,14); water cauldron quench | P5 | chimney, jobSite
- [ ] Wheel in progress on stand x37..39 z6..8: spoke wheel from iron_bars/fence ring on fence stand, stock logs | P6 | wheelStand
- [ ] Cart under lean-to x45..46 z9..15: cart bed of oak_trapdoors + 2 wheels (spruce_trapdoors upright) + fence shafts | P6 | cart
- [ ] Coal (coal_block) + cordwood (stripped_oak_log axis x) store x42..46 z16..17 | P6 | woodRick
## 4 Church
- [ ] white_concrete walls, calcite pilasters + cornice, stone_bricks plinth | P2 | boardWall
- [ ] Steeple tower x51..54 z9..12 to y18, round window, belfry with open louvres, bell (52,17,10), calcite cornice y18 | P2/P3 | belfry
- [ ] Spire tower-cap slate y19..24, lightning_rod + spruce_fence cross y25..26 | P3 | spireCap
- [ ] Lancets x49/x56 z11,13,15 y3..6 w/ upside-down stair heads | P4 | lancet
- [ ] Double spruce_door x52..53, transom, calcite lintel | P4 | doorPair
- [ ] Graveyard x56..58 + strip x57..58, pale_oak_fence pickets, gate (55,1,7), headstones | P6 | headstone, picketYard
- [ ] Lectern (52,2,16), pews (stairs), altar | rooms/P5 | jobSite
## 5 Tobacco barn
- [ ] Vertical stripped_dark_oak_log boards, cobblestone sill, plate y10 | P1 | boardWall
- [ ] Vent slots: open spruce_trapdoor columns x63/x68 z10,12,14 y3..9 | P4 | ventSlot
- [ ] Tier poles stripped_spruce_log axis x y5,7,9 x64..67 z10,12,14, hanging tobacco (dried_kelp_block/ fern-free: brown leaves via oak_leaves persistent hung under poles via chains) | rooms | tobaccoTier
- [ ] Firebox (65,1,15) + flue stack | P5 | chimney
- [ ] Stripping shed lean-to x61..62 w/ bench, woodricks x69..70 | P4/P6
- [ ] Ladder (64,1..9,14) | P5
## 6 Corn crib + granary
- [ ] Crib on cobblestone piers, oak floor y2, bamboo_fence slat walls y3..7, hatch (74,3..4,9) | P2/P4 | slatCrib
- [ ] Granary raised 1, oak_planks, double oak_door x78..79, loft door x79..80 y7..8 | P2/P4
- [ ] Slab ramp x77..78 z6 + dock x77..80 z7..8 | P4 | slabRamp
- [ ] Sacks (hay_block + white_wool tops), scale (stone_pressure_plate on fence post, hopper-free), barrels | rooms | sackStack
- [ ] Composter (78,2,15) | P5 | jobSite
## 7 Owner's house
- [ ] Brick two-storey, calcite belt y6, plinth stone_bricks | P2 | boardWall
- [ ] Front bay x85..88 z8, 2 storeys, glazed | P2/P4 | bayWindow
- [ ] Wraparound porch columns calcite, pale_oak beam, spindle frieze, balustrade | P4 | porchWrap
- [ ] Rear balcony x85..88 z16..17 y6, posts, brackets, rail | P4 | balcony
- [ ] Hip roof verdigris copper | P3
- [ ] Chimney, mouth (91,2,15) | P5 | chimney
- [ ] Flight x86 z14->10; 4 beds upper | P5 | flight
## Villager job sites: cartography_table (21,2,16); smithing_table (43,1,14); lectern (52,2,16); composter (78,2,15)
## Light: every interior floor cell >= 8 (lanterns), exterior lantern posts; no mob spawn
```

### rooms.json

```json
{"entrance":[5,1,8],"street":null,"rooms":[{"name":"gin wagon bay","box":[2,1,10,9,5,12]},{"name":"gin machine room","box":[2,1,13,9,5,15]},{"name":"gin loft","box":[2,7,10,9,9,15]},{"name":"schoolhouse cloakroom","box":[16,2,10,19,4,11]},{"name":"classroom","box":[14,2,13,21,6,16]},{"name":"farmhouse living room","box":[26,2,11,33,5,13]},{"name":"farmhouse kitchen ell","box":[27,2,15,31,4,16]},{"name":"farmhouse loft","box":[26,7,11,33,9,13]},{"name":"forge shed","box":[38,1,10,43,4,14]},{"name":"cart lean-to","box":[45,1,9,46,3,15]},{"name":"church nave","box":[50,2,10,55,7,16]},{"name":"church belfry","box":[52,16,10,53,17,11]},{"name":"tobacco barn","box":[64,1,10,67,13,14]},{"name":"corn crib bin","box":[74,3,10,74,7,15]},{"name":"granary","box":[78,2,10,81,6,15]},{"name":"owner parlor and dining","box":[87,2,10,91,5,14]},{"name":"owner stair hall","box":[86,2,10,86,5,14]},{"name":"owner upper bedrooms","box":[86,7,10,91,10,14]}]}
```

### palette.json

```json
{"roles":{"ground":["grass_block","coarse_dirt","podzol","rooted_dirt"],"lane":["gravel","coarse_dirt"],"ring":["spruce_fence","spruce_fence_gate","lantern"],"gin":["birch_planks","stripped_spruce_log","stripped_spruce_wood","cobblestone","deepslate_tiles","deepslate_tile_stairs","deepslate_tile_slab","spruce_trapdoor","iron_chain","hay_block","barrel","ladder"],"school":["white_concrete","stone_bricks","andesite","calcite","mangrove_door","stone_brick_slab","andesite_stairs","andesite_slab","pale_oak_fence","spruce_trapdoor","bell","lightning_rod","cartography_table","glass_pane"],"farm":["spruce_planks","mangrove_planks","mangrove_stairs","mangrove_slab","mangrove_trapdoor","cobblestone","dark_oak_door","spruce_stairs","spruce_fence","campfire","furnace"],"smith":["dark_oak_planks","cobblestone","bricks","deepslate_bricks","deepslate_tile_stairs","anvil","smithing_table","water_cauldron","coal_block","iron_bars"],"church":["white_concrete","calcite","stone_bricks","polished_andesite","polished_andesite_slab","spruce_door","pale_oak_fence","pale_oak_fence_gate","bell","lectern","deepslate_tiles"],"barn":["stripped_dark_oak_log","cobblestone","waxed_exposed_cut_copper","waxed_exposed_cut_copper_stairs","waxed_exposed_cut_copper_slab","spruce_trapdoor","spruce_door","hay_block"],"crib_granary":["oak_planks","stripped_oak_log","bamboo_fence","bamboo_planks","bamboo_stairs","bamboo_slab","cobblestone","oak_trapdoor","oak_door","spruce_slab","composter","stone_pressure_plate"],"owner":["bricks","calcite","stone_bricks","pale_oak_log","pale_oak_stairs","pale_oak_trapdoor","pale_oak_fence","waxed_oxidized_cut_copper","waxed_oxidized_cut_copper_stairs","waxed_oxidized_cut_copper_slab","smooth_stone_slab","dark_oak_door","mangrove_planks"],"hearth":["bricks","deepslate_bricks","campfire","hay_block","brick_stairs"],"interior":["spruce_planks","lantern","candle","red_bed","white_bed","blue_bed"],"Timber walls, framing, floors, porches and furnishings":["stripped_spruce_log","spruce_planks","spruce_stairs","spruce_slab","spruce_fence","spruce_trapdoor","spruce_door","birch_planks","birch_stairs","birch_slab","birch_fence","birch_trapdoor"],"White walls and trim":["white_concrete","calcite","quartz_stairs","quartz_slab"],"Brick walls and chimney masonry":["bricks","brick_stairs","brick_slab","brick_wall","cobblestone","cobblestone_stairs","cobblestone_slab","cobblestone_wall","stone_bricks","stone_brick_stairs","stone_brick_slab","stone_brick_wall"],"Slate, shingle and copper roofs":["deepslate_tiles","deepslate_tile_stairs","deepslate_tile_slab","deepslate_tile_wall","spruce_planks","spruce_stairs","spruce_slab","oxidized_copper","oxidized_cut_copper","oxidized_cut_copper_stairs","oxidized_cut_copper_slab"],"Windows, boundaries and lighting":["glass_pane","spruce_fence","spruce_fence_gate","birch_fence","lantern"],"Terrain, paths, stream and planting":["grass_block","dirt","dirt_path","gravel","stone","cobblestone","cobblestone_slab","oak_log","oak_leaves","cherry_log","cherry_leaves","water","fern","vine","poppy","dandelion"]},"objects":["lantern","barrel","bell","lectern","anvil","smithing_table","cartography_table","composter","campfire","furnace","water_cauldron","lightning_rod","iron_chain","ladder","hay_block","coal_block","candle","red_bed","white_bed","blue_bed"]}
```

### make.sh

```sh
#!/usr/bin/env bash
# The one command that makes build.nbt from scratch: node build.mjs writes every part in plan order to a temp file,
# the temp file must read back as a structure, then it moves into place. Stubs yield the bare ground.
# The roof (roof.json, once the roofs part writes it) is laid by runParts right after the shell part.
set -euo pipefail
cd "$(dirname "$0")"

MCD_JS=/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs
TMP=build.tmp.nbt
trap 'rm -f "$TMP"' EXIT

node build.mjs "$TMP"
node "$MCD_JS" info "$TMP" > /dev/null
mv "$TMP" build.nbt
echo "build.nbt written"
```

### build.mjs

```js
// Builds the Polarton row from its parts: the ground, then every part in plan order. runParts lets each part only ADD into
// air (writes into an earlier part's cells are refused and reported) and reports off-palette blocks per part.
// Usage: node build.mjs <out.nbt>
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE } from "./vocab/base.mjs";

// [part name (as in plan.md), module]. A module not written yet is a no-op, so make.sh still yields the ground.
const PARTS = [
  ["shells plots 0-3", "parts/shell-a.mjs"],
  ["shells plots 4-7", "parts/shell-b.mjs"],
  ["roofs", "parts/roofs.mjs"],
  ["openings and ways in", "parts/fittings.mjs"],
  ["chimneys, stairs, hearths", "parts/hearths.mjs"],
  ["grounds", "parts/grounds.mjs"],
  ["room: gin wagon bay", "parts/room-1.mjs"],
  ["room: gin machine room", "parts/room-2.mjs"],
  ["room: gin loft", "parts/room-3.mjs"],
  ["room: schoolhouse cloakroom", "parts/room-4.mjs"],
  ["room: classroom", "parts/room-5.mjs"],
  ["room: farmhouse living room", "parts/room-6.mjs"],
  ["room: farmhouse kitchen ell", "parts/room-7.mjs"],
  ["room: farmhouse loft", "parts/room-8.mjs"],
  ["room: forge shed", "parts/room-9.mjs"],
  ["room: cart lean-to", "parts/room-10.mjs"],
  ["room: church nave", "parts/room-11.mjs"],
  ["room: church belfry", "parts/room-12.mjs"],
  ["room: tobacco barn", "parts/room-13.mjs"],
  ["room: corn crib bin", "parts/room-14.mjs"],
  ["room: granary", "parts/room-15.mjs"],
  ["room: owner parlor and dining", "parts/room-16.mjs"],
  ["room: owner stair hall", "parts/room-17.mjs"],
  ["room: owner upper bedrooms", "parts/room-18.mjs"],
];

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(2);
}

const list = [];
for (const [name, file] of PARTS) {
  const mod = await import(new URL(file, import.meta.url).href).catch((e) => {
    if (e.code !== "ERR_MODULE_NOT_FOUND") throw e;
    console.warn(`part not written yet: ${file}`);
    return null;
  });
  list.push([name, mod?.build ?? (() => {})]);
}

const g = new Grid(SITE.size, { dataVersion: SITE.dataVersion });
// The ground: grass_block at y0 across the row (x 0..95, z 0..18). Every part's foundation, lane and yard is written over it.
g.fill([0, 0, 0], [SITE.size[0] - 1, 0, SITE.size[2] - 1], "grass_block");

runParts(g, list, {
  palette: fileURLToPath(new URL("./palette.json", import.meta.url)),
  roof: fileURLToPath(new URL("./roof.json", import.meta.url)),
});

g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for the Polarton row: palette block ids (palette.json only), the site's coordinates, and a seeded rng.
// Plan y 0 is the surface and the grid starts there: the subsurface (y -2..-1) is not in the grid.

/** Grid size x 0..95, y 0..26, z 0..18 (y 0 = surface), and the data version of 26.3. */
export const SITE = { size: [96, 27, 19], dataVersion: 5023 };

/** Plan y levels: surface y0; standing level outdoors y1; raised floor block y1 (stand y2); upper floor block y6 (stand y7). */
export const LEVEL = { surface: 0, stand: 1, raisedFloor: 1, raisedStand: 2, upperFloor: 6, upperStand: 7 };

/** The lane across the whole row: x 0..95, z 0..4. */
export const LANE = { x0: 0, x1: 95, z0: 0, z1: 4 };

/** Plot i's pad: x 12i..12i+11, z 5..18; its fence ring and gate (x 12i+5..6, z 5) sit on that pad. */
export function plot(i) { return { i, x0: 12 * i, x1: 12 * i + 11, z0: 5, z1: 18, gateX: [12 * i + 5, 12 * i + 6] }; }

/** Seeded PRNG (mulberry32): rng(seed)() gives the next float in [0, 1). */
export function rng(seed)

// Ground and lane
export const GRASS_BLOCK = "minecraft:grass_block";

export const COARSE_DIRT = "minecraft:coarse_dirt";

export const PODZOL = "minecraft:podzol";

export const ROOTED_DIRT = "minecraft:rooted_dirt";

export const GRAVEL = "minecraft:gravel";

// Plot ring and lanterns
export const SPRUCE_FENCE = "minecraft:spruce_fence";

export const SPRUCE_FENCE_GATE = "minecraft:spruce_fence_gate";

export const LANTERN = "minecraft:lantern";

// Gin
export const BIRCH_PLANKS = "minecraft:birch_planks";

export const STRIPPED_SPRUCE_LOG = "minecraft:stripped_spruce_log";

export const STRIPPED_SPRUCE_WOOD = "minecraft:stripped_spruce_wood";

export const COBBLESTONE = "minecraft:cobblestone";

export const DEEPSLATE_TILES = "minecraft:deepslate_tiles";

export const DEEPSLATE_TILE_STAIRS = "minecraft:deepslate_tile_stairs";

export const DEEPSLATE_TILE_SLAB = "minecraft:deepslate_tile_slab";

export const SPRUCE_TRAPDOOR = "minecraft:spruce_trapdoor";

export const IRON_CHAIN = "minecraft:iron_chain";

export const HAY_BLOCK = "minecraft:hay_block";

export const BARREL = "minecraft:barrel";

export const LADDER = "minecraft:ladder";

// Schoolhouse, and the church's stone and trim
export const WHITE_CONCRETE = "minecraft:white_concrete";

export const STONE_BRICKS = "minecraft:stone_bricks";

export const ANDESITE = "minecraft:andesite";

export const CALCITE = "minecraft:calcite";

export const MANGROVE_DOOR = "minecraft:mangrove_door";

export const STONE_BRICK_SLAB = "minecraft:stone_brick_slab";

export const ANDESITE_STAIRS = "minecraft:andesite_stairs";

export const ANDESITE_SLAB = "minecraft:andesite_slab";

export const PALE_OAK_FENCE = "minecraft:pale_oak_fence";

export const PALE_OAK_FENCE_GATE = "minecraft:pale_oak_fence_gate";

export const BELL = "minecraft:bell";

export const LIGHTNING_ROD = "minecraft:lightning_rod";

export const CARTOGRAPHY_TABLE = "minecraft:cartography_table";

export const GLASS_PANE = "minecraft:glass_pane";

// Farmhouse
export const SPRUCE_PLANKS = "minecraft:spruce_planks";

export const MANGROVE_PLANKS = "minecraft:mangrove_planks";

export const MANGROVE_STAIRS = "minecraft:mangrove_stairs";

export const MANGROVE_SLAB = "minecraft:mangrove_slab";

export const MANGROVE_TRAPDOOR = "minecraft:mangrove_trapdoor";

export const DARK_OAK_DOOR = "minecraft:dark_oak_door";

export const SPRUCE_STAIRS = "minecraft:spruce_stairs";

export const CAMPFIRE = "minecraft:campfire";

export const FURNACE = "minecraft:furnace";

// Smithy
export const DARK_OAK_PLANKS = "minecraft:dark_oak_planks";

export const BRICKS = "minecraft:bricks";

export const DEEPSLATE_BRICKS = "minecraft:deepslate_bricks";

export const ANVIL = "minecraft:anvil";

export const SMITHING_TABLE = "minecraft:smithing_table";

export const WATER_CAULDRON = "minecraft:water_cauldron";

export const COAL_BLOCK = "minecraft:coal_block";

export const IRON_BARS = "minecraft:iron_bars";

// Church
export const POLISHED_ANDESITE = "minecraft:polished_andesite";

export const POLISHED_ANDESITE_SLAB = "minecraft:polished_andesite_slab";

export const SPRUCE_DOOR = "minecraft:spruce_door";

export const LECTERN = "minecraft:lectern";

// Tobacco barn
export const STRIPPED_DARK_OAK_LOG = "minecraft:stripped_dark_oak_log";

export const WAXED_EXPOSED_CUT_COPPER = "minecraft:waxed_exposed_cut_copper";

export const WAXED_EXPOSED_CUT_COPPER_STAIRS = "minecraft:waxed_exposed_cut_copper_stairs";

export const WAXED_EXPOSED_CUT_COPPER_SLAB = "minecraft:waxed_exposed_cut_copper_slab";

// Corn crib and granary
export const OAK_PLANKS = "minecraft:oak_planks";

export const STRIPPED_OAK_LOG = "minecraft:stripped_oak_log";

export const BAMBOO_FENCE = "minecraft:bamboo_fence";

export const BAMBOO_PLANKS = "minecraft:bamboo_planks";

export const BAMBOO_STAIRS = "minecraft:bamboo_stairs";

export const BAMBOO_SLAB = "minecraft:bamboo_slab";

export const OAK_TRAPDOOR = "minecraft:oak_trapdoor";

export const OAK_DOOR = "minecraft:oak_door";

export const SPRUCE_SLAB = "minecraft:spruce_slab";

export const COMPOSTER = "minecraft:composter";

export const STONE_PRESSURE_PLATE = "minecraft:stone_pressure_plate";

// Owner's house
export const WAXED_OXIDIZED_CUT_COPPER = "minecraft:waxed_oxidized_cut_copper";

export const WAXED_OXIDIZED_CUT_COPPER_STAIRS = "minecraft:waxed_oxidized_cut_copper_stairs";

export const WAXED_OXIDIZED_CUT_COPPER_SLAB = "minecraft:waxed_oxidized_cut_copper_slab";

export const PALE_OAK_LOG = "minecraft:pale_oak_log";

export const PALE_OAK_STAIRS = "minecraft:pale_oak_stairs";

export const PALE_OAK_TRAPDOOR = "minecraft:pale_oak_trapdoor";

export const SMOOTH_STONE_SLAB = "minecraft:smooth_stone_slab";

// Hearths
export const BRICK_STAIRS = "minecraft:brick_stairs";

// Interior furnishings
export const CANDLE = "minecraft:candle";

export const RED_BED = "minecraft:red_bed";

export const WHITE_BED = "minecraft:white_bed";

export const BLUE_BED = "minecraft:blue_bed";
```

### vocab/h1.mjs

```js
// Helpers for plan.md VOCABULARY (part h1): laneRow, pierRow, shaftFrame, lancet, bellCupola, balcony, wheelStand,
// sackStack, bedAt. Each takes its position (and facing) as arguments and returns { placed, refused }.
// Every write goes through writer(): it must land inside the helper's own footprint, and only into air unless the
// caller passes { replace: true }. A cell the rule keeps it from writing is listed in refused, never thrown.
// States are written as 26.3 has them: B.stairs / B.slab / B.trapdoor add waterlogged/powered keys that these blocks
// don't have, so the stairs, slabs, trapdoors, panes, bars, bell and rod are written here with exact states.

/** Lane row at y0, z0..z0+4 (default z0 0): gravel centre, coarse ruts (gravel every third column), coarse edges. */
export function laneRow(g, x0, x1, { z0 = 0, replace = false } = {})

/** Cobblestone piers in one row at height y: every third cell from x0, and always the far end x1. Air between. */
export function pierRow(g, x0, x1, z, y, opts = {})

/** 3x3 floor frame of stripped_spruce_wood at y, hole at the centre (not written; the ground part digs it).
 *  port: also the framed 1x1 shaft port in the wall at (x+4, y+2, z+1), the frame around it set into the wall. */
export function shaftFrame(g, x, y, z, { port = false, replace = false } = {})

/** Lancet window in the wall plane x: sill slab at y0, 1-wide glass y0+1..y1, a pair of upside-down stairs over it at
 *  y1+1 (z-1 and z+1), backs toward `into` (the side the room is on). */
export function lancet(g, x, z, y0, y1, { into = "east", material = "stone_brick", replace = false } = {})

/** Bell cupola, 4x4 at x..x+3, z..z+3, from base level y (plan: 11) to the lightning rod at y+8 (19).
 *  Solid white concrete base y..y+2 (through the roof: replace), pale oak posts at the corners y+3..y+4, open louvres
 *  on the lower course of each side, a bell hung from the andesite deck at y+5 (attachment ceiling, bell at y+4),
 *  then a stepped cone: stairs ring at y+6 backed to the centre, a full centre column to y+7, rod at y+8. */
export function bellCupola(g, x, y, z, { replace = false } = {})

/** Rear balcony: a 4x2 mangrove deck at y (plan: 6) over x..x+3, z..z+1 (the outer row is z+1; the wall is z-1). Pale oak
 *  posts at the outer corners down to y-5, upside-down stair brackets under the deck at the wall, a pale oak rail on
 *  the outer row and the two ends. */
export function balcony(g, x, y, z, opts = {})

/** Wheel on edge on a 3x3 stand, its disc in the z+1 plane: a ring of iron bars round a spruce fence hub. Takes y..y+2. */
export function wheelStand(g, x, y, z, opts = {})

/** Sack stack 2x2 at y..y+1: hay bales, with white wool on two diagonal tops. */
export function sackStack(g, x, y, z, opts = {})

/** A bed at foot [x,y,z], head one step toward facing (against a solid wall). Places nothing unless the bed fits:
 *  both cells air, the wall past the head solid, the 2 cells above foot and head clear, and the 2-high lane past the
 *  foot (the cells behind it at y and y+1) clear. Returns { placed: 2 } or { placed: 0, refused: [the blocking cells] }. */
export function bedAt(g, [x, y, z], facing = "north", colour = "red")
```

### vocab/h2.mjs

```js
// Vocabulary, batch 2 (plan.md VOCABULARY): ringFence, wagonDoor, louvre, ventSlot, belfry, slatCrib, cart,
// tobaccoTier, jobSite. Each helper plans its cells from its arguments, then writes only the planned cells that are
// air (wagonDoor's leaves and lintel may also replace the wall boards under { replaceWall: true }). It returns
// { placed, skipped }, skipped being the "x,y,z" cells that were already taken.

/** Plot i's ring: spruce_fence y1 round x 12i / 12i+11 and z 5 / z 18, a 2-wide closed gate on the front (z 5),
 *  and a lantern post at each front corner (fence y1..3, standing lantern y4). Only on the ring. */
export function ringFence(g, i)

/** Folded board doors of the gin's wagon bay. (x, y, z) = the clear opening's low corner on the wall (u = 0, bottom
 *  row); facing = the way the wall looks. Lintel y5 across the jambs, and spruce_trapdoor leaves at u -2..-1 and 4..5
 *  (y1..4) lying flat on the wall. The clear opening itself is left as it is. */
export function wagonDoor(g, x, y, z, facing, { replaceWall = false } = {})

/** w open spruce_trapdoors in a row across a wall plane, from (x, y, z) along the wall (x for a north/south wall,
 *  z for east/west). face = the way the wall looks. */
export function louvre(g, x, y, z, face, w)

/** A column of open spruce_trapdoors, y3..9, in the wall plane at (x, z); face = the way the wall looks. */
export function ventSlot(g, x, z, face)

/** Open belfry on a 4 x 4 tower at x0..x0+3, z0..z0+3, storey y0..y0+1: calcite corner posts, 2-wide openings on
 *  every face (louvres in the lower course), and the bell hung from the deck above at its centre. */
export function belfry(g, x0, y0, z0)

/** Corn crib on piers, 3 wide x 8 long from (x0, z0): cobblestone piers y1 with air between, oak floor y2, stripped
 *  oak corner posts and bamboo slats on all four faces y3..7. The front hatch is left for the openings part. */
export function slatCrib(g, x0, z0)

/** Cart in a shed: bed of 8 oak_trapdoors (2 wide x 4 long) at (x0, y, z0), wheels upright on the bed's middle
 *  row, and two fence shafts out at the front. facing = the way the cart points (north/south: long axis z). */
export function cart(g, x0, y, z0, facing)

/** Tobacco tiers in a barn: stripped_spruce_log poles along x (x0..x0+3) at each tier height, on rows z0, z0+2, z0+4,
 *  with persistent oak_leaves hung in the air under each pole (x0+1, x0+2). */
export function tobaccoTier(g, x0, z0, tiers = [5, 7, 9])

/** One job-site block at (x, y, z). facing: the way the block faces (and the lane in front of it). room: the
 *  room box [x0, y0, z0, x1, y1, z1] from rooms.json it must fit in. The 2-high column in front of it stays clear. */
export function jobSite(g, block, [x, y, z], { facing = "north", room = null } = {})
```

### vocab/h3.mjs

```js
// Polarton kit vocabulary, part h3 (plan.md VOCABULARY): slabRamp, hayDoor, doorPair, porchDeep, spireCap,
// picketYard, baleStack, chimney, yardBench. Every helper takes its position (and facing where it has one) and
// writes only its own footprint. Writes go into air; a cell that is not air is refused and returned in `refused`.
// The two openings (hayDoor, doorPair) cut their own hole in the shell wall, because plan.md's OPENINGS are the
// shell's holes and the frame, leaves, lintel and transom are written into them; they say so in their comments.

/** Bottom slabs on the ramp row (z) at the floor's y, then a 2-long full-block landing (z+1..z+2) level with the floor.
 *  Only floorY 0 (grade, level gravel: no ramp) and 1 (raised floor) are in plan.md; anything else throws. */
export function slabRamp(g, x, z, width, floorY, { block = "cobblestone" } = {})

/** Hay door: a 2-wide, 2-high opening at (x, y, z) in the wall plane (cut clear), with an open spruce trapdoor leaf
 *  folded flat on each side of it (u = -1 and u = 2), both halves of each leaf. */
export function hayDoor(g, x, y, z, facing = "north")

/** Double door: two 1-wide doors side by side from (x, y, z), lower and upper halves each, hinges left and right, and
 *  a glass_pane transom over both at y + 2. The doors cut their own opening in the wall (the shell leaves it open). */
export function doorPair(g, x, y, z, facing = "north", block = "mangrove_door")

/** Deep porch in front of a house. (x, y, z) is the deck corner at the house wall (out 0); the porch runs width cells along
 *  the wall and depth cells out toward facing. Deck of mangrove planks at y; spruce fence rail along the front edge at
 *  y + 1 with four posts up to the beam at y + 4; upside-down stair brackets under the beam at the two end bays; a
 *  mangrove beam along the front; a shed roof of stairs on the front edge, slabs behind. */
export function porchDeep(g, x, y, z, facing = "north", { width = 8, depth = 3 } = {})

/** Stepped spire of deepslate tiles: each row is `size` square minus one cell per side per row above the one below
 *  (rows at y, y+1, ...), stopping where the tower runs out of width (noted). A lightning rod on the last row, and a
 *  spruce-fence cross (two posts and an arm) above it. (x, y, z) is the tower's top footprint corner. */
export function spireCap(g, x, y, z, { size = 4, rows = 6 } = {})

/** Picket fence round a yard box [x0, y0, z0, x1, y1, z1]: pale oak fence on the box's edge cells, y0..y1, arms
 *  connected to the neighbouring pickets. The inside of the box is left as it is (no gate: the caller places it). */
export function picketYard(g, box)

/** Hay bale stack: a 3 x 3 footprint from (x, y, z) at y, `height` layers up (hay_block, axis y). */
export function baleStack(g, x, y, z, { height = 1 } = {})

/** Exterior chimney set into the wall (plan.md RESERVED), through the library's chimney(). The library's writes are
 *  dry-run first: if any cell is not air (other than the mouth and the lintel above it, which cut the wall) nothing is
 *  built and the cells come back refused. The course just under `top` takes the band block (plan.md's deepslate band). */
export function chimney(g, { wall, into, top, material = "bricks", band = "deepslate_bricks", ...rest })

/** Yard bench: two spruce stairs side by side from (x, y, z) along the wall, facing `facing` (plan: south). */
export function yardBench(g, x, y, z, facing = "south")
```

### vocab/h4.mjs

```js
// Polarton kit vocabulary, group h4 (plan.md VOCABULARY): boardWall, hoistBeam, shutterPair, porchWrap, bayWindow,
// headstone, woodRick, flight.
//
// Every helper takes its own position (and facing, where it has one) as arguments. It writes only inside the
// footprint it was given and only into air: an occupied cell is refused and listed, never overwritten. The one
// exception is an option that says carve: true (the stair joiner cutting a floor for a flight's headroom).
// Returns { placed, refused } with refused = [[x, y, z, block, reason], ...]. flight is all-or-nothing: a stair with
// a missing step is a broken route, so it writes nothing when any required cell is refused.
//
// Blocks are plan.md PALETTE ids, checked with `mcd blocks --check`. Not used: polished_andesite_wall and
// calcite_slab (not blocks in 26.3); headstones use polished_andesite instead.

/**
 * Board-and-batten wall over box (inclusive, one cell thick): planks field, post-coloured posts at both ends of the
 * run and battens every `batten`-th column (vertical), beam rows along the run at beams (default: the box's bottom
 * and top rows). leave: boxes that stay as they are (openings the shell left empty).
 */
export function boardWall(g, box, { plank = "spruce_planks", post = "stripped_spruce_log", batten = 3, beams = null, leave = [] } = {})

/**
 * Hoist beam: a beam of `len` cells along z from (x, y, z0), an iron chain hanging from its first cell, a hay bale on the chain.
 */
export function hoistBeam(g, x, y, z0, { len = 3, beam = "stripped_spruce_log" } = {})

/**
 * Shutters either side of a window. (x, y, z) is the window's cell in the wall; the two shutters stand one cell in front
 * of the wall (on the face side), one cell either side of it, `height` cells tall, open and lying flat. The window itself
 * is not placed here. face: the way the wall looks; wood: the trapdoor wood (spruce -> spruce_trapdoor).
 */
export function shutterPair(g, x, y, z, face, wood = "spruce", { height = 2 } = {})

/**
 * Wraparound porch with its own roof. Footprint: the front leg is z0..z0+1 across x0..x1, the east leg is x1-1..x1 from
 * z0+2 to z1 (the plan's owner porch). Deck at y; posts (calcite) at y+1..y+3 on the front every 3 and at x1 every 4 along
 * the east, corners included; pale_oak beam at y+4; spindle frieze (closed top trapdoors) under the beam between posts;
 * balustrade (pale_oak_fence) at y+1 except the posts and gap = [xa, xb] on the front; copper roof at y+5: stairs on the
 * outer edges (falling outward), flat slabs inside.
 */
export function porchWrap(g, { x0, x1, z0, z1, y = 1, gap = null } = {})

/**
 * Bay window on the front plane z (one cell thick): brick corners at x0 and x1 from y0 to y1; between them glass in the
 * glass row ranges (default y0+1..y0+2 and y0+6..y0+7, the owner's y 3..4 and 8..9), a calcite panel over the panel range
 * (default y0+3..y0+5, y 5..7), a smooth stone sill (top slab) on y0, bricks on the top row.
 */
export function bayWindow(g, { x0, x1, z, y0, y1, glass = null, panel = null } = {})

/**
 * Headstone at (x, y, z) with a coarse dirt mound one cell in front (toward the lane, -z). kind "low": a polished andesite
 * slab; "tall": two polished andesite cells stacked (the palette's polished_andesite_wall is not a block in 26.3).
 */
export function headstone(g, x, z, kind = "low", y = 1)

/**
 * Cordwood rick: logs laid across the axis over the whole box (inclusive). Default: stripped oak logs along x.
 */
export function woodRick(g, box, { log = "stripped_oak_log", axis = "x" } = {})

/**
 * A straight flight of stairs a player walks up (the build library's rule, as a helper): from = the first step's cell
 * (standing on the lower floor), facing = the way you walk up, to = the y of the UPPER FLOOR's block layer (the top step
 * sits in it, so the floor above is cut where the flight passes). Headroom of two cells over every step, an upside-down
 * stair under each step as a stringer (optional: only where air). width runs to the right of facing.
 * Needs carve: true when the flight passes a floor that is already built (the top step replaces its floor block).
 * Returns { placed, refused, steps, landing: [x, y, z] feet on the upper floor, notes }.
 */
export function flight(g, { from: [x, y, z], facing, to, material = "spruce", width = 1, carve = false })
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
walk between its openings passes). With `street` in rooms.json it also walks the **way in**, street to main door,
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

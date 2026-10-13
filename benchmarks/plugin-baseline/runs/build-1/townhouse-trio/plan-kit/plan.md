# Townhouse trio: plan (architect)

Identity: a Victorian terrace of three. Two red-brick end houses (A west, C east) with canted cream-stone bay
windows and black slate mansards, set either side of a taller cream-stucco centre house (B) with a quartz portico,
a balcony and a flat Italianate parapet with a bracketed cornice. All three share one plinth and one stone string
course, and B carries the cornice line of A and C across its face. A and C mirror each other about x=15.
Doors are painted differently: A teal (warped), B dark oak, C red (crimson).

Coordinates: x runs along the street (west to east), y up, z from the street (north, z=0) to the garden (south).
Ground blocks are at y=0 and people walk at y=1. The roof overhang stays inside the lot, so the grid never shifts.

## SITE

| item | x0..x1 | y0..y1 | z0..z1 | notes |
|---|---|---|---|---|
| Lot | 0..30 | 0..31 | 0..34 | 31 wide, 35 deep |
| Ground (whole lot) | 0..30 | 0 | 0..34 | grass, with patches as noted |
| Road | 0..30 | 0 | 0..4 | andesite with gravel patches, running along x |
| Kerb | 0..30 | 0 | 5 | smooth stone (`smooth_stone`), 1 row |
| Pavement | 0..30 | 0 | 6..8 | polished andesite flags |
| Front areas (stoops, bays, planting) | 3..27 | 0..12 | 9..11 | see stoops, bays and portico below |
| House A body (west, brick) | 3..11 | 1..17 | 12..24 | walls; x=11 is the A/B party wall |
| House B body (centre, stucco) | 11..19 | 1..22 | 12..24 | x=11 and x=19 are shared party walls; B rises 5 higher |
| House C body (east, brick) | 19..27 | 1..17 | 12..24 | x=19 is the B/C party wall |
| A canted bay | 7..10 | 1..12 | 10..11 | z=11 row x7..10, z=10 row x8..9 only (x7 and x10 at z=10 stay empty: the cants); 2 storeys plus a flat top at y=12 |
| C canted bay (mirror of A) | 20..23 | 1..12 | 10..11 | z=11 row x20..23, z=10 row x21..22 only |
| A stoop | 4..6 | 1..2 | 9..11 | z=9: stairs at y=1 (facing south, up); z=10: stairs at y=2 (facing south); z=11: landing block at y=2 |
| C stoop | 24..26 | 1..2 | 9..11 | same as A |
| B stoop inside the portico | 14..16 | 1..2 | 9..11 | z=9 stairs y=1, z=10 stairs y=2, z=11 landing x13..17 at y=2 |
| B portico | 13..17 | 1..8 | 9..11 | pedestals (13,1..2,9) and (17,1..2,9); quartz columns (13,3..6,9) and (17,3..6,9); cheeks x13 and x17 at z=10..11 y1..2; entablature x13..17 y=7 z9..11; balcony rail y=8 on its north edge z=9 and sides x13 and x17 |
| Chimney stack A/B | 10..12 | 1..28 | 18..19 | brick, on the A/B party wall from its own footing; fireplaces open into A (x=10 face) and B (x=12 face) |
| Chimney stack B/C | 18..20 | 1..28 | 18..19 | brick, on the B/C party wall; fireplaces into B (x=18) and C (x=20) |
| Rear gardens A / B / C | 4..10 / 12..18 / 20..26 | 0..2 | 25..34 | one garden per house |
| Garden walls | x=3, 11, 19, 27 (z25..34) and z=34 (x3..27) | 1..2 | | brick, 2 high, stone-brick-slab coping; a spruce gate in the back wall z=34 at x=7, 15, 23 |
| Back doors' steps | 5 / 15 / 25 | 1..2 | 25 | one stair at y=1 (facing north, up), landing implied by floor y=2 |
| Street trees | 2, 15, 28 | 1..7 | 7 | in the pavement edge (podzol pit at y=0): 4-high oak trunk, crown 5 wide y4..7 |
| Lamp posts | 9, 21 | 1..4 | 8 | black fence posts with a lantern on top (y=4) |

Lot edges outside the terrace (x0..2 and x28..30, z9..34) are grass with coarse dirt and a gravel side path along x=1
and x=29 to the back gardens.

## ROOFS

| roof | form | tool | footprint (x0,z0,x1,z1) | starts y | top y | notes |
|---|---|---|---|---|---|---|
| A | mansard, `townhouse` preset (`dark-slate`, stone dentil cornice, iron-bar crest) | `$MCD roof` | 3,12,11,24 | 18 | 23 | `front: north`, one gable dormer centred on A (x=7) on the north face; `keep` the whole B volume x11..19 and both chimney stacks |
| C | same as A | `$MCD roof` | 19,12,27,24 | 18 | 23 | dormer at x=23; same keeps |
| B | flat with a parapet, `modern` preset with `material: slate` | `$MCD roof` | 11,12,19,24 | 23 | 24 | parapet y23..24 with coping and an iron-bar rail; keep the chimney stacks |
| B crown cornice | bracketed cornice | by hand (part) | x11..19, z=11 | 21..22 | 22 | quartz stairs upside-down along z=11 at y=22 (1 proud); quartz brackets (upside-down quartz stairs) at y=21, z=11, x=12, 14, 16, 18 |
| Bay tops A and C | flat, leaded | by hand | the bay cells | 12 | 12 | `smooth_stone_slab` deck with a quartz-slab edge; reads as a lead flat with stone coping |
| Portico top | flat balcony | by hand | x13..17 z9..11 | 7 | 8 | smooth quartz entablature at y=7, iron-bar rail at y=8 |

Tested on a mock shell: A and C each read as a small mansard with a dormer (overhang 1 on every side, no warnings),
and B's taller flat front stands between them, so the row reads as three houses. B's roof prints
`ROOF_SINGLE_MATERIAL` for its deck: the deck is hidden behind the parapet, so leave the warning. A's and C's east and
west overhangs on the B side are refused by the `keep` and die into B's wall: that is right, B's wall stands above them.
The chimney stacks rise through A's and C's mansard slopes and past B's parapet to y=28, at least 4 above every roof
surface they pass. Roofs and stacks meet: the roof tool closes round the kept stack cells.

Chimney tops: band of `deepslate_bricks` at y=26, cap at y=28 of `stone_brick_slab` stepping out 1 on every side (x9..13 / x17..21,
z17..20), with two lit campfires (`lit: true`, `signal_fire: false`) in the flue cells at y=28: x=11 z=18..19 and x=19 z=18..19.
Flues of air from y=20 to y=27 at x=11, z=18..19 and x=19, z=18..19.

## FACADES

Front faces (north, z=12, all three flush). Base / middle / top:

| zone | A and C (brick) | B (stucco) |
|---|---|---|
| Plinth y1..2 | `stone_bricks`, one shared course along x3..27 | same |
| Ground storey y3..6 | brick; door on the outer side, canted bay on the inner side | sandstone; portico with door at the centre, a window each side |
| String course y=7 | `cut_sandstone` band, flush, x3..27 except where the bays and portico pass | carried across B in `smooth_quartz` |
| First storey y8..11 | brick; window over the door; bay continues | sandstone; French door onto the portico balcony, a window each side |
| Second storey y13..16 | brick; two windows | sandstone; three windows |
| Eave y=17 | roof preset's stone dentil cornice (A, C) | B carries the same line: a `stone_brick_slab` course (top half) at y=17, 1 proud at z=11 |
| B third storey y18..21 | (mansard with dormer) | sandstone; three short windows |
| B crown y21..24 | | quartz brackets y=21, quartz cornice y=22, parapet y23..24 |

Ornament by position and depth:

| element | where | depth | material |
|---|---|---|---|
| Quoins, outer corners | x=3 and x=27, z=12, y3..16; pairs of 2 courses on, 1 off; long face 2 cells on the front (x3..4 / x26..27), short face 1 cell | flush | `smooth_sandstone` |
| Party-wall pilaster strips | x=11 and x=19, z=12, y3..22: the column between houses | flush, framing B | `cut_sandstone`; it separates the three houses on the face |
| Window sills | under every front window, y = window base -1, z=11 | +1 | `smooth_sandstone_slab` (top) on A/C; `quartz_slab` (top) on B |
| Window heads | over every A/C window, y = window top +1 | flush | `cut_sandstone` lintel, 1 wider each side than the window (a keystone look); on B `smooth_quartz` |
| Bay windows | A and C bays, ground and first storeys | bay +2 | body `smooth_sandstone`; the corner cells below sills and the y=7 band in `cut_sandstone`; glazed front and cants |
| Door hoods A, C | x4..6 (A) / x24..26 (C), y=6, z=11 | +1 | `quartz_slab` (top) on two upside-down `quartz_stairs` brackets at (4,5,11),(6,5,11) / (24,5,11),(26,5,11) |
| Portico B | see SITE | +3 | `quartz_pillar` columns (axis y), `smooth_quartz` entablature, `iron_bars` balcony rail |
| B cornice | y21..22, z=11 | +1 | `quartz_stairs` upside-down (facing south) on brackets |
| Stoop railings | west of A stoop x=3 and east of C stoop x=27, z9..11, one above each tread | | `polished_blackstone_wall` |
| Area railings | z=9: x7..10 (A), x20..23 (C), x12 and x18 (B); 1 high at y=1 | | `iron_bars` (front-garden railings) |
| Window boxes | under the second-storey windows of A and C | +1 | spruce trapdoor fronts with flowers (later trade) |

Side faces (x=3 west, x=27 east): brick, quoins at the front corner, plinth course carried round, the string course
at y=7 carried round, two windows per storey (see OPENINGS). B's exposed side above y=17 (x=11 and x=19, z12..24,
y18..22) shows over the mansards: `smooth_sandstone`, with the cornice returned along it at y=22 (x=10 / x=20).

Rear faces (z=24): brick on A/C and sandstone on B, plinth course, plainer windows, a back door per house.

## MATERIALS

| role | block |
|---|---|
| A and C walls | `bricks` |
| B walls | `smooth_sandstone` |
| Bays, quoins, sills (A, C) | `smooth_sandstone`, `smooth_sandstone_slab` |
| String course, lintels, party-wall pilasters | `cut_sandstone` |
| B trim, portico, cornice | `smooth_quartz`, `quartz_pillar`, `quartz_stairs`, `quartz_slab` |
| Plinth | `stone_bricks` |
| B eave line course | `stone_brick_slab` |
| Mansard roofs | `dark-slate` palette (preset `townhouse`: deepslate tiles, polished blackstone brick, stone brick dentils) |
| B roof deck / coping | preset `modern` with `slate` palette, smooth stone coping |
| Chimneys | `bricks`, band `deepslate_bricks`, cap `stone_brick_slab` |
| Glass | `glass_pane` |
| Doors | A `warped_door`, B `dark_oak_door`, C `crimson_door`; back doors `spruce_door` |
| Railings | `iron_bars` (areas, balcony), `polished_blackstone_wall` (stoops) |
| Road / kerb / pavement | `andesite` (gravel patches) / `smooth_stone` / `polished_andesite` |
| Ground | `grass_block`, with `coarse_dirt` and `podzol` patches; garden paths `dirt_path`, gravel side paths |
| Floors inside | `spruce_planks` (A, C), `dark_oak_planks` (B) |

All ids checked with `$MCD blocks --check`. The colours read as: warm red brick and cream stone, white quartz, black
slate; the red/cream/black contrast is the scheme.

## OPENINGS

All windows are 1 wide unless stated, in the 1-thick wall at the given face; the glazier sets panes in the wall plane.
Mirror pairs: C's x = 30 - A's x.

| house | face | opening | x | y | z |
|---|---|---|---|---|---|
| A | north | front door (2 high) + glass transom | 5 | 3..4 door, 5 transom | 12 |
| A | north | bay opening into the room (open, no glass: the bay is part of the room) | 7..10 | 3..6 and 8..11 | 12 |
| A | north | bay front windows, 2 wide | 8..9 | 3..5 and 8..10 | 10 |
| A | north | bay cant windows | 7 and 10 | 3..5 and 8..10 | 11 |
| A | north | first-floor window over door | 5 | 8..10 | 12 |
| A | north | second-floor windows | 5; 8..9 (2 wide) | 13..15 | 12 |
| A | west (x=3) | side windows | z=15 and z=21 | 3..5, 8..10, 13..15 | x=3 |
| A | south | back door | 5 | 3..4 | 24 |
| A | south | back windows | 8..9 (2 wide) ground; 5 and 8..9 above | 3..5, 8..10, 13..15 | 24 |
| A | roof | dormer window (roof tool) | 7 | 19..20 | 13 |
| B | north | front door (2 high) + fanlight transom | 15 | 3..4 door, 5 transom | 12 |
| B | north | ground windows | 13, 17 | 3..5 | 12 |
| B | north | French door onto the balcony + transom | 15 | 8..9 door, 10 transom | 12 |
| B | north | first-floor windows | 13, 17 | 8..10 | 12 |
| B | north | second-floor windows | 13, 15, 17 | 13..15 | 12 |
| B | north | third-floor windows | 13, 15, 17 | 18..20 | 12 |
| B | west/east above roofs | side windows | z=15 and z=21 | 19..20 | x=11 and x=19 |
| B | south | back door | 15 | 3..4 | 24 |
| B | south | back windows | 13, 17 ground; 13, 15, 17 above | 3..5, 8..10, 13..15, 18..20 | 24 |
| C | all | mirror of A (door x=25, bay x20..23, bay front x21..22, cants x20 and x23, side face x=27, dormer x=23) | | | |

Interior doorways (for the room designer): stairs and rooms open freely; the party walls x=11 and x=19 have no openings.

## RESERVED

The shell leaves these cells as air; later parts fill them.

| cells | for |
|---|---|
| Fireboxes: (10, 3..4, 18..19) A side and (12, 3..4, 18..19) B side; (18, 3..4, 18..19) and (20, 3..4, 18..19) | hearths (campfire at the back of the box, lintel above), chimney builder |
| Flues (11, 5..27, 18..19) and (19, 5..27, 18..19) | air flue up the stack middle; the stack's x=10/12 and 18/20 sides are masonry above y=5 |
| Portico columns (13, 3..6, 9) and (17, 3..6, 9) | quartz pillars on the pedestals |
| Stair wells (each house, against the party wall behind the stack): A x9..10 z20..23, B x12..13 z20..23, C x20..21 z20..23, through floors y=7, 12 and (B) 17 | flights by the stair joiner (4 steps per storey of 5, run along z, rising south; turn at a landing). A's and C's attic (mansard storey) is reached by a ladder at x=4 / x=26, z=23 |
| Window-box cells y=12, z=11, under A/C second-floor windows | window boxes |
| Bay deck tops y=12 | slab decks (bay tops) |
| Garden beds A/B/C z27..33 inner 2 cells each side of the path | planting |

## FLOORS

| level | floor block y | room air y | A interior | B interior | C interior |
|---|---|---|---|---|---|
| Ground (raised) | 2 | 3..6 | x4..10, z13..23 + bay x7..10 z10..11 | x12..18, z13..23 | x20..26, z13..23 + bay x20..23 z10..11 |
| First | 7 | 8..11 | same + bay | same (balcony on the portico x13..17 z9..11 at y=8 through the French door) | same + bay |
| Second | 12 | 13..16 | x4..10 z13..23 | x12..18 z13..23 | x20..26 z13..23 |
| Attic / third | 17 | 18..20 (A, C: inside the mansard, usable x5..9 z14..22) / 18..21 (B) | mansard attic with dormer | full third storey | mansard attic with dormer |

Suggested use (the room designer decides): ground front parlour + back kitchen with the hearth on the party wall;
first floor drawing room (front, the bay) and bedroom; second floor bedrooms; attic a box room or maid's room. B's
balcony is its showpiece. Each house is reached only from its own stoop; no openings between houses.


---
# DESIGNER SECTIONS

## PALETTE

| role | block ids | shape variants / states |
|---|---|---|
| A/C walls | `bricks` | `brick_stairs`, `brick_slab` (lintels at hearths), `brick_wall` for garden coping alt |
| B walls, bays, quoins | `smooth_sandstone` | `smooth_sandstone_slab`, `smooth_sandstone_stairs` |
| String course, pilasters, lintels | `cut_sandstone` | `cut_sandstone_slab` |
| B trim | `smooth_quartz`, `quartz_pillar` (axis y), `quartz_stairs` (upside-down: half top), `quartz_slab` (top) | |
| Plinth, steps | `stone_bricks` | `stone_brick_stairs`, `stone_brick_slab` |
| Roof (preset) | `dark-slate` / `modern` slate: deepslate tiles, `polished_blackstone_bricks`, `smooth_stone` coping | via `$MCD roof` only |
| Chimney | `bricks`, `deepslate_bricks`, `stone_brick_slab` | `campfire` lit true signal_fire false facing north |
| Glass | `glass_pane` | connect states along wall |
| Doors | `warped_door`, `dark_oak_door`, `crimson_door`, `spruce_door` | half lower/upper, facing north (front) / south (back), hinge left |
| Railings | `iron_bars`, `polished_blackstone_wall` | |
| Street | `andesite`, `gravel`, `smooth_stone`, `polished_andesite` | |
| Ground | `grass_block`, `coarse_dirt`, `podzol`, `rooted_dirt`, `dirt_path` | |
| Floors | `spruce_planks` (A,C), `dark_oak_planks` (B) | |
| Stairs/fittings | `spruce_stairs`, `spruce_fence`, `ladder`, `spruce_trapdoor`, `spruce_fence_gate` | |
| Decor | `lantern`, `iron_chain`, `flower_pot`, `potted_poppy`, `potted_cornflower`, `poppy`, `allium`, `azalea`, `oak_log`, `oak_leaves` (persistent true), `black_stained_glass_pane` | |

All ids checked with `$MCD blocks --check`; `black_wall` is not a block (use `polished_blackstone_wall`).

## VOCABULARY

- `wallCourse(g, x0,x1, y0,y1, z, block)` — one-thick wall slab, leaves openings for later.
- `partyPilaster(g, x)` — `cut_sandstone` column at x, z=12, y3..22 (to 17 on A/C side).
- `stringCourse(g)` — y=7: `cut_sandstone` x3..27 z=12 (quartz x11..19), round x=3,x=27 faces.
- `quoinColumn(g, x, side)` — `smooth_sandstone`, 2 courses long (2 cells on front) / 1 off, y3..16.
- `windowDress(g, x, y0, y1, z, w, block)` — pane fill `glass_pane` connected, `smooth_sandstone_slab`/`quartz_slab` top sill at y0-1 z-1 (front only), `cut_sandstone`/`smooth_quartz` head at y1+1 one wider each side.
- `cantedBay(g, x0)` — A x7..10 / C x20..23: z=11 full row, z=10 centre two cells, `smooth_sandstone`, panes y3..5, y8..10, `cut_sandstone` band y=7, y=12 `smooth_stone_slab` deck with `quartz_slab` edge on z=10/cants.
- `portico(g)` — pedestals, pillars, cheeks, entablature, balcony rail per elements.md.
- `stoop(g, x0)` — three-cell stairs/landing per SITE; `stone_brick_stairs` facing south.
- `doorFit(g, x, z, block, facing)` — both halves, hinge left, transom pane above.
- `doorHood(g, x0)` — two upside-down quartz stairs + quartz slab top.
- `bracketCornice(g)` — B cornice and brackets.
- `chimneyStack(g, x0)` — 3x2 stack y1..28 with air flue, band y=26, stepped cap y=28, two lit campfires.
- `hearth(g, x, side)` — firebox 1 deep ×2 wide: `stone_bricks` floor y2? (floor y=2 already), lit `campfire` at back cell y=3, `brick_stairs` upside-down lintel y=5; opening toward room.
- `stairFlight(g, x, z0, floorY, wood)` — 4–5 `spruce_stairs` facing south, landing, `spruce_fence` rail.
- `atticLadder(g, x, z)` — `ladder` y18..20 facing east/west off wall, open `spruce_trapdoor` hatch.
- `windowBox(g, x, y, z)` — `spruce_trapdoor` flat, `flower_pot`s above.
- `areaRailing(g, x0, x1)` — `iron_bars` y=1 z=9.
- `gardenWall(g)`, `gardenBed(g, x0)`, `streetTree(g, x)`, `lampPost(g, x)`.

## ROOMS

Boxes are inner air; each house keeps its stair well (see RESERVED) free — furnish around it. No partition walls: "parlour/kitchen" are zones of one storey room.

| room | box | notes |
|---|---|---|
| A ground | [4,3,13,10,6,23] | parlour front with bay (x7..10 z10..11), kitchen back with hearth (10,3,18..19); spruce floor |
| A drawing room | [4,8,13,10,11,23] | bay, fireplace, bedroom corner back |
| A bedrooms | [4,13,13,10,16,23] | two beds |
| A attic | [5,18,14,9,20,22] | box room, dormer, ladder at (4,18..20,23) |
| B ground | [12,3,13,18,6,23] | formal hall, dark oak, hearths both sides |
| B drawing room | [12,8,13,18,11,23] | French door to balcony at (15,8..9,12) |
| B bedrooms | [12,13,13,18,16,23] | |
| B third floor | [12,18,13,18,21,23] | library/study, tall windows |
| C ground / drawing / bedrooms / attic | mirror of A: [20,3,13,26,6,23], [20,8,13,26,11,23], [20,13,13,26,16,23], [21,18,14,25,20,22] | ladder at (26,18..20,23) |

Ways in: A door (5,3..4,12) from (5,3,11); B (15,3..4,12) from (15,3,11); C (25,3..4,12) from (25,3,11); back doors (5/15/25,3..4,24). Stairs between floors in the wells.

## PARTS

1. Masonry shell — `parts/shell.mjs`: all walls, plinth, party walls, floors y=2,7,12,17, quoins, string course, pilasters, bays (body), leaves openings and wells.
2. Stairs — `parts/stairs.mjs`: stairFlight ×3, atticLadder ×2.
3. Roofs — `parts/roofs.mjs`: `$MCD roof` A, B, C, B cornice, eave course, bay decks, portico top.
4. Chimneys & hearths — `parts/chimneys.mjs`.
5. Fenestration & front — `parts/front.mjs`: glazing, doors, hoods, portico, stoops, railings, window boxes, lanterns.
6. Grounds — `parts/grounds.mjs`: street, trees, lamp posts, gardens, walls, gates.

## Notes for workers
- Leave all openings and reserved cells as air until their part. Roof overhang stays inside the lot.
- Run `$MCD check` and `$MCD walk build.nbt --rooms rooms.json`.
- Mirror A to C about x=15; do not change the architect's coordinates.

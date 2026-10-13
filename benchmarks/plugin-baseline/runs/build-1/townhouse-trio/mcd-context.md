# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
```

### elements.md

```markdown
# Required elements: townhouse trio

Brief: "A townhouse trio: three attached townhouses or small apartment buildings in a row." Coordinates from plan.md (x street, y up, z from street north z=0 to garden). Mirror: C x = 30 - A x.

- [ ] **Three attached houses, one row** (A brick, B stucco, C brick) — shared plinth y1..2 `stone_bricks` x3..27 z12; party walls x=11, x=19 (1 thick, full height, no openings). Vocab `wallCourse`, `partyPilaster`. Part 1.
- [ ] **Shared stone string course** y=7 x3..27 z12 (`cut_sandstone` on A/C, `smooth_quartz` on B), returned round side faces x=3, x=27. Vocab `stringCourse`. Part 1.
- [ ] **Brick end houses A/C** `bricks` walls y3..16, `smooth_sandstone` quoins x3..4 / x26..27 (2 courses on, 1 off), sills `smooth_sandstone_slab` top, lintels `cut_sandstone` 1 wider each side. Vocab `quoinColumn`, `windowDress`. Part 1 + 5.
- [ ] **Canted bay windows A and C** (x7..10 / x20..23, z10..11, y1..12): walls `smooth_sandstone`; front z=10 x8..9 (A), cants z=11 x7, x10; glass `glass_pane` y3..5 and y8..10, sill band `cut_sandstone` y=7, floor/roof of bay: `smooth_stone_slab` deck y=12 edged `quartz_slab`. The cant cells x7,x10 at z=10 stay air. Vocab `cantedBay`. Parts 1 (body), 3 (deck), 5 (panes).
- [ ] **Mansard roofs A and C** `dark-slate` `townhouse` preset, y18..23, dormer gable at x=7 / x=23 on north face, stone dentil cornice, iron-bar crest, overhang 1. Vocab `mansardSpec`. Part 3.
- [ ] **Taller stucco centre house B** `smooth_sandstone` to y=22, parapet y23..24 with `smooth_stone` coping + `iron_bars` rail; `modern`/slate flat deck. Vocab `parapetSpec`. Parts 1, 3.
- [ ] **Bracketed cornice on B** quartz stairs upside-down facing south at y=22 z=11 x11..19; brackets upside-down quartz stairs y=21 z=11 x=12,14,16,18; returned along x=10 / x=20 at y=22. Vocab `bracketCornice`. Part 3.
- [ ] **B eave line** `stone_brick_slab` (top) y=17 x11..19 z=11, carries A/C cornice line across B. Part 3.
- [ ] **Quartz portico + balcony on B** pedestals (13,1..2,9),(17,1..2,9) `smooth_quartz`; `quartz_pillar` axis y (13,3..6,9),(17,3..6,9); cheeks x13,x17 z10..11 y1..2; entablature `smooth_quartz` x13..17 y=7 z9..11; balcony `iron_bars` y=8 along z=9 and x=13, x=17 (z9..11), gap none (French door at (15,8..9,12)). Vocab `portico`. Part 5.
- [ ] **Stoops** A x4..6, C x24..26, B x14..16, z9..11: `stone_brick_stairs` z=9 y1 and z=10 y2 (facing south), landing `stone_bricks` z=11 y2; B landing x13..17. `polished_blackstone_wall` rails x=3, x=27. Vocab `stoop`. Part 5.
- [ ] **Three differently painted doors**: A `warped_door` (5,3..4,12), B `dark_oak_door` (15,3..4,12), C `crimson_door` (25,3..4,12), both halves, facing north (out), hinge consistent; transoms `glass_pane` y=5 (B fanlight). Door hoods A/C: `quartz_slab` top at y=6 z=11 x4..6 / x24..26 on upside-down `quartz_stairs` at (4,5,11),(6,5,11)/(24,5,11),(26,5,11). Vocab `doorFit`, `doorHood`. Part 5.
- [ ] **Windows** every opening in plan OPENINGS glazed `glass_pane` (connected), sills + heads per FACADES; French door B (15,8..9,12) as `dark_oak_door` pair with transom. Vocab `windowDress`. Part 5.
- [ ] **Window boxes** under second-storey windows A/C at y=12 z=11: `spruce_trapdoor` (open, facing north? standing against wall) with `potted_red_tulip`/`poppy` flowers... use `flower_pot`s. Vocab `windowBox`. Part 5.
- [ ] **Area railings** `iron_bars` y=1 z=9 x7..10, x20..23, x12, x18. Part 5.
- [ ] **Two chimney stacks** A/B (x10..12, z18..19) and B/C (x18..20, z18..19), `bricks`, from own footing y1, to y=28; `deepslate_bricks` band y=26; cap `stone_brick_slab` y=28 stepping out 1 (x9..13 / x17..21, z17..20); lit `campfire` at (11,28,18),(11,28,19),(19,28,18),(19,28,19) (smoke). Flue air y5..27. Vocab `chimneyStack`. Part 4.
- [ ] **Four fireplaces** (10,3..4,18..19) A, (12,3..4,18..19) B, (18,..) B, (20,..) C: back firebox, `stone_bricks` floor, lit `campfire` at back (not walked on), lintel upside-down `brick_stairs` y=5 over cells... Vocab `hearth`. Part 4.
- [ ] **Stairs inside each house**: wells A x9..10 z20..23, B x12..13 z20..23, C x20..21 z20..23, floors y=7,12,(B)17; 4–5 `spruce_stairs` per storey rising south, landing, `spruce_fence` rail; ladders (4,18..20,23)/(26,18..20,23) to attics. Vocab `stairFlight`, `atticLadder`. Part 2.
- [ ] **Rear gardens + walls + gates + back doors** per plan; `spruce_door` back doors (5/15/25,3..4,24), steps, brick garden walls 2 high with `stone_brick_slab` coping, `spruce_fence_gate` x=7,15,23 z=34, `dirt_path` central path, beds `coarse_dirt`/flowers. Vocab `gardenWall`, `gardenBed`. Part 6.
- [ ] **Street**: andesite road with gravel patches, `smooth_stone` kerb, `polished_andesite` pavement, street trees x=2,15,28 z=7 (oak log axis y 4 high, persistent leaves y4..7 5 wide, podzol pit), lamp posts x=9,21 z=8. Vocab `streetTree`, `lampPost`. Part 6.
- [ ] **Lighting**: lantern each side of each front door (hanging under hood A/C; on fence arm B at x=13 / 17 z=11?? use portico underside), lamp posts. Part 6 (street) + part 5 (doors).
- [ ] **Rear + side faces**: bricks A/C, plinth, string course, windows per OPENINGS. Part 1 + 5.
```

### rooms.json

```json
{"entrance":[15,3,10],"rooms":[{"name":"A ground","box":[4,3,13,10,6,23]},{"name":"A drawing room","box":[4,8,13,10,11,23]},{"name":"A bedrooms","box":[4,13,13,10,16,23]},{"name":"A attic","box":[5,18,14,9,20,22]},{"name":"B ground","box":[12,3,13,18,6,23]},{"name":"B drawing room","box":[12,8,13,18,11,23]},{"name":"B bedrooms","box":[12,13,13,18,16,23]},{"name":"B third floor","box":[12,18,13,18,21,23]},{"name":"C ground","box":[20,3,13,26,6,23]},{"name":"C drawing room","box":[20,8,13,26,11,23]},{"name":"C bedrooms","box":[20,13,13,26,16,23]},{"name":"C attic","box":[21,18,14,25,20,22]}]}
```

### palette.json

```json
{"roles":{"brick":["bricks","brick_stairs","brick_slab","brick_wall"],"sandstone":["smooth_sandstone","smooth_sandstone_slab","smooth_sandstone_stairs"],"cut_sandstone":["cut_sandstone","cut_sandstone_slab"],"quartz":["smooth_quartz","quartz_pillar","quartz_stairs","quartz_slab","smooth_quartz_stairs","smooth_quartz_slab"],"stone_brick":["stone_bricks","stone_brick_stairs","stone_brick_slab","stone_brick_wall"],"roof":["deepslate_tiles","cobbled_deepslate","polished_deepslate","cracked_deepslate_tiles","polished_blackstone_bricks","smooth_stone","deepslate_tile_stairs","deepslate_tile_slab","polished_deepslate_slab","polished_blackstone_brick_stairs","polished_blackstone_brick_slab","smooth_stone_slab"],"chimney":["bricks","deepslate_bricks","stone_brick_slab","deepslate_brick_slab","polished_deepslate_slab"],"glass":["glass_pane","black_stained_glass_pane"],"door":["warped_door","dark_oak_door","crimson_door","spruce_door"],"railing":["iron_bars","polished_blackstone_wall","polished_blackstone_brick_wall"],"street":["andesite","gravel","smooth_stone","polished_andesite","polished_andesite_slab","smooth_stone_slab"],"ground":["grass_block","coarse_dirt","podzol","rooted_dirt","dirt_path"],"floor":["spruce_planks","dark_oak_planks"],"wood_detail":["spruce_stairs","spruce_slab","spruce_fence","spruce_trapdoor","spruce_fence_gate","oak_log"],"planting":["oak_leaves","azalea","flowering_azalea","poppy","cornflower","allium","oxeye_daisy","flower_pot","potted_poppy","potted_cornflower"]},"objects":["campfire","spruce_stairs","spruce_fence","ladder","spruce_trapdoor","spruce_fence_gate","lantern","iron_chain","flower_pot","potted_poppy","potted_cornflower","poppy","allium","azalea","oak_log","oak_leaves","black_stained_glass_pane","warped_door","dark_oak_door","crimson_door","spruce_door","glass_pane","iron_bars","polished_blackstone_wall","polished_blackstone_brick_wall","spruce_slab","cornflower","oxeye_daisy","flowering_azalea"]}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: builds to a temp file in this directory, then moves it into place.
set -eu
cd "$(dirname "$0")"
tmp="build.tmp.$$.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// Builds the townhouse trio: full-size grid, lot ground, then every part in plan order (each part locks what it writes).
// Usage: node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SIZE, LOT, GRASS_BLOCK } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }

// A part that is not written yet, or does not load, builds as an empty stub (warned), so make.sh still makes a build.
async function partBuild(file) {
  if (!existsSync(file)) { console.warn(`${file}: missing, built as an empty stub`); return () => {}; }
  try { return (await import(pathToFileURL(file).href)).build; }
  catch (e) { console.warn(`${file}: did not load (${e.message.split("\n")[0]}), built as an empty stub`); return () => {}; }
}

// The parts in plan order: shell, stairs, roofs, chimneys, front, grounds, then the twelve rooms.
const PARTS = [
  ["masonry shell", "parts/shell.mjs"],
  ["stairs", "parts/stairs.mjs"],
  ["roofs", "parts/roofs.mjs"],
  ["chimneys and hearths", "parts/chimneys.mjs"],
  ["fenestration and front", "parts/front.mjs"],
  ["grounds", "parts/grounds.mjs"],
  ["room: A ground", "parts/room-1.mjs"],
  ["room: A drawing room", "parts/room-2.mjs"],
  ["room: A bedrooms", "parts/room-3.mjs"],
  ["room: A attic", "parts/room-4.mjs"],
  ["room: B ground", "parts/room-5.mjs"],
  ["room: B drawing room", "parts/room-6.mjs"],
  ["room: B bedrooms", "parts/room-7.mjs"],
  ["room: B third floor", "parts/room-8.mjs"],
  ["room: C ground", "parts/room-9.mjs"],
  ["room: C drawing room", "parts/room-10.mjs"],
  ["room: C bedrooms", "parts/room-11.mjs"],
  ["room: C attic", "parts/room-12.mjs"],
];

const g = new Grid(SIZE);
// Lot ground: grass over the whole lot at y=0; the grounds part lays the road, pavement and patches over it.
g.fill([LOT[0], 0, LOT[2]], [LOT[3], 0, LOT[5]], GRASS_BLOCK);

const list = [];
for (const [name, file] of PARTS) list.push([name, await partBuild(file)]);
// roof.json is absent: the three roofs (A, B, C) have different footprints and runParts takes one roof spec, so the
// roofs part lays them. runParts skips the roof step while roof.json does not exist.
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`wrote ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Palette ids (palette.json only), plan.md site coordinates, and the seeded rng. Coordinates are [x0,y0,z0,x1,y1,z1],
// inclusive: x runs west to east, y up, z from the street (z=0) to the garden. Ground is y=0, people walk at y=1.

// rng(seed): seeded random source returning floats in [0,1); the same seed gives the same sequence.

// ---- palette: roles -----------------------------------------------------------------------------------------------
// brick: A and C walls and garden coping alternates.
export const BRICKS = "bricks";

// brick_stairs: sloped brick cells, hearth lintels.
export const BRICK_STAIRS = "brick_stairs";

// brick_slab: brick half-blocks, hearth lintels.
export const BRICK_SLAB = "brick_slab";

// brick_wall: garden wall alternate.
export const BRICK_WALL = "brick_wall";

// sandstone: B walls, bay bodies, quoins and sills on A and C.
export const SMOOTH_SANDSTONE = "smooth_sandstone";

// sandstone slab: window sills on A and C.
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";

// sandstone stairs: sandstone steps on B.
export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";

// cut sandstone: string course, party-wall pilasters, lintels.
export const CUT_SANDSTONE = "cut_sandstone";

// cut sandstone slab: bay cut band and string-course half-steps.
export const CUT_SANDSTONE_SLAB = "cut_sandstone_slab";

// quartz: B trim, portico entablature, B eave course, window heads on B.
export const SMOOTH_QUARTZ = "smooth_quartz";

// quartz pillar: portico columns and pedestals (axis y).
export const QUARTZ_PILLAR = "quartz_pillar";

// quartz stairs: upside-down brackets for the door hoods and the B cornice.
export const QUARTZ_STAIRS = "quartz_stairs";

// quartz slab: door-hood tops, B sills, bay deck edges.
export const QUARTZ_SLAB = "quartz_slab";

// stone bricks: plinth and steps.
export const STONE_BRICKS = "stone_bricks";

// stone brick stairs: stoop steps.
export const STONE_BRICK_STAIRS = "stone_brick_stairs";

// stone brick slab: plinth half-steps, B eave course, chimney cap, garden-wall coping.
export const STONE_BRICK_SLAB = "stone_brick_slab";

// roof: deepslate tiles of the townhouse mansard (laid by mcd roof).
export const DEEPSLATE_TILES = "deepslate_tiles";

// roof: cobbled deepslate of the mansard mix.
export const COBBLED_DEEPSLATE = "cobbled_deepslate";

// roof: polished deepslate of the mansard mix.
export const POLISHED_DEEPSLATE = "polished_deepslate";

// roof: cracked deepslate tiles of the mansard mix.
export const CRACKED_DEEPSLATE_TILES = "cracked_deepslate_tiles";

// roof: polished blackstone brick, the mansard eave and dentils.
export const POLISHED_BLACKSTONE_BRICKS = "polished_blackstone_bricks";

// smooth stone: B roof coping, kerb, road bed and pavement.
export const SMOOTH_STONE = "smooth_stone";

// deepslate bricks: chimney band at y=26.
export const DEEPSLATE_BRICKS = "deepslate_bricks";

// glass pane: all glazing.
export const GLASS_PANE = "glass_pane";

// black stained glass pane: dark glazing, decor.
export const BLACK_STAINED_GLASS_PANE = "black_stained_glass_pane";

// warped door: A front door (teal).
export const WARPED_DOOR = "warped_door";

// dark oak door: B front and the B French door.
export const DARK_OAK_DOOR = "dark_oak_door";

// crimson door: C front door (red).
export const CRIMSON_DOOR = "crimson_door";

// spruce door: all back doors.
export const SPRUCE_DOOR = "spruce_door";

// iron bars: area railings, balcony rail, side railings.
export const IRON_BARS = "iron_bars";

// polished blackstone wall: stoop railings.
export const POLISHED_BLACKSTONE_WALL = "polished_blackstone_wall";

// andesite: road.
export const ANDESITE = "andesite";

// gravel: road patches and side paths.
export const GRAVEL = "gravel";

// polished andesite: pavement flags.
export const POLISHED_ANDESITE = "polished_andesite";

// grass block: lot ground.
export const GRASS_BLOCK = "grass_block";

// coarse dirt: ground patches.
export const COARSE_DIRT = "coarse_dirt";

// podzol: ground patches and tree pits.
export const PODZOL = "podzol";

// rooted dirt: ground patches.
export const ROOTED_DIRT = "rooted_dirt";

// dirt path: garden paths.
export const DIRT_PATH = "dirt_path";

// spruce planks: floors of A and C.
export const SPRUCE_PLANKS = "spruce_planks";

// dark oak planks: floors of B.
export const DARK_OAK_PLANKS = "dark_oak_planks";

// ---- palette: objects ---------------------------------------------------------------------------------------------
// campfire: lit hearths and chimney fires.
export const CAMPFIRE = "campfire";

// spruce stairs: stair flights in the wells.
export const SPRUCE_STAIRS = "spruce_stairs";

// spruce fence: stair rails.
export const SPRUCE_FENCE = "spruce_fence";

// ladder: attic ladders at x=4 and x=26.
export const LADDER = "ladder";

// spruce trapdoor: attic hatches, window-box fronts.
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";

// spruce fence gate: back-garden gates.
export const SPRUCE_FENCE_GATE = "spruce_fence_gate";

// lantern: door lanterns, lamp-post lanterns, room light.
export const LANTERN = "lantern";

// iron chain: lantern hangers.
export const IRON_CHAIN = "iron_chain";

// flower pot: window boxes and room decor.
export const FLOWER_POT = "flower_pot";

// potted poppy: window boxes.
export const POTTED_POPPY = "potted_poppy";

// potted cornflower: window boxes.
export const POTTED_CORNFLOWER = "potted_cornflower";

// poppy: planting.
export const POPPY = "poppy";

// allium: planting.
export const ALLIUM = "allium";

// azalea: garden planting.
export const AZALEA = "azalea";

// oak log: street-tree trunks.
export const OAK_LOG = "oak_log";

// oak leaves (persistent): street-tree crowns.
export const OAK_LEAVES = "oak_leaves";

// ---- site -------------------------------------------------------------------------------------------------------
// SIZE: full grid size, lot 0..30 x 0..31 x 0..34 (31 x 32 x 35 cells).
export const SIZE = [31, 32, 35];

// LOT: the whole lot.
export const LOT = [0, 0, 0, 30, 31, 34];

// ROAD: andesite road along x, z 0..4.
export const ROAD = [0, 0, 0, 30, 0, 4];

// KERB_Z: smooth-stone kerb row at z=5.
export const KERB_Z = 5;

// PAVEMENT: polished-andesite flags, z 6..8.
export const PAVEMENT = [0, 0, 6, 30, 0, 8];

// FRONT_AREA: stoops, bays, planting in front of the houses.
export const FRONT_AREA = [3, 0, 9, 27, 12, 11];

// HOUSE_A: west brick end house body (x=11 is the A/B party wall).
export const HOUSE_A = [3, 1, 12, 11, 17, 24];

// HOUSE_B: centre stucco house body, 5 higher than A and C (x=11 and x=19 are party walls).
export const HOUSE_B = [11, 1, 12, 19, 22, 24];

// HOUSE_C: east brick end house body (x=19 is the B/C party wall).
export const HOUSE_C = [19, 1, 12, 27, 17, 24];

// PARTY_X: the two party walls, x=11 and x=19.
export const PARTY_X = [11, 19];

// BAY_A: canted bay of A, z=11 row x7..10 and z=10 centre cells only.
export const BAY_A = [7, 1, 10, 10, 12, 11];

// BAY_C: canted bay of C, mirror of A.
export const BAY_C = [20, 1, 10, 23, 12, 11];

// STOOP_A: A front stoop (steps at z=9..10, landing at z=11).
export const STOOP_A = [4, 1, 9, 6, 2, 11];

// STOOP_B: B stoop inside the portico.
export const STOOP_B = [14, 1, 9, 16, 2, 11];

// STOOP_C: C front stoop, mirror of A.
export const STOOP_C = [24, 1, 9, 26, 2, 11];

// PORTICO: B portico, pedestals to balcony rail.
export const PORTICO = [13, 1, 9, 17, 8, 11];

// CHIMNEY_AB: chimney stack on the A/B party wall, to y=28.
export const CHIMNEY_AB = [10, 1, 18, 12, 28, 19];

// CHIMNEY_BC: chimney stack on the B/C party wall, to y=28.
export const CHIMNEY_BC = [18, 1, 18, 20, 28, 19];

// GARDEN_A: rear garden of A.
export const GARDEN_A = [4, 0, 25, 10, 2, 34];

// GARDEN_B: rear garden of B.
export const GARDEN_B = [12, 0, 25, 18, 2, 34];

// GARDEN_C: rear garden of C.
export const GARDEN_C = [20, 0, 25, 26, 2, 34];

// FLOOR_Y: floor-block levels; room air sits one above each.
export const FLOOR_Y = [2, 7, 12, 17];

// STREET_TREE_X: street-tree columns at z=7.
export const STREET_TREE_X = [2, 15, 28];

// LAMP_POST_X: lamp-post columns at z=8.
export const LAMP_POST_X = [9, 21];

// WELL_A: stair well of A, against the party wall (x and z from plan.md; y from the ground floor to the top floor deck).
export const WELL_A = [9, 2, 20, 10, 17, 23];

// WELL_B: stair well of B.
export const WELL_B = [12, 2, 20, 13, 17, 23];

// WELL_C: stair well of C.
export const WELL_C = [20, 2, 20, 21, 17, 23];

// FRONT_DOOR_X: front door column of A, B and C (B's is the centre door).
export const FRONT_DOOR_X = { A: 5, B: 15, C: 25 };

// BACK_DOOR_X: back door column of A, B and C, on z=24.
export const BACK_DOOR_X = { A: 5, B: 15, C: 25 };

// ROOF_FOOTPRINT: x0,z0,x1,z1 of the A, B and C roofs (plan.md ROOFS).
export const ROOF_FOOTPRINT = { A: [3, 12, 11, 24], B: [11, 12, 19, 24], C: [19, 12, 27, 24] };
```

### vocab/h1.mjs

```js
// Part-1 vocabulary from plan.md (VOCABULARY): wallCourse, quoinColumn, portico, doorHood, hearth, windowBox, gardenBed.
// Block ids are plan.md's PALETTE literals; nothing here imports vocab.mjs or the other vocab files.
//
// Contract every helper keeps (the same as h2.mjs):
// - takes its position (and facing) as arguments; nothing is hard-wired to a spot;
// - writes only inside the box it returns as `box`, and only into air, unless opts.over is true (trim laid onto a
//   finished wall: a built wall face may be replaced, ground, sand, floor and path never are). A cell it may not take
//   is counted in `skipped`, never overwritten, so the caller can see it;
// - never writes ground or floor below its own box (y=0 is never owned here);
// - returns { cells: [[x,y,z]...], skipped, box }.

// A wall-plane slab x0..x1 by y0..y1 at z, one block thick. opts.skip(x, y, z) leaves an opening as air for a later part.
export function wallCourse(g, x0, x1, y0, y1, z, block, opts = {})

// A quoin column on a corner: the corner cell at x on the front plane z, y3..16 by default. Courses come in a run of
// three: two long (the corner plus the next cell along the front, away from the corner) and one short (the corner
// only). side: "west" for the x=3 corner (long face runs east), "east" for the x=27 corner (long face runs west).
export function quoinColumn(g, x, side, z, opts = {})

// The portico on a bay: two quartz pillars on pedestals at x0 and x0+4, cheeks, the entablature at y=7 and the balcony
// rail at y=8. The front row is z0; the portico is three deep (z0..z0+2). Nothing between the pillars at y1..2 (the stoop).
export function portico(g, x0, z0, opts = {})

// A door hood over a front door: a quartz slab top across x0..x0+2 at y=6, carried on two upside-down quartz stair
// brackets at x0 and x0+2 (y=5). z is the hood's plane (in front of the wall); the brackets' lips point at the street.
export function doorHood(g, x0, z, opts = {})

// A hearth in a fireplace opening: 1 deep, 2 wide along z (z0, z0+1), bottom at y=3, lintel at y=5. side is the way
// the room lies from the opening ("west" for the A kitchen, "east" for the B hall): the campfire faces the room, the
// lintel's lip points at the room. The cell at z0+1 is firebrick at the back; y=4 stays air.
export function hearth(g, x, z0, side, opts = {})

// A window box on the sill at (x, y, z): a closed spruce trapdoor lying flat, with a potted flower on top.
// Note: the pot stands on a flat trapdoor, which is not a full face; check it in-game.
export function windowBox(g, x, y, z, opts = {})

// Planting for a rear garden bed: the two cells either side of the path column xPath, z0..z1, planted at y=1 on the
// ground layer (the ground part lays the soil; this helper never writes y=0).
export function gardenBed(g, xPath, z0, z1, opts = {})
```

### vocab/h2.mjs

```js
// Part-2 vocabulary from plan.md (VOCABULARY): partyPilaster, windowDress, stoop, bracketCornice, stairFlight,
// areaRailing, streetTree. Block ids are plan.md's PALETTE literals; nothing here imports vocab.mjs or the other vocab files.
//
// Contract every helper keeps:
// - takes its position (and facing) as arguments; nothing is hard-wired to a spot;
// - writes only inside the box it returns as `box`, and only into air, unless opts.over is true (trim laid onto a
//   finished wall). A cell it may not take is counted in `skipped`, never overwritten, so the caller can see it;
// - never writes ground or floor below its own box (y0 is the lowest cell it owns);
// - returns { cells: [[x,y,z]...], skipped, box }.

/**
 * Party-wall trim: cut_sandstone down the front plane (x, z) from y0 to y1. Split the call where the A/C side stops
 * at y=17 (pass y0 18 for the B-only top). Call before the wall, or pass { over: true } on a finished wall.
 */
export function partyPilaster(g, x, z, y0, y1, opts = {})

/**
 * Window dressing on the front wall plane z for an opening x..x+w-1, y0..y1 (left as air by the shell):
 * a glass pane fill (connected east-west), a sill slab on the outside row z-1 at y0-1 (top half), and a head of
 * `block` (cut_sandstone or smooth_quartz) at y1+1, one wider each side. The sill slab defaults from the head block
 * (cut_sandstone -> smooth_sandstone_slab, smooth_quartz -> quartz_slab); opts.sill and opts.pane override them.
 * The head is wall: call it before the wall, or pass { over: true }.
 */
export function windowDress(g, x, y0, y1, z, w, block, opts = {})

/**
 * A stoop: two steps climbing in `facing` (south = toward the house, +z) from z0 and a landing two cells on, all
 * `w` wide from x0 (the landing may be wider: opts.landingX0 / landingX1). Steps are stone_brick_stairs; the step
 * at z0+1 and the landing sit on stone_bricks inside the stoop, so nothing floats. Ground at y0 is never written:
 * the bottom step stands on it (plan: stoop steps at y1 and y2, y0 is the ground).
 */
export function stoop(g, x0, z0, y0, facing, opts = {})

/**
 * Quartz cornice on a front line: upside-down stairs (half top) along x0..x1 at row y, lip toward the street. Brackets
 * are the same stairs one row lower at the columns in opts.brackets (each must lie in x0..x1). `facing` is the way
 * the lip points INTO the wall (south for a cornice on a north-facing front). Call before the wall, or pass { over: true }.
 */
export function bracketCornice(g, x0, x1, z, y, facing, opts = {})

/**
 * One flight in a stair well, rising south (+z) from z0 over `steps` cells (default 4): stair i at (x, floorY-steps+i,
 * z0+i), spruce-style `wood` stairs facing south. The top step is the landing at the well's far end. opts.railX puts
 * a fence one column over (the open side) at each step's height +1; leave it out and the well's other column stays clear.
 * floorY is the upper floor's block y (7, 12, 17 in plan.md).
 */
export function stairFlight(g, x, z0, floorY, wood, opts = {})

/**
 * Iron-bar area railing along x0..x1 at height y in row z (front-garden railings). Bars join their neighbours in the run;
 * a single bar stands as a post.
 */
export function areaRailing(g, x0, x1, y, z, opts = {})

/**
 * A street tree standing on the pavement at (x, z): a 4-high oak trunk from y1 and a crown 5 wide at y4..6 with the
 * top 3 wide at y7, persistent leaves. It writes nothing at y0: the podzol pit under it is the caller's ground step.
 */
export function streetTree(g, x, z)
```

### vocab/h3.mjs

```js
// Helpers for plan.md VOCABULARY (part H3): stringCourse, cantedBay, doorFit, chimneyStack, atticLadder,
// gardenWall, lampPost. Coordinates are plan.md's: x along the street, y up, z from the street (north) to the garden.
//
// Every helper takes its position (and facing, where it has one) as arguments and writes through the build
// library's Grid (g.set). It writes only inside its own footprint, and only into air, unless { over: true } says
// it may replace what an earlier part placed. A blocked cell is never thrown: it comes back in `refused` with the
// reason. Group writes (doors, ladders, posts) are all-or-nothing, so a door is never half placed.

/**
 * String course: one full-block band at height y along x0..x1 at depth z (cut_sandstone on A/C, smooth_quartz over
 * B's x11..19 via { block, over: true }). sides: { xs: [3, 27], zTo: 24 } returns the band round the side faces
 * from z+1 to zTo.
 */
export function stringCourse(g, x0, x1, y, z, { block = "cut_sandstone", sides = null, over = false } = {})

/**
 * Canted bay, front row z (A z=10 cells x0+1..x0+2; cants at z+1, x0 and x0+3). Body smooth_sandstone with glazing
 * (panes) at base+2..4 and base+7..9, cut_sandstone band at base+6, quartz_slab edge + smooth_stone_slab deck at
 * base+11. The cant cells at the front row (x0, x0+3, z) stay air, and the room (x0+1..x0+2, z+1) stays air.
 */
export function cantedBay(g, x0, z = 10, { base = 1, over = false } = {})

/**
 * Door at (x, z) facing `facing` (out to the street): both halves, hinge left, and a glass transom one above the
 * top half. Lower half at y (default 3), upper at y+1, transom at y+2. The door is written all or none.
 */
export function doorFit(g, x, z, block, facing, { y = 3, over = false } = {})

/**
 * Chimney stack for the flue at x0+1, depth z0..z0+1: brick sides at x0 and x0+2 from y5 to y27 (band of
 * deepslate_bricks at y26), a stepped stone_brick_slab cap at y28 one out on every side, and two lit campfires in
 * the flue top at (x0+1, 28, z0..z0+1). Fireboxes (y3..4), the flue (x0+1, y5..27) and the footing stay air or
 * owned by other parts, so they are not written here.
 */
export function chimneyStack(g, x0, z0, { over = false } = {})

/**
 * Ladder on the wall at (x, z), facing east or west off that wall (A: x=4 facing east, C: x=26 facing west), from
 * y0 to y1 (default 18..20). The attic floor cell is the shell's and is not written.
 */
export function atticLadder(g, x, z, facing, { y0 = 18, y1 = 20, over = false } = {})

/**
 * Brick garden wall from (x0, z0) to (x1, z1), one thick and along x or z, `height` high from y with a
 * stone_brick_slab coping on top. gates: [[x, z], ...] cells that get a spruce_fence_gate at y instead of brick
 * (gateFacing north|south for a wall along x). A corner belongs to whichever run writes it first.
 */
export function gardenWall(g, x0, z0, x1, z1, { y = 1, height = 2, gates = [], gateFacing = "north", block = "bricks", over = false } = {})

/**
 * Lamp post at (x, z): three polished_blackstone_wall posts from y (default 1) to y+2 and a standing lantern on top
 * at y+3. The post is written all or none.
 */
export function lampPost(g, x, z, { y = 1, over = false } = {})
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

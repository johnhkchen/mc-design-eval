# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# Sears Modern Homes row: plan (architect)

## SITE

Row 128 x 25 (x 0..127, z 0..24). Fronts face NORTH (-z). Plot i covers x = 16i .. 16i+15, z 5..24.
In the per-plot tables, **lx** is local x: absolute x = 16·i + lx. y and z are absolute everywhere.

| level | y | what |
|---|---|---|
| ground | 0 | road, sidewalk, lawn (grass_block), walks; house foundations are stone at y 0 under walls |
| lawn walking | 1 | feet on the lawn |
| ground floor | 1 | floor block layer (feet at y 2): 1 above the lawn |
| upper floor | 5 | floor block layer of storey 2 or the half storey (feet y 6) |
| wall plate | 8 | top of a 2-storey wall (1-storey walls end at y 4) |
| attic floor | 9 | Magnolia only |

Street (every module carries its own 16-wide strip): gravel x 16i..16i+15, z 0..2, y 0; smooth_stone z 3..4, y 0.

Shared rules on every plot (same for all eight):
- Front lawn z 5..8 (grass_block y 0) runs to the sidewalk; no front fence.
- Front walk: smooth_stone flush at y 0 from z 5 to the ramp. Ramp = bottom smooth_stone_slab at y 1, 2 cells deep
  (rise 1.0 -> 1.5), then the porch deck / landing as a FULL block at y 1 (rise to 2.0), at least 2 long and 2 wide,
  level up to the door. No stairs, no full-block step anywhere on the way in.
- Hedge: oak_leaves (persistent) y 1, back row lx 0..15 z 24; sides lx 0 and lx 15, z 22..23. Nothing else on the edges.
- Back yard z 22..23 behind every house (houses end at z 21 or 22 at most).
- Foundation planting: flowers/azalea bushes on the grass in the cell row directly in front of the porch or front wall,
  never on the walk or ramp cells.
- Chimneys built by `chimney(g, { wall, into, top })` after the roof; positions below are the WALL cell at floor y 1.
  Each takes the fire cell 1 outside the wall plus its back and sides (3 along the wall x 2 out). All inside the plot.

### Masses (absolute x)

| plot | house | mass | x | y | z |
|---|---|---|---|---|---|
| 0 | Magnolia | main body (2 storeys + attic) | 2..13 | 1..8 | 13..21 |
| 0 | | full-height portico (deck, 4 columns, pediment) | 4..11 | 1..12 | 9..12 |
| 0 | | balcony over door (inside portico) | 6..9 | 5..6 | 10..12 |
| 0 | | chimney W (fire x1) / chimney E (fire x14) | 0..1 / 14..15 | 0..top 15 | 16..18 |
| 0 | | walk / ramp | 6..9 | 0 / 1 | 5..6 / 7..8 |
| 1 | Alhambra | main body (2 storeys) | 18..29 | 1..8 | 13..21 |
| 1 | | front shaped parapet (on front wall) | 18..29 | 9..14 | 13 |
| 1 | | arcaded porch (1 storey) | 19..28 | 1..5 | 9..12 |
| 1 | | chimney, rear (fire z22) | 26..28 | 0..top 14 | 22..23 |
| 1 | | walk / ramp | 23..24 | 0 / 1 | 5..6 / 7..8 |
| 2 | Vallonia | main body (1½ storeys) | 35..45 | 1..4 (+gables) | 13..21 |
| 2 | | full-width porch under main roof sweep | 35..45 | 1..4 | 9..12 |
| 2 | | front gabled dormer | 38..42 | 9..13 | 11..13 |
| 2 | | chimney W (fire x34) | 33..34 | 0..top 14 | 16..18 |
| 2 | | walk / ramp | 39..41 | 0 / 1 | 5..6 / 7..8 |
| 3 | Puritan | main body (2 storeys, upper in the gambrel) | 51..61 | 1..4 (+gambrel ends) | 13..21 |
| 3 | | long front shed dormer | 53..59 | 6..9 | 13..14 |
| 3 | | pedimented entry porch | 55..57 (roof 54..58) | 1..7 | 10..12 |
| 3 | | chimney W (fire x50) | 49..50 | 0..top 14 | 16..18 |
| 3 | | walk / ramp | 55..57 | 0 / 1 | 5..7 / 8..9 |
| 4 | Cornell | main body (2-storey cube) | 67..77 | 1..8 | 13..21 |
| 4 | | full-width 1-storey porch | 67..77 | 1..5 | 9..12 |
| 4 | | front hipped dormer | 70..74 | 11..14 | 14..16 |
| 4 | | chimney E (fire x78) | 78..79 | 0..top 15 | 16..18 |
| 4 | | walk / ramp | 71..73 | 0 / 1 | 5..6 / 7..8 |
| 5 | Stanford | main body (1½ storeys, kneewall) | 83..93 | 1..6 | 14..21 |
| 5 | | entry landing (no porch roof; door hood) | 87..89 | 1 | 12..13 |
| 5 | | two front gabled dormers | 85..87, 89..91 | 7..11 | 14..16 |
| 5 | | central chimney in partition z 18 (fire x88) | 87..89 | 0..top 13 | 17..19 |
| 5 | | walk / ramp | 87..89 | 0 / 1 | 5..9 / 10..11 |
| 6 | Winona | main body (1 storey, front gable) | 100..108 | 1..4 (+gable) | 13..22 |
| 6 | | small gabled entry porch | 102..106 | 1..8 | 10..12 |
| 6 | | chimney E (fire x109) | 109..110 | 0..top 11 | 17..19 |
| 6 | | walk / ramp | 103..105 | 0 / 1 | 5..7 / 8..9 |
| 7 | Craftsman | main body (2 storeys, front gable) | 114..125 | 1..8 (+gable) | 13..21 |
| 7 | | broad 1-storey porch on stone piers | 114..125 | 1..5 | 9..12 |
| 7 | | chimney E (fire x126) | 126..127 | 0..top 15 | 16..18 |
| 7 | | walk / ramp | 118..120 | 0 / 1 | 5..6 / 7..8 |

Chimney calls (wall cell, into, top): P0 (2,1,17) east 15 and (13,1,17) west 15 · P1 (27,1,21) north 14 ·
P2 (35,1,17) east 14 · P3 (51,1,17) east 14 · P4 (77,1,17) west 15 · P5 interior `at` (88,1,18) open south, top 13 ·
P6 (108,1,18) west 11 · P7 (125,1,17) west 15. `top` is the flue's last course: re-check after the roof dry-run that the
mouth is 1-2 courses over the roof where the stack leaves it, and adjust only `top`.

## ROOFS

| plot | form | `$MCD roof` | footprint (abs x, z) / y start | pitch, ridge | overhang, trim | by hand |
|---|---|---|---|---|---|---|
| 0 Magnolia | hip, 3 gabled dormers on N face | preset `civic`, material `dark-slate`, pediment OFF | x 2..13, z 13..21, y 9 | 45; ridge along x ≈ y 14 | 1, quartz dentil cornice (civic eave) | portico pediment: x 4..11, z 9..12, entablature y 9, tympanum smooth_quartz y 10..11, raking quartz_stairs to a 2-cell peak x 7..8 at y 12, ridge along z running back into the hip; roof part writes it |
| 1 Alhambra | front-gabled low roof behind a shaped parapet | style `gable`, `ridgeAxis: z`, palette `red-tile` | x 18..29, z 13..21, y 9 | half (slabs); ridge x 23..24 ≈ y 12 | 1 on the sides (red-tile eaves read from the street), 0 at front: front wall z 13 y 9..14 in `keep` | porch: flat deck y 5 over x 19..28 z 9..12, a pent of red-tile stairs (brick_stairs / granite_stairs, facing south) on z 8 at y 5 along the front and down both sides |
| 2 Vallonia | side gable sweeping over the porch; gabled dormer front; shed dormer rear | preset `cottage`, ridgeAxis x, palette `spruce-shingle` | x 35..45, z 9..21 (porch included), y 5 | 45; ridge along x at z 15 ≈ y 12 | 1, flared eave, birch verge; knee braces (upside-down spruce_stairs) under each verge at y 5..6 | ceiling of the porch: spruce_slab top at y 4 over x 35..45 z 9..12 (porch clear y 2..3+) is the floor part's; rear shed dormer x 38..42 z 18..19 y 8..9 if the tool won't |
| 3 Puritan | GAMBREL, ridge along x, steep lower / shallow upper, long front shed dormer | style `gambrel`, palette `slate`, `dormers: {face: north, style: shed, width: 7, count: 1}` | x 51..61, z 13..21, y 5 | lower `steep` (2:1) for 2 cells, upper `half`; ridge ≈ y 12 at z 17 | 1, verge dark_oak; gambrel END walls are wall work (birch_planks, gable in `keep`) | entry porch pediment: x 54..58, z 10..12, eave y 5, quartz_stairs rakes to peak x 56 y 7, tympanum smooth_quartz |
| 4 Cornell | low HIP, hipped front dormer | style `hip`, palette `dark-slate` | x 67..77, z 13..21, y 9 | 45 (reads low on a cube); ridge along x ≈ y 13 | 2 (wide eaves), plain eave + soffit | hipped dormer x 70..74 face z 14, window y 11..12, its own 3-cell hip to y 14; porch roof `hip` x 67..77 z 9..12 y 5, half pitch, overhang 1, dark-slate |
| 5 Stanford | steep side gable, 2 gabled dormers N | preset `cottage`, ridgeAxis x, palette `slate`, `dormers: {face: north, count: 2, style: gable, width: 3}` | x 83..93, z 14..21, y 7 | 45; ridge along x at z 17..18 ≈ y 11 | 1, verge smooth_quartz | door hood: 3-cell gabled hood x 87..89 over door at y 5..6, z 13 (smooth_quartz stairs) |
| 6 Winona | front gable (gable end to street) | preset `shop` (front gable), palette `spruce-shingle` | x 100..108, z 13..22, y 5 | 45; ridge along z at x 104 ≈ y 9 | 1, birch verge | porch gable x 102..106 z 10..12 eave y 5, ridge along z at x 104 y 7, same palette/verge, gable infill smooth_sandstone |
| 7 Craftsman | front gable, wide eaves with brackets | style `gable`, ridgeAxis z, palette `dark-slate` | x 114..125, z 13..21, y 9 | half; ridge x 119..120 ≈ y 13 | 2, verge dark_oak; knee brackets (upside-down dark_oak_stairs) under both rakes every 2 cells and under the eaves at y 8 | porch roof: `shed` (low side north) x 114..125 z 9..12 y 5, half pitch, overhang 1, dark-slate; a low gable over the porch steps x 117..121 is optional |

All roofs: `keep` the chimney stacks; trusses `{ material: "stripped_spruce_log" }`. Run `--dry-run` and fix warnings. If the
contrast rule swaps a palette, pass `contrast: false`: the colours below are the scheme.

## FACADES

Common to all: plinth course y 1 at the wall line (the floor layer) in the house's base material; window frames = the
trim block as sill (top slab below, y 1 under ground windows / y 5 under upper) and lintel (block above the glass);
openings sit flush in the 1-thick wall; shutters are open trapdoors in the cell in front of the wall, either side of a
window, 2 high.

| plot | base | storeys | string course / cornice | rhythm & ornament (depth) |
|---|---|---|---|---|
| 0 Magnolia | bricks plinth y 1 | white clapboard y 2..8 | smooth_quartz band y 5 (flush); civic dentil cornice at eave | 5 bays: pair · sidelight-door-door-sidelight · pair; upstairs pair · single · French door · single · pair. Corner boards quartz_pillar at x 2 and 13 (flush). Portico +4 proud: 4 quartz_pillar columns x 4, 6, 9, 11 at z 9, y 2..8; entablature smooth_quartz y 9; pediment above. Balcony floor smooth_quartz y 5 x 6..9 z 10..12, iron_bars rail y 6 on z 10. Fanlight glass y 4 x 7..8 |
| 1 Alhambra | mud_bricks plinth y 1 | stucco y 2..8 | none (stucco plain); brick coping on the parapet | shaped parapet on z 13: y 9 x 18..29, y 10 x 19..28, y 11 x 20..27, y 12 x 21..26, y 13 x 22..25, y 14 x 23..24; each step capped by brick_stairs (rising inward) / brick_slab; parapet ends are square piers x 18 and 29 to y 10 with brick_slab caps. Arcade +4 proud at z 9: piers x 19, 22, 25, 28 (white_terracotta, 1 wide) y 2..4; arches 2 wide (x 20..21, 23..24, 26..27) clear y 2..3, upside-down brick_stairs in both top corners y 4; side arches z 10..11 on x 19 and x 28. Arch surrounds brick |
| 2 Vallonia | cobblestone plinth y 1 | sage body y 2..4, gable infill same | stripped_spruce_log belt y 4 head plate (axis x) across front | triples left/right of door, trim spruce. Porch piers (+4 proud, z 9) x 35, 38, 42, 45: cobblestone y 2..3 (the stone pier), spruce_fence y 4 (the tapered post), stripped_spruce_log beam y 5 axis x on z 9. Dormer face (z 11) birch trim, triple window |
| 3 Puritan | stone_bricks plinth y 1 | pale yellow clapboard y 2..4; gambrel above | smooth_quartz eave trim | ground: pair · door · pair with warped_trapdoor (green) shutters; shed dormer ribbon: two pairs. Entry porch +3 proud: quartz_pillar columns x 55, 57 at z 10, y 2..4; pediment above. Corner boards smooth_quartz x 51, 61 |
| 4 Cornell | bricks plinth y 1 | blue-grey clapboard y 2..8 | smooth_quartz band y 5 | ground: pair · sidelight-door-sidelight · pair; upstairs pair · triple · pair. Porch +4: square columns smooth_quartz (full block) at x 67, 70, 74, 77, z 9, y 2..4 on a bricks pier y 1; frieze smooth_quartz y 5 on z 9 |
| 5 Stanford | bricks plinth y 1 | white shingle y 2..6 (kneewall y 5..6 plain) | smooth_quartz eave | pair · door · pair, dark_oak_trapdoor shutters every window; door hood. Dormers 3 wide with one 1x2 double-hung each |
| 6 Winona | cobblestone plinth y 1 | cream y 2..4, gable cream | smooth_quartz head band y 4 | pair · door · pair; a pair in the front gable y 6..7; porch posts stripped_birch_log x 102, 106 at z 10 y 2..4 (+3 proud) |
| 7 Craftsman | cobblestone plinth y 1 | lower clapboard y 2..4, upper shingle y 5..8 + gable | dark_oak_slab (top) skirt at y 5 on z 12, a 1-proud flare between the two claddings | ground triple · door · pair; upstairs pair · pair; gable pair. Porch piers (+4, z 9) x 114, 117, 122, 125: cobblestone y 2..3 (mossy_cobblestone 1 in 4), spruce_fence y 4 post, beam stripped_dark_oak_log y 5 axis x |

Side and back faces: same base, cladding and bands as the front; openings listed below.

## MATERIALS

All checked with `$MCD blocks --check` (1.21.1-safe). Note: use `chain`, NOT `iron_chain` (1.21.9+), for hanging lanterns.

| plot | body | trim | accent | base | roof palette | door | glass |
|---|---|---|---|---|---|---|---|
| 0 Magnolia | white_concrete | smooth_quartz, quartz_pillar, quartz_stairs | dark_oak_trapdoor shutters, iron_bars rail | bricks | dark-slate | dark_oak_door | glass_pane |
| 1 Alhambra | white_terracotta (warm stucco) | bricks, brick_stairs, brick_slab | red-tile pent, mud_bricks | mud_bricks | red-tile | spruce_door | glass_pane |
| 2 Vallonia | lime_terracotta (sage) | stripped_spruce_log, spruce_planks | birch (dormer trim), cobblestone piers | cobblestone | spruce-shingle | spruce_door | glass_pane |
| 3 Puritan | birch_planks (pale yellow) | smooth_quartz, quartz_pillar | warped_trapdoor shutters (green) | stone_bricks | slate | oak_door | glass_pane |
| 4 Cornell | cyan_terracotta (blue-grey) | smooth_quartz | bricks piers | bricks | dark-slate | dark_oak_door | glass_pane |
| 5 Stanford | calcite (white shingle) | smooth_quartz | dark_oak_trapdoor shutters, bricks chimney | bricks | slate | spruce_door | glass_pane |
| 6 Winona | smooth_sandstone (cream) | smooth_quartz, stripped_birch_log | spruce_trapdoor window boxes | cobblestone | spruce-shingle | oak_door | glass_pane |
| 7 Craftsman | lower stripped_birch_log axis x (lap siding), upper spruce_planks (shingle) | dark_oak_planks, dark_oak_stairs brackets | stripped_dark_oak_log beam | cobblestone, mossy_cobblestone | dark-slate | dark_oak_door | glass_pane |

Shared: chimneys bricks (Magnolia, Cornell, Stanford, Puritan, Winona, Craftsman, Vallonia), Alhambra bricks too; flue thin
caps none. Interior floors oak_planks (P0 dark_oak_planks). Ground: grass_block, walks smooth_stone, ramps
smooth_stone_slab (bottom), porch decks: P0 smooth_quartz, P1 mud_bricks, P2/P7 spruce_planks, P3 smooth_quartz,
P4 oak_planks, P5 smooth_stone, P6 oak_planks. Hedge oak_leaves (persistent). Road gravel, sidewalk smooth_stone.

## OPENINGS

Windows: w x h in cells, glass_pane. Ground windows y 2..3, upper y 6..7 unless stated. Doors 1 wide x 2 high (y 2..3).
Wall builders leave every listed cell AIR.

| plot | face (wall line) | openings (abs x or z) |
|---|---|---|
| 0 | N z 13 | ground: pairs x 3..4, 11..12; sidelights x 6, 9; double door x 7..8; fanlight x 7..8 y 4. Upper: pairs x 3..4, 11..12; singles x 6, 9; French double door x 7..8 y 6..7 to balcony. Shutters z 12 at x 2, 5, 10, 13 (both floors) |
| 0 | W x 2 / E x 13 | pairs z 14..15 and z 19..20, both floors (chimney between, z 16..18); hearth mouths at (2,2,17), (13,2,17) cut by chimney() |
| 0 | S z 21 | pairs x 4..5, 10..11 both floors; back door x 8 |
| 0 | roof | 3 dormer windows (tool); attic reached by ladder (RESERVED) |
| 1 | N z 13 | ground: pairs x 20..21, 26..27; double door x 23..24 (behind the centre arch). Upper: pairs x 19..20, 23..24, 27..28. Parapet: a 1x1 vent window x 23..24 y 11 (glass) |
| 1 | W x 18 / E x 29 | pairs z 15..16 and 18..19, both floors |
| 1 | S z 21 | pair x 20..21 both floors; back door x 24; hearth mouth (27,2,21) |
| 2 | N z 13 | triples x 36..38, 42..44; door x 40 |
| 2 | dormer N z 11 | triple x 39..41 y 10..11 |
| 2 | W x 35 / E x 45 | pairs z 14..15, 19..20 (ground); gable pair z 16..17 y 6..7 on both ends; hearth mouth (35,2,17) |
| 2 | S z 21 | pairs x 37..38, 42..43; back door x 40 |
| 3 | N z 13 | ground pairs x 52..53, 59..60; door x 56; shutters z 12 at x 51, 54, 58, 61 |
| 3 | shed dormer face z 13 | pairs x 54..55, 57..58, y 6..7 (dormer wall x 53..59 y 6..8) |
| 3 | W x 51 / E x 61 | ground pairs z 14..15, 19..20; gambrel end pair z 17..18 y 6..7 (E), z 19..20 y 6..7 (W, beside the stack); hearth (51,2,17) |
| 3 | S z 21 | ground pair x 53..54, back door x 58; upper pair x 55..57 triple via rear shed if the tool gives one, else none |
| 4 | N z 13 | ground pairs x 68..69, 75..76; sidelights x 71, 73; door x 72. Upper pairs x 68..69, 75..76; triple x 71..73 |
| 4 | hipped dormer z 14 | triple x 71..73 y 11..12 |
| 4 | W x 67 / E x 77 | pairs z 14..15, 19..20 both floors; hearth (77,2,17) |
| 4 | S z 21 | pairs x 69..70, 74..75 both floors; back door x 72 |
| 5 | N z 14 | pairs x 84..85, 91..92; door x 88; shutters z 13 at x 83, 86, 90, 93 |
| 5 | dormers | one 1x2 window each at x 86 and x 90, y 8..9 (tool places) |
| 5 | W x 83 / E x 93 | ground pair z 15..16; gable pair z 17..18 y 7..8 |
| 5 | S z 21 | pairs x 85..86, 90..91; back door x 88 |
| 6 | N z 13 | pairs x 101..102, 106..107; door x 104; gable triple x 103..105 y 6..7 (centred on the ridge) |
| 6 | W x 100 / E x 108 | pairs z 15..16, 20..21; hearth (108,2,18) |
| 6 | S z 22 | pair x 102..103; back door x 106 |
| 7 | N z 13 | ground triple x 115..117, door x 119, pair x 122..123. Upper pairs x 115..116, 122..123. Gable pair x 119..120 y 10..11 |
| 7 | W x 114 / E x 125 | pairs z 14..15, 19..20 both floors (E upper only z 19..20 beside the stack); hearth (125,2,17) |
| 7 | S z 21 | pairs x 116..117, 121..122 both floors; back door x 119 |

## RESERVED (shell leaves these AIR / unbuilt)

| plot | what | cells |
|---|---|---|
| all | chimney cells (fire, firebox, stack, hay under fire) | the chimney boxes in SITE, y 0..top; roof `keep` them |
| all | ramp and walk cells | SITE table: grass not laid over them |
| 0 | stair hole, floor y 5 | x 6, z 15..17; flight x 6, from (6,2,15) facing south, steps z 15..18 (top step in floor y 5) |
| 0 | attic ladder hole y 9 | x 11, z 17 (ladder on the partition at x 11 z 18 face) |
| 0 | column cells | (4|6|9|11, 2..8, 9) for quartz_pillar; balcony rail x 6..9 y 6 z 10 |
| 1 | stair | hole y 5 x 22, z 15..17; flight from (22,2,15) facing south |
| 2 | stair | hole y 5 x 44, z 16..18; flight from (44,2,18) facing north, top step z 15 y 5, landing z 14 |
| 3 | stair | hole y 5 x 55, z 15..17; flight from (55,2,15) facing south |
| 4 | stair | hole y 5 x 68, z 15..17; flight from (68,2,15) facing south |
| 5 | stair | hole y 5 x 92, z 17..19; flight from (92,2,19) facing north, top step z 16, landing z 15 |
| 5 | partition z 18 (x 84..92) carries the interior hearth at x 88 | wall builder leaves (88,1..2,18) and the flue x 88 z 18 y 2..13 air |
| 7 | stair | hole y 5 x 115, z 15..17; flight from (115,2,15) facing south |
| 0,1,2,4,7 | porch piers / columns are the porch part's: leave their cells | positions in FACADES |

## FLOORS

Interior volumes (inside the walls). Beds: 3-4 per house, heads on solid wall.

| plot | storey | floor y | feet / clear | interior x, z | suggested rooms |
|---|---|---|---|---|---|
| 0 | ground | 1 | 2..4 | x 3..12, z 14..20 | central hall x 6..9; parlour W x 3..5; dining E x 10..12 front; kitchen E rear z 18..20 (stove/smoker) |
| 0 | upper | 5 | 6..8 | x 3..12, z 14..20 | 4 bedrooms in the corners, hall x 6..9 to balcony |
| 0 | attic | 9 | 10..12 under hip | x 5..10, z 15..19 | storage/dormer nook |
| 1 | ground | 1 | 2..4 | x 19..28, z 14..20 | hall x 22..25; living W; dining + kitchen E |
| 1 | upper | 5 | 6..8 | x 19..28, z 14..20 | 3 bedrooms |
| 2 | ground | 1 | 2..4 | x 36..44, z 14..20 | living (front, x 36..39) with the W hearth, dining front E, 2 bedrooms rear (z 18..20), kitchen |
| 2 | upper | 5 | 6..8 where roof ≥ y 9 (z 14..18) + dormer | x 36..44, z 14..18 | 2 bedrooms |
| 3 | ground | 1 | 2..4 | x 52..60, z 14..20 | hall x 55..57; living W (hearth); dining + kitchen E |
| 3 | upper (gambrel) | 5 | 6..8 at z 14..20 (steep lower slope + dormer) | x 52..60, z 14..20 | 3 bedrooms |
| 4 | ground | 1 | 2..4 | x 68..76, z 14..20 | four rooms down: living NW, parlour NE, dining SW... kitchen SE (hearth E wall) |
| 4 | upper | 5 | 6..8 | x 68..76, z 14..20 | four rooms up: 3 bedrooms + bath/store |
| 5 | ground | 1 | 2..4 | x 84..92, z 15..20 | hall front centre; parlour NW; kitchen/living rear behind partition z 18 with the central hearth |
| 5 | attic | 5 | 6..8 at z 15..20 (kneewall to y 6) | x 84..92, z 15..20 | 2 bedrooms (3 beds) |
| 6 | ground | 1 | 2..4 | x 101..107, z 14..21 | living + kitchen front (hearth E), 2 bedrooms rear (3 beds) |
| 7 | ground | 1 | 2..4 | x 115..124, z 14..20 | living (hearth E), dining, kitchen |
| 7 | upper | 5 | 6..8 | x 115..124, z 14..20 | 3 bedrooms |

---
# DESIGNER SECTIONS

## PALETTE

Architect ids kept exactly (see MATERIALS). Shape variants and extras (all 1.21.1; verify with `$MCD blocks --check`):

| role | blocks |
|---|---|
| masonry / trim | bricks, brick_stairs, brick_slab, brick_wall, mud_bricks, mud_brick_stairs, mud_brick_slab, cobblestone, cobblestone_slab, mossy_cobblestone, stone_bricks, smooth_quartz, smooth_quartz_stairs, smooth_quartz_slab, quartz_pillar, quartz_stairs, smooth_stone, smooth_stone_slab, smooth_sandstone, white_terracotta, granite_stairs |
| body | white_concrete, lime_terracotta, birch_planks, cyan_terracotta, calcite, spruce_planks, stripped_birch_log, dark_oak_planks |
| wood trim | stripped_spruce_log, stripped_dark_oak_log, stripped_birch_log, spruce_planks, spruce_slab, spruce_stairs, spruce_fence, dark_oak_stairs, dark_oak_slab, birch_planks, oak_planks, oak_slab |
| roof (via roof tool palettes) | dark-slate, red-tile, spruce-shingle, slate (+ stairs/slabs of deepslate_tile or brick/granite as palette gives) |
| doors / glass | dark_oak_door, spruce_door, oak_door, glass_pane, iron_bars |
| shutters / boxes | dark_oak_trapdoor, warped_trapdoor, spruce_trapdoor (open, flat on wall) |
| ground | grass_block, gravel, smooth_stone, oak_leaves (persistent), azalea, flowering_azalea, poppy, dandelion, allium, lilac, potted_* |
| fire | campfire (lit, signal_fire true), hay_block, bricks, brick_stairs (upside down lintel) |
| lighting | lantern (hanging from a block, or standing on a post/table), candle (lit), no chain |
| furniture | white_bed/red_bed/blue_bed/green_bed via bed(); barrel, smoker, furnace, cauldron, composter, chest, bookshelf (parlour shelf max 1), oak/spruce fence + pressure_plate tables, *_stairs chairs, *_carpet, flower_pot, loom, crafting_table, ladder |

Mapping of the architect's `chain` note: do not place a chain; the toolkit rejects the id.

## VOCABULARY

All helpers take absolute coordinates and write only inside the plot. States set explicitly.

1. `lawn(g, plot)`: grass_block y0 z5..24 lx0..15 (patches of coarse_dirt/podzol 1 in 12 near the hedge), gravel y0 z0..2, smooth_stone y0 z3..4.
2. `hedge(g, plot)`: persistent oak_leaves y1 along z24 lx0..15 and lx0 / lx15 z22..23.
3. `accessRamp(g, {x, w, z0, deckZ0, deckZ1})`: smooth_stone y0 for z5..(ramp-1) width w; two cells bottom smooth_stone_slab y1 (type bottom) full width; deck cells full block of the plot's deck material y1, at least 2 long x 2 wide, ending at the door-front cell. Never stairs.
4. `clapboardWall(g, {box, body, courseSlab})`: wall of body block; optional horizontal clapboard lines every 2nd course using a top slab of the same colour set into the face is NOT used (keep full blocks); corner boards trim block; string course band at y5.
5. `windowPair(g, {x, y, z, face, trim})`: 2 wide x 2 tall glass_pane with connection states set toward walls, sill = top slab of trim at y-1 (extends 1 each side), lintel = trim block at y+2 1 each side.
6. `windowTriple(...)`: same, 3 wide, with a trim mullion not used (plain panes).
7. `doorSet(g, {x, y, z, face, wood, hinge, double})`: door lower+upper, same facing (out of the house) and hinge; double doors mirrored hinges; threshold level with deck.
8. `shutterPair(g, {x0, x1, y, z, face, trap})`: open trapdoors 2 high in the cell in front of the wall each side of the window (use `shutter()`).
9. `windowBox(g, {x, y, z, w})`: spruce_trapdoor (open=false, half top? no: flat, half bottom) under the sill in front, potted flowers on a top slab beneath; never on a bottom slab.
10. `portico(g, {x0, x1, z0, z1})`: Magnolia: deck, quartz_pillar columns axis y at x4,6,9,11, entablature, pediment with quartz_stairs rakes, tympanum fill, 2-cell peak.
11. `balcony(g, ...)`: smooth_quartz floor, iron_bars rail (connected), French door behind.
12. `shapedParapet(g, {steps})`: stacked brick coping per row list; stairs rising inward at each step corner, slabs on flats; vent window.
13. `arcadeBay(g, {x0, x1, z, y})`: white_terracotta piers, 2-wide opening clear y2..3, upside-down brick_stairs at both top corners y4, brick span above.
14. `taperedPier(g, {x, z, stone})`: stone pier y2..3, fence post y4 (the taper), beam stripped log axis x on the row at y5.
15. `kneeBrace(g, {x, y, z, dir, wood})`: upside-down *_stairs facing away from the wall under rake/eave, one per 2 cells.
16. `rafterTails(g, {x0, x1, z, y, wood})`: spruce_trapdoor open flat / alternate cells of stairs beyond the wall line at eave course.
17. `dormerGable / dormerShed / dormerHip(g, {x0, x1, zFront, y0, y1, trim})`: dormer cheeks of body block, front face with window, roof of own stairs with verge; keep roof tool's cells.
18. `pedimentPorch(g, {x0, x1, z0, z1})` (Puritan) and `gablePorch(...)` (Winona): two columns, deck, gable of stairs + tympanum infill.
19. `squarePorch(g, {x0, x1, z0, z1})` (Cornell), `doorHood(g, ...)` (Stanford): columns/frieze/hood.
20. `chimneyStack(g, plot)`: calls `chimney(g, {wall, into, top, material: "bricks"})` after the roof with plan.md calls; one band of deepslate_bricks below cap, slab cap stepping out by 1.
21. `porchLantern(g, {x, y, z})`: lantern hanging under the porch beam/eave block (hanging true), one each side of the door.
22. `foundationPlanting(g, {x0, x1, z})`: azalea/flowering_azalea/poppy/allium on grass row in front of the porch or wall, never on walk/ramp cells.
Furniture helpers for designers: `bedSet(g, foot, facing, colour)` (bed()), `kitchenStove(g, ...)` (smoker + furnace + cauldron + barrel counter of top slabs), `diningSet(g, ...)` (fence post + top-slab table, stairs chairs), `parlourSet(g, ...)`, `dresser(g, ...)` (barrels/chest), `coatRack(g, ...)` (fence + banner).

## ROOMS
In the `rooms` JSON. Partitions: open cased openings between hall and parlour/dining in P0/P3; wall lines noted per room; ground feet y2..4, upper y6..8. Interior doorways are 1 wide x 2 tall in the partition at the coordinates given. Stair hole cells are in the architect's RESERVED table.

## PARTS
1. Shell west, plots 0..3 (parts/shell-west.mjs)
2. Shell east, plots 4..7 (parts/shell-east.mjs)
3. Roofs, all eight (parts/roofs.mjs)
4. Porches and facade ornament (parts/porches.mjs)
5. Glazing, doors, shutters, window boxes (parts/fittings.mjs)
6. Chimneys, walks, lawn, hedge, planting, lamps (parts/grounds.mjs)

Checklist: [ ] 1 [ ] 2 [ ] 3 [ ] 4 [ ] 5 [ ] 6

## NOTES
- Respect every RESERVED cell; chimney() overwrites, call it directly after the roofs.
- Door cells and window cells stay air in Parts 1-2; Part 5 fills them.
- The way in: walk z5..6 flat, ramp slabs two cells, deck full block y1; verify `$MCD approach build.nbt --from <street> --to <entrance>`.
- Stairs by `flight()`, top step flush with floor y5.
- Beds: bed() only, head on a solid wall, never a window.
- No chain id, no 1.21.4+ blocks. Everything within the plot.
```

### elements.md

```markdown
# Required elements: Sears Modern Homes row (checklist)

Coordinates are absolute (plan.md). lx = local x, abs x = 16i + lx. Part numbers refer to plan.md PARTS.
Vocabulary names are defined in plan.md VOCABULARY.

## Row-wide
- [ ] Street: gravel y0 z0..2, smooth_stone sidewalk y0 z3..4, every plot's 16-wide strip. Part 6. `lawn()`.
- [ ] Front lawn grass_block y0 z5..8 to the sidewalk, NO front fence. Part 6. `lawn()`.
- [ ] Hedge: persistent oak_leaves y1, back row z24 lx0..15, sides lx0 and lx15 z22..23, same on all plots. Part 6. `hedge()`.
- [ ] Accessible way in, every plot: smooth_stone walk y0 (z5..6), two cells of bottom smooth_stone_slab y1 (ramp), then a FULL-block deck/landing y1 at least 2x2, level to the door sill. No stairs, no full-block step. Part 6 (ramp/walk), Part 4 (decks). `accessRamp()`.
- [ ] Beds: 3-4 per house, whole (foot+head via bed()), head on a solid wall, 2 clear above. Rooms' designers. `bedSet()`.
- [ ] Per house: living room/parlour, kitchen with stove (smoker + furnace + cauldron/barrels), dining table, bedrooms. Rooms' designers. `kitchenStove()`, `diningSet()`.
- [ ] Lit hearth per chimney: lit campfire at floor, hay_block hidden below, walled 1x1 air flue to a mouth 1-2 courses over the roof. Part 6 `chimneyStack()`.
- [ ] No dark cell (light >= 8): hanging lanterns from blocks (no chains: `chain` id is not trusted by the toolkit; hang from beams/ceiling blocks or use standing lanterns on tables). Lamplighter in rooms; Part 6 porch lanterns. `porchLantern()`.
- [ ] Windows always in pairs/triples with sill (top slab) and lintel, flush in the 1-thick wall; shutters as open trapdoors flat on the wall. Part 5. `windowPair()`, `windowTriple()`, `shutterPair()`.
- [ ] Every plot stays inside x 16i..16i+15, z 0..24.

## Plot 0 Magnolia (Georgian, x 2..13, z 13..21)
- [ ] Symmetric 5-bay front, white_concrete clapboard y2..8, bricks plinth y1, quartz band y5, corner boards quartz_pillar x2 and x13 y2..8 (z13). Part 1; `clapboardWall()`.
- [ ] Full-height portico: deck smooth_quartz y1 x4..11 z9..12; four quartz_pillar columns x4,6,9,11 at z9 y2..8; entablature smooth_quartz y9 x4..11 z9..12; pediment: tympanum smooth_quartz y10..11, quartz_stairs rakes up to a peak x7..8 y12. Part 4; `portico()`.
- [ ] Balcony over the door: smooth_quartz floor y5 x6..9 z10..12, iron_bars rail y6 along z10 x6..9 (and x6 / x9 sides z10..12). Part 4; `balcony()`.
- [ ] Double door x7..8 y2..3 z13 (dark_oak_door, mirrored hinges), sidelights x6,x9, fanlight glass y4 x7..8, French double door x7..8 y6..7. Part 5; `doorSet()`.
- [ ] Hip roof, 3 dormers on N face, dark slate, quartz dentil cornice. Part 3.
- [ ] Two brick chimneys W (2,1,17) E (13,1,17). Part 6.

## Plot 1 Alhambra (Mission, x 18..29, z 13..21)
- [ ] Stucco white_terracotta walls y2..8, mud_bricks plinth y1. Part 1.
- [ ] Shaped parapet on z13: y9 x18..29, y10 x19..28, y11 x20..27, y12 x21..26, y13 x22..25, y14 x23..24; brick_stairs/brick_slab coping; end piers x18,x29; vent glass x23..24 y11. Part 4; `shapedParapet()`.
- [ ] Arcaded porch: piers white_terracotta x19,22,25,28 z9 y2..4; arches x20..21,23..24,26..27 with upside-down brick_stairs at top corners y4; side arches z10..11 on x19 and x28; deck mud_bricks y1; flat deck y5; red-tile pent (brick_stairs facing south) z8 y5. Part 4; `arcadeBay()`.
- [ ] Red-tile low roof edges: front-gabled slab roof behind the parapet. Part 3.
- [ ] Brick chimney rear (27,1,21) north. Part 6.

## Plot 2 Vallonia (Craftsman bungalow, x 35..45, z 9..21)
- [ ] Side gable sweeping down over the full-width porch (roof starts y5 at z9). Part 3.
- [ ] Porch piers x35,38,42,45 z9: cobblestone y2..3, tapering spruce_fence post y4, stripped_spruce_log beam y5 axis x. Porch ceiling spruce_slab top y4. Part 4; `taperedPier()`.
- [ ] Exposed rafter tails (spruce_trapdoor / spruce_stairs underside along eave y5) and knee braces (upside-down spruce_stairs) under each verge y5..6. Part 3 + Part 4; `kneeBrace()`, `rafterTails()`.
- [ ] Front gabled dormer x38..42 z11..13 y9..13, triple window x39..41 y10..11, birch trim. Part 4/3; `dormerGable()`.
- [ ] Door x40, triples x36..38, 42..44. Part 5. Brick chimney W (35,1,17). Part 6.

## Plot 3 Puritan (Dutch Colonial, x 51..61)
- [ ] Gambrel roof ridge along x (steep lower 2 cells, shallow upper), slate; birch_planks gambrel end walls. Part 3 + Part 1 (end walls).
- [ ] Long front shed dormer x53..59 z13..14 y6..9, two pairs x54..55, 57..58 y6..7. Part 3/4; `dormerShed()`.
- [ ] Pedimented entry porch x55..57 z10..12, columns quartz_pillar x55,57 z10 y2..4, pediment quartz_stairs to peak x56 y7, tympanum smooth_quartz. Part 4; `pedimentPorch()`.
- [ ] Warped_trapdoor green shutters at x51,54,58,61 z12. Part 5. Brick chimney W (51,1,17). Part 6.

## Plot 4 Cornell (Foursquare, x 67..77)
- [ ] Cube y1..8 cyan_terracotta, bricks plinth, quartz band y5. Part 1.
- [ ] Low hip roof, 2-wide eaves, dark slate; hipped dormer x70..74 z14..16 y11..14, triple x71..73 y11..12. Part 3; `dormerHip()`.
- [ ] Full-width porch: square smooth_quartz columns x67,70,74,77 z9 y2..4 on bricks pier y1, frieze y5, hip porch roof y5. Part 4; `squarePorch()`.
- [ ] Door x72 + sidelights x71,73. Part 5. Brick chimney E (77,1,17). Part 6.

## Plot 5 Cape Cod (Stanford, x 83..93, z 14..21)
- [ ] Steep side gable, white calcite shingle y2..6, quartz eave. Parts 1,3.
- [ ] Two gabled dormers x85..87, 89..91 each with a 1x2 window x86 / x90 y8..9. Part 3; `dormerGable()`.
- [ ] Door x88 z14, door hood x87..89 z13 y5..6 gabled smooth_quartz stairs, landing x87..89 z12..13 y1 smooth_stone. Part 4; `doorHood()`.
- [ ] dark_oak_trapdoor shutters on every window (x83,86,90,93 at z13). Part 5.
- [ ] Central interior chimney at (88,1,18) open south, bricks, top 13. Part 6.

## Plot 6 Winona (cottage, x 100..108, z 13..22)
- [ ] Front gable roof (ridge along z, x104), spruce-shingle, birch verge; gable infill smooth_sandstone with triple window x103..105 y6..7. Part 3.
- [ ] Small gabled entry porch x102..106 z10..12: stripped_birch_log posts x102,106 z10 y2..4, ridge along z at x104 y7, oak_planks deck. Part 4; `gablePorch()`.
- [ ] spruce_trapdoor window boxes with flowers under the front pairs. Part 5; `windowBox()`.
- [ ] Brick chimney E (108,1,18) west. Part 6.

## Plot 7 Craftsman two-storey (x 114..125)
- [ ] Lower stripped_birch_log axis x lap siding y2..4, dark_oak_slab (top) skirt y5 at z12-ish flare, upper spruce_planks shingle y5..8 and gable. Part 1; `clapboardWall()`.
- [ ] Broad porch on stone piers x114,117,122,125 z9: cobblestone/mossy y2..3, spruce_fence post y4, stripped_dark_oak_log beam y5 axis x; shed roof z9..12 y5. Part 4; `taperedPier()`.
- [ ] Wide eaves 2, brackets: upside-down dark_oak_stairs under both rakes every 2 cells and under eaves y8. Part 3/4; `kneeBrace()`.
- [ ] Front gable pair x119..120 y10..11. Door x119; ground triple x115..117, pair x122..123. Part 5. Chimney E (125,1,17). Part 6.
```

### rooms.json

```json
{"entrance":[7,2,12],"street":null,"entrances":null,"rooms":[{"name":"P0 hall","box":[6,2,14,9,4,20]},{"name":"P0 parlour","box":[3,2,14,5,4,20]},{"name":"P0 dining room","box":[10,2,14,12,4,17]},{"name":"P0 kitchen","box":[10,2,19,12,4,20]},{"name":"P0 upper hall","box":[6,6,14,9,8,20]},{"name":"P0 west bedroom","box":[3,6,14,4,8,20]},{"name":"P0 east bedroom","box":[11,6,14,12,8,20]},{"name":"P0 attic","box":[5,10,15,10,12,19]},{"name":"P1 hall","box":[22,2,14,25,4,20]},{"name":"P1 living room","box":[19,2,14,21,4,20]},{"name":"P1 dining room","box":[26,2,14,28,4,16]},{"name":"P1 kitchen","box":[26,2,18,28,4,20]},{"name":"P1 upper hall","box":[22,6,14,25,8,20]},{"name":"P1 west bedroom","box":[19,6,14,21,8,20]},{"name":"P1 north-east bedroom","box":[26,6,14,28,8,16]},{"name":"P1 south-east bedroom","box":[26,6,18,28,8,20]},{"name":"P2 living and dining","box":[36,2,14,44,4,17]},{"name":"P2 kitchen","box":[39,2,19,43,4,20]},{"name":"P2 ground bedroom","box":[36,2,19,38,4,20]},{"name":"P2 loft west bedroom","box":[36,6,14,40,8,18]},{"name":"P2 loft east bedroom","box":[42,6,14,43,8,18]},{"name":"P3 hall","box":[55,2,14,57,4,20]},{"name":"P3 living room","box":[52,2,14,54,4,20]},{"name":"P3 dining room","box":[58,2,14,60,4,17]},{"name":"P3 kitchen","box":[58,2,19,60,4,20]},{"name":"P3 upper hall","box":[55,6,14,57,8,20]},{"name":"P3 west bedroom","box":[52,6,14,54,8,20]},{"name":"P3 dormer bedroom","box":[58,6,14,60,8,16]},{"name":"P3 rear bedroom","box":[58,6,18,60,8,20]},{"name":"P4 living room","box":[68,2,14,71,4,17]},{"name":"P4 hall","box":[72,2,14,72,4,20]},{"name":"P4 parlour","box":[73,2,14,76,4,17]},{"name":"P4 dining room","box":[68,2,19,71,4,20]},{"name":"P4 kitchen","box":[73,2,19,76,4,20]},{"name":"P4 upper hall","box":[72,6,14,72,8,20]},{"name":"P4 north-west bedroom","box":[69,6,14,71,8,17]},{"name":"P4 north-east bedroom","box":[73,6,14,76,8,17]},{"name":"P4 south-east bedroom","box":[73,6,19,76,8,20]},{"name":"P4 bath and store","box":[69,6,19,71,8,20]},{"name":"P5 hall","box":[87,2,15,89,4,17]},{"name":"P5 parlour","box":[84,2,15,86,4,17]},{"name":"P5 dining nook","box":[90,2,15,91,4,17]},{"name":"P5 kitchen and living","box":[84,2,19,91,4,20]},{"name":"P5 attic north bedroom","box":[84,6,15,91,8,17]},{"name":"P5 attic south bedroom","box":[84,6,19,91,8,20]},{"name":"P6 living and kitchen","box":[101,2,14,107,4,18]},{"name":"P6 west bedroom","box":[101,2,20,104,4,21]},{"name":"P6 back hall and bunk","box":[105,2,20,107,4,21]},{"name":"P7 living room","box":[115,2,14,124,4,17]},{"name":"P7 dining room","box":[115,2,19,119,4,20]},{"name":"P7 kitchen","box":[121,2,19,124,4,20]},{"name":"P7 upper hall","box":[120,6,14,120,8,20]},{"name":"P7 north-west bedroom","box":[116,6,14,119,8,17]},{"name":"P7 north-east bedroom","box":[121,6,14,124,8,17]},{"name":"P7 south-east bedroom","box":[121,6,19,124,8,20]}]}
```

### palette.json

```json
{"roles":{"masonry":["bricks","brick_stairs","brick_slab","brick_wall","mud_bricks","mud_brick_stairs","mud_brick_slab","cobblestone","cobblestone_slab","mossy_cobblestone","stone_bricks","smooth_quartz","smooth_quartz_stairs","smooth_quartz_slab","quartz_pillar","quartz_stairs","smooth_stone","smooth_stone_slab","smooth_sandstone","white_terracotta","granite_stairs"],"body":["white_concrete","lime_terracotta","birch_planks","cyan_terracotta","calcite","spruce_planks","stripped_birch_log","dark_oak_planks"],"wood_trim":["stripped_spruce_log","stripped_dark_oak_log","stripped_birch_log","spruce_planks","spruce_slab","spruce_stairs","spruce_fence","dark_oak_stairs","dark_oak_slab","birch_planks","oak_planks","oak_slab"],"doors_glass":["dark_oak_door","spruce_door","oak_door","glass_pane","iron_bars"],"shutters":["dark_oak_trapdoor","warped_trapdoor","spruce_trapdoor"],"ground":["grass_block","gravel","smooth_stone","oak_leaves","azalea","flowering_azalea","poppy","dandelion","allium","lilac","potted_poppy","potted_dandelion","potted_allium","potted_azalea_bush","coarse_dirt","podzol"],"fire":["campfire","hay_block","bricks","brick_stairs"],"lighting":["lantern","candle","wall_torch"],"furniture":["white_bed","red_bed","blue_bed","green_bed","barrel","smoker","furnace","cauldron","composter","chest","bookshelf","oak_fence","oak_pressure_plate","spruce_pressure_plate","oak_stairs","birch_stairs","white_carpet","red_carpet","brown_carpet","flower_pot","loom","crafting_table","ladder"],"Painted clapboard, stucco and shingle walls":["birch_planks","white_terracotta","green_terracotta","light_gray_terracotta","smooth_sandstone","spruce_planks"],"White columns, window frames, pediments and arch approximations":["quartz_pillar","quartz_stairs","quartz_slab","smooth_sandstone_stairs","smooth_sandstone_slab"],"Dark roofs, eaves, verges and ridges":["deepslate_tiles","deepslate_tile_stairs","deepslate_tile_slab"],"Mission roof coping, porch piers and chimney masonry":["bricks","brick_stairs","brick_slab","brick_wall"],"Foundations, hearth surrounds and stone porch piers":["stone_bricks","stone_brick_stairs","stone_brick_slab","stone_brick_wall"],"Wood floors, brackets, rafters, rails, doors and shutters":["spruce_planks","spruce_stairs","spruce_slab","spruce_fence","spruce_trapdoor","spruce_door"],"Windows":["glass_pane"],"Road, sidewalk, entry walks and slab landings":["gravel","smooth_stone","smooth_stone_slab"],"Lawns, hedges and flower beds":["grass_block","dirt","oak_leaves","short_grass","dandelion","oxeye_daisy","poppy"],"Family furnishings, kitchen and interior decoration":["white_bed","light_blue_bed","spruce_stairs","spruce_fence","spruce_pressure_plate","chest","barrel","crafting_table","smoker","furnace","flower_pot","fern"],"Lighting and working hearth":["lantern","torch","campfire","hay_block","air"]},"objects":["deepslate_bricks","deepslate_tiles","birch_slab","spruce_door","glass_pane","spruce_trapdoor","spruce_fence","spruce_stairs","spruce_slab","spruce_pressure_plate","smooth_stone_slab","quartz_pillar","quartz_stairs","quartz_slab","smooth_sandstone_stairs","smooth_sandstone_slab","deepslate_tile_stairs","deepslate_tile_slab","brick_stairs","brick_slab","brick_wall","stone_brick_stairs","stone_brick_slab","stone_brick_wall","white_bed","light_blue_bed","chest","barrel","crafting_table","smoker","furnace","lantern","torch","campfire","hay_block","flower_pot","fern","oak_leaves","short_grass","dandelion","oxeye_daisy","poppy"]}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: builds to a temp file, then moves it into place (a failed build leaves the old one).
set -e
cd "$(dirname "$0")"
trap 'rm -f build.nbt.tmp' EXIT
node build.mjs build.nbt.tmp
mv build.nbt.tmp build.nbt
```

### build.mjs

```js
// Builds the Sears row (plan.md): the ground, then every part in the order of the parts list. Each part only adds to
// what earlier parts built (runParts locks their cells); the roof (roof.json) is laid right after the shell.
// Usage: node build.mjs <out.nbt>
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE, SERVER_VERSION } from "./vocab/base.mjs";
import * as shellWest from "./parts/shell-west.mjs";
import * as stairs from "./parts/stairs.mjs";
import * as shellEast from "./parts/shell-east.mjs";
import * as roofs from "./parts/roofs.mjs";
import * as porches from "./parts/porches.mjs";
import * as fittings from "./parts/fittings.mjs";
import * as grounds from "./parts/grounds.mjs";
import * as room1 from "./parts/room-1.mjs";
import * as room2 from "./parts/room-2.mjs";
import * as room3 from "./parts/room-3.mjs";
import * as room4 from "./parts/room-4.mjs";
import * as room5 from "./parts/room-5.mjs";
import * as room6 from "./parts/room-6.mjs";
import * as room7 from "./parts/room-7.mjs";
import * as room8 from "./parts/room-8.mjs";
import * as room9 from "./parts/room-9.mjs";
import * as room10 from "./parts/room-10.mjs";
import * as room11 from "./parts/room-11.mjs";
import * as room12 from "./parts/room-12.mjs";
import * as room13 from "./parts/room-13.mjs";
import * as room14 from "./parts/room-14.mjs";
import * as room15 from "./parts/room-15.mjs";
import * as room16 from "./parts/room-16.mjs";
import * as room17 from "./parts/room-17.mjs";
import * as room18 from "./parts/room-18.mjs";
import * as room19 from "./parts/room-19.mjs";
import * as room20 from "./parts/room-20.mjs";
import * as room21 from "./parts/room-21.mjs";
import * as room22 from "./parts/room-22.mjs";
import * as room23 from "./parts/room-23.mjs";
import * as room24 from "./parts/room-24.mjs";
import * as room25 from "./parts/room-25.mjs";
import * as room26 from "./parts/room-26.mjs";
import * as room27 from "./parts/room-27.mjs";
import * as room28 from "./parts/room-28.mjs";
import * as room29 from "./parts/room-29.mjs";
import * as room30 from "./parts/room-30.mjs";
import * as room31 from "./parts/room-31.mjs";
import * as room32 from "./parts/room-32.mjs";
import * as room33 from "./parts/room-33.mjs";
import * as room34 from "./parts/room-34.mjs";
import * as room35 from "./parts/room-35.mjs";
import * as room36 from "./parts/room-36.mjs";
import * as room37 from "./parts/room-37.mjs";
import * as room38 from "./parts/room-38.mjs";
import * as room39 from "./parts/room-39.mjs";
import * as room40 from "./parts/room-40.mjs";
import * as room41 from "./parts/room-41.mjs";
import * as room42 from "./parts/room-42.mjs";
import * as room43 from "./parts/room-43.mjs";
import * as room44 from "./parts/room-44.mjs";
import * as room45 from "./parts/room-45.mjs";
import * as room46 from "./parts/room-46.mjs";
import * as room47 from "./parts/room-47.mjs";
import * as room48 from "./parts/room-48.mjs";
import * as room49 from "./parts/room-49.mjs";
import * as room50 from "./parts/room-50.mjs";
import * as room51 from "./parts/room-51.mjs";
import * as room52 from "./parts/room-52.mjs";
import * as room53 from "./parts/room-53.mjs";
import * as room54 from "./parts/room-54.mjs";
import * as room55 from "./parts/room-55.mjs";

const [SX, SY, SZ] = SITE_SIZE;
const out = process.argv[2] ?? "build.nbt";

const g = new Grid([SX, SY, SZ], { dataVersion: DATA_VERSIONS[SERVER_VERSION] });

// the ground (y 0): street gravel z 0..2, smooth_stone z 3..4, lawn grass from z 5 to the back edge. Parts may replace it.
g.fill([0, 0, 0], [SX - 1, 0, 2], "gravel");
g.fill([0, 0, 3], [SX - 1, 0, 4], "smooth_stone");
g.fill([0, 0, 5], [SX - 1, 0, SZ - 1], "grass_block");

// the stairs part is named "Stairs and ladders": runParts makes it the stair joiner (it may carve through floors)
runParts(g, [
  ["shell west (plots 0-3)", shellWest.build],
  ["Stairs and ladders", stairs.build],
  ["shell east (plots 4-7)", shellEast.build],
  ["roofs", roofs.build],
  ["porches and facade ornament", porches.build],
  ["glazing, doors, shutters", fittings.build],
  ["chimneys, walks and grounds", grounds.build],
  ["room: P0 hall", room1.build],
  ["room: P0 parlour", room2.build],
  ["room: P0 dining room", room3.build],
  ["room: P0 kitchen", room4.build],
  ["room: P0 upper hall", room5.build],
  ["room: P0 west bedroom", room6.build],
  ["room: P0 east bedroom", room7.build],
  ["room: P0 attic", room8.build],
  ["room: P1 hall", room9.build],
  ["room: P1 living room", room10.build],
  ["room: P1 dining room", room11.build],
  ["room: P1 kitchen", room12.build],
  ["room: P1 upper hall", room13.build],
  ["room: P1 west bedroom", room14.build],
  ["room: P1 north-east bedroom", room15.build],
  ["room: P1 south-east bedroom", room16.build],
  ["room: P2 living and dining", room17.build],
  ["room: P2 kitchen", room18.build],
  ["room: P2 ground bedroom", room19.build],
  ["room: P2 loft west bedroom", room20.build],
  ["room: P2 loft east bedroom", room21.build],
  ["room: P3 hall", room22.build],
  ["room: P3 living room", room23.build],
  ["room: P3 dining room", room24.build],
  ["room: P3 kitchen", room25.build],
  ["room: P3 upper hall", room26.build],
  ["room: P3 west bedroom", room27.build],
  ["room: P3 dormer bedroom", room28.build],
  ["room: P3 rear bedroom", room29.build],
  ["room: P4 living room", room30.build],
  ["room: P4 hall", room31.build],
  ["room: P4 parlour", room32.build],
  ["room: P4 dining room", room33.build],
  ["room: P4 kitchen", room34.build],
  ["room: P4 upper hall", room35.build],
  ["room: P4 north-west bedroom", room36.build],
  ["room: P4 north-east bedroom", room37.build],
  ["room: P4 south-east bedroom", room38.build],
  ["room: P4 bath and store", room39.build],
  ["room: P5 hall", room40.build],
  ["room: P5 parlour", room41.build],
  ["room: P5 dining nook", room42.build],
  ["room: P5 kitchen and living", room43.build],
  ["room: P5 attic north bedroom", room44.build],
  ["room: P5 attic south bedroom", room45.build],
  ["room: P6 living and kitchen", room46.build],
  ["room: P6 west bedroom", room47.build],
  ["room: P6 back hall and bunk", room48.build],
  ["room: P7 living room", room49.build],
  ["room: P7 dining room", room50.build],
  ["room: P7 kitchen", room51.build],
  ["room: P7 upper hall", room52.build],
  ["room: P7 north-west bedroom", room53.build],
  ["room: P7 north-east bedroom", room54.build],
  ["room: P7 south-east bedroom", room55.build],
], { palette: "palette.json", roof: "roof.json" });

g.save(out);
console.log(`saved ${out}: ${g.cells.size} cells`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for every part of the Sears row: the server version, the site (plan.md SITE), the palette ids
// (palette.json only) and a seeded random generator. Written once by the scaffold; parts import from here.

// the server's Minecraft version (DataVersion 3955): every block id and state must exist in 1.21.1

// the server's Minecraft version (DataVersion 3955): every block id and state must exist in 1.21.1
export const SERVER_VERSION = "1.21.1";

// the site in cells [x, y, z]: x 0..127 (eight plots of 16), y 0..23, z 0..24 (street z 0..4, plots z 5..24)
export const SITE_SIZE = [128, 24, 25];

// the eight plots (plan.md): plot i covers x 16i .. 16i+15 and is PLOT_WIDTH wide; local x (lx) = absolute x - 16i
export const PLOT_COUNT = 8;

export const PLOT_WIDTH = 16;

// the first and last z of a plot's lawn and back yard (the street is z 0..4)
export const LAWN_Z0 = 5;

export const LAWN_Z1 = 24;

// the street: gravel z 0..2 (y 0), smooth_stone z 3..4 (y 0)
export const STREET_GRAVEL_Z1 = 2;

export const STREET_STONE_Z1 = 4;

// the level of each floor layer (plan.md SITE levels): the lawn y, the ground floor's floor block, the upper floor's
export const GROUND_Y = 0;

export const LAWN_WALK_Y = 1;

export const GROUND_FLOOR_Y = 1;

export const UPPER_FLOOR_Y = 5;

// the top of a two-storey wall (one-storey walls end at y 4), and the Magnolia attic floor
export const WALL_PLATE_Y = 8;

export const ATTIC_FLOOR_Y = 9;

// the absolute x of plot i's first cell (plot 0 starts at x 0)
export const plotX0 = (i) => ...

// the house in each plot (plan.md order): Magnolia, Alhambra, Vallonia, Puritan, Cornell, Stanford, Winona, Craftsman
export const PLOT_HOUSES = ["Magnolia", "Alhambra", "Vallonia", "Puritan", "Cornell", "Stanford", "Winona", "Craftsman"];

// the palette: one constant per block id in palette.json (the role in each comment is its palette role)
// masonry: the bricks block
export const BRICKS = "bricks";

// masonry: the brick stairs block
export const BRICK_STAIRS = "brick_stairs";

// masonry: the brick slab block
export const BRICK_SLAB = "brick_slab";

// masonry: the brick wall block
export const BRICK_WALL = "brick_wall";

// masonry: the mud bricks block
export const MUD_BRICKS = "mud_bricks";

// masonry: the mud brick stairs block
export const MUD_BRICK_STAIRS = "mud_brick_stairs";

// masonry: the mud brick slab block
export const MUD_BRICK_SLAB = "mud_brick_slab";

// masonry: the cobblestone block
export const COBBLESTONE = "cobblestone";

// masonry: the cobblestone slab block
export const COBBLESTONE_SLAB = "cobblestone_slab";

// masonry: the mossy cobblestone block
export const MOSSY_COBBLESTONE = "mossy_cobblestone";

// masonry: the stone bricks block
export const STONE_BRICKS = "stone_bricks";

// masonry: the smooth quartz block
export const SMOOTH_QUARTZ = "smooth_quartz";

// masonry: the smooth quartz stairs block
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";

// masonry: the smooth quartz slab block
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";

// masonry: the quartz pillar block
export const QUARTZ_PILLAR = "quartz_pillar";

// masonry: the quartz stairs block
export const QUARTZ_STAIRS = "quartz_stairs";

// masonry: the smooth stone block
export const SMOOTH_STONE = "smooth_stone";

// masonry: the smooth stone slab block
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";

// masonry: the smooth sandstone block
export const SMOOTH_SANDSTONE = "smooth_sandstone";

// masonry: the white terracotta block
export const WHITE_TERRACOTTA = "white_terracotta";

// masonry: the granite stairs block
export const GRANITE_STAIRS = "granite_stairs";

// body: the white concrete block
export const WHITE_CONCRETE = "white_concrete";

// body: the lime terracotta block
export const LIME_TERRACOTTA = "lime_terracotta";

// body: the birch planks block
export const BIRCH_PLANKS = "birch_planks";

// body: the cyan terracotta block
export const CYAN_TERRACOTTA = "cyan_terracotta";

// body: the calcite block
export const CALCITE = "calcite";

// body: the spruce planks block
export const SPRUCE_PLANKS = "spruce_planks";

// body: the stripped birch log block
export const STRIPPED_BIRCH_LOG = "stripped_birch_log";

// body: the dark oak planks block
export const DARK_OAK_PLANKS = "dark_oak_planks";

// wood_trim: the stripped spruce log block
export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log";

// wood_trim: the stripped dark oak log block
export const STRIPPED_DARK_OAK_LOG = "stripped_dark_oak_log";

// wood_trim: the spruce slab block
export const SPRUCE_SLAB = "spruce_slab";

// wood_trim: the spruce stairs block
export const SPRUCE_STAIRS = "spruce_stairs";

// wood_trim: the spruce fence block
export const SPRUCE_FENCE = "spruce_fence";

// wood_trim: the dark oak stairs block
export const DARK_OAK_STAIRS = "dark_oak_stairs";

// wood_trim: the dark oak slab block
export const DARK_OAK_SLAB = "dark_oak_slab";

// wood_trim: the oak planks block
export const OAK_PLANKS = "oak_planks";

// wood_trim: the oak slab block
export const OAK_SLAB = "oak_slab";

// doors_glass: the dark oak door block
export const DARK_OAK_DOOR = "dark_oak_door";

// doors_glass: the spruce door block
export const SPRUCE_DOOR = "spruce_door";

// doors_glass: the oak door block
export const OAK_DOOR = "oak_door";

// doors_glass: the glass pane block
export const GLASS_PANE = "glass_pane";

// doors_glass: the iron bars block
export const IRON_BARS = "iron_bars";

// shutters: the dark oak trapdoor block
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";

// shutters: the warped trapdoor block
export const WARPED_TRAPDOOR = "warped_trapdoor";

// shutters: the spruce trapdoor block
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";

// ground: the grass block block
export const GRASS_BLOCK = "grass_block";

// ground: the gravel block
export const GRAVEL = "gravel";

// ground: the oak leaves block
export const OAK_LEAVES = "oak_leaves";

// ground: the azalea block
export const AZALEA = "azalea";

// ground: the flowering azalea block
export const FLOWERING_AZALEA = "flowering_azalea";

// ground: the poppy block
export const POPPY = "poppy";

// ground: the dandelion block
export const DANDELION = "dandelion";

// ground: the allium block
export const ALLIUM = "allium";

// ground: the lilac block
export const LILAC = "lilac";

// ground: the potted poppy block
export const POTTED_POPPY = "potted_poppy";

// ground: the potted dandelion block
export const POTTED_DANDELION = "potted_dandelion";

// ground: the potted allium block
export const POTTED_ALLIUM = "potted_allium";

// ground: the potted azalea bush block
export const POTTED_AZALEA_BUSH = "potted_azalea_bush";

// ground: the coarse dirt block
export const COARSE_DIRT = "coarse_dirt";

// ground: the podzol block
export const PODZOL = "podzol";

// fire: the campfire block
export const CAMPFIRE = "campfire";

// fire: the hay block block
export const HAY_BLOCK = "hay_block";

// lighting: the lantern block
export const LANTERN = "lantern";

// lighting: the candle block
export const CANDLE = "candle";

// lighting: the wall torch block
export const WALL_TORCH = "wall_torch";

// furniture: the white bed block
export const WHITE_BED = "white_bed";

// furniture: the red bed block
export const RED_BED = "red_bed";

// furniture: the blue bed block
export const BLUE_BED = "blue_bed";

// furniture: the green bed block
export const GREEN_BED = "green_bed";

// furniture: the barrel block
export const BARREL = "barrel";

// furniture: the smoker block
export const SMOKER = "smoker";

// furniture: the furnace block
export const FURNACE = "furnace";

// furniture: the cauldron block
export const CAULDRON = "cauldron";

// furniture: the composter block
export const COMPOSTER = "composter";

// furniture: the chest block
export const CHEST = "chest";

// furniture: the bookshelf block
export const BOOKSHELF = "bookshelf";

// furniture: the oak fence block
export const OAK_FENCE = "oak_fence";

// furniture: the oak pressure plate block
export const OAK_PRESSURE_PLATE = "oak_pressure_plate";

// furniture: the spruce pressure plate block
export const SPRUCE_PRESSURE_PLATE = "spruce_pressure_plate";

// furniture: the oak stairs block
export const OAK_STAIRS = "oak_stairs";

// furniture: the birch stairs block
export const BIRCH_STAIRS = "birch_stairs";

// furniture: the white carpet block
export const WHITE_CARPET = "white_carpet";

// furniture: the red carpet block
export const RED_CARPET = "red_carpet";

// furniture: the brown carpet block
export const BROWN_CARPET = "brown_carpet";

// furniture: the flower pot block
export const FLOWER_POT = "flower_pot";

// furniture: the loom block
export const LOOM = "loom";

// furniture: the crafting table block
export const CRAFTING_TABLE = "crafting_table";

// furniture: the ladder block
export const LADDER = "ladder";

// object: the deepslate bricks block
export const DEEPSLATE_BRICKS = "deepslate_bricks";

// object: the deepslate tiles block
export const DEEPSLATE_TILES = "deepslate_tiles";

// object: the birch slab block
export const BIRCH_SLAB = "birch_slab";

// a seeded random generator (mulberry32): rng(seed)() gives the next float in [0, 1); the same seed gives the same build
export function rng(seed)
```

### vocab/h1.mjs

```js
// Sears Modern Homes row: vocabulary helpers, set 1 (plan.md VOCABULARY): lawn, windowPair, windowBox, arcadeBay,
// dormerGable, gablePorch, porchLantern, diningSet. Same contract as set 2 (h2.mjs): every helper takes absolute
// coordinates and returns { box, placed, refused }: box is the footprint it may write inside, placed counts the cells it
// wrote. Writes go into air only, never outside the box, and never at y0 (ground) except lawn, which is the ground. A
// cell another part already built is refused and counted, not overwritten; the same block already there is left alone.
// Options that may replace solid cells are named (frame, over) and off unless the caller passes them.

/** The lawn of plot `plot` (x 16·plot .. 16·plot+15): gravel at y0 z0..2 and smooth_stone at y0 z3..4 (the street), and
 *  grass_block at y0 z5..24, with coarse_dirt or podzol on about 1 cell in 12 of the back yard (z21..24, by the hedge).
 *  The one helper that writes at y0, since it is the ground itself. Lay the walk and ramp first: the lawn only writes
 *  into air, so it leaves their cells alone. */
export function lawn(g, plot)

/** A two-pane window (glass_pane, 2 wide x 2 tall) in the wall plane, its lower-left pane at x,y,z. face is the way the wall
 *  looks: north and south run the window along x, east and west along z. frame: true also lays the sill (top slab, y-1) and
 *  the lintel (trim block, y+2), one cell past each side; they replace wall body, which is why it is opt-in. */
export function windowPair(g, { x, y, z, face = "north", trim = "smooth_quartz", trimSlab = `${trim}_slab`, frame = false })

/** A window box under a pane pair's sill, on the outside: w top slabs (spruce) one cell out from the wall at y-1, under the
 *  sill, with a potted flower on each at y. A pot needs a sturdy top face, so the ledge is a top slab and never a bottom
 *  one. The spec's closed spruce trapdoor cannot carry a pot and is not used. Runs along the wall from x,z; face is the
 *  way the wall looks (north: the box sits on the -z side). */
export function windowBox(g, { x, y, z, w = 2, face = "north" })

/** One bay of an arcade on the front plane z: white_terracotta piers at x0 and x1 (y..y+2), a 2-wide opening between them
 *  clear at y..y+1, and upside-down brick_stairs over the two opening cells at y+2 (the brick span, each stair's back against
 *  its pier). Three bays share piers: call it for x0..x1 = 19..22, 22..25, 25..28; a shared pier is left alone. */
export function arcadeBay(g, { x0, x1, z, y = 2 })

/** A front-gabled dormer with its front on zFront, depth +z (3 cells), x0..x1 wide (even width), rising from y0 to its peak
 *  y1 = y0 + 2 + half the width. The cheeks and the solid under the roof are body; the roof is two slopes of trim stairs (the
 *  outer course is the verge) and the gable front is body. The window opening (x0+1..x1-1, y0+1..y0+2 on zFront) is left
 *  air for the fittings to glaze. Air only, so the roof tool's cells stay as they are. */
export function dormerGable(g, { x0, x1, zFront, y0, y1, trim = "birch", body = "lime_terracotta" })

/** A small gabled entry porch in front of a door: front plane z0, depth to z1, x0..x1 wide (even). A deck at y1 (x0..x1,
 *  z0..z1), two posts (column, axis y) at x0 and x1 on z0 (y2..4), the eave at y5 and a gable of stairs rising to a ridge at
 *  y = 5 + half the width. The gable front (z0) is infill, the outer course of each slope is the verge, and the underside of
 *  the roof is solid. */
export function gablePorch(g, { x0, x1, z0, z1, deck = "oak_planks", column = "stripped_birch", roof = "spruce", verge = "birch", infill = "smooth_sandstone" })

/** A lantern hanging from the block above it, at x,y,z. It needs a solid block at y+1 (the porch beam or eave, laid first);
 *  with nothing above, it is refused rather than placed floating. */
export function porchLantern(g, { x, y, z })

/** A dining table and two stair chairs in a 2 x 3 footprint from its north-west cell (x, z), on floor layer y (the furniture
 *  stands at y+1). The table is an oak fence post at (x, y+1, z+1) with a top slab on it at y+2. The chairs are stairs at
 *  the north and south ends of the same column, facing away from the table. The east column stays clear at y+1..y+2 for the
 *  whole depth, so a walker can pass the set. Fits the smallest dining room in ROOMS (P5 dining nook, x90..91 z15..17). */
export function diningSet(g, { x, y, z, wood = "oak" })
```

### vocab/h2.mjs

```js
// Sears Modern Homes row: vocabulary helpers, set 2 (plan.md VOCABULARY).
// Every helper takes absolute coordinates and returns { box, placed, refused }: box is the footprint it may write
// inside, and placed counts the cells it wrote. Writes go into air only, never at y0 (ground), and never outside the
// box. A cell another part already built is refused and counted, not overwritten. The one exception is a frame
// option (windowTriple) that lets trim replace the wall body; it is off unless the caller passes frame: true.

/** Hedge along the back of a plot: persistent oak_leaves at y1, back row z (default 24), sides two deep (z-2..z-1). */
export function hedge(g, { x0, w = 16, z = 24 })

/** A 3-wide window (plain panes, 2 tall) with its first pane at x,y,z. face is the way the wall looks: north and south
 *  run the window along x, east and west along z. frame: true also sets the trim sill (top slab, y-1) and the lintel
 *  (trim block, y+2), one cell past each side; it may replace wall body, which is why it is opt-in. */
export function windowTriple(g, { x, y, z, face = "north", trim = "smooth_quartz", trimSlab = `${trim}_slab`, frame = false })

/** Magnolia-style full-height portico on the front plane z0: smooth_quartz deck at y1, quartz_pillar columns at x0, x0+2,
 *  x1-2, x1 (y2..8), entablature at y9, and the pediment at z0: tympanum at y10..11, rakes of rake stairs to a two-cell
 *  peak at x0+3..x1-3, y12. Depth z0..z1. */
export function portico(g, { x0, x1, z0, z1, deck = "smooth_quartz", column = "quartz_pillar", trim = "smooth_quartz", rake = "quartz" })

/** A tapered pier at x,z: stone at y2..3, a fence post at y4 (the taper), a stripped log beam at y5 running along x from
 *  x to beamTo (default: just its own cell). The cell under the pier (y1) belongs to the porch deck and is not written. */
export function taperedPier(g, { x, z, beamTo = x, stone = "cobblestone", post = "spruce", beam = "stripped_spruce" })

/** A 1-storey porch on the front row z0 (deck to z1): quartz columns at x0, x0+3, x1-3, x1 (y2..4) on bricks piers at y1,
 *  a full-width frieze at y5, and a deck at y1 under the rest. Piers go first so the deck skips their cells. */
export function squarePorch(g, { x0, x1, z0, z1, column = "smooth_quartz", pier = "bricks", frieze = "smooth_quartz", deck = "oak_planks" })

/** Foundation planting on the lawn in row z, from x0 to x1, at y1 on grass only. skip: [[xa, xb], ...] ranges of walk and
 *  ramp cells that get no plant. Plants cycle through the list. */
export function foundationPlanting(g, { x0, x1, z, skip = [], plants = ["azalea", "poppy", "flowering_azalea", "allium"] })

/** Parlour furniture in a 3 x 3 footprint from its north-west corner (x0, z0): bookshelf (at most one, shelf true) in the
 *  corner, a spruce fence table with a pressure plate top at the middle, and two stair chairs facing it. The south row and
 *  the east column past the table stay clear at y2..3. Fits the smallest parlour in ROOMS (P5, x84..86 z15..17). The
 *  floor layer is floorY (default 1); the furniture stands on it. */
export function parlourSet(g, { x0, z0, floorY = 1, wood = "spruce", shelf = true })

/** The shed dormer front and cheeks: a front wall of body at zFront (trim on its top row, openings left as air), and
 *  cheeks of body at x0 and x1 one cell back, into the house (face north: depth +z). The dormer's roof is not built here;
 *  the roof tool's dormers option builds it. */
export function dormerShed(g, { x0, x1, zFront, y0, y1, face = "north", body = "birch_planks", trim = "smooth_quartz", openings = [] })
```

### vocab/h3.mjs

```js
// Sears Modern Homes row: vocabulary helpers, set 3 (plan.md VOCABULARY).
// Every helper takes its position (and facing) as arguments and returns { box, placed, refused }: box is the footprint
// it may write inside, placed counts the cells it wrote. Writes go into air only, and a helper is all or nothing: if any
// cell of its footprint is taken, nothing is written and refused counts the taken cells. Nothing is written outside the
// box. The one exception to "never at y0" is accessRamp's walk, which the plan names as its own ground.

/** Accessible way in: a smooth_stone walk at y, two bottom smooth_stone_slabs at y+1 (the ramp), then a full deck
 *  block at y+1 (at least 2 x 2). Walk z0..deckZ0-3, ramp deckZ0-2..deckZ0-1, deck deckZ0..deckZ1, across x..x+w-1.
 *  deck: the plot's deck block id. Never stairs. Writes no ground under the ramp or the deck: the ground part owns that. */
export function accessRamp(g, { x, w, z0, deckZ0, deckZ1, deck, y = 0 })

/** A door, two high, its lower half at [x, y, z]. face: the way it faces out of the house. hinge: left or right.
 *  double: a second leaf beside it (+x on a north or south wall, +z on east or west) hinged the other way. The
 *  threshold is the floor the caller already laid. */
export function doorSet(g, { x, y, z, face: facing, wood, hinge = "left", double = false })

/** Balcony: a floor block layer at y over x0..x1 by z0..z1, an iron_bars rail at y+1 along the front (z0) and both
 *  sides. The rail bars connect to the rail cells beside them. The back edge (z1) meets the house wall, so the French
 *  door behind it is doorSet's job. */
export function balcony(g, { x0, x1, z0, z1, y, floor = "smooth_quartz", rail = "iron_bars" })

/** A knee brace: one upside-down stair under a rake or eave at [x, y, z]. dir: the way its lip projects, away from the
 *  wall (its back is set into the wall, the stair's facing). One per two cells along the rake. */
export function kneeBrace(g, { x, y, z, dir, wood = "spruce" })

/** Hipped dormer on a front: x0..x1 wide and three deep (zFront..zFront+2). Walls at y0 and y0+1: trim corner boards at
 *  the front, body for the cheeks and back. The front centre is the window opening and stays air for the window part.
 *  The hip runs from y0+2 to y1 in stairs (roofStairs) that step in one cell a row, with full roof blocks inside and on the
 *  last row, which closes it flat. body, roof and roofStairs are block ids; roof is the full block. */
export function dormerHip(g, { x0, x1, zFront, y0, y1, trim, body, roof, roofStairs })

/** A gabled door hood three cells wide (x0..x0+2) at [z, y]: stairs sloping in to a full centre block at y, a slab cap
 *  at y+1. Projects out of the wall at z, so the door behind it is doorSet's. */
export function doorHood(g, { x0, x1, z, y, trim = "smooth_quartz" })

/** A bed: the foot at [x, y, z], the head one step toward facing, both halves via bed(). The cell past the head must be
 *  solid (a window or open doorway refuses it), the two cells above both halves must be clear, and the two cells past
 *  the foot (y and y+1) stay clear as a lane. colour: a dye name (red, white, blue, green...). */
export function bedSet(g, [x, y, z], facing, colour = "red")

/** A dresser: `length` barrels (1 to 3, lids up) in a row along the wall at [x, y, z], their fronts toward facing. The
 *  two cells in front of the row (y and y+1) stay clear as a lane. */
export function dresser(g, { x, y, z, facing, length = 2 })
```

### vocab/h4.mjs

```js
// Sears row vocabulary, batch 4 (plan.md VOCABULARY items 4, 8, 12, 16, 18, 20, furniture).
// Every helper takes absolute coordinates and a footprint it derives from them. It writes only inside that footprint,
// only into air (a cell that is not air is skipped, never overwritten), and it never writes ground (y 0).
// chimneyStack is the one exception: chimney() lays the stack over the roof, and the band overwrites the stack's own masonry.

// ---- 4. clapboardWall -------------------------------------------------------------------------------------------------
/** A wall of body blocks over box [x0,y0,z0,x1,y1,z1] (one cell thick on a plan wall). The four corner columns take
 *  trim (corner boards); the row at bandY takes band (string course); cells inside a holes box stay air (openings).
 *  (courseSlab is not used: plan.md keeps full blocks.) */
export function clapboardWall(g, { box, body, trim = body, band = null, bandY = 5, holes = [] })

// ---- 8. shutterPair ---------------------------------------------------------------------------------------------------
/** Two open trapdoor shutters, 2 high, in the cell in front of the wall at x0 and x1 (either side of a window).
 *  face: the way the wall looks; trap: the wood ("dark_oak", "warped", "spruce"). Lays them with shutter(). */
export function shutterPair(g, { x0, x1, y, z, face, trap = "dark_oak" })

/** A stepped parapet on the plan wall at z. steps: [[y, x0, x1], ...], bottom row first. piers: top y of the two square
 *  end piers that rise from the first row's ends (plan: x18 and x29 to y10). Each column's top cell is coping:
 *  brick_stairs turned toward a higher neighbour (rising inward), otherwise brick_slab. body fills the rest.
 *  vent: {x0, x1, y} glass panes set into the body. */
export function shapedParapet(g, { z, steps, piers = null, vent = null, body = "white_terracotta", coping = "brick" })

// ---- 16. rafterTails --------------------------------------------------------------------------------------------------
/** Exposed rafter tails along an eave course at row z (beyond the wall line), x0..x1: alternate cells, a flat wood
 *  trapdoor then a wood stair lip, both turned to face into (the way to the wall). */
export function rafterTails(g, { x0, x1, z, y, into = "south", wood = "spruce" })

// ---- 18. pedimentPorch ------------------------------------------------------------------------------------------------
/** Pedimented entry porch (plan: Puritan), 3 cells wide: deck at y, two pillars at x0 and x1 on the front row
 *  (y+1..y+3), entablature at y+4, a tympanum at the centre of y+5 with stair rakes either side, peak at y+6.
 *  facing: north (front row z0) or south (front row z1). trim: "quartz" gives quartz_pillar, quartz_stairs, smooth_quartz. */
export function pedimentPorch(g, { x0, x1, z0, z1, y = 1, facing = "north", trim = "quartz" })

// ---- 20. chimneyStack -------------------------------------------------------------------------------------------------
/** A brick chimney through chimney() (wall + into, or at + open, as chimney takes them), then this helper's courses:
 *  a deepslate_bricks band on the stack's four faces one course under the top, and a brick_slab cap ring on top that
 *  steps out by 1 (the flue cell stays open). chimney() writes hay under the fire at y 0, which is ground, so that is
 *  left out unless hay is true. The band overwrites the stack's own masonry; the cap writes only into air. */
export function chimneyStack(g, { wall = null, into = null, at = null, open = "south", top, hay = false })

// ---- furniture for designers ------------------------------------------------------------------------------------------
/** A kitchen run along x: smoker, furnace and barrel at feet level y (x..x+2 at row z), a bottom-slab counter on top.
 *  facing: the way the front looks, into the room. The run is three cells wide to fit the 3-wide P0 kitchen; the cell
 *  row in front of it is left clear. */
export function kitchenStove(g, { x, y, z, facing = "north", wood = "oak" })

/** A coat rack: a fence post at feet level with a standing banner on top, its cloth turned to facing. */
export function coatRack(g, { x, y, z, facing = "north", color = "brown", wood = "spruce" })
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

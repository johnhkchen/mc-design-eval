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

Checklist: [x] 1 [ ] 2 [ ] 3 [ ] 4 [ ] 5 [ ] 6

## NOTES
- Respect every RESERVED cell; chimney() overwrites, call it directly after the roofs.
- Door cells and window cells stay air in Parts 1-2; Part 5 fills them.
- The way in: walk z5..6 flat, ramp slabs two cells, deck full block y1; verify `$MCD approach build.nbt --from <street> --to <entrance>`.
- Stairs by `flight()`, top step flush with floor y5.
- Beds: bed() only, head on a solid wall, never a window.
- No chain id, no 1.21.4+ blocks. Everything within the plot.
- shell-west: P2/P3 gable-end infill: P3 gambrel end walls (birch, x51/x61 y5..10) are built in shell-west; P2 gable ends and P0/P1 parapet left to roof/porches. Flights are built in shell-west (stairs part empty). Chimney wall cells left air at y1..3. No interior partitions (rooms are zones).
- Stairs part (ran before shell-east): flights for P4 (68,15 S), P5 (92,19 N), P7 (115,15 S) are placed, plus one air cell at y5 over each first step; unverified until shell-east exists (shell-east must leave the y5 hole cells and the flights' air alone). P0 attic ladder at x11 z17 y6..10. No rails yet.

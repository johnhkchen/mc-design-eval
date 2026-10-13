# Townhouse trio with redstone shops — architect's plan

Identity: a Victorian high-street terrace of three attached brick shop-houses, each with its own steep front gable to the
street, a dark painted shopfront and fascia on the ground floor, two storeys of flats above, and a sandstone trim
"skeleton" (piers, string course, cornice, gable coping) that every house shares. Four material roles only
(walls / trim / fascia / roof), so each house can be reskinned on its own while the row keeps its rhythm.

## SITE

Lot x 0..38, z 0..32. The street is NORTH (-z); x runs along the street. Seen from the street, +x is on the LEFT, so the
houses read left to right H1 (high x), H2, H3 (low x). Party walls are shared cells (x 13, x 25).

`sockets.json` is written (three `sockets layout --face north --units DS` runs at x 33, 21, 13, z 8, y 1, merged): read it,
never move it. Shop floor = world y 1 (the block), road = world y 0.

| mass | x | y | z | notes |
|---|---|---|---|---|
| ground (solid, under everything) | 0..38 | -5..0 | 0..32 | must reach y -5 under the sockets (pits at y -4) |
| road | 0..38 | 0 (top) | 0..4 | cobbles |
| kerb | 0..38 | 1 | 5 | one course above the road |
| sidewalk | 0..38 | 1 (top) | 6..7 | level with the shop floor; z 6..7 is the customers' clear strip |
| H1 (left, bookseller) | 25..37 | 1..18 walls | 7..24 | shop x 25..33, stair lobby x 34..36, end wall x 37 |
| H2 (middle, florist) | 13..25 | 1..18 walls | 7..24 | shop x 13..21, stair lobby x 22..24, party wall x 25 |
| H3 (right, ironmonger, mirrored) | 1..13 | 1..18 walls | 7..24 | end wall x 1, stair lobby x 2..4, shop x 5..13 |
| front gables (one per house) | H1 25..37, H2 13..25, H3 1..13 | 19..25 | z 7 (front), z 24 (rear) | brick triangle under each roof |
| rear chimney stacks (external, one per house) | H1 30..32, H2 18..20, H3 6..8 | 1..28 | 25..26 | own footing on the ground at y 1; flue x 31 / 19 / 7 |
| rear yards (one per house) | H1 26..36, H2 14..24, H3 2..12 | 1 (top) | 25..32 | walls on x 1, 13, 25, 37 and z 32 |
| lamp posts | 1, 13, 25, 37 | 2..5 | 5 | on the kerb, outside every counter's clear strip |

Sockets (from sockets.json; world coords; counter edge z 8, envelope runs south):

| id | house | kind | box x | box y | box z | tenant |
|---|---|---|---|---|---|---|
| A1 | H1 | deep | 30..32 | -3..7 | 8..20 | bookseller "BOOKS": books and maps (Folio) |
| A2 | H1 | shallow | 26..28 | -3..6 | 8..16 | bookseller: ink, quills, paper (3 stalls) |
| A3 | H2 | deep | 18..20 | -3..7 | 8..20 | florist "FLORA": flowers and saplings (Folio) |
| A4 | H2 | shallow | 14..16 | -3..6 | 8..16 | florist: seeds and bone meal (3 stalls) |
| A5 | H3 | deep | 10..12 | -3..7 | 8..20 | ironmonger "TOOLS": iron, tools, chain (Folio) |
| A6 | H3 | shallow | 6..8 | -3..6 | 8..16 | ironmonger: rails and lanterns (3 stalls) |

Wall lines (glass only, y -3 up to the top of the envelope; the fit-out lays them): x 33, 29, 21, 17, 13, 9 over z 8..20;
x 25 and x 5 over z 8..16. Fit-out back walls at z 21 (deep) and z 17 (shallow).

## ROOFS

- One roof per house, three `roof()` calls, preset `shop` (steep FRONT gable, gable end to the street), with overrides:
  `pitch: 45`, `ridgeAxis: "z"`, `front: "north"`, `y: 19`, `material: "slate"`, verge and ridge in the trim
  (`smooth_sandstone` / its slab).
  - H1 footprint x 25..37, z 7..24; ridge on x 31 at y 25, running z 6..25.
  - H2 footprint x 13..25, z 7..24; ridge on x 19 at y 25.
  - H3 footprint x 1..13, z 7..24; ridge on x 7 at y 25.
- Overhang 1 to the street (verge at z 6) and to the rear (z 25); 1 at the outer ends (x 38 over H1, x 0 over H3).
  Between houses overhang 0 (`--why "attached terrace: neighbouring gables meet in a valley on the party wall"`): the
  eaves of the two roofs meet at y 19 on x 13 and x 25, a lead-grey valley; the later roof may overwrite the shared
  cell with its own eave block.
- Three identical parallel gables = the "three houses" silhouette; the sawtooth of gables is the row's signature.
- Gable triangles (y 19..25 at z 7 and z 24) are the WALL's job (brick body), filled by the roof tool's gable fill in
  `bricks`, with a trim coping (verge) of smooth sandstone stairs.
- Chimneys: `keep` boxes H1 x 30..32 z 25..26, H2 x 18..20, H3 x 6..8 (same z), y 19..28; the rear eave meets each stack
  on its sides. Stack top: band course of `stone_bricks` at y 26, cap of smooth sandstone slabs stepping out 1 at y 28,
  a lit signal campfire on hay in the flue at y 28 (hay y 27).
- Attic is a loft (floor y 18), lit by the gable window; no dormers (the 13-span gable has no big plane to break).

## FACADES

Front (north, z 7), per house, using `a` = the house's low-x party/end wall (H1 a=25, H2 a=13, H3 a=1); window bays are
symmetric about x a+6, so the mirror of H3 does not change them.

| band | y | what | depth |
|---|---|---|---|
| sidewalk / threshold | 1 | polished andesite paving to the counters and the lobby door | 0 |
| shopfront (open) | 2..4 | over x a..a+8 (H3: x 5..13): fully OPEN at z 6..7 (customers see the counters at z 8 and the glass fins of the wall lines) | — |
| lobby bay | 2..7 | brick wall at z 7 with the residents' door; plinth course y 1..2 of stone bricks | 0 |
| fascia | 5..7 | dark oak board at z 7 between the shop's two piers (H1 x 26..32, H2 x 14..20, H3 x 6..12; 7 wide x 3 high); name in banner letters on y 6..7, awning at y 5 | 0 (awning +1 at z 6) |
| string course / shop cornice | 8 | smooth sandstone stairs upside-down at z 6 along the whole house, over the fascia and the lobby | +1 |
| flat 1 | 9..12 | brick, 2 thick (z 7..8); 3 windows: x a+2..a+3, a+5..a+7 (centre, French window), a+9..a+10 | windows -1 (glass at z 8) |
| flat 2 | 13..17 | brick; same 3 windows one storey up; sill course at y 14 | windows -1 |
| main cornice | 18 | smooth sandstone stairs upside-down at z 6, and a slab row at z 6 y 17 under it as a dentil line every 2nd cell | +1 |
| gable | 19..25 | brick triangle; attic window x a+5..a+7 y 21..22 with a trim surround; sandstone coping on the verges | window -1 |

Piers (smooth sandstone, `cut_sandstone` faces, 1 proud at z 6): the vertical frame each house is read by.
- End piers x 37 (H1) and x 1 (H3): y 1..17, full height (outside every clear strip).
- Party piers x 25 and x 13: y 5..17 only (the shopfront below stays open), carried at y 5 by an upside-down stair
  bracket.
- Shop/lobby piers H1 x 33, H2 x 21, H3 x 5: y 5..17, same bracket. The middle wall lines (x 29, 17, 9) get NO pier:
  each house's fascia is one 7-wide board for one tenant.
- Quoins: none at the piers (the pier IS the corner); on the end walls' rear corners (x 1 and x 37 at z 24) paired
  sandstone quoins y 2..17, two on, two off.

Openings' trim: every upper window has a sill (a smooth sandstone stair, upside-down, facing the street) at z 6 one
under the opening and a lintel (smooth sandstone, flush at z 7) one above. The flat-1 centre French window has a Juliet
balcony: smooth sandstone slab deck (bottom) at y 9, z 6, x a+4..a+8, with an `iron_bars` rail at y 10 on z 6
(x a+4..a+8).

Lobby door bay (H1 x 34..36, H2 x 22..24, H3 x 2..4): door in the middle cell, a glass fanlight over it at y 4, a sandstone
lintel at y 5, a hanging lantern each side at y 4 on the wall. Above y 5 the lobby bay is plain brick up to the string
course at y 8.

Shopfront dressing (the SHOPFRONTS part, the shop decorator's, from y 5 up only): fascia lettering (banner letters,
BOOKS / FLORA / TOOLS), a striped awning at y 5 z 6 (stairs) across the 7 cells between the piers, a hanging sign on
a bracket from the shop/lobby pier at y 5..6, a lantern under the awning, the product shown on the pier faces at y 5..7.
Shop colours: H1 blue, H2 green with pink flowers, H3 red. Nothing in z 6..7 between y 2 and 4 over x a..a+8.

Side faces (x 37 and x 1, the end walls): brick on a stone-brick plinth y 1..2, cornice and string course returned
round the corner (stairs at x 38 / x 0 on y 8 and y 18 from z 6 to z 24); windows to the stair hall at z 13..14 on y 10..11
and y 15..16.

Rear (south, z 24): brick, plinth y 1..2; rear door to the yard per lobby; two windows per flat (x a+2..a+3 and
x a+9..a+10 at y 10..11 and y 15..16), sandstone sills; the external chimney stack in the middle of each rear gable.

## MATERIALS

| role | block | reads as |
|---|---|---|
| WALLS (body, ~60%) | `bricks` | warm red brick, the terrace's mass |
| TRIM (piers, string course, cornice, sills, lintels, gable coping, quoins, balcony deck) | `smooth_sandstone`, `smooth_sandstone_stairs`, `smooth_sandstone_slab`, `cut_sandstone` (pier faces) | pale cream lines against the red, read from across the street |
| FASCIA (fascia boards, lobby doors, shop and door frames) | `dark_oak_planks`, `dark_oak_stairs`, `dark_oak_slab`, `dark_oak_door` | dark painted shopfront joinery |
| ROOF | `slate` palette (cobbled deepslate, deepslate tiles, polished deepslate; blackstone-brick eave, stone-brick ridge) | grey slate, clearly darker than the brick |
| BASE (plinth course, kerb, chimney band) | `stone_bricks` | grey stone footing |
| sidewalk | `polished_andesite` | |
| road | `cobblestone` with `andesite` (about 1 in 4) | setts |
| glass | `glass_pane` (windows, fanlights) | |
| metal | `iron_bars` (Juliet rails), `lantern` | |
| yard ground | `grass_block` with `coarse_dirt` patches, a `dirt_path` from each rear door; yard walls `brick_wall` | |

Reskin rule: a house's palette swaps exactly these four roles (WALLS, TRIM, FASCIA, ROOF) inside its x range; BASE,
paving and glass stay shared so the row keeps one footing and one street.

## OPENINGS

Doors are 1 wide x 2 high (y 2..3) unless noted; windows given as x range, y range, wall cell.

| opening | where |
|---|---|
| shopfronts (open, no glass) | H1 x 25..33, H2 x 13..21, H3 x 5..13; y 2..4; z 7 (and nothing at z 6) |
| lobby front doors | H1 x 35, H2 x 23, H3 x 3; z 7; fanlight glass y 4 same x |
| lobby rear doors (to yard) | H1 x 35, H2 x 23, H3 x 3; z 24 |
| keeper's doors (lobby → service aisle) | H1 x 33, H2 x 21, H3 x 5; z 22; in a brick partition on that x, z 21..23 |
| front windows, flat 1 | x a+2..a+3, a+9..a+10 at y 10..11; centre x a+5..a+7 at y 9..11 (French window over the balcony); opening at z 7, glass at z 8 |
| front windows, flat 2 | x a+2..a+3, a+5..a+7, a+9..a+10 at y 15..16; opening z 7, glass z 8 |
| attic gable windows | x a+5..a+7, y 21..22, front z 7 (glass z 8); none at the rear (chimney) |
| rear windows | x a+2..a+3 and a+9..a+10, y 10..11 and y 15..16, z 24 |
| end-wall stair-hall windows | x 37 and x 1, z 13..14, y 10..11 and y 15..16 |

(a = 25 for H1, 13 for H2, 1 for H3: H1 front windows x 27..28, 30..32, 34..35; H2 x 15..16, 18..20, 22..23;
H3 x 3..4, 6..8, 10..11.)

## RESERVED

- Every socket box and wall line in sockets.json, and the clear space over each socket to y 7: no shell, floor, beam or
  light there. `runParts` lays the fit-out (counters, glass wall lines, back walls at z 21 / z 17, pits).
- Customers' clear strip: z 6..7, y 2..4, over x 5..13, 13..21, 25..33 (H3, H2, H1 shops): no pier, step, lamp,
  planter.
- Stair wells (shell leaves the floors open): over flight 1 the floor y 8 is open at x (H1 35..36, H2 23..24, H3 2..3),
  z 12..17; over flight 2 the floor y 13 is open at x (H1 34, H2 22, H3 4), z 16..19 (the top step at z 15 is in the y 13 layer).
- Chimney stacks x 30..32 / 18..20 / 6..8, z 25..26, y 1..28: the roof and yard keep clear.
- Fascia cells z 7, y 5..7 over each shop: built by the shell in dark oak, lettered by the shopfronts part (banners on the
  face at z 6).

## FLOORS

| storey | floor block y | clear y | interior volume (per house) |
|---|---|---|---|
| shop storey | 1 | 2..7 | sockets (shop rooms are the machines); lobby/stair hall x 34..36 / 22..24 / 2..4, z 8..23; back store behind the shallow socket x 26..28 / 14..16 / 6..8, z 18..21; service aisle x 26..32 / 14..20 / 6..12, z 22..23 |
| flat 1 | 8 | 9..12 | x a+1..a+11, z 9..23 (front wall 2 thick: interior starts z 9) minus the stair well; living room to the street, kitchen and bedroom to the rear |
| flat 2 | 13 | 14..17 | same plan; bedroom and parlour to the street |
| loft | 18 | 19..24 (under the ridge) | x a+1..a+11 under the gable, z 9..23 |

Stairs (per house, in its lobby): flight 1, 2 wide on the lobby's outer side (H1 x 35..36, H2 x 23..24, H3 x 2..3),
rising SOUTH from z 12 (step y 2) to z 17 (step y 7), landing on the y 8 floor at z 18..23; flight 2, 1 wide on the inner
side (H1 x 34, H2 x 22, H3 x 4), rising NORTH from z 19 (step y 9) to z 15 (step y 13 = the flat-2 floor), landing
z 9..14; a ladder from flat 2 to the loft through a hatch at (H1 x 34, H2 x 22, H3 x 4), z 10. Flat doors open off each
landing through the partition x a+8 (H3: x 5) at y 9..10 and y 14..15. Keeper's route: lobby → keeper's door → service
aisle behind the back walls; customers never enter it.

# DESIGNER'S SECTIONS

## PALETTE (roles; ids exactly as architect)
- WALLS `bricks` (+ `brick_stairs`, `brick_slab`, `brick_wall` yard walls)
- TRIM `smooth_sandstone`, `smooth_sandstone_stairs`, `smooth_sandstone_slab`, `cut_sandstone`, `sandstone_wall` (smooth_sandstone_wall is unknown)
- FASCIA `dark_oak_planks`, `dark_oak_stairs`, `dark_oak_slab`, `dark_oak_door`, `dark_oak_fence`, `dark_oak_trapdoor`, `dark_oak_hanging_sign`
- ROOF slate palette: `cobbled_deepslate`, `deepslate_tiles`, `polished_deepslate`, eave `polished_blackstone_bricks` (blackstone_bricks unknown), ridge `stone_bricks`
- BASE `stone_bricks`, `stone_brick_stairs`, `stone_brick_slab`; paving `polished_andesite`; road `cobblestone`+`andesite`
- Fill: `glass_pane`, `iron_bars`, `lantern`, `iron_chain` (not `chain`), `ladder`, `hay_block`, `campfire`, `grass_block`, `coarse_dirt`, `dirt_path`
- Shop colour (awning stairs, with `quartz_stairs` stripe): H1 `dark_prismarine_stairs` + blue banners; H2 `waxed_oxidized_cut_copper_stairs` (green); H3 `red_nether_brick_stairs`
- Product: `bookshelf`, `flower_pot`, `potted_azalea_bush`, `potted_pink_tulip`, `anvil`, `barrel`

## VOCABULARY
- `fascia_board(a)`: dark_oak_planks z 7, y 5..7, x a+1..a+7; letters z 6 via `plaque`.
- `shop_name(a, word, colour)`: banner letters on y 6..7 at z 6, colour banner contrasting dark oak.
- `awning(a, stairStairs)`: y 5 z 6, x a+1..a+7, stairs facing north (high side to the wall), alternate shop stairs/quartz_stairs; lantern hanging at y 4? NO (clear strip): lantern hangs under awning front at y 4 only on pier side x a, a+8 z 5? Use hanging lantern at y 5 z 5 from a fence arm.
- `hanging_shop_sign(x,word)`: dark_oak_fence arm at y 6 z 5..6 from pier, dark_oak_hanging_sign below, y 5.
- `pier(x, y0, y1)`: cut_sandstone z 6 and smooth_sandstone z 7; party piers y 5..17 on an upside-down smooth_sandstone_stairs bracket at y 5 beneath.
- `cornice_run(y, x0, x1)`: upside-down smooth_sandstone_stairs facing south at z 6; y 8 and y 18; dentils: bottom-half... top slabs at y 17 every 2nd x.
- `window_bay(x0,x1,y0,y1,wallZ)`: air opening, glass_pane at z 8 (connected), smooth_sandstone lintel above, upside-down smooth_sandstone_stairs sill at z 6 one under.
- `juliet_balcony(a)`: smooth_sandstone_slab bottom y 9 z 6 x a+4..a+8; iron_bars y 10 z 6 same x.
- `lobby_door(x)`: dark_oak_door lower/upper facing north y 2..3 z 7, glass_pane y 4, smooth_sandstone lintel y 5, wall lanterns at x-1 and x+1, y 4, z 6.
- `stair_flight(...)`: stone_brick_stairs/oak-free: dark_oak_stairs facing up-direction, half bottom, one per step per plan stairs section; dark_oak_fence rail on open side.
- `loft_ladder(x,z=10)`: ladder y 14..18 on the wall, hatch open dark_oak_trapdoor at y 18.
- `chimney_stack(x0)`: bricks 3x3 x0..x0+2, z 25..26, y 1..25 with 1x1 air flue at x0+1 (z 25), band stone_bricks y 26, smooth_sandstone_slab cap stepping out 1 at y 28 around, hay_block y 27, campfire lit signal_fire true y 28.
- `yard(a)`: grass_block y 1 floor z 25..32 with coarse_dirt patches, dirt_path from rear door, brick_wall perimeter.
- `lamp_post(x)`: dark_oak_fence x,2..4 z 5, lantern at y 5.
- `product_panel(house)`: bookshelf pier panels / flower pots / anvils on the two piers' faces at y 5..7 (z 6).

## ROOMS
Shops are the machines (not rooms). Rooms per house (a = 25, 13, 1):
- Lobby/stair hall, flats ×2, loft, back store, service aisle — boxes in the room list.

## PARTS
1. parts/shell.mjs — masonry shell: ground, street, walls, floors, stairs, openings, partitions, piers' footing.
2. parts/roofs.mjs — three roof.json + gable fill, valley.
3. parts/chimneys.mjs — three stacks.
4. parts/frontage.mjs — piers, cornices, windows, balcony, lobby doors, fascia boards, awnings, signs, product panels.
5. parts/grounds.mjs — yards, lamp posts, street details.
6. parts/lights.mjs — lanterns inside & out, no dark cell.

## Notes
Never write in socket boxes or the z 6..7 y 2..4 clear strip. Re-run `$MCD sockets check` after each make.

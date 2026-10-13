# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
```

### elements.md

```markdown
# REQUIRED ELEMENTS (a = 25 H1, 13 H2, 1 H3; every item repeats per house unless noted)

- [ ] Three attached houses, three steep slate front gables, valley on party walls x 13, x 25 — part 2 roofs (`roof` x3); shell part 1 brick body.
- [ ] Redstone shop per house on ground floor: open shopfront y 2..4 over x a..a+8, counter/sockets by runParts, never built by us — part 1 leaves open; part 4 checks `sockets check`.
- [ ] Fascia board dark_oak_planks z 7, y 5..7 between piers, lettered BOOKS / FLORA / TOOLS — `fascia_board` (part 1), `shop_name` (part 4).
- [ ] Striped awning at y 5, z 6, stairs alternating shop colour/quartz, 7 cells — `awning`.
- [ ] Hanging sign on fence-arm bracket from shop/lobby pier y 5..6 — `hanging_shop_sign`.
- [ ] Product on pier faces y 5..7: books (bookshelf) / flower pots + azalea / anvil + iron chain — `product_panel`.
- [ ] Sandstone skeleton: piers (cut_sandstone, 1 proud z 6), string course y 8, main cornice y 18 with dentils y 17, gable coping — `pier`, `cornice_run`.
- [ ] Flats above: 3 windows per storey (glass_pane, sill stair, lintel), Juliet balcony (slab deck y 9 + iron_bars y 10) — `window_bay`, `juliet_balcony`.
- [ ] Attic gable window with trim surround — `window_bay`.
- [ ] Lobby door bay: dark_oak_door both halves, fanlight y 4, lintel y 5, two wall lanterns — `lobby_door`.
- [ ] Stair hall per house: flight 1 (2 wide), flight 2, landings, ladder to loft — `stair_flight`, `loft_ladder` (part 1).
- [ ] Rear chimney stack (own footing, 3x3, flue x 31/19/7), band y 26, cap slabs y 28, hay y 27 + lit signal campfire in flue — `chimney_stack`.
- [ ] Rear door and yard: grass + coarse_dirt, dirt_path, brick_wall yard walls — `yard`.
- [ ] Street: cobble/andesite road, kerb, polished_andesite sidewalk, 4 lamp posts (x 1, 13, 25, 37) — `lamp_post`, `street_strip`.
- [ ] Lit interiors via lanterns, keeper's route behind back walls (no dark cells) — part 6 lamplighter pass.
```

### rooms.json

```json
{"entrance":[35,1,5],"rooms":[{"name":"H1 lobby and stair hall","box":[34,2,8,36,7,23]},{"name":"H1 flat 1","box":[26,9,9,36,12,23]},{"name":"H1 flat 2","box":[26,14,9,36,17,23]},{"name":"H1 loft","box":[26,19,9,36,22,23]},{"name":"H2 lobby and stair hall","box":[22,2,8,24,7,23]},{"name":"H2 flat 1","box":[14,9,9,24,12,23]},{"name":"H2 flat 2","box":[14,14,9,24,17,23]},{"name":"H2 loft","box":[14,19,9,24,22,23]},{"name":"H3 lobby and stair hall","box":[2,2,8,4,7,23]},{"name":"H3 flat 1","box":[2,9,9,12,12,23]},{"name":"H3 flat 2","box":[2,14,9,12,17,23]},{"name":"H3 loft","box":[2,19,9,12,22,23]}]}
```

### palette.json

```json
{"roles":{"WALLS":["bricks","brick_stairs","brick_slab","brick_wall"],"TRIM":["smooth_sandstone","smooth_sandstone_stairs","smooth_sandstone_slab","cut_sandstone","sandstone_wall","sandstone","sandstone_stairs","sandstone_slab","cut_sandstone_slab"],"FASCIA":["dark_oak_planks","dark_oak_stairs","dark_oak_slab","dark_oak_door","dark_oak_fence","dark_oak_trapdoor","dark_oak_hanging_sign"],"ROOF":["cobbled_deepslate","deepslate_tiles","polished_deepslate","polished_blackstone_bricks","stone_bricks","cobbled_deepslate_stairs","cobbled_deepslate_slab","deepslate_tile_stairs","deepslate_tile_slab","polished_deepslate_stairs","polished_deepslate_slab","polished_blackstone_brick_stairs","polished_blackstone_brick_slab","stone_brick_stairs","stone_brick_slab"],"BASE":["stone_bricks","stone_brick_stairs","stone_brick_slab","stone_brick_wall","cobblestone","cobblestone_wall"],"PAVING":["polished_andesite","polished_andesite_stairs","polished_andesite_slab"],"ROAD":["cobblestone","andesite"],"GLASS":["glass_pane"],"SHOP":["dark_prismarine_stairs","waxed_oxidized_cut_copper_stairs","red_nether_brick_stairs","quartz_stairs","blue_wall_banner","green_wall_banner","red_wall_banner","white_wall_banner","pink_wall_banner","blue_wool","light_blue_wool","green_wool","pink_wool","red_wool","white_wool"],"PRODUCT":["bookshelf","flower_pot","potted_azalea_bush","potted_pink_tulip","anvil","barrel","chest"],"GROUND":["stone"],"YARD":["grass_block","coarse_dirt","dirt_path","oak_leaves","azalea_leaves","azalea","flowering_azalea","pink_tulip","white_tulip","poppy","dandelion"],"COUNTERS_AND_PLANTERS":["spruce_planks","spruce_stairs","spruce_slab","spruce_trapdoor","spruce_fence","oak_planks","oak_trapdoor","stone_brick_wall","stone_brick_slab"],"FUNCTIONAL_AND_DECOR":["iron_bars","lantern","iron_chain","ladder","hay_block","campfire"]},"objects":["iron_bars","lantern","iron_chain","ladder","hay_block","campfire","dark_oak_door","dark_oak_hanging_sign","dark_oak_fence","dark_oak_trapdoor","glass_pane","bookshelf","flower_pot","potted_azalea_bush","potted_pink_tulip","anvil","barrel","chest","spruce_planks","spruce_stairs","spruce_slab","spruce_trapdoor","spruce_fence","oak_planks","oak_trapdoor","stone_brick_wall","stone_brick_slab","oak_leaves","azalea_leaves","azalea","flowering_azalea","pink_tulip","white_tulip","poppy","dandelion","blue_wall_banner","green_wall_banner","pink_wall_banner","red_wall_banner","white_wall_banner","item_frame"]}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which replaces build.nbt only if the build succeeded.
set -eu
cd "$(dirname "$0")"
tmp="build.tmp.$$.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// Builds the trio from scratch: the solid ground, then every part in plan order. runParts locks each part's blocks
// from the parts before it. Usage: node build.mjs <out.nbt>
// The toolkit reads the file in the shifted frame, so this also writes rooms-build.json and sockets-build.json: the
// rooms and sockets in that same frame (for `mcd room`, `mcd walk`, `mcd rooms`, `mcd sockets check --sockets`).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SiteGrid, YOFF } from "./site.mjs";
import { SITE, STONE } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }

// [name, module, options]; the stair joiner's options say it may cut the floors (runParts also cuts for "stair" names)
const PARTS = [
  ["masonry shell", "parts/shell.mjs"],
  ["Stairs and ladders", "parts/stairs.mjs", { carve: true }],
  ["roofs", "parts/roofs.mjs"],
  ["chimney stacks", "parts/chimneys.mjs"],
  ["frontage", "parts/frontage.mjs"],
  ["grounds", "parts/grounds.mjs"],
  ["lighting", "parts/lights.mjs"],
  ["room: H1 lobby and stair hall", "parts/room-1.mjs"],
  ["room: H1 flat 1", "parts/room-2.mjs"],
  ["room: H1 flat 2", "parts/room-3.mjs"],
  ["room: H1 loft", "parts/room-4.mjs"],
  ["room: H2 lobby and stair hall", "parts/room-5.mjs"],
  ["room: H2 flat 1", "parts/room-6.mjs"],
  ["room: H2 flat 2", "parts/room-7.mjs"],
  ["room: H2 loft", "parts/room-8.mjs"],
  ["room: H3 lobby and stair hall", "parts/room-9.mjs"],
  ["room: H3 flat 1", "parts/room-10.mjs"],
  ["room: H3 flat 2", "parts/room-11.mjs"],
  ["room: H3 loft", "parts/room-12.mjs"],
];

// A part whose file isn't there yet builds nothing (parallel workers, stubs), so the build never fails for it.
async function loadPart(file) {
  const path = fileURLToPath(new URL(file, import.meta.url));
  if (!existsSync(path)) { console.log(`part ${file}: missing, skipped`); return () => {}; }
  return (await import(path)).build;
}

const g = new SiteGrid();
g.fill([SITE.x0, SITE.yMin, SITE.z0], [SITE.x1, 0, SITE.z1], STONE);

const list = [];
for (const [name, file, opts] of PARTS) list.push(opts ? [name, await loadPart(file), opts] : [name, await loadPart(file)]);
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);

// rooms and sockets in the file's frame (every world y + YOFF)
const shiftY = (v) => Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === "number") ? [v[0], v[1] + YOFF, v[2]]
  : Array.isArray(v) ? v.map(shiftY) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shiftY(x)])) : v;
const rooms = JSON.parse(readFileSync("rooms.json", "utf8"));
const roomsOut = { ...rooms, entrance: shiftY(rooms.entrance), rooms: rooms.rooms.map((r) => ({ ...r, box: [r.box[0], r.box[1] + YOFF, r.box[2], r.box[3], r.box[4] + YOFF, r.box[5]] })) };
writeFileSync("rooms-build.json", JSON.stringify(roomsOut, null, 1));
const L = JSON.parse(readFileSync("sockets.json", "utf8"));
const s = shiftY(L);
s.floorY += YOFF; s.floorAbove += YOFF;
writeFileSync("sockets-build.json", JSON.stringify(s));
console.log(`saved ${out} (${g.cells.size} cells)`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for every part: palette ids (palette.json only), plan.md's site coordinates (world frame), a seeded rng.

// WALLS: the brick body

// WALLS: the brick body
/** Wall body block. */
export const BRICKS = "bricks";

/** Brick stairs. */
export const BRICK_STAIRS = "brick_stairs";

/** Brick slab. */
export const BRICK_SLAB = "brick_slab";

/** Yard wall block. */
export const BRICK_WALL = "brick_wall";

// TRIM: the cream sandstone skeleton
/** Smooth sandstone, the trim block. */
export const SMOOTH_SANDSTONE = "smooth_sandstone";

/** Smooth sandstone stairs (cornices, sills, copings). */
export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";

/** Smooth sandstone slab (string, deck). */
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";

/** Cut sandstone, the pier faces. */
export const CUT_SANDSTONE = "cut_sandstone";

/** Sandstone wall. */
export const SANDSTONE_WALL = "sandstone_wall";

// FASCIA: dark oak joinery
/** Fascia boards, frames. */
export const DARK_OAK_PLANKS = "dark_oak_planks";

/** Dark oak stairs (awning, stair flights). */
export const DARK_OAK_STAIRS = "dark_oak_stairs";

/** Dark oak slab. */
export const DARK_OAK_SLAB = "dark_oak_slab";

/** Dark oak door (lobby doors). */
export const DARK_OAK_DOOR = "dark_oak_door";

/** Dark oak fence (rails, lamp posts, sign arms). */
export const DARK_OAK_FENCE = "dark_oak_fence";

/** Dark oak trapdoor (loft hatch). */
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";

/** Dark oak hanging sign (shop sign). */
export const DARK_OAK_HANGING_SIGN = "dark_oak_hanging_sign";

// ROOF: slate palette
/** Cobbled deepslate (roof body). */
export const COBBLED_DEEPSLATE = "cobbled_deepslate";

/** Deepslate tiles (roof body). */
export const DEEPSLATE_TILES = "deepslate_tiles";

/** Polished deepslate (roof body). */
export const POLISHED_DEEPSLATE = "polished_deepslate";

/** Polished blackstone bricks (eave). */
export const POLISHED_BLACKSTONE_BRICKS = "polished_blackstone_bricks";

/** Stone bricks (ridge, and the base course). */
export const STONE_BRICKS = "stone_bricks";

// BASE: the grey stone footing
/** Stone brick stairs (base and plinth). */
export const STONE_BRICK_STAIRS = "stone_brick_stairs";

/** Stone brick slab (base and plinth). */
export const STONE_BRICK_SLAB = "stone_brick_slab";

// PAVING, ROAD, GLASS
/** Polished andesite (sidewalk). */
export const POLISHED_ANDESITE = "polished_andesite";

/** Cobblestone (road setts). */
export const COBBLESTONE = "cobblestone";

/** Andesite (road setts, about 1 in 4). */
export const ANDESITE = "andesite";

/** Glass pane (windows, fanlights). */
export const GLASS_PANE = "glass_pane";

// SHOP: awning stripes, shop colours and banners
/** H1 awning stripe (blue shop). */
export const DARK_PRISMARINE_STAIRS = "dark_prismarine_stairs";

/** H2 awning stripe (green shop). */
export const WAXED_OXIDIZED_CUT_COPPER_STAIRS = "waxed_oxidized_cut_copper_stairs";

/** H3 awning stripe (red shop). */
export const RED_NETHER_BRICK_STAIRS = "red_nether_brick_stairs";

/** Quartz stairs, the awning's contrast stripe. */
export const QUARTZ_STAIRS = "quartz_stairs";

/** Blue wall banner (shop name). */
export const BLUE_WALL_BANNER = "blue_wall_banner";

/** Green wall banner (shop name). */
export const GREEN_WALL_BANNER = "green_wall_banner";

/** Red wall banner (shop name). */
export const RED_WALL_BANNER = "red_wall_banner";

/** White wall banner (shop name). */
export const WHITE_WALL_BANNER = "white_wall_banner";

// PRODUCT: what the pier faces show
/** Bookshelf (books). */
export const BOOKSHELF = "bookshelf";

/** Flower pot. */
export const FLOWER_POT = "flower_pot";

/** Potted azalea bush. */
export const POTTED_AZALEA_BUSH = "potted_azalea_bush";

/** Potted pink tulip. */
export const POTTED_PINK_TULIP = "potted_pink_tulip";

/** Anvil (ironmonger). */
export const ANVIL = "anvil";

/** Barrel. */
export const BARREL = "barrel";

// GROUND: the solid mass under the site
/** Ground fill, laid by build.mjs under everything. */
export const STONE = "stone";

// YARD and loose fittings (palette objects)
/** Grass block (yard ground). */
export const GRASS_BLOCK = "grass_block";

/** Coarse dirt (yard patches). */
export const COARSE_DIRT = "coarse_dirt";

/** Dirt path (from each rear door). */
export const DIRT_PATH = "dirt_path";

/** Iron bars (Juliet rails). */
export const IRON_BARS = "iron_bars";

/** Lantern. */
export const LANTERN = "lantern";

/** Iron chain (ironmonger's). */
export const IRON_CHAIN = "iron_chain";

/** Ladder (loft). */
export const LADDER = "ladder";

/** Hay block (chimney flue). */
export const HAY_BLOCK = "hay_block";

/** Campfire (chimney signal fire). */
export const CAMPFIRE = "campfire";

// SITE: plan.md's coordinates, world frame (x east, y up, z south; the street is north, z 0 is the lot's north edge)
/** Lot extents: x 0..38, z 0..32, world y -5..28 (ground to chimney top). */
export const SITE = { x0: 0, x1: 38, z0: 0, z1: 32, yMin: -5, yMax: 28 };

/** Ground top: the road surface. */
export const ROAD_Y = 0;

/** Sidewalk and kerb-level top, and the shop floor block. */
export const SHOP_FLOOR_Y = 1;

/** Street-side kerb block y. */
export const KERB_Y = 1;

/** Street face z (the houses' front wall). */
export const STREET_Z = 7;

/** Counter edge z (sockets begin here, envelope runs south). */
export const COUNTER_Z = 8;

/** Rear face z (the rear wall). */
export const REAR_Z = 24;

/** Storey floors: shop, flat 1, flat 2, loft. */
export const FLOOR_Y = { shop: 1, flat1: 8, flat2: 13, loft: 18 };

/** Top of the walls, under the main cornice. */
export const WALLS_TOP_Y = 18;

/** Eave height (roof sits on this). */
export const ROOF_Y = 19;

/** Ridge height. */
export const RIDGE_Y = 25;

/** Chimney stack top (the signal campfire). */
export const CHIMNEY_TOP_Y = 28;

/** The three houses, from high x (H1, left as seen from the street) to low x (H3). a = the low-x party or end wall. */
export const HOUSES = {
  H1: { name: "bookseller", a: 25, x0: 25, x1: 37, lobby: [34, 36], colour: "blue" },
  H2: { name: "florist", a: 13, x0: 13, x1: 25, lobby: [22, 24], colour: "green" },
  H3: { name: "ironmonger", a: 1, x0: 1, x1: 13, lobby: [2, 4], colour: "red" },
};

/** Lamp post x positions (on the kerb). */
export const LAMP_POST_X = [1, 13, 25, 37];

/** Chimney stack x (flue x, the stack spans flue-1..flue+1 at z 25..26). */
export const CHIMNEY_FLUE_X = { H1: 31, H2: 19, H3: 7 };

/**
 * Seeded random numbers: rng(seed)() returns a float in [0, 1). The same seed gives the same sequence (mulberry32).
 */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Vocabulary helpers, batch H1 (plan.md VOCABULARY). Every helper takes its position as arguments and writes only
// its own footprint. Writes go only into AIR unless opts.over is true: an earlier part owns the cells it built, and
// runParts refuses those writes anyway. Every helper returns { placed, skipped }, where skipped lists the cells it
// left alone (and why it could not), so a worker can report them.
//
// Coordinates: x and z are world cells (plan.md SITE). shop0 is the low-x edge of a house's shopfront: H1 25,
// H2 13, H3 5 (H3 is mirrored, so its shop is not at a+1; plan a+1 would put the fascia on the lobby).

/** Dark oak fascia board, 7 wide x 3 high, on the wall face z 7 (y 5..7, x shop0+1..shop0+7). */
export function fascia_board(g, shop0, opts = {})

/**
 * Striped awning at y 5, z 6, x shop0+1..shop0+7 (7 cells). Stairs run with the high back to the wall (facing south)
 * and alternate the shop colour with quartz: even cells take shopMat (e.g. "dark_prismarine"), odd cells quartz.
 * plan.md's text says "facing north" but also "high side to the wall", which is south under toolkit.md's convention
 * (facing = side of the full-height back). The wall is at z 7, so this follows the wall.
 */
export function awning(g, shop0, shopMat = "dark_prismarine", opts = {})

/**
 * Pier on the street face: cut_sandstone at z 6 (proud of the wall), smooth_sandstone at z 7, from y0 to y1.
 * opts.bracket: the bottom cell at z 6 is an upside-down smooth_sandstone stair (lip out, back to the wall), which
 * carries the pier above it (party and shop piers, y0 = 5).
 */
export function pier(g, x, y0, y1, opts = {})

/**
 * Window in a wall at z = wallZ, columns x0..x1 and rows y0..y1. Glass sits one cell inside (wallZ + inward).
 * inward is +1 for the street face (z 7, glass z 8) and -1 for the rear (z 24, glass z 23). Adds a smooth_sandstone
 * lintel one row above and an upside-down smooth_sandstone stair sill one row below, one cell outside the wall.
 */
export function window_bay(g, x0, x1, y0, y1, wallZ, inward = 1, opts = {})

/**
 * Lobby front door in the street face at (x, z 7): dark oak door (both halves, facing north, hinge left) at y 2..3,
 * glass fanlight at y 4, smooth_sandstone lintel at y 5. Hanging lanterns at y 4 on z 6 either side (x-1, x+1), each
 * hung from a smooth_sandstone slab at y 5 z 6, since a hanging light needs a block above.
 */
export function lobby_door(g, x, opts = {})

/**
 * Loft ladder on the wall at (x, z) (z 10 by default): ladder cells y 14..17 facing `facing`, backed by the wall on
 * the opposite side. The hatch is an open dark_oak_trapdoor at y 18 in the loft floor. A ladder only places where
 * the cell behind it is solid. Facing: "east" for H1 and H2 (partition on the west), "west" for H3.
 */
export function loft_ladder(g, x, z = 10, facing = "east", opts = {})

/**
 * Rear yard for a house: grass_block at y 1 over x a+1..a+11, z 25..31, with coarse_dirt patches (a fixed pattern,
 * so the same yard every run), a dirt_path from the rear door (doorX, z 25..27), and brick_wall at y 2 round x a and
 * x a+12 (z 25..32) and along z 32.
 */
export function yard(g, a, doorX, opts = {})

/**
 * Product column on a pier's street face: one block per row from y0 to y1 at (x, z). Defaults z 5, y 5..7 (in front
 * of the pier, clear of the z 6..7 customers' strip). An anvil falls, so it is placed once, at y0, and only if the
 * cell under it is solid.
 */
export function product_panel(g, x, product, opts = {})
```

### vocab/h2.mjs

```js
// Vocabulary helpers from plan.md (VOCABULARY), second set: shop_name, hanging_shop_sign, cornice_run,
// juliet_balcony, stair_flight, chimney_stack, lamp_post. Each takes the grid first, then its position (and facing).
// Every write goes into air only: a cell an earlier part owns is skipped and counted, never overwritten. Each helper
// returns { placed, skipped } so the caller can see what was refused.

/** Banner letters on the fascia: y 6..7 at z 6, over the 7 cells x a+1..a+7, in the shop's colour (blue, green, red). */
export function shop_name(g, a, word, colour)

/** Fence arm from the pier (x, y 6, z) with a dark oak hanging sign under it (y 5). z 5 is the street side of the pier at z 6. */
export function hanging_shop_sign(g, x, word, z = 5)

/** Upside-down smooth sandstone stairs along z 6 (lip to the street, facing south) from x0 to x1 at height y.
 *  dentils: a row of top slabs one below (y - 1) every 2nd cell, for the main cornice. */
export function cornice_run(g, y, x0, x1, { dentils = false } = {})

/** Juliet balcony on the centre French window of the house whose low-x wall is a: slab deck at y 9, iron rail at y 10, z 6, x a+4..a+8. */
export function juliet_balcony(g, a)

/**
 * A straight stair flight: one dark oak stair per step, x0..x1 wide, the first step at (zStart, yStart), one step per
 * cell from zStart to zEnd. facing = the way it rises (the stairs' back): "south" or "north" (z must run that way).
 * rail: "west" | "east" puts a dark oak fence post at the open side (x0-1 or x1+1) at each step's head height, or null.
 * Writes nothing under the steps: the shell owns the body below them.
 */
export function stair_flight(g, x0, x1, zStart, zEnd, yStart, facing, { rail = null } = {})

/** Rear chimney stack, 3 wide by 2 deep at x0..x0+2, z0..z0+1 (z0 = 25 for the terrace): brick body y 1..25, flue
 *  cell (x0+1, z0) left open, stone brick band at y 26, hay in the flue on the band (y 27), lit campfire on the hay
 *  (y 28), smooth sandstone cap slabs at y 27 stepping out one cell round the stack. */
export function chimney_stack(g, x0, z0 = 25)

/** Street lamp on the kerb (y 1) at (x, z): dark oak fence post y 2..4, lantern on top at y 5. */
export function lamp_post(g, x, z = 5)
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

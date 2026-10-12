# Plan: farmhouse with a potager (French country kitchen garden)

Identity: a rough-stone Norman/Burgundy farmhouse with a steep red-tile roof and a brick chimney, a timber lean-to porch on its garden side,
and beside it a walled, symmetrical potager with raised beds, a well at the crossing of its paths, trained fruit trees on the walls,
a glasshouse, a cold frame and a tool shed. Site 40 (x) by 36 (z) by 18 (y). Front = NORTH (-z), the street is at z<0.
Ground block y=0 is grass for the whole site (laid by build.mjs). Walking surface at ground = y=1. All ranges inclusive.
Workers: read `vocab.mjs` first (constants LAYOUT, OPENINGS and every helper), then ONLY your own part file. `make.sh` rebuilds everything.
Later parts can only ADD into air (runParts refuses writes into earlier parts' cells): so P1 leaves every opening cell unset.

## Palette by role (all ids in palette.json)
| role | blocks | where |
|---|---|---|
| walls (dominant ~55%) | cobblestone 40 / stone 25 / andesite 20 / mossy_cobblestone 15 (per-cell hash, `wallBlock`) | house walls, garden wall |
| trim (~15%) | stone_bricks, stone_brick_slab/stairs/wall | quoins, jambs, lintels, sills, gate pillars, well, sundial |
| roof (~20%) | red-tile palette (brick, granite, mangrove, mud-brick eave) via `mcd roof` | house roof; chimney `bricks` |
| timber (~7%) | spruce_planks/log/fence/slab/stairs, dark_oak_log/fence (posts and beams), oak_* (furniture), birch (glasshouse frame) | porch, bed rims, shed, furniture |
| accent (~3%) | warped_trapdoor shutters (French blue-green), flowering_azalea_leaves, roses, lanterns | shutters, arches, flowers |
| ground | grass_block, gravel + bricks (paths), farmland, coarse_dirt | |

Contrast: grey stone walls, red roof and chimney, blue-green shutters, white-gold gravel, dark timber, green leaves.

## Massing (block coordinates)
| mass | x | y | z | notes |
|---|---|---|---|---|
| ground | 0..39 | 0 | 0..35 | grass |
| farmhouse walls | 1..15 | 1..7 | 11..19 | 15 wide, 9 deep; plinth y=1; eave top y=7; floor-2 layer y=5 |
| farmhouse roof | 0..16 | 8..12 | 10..20 | 45-degree gable, ridge along x at z=15, overhang 1, made by `mcd roof --spec roof.json` |
| chimney | 9..10 | 2..14 | 14..15 | bricks; interior breast y=2..7 by P1, stack y=8..14 by `mcd roof` |
| porch lean-to | 16..19 | 1..7 | 12..18 | floor y=1, posts x=18, roof stairs (19,4)->(16,7) rising west |
| front stoop | 7..9 | 1 | 10 | stone-brick step + landing |
| garden wall | 20..38 | 1..4 | 4..32 | on the lines x=20, x=38, z=4, z=32; 3 stone + slab cap; gate gap (20,1..4,15) |
| potager interior | 21..37 | 0..2 | 5..31 | paths y=0; beds rim y=1..2 |
| well | 27..31 | 1..8 | 13..17 | ring 28..30 x 14..16, roof overhang to 27..31 |
| greenhouse | 22..27 | 1..7 | 27..31 | glass, ridge y=7 |
| cold frame | 32..36 | 1..2 | 26..27 | |
| tool shed | 32..36 | 1..~6 | 28..31 | walls y=1..3, gabled roof from y=4 |
| orchard | 1..18 | 1..9 | 22..35 | trees must stay out of the roof zone (see Notes) |
| front yard | 0..19 | 1..3 | 0..10 | fence at z=1, path x=7..9 |

Height: chimney top y=14 (14 tall). Tallest others: trees (<= y=9), well roof y~8, greenhouse y=7.

## The farmhouse
Front elevation (z=11, facing north), left to right: window x=4, door x=8, window x=12 on the ground floor (windows y=3..4); upper floor windows x=4, 8, 12 at y=7 (one high, just under the eave); quoins at x=1 and x=15.
Back (z=19): ground windows x=4, 8, 12 (y3-4), upper x=4, 8, 12 (y7). West gable (x=1): window z=15 (y3-4) and z=15 upper (y7). East wall (x=15, behind the porch): door z=15 (y2-3), windows z=13 and z=17 (y3-4).
Windows line up with the rooms: x=4 and x=8 light the parlour and the west bedroom, x=12 lights the kitchen and east bedroom.

### Interior (floors: ground floor surface walk y=2 (planks y=1), upper floor surface walk y=6 (planks y=5))
| room | x | z | y | floor | purpose / openings |
|---|---|---|---|---|---|
| Parlour + hall | 2..8 | 12..18 | 2..4 | spruce_planks | front door (8,2,11); windows (4,3..4,11), (4,3..4,19), (8,3..4,19), (1,3..4,15); doorway east (9,2..3,13) |
| Kitchen | 10..14 | 12..18 | 2..4 | spruce_planks | east door (15,2..3,15); windows (12,3..4,11), (12,3..4,19), (15,3..4,13), (15,3..4,17); hearth at (10,2,15) |
| West bedroom + landing | 2..8 | 12..18 | 6..7 (+ rafters to y=11) | oak_planks | windows (4,7,11), (8,7,11), (4,7,19), (8,7,19), (1,7,15); stair arrives at (2,6,17) |
| East bedroom | 10..14 | 12..18 | 6..7 (+ rafters) | oak_planks | windows (12,7,11), (12,7,19); doorway west (9,6..7,13) |
Partition x=9 (spruce planks) z=12..18 with doorways at z=13 ground and upper. Chimney breast x=9..10, z=14..15, y=2..7 (bricks), niche (10,2..3,15).
Staircase: oak stairs facing south at (2,2,13), (2,3,14), (2,4,15), (2,5,16); stairwell open at (2,5,14),(2,5,15); fence rail at (3,6,14),(3,6,15),(2,6,13). Barrels under it at (2,2,15),(2,2,16).
Furniture (every cell is a real block; chair = stairs with back away from the table; table = fence leg + oak pressure plate):
- Parlour: table (5,2,15),(6,2,15); chairs (5,2,14) and (6,2,14) sitters face south, (5,2,16) and (6,2,16) face north, (4,2,15) faces east, (7,2,15) faces west; bookshelves (6,2..3,18),(7,2..3,18); chest (3,2,18) facing north; potted fern (3,2,12); hanging lantern (5,4,15).
- Kitchen: campfire lit facing east (10,2,15); stone-brick stairs hearth step (11,2,15) facing west; counter z=12: barrel (11,2,12), crafting table (12,2,12), smoker (13,2,12), furnace (14,2,12) all facing south; water cauldron (14,2,13); table (13,2,16),(13,2,17); chairs (12,2,16),(12,2,17) face east, (14,2,16),(14,2,17) face west, (13,2,18) faces north; hanging lantern (13,4,16); barrels (14,2,18),(10,2,18); potted poppy (11,2,18).
- West bedroom: red bed foot (5,6,17) head (5,6,18) facing south; white bed foot (7,6,17) head (7,6,18); barrel (6,6,18) with a standing lantern (6,7,18); chest (3,6,18); red carpets (5..6,6,14..15).
- East bedroom: blue bed foot (13,6,17) head (14,6,17) facing east; barrels (14,6,13),(14,6,14) with a lantern on (14,7,14); bookshelf (12,6,18); potted oxeye daisy (11,6,12).

## The potager (outdoor rooms)
Garden wall lines x=20, x=38, z=4, z=32; interior x=21..37, z=5..31; the beds, paths and well are symmetric about x=29 and z=15.
- Paths (y=0): N-S x=28..30, z=5..31 and E-W z=14..16, x=21..37, gravel with `bricks` centre line (x=29 / z=15); plaza x=28..30, z=14..16 all bricks (the well); margins z=5, z=25, z=26 gravel x=21..37; yard strip x=19, z=12..18 gravel.
- Beds (rim = spruce planks y=1 + spruce bottom slab y=2; soil farmland y=1; crops y=2; 4 columns of crops along z; a 1x2 water pool mid-bed):
  - NW x=22..27, z=6..13: columns x=23 wheat, 24 carrots, 25 potatoes, 26 beetroots; water (24,1,9),(24,1,10); ripe.
  - NE x=31..36, z=6..13: x=32 beetroots, 33 potatoes, 34 carrots, 35 wheat; water (34,9),(34,10); ripe (mirror of NW).
  - SW x=22..27, z=17..24: x=23 potatoes, 24 beetroots, 25 wheat, 26 carrots; water (24,20),(24,21); mixed ages.
  - SE x=31..36, z=17..24: x=32 carrots, 33 wheat, 34 beetroots, 35 potatoes; water (34,20),(34,21); mixed ages.
  (A water cell replaces one crop cell of its column; farmland within 4 blocks of it is hydrated, which covers every cell.)
- Centre: the well at (29,1,15) (see elements E14). Sundial (29,1,6) at the north end of the axis, urn (29,1,25) at the south end.
- Arches over the E-W path: x=24 and x=34, posts at z=14 and z=16 (y=1..3), bar y=4, blossom y=5.
- Espaliers: west wall spine x=21 at z=8,12,19,23; east wall spine x=37 at z=8,12,19,23; north wall spine z=5 at x=24,34.
- Service yard z=26..31: cold frame x=32..36 z=26..27; tool shed x=32..36 z=28..31 (door west (32,1..2,29)); glasshouse x=22..27 z=27..31 (door north (25,1..2,27)); the N-S path continues between them (x=28..30).
- Lamps (dark-oak fence post + lantern, `lamp`): (27,14),(27,16),(31,14),(31,16),(28,6),(30,6),(28,24),(30,24); gate lanterns hang at (20,4,15) and stand at (20,6,14),(20,6,16); yard lamps (19,1,12),(19,1,18); front lamps (6,1,4),(10,1,4), door lamps (6,1,10),(10,1,10).
- Front yard: gravel path x=7..9, z=0..10 with brick centre; oak fence z=1 (gate (8,1,1)); roses, lilac, cornflowers; low hedge z=8. Orchard of 5 apple trees behind the house; woodpile (3..7,1..3,20).

## Parts (build order). Each worker: fill ONLY your module, run `./make.sh`, `mcd render build.nbt --tiles tiles`, read the PNGs, tick here.
- [x] 1. `parts/shell.mjs`: house shell: walls, quoins + opening frames, floors, partition, chimney breast (E1, E2, E4, E5, E31)
- [x] 2. `parts/porch.mjs`: windows with shutters, doors, front stoop, timber porch lean-to, house lanterns (E3, E6, E7, E8)
- [x] 3. `parts/potager.mjs`: garden wall, gate, paths, four raised beds with crops, well (E9, E10, E11, E12, E13, E14)
- [x] 4. `parts/features.mjs`: rose arches, espaliers, glasshouse, cold frame, tool shed, sundial, urn, lamps (E14b, E15..E19, E8b)
- [x] 5. `parts/interior.mjs`: stairs, hearth, kitchen, parlour, bedrooms, interior lights (E20..E25)
- [x] 6. `parts/grounds.mjs`: front path and fence, flowers, hedge, orchard, woodpile, lamps; then the last look over the whole render (E26..E30)

## Notes (workers report problems here; the planner's decisions so far)
- Roof zone: `mcd roof` removes everything at y>=8 within x=-2..18, z=8..22 and rebuilds the house roof. Nothing but the house may stand at y>=8 there (porch roof tops out at y=7 on purpose; the shell must not exceed y=7).
- `make.sh` skips the roof step while the shell is absent (stubs). Once P1 exists it dry-runs then builds the roof from roof.json (cottage preset, pitch 45, red-tile, chimney `at [9,14]` = cells x9..10, z14..15). If a roof warning appears, read it; do not use bypass flags.
- `vocab.mjs` `fixConnections` runs after all parts and rewrites fences/walls/panes/bars with correct connections: place them without states.
- `test-vocab.mjs` renders every helper (`node test-vocab.mjs`, then `mcd render /tmp/farm-vocab.nbt`); shutters and door facing were checked there (shutters lie flat on the wall, doors read from outside).
- Water: every water cell must be enclosed on its sides and underside by non-air; the beds' pools sit in farmland, the well in its ring. Do not add water anywhere else.
- P1 (shell): the jamb/lintel pass only frames house-wall openings (x1..15, z11..19); the greenhouse and shed doors are not framed by P1 (their parts own those walls). The upper windows (y=7, h=1) get jambs only: their lintel would sit at y=8 in the roof zone, so it is skipped. Chimney breast is bricks x9..10 z14..15 y2..7; the hearth niche (10,2..3,15) is unset.
- Trees from `tree()` and leaf blocks: oak_leaves has no state in this version, so just place the block.

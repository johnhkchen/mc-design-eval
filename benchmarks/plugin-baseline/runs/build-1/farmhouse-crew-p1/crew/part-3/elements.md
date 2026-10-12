# Required elements: farmhouse + potager (French-country kitchen garden)

Ground block is y=0 (grass), walking surface y=1. Front = NORTH (-z). Tick a box only when the element is built AND seen in a render.
Part files: P1 `parts/shell.mjs`, P2 `parts/porch.mjs`, P3 `parts/potager.mjs`, P4 `parts/features.mjs`, P5 `parts/interior.mjs`, P6 `parts/grounds.mjs`.
Helpers are in `vocab.mjs`. Never a coloured full block standing in for an object.

## The farmhouse (x=1..15, z=11..19)
- [x] **E1 Rough stone walls.** Cobblestone/stone/andesite/mossy-cobblestone mixed per cell (`wallBlock`/`stoneFill`), cobblestone plinth course at y=1, stone-brick quoins up the four corners. x=1..15, z=11..19, y=1..7. P1.
- [x] **E2 Two storeys + steep pitched roof.** Walls y=1..7 (ground floor rooms y=2..4, floor-2 layer y=5, upper rooms y=6..7), then a 45-degree gable roof ridge along x at z=15, red clay-tile palette, flared eaves, ridge y=12 (`mcd roof --spec roof.json` in make.sh, cottage preset). P1 (walls) + make.sh (roof).
- [ ] **E3 Shuttered windows.** Each opening in `OPENINGS`: glass panes connected along the wall, a stone-brick lintel and jambs (frameCells, P1), a stone-brick-slab sill, and a pair of OPEN `warped_trapdoor` shutters flat against the wall either side (trapdoor open=true, facing the wall). Front: x=4,12 (y3-4) + door x=8 + upper x=4,8,12 (y7); back: x=4,8,12 + upper x=4,8,12; west gable z=15 (y3-4, y7); east z=13,17 (y3-4). `window()`. P2 (gaps left by P1).
- [x] **E4 Brick chimney.** A 2x2 `bricks` stack at x=9..10, z=14..15 rising out of the ridge to y=14 (made by `mcd roof`, `chimneys` in roof.json), continuing the interior breast of bricks x=9..10, z=14..15, y=2..7 (P1). Hearth niche at (10,2..3,15).
- [x] **E5 Openings left by the wall.** The wall part leaves every `isOpening` cell unset so windows, doors, doorways can be added later (parts only add into air). P1.
- [ ] **E6 Timber porch / lean-to on the garden side.** Dark-oak posts x=18 (z=12,14,16,18; y=2..3), dark-oak beam y=4 along z, spruce-stair lean-to roof rising west to the house wall (19,4)->(16,7), planks floor at y=1 (x=16..18, z=12..18), spruce rails, entrance gap at z=15, hanging lanterns, a bench, barrel, pot. P2.
- [ ] **E7 Doors and steps.** Front door (8,2..3,11) oak door facing north with a stone-brick slab step + landing; east door (15,2..3,15) onto the porch; porch steps `cobblestone_stairs` (19,1,15). `door()`. P2.
- [ ] **E8 Lanterns on the house.** Two lamp posts by the front door (6,1,10),(10,1,10) (`lamp`), two hanging lanterns under the porch beam (18,3,13),(18,3,17) (`lantern(..., true)`). P2.
- [x] **E31 Floors and partitions.** Ground floor `spruce_planks` y=1, upper floor `oak_planks` y=5 with the stairwell open at (2,5,14..16); partition wall x=9 with doorways at (9,2..3,13) and (9,6..7,13). P1.

## The interior (see plan.md for coordinates)
- [ ] **E20 Staircase.** Oak stairs facing south along x=2: (2,2,13),(2,3,14),(2,4,15),(2,5,16); fence rail (3,6,14),(3,6,15),(2,6,13). P5.
- [ ] **E21 Hearth.** A lit `campfire` (facing east) in the brick breast niche (10,2,15), stone-brick-stairs hearth step (11,2,15), under the chimney. `hearth()`. P5.
- [ ] **E22 Kitchen.** Counter of barrel, crafting table, smoker, furnace along z=12; water cauldron; dining table (fence legs + pressure plates) (13,2,16),(13,2,17) with 5 stair chairs; hanging lantern; barrels. `table`, `chair`, `furnace`, `waterCauldron`. P5.
- [ ] **E23 Parlour.** Table + 6 chairs (5..6,2,15), bookshelves 2x2 at (6..7,2..3,18), chest, potted fern, hanging lantern. P5.
- [ ] **E24 Bedrooms.** West room: red bed (5,6,17) and white bed (7,6,17) heads south, barrel + lantern between, chest, red carpets; east room: blue bed (13,6,17) head east, barrels, bookshelf, pot. `bed()` with facing and part. P5.
- [ ] **E25 Interior light.** Lanterns hung over tables, standing on barrels in the bedrooms. P5.

## The potager (walled kitchen garden, x=20..38, z=4..32, interior x=21..37, z=5..31)
- [x] **E9 Garden wall.** Rough stone wall (same `wallBlock` mix) y=1..3, stone-brick-slab cap y=4, along x=20, x=38, z=4, z=32. P3.
- [x] **E10 Gate from the house.** Gap at (20,1..4,15) on the porch axis: two stone-brick pillars (20,1..5,14/16), spruce beam (20,5,15), `oak_fence_gate` at (20,1,15), lantern hanging at (20,4,15), lanterns on the pillar tops (20,6,14/16). `gate()`. P3.
- [x] **E11 Gravel and brick paths crossing at a centre feature.** N-S path x=28..30, z=5..31 and E-W path z=14..16, x=21..37: gravel with a centre line of `bricks` (x=29 / z=15), brick plaza x=28..30, z=14..16. P3.
- [x] **E12 Raised beds edged in timber.** Four beds (NW x22..27 z6..13, NE x31..36 z6..13, SW x22..27 z17..24, SE x31..36 z17..24): spruce-plank rim y=1 with a bottom spruce slab on top y=2, farmland y=1 (moisture 7), crops y=2. `plantedBed()`. P3.
- [x] **E13 Rows of different crops in each bed.** Each bed has 4 rows (columns along z): wheat (age 7 ripe), carrots, potatoes, beetroots (age 3 max), in a different order per bed; SW/SE at mixed ages. Each bed has a 1x2 water source pool in the middle (water at y=1 within 4 blocks of every farmland cell). P3.
- [x] **E14 Well at the centre.** 3x3 stone-brick ring with a water source in the middle (29,1,15), four dark-oak posts y=2..4 at the ring corners, a spruce crossbeam at y=4, iron chain + cauldron bucket (29,3,15)/(29,2,15), a pyramid spruce roof y=5+. `well()`. P3.
- [ ] **E14b Sundial and urn on the axis.** Sundial at (29,1,6) (stone-brick wall pedestal, smooth-stone slab dial, lightning-rod gnomon), a `decorated_pot` urn on a pedestal at (29,1,25). `sundial()`, `urn()`. P4.
- [ ] **E15 Rose/bean arches over the main path.** At x=24 and x=34 across z=14..16: spruce fence posts y=1..3 at z=14/16, spruce fence bar y=4, flowering-azalea-leaf cover y=5 and on the post tops, `rose_bush` (lower+upper) at the post feet. `roseArch()`. P4.
- [ ] **E16 Fruit trees trained against the wall (espaliers).** Oak-log spine y=1..3 next to the wall, side limbs of oak logs at y=3, a flat leaf fan 5 wide x 4 tall (oak leaves for apple, flowering azalea leaves for blossom pear): west wall x=21 z=8,12,19,23; east wall x=37 same; north wall z=5 x=24,34. `espalier()`. P4.
- [ ] **E17 Greenhouse.** Glass-block walls on a stone-brick plinth between birch posts, stepped glass gable roof with a birch-slab ridge, x=22..27, z=27..31, door (25,1..2,27); inside a potting bench of spruce slabs with potted plants, composter, cauldron. `greenhouse()`. P4.
- [ ] **E18 Cold frame.** Spruce-plank frame y=1, glass-pane ring y=2, farmland with seedling carrots inside, x=32..36, z=26..27. `coldFrame()`. P4.
- [ ] **E19 Tool shed.** Spruce planks + spruce-log corners y=1..3, dark-oak gable roof, door (32,1..2,29) facing west, inside crafting table, barrels, chest, grindstone, hay, composter, lantern; x=32..36, z=28..31. `toolShed()`. P4.
- [ ] **E8b Garden lamps.** Dark-oak fence posts with lanterns on top at the plaza corners (27/31, 14/16) and the sundial and urn ends (28/30, 6 and 24). `lamp()`. P4.

## The grounds
- [ ] **E26 Front path and picket fence.** Gravel path x=7..9 with a brick centre line from the street z=0 to the stoop (8,1,10); oak fence along z=1 with a gate at (8,1,1). P6.
- [ ] **E27 Orchard.** Five free-standing apple trees behind the house (`tree()`), z=26..31, nothing at y>=8 within x=-2..18, z=8..22 (roof step zone). P6.
- [ ] **E28 Flowers and hedge.** Rose bushes, lilacs, peonies, cornflowers either side of the front path, low oak-leaf hedge at z=8. P6.
- [ ] **E29 Woodpile.** Oak logs stacked along the back wall (x=3..7, z=20, y=1..3). P6.
- [ ] **E30 Lamps to the gate.** `lamp` posts at (19,1,12),(19,1,18) either side of the yard path, (6,1,4),(10,1,4) at the front fence. P6.

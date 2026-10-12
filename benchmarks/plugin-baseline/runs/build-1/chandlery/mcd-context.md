# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# Plan: the chandlery (candle maker's home and shop): the architect's form

Identity: an English market-town chandlery. The ground storey is red brick on a grey stone plinth, with a projecting
five-wide shop BAY WINDOW full of candles and a separate family door. Above it a JETTIED half-timbered upper storey
(near-black dark-oak frame, calcite daub) under a 45° grey slate roof with two gabled dormers to the street, and a brick
chimney stack against the east gable. Behind is a single-storey brick WORKSHOP (the dipping and moulding room, open to its
rafters) with a tall rendering-hearth chimney at its back gable, an open timber DRYING LEAN-TO where racks of candles cure,
and a back garden of BEEHIVES (the beeswax) behind a picket fence. Axes: x east (along the street), y up, z south. The
front faces NORTH (-z). All ranges are inclusive.

## SITE
The lot is 26 (x 0..25) by 34 (z 0..33), height up to y=22. Ground blocks sit at y=0, so a player outdoors stands at y=1.
Interior floors are blocks at y=1 (players stand at y=2).

| mass / feature | x | y | z | notes |
|---|---|---|---|---|
| ground | 0..25 | 0 | 0..33 | grass_block, coarse_dirt + podzol patches by fences and the hives |
| street | 0..25 | 0 | 0..3 | cobblestone with gravel patches (about 20%) |
| kerb | 0..25 | 0 | 4 | stone_bricks |
| pavement | 0..25 | 0 | 5..7 | polished_andesite; runs under the jetty to the wall |
| MAIN HOUSE ground storey | 5..17 | 1..5 | 8..17 | brick, 13 wide x 10 deep |
| SHOP BAY WINDOW | 9..13 | 1..5 | 7 | projects 1 north of the ground wall; y=1 brick sill wall, y=2..4 glazing, y=5 fascia board |
| MAIN HOUSE upper storey (jettied) | 5..17 | 6..10 | 7..17 | half-timber; projects 1 north (z=7) over the pavement and bay |
| jetty brackets | 5, 8, 14, 17 | 5 | 7 | dark_oak_stairs, upside down, facing south (back to the wall) |
| main roof | 4..18 | 11..16 | 6..18 | 45° gable, ridge along x at z=12, y=16 |
| front step, shop door | 7 | 1 | 7 | stone_brick_stairs facing south (rises toward the door) |
| front step, family door | 15 | 1 | 7 | stone_brick_stairs facing south |
| EAST CHIMNEY (house hearth) | 18..19 | 1..19 | 11..12 | bricks, outside the east gable, on its own footing; top course y=18, cap y=19 |
| WORKSHOP | 5..13 | 1..5 | 18..27 | single-storey brick, 9 wide x 10 deep, abuts the main back wall (z=17); open to the rafters |
| workshop roof | 4..14 | 6..10 | 18..28 | 45° gable, ridge along z at x=9, y=10 |
| WORKSHOP CHIMNEY (rendering hearth) | 8..9 | 1..13 | 28..29 | bricks, outside the south gable, on its own footing; band y=11, cap y=13 |
| DRYING LEAN-TO | 15..18 | 1..5 | 18..24 | open-sided timber shed against the workshop's east wall and the main back wall; posts at x=18, z=18, 21, 24 (y=1..3); hand-built shed roof (see ROOFS) |
| east passage | 20..24 | 0 | 8..17 | dirt_path from the pavement to the yard gate (x=21, z=18) |
| west strip | 1..4 | 0..1 | 8..17 | herb garden: coarse_dirt bed + sweet_berry_bush and flowers, low |
| front yard fences | 18..24 and 1..4 | 1 | 18 | spruce_fence; spruce_fence_gate at (21,1,18) and (2,1,18) |
| yard fence | x=1 and x=24, z 18..32; z=32, x 1..24 | 1 | | spruce_fence, posts at the corners |
| BEEHIVES | 15, 17, 19, 21 | 1 | 31 | beehive facing north, standing on the grass at y=1, one cell apart |
| flower bed for the bees | 14..22 | 1 | 29..30 | dandelion, poppy, cornflower, oxeye_daisy, allium, alternating; grass under |
| woodpile (hearth fuel) | 10..12 | 1..2 | 29..30 | spruce_log axis x, spruce_slab (bottom) lid at y=3 |
| tallow barrels | 2..3 | 1 | 28..30 | barrels + a cauldron at (4,1,30) by the back gate |
| yard path | 21 | 0 | 18..25, then 15..21 at z=25 to the lean-to | dirt_path, widening to 2 at the gate |
| apple tree | (3,1,22) | 1..7 | | oak_log trunk y=1..4, persistent oak_leaves crown y=4..7, radius 2, stays west of x=5 |

## ROOFS
| roof | form | pitch | ridge | overhang | how built |
|---|---|---|---|---|---|
| main | gable, eaves to the street (north) and back (south), gable ends east and west | 45 (stairs, 1:1) | along x at z=12, top y=16, x 4..18 | 1 all round: eaves z=6 and z=18 at y=11, verges x=4 and x=18 | `$MCD roof` spec: `{"preset":"cottage","material":"slate","pitch":"45","ridgeAxis":"x","front":"n","footprint":[[5,7,17,17]],"y":11,"gable":"calcite","verge":"dark_oak","dormers":{"face":"north","count":2,"style":"gable","width":3,"height":2},"chimneys":[],"keep":[{"from":[18,11,11],"to":[19,19,12]}]}`. Tested on a test shell: roof top y=16, ratio 0.55, 2 of 2 dormers fit, 5 tones, no warnings. The gable triangles x=5 and x=17 (y 11..15) are the timber framer's: the roof fills them with calcite (the daub), the framer adds the members in front of it by replacing nothing: see RESERVED. |
| workshop | gable, gable end to the back (south) | 45 | along z at x=9, top y=10, z 18..28 | south, east, west 1 (eaves x=4 and x=14 at y=6, verge z=28); north 0 | `roof()` / `$MCD roof` spec: `{"style":"gable","material":"slate","pitch":"45","ridgeAxis":"z","footprint":[[5,18,13,27]],"y":6,"gable":"bricks","verge":"dark_oak","ridge":"slab","overhang":{"north":0,"south":1,"east":1,"west":1},"keep":[{"from":[5,6,17],"to":[17,10,17]},{"from":[8,6,28],"to":[9,13,29]}]}`. North overhang 0 because the wing butts into the main house's back wall (its ridge y=10 stays under the main eave y=11). It meets the main wall as a plain abutment: the main upper back wall is solid where the workshop roof runs against it. |
| drying lean-to | shed (lean-to), falling east, against the workshop eave | about 0.5 | high side x=15 at y=5 | 1 east (x=19 at y=3) | BY HAND (a 4-wide shed under another roof's eave): dark_oak_slab (top) at x=15..16, y=5; dark_oak_slab (top) at x=17..18, y=4; dark_oak_slab (bottom) eave at x=19, y=4, all over z=18..25 (stops against the main back wall at z=17, 1 overhang south). Headroom under x=18 is y=1..3; the posts (stripped_dark_oak_log, axis y, y=1..3) carry the slabs directly. |
| east chimney | 2x2 stack | | top y=18 | | by hand, bricks x=18..19, z=11..12, y=1..18; band course of deepslate_bricks at y=16; cap y=19: brick_slab (top) at 3 cells, lit campfire at (19,19,12) on a brick block. It passes the verge at x=18: the main roof's keep box leaves those cells, and the verge stops against the stack on both sides. Ground-storey firebox in the east wall, see RESERVED. |
| workshop chimney | 2x2 stack | | top y=13 | | by hand, bricks x=8..9, z=28..29, y=1..13; band of deepslate_bricks at y=11; cap y=13 brick_slab (top) at 3 cells, lit campfire at (8,13,29) set with signal_fire true over a hay_block at (8,12,29) (the rendering fire's tall plume). Firebox in the south gable, see RESERVED. |

## FACADES
The same three bands all round: grey stone plinth / red brick ground storey / dark-frame-on-white upper storey, then grey slate.

### North front (street)
| level | y | content (x positions, at z=8 unless said) | depth |
|---|---|---|---|
| plinth | 1 | stone_bricks x=5..17 (mossy_stone_bricks at about 1 in 8, near the corners); the bay's sill wall x=9..13 at z=7 also stone_bricks | 0 (bay +1) |
| ground storey | 2..4 | x=5 quoins; x=6 brick; SHOP DOOR x=7 (y=2..3) + glazed transom (7,4,8); x=8 brick; BAY x=9..13 at z=7 (posts x=9, x=13 stripped_dark_oak_log axis y; glass_pane x=10..12; the ground wall z=8 behind x=10..12, y=2..4 left as AIR so the bay opens into the shop; x=9 and x=13 at z=8 stay brick); x=14 brick; FAMILY DOOR x=15 (y=2..3), brick (15,4,8); x=16 brick; x=17 quoins | bay +1 |
| quoins | 1..5 | stone_bricks at x=5 and x=17: long-and-short (y=2,3 two blocks wide wrapping the corner onto the sides, y=4 one, y=5 two); not every course | 0 |
| door heads | 4 | shop door: transom glass_pane at (7,4,8); family door: brick at (15,4,8) with a stone_brick_slab (top) hood at (15,4,7) | hood +1 |
| bay fascia (shop sign board) | 5 | dark_oak_planks x=9..13 at z=7; a dark_oak_wall_sign on its front at (11,5,6) | +1 |
| bressumer (head beam) | 5 | stripped_dark_oak_wood axis x, x=6..16 at z=8 (over the doors and the bay's back) | 0 |
| jetty brackets | 5 | dark_oak_stairs upside-down at x=5, 8, 14, 17, z=7, facing south | +1 |
| jetty sill beam | 6 | stripped_dark_oak_wood axis x, x=5..17 at z=7 | +1 over the ground face |
| upper storey frame | 7..9 | posts stripped_dark_oak_log axis y at x=5, 8, 11, 14, 17, z=7; panels between: x=6..7, 9..10, 12..13, 15..16 | 0 |
| upper windows | 8..9 | glass_pane x=9..10 and x=12..13 (a pair either side of the centre post, over the bay); calcite under them at y=7 | windows in the wall plane |
| window sills | 7 | dark_oak_slab (top) at x=9..10, 12..13, z=6 (+1), window boxes go on them (glazier) | +1 |
| braces (side bays) | 7..9 | x=6..7 and x=15..16: one diagonal each of dark_oak_stairs, mirrored, rising toward the corner post (west bay rises west, east bay rises east); calcite fills the rest | 0 |
| head plate | 10 | stripped_dark_oak_wood axis x, x=5..17 at z=7 | 0 |
| roof | 11..16 | slate eave at z=6, two gabled dormers placed by the roof tool on the north slope (calcite cheeks, dark_oak verge, glass) | |
| hanging sign | 6 / 5 | dark_oak_fence arm out of the jetty corner post: (5,6,6), (5,6,5); dark_oak_hanging_sign at (5,5,5) under the arm, facing north; a lit 3-candle cluster (candle, candles 3, lit true) on the arm end at (5,7,5) | +2 |
| lanterns | 4 | lantern (hanging true) at (16,5,7), hung from the jetty sill beam above it, beside the family door | +1 |

### East gable (x=17), seen from the passage
| level | y | content | depth |
|---|---|---|---|
| plinth | 1 | stone_bricks | 0 |
| ground | 2..5 | brick; window z=14..15, y=3..4 with stone_brick_slab (top) sill at (18,2,14..15); stone quoins at z=8 and z=17 | 0 |
| chimney | 1..19 | the stack x=18..19, z=11..12 stands 2 proud of the gable, through the verge | +2 |
| upper | 6..10 | sill beam y=6, head plate y=10 (stripped_dark_oak_wood axis z), posts at z=7, 10, 13, 17; windows z=8..9 and z=14..15, y=8..9; the panels z=11..12 are behind the chimney (calcite) | 0 |
| gable triangle | 11..15 | calcite with a king post stripped_dark_oak_log at z=12 y=11..15 and a collar beam (axis z) at y=13; a 1x1 window at (17,12,14) | 0 |

### West gable (x=5), seen down the street
| level | y | content | depth |
|---|---|---|---|
| ground | 1..5 | plinth, brick, quoins as east; shop side window z=11..13, y=2..4 (three wide, glass_pane) the stone plinth course at y=1 is its sill | 0 |
| upper | 6..10 | frame as east (posts z=7, 10, 13, 17); windows z=8..9 and z=14..15, y=8..9; Mann-figure braces in z=11..12 | 0 |
| gable triangle | 11..15 | calcite, king post z=12, collar y=13, a 1x1 window at (5,12,14) to match the east gable | 0 |

### South (back): main upper wall, workshop, lean-to
| face | content |
|---|---|
| main upper back z=17, y=6..10 | frame as the front without a jetty (posts x=5, 8, 11, 14, 17); window x=15..16 y=8..9 (above the lean-to roof); x=5..13 is met by the workshop roof: solid calcite panels there, no openings |
| main ground back z=17, x=14..17 | brick; BACK DOOR x=16, y=2..3 into the lean-to |
| workshop walls | bricks on a stone_bricks plinth (y=1), quoins at its 2 south corners; a brick dentil course is NOT used (keep it plain and workmanlike) |
| workshop south gable z=27 | windows x=6 and x=12 (1 wide, y=3..4); the firebox at x=8..9 (RESERVED); brick gable triangle from the roof tool; the chimney stack stands proud x=8..9, z=28..29 |
| lean-to | open on the east and south; dark-oak posts at x=18, z=18, 21, 24 (y=1..3); a plain shed of dark oak slabs |

## MATERIALS
Checked with `$MCD blocks --check` (all real, 26.3). Dominant: red brick and calcite; supporting: grey stone and slate;
accent: near-black dark oak, and the warm yellow of candles and lanterns in the glass.

| role | block id |
|---|---|
| ground-storey wall body, both chimneys, workshop walls | bricks |
| plinth, quoins, sills, step | stone_bricks (mossy_stone_bricks at about 1 in 8, near the ground and corners), stone_brick_stairs, stone_brick_slab |
| frame: posts | stripped_dark_oak_log (axis y) |
| frame: beams (sill, bressumer, head plate, collar) | stripped_dark_oak_wood |
| braces, jetty brackets | dark_oak_stairs |
| daub infill and gable fill | calcite |
| shopfront trim (bay fascia, sign arm, window sills, lean-to) | dark_oak_planks, dark_oak_slab, dark_oak_fence |
| doors | dark_oak_door (shop and family doors, back door), spruce_door (workshop) |
| shutters (upper side windows only) | spruce_trapdoor, open |
| glass | glass_pane |
| roof | `slate` palette (cobbled deepslate, deepslate tile, polished deepslate; renders tuff-grey), dark_oak verges |
| chimney band | deepslate_bricks |
| street / kerb / pavement | cobblestone + gravel / stone_bricks / polished_andesite |
| ground, paths | grass_block, coarse_dirt, podzol, dirt_path |
| fences | spruce_fence, spruce_fence_gate |
| signature props | candle and white_candle / yellow_candle clusters (shop bay, drying racks), beehive, honeycomb_block (accent only, shop shelves), cauldron (dipping vats), barrel, lantern, iron_chain |

## OPENINGS
Doors are 1 wide, 2 high (y=2..3), facing out of the house. Windows are glass_pane, the shell leaves them AIR.

| opening | wall | cells | notes |
|---|---|---|---|
| shop door | north z=8 | x=7, y=2..3; transom (7,4,8) | dark_oak_door, faces north, hinge left; step (7,1,7) |
| shop bay | north z=7 | glass x=10..12, y=2..4; the wall z=8 x=10..12 y=2..4 left AIR | bay posts at x=9, 13 |
| family door | north z=8 | x=15, y=2..3 | dark_oak_door, faces north; step (15,1,7) |
| upper front windows | north z=7 | x=9..10 and 12..13, y=8..9 | |
| dormers | north roof | placed by the roof tool (2, gabled, 3 wide) | |
| east ground window | east x=17 | z=14..15, y=3..4 | kitchen |
| east upper windows | east x=17 | z=8..9 and 14..15, y=8..9 | |
| east gable window | east x=17 | (17,12,14) | |
| west shop window | west x=5 | z=11..13, y=2..4 | |
| west upper windows | west x=5 | z=8..9 and 14..15, y=8..9 | |
| west gable window | west x=5 | (5,12,14) | |
| main back window | south z=17 | x=15..16, y=8..9 | above the lean-to |
| back door | south z=17 | x=16, y=2..3 | dark_oak_door facing south, into the lean-to |
| house to workshop | interior z=17 | x=10, y=2..3 | an open doorway (no door) from the shop's back into the workshop |
| workshop side door | east x=13 | z=21, y=2..3 | spruce_door facing east, into the lean-to |
| workshop windows west | west x=5 | z=20..21 and z=24..25, y=2..4 | |
| workshop window east | east x=13 | z=24..25, y=2..4 | |
| workshop gable windows | south z=27 | (6,3..4,27) and (12,3..4,27) | |

## RESERVED
The shell leaves these cells empty (air); the named later part fills them.

| cells | for | part |
|---|---|---|
| (17, 2..3, 11..12) and (18, 2..3, 11..12) | house kitchen firebox: 2 deep, through the east wall into the stack's base; stone floor (stone_bricks at y=1), lit campfire at the back (18,2,11..12), lintel = stripped_dark_oak_wood axis z at (17,4,11..12) | chimney |
| x=18..19, y=1..19, z=11..12 (apart from the firebox) | the east stack itself: the shell and roof never build here | chimney |
| (8..9, 2..3, 27) and (8..9, 2..3, 28) | workshop rendering hearth: firebox through the south gable into the stack; lit campfire at (8..9,2,28), a cauldron for the tallow stands in front of it at (8..9,2,26) | chimney / workshop room |
| x=8..9, y=1..13, z=28..29 (apart from the firebox) | the workshop stack | chimney |
| x=9..13, y=1..5, z=7 | the shop bay (posts, glass, fascia) | facade |
| x=5, 8, 14, 17 at (y=5, z=7) | jetty brackets | timber framer |
| the upper frame members on all faces: posts, sill beams y=6, head plates y=10, braces | built by the timber framer as the upper walls (the shell builds the upper storey walls with the frame, or leaves y=6..10 to the framer: the framer builds them whole, calcite included) | timber framer |
| x=16, y=2..5, z=13..16 and the floor cells x=16, y=6, z=13..16 | the stair from the family hall to the upper storey, rising north (stair blocks at z=16 y=2, z=15 y=3, z=14 y=4, z=13 y=5, stepping onto the upper floor at z=12); the upper floor has a hole over x=16, z=13..16 | rooms |
| x=15..18, y=1..5, z=18..24 | the drying lean-to (posts, roof, candle racks) | sides / yard |
| x=10..12, y=1..3, z=29..30 | woodpile | yard |

## FLOORS
| storey / mass | floor block y | stand at y | interior volume (x, y, z) | use (for the room designer) |
|---|---|---|---|---|
| main ground storey | 1 | 2 | x 6..16, y 2..5, z 9..16, plus the bay x 10..12, y 2..4, z 7..8 | west: SHOP (x 6..11; counter, the bay display, shelves of candles); east: FAMILY HALL and KITCHEN (x 12..16; hearth in the east wall, stair along x=16); a timber partition at x=12 with an opening at z=10 is the room designer's |
| main upper storey | 6 (dark_oak_planks over x 6..16, z 8..16) | 7 | x 6..16, y 7..10, z 8..16; open to the roof up to y=15 (no attic floor; the dormers light it) | parlour (north, over the shop, with the paired front windows) and two bedchambers (south-west, south-east) |
| workshop | 1 (stone_bricks floor, it's a wet, hot room) | 2 | x 6..12, y 2..5, z 18..26, open to the rafters up to y=9 | CHANDLER'S WORKSHOP: the rendering hearth at the south, dipping vats (cauldrons) and a candle-dipping wheel (a fence post with chains and candles) in the middle, moulding bench and barrels along the walls |
| drying lean-to | 0 (ground; podzol + coarse_dirt) | 1 | x 15..18, y 1..3, z 18..24 | candle racks (dark-oak fence posts with trapdoor shelves and white_candle clusters) and tallow barrels |
| yard | 0 | 1 | x 2..23, z 19..31 | beehives, flower bed, woodpile, apple tree, path |

---
# The designer's sections

## PALETTE
Block ids as in MATERIALS (all checked with `$MCD blocks --check`, none unknown), by role, plus the variants.

| role | blocks |
|---|---|
| ground wall, stacks | bricks, brick_stairs, brick_slab, brick_wall |
| plinth, quoins, steps | stone_bricks, mossy_stone_bricks, stone_brick_stairs, stone_brick_slab, stone_brick_wall |
| frame posts / beams | stripped_dark_oak_log (axis y), stripped_dark_oak_wood (axis x or z) |
| braces, brackets, stair | dark_oak_stairs |
| daub | calcite |
| trim | dark_oak_planks, dark_oak_slab, dark_oak_fence, dark_oak_trapdoor, dark_oak_wall_sign, dark_oak_hanging_sign |
| doors | dark_oak_door, spruce_door; shutters spruce_trapdoor (open) |
| glass | glass_pane |
| roof | slate palette, dark_oak verges, brick gable fill in the workshop |
| chimney | deepslate_bricks (band), brick_slab (cap), campfire, hay_block |
| street / ground | cobblestone, gravel, stone_bricks, polished_andesite, grass_block, coarse_dirt, podzol, dirt_path |
| yard | spruce_fence, spruce_fence_gate, spruce_log, spruce_slab, barrel, cauldron, water_cauldron, beehive, oak_log, oak_leaves (persistent), sweet_berry_bush, dandelion, poppy, cornflower, oxeye_daisy, allium |
| candles and light | candle, white_candle, yellow_candle, honeycomb_block, lantern, iron_chain |
| interior | dark_oak_planks floor (upstairs), stone_bricks floor (workshop), spruce_planks, oak_planks, white_carpet, white_bed and red_bed, bookshelf, lectern, grindstone, smoker, furnace, flower_pot, potted_poppy, potted_dandelion, decorated_pot, chest, crafting_table |

## VOCABULARY
Helpers take absolute coordinates; every state is written by the helper.
1. `brickCourse(x0,x1,y,z,mossRate)`: a row of `bricks`; the plinth variant lays `stone_bricks` with `mossy_stone_bricks` at 1 in 8, more at the ends.
2. `quoin(x,z,y0,y1,side)`: alternating long and short `stone_bricks`: even y two blocks wide wrapping the corner, odd y one.
3. `bayWindow(x0,x1,y,z)`: sill wall, two posts (`stripped_dark_oak_log` y), `glass_pane` between with connected sides set, fascia `dark_oak_planks` on top, wall behind left as air.
4. `doorPair(x,y,z,facing,hinge,block)`: lower and upper door halves with the same facing and hinge, plus a step or slab outside.
5. `jettyBracket(x,y,z)`: `dark_oak_stairs` half top, facing south.
6. `framePanel(x0,x1,y0,y1,z)`: `calcite` fill between posts, with an optional window hole.
7. `braceStair(x,y0,z,dir)`: three diagonal `dark_oak_stairs` (upside down against the beam) rising toward the corner post; the mirror takes the opposite `dir`.
8. `gableFrame(x,z0,z1,y0,y1)`: king post (`stripped_dark_oak_log` y) at z=12, collar `stripped_dark_oak_wood` axis z at y=13, calcite, 1x1 window.
9. `windowBox(x0,x1,y,z)`: `dark_oak_slab` (top) sill plus `potted_poppy` and `potted_dandelion` above.
10. `shutterPair(x,y,z,facing)`: two `spruce_trapdoor`, `open: true`, flat to the wall either side of a window.
11. `wallSign(x,y,z,text)` and `hangingSignArm(x,y,z)`: sign blocks and the fence arm with a lit candle cluster.
12. `candleCluster(x,y,z,color,n)`: `candle` / `white_candle` / `yellow_candle`, `candles: n`, `lit: true`.
13. `chimneyStack(x,z,yTop,bandY)`: a 2x2 `bricks` column, a `deepslate_bricks` band, `brick_slab` cap on 3 cells, a campfire on the 4th over a block (hay_block under the signal fire).
14. `firebox(x,y,z,axis)`: a stone-brick floor, lit `campfire` at the back, a `stripped_dark_oak_wood` lintel over the mouth.
15. `leanToBay(z)`: a post (`stripped_dark_oak_log` y, y=1..3) with the slab course of the shed roof.
16. `candleRack(x,y,z)`: two `dark_oak_fence` uprights with `dark_oak_trapdoor` shelves (open, flat) holding `white_candle` clusters.
17. `hiveStand(x,z)`: `beehive` facing north on grass, an `oxeye_daisy` beside it.
18. `picketFence(x0,z0,x1,z1)`: `spruce_fence` posts with `spruce_fence_gate` where the plan says.
19. `streetRows()`: the cobblestone / gravel / kerb / pavement rows.
20. `appleTree(x,z)`: `oak_log` trunk y=1..4, persistent `oak_leaves` crown radius 2, uneven.
21. `counter(x0,x1,z)`: `dark_oak_planks` base with `dark_oak_slab` (top) on it, for the shop.
22. `candleVat(x,y,z)`: `cauldron` or `water_cauldron` with a `dark_oak_trapdoor` lid beside it.
23. `dippingWheel(x,z)`: a `dark_oak_fence` post, `iron_chain` arms hanging with `candle` ends.
24. `bed(x,y,z,facing,color)`: `part: foot` and `head`, same facing.

## ROOMS
Interior doorways are 1 wide, 2 high, with no door unless noted. Floors: ground at y=1, upstairs y=6.
- **Shop** [6,2,9,11,5,16] plus the bay [10,2,7,12,4,8]. Floor `spruce_planks`. Counter at x=8..9 near z=14; candle shelves on the west and south walls; the bay display on its sill shelf. Warm, crowded and fragrant. In from the street through the shop door (7,2..3,8); to the workshop through the doorway (10,2..3,17); to the family hall through the partition opening at (12,2..3,10).
- **Family hall and kitchen** [13,2,9,16,5,16]. Floor `oak_planks`. Hearth at the east wall (17..18, 2..3, 11..12) reserved for the firebox; table and benches in the middle; stair along x=16 at z=13..16 (reserved). In from the street through the family door (15,2..3,8); to the lean-to through the back door (16,2..3,17); to the shop through (12,2..3,10).
- **Workshop** [6,2,18,12,5,26], open to the rafters. Floor `stone_bricks`. The rendering hearth at the south (8..9, z=27..28), vats and the dipping wheel in the middle, a moulding bench and barrels along the walls. Hot and dim, with the glow of the fire. In from the shop through (10,2..3,17); to the lean-to through the side door (13,2..3,21).
- **Drying lean-to** [15,1,18,18,3,24]. Floor `podzol` and `coarse_dirt`. Candle racks along the east side and tallow barrels at the back. Open on the east and south. In from the hall (16,2..3,17), from the workshop (13,2..3,21), and from the yard.
- **Parlour** [6,7,8,16,10,12]. Floor `dark_oak_planks`. The family's best room over the shop, with paired front windows and dormers; lectern, bookshelves, a settle by the windows, a rug. Landing at the stair head (16,7,12). Reached by the stair [16, y2..5, z16..13].
- **Bedchamber west** [6,7,14,10,10,16]. Bed, chest, a small window. In through the doorway (8,7..8,13).
- **Bedchamber east** [12,7,14,14,10,16]. Bed, chest. In through the doorway (13,7..8,13). A fence rail at x=15 over the stairwell (z=13..16).

Stairs: `dark_oak_stairs` facing north at (16,2,16), (16,3,15), (16,4,14), (16,5,13); landing (16,7,12). The y=6 floor has a hole at x=16, z=13..16.

## PARTS
1. **Masonry shell** (parts/shell.mjs): plinth, ground walls, quoins, the workshop walls, ground floors, the y=6 floor with its stair hole, the partition at x=12, the bedroom partitions, the stair, every opening. Vocabulary: `brickCourse`, `quoin`. Leave the reserved cells as air. Ticks: brick storey, stair.
2. **Timber frame** (parts/frame.mjs): the jetty and brackets, upper walls y=6..10 on all faces, gable frames, calcite. Vocabulary: `jettyBracket`, `framePanel`, `braceStair`, `gableFrame`.
3. **Roofs** (parts/roofs.mjs): `roof.json` for the main and workshop roofs, with dormers, and the lean-to slab roof (shared with P6 posts). Run `$MCD roof --dry-run`.
4. **Openings and fittings** (parts/fittings.mjs): the bay, doors, panes, shutters, window boxes, signs, lanterns. Vocabulary: `bayWindow`, `doorPair`, `windowBox`, `shutterPair`, `wallSign`, `hangingSignArm`, `candleCluster`.
5. **Chimneys and hearths** (parts/chimneys.mjs): both stacks, both fireboxes, the lit campfires. Vocabulary: `chimneyStack`, `firebox`.
6. **Grounds and lean-to** (parts/grounds.mjs): street rows, yard, fences, hives, tree, herb strip, woodpile, barrels, lean-to posts and racks. Vocabulary: `streetRows`, `picketFence`, `hiveStand`, `appleTree`, `leanToBay`, `candleRack`.

Checklist: [ ] P1 [ ] P2 [ ] P3 [ ] P4 [ ] P5 [ ] P6

## Notes for workers
- Do not change the architect's coordinates. The reserved cells stay air until their named part fills them.
- The roof tool for the main roof needs the keep box (18..19, 11..19, 11..12). The east stack passes through it.
- The north-front frame is at z=7 (the jetty). Window boxes sit at z=6.
- Check with `$MCD check` and `$MCD walk build.nbt --rooms rooms.json`.
```

### elements.md

```markdown
# Required elements: the chandlery

Coordinates from plan.md (x east, y up, z south; front faces north). Part numbers: P1 masonry shell, P2 timber frame, P3 roofs, P4 openings and fittings, P5 chimneys and hearths, P6 grounds and lean-to.

- [ ] **Shop bay window** (P4, `bayWindow`). Sill wall `stone_bricks` x=9..13, y=1, z=7. Posts `stripped_dark_oak_log` axis y at x=9 and x=13, y=2..4. `glass_pane` at x=10..12, y=2..4, z=7, with connection states set. The wall behind (x=10..12, y=2..4, z=8) stays air. Fascia `dark_oak_planks` x=9..13, y=5, z=7. Sill shelf: `dark_oak_slab` (top) x=10..12 at (y=2, z=8), holding `candle` clusters. The shelf sits on the y=1 floor row, so it is a counter-height display.
- [ ] **Candles for sale** (P4/rooms, `candleCluster`). `candle` / `white_candle` / `yellow_candle` with `candles: 2..4` and `lit: true` on the bay shelf, the shop shelves and the counter. `honeycomb_block` only as an accent on the shelves.
- [ ] **Shop door** (P4, `doorPair`). `dark_oak_door` lower and upper halves at (7,2..3,8), facing north, hinge left. Transom `glass_pane` at (7,4,8). Step `stone_brick_stairs` facing south at (7,1,7).
- [ ] **Family door** (P4, `doorPair`). `dark_oak_door` at (15,2..3,8), facing north. Brick at (15,4,8). Hood `stone_brick_slab` (top) at (15,4,7). Step at (15,1,7). `lantern` hanging true at (16,5,7), hung from the sill beam above.
- [ ] **Shop sign** (P4, `wallSign`). `dark_oak_wall_sign` at (11,5,6), facing north, on the fascia. Text "CHANDLER".
- [ ] **Hanging sign on a bracket** (P4, `hangingSignArm`). `dark_oak_fence` at (5,6,6) and (5,6,5). `dark_oak_hanging_sign` at (5,5,5) facing north. Lit `candle` cluster (3) at (5,7,5) on the arm end.
- [ ] **Jettied half-timbered upper storey** (P2, `framePanel`, `braceStair`, `jettyBracket`). Brackets `dark_oak_stairs` upside down, facing south, at x=5, 8, 14, 17, (y=5, z=7). Sill beam y=6 and head plate y=10, `stripped_dark_oak_wood` along the run. Posts `stripped_dark_oak_log` axis y at x=5, 8, 11, 14, 17. `calcite` daub in all panels. Mirrored braces in x=6..7 and x=15..16.
- [ ] **Brick ground storey on a stone plinth, with quoins** (P1, `brickCourse`, `quoin`). Plinth `stone_bricks` y=1, with `mossy_stone_bricks` about 1 in 8. `bricks` y=2..5. Quoins in `stone_bricks` at the corners.
- [ ] **Slate roof, 45°, with two gabled dormers** (P3). `$MCD roof` with the architect's spec. Dark-oak verges, calcite gable triangles.
- [ ] **East brick chimney stack** (P5, `chimneyStack`). `bricks` x=18..19, z=11..12, y=1..18. `deepslate_bricks` band at y=16. Cap `brick_slab` (top) at y=19 on 3 cells. Lit `campfire` at (19,19,12) on a `bricks` block at (19,18,12). It rises out of the roof through the keep box.
- [ ] **Kitchen firebox** (P5, `firebox`). Cells (17..18, 2..3, 11..12) are air. `stone_bricks` floor at y=1. Lit `campfire` at (18,2,11) and (18,2,12). Lintel `stripped_dark_oak_wood` axis z at (17,4,11..12).
- [ ] **Workshop with rendering-hearth chimney** (P1 walls, P5 stack, `chimneyStack`, `firebox`). `bricks` x=8..9, z=28..29, y=1..13. Band `deepslate_bricks` at y=11. Cap `brick_slab` (top) with a `campfire` (lit, signal_fire true) at (8,13,29) over `hay_block` (8,12,29). Firebox (8..9, 2..3, 27..28) with a lit campfire at (8..9,2,28) and a lintel at y=4.
- [ ] **Dipping vats and wheel** (rooms, `candleVat`, `dippingWheel`). `cauldron` and `water_cauldron` vats, a `dark_oak_fence` post with `iron_chain` and hanging `candle`s, a bench with `grindstone`.
- [ ] **Drying lean-to with racks** (P6, `leanToBay`, `candleRack`). Posts `stripped_dark_oak_log` axis y at x=18, z=18, 21, 24, y=1..3. Slab roof as in plan ROOFS. Racks of `dark_oak_fence` with `dark_oak_trapdoor` shelves and `white_candle` clusters.
- [ ] **Beehives and flower bed** (P6, `hiveStand`). `beehive` facing north at (15,1,31), (17,1,31), (19,1,31), (21,1,31). Flower bed x=14..22, z=29..30 in alternating dandelion, poppy, cornflower, oxeye_daisy, allium.
- [ ] **Picket fence and gates** (P6, `picketFence`). `spruce_fence` along the plan lines. `spruce_fence_gate` at (21,1,18) and (2,1,18).
- [ ] **Street, kerb, pavement** (P6, `streetRows`). Cobblestone with gravel patches at z=0..3, `stone_bricks` kerb at z=4, `polished_andesite` at z=5..7.
- [ ] **Woodpile, tallow barrels, cauldron** (P6). `spruce_log` axis x at x=10..12, z=29..30, y=1..2, with a `spruce_slab` (bottom) lid at y=3. `barrel`s at x=2..3, z=28..30. `cauldron` at (4,1,30).
- [ ] **Apple tree and herb strip** (P6, `appleTree`, `herbBed`). Trunk `oak_log` at (3,1..4,22). Persistent `oak_leaves` crown at y=4..7. `coarse_dirt` herb strip at x=1..4, z=8..17 with `sweet_berry_bush`, `poppy`, `dandelion`.
- [ ] **Upper-storey window boxes and shutters** (P4, `windowBox`, `shutterPair`). `dark_oak_slab` (top) sills at x=9..10 and 12..13, z=6, topped with `potted_poppy` and `potted_dandelion`. Open `spruce_trapdoor` shutters on the side windows.
- [ ] **Interior stair** (P1, rooms). `oak_stairs`-style `dark_oak_stairs` at x=16: z=16 y=2, z=15 y=3, z=14 y=4, z=13 y=5, facing north. Hole in the y=6 floor over x=16, z=13..16.
```

### rooms.json

```json
{"entrance":[7,1,6],"rooms":[{"name":"Shop","box":[6,2,9,11,5,16]},{"name":"Family hall and kitchen","box":[13,2,9,16,5,16]},{"name":"Chandler's workshop","box":[6,2,18,12,5,26]},{"name":"Drying lean-to","box":[15,1,18,18,3,24]},{"name":"Parlour","box":[6,7,8,16,10,12]},{"name":"West bedchamber","box":[6,7,14,10,10,16]},{"name":"East bedchamber","box":[12,7,14,14,10,16]}]}
```

### palette.json

```json
{"roles":{"wall":["bricks","brick_stairs","brick_slab","brick_wall"],"plinth":["stone_bricks","mossy_stone_bricks","stone_brick_stairs","stone_brick_slab","stone_brick_wall"],"frame":["stripped_dark_oak_log","stripped_dark_oak_wood","dark_oak_stairs","calcite"],"trim":["dark_oak_planks","dark_oak_slab","dark_oak_fence","dark_oak_trapdoor","dark_oak_wall_sign","dark_oak_hanging_sign","dark_oak_door","spruce_door","spruce_trapdoor","glass_pane","dark_oak_stairs"],"roof":["cobbled_deepslate","deepslate_tiles","polished_deepslate","cobbled_deepslate_stairs","cobbled_deepslate_slab","deepslate_tile_stairs","deepslate_tile_slab","polished_deepslate_stairs","polished_deepslate_slab","tuff_brick_stairs","tuff_brick_slab","deepslate_bricks","deepslate_brick_stairs","deepslate_brick_slab"],"chimney":["deepslate_bricks","brick_slab","campfire","hay_block","bricks","deepslate_brick_stairs","deepslate_brick_slab","cobbled_deepslate_wall"],"ground":["cobblestone","gravel","polished_andesite","grass_block","coarse_dirt","podzol","dirt_path","polished_andesite_slab","mossy_cobblestone","cobblestone_slab","stone_brick_slab"],"yard":["spruce_fence","spruce_fence_gate","spruce_log","spruce_slab","barrel","cauldron","water_cauldron","beehive","oak_log","oak_leaves","sweet_berry_bush","dandelion","poppy","cornflower","oxeye_daisy","allium","spruce_planks","spruce_trapdoor","dark_oak_trapdoor","short_grass"],"light":["candle","white_candle","yellow_candle","honeycomb_block","lantern","iron_chain"]},"objects":["spruce_planks","oak_planks","white_carpet","white_bed","red_bed","bookshelf","lectern","grindstone","smoker","furnace","flower_pot","potted_poppy","potted_dandelion","decorated_pot","chest","crafting_table","dark_oak_door","spruce_door","glass_pane","dark_oak_hanging_sign","dark_oak_wall_sign","dark_oak_trapdoor","spruce_trapdoor","spruce_fence","spruce_fence_gate","barrel","cauldron","water_cauldron","beehive","campfire","candle","white_candle","yellow_candle","lantern","iron_chain","dandelion","poppy","cornflower","oxeye_daisy","allium","short_grass","oak_log","oak_leaves","spruce_log"]}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: node build.mjs into a temp file, then mv into place.
set -e
cd "$(dirname "$0")"
tmp=$(mktemp ./build-tmp.XXXXXX)
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// The chandlery: the site ground, then every part in plan.md's order under runParts (locks, palette report, roof.json).
// Usage: node build.mjs <out.nbt>. A part whose file is not written yet builds nothing (said in the log), so make.sh
// stays green while the parts are written in parallel.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE, GROUND_Y } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");
const here = (file) => fileURLToPath(new URL(file, import.meta.url));

// plan.md PARTS, in build order, then the seven rooms (each room is a part its interior designer fills)
const PARTS = [
  ["Masonry shell", "parts/shell.mjs"],
  ["Timber frame", "parts/frame.mjs"],
  ["Roofs", "parts/roofs.mjs"],
  ["Openings and fittings", "parts/fittings.mjs"],
  ["Chimneys and hearths", "parts/chimneys.mjs"],
  ["Grounds and lean-to", "parts/grounds.mjs"],
  ["room: Shop", "parts/room-1.mjs"],
  ["room: Family hall and kitchen", "parts/room-2.mjs"],
  ["room: Chandler's workshop", "parts/room-3.mjs"],
  ["room: Drying lean-to", "parts/room-4.mjs"],
  ["room: Parlour", "parts/room-5.mjs"],
  ["room: West bedchamber", "parts/room-6.mjs"],
  ["room: East bedchamber", "parts/room-7.mjs"],
];

// A part file that is missing, or fails to load, builds nothing and is said so: the others still build.
async function loadPart(name, file) {
  const path = here(file);
  if (!existsSync(path)) { console.log(`part ${name}: no ${file} yet, skipped`); return () => {}; }
  try {
    const { build } = await import(path);
    if (typeof build !== "function") { console.log(`part ${name}: ${file} exports no build(g), skipped`); return () => {}; }
    return build;
  } catch (e) {
    console.log(`part ${name}: ${file} failed to load (${e.message.split("\n")[0]}), skipped`);
    return () => {};
  }
}

// the site with its ground: the lot's ground (plan.md SITE); parts may replace it (paths, patches), runParts keeps it writable
function siteGrid() {
  const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["26.3"] });
  g.fill([0, GROUND_Y, 0], [SITE_SIZE[0] - 1, GROUND_Y, SITE_SIZE[2] - 1], "minecraft:grass_block");
  return g;
}

const list = [];
for (const [name, file] of PARTS) list.push([name, await loadPart(name, file)]);

// runParts lays the roof right after the first part, and the roof reads the walls for its eave: with no shell walls
// yet (the shell is still a stub) that throws. So the roof is laid only when the shell has placed walls; until then
// the parts build without it, as the library does with no roof.json.
const probe = siteGrid();
list[0][1](probe);
const shellHasWalls = [...probe].some((c) => c.pos[1] > GROUND_Y);
const roof = shellHasWalls && existsSync(here("roof.json")) ? here("roof.json") : undefined;
if (!roof) console.log("roof: waits for the shell's walls (no eave to read yet), skipped");

const g = siteGrid();
runParts(g, list, { palette: here("palette.json"), roof });
g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Base kit: the palette as constants (palette.json's ids only), plan.md's site coordinates, and a seeded rng.
// Every block id here is a palette.json id; the ranges are inclusive, as in plan.md.

// wall: ground-storey walls and the chimneys' body

// wall: ground-storey walls and the chimneys' body
/** Red brick wall body (role wall). */
export const BRICKS = "bricks";

/** Brick stairs (role wall). */
export const BRICK_STAIRS = "brick_stairs";

/** Brick slab (role wall, also the chimney cap). */
export const BRICK_SLAB = "brick_slab";

/** Brick wall (role wall). */
export const BRICK_WALL = "brick_wall";

// plinth: stone plinth, quoins, sills, steps
/** Stone brick (role plinth). */
export const STONE_BRICKS = "stone_bricks";

/** Mossy stone brick, about 1 in 8 near the ground and corners (role plinth). */
export const MOSSY_STONE_BRICKS = "mossy_stone_bricks";

/** Stone brick stairs for steps (role plinth). */
export const STONE_BRICK_STAIRS = "stone_brick_stairs";

/** Stone brick slab (role plinth). */
export const STONE_BRICK_SLAB = "stone_brick_slab";

/** Stone brick wall (role plinth). */
export const STONE_BRICK_WALL = "stone_brick_wall";

// frame: posts, beams, braces, jetty brackets, daub
/** Stripped dark oak log, axis y, for posts (role frame). */
export const STRIPPED_DARK_OAK_LOG = "stripped_dark_oak_log";

/** Stripped dark oak wood, axis x or z, for beams (role frame). */
export const STRIPPED_DARK_OAK_WOOD = "stripped_dark_oak_wood";

/** Dark oak stairs for braces, brackets and the stair (role frame). */
export const DARK_OAK_STAIRS = "dark_oak_stairs";

/** Calcite daub infill (role frame). */
export const CALCITE = "calcite";

// trim: shopfront, signs, doors, shutters, glass
/** Dark oak planks (role trim, also the upstairs floor). */
export const DARK_OAK_PLANKS = "dark_oak_planks";

/** Dark oak slab (role trim). */
export const DARK_OAK_SLAB = "dark_oak_slab";

/** Dark oak fence (role trim, sign arm and candle racks). */
export const DARK_OAK_FENCE = "dark_oak_fence";

/** Dark oak trapdoor (role trim, lean-to shelves). */
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";

/** Dark oak wall sign (role trim). */
export const DARK_OAK_WALL_SIGN = "dark_oak_wall_sign";

/** Dark oak hanging sign (role trim). */
export const DARK_OAK_HANGING_SIGN = "dark_oak_hanging_sign";

/** Dark oak door (role trim). */
export const DARK_OAK_DOOR = "dark_oak_door";

/** Spruce door, the workshop side door (role trim). */
export const SPRUCE_DOOR = "spruce_door";

/** Spruce trapdoor, the open shutters (role trim). */
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";

/** Glass pane, windows (role trim). */
export const GLASS_PANE = "glass_pane";

// roof: slate palette (renders tuff-grey) and its stairs and slabs
/** Cobbled deepslate, slate roof (role roof). */
export const COBBLED_DEEPSLATE = "cobbled_deepslate";

/** Deepslate tiles, slate roof (role roof). */
export const DEEPSLATE_TILES = "deepslate_tiles";

/** Polished deepslate, slate roof (role roof). */
export const POLISHED_DEEPSLATE = "polished_deepslate";

/** Cobbled deepslate stairs (role roof). */
export const COBBLED_DEEPSLATE_STAIRS = "cobbled_deepslate_stairs";

/** Cobbled deepslate slab (role roof). */
export const COBBLED_DEEPSLATE_SLAB = "cobbled_deepslate_slab";

/** Deepslate tile stairs (role roof). */
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";

/** Deepslate tile slab (role roof). */
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";

/** Polished deepslate stairs (role roof). */
export const POLISHED_DEEPSLATE_STAIRS = "polished_deepslate_stairs";

/** Polished deepslate slab (role roof). */
export const POLISHED_DEEPSLATE_SLAB = "polished_deepslate_slab";

/** Tuff brick stairs, the slate eave course (role roof). */
export const TUFF_BRICK_STAIRS = "tuff_brick_stairs";

/** Tuff brick slab, the slate eave course (role roof). */
export const TUFF_BRICK_SLAB = "tuff_brick_slab";

// chimney: stacks, bands, fireboxes
/** Deepslate bricks, the chimney band (role chimney). */
export const DEEPSLATE_BRICKS = "deepslate_bricks";

/** Campfire, the lit fireboxes (role chimney). */
export const CAMPFIRE = "campfire";

/** Hay bale under the signal fire (role chimney). */
export const HAY_BLOCK = "hay_block";

// ground: street, kerb, pavement, yard paths
/** Cobblestone, the street (role ground). */
export const COBBLESTONE = "cobblestone";

/** Gravel patches in the street (role ground). */
export const GRAVEL = "gravel";

/** Polished andesite, the pavement (role ground). */
export const POLISHED_ANDESITE = "polished_andesite";

/** Grass block, the lot's ground (role ground). */
export const GRASS_BLOCK = "grass_block";

/** Coarse dirt, beds and patches (role ground). */
export const COARSE_DIRT = "coarse_dirt";

/** Podzol, patches by the fences and hives (role ground). */
export const PODZOL = "podzol";

/** Dirt path, the passage and yard paths (role ground). */
export const DIRT_PATH = "dirt_path";

// yard: fences, hives, tree, woodpile, barrels, flowers
/** Spruce fence (role yard). */
export const SPRUCE_FENCE = "spruce_fence";

/** Spruce fence gate (role yard). */
export const SPRUCE_FENCE_GATE = "spruce_fence_gate";

/** Spruce log, the woodpile (role yard). */
export const SPRUCE_LOG = "spruce_log";

/** Spruce slab, the woodpile lid (role yard). */
export const SPRUCE_SLAB = "spruce_slab";

/** Barrel (role yard). */
export const BARREL = "barrel";

/** Cauldron, the dipping vats and the tallow pot (role yard). */
export const CAULDRON = "cauldron";

/** Water cauldron (role yard). */
export const WATER_CAULDRON = "water_cauldron";

/** Beehive (role yard). */
export const BEEHIVE = "beehive";

/** Oak log, the apple tree trunk (role yard). */
export const OAK_LOG = "oak_log";

/** Persistent oak leaves, the apple tree crown (role yard). */
export const OAK_LEAVES = "oak_leaves";

/** Sweet berry bush, the herb strip (role yard). */
export const SWEET_BERRY_BUSH = "sweet_berry_bush";

/** Dandelion, the bee flower bed (role yard). */
export const DANDELION = "dandelion";

/** Poppy, the bee flower bed (role yard). */
export const POPPY = "poppy";

/** Cornflower, the bee flower bed (role yard). */
export const CORNFLOWER = "cornflower";

/** Oxeye daisy, the bee flower bed and by the hives (role yard). */
export const OXEYE_DAISY = "oxeye_daisy";

/** Allium, the bee flower bed (role yard). */
export const ALLIUM = "allium";

// light: candles, lanterns, honeycomb accents, chains
/** Candle (role light). */
export const CANDLE = "candle";

/** White candle, drying racks (role light). */
export const WHITE_CANDLE = "white_candle";

/** Yellow candle (role light). */
export const YELLOW_CANDLE = "yellow_candle";

/** Honeycomb block, shop shelf accents only (role light). */
export const HONEYCOMB_BLOCK = "honeycomb_block";

/** Lantern (role light). */
export const LANTERN = "lantern";

/** Iron chain, the dipping wheel arms (role light). */
export const IRON_CHAIN = "iron_chain";

// objects: interior furniture and floors (rooms)
/** Spruce planks, the shop floor (object). */
export const SPRUCE_PLANKS = "spruce_planks";

/** Oak planks, the family hall floor (object). */
export const OAK_PLANKS = "oak_planks";

/** White carpet, rugs (object). */
export const WHITE_CARPET = "white_carpet";

/** White bed (object). */
export const WHITE_BED = "white_bed";

/** Red bed (object). */
export const RED_BED = "red_bed";

/** Bookshelf (object). */
export const BOOKSHELF = "bookshelf";

/** Lectern (object). */
export const LECTERN = "lectern";

/** Grindstone (object). */
export const GRINDSTONE = "grindstone";

/** Smoker (object). */
export const SMOKER = "smoker";

/** Furnace (object). */
export const FURNACE = "furnace";

/** Flower pot (object). */
export const FLOWER_POT = "flower_pot";

/** Potted poppy, window boxes (object). */
export const POTTED_POPPY = "potted_poppy";

/** Potted dandelion, window boxes (object). */
export const POTTED_DANDELION = "potted_dandelion";

/** Decorated pot (object). */
export const DECORATED_POT = "decorated_pot";

/** Chest (object). */
export const CHEST = "chest";

/** Crafting table (object). */
export const CRAFTING_TABLE = "crafting_table";

// Site (plan.md SITE, FLOORS, OPENINGS, RESERVED). Ground blocks sit at y=0; players stand at y=1 outdoors.
/** Lot size in blocks: x 0..25, y 0..22, z 0..33. */
export const SITE_SIZE = [26, 23, 34];

/** The ground layer's y. */
export const GROUND_Y = 0;

/** Ground-storey interior floor block y (players stand at y=2). */
export const FLOOR_Y = 1;

/** Upstairs floor block y (players stand at y=7). */
export const UPPER_FLOOR_Y = 6;

/** Street rows: cobblestone z 0..3, kerb z=4, pavement z 5..7. */
export const STREET = { x0: 0, x1: 25, z0: 0, z1: 3 };

/** Main house ground storey (the shop, hall and kitchen). */
export const MAIN_GROUND = { x0: 5, x1: 17, y0: 1, y1: 5, z0: 8, z1: 17 };

/** Shop bay window, projecting one north of the ground wall at z=7. */
export const BAY = { x0: 9, x1: 13, y0: 1, y1: 5, z: 7 };

/** Main house upper storey, jettied to z=7. */
export const MAIN_UPPER = { x0: 5, x1: 17, y0: 6, y1: 10, z0: 7, z1: 17 };

/** Main roof box: eaves z=6 and z=18 at y=11, ridge y=16 along x at z=12. */
export const MAIN_ROOF = { x0: 4, x1: 18, y0: 11, y1: 16, z0: 6, z1: 18 };

/** Workshop: single storey, open to the rafters. */
export const WORKSHOP = { x0: 5, x1: 13, y0: 1, y1: 5, z0: 18, z1: 27 };

/** Workshop roof box: ridge y=10 along z at x=9. */
export const WORKSHOP_ROOF = { x0: 4, x1: 14, y0: 6, y1: 10, z0: 18, z1: 28 };

/** East chimney stack (the house hearth), z 11..12, through the east gable. */
export const EAST_STACK = { x0: 18, x1: 19, y0: 1, y1: 19, z0: 11, z1: 12 };

/** Workshop chimney stack (the rendering hearth), x 8..9, through the south gable. */
export const WORKSHOP_STACK = { x0: 8, x1: 9, y0: 1, y1: 13, z0: 28, z1: 29 };

/** Drying lean-to, open on the east and south. */
export const LEAN_TO = { x0: 15, x1: 18, y0: 1, y1: 5, z0: 18, z1: 24 };

/** Woodpile (hearth fuel), x 10..12, z 29..30. */
export const WOODPILE = { x0: 10, x1: 12, y0: 1, y1: 2, z0: 29, z1: 30 };

/** Beehive x positions (y=1, z=31) and the apple tree at (3,1,22). */
export const BEEHIVE_XS = [15, 17, 19, 21];

export const APPLE_TREE = { x: 3, y: 1, z: 22 };

// Doors and openings (1 wide, 2 high, y=2..3 for the lower half).
/** Shop door, north wall; its step at (7,1,7). */
export const SHOP_DOOR = { x: 7, y: 2, z: 8 };

/** Family door, north wall; its step at (15,1,7). */
export const FAMILY_DOOR = { x: 15, y: 2, z: 8 };

/** Back door, south wall into the lean-to. */
export const BACK_DOOR = { x: 16, y: 2, z: 17 };

/** Open doorway from the shop into the workshop (no door). */
export const SHOP_TO_WORKSHOP = { x: 10, y: 2, z: 17 };

/** Workshop side door, east wall, into the lean-to. */
export const WORKSHOP_SIDE_DOOR = { x: 13, y: 2, z: 21 };

/** Partition opening between the shop and the family hall (no door). */
export const PARTITION_OPENING = { x: 12, y: 2, z: 10 };

/** The stair from the family hall to the upstairs floor: x=16, z 13..16, rising north. */
export const MAIN_STAIR = { x: 16, z0: 13, z1: 16 };

// Room boxes (inclusive, [x0, y0, z0, x1, y1, z1]), from rooms.json.
export const ROOM_BOX = {
  shop: [6, 2, 9, 11, 5, 16],
  familyHall: [13, 2, 9, 16, 5, 16],
  workshop: [6, 2, 18, 12, 5, 26],
  leanTo: [15, 1, 18, 18, 3, 24],
  parlour: [6, 7, 8, 16, 10, 12],
  westBedchamber: [6, 7, 14, 10, 10, 16],
  eastBedchamber: [12, 7, 14, 14, 10, 16],
};

/** Seeded random generator (mulberry32): rng(seed)() gives a float in [0, 1). The same seed gives the same build. */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Helpers from plan.md VOCABULARY (h1 share): the brick course, the door pair, the brace, the shutter pair, the chimney
// stack, the candle rack, the street rows and the candle vat. Each takes its position (and facing) as arguments and
// returns the cells it wrote as [x, y, z]. Writes go only into air (g.isAir) unless opts.overwrite is true; a refused
// cell is skipped, not thrown. Nothing is written outside a helper's own footprint, so no ground, sand or floor under
// it is touched. Facings take n|s|e|w or the full names. Stair `facing` is the side of the full-height back (build.mjs).

// A row of bricks along x at fixed z (x0..x1, at y). mossRate omitted: a plain `bricks` course. A number: the plinth
// variant, `stone_bricks` with `mossy_stone_bricks` at that rate (plan: 1/8), three times as likely at the two ends.
export function brickCourse(g, x0, x1, y, z, mossRate = null, opts = {})

// Two door halves (lower at y, upper at y+1), same facing and hinge, both written or neither. The step sits outside the
// door at ground level y-1 with its full back toward the door. `block` is the door's wood: "dark_oak" or "spruce".
export function doorPair(g, x, y, z, facing, hinge = "left", block = "dark_oak", opts = {})

// One brace of upside-down dark_oak stairs (half top, full back toward the corner post) rising toward that post at
// `dir` (w or e). Three stairs: the foot at (x, y0, z), then two stacked one column nearer the post, so it fits a two-wide side bay.
export function braceStair(g, x, y0, z, dir, opts = {})

// Two open spruce trapdoors either side of a window, flat to the wall. (x, y, z) is the window's first cell; the wall
// runs across facing (east/west: along z; north/south: along x). opts.width is the window's width (default 2).
export function shutterPair(g, x, y, z, facing, opts = {})

// A 2x2 brick chimney from y=base (default 1) to yTop, with a deepslate_bricks band at bandY and a brick_slab cap at
// yTop+1 on three cells. The fourth cell (corner: [x, z], default the south-east cell) carries a lit campfire over
// its brick, or over a hay_block when opts.hay is set (the rendering fire's plume).
export function chimneyStack(g, x, z, yTop, bandY, opts = {})

// A candle rack at (x, y, z): dark_oak fence uprights at z and z+2, a flat (closed) dark_oak trapdoor shelf at z+1 on
// top of cell y, and a white_candle cluster standing on the shelf. opts.candles is the cluster size (default 3).
export function candleRack(g, x, y, z, opts = {})

// The street, kerb and pavement rows for x0..x1 (default 0..25), starting at z0 (default 0): cobblestone with gravel
// patches (about 1 cell in 5) on z0..z0+3, a stone_bricks kerb at z0+4, polished_andesite on z0+5..z0+7. Ground row y=0.
export function streetRows(g, x0 = 0, x1 = 25, z0 = 0, opts = {})

// A brewing/dipping vat at (x, y, z): a cauldron (opts.water: water_cauldron, full) with a closed dark_oak trapdoor
// lid lying flat on the cell beside it, at opts.lid (a compass direction, default east).
export function candleVat(g, x, y, z, opts = {})
```

### vocab/h2.mjs

```js
// Helpers from plan.md VOCABULARY (h2 share): the stone quoin, the jetty bracket, the gable frame, the wall sign, the
// firebox, the hive stand, the apple tree and the dipping wheel. Each takes the grid first, then its position (and
// facing or axis where it has one) as arguments, and returns the [x, y, z] cells it wrote. Writes go only into air
// (g.isAir) unless opts.overwrite is true; a refused cell is skipped, not thrown. Nothing is written outside the
// footprint the helper is given, so no ground, sand or floor is touched. Block ids are plan.md's PALETTE literals.

/**
 * A quoin at the corner cell (x, z): stone bricks alternating long and short up y0..y1. Even y is two blocks wide, the
 * corner cell and the one beside it one step along `side` (the run of the wall from the corner); odd y is the corner
 * cell alone.
 */
export function quoin(g, x, z, y0, y1, side, opts = {})

/**
 * A jetty bracket: a dark oak stair upside down (half top) at (x, y, z), its back to the wall. `facing` is the
 * direction into the wall (south for the street front, where the bracket projects north over the pavement).
 */
export function jettyBracket(g, x, y, z, facing = "south", opts = {})

/**
 * A gable triangle on the plane x, cells z0..z1 by y0..y1 (inclusive). The triangle narrows one cell per row from each
 * side, as the 45 degree roof does, so row y spans z0+(y-y0)..z1-(y-y0). On it: a king post (stripped dark oak log,
 * axis y) on the centre line, a collar beam (stripped dark oak wood, axis z) across the triangle at collarY, a 1x1
 * glass pane at opts.window = {z, y} (default: two cells in front of the post, one row above the base; null for none),
 * and calcite in the rest. Members are planned first so none is overwritten by the calcite.
 */
export function gableFrame(g, x, z0, z1, y0, y1, opts = {})

/**
 * A dark oak wall sign at (x, y, z) pointing out toward `facing`, with `text` on its front (lines split on newlines,
 * four at most). A wall sign hangs on the block behind it, the cell opposite `facing`; with air there it is not placed.
 */
export function wallSign(g, x, y, z, text, facing = "north", opts = {})

/**
 * A firebox into a stack: a two-wide mouth at (x, z) with its second cell across the width, two deep along +axis
 * (into the stack). Lit campfires on the back row at y, and a stripped dark oak lintel over the mouth at y+2, running
 * across the width. The mouth and the back cells between floor and lintel stay air. The stone floor under them is the
 * shell's (the rule is no floor written under a part), so it is not written here.
 */
export function firebox(g, x, y, z, axis, opts = {})

/**
 * A beehive on the ground at (x, y, z), facing `facing` (north in the yard), empty, with an oxeye daisy on the cell east
 * of it. The ground under it is not written.
 */
export function hiveStand(g, x, y, z, facing = "north", opts = {})

/**
 * An apple tree whose trunk stands on (x, y, z): four oak log cells up, then a crown of four layers from the trunk top,
 * radius 2 in the two lower layers and 1 above, the corners of the wide layers cut. A fixed pattern drops some leaves,
 * so the crown is uneven. Leaves are persistent, so they never decay. Only air is written.
 */
export function appleTree(g, x, y, z, opts = {})

/**
 * A candle-dipping wheel standing on the floor at (x, y, z): a dark oak fence post, and a crossbar of dark oak fences
 * from x-2 to x+2 at y+1 (joined along the bar). Iron chains hang from the bar at x-1 and x+1, and a three-candle lit
 * cluster stands on the bar at x-2, x and x+2, at y+2. The candles stand on the bar, since a candle cannot hang. The
 * footprint is five wide, three high and one deep, so the cells either side along z stay clear for a 2-high lane.
 * The workshop is seven wide (x 6..12), so x 8..10 fits it.
 */
export function dippingWheel(g, x, y, z, opts = {})
```

### vocab/h3.mjs

```js
// Helpers from plan.md VOCABULARY (h3 share): the shop bay window, the calcite frame panel, the window box, candle
// clusters, the drying lean-to bay, the picket fence, the shop counter and a bed. Each takes the grid first, then its
// position (and facing or axis where it has one) as arguments, and returns the [x, y, z] cells it wrote. Writes go only
// into air (g.isAir) unless opts.overwrite is true; a refused cell is skipped, not thrown. Nothing is written outside
// the footprint the helper is given, so no ground, sand or floor is touched. Block ids are plan.md's PALETTE literals.

/**
 * The shop bay: a brick sill row at y across x0..x1 on the plane z, posts at x0 and x1 rising y+1..y+3, glass panes
 * between them (connected east and west), a dark oak fascia at y+4. The wall behind the bay (z+1) is left as it is.
 */
export function bayWindow(g, x0, x1, y, z, opts = {})

/**
 * A calcite infill panel in the plane z, cells x0..x1 by y0..y1. opts.hole = [x0, y0, x1, y1] (inclusive) is left
 * as air for a window; the glazing part fills it.
 */
export function framePanel(g, x0, x1, y0, y1, z, opts = {})

/**
 * A window box on the sill row y across x0..x1 at plane z: dark oak top slabs, a pot on each cell above (potted
 * poppy on the first, dandelion on the next, alternating).
 */
export function windowBox(g, x0, x1, y, z, opts = {})

/** A lit candle cluster of n (1..4) candles at (x, y, z). color: "candle", "white_candle" or "yellow_candle". */
export function candleCluster(g, x, y, z, color, n, opts = {})

/**
 * One bay of the drying lean-to: a post at (x, y 1..3, z) carrying the shed's slab course on the same z row. The
 * course runs x-3..x+1 (for the post at x=18: dark oak top slabs at x=15..16 y=5, top slabs at x=17..18 y=4, and the
 * bottom eave slab at x=19 y=4). Lay one call per z row; the caller tiles z.
 */
export function leanToBay(g, x, z, opts = {})

/**
 * A spruce picket line from (x0, z0) to (x1, z1), one axis only, at row y. gates: [[x, z], ...] cells that get a
 * spruce_fence_gate instead of a post (facing across the run). A corner post shared with an earlier run keeps that
 * run's arms: its connections are merged, so the second call adds arms and writes nothing else.
 */
export function picketFence(g, x0, z0, x1, z1, y, gates = [], opts = {})

/**
 * A shop counter across x0..x1 on the plane z: dark oak planks at row y with a dark oak top slab on them at y+1. Only
 * the counter's own cells; the 2-high lane past its ends is left for the caller to keep clear.
 */
export function counter(g, x0, x1, y, z, opts = {})

/**
 * A bed: the foot at (x, y, z), the head one cell in the facing direction, both halves on row y with the same facing.
 * Two cells on the floor, one wide: it fits the 3x3 east bedchamber with a 2-high lane left past it. Both halves go in,
 * or neither does. color: "white" or "red".
 */
export function bed(g, x, y, z, facing, color, opts = {})
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
 *   runParts(g, [["shell", shell.build], ["garden", garden.build]], { palette: "palette.json", roof: "roof.json" })
 */
export function runParts(g, list, { palette, roof, log = console.log, report = "parts-report.json" } = {})

/** Lettering in a band: plaque(g, "LEAGUE HALL", { at, face, width, height, letter?, material?, frame?, style?, relief? }) */
export const plaque = (g, text, o) => ...

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
  to three, through doors and gates) from the entrance and says, per room box, whether it's reached, unreachable, or
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
the roof is skipped with a note. `mcd overworld palette.json [--write]` lists (drops) nether and end blocks. The Grid keeps block-entity NBT (sign text, chest contents) and entities and
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

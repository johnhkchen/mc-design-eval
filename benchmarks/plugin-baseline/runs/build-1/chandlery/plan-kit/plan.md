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

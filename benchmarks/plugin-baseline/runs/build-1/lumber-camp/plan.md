# Plan: the lumber camp: the architect's form

Identity: a northern logging camp in a spruce clearing, on a rutted logging road. Two buildings and a working yard:
a long LOG BUNKHOUSE (bunkroom + cook-and-mess hall, loft over) of dark bark-on spruce logs with saddle-notched
corners whose log ends stick out, a cobblestone plinth, a steep grey slate-shingle gable roof, a covered front porch
and a fieldstone cook chimney on the east gable; beside it a tall open-sided POLE-FRAME SAWMILL, gable end to the
road, with a louvred monitor on its ridge and a red-brick boiler stack trailing a tall plume. A log deck of
bark-on logs feeds the mill from the road; behind it the yard of pale sawn lumber in stickered stacks; a woodshed
lean-to behind the bunkhouse; stumps everywhere, standing spruces only at the edges.
Axes: x east (along the road), y up, z south. The front faces NORTH (-z). All ranges are inclusive.

## SITE
The lot is 40 (x 0..39) by 34 (z 0..33), height up to y=21. Ground blocks sit at y=0 (a player outdoors stands at
y=1). Interior floors are blocks at y=1 in the bunkhouse (players stand at y=2) and at y=0 in the mill.

| mass / feature | x | y | z | notes |
|---|---|---|---|---|
| ground | 0..39 | 0 | 0..33 | grass_block with large patches of coarse_dirt, podzol and rooted_dirt (a cut-over clearing, more bare earth near the mill) |
| logging road | 0..39 | 0 | 0..3 | coarse_dirt, with two dirt_path wheel ruts at z=1 and z=2 and gravel patches (~15%) |
| BUNKHOUSE (log cabin) | 4..18 | 1..5 | 8..17 | 15 wide x 10 deep; y=1 cobblestone plinth course, y=2..5 log courses; loft inside under the roof |
| saddle-notch log ends | x=3 and x=19 at z=8 and z=17, y=2 and 4; z=7 and z=18 at x=4 and x=18, y=3 and 5 | | | the corner logs run 1 past the corner, alternating per course (see FACADES) |
| bunkhouse roof | 3..19 | 6..14 | 7..18 | steep gable, ridge along x (z=12..13), top y=14 |
| FRONT PORCH deck | 5..17 | 1 | 5..7 | spruce_planks, top at y=1 (level with the plinth/floor) |
| porch posts | 5, 9, 17 | 2..3 | 5 | stripped_spruce_log axis y |
| porch roof | 5..17 | 4..5 | 5..7 | hand-built shed roof (see ROOFS) |
| porch step | 13 | 1 | 4 | spruce_stairs facing south (rises toward the porch) |
| porch rail | x=6..8 and 10..12, 14..16 | 2 | 5 | spruce_fence between posts; gap at x=13 for the step |
| COOK CHIMNEY | 19..20 | 1..17 | 12..13 | fieldstone stack on its own footing outside the east gable; band y=15, top course y=16, cap y=17 |
| WOODSHED lean-to | 5..12 | 1..5 | 18..21 | open on the south, against the bunkhouse back wall; posts stripped_spruce_log axis y at (5,1..3,21), (8,1..3,21), (12,1..3,21) |
| SAWMILL (open pole frame) | 23..35 | 0..6 | 8..20 | 13 wide x 13 deep; floor y=0 spruce_planks; posts y=1..5, top plate y=6 |
| sawmill roof | 22..36 | 7..14 | 7..21 | 45° gable, ridge along z at x=29, with a louvred monitor on the ridge |
| BOILER STACK | 36..37 | 1..19 | 17..18 | red brick, on its own footing outside the mill's east side; band y=17, top course y=18, cap y=19 |
| LOG DECK | 24..34 | 1..3 | 4..7 | skids stripped_spruce_log axis z at x=24, 29, 34, y=1, z=4..7; on them spruce_log axis x: y=2 at z=4..7, x=25..33; y=3 at z=5..6, x=25..33; chocks spruce_log axis y (1 high) at (24,2,4), (24,2,7), (34,2,4), (34,2,7) |
| skid road | 28..30 | 0 | 0..7 | dirt_path + coarse_dirt from the road to the log deck and on into the mill (the log route) |
| LUMBER YARD (sawn stacks) | three stacks: 24..26, 29..31, 34..36 | 1..4 | 24..29 | each 3 x 6 x 4 high; see FACADES "lumber stacks" |
| yard lane | 27..28 and 32..33 | 0 | 21..30 | dirt_path between the stacks, from the mill's south door |
| camp paths | (13,0,0..3) to the porch step; (19..22,0,6..7) from the porch east end to the mill front | 0 | | dirt_path, 1 wide, 2 wide at the ends |
| back path | 13..27 | 0 | 22 | dirt_path from the woodshed to the yard lane |
| stumps | (2,1,6), (21,1,26), (15,1,26), (37,1,5), (1,1,18), (19,1,30), (11,1,30) | 1..2 | | spruce_log axis y, 1 high ((21,1,26) and (37,1,5) 2 high), on podzol; chopping block = a spruce_log stump at (14,1,23) beside the back path |
| standing spruces | (1,1,27), (2,1,32), (7,1,32), (31,1,32), (38,1,24), (38,1,31) | 1..10 | | tall cones: spruce_log trunk y=1..7, persistent spruce_leaves cones radius 2 at y=3..4, 1 at y=5..8, tip y=9..10; crowns inside the lot and off the paths |

## ROOFS
| roof | form | pitch | ridge | overhang | how built |
|---|---|---|---|---|---|
| bunkhouse | steep gable, eaves north (porch) and south, gable ends east and west | preset cottage (pitch 2) | along x at z=12..13, top y=14, x 3..19 | 1 all round (eaves z=7 and z=18 at y=6, verges x=3 and x=19) | `$MCD roof` spec: `{"preset":"cottage","material":"slate","ridgeAxis":"x","front":"n","footprint":[[4,8,18,17]],"y":6,"gable":"stripped_spruce_log","verge":"dark_oak","ridge":"slab","chimneys":[],"keep":[{"from":[19,1,12],"to":[20,17,13]}]}`. Tested on a test shell: roof top y=14, ratio 1.50 (cap 1.8), 5 tones, overhang 1, fascia/soffit/barge, no warnings. The gable triangles x=4 and x=18 (y 6..13) are filled with stripped_spruce_log (pale vertical board-and-log gable against the dark bark walls). |
| sawmill | tall gable, gable end to the road (north), with a louvred monitor along the ridge | preset granary, pitch 1 (45°) | along z at x=29, top y=14, z 7..21 | 1 all round (eaves x=22 and x=36 at y=7) | `$MCD roof` spec: `{"preset":"granary","material":"slate","pitch":1,"ridgeAxis":"z","front":"n","footprint":[[23,8,35,20]],"y":7,"gable":"spruce_planks","verge":"stripped_spruce_log","ridge":"slab","keep":[{"from":[36,1,17],"to":[37,19,18]}]}`. Tested: walls 7 / roof 7, ratio 1.00, 5 tones, no warnings. The roof starts on the top plate (y=6); gables x 23..35 at z=8 and z=20 are spruce_planks. |
| porch | shed roof against the bunkhouse eave, falling north | ~0.5 | high side z=6..7 at y=5 | z=5 edge at y=4 | BY HAND: spruce_slab (bottom) at x=5..17, y=5, z=6..7 (under the main eave at y=6, z=7); spruce_stairs facing south at x=5..17, y=4, z=5 (on the posts). Headroom on the deck y=2..3. |
| woodshed | shed roof against the bunkhouse back eave, falling south | ~0.5 | y=5 at z=18..19 | z=20..21 at y=4 | BY HAND: spruce_slab (bottom) x=5..12, y=5, z=18..19; spruce_stairs facing north x=5..12, y=4, z=20..21 (z=21 rides on the posts; z=20 is carried by a stripped_spruce_wood beam axis x at y=3, x=5..12, z=21 under it). |
| cook chimney | 2 x 2 fieldstone stack | | top y=16, cap y=17 | | BY HAND: cobblestone with mossy_cobblestone ~1 in 6 (more low down), x=19..20, z=12..13, y=1..16; band of stone_bricks at y=15; top course y=16: plain cookfire smoke, a lit campfire (lit true, signal_fire false) at (20,16,13) set into the top course, cobblestone in the other 3 cells; cap y=17: cobblestone_slab (bottom) stepping out by one on the ring x=18..21, z=11..14 except the 4 cells over the stack, and (20,17,13) air over the campfire. It passes only the east verge; the roof's keep box leaves its cells, and the verge stops against it. Its top clears the ridge (y=14) by 2. |
| boiler stack | 2 x 2 red brick stack | | top y=18, cap y=19 | | BY HAND: bricks x=36..37, z=17..18, y=1..18; band deepslate_bricks at y=17 except the hay; top course y=18: lit campfire with signal_fire true at (37,18,18) over a hay_block at (37,17,18) (the tall mill plume, rising ~24 above the camp); bricks in the other 3 cells. Cap y=19: brick_slab (bottom) on the ring x=35..38, z=16..19 outside the stack, (37,19,18) air. Firebox at the base, see RESERVED. It passes the mill's east eave (x=36): keep box above. |

## FACADES
Everything reads in three bands: grey cobble plinth / dark bark-on log walls / grey slate roof with pale timber gables.
The mill reverses it: pale stripped posts and boards, open dark interior, the same grey roof.

### Bunkhouse north front (z=8, under the porch)
| level | y | content | depth |
|---|---|---|---|
| plinth | 1 | cobblestone x=4..18, mossy_cobblestone ~1 in 6, at the corners and ends | 0 |
| log courses | 2..5 | spruce_log axis x, x=4..18 (each course full length; even courses y=2, 4 run x=3..19, i.e. 1 past each corner) | ends +1 |
| saddle notches | 3, 5 | at the corners the side walls' logs (axis z) stick out 1 north: (4,3,7), (4,5,7), (18,3,7), (18,5,7) as spruce_log axis z; on y=2, 4 the corner cells (3,y,8) and (19,y,8) are spruce_log axis x | +1 |
| chinking | none | the log bark lines ARE the texture; do not mix planks into the log courses | |
| door | 2..3 | FRONT DOOR at x=13 (see OPENINGS); lintel: the y=4 log course runs over it | 0 |
| windows | 3..4 | x=6..7 (bunkroom) and x=15..16 (mess hall); sill spruce_slab (top) at y=2, z=7; open spruce_trapdoor shutters at x=5 and x=8, x=14 and x=17, y=3..4, z=7, flat against the wall | sill +1 |
| porch lanterns | 3..4 | lantern (hanging true) at (12,3,6) and (14,3,6), each on an iron_chain (axis y) at y=4 hung from the porch roof slab at y=5, either side of the door | |
| eave | 6 | slate eave at z=7, fascia from the roof tool | +1 |

### Bunkhouse east gable (x=18), seen from the mill
| level | y | content | depth |
|---|---|---|---|
| plinth | 1 | cobblestone | 0 |
| log courses | 2..5 | spruce_log axis z, z=8..17 (odd courses y=3, 5 run z=7..18); notch ends as the front | ends +1 |
| window | 3..4 | z=9..10 (mess hall); open spruce_trapdoor shutters at (19,3..4,8) and (19,3..4,11) | +1 |
| chimney | 1..17 | the fieldstone stack x=19..20, z=12..13, 2 proud of the gable, through the verge | +2 |
| gable | 6..13 | stripped_spruce_log (roof tool); a 2-high loft window at (18,8..9,15) (1 wide) | 0 |

### Bunkhouse west gable (x=4), seen down the road
| level | y | content | depth |
|---|---|---|---|
| plinth, logs | 1..5 | as east; notch ends | ends +1 |
| windows | 3..4 | z=12..13 (bunkroom), sill spruce_slab (top) at (3,2,12..13), open spruce_trapdoor shutters at (3,3..4,11) and (3,3..4,14) | +1 |
| gable | 6..13 | stripped_spruce_log; loft window (4,8..9,12..13) 2 wide x 2 high, glass_pane | 0 |
| woodpile | 1..2 | cordwood, spruce_log axis z, x=2..3, z=9..10, y=1..2, under the eave | +2 |

### Bunkhouse south back (z=17)
| level | y | content |
|---|---|---|
| plinth, logs | 1..5 | as the front (axis x), notch ends at z=18 |
| back door | 2..3 | x=7, into the woodshed; spruce_slab (bottom) step at (7,1,18) is NOT needed (ground stand y=1 + plinth threshold): leave (7,1,18) as path |
| window | 3..4 | x=14..15 (mess hall), shutters (13,3..4,18) and (16,3..4,18) |
| woodshed | 1..5 | posts, beam and shed roof (ROOFS); cordwood: spruce_log axis z, x=9..12, z=18..19, y=1..3 (the lane x=5..8 to the back door stays clear) |

### Sawmill (all four sides)
| element | content | depth |
|---|---|---|
| floor | spruce_planks at y=0, x=23..35, z=8..20 (replaces the ground) | |
| posts | stripped_spruce_log axis y at x=23, 27, 31, 35 on z=8 and z=20, and at z=12, 16 on x=23 and x=35 (12 posts), y=1..5 | 0 |
| knee braces | spruce_stairs upside down under the top plate either side of every post on the north and south fronts and on the long sides (y=5, the cell beside each post, facing the post): they make the open bays read as framed | 0 |
| top plate | stripped_spruce_wood y=6: axis x along z=8 and z=20 (x=23..35), axis z along x=23 and x=35 (z=8..20) | 0 |
| north front (z=8) | OPEN under the plate (the log deck feeds in between x=24..34); the gable above y=7 is spruce_planks with a loft door at (29,8..9,8) (1 wide x 2 high, spruce_trapdoor open beside it); a spruce_wall_sign "SAWMILL" on the plate face at (29,6,7) | gable 0 |
| west side (x=23) | half wall of spruce_planks y=1..2 between the posts (z=9..11, 13..15, 17..19); open above | 0 |
| east side (x=35) | open (the boiler and the stack stand here) | |
| south back (z=20) | boarded spruce_planks y=1..5 between posts, with a 3-wide doorway x=28..30, y=1..3 (open, no door) to the lumber yard; lintel stripped_spruce_wood axis x at y=4, x=28..30 | 0 |
| monitor | the granary preset's louvred ridge monitor | |
| lamps | lantern (hanging true) directly under the top plate at (25,5,8) and (33,5,8), each side of the north opening | |

### Lumber stacks (the yard)
| element | content |
|---|---|
| skids | stripped_spruce_log axis x at y=1, z=24 and z=29, under each stack's full width |
| boards | y=1 between skids (z=25..28) and y=2..4 everywhere: birch_planks (fresh pale sawn lumber) for y=2 and 4, birch_slab (top) for y=3 at z=25..28 with stripped_spruce_wood stickers at z=24 and z=29 on y=3 (dark sticker lines between pale courses) |
| tops | spruce_slab (bottom) cover boards at y=5 on the middle stack only |

## MATERIALS
Checked with `$MCD blocks --check` (all real, 26.3). Dominant: dark brown spruce bark and grey slate; supporting:
grey cobble and pale stripped spruce; accent: pale birch lumber, red brick stack, warm lantern and fire light,
green spruces.

| role | block id |
|---|---|
| bunkhouse wall logs | spruce_log (axis x on north/south walls, axis z on east/west walls) |
| plinth, cook chimney | cobblestone, mossy_cobblestone (~1 in 6, low and at corners), stone_bricks (chimney band), cobblestone_slab (cap) |
| gables, posts, top plates, beams | stripped_spruce_log (posts axis y; gables), stripped_spruce_wood (beams, plates, stickers) |
| porch deck, woodshed and porch roofs, mill floor and boards | spruce_planks, spruce_slab, spruce_stairs |
| rails, sign brackets | spruce_fence, spruce_fence_gate |
| doors / shutters | spruce_door / spruce_trapdoor (open) |
| glass | glass_pane |
| both main roofs | `slate` palette (cobbled deepslate, deepslate tile, tuff accents; renders mid-grey), dark_oak verges on the bunkhouse, stripped_spruce_log verges on the mill |
| boiler stack | bricks, deepslate_bricks (band), brick_slab (cap), hay_block + campfire (signal) |
| sawn lumber | birch_planks, birch_slab |
| light | lantern, iron_chain; lit campfires in both stacks |
| ground | grass_block, coarse_dirt, podzol, rooted_dirt, dirt_path, gravel |
| trees, stumps | spruce_log, spruce_leaves (persistent true) |

## OPENINGS
| opening | position | size | fill |
|---|---|---|---|
| bunkhouse FRONT DOOR | x=13, y=2..3, z=8 | 1 x 2 | spruce_door, facing north, from the porch |
| bunkhouse back door | x=7, y=2..3, z=17 | 1 x 2 | spruce_door facing south, into the woodshed |
| front window, bunkroom | x=6..7, y=3..4, z=8 | 2 x 2 | glass_pane |
| front window, mess | x=15..16, y=3..4, z=8 | 2 x 2 | glass_pane |
| east window, mess | x=18, y=3..4, z=9..10 | 2 x 2 | glass_pane |
| east loft window | x=18, y=8..9, z=15 | 1 x 2 | glass_pane (in the roof tool's gable: the roof part leaves it air) |
| west window, bunkroom | x=4, y=3..4, z=12..13 | 2 x 2 | glass_pane |
| west loft window | x=4, y=8..9, z=12..13 | 2 x 2 | glass_pane (roof part leaves it air) |
| back window, mess | x=14..15, y=3..4, z=17 | 2 x 2 | glass_pane |
| mill north opening | x=24..34, y=1..5, z=8 | open | none (between posts) |
| mill gable loft door | x=29, y=8..9, z=8 | 1 x 2 | spruce_trapdoor open (roof part leaves it air) |
| mill south doorway | x=28..30, y=1..3, z=20 | 3 x 3 | open |
| mill east side, west side above the half wall | between the posts | open | none |

## RESERVED
| cells | for | the shell leaves |
|---|---|---|
| (18, 2..3, 12..13) | the cook HEARTH: a firebox 1 deep in the east log wall, backed by the chimney; floor = plinth cobble at y=1; a lit campfire at (18,2,12) and a cauldron/smoker beside it is the hearth builder's; lintel cobblestone_stairs upside-down at (17,4,12..13) inside | air (no logs) |
| (36,1,17) and (36,1,18) | the BOILER FIREBOX: a lit blast_furnace at (36,1,17) facing west into the mill and a lit furnace at (36,1,18) facing west | the stack starts at y=1 in the other cells; these two are the hearth builder's |
| x=28..30, y=1, z=9..19 | the SAW CARRIAGE: stripped_spruce_log axis z rails at x=28 and x=30, a log (spruce_log axis z) riding it at x=29, z=9..11, the saw (stonecutter) at (29,1,14) | air above the plank floor |
| (33..34, 1, 17..19) | saw-filing bench: grindstone (34,1,18), barrel, chest | air |
| loft ladder (5, 2..5, 16) | ladder up to the loft through a 1x1 hatch in the loft floor at (5,5,16) | air in the loft floor at (5,5,16) |
| porch step (13,1,4), sign bracket and lantern chains | glazier and lamplighter | air |

## FLOORS
| storey | floor block y | standing y | interior volume | notes |
|---|---|---|---|---|
| bunkhouse ground | 1 (spruce_planks inside x=5..17, z=9..16) | 2 | x=5..17, y=2..4, z=9..16 (13 x 8, 3 high) | suggested split: BUNKROOM x=5..9 (bunk beds along the west and south walls, 5 x 8) | partition of spruce_planks at x=10, y=2..4, with a doorway at (10,2..3,13) | MESS + COOK HALL x=11..17 (7 x 8): long table down the middle, the hearth at the east wall; the front door (13,2..3,8) opens into it |
| bunkhouse loft | 5 (spruce_planks x=5..17, z=9..16; the hatch at (5,5,16)) | 6 | x=5..17, y=6..13 under the roof, z=9..16 narrowing up; full headroom (y=6..8) z=10..15 | foreman's bunks and stores; lit by the two gable windows |
| woodshed | 0 (ground) | 1 | x=5..12, y=1..3, z=18..20 | open shed: cordwood x=9..12, lane x=5..8 |
| sawmill | 0 (spruce_planks) | 1 | x=24..34, y=1..5, z=9..19 (one tall open floor, open to the monitor) | saw carriage down the centre line x=28..30, logs in from the north, boards out the south doorway to the yard |

---
# The designer's sections (below the architect's form; nothing above is changed)

## PALETTE
Every id is checked real (`$MCD blocks --check`, none unknown). By role, with the shape variants each needs.
| role | blocks | states |
|---|---|---|
| bunkhouse logs | `spruce_log` | `axis` x (N/S walls) or z (E/W walls); corner ends as in FACADES |
| plinth, chimney | `cobblestone`, `mossy_cobblestone` (1 in 6), `stone_bricks`, `cobblestone_slab`, `cobblestone_stairs` | slab `type: bottom`; stairs `half: top` for the hearth lintel |
| pale timber | `stripped_spruce_log` (posts axis y, gables), `stripped_spruce_wood` (plates, beams, stickers) | `axis` set per run |
| planks | `spruce_planks`, `spruce_slab`, `spruce_stairs`, `spruce_fence`, `spruce_fence_gate`, `spruce_door`, `spruce_trapdoor`, `spruce_wall_sign`, `spruce_pressure_plate` | trapdoor `open: true`, `half: bottom`; stairs `half: top` for knee braces |
| glass | `glass_pane` | connection states set by the helper |
| roofs | `slate` palette (tool), verges `dark_oak` / `stripped_spruce_log` | |
| brick stack | `bricks`, `brick_slab`, `deepslate_bricks`, `hay_block` | campfire `lit: true`, `signal_fire: true` (boiler) / `false` (cook) |
| lumber | `birch_planks`, `birch_slab` (`type: top`) | |
| fire and heat | `campfire`, `smoker`, `furnace`, `blast_furnace` (all `lit: true`, `facing` west), `stonecutter`, `grindstone`, `cauldron` | grindstone `face: floor`, `facing` as set |
| light | `lantern` (`hanging: true` under blocks, `false` on posts), `iron_chain` (axis y) | |
| furniture | `barrel` (`facing: up`), `chest`, `ladder` (`facing: north`), `red_bed`, `white_wool`, `white_carpet`, `bookshelf`, `crafting_table`, `composter`, `anvil`, `lectern` | bed `part` foot/head, same `facing` |
| ground | `grass_block`, `coarse_dirt`, `podzol`, `rooted_dirt`, `dirt_path`, `gravel`, `short_grass`, `fern` | |
| trees | `spruce_log` (axis y), `spruce_leaves` (`persistent: true`) | |

## VOCABULARY
All helpers take absolute coordinates and write every state themselves; inclusive ranges. Each is tested in a room the size it is used in.
1. `plinthCourse(x0,z0,x1,z1,y)`: ring of `cobblestone` at the edge of the box; `mossy_cobblestone` at 1 in 6, always at the four corners.
2. `logCourse(x0,x1,y,z,axis)`: a straight run of `spruce_log` with `axis`, skipping cells that are opening cells (callers pass a skip list).
3. `saddleNotch(x,y,z,axis)`: one protruding log end, `spruce_log` with the wall's axis, placed one past the corner per FACADES parity.
4. `porchBay(x0,x1)`: porch deck planks z=5..7, `stripped_spruce_log` post(s) y=2..3 at z=5, `spruce_fence` y=2 between posts.
5. `paneWindow(x0,x1,y0,y1,fixed,axis)`: `glass_pane` filling the box with connection states along the wall; sill `spruce_slab` (top) below, outside.
6. `shutterPair(x,y,z,facing,span)`: two columns of open `spruce_trapdoor`, one either side of a window, flat against the wall.
7. `doorPair(x,y,z,facing,hinge)`: `spruce_door` lower and upper, same `facing` and `hinge`, door faces out of the room it closes.
8. `hangLantern(x,y,z,chain)`: `iron_chain` axis y of length `chain` hanging from a solid block above, `lantern` hanging true at the bottom.
9. `lampPost(x,z,h)`: `spruce_fence` post h high, standing `lantern` (hanging false) on top.
10. `loftLadder(x,z,y0,y1,facing)`: `ladder` column against a wall plus a hatch air cell in the loft floor.
11. `millPost(x,z)`: `stripped_spruce_log` axis y at y=1..5.
12. `kneeBrace(x,z,facing)`: `spruce_stairs` half top, facing the post, at y=5 in the cell beside a post.
13. `topPlate(x0,z0,x1,z1)`: `stripped_spruce_wood` y=6 around the mill, axis x on z-edges and axis z on x-edges.
14. `halfWall(x,z0,z1)`: `spruce_planks` y=1..2 between two posts.
15. `boardBay(x0,x1,z,y0,y1)`: `spruce_planks` wall panel, with an optional doorway skip.
16. `sawCarriage(x,z0,z1)`: two `stripped_spruce_log` axis z rails at x-1 and x+1, y=1; a `spruce_log` axis z log on the centre line; `stonecutter` at the saw cell.
17. `filingBench(x,z)`: `grindstone` against the wall, `barrel` facing up, `chest` facing west, a `spruce_pressure_plate` on a `spruce_slab` as a bench top.
18. `logDeck(x0,x1,z0,z1)`: skids, two tiers of `spruce_log` axis x, a top tier and corner chocks, per the SITE table.
19. `lumberStack(x0,z0)`: 3 x 6 x 4 stack of `birch_planks` / `birch_slab` (top) with `stripped_spruce_wood` stickers, skids under it.
20. `fieldstoneStack(x,z,yTop,bandY)`: 2x2 `cobblestone` shaft with 1 in 6 `mossy_cobblestone` (more low down), `stone_bricks` band, lit `campfire` in the top course, `cobblestone_slab` cap ring.
21. `brickStack(x,z,yTop,bandY)`: 2x2 `bricks` shaft, `deepslate_bricks` band with the hay_block cell, signal `campfire` on top, `brick_slab` cap ring.
22. `hearthMouth(x,y,z)`: firebox cells open in the wall, lit `campfire` and `smoker`, inside lintel `cobblestone_stairs` half top.
23. `boilerFirebox(x,z)`: lit `blast_furnace` and lit `furnace` facing west.
24. `bunkBed(x,z,facing)`: lower `red_bed` (foot and head) at y=2; `stripped_spruce_log` axis y posts at both ends of y=2..3; `spruce_slab` (top) y=3 under the upper bed; upper `red_bed` y=4 (ground floor only; in the loft use single beds).
25. `messTable(x0,x1,z)`: `spruce_fence` legs every 2, `spruce_slab` (top) tops, `spruce_stairs` benches on both sides facing the table.
26. `cordwood(x0,z0,x1,z1,y0,y1)`: `spruce_log` axis z block fill (axis x in the woodshed if the plan says).
27. `stump(x,z,h)`: `spruce_log` axis y h high on a `podzol` cell, a `rooted_dirt` neighbour, a `fern` beside.
28. `spruceTree(x,z)`: `spruce_log` trunk y=1..7, `spruce_leaves` persistent cones: radius 2 at y=3..4, radius 1 at y=5..8, tip y=9..10, trimmed uneven.
29. `groundPatch(x0,z0,x1,z1,mix)`: seeded patches of `grass_block`, `coarse_dirt`, `podzol`, `rooted_dirt`; keeps paths and building footprints unchanged.
30. `ruts(x0,x1,z)`: `dirt_path` wheel line in `coarse_dirt`, with `gravel` patches ~15%.
31. `pathRun(x0,z0,x1,z1,width)`: `dirt_path`, 1 wide, 2 wide at ends.
32. `wallSign(x,y,z,facing,text)`: `spruce_wall_sign` with text; dark ink.
33. `leanToPost(x,z)`: `stripped_spruce_log` axis y, y=1..3.

## ROOMS
Interior doorways are 1 wide, 2 high, no door unless noted. Bunkhouse ground floor top at y=1 (stand y=2); loft floor y=5 (stand y=6); mill stands at y=1.
- **Bunkroom** [5,2,9,9,4,16]. Floor `spruce_planks`. Rows of double-decker bunks along the west wall (x=5) and south wall (z=16), a footlocker or two, a washstand barrel, a lantern. Cold, cramped, smells of wet wool. In from the mess through the partition doorway (10,2..3,13); out the back door (7,2..3,17) to the woodshed; the loft ladder stands at (5,2..5,16) (keep it clear); window west (4,3..4,12..13), front window (6..7,3..4,8).
- **Mess and cook hall** [11,2,9,17,4,16]. Floor `spruce_planks`. A long table (`messTable`) down the middle on the x axis, benches both sides, the hearth in the east wall (18,2..3,12..13: reserved, keep the cell in front clear), a rack of tin plates on the north wall, a barrel and a flour chest. Warm, loud, firelit. In from the porch through the front door (13,2..3,8); to the bunkroom through (10,2..3,13); windows front (15..16,3..4,8), east (18,3..4,9..10), back (14..15,3..4,17).
- **Loft** [5,6,10,17,8,15] plus the landing cell (5,6,16). Floor `spruce_planks` at y=5. The foreman's bunk, single beds, stores of sacks (barrels), tools and a lantern on the rafter; low at the sides (keep tall pieces z=11..14). Up by the ladder through the hatch (5,5,16); lit by the west gable window (4,8..9,12..13) and east window (18,8..9,15).
- **Front porch** [5,2,5,17,3,7]. Floor `spruce_planks` at y=1. A bench by the door, boots and an axe rack, a barrel, peg rail; lanterns already at (12,3,6) and (14,3,6). In by the step (13,1,4) at the rail gap; into the mess by the front door (13,2..3,8). Keep the lane x=13, z=5..8 clear.
- **Woodshed** [5,1,18,12,3,20]. Ground floor (podzol and coarse dirt). Open on the south. Cordwood x=9..12 (P6 stacks it), the lane x=5..8 clear to the back door, a chopping block and splitting maul stand (a `spruce_log` stump), kindling basket (`barrel`). In from the bunkroom through the back door (7,2..3,17) to (7,1,18), and from the yard by the open south side.
- **Sawmill hall** [24,1,9,34,5,19]. Floor `spruce_planks` at y=0. One tall open work floor: the saw carriage on x=28..30 stays as the architect's, the filing bench at (33..34,1,17..19), the boiler firebox at (36,1,17..18) on the east, a belt-and-pulley line of `iron_chain` hanging along the east side, offcuts bin (`barrel`), a tool shelf on the west half wall, lanterns hanging from the plate. In from the road side by the open north (24..34,1..5,8), out the south doorway (28..30,1..3,20). Keep a 1-wide lane from the north opening down x=27 to the south doorway, and one to the filing bench along x=31..32.

Stairs: none; the loft is reached by the ladder `ladder` facing north at (5,2..5,16) up to the hatch air cell (5,5,16), arriving at (5,6,16).

Entrance: the cell on the camp path just outside the porch step, (13,1,3).

## PARTS
1. **Bunkhouse log shell** (parts/bunkhouse.mjs): `plinthCourse`, the four log courses with `logCourse` and `saddleNotch`, the ground floor planks (x=5..17,z=9..16, y=1), the partition at x=10 (y=2..4) with its doorway (10,2..3,13), the loft floor at y=5 with the hatch air at (5,5,16), `porchBay` (deck, three posts, rails, step), every opening of the OPENINGS table left as air, the hearth cells (18,2..3,12..13) left as air. Also the west cordwood. Ticks 1, 2, 6 (west). Do not place any roof.
2. **Sawmill pole frame** (parts/sawmill.mjs): floor, 12 posts, braces, plate, west `halfWall`s, `boardBay` south back with the doorway, gable planks at z=8 and z=20 NOT placed (the roof tool owns them), `sawCarriage`, the log feeding rails. Ticks 13, 14, 16.
3. **Roofs** (parts/roofs.mjs): `roof.json` for both gabled roofs (use the architect's exact specs, `$MCD roof build.nbt --spec roof.json --dry-run`, fix warnings), porch shed roof and woodshed shed roof by hand, the woodshed beam. Ticks 3, 15 (monitor, gable planks), 7 (roof).
4. **Fittings** (parts/fittings.mjs): `doorPair` x2, `paneWindow` for every window, `shutterPair` positions from FACADES, `hangLantern` (porch and mill), `loftLadder`, `wallSign` "SAWMILL", the mill's loft door trapdoors. Ticks 8, 9, 10, 12, 15 (sign, loft door), 26.
5. **Chimneys, stacks and fires** (parts/fire.mjs): `fieldstoneStack`, `brickStack`, `hearthMouth`, `boilerFirebox`, `filingBench`; the roof tool keeps their cells. Ticks 4, 5, 17, 18, 19.
6. **Grounds, yard and woodshed** (parts/grounds.mjs): `groundPatch`, `ruts`, `pathRun`, `logDeck`, `lumberStack` x3, `stump`, `spruceTree`, `leanToPost` x3, woodshed `cordwood`, `lampPost`. Ground first, so everything stands on it. Ticks 6 (woodshed), 7 (posts), 20-25, 26.

Checklist: [x] P1 [ ] P2 [ ] P3 [ ] P4 [ ] P5 [ ] P6

## Notes for workers
- Never change the architect's coordinates. Reserved cells stay air until P5 or P4 fills them. A later part only adds into air.
- The roof tool keeps (19..20,1..17,12..13) and (36..37,1..19,17..18). The stacks are built by P5 on their own footings; they need a gap in the mill east eave only where the tool leaves it.
- P6 builds the ground first at y=0 across 0..39 x 0..33 but must leave the mill floor (23..35, 8..20) and every footprint alone.
- Campfires: set `lit: true` and `signal_fire` as stated; no player walks on them (stack tops and the back of the firebox only).
- Check with `$MCD check`, `$MCD walk build.nbt --rooms rooms.json`; render the north front and the east side.

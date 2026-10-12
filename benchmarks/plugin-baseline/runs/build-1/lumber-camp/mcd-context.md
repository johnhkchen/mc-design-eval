# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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

Checklist: [ ] P1 [ ] P2 [ ] P3 [ ] P4 [ ] P5 [ ] P6

## Notes for workers
- Never change the architect's coordinates. Reserved cells stay air until P5 or P4 fills them. A later part only adds into air.
- The roof tool keeps (19..20,1..17,12..13) and (36..37,1..19,17..18). The stacks are built by P5 on their own footings; they need a gap in the mill east eave only where the tool leaves it.
- P6 builds the ground first at y=0 across 0..39 x 0..33 but must leave the mill floor (23..35, 8..20) and every footprint alone.
- Campfires: set `lit: true` and `signal_fire` as stated; no player walks on them (stack tops and the back of the firebox only).
- Check with `$MCD check`, `$MCD walk build.nbt --rooms rooms.json`; render the north front and the east side.
```

### elements.md

```markdown
# Required elements: the lumber camp

Coordinates are the architect's (plan.md). "Vocab" names the helper in plan.md VOCABULARY. Parts: P1 Bunkhouse log shell,
P2 Sawmill pole frame, P3 Roofs, P4 Fittings (glazier, joiner, lamplighter), P5 Chimneys, stacks and fires, P6 Grounds and yard.

- [ ] **1. Log bunkhouse, saddle-notched corners** (P1, vocab `plinthCourse`, `logCourse`, `saddleNotch`). Plinth y=1 `cobblestone`
  (`mossy_cobblestone` ~1 in 6) x=4..18, z=8..17 ring. Courses y=2..5 of `spruce_log`: north/south walls axis x, east/west walls axis z.
  Notches: even courses (y=2,4) the axis-x logs run x=3..19 at z=8 and z=17 (log ends 1 past each corner); odd courses (y=3,5) the
  axis-z logs run z=7..18 at x=4 and x=18. Opening cells stay air.
- [ ] **2. Front porch** (P1 deck/posts/rail/step; P3 its roof; vocab `porchBay`). Deck `spruce_planks` x=5..17,y=1,z=5..7; posts
  `stripped_spruce_log` axis y at x=5,9,17 (none at x=13, the step gap), y=2..3, z=5; `spruce_fence`
  at y=2, z=5, x=6..8, 10..12, 14..16; `spruce_stairs` facing south at (13,1,4).
- [ ] **3. Steep slate roof with pale gables** (P3, `roof.json`, vocab none). The architect's cottage-preset spec; gable triangles
  `stripped_spruce_log`, `dark_oak` verges; loft windows left air at (18,8..9,15) and (4,8..9,12..13).
- [ ] **4. Cook chimney with smoke** (P5, vocab `fieldstoneStack`). 2x2 stack x=19..20, z=12..13, y=1..16 of `cobblestone` with
  `mossy_cobblestone` ~1 in 6; `stone_bricks` band y=15; y=16 three `cobblestone` + lit `campfire` at (20,16,13); y=17 `cobblestone_slab`
  (bottom) ring x=18..21, z=11..14 minus the 4 stack cells, air above the campfire.
- [ ] **5. Mess hearth** (P5, vocab `hearthMouth`). Firebox in the east wall at (18,2..3,12..13): floor cobble at y=1 (plinth), lit
  `campfire` (lit true, signal_fire false) at (18,2,12), `smoker` (lit) at (18,2,13) facing west; (18,3,12..13) stay air; lintel `cobblestone_stairs` half top facing west at (17,4,12..13).
- [ ] **6. Cordwood** (P6, vocab `cordwood`). West: `spruce_log` axis z, x=2..3, z=9..10, y=1..2. Woodshed: x=9..12, z=18..19, y=1..3.
- [ ] **7. Woodshed lean-to** (P6 posts and wood, P3 roof; vocab `leanToPost`). Posts `stripped_spruce_log` axis y at (5,1..3,21), (8,1..3,21), (12,1..3,21),
  beam `stripped_spruce_wood` axis x at y=3, x=5..12, z=21; roof BY HAND in P3.
- [ ] **8. Shutters on every window** (P4, vocab `shutterPair`). `spruce_trapdoor` open true, flat against the wall, positions per FACADES.
- [ ] **9. Doors** (P4, vocab `doorPair`): front (13,2..3,8) facing north; back (7,2..3,17) facing south; `spruce_door`.
- [ ] **10. Porch lanterns** (P4, vocab `hangLantern`): `lantern` hanging true at (12,3,6),(14,3,6) on `iron_chain` axis y at y=4.
- [ ] **11. Bunkroom bunks** (room designer, vocab `bunkBed`), **mess table and benches** (`messTable`), **loft bunks and stores**.
- [ ] **12. Loft ladder + hatch** (P1 floor hole, P4 ladder; vocab `loftLadder`): `ladder` facing north at (5,2..5,16) on the back wall, hatch air at (5,5,16).
- [ ] **13. Open pole-frame sawmill** (P2, vocab `millPost`, `kneeBrace`, `topPlate`). 12 posts `stripped_spruce_log` axis y, y=1..5, x=23,27,31,35
  at z=8 and z=20 and z=12,16 at x=23,35; plate `stripped_spruce_wood` y=6 (axis x on z=8, z=20; axis z on x=23, x=35); knee braces
  `spruce_stairs` half top at y=5 beside every post on north, south and long sides, facing the post.
- [ ] **14. Mill floor, half wall, boarded back** (P2, vocab `halfWall`, `boardBay`). Floor `spruce_planks` y=0 x=23..35,z=8..20; west half wall y=1..2
  at z=9..11,13..15,17..19; south back boards y=1..5 between posts with 3x3 doorway x=28..30 (lintel `stripped_spruce_wood` axis x y=4).
- [ ] **15. Mill gable, loft door, sign, monitor** (P3 roof + monitor + gable planks, P4 loft door and sign; vocab `wallSign`): `spruce_wall_sign`
  "SAWMILL" at (29,6,7) facing north; loft door cells (29,8..9,8) left air with open `spruce_trapdoor` beside.
- [ ] **16. Saw carriage with saw** (P2, vocab `sawCarriage`): `stripped_spruce_log` axis z rails x=28, x=30, z=9..19, y=1; `spruce_log` axis z at (29,1,9..11);
  `stonecutter` (29,1,14); the floor stays plank.
- [ ] **17. Boiler stack with tall plume** (P5, vocab `brickStack`). `bricks` x=36..37,z=17..18,y=1..18, `deepslate_bricks` band y=17 except (37,17,18) `hay_block`;
  y=18 lit `campfire` signal_fire true at (37,18,18) (lit true), other cells `bricks`; y=19 `brick_slab` ring x=35..38,z=16..19 outside the stack; (37,19,18) air.
- [ ] **18. Boiler firebox** (P5, vocab `boilerFirebox`): lit `blast_furnace` (36,1,17) facing west, lit `furnace` (36,1,18) facing west.
- [ ] **19. Saw-filing bench** (P5/P2, vocab `filingBench`): `grindstone` (34,1,18) face wall, `barrel` (33,1,17) facing up, `chest` (33,1,19) facing west.
- [ ] **20. Log deck** (P6, vocab `logDeck`): skids `stripped_spruce_log` axis z x=24,29,34, y=1, z=4..7; `spruce_log` axis x y=2 at z=4..7 x=25..33; y=3 at z=5..6 x=25..33;
  chocks `spruce_log` axis y at (24,2,4),(24,2,7),(34,2,4),(34,2,7).
- [ ] **21. Sawn lumber stacks** (P6, vocab `lumberStack`): three stacks as in plan, birch_planks / birch_slab (top) with stripped_spruce_wood stickers; slab tops on middle stack.
- [ ] **22. Stumps and chopping block** (P6, vocab `stump`): `spruce_log` axis y on `podzol` at the plan's cells; block (14,1,23) a `spruce_log` stump 1 high, with a `stripped_spruce_log` axis y at (14,2,23) as its worn top.
- [ ] **23. Spruces at the edges** (P6, vocab `spruceTree`): trunk y=1..7, persistent `spruce_leaves` cones.
- [ ] **24. Rutted logging road and skid road** (P6, vocab `ruts`, `groundPatch`): coarse_dirt road, dirt_path ruts z=1,2, gravel ~15%, skid road x=28..30.
- [ ] **25. Paths and yard lanes** (P6, vocab `pathRun`): dirt_path per the SITE table.
- [ ] **26. Camp lighting** (P4/P6, vocab `hangLantern`, `lampPost`): mill lanterns (25,5,8),(33,5,8) hanging true under the plate; `lampPost` (fence + lantern) at (13,1,2) by the road and (28,1,22) at the yard lane.
```

### rooms.json

```json
{"entrance":[13,1,3],"rooms":[{"name":"Bunkroom","box":[5,2,9,9,4,16]},{"name":"Mess and cook hall","box":[11,2,9,17,4,16]},{"name":"Loft","box":[5,6,10,17,8,15]},{"name":"Front porch","box":[5,2,5,17,3,7]},{"name":"Woodshed","box":[5,1,18,12,3,20]},{"name":"Sawmill hall","box":[24,1,9,34,5,19]}]}
```

### palette.json

```json
{"roles":{"bunkhouse_logs":["spruce_log"],"plinth_chimney":["cobblestone","mossy_cobblestone","stone_bricks","cobblestone_slab","cobblestone_stairs","cobblestone_wall","mossy_cobblestone_wall"],"pale_timber":["stripped_spruce_log","stripped_spruce_wood"],"planks":["spruce_planks","spruce_slab","spruce_stairs","spruce_fence","spruce_fence_gate","spruce_door","spruce_trapdoor","spruce_wall_sign","spruce_pressure_plate"],"glass":["glass_pane"],"roofs":["cobbled_deepslate","cobbled_deepslate_stairs","cobbled_deepslate_slab","deepslate_tiles","deepslate_tile_stairs","deepslate_tile_slab","polished_deepslate","tuff_bricks","tuff_brick_stairs","tuff_brick_slab","stone_brick_stairs","stone_brick_slab","dark_oak_planks","dark_oak_stairs","dark_oak_slab"],"brick_stack":["bricks","brick_slab","deepslate_bricks"],"lumber":["birch_planks","birch_slab","dark_oak_slab"],"ground":["grass_block","coarse_dirt","podzol","rooted_dirt","dirt_path","gravel","short_grass","fern"],"trees":["spruce_log","spruce_leaves"],"saw_carriage":["stonecutter","rail","iron_bars","spruce_planks","spruce_slab","spruce_trapdoor"],"visible_props":["barrel","chest","ladder","lantern","hay_block"]},"objects":["barrel","chest","ladder","red_bed","white_wool","white_carpet","bookshelf","crafting_table","composter","anvil","lectern","campfire","smoker","furnace","blast_furnace","stonecutter","grindstone","cauldron","lantern","iron_chain","hay_block","rail","iron_bars","spruce_door","spruce_trapdoor","spruce_wall_sign","spruce_fence","glass_pane","spruce_log"]}
```

### make.sh

```sh
#!/bin/sh
# Make build.nbt from scratch: build to a temp file, then move it into place (a failed build leaves the old one).
set -e
cd "$(dirname "$0")"
tmp="build.$$.tmp.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
echo "build.nbt ready"
```

### build.mjs

```js
// Lumber camp build: the ground, then every part in order; saves the structure to the path given as argv[2].
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SIZE, GROUND_Y, GRASS_BLOCK } from "./vocab/base.mjs";
import * as bunkhouse from "./parts/bunkhouse.mjs";
import * as sawmill from "./parts/sawmill.mjs";
import * as roofs from "./parts/roofs.mjs";
import * as fittings from "./parts/fittings.mjs";
import * as fire from "./parts/fire.mjs";
import * as grounds from "./parts/grounds.mjs";
import * as room1 from "./parts/room-1.mjs";
import * as room2 from "./parts/room-2.mjs";
import * as room3 from "./parts/room-3.mjs";
import * as room4 from "./parts/room-4.mjs";
import * as room5 from "./parts/room-5.mjs";
import * as room6 from "./parts/room-6.mjs";

const out = process.argv[2] ?? "build.nbt";
const g = new Grid(SIZE, { dataVersion: DATA_VERSIONS["26.3"] });

// The ground under everything (grounds.mjs adds the patches and paths over it; parts may replace it freely).
g.fill([0, GROUND_Y, 0], [SIZE[0] - 1, GROUND_Y, SIZE[2] - 1], GRASS_BLOCK);

// reroof reads the eave off the walls and throws on an empty shell, so the roof waits until the bunkhouse part has
// put something down: a probe run of the shell on its own grid (the stubs place nothing). A path that doesn't exist
// makes runParts skip the roof with a note.
const probe = new Grid(SIZE);
bunkhouse.build(probe);
const roof = probe.cells.size ? "roof.json" : "roof-after-shell.json";

runParts(g, [
  ["Bunkhouse log shell", bunkhouse.build],
  ["Sawmill pole frame", sawmill.build],
  ["Roofs", roofs.build],
  ["Fittings", fittings.build],
  ["Chimneys, stacks and fires", fire.build],
  ["Grounds, yard and woodshed", grounds.build],
  ["room: Bunkroom", room1.build],
  ["room: Mess and cook hall", room2.build],
  ["room: Loft", room3.build],
  ["room: Front porch", room4.build],
  ["room: Woodshed", room5.build],
  ["room: Sawmill hall", room6.build],
], { palette: "palette.json", roof });

g.save(out);
console.log(`saved ${out}: ${g.cells.size} blocks`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for the lumber camp: palette block ids (palette.json only), site boxes from plan.md, and a seeded rng.
// Boxes are inclusive [x0, y0, z0, x1, y1, z1], the same form as rooms.json.

// Palette block ids: structure roles (palette.json "roles").

// Palette block ids: structure roles (palette.json "roles").
export const SPRUCE_LOG = "spruce_log";                       // bunkhouse logs, trees

export const COBBLESTONE = "cobblestone";                     // plinth, chimney

export const MOSSY_COBBLESTONE = "mossy_cobblestone";         // plinth and chimney, 1 in 6

export const STONE_BRICKS = "stone_bricks";                   // chimney band

export const COBBLESTONE_SLAB = "cobblestone_slab";           // chimney cap

export const COBBLESTONE_STAIRS = "cobblestone_stairs";       // hearth lintel

export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log";     // posts, gables, rails

export const STRIPPED_SPRUCE_WOOD = "stripped_spruce_wood";   // plates, beams, stickers

export const SPRUCE_PLANKS = "spruce_planks";                 // floors, boards, deck

export const SPRUCE_SLAB = "spruce_slab";                     // sills, covers, porch roof

export const SPRUCE_STAIRS = "spruce_stairs";                 // knee braces, porch roof, benches

export const SPRUCE_FENCE = "spruce_fence";                   // rails, legs, lamp posts

export const SPRUCE_FENCE_GATE = "spruce_fence_gate";         // gates

export const SPRUCE_DOOR = "spruce_door";                     // front and back doors

export const SPRUCE_TRAPDOOR = "spruce_trapdoor";             // shutters, loft door

export const SPRUCE_WALL_SIGN = "spruce_wall_sign";           // SAWMILL sign

export const SPRUCE_PRESSURE_PLATE = "spruce_pressure_plate"; // filing bench top

export const GLASS_PANE = "glass_pane";                       // windows

export const COBBLED_DEEPSLATE = "cobbled_deepslate";         // roofs (slate)

export const COBBLED_DEEPSLATE_STAIRS = "cobbled_deepslate_stairs";

export const COBBLED_DEEPSLATE_SLAB = "cobbled_deepslate_slab";

export const DEEPSLATE_TILES = "deepslate_tiles";             // roofs (slate)

export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";

export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";

export const POLISHED_DEEPSLATE = "polished_deepslate";       // roofs (slate)

export const TUFF_BRICKS = "tuff_bricks";                     // roof eaves

export const TUFF_BRICK_STAIRS = "tuff_brick_stairs";

export const TUFF_BRICK_SLAB = "tuff_brick_slab";

export const STONE_BRICK_STAIRS = "stone_brick_stairs";       // roof ridge

export const STONE_BRICK_SLAB = "stone_brick_slab";

export const DARK_OAK_PLANKS = "dark_oak_planks";             // bunkhouse roof verges

export const DARK_OAK_STAIRS = "dark_oak_stairs";

export const DARK_OAK_SLAB = "dark_oak_slab";

export const BRICKS = "bricks";                               // boiler stack

export const BRICK_SLAB = "brick_slab";                       // boiler stack cap

export const DEEPSLATE_BRICKS = "deepslate_bricks";           // boiler stack band

export const BIRCH_PLANKS = "birch_planks";                   // sawn lumber

export const BIRCH_SLAB = "birch_slab";                       // sawn lumber, top slabs

export const GRASS_BLOCK = "grass_block";                     // ground

export const COARSE_DIRT = "coarse_dirt";                     // ground, ruts

export const PODZOL = "podzol";                               // ground, stump beds

export const ROOTED_DIRT = "rooted_dirt";                     // ground

export const DIRT_PATH = "dirt_path";                         // roads, paths

export const GRAVEL = "gravel";                               // ground, road patches

export const SHORT_GRASS = "short_grass";                     // ground

export const FERN = "fern";                                   // ground

export const SPRUCE_LEAVES = "spruce_leaves";                 // standing spruces (persistent)

// Palette block ids: objects (palette.json "objects").
export const BARREL = "barrel";                               // furniture, offcuts

export const CHEST = "chest";                                 // furniture, filing bench

export const LADDER = "ladder";                               // loft ladder

export const RED_BED = "red_bed";                             // bunks

export const WHITE_WOOL = "white_wool";                       // bedding

export const WHITE_CARPET = "white_carpet";                   // rugs

export const BOOKSHELF = "bookshelf";                         // furniture

export const CRAFTING_TABLE = "crafting_table";               // workstation

export const COMPOSTER = "composter";                         // furniture

export const ANVIL = "anvil";                                 // workstation

export const LECTERN = "lectern";                             // workstation

export const CAMPFIRE = "campfire";                           // cook fire, signal fire

export const SMOKER = "smoker";                               // hearth

export const FURNACE = "furnace";                             // boiler firebox

export const BLAST_FURNACE = "blast_furnace";                 // boiler firebox

export const STONECUTTER = "stonecutter";                     // saw

export const GRINDSTONE = "grindstone";                       // filing bench

export const CAULDRON = "cauldron";                           // hearth

export const LANTERN = "lantern";                             // light

export const IRON_CHAIN = "iron_chain";                       // hanging lights

export const HAY_BLOCK = "hay_block";                         // signal fire base

// Site: the grid is 40 x 22 x 34; the ground lies at y = GROUND_Y across x 0..39, z 0..33.
export const SIZE = [40, 22, 34];

export const GROUND_Y = 0;

// Site: masses from plan.md's SITE table (inclusive boxes).
export const BUNKHOUSE = [4, 1, 8, 18, 5, 17];                // log cabin walls (y=1 plinth, y=2..5 logs)

export const BUNKHOUSE_ROOF = [3, 6, 7, 19, 14, 18];          // steep gable incl. overhang, top y=14

export const PORCH = [5, 1, 5, 17, 5, 7];                     // deck, posts, rails, shed roof

export const WOODSHED = [5, 1, 18, 12, 5, 21];                // open lean-to behind the bunkhouse

export const SAWMILL = [23, 0, 8, 35, 6, 20];                 // open pole frame, floor y=0, plate y=6

export const SAWMILL_ROOF = [22, 7, 7, 36, 14, 21];           // 45 degree gable with monitor, top y=14

export const COOK_CHIMNEY = [19, 1, 12, 20, 17, 13];          // fieldstone stack, cap y=17

export const BOILER_STACK = [36, 1, 17, 37, 19, 18];          // red brick stack, cap y=19

export const LOG_DECK = [24, 1, 4, 34, 3, 7];                 // skids and log tiers feeding the mill

export const LUMBER_YARD = [24, 1, 24, 36, 4, 29];            // three sawn-lumber stacks

// Site: doors and the entrance cell (plan.md OPENINGS and ROOMS).
export const FRONT_DOOR = [13, 2, 8];                         // bunkhouse front door, from the porch

export const BACK_DOOR = [7, 2, 17];                          // bunkhouse back door, into the woodshed

export const ENTRANCE = [13, 1, 3];                           // camp path cell outside the porch step

// Interior room boxes, the same as rooms.json (keyed by room name).
export const ROOMS = {
  "Bunkroom": [5, 2, 9, 9, 4, 16],                            // bunkhouse ground floor, west
  "Mess and cook hall": [11, 2, 9, 17, 4, 16],                // bunkhouse ground floor, east
  "Loft": [5, 6, 10, 17, 8, 15],                              // under the steep roof
  "Front porch": [5, 2, 5, 17, 3, 7],                         // covered deck, north of the bunkhouse
  "Woodshed": [5, 1, 18, 12, 3, 20],                          // open lean-to, south of the bunkhouse
  "Sawmill hall": [24, 1, 9, 34, 5, 19],                      // tall open work floor
};

/** A seeded random generator (mulberry32): rng(seed)() returns a float in [0, 1), the same sequence for the same seed. */
export function rng(seed)
```

### vocab/h1.mjs

```js
// The nine h1 helpers from plan.md VOCABULARY. Each takes the grid first, then the position it is given (inclusive
// ranges), and returns how many blocks it wrote. Every write goes through put(): it lands only inside the helper's
// footprint and only into air, so a helper can't cut into another part's cells or the ground under it. opts.over
// writes into anything inside the footprint instead. Ground helpers (groundPatch) may also re-lay ground material.

/** plinthCourse(x0,z0,x1,z1,y): the ring of cobblestone at the edge of the box; corners always mossy, 1 in 6 elsewhere. */
export function plinthCourse(g, x0, z0, x1, z1, y, opts = {})

/**
 * paneWindow(x0,x1,y0,y1,fixed,axis): glass_pane over the span x0..x1 (along the wall; the run axis is `axis`, 'x' or
 * 'z') and y0..y1, in the wall plane `fixed` (z when axis is 'x', x when axis is 'z'). A spruce_slab (top) sill sits one
 * row below, one cell outside the wall: opts.out = -1 (north/west, the default) or +1 (south/east).
 */
export function paneWindow(g, x0, x1, y0, y1, fixed, axis, opts = {})

/** lampPost(x,z,h): spruce_fence post y=1..h with a standing lantern on top at y=h+1. */
export function lampPost(g, x, z, h, opts = {})

/** topPlate(x0,z0,x1,z1): stripped_spruce_wood ring at y=6; axis x on the z edges (corners included), axis z on the x edges. */
export function topPlate(g, x0, z0, x1, z1, opts = {})

/**
 * filingBench(x,z): a 2 x 3 saw-filing bench on the floor (y=1, top at y=2). Barrel (facing up) and chest (facing west)
 * on the west column, grindstone (floor) in the middle of the east column, a spruce_slab bench top with a
 * spruce_pressure_plate on it at the north end of the east column.
 */
export function filingBench(g, x, z, opts = {})

/**
 * brickStack(x,z,yTop,bandY): 2x2 bricks shaft on its own footing (y=1..yTop) at x..x+1, z..z+1. A deepslate_bricks band
 * at bandY, with hay_block in the signal cell (x+1, z+1). A lit signal campfire on the top course in that same cell,
 * and a brick_slab (bottom) cap ring at yTop+1 around the shaft, the shaft's own cells left air above it.
 */
export function brickStack(g, x, z, yTop, bandY, opts = {})

/**
 * messTable(x0,x1,z): a long table on the x axis at row z. spruce_fence legs every 2 cells (and at x1), spruce_slab (top)
 * tops at y=3, and spruce_stairs benches at y=2 on both sides: row z-1 faces north, row z+1 faces south (each back is
 * away from the table, so the seat faces it).
 */
export function messTable(g, x0, x1, z, opts = {})

/**
 * groundPatch(x0,z0,x1,z1,mix): seeded patches at y=0. mix is { block: weight } (default: grass-heavy). Patches are 4 x 4
 * cells, and 1 cell in 4 is re-rolled so the edges break up (opts.seed picks the layout). Only air and ground cells
 * change: dirt_path, footings and everything built stay as they are.
 */
export function groundPatch(g, x0, z0, x1, z1, mix = GROUND_MIX, opts = {})

/** leanToPost(x,z): stripped_spruce_log post, axis y, at y=1..3. */
export function leanToPost(g, x, z, opts = {})
```

### vocab/h2.mjs

```js
// Lumber camp helpers, part 2 (plan.md VOCABULARY 2, 6, 10, 14, 18, 22, 26, 30): logs, shutters, the loft ladder, the
// mill's half wall, the log deck, the cook hearth mouth, cordwood and the logging-road ruts.
// Each takes the grid first (g), then its position (and facing where it has one), and writes only into air, so an
// earlier part's blocks are never touched. The two named exceptions: loftLadder carves its hatch cell (on by default),
// and ruts replaces the ground surface at y=0. A write that would land on anything else is refused and listed in the
// returned `blocked` as [x, y, z, what was there]. Every helper returns { placed, blocked }.

/**
 * A straight course of spruce_log lying along axis x or z. The run is x0..x1 (inclusive); `at` is the coordinate the
 * run is fixed at: the z of an x-run, or the x of a z-run (so an east or west wall passes its own x as `at`). `skip` is
 * a list of opening cells to leave alone, as [x, y, z] triples or "x,y,z" keys. The log's axis state is the run's axis.
 */
export function logCourse(g, x0, x1, y, at, axis = "x", skip = [])

/**
 * Two 2-high columns of open spruce_trapdoor, one either side of a window `span` cells wide. (x, y, z) is the window's
 * first cell in the wall (its lower row); `facing` is the way out of the wall, as for a ladder. The shutters stand one
 * cell out from the wall, and each panel hinges on the wall, so it lies flat against it.
 */
export function shutterPair(g, x, y, z, facing, span)

/**
 * A ladder column (y0..y1, inclusive) against the wall at (x, z); `facing` is the way out of the wall (a ladder facing
 * north is fixed to the wall on its south). The hatch is the loft floor cell right above the column, y1 + 1, carved to
 * air unless { hatch: false }. For the plan's ladder up to the hatch at (5,5,16): loftLadder(g, 5, 16, 2, 4, "north").
 */
export function loftLadder(g, x, z, y0, y1, facing, { hatch = true } = {})

/** The mill's half wall on x: spruce_planks at y=1..2 strictly between the posts at z0 and z1 (the posts are not written). */
export function halfWall(g, x, z0, z1)

/**
 * The log deck (SITE table): stripped_spruce_log skids along z at y=1 on x0, the middle and x1; spruce_log tiers along
 * x at y=2 (rows z0..z1) and y=3 (rows z0+1..z1-1) over x0+1..x1-1; spruce_log chocks (axis y) at the four corners of
 * y=2. Footprint: x0..x1, y=1..3, z0..z1. logDeck(g, 24, 34, 4, 7) is the plan's deck.
 */
export function logDeck(g, x0, x1, z0, z1)

/**
 * A cook hearth in a wall. The firebox is the 2-wide opening through the wall: (x, y, z) and its neighbour along the
 * wall, with the top row (y+1) left as air. `facing` is the way into the room. A lit campfire at (x, y, z), a lit smoker
 * beside it, and a cobblestone_stairs lintel (half top, back to the wall) on the room side of both cells at y+2.
 * hearthMouth(g, 18, 2, 12, "west") is the plan's hearth in the east wall. The floor below is the caller's.
 */
export function hearthMouth(g, x, y, z, facing)

/** Cordwood: a solid block fill of spruce_log, logs lying along `axis` (z by default), x0..x1 by z0..z1 by y0..y1. */
export function cordwood(g, x0, z0, x1, z1, y0, y1, axis = "z")

/**
 * A wheel rut along x at z, on the ground surface (y=0): dirt_path, with about 1 cell in 7 gravel. The pattern is fixed
 * by position, so the same build comes out every time. It replaces ground blocks only (grass, dirt, coarse dirt, ...).
 */
export function ruts(g, x0, x1, z)
```

### vocab/h3.mjs

```js
// Helpers for the lumber camp (plan.md VOCABULARY items 3, 7, 11, 15, 19, 23, 27, 31): saddleNotch, doorPair, millPost,
// boardBay, lumberStack, boilerFirebox, stump, pathRun. Each takes the grid (a runParts view or a Grid) first, then the
// plan's arguments, then an optional { over } (default false: write only into air). Coordinates are absolute, x east,
// y up, z south. A helper writes only its own footprint and never below y=1: ground, floors and sand belong to earlier
// parts. pathRun is the one helper that touches y=0, laying dirt_path on ground it finds there. A cell that is not air
// is skipped and listed in `skipped`, never overwritten. Each returns { placed, skipped }.

// ---- log wall detail (item 3) ----------------------------------------------------------------------------------------
/** One protruding log end on a wall; `axis` is the axis the wall runs along (x or z). */
export function saddleNotch(g, x, y, z, axis, opts = {})

// ---- doors (item 7) --------------------------------------------------------------------------------------------------
/** A spruce door at (x, y, z) and its upper half at y + 1. `facing` is the way it faces out of the room it closes. */
export function doorPair(g, x, y, z, facing, hinge, opts = {})

// ---- mill frame and boards (items 11, 15) ----------------------------------------------------------------------------
/** A pale stripped spruce post at (x, z), y = 1..5. */
export function millPost(g, x, z, opts = {})

/**
 * A spruce plank wall panel at z, x0..x1 by y0..y1. `doorway` (optional, a ROOMS-style box [x0,y0,z0,x1,y1,z1]) is left
 * as air. Cells that are not air are skipped one by one, so posts already in place are kept.
 */
export function boardBay(g, x0, x1, z, y0, y1, opts = {})

// ---- sawn lumber (item 19) -------------------------------------------------------------------------------------------
/**
 * A sawn-lumber stack, 3 wide (x0..x0+2) by 6 deep (z0..z0+5) by 4 high (y=1..4): stripped skids at y=1 (z0, z0+2,
 * z0+5), birch planks at y=2, stripped stickers at y=3 (z0+1, z0+4), top course at y=4 as birch planks, or birch slabs
 * (type top) with `slabTop`. Atomic: a stack is all or nothing.
 */
export function lumberStack(g, x0, z0, opts = {})

// ---- boiler firebox (item 23) ----------------------------------------------------------------------------------------
/** The boiler's firebox: a lit blast_furnace at (x, 1, z) and a lit furnace at (x, 1, z + 1), both facing west. */
export function boilerFirebox(g, x, z, opts = {})

// ---- stumps (item 27) ------------------------------------------------------------------------------------------------
/**
 * A spruce stump h high (y=1..h) at (x, z). A fern goes on the first free cell beside it at y=1 that has ground under
 * it (+x, -x, +z, -z). The ground (podzol, rooted dirt) is groundPatch's; this writes none of it.
 */
export function stump(g, x, z, h, opts = {})

// ---- paths (item 31) -------------------------------------------------------------------------------------------------
/**
 * A dirt_path run from (x0, z0) to (x1, z1), straight along x or z. The body is `width` cells across (the run extends
 * toward +z or +x); the two end cells are 2 across. Only ground at y=0 is replaced (grass, dirt, podzol, gravel ...);
 * anything else on the cell (a stone, a floor) is skipped and listed.
 */
export function pathRun(g, x0, z0, x1, z1, width)
```

### vocab/h4.mjs

```js
// Helpers from plan.md VOCABULARY (h4 share): the porch bay, the hanging lantern, the knee brace, the saw carriage, the
// fieldstone chimney stack, the bunk bed, the spruce tree and the wall sign. Each takes the grid first, then its position
// (and facing) as arguments, and returns the cells it wrote as [x, y, z]. Writes go only into air (g.isAir) unless
// opts.overwrite is true; a refused cell is skipped, not thrown. A piece that hangs or sits on something (a lantern, a
// sign, a brace) writes nothing unless its support is there. Nothing is written outside a helper's footprint, so no
// ground, sand or floor under it is touched. Facings take n|s|e|w or the full names; a wall sign or brace faces what it
// hangs from or stands beside (build.mjs: a wall sign's facing is the way it points out).

// The porch bay: deck planks on y=1 over x0..x1 (z, z+1, z+2), a stripped spruce post at each end on y=2..3 (at z), and a
// spruce_fence rail on y=2 between them. opts.skip: x cells with no post and no rail (the porch step's gap); the deck stays.
// Call it per bay: porchBay(g, 5, 9) and porchBay(g, 9, 17, 5, { skip: [13] }).
export function porchBay(g, x0, x1, z = 5, opts = {})

// A lantern (hanging true) at (x, y, z) on an iron_chain of length `chain` above it (chain 0: it hangs straight from the
// block above). The support is the block over the chain; with no support it writes nothing.
export function hangLantern(g, x, y, z, chain = 0, opts = {})

// One knee brace at (x, y, z): an upside-down spruce stair (half top) facing `facing`, the way of the post it rises
// toward. The post stands in the next cell that way; with no post there it writes nothing. y defaults to plan's 5.
export function kneeBrace(g, x, z, facing, y = 5, opts = {})

// The saw carriage down the centre of a mill bay: stripped spruce rails at x-1 and x+1 on y=1 from z0 to z1, a spruce log
// riding the centre line (opts.log: [za, zb], default z0..z0+2), and the saw, a stonecutter, at (x, 1, opts.saw) (default
// z0+5). opts.facing: the saw's facing (default north). The floor under it is not touched.
export function sawCarriage(g, x, z0, z1, opts = {})

// The cook chimney: a 2x2 cobblestone shaft at (x..x+1, z..z+1) from y=1 to yTop, mossy cobblestone about 1 in 6 (1 in 3
// at y<=4), a stone_bricks band at bandY, the top course three cobblestone and a lit campfire (signal_fire false) at
// (x+1, yTop, z+1), and a cobblestone_slab (bottom) ring one cell out at yTop+1 on the four sides, the 2x2 left open.
// Plan's cap ring at y=17 has nothing under it: the stack top is only the 2x2, so the ring is unsupported in the build.
export function fieldstoneStack(g, x, z, yTop, bandY, opts = {})

// A bunk: the lower bed at y=2 (foot at (x, z), head one cell along `facing`), posts at both ends on y=2..3 outside the bed,
// a spruce_slab (top) on y=3 under the upper bed, and the upper bed at y=4. Ground floor only; opts.upper: false for a single
// bed (the loft). The bed sits against a wall on one side, the lane past it (the cells beside it) stays clear. All or nothing.
export function bunkBed(g, x, z, facing, opts = {})

// A spruce tree rooted at (x, 1, z): spruce_log trunk on y=1..7; persistent spruce_leaves in cones, radius 2 at y=3..4,
// radius 1 at y=5..8, a tip at y=9..10; outer leaves trimmed unevenly. The trunk is written first; leaves stay out of it.
export function spruceTree(g, x, z, opts = {})

// A wall sign with text (a \n splits lines, up to four), black ink, pointing out in `facing`, on the block behind it (the
// wall it hangs from). With no block behind it writes nothing.
export function wallSign(g, x, y, z, facing, text, opts = {})
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

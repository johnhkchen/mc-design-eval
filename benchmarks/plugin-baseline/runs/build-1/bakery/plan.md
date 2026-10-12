# Plan: Germanic bakery (Bäckerei) — architect's form

Identity: a narrow, gable-to-the-street town bakery. Dark deepslate masonry ground storey with a big shop window either side
of the door; a jettied half-timbered upper storey and gable (stripped spruce frame, white daub infill); a steep slate roof
with a flour-loft hoist beam at the apex; a lower bakehouse wing on the east whose brick bread oven bulges out at the back
under a tall brick chimney. Spruce-forest materials only. All ranges inclusive. Axes: x east (along the street), y up,
z south; the front faces NORTH (-z).

## SITE
Lot 24 (x 0..23) by 32 (z 0..31), height to y=24. Ground block y=0; outdoor walking surface y=1; interior floor blocks
y=1 (walk y=2).

| mass / feature | x | y | z | notes |
|---|---|---|---|---|
| ground | 0..23 | 0 | 0..31 | grass_block; podzol + coarse_dirt patches in the yard |
| street (lane) | 0..23 | 0 | 0..3 | gravel, kerb of cobbled_deepslate at z=3 |
| sidewalk | 0..23 | 0 | 4..7 | cobblestone with mossy_cobblestone flecks (~15%) |
| front step | 10..12 | 1 | 8 | cobbled_deepslate_stairs facing north (x=11), cobbled_deepslate_slab at x=10 and x=12 |
| MAIN BODY ground storey | 6..16 | 1..5 | 9..22 | deepslate masonry, 11 wide x 14 deep |
| MAIN BODY upper storey (jettied) | 6..16 | 6..10 | 8..22 | half-timber; projects 1 north over the shop front (z=8) |
| jetty brackets | 6,8,11,14,16 | 5 | 8 | spruce_stairs upside-down, back against the wall (facing south), under the jetty sill |
| main roof + front/back gables | 5..17 | 11..21 | 7..23 | steep gable, ridge along z at x=11, y=21 |
| BAKEHOUSE WING | 17..21 | 1..5 | 13..22 | single storey, gable end to the street (north face z=13) |
| wing roof | 17..22 | 6..8 | 12..23 | gable, ridge along z at x=19 |
| BREAD OVEN (brick) | 17..21 | 1..5 | 23..26 | projects south out of the wing's back wall, barrel-vaulted top |
| CHIMNEY | 19..20 | 1..17 | 24..25 | bricks, rises from the oven; top course y=17, campfire smoke at (19,17,24) |
| hoist beam (flour loft) | 11 | 19 | 5..8 | stripped_spruce_log axis z, projecting 2 past the roof verge; iron_chain (11,18,5), (11,17,5); a barrel at (11,16,5) hangs as the flour load |
| bakery sign arm | 16 | 7 | 6..7 | spruce_fence arm out from the jetty corner post; spruce_hanging_sign at (16,6,6); lantern at (16,6,7) |
| bench | 2..4 | 1 | 10 | spruce_stairs facing north, against the west fence |
| rear yard fence | 1..23 | 1 | 30 ; x=1 & x=23 z=10..30 | spruce_fence, spruce_fence_gate at (1,1,20) and (23,1,16) |
| woodpile | 7..10 | 1..2 | 24..25 | spruce_log axis x (oven fuel), spruce_slab lid y=3 |
| herb/wheat patch | 2..5 | 0..1 | 24..28 | farmland y=0 + wheat y=1, coarse_dirt border |
| spruce trees | (2,1,15), (3,1,29) | 1..9 | | small hand-built spruce (log + spruce_leaves), crowns stay below y=10 and west of x=5 |
| flour sacks / props yard | 12..15 | 1 | 24..26 | barrels, hay_block, composter, grindstone |
| path to back door | 8 | 0 | 23..30 | dirt_path; path to wing side door 22..23 at z=17 dirt_path |

## ROOFS
| roof | form | pitch | ridge | overhang | how built |
|---|---|---|---|---|---|
| main | steep gable, gable end to the street (north) and back (south) | 2 (preset shop) | along z at x=11, y=21, z=7..23 | 1 all round (eave x=5 and x=17 at y=11; verges z=7, z=23) | `$MCD roof --spec` with `{"preset":"shop","material":"slate","ridgeAxis":"z","front":"n","gable":"white_wool","verge":"spruce","keep":[the gable timber cells + loft opening, see FACADES]}` over footprint [6,8,16,22], eave y=10 (roof from y=11). Tested: roof top y=21, ratio 1.00 (cap 1.8). The tool's dormers do NOT fit this span (dropped) — no dormers; the long slopes are broken on the east by the wing roof and the chimney, on the west they stay plain (accepted: steep unbroken German slate roof). |
| wing | gable, gable end north | 1 (45°, stairs) | along z at x=19, y=8, z=12..23 | 1 north/east/south, 0 west (abuts the main wall x=16; reason: wing butts into the main house) | `roof()` with rects [[17,13,21,22]], style gable, y=6, ridgeAxis z, material slate, overhang {west:0,north:1,south:1,east:1}, gable white_wool. Eave x=22 y=6; x=17 course stops against the main wall. Ridge cap: deepslate_brick_slab. |
| oven vault | barrel vault, axis z | — | y=5 at x=19 | 0 | by hand: y=4 brick_stairs facing outward at x=17 (facing west) and x=21 (facing east), bricks x=18..20; y=5 brick_slab x=18..20 (bottom), except the chimney cells. South end z=26 closed with bricks y=1..4. |
| chimney | 2x2 stack | — | top y=17 | — | by hand, bricks x=19..20 z=24..25 y=5..17; top ring y=17: brick_slab (top) at the 3 non-smoke cells, campfire (lit) at (19,17,24); one course of deepslate_bricks at y=12 as a band. |

## FACADES
Three-part hierarchy everywhere: dark deepslate base (y=1..5) / light half-timber body (y=6..10) / steep slate roof with timbered gable.

### North front (street), main body
| level | y | content (x positions) | depth |
|---|---|---|---|
| plinth | 1 | polished_deepslate x=6..16 at z=9, except door/step | 0 |
| shop storey | 2..4 | corner piers x=6, x=16 deepslate_bricks; shop window x=7..9; door-frame post x=10 stripped_spruce_log (y=2..4); DOOR x=11 (y=2..3), transom glass (11,4,9); post x=12; shop window x=13..15 | windows and door recessed 0 (in wall plane); posts flush |
| window sills / counters | 2 | spruce_slab (top) at (7..9,2,8) and (13..15,2,8) = sales counters | +1 proud |
| breast course under windows | 2 | deepslate_bricks at (7..9,2,9),(13..15,2,9) behind the counter slab | 0 |
| shutters | 3..4 | spruce_trapdoor, open, flat against the wall face at z=8 on the shop windows' outer sides: (6,3..4,8) and (16,3..4,8) | +1 |
| lintel beam (Rähm) | 5 | stripped_spruce_wood axis x, x=6..16 at z=9 | 0 |
| jetty brackets | 5 | spruce_stairs upside-down at (6,8,11,14,16 ; 5 ; 8) | +1 |
| jetty sill beam | 6 | stripped_spruce_wood axis x, x=6..16 at z=8 | +1 over the ground face |
| upper storey frame | 7..10 | posts stripped_spruce_log (vertical) at x=6, 8, 11, 14, 16, y=7..10 at z=8; breast rail stripped_spruce_wood axis x at y=7 between posts; head plate stripped_spruce_wood axis x at y=10, x=6..16 | 0 (frame and infill share the plane z=8) |
| upper windows | 8..9 | x=9..10 and x=12..13 (2 wide, 2 tall), glass_pane | -0 (in plane) |
| outer panels | 8..9 | x=7 and x=15: white_wool infill with a "Mann" brace: spruce_stairs at (7,8,8) and (15,8,8), upside-down, facing toward the nearest post | 0 |
| flower boxes | 7 | spruce_slab (top half) at (9..10,7,7) and (12..13,7,7); flower_pot with red_tulip/poppy standing on them at (9,8,7),(10,8,7),(12,8,7),(13,8,7) | +1 |
| front GABLE (z=8) | 11..20 | frame first (shell): collar beam stripped_spruce_wood axis x at y=14 across the gable (x=8..14, inside the triangle), king post stripped_spruce_log at (11,11..13,8); attic windows (9..10,12..13,8) and (12..13,12..13,8) glass_pane; LOFT DOOR (11,15..16,8) left OPEN (air); spruce_trapdoor shutters (open) at (10,15..16,7) and (12,15..16,7) folded back against the gable | trapdoors +1 |
| gable verge | rakes | spruce verge (roof tool) | +1 |
| hoist beam | 19 | stripped_spruce_log axis z at (11,19,5..8), out past the verge; iron_chain (11,18,5),(11,17,5); barrel at (11,16,5) as the hoisted sack | +3 |
| bakery sign | 6..7 | spruce_fence arm (16,7,7),(16,7,6); spruce_hanging_sign (16,6,6) ("Bäckerei"); lantern hanging at (16,6,7); lanterns hanging under the jetty at (9,5,8) and (13,5,8) | +1..+2 |

### West face (x=6) and east face (x=16) of the main body
| level | y | content (z positions) |
|---|---|---|
| plinth | 1 | polished_deepslate |
| ground | 2..4 | deepslate_bricks; windows (6,3..4,11..12) and (6,3..4,17..18) with spruce_trapdoor shutters (open, flat) at z=10,13 and z=16,19 on x=5; East face only z=9..12 shows: window (16,3..4,10..11) |
| lintel | 5 | stripped_spruce_wood axis z, z=9..22 |
| upper | 6..10 | sill beam y=6 and head plate y=10 stripped_spruce_wood axis z; posts stripped_spruce_log at z=8, 10, 13, 15, 18, 20, 22; breast rail y=7; windows (glass_pane) z=11..12 and z=16..17 at y=8..9; single panels z=9, 14, 19, 21 get one upside-down spruce_stairs brace at y=8; rest white_wool |
| east upper | 8..9 | same as west (above the wing roof, which meets x=16 at y=6) |

### South (back, z=22), main body
Ground: plinth y=1; BACK DOOR (8,2..3,22) spruce_door; window (13..14,3..4,22); lintel y=5 stripped_spruce_wood axis x.
Upper: same frame as the front (posts x=6, 8, 11, 14, 16) but flush (no jetty); windows (9..10,8..9,22),(12..13,8..9,22).
Back gable: collar beam y=14, king post (11,11..13,22), one attic window (11,15..16,22) glass_pane.

### Bakehouse wing (x=17..21, z=13..22)
| face | content |
|---|---|
| north gable end z=13 (street-visible) | plinth y=1 cobbled_deepslate; walls y=2..5 cobbled_deepslate; corner post stripped_spruce_log at (21,1..5,13); window (19,3..4,13) glass_pane with spruce_trapdoor shutters at (18,3..4,12),(20,3..4,12); lintel y=5 stripped_spruce_wood axis x x=17..21; gable y=6..7 white_wool with a stripped_spruce_log king post (19,6,13), small round-ish vent: (19,7,13) spruce_trapdoor as a vent |
| east face x=21 | cobbled_deepslate y=1..5; side DOOR (21,2..3,17) spruce_door; windows (21,3..4,15) and (21,3..4,20); lintel y=5 stripped_spruce_wood axis z; corner posts stripped_spruce_log x=21 at z=13 and z=22, y=1..5 |
| south face z=22 | cobbled_deepslate; the oven butts against it x=17..21 (oven mouth inside the wing) |

### Bread oven (x=17..21, z=23..26)
Plinth y=1 cobbled_deepslate (whole footprint); body y=2..3 bricks; vault y=4..5 (see ROOFS). The oven's chamber is inside
x=18..20, z=23..25, y=2..3 (air), opening to the wing at the oven mouth (19,2..3,22) — the wing's south wall leaves it
open; the fire is a campfire inside at (19,2,24); a smoker stands beside the mouth at (18,2,21). The chimney stack x=19..20 z=24..25 starts at y=4 inside the vault
(the vault cells there are bricks) and rises to y=17.

## MATERIALS
| role | block id | why / read at distance |
|---|---|---|
| ground-storey walls (dominant base) | deepslate_bricks | dark charcoal masonry |
| plinth course | polished_deepslate | smooth darker band at the foot |
| wing walls + oven plinth | cobbled_deepslate | rougher grey, workshop |
| structural frame (posts, beams, rails, brackets, hoist beam) | stripped_spruce_log (posts, vertical), stripped_spruce_wood (beams, axis along the beam) | warm tan-brown, contrasts both dark stone and white daub |
| braces, jetty brackets | spruce_stairs | darker brown accent in the frame |
| infill (daub) | white_wool | bright white panels: the classic Fachwerk read |
| roof | `slate` palette (cobbled_deepslate, deepslate_tiles, polished_deepslate; blackstone-brick eave, stone-brick ridge) | grey slate, lighter than the black walls, tested 5 tones |
| verges / barge | spruce (roof tool default for shop) | |
| oven, chimney | bricks, brick_stairs, brick_slab | the one warm red: reads as "oven" from the street |
| chimney band | deepslate_bricks | |
| glass | glass_pane | |
| doors | spruce_door | |
| shutters, counters, sills | spruce_trapdoor, spruce_slab | |
| accent (flowers) | red_tulip, poppy in flower_pot | red ties to the brick oven |
| lights | lantern | |
| sign | spruce_hanging_sign, spruce_fence | |
| street | gravel; kerb cobbled_deepslate; sidewalk cobblestone + mossy_cobblestone | |
| yard | grass_block, podzol, coarse_dirt, dirt_path, farmland + wheat, spruce_fence | |
All checked with `$MCD blocks --check` (note: the chain is `iron_chain`; plain `chain` is unknown).
Proportions: stone base ~30%, white infill ~25%, spruce frame ~15%, slate roof ~25%, brick ~5%.

## OPENINGS
| opening | cells | size | fill |
|---|---|---|---|
| front door | (11,2..3,9) | 1x2 | spruce_door, facing north, step at (11,1,8) |
| front transom | (11,4,9) | 1x1 | glass_pane |
| shop window W | (7..9,3..4,9) | 3x2 | glass_pane |
| shop window E | (13..15,3..4,9) | 3x2 | glass_pane |
| upper front windows | (9..10,8..9,8), (12..13,8..9,8) | 2x2 | glass_pane |
| front attic windows | (9..10,12..13,8), (12..13,12..13,8) | 2x2 | glass_pane |
| loft door | (11,15..16,8) | 1x2 | open (air), trapdoor shutters beside |
| west ground windows | (6,3..4,11..12), (6,3..4,17..18) | 2x2 | glass_pane |
| east ground window | (16,3..4,10..11) | 2x2 | glass_pane |
| west/east upper windows | (6,8..9,11..12),(6,8..9,16..17),(16,8..9,11..12),(16,8..9,16..17) | 2x2 | glass_pane |
| back door | (8,2..3,22) | 1x2 | spruce_door |
| back ground window | (13..14,3..4,22) | 2x2 | glass_pane |
| back upper windows | (9..10,8..9,22),(12..13,8..9,22) | 2x2 | glass_pane |
| back attic window | (11,15..16,22) | 1x2 | glass_pane |
| wing north window | (19,3..4,13) | 1x2 | glass_pane |
| wing east door | (21,2..3,17) | 1x2 | spruce_door |
| wing east windows | (21,3..4,15), (21,3..4,20) | 1x2 | glass_pane |
| wing to main (interior) | (16..17,2..3,15) | 1x2, 2 deep | open doorway through the main east wall x=16 and the wing's own west wall x=17 (bakehouse → shop) |
| oven mouth | (19,2..3,22) | 1x2 | open (air) |
The shell part leaves every one of these cells unset.

## RESERVED (shell leaves empty)
| cells | for |
|---|---|
| (19,2..3,22) and the oven chamber x=18..20, y=2..3, z=23..25 (except the chimney's inner corner bricks) | oven mouth + fire (campfire at (19,2,24)) |
| (11,15..16,8), (11,19,5..7), (11,16..18,5) | loft door, hoist beam and its load |
| (16,6..7,6..7) | sign arm, hanging sign, lantern |
| x=7..8, y=6, z=14..17 | stairwell hole in the upper floor (stair rises north along the west wall inside, x=7..8, z=18 → 14) |
| x=8..9, y=11, z=19..20 | attic ladder hole |
| (19,17,24) | chimney campfire |

## FLOORS
| storey | floor block y | walk y | interior volume | use (for the room designer) |
|---|---|---|---|---|
| ground, main | 1 (spruce_planks) | 2 | x=7..15, y=2..5, z=10..21 | shop at the front (z=10..15, counter across at z=14), bakery/proofing room behind (z=16..21) |
| ground, wing | 1 (cobbled_deepslate) | 2 | x=18..20, y=2..7 (open to the rafters), z=14..21 | bakehouse: kneading trough, flour barrels, oven mouth at the south wall |
| upper | 6 (spruce_planks; the jetty/sill beam course) | 7 | x=7..15, y=7..10, z=9..21 | baker's living room (front, over the street) + bedroom (back) |
| attic / flour loft | 11 (spruce_planks) | 12 | x=7..15 narrowing with the roof, y=12..19, z=9..21 | flour sacks under the hoist door |

---
# DESIGNER'S SECTIONS (below the architect's form; nothing above is changed)

Conventions for every worker: stair `facing` = the side of the full-height back (toolkit). Where the architect wrote the front step "facing north", render it and make sure the LOW step points at the street (z smaller): that is `facing: south` in this convention. Log/wood `axis` runs along the beam. Panes: set the connection states along the wall (or use `B.pane`). All writes go through `runParts` (add-into-air only), so a part must never need to overwrite an earlier part's cell: cells for a later part are LEFT UNSET.

## PALETTE
All ids checked with `$MCD blocks --check` (0 unknown). Spruce-forest rule: nothing exotic; wool only as daub.

| role | block id | shapes / states needed |
|---|---|---|
| ground walls (dominant) | `deepslate_bricks` | `deepslate_brick_stairs`, `deepslate_brick_slab`, `deepslate_brick_wall` (planter walls) |
| plinth | `polished_deepslate` | `polished_deepslate_stairs`, `polished_deepslate_slab` |
| wing walls, oven plinth, kerb, step | `cobbled_deepslate` | `cobbled_deepslate_stairs`, `cobbled_deepslate_slab`, `cobbled_deepslate_wall` |
| frame posts (vertical) | `stripped_spruce_log` axis y | |
| beams, sills, plates, rails, lintels | `stripped_spruce_wood` axis x or z | |
| braces, brackets, steps | `spruce_stairs` | half top/bottom, facing, shape straight |
| daub infill | `white_wool` | |
| roof | slate preset: `cobbled_deepslate`, `deepslate_tiles`, `polished_deepslate`; eave `polished_blackstone_bricks`, ridge `deepslate_brick_slab` | stairs/slabs made by the roof tool: `deepslate_tile_stairs`, `deepslate_tile_slab` |
| verges / barge | `spruce_planks` family: `spruce_stairs`, `spruce_slab` | |
| floors | `spruce_planks` (main, upper, attic), `cobbled_deepslate` (wing) | `spruce_slab`, `spruce_stairs` |
| oven, chimney | `bricks` | `brick_stairs`, `brick_slab`, `brick_wall` |
| chimney band | `deepslate_bricks` | |
| glass | `glass_pane` | |
| doors | `spruce_door` (lower/upper halves, hinge, open) | |
| shutters, vents, flaps | `spruce_trapdoor` (open, facing, half) | |
| counters, flower boxes, lids | `spruce_slab` | |
| railing, fences | `spruce_fence`, `spruce_fence_gate` | |
| signs | `spruce_hanging_sign`, `spruce_wall_sign` | |
| lights | `lantern` (hanging true/false), `campfire` (lit true), `candle` / `white_candle` | |
| chain | `iron_chain` axis y | |
| flowers | `potted_red_tulip`, `potted_poppy` (or `flower_pot` + item) | |
| street | `gravel`, `cobbled_deepslate` kerb, `cobblestone` + `mossy_cobblestone` | |
| yard | `grass_block`, `podzol`, `coarse_dirt`, `dirt_path`, `farmland` (moisture 7) + `wheat` (age 4..7), `spruce_log` + `spruce_leaves` (persistent true) | |
| functional bakery | `smoker`, `blast_furnace`, `furnace`, `campfire`, `barrel`, `hay_block`, `composter`, `grindstone`, `cauldron`, `water_cauldron`, `loom`, `chest`, `lectern`, `crafting_table`, `bookshelf`, `chiseled_bookshelf`, `decorated_pot`, `cake`, `candle_cake`, `ladder` | |
| soft furnishing | `white_bed`, `red_bed`, `white_carpet`, `red_carpet`, `brown_carpet`, `red_wool`, `brown_wool` | |

Proportions: stone base ~30%, white daub ~25%, spruce frame ~15%, slate ~25%, brick ~5%. Interior: warm spruce wood against white plaster, one red accent per room (bed, carpet, tulips, brick stove).

## VOCABULARY
Each helper is `name(g, ...)`, writes via `g.set` and the `B.*` block helpers, and returns the cells it wrote. Coordinates are corner-origin unless stated. Shares of ~10 are written at once by separate sessions, in this order.

**Frame and walls**
1. `beamRun(g, axis, a0, a1, fixed, y, fixed2)` — a horizontal `stripped_spruce_wood` run with `axis: x|z`, from a0 to a1 at the given other coordinates. E.g. sill `beamRun(g,"x",6,16,8,6)` (z=8, y=6).
2. `postRun(g, x, y0, y1, z)` — vertical `stripped_spruce_log` axis y, y0..y1.
3. `daubPanel(g, axis, x0, x1, y0, y1, z, {brace:null|"left"|"right"})` — `white_wool` fill of a panel (axis x: fixed z; axis z: x fixed, run along z), leaving cells listed in `skip` (windows). With a brace: one `spruce_stairs` upside-down (`half: top`) at (first or last x, y0) facing toward the nearest post (back toward the post).
4. `fachwerkWall(g, axis, fixed, a0, a1, y0, y1, posts[], windows[], braced[])` — composes 1–3: posts at `posts`, sill at y0, breast rail at y0+1, head plate at y1, daub between, `windows` = list of [a0,a1,ya,yb] left unset, `braced` = panel indices that get `mannBrace`. Used for the upper storey (y0=6 sill, y1=10 plate), front z=8 (posts 6,8,11,14,16), west x=6 and east x=16 (posts z=8,10,13,15,18,20,22), back z=22.
5. `mannBrace(g, x, y, z, toward)` — one `spruce_stairs`, `half: top`, back toward the post at `toward` (e|w|n|s).
6. `masonryWall(g, axis, fixed, a0, a1, y0, y1, {plinth:true, piers:[...], openings:[...]})` — `deepslate_bricks` courses, `polished_deepslate` plinth at y0, optional pier columns (deepslate_bricks, no change of block but listed), openings left unset.
7. `jettyBracket(g, x, y, z)` — `spruce_stairs` `half: top`, back against the wall (`facing: south` for the front jetty), at (x,y,z).
8. `gableFrame(g, z, {king:true, collar:[x0,x1,y]})` — collar beam `stripped_spruce_wood` axis x at y=14 x=8..14, king post `stripped_spruce_log` (11,11..13,z). Front z=8, back z=22. Leaves the cells in RESERVED unset.

**Openings**
9. `glazedWindow(g, axis, x0, x1, y0, y1, fixed)` — `glass_pane` filling the opening with connection states along the wall axis; reveal: nothing proud.
10. `shopWindow(g, x0, x1)` — front shop window: glazedWindow (x0..x1, y=3..4, z=9) + breast `deepslate_bricks` (x0..x1,2,9) + `counterSlab`.
11. `counterSlab(g, x0, x1, z)` — `spruce_slab` `type: top`, x0..x1 at (y=2, z=8).
12. `shutterPair(g, x, y0, y1, z, faceDir)` — two `spruce_trapdoor`s per row, `open: true`, `facing` = the wall side so they lie flat against the wall (use `mcd states spruce_trapdoor`; render to check they don't stand across the window).
13. `doorAt(g, x, y, z, facing)` — `spruce_door` lower (y) + upper (y+1), `open: false`, hinge left.
14. `frontStep(g)` — `cobbled_deepslate_stairs` (11,1,8) low side to the street; `cobbled_deepslate_slab` bottom (10,1,8),(12,1,8).
15. `flowerBox(g, x0, x1, z)` — `spruce_slab` top at (x0..x1,7,z); `potted_red_tulip` at even x, `potted_poppy` at odd x on y=8.
16. `signArm(g)` — `spruce_fence` (16,7,7),(16,7,6); `spruce_hanging_sign` (16,6,6) `attached: false`, `rotation: 4`, front text "Bäckerei" in the block entity (if the toolkit can't write text, leave blank); hanging `lantern` (16,6,7).
17. `hangingLantern(g, x, y, z)` — `lantern` `hanging: true`, with a `iron_chain` above only if there is headroom to hang from; under the jetty it hangs from the sill beam (y=5 under y=6).
18. `hoistAssembly(g)` — hoist beam `stripped_spruce_log` axis z (11,19,5..8); `iron_chain` axis y (11,18,5),(11,17,5); `barrel` facing up (11,16,5); `spruce_trapdoor` open at (10,15..16,7) and (12,15..16,7), hinged to the gable.

**Roof, oven, chimney**
19. `roofMain(g)` — runs the architect's `$MCD roof --spec` (preset shop, slate, ridge z, front n, gable white_wool, verge spruce, keep = the gable timber cells and loft opening) over footprint [6,8,16,22], eave y=10, then merges the result into the grid.
20. `roofWing(g)` — `roof()` rects [[17,13,21,22]], gable, y=6, ridge z, slate, overhang {west:0,north:1,south:1,east:1}, gable white_wool, ridge cap `deepslate_brick_slab`.
21. `ovenVault(g)` — plinth y=1 `cobbled_deepslate` x=17..21 z=23..26; body y=2..3 `bricks` ring around air x=18..20 z=23..25 (south z=26 wall x=17..21, sides x=17 and x=21, y=2..3; north side is the wing's wall); vault y=4 `brick_stairs` at x=17 (back west) and x=21 (back east), `bricks` x=18..20 z=23..26, y=5 `brick_slab` bottom x=18..20 except chimney cells; inside `campfire` (19,2,24) `lit: true` `facing: north`, `signal_fire: false`.
22. `chimneyStack(g)` — `bricks` x=19..20 z=24..25 y=4..16 with the flue (19,4..16,24) left air; `deepslate_bricks` band at y=12 (flue still air); y=17 ring: `brick_slab` top at (20,17,24),(19,17,25),(20,17,25), `campfire` `lit: true` (19,17,24).

**Yard**
23. `woodpile(g, x0, x1, z0, z1)` — `spruce_log` axis x rows y=1..2 over x=7..10 z=24..25; lid `spruce_slab` bottom y=3 over the stack (type bottom, spans x=7..10).
24. `yardFence(g, runs[])` — `spruce_fence` along the architect's runs (x=1..23 at z=30; x=1 and x=23 z=10..30) with `spruce_fence_gate` at (1,1,20) and (23,1,16) (facing east, `in_wall: false`).
25. `benchRun(g, x0, x1, z)` — `spruce_stairs` `half: bottom` at x=2..4 z=10, back toward the fence/wall side, seat facing north as the architect says; verify by render that you can sit facing the street.
26. `wheatPatch(g, x0,x1,z0,z1)` — `farmland` y=0 `moisture: 7`, `wheat` y=1 `age: 7` (some 5), border `coarse_dirt` ring on y=0.
27. `smallSpruce(g, x, z, h)` — `spruce_log` trunk y=1..h-2, leaf cone of `spruce_leaves` (persistent) layers 3,2,1 wide, tip 1; crowns below y=10 and west of x=5.
28. `propCluster(g, x0, z0)` — x=12..15 z=24..26: `barrel` (12,1,24),(13,1,24), `hay_block` (14,1,24),(14,2,24),(15,1,25), `composter` (12,1,26), `grindstone` (15,1,24) `face: floor`.
29. `scatterBlend(g, x0,x1,z0,z1, base, fleck, ratio)` — fills with `base` and replaces `ratio` (deterministic hash of the cell) with `fleck`; for sidewalk (`cobblestone`, `mossy_cobblestone`, 0.15) and yard (`grass_block` with `podzol`, `coarse_dirt`).

**Furniture (for room designers; each is a small function with its own cells list)**
30. `shopCounter(g, x0, x1, z)` — a row of `spruce_planks` at y=2 (counter body); display `cake` / `candle_cake` on the plank row at y=3 where no slab.
31. `breadRack(g, x, y, z, axis, len)` — a baker's shelf: `stripped_spruce_log` posts at each end (y..y+3), `spruce_trapdoor` open shelves every second layer... keep: two `spruce_planks` end columns plus `spruce_slab` bottoms at y+1 and y+2 between, and `cake` on every other slab cell.
32. `flourStore(g, x, y, z)` — `barrel` (facing up) stack 2 high plus 1 `hay_block` on top = flour sacks.
33. `kneadingTrough(g, x, y, z, len)` — a row of `cauldron` (empty) cells, `spruce_stairs` `half: bottom` along both long sides with the backs outward, `spruce_trapdoor` closed (half top) over one end as the lid.
34. `workTable(g, x, y, z, len)` — `spruce_planks` top row y with `spruce_fence` legs at both ends (y-1) and `crafting_table` at one end; `white_carpet` strip as flour cloth.
35. `peelWall(g, x, y, z, facing)` — baker's tools on a wall: one `spruce_fence` with `spruce_slab` `type: top` on its head (the peel), beside a `grindstone` (face wall) and hanging `spruce_trapdoor` open flat on the wall.
36. `tileStove(g, x, y, z)` — Kachelofen: `bricks` 2x2 y..y+1, `brick_slab` top, `furnace` front `lit: true` facing room, `brick_stairs` cap; one red accent.
37. `tableSet(g, x, y, z)` — table of `spruce_fence` leg + `spruce_slab` top (or `spruce_pressure_plate`), 2 `spruce_stairs` seats facing it.
38. `bedFrame(g, x, y, z, facing)` — `red_bed` (head against wall) with `spruce_trapdoor` closed on the foot, `chest` at the foot.
39. `shelfWall(g, x, y, z, axis, len, h)` — `bookshelf` run h=2 high against a wall; `chiseled_bookshelf` for the top row; `lectern` as a recipe stand.
40. `atticLadder(g)` — `spruce_planks` backing (9,7..10,21); `ladder` `facing: north` at (9,7..11,20).
41. `stairHousing(g)` — the stairs (7..8, y=2..6, z=18..14) `spruce_stairs` `facing: north`, `half: bottom`, with `spruce_planks` filled under each step; `spruce_fence` rails (9,7,14..17) and (7..8,7,18).

## ROOMS
Inside the architect's volumes. Floor blocks y=1 (walk y=2): `spruce_planks`; upper y=6; attic y=11. Mood: scrubbed spruce floors, white daub plaster, dark stone below, red accents.

| room | inner air box [x0,y0,z0,x1,y1,z1] | floor | ways in | windows (architect's) |
|---|---|---|---|---|
| shop (Verkaufsraum) | [7,2,10,15,5,15] | spruce_planks | front door (11,2..3,9); doorway to the bakehouse (16,2..3,15) from x=15; archway to the Backstube (11..12,2..3,16) | shop windows (7..9,3..4,9),(13..15,3..4,9); west (6,3..4,11..12); east (16,3..4,10..11) |
| Backstube | [7,2,17,15,5,21] | spruce_planks | archway (11..12,2..3,16) from the shop; back door (8,2..3,22); stairs up start (7..8,2,18) | west (6,3..4,17..18); back (13..14,3..4,22) |
| bakehouse | [18,2,14,20,7,21] | cobbled_deepslate | doorway (16..17,2..3,15) from x=15 (enters at (18,2,15)); side door (21,2..3,17); oven mouth (19,2..3,22) | north (19,3..4,13); east (21,3..4,15),(21,3..4,20) |
| Stube (living room) | [7,7,9,15,10,13] | spruce_planks | stairs arrive (7..8,7,13) from the stairwell (stairs (7..8,y=2..6,z=18..14)); doorway (11..12,7..8,14) to the bedroom | front (9..10,8..9,8),(12..13,8..9,8); west (6,8..9,11..12); east (16,8..9,11..12) |
| Schlafkammer (bedroom) | [9,7,15,15,10,21] | spruce_planks | doorway (11..12,7..8,14) from the Stube | back (9..10,8..9,22),(12..13,8..9,22); west (6,8..9,16..17); east (16,8..9,16..17) |
| Mehlboden (flour loft) | [9,12,9,13,16,21] (full floor x=7..15; the roof slopes in: check with `mcd room`) | spruce_planks | attic ladder (9,7..11,20) rising through the hole (8..9,11,19..20); a ladder-top landing at (9,12,20) | front attic (9..10,12..13,8),(12..13,12..13,8); loft door (11,15..16,8); back (11,15..16,22) |

Solids inside boxes (keep clear): the stair housing in the shop (x=7..8 z=14..15 solid, y=2..5) and the Backstube (x=7..8 z=17..18: stair y=3 + fill at z=17, stair y=2 at z=18); the stair rails (9,7,14..17) and (7..8,7,18) upstairs; the ladder column x=9 z=20 and backing (9,7..10,21); the hole (7..8,6,14..17) over the stairs.
Partition walls (built by P1): ground z=16 x=9..15 (`stripped_spruce_log` posts at x=9,11?,13,15; `white_wool` daub at y=2..5; archway (11..12,2..3,16) left open); upper z=14 x=9..15 y=7..10 (same, doorway (11..12,7..8,14)). The stair housing is the west end of both.

Entrance: front door (11,2..3,9); the player stands just outside at **(11,2,8)** on the step.

Room briefs for the designers:
- **shop**: the sales floor. Long counter behind which bread racks and a cake display (`cake`, `candle_cake`), a flour-sack and barrel corner, customers' side with a small bench by the west window; lanterns on the rhythm; warm and busy. Keep (11,2..3,10) free in front of the door and the doorway to the wing at (15,2,15).
- **Backstube** (proofing and prep room): work table, kneading trough, bread racks, flour store, peel wall, the stairs up in the SW corner. Lit by hanging lanterns, floury, orderly.
- **bakehouse**: the oven mouth at the south wall (smoker beside, campfire glow in the chamber), a wood stack at the side door, peel wall, flour barrels, a long table; tall roof space above so hang lanterns on chains from rafters; hot, dark-stone, soot.
- **Stube**: the baker's living room; tile stove (brick, one red accent), table set under the front windows, bookshelf and lectern, a rug of carpet; cosy, daub and spruce.
- **Schlafkammer**: a bed under the back window, chest, shelf, rug; keep the stair rail at x=9 z=15..17 and the ladder column; quiet.
- **Mehlboden**: stacked flour barrels, `hay_block` sacks, the stair-step stack up to the loft door (stairs (11,12,12),(11,13,11),(11,14,10) back north, plank deck (11,14,9)) so the door sill y=15 is reachable, lantern on a post.

## PARTS
| # | part | module | what it builds | vocabulary | ticks |
|---|---|---|---|---|---|
| 1 | Massing and shell (alone, Sonnet) | `parts/shell.mjs` | Ground (grass y=0; gravel street z=0..2, kerb z=3, sidewalk z=4..7 via scatterBlend; yard patches). Main ground storey: plinth y=1, deepslate_bricks y=2..5 on z=9, x=6, x=16, z=22 around the interior x=7..15 z=10..21; piers x=6,16; door posts x=10,12 (y=2..4); lintel y=5 (stripped_spruce_wood, all four sides); every opening left unset (see OPENINGS). Floors: y=1 spruce_planks main (x=7..15 z=10..21), cobbled_deepslate wing; y=6 spruce_planks over x=7..15 z=9..21 plus the sill beams, minus the stair hole (7..8,6,14..17); y=11 spruce_planks x=7..15 z=9..21 minus the hole (8..9,11,19..20). Stair housing and attic ladder. Partitions ground z=16 and upper z=14. Upper storey: jetty to z=8, `fachwerkWall` on the four sides (front z=8 posts 6,8,11,14,16; west/east posts z=8,10,13,15,18,20,22; back z=22 posts 6,8,11,14,16), windows left unset; gable frames front z=8 and back z=22 (collar beam, king posts) with the loft door cells unset. Wing walls x=17..21 z=13..22 y=1..5 cobbled_deepslate, corner posts (21,1..5,13),(21,1..5,22), lintels y=5, openings unset. Wing gable end y=6..7 white_wool at z=13 with king post (19,6,13). | `masonryWall`, `fachwerkWall`, `postRun`, `beamRun`, `daubPanel`, `gableFrame`, `stairHousing`, `scatterBlend` | massing, stripped spruce frame, deepslate base, stairs, partitions |
| 2 | Roofs | `parts/roofs.mjs` | Main slate roof and wing roof via the roof tool (with the `keep` cells), gable infill, verges, ridge cap. Reads the keep list from RESERVED. | `roofMain`, `roofWing` | roof, gables, verges |
| 3 | Oven and chimney | `parts/oven.mjs` | Bread oven (plinth, body, chamber, vault), flue, campfire (19,2,24), chimney to y=17 with the y=12 band and the smoking campfire, smoker (18,2,21). | `ovenVault`, `chimneyStack` | oven, chimney, smoke |
| 4 | Front facade dressing | `parts/facade.mjs` | Front door, transom, step, shop windows with counters and shutters, upper windows, flower boxes, jetty brackets, Mann braces, attic windows, loft shutters, hoist assembly, sign, lanterns under the jetty; the glazing for the back and attic panes on the main body. | `doorAt`, `frontStep`, `shopWindow`, `counterSlab`, `shutterPair`, `glazedWindow`, `flowerBox`, `jettyBracket`, `mannBrace`, `hoistAssembly`, `signArm`, `hangingLantern` | door, windows, counters, brackets, flower boxes, hoist, sign |
| 5 | Yard and street furniture | `parts/yard.mjs` | Yard grass/podzol/coarse_dirt, fences and gates, bench, woodpile, wheat patch, two spruces, props, dirt paths to the back and wing doors, street lanterns none. | `yardFence`, `benchRun`, `woodpile`, `wheatPatch`, `smallSpruce`, `propCluster`, `scatterBlend` | yard, woodpile, trees, bench |
| 6 | Sides, back and wing details | `parts/sides.mjs` | West and east faces: glazing, shutters on x=5, Mann braces; back door, back windows; wing north window and vent trapdoor, shutters, side door, wing windows; lanterns by the back door and wing door. | `glazedWindow`, `shutterPair`, `doorAt`, `mannBrace`, `hangingLantern` | side windows, doors, shutters |

Build order: 1, then 2–6 in parallel. Part 4 and 6 only fill cells part 1 left open.

### Checklist
- [x] 1 Shell (massing, floors, stairs, partitions, openings left)
- [x] 2 Roofs
- [x] 3 Oven and chimney
- [x] 4 Front facade dressing
- [x] 5 Yard and street
- [ ] 6 Sides, back, wing details

## NOTES FOR WORKERS
- Add into air only. Part 1 must NOT write the opening cells, the RESERVED cells, the oven chamber/flue, or the chimney.
- Start with `layers()` for facades and furnished rooms; use the helpers for repeats.
- Frame cells belong to part 1; decorating braces (`mannBrace`) go in daub cells part 1 leaves unset: panels at (7,8,8) and (15,8,8) and the side panels listed in the architect's table, so `daubPanel` in part 1 must skip those cells; part 4 and 6 then place the stairs.
- The architect's `jetty brackets` list z=8, y=5; the bracket's back is against the wall at z=9 (facing south).
- Render after every change; judge from the street (`--front n`), check the loft door and hoist, the oven from the yard side, and the roof ridge at y=21.
- Roof overhang at x=5 and z=7 means the roof tool may resize the grid: do `roofMain` with a grid already margined (the lot starts at x=0, so margin exists).
- Run `mcd check`, `mcd walk build.nbt --rooms rooms.json` and `mcd light` before ticking your part.
- Shell (P1): stairHousing runs first so floors skip its cells; stair top step sits in hole cell (7..8,6,14). Brace cells (7,8,8),(15,8,8) and side z=9,14,19,21 at y=8 left unset for P4/P6. Breast (7..9,2,9),(13..15,2,9) left unset for shopWindow. make.sh needs roof.json (Roofs part) before build.nbt is written.

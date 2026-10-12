# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
- [ ] 1 Shell (massing, floors, stairs, partitions, openings left)
- [ ] 2 Roofs
- [ ] 3 Oven and chimney
- [ ] 4 Front facade dressing
- [ ] 5 Yard and street
- [ ] 6 Sides, back, wing details

## NOTES FOR WORKERS
- Add into air only. Part 1 must NOT write the opening cells, the RESERVED cells, the oven chamber/flue, or the chimney.
- Start with `layers()` for facades and furnished rooms; use the helpers for repeats.
- Frame cells belong to part 1; decorating braces (`mannBrace`) go in daub cells part 1 leaves unset: panels at (7,8,8) and (15,8,8) and the side panels listed in the architect's table, so `daubPanel` in part 1 must skip those cells; part 4 and 6 then place the stairs.
- The architect's `jetty brackets` list z=8, y=5; the bracket's back is against the wall at z=9 (facing south).
- Render after every change; judge from the street (`--front n`), check the loft door and hoist, the oven from the yard side, and the roof ridge at y=21.
- Roof overhang at x=5 and z=7 means the roof tool may resize the grid: do `roofMain` with a grid already margined (the lot starts at x=0, so margin exists).
- Run `mcd check`, `mcd walk build.nbt --rooms rooms.json` and `mcd light` before ticking your part.
```

### elements.md

```markdown
# Required elements: Germanic bakery (Bäckerei)

Part modules: P1 `parts/shell.mjs`, P2 `parts/roofs.mjs`, P3 `parts/oven.mjs`, P4 `parts/facade.mjs`, P5 `parts/yard.mjs`, P6 `parts/sides.mjs`.
Vocabulary names are defined in plan.md under VOCABULARY. Coordinates are from the architect's plan.md. Stair `facing` = the side of the full-height back (toolkit convention).

## From the brief

- [ ] **Spruce + deepslate palette only (overworld, forest-local)** — ground storey and wing in `deepslate_bricks` / `polished_deepslate` / `cobbled_deepslate`; every timber in spruce; infill `white_wool`; oven in `bricks`. No exotic blocks. P1, P2, P3. Vocab: all.
- [ ] **Stripped spruce structure** — posts `stripped_spruce_log` axis y; beams, sills, plates, rails, lintels `stripped_spruce_wood` axis along the beam; hoist beam `stripped_spruce_log` axis z. Front: posts x=6,8,11,14,16 y=7..10 z=8; sill y=6 x=6..16 z=8; rail y=7; head plate y=10; lintel y=5 z=9. Sides z-axis equivalents. P1 builds all; P4/P6 add braces. Vocab: `postRun`, `beamRun`, `daubPanel`.
- [ ] **Brick bread oven** — x=17..21, z=23..26. Plinth y=1 `cobbled_deepslate`; body y=2..3 `bricks` around the air chamber x=18..20 z=23..25 (y=2..3); mouth (19,2..3,22) left open; z=26 closed with bricks y=1..4 (y=1 is plinth). Barrel vault: y=4 `brick_stairs` at x=17 (facing west) and x=21 (facing east), `bricks` x=18..20; y=5 `brick_slab` (bottom) x=18..20 except chimney cells. Inside: `campfire` lit (19,2,24) on the chamber floor, `smoker` (18,2,21) beside the mouth in the wing. The mouth is flanked by the wing's own south wall (P1, `cobbled_deepslate`, z=22), so P3 writes nothing at z=22. P3. Vocab: `ovenVault`.
- [ ] **Chimney** — 2x2 `bricks` x=19..20 z=24..25 y=4..17 (y=4..5 are vault cells), a `deepslate_bricks` band course at y=12, top ring y=17: `brick_slab` (top) at (20,17,24),(19,17,25),(20,17,25) and lit `campfire` at (19,17,24) (smoke). Hollow flue: air at (19,5..16,24) so the fire at (19,2,24) draws through (cell (19,4,24) is also air; (19,3,24) is chamber air). P3. Vocab: `chimneyStack`.

## What a viewer expects

- [ ] **Front door, shop front** — `spruce_door` facing north at (11,2..3,9), `glass_pane` transom (11,4,9), posts (10 and 12, y=2..4) `stripped_spruce_log`, stone front step (11,1,8) `cobbled_deepslate_stairs`, slabs (10,1,8),(12,1,8). P1 leaves cells open; P4 fills. Vocab: `shopWindow`, `frontStep`.
- [ ] **Shop windows with counters and shutters** — 3x2 `glass_pane` at (7..9,3..4,9) and (13..15,3..4,9); `deepslate_bricks` breast (7..9,2,9),(13..15,2,9); counter `spruce_slab` (top) (7..9,2,8),(13..15,2,8); shutters `spruce_trapdoor` open flat on z=8 at (6,3..4,8),(16,3..4,8). P4. Vocab: `shopWindow`, `counterSlab`, `shutterPair`.
- [ ] **Jettied half-timber upper storey** — projects to z=8; `spruce_stairs` upside-down brackets (back against the wall, facing south) at x=6,8,11,14,16, y=5, z=8; white_wool daub panels with spruce_stairs "Mann" braces at (7,8,8),(15,8,8); windows 2x2 `glass_pane`. P1 (frame + infill), P4 (brackets, braces, glazing). Vocab: `daubPanel`, `mannBrace`, `jettyBracket`, `glazedWindow`.
- [ ] **Flower boxes** — `spruce_slab` (top) (9..10,7,7),(12..13,7,7) with `potted_red_tulip`/`potted_poppy` alternating at (9,8,7),(10,8,7),(12,8,7),(13,8,7). P4. Vocab: `flowerBox`.
- [ ] **Steep slate roof, timbered gables, verges** — `mcd roof --spec` preset shop/slate, ridge (11,21,7..23); gable timbers kept; wing roof stairs style gable. P2 (roof tool), P1 (gable frame: collar beam y=14 x=8..14, king posts). Vocab: `roofMain`, `roofWing`, `gableFrame`.
- [ ] **Flour-loft hoist beam with chain and barrel** — `stripped_spruce_log` axis z (11,19,5..8), `iron_chain` axis y at (11,18,5),(11,17,5), `barrel` (facing up) at (11,16,5); loft door (11,15..16,8) air, `spruce_trapdoor` open shutters at (10,15..16,7),(12,15..16,7). P4. Vocab: `hoistAssembly`.
- [ ] **Bakery sign** — `spruce_fence` (16,7,7),(16,7,6), `spruce_hanging_sign` at (16,6,6) text "Bäckerei", `lantern` hanging (16,6,7). P4. Vocab: `signArm`.
- [ ] **Lanterns** — hanging under the jetty at (9,5,8),(13,5,8); `lantern` hanging=true; by the wing door and back door (P6); chimney not lit. Vocab: `hangingLantern`.
- [ ] **Bakehouse wing** — `cobbled_deepslate` walls x=17..21 z=13..22 y=1..5, corner post (21,1..5,13), window (19,3..4,13), vent trapdoor (19,7,13), side door (21,2..3,17), windows (21,3..4,15),(21,3..4,20), shutters (18,3..4,12),(20,3..4,12). P1 shell, P6 fill. Vocab: `glazedWindow`, `shutterPair`.
- [ ] **Smoke** — lit campfires (19,17,24) and (19,2,24); `smoker` (18,2,21). P3.
- [ ] **Woodpile (oven fuel)** — `spruce_log` axis x, stacked x=7..10 z=24..25 y=1..2, `spruce_slab` lid y=3. P5. Vocab: `woodpile`.
- [ ] **Yard: fence, gates, bench, wheat patch, props, trees, paths** — see plan. P5. Vocab: `yardFence`, `benchRun`, `wheatPatch`, `smallSpruce`, `propCluster`.
- [ ] **Street + sidewalk** — gravel lane z=0..2, kerb `cobbled_deepslate` z=3, `cobblestone` + 15% `mossy_cobblestone` z=4..7. P1/P5. Vocab: `scatterBlend`.
- [ ] **Interior: shop counter with bread displays, bakery proofing room, bakehouse with kneading trough, living room, bedroom, flour loft** — by the room designers; baked goods shown as `cake` and `candle_cake`, `barrel` flour stores, `hay_block` sacks; ovens `smoker`, `campfire`. Rooms list in plan.md.
```

### rooms.json

```json
{"entrance":[11,2,8],"rooms":[{"name":"shop (Verkaufsraum)","box":[7,2,10,15,5,15]},{"name":"Backstube (prep and proofing room)","box":[7,2,17,15,5,21]},{"name":"bakehouse (Backhaus)","box":[18,2,14,20,7,21]},{"name":"Stube (living room)","box":[7,7,9,15,10,13]},{"name":"Schlafkammer (bedroom)","box":[9,7,15,15,10,21]},{"name":"Mehlboden (flour loft)","box":[9,12,9,13,16,21]}]}
```

### palette.json

```json
{"roles":{"ground_walls":["deepslate_bricks","deepslate_brick_stairs","deepslate_brick_slab","deepslate_brick_wall"],"plinth":["polished_deepslate","polished_deepslate_stairs","polished_deepslate_slab"],"wing_walls":["cobbled_deepslate","cobbled_deepslate_stairs","cobbled_deepslate_slab","cobbled_deepslate_wall"],"frame":["stripped_spruce_log","stripped_spruce_wood","spruce_stairs","spruce_planks","spruce_slab","spruce_fence"],"daub":["white_wool"],"roof":["cobbled_deepslate","deepslate_tiles","polished_deepslate","deepslate_tile_stairs","deepslate_tile_slab","deepslate_bricks","deepslate_brick_stairs","deepslate_brick_slab"],"roof_eave":["spruce_stairs","spruce_slab"],"roof_ridge":["deepslate_brick_slab","deepslate_bricks"],"verge_floor":["spruce_planks","spruce_slab","spruce_stairs"],"oven":["bricks","brick_stairs","brick_slab","brick_wall"],"chimney_band":["deepslate_bricks","deepslate_brick_slab"],"glass":["glass_pane"],"street":["gravel","cobbled_deepslate","cobblestone","mossy_cobblestone"],"yard":["grass_block","podzol","coarse_dirt","dirt_path","farmland","wheat","spruce_log","spruce_leaves"],"shutters_and_flower_boxes":["spruce_trapdoor","spruce_slab","potted_red_tulip","flower_pot"],"yard_enclosure":["spruce_fence","spruce_fence_gate"]},"objects":["spruce_door","spruce_trapdoor","spruce_fence","spruce_fence_gate","spruce_hanging_sign","spruce_wall_sign","lantern","campfire","candle","white_candle","iron_chain","potted_red_tulip","potted_poppy","flower_pot","smoker","blast_furnace","furnace","barrel","hay_block","composter","grindstone","cauldron","water_cauldron","loom","chest","lectern","crafting_table","bookshelf","chiseled_bookshelf","decorated_pot","cake","candle_cake","ladder","white_bed","red_bed","white_carpet","red_carpet","brown_carpet","red_wool","brown_wool","wheat","spruce_log","spruce_leaves"]}
```

### make.sh

```sh
#!/usr/bin/env bash
# The one command that makes build.nbt from scratch: node build.mjs writes every part in plan order to a temp file,
# the temp file must read back as a structure, then it moves into place. Stubs yield the bare ground plus the roof.
set -euo pipefail
cd "$(dirname "$0")"

MCD_JS=/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs
TMP=build.tmp.nbt
trap 'rm -f "$TMP"' EXIT

node build.mjs "$TMP"
node "$MCD_JS" info "$TMP" > /dev/null
mv "$TMP" build.nbt
echo "build.nbt written"
```

### build.mjs

```js
// Builds the Bäckerei from its parts: the ground, then every part in plan order. runParts lets each part only ADD into
// air (writes into an earlier part's cells are refused and reported) and reports off-palette blocks per part. The roof
// (roof.json) is laid right after the shell. A part whose file does not exist yet is skipped, so a build never fails
// because another part is still being written.
// Usage: node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE, GROUND_Y } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(2);
}

// The parts, in plan order: [report name, module].
const PARTS = [
  ["P1 shell", "parts/shell.mjs"],
  ["P2 roofs", "parts/roofs.mjs"],
  ["P3 oven and chimney", "parts/oven.mjs"],
  ["P4 front facade", "parts/facade.mjs"],
  ["P5 yard and street", "parts/yard.mjs"],
  ["P6 sides, back and wing", "parts/sides.mjs"],
  ["room 1 shop", "parts/room-1.mjs"],
  ["room 2 Backstube", "parts/room-2.mjs"],
  ["room 3 bakehouse", "parts/room-3.mjs"],
  ["room 4 Stube", "parts/room-4.mjs"],
  ["room 5 Schlafkammer", "parts/room-5.mjs"],
  ["room 6 Mehlboden", "parts/room-6.mjs"],
];

const list = [];
for (const [name, file] of PARTS) {
  const url = new URL(file, import.meta.url);
  if (!existsSync(url)) {
    console.warn(`${name}: ${file} not written yet, skipped`);
    list.push([name, () => {}]);
    continue;
  }
  list.push([name, (await import(url.href)).build]);
}

// The ground: grass_block at y0 across the whole lot. Every part's street, sidewalk, yard and foundation is written over it.
const ground = () => {
  const g = new Grid(SITE.size);
  g.fill([SITE.lot.x0, GROUND_Y, SITE.lot.z0], [SITE.lot.x1, GROUND_Y, SITE.lot.z1], "grass_block");
  return g;
};
const palette = fileURLToPath(new URL("./palette.json", import.meta.url));
const roof = fileURLToPath(new URL("./roof.json", import.meta.url));

// The roof sits on walls, so it is laid only once the shell has written some (a stub shell leaves the bare ground,
// and the roof tool would find no walls to sit on).
const probe = ground();
runParts(probe, [list[0]], { palette, report: null, log: () => {} });
const shellBuilt = [...probe].some((c) => c.pos[1] > GROUND_Y);

const g = ground();
runParts(g, list, { palette, roof: shellBuilt ? roof : undefined });

g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Constants for the Bäckerei build: palette ids (palette.json, one per export), plan.md's site coordinates, and a
// seeded rng. Coordinates are inclusive corner-origin cells (x east, y up, z south; the front faces north, -z).

// ---- palette: every id in palette.json, named (the role(s) it is used for follow the comment) ----------------------

// ---- palette: every id in palette.json, named (the role(s) it is used for follow the comment) ----------------------
export const BARREL = "barrel"; // object

export const BLAST_FURNACE = "blast_furnace"; // object

export const BOOKSHELF = "bookshelf"; // object

export const BRICK_SLAB = "brick_slab"; // oven

export const BRICK_STAIRS = "brick_stairs"; // oven

export const BRICK_WALL = "brick_wall"; // oven

export const BRICKS = "bricks"; // oven

export const BROWN_CARPET = "brown_carpet"; // object

export const BROWN_WOOL = "brown_wool"; // object

export const CAKE = "cake"; // object

export const CAMPFIRE = "campfire"; // object

export const CANDLE = "candle"; // object

export const CANDLE_CAKE = "candle_cake"; // object

export const CAULDRON = "cauldron"; // object

export const CHEST = "chest"; // object

export const CHISELED_BOOKSHELF = "chiseled_bookshelf"; // object

export const COARSE_DIRT = "coarse_dirt"; // yard

export const COBBLED_DEEPSLATE = "cobbled_deepslate"; // wing_walls, roof, street

export const COBBLED_DEEPSLATE_SLAB = "cobbled_deepslate_slab"; // wing_walls

export const COBBLED_DEEPSLATE_STAIRS = "cobbled_deepslate_stairs"; // wing_walls

export const COBBLED_DEEPSLATE_WALL = "cobbled_deepslate_wall"; // wing_walls

export const COBBLESTONE = "cobblestone"; // street

export const COMPOSTER = "composter"; // object

export const CRAFTING_TABLE = "crafting_table"; // object

export const DECORATED_POT = "decorated_pot"; // object

export const DEEPSLATE_BRICK_SLAB = "deepslate_brick_slab"; // ground_walls, roof, roof_ridge, chimney_band

export const DEEPSLATE_BRICK_STAIRS = "deepslate_brick_stairs"; // ground_walls, roof

export const DEEPSLATE_BRICK_WALL = "deepslate_brick_wall"; // ground_walls

export const DEEPSLATE_BRICKS = "deepslate_bricks"; // ground_walls, roof, roof_ridge, chimney_band

export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab"; // roof

export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs"; // roof

export const DEEPSLATE_TILES = "deepslate_tiles"; // roof

export const DIRT_PATH = "dirt_path"; // yard

export const FARMLAND = "farmland"; // yard

export const FLOWER_POT = "flower_pot"; // shutters_and_flower_boxes

export const FURNACE = "furnace"; // object

export const GLASS_PANE = "glass_pane"; // glass

export const GRASS_BLOCK = "grass_block"; // yard

export const GRAVEL = "gravel"; // street

export const GRINDSTONE = "grindstone"; // object

export const HAY_BLOCK = "hay_block"; // object

export const IRON_CHAIN = "iron_chain"; // object

export const LADDER = "ladder"; // object

export const LANTERN = "lantern"; // object

export const LECTERN = "lectern"; // object

export const LOOM = "loom"; // object

export const MOSSY_COBBLESTONE = "mossy_cobblestone"; // street

export const PODZOL = "podzol"; // yard

export const POLISHED_BLACKSTONE_BRICK_SLAB = "polished_blackstone_brick_slab"; // roof_eave

export const POLISHED_BLACKSTONE_BRICK_STAIRS = "polished_blackstone_brick_stairs"; // roof_eave

export const POLISHED_BLACKSTONE_BRICKS = "polished_blackstone_bricks"; // roof_eave

export const POLISHED_DEEPSLATE = "polished_deepslate"; // plinth, roof

export const POLISHED_DEEPSLATE_SLAB = "polished_deepslate_slab"; // plinth

export const POLISHED_DEEPSLATE_STAIRS = "polished_deepslate_stairs"; // plinth

export const POTTED_POPPY = "potted_poppy"; // object

export const POTTED_RED_TULIP = "potted_red_tulip"; // shutters_and_flower_boxes

export const RED_BED = "red_bed"; // object

export const RED_CARPET = "red_carpet"; // object

export const RED_WOOL = "red_wool"; // object

export const SMOKER = "smoker"; // object

export const SPRUCE_DOOR = "spruce_door"; // object

export const SPRUCE_FENCE = "spruce_fence"; // frame, yard_enclosure

export const SPRUCE_FENCE_GATE = "spruce_fence_gate"; // yard_enclosure

export const SPRUCE_HANGING_SIGN = "spruce_hanging_sign"; // object

export const SPRUCE_LEAVES = "spruce_leaves"; // yard

export const SPRUCE_LOG = "spruce_log"; // yard

export const SPRUCE_PLANKS = "spruce_planks"; // frame, verge_floor

export const SPRUCE_SLAB = "spruce_slab"; // frame, roof_eave, verge_floor, shutters_and_flower_boxes

export const SPRUCE_STAIRS = "spruce_stairs"; // frame, roof_eave, verge_floor

export const SPRUCE_TRAPDOOR = "spruce_trapdoor"; // shutters_and_flower_boxes

export const SPRUCE_WALL_SIGN = "spruce_wall_sign"; // object

export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log"; // frame

export const STRIPPED_SPRUCE_WOOD = "stripped_spruce_wood"; // frame

export const WATER_CAULDRON = "water_cauldron"; // object

export const WHEAT = "wheat"; // yard

export const WHITE_BED = "white_bed"; // object

export const WHITE_CANDLE = "white_candle"; // object

export const WHITE_CARPET = "white_carpet"; // object

export const WHITE_WOOL = "white_wool"; // daub

// ---- site (plan.md SITE): lot x 0..23, z 0..31, height to y=24; the grid is 24 x 25 x 32 ----------------------------
export const SITE = { size: [24, 25, 32], lot: { x0: 0, z0: 0, x1: 23, z1: 31 } };   // the grid and the lot it sits on

export const STREET_Z = 2;               // last gravel row of the street lane (z 0..2); kerb of cobbled_deepslate at z=3

export const SIDEWALK = { z0: 4, z1: 7 };  // cobblestone sidewalk rows in front of the building

export const GROUND_Y = 0;               // the grass ground block; street, kerb and sidewalk sit on it

export const FLOOR_Y = 1;                // ground-storey floor block and the plinth course; walk y = 2 inside

export const UPPER_FLOOR_Y = 6;          // upper-storey floor and the jetty sill course; walk y = 7

export const ATTIC_FLOOR_Y = 11;         // attic floor (flour loft); walk y = 12

export const EAVE_Y = 10;                // head of the upper walls (head plate); the main roof starts at ROOF_Y

export const ROOF_Y = 11;                // eave course of the main roof (wall top + 1)

export const RIDGE_Y = 21;               // main roof ridge along z at x=11

export const WING_ROOF_Y = 6;            // eave course of the wing roof (ridge along z at x=19, y=8)

export const CHIMNEY_TOP_Y = 17;         // top course of the chimney; the smoking campfire sits at (19,17,24)

export const MAIN = { x0: 6, x1: 16, z0: 9, z1: 22 };      // main body ground storey footprint (plinth to z=9)

export const JETTY_Z = 8;                // front plane of the upper storey (projects 1 north over the shop front)

export const FRONT_DOOR = { x: 11, y0: 2, y1: 3, z: 9 };   // front door cells (step at (11,1,8))

export const WING = { x0: 17, x1: 21, z0: 13, z1: 22 };    // bakehouse wing (single storey, gable to the street)

export const OVEN = { x0: 17, x1: 21, z0: 23, z1: 26 };    // bread oven footprint (projects south of the wing)

export const OVEN_CHAMBER = { x0: 18, x1: 20, z0: 23, z1: 25, y0: 2, y1: 3 };   // inside air of the oven

export const OVEN_MOUTH = { x0: 19, x1: 19, z0: 22, z1: 22, y0: 2, y1: 3 };     // opening from the wing into the oven

export const CHIMNEY = { x0: 19, x1: 20, z0: 24, z1: 25, y0: 4, y1: 17 };       // chimney stack; flue (19,4..16,24) is air

export const HOIST = { x: 11, y: 19, z0: 5, z1: 8 };       // hoist beam (stripped_spruce_log axis z), chain and barrel below

export const LOFT_DOOR = { x: 11, y0: 15, y1: 16, z: 8 };  // open loft door in the front gable (air)

export const STAIR_HOLE = { x0: 7, x1: 8, y: 6, z0: 14, z1: 17 };    // stairwell hole in the upper floor

export const ATTIC_HOLE = { x0: 8, x1: 9, y: 11, z0: 19, z1: 20 };   // attic ladder hole in the flour loft floor

// ---- the six rooms' inner air boxes [x0,y0,z0,x1,y1,z1] (rooms.json; each room's designer fills its box) --------------
export const ROOM_BOX = {
  shop: [7, 2, 10, 15, 5, 15],           // Verkaufsraum, the sales floor behind the shop windows
  backstube: [7, 2, 17, 15, 5, 21],      // prep and proofing room; stairs up start in its SW corner
  bakehouse: [18, 2, 14, 20, 7, 21],     // single-storey wing open to the rafters; oven mouth on its south wall
  stube: [7, 7, 9, 15, 10, 13],          // living room over the street
  schlafkammer: [9, 7, 15, 15, 10, 21],  // bedroom at the back
  mehlboden: [9, 12, 9, 13, 16, 21],     // flour loft under the slate roof
};

// ---- rng: a seeded, deterministic [0,1) generator (mulberry32), so a rebuild is byte-identical ---------------------
export function rng(seed)
```

### vocab/h1.mjs

```js
// Helpers from plan.md VOCABULARY (h1 share): beams, braces, windows, doors, lights, the oven vault, benches, ground
// blend, the trough, the table set and the stair housing. Each takes its position (and facing) as arguments and returns
// the cells it wrote as [x, y, z]. Writes go only into air (g.isAir) unless opts.overwrite is true; a refused cell is
// skipped, not thrown. Nothing is written below a helper's own footprint, so no ground, sand or floor is touched.
// Facings take n|s|e|w or the full names. Stair `facing` is the side of the full-height back (build.mjs B.stairs).

// Horizontal `stripped_spruce_wood` run. axis x: a0..a1 along x at z = fixed; axis z: along z at x = fixed. y is the height.
export function beamRun(g, axis, a0, a1, fixed, y, opts = {})

// One upside-down spruce stair braced toward the post at `toward` (its full-height back faces that way).
export function mannBrace(g, x, y, z, toward, opts = {})

// Glass pane filling the opening x0..x1 (axis x wall at z = fixed) or z0..z1 (axis z wall at x = fixed), y0..y1.
// Panes connect along the wall axis only; nothing is set proud of the wall.
export function glazedWindow(g, axis, x0, x1, y0, y1, fixed, opts = {})

// Spruce door, both halves (lower at y, upper at y+1), hinge left, closed. Writes both or neither.
export function doorAt(g, x, y, z, facing, opts = {})

// Hanging lantern at (x, y, z). It hangs from the block above; if that is air but the block two up is solid, one iron
// chain is hung from it at y+1. With neither, nothing is written and [] comes back.
export function hangingLantern(g, x, y, z, opts = {})

// Brick bread oven, footprint x..x+4 by z..z+3, plinth at y. Plinth y, body walls y+1..y+2 (south row and both sides;
// the north side is the wing wall, so the mouth is open there), vault y+3 (bricks, brick stairs at the edges facing out),
// brick slab y+4 over the chamber. The chamber air x+1..x+3, z..z+2 (y+1..y+2) holds a lit campfire at (x+2, y+1, z+1).
// The chimney footprint (x+2..x+3, z+1..z+2) at y+3..y+4 is left for chimneyStack. Only facing north is laid out.
export function ovenVault(g, x, y, z, facing = "north", opts = {})

// Bench of spruce stairs (bottom half) along x0..x1 at (y, z). `facing` is the way the sitter looks; the stairs' back
// (facing) is the opposite side, so the seat faces that way.
export function benchRun(g, x0, x1, z, y, facing = "north", opts = {})

// Fill x0..x1 by z0..z1 at height y with `base`, replacing `ratio` of the cells (a deterministic hash of x,z) with `fleck`.
// This writes ground, so it may replace the lot's grass_block (or opts.replaces, a list of block names) as well as air.
export function scatterBlend(g, x0, x1, y, z0, z1, base, fleck, ratio, opts = {})

// Kneading trough along x: `len` empty cauldrons at (x.., y, z), a spruce stair seat on each long side (backs outward),
// and a closed spruce trapdoor (half top) as the lid over the first cell at y+1.
export function kneadingTrough(g, x, y, z, len, opts = {})

// Table at (x, y, z): a spruce fence leg, a spruce slab top at y+1, and a spruce stair seat on each side (x-1 looks east,
// x+1 looks west; the stairs' backs face outward).
export function tableSet(g, x, y, z, opts = {})

// Stair housing: `steps` spruce stairs, two cells wide (x, x+1), rising north from (x, y, z) with one step per row.
// Under each step, spruce planks fill up to the step below it. The stairwell rail sits at height y+steps: along x+2 for
// the rows above the last step, and across the top at z (cells x..x+1).
export function stairHousing(g, x, y, z, steps, opts = {})
```

### vocab/h2.mjs

```js
// Vocabulary helpers, set 2 (plan.md VOCABULARY): frame, openings, oven chimney, yard and furniture.
// Every helper takes the grid (or runParts view) first, then its position and facing as arguments: nothing is
// hard-wired to a spot. It writes only into AIR (an earlier part owns every other cell, the ground included) and
// returns the [x, y, z] cells it wrote. Exceptions are named options (wheatPatch ground). Coordinates: x east,
// y up, z south; the street is at z < 0, so "south" faces the building from the street.
// Furniture footprints sit inside the room boxes of plan.md ROOMS; the caller keeps the 2-high lane past them clear.

/** Vertical stripped spruce post at (x, y0..y1, z), axis y. */
export function postRun(g, x, y0, y1, z)

/**
 * Deepslate wall, a run from a0 to a1 along `axis` (x: the wall lies along x at z = fixed; z: at x = fixed), y0..y1.
 * plinth: the row y0 is polished_deepslate, the rest deepslate_bricks. piers: positions along the wall that stay
 * solid even inside an opening. openings: [a0, a1, ya, yb] boxes left unset (air) for windows and doors.
 */
export function masonryWall(g, axis, fixed, a0, a1, y0, y1, { plinth = true, piers = [], openings = [] } = {})

/**
 * Shop window on a front wall at z, x0..x1: the breast row at y (deepslate_bricks), glass two rows above it
 * (y+1..y+2) with the connections running along the wall, and a spruce_slab counter on the street side (z-1) at y.
 */
export function shopWindow(g, x0, x1, y, z)

/**
 * The front step at (x, y, z): cobbled_deepslate_stairs with `facing` = the side of its full-height back (pass
 * "south" for a front on the north: the low side points at the street), and bottom slabs on both sides of it, along the wall.
 */
export function frontStep(g, x, y, z, facing)

/**
 * Flour-loft hoist on the front gable: beam at (x, y, zWall-3..zWall) along z; iron chain under its far end, a barrel
 * (facing up) hung from the chain, and two shutters (x±1, y-4..y-3, at zWall-1) open flat against the gable wall.
 */
export function hoistAssembly(g, x, y, zWall)

/**
 * A 2x2 brick chimney on the columns x0..x0+1, z0..z0+1, from y0 up to the top ring at y1. The corner (x0, z0) is the
 * flue, left air below the top; the course at `band` is deepslate_bricks; the top ring is brick_slab (top) round
 * a lit campfire in the flue's mouth (x0, y1, z0).
 */
export function chimneyStack(g, x0, z0, y0, y1, band)

/**
 * A wheat patch over x0..x1, z0..z1 at ground row y: coarse_dirt edge ring, farmland (moisture 7) inside, wheat
 * above it (age 7, every fourth cell 5). The ground row is grass from part 1, so by default nothing is written there
 * and no wheat is placed without its farmland. { ground: true } lets the patch replace the ground row (the yard's own).
 */
export function wheatPatch(g, x0, x1, z0, z1, { ground = false, y = 0 } = {})

/**
 * Shop counter along x0..x1 at (y, z): a row of spruce_planks (the body) with a cake on every other cell and a
 * candle_cake between, on the planks at y+1. Shop room: [7,2,10,15,5,15]; counter at y=2, z=14.
 */
export function shopCounter(g, x0, x1, y, z)

/**
 * A baker's work table along x, x..x+len-1 at (y, z): spruce_planks top row at y, a crafting_table on the west end
 * at y+1, and a white_carpet flour cloth on the middle cells at y+1. Backstube room: [7,2,17,15,5,21]; y=2.
 */
export function workTable(g, x, y, z, len)

/**
 * A bed with its head at (x, y, z) against the wall it faces; `facing` points from the foot to the head (vanilla),
 * so pass the wall's side. Foot one cell away from the wall, chest one further out at the foot. Bedroom:
 * [9,7,15,15,10,21]; y=7 (walk level). The closed trapdoor of the plan has no free cell at the foot and is not placed.
 */
export function bedFrame(g, x, y, z, facing)
```

### vocab/h3.mjs

```js
// Vocabulary helpers (plan.md VOCABULARY 3, 7, 11, 15, 19, 23, 27, 31, 35, 39): daubPanel, jettyBracket, counterSlab,
// flowerBox, roofMain, woodpile, smallSpruce, breadRack, peelWall, shelfWall.
// Every helper takes its own position and facing, writes only into air (a cell an earlier part built is left alone),
// and returns the [x, y, z] cells it wrote. Blocks come from plan.md's PALETTE.

/**
 * A white_wool panel. axis "x": the panel runs along x from a0 to a1 at z = fixed; axis "z": it runs along z at x = fixed.
 * Rows y0..y1. brace "left" / "right": one upside-down spruce_stairs at the bottom row of that end, its back to the post
 * beyond the panel. skip: [x, y, z] cells left open (windows).
 */
export function daubPanel(g, axis, a0, a1, y0, y1, fixed, { brace = null, skip = [] } = {})

/** A jetty bracket: upside-down spruce_stairs at (x, y, z), its back against the wall on the `facing` side. */
export function jettyBracket(g, x, y, z, facing = "south")

/** A counter: top spruce_slabs along x0..x1 at (y, z). y defaults to 2 (plan: counter height). */
export function counterSlab(g, x0, x1, z, y = 2)

/** A flower box: top spruce_slabs at x0..x1 on row y (default 7), a pot on each cell above: tulip on even x, poppy on odd. */
export function flowerBox(g, x0, x1, z, y = 7)

/**
 * The main slate roof through the roof tool, laid in memory. spec is a roof.json object (preset, material, ridgeAxis,
 * front, gable, verge, keep, ...) with footprint [x0, z0, x1, z1] (or a list of those) and y = the eave course. The eaves
 * reach out past the footprint (2 cells on the shop preset). Only air is written: every built cell is protected, so keep
 * boxes and the walls stay as they are. Fascia and soffit default to spruce (the tool's default is birch, off the palette).
 */
export function roofMain(g, spec)

/** Firewood: spruce_log rows along x at y0..y0+1 over x0..x1, z0..z1 (y0 = the bottom row, default 1, the walking surface), a bottom spruce_slab lid at y0+2. */
export function woodpile(g, x0, x1, z0, z1, y0 = 1)

/**
 * A small spruce on the walking surface y0 (default 1). h is the absolute top: trunk y0..h-2, a 3x3 ring of leaves at
 * h-4 (trunk centre left as log), a plus of leaves at h-3, a tip leaf at h-1. Leaves are persistent (as terrain.mjs).
 */
export function smallSpruce(g, x, z, h, y0 = 1)

/**
 * A baker's rack: spruce_planks end columns at y..y+3 at both ends of len cells (run along axis from x or z), a top
 * spruce_slab deck at y+1 (it carries the cakes: cake needs a full top face) and bottom spruce_slabs at y+2 with a cake on
 * every other cell. Footprint: 1 deep, 4 high, len wide.
 */
export function breadRack(g, x, y, z, axis, len)

/**
 * Baker's tools on a wall. facing = the direction of the wall from the cell (the back of the tools). Along the wall, at the
 * row beside it: a spruce_fence post at (x, y, z) with a top spruce_slab on its head (the peel); a grindstone on the wall at
 * +1 along the wall, face wall, facing out from the wall; an open spruce_trapdoor flat on the wall at +2, one row up.
 */
export function peelWall(g, x, y, z, facing)

/**
 * A bookshelf run of len cells from (x, y, z) along axis, h rows high against a wall. The top row is chiseled_bookshelf,
 * facing `front` (default: south for axis x, east for axis z, i.e. the room side of a wall on the north or west). A lectern
 * stands on the floor row in front of the run's first cell, facing front.
 */
export function shelfWall(g, x, y, z, axis, len, h, { front } = {})
```

### vocab/h4.mjs

```js
// Vocabulary helpers, batch h4 (plan.md VOCABULARY). Each takes its position (and facing) as arguments and writes only
// into air inside its own footprint, so it never overwrites an earlier part. Each returns the cells it wrote, [x, y, z].

/**
 * A half-timber wall: posts, sill (y0), breast rail (y0+1), head plate (y1) and white daub between the posts.
 * axis "x": the wall runs along x at z = fixed; axis "z": along z at x = fixed. a0..a1 are the wall ends (use posts there).
 * windows: [a0, a1, ya, yb] boxes left unset. braced: post-to-post panel indices (from the low end) that get a Mann brace.
 */
export function fachwerkWall(g, axis, fixed, a0, a1, y0, y1, posts, windows = [], braced = [])

/**
 * A gable frame in the plane z: a collar beam (stripped spruce, axis x) at y = collar[2] from collar[0] to collar[1],
 * and a king post under its middle (three cells, y-3..y-1). skip: "x,y,z" strings left unset (e.g. the reserved cells).
 */
export function gableFrame(g, z, { king = true, collar = [8, 14, 14], skip = [] } = {})

/**
 * Open trapdoors lying flat on a wall: one per row (y0..y1) at column x, facing faceDir (the wall side).
 * second: a second column, for two per row (one leaf each side of a window).
 */
export function shutterPair(g, x, y0, y1, z, faceDir, { second } = {})

/**
 * A sign arm on the street side: spruce fences at (x,y,z) and (x,y,z-1), a hanging sign under the second one at y-1, and a
 * hanging lantern under the first (it hangs from the fence above). rotation: the sign's standing direction (4 = west).
 */
export function signArm(g, x, y, z, { text = "Bäckerei", rotation = 4 } = {})

/**
 * The wing roof: a gable over one rect (its wall footprint) with its eave at course y, ridge along z, slate, white gable
 * ends and a deepslate brick ridge cap. overhang: per side. Writes only into air (every existing block is protected).
 */
export function roofWing(g, rect = [17, 13, 21, 22], y = 6, overhang = { west: 0, north: 1, south: 1, east: 1 })

/**
 * Yard fence along straight runs [x0, z0, x1, z1] at height y, with gates [[x, z, facing]] in the runs (a gate's cell is
 * not fenced). Each fence cell's connections follow its neighbours: fence, gate line, or an existing fence.
 */
export function yardFence(g, runs, { y = 1, gates = [] } = {})

/** A yard prop group, 4 x 3 from (x0, z0) at height y: two barrels, a hay stack, a composter and a grindstone. */
export function propCluster(g, x0, z0, y = 1)

/** Flour sacks: two barrels stacked (facing up) with a hay bale on top. One cell wide, three high, from (x, y, z). */
export function flourStore(g, x, y, z)

/**
 * A tile stove (Kachelofen): a 2x2 brick body two high from (x, y, z), a lit furnace firebox in the front bottom cell,
 * and a cap course on top: brick stairs on the front (the lip toward the room) and brick slabs at the back.
 * facing: the side the front faces, which is the room (north, south, east, west).
 */
export function tileStove(g, x, y, z, facing = "north")

/**
 * An attic ladder from (x, y0) to (x, y1) at z, facing facing: the ladder hangs against a backing of spruce planks on the
 * far side (y0..y1-1). Plan: atticLadder(g, 9, 7, 11, 20) gives ladder (9,7..11,20) facing north, backing (9,7..10,21).
 */
export function atticLadder(g, x, y0, y1, z, facing = "north")
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

# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# US Capitol — architect's plan (plot 0)

All coordinates are plot-local: x 0..35 (west to east, the Mall is at low x), z 0..95 (north to south), y 0 = lowest ground.
World = local + (1195, 0, 636). The building is symmetric about z = 47.5 (Senate north, House south), so every
mirrored pair below obeys z ↔ 95 − z. The dome's axis is the line x = 20.0, z = 48.0 in continuous coordinates
(between cells 19|20 and 47|48), so every round course has an EVEN diameter d: cells x 20−d/2 .. 19+d/2, z 48−d/2 .. 47+d/2,
kept where (x+0.5−20)² + (z+0.5−48)² ≤ (d/2)².

## SITE

- Lot: 36 × 96, height cap y 45. Ground slopes up from west (0) to east (2): ground value g = the first course you
  build on. Every mass rests on its podium, and every podium goes down to g (fewer basement courses visible on the
  east side, five on the west). Nothing floats, nothing is buried.
- Front: this building's PRINCIPAL view is its WEST FRONT (x low, facing the Mall and the camera); the ceremonial
  East Front faces high x. (The generic "front faces north" does not apply: site orientation rules.) No street; the
  grounds kit builds the terraces west of x 0 and the plaza east of x 35.
- Levels (all masses): rusticated basement/podium y g..4 · main floor y 5 · principal storey y 5..8 · upper storey
  y 9..10 · entablature y 11 · balustrade y 12 · roof decks at y 12 (bottom slabs).

| mass | x | y | z | notes |
|---|---|---|---|---|
| Senate wing (north) | 3..34 | g..12 | 2..18 | walls: west x5 (behind loggia), east x33, north z2, south z18 |
| Senate west podium strip | 2 | g..4 | 4..16 | arcaded basement in front of the west colonnade |
| Senate west loggia | 3..4 | 5..11 | 3..17 | columns on x3, open loggia x4, roofed by the entablature y11 |
| Senate east portico | 34..35 | g..14 | 6..14 | podium g..4, columns on x35 y5..10, pediment y11..14 |
| Senate north terrace | 10..25 | g..g+1 | 0..1 | low balustraded plinth (bottom-slab top), lamp line |
| North connector | 15..27 | g..12 | 19..25 | same courses as wings, walls west x15, east x27 |
| Central block | 10..29 | g..12 | 26..69 | walls west x10, east x29, north z26, south z69 |
| Central rotunda bay, east antae | 30..31 | g..12 | 37..40 and 55..58 | wall blocks flanking the East Portico |
| East Portico | 30..32 | g..15 | 41..54 | podium g..4, double row of columns x30 and x32, pediment y11..15 |
| West Front podium (arcade block) | 0..9 | 0..4 | 41..54 | solid podium, arcaded face x0; its top is the upper west terrace |
| West Front loggia | 8..9 | 5..12 | 41..54 | columns on x8, open x9, against the central west wall x10 |
| Inaugural west steps N / S | 1..9 | 0..5 | 37..40 / 55..58 | two flights + landings, rising east (see OPENINGS) |
| Small copper cupolas N / S | 18..21 | 12..15 | 29..32 / 63..66 | over the old chambers (the teal domes of the photo) |
| Dome: square base | 11..28 | 12..14 | 39..56 | 18 × 18 block on the central roof, top course y14 |
| Dome: peristyle | d16 (12..27) | 15..20 | d16 (40..55) | ring of columns on the d16 ring; drum wall on the d12 ring |
| Dome: entablature + balustrade | d16 | 21..22 | d16 | full d16 disc at y21, balustrade on the d16 ring at y22 |
| Dome: attic storey | d14 (13..26) | 22..25 | d14 (41..54) | ring wall y22..24, cornice disc y25 |
| Dome: ribbed shell | d12→d4 | 26..33 | | y26 d12, y27 d12, y28 d12, y29 d10, y30 d10, y31 d8, y32 d6, y33 d4 |
| Lantern (tholos) | d4 (18..21) | 34..37 | d4 (46..49) | ring posts y34..35, cap y36 (d4) and y37 (d2) |
| Statue of Freedom | 19 | 38..41 | 47 | pedestal y38, dark bronze figure y39..41 (top y41 = 39 over the east ground) |

House wing (south) mirrors the Senate wing exactly: body x3..34 z77..93 (walls north z77, south z93), podium strip x2
z79..91, loggia x3..4 z78..92, east portico x34..35 z81..89, south terrace x10..25 z94..95. South connector x15..27
z70..76.

## ROOFS

No pitched preset roofs: every roof hides behind a balustrade, as on the real building. All by hand (no `$MCD roof`
preset fits a balustraded neoclassical deck and a cast-iron bell dome; `--style dome` cannot make a bell profile).

| roof | form | height | notes |
|---|---|---|---|
| Wings, connectors, central block | flat deck of `smooth_stone_slab` (bottom) at y12, inside the balustrade | y12 | spawn-proof; grey reads as the real low lead/grey roofs |
| Wing chamber skylights | raised curb y12 `polished_andesite`, glass y13, lit from below at y11 | y12..13 | Senate x13..25 z6..14; House x13..25 z81..89 |
| Wing east pediments | low temple gable, 1 up per 2 across, smooth quartz | y11 cornice, y12 z6..14, y13 z8..12, y14 z10 | House: y12 z81..89, y13 z83..87, y14 z85; ridge runs x34→35; triangle faces east |
| East Portico pediment | same pitch | y11 cornice x29..32 z41..54, y12 z41..54, y13 z43..52, y14 z45..50, y15 z47..48 | ridge along x at z47..48; raking edges `smooth_quartz_stairs`, tympanum `smooth_quartz` with a `chiseled_quartz_block` centre at x32 y13 z47..48 |
| Cupolas N / S | 4 × 4 drum y12..13 (calcite, a dark window centred on each face), copper cap: y14 `oxidized_cut_copper_stairs` ring facing out, y15 `oxidized_cut_copper_slab` 2 × 2 | to y15 | the photo's teal accents |
| Dome shell | bell: course diameters as in SITE; on each course the cells that the next course steps in from are `smooth_quartz_stairs` facing outward (upright), so the profile curves | y26..33 | y33 d4 is a flat `smooth_quartz_slab`-topped ring carrying the lantern |
| Dome ribs | the cells of the shell on the lines x 19|20, z 47|48 and the two diagonals: `polished_diorite` (+ `polished_diorite_stairs` at the stepped edges) | y26..33 | 8 ribs, light grey on white |
| Lantern cap | y36 d4: the outer 8 cells `smooth_quartz_stairs` facing out, the core `smooth_quartz`; y37 d2 `smooth_quartz` | y36..37 | |

## FACADES

Hierarchy, every face: rusticated basement (`quartz_bricks`) → main floor line y5 (a `smooth_quartz_slab` course
proud 1 on the west faces, as a sill band) → principal storey with tall windows → upper storey with short windows →
entablature y11 (`smooth_quartz`, with a `smooth_quartz_slab` (top) cornice proud 1 at y11 outside the wall line
wherever the cell is free) → balustrade y12 (`diorite_wall` on the outer wall line, `smooth_quartz` posts at every
corner and every 6th cell). Pilasters: `quartz_pillar` (axis y) in the wall face y5..10, flush, between the window
bays. Corners: `quartz_pillar` pier full height y5..10 at every outer corner.

| face | base | storeys | ornament |
|---|---|---|---|
| Wing west (the long colonnades) | podium strip x2 y g..4 with an arched opening under each loggia bay | loggia: 8 columns `quartz_pillar` on x3 at z 3,5,7,9,11,13,15,17 (House 78,80,…,92), y5..10; solid corner piers x3..4 at z2 and z18 (House z77, z93), y5..10 | the wall x5 behind is in shadow: windows at every even z; entablature x3..5 y11 ties columns to wall; balustrade x3 y12 |
| Wing east | podium x34 y g..4 | wall x33; pilasters at even z, windows at odd z | portico: 5 columns on x35 at z 6,8,10,12,14 (House 81,83,85,87,89), y5..10; x34 the portico floor (bottom slab at y5), x33 the wall with the main door; pediment above |
| Wing north/south ends (z2 / z93) | podium y g..4 | pilasters at even x, windows at odd x 5..31 | centre bay x15..20 projects nothing; a `chiseled_quartz_block` panel at y11 x17..18 |
| Wing inner ends (z18 / z77), exposed parts x3..14 and x28..34 | podium | windows at odd x | same courses |
| Connectors | podium | west wall x15: pilasters at odd z, windows at even z; east x27 same | balustrade y12 |
| Central block west, outside the West Front (z26..40, z55..69) | podium x10 y0..4 | windows at even z, pilasters at odd z | corner piers at z26 and z69 |
| West Front (centre, z41..54) | arcade podium x0..9: face x0 rusticated `quartz_bricks`, 7 arched openings | upper west terrace = podium top, `smooth_stone_slab` deck at y5 x0..7, `diorite_wall` balustrade on x0 y5 | loggia: 8 columns on x8 at z 41,43,45,47,48,50,52,54 y5..10 (centre pair 47/48 frames the door); entablature x8..10 y11; balustrade x8 y12 |
| Central block east (z26..36, z59..69) | podium x29 y g..4 | windows at even z | |
| East Front centre | antae x30..31 z37..40 / z55..58, rusticated base, a blind niche (window) at z38/z57 y6..7 | East Portico: outer row columns on x32 at z 41,43,45,47,48,50,52,54; inner row on x30 at z 42,44,46,49,51,53 (staggered, so the colonnade reads deep and double), all y5..10; portico floor x30..32 bottom slab at y5 | pediment y11..15 over x29..32; the wall x29 behind with the bronze door |
| Dome base | `smooth_quartz` y12..13, `smooth_quartz_slab` cornice course y14 (top); the 1-cell ledge round the peristyle is the y14 deck | | |
| Peristyle | the base top y14 is its floor | columns: on the d16 ring every other cell (~24 columns) `quartz_pillar` y15..20; drum wall on the d12 ring `calcite` (a shade darker = shadow behind columns) with tall windows | entablature y21 `smooth_quartz` d16 disc, `smooth_quartz_slab` cornice; `diorite_wall` balustrade on the d16 ring y22 |
| Attic | | `smooth_quartz` ring d14 y22..24, a window at y23 in every 3rd ring cell | cornice disc d14 y25: outer ring `smooth_quartz_stairs` facing out (upside down), core `smooth_quartz` |
| Shell | | 8 small windows at y27, one centred in each segment between ribs | ribs as ROOFS |
| Lantern | | 8 outer cells of d4 = `diorite_wall` posts y34..35 (a ring of slim columns); core x19..20 z47..48 `glowstone` y34..35 (the lit lantern) | |
| Statue | | `polished_diorite` pedestal (19,38,47); figure `polished_blackstone` (19,39,47) and (19,40,47), `polished_blackstone_wall` (19,41,47) | |

## MATERIALS

All verified with `$MCD blocks --check` (1.21.1-safe; no pale oak, no 1.21.4+ blocks).

| role | block |
|---|---|
| wall body (all masses, dome base, attic, shell) | `smooth_quartz` |
| rusticated basement / podium / arcade face | `quartz_bricks` |
| columns, pilasters, corner piers | `quartz_pillar` (axis y) |
| drum wall behind the peristyle, cupola drums | `calcite` |
| entablature cornices, sill band, pediment rakes, shell edges | `smooth_quartz_slab`, `smooth_quartz_stairs` |
| balustrades (every roofline, terraces, dome) | `diorite_wall` |
| ornament panels, tympanum centre | `chiseled_quartz_block` |
| shadow trim: window reveals' heads (upside-down stair lintel over each tall window), dome ribs, statue pedestal | `polished_diorite`, `polished_diorite_stairs`, `polished_diorite_slab` |
| roof decks, terraces, portico floors | `smooth_stone_slab` (bottom) |
| skylight curbs | `polished_andesite` |
| cupola caps | `oxidized_cut_copper_stairs`, `oxidized_cut_copper_slab`, `oxidized_cut_copper` |
| window glass | `gray_stained_glass_pane` (reads dark on white) |
| skylight glass | `glass` |
| hidden warm light | `glowstone` (behind panes, under skylights, lantern core), `shroomlight` (arcade recesses) |
| visible lamps | `lantern` |
| doors | `dark_oak_door` (reads as bronze) |
| statue | `polished_blackstone`, `polished_blackstone_wall` |
| interior core (unseen) | `smooth_stone` |

## OPENINGS

Rule for every window: the outer wall cell is left AIR (a 1-deep recess) and the `gray_stained_glass_pane` sits in
the second cell; tall windows get an upside-down `polished_diorite_stairs` lintel in the outer cell row above the
opening (facing out); short windows have none. Behind every third window (counting from the face's north/west end) the
third cell is `glowstone`, so the facade shows a scatter of warm lit panes at dusk.

| face | windows (each 1 wide) | door |
|---|---|---|
| Senate wing west wall x5 | z 4,6,…,16: tall y6..7, short y9..10 | — |
| Senate wing east x33 | z 3,5,…,17 except inside the portico (z6..14): tall y6..7, short y9..10; inside the portico z 7,9,11,13 tall y6..7 only | z10, y5..6 `dark_oak_door` facing east, transom pane y7 |
| Senate north z2 / inner z18 | x 5,7,…,31 (z18: only x5..13 and x29..33 odd): tall y6..7, short y9..10 | — |
| House wing | mirror (z → 95 − z): west x5 z 79,81,…,91; east x33 z 78,80,…,92, portico z 82,84,86,88; door z85 | z85 |
| Wing podium arches (x2) | Senate z 4,6,…,16; House z 79,81,…,91: opening y g..2 with an upside-down `smooth_quartz_stairs` arch head at y3; x2 air, `gray_stained_glass_pane` at x3, `shroomlight` at x4 | — |
| Connectors x15 / x27 | z 20,22,24 (N), 71,73,75 (S): tall y6..7, short y9..10 | — |
| Central block x10 | z 28,30,…,40 and (mirrored) 55,57,…,67: tall y6..7, short y9..10 | — |
| Central west wall in the loggia (x10, z41..54) | z 42,44,46 and 49,51,53: tall y6..8 (3 high, lit glowstone behind all six) | z47..48, y5..7 double `dark_oak_door` y5..6 + transom pane y7 |
| West Front arcade face x0 | arches at z 42,44,46, 47..48 (2 wide, centre), 49,51,53; opening y1..3, `gray_stained_glass_pane` 1 deep, `shroomlight` behind, round head = upside-down stair at y3 | — |
| Central block x29 | z 27,29,…,35 and 60,62,…,68: tall y6..7, short y9..10 | in the East Portico z47..48, y5..7 double `dark_oak_door` + transom |
| Central block ends z26 / z69 exposed parts x10..14 and x28..29 | x 11,13 and 29: tall y6..7 | — |
| Drum wall (d12 ring) | every 2nd ring cell, y16..19 (4 tall), `gray_stained_glass_pane` with `glowstone` behind in EVERY window (the lit drum) | — |
| Attic (d14 ring) | every 3rd ring cell, y23 | — |
| Shell | 8 windows at y27, centred between ribs | — |
| Cupola drums | one per face, centre 2 cells, y12..13 | — |

Inaugural west steps (N flight z37..40, S flight z55..58, 4 wide, `smooth_quartz_stairs` facing east = up,
each on a solid `smooth_quartz` fill down to the ground): step 1 at x1 in course y0, x2 y1, x3 y2; landing
x4..5 full `smooth_quartz` up to y2 with a `smooth_stone_slab` top at y3; x6 step y3, x7 step y4; top landing
x8..9 `smooth_quartz` to y4 meeting the loggia floor at y5 (bottom slab at y5). Cheek walls: `diorite_wall`
balustrades on z37 and z40 (N), z55 and z58 (S), following the steps. The East Front steps are in the plaza
(beyond x35); the portico podium face at x32 is rusticated.

## RESERVED

The shell (walls, podiums, decks) leaves these cells AIR; the named part fills them:

| cells | for |
|---|---|
| x3 y5..10 at the 8 column z's of each wing; x35 y5..10 at the 5 portico z's | wing columns |
| x8 y5..10 at z 41,43,45,47,48,50,52,54 | West Front loggia columns |
| x30 and x32 y5..10 at the East Portico column z's | East Portico columns |
| every window and door cell in OPENINGS (outer recess + pane cell + the glowstone cell behind lit ones) | glazier, lamplighter |
| y11..15 above x29..32 z41..54 and y11..14 above x34..35 z6..14 / z81..89 | pediments |
| x11..28 y12..41 z39..56 (everything above the central roof inside the dome base square) | dome part (base, peristyle, attic, shell, lantern, statue): one part, built bottom-up |
| x18..21 y12..15 z29..32 / z63..66 | cupolas |
| skylight rectangles x13..25 z6..14 / z81..89 at y11..13 | skylights + their glowstone (y11) |
| peristyle floor ring between d16 and d12 at y15: one cell behind every 4th column | standing `lantern`s (warm glow through the colonnade at dusk) |

## FLOORS

Exterior only: no rooms. Floor y 5 everywhere above the podium. Behind the 2-thick outer walls every mass is a
solid core of `smooth_stone` (y g..11) so no dark interior can spawn mobs; window recesses and the glowstone cells
are cut into it. Open surfaces a player could stand on are bottom slabs (decks, terraces, portico floors, landings)
or stairs, and lit:
- `lantern` hanging from the entablature (y10) in every second loggia bay (wing loggias, West Front loggia) and between
  the East Portico rows;
- `lantern`s standing on the balustrade posts every 6 cells at the upper west terrace (x0, y6) and on the wing
  podium strips' corners;
- warm base light: a `lantern` standing on the podium ledge (y5) at each wing corner and each side of the west steps'
  top landing; glowstone behind the arcade panes; the floodlit-white look at dusk comes from the white body over these
  warm points, plus the fully lit drum, lantern and skylights.


---
# DESIGNER'S SECTIONS

## PALETTE

Architect's MATERIALS kept exactly (all checked with `$MCD blocks --check`, 0 unknown).

| role | block | variants / states |
|---|---|---|
| wall body | `smooth_quartz` | `smooth_quartz_stairs` (facing, half, shape), `smooth_quartz_slab` (type top/bottom) |
| rusticated base | `quartz_bricks` | arch head = upside-down `smooth_quartz_stairs` |
| columns, pilasters, piers | `quartz_pillar` axis=y | |
| drum wall, cupola drums | `calcite` | |
| balustrades | `diorite_wall` | up=true posts; `smooth_quartz` corner posts |
| ornament | `chiseled_quartz_block` | |
| shadow trim, ribs, pedestal | `polished_diorite` | `polished_diorite_stairs` (half=top lintels), `polished_diorite_slab` |
| decks, terraces, portico floors | `smooth_stone_slab` type=bottom | |
| skylight curb | `polished_andesite` | |
| cupola caps | `oxidized_cut_copper` | `_stairs`, `_slab` |
| glass | `gray_stained_glass_pane` windows; `glass` skylights | panes connect to walls beside |
| light | `glowstone` (hidden), `shroomlight` (arcade), `lantern` hanging=true/false | |
| doors | `dark_oak_door` (both halves, facing out, hinge matched) | transom `gray_stained_glass_pane` |
| statue | `polished_blackstone`, `polished_blackstone_wall` | |
| core | `smooth_stone` | unseen |
Extra checked ids: `white_concrete`, `iron_chain` (lantern chains).

## VOCABULARY

All coordinates plot-local. Each helper takes `g` (the grid) first. `G(x,z)` = ground course from the plan's GROUND map. Round courses use the architect's rule: cells x 20−d/2..19+d/2, z 48−d/2..47+d/2 kept where (x+.5−20)²+(z+.5−48)² ≤ (d/2)². `ringCells(d)` = kept cells of disc d that have a non-kept 4-neighbour (outer ring).
- `podium({x0,x1,z0,z1}, y0=G..4)`: `quartz_bricks` solid, fill down to G(x,z) per column (never float/buried), y4 top course `smooth_quartz_slab` top where the cell above is free.
- `wingBody({x0,x1,z0,z1})`: outer 2-thick walls `smooth_quartz` y5..11, core `smooth_stone` y G..11, deck `smooth_stone_slab` bottom y12 inside; leaves RESERVED cells air.
- `colonnade({axis,at,zs,y0:5,y1:10})`: one `quartz_pillar axis=y` per listed coordinate, y5..10; piers 2 wide where specified.
- `portico({x,zs,floorX,pediment})`: columns via `colonnade`, floor bottom `smooth_stone_slab` y5, entablature y11 `smooth_quartz`.
- `pediment({box, ridgeAxis, steps})`: cornice y11; each higher course 1 narrower per side (1 up per 2 across): rakes `smooth_quartz_stairs` facing outward-up, tympanum `smooth_quartz`, centre `chiseled_quartz_block`.
- `balustrade({line, y:12})`: `diorite_wall` along the wall line, `smooth_quartz` post every 6th cell and at corners; skip pediment cells.
- `archOpening({x,z,y0,y1,face})`: recess 1 deep: air y0..y1, upside-down `smooth_quartz_stairs` head at y1+1 facing out, `gray_stained_glass_pane` 1 in, `shroomlight` behind.
- `windowBay({face,pos,y0,y1,tall,lit})`: outer cell air, `gray_stained_glass_pane` in the 2nd cell, tall: upside-down `polished_diorite_stairs` lintel above in outer row; lit: `glowstone` third cell.
- `pilaster({x,z,y0:5,y1:10})`: `quartz_pillar` flush in the wall face.
- `bronzeDoor({x,z,face,w})`: `dark_oak_door` lower+upper facing out (double: hinges mirrored), transom pane above.
- `westSteps({z0,z1})`: per the architect's flight spec, `smooth_quartz_stairs` facing=east half=bottom on solid `smooth_quartz`, cheek `diorite_wall`.
- `cupola({x0,z0})`: 4x4 `calcite` drum y12..13, centred 2-cell `gray_stained_glass_pane` per face, `oxidized_cut_copper_stairs` ring facing out y14, `oxidized_cut_copper_slab` 2x2 y15.
- `disc(d,y,mat)` / `ringPost(d,y0,y1,mat,everyN)`: fill / posts on ring cells (every other ring cell for columns).
- `domeBase`, `peristyle`, `attic`, `domeShell`, `tholos`, `statue`: dome courses per plan SITE table, built bottom-up. Shell course edges: cells the next course steps in from = upright `smooth_quartz_stairs` facing outward (use ring cell's outward axis); y33 d4 ring topped with `smooth_quartz_slab`. `ribs`: cells on lines x19|20, z47|48 and the two diagonals of each shell course -> `polished_diorite` (stairs at stepped edges).
- `lanternRow({line,y,every})`: hanging `lantern` hanging=true under a block, or standing on posts/slabs (top face), never on a bottom slab.
- `baseGlow(corners)`: standing `lantern` on podium ledge y5 at each wing corner and either side of the west-steps top landing.

## ROOMS

Exterior-only build: no interior rooms (solid `smooth_stone` core, so nothing spawns). `rooms` = none. The only walkable spaces are outdoor: loggias, portico floors, terraces, decks (slabs, lit).
Way in: the West Front door x10 z47..48 (y5), entered from the loggia floor at x9 (y5). Approach from the grounds kit's terrace at x<0 via the architect's inaugural steps (a full-height stair is the architect's fixed form: leave it; the terrace kit should supply any slab ramp). Entrance cell (9,5,47); street cell (-2,0,47).

## PARTS

1. **P1 Masonry shell** `parts/shell.mjs`: `podium`, `wingBody` for both wings, connectors, central block, antae, `westSteps`, west arcade podium, terraces plinths. Leave RESERVED cells and window cells air. Ticks 1-5,8(podium),9,12.
2. **P2 Colonnades, porticoes, pediments, balustrades, cupolas, skylights** `parts/colonnades.mjs`: `colonnade`, `portico`, `pediment`, `balustrade`, `cupola`, skylights. Ticks 6,7,8(loggia),10,11,14,15.
3. **P3 Dome lower** `parts/dome-lower.mjs`: `domeBase`, `peristyle` (with drum windows + glowstone + standing lanterns), `attic`. Ticks 16-18.
4. **P4 Dome upper** `parts/dome-upper.mjs`: `domeShell`, `ribs`, shell windows, `tholos`, `statue`. Starts on P3's y25 disc. Ticks 19-21.
5. **P5 Facade fittings** `parts/fittings.mjs`: `windowBay` for every OPENINGS row, `pilaster`, `archOpening` (wing podium + West Front arcade), `bronzeDoor`s, chiseled panels at y11. Ticks 13,22.
6. **P6 Lighting and terrace edges** `parts/lighting.mjs`: terrace balustrade x0 y5, north/south terrace plinths with lamp line, `lanternRow` in loggias/East Portico, `baseGlow`, post lanterns. Verify `$MCD check` and no dark cell. Ticks 23,24.

## Notes for workers
- Do not change the architect's sections or coordinates. Never fill RESERVED cells outside their named part. Build each part in order; later parts overwrite air only.
- Round courses: compute cells from the plan formula, never by eye; test symmetry.
- Dome must stay crisp at a few hundred blocks: the peristyle's white columns and the lit drum are the signature, then the stepped bell, then the lantern.
- Lanterns never on bottom slabs: stand on a full block or post; hanging ones under a block or chain.
- 1.21.1 only. `$MCD check` after each part.
```

### elements.md

```markdown
# US Capitol — REQUIRED ELEMENTS (checklist)

Coordinates are plot-local from plan.md (x west→east, z north→south, symmetric about z 47.5; "mirror" = z → 95−z). Vocabulary names are defined in plan.md VOCABULARY. Parts: P1 shell, P2 colonnades+pediments, P3 dome lower, P4 dome upper, P5 fittings, P6 light+grounds edge.

- [ ] **1 Raised rusticated basement / podium** (P1, `podium`): `quartz_bricks` solid y g..4 under every mass; a top course of `smooth_quartz_slab`(top) at y4 where a cornice is free; five courses visible on the west, fewer east. Sill band `smooth_quartz_slab` at y5 proud 1 on west faces. Steps down to the ground g, never floating.
- [ ] **2 Senate wing (north), x3..34 z2..18** (P1 `wingBody`): `smooth_quartz` 2-thick walls y5..11 (west x5, east x33, north z2, south z18), core `smooth_stone` y g..11 behind, deck `smooth_stone_slab`(bottom) y12.
- [ ] **3 House wing (south), mirror** z77..93 (P1 `wingBody` mirrored).
- [ ] **4 Connectors** N x15..27 z19..25, S z70..76 (P1 `wingBody`, same courses).
- [ ] **5 Central block** x10..29 z26..69 (P1), plus east antae x30..31 z37..40 / 55..58.
- [ ] **6 Wing west colonnades** (P2 `colonnade`): 8 `quartz_pillar`(axis y) on x3 at z 3,5,…,17 y5..10 (House 78..92); corner piers x3..4 z2 & z18 (77, 93) y5..10; entablature `smooth_quartz` x3..5 y11; podium strip x2 y g..4 with arched openings (`archOpening`) at z 4,6,…,16 (House 79..91).
- [ ] **7 Wing east pedimented porticoes** (P2 `portico`+`pediment`): 5 columns x35 at z 6,8,…,14 (House 81..89) y5..10; floor x34 bottom slab y5; pediment y11 cornice, y12 z6..14, y13 z8..12, y14 z10 (stairs rakes, quartz tympanum).
- [ ] **8 West Front** (centre z41..54): arcade podium x0..9 y0..4 face x0 `quartz_bricks` with 7 arches (P5 `archOpening`); upper terrace deck y5 x0..7 + `diorite_wall` balustrade x0 y5 (P6); loggia 8 columns x8 z 41,43,45,47,48,50,52,54 y5..10 (P2); entablature x8..10 y11; balustrade x8 y12.
- [ ] **9 Inaugural west steps N z37..40 / S z55..58** (P1 `westSteps`): `smooth_quartz_stairs` facing east on solid `smooth_quartz`, per plan OPENINGS; cheek `diorite_wall`.
- [ ] **10 East Portico + broad steps' podium** (P2 `portico`): outer columns x32 z 41,43,45,47,48,50,52,54, inner x30 z 42,44,46,49,51,53, y5..10; floor x30..32 slab y5; pediment y11..15 over x29..32 z41..54 with `chiseled_quartz_block` tympanum centre; bronze `dark_oak_door` double at x29 z47..48. (Steps themselves are the plaza kit's.)
- [ ] **11 Balustrade along EVERY roofline** (P2 `balustrade`): `diorite_wall` y12 on the outer wall line of every mass, `smooth_quartz` posts at corners and every 6th cell; low grey `smooth_stone_slab` roof behind.
- [ ] **12 Entablature + cornice** (P1/P2): y11 `smooth_quartz` band, `smooth_quartz_slab`(top) cornice proud 1 where free.
- [ ] **13 Pilasters + corner piers + tall windows** (P5 `windowBay`, `pilaster`): `quartz_pillar` flush y5..10; windows 1 wide, recess + `gray_stained_glass_pane`, upside-down `polished_diorite_stairs` lintel on tall ones, per OPENINGS.
- [ ] **14 Chamber skylights** (P2/P5): Senate x13..25 z6..14, House z81..89: curb `polished_andesite` y12, `glass` y13, `glowstone` y11.
- [ ] **15 Copper cupolas N/S** (P2 `cupola`): x18..21 z29..32 / 63..66, drum calcite y12..13, `oxidized_cut_copper_stairs` ring y14, slab 2x2 y15.
- [ ] **16 DOME square base** x11..28 z39..56 y12..14 (P3 `domeBase`): `smooth_quartz`, slab cornice y14.
- [ ] **17 DOME peristyle** (P3 `peristyle`): d16 ring ~24 `quartz_pillar` y15..20 every other ring cell, `calcite` drum wall d12 with 4-tall lit windows, entablature disc d16 y21, `diorite_wall` balustrade ring y22, standing `lanterns` on the y15 ring behind every 4th column.
- [ ] **18 DOME attic** (P3 `attic`): d14 ring y22..24 `smooth_quartz` with a window y23 every 3rd cell; cornice disc y25 (outer ring upside-down stairs).
- [ ] **19 DOME ribbed bell shell** (P4 `domeShell`): d12 y26..28, d10 y29..30, d8 y31, d6 y32, d4 y33; stepped edges as upright stairs facing out; 8 `polished_diorite` ribs; 8 small windows y27.
- [ ] **20 Tholos / lantern** (P4 `tholos`): d4 ring `diorite_wall` posts y34..35, `glowstone` core x19..20 z47..48, cap y36 stairs ring + core, y37 d2.
- [ ] **21 Statue of Freedom** (P4 `statue`): pedestal `polished_diorite` (19,38,47), `polished_blackstone` y39..40, `polished_blackstone_wall` y41.
- [ ] **22 Doors**: West Front double door x10 z47..48 y5..6 + transom y7; wing east doors z10 / z85; East door x29 z47..48 (P5 `bronzeDoor`).
- [ ] **23 Lit windows / warm floodlight at the base** (P6 `baseGlow`, `lanternRow`): glowstone behind every third pane, `shroomlight` behind arcade panes, lanterns on podium ledges, west steps landings and balustrade posts: no dark cell outside (spawn-proof; all open tops are slabs/stairs and lit).
- [ ] **24 Terrace edge / north+south terraces** (P6): x10..25 z0..1 and z94..95 plinth bottom slab y g+1 with `diorite_wall` balustrade and lamp line.
```

### rooms.json

```json
{"entrance":[9,5,47],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "wall": ["smooth_quartz", "smooth_quartz_stairs", "smooth_quartz_slab"],
    "rusticated": ["quartz_bricks"],
    "columns": ["quartz_pillar"],
    "drum": ["calcite"],
    "balustrade": ["diorite_wall"],
    "ornament": ["chiseled_quartz_block"],
    "trim": ["polished_diorite", "polished_diorite_stairs", "polished_diorite_slab"],
    "deck": ["smooth_stone_slab"],
    "skylight_curb": ["polished_andesite"],
    "cupola_cap": ["oxidized_cut_copper", "oxidized_cut_copper_stairs", "oxidized_cut_copper_slab"],
    "glass": ["gray_stained_glass_pane", "glass"],
    "light": ["glowstone", "shroomlight", "lantern"],
    "door": ["dark_oak_door"],
    "statue": ["polished_blackstone", "polished_blackstone_wall"],
    "core": ["smooth_stone"],
    "chain": ["chain"]
  },
  "objects": ["white_concrete"]
}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build.mjs into a temp file, then moved into place. Runs from any directory.
set -eu
cd "$(dirname "$0")"
tmp="$(mktemp ./build.XXXXXX)"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
chmod 644 "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// The US Capitol (plot 0): the grid at the site size, the ground, then the six parts in plan order.
// Usage: node build.mjs <out.nbt>   (make.sh runs it into a temp file and moves the result into place)
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, G } from "./vocab/base.mjs";

const PARTS = [
  ["Masonry shell", "parts/shell.mjs"],
  ["Colonnades, porticoes, pediments, balustrades, cupolas", "parts/colonnades.mjs"],
  ["Dome lower", "parts/dome-lower.mjs"],
  ["Dome upper", "parts/dome-upper.mjs"],
  ["Facade fittings", "parts/fittings.mjs"],
  ["Lighting and terrace edges", "parts/lighting.mjs"],
];

// A part whose file or build() is not written yet builds nothing, so the others can still be built and checked.
async function partBuild(file) {
  const path = fileURLToPath(new URL(file, import.meta.url));
  if (!existsSync(path)) { console.log(`part ${file}: not written yet, builds nothing`); return () => {}; }
  const mod = await import(path);
  return mod.build ?? (() => {});
}

// Ground: each column is dirt up to g-1 with grass on top, so the first built course is g (plan.md SITE).
function layGround(g) {
  for (let x = 0; x < SITE.x; x++) for (let z = 0; z < SITE.z; z++) {
    const top = G(x, z);
    for (let y = 0; y < top - 1; y++) g.set(x, y, z, "dirt");
    if (top > 0) g.set(x, top - 1, z, "grass_block");
  }
}

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }

const g = new Grid([SITE.x, SITE.y, SITE.z], { dataVersion: DATA_VERSIONS["1.21.1"] });
layGround(g);
const list = [];
for (const [name, file] of PARTS) list.push([name, await partBuild(file)]);
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for the Capitol parts: palette block ids (palette.json only), plan.md site coordinates, a seeded rng.
// Plot-local coordinates throughout (plan.md SITE): x 0..35 west to east, z 0..95 north to south, y 0 = lowest ground.

// ---- site ---------------------------------------------------------------------------------------------------------

// ---- site ---------------------------------------------------------------------------------------------------------
/** Grid size and height cap: the lot is 36 x 96, the top course is y 45. */
export const SITE = { x: 36, y: 46, z: 96, yCap: 45 };

/** Dome axis in continuous coordinates (between cells 19|20 and 47|48); the building is symmetric about z = 47.5. */
export const DOME_AXIS = { x: 20, z: 48 };

/** Mirror plane of the building in z: a z maps to MIRROR_Z - z. */
export const MIRROR_Z = 95;

/** Ground course g at (x, z): the first course a column is built on (plan.md SITE: 0 west, 2 east). */
export const G = (x, z) => ...

/** Level courses (plan.md SITE): podium top, main floor, principal and upper storeys, entablature, balustrade, decks. */
export const LEVELS = { podiumTop: 4, mainFloor: 5, principalTop: 8, upperTop: 10, entablature: 11, balustrade: 12, deck: 12 };

/** The main masses as box ranges, inclusive (plan.md SITE table): x0..x1, z0..z1, top course y. */
export const MASS = {
  senateWing: { x0: 3, x1: 34, z0: 2, z1: 18, top: 12 },
  houseWing: { x0: 3, x1: 34, z0: 77, z1: 93, top: 12 },
  northConnector: { x0: 15, x1: 27, z0: 19, z1: 25, top: 12 },
  southConnector: { x0: 15, x1: 27, z0: 70, z1: 76, top: 12 },
  centralBlock: { x0: 10, x1: 29, z0: 26, z1: 69, top: 12 },
  eastPortico: { x0: 30, x1: 32, z0: 41, z1: 54, top: 15 },
  westFrontPodium: { x0: 0, x1: 9, z0: 41, z1: 54, top: 4 },
  westFrontLoggia: { x0: 8, x1: 9, z0: 41, z1: 54, top: 12 },
  domeBase: { x0: 11, x1: 28, z0: 39, z1: 56, top: 14 },
};

/** Dome shell courses (plan.md SITE): [y, outer diameter] for y26..y33, bell profile. */
export const DOME_SHELL = [[26, 12], [27, 12], [28, 12], [29, 10], [30, 10], [31, 8], [32, 6], [33, 4]];

/** Statue of Freedom: pedestal at y38, figure y39..41 at (x 19, z 47). */
export const STATUE = { x: 19, z: 47, pedestalY: 38, topY: 41 };

// ---- palette (palette.json ids only) ------------------------------------------------------------------------------
/** Wall body, all masses and the dome base (smooth_quartz). */
export const WALL = "smooth_quartz";

/** Stairs of the wall body: pediment rakes, shell edges, the dome's stepped courses. */
export const WALL_STAIRS = "smooth_quartz_stairs";

/** Slab of the wall body: entablature cornices, sill band, dome cornice course. */
export const WALL_SLAB = "smooth_quartz_slab";

/** Rusticated basement, podium and arcade face (quartz_bricks). */
export const RUSTIC = "quartz_bricks";

/** Columns, pilasters and corner piers (quartz_pillar, axis y). */
export const PILLAR = "quartz_pillar";

/** Drum wall behind the peristyle and the cupola drums (calcite). */
export const DRUM = "calcite";

/** Balustrades on every roofline, terrace and dome (diorite_wall). */
export const BALUSTRADE = "diorite_wall";

/** Ornament panels and the pediment tympanum centre (chiseled_quartz_block). */
export const ORNAMENT = "chiseled_quartz_block";

/** Shadow trim: window lintels, dome ribs, statue pedestal (polished_diorite). */
export const TRIM = "polished_diorite";

/** Stairs of the shadow trim: the upside-down window lintels, stepped rib edges. */
export const TRIM_STAIRS = "polished_diorite_stairs";

/** Slab of the shadow trim. */
export const TRIM_SLAB = "polished_diorite_slab";

/** Decks, terraces, portico floors and landings (smooth_stone_slab, bottom). */
export const DECK_SLAB = "smooth_stone_slab";

/** Skylight curbs (polished_andesite). */
export const CURB = "polished_andesite";

/** Cupola caps (oxidized_cut_copper). */
export const COPPER = "oxidized_cut_copper";

/** Cupola cap ring (oxidized_cut_copper_stairs). */
export const COPPER_STAIRS = "oxidized_cut_copper_stairs";

/** Cupola cap slab (oxidized_cut_copper_slab). */
export const COPPER_SLAB = "oxidized_cut_copper_slab";

/** Window glass panes (gray_stained_glass_pane). */
export const PANE = "gray_stained_glass_pane";

/** Skylight glass (glass). */
export const GLASS = "glass";

/** Hidden warm light behind panes, under skylights, in the lantern core (glowstone). */
export const GLOWSTONE = "glowstone";

/** Warm light in the arcade recesses (shroomlight). */
export const SHROOMLIGHT = "shroomlight";

/** Visible lamps, hanging or standing (lantern). */
export const LANTERN = "lantern";

/** Doors, read as bronze (dark_oak_door). */
export const DOOR = "dark_oak_door";

/** Statue figure (polished_blackstone). */
export const STATUE_BLOCK = "polished_blackstone";

/** Statue top cell at y41 (polished_blackstone_wall). */
export const STATUE_WALL = "polished_blackstone_wall";

/** Unseen interior core (smooth_stone). */
export const CORE = "smooth_stone";

/** Lantern chains (chain: iron_chain is not in 1.21.1). */
export const CHAIN = "chain";

/** Extra white ornament (white_concrete). */
export const WHITE = "white_concrete";

// ---- rng ----------------------------------------------------------------------------------------------------------
/** Seeded PRNG (mulberry32): rng(seed)() returns a float in [0, 1); the same seed gives the same sequence. */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Vocabulary part 1 (plan.md VOCABULARY): podium, portico, archOpening, bronzeDoor, disc, peristyle, ribs, lanternRow.
// Each helper takes the grid first, then its position as arguments. It writes only inside the footprint it was given,
// only into air (or into the `over` ids a caller names), and returns { placed, refused } instead of throwing.

/**
 * podium(g, {x0,x1,z0,z1}, { ground, top = 4 }): the rusticated podium. Per column, quartz_bricks from the ground course
 * up to `top`; the top course is a top slab where the cell above is free (the cornice), else brick.
 * ground: a course, or (x, z) => course (the plan's GROUND map, supplied by the caller).
 */
export function podium(g, box, { ground, top = 4 } = {})

/**
 * portico(g, { columns: [{x, zs}], floorX, span: {z0,z1}, pediment, floor = 5, top = 10, entablature = 11 }): one or
 * more rows of quartz_pillar columns (axis y, floor..top), the portico floor (bottom slab at `floor` on the floorX
 * cells), and the smooth_quartz entablature at `entablature` over the whole footprint. pediment: {x0,x1,z0,z1}, the
 * pediment's footprint, which the entablature runs under; its rising courses belong to the pediment helper.
 */
export function portico(g, { columns, floorX = [], span, pediment = null, floor = 5, top = 10, entablature = 11 })

/**
 * archOpening(g, { x, z, y0, y1, face }): a 1-deep arched recess on the wall face `face` (north, south, east or west:
 * the outward side). The outer cell (x, z) must already be air for y0..y1 (the shell leaves it). A glass pane sits one
 * cell in, a shroomlight two in, and an upside-down smooth_quartz_stairs head at y1+1 is backed into the wall, so its
 * lip reads outward. The head cell must be air too.
 */
export function archOpening(g, { x, z, y0, y1, face })

/**
 * bronzeDoor(g, { x, z, face, w = 1, y0 = 5, wood = "dark_oak" }): a door on the wall face `face`, facing out, both
 * halves written, with a glass transom above each leaf at y0+2. w = 2 is a double door: the second leaf is the next
 * cell along the wall, hinges mirrored.
 */
export function bronzeDoor(g, { x, z, face, w = 1, y0 = 5, wood = "dark_oak" })

/** disc(g, { cx, cz, d, y, block, state }): fills the kept cells of the d disc at course y with `block`. */
export function disc(g, { cx, cz, d, y, block, state })

/**
 * peristyle(g, { cx, cz, colD = 16, drumD = 12, y0 = 15, y1 = 20, winY0 = 16, winY1 = 19 }): the dome's peristyle, built
 * on the base's top course (the cells at y0-1 must be standable). A calcite drum wall on the drumD ring (y0..y1); on
 * every second ring cell a glass pane window at winY0..winY1 with glowstone one cell inside it. quartz_pillar columns
 * on every other cell of the colD ring. A standing lantern on the floor ring one cell inside every 4th column.
 */
export function peristyle(g, { cx, cz, colD = 16, drumD = 12, y0 = 15, y1 = 20, winY0 = 16, winY1 = 19 })

/**
 * ribs(g, { cx, cz, courses, over = [] }): the eight dome ribs. courses: [{y, d}] bottom to top, each the d disc at
 * course y. A rib cell is on the lines |x+.5-cx| = .5, |z+.5-cz| = .5 or the diagonals |dx| = |dz|. A rib cell that the
 * next course steps in from is upright polished_diorite_stairs facing out; the rest are polished_diorite.
 * The rib cells are the shell's own cells, so the caller passes the shell's blocks in `over` (or runs ribs first).
 */
export function ribs(g, { cx, cz, courses, over = [] })

/**
 * lanternRow(g, { line: {x0,x1,z0,z1}, y, every = 1, hanging = true }): lanterns along a one-cell-wide line at course y,
 * every `every`-th cell from its start. Hanging ones need a block above them; standing ones need a full top face
 * below (never a bottom slab).
 */
export function lanternRow(g, { line, y, every = 1, hanging = true })
```

### vocab/h2.mjs

```js
// Capitol vocabulary, part h2 (plan.md VOCABULARY): wingBody, pediment, windowBay, westSteps, ringPost, attic,
// tholos, baseGlow. Each takes the grid first, then its position and facing as arguments, and returns
// { placed, refused }. Writes go into air only, so an earlier part's cells are never overwritten; the two opening
// helpers (windowBay, westSteps) cut their own named footprint out of the shell and nothing else.

/**
 * Wing body: a 2-thick smooth_quartz wall ring on the box's outer line, y5..11, smooth_stone core behind it, and a
 * smooth_stone_slab deck (bottom) at y12 inside the balustrade line. box = the wall box (x0..x1, z0..z1).
 * ground: the lowest course (default 5); cells under the floor are core only where the podium left air.
 */
export function wingBody(g, { x0, x1, z0, z1 }, { ground = 5 } = {})

/**
 * Pediment: a low temple gable. The triangle stands in the plane across the ridge; the ridge runs along `ridge`
 * (x: the triangle faces east/west, z: north/south). Base = box width on the other axis, at course y0+1 (the
 * cornice is smooth_quartz at y0). Each course is 2 cells in from each side of the one below (1 up per 2 across).
 * Raking end cells are smooth_quartz_stairs rising to the centre; the outer face carries a chiseled centre at course 1.
 * face: outward side of the triangle (default east for ridge x, south for ridge z). steps: optional course cap.
 */
export function pediment(g, { x0, x1, z0, z1, y0 = 11, ridge = "x", face, chiseled = true, steps = Infinity })

/**
 * Window in an outer wall: face = outward side of the wall (west/east/north/south), wall = the outer wall cell's
 * coordinate (x for east/west faces, z for north/south), pos = the window's coordinate along the face. The outer
 * cell is a 1-deep recess (air), a gray_stained_glass_pane in the second cell, glowstone behind it in the third if
 * lit. tall: an upside-down polished_diorite_stairs lintel in the outer cell above. Cuts its own cells only.
 */
export function windowBay(g, { face, wall, pos, y0, y1, tall = false, lit = false })

/**
 * Inaugural west steps for the flight z0..z1 (4 wide), x1..x9. Stair columns x1,2,3,6,7 rise east (facing east) from
 * the solid fill down to ground; landings x4..5 (solid to y2, bottom slab y3) and x8..9 (solid to y4, bottom slab y5
 * as the loggia floor). Above each step the podium is carved to a clear lane, and diorite_wall cheeks stand on the
 * flight edges over the stair columns. Cuts its own flight only.
 */
export function westSteps(g, { z0, z1, ground = 0 })

/**
 * Posts on every `every`-th cell of the outer ring of disc d on the axis (cx, cz), from y0 to y1, air-only.
 * Walls get up + low arms to neighbouring posts; quartz_pillar gets axis y; other blocks take `state` as given.
 */
export function ringPost(g, { cx, cz, d, y0, y1, block, state, every = 1 })

/**
 * Attic over the dome base: a d14 ring wall y22..24 (smooth_quartz, a pane at y23 in every third ring cell), a solid
 * smooth_stone core inside it so no hollow spawns mobs, and a cornice disc at y25 whose outer ring is upside-down
 * smooth_quartz_stairs with the lip out.
 */
export function attic(g, { cx, cz, d = 14, y0 = 22, y1 = 24, cornice = 25 })

/**
 * Lantern (tholos) on the dome axis: diorite_wall posts on the d4 ring y34..35, a glowstone core (d2) y34..35,
 * a d4 cap at y36 (outer ring of smooth_quartz_stairs with the lip out, smooth_quartz core), and a d2 smooth_quartz
 * top at y37.
 */
export function tholos(g, { cx, cz })

/**
 * Standing lanterns at the given [x, y, z] points (e.g. podium ledges at y5, either side of the west-steps landing).
 * A lantern needs a support: refused over air or over a bottom slab or bottom stair (never on a bottom slab).
 */
export function baseGlow(g, points)
```

### vocab/h3.mjs

```js
// Vocabulary helpers h3 (plan.md VOCABULARY): colonnade, balustrade, pilaster, cupola, domeBase, domeShell, statue.
// Every helper takes its position as arguments and returns the number of blocks it placed.
// Writes go into air only; pass { over: true } where the helper must cut into a flush wall face (pilaster). Nothing is
// written outside the helper's own footprint, and nothing under it: ground and floors belong to earlier parts.
// Stairs: `facing` names the full-height back (references/toolkit.md, and the client's stair model: facing=east is tall
// on the east). A stair whose lip points out is therefore written facing in.

/**
 * Columns on a line. axis "x": columns at x = at, zs are z positions; axis "z": at = z, zs are x positions. Each column
 * is depth cells deep in +axis and runs y0..y1 as quartz_pillar (axis y). Corner piers are the same call with depth 2.
 */
export function colonnade(g, { axis, at: fixed, zs, y0 = 5, y1 = 10, depth = 1, block = "quartz_pillar" })

/**
 * A balustrade on a wall line at height y: diorite_wall along the line, smooth_quartz posts at both ends and every 6th
 * cell. line = { axis, at, from, to }: axis "x" runs the line at x = at with z = from..to; axis "z" at z = at.
 * skip(x, z) leaves a cell alone (the pediment cells).
 */
export function balustrade(g, { line: { axis, at: fixed, from, to }, y = 12, skip = () => ...

/** One quartz_pillar (axis y) from y0 to y1 at x, z. over: true cuts the flush wall block it stands in. */
export function pilaster(g, { x, z, y0 = 5, y1 = 10, over = false })

/**
 * Copper cupola on the 4x4 footprint x0..x0+3, z0..z0+3, y0..y0+3. A calcite drum (y0..y0+1) with a centred 2-cell pane
 * on each face; a copper stair ring at y0+2 whose lip points out; a 2x2 copper slab cap at y0+3. smooth_stone core.
 */
export function cupola(g, { x0, z0, y0 = 12 })

/**
 * The square base of the dome over (cx, cz): size × size cells, smooth_quartz at y0..y0+1, a smooth_quartz_slab cornice at
 * y0+2 (cornice: "top" as drawn in the plan; "bottom" if the course should sit flush on the body).
 */
export function domeBase(g, { cx, cz, size = 18, y0 = 12, cornice = "top" })

/**
 * The ribbed bell shell over (cx, cz). Each course is a solid disc. Cells the next course steps in from are upright
 * stairs with the lip out (written facing in: the state names the back). The top course (d4) is full blocks. Ribs on the
 * rib lines are polished_diorite (polished_diorite_stairs at the steps). Eight windows sit at windowY, one centred in each
 * segment between ribs: the outer cell is left air and the pane is one cell in.
 */
export function domeShell(g, { cx, cz, windowY = 27, courses = COURSES })

/** The Statue of Freedom on one column: a polished_diorite pedestal at y0, the figure at y0+1..y0+2, its head at y0+3. */
export function statue(g, { x, z, y0 = 38 })
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

/** A bed, both halves: foot at [x,y,z], the head one step toward facing (the pillow end), same colour and facing.
 *  Both cells must be air (a bed never replaces a wall block); the head goes against a solid wall, never a window or
 *  a door. Returns true when placed, false (placing nothing) when a cell is taken. */
export const bed = (g, [x, y, z], facing, color = "red") => ...

/** A straight flight of stairs a player walks up without jumping: from = the first step's cell (standing on the lower
 *  floor), facing = the way you walk up, to = the y of the UPPER FLOOR's own block layer. The last step is set in that
 *  layer, flush with the floor you step out onto, so a storey of h (floor to floor) takes h steps. Clears 2 blocks of
 *  headroom over every step (cutting the floor above where the flight passes) and hangs an upside-down stair under each
 *  step as a stringer. width runs to the right of facing. Returns { steps, landing: [x,y,z] (feet on the upper floor), notes }. */
export const flight = (g, { from: [x, y, z], facing, to, material = "oak", width = 1, stringer = true }) => ...

/** A hearth and its chimney: the fire at the BOTTOM, smoke up a flue, the stack set INTO the wall so the room loses no
 *  space. Give wall = [x, floor level, z], a cell of the outside wall at the hearth's floor level, and into = the side the
 *  room is on: the campfire goes one cell OUTSIDE the wall (an exterior chimney), the wall cell becomes the hearth's
 *  mouth with a lintel over it, and the flue rises outside the wall with the house wall as its room side. (Or give
 *  at = the campfire's cell and open = the side its mouth faces, for an interior chimney set into a partition.)
 *  top = the flue's last course (1-2 over the roof where it leaves it; the mouth is open above). The flue is a 1 x 1
 *  column of air walled on all four sides at every level: the house wall below the roof, and from the roof up the
 *  chimney's own masonry (never the roof's tiles), or with thin: "iron" | "copper" | a wood, an open trapdoor lying
 *  flat against the flue where there is only air beside it (a slim pipe above the roof). Build it after the roof.
 *  It lays its own footing down to the ground and overwrites what is in its cells: call it directly, never through a
 *  helper that writes only into air (that helper refuses the whole stack over one filled cell). */
export const chimney = (g, { wall, into, at, open = "south", top, material = "bricks", thin = null, lintel = true, roofY }) => ...

/** A window shutter: an open trapdoor in the cell in front of the wall (on the face side), lying flat against it.
 *  face: the way the wall looks (north for a north front); the trapdoor's facing is the face, so it lies on the wall. */
export const shutter = (g, [x, y, z], face, wood = "spruce", { height = 1 } = {}) => ...

/** A word in banner letters hung on a board, in reading order for its face: bannerWord(g, "BUTCHER", { center: [14, 10, 4], face: "north" }). */
export const bannerWord = (g, word, o) => ...

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

## How things sit: `mcd fit`

`$MCD fit build.nbt --rooms rooms.json` (and the FIT lines of `$MCD room`) lists what a player sees wrong from inside,
each with its cell: anything **on a bottom slab** (half a block of air under it), floor decor **floating** over air,
a **broken bed** (one half, or halves that don't match), a **bed in the wall** (set into the wall line), a **bed
against an opening** (its head at a window, a pane or a door, or at nothing), a **bed backwards** (foot against the
wall, head out in the room), **stairs end short** (a walked flight whose top step is a full block under the floor it
leads to: a jump), a **chimney fire** fault (a campfire on top of a stack, shut in a stack with no
firebox mouth, its smoke blocked before the sky, a flue open at the side, or roof tiles walling the flue), a
**chimney in the room** (a hearth or flue in a room's floor space instead of set into the wall), a **floating shutter** (an open trapdoor with air behind it), **bookshelf overuse** (more
than 3 outside a library, study or office) and a **hallway to nowhere** (a hall with one way in, or a long stretch no
walk between its openings passes). With `street` in rooms.json it also walks the **way in**, street to main door (with `entrances`, each building's or
module's, from the street straight in front of it),
and lists a **steep approach** (a stair or a full-block step on it, more than 3 half-steps without a 2-long landing,
1 wide, or no level cell before the door): the approach standard, `$MCD approach` alone. The shop sockets' boxes are skipped.
Helpers that get it right: `bed(g, [x, y, z], facing, color)` (both halves; refuses a cell that isn't air and returns
false), `flight(g, { from, facing, to, material, width })` (a flight whose last step is in the upper floor's own layer,
headroom cut, stringer under it), `chimney(g, { wall: [x, floorY, z], into, top, material, thin })` (an exterior chimney: the fire
just outside the wall, its mouth cut through it, hay in the floor, a 1 x 1 air flue to the sky, masonry through the
roof, thin trapdoors above it, its own footing; call it directly, never through an air-only helper), `shutter(g, [x, y, z], face, wood, { height })`
(flat on the wall), `bannerWord(g, word, { center, face })` (letters in reading order).

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

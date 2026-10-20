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

- P1 shell notes: window/door/arch/reserved cells are left UNSET (not air-carved) so later parts can write them; the third (glow) cell of every window is also unset: P5 should fill it with smooth_stone where not lit. Entablature y11 over loggias (x3..5, x8..10), cornices, sill band, loggia ceiling/deck at x3..5 y12 are NOT built (P2). West Front/loggia floor y5 bottom slab placed on x0..9 z41..54 except x0 (balustrade) and x8 columns; wing podium strip x2..4 top y4 = smooth_quartz_slab (top).

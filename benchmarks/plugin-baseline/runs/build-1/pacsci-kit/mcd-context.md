# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# Pacific Science Center — architect's plan (plot 0, x 0..144, z 0..177, y 0..50)

Identity: five slender white lattice arches soaring over shallow reflecting pools, in a courtyard closed on three sides by low white buildings whose walls are ribs that fork into pointed arches. All white, with depth (ribs 1 proud, arcades 3 deep) carrying the read, not colour.
Site orientation as the map: north = low z, east = high x. Nothing is turned. Ground: the given smooth_stone layer at y 0; everything is built from y 1 up.

## SITE

The map's largest open ground is the west/north L: x 4..59 × z 76..159 (the courtyard, closed by the east wing, the south wing and the west-wing stub at the plot edge) opening north into a plaza x 0..39 × z 0..75 (+ x 40..79 × z 0..23). The courtyard holds the pools and arches; the plaza holds the IMAX dome.

| mass | x | y | z | notes |
|---|---|---|---|---|
| N1 north block (tall) | 84..131 | 1..28 | 0..23 | tall lattice box; parapet coping y 27, rib finials y 28 |
| N1 stair bay (low) | 80..83 | 1..19 | 8..15 | entry/stair bay on N1's west side |
| B main block (tall) | 40..143 | 1..28 | 24..51 | the big tall tracery box; west face x 40 fronts the plaza |
| B' (tall, stepped back east) | 40..135 | 1..28 | 52..59 | same as B; its east face steps to x 135 |
| B2 courtyard-north wing (low) | 40..131 | 1..20 | 60..75 | low ring; south face z 75 (x 40..59) closes the courtyard's NE corner |
| E east wing (low) | 60..131 | 1..20 | 76..159 | courtyard face x 60 = arcade + elevated promenade |
| S south wing (low) | 0..131 | 1..20 | 160..171 | courtyard face z 160 (x 4..59) = arcade + promenade |
| S tail (low) | 0..59 | 1..20 | 172..175 | |
| S tail end (low) | 0..55 | 1..20 | 176..177 | |
| W west-wing stub (low) | 0..3 | 1..20 | 140..159 | the west wing continuing beyond the plot edge: solid lattice wall face at x 3 |
| E-wing promenade deck | 57..59 | 10 | 76..156 | elevated walkway over the perimeter path, railing y 11, columns at x 59 every 8 z (z 80,88,…,152), quartz_pillar y 1..9 |
| S-wing promenade deck | 4..59 | 10 | 157..159 | same, columns at z 157 every 8 x (x 8,16,…,56); meets the E deck at the corner x 57..59 z 157..159 |
| Promenade stair (side flight, not the main way in) | 52..53 | 1..10 | 148..156 | 2-wide stair up to the deck along x 52..53 rising south, under the deck edge |
| Courtyard paving / perimeter walk | 4..59 | 1 | 76..159 | everything not pool = smooth_quartz_slab (bottom) walk |
| Pools (4, water 1 deep at y 1) | see RESERVED | 1 | | rim = smooth_quartz full blocks at y 1 round each pool |
| Central N–S walk | 30..33 | 1 | 76..159 | under the tallest arch |
| Central E–W walk | 4..59 | 1 | 111..114 | |
| Arch A1 (tallest, centre) | 24..38 | 1..47 | 100..109 | legs 2×2 at x 24..25 & 37..38, z 100..101 & 108..109; legs straight y 1..30, pointed ribs y 31..47 |
| Arch A2 (NW) | 8..20 | 1..41 | 86..93 | legs x 8..9 & 19..20, z 86..87 & 92..93; straight y 1..26, ribs y 27..41 |
| Arch A3 (NE) | 42..54 | 1..41 | 86..93 | legs x 42..43 & 53..54, z 86..87 & 92..93; as A2 |
| Arch A4 (SW) | 10..23 | 1..44 | 124..131 | legs x 10..11 & 22..23, z 124..125 & 130..131; straight y 1..28, ribs y 29..44 |
| Arch A5 (SE) | 40..53 | 1..44 | 124..131 | legs x 40..41 & 52..53, z 124..125 & 130..131; as A4 |
| Fountain bowls (3) | centres (16,103), (17,143), (46,143) | 1..4 | | pedestal + 5×5 saucer, see RESERVED |
| Helix sculpture | 45..47 | 1..12 | 102..104 | double helix, in the NE pool |
| IMAX dome | 2..37 | 1..23 | 18..53 | drum Ø36 y 1..5 (centre x 19.5, z 35.5), hemisphere r 18 from y 6, top y 23 |
| Dome entrance porch | 17..22 | 1..5 | 54..56 | flat-roofed white porch on the dome's south side |
| Plaza | 0..39 (and 40..79 for z 0..23) | 1 | 0..75 | smooth_quartz_slab walks from z 0 street edge to the dome porch and on south into the courtyard (x 16..23 z 57..75); the rest planting beds |
| Planting beds (poplar rows) | x 0..1 z 4..74 step 6; x 40..76 z 2..3 step 6 | 1..12 | | one-cell grass + birch-trunk columnar trees (Seattle Center poplars) |

The arches stand IN the pools (legs on rim plinths); the central walks pass under A1. Arch spans run along x (arch plane = x–y); each arch is two parallel frames (its z-ends) tied by lattice.

### Arch construction (all five, same grammar)
- Leg: 2×2 column, `white_concrete` with `smooth_quartz` outer face course every 6 y (y 7, 13, 19, 25) as faint banding.
- Ribs above the spring: each frame is a pointed (two-centred) arch, 2 cells wide in x, 1 cell thick in z (the outer z-row of the leg), in `smooth_quartz`, `smooth_quartz_stairs` on the curve's outer steps so the curve reads smooth; built with the `arch` shape brush (pointed), never by hand.
- Inner tracery in each frame plane (upper third, from spring to crown): a second, smaller pointed arch inset 2 cells inside the main rib, plus 2 diagonal braces from each leg's inner corner to the inner arch, as `end_rod` lines (axis along their run) with `smooth_quartz_slab` nodes where they cross: the "lace".
- Cross ties between the two frames (z direction) every 4 y from the spring to the crown, along the rib line: `end_rod` (axis z) runs, a `smooth_quartz` node at each end; under the crown a lattice ceiling of `end_rod` ties in an X on the crown course.
- Hanging globe lamps: from the cross tie 6 below each arch's crown, a `chain` (axis y) 4 long and a `lantern` (hanging) under it, 2 per arch (photo's globe lamps); `end_rod`s also light the lattice.
- Leg plinth: the pool rim widens to a 4×4 `smooth_quartz` plinth at y 1 round each 2×2 leg.

## ROOFS

All flat with parapets (Yamasaki's boxes): preset `modern` (flat-parapet-modern), material overridden: deck `light_gray_concrete` (hidden), coping `smooth_quartz_slab`, NO iron-bar rail (the ribs above the coping are the skyline). The facade part builds the parapet ribs/finials by hand.

| roof | deck y | coping y | top y | notes |
|---|---|---|---|---|
| N1, B, B' (tall) | 26 | 27 | 28 (rib finials) | one deck over all three; parapet 1 high |
| B2, E, S, S tails, W (low) | 18 | 19 | 20 (rib finials) | one deck; meets the tall block's wall at z 60 (B2 against B') |
| N1 stair bay | 18 | 19 | 19 | coping only |
| Promenade decks | 10 | 11 (railing) | 11 | `smooth_quartz_slab` (top) deck, railing `diorite_wall` |
| Dome porch | 5 | – | 5 | `smooth_quartz_slab` (top) flat slab, 1 overhang |
| IMAX dome | – | – | 23 | hemisphere by the `dome` brush |

## FACADES

One grammar everywhere: the **lattice bay**, 4 cells: 1 rib + 3 panel, ribs at every 4th cell from each face's west/north corner (corners are always ribs, 2 cells wide on the turn).

### Low wings (B2, E, S, W): courtyard faces E x 60 (z 76..159), S z 160 (x 4..59), B2 z 75 (x 40..59), W x 3 (z 140..159)
| zone | y | what | depth | material |
|---|---|---|---|---|
| Arcade (ground) | 1..9 | open loggia 3 deep: piers 1 wide at every rib line, pointed arch openings 3 wide; straight y 1..6, `smooth_quartz_stairs` upside-down shoulders y 7..8 meeting a point at y 8 (centre cell air to y 8), spandrel y 9 | piers on the face line; loggia floor = ground; back (shell) wall 3 cells in (E: x 63, S: z 163, B2: z 72) | piers `quartz_pillar`(y), shoulders `smooth_quartz_stairs`, spandrel `white_concrete` |
| Back wall of loggia | 1..9 | glazed screen between piers' lines: glass y 1..7, `calcite` y 8..9; doors as OPENINGS | 3 in | `calcite`, `gray_stained_glass_pane` |
| Floor band | 10 | the promenade deck projects 3 from here; band `smooth_quartz` | flush | `smooth_quartz` |
| Upper storey | 11..17 | solid lattice wall: ribs 1 proud full height; each 3-wide panel `white_concrete` with its centre cell a lancet RECESSED 1 (y 12..16), the recess back `calcite`, a `smooth_quartz_stairs` upside-down pair closing the lancet's top at y 16 | ribs +1, lancet −1 | ribs `quartz_pillar`, panel `white_concrete`, lancet back `calcite` |
| Fork / crown | 18 | ribs fork: each rib's top meets its neighbours in a pointed arch: `smooth_quartz_stairs` (upside-down) on both panel edge cells, panel centre `smooth_quartz` | +1 (on the rib plane) | `smooth_quartz_stairs`, `smooth_quartz` |
| Coping + finials | 19..20 | `smooth_quartz_slab` coping y 19; each rib rises to y 20 as a 1-cell `quartz_pillar` finial | | |

Other faces of the low wings (E east x 131, S south z 171/175/177, the outward ends): same upper grammar from y 1 (no loggia): plinth y 1 `smooth_quartz`, ribs y 1..20, lancets y 3..16 recessed 1 with `calcite` backs, fork y 18. Every 3rd bay's lancet is glazed (`gray_stained_glass_pane` in the recess) for light.

### Tall blocks (N1, B, B'): plaza face x 40 (z 24..59), north z 0 (x 84..131), east x 143 / 139 / 135, south of B' over B2 (z 60 above y 20)
| zone | y | what | depth | material |
|---|---|---|---|---|
| Plinth | 1 | course | flush | `smooth_quartz` |
| Ground arcade (blind) | 1..9 | pointed arch per bay, 3 wide, recessed 1, glazed `gray_stained_glass_pane` y 2..6, pointed head `smooth_quartz_stairs` y 7..8 | −1 | recess back `calcite` |
| Shaft | 10..21 | ribs 1 proud; between them flat `white_concrete` panels (the photo's tall blank box), a `smooth_quartz` string course at y 10 | ribs +1 | |
| Tracery crown | 22..25 | ribs fork in TWO: each rib splits into a Y (stairs stepping out 1 cell each side per 2 rows) so adjacent forks meet in pointed arches over every bay: the interlocking-arch band of the photo's right-hand building | +1 | `smooth_quartz_stairs`, `smooth_quartz` |
| Coping + finials | 27..28 | coping `smooth_quartz_slab` y 27; rib finials `quartz_pillar` y 28 | | |
| Name band | 12..13 (2 rows) | on the plaza face x 40, z 30..53: "PACIFIC SCIENCE CENTER" in banner letters, blue banners with white letters, hung by `bannerWord` with face west (it orders the letters for the face) | on the face | banners only (material: null) |
| IMAX banner | 3..8 | a tall `blue` banner pair on the rib at x 39 z 44 & 48 beside the main entrance (the photo's blue banner) | | |

### IMAX dome
Drum y 1..5: `white_concrete`, `smooth_quartz` course y 5; hemisphere `white_concrete` with 8 meridian ribs of `smooth_quartz` (N, NE, E, …) from drum to a 3×3 `smooth_quartz` cap at y 23. Word "IMAX" in blue banner letters on the porch fascia, face south, z 57, x 18..21, y 4..5.

## MATERIALS (all checked: known in 1.21.1)

| role | block |
|---|---|
| wall panel / body | `white_concrete` |
| ribs, piers, finials | `quartz_pillar` (axis y) |
| arches, crowns, string courses, plinths | `smooth_quartz`, `smooth_quartz_stairs` |
| recess backs (shadow tone) | `calcite` |
| coping, walkways, decks | `smooth_quartz_slab` |
| pool rim / leg plinths | `smooth_quartz` |
| pool water | `water` (y 1) |
| arch lattice | `end_rod`, `smooth_quartz_slab` nodes |
| railings | `diorite_wall` |
| glass | `gray_stained_glass_pane` (dark, reads as shaded glazing) |
| doors | `iron_door` (pairs) |
| roof deck (hidden) | `light_gray_concrete` |
| lamps | `lantern` on `chain` (NOT iron_chain: 1.21.1) ; `sea_lantern` in the dome porch soffit |
| accent (only colour) | `blue` banners (IMAX, name) |
| helix sculpture | `iron_block` strands, `light_gray_concrete` rungs |
| trees | `birch_log` trunk, `birch_leaves` (persistent) narrow columns; `grass_block` bed |
| ground | given `smooth_stone` |

## OPENINGS (shell leaves these as air; later parts fill)

| where | face | coords | size |
|---|---|---|---|
| Main entrance (B, from plaza) | west x 40 | z 45..48, y 1..3 (arch head to y 5) | 4 wide × 3 high iron_door pairs ×2, glass above y 4..5 |
| B second entrance | west x 40 | z 30..31, y 1..2 | 2-wide door |
| N1 north door | north z 0 | x 106..109, y 1..3 | 4 wide |
| N1 stair bay door | west x 80 | z 11..12, y 1..2 | 2 wide |
| E wing loggia doors (into halls) | x 63 | z 89..90, 113..114, 137..138, y 1..2 | 2 wide each |
| S wing loggia doors | z 163 | x 14..15, 30..31, 46..47, y 1..2 | 2 wide each |
| B2 loggia door | z 72 | x 49..50, y 1..2 | 2 wide |
| Promenade doors (upper floor) | E x 60 z 101..102 & 125..126; S z 160 x 22..23 & 38..39 | y 11..12 | 2 wide |
| Loggia arch openings | E x 60 / S z 160 / B2 z 75 | every bay between piers, y 1..8 | 3 wide |
| Blind-arcade glazing (tall blocks) | all tall faces | each bay's 3 centre cells y 2..6, recessed 1 | 3 wide |
| Glazed lancets | low wings' outer faces | every 3rd bay's centre cell, y 12..16, recessed 1 | 1 wide |
| Dome entrance | dome drum south | x 18..21, z 53..54, y 1..3 | 4 wide, through the porch |
| E wing east service door | east x 131 | z 116..117, y 1..2 | 2 wide |

All main ways in are level: door threshold y 1 = ground walk; courtyard walks are bottom slabs (a half step), no stairs on any entrance.

## RESERVED (shell and paving leave empty; later parts sink into / stand on these)

| what | coords |
|---|---|
| Pool NW (water y 1, rim x 8 & 29, z 82 & 110) | x 8..29, z 82..110 |
| Pool NE | x 34..55, z 82..110 |
| Pool SW | x 8..29, z 115..152 |
| Pool SE | x 34..55, z 115..152 |
| Arch leg plinths 4×4 (one per leg, in the pools/walks) | around each leg listed in SITE, 1 cell out each side |
| Arch volumes | each arch's x×z box from y 1 to its crown: nothing else built there except legs/ribs/lattice/lamps |
| Fountain bowl NW | x 14..18, z 101..105, y 1..4 (pedestal `quartz_pillar` 1×1 at centre y 1..2, saucer of `smooth_quartz_stairs` ring y 3 / `smooth_quartz_slab` y 3, water source y 4 centre) |
| Fountain bowl SW | x 15..19, z 141..145, y 1..4 |
| Fountain bowl SE | x 44..48, z 141..145, y 1..4 |
| Helix | x 45..47, z 102..104, y 1..12 |
| Promenade column bases | (59, 1..9, 80+8k) k=0..9; (8+8k, 1..9, 157) k=0..6 |
| Promenade stair | x 52..53, z 148..156, y 1..10 |
| Dome interior | x 3..36, z 19..52, y 1..22 (theatre: seats rising south→north) |
| Plaza tree beds | x 0..1 z 4,10,…,70; x 40,46,…,76 z 2..3 |
| Lamp posts (quartz post + end_rod / lantern) | along walks every 8: x 30 & 33 at z 80,88,…,156 (skip arches/walks crossings); x 5 z 80..156 every 8 |
| Name banners | x 39 (hung on face x 40), z 30..53, y 12..13 |

## FLOORS AND INTERIOR VOLUMES

| mass | storey | floor block y | walk y | clear height | interior box (inside 1-thick walls) |
|---|---|---|---|---|---|
| N1 | ground hall | 0 (ground) | 1 | y 1..9 | x 85..130, z 1..22 |
| N1 | upper | 10 | 11 | y 11..17 | same |
| N1 | top | 18 | 19 | y 19..25 | same |
| B + B' | ground (main lobby + exhibit hall) | 0 | 1 | y 1..9 | x 41..142, z 25..50 ; x 41..134, z 51..58 |
| B + B' | upper | 10 | 11 | y 11..17 | same |
| B + B' | top (planetarium/labs) | 18 | 19 | y 19..25 | same |
| B2 | ground | 0 | 1 | y 1..9 | x 41..130, z 61..71 (loggia x 40..59 z 72..75 in front) |
| B2 | upper | 10 | 11 | y 11..17 | x 41..130, z 61..74 |
| E wing | ground exhibit halls | 0 | 1 | y 1..9 | x 64..130, z 77..158 (loggia x 60..62) |
| E wing | upper halls | 10 | 11 | y 11..17 | x 61..130, z 77..158 |
| S wing | ground | 0 | 1 | y 1..9 | x 1..130, z 164..170 (+ tails to z 176; loggia z 160..162, x 4..59) |
| S wing | upper | 10 | 11 | y 11..17 | x 1..130, z 161..170 (+ tails) |
| W stub | one tall room | 0 | 1 | y 1..17 | x 0..2, z 141..158 (plot edge open side is wall at x 0) |
| Dome | theatre | 0 | 1 | y 1..22 | inside the drum ring |

Stairs between floors: in N1 stair bay (x 80..83 z 8..15), and in B at x 41..44 z 25..34 (straight flights, west wall), E wing at x 128..130 z 77..90. Interiors need lighting at every level (lamplighter): the halls are deep.

---
# DESIGNER SECTIONS

## PALETTE (ids checked with `$MCD blocks --check`; chain valid in 1.21.1)
| role | block | variants |
|---|---|---|
| panel/body | white_concrete | — |
| ribs/piers/finials | quartz_pillar (axis y) | — |
| arches/crowns/plinths/rim | smooth_quartz | smooth_quartz_stairs (facing, half), smooth_quartz_slab (type) |
| recess back | calcite | — |
| walks/decks/coping | smooth_quartz_slab | bottom for walks, top for decks |
| lattice | end_rod (facing = axis of run), smooth_quartz_slab nodes | |
| railing | diorite_wall | |
| glazing | gray_stained_glass_pane | connections set by toolkit |
| doors | iron_door | half lower/upper, hinge left/right, facing out |
| roof deck | light_gray_concrete | |
| lamps | lantern (hanging true/false), chain (axis y), sea_lantern, end_rod | |
| water | water (level 0) | |
| helix | iron_block, light_gray_concrete | |
| accent | blue_banner, white_banner (patterns via B.banner/bannerWord) | |
| trees | birch_log (axis y), birch_leaves (persistent true), grass_block | |
| stair shapes | quartz_stairs/quartz_slab as stand-ins if smooth variants clash | |

## VOCABULARY
- `lattice_bay(g, face, origin, h, opts)`: 4-cell bay: rib quartz_pillar 1 proud full height, 3 panels white_concrete, centre cell a lancet.
- `lancet(g, cell, face, y0, y1, glazed)`: recess 1 deep, calcite back, top cell upside-down smooth_quartz_stairs facing the wall; glazed → gray_stained_glass_pane.
- `fork_arch(g, face, x, y)`: on y18 (low) two upside-down smooth_quartz_stairs on both panel edge cells (facing toward the panel centre), centre smooth_quartz.
- `tall_fork(g, face, x)`: y22..25 rib splits in a Y: stairs step out 1 cell each side per 2 rows; adjacent forks meet in a point.
- `arcade_bay(g, face, x, depth3)`: piers quartz_pillar at rib lines; openings 3 wide: straight y1..6, upside-down smooth_quartz_stairs shoulders y7..8 meeting at point, white_concrete spandrel y9; calcite back wall at depth 3 with glass y1..7.
- `coping_run(g, box, y)`: smooth_quartz_slab run with quartz_pillar finial on each rib.
- `arch_leg(g, x, z, h)`: 2x2 white_concrete, smooth_quartz outer band at y 7,13,19,25.
- `arch_frame(g, {x0,x1,z,spring,crown})`: pointed (two-centred) arch via `arch` brush, 2 wide, smooth_quartz + stairs on curve steps.
- `arch_lace(g, frame)`: inner arch inset 2 + two end_rod diagonals per leg, slab nodes at crossings.
- `arch_ties(g, arch)`: end_rod axis z every 4 y spring→crown, smooth_quartz node at each end; X of end_rods at crown.
- `globe_lamp(g, x, y, z)`: chain axis y ×4 then lantern hanging true.
- `pool(g, box)`: rim smooth_quartz at y1 one thick, interior water y1.
- `leg_plinth(g, x, z)`: 4x4 smooth_quartz at y1 (pool rim widened).
- `fountain_bowl(g, cx, cz)`: pillar y1..2, ring stairs y3 (facing outward-center), slabs fill, water at (cx,4,cz).
- `helix(g, x, z)`: 3x3 turning strand of iron_block, rungs light_gray_concrete.
- `promenade(g, box)`: slab top deck y10, diorite_wall y11, quartz_pillar columns y1..9 at the listed cells.
- `promenade_stair(g)`: 2-wide quartz_stairs flight x52..53 facing south(up), z148..156.
- `dome_ribbed(g)`: `dome` brush r18 white_concrete from y6, 8 smooth_quartz meridians, cap 3x3.
- `porch(g)`: flat slab roof y5, sea_lantern soffit, IMAX banners.
- `name_band(g)`: bannerWord blue/white face west.
- `door_pair(g, cell, face)`, `glaze_bay`, `lamp_post(g,x,z)` (quartz_pillar... lantern on top), `poplar(g,x,z,h)`.

## ROOMS
Interiors per architect FLOORS table; all rooms white, lit by hung lanterns every 6 cells, floors smooth_quartz (exhibit) / polished_andesite? no—smooth_quartz throughout, stone_bricks none. Walls lattice from outside; inside plain white_concrete.

## PARTS (6)
1. shell — massing of all blocks, floors y0/10/18 decks, stairs, openings left air.
2. facade — lattice bays, arcades, forks, coping, roofs.
3. arches — five arches with lace and lamps.
4. courtyard — pools, rims, walks, fountains, helix, promenades, stair, plaza paving.
5. dome — IMAX dome and porch.
6. fittings — doors, glazing, banners, lamps, trees.

## Notes
Build order matters: courtyard before arches (plinths on rims). Keep every part inside x0..144 z0..177 y≤50. Light every interior (lamplighter). Facade ribs and arch ribs only through `arch` brush, never by hand.
```

### elements.md

```markdown
# REQUIRED ELEMENTS — Pacific Science Center (plot 0, 145x178, y 0..50)
Each: construction / coords / part / vocab. All ids 1.21.1-checked (`chain`, not iron_chain).

- [ ] **Five white lace arches** (A1 24..38×100..109 to y47; A2 8..20×86..93 y41; A3 42..54×86..93 y41; A4 10..23×124..131 y44; A5 40..53×124..131 y44). Each = two parallel pointed-arch frames (z-ends). 2x2 `white_concrete` legs with `smooth_quartz` band every 6 y; above the spring a 2-wide pointed rib of `smooth_quartz` with `smooth_quartz_stairs` on the outer steps; inner smaller pointed arch + 2 diagonal braces per leg in `end_rod` lines with `smooth_quartz_slab` nodes; z-ties of `end_rod` every 4 y; X lattice ceiling at crown. Part: arches. Vocab: `arch_frame`, `arch_lace`, `arch_ties`, `arch_leg`.
- [ ] **Hanging globe lamps** 2 per arch: `chain`(axis y) x4 + hanging `lantern` under the tie 6 below crown. Part: arches. Vocab: `globe_lamp`.
- [ ] **Reflecting pools** (4) water 1 deep at y1, rim `smooth_quartz` full blocks y1 (rim x8/29/34/55, z82/110/115/152), 4x4 leg plinths. Part: courtyard. Vocab: `pool`, `leg_plinth`.
- [ ] **Walkways**: central N–S walk x30..33, E–W walk z111..114, perimeter, all `smooth_quartz_slab` bottom. Part: courtyard. Vocab: `walk`.
- [ ] **Fountains** (3 bowls): `quartz_pillar` pedestal y1..2, ring of `smooth_quartz_stairs` (facing out, upside-down none) + slabs at y3 as 5x5 saucer, `water` source y4 centre. Part: courtyard. Vocab: `fountain_bowl`.
- [ ] **Helix sculpture** x45..47 z102..104 y1..12: two `iron_block` strands rotating 90° per 2 y, `light_gray_concrete` rungs. Part: courtyard. Vocab: `helix`.
- [ ] **Lattice-walled ring buildings**: low wings (y1..20) and tall blocks (y1..28) of `white_concrete` panels with `quartz_pillar` ribs every 4th cell 1 proud, recessed lancets (`calcite` back + upside-down `smooth_quartz_stairs`), fork band. Part: shell then facade. Vocab: `lattice_bay`, `lancet`, `fork_arch`, `tall_fork`.
- [ ] **Open pointed-arch arcade/loggia** (3 deep) on courtyard faces with piers, shoulders, `calcite` back wall + `gray_stained_glass_pane`. Part: facade. Vocab: `arcade_bay`.
- [ ] **Elevated promenade decks** y10 `smooth_quartz_slab`(top), `diorite_wall` railing y11, `quartz_pillar` columns, side stair x52..53. Part: courtyard. Vocab: `promenade`, `promenade_stair`.
- [ ] **IMAX white dome** Ø36 at centre (19.5,35.5): drum y1..5, hemisphere r18 `white_concrete` via `dome` brush, 8 `smooth_quartz` meridians, 3x3 cap y23; porch x17..22 z54..56 with `sea_lantern` soffit; "IMAX" blue banners. Part: dome. Vocab: `dome_ribbed`, `porch`.
- [ ] **Name band** "PACIFIC SCIENCE CENTER" blue banners/white letters, x39 hung on face x40, z30..53, y12..13 via `bannerWord` face west; two tall blue banners at z44 & 48. Part: fittings. Vocab: `name_band`.
- [ ] **Doors & glazing**: `iron_door` pairs at every OPENING; `gray_stained_glass_pane` in blind arcades and every 3rd lancet. Part: fittings. Vocab: `door_pair`, `glaze_bay`.
- [ ] **Lighting (no spawns)**: lamp posts (`quartz_pillar`/`diorite_wall` post + `lantern`/`end_rod`) every 8 along walks; interior `lantern`s hung in every hall; `sea_lantern` in floor-ceilings; roof decks lit by lanterns on parapet. Part: fittings. Vocab: `lamp_post`.
- [ ] **Poplar rows**: `grass_block` bed + `birch_log` 8..12 + narrow `birch_leaves` (persistent). Part: fittings. Vocab: `poplar`.
- [ ] **Parapet coping + rib finials** on both roof levels. Part: facade. Vocab: `coping_run`.
```

### rooms.json

```json
{"entrance":[39,1,46],"street":null,"entrances":null,"rooms":[{"name":"main lobby and exhibit hall","box":[41,1,25,142,9,50]},{"name":"B upper exhibit floor","box":[41,11,25,142,17,50]},{"name":"planetarium and labs","box":[41,19,25,134,25,58]},{"name":"N1 north hall","box":[85,1,1,130,9,22]},{"name":"E wing exhibit halls","box":[64,1,77,130,9,158]},{"name":"E wing upper halls","box":[61,11,77,130,17,158]},{"name":"S wing halls","box":[1,1,164,130,9,170]},{"name":"IMAX theatre","box":[3,1,19,36,22,52]}]}
```

### palette.json

```json
{
  "roles": {
    "body": ["white_concrete"],
    "ribs": ["quartz_pillar"],
    "arch_stone": ["smooth_quartz", "smooth_quartz_stairs", "smooth_quartz_slab"],
    "recess": ["calcite"],
    "coping_walk": ["smooth_quartz_slab"],
    "lattice": ["end_rod", "smooth_quartz_slab"],
    "railing": ["diorite_wall"],
    "glass": ["gray_stained_glass_pane"],
    "doors": ["iron_door"],
    "roof_deck": ["light_gray_concrete"],
    "lamps": ["lantern", "chain", "sea_lantern", "end_rod"],
    "water": ["water"],
    "helix": ["iron_block", "light_gray_concrete"],
    "accent": ["blue_banner", "white_banner", "blue_wall_banner", "white_wall_banner"],
    "trees": ["birch_log", "birch_leaves", "grass_block"],
    "ground": ["smooth_stone"]
  },
  "objects": []
}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: node build.mjs writes a temp file, which then replaces build.nbt.
set -e
cd "$(dirname "$0")"
tmp=$(mktemp ./build.XXXXXX)
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
chmod 644 "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// The Pacific Science Center: the site grid, the ground, then every part in plan.md order. Usage: node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, PLOT, GROUND_Y, SMOOTH_STONE } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// Parts in build order (the stair joiner before any room; the rooms last, furnished around the finished building).
const PARTS = [
  ["shell", "parts/shell.mjs"],
  ["Stairs and ladders", "parts/stairs.mjs"],
  ["facade", "parts/facade.mjs"],
  ["courtyard", "parts/courtyard.mjs"],
  ["arches", "parts/arches.mjs"],
  ["dome", "parts/dome.mjs"],
  ["fittings", "parts/fittings.mjs"],
  ["room: main lobby and exhibit hall", "parts/room-1.mjs"],
  ["room: B upper exhibit floor", "parts/room-2.mjs"],
  ["room: planetarium and labs", "parts/room-3.mjs"],
  ["room: N1 north hall", "parts/room-4.mjs"],
  ["room: E wing exhibit halls", "parts/room-5.mjs"],
  ["room: E wing upper halls", "parts/room-6.mjs"],
  ["room: S wing halls", "parts/room-7.mjs"],
  ["room: IMAX theatre", "parts/room-8.mjs"],
];

const g = new Grid(SITE, { dataVersion: DATA_VERSIONS["1.21.1"] });
g.fill([PLOT.x0, GROUND_Y, PLOT.z0], [PLOT.x1, GROUND_Y, PLOT.z1], SMOOTH_STONE);

// A part whose file is not there yet is skipped (its worker hasn't written it); a part that exists must build.
const list = [];
for (const [name, module] of PARTS) {
  if (!existsSync(module)) { console.log(`part ${name}: ${module} not written yet, skipped`); continue; }
  list.push([name, (await import(`./${module}`)).build]);
}

// The roof sits on the shell's walls: while the shell is still a stub there is nothing to roof and runParts would throw,
// so the roof waits. roof.json is already written for the workers; it lays as soon as the shell builds something.
const shellModule = PARTS[0][1];
let roofed = false;
if (existsSync(shellModule)) {
  const probe = new Grid(SITE, { dataVersion: DATA_VERSIONS["1.21.1"] });
  probe.fill([PLOT.x0, GROUND_Y, PLOT.z0], [PLOT.x1, GROUND_Y, PLOT.z1], SMOOTH_STONE);
  await (await import(`./${shellModule}`)).build(probe);
  roofed = [...probe].some((c) => c.pos[1] > GROUND_Y);
}
if (!roofed) console.log("roof: waiting for the shell's walls (roof.json lays once the shell builds)");

runParts(g, list, { palette: "palette.json", roof: roofed ? "roof.json" : undefined });
g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for the Pacific Science Center kit: palette block ids, site coordinates from plan.md, and a seeded rng.

// Block ids (palette.json only; 1.21.1 names)

// Block ids (palette.json only; 1.21.1 names)
export const WHITE_CONCRETE = "white_concrete";                   // wall panels and bodies

export const QUARTZ_PILLAR = "quartz_pillar";                     // ribs, piers, finials (axis y)

export const SMOOTH_QUARTZ = "smooth_quartz";                     // arches, crowns, plinths, string courses, pool rims

export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";       // arch curves, shoulders, fork steps

export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";           // walks, decks, coping, lattice nodes

export const CALCITE = "calcite";                                 // recess backs (shadow tone)

export const END_ROD = "end_rod";                                 // arch lattice runs, lamp lines

export const DIORITE_WALL = "diorite_wall";                       // promenade railings

export const GRAY_STAINED_GLASS_PANE = "gray_stained_glass_pane"; // glazing

export const IRON_DOOR = "iron_door";                             // door pairs

export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";         // roof deck (hidden); helix rungs

export const LANTERN = "lantern";                                 // hung lamps

export const CHAIN = "chain";                                     // lamp chains (1.21.1 name)

export const SEA_LANTERN = "sea_lantern";                         // dome porch soffit

export const WATER = "water";                                     // pool and fountain water

export const IRON_BLOCK = "iron_block";                           // helix strands

export const BLUE_BANNER = "blue_banner";                         // accent banners (standing)

export const WHITE_BANNER = "white_banner";                       // banner letters (standing)

export const BLUE_WALL_BANNER = "blue_wall_banner";               // accent banners (on a wall)

export const WHITE_WALL_BANNER = "white_wall_banner";             // banner letters (on a wall)

export const BIRCH_LOG = "birch_log";                             // tree trunks

export const BIRCH_LEAVES = "birch_leaves";                       // tree crowns (persistent)

export const GRASS_BLOCK = "grass_block";                         // planting beds

export const SMOOTH_STONE = "smooth_stone";                       // the given ground layer at y 0

// Site (plan.md): the plot is x 0..144, z 0..177, y 0..50 (inclusive); the grid is that size
export const SITE = [145, 51, 178];

export const PLOT = { x0: 0, z0: 0, x1: 144, z1: 177, y1: 50 };

export const GROUND_Y = 0;                                        // smooth_stone ground

export const WALK_Y = 1;                                          // walk surface (every building's ground floor)

export const ENTRANCE = [39, 1, 46];                              // main entrance outside cell (west face of B)

// Masses (inclusive boxes [x0, y0, z0, x1, y1, z1]): tall blocks and low wings
export const MASS = {
  N1: [84, 1, 0, 131, 28, 23],                                    // north block (tall lattice box)
  N1_STAIR_BAY: [80, 1, 8, 83, 19, 15],                           // low entry and stair bay, N1's west side
  B: [40, 1, 24, 143, 28, 51],                                    // main tall block; west face x 40 fronts the plaza
  B_PRIME: [40, 1, 52, 135, 28, 59],                              // tall block stepped back east
  B2: [40, 1, 60, 131, 20, 75],                                   // courtyard-north wing (low)
  E: [60, 1, 76, 131, 20, 159],                                   // east wing (low)
  S: [0, 1, 160, 131, 20, 171],                                   // south wing (low)
  S_TAIL: [0, 1, 172, 59, 20, 175],                               // south tail
  S_TAIL_END: [0, 1, 176, 55, 20, 177],                           // south tail end
  W_STUB: [0, 1, 140, 3, 20, 159],                                // west-wing stub at the plot edge
};

// Roof levels: tall blocks deck at 26 (coping 27, rib finials 28); low wings deck at 18 (coping 19, finials 20)
export const ROOF_Y = { tallDeck: 26, tallCoping: 27, tallTop: 28, lowDeck: 18, lowCoping: 19, lowTop: 20 };

// Promenade decks (elevated walkways, floor y 10, railing y 11)
export const PROMENADE = {
  E: [57, 10, 76, 59, 10, 156],                                   // east deck, columns at x 59, z 80+8k
  S: [4, 10, 157, 59, 10, 159],                                   // south deck, columns at z 157, x 8+8k
  stair: [52, 1, 148, 53, 10, 156],                               // promenade stair (side flight, not the main way in)
};

// Courtyard: pools (water 1 deep at y 1, rim smooth_quartz), fountain bowls, helix, walks
export const POOLS = {
  NW: [8, 82, 29, 110],                                           // [x0, z0, x1, z1], rim included
  NE: [34, 82, 55, 110],
  SW: [8, 115, 29, 152],
  SE: [34, 115, 55, 152],
};

export const FOUNTAINS = {
  NW: { cx: 16, cz: 103, box: [14, 1, 101, 18, 4, 105] },         // pedestal, saucer and water source at y 4
  SW: { cx: 17, cz: 143, box: [15, 1, 141, 19, 4, 145] },
  SE: { cx: 46, cz: 143, box: [44, 1, 141, 48, 4, 145] },
};

export const HELIX = [45, 1, 102, 47, 12, 104];                   // double helix in the NE pool

export const WALK = {
  central_ns: [30, 1, 76, 33, 1, 159],                            // central N-S walk under the tallest arch
  central_ew: [4, 1, 111, 59, 1, 114],                            // central E-W walk
};

// Arches A1..A5 (arch plane = x-y). Legs are 2x2 at the listed corners; straight to `springY`, ribs above it.
export const ARCHES = {
  A1: { box: [24, 1, 100, 38, 47, 109], legs: [[24, 100], [37, 100], [24, 108], [37, 108]], springY: 30, crownY: 47 },
  A2: { box: [8, 1, 86, 20, 41, 93], legs: [[8, 86], [19, 86], [8, 92], [19, 92]], springY: 26, crownY: 41 },
  A3: { box: [42, 1, 86, 54, 41, 93], legs: [[42, 86], [53, 86], [42, 92], [53, 92]], springY: 26, crownY: 41 },
  A4: { box: [10, 1, 124, 23, 44, 131], legs: [[10, 124], [22, 124], [10, 130], [22, 130]], springY: 28, crownY: 44 },
  A5: { box: [40, 1, 124, 53, 44, 131], legs: [[40, 124], [52, 124], [40, 130], [52, 130]], springY: 28, crownY: 44 },
};

// Lamp posts every 8 along the walks; the lamp-post columns of the promenade
export const LAMP_POST_X = [5, 30, 33];                           // x of the lamp-post lines (z 80..156, every 8)

// IMAX dome: centre (19.5, 35.5), drum y 1..5 (r 18), hemisphere to a 3x3 cap at y 23
export const DOME = { cx: 19.5, cz: 35.5, drumR: 18, drumY1: 5, capY: 23, box: [2, 1, 18, 37, 23, 53] };

export const DOME_PORCH = [17, 1, 54, 22, 5, 56];                 // flat-roofed porch on the dome's south side

export const DOME_ENTRANCE = [18, 1, 53, 21, 3, 54];              // dome entrance through the porch

// Openings the shell leaves as air (inclusive boxes), so later parts can fill them
export const OPENINGS = {
  main_entrance: [40, 1, 45, 40, 3, 48],                          // west x 40, 4 wide, iron door pairs
  b_second_entrance: [40, 1, 30, 40, 2, 31],
  n1_north_door: [106, 1, 0, 109, 3, 0],
  n1_stair_bay_door: [80, 1, 11, 80, 2, 12],
  e_loggia_doors: [[63, 1, 89, 63, 2, 90], [63, 1, 113, 63, 2, 114], [63, 1, 137, 63, 2, 138]],
  s_loggia_doors: [[14, 1, 163, 15, 2, 163], [30, 1, 163, 31, 2, 163], [46, 1, 163, 47, 2, 163]],
  b2_loggia_door: [49, 1, 72, 50, 2, 72],
  promenade_doors: [[60, 11, 101, 60, 12, 102], [60, 11, 125, 60, 12, 126], [22, 11, 160, 23, 12, 160], [38, 11, 160, 39, 12, 160]],
  e_service_door: [131, 1, 116, 131, 2, 117],
};

// Stairs between floors (plan.md): N1 stair bay, B (lobby to upper floors), E wing
export const STAIRS = {
  n1_bay: [80, 1, 8, 83, 19, 15],
  b_main: [41, 1, 25, 44, 25, 34],                                // x 41..44 z 25..34, west wall
  e_wing: [128, 1, 77, 130, 19, 90],
  promenade: PROMENADE.stair,
};

// Room boxes (inner air, inclusive): the interior designers' rooms, from rooms.json
export const ROOM_BOX = {
  lobby: [41, 1, 25, 142, 9, 50],                                 // main lobby and exhibit hall
  b_upper: [41, 11, 25, 142, 17, 50],                             // B upper exhibit floor
  planetarium: [41, 19, 25, 134, 25, 58],                         // planetarium and labs
  n1_hall: [85, 1, 1, 130, 9, 22],                                // N1 north hall
  e_exhibit: [64, 1, 77, 130, 9, 158],                            // E wing exhibit halls
  e_upper: [61, 11, 77, 130, 17, 158],                            // E wing upper halls
  s_halls: [1, 1, 164, 130, 9, 170],                              // S wing halls
  imax: [3, 1, 19, 36, 22, 52],                                   // IMAX theatre
};

// A seeded rng: rng(seed)() returns a float in [0, 1), the same sequence for the same seed (mulberry32)
export function rng(seed)
```

### vocab/h1.mjs

```js
// Part helpers for the Pacific Science Center (plan.md VOCABULARY, first eight). Each one takes its position as
// arguments and writes only into air inside its own footprint, so a worker can't put a block into an earlier part's
// ground, floor or wall. Block ids are plan.md PALETTE literals (1.21.1).
//
// Skin helpers: `face` is the outward direction of the wall ("north" = the wall faces -z). `origin` is the skin cell at
// tangent index 0 on the panel plane (normal 0); normal +1 is one block proud of the panels, normal -1 is inside.

// A 4-cell bay on a skin wall: a quartz_pillar rib at tangent 0 (one proud of the panels), white_concrete panels at
// tangents 1..3, and a lancet in the middle panel (tangent 2) from one block above the base to two below the top.
// Footprint: tangents 0..3, normals -1..1, heights origin.y .. origin.y+h-1.
export function lattice_bay(g, face, origin, h, { glazed = false } = {})

// A Y-shaped split of a rib, four rows from origin.y: a quartz_pillar stem at tangent 0 (rows 0..1, proud like the
// rib), then in rows 2 and 3 smooth_quartz_stairs stepping out one block per row on each side, backs toward the stem.
// Footprint: tangents -2..2, normals 0..1, heights origin.y .. origin.y+3. (Forks meeting at a point is not built here.)
export function tall_fork(g, face, origin)

// One 2x2 white_concrete leg standing on a plinth at y1, carried up to height h, with a smooth_quartz band around it
// at y 7, 13, 19 and 25. Footprint: x..x+1, y 2..h, z..z+1.
export function arch_leg(g, x, z, h)

// The lace between the two frames of an arch: at every fourth row from spring to crown, a row of end_rod along z
// between smooth_quartz nodes at the centre line, and an X of end_rods across the crown.
// arch = { x0, x1, z0, z1, spring, crown }: frames are two blocks deep at z0 and at z1.
// Footprint: x0..x1, spring..crown, z0..z1.
export function arch_ties(g, arch)

// A 4x4 smooth_quartz plinth at y1 under an arch leg, from x..x+3, z..z+3. Footprint: that 4x4 at y1.
export function leg_plinth(g, x, z)

// An elevated promenade over a walk: smooth_quartz_slab (top) deck at y10 across box = [x0, z0, x1, z1], a
// diorite_wall railing at y11 round its edge (joined to the neighbouring railing cells), and quartz_pillar columns
// at y1..9 under the listed [x, z] cells. Footprint: the box, y1..11.
export function promenade(g, [x0, z0, x1, z1], columns = [])

// A flat-roofed porch on box = [x0, z0, x1, z1]: solid back wall (z0 row) of white_concrete to y4, quartz_pillar
// columns at the two front corners (z1), a smooth_quartz_slab roof at y5, sea_lantern soffit at y4, and two standing
// blue banners on the front at y1 (facing south). Footprint: the box, y1..5.
export function porch(g, [x0, z0, x1, z1])

// A glazed bay of gray_stained_glass_pane, w wide along the wall and h high, on the panel plane (normal 0), with
// panes joined to their neighbours across the wall. Footprint: tangents 0..w-1, normal 0, heights origin.y..origin.y+h-1.
export function glaze_bay(g, face, origin, { w = 3, h = 6 } = {})
```

### vocab/h2.mjs

```js
// Pacific Science Center vocabulary, second set (plan.md VOCABULARY). Each helper takes its position (and facing) as
// arguments and writes only inside its own footprint, only into air. A refused write is returned, never forced.
// Nothing is written at y 0 (the given ground); y 1 is the courtyard floor, which the paving leaves empty where a
// reserved part stands. States are the 1.21.1 ones (mcd states).

/**
 * Pointed lancet in a lattice panel. cell: [x, z] of the outer (panel-plane) cell; face: the way the wall faces.
 * The lancet is recessed one cell: y0..y1-1 is the opening (air, or a pane when glazed), its back is calcite one cell
 * inward, and the top cell at y1 is an upside-down stair facing into the wall. Footprint: the two columns, y0..y1.
 */
export function lancet(g, cell, face, y0, y1, glazed = false)

/**
 * Open pointed-arch arcade bay, 3 deep, on a courtyard face. at: [x, z] of the pier on the face line (depth 0);
 * the bay is 4 cells along the face (pier + three-wide opening) and `depth` deep, with the back screen at depth
 * `depth`. Piers y1..9, openings air y1..8 with upside-down stair shoulders at y7..8, spandrel white_concrete y9,
 * back screen gray_stained_glass_pane y1..7 and calcite y8..9. The shell leaves the screen cells as air.
 */
export function arcade_bay(g, face, [x, z], depth = 3)

/**
 * Pointed arch rib (the 2-wide curved frame above a leg pair), in the x-y plane, 1 thick in z. x0..x1 is the outer
 * span (the legs' outside edges), z its row, spring the y where the straight legs stop, crown the apex. The arch
 * brush builds the free-standing frame (voussoir ring, 2 thick, and stairs on the curve steps); its void is left air.
 */
export function arch_frame(g, { x0, x1, z, spring, crown })

/**
 * Hanging globe lamp under a cross tie at [x, y, z]: a 4-long chain under the tie, then a hanging lantern. The tie
 * must be solid (a lamp with nothing above it is refused whole).
 */
export function globe_lamp(g, x, y, z)

/**
 * Fountain bowl centred on [cx, cz], 5x5, y1..4: a quartz pillar pedestal (y1..2), a saucer at y3 (stairs on the
 * edges facing the centre, slabs on the corners and the 3x3 middle), and a water source at y4 over the centre.
 */
export function fountain_bowl(g, cx, cz)

/**
 * Promenade flight, 2 wide: columns x0..x0+1, one step per cell from z0 (the foot, y1) to z1 (the head), rising to the
 * south (facing south). Each step stands on smooth_quartz that fills down to the floor, so the flight is solid.
 */
export function promenade_stair(g, x0, z0, z1)

/**
 * The name on the plaza face: one wall banner per letter, blue banners with white letters, on the column x, row y,
 * from z0 to z1. face is the way the board looks (the banners point that way, hung on the wall behind them).
 */
export function name_band(g, { x, y, z0, z1, face = "west", word = "PACIFIC SCIENCE CENTER" })

/** Lamp post on a walk: quartz pillar y1..2 with a standing lantern on top at y3. One column. */
export function lamp_post(g, x, z)
```

### vocab/h3.mjs

```js
// Eight helpers from plan.md's VOCABULARY: fork_arch, coping_run, arch_lace, pool, helix, dome_ribbed, door_pair, poplar.
// Each takes its position (and facing, where it has one) as arguments. A helper writes only inside its own footprint,
// and only into air or into cells it wrote itself (so a cap can replace its own dome cells); anything it must skip is
// returned in `refused`, never thrown. { over: true } in the last argument also allows replacing a non-air block
// inside the footprint. Returns { placed, refused }.

/** 1. Fork of a 3-wide panel on y: (x, y, z) is the panel's first cell on the face line; face = north|south runs it along x, east|west along z.
 *  Two upside-down smooth_quartz_stairs lean on the panel edges, smooth_quartz over the centre. */
export function fork_arch(g, facing, x, y, z, opts = {})

/** 2. Coping on the perimeter of box = [x0, z0, x1, z1]: smooth_quartz_slab at y, a quartz_pillar finial at y+1 on each
 *  rib (every 4th cell from the west/north corner; the corners are always ribs). */
export function coping_run(g, [x0, z0, x1, z1], y, opts = {})

/** 3. Lace inside one arch frame in its plane z: frame = { x0, x1, z, spring, crown } (the same object as arch_frame).
 *  An inner pointed arch inset 2 and 2 under the crown; two end_rod braces from each leg's inner corner to the inner arch,
 *  with smooth_quartz_slab nodes where they meet it. */
export function arch_lace(g, { x0, x1, z, spring, crown }, opts = {})

/** 4. Pool with its rim: box = [x0, z0, x1, z1] (rim cells on the edge), at surface y. Rim smooth_quartz, water inside. */
export function pool(g, [x0, z0, x1, z1], y, opts = {})

/** 5. Double helix in the 3x3 at (x, z) (its min corner): two iron_block strands a quarter turn every two rows, with
 *  a light_gray_concrete rung across the middle on odd rows. y = base (default 1), height default 12. */
export function helix(g, x, z, { y = 1, height = 12, ...opts } = {})

/** 6. IMAX dome at center = [cx, y, cz] (the drum's base, y = 1 in the plan): hollow white_concrete drum (5 high, a
 *  smooth_quartz course on its top layer), hollow hemisphere of radius 18 from the drum's top to a 3x3 smooth_quartz cap
 *  at y + 22 (y23), and 8 smooth_quartz meridians from the drum to the cap, laid over the dome's own shell cells. */
export function dome_ribbed(g, [cx, y, cz], opts = {})

/** 7. Double iron door, both halves of both leaves. (x, y, z) is the lower cell of the leaf on the viewer's left as the
 *  viewer faces the door from outside; the second leaf is one step to the viewer's right. facing = the way the door faces (out). */
export function door_pair(g, [x, y, z], facing, opts = {})

/** 8. Poplar: a one-cell grass_block planting bed at (x, y, z) (y default 1), a birch_log trunk of h blocks above it, and a
 *  narrow crown of persistent birch_leaves: a ring 3 under the top, pluses at the next two levels and at the top, a tip above. */
export function poplar(g, x, z, h, { y = 1, ...opts } = {})
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

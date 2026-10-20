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
- Shell done: union-of-masses shell; loggia cells (E x60..63, S z160..163, B2 z72..75, y1..9) are AIR incl. the back-screen line (x63/z163/z72) for facade piers+glazing; shell walls y1..26 tall / y1..18 low (deck = top cell, light_gray_concrete); floors smooth_quartz at y10/y18; W stub has no y10 floor. Stair flights not cut (stairs part). roof.json now keeps everything but the N1 stair bay (the roof tool fought the shell's decks); coping/parapets are the facade's.
- stairs part: B flights x41..42 z25..34 (y1->10) and x43..44 z25..32 (y11->18); E flight x128..130 z77..87 (y1->10); no rails.

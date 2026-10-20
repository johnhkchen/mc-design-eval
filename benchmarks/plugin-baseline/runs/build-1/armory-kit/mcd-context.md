# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# Seattle Center Armory + Chihuly Garden and Glass — architect's plan

All coordinates are GLOBAL kit coordinates (plot 0 starts at x 0, plot 1 at x 221, plot 2 at x 253); north = low z, east = high x.
Ground: y 0 is the 1-block smooth_stone ground. Every building replaces y 0 inside its own walls with its floor block, so
**ground floors are at y 0 and every door threshold is flush with the outside** (no step at any door). Walls are 2 thick
unless noted: the outer cell is the frame/pier plane, glass sits 1 back (recessed by exclusion).

## SITE

| plot | x | z | y max | the building |
|---|---|---|---|---|
| 0 | 0..220 | 0..148 | 41 (roof ≤ 39) | the Armory (west), the glass-and-white pavilions and galleria (east), lawn in the open north-east |
| 1 | 221..252 | 0..47 | 22 (≤ 21 used) | the Glasshouse: a skewed pointed glass vault with the Chihuly flower hanging inside |
| 2 | 253..296 | 0..104 | 17 (≤ 15 used) | the Galleries: low dark gallery, green roof, CHIHULY sign band at the north entrance |

### Plot 0 masses

| mass | x | z | y | notes |
|---|---|---|---|---|
| A North head block (4 storeys) | 0..107 | 4..35 | 0..31 | corner pavilions A-W x0..11 and A-E x96..107 stand on the z 4 line; the centre x12..95 has its wall plane at z 5 (recessed 1: z 4 stays air above the plinth) |
| A0 North entrance porch | 60..63 | 0..4 | 0..6 | 4 corner posts, flat canopy at y 5, fascia y 6; leads to doors in the z 5 wall |
| B Food hall (main body) | 4..103 | 36..131 | 0..31 | 4 storeys tall outside; inside a full-height atrium + 3-floor side aisles |
| B-M1 roof monitor west | 28..39 | 44..123 | 29..36 | glass clerestory on the roof deck, skylight top |
| B-M2 roof monitor east | 68..79 | 44..123 | 29..36 | mirror of M1 about x 53.5 |
| C South glass wing | 0..123 | 132..143 | 0..31 | same height as A/B; its south face is the tall glass curtain wall facing the Space Needle |
| C1 South glazed vestibule | 4..111 | 144..147 | 0..7 | single-storey glass box along the foot of the curtain wall; main public doors |
| D East pavilion (2 storeys) | 136..207 | 96..119 | 0..15 | white panels + glass, flat roof |
| D1 kiosk bump | 208..211 | 100..103 | 0..8 | 1 storey |
| D2 east annex | 208..219 / 212..219 | 112..119 / 120..123 | 0..8 | 1 storey, L-shaped (both rects) |
| E Galleria (shops, café) | 104..199 / 104..171 / 108..123 | 120..123 / 124..127 / 128..131 | 0..7 | 1 storey glazed arcade linking B, C and D; three rects |
| E0 lightwell (open) | 104..107 | 128..131 | ground | the map's notch: paved courtyard, one small tree, a lamp post |
| L Lawn | 108..220 | 0..95 | ground | grass with a curving path (as the photo), plane-like trees in rows; paving round D and E |
| P South plaza strip | 0..123 | 148 | ground | paving; nothing taller than 1 |

The single map cell x 60..63 z 0..3 is the porch A0. Open ground x0..3 z36..131 and x104..107 z36..119 is a 4-wide
planting/paving strip along the hall.

### Plot 1 mass (Glasshouse)

The footprint runs diagonally (south end further east). The vault is built as **10 straight bays of 4 z each, the axis
stepping +1 x per bay**, with a white rib at every step so the step reads as a frame joint.

| bay k | z | axis x (cx) | glass span (cx−7 .. cx+7) |
|---|---|---|---|
| 0 | 4..7 | 231 | 224..238 |
| 1 | 8..11 | 232 | 225..239 |
| 2 | 12..15 | 233 | 226..240 |
| 3 | 16..19 | 234 | 227..241 |
| 4 | 20..23 | 235 | 228..242 |
| 5 | 24..27 | 236 | 229..243 |
| 6 | 28..31 | 237 | 230..244 |
| 7 | 32..35 | 238 | 231..245 |
| 8 | 36..39 | 239 | 232..246 |
| 9 | 40..43 | 240 | 233..247 |

Vault cross-section (same in every bay; dx = |x − cx|): the glass surface is the outermost cell at each y.

| y | 1 | 2..7 | 8..10 | 11..13 | 14..15 | 16..17 | 18 | 19 | 20 |
|---|---|---|---|---|---|---|---|---|---|
| dx | 7 (plinth) | 7 | 6 | 5 | 4 | 3 | 2 | 1 | 0 (ridge) |

| mass | x | z | y | notes |
|---|---|---|---|---|
| H Vault | per bay table | 4..43 | 0..20 | ridge y 20; lightning_rod finials at y 21 on the two end ribs only |
| H1 North vestibule | 233..240 | 0..3 | 0..6 | flat-roofed glass box, quartz frame; the entrance |
| H2 South vestibule | 233..236 | 44..47 | 0..5 | small glass exit box |
| Garden | rest of plot 1 | | ground | planting beds with glass sculptures (gardener) |

### Plot 2 masses (Galleries)

| mass | x | z | y | notes |
|---|---|---|---|---|
| G1 Main gallery | 257..296 | 12..91 (and 257..292 z 8..11) | 0..14 | one tall storey, flat green roof |
| G2 North entrance wing | 253..292 | 0..7 | 0..14 | the entrance face; recessed entrance bay x263..282 |
| G2r Entrance recess (air under the canopy) | 263..282 | 0..3 | 1..6 | glass wall at z 4; canopy slab y 7 over z 0..3 |
| G3 South café step | 261..296 / 269..296 | 92..95 / 96..103 | 0..10 | lower, also green-roofed |
| Garden | x253..256 z8..91; x253..268 z92..103; x293..296 z8..11 | | ground | planting strips with glass sculptures |

## ROOFS

| roof | form | height | how |
|---|---|---|---|
| A, B, C | flat deck + parapet (1930s moderne, no pitch) | deck y 28, parapet y 29..30, coping slab y 31 | `$MCD roof` style `flat-parapet` (the `modern` preset's form) with `y: 28`, `parapet: 2`, deck `smooth_stone`, coping `smooth_sandstone_slab`; `keep` = the two monitor rects; no iron rail |
| B-M1, B-M2 monitors | flat-topped glass clerestory boxes | walls y 29..34, skylight y 35, rim slab y 36 | BY HAND: smooth_quartz posts at every z = 44+4k and at z 123, glass between; skylight = glass inside a smooth_quartz perimeter; smooth_quartz_slab rim at y 36. The deck under each monitor (x29..38, z45..122, y 28) is left OPEN so daylight falls into the hall |
| Hall trusses | steel trusses under the deck | y 23..27 | BY HAND (no pitched roof for the tool): one truss every 8 z at z = 40+8k (k 0..11) spanning the atrium x 20..87; chords light_gray_concrete at y 27 and y 23, webs andesite_wall posts + iron_chain; visible through the south glass |
| C1 vestibule | flat glass roof | y 7 | BY HAND: smooth_quartz_slab rim, glass panes between quartz beams every 7 x |
| A0 porch | flat canopy | slab y 5, fascia y 6 | BY HAND |
| D | flat, thin modern fascia | deck y 14, parapet y 15 | `$MCD roof` preset `modern`, material white_concrete, coping light_gray_concrete; overhang 0 |
| D1, D2 | flat | deck y 7, parapet y 8 | same preset, same materials |
| E galleria | flat with a central glazed strip | y 6 (fascia) / skylight glass y 6 along its centre line | BY HAND: smooth_quartz deck edge, glass skylight 2 wide down each rect's middle |
| H Glasshouse | pointed glass vault (the building IS its roof) | ridge y 20 | BY HAND from the cross-section table |
| H1, H2 | flat glass | y 6 / y 5 | BY HAND, smooth_quartz_slab rim |
| G1, G2 | flat green roof | deck y 12 (moss_block), parapet y 13, coping y 14 | `$MCD roof` style `flat-parapet`, `y: 12`, `parapet: 2`, material moss_block; then planting on the deck (grass_block patches, azalea, flowering_azalea, short_grass) at y 13 only |
| G3 | flat green roof | deck y 9, parapet y 10 | same as G1 |

## FACADES

### Armory (A, B, C): cream concrete, chocolate bands, strip windows
Storey rhythm on every Armory face (floor lines y 0, 7, 14, 21; deck 28):

| y | role | material | depth |
|---|---|---|---|
| 1 | plinth course | polished_andesite | flush |
| 2..5 | ground-floor windows (4 high) | glass_pane | −1 |
| 8, 15, 22 | sill course under each upper strip | brown_terracotta | flush |
| 9..11, 16..18, 23..25 | strip windows (3 high) | glass_pane | −1 |
| 27 | frieze band under the roof line (the strong top band) | brown_terracotta | flush |
| 29..30 | parapet | smooth_sandstone | flush |
| 31 | coping | smooth_sandstone_slab (bottom) | +0 |
| all other cells | body | smooth_sandstone | flush |

Window runs (glass 6 wide, period 8; the cream between runs are 2-wide piers):

| face | plane | runs |
|---|---|---|
| A north, centre | z 5 (recessed 1 from the pavilions) | x 15+8k .. 20+8k, k 0..9 (x 15..92) |
| A-W, A-E corner pavilions, north face | z 4 | one tall vertical slot 2 wide: x 5..6 and x 101..102, y 2..25 (glass_pane, −1), brown_terracotta cap y 26; no strips |
| A west / east ends | x 0 / x 107 | z 9+8k .. 14+8k, k 0..2 |
| B west | x 4 | z 41+8k .. 46+8k, k 0..10 (z 41..126) |
| B east | x 103 | same runs; below y 7 only z 41..118 (E covers z 120..131) |
| C west / east ends | x 0 / x 123 | one run z 135..140 |

South curtain wall (C, z 143), the hall's glass face to the Needle:

| part | x | y | material | depth |
|---|---|---|---|---|
| cream bookends | 0..8 and 115..123 | 1..30 | smooth_sandstone, with the storey sill courses and frieze carried across | flush (z 143) |
| mullions | x = 9+7k, k 0..15 (9..114) | 1..26 | smooth_quartz | z 143 (proud) |
| transoms | 10..113 between mullions | 7, 14, 21 | smooth_quartz | z 143 |
| glass | between mullions | 1..26 | glass_pane | z 142 (−1) |
| frieze over the glass | 9..114 | 27 | brown_terracotta | z 143 |
| parapet + coping | 9..114 | 28..31 | smooth_sandstone / slab | z 143 |

Behind C1 (x 9..111, y 1..6) the curtain is left out: the vestibule opens straight into the hall.
C1 vestibule faces (z 147, x 4 and x 111): smooth_quartz posts every 7 x / at corners, glass_pane between, roof rim y 7.

A0 porch: posts smooth_sandstone at (60,0),(63,0) z 0 corners y 1..4, canopy smooth_sandstone_slab y 5 over x 60..63 z 0..4,
fascia y 6 brown_terracotta with "ARMORY" banner letters (sign writer). Red accent: red_terracotta door surrounds at the
porch and at the B west door only.

### Pavilions D, D1, D2 and galleria E: white modern
| role | where | material | depth |
|---|---|---|---|
| piers | D north z 96 at x 136+7k (k 0..10) and x 207; D south/E faces same 7-period | white_concrete | flush |
| floor band | y 7 the full length | white_concrete | flush |
| glass | between piers, y 1..6 and y 8..13 | glass_pane | −1 |
| fascia/parapet | y 14..15 (D), y 7..8 (D1, D2), y 6 (E) | white_concrete, coping light_gray_concrete | flush |
| entrance canopy | D north, x 168..175, z 93..95, y 5 | red_concrete fascia over smooth_quartz_slab soffit | +3 (over paving, inside the plot) |
| base | y 1 | light_gray_concrete | flush |

### Glasshouse H
| role | where | material |
|---|---|---|
| plinth curb | y 1, the dx 7 cells of every bay | polished_blackstone |
| ribs (arch rings) | the full cross-section at z = 4, 8, 12, … 40 and 43 (each rib covers BOTH neighbouring bay profiles so the step is hidden) | smooth_quartz |
| purlins (longitudinal) | the surface cells at y 7, y 13 and the ridge y 20, every bay | smooth_quartz |
| panes | every other surface cell | glass (full blocks: the stepped surface needs them) |
| end walls (z 4, z 43) | pointed glass gables, quartz mullions every 3 x | glass + smooth_quartz |
| floor | inside, y 0 | polished_blackstone, sea_lantern inlays every 4 z at dx 5 both sides |

### Galleries G
| role | where | material | depth |
|---|---|---|---|
| plinth | y 1..2 all faces | deepslate_tiles | flush |
| body panels | y 3..11 | gray_concrete | flush |
| panel joints (fins) | every 6 along each face, y 1..11 | polished_deepslate | flush (colour + texture) |
| narrow slot windows | west face x 257 at z 20, 36, 52, 68, 84 (1 wide, y 3..9); east face x 296 same z | gray_stained_glass_pane | −1 |
| parapet / coping | y 13 / y 14 | deepslate_tiles / polished_deepslate_slab | flush |
| sign band | x 263..282, z 1, y 8..11 | black_concrete board | recessed 1 (z 0 left for the letters) |
| CHIHULY letters | banner letters hung in the z 0 plane, centred (x 269..275), y 9..10 | white letters on black (`bannerWord`, face north) | +0 |
| canopy | x 263..282, z 0..3, y 7 | polished_deepslate_slab (top) with sea_lantern downlights at z 2 every 4 x | — |
| entrance glass wall | x 263..282, z 4, y 1..6 | glass_pane between smooth_stone mullions every 4 x | recessed 4 |

## MATERIALS

All ids verified with `$MCD blocks --check` (all known; all exist in 1.21.1).

| role | block |
|---|---|
| Armory body (cream) | smooth_sandstone |
| Armory bands (chocolate) | brown_terracotta |
| Armory plinth | polished_andesite |
| Armory coping | smooth_sandstone_slab |
| Armory windows | glass_pane |
| curtain frame, monitors, vestibule frame | smooth_quartz, smooth_quartz_slab |
| Armory roof deck | smooth_stone |
| trusses | light_gray_concrete, andesite_wall, iron_chain |
| accent (doors, canopy) | red_terracotta (Armory), red_concrete (pavilion) |
| pavilion panels / base / coping | white_concrete / light_gray_concrete / light_gray_concrete |
| Glasshouse frame | smooth_quartz |
| Glasshouse glass | glass |
| Glasshouse curb / floor | polished_blackstone, sea_lantern |
| Chihuly flower | red_stained_glass, orange_stained_glass, yellow_stained_glass, glass, shroomlight (light), end_rod |
| Galleries body | gray_concrete |
| Galleries plinth / fins / coping | deepslate_tiles / polished_deepslate / polished_deepslate_slab |
| Galleries sign board | black_concrete; letters white banners |
| green roof | moss_block, grass_block, azalea, flowering_azalea, short_grass |
| ground: paving / lawn | smooth_stone (as given), polished_andesite paths; grass_block lawn, oak/birch trees (persistent leaves) |

## OPENINGS

Doors are 2-high pairs (both halves), threshold at y 1 on the y 0 floor, flush with the ground outside.

| building | opening | where | size |
|---|---|---|---|
| A | north main doors (under the porch) | x 60..63, z 5, y 1..3 | 4 wide (2 double doors), birch_door |
| A | ground-floor shop windows | the north window runs at y 2..5 | as FACADES |
| B | west side doors | x 4, z 85..86, y 1..3 (inside a ground-floor run, replacing its glass) | 2 wide, red_terracotta surround |
| C1 | south public doors | z 147, x 24..27, x 56..59, x 88..91, y 1..3 | 3 openings 4 wide, birch_door pairs |
| C1 | side doors | x 4 and x 111, z 145..146, y 1..3 | 2 wide |
| E | galleria north doors (to the lawn) | z 120, x 118..121, y 1..3 | 4 wide |
| E | galleria south doors (to the plaza) | z 127, x 146..149; z 123, x 184..187; y 1..3 | 4 wide each |
| E↔B | opening from galleria into the hall | x 103, z 122..129, y 1..5 | 8 wide open arch (no door) |
| D | north entrance under the red canopy | z 96, x 170..173, y 1..3 | 4 wide |
| D1, D2 | one door each | D1 x 211, z 101..102; D2 z 123, x 215..216 | 2 wide |
| H1 | Glasshouse entrance | z 0, x 236..237, y 1..3; inner opening z 4 x 236..237 y 1..3 | 2 wide |
| H2 | exit | z 47, x 234..235, y 1..3; inner z 43 x 234..235 | 2 wide |
| G2 | gallery entrance doors | z 4, x 270..275, y 1..3 | 3 door pairs |
| G3 | café garden door | z 103, x 280..283, y 1..3 | 4 wide |
| all glass faces | windows | per FACADES tables (runs, curtain, slots) | |

## RESERVED (the shell leaves these empty)

| what | cells |
|---|---|
| Chihuly flower (sculpture part) | inside H: for bays k 1..8 (z 9..38), all cells with |x − cx| ≤ 4 and y 10..17, plus iron_chain hangers on the axis from y 18 to 19 under the ridge every 4 z. The cloud is mostly orange, then red, then yellow stained glass with clear glass, shroomlights inside (≈1 per 40 cells) and end_rod spikes |
| hall atrium (open, no floors) | x 20..87, z 36..142, y 1..22 (trusses y 23..27 by hand) |
| roof light shafts under the monitors | x 29..38 and x 69..78, z 45..122, y 28 (deck left out) |
| Galleries door sculptures | (264..265, 1..2) and (280..281, 1..2) in x/z, y 1..6, under the canopy: stained-glass columns with end rods |
| garden sculptures | plot 2 garden x 253..268 z 92..103; plot 1 open ground east of the vault; 3–5 stained-glass/end_rod clusters each |
| sign band letters | G2 z 0, x 269..275, y 9..10; A0 fascia z 0, x 60..63, y 6 |
| E0 lightwell | x 104..107, z 128..131 (ground only) |

## FLOORS

| mass | floor y (storeys) | interior volume (inside 2-thick walls) | use (for the room designer) |
|---|---|---|---|
| A | 0, 7, 14, 21; deck 28 | x 2..105, z 6..33 (centre z 7..33) | ground: lobby + shops; upper: offices, classrooms, a theatre on 14–21 |
| B side aisles | 0, 7, 14, 21 | west x 6..19, east x 88..101, z 36..142 | aisles open to the atrium on each floor; railing at x 20 / x 87 |
| B atrium + C | 0 only, open to y 27 | x 20..87, z 36..142 (C x 2..121 z 132..142 open the same) | the food hall: food stalls round the edge, tables down the middle under the monitors |
| C1 | 0 | x 5..110, z 145..146 | entrance vestibule |
| D | 0, 7; deck 14 | x 138..205, z 98..117 | shops (ground), café/event room (upper) |
| D1, D2 | 0; deck 7 | D1 x 209..210 z 101..102; D2 x 210..217 z 114..121 | kiosk, restrooms |
| E | 0; roof 6 | the three rects minus walls | galleria shops + café |
| H | 0, single volume to the ridge | the vault | the Glasshouse, flower overhead; a ring path round the edge |
| H1, H2 | 0 | x 234..239 z 1..2; x 234..235 z 45..46 | vestibules |
| G1 + G2 | 0; deck 12 | x 255..294 z 2..5 (lobby, behind the glass), x 259..294 z 6..89 | lobby + shop (G2), galleries (G1, dark rooms) |
| G3 | 0; deck 9 | x 263..294 z 94..101 | café |

Light: every room to 8+, every outdoor path lamp-posted every 8–10 blocks, the roof decks and green roofs lit (lanterns
on the parapets), so nothing spawns.

---
# DESIGNER'S SECTIONS (below the architect's; do not alter anything above)

All ids are 1.21.1: use **`chain`** (the plan's iron_chain does not exist in 1.21.1; wherever the plan says iron_chain, build `chain`), and no concrete slabs exist: where a slab is wanted beside white/gray concrete use `smooth_stone_slab` or `smooth_quartz_slab`. Opening E↔B at x103: build only z122..127 (z128..129 belongs to the open lightwell E0).

## PALETTE
| role | block | variants |
|---|---|---|
| Armory body | smooth_sandstone | smooth_sandstone_stairs, smooth_sandstone_slab (coping, bottom) |
| Armory bands | brown_terracotta | (no slab; use full course) |
| Armory plinth | polished_andesite | polished_andesite_stairs, polished_andesite_slab |
| Windows | glass_pane, glass | gray_stained_glass_pane (Galleries slots), light_gray_stained_glass_pane |
| Frame / trim | smooth_quartz | smooth_quartz_slab, smooth_quartz_stairs |
| Roof deck / floors | smooth_stone | smooth_stone_slab |
| Trusses | light_gray_concrete, andesite_wall, chain | iron_bars (railings) |
| Accents | red_terracotta, red_concrete | |
| Pavilion | white_concrete, light_gray_concrete | |
| Doors | birch_door | birch_trapdoor, spruce_trapdoor |
| Glasshouse | glass, smooth_quartz, polished_blackstone, sea_lantern | lightning_rod |
| Flower | orange_stained_glass, red_stained_glass, yellow_stained_glass, glass, shroomlight, end_rod | chain |
| Galleries | gray_concrete, deepslate_tiles, polished_deepslate | polished_deepslate_slab, deepslate_tile_slab, deepslate_tile_stairs, black_concrete |
| Green | moss_block, grass_block, azalea, flowering_azalea, short_grass | flowering_azalea_leaves |
| Grounds | smooth_stone, polished_andesite, dirt_path, grass_block | oak_log, oak_leaves, birch_log, birch_leaves (persistent true), oak_fence, lantern, stained glass of red/orange/yellow/blue |
| Lighting | lantern, sea_lantern, shroomlight, end_rod | glowstone (only hidden) |
Checked with `$MCD blocks --check --version 1.21.1`: all known except iron_chain (use chain) and concrete slabs (avoid).

## VOCABULARY (named helpers; each takes a grid `g` first)
1. **bandedStorey(g, {x0,z0,x1,z1,face,y0=0})**: along one face: y1 polished_andesite; body smooth_sandstone; brown_terracotta at y8,15,22,27; parapet y29-30 smooth_sandstone; coping y31 smooth_sandstone_slab bottom. Windows are cut by stripWindowRun.
2. **stripWindowRun(g, {face, plane, from, to, y})**: 6-wide, 3-high glass_pane set 1 back from plane, with connection states along the wall, smooth_stone_slab (top) sill under it at y-1 on the plane; ground floor runs 4 high (y2..5).
3. **slotWindow(g, {x,z,face,y0,y1})**: 2-wide full-height pane slot, brown_terracotta cap.
4. **curtainWallBay(g, {x})**: one 7-wide bay of the south wall: smooth_quartz mullion at x (z143, y1..26), glass_pane x+1..x+6 at z142, transoms smooth_quartz at y7,14,21.
5. **doorPair(g, {x,z,face,width,surround})**: birch_door both halves (lower/upper, same facing/hinge, facing out), threshold at y1; surround red_terracotta if asked, else the wall.
6. **atriumRailing(g, {x,z0,z1,y})**: iron_bars one high with a gap at each stair top.
7. **roofMonitor(g, {x0,x1,z0,z1})**: smooth_quartz posts y29..34 at z=44+4k and 123; glass_pane between; perimeter smooth_quartz at y35 with glass inside; smooth_quartz_slab rim y36.
8. **steelTruss(g, {z,x0=20,x1=87})**: chords light_gray_concrete at y27 and y23; verticals andesite_wall every 6 x y24..26; diagonals as andesite_wall steps (1 y per 1 x) between; a `chain` hanger from the top chord down 1 at each vertical.
9. **copingParapet(g, ...)**: see bandedStorey rows 29-31 for decks without the tool.
10. **porchCanopy(g, {x0,z0})**: 4 smooth_sandstone posts y1..4, smooth_sandstone_slab canopy y5, brown_terracotta fascia y6, lanterns hanging under the slab.
11. **vestibuleGlassBox(g, {x0,z0,x1,z1,h})**: smooth_quartz corner posts + every 7, glass_pane between, smooth_quartz_slab rim, glass roof between beams.
12. **pavilionBay(g, {x,z,face,storeys})**: white_concrete pier every 7, y7 band, glass_pane between, light_gray_concrete y1 base, light_gray_concrete coping.
13. **redCanopy(g, {x0,x1,z0,z1})**: red_concrete fascia y5, smooth_quartz_slab soffit, 4 smooth_quartz posts, hanging lanterns.
14. **galleriaSkylight(g, {rect})**: glass strip 2 wide in smooth_quartz deck edge.
15. **vaultBay(g, {k})**: z=4+4k..7+4k, axis cx=231+k; for each y, glass at dx per table both sides, polished_blackstone curb y1, purlins smooth_quartz at y7,13,20, floor polished_blackstone + sea_lantern inlays.
16. **vaultRib(g, {z})**: the full cross-section in smooth_quartz at z; lightning_rod y21 on z4 and z43.
17. **vaultEndGable(g, {z})**: glass triangle with smooth_quartz mullions every 3 x.
18. **chihulyFlower(g, {bays, seed})**: random blob lumps (deterministic seed) in dx<=4, y10..17: ~55% orange_stained_glass, 25% red, 12% yellow, 8% glass; shroomlight 1/40; end_rod spikes 1-3 long outward on 1 in 12 outer cells; `chain` hangers at the axis y18-19 every 4 z.
19. **galleryFace(g, {face})**: deepslate_tiles y1-2, gray_concrete y3..11, polished_deepslate fin every 6 y1..11, parapet/coping.
20. **gallerySlotWindow(g, {x,z})**: 1-wide gray_stained_glass_pane y3..9 recessed 1.
21. **canopySlab(g, {...})**: polished_deepslate_slab top, sea_lantern at z2 every 4 x.
22. **signBand(g, {x0,x1,z,y0,y1,text})**: black_concrete board, `bannerWord(g,"CHIHULY",{center:[272,10,0],face:"north",letter:"white",base:"black"})`.
23. **greenRoofPatch(g, {x0,z0,x1,z1})**: on moss_block deck at y13: grass_block patches, azalea, flowering_azalea, short_grass on top; lanterns on parapet every 8.
24. **glassBlossom(g, {x,z,h,colors})**: stained-glass column 3..5 high of 2 colors with end_rod tip, on a polished_andesite base.
25. **planeTree(g, {x,z})**: oak_log axis y 5 high, oak_leaves persistent blob 5 wide, 2 high, uneven.
26. **lawnPath(g, {points})**: polished_andesite 2 wide curving between points, grass elsewhere.
27. **lampPost(g, {x,z})**: 3 oak_fence + lantern on top.

## ROOMS (inner air boxes; floors: ground smooth_stone unless noted)
Interior stairs (Armory, `flight()` facing south, 7 steps, top step flush): F1 x8..9 z8..14 y0->7 (cut floor y7 at z8..13); F2 x8..9 z16..22 y7->14 (cut y14 z16..21); F3 x8..9 z8..14 y14->21 (cut y21 z8..13); mirrors at x98..99. Doorways A<->B at x12..13 and x94..95, z34..35, y1..3 / 8..10 / 15..17 / 22..24. D stairs: x140..141 z99..105 y0->7 (cut y7 z99..104). The rest of stairs/ladders by the room designers must keep these clear.
Rooms are listed in the JSON answer. Interior walls of the Galleries: 1-thick gray_concrete partitions at z30 and z60 with 4-wide doorways at x274..277.

## PARTS
1. **P1 Armory shell** (masonry): A,B,C walls/floors (floors y7,14,21 only in A and the aisles), plinth, bands, strip windows, slots, curtain wall, doors, the stair holes and F1..F3. Vocab: bandedStorey, stripWindowRun, slotWindow, curtainWallBay, doorPair, atriumRailing. Leave atrium and the monitor shafts open.
2. **P2 Armory roof & porch**: roof tool flat-parapet, monitors, trusses, porch, C1 vestibule, fascia ARMORY letters, parapet lanterns. Vocab: roofMonitor, steelTruss, copingParapet, porchCanopy, vestibuleGlassBox.
3. **P3 Pavilions**: D, D1, D2, E, red canopy, galleria skylights, doors, roofs. Vocab: pavilionBay, redCanopy, galleriaSkylight, doorPair.
4. **P4 Glasshouse**: vault bays, ribs, gables, floor, vestibules H1/H2, the Chihuly flower, finials. Vocab: vaultBay, vaultRib, vaultEndGable, chihulyFlower, vestibuleGlassBox.
5. **P5 Galleries**: G1..G3 shells, partitions, slot windows, glass entrance, canopy, CHIHULY band, green roofs, door sculptures. Vocab: galleryFace, gallerySlotWindow, canopySlab, signBand, greenRoofPatch, glassBlossom.
6. **P6 Grounds & light**: lawn, paths, trees, plaza, lightwell, planting strips, garden sculptures, lamp posts across all three plots. Vocab: lawnPath, planeTree, lampPost, glassBlossom.

## CHECKLIST
- [ ] P1 shell  - [ ] P2 roof/porch  - [ ] P3 pavilions  - [ ] P4 glasshouse  - [ ] P5 galleries  - [ ] P6 grounds

## NOTES FOR WORKERS
- Stay in your plot, below the plot's y max. Every door threshold at y1 is flush with y0; no steps anywhere, so the way in meets the accessibility rule.
- Windows are 1 back by exclusion: do not place the front material there. Leave all openings and RESERVED cells as air.
- Glasshouse door at z0 is on the plot edge; keep H1's outer wall at z0 and its doors in that plane.
- Light: every room 8+, parapet lanterns, lamp posts every 8-10; check `$MCD light`.
- Use `chain`, not iron_chain; no pale oak or 1.21.4+ blocks.
```

### elements.md

```markdown
# REQUIRED ELEMENTS (checklist)  — 1.21.1 ids only: `chain` (NOT iron_chain), no concrete slabs (use smooth_stone_slab / smooth_quartz_slab)

Parts: P1 armory-shell, P2 armory-roof, P3 pavilions, P4 glasshouse, P5 galleries, P6 grounds.

| # | element | real construction (block by block) | coordinates | part | vocab |
|---|---|---|---|---|---|
| 1 | Armory cream concrete hall, 4 storeys | smooth_sandstone walls 2 thick, floor lines y0/7/14/21, deck 28 | A x0..107 z4..35; B x4..103 z36..131; C x0..123 z132..143 | P1 | bandedStorey |
| 2 | chocolate-brown horizontal bands | brown_terracotta course at y8,15,22 (sill) and y27 (frieze), full face length, flush | all Armory faces | P1 | bandedStorey |
| 3 | polished plinth | polished_andesite y1, polished_andesite_stairs not needed | all Armory faces | P1 | bandedStorey |
| 4 | strip windows | glass_pane (connected N/S or E/W states) 1 back, 3 high y9-11,16-18,23-25, ground y2-5; 6 wide, 2-wide piers; smooth_stone_slab (top) sill under each, smooth_sandstone_stairs (upside down) not needed | runs per plan FACADES | P1 | stripWindowRun |
| 5 | corner-pavilion tall slots | 2-wide glass_pane x5..6, x101..102 at z4, y2..25, brown_terracotta cap y26 | A-W / A-E | P1 | slotWindow |
| 6 | south glass curtain wall onto the Space Needle | smooth_quartz mullions x=9+7k y1..26 at z143, transoms y7,14,21, glass_pane at z142 (full-height panes), brown_terracotta frieze y27, bookends smooth_sandstone x0..8, 115..123 | C south z142/143 | P1 | curtainWallBay |
| 7 | food hall seen through the glass: atrium | open air x20..87 z36..142 y1..22, side-aisle floors at y7,14,21 (smooth_stone, edge smooth_quartz_slab), iron_bars railing y+1 at x20 / x87 | per FLOORS | P1 (shell) + room designers | atriumRailing |
| 8 | steel roof trusses | light_gray_concrete chords y27 & y23, andesite_wall webs (verticals + diagonals as stairs-free walls), `chain` hangers, every 8 z (z=40+8k) | x20..87 | P2 | steelTruss |
| 9 | roof monitors + skylights | smooth_quartz posts, glass_pane between, glass skylight y35, smooth_quartz_slab rim y36; deck below left OPEN | M1 x28..39, M2 x68..79, z44..123 | P2 | roofMonitor |
| 10 | flat roof, parapet, coping | `$MCD roof` flat-parapet y28, parapet smooth_sandstone y29-30, smooth_sandstone_slab y31 | A,B,C | P2 | copingParapet |
| 11 | North porch with ARMORY fascia | 4 smooth_sandstone posts, smooth_sandstone_slab canopy y5, brown_terracotta fascia y6, banner letters ARMORY, red_terracotta door surround, birch_door pairs | x60..63 z0..4 | P2 | porchCanopy, plaque |
| 12 | South glazed vestibule | quartz posts every 7 x, glass_pane, glass roof y7 w/ smooth_quartz_slab rim, 3 birch_door pairs | x4..111 z144..147 | P2 | vestibuleGlassBox |
| 13 | doors | birch_door both halves, flush at y0 (no step) | OPENINGS table | P1/P2 | doorPair |
| 14 | red accent only at porch + B west door | red_terracotta surround | x60..63 z5; x4 z85..86 | P1/P2 | doorPair |
| 15 | East pavilions D, D1, D2: white panels + glass | white_concrete piers every 7, floor band y7, glass_pane between, light_gray_concrete base y1 and coping, flat | D x136..207 z96..119 y0..15; D1; D2 | P3 | pavilionBay |
| 16 | red canopy over D entrance | red_concrete fascia y5 over smooth_quartz_slab soffit, 4 smooth_quartz posts | x168..175 z93..95 | P3 | redCanopy |
| 17 | Galleria arcade, glass skylight strip | quartz deck edge y6, glass 2 wide down each middle, glazed fronts | E rects | P3 | galleriaSkylight, pavilionBay |
| 18 | lightwell courtyard | polished_andesite paving, 1 oak tree, lamp post | x104..107 z128..131 | P6 | planeTree, lampPost |
| 19 | Glasshouse pointed glass vault | per-bay cross-section, `glass` surface, smooth_quartz ribs/purlins, polished_blackstone curb y1 | 10 bays z4..43 | P4 | vaultBay, vaultRib |
| 20 | vault end gables + lightning_rod finials | glass triangles with quartz mullions every 3 x; lightning_rod y21 on end ribs | z4, z43 | P4 | vaultEndGable |
| 21 | CHIHULY flower hanging inside | cloud of orange (most), red, yellow stained_glass blocks + glass, shroomlight ~1/40, end_rod spikes, `chain` hangers from the ridge | bays 1..8 z9..38, dx<=4, y10..17 | P4 | chihulyFlower |
| 22 | Glasshouse floor + lights | polished_blackstone, sea_lantern inlays every 4 z at dx 5 | y0 | P4 | vaultBay |
| 23 | Glasshouse vestibules | glass box, smooth_quartz frame, slab roof, doors | H1, H2 | P4 | vestibuleGlassBox |
| 24 | Galleries dark flat boxes with green roof | gray_concrete y3..11, deepslate_tiles plinth y1-2, polished_deepslate fins every 6, deck moss_block y12, parapet y13 deepslate_tiles, coping polished_deepslate_slab | G1,G2,G3 | P5 | galleryFace, greenRoofPatch |
| 25 | slot windows | gray_stained_glass_pane 1 wide y3..9 | x257/x296 z20,36,52,68,84 | P5 | gallerySlotWindow |
| 26 | glass entrance under projecting canopy | glass_pane + smooth_stone mullions every 4 x at z4; canopy polished_deepslate_slab (top) y7, sea_lantern downlights | x263..282 z0..4 | P5 | canopySlab |
| 27 | CHIHULY sign band | black_concrete board x263..282 z1 y8..11, white banner letters at z0 (bannerWord face north) | x269..275 y9..10 | P5 | signBand |
| 28 | coloured glass sculptures at doors/gardens | stained glass columns (red/orange/yellow/blue) 3-5 high + end_rod tops | (264..265),(280..281) z1..2; gardens | P5/P6 | glassBlossom |
| 29 | lawn with curving path, plane-like trees | grass_block, polished_andesite path 2 wide, oak logs 5 high + oak_leaves persistent wider crown | x108..220 z0..95 | P6 | lawnPath, planeTree |
| 30 | lighting so nothing spawns | lanterns on parapets every 8, lamp posts every 8-10 on paths, sea_lantern floors, shroomlight | everywhere | P6 (+each part) | lampPost |
| 31 | plaza paving + planting strips | smooth_stone, polished_andesite, grass strips w/ flowers | z148; x0..3 z36..131 | P6 | lawnPath |
```

### rooms.json

```json
{"entrance":[26,1,148],"street":null,"entrances":null,"rooms":[{"name":"Armory lobby and shops","box":[2,1,7,105,6,33]},{"name":"Armory offices 2F","box":[2,8,7,105,13,33]},{"name":"Armory classrooms 3F","box":[2,15,7,105,20,33]},{"name":"Armory theatre and studios 4F","box":[2,22,7,105,26,33]},{"name":"Food hall ground (aisles and stalls)","box":[6,1,36,101,6,131]},{"name":"Food hall atrium volume","box":[20,7,36,87,27,131]},{"name":"South glass hall","box":[2,1,132,121,27,142]},{"name":"South vestibule","box":[5,1,145,110,6,146]},{"name":"West aisle 2F","box":[6,8,36,19,13,131]},{"name":"East aisle 2F","box":[88,8,36,101,13,131]},{"name":"West aisle 3F","box":[6,15,36,19,20,131]},{"name":"East aisle 3F","box":[88,15,36,101,20,131]},{"name":"West aisle 4F","box":[6,22,36,19,26,131]},{"name":"East aisle 4F","box":[88,22,36,101,26,131]},{"name":"Pavilion D shops","box":[138,1,98,205,6,117]},{"name":"Pavilion D event cafe","box":[138,8,98,205,13,117]},{"name":"Kiosk D1","box":[209,1,101,210,6,102]},{"name":"Annex D2 restrooms","box":[210,1,114,217,6,121]},{"name":"Galleria hall","box":[106,1,122,169,5,127]},{"name":"Galleria east arm","box":[170,1,122,197,5,123]},{"name":"Galleria cafe","box":[110,1,128,121,5,129]},{"name":"Glasshouse hall","box":[233,1,5,238,6,42]},{"name":"Glasshouse north vestibule","box":[234,1,1,239,5,2]},{"name":"Glasshouse south vestibule","box":[234,1,45,235,4,46]},{"name":"Galleries lobby and shop","box":[255,1,2,294,6,5]},{"name":"Gallery one","box":[259,1,6,294,10,29]},{"name":"Gallery two","box":[259,1,31,294,10,59]},{"name":"Gallery three","box":[259,1,61,294,10,89]},{"name":"Galleries cafe","box":[263,1,94,294,8,101]}]}
```

### palette.json

```json
{
  "roles": {
    "armory_body": ["smooth_sandstone", "smooth_sandstone_stairs", "smooth_sandstone_slab"],
    "armory_bands": ["brown_terracotta"],
    "armory_plinth": ["polished_andesite", "polished_andesite_stairs", "polished_andesite_slab"],
    "windows": ["glass_pane", "glass", "gray_stained_glass_pane", "light_gray_stained_glass_pane"],
    "frame": ["smooth_quartz", "smooth_quartz_slab", "smooth_quartz_stairs"],
    "roof_deck": ["smooth_stone", "smooth_stone_slab"],
    "trusses": ["light_gray_concrete", "andesite_wall", "chain", "iron_bars"],
    "accent": ["red_terracotta", "red_concrete"],
    "pavilion": ["white_concrete", "light_gray_concrete"],
    "glasshouse": ["glass", "smooth_quartz", "polished_blackstone", "sea_lantern", "lightning_rod"],
    "flower": ["orange_stained_glass", "red_stained_glass", "yellow_stained_glass", "glass", "shroomlight", "end_rod", "chain"],
    "galleries": ["gray_concrete", "deepslate_tiles", "polished_deepslate", "polished_deepslate_slab", "deepslate_tile_slab", "deepslate_tile_stairs", "black_concrete"],
    "green": ["moss_block", "grass_block", "azalea", "flowering_azalea", "short_grass", "flowering_azalea_leaves"],
    "grounds": ["smooth_stone", "polished_andesite", "dirt_path", "grass_block", "oak_log", "oak_leaves", "birch_log", "birch_leaves", "oak_fence", "lantern", "red_stained_glass", "orange_stained_glass", "yellow_stained_glass", "blue_stained_glass"],
    "lighting": ["lantern", "sea_lantern", "shroomlight", "end_rod", "glowstone"]
  },
  "objects": ["birch_door", "birch_trapdoor", "spruce_trapdoor", "white_wall_banner", "black_wall_banner", "white_banner", "black_banner"]
}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which is moved into place only if the build succeeds.
set -e
cd "$(dirname "$0")"
node build.mjs ./build.tmp.nbt
mv ./build.tmp.nbt build.nbt
```

### build.mjs

```js
// Builds the whole Armory + Chihuly kit: the ground, then every part in order, into the path given as argv[2].
import { readFileSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, GROUND_Y, SMOOTH_STONE } from "./vocab/base.mjs";
import * as armoryShell from "./parts/armory-shell.mjs";
import * as stairs from "./parts/stairs.mjs";
import * as armoryRoof from "./parts/armory-roof.mjs";
import * as pavilions from "./parts/pavilions.mjs";
import * as glasshouse from "./parts/glasshouse.mjs";
import * as galleries from "./parts/galleries.mjs";
import * as grounds from "./parts/grounds.mjs";
import * as room1 from "./parts/room-1.mjs";
import * as room2 from "./parts/room-2.mjs";
import * as room3 from "./parts/room-3.mjs";
import * as room4 from "./parts/room-4.mjs";
import * as room5 from "./parts/room-5.mjs";
import * as room6 from "./parts/room-6.mjs";
import * as room7 from "./parts/room-7.mjs";
import * as room8 from "./parts/room-8.mjs";
import * as room9 from "./parts/room-9.mjs";
import * as room10 from "./parts/room-10.mjs";
import * as room11 from "./parts/room-11.mjs";
import * as room12 from "./parts/room-12.mjs";
import * as room13 from "./parts/room-13.mjs";
import * as room14 from "./parts/room-14.mjs";
import * as room15 from "./parts/room-15.mjs";
import * as room16 from "./parts/room-16.mjs";
import * as room17 from "./parts/room-17.mjs";
import * as room18 from "./parts/room-18.mjs";
import * as room19 from "./parts/room-19.mjs";
import * as room20 from "./parts/room-20.mjs";
import * as room21 from "./parts/room-21.mjs";
import * as room22 from "./parts/room-22.mjs";
import * as room23 from "./parts/room-23.mjs";
import * as room24 from "./parts/room-24.mjs";
import * as room25 from "./parts/room-25.mjs";
import * as room26 from "./parts/room-26.mjs";
import * as room27 from "./parts/room-27.mjs";
import * as room28 from "./parts/room-28.mjs";
import * as room29 from "./parts/room-29.mjs";

const out = process.argv[2];
// the roof reads its eave from the walls the shell lays, so it waits until the shell is built (a stub has no walls)
const shellIsStub = /export function build\(g\) \{\}/.test(readFileSync("parts/armory-shell.mjs", "utf8"));
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// the server is 1.21.1 (DataVersion 3955): every id in the palette is a 1.21.1 block
const g = new Grid([SITE.x, SITE.y, SITE.z], { dataVersion: DATA_VERSIONS["1.21.1"] });
g.fill([0, GROUND_Y, 0], [SITE.x - 1, GROUND_Y, SITE.z - 1], SMOOTH_STONE);

runParts(g, [
  ["Armory shell", armoryShell.build],
  ["Stairs and ladders", stairs.build],
  ["Armory roof and porch", armoryRoof.build],
  ["White pavilions and galleria", pavilions.build],
  ["Glasshouse and Chihuly flower", glasshouse.build],
  ["Galleries", galleries.build],
  ["Grounds and lighting", grounds.build],
  ["room: Armory lobby and shops", room1.build],
  ["room: Armory offices 2F", room2.build],
  ["room: Armory classrooms 3F", room3.build],
  ["room: Armory theatre and studios 4F", room4.build],
  ["room: Food hall ground (aisles and stalls)", room5.build],
  ["room: Food hall atrium volume", room6.build],
  ["room: South glass hall", room7.build],
  ["room: South vestibule", room8.build],
  ["room: West aisle 2F", room9.build],
  ["room: East aisle 2F", room10.build],
  ["room: West aisle 3F", room11.build],
  ["room: East aisle 3F", room12.build],
  ["room: West aisle 4F", room13.build],
  ["room: East aisle 4F", room14.build],
  ["room: Pavilion D shops", room15.build],
  ["room: Pavilion D event cafe", room16.build],
  ["room: Kiosk D1", room17.build],
  ["room: Annex D2 restrooms", room18.build],
  ["room: Galleria hall", room19.build],
  ["room: Galleria east arm", room20.build],
  ["room: Galleria cafe", room21.build],
  ["room: Glasshouse hall", room22.build],
  ["room: Glasshouse north vestibule", room23.build],
  ["room: Glasshouse south vestibule", room24.build],
  ["room: Galleries lobby and shop", room25.build],
  ["room: Gallery one", room26.build],
  ["room: Gallery two", room27.build],
  ["room: Gallery three", room28.build],
  ["room: Galleries cafe", room29.build],
], { palette: "palette.json", roof: shellIsStub ? undefined : "roof.json" });

g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for every part: palette ids (palette.json only), site coordinates from plan.md, and a seeded rng.

// ---- site (plan.md SITE; global kit coordinates, y 0 = the smooth_stone ground) -----------------------------------

// ---- site (plan.md SITE; global kit coordinates, y 0 = the smooth_stone ground) -----------------------------------
/** Full kit footprint in cells: x 0..296, y 0..41, z 0..148. */
export const SITE = { x: 297, y: 42, z: 149 };

/** Per plot: its x/z range (inclusive) and the top y its builds may reach. */
export const PLOTS = {
  armory: { plot: 0, x0: 0, x1: 220, z0: 0, z1: 148, yMax: 41 },
  glasshouse: { plot: 1, x0: 221, x1: 252, z0: 0, z1: 47, yMax: 22 },
  galleries: { plot: 2, x0: 253, x1: 296, z0: 0, z1: 104, yMax: 17 },
};

/** Ground: the smooth_stone layer at y 0, flush with every door threshold. */
export const GROUND_Y = 0;

/** Armory floor lines (ground, then the three upper floors); the flat deck sits on DECK_Y. */
export const FLOOR_YS = [0, 7, 14, 21];

export const DECK_Y = 28;

/** The Armory masses as [x0, z0, x1, z1] (inclusive). A and B and C share the flat roof. */
export const MASSES = {
  A: [0, 4, 107, 35], B: [4, 36, 103, 131], C: [0, 132, 123, 143], C1: [4, 144, 111, 147],
  D: [136, 96, 207, 119], D1: [208, 100, 211, 103], D2a: [208, 112, 219, 119], D2b: [212, 120, 219, 123],
  E1: [104, 120, 199, 123], E2: [104, 124, 171, 127], E3: [108, 128, 123, 131],
  G1a: [257, 12, 296, 91], G1b: [257, 8, 292, 11], G2: [253, 0, 292, 7], G3a: [261, 92, 296, 95], G3b: [269, 96, 296, 103],
  H1: [233, 0, 240, 3], H2: [233, 44, 236, 47],
};

/** The Armory's atrium (open under the deck, no floors) and the two roof light shafts (deck left out). */
export const ATRIUM = { x0: 20, z0: 36, x1: 87, z1: 142, yTop: 27 };

export const MONITORS = [{ x0: 29, z0: 45, x1: 38, z1: 122 }, { x0: 69, z0: 45, x1: 78, z1: 122 }];

/** Glasshouse vault: bay k (0..9) runs z = zAt(k) .. zAt(k)+3 with its axis at cx = cxAt(k); ridge y 20. */
export const VAULT = { bays: 10, ridgeY: 20, zAt: (k) => ...

/** Steel truss k (0..11) lies at z = trussZ(k) across the atrium. */
export const trussZ = (k) => ...

/** Stair flights (plan.md ROOMS): F1..F3 at x 8..9 (and mirrored x 98..99), z 8..14 and 16..22. */
export const STAIR_X = [[8, 9], [98, 99]];

/** Doorways between the Armory's room boxes (x 12..13 and x 94..95, z 34..35). */
export const ARMORY_DOORWAY_X = [[12, 13], [94, 95]];

// ---- palette (palette.json ids only) --------------------------------------------------------------------------------
export const SMOOTH_SANDSTONE = "smooth_sandstone";

export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";

export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";

export const BROWN_TERRACOTTA = "brown_terracotta";

export const POLISHED_ANDESITE = "polished_andesite";

export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs";

export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";

export const GLASS_PANE = "glass_pane";

export const GLASS = "glass";

export const GRAY_STAINED_GLASS_PANE = "gray_stained_glass_pane";

export const LIGHT_GRAY_STAINED_GLASS_PANE = "light_gray_stained_glass_pane";

export const SMOOTH_QUARTZ = "smooth_quartz";

export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";

export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";

export const SMOOTH_STONE = "smooth_stone";

export const SMOOTH_STONE_SLAB = "smooth_stone_slab";

export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";

export const ANDESITE_WALL = "andesite_wall";

export const CHAIN = "chain";

export const IRON_BARS = "iron_bars";

export const RED_TERRACOTTA = "red_terracotta";

export const RED_CONCRETE = "red_concrete";

export const WHITE_CONCRETE = "white_concrete";

export const POLISHED_BLACKSTONE = "polished_blackstone";

export const SEA_LANTERN = "sea_lantern";

export const LIGHTNING_ROD = "lightning_rod";

export const ORANGE_STAINED_GLASS = "orange_stained_glass";

export const RED_STAINED_GLASS = "red_stained_glass";

export const YELLOW_STAINED_GLASS = "yellow_stained_glass";

export const BLUE_STAINED_GLASS = "blue_stained_glass";

export const SHROOMLIGHT = "shroomlight";

export const END_ROD = "end_rod";

export const GRAY_CONCRETE = "gray_concrete";

export const DEEPSLATE_TILES = "deepslate_tiles";

export const POLISHED_DEEPSLATE = "polished_deepslate";

export const POLISHED_DEEPSLATE_SLAB = "polished_deepslate_slab";

export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";

export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";

export const BLACK_CONCRETE = "black_concrete";

export const MOSS_BLOCK = "moss_block";

export const GRASS_BLOCK = "grass_block";

export const AZALEA = "azalea";

export const FLOWERING_AZALEA = "flowering_azalea";

export const SHORT_GRASS = "short_grass";

export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves";

export const DIRT_PATH = "dirt_path";

export const OAK_LOG = "oak_log";

export const OAK_LEAVES = "oak_leaves";

export const BIRCH_LOG = "birch_log";

export const BIRCH_LEAVES = "birch_leaves";

export const OAK_FENCE = "oak_fence";

export const LANTERN = "lantern";

export const GLOWSTONE = "glowstone";

export const BIRCH_DOOR = "birch_door";

export const BIRCH_TRAPDOOR = "birch_trapdoor";

export const SPRUCE_TRAPDOOR = "spruce_trapdoor";

export const WHITE_WALL_BANNER = "white_wall_banner";

export const BLACK_WALL_BANNER = "black_wall_banner";

export const WHITE_BANNER = "white_banner";

export const BLACK_BANNER = "black_banner";

// ---- seeded random -----------------------------------------------------------------------------------------------
/** rng(seed) returns a function giving floats in [0, 1), the same sequence for the same seed (mulberry32). */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Vocabulary helpers, batch 1 (plan.md VOCABULARY). Each takes the grid first, then one options object holding its
// position (and face, where it has one). Blocks are the literal ids from plan.md PALETTE (1.21.1).
//
// Every write goes through scope(): a cell is written only inside the helper's footprint and only into air, so
// an earlier part's ground, floor and walls are never touched. Refused writes are listed in the returned report,
// never thrown. Nothing writes at y0 (the ground), and every helper returns { placed, refused }.

/**
 * One storey band of a face: polished_andesite plinth at y1, smooth_sandstone body, brown_terracotta courses at
 * y8, 15, 22, 27, parapet y29-30 and a bottom coping slab at y31. Cut openings with holes(x, y, z).
 */
export function bandedStorey(g, { x0, z0, x1, z1, face, y0 = 0, holes = null, over = false })

/**
 * One 7-wide bay of the south curtain wall: smooth_quartz mullion at x on the frame plane z+1 (y1..26), glass panes
 * x+1..x+6 on the glass plane z, smooth_quartz transoms across the glass at y7, 14, 21.
 */
export function curtainWallBay(g, { x, z = 142, y0 = 0, over = false })

/**
 * A glass clerestory on the roof deck: smooth_quartz posts at every 4th z on both long sides and at the far corners,
 * glass_pane between (y29..34), a smooth_quartz ring at y35 with a glass skylight inside, and a smooth_quartz_slab
 * rim at y36. The deck below stays open (interior air).
 */
export function roofMonitor(g, { x0, x1, z0, z1, y0 = 29, over = false })

/**
 * A 4x4 porch: smooth_sandstone corner posts y1..4, a smooth_sandstone_slab canopy at y5 over the whole square,
 * a brown_terracotta fascia ring at y6, and two hanging lanterns under the canopy at y4 (headroom y1..3 stays clear).
 */
export function porchCanopy(g, { x0, z0, y0 = 0, over = false })

/**
 * A red canopy: smooth_quartz corner posts y1..4, a red_concrete fascia ring at y5, a smooth_quartz_slab soffit
 * over the inside at y5, and hanging lanterns under the soffit every 4 x along the middle line.
 */
export function redCanopy(g, { x0, x1, z0, z1, y0 = 0, over = false })

/**
 * One rib plane of the Glasshouse vault: the whole cross-section at z in smooth_quartz (y1..20) around the bay axis
 * cx. The axis defaults from z (bay k = floor((z - 4) / 4), axis 231 + k). rod: a lightning_rod finial at y21 (the
 * end ribs). Call it before vaultBay on the same z, or its glass edge cells are already air-owned and get refused.
 */
export function vaultRib(g, { z, cx, y0 = 0, rod = false, over = false })

/**
 * One gallery face (Galleries G1..G3): deepslate_tiles plinth y1-2, gray_concrete wall y3..11, polished_deepslate
 * fins on the outer row every 6 cells (y1..11), deepslate_tiles parapet y12-13, and a polished_deepslate_slab coping
 * at y14. The outer row is the face; the wall is 2 thick.
 */
export function galleryFace(g, { x0, z0, x1, z1, face, y0 = 0, over = false })

/**
 * A black_concrete sign board across x0..x1 at plane z (y0..y1), with the white banner letters of `text` hung on
 * its outer side (north: letters at z-1; south: z+1), centred on cx at height cy. Banner letters go through the same gate.
 */
export function signBand(g, { x0, x1, z, y0, y1, text, face = "north", cx = Math.floor((x0 + x1) / 2), cy = y0 + 1, over = false })

/**
 * A plane tree: an oak_log trunk 5 high at (x, z) from y1, and a 5-wide crown of persistent oak_leaves over two
 * layers (y4, y5) with the corners cut and a few bites out of the top layer.
 */
export function planeTree(g, { x, z, y0 = 0, over = false })
```

### vocab/h2.mjs

```js
// Named helpers from plan.md's VOCABULARY, group h2: window runs and doors, the hall's steel truss, the glass
// vestibule, the galleria skylight, the vault end gable, the gallery slot window, the green roof patch, the lawn path.
//
// Every helper takes the grid first, then its position (and facing where it has one), and returns
// { box, placed, refused }: its footprint box (inclusive corners), how many cells it wrote, and any write it left out.
// Writes stay inside the footprint, go only into air, and never reach y 0 (ground, sand and floors belong to earlier
// parts). Openings and their surrounds are left air by the shell (plan: "leave all openings as air"), so these helpers
// fill them. lawnPath is the one exception: the path is the ground's surface layer, so it replaces that layer only.

/** One 6-wide, 3-high glass run cut into a face, one back from the wall plane, with a slab sill under it.
 *  from..to is the run along the wall (to defaults to from + 5). The ground floor starts at y 2 and runs 4 high. */
export function stripWindowRun(g, { face, plane, from, to = from + 5, y, high = y === 2 ? 4 : 3 })

/** A door opening of `width` cells (2 = one double door; 4 = two pairs) with birch_door halves at y 1..2 and air
 *  above at y 3. (x, z) is the first cell of the opening on the wall plane. surround: red_terracotta jambs and lintel. */
export function doorPair(g, { x, z, face, width = 2, surround = false })

/** The hall's steel truss in the plane z: light_gray_concrete chords at y 27 and y 23, andesite_wall posts every 6 x
 *  (plus the end) at y 24..25, a chain hanger at y 26 under each top chord, and a peaked diagonal web of andesite_wall
 *  rising and falling 1 y per 1 x between posts. */
export function steelTruss(g, { z, x0 = 20, x1 = 87 })

/** A single-storey glass box: smooth_quartz posts at the corners and every 7 along each edge, glass_pane between,
 *  walls at y 1..h-1, a smooth_quartz_slab rim at y h, and a glass roof at y h with smooth_quartz beams every 7 x. */
export function vestibuleGlassBox(g, { x0, z0, x1, z1, h })

/** A 2-wide glass skylight down the middle of a galleria rect, set in smooth_quartz deck edges on either side. */
export function galleriaSkylight(g, { rect: { x0, z0, x1, z1 }, y = 6 })

/** The pointed glass gable that closes the vault at z (4 or 43): the full profile of the bay that owns that z, glass
 *  with smooth_quartz mullions every 3 x from the axis. */
export function vaultEndGable(g, { z })

/** A 1-wide gray stained-glass slot at y 3..9, one back from the wall at (x, z). face defaults from x: the west wall
 *  is x 257 and the east wall x 296 (plan.md FLOORS/FACADES). */
export function gallerySlotWindow(g, { x, z, face = x <= 257 ? "west" : "east" })

/** Planting on a moss deck: grass_block patches in the rect at layer y (ring always grass, the rest ~3 in 4), with
 *  azalea, flowering_azalea and short_grass on top, and a lantern standing on the ring every 8 blocks. */
export function greenRoofPatch(g, { x0, z0, x1, z1, y = 13 })

/** A 2-wide polished_andesite path through the points ([x, z] pairs) on the ground's surface layer y. The one helper
 *  that replaces what is there: it writes that layer only, and only where there is ground to replace. */
export function lawnPath(g, { points, y = 0, width = 2 })
```

### vocab/h3.mjs

```js
// Named helpers from plan.md VOCABULARY (this file's share): slotWindow, atriumRailing, copingParapet, pavilionBay,
// vaultBay, chihulyFlower, canopySlab, glassBlossom, lampPost. Each takes its position as arguments; plan.md's
// geometry is only the default. Every helper writes only into air: a cell an earlier part built (wall, ground,
// floor) is skipped, never overwritten. The one exception is vaultBay's `floor: true`, which replaces the y0 ground.

/** 2-wide, full-height glass_pane slot in a wall, capped with brown_terracotta at y1 + 1. face: the wall's outward facing. */
export function slotWindow(g, { x, z, face = "north", y0, y1 })

/** iron_bars railing along z at column x, one high at y. gaps: the z of each stair top, left open. */
export function atriumRailing(g, { x, z0, z1, y, gaps = [] })

/** Parapet ring round the rectangle x0..x1, z0..z1: smooth_sandstone at y and y+1, a bottom slab coping at y+2. The deck inside is not touched. */
export function copingParapet(g, { x0, z0, x1, z1, y = 29 })

/**
 * One 7-cell bay of a white-and-glass facade: a white_concrete pier at (x, z), glass_pane in the 6 cells after it,
 * floor bands of white_concrete at y 7, 14 ..., a light_gray_concrete base at y1 and coping at the top. The run goes
 * along x for a north or south face and along z for east or west. closing: also write the pier 7 cells on (the last bay).
 */
export function pavilionBay(g, { x, z, face = "north", storeys = 2, closing = false })

/**
 * One 4-deep bay of the Glasshouse vault, k = 0..9: the shell per VAULT_DX (glass, a polished_blackstone curb at y1,
 * smooth_quartz purlins at y 7, 13, 20), axis cx = x0 + k, z = z0 + 4k .. +3. floor: also lay the polished_blackstone
 * floor and the sea_lantern inlay over the y0 ground (the only write here that replaces a built cell).
 */
export function vaultBay(g, { k, x0 = 231, z0 = 4, floor = false })

/**
 * The hanging CHIHULY cloud in the vault bays (default k = 1..8): lumps inside the glass, |dx| <= 4, y 10..17, kept
 * clear of the shell; ~55% orange, 25% red, 12% yellow, 8% plain glass; shroomlight 1 in 40; end_rod spikes (1..3
 * long, outward in x) on 1 in 12 outer cells; a chain hanger at y 18..19 from the ridge in each bay.
 */
export function chihulyFlower(g, { bays = [1, 2, 3, 4, 5, 6, 7, 8], seed = 1, x0 = 231, z0 = 4 })

/** Canopy over x0..x1, z0..z1: polished_deepslate_slab (top half) at y, sea_lantern downlights at y-1 along z0+2 every 4 x. */
export function canopySlab(g, { x0, z0, x1, z1, y = 7 })

/** A stained-glass column of h (3..5) blocks above a polished_andesite base at y1, colours alternating, end_rod tip. */
export function glassBlossom(g, { x, z, h = 4, colors = ["red", "yellow"] })

/** Three oak_fence posts at y1..3 with a lantern standing on top (y4). */
export function lampPost(g, { x, z })
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

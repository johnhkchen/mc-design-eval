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
- [x] P1 shell  - [ ] P2 roof/porch  - [ ] P3 pavilions  - [ ] P4 glasshouse  - [ ] P5 galleries  - [ ] P6 grounds

## NOTES FOR WORKERS
- Stay in your plot, below the plot's y max. Every door threshold at y1 is flush with y0; no steps anywhere, so the way in meets the accessibility rule.
- Windows are 1 back by exclusion: do not place the front material there. Leave all openings and RESERVED cells as air.
- Glasshouse door at z0 is on the plot edge; keep H1's outer wall at z0 and its doors in that plane.
- Light: every room 8+, parapet lanterns, lamp posts every 8-10; check `$MCD light`.
- Use `chain`, not iron_chain; no pale oak or 1.21.4+ blocks.
- stairs.mjs: Armory flights F1..F3 are in the shell; stairs part lays pavilion D floor y7 (x138..205 z98..117, stairwell x140..141 z98..105 left open, iron_bars rail) and the D flight x140..141 z99..105 -> y7 (top step z106). Pavilions part must not rebuild that floor.

# Taipei City Hall (1994): architect's plan

## SITE

- Plot 0: local x 0..202, z 0..374, y 0..80 (world box x 926..1128, z 666..1040). North = low z, east = high x. Build in site orientation, no turning.
- Map grid: column c covers x 9c..9c+8 (column 22 = x 198..202). Row r covers z 9r..9r+8 (row 41 = z 369..374). Build only on `#` cells.
- Ground: 0 at the north and south spurs (rows 0-2, 39-41). 1 in the north block (rows 3-12) and the west entrance apron (x 0..17). 2 in the cross and south block (rows 13-38). Every mass sets its footing from its own ground cell up to the **plinth top at y 2**, so it never floats or gets buried. y 2 is the ground-floor level everywhere except the two spurs, where it is y 1.
- Street sides: the **main front faces WEST onto Shifu Road** (x 0). The SOUTH front (z 374) and EAST front (x 202) face the camera on Elephant Mountain (SE, high up). Roofs are the camera's largest surface. This brief overrides the generic "front faces north": the west front is the ceremonial one, and south/east are the hero faces.
- Plan idea, the **double cross**: a N–S body (x 36..125) crossed by three E–W bars (A, the centre bar, B). Wings are 18–20 deep and enclose two big courtyards (north and south) plus two east courts. The crossing is a stepped-up central block, and every wing ends in a squared tower.

### Masses (y = footing at ground .. top of parapet)

| id | mass | x0..x1 | z0..z1 | y top | storeys |
|---|---|---|---|---|---|
| M1 | North spur pavilion (glazed link, lit) | 81..89 | 0..26 | 12 | 2 |
| M2 | North podium (terrace roof) | 81..125 | 27..35 | 17 | 3 |
| M3 | North wing | 45..105 | 36..54 | 64 | 12 |
| T1 | NW corner tower | 27..44 | 36..62 | 69 | 13 |
| T2 | NE corner tower | 106..125 | 36..54 | 69 | 13 |
| M4 | NW wing | 36..55 | 63..116 | 64 | 12 |
| M4a | NW wing neck (row 4-6 strip under T1 already) | 36..44 | 55..62 | in T1 | |
| M5 | NE wing | 106..125 | 55..116 | 64 | 12 |
| M6 | Bar A (north cross bar) | 45..179 | 117..134 | 64 | 12 |
| T3 | Bar A west tower | 27..44 | 117..152 | 69 | 13 |
| T3a | West bay on T3 (row 14 jut) | 18..26 | 126..134 | 64 | 12 |
| T4 | Bar A east tower | 180..197 | 117..152 | 69 | 13 |
| M7 | Central block (crossing, stepped up) | 63..134 | 135..242 | 69 | 13 |
| M7c | Crown penthouse on M7 (floodlit) | 81..116 | 170..206 | 74 | +1 plant storey |
| M8 | West entrance wing (Shifu Rd front) | 18..62 | 162..215 | 64 | 12 |
| M8p | Entrance portico and canopy | 0..17 | 170..207 | 15 | canopy |
| M9 | East wing (centre bar) | 135..179 | 162..215 | 64 | 12 |
| T5 | East-centre tower | 180..197 | 162..215 | 69 | 13 |
| M10 | Bar B (south cross bar) | 45..179 | 233..251 | 64 | 12 |
| T6 | Bar B west tower | 27..44 | 225..251 | 69 | 13 |
| T6a | West bay on T6 (row 27 jut) | 18..26 | 243..251 | 64 | 12 |
| T7 | Bar B east tower | 180..197 | 225..251 | 69 | 13 |
| T7a | East bay on T7 (row 27 jut) | 198..202 | 243..251 | 64 | 12 |
| M11 | SW wing | 36..55 | 252..314 | 64 | 12 |
| M12 | SE wing | 106..125 | 252..314 | 64 | 12 |
| M13 | South wing | 45..105 | 315..332 | 64 | 12 |
| T8 | SW corner tower | 27..44 | 315..332 | 69 | 13 |
| T9 | SE corner tower | 106..125 | 315..332 | 69 | 13 |
| M14 | South podium (terrace, faces camera) | 72..125 z333..341; 81..125 z342..350 | | 17 | 3 |
| M15 | South spur pavilion (glazed, lit) | 81..89 | 351..374 | 12 | 2 |

Where wings meet a tower or the central block, the higher mass owns the shared cells. No wing is built through a courtyard.

### Courtyards and open ground (on footprint cells, planted)

| id | court | x0..x1 | z0..z1 | ground finish |
|---|---|---|---|---|
| CN | North courtyard | 56..105 | 55..116 | lawn and trees, cross paths, central fountain basin |
| CS | South courtyard | 56..105 | 252..314 | lawn and trees, cross paths, central fountain basin |
| CNE | NE court (open to the east slot at z 153..161) | 135..179 | 135..152 | lawn, a tree row along z 144 |
| CSE | SE court (open to the slot at z 216..224) | 135..179 | 225..232 | lawn strip, planters |
| CNW | NW light court | 45..62 | 135..152 | paving, 2 trees |
| CSW | SW light court | 45..62 | 225..232 | paving, planters |
| AP | West entrance apron (beside the portico) | 0..17 | 162..169 and 208..215 | paving, flagpoles, planters |

The slots on rows 17 and 24 outside x 63..134 are NOT footprint: leave them untouched.

### Approach (west main door)
- The portico deck is at y 2 and the apron at y 1, so the step is one block. Build a slab ramp 2 cells long (bottom slabs at y 1.5, then the deck) across the full portico width z 170..207 at x 0..1. Half steps only, no stairs. The doors are at x 18 behind the canopy.

## ROOFS

All roofs are **flat behind parapets** (a modern civic block). Use preset `modern` (flat-parapet-modern) and override the materials to the palette below. No pitched roofs.

| roof | deck y | parapet | coping | notes |
|---|---|---|---|---|
| 12-storey wings (M3-M6, M8-M13, bays T3a/T6a/T7a) | 62 | y 63..64, wall block | smooth_quartz_slab (bottom) at y 64 on the parapet top, sitting 1 proud as a thin cornice line | deck of smooth_stone_slab (bottom, no spawning), lantern on the parapet inner edge every 8 |
| towers T1-T9 | 67 | y 68..69 | smooth_quartz_slab | deck smooth_stone_slab; each tower carries a 5x5 plant box y 68..70 at its centre |
| central block M7 | 67 | y 68..69 | smooth_quartz_slab, with a light slot (ochre_froglight, 1 course) at y 68 recessed 1 under the coping all round | floodlit crown edge |
| crown penthouse M7c | 74 roof slab | walls y 68..73, parapet = the y 74 slab edge | smooth_quartz_slab | walls pearlescent_froglight band at y 73 (glows cool white), body smooth_quartz |
| mechanical penthouses (hand-built boxes) | | | | N wing x 66..94 z 40..50, y 63..69; S wing x 66..94 z 319..329, y 63..69; E wing x 145..170 z 175..202, y 63..69: light_gray_concrete boxes, iron_bars louvre band at y 66..67 |
| podia M2, M14 | 15 | y 16..17 | smooth_quartz_slab | roof terraces: smooth_stone_slab deck, 2 planters (moss_block + flowering_azalea_leaves), lantern posts every 8 |
| spurs M1, M15 | 10 | y 11..12 | smooth_quartz_slab | glass skylight strip x 84..86 down the spine |
| portico canopy M8p | 13 (slab) | fascia y 13..15 | smooth_quartz | a 3-high fascia band on the west and south edges carries the name |

- **Masts / aircraft lights:** 4 antenna masts on M7c at (83,75..79,172), (114,75..79,172), (83,75..79,204), (114,75..79,204): lightning_rod stacked (iron_bars below y 78), a redstone_torch on top. A redstone_torch on each tower's plant box at y 71. Nothing goes above y 80.
- Every roof deck is bottom slabs (no mob spawns) plus lanterns at 8 spacing. Each part builds its roof by hand (flat slabs). The roof tool may be used with `modern` and `keep` boxes over the penthouses.

## FACADES

Hierarchy, everywhere: **plinth (y 0..2) / ground storey (y 2..6) / 11 office storeys (y 7..61) / parapet (y 62..64)**. Every 12-storey wing reads as a tile box with a dense grid of dark window bays. Every tower reads as a blank tile shaft with slot windows (the photo's end walls).

### Office wing faces (all wings, both sides including the courtyard sides)
- **Wall plane** = the mass edge.
- **Bay = 3 blocks:** 1 pier, then a 2-wide window. Piers are smooth_sandstone, full height y 7..61, flush.
- **Window per storey** (floor f = 7, 12, ..., 57): glass at f+2..f+3, 2 wide, **recessed 1** behind the wall plane. Spandrel rows f, f+1 and f+4 are white_terracotta in the bay (flush). This gives faint horizontal bands under strong vertical piers, like the photo's grid.
- **Behind the glass** (2 in from the face): black_concrete for a dark window. In about 1 bay in 6, picked at random but clustered in runs of 2-4 along a storey, put a light block instead: shroomlight (warm) in 2 of 3, sea_lantern (cool) in 1 of 3. The south and east faces get the most lit bays.
- **String course** at y 7: smooth_sandstone_slab (top), 1 proud, the full length of the wing.
- **Parapet**: smooth_sandstone y 62..64, with a quartz coping slab 1 proud (cornice line).

### Ground storey (y 2..6)
- Square piers of smooth_stone (1x1) every 6, flush with the face. Between them the glazing (glass) is recessed 2 at y 3..5, with a smooth_stone lintel at y 6.
- On every street face (west, south, east, and north on M3) the ground glazing is lit: a sea_lantern or shroomlight behind every other pane.
- On courtyard faces, use dark glass with lit bays 1 in 3.

### Towers (T1-T9)
- They rise 1 storey above the wings (parapet y 69) and stand 1 proud of the adjoining wing faces where the plan allows.
- Faces are **blank smooth_sandstone** with a white_terracotta panel grid: a joint line every 5th course (y 7, 12, ...) in cut_sandstone, flush.
- Each exposed face gets **two columns of slot windows** (1 wide x 2 tall, recessed 1) at 1/3 and 2/3 of its width, every storey. 1 slot in 4 is lit.
- The east faces of T4, T5 and T7 (x 197) and the south faces of T8 and T9 (z 332) are the camera's big blank tile panels. Light them with a floodlight course: ochre_froglight set flush in the parapet base course at y 62 on those faces only.
- Corners: quoin strip of cut_sandstone 1 wide, full height, on every tower corner (flush).

### West main front (M8 at x 18, Shifu Road)
- Centre bay z 176..201 of M8, y 2..12: **entrance hall**, a full glass wall (light_blue_stained_glass) recessed 1. Behind it, lit: a row of sea_lantern at x 20, y 6 and 10 (a lit lobby). Doors at x 18, y 2..4: 4 double doors (glass panes in the opening; the joiner fits doors) at z 180..181, 186..187, 190..191, 196..197.
- **Portico M8p**: a flat canopy slab (smooth_quartz) at y 13 spanning x 0..17, z 170..207. It is carried on 6 square columns of quartz_pillar, each 2x2, at x 1..2 and z 171..172, 178..179, 185..186, 191..192, 197..198, 204..205, from y 2 to y 12. The fascia is smooth_quartz, y 13..15, on the west (x 0) and the north/south ends. Recessed lights: sea_lantern set into the canopy underside at y 12 every 4 (x 4, 8, 12, 16 by z every 4), flush, so the canopy glows.
- **Name**: "TAIPEI CITY HALL" in banner letters (blue on white) on the west fascia x 0, y 13..15, centred on z 188.5.
- **City emblem** on the M8 west face above the canopy: a round disc centred at (17, 30, 188), radius 4 (11 wide), 1 proud of the face. Disc smooth_quartz, ring blue_concrete, centre mark yellow_concrete (a stylised plum/"北" disc). A shroomlight is set flush in the wall behind its centre to backlight it. Directly over the entrance hall, x 18 face z 176..201, y 14..60 keeps the standard window grid.
- **Flagpoles**: 3 on the north apron and 3 on the south apron at x 4, 9, 14 with z 165 (north) and z 212 (south). Each is a stone base (polished_andesite 1x1, y 1..2), a pole of iron_bars y 3..20 and a lightning_rod tip at y 21. A wall banner hangs from y 18 down on the pole's west side: red_banner with a blue canton (national) on the centre poles, white_banner (city) on the others.
- Apron: polished_andesite paving with light_gray_concrete joints every 4, and lamp posts (andesite_wall post 3 high, lantern on top) every 8.

### South front (M13/T8/T9 at z 332, M14 podium, M15 spur): camera face
- Standard wing grid. The podium M14 is 3 storeys: glass ground storey (lit shop/lobby glazing, y 2..6), and two storeys of the bay grid above. Its roof terrace is lit.
- The M15 spur is a glazed pavilion. Piers are quartz_pillar every 4. Glass panes are recessed 1, and every pane on y 2..5 is backlit with sea_lantern (a lit pedestrian link). A slab ramp leads in at z 374, x 83..87.

### East front (x 197 towers, M9/M10/M6 ends at x 179..197, T7a at x 202)
- Towers as above. T7a (x 198..202) is a 12-storey bay with a full-height slot window column at x 202, z 247.

### North front (M3, M2, M1)
- Standard grid. The M1 spur mirrors M15.

## MATERIALS

| role | block | reads at dusk as |
|---|---|---|
| body piers, parapet, tower faces | smooth_sandstone | warm beige tile (dominant, ~60%) |
| spandrels, tower panels | white_terracotta | pale pinkish beige: a faint band against the piers |
| quoins, tower joint lines | cut_sandstone | tan with fine texture |
| string course | smooth_sandstone_slab | |
| coping and cornice | smooth_quartz_slab, smooth_quartz | bright white line at every roof edge |
| plinth y 0..2 | polished_andesite | gray granite base |
| ground-storey piers and lintels | smooth_stone | pale gray |
| office glass | gray_stained_glass | dark gray windows |
| dark backing | black_concrete | |
| lit window (warm) | shroomlight | orange glow |
| lit window (cool) | sea_lantern | white-cyan glow |
| lobby and entrance glass | light_blue_stained_glass | cool glass over a lit hall |
| crown light / floodlight course | ochre_froglight (warm), pearlescent_froglight (cool) | |
| portico columns | quartz_pillar | |
| emblem | smooth_quartz, blue_concrete, yellow_concrete | |
| roof deck | smooth_stone_slab | gray roof planes |
| mechanical penthouses | light_gray_concrete, iron_bars louvres | |
| masts | iron_bars, lightning_rod, redstone_torch (red light) | |
| paving | polished_andesite, light_gray_concrete, smooth_stone | |
| lawn and planting | grass_block, moss_block, flowering_azalea_leaves | |
| trees | oak_log / jungle_log trunks, oak_leaves / jungle_leaves (persistent) | |
| lamps | lantern on andesite_wall posts | |

All ids verified with `$MCD blocks --check` (1.21.1-safe). Avoid `chain` (absent in this toolkit's registry; it is called iron_chain) and polished_andesite_wall (use andesite_wall).

## OPENINGS

Later parts only add into air, so the shell leaves these cells empty (air):

| opening | where | size |
|---|---|---|
| office windows | every wing face, every 3rd bay offset (2-wide window after each pier), storey f = 7..57: y f+2..f+3, set 1 deep (glass at depth 1, backing at depth 2) | 2w x 2h |
| ground-storey glazing | between the smooth_stone piers every 6: y 3..5, recessed 2 | 5w x 3h |
| tower slots | each exposed tower face at 1/3 and 2/3 of its width, y f+2..f+3 every storey, 1 deep | 1w x 2h |
| main entrance hall | M8 west face x 18, z 176..201, y 2..12, glass recessed 1 (x 19) | 26w x 11h |
| main doors | x 18, y 2..4: z 180..181, 186..187, 190..191, 196..197 | 4 double doors |
| courtyard doors | CN: on M4 east face x 55, z 84..85, y 2..4 and on M5 west face x 106, z 84..85. CS: M11 x 55, z 282..283 and M12 x 106, z 282..283 | double doors |
| north/south spur doors | M1 z 0, x 84..86, y 1..3; M15 z 374, x 84..86, y 1..3 | 3w x 3h glass doors |
| podium entrances | M14 south face z 350, x 100..105, y 2..5 (lit glass); M2 north face z 27, x 100..105 | 6w x 4h |
| east entry | T5 east face x 197, z 186..191, y 2..5 (lit glass, with a 1-deep canopy slab at y 6) | 6w x 4h |

## RESERVED

| cells | for |
|---|---|
| x 0..17, z 170..207, y 2..15 except the columns and the canopy | portico space, kept open |
| column bases: x 1..2 at z 171..172, 178..179, 185..186, 191..192, 197..198, 204..205, y 2..12 | quartz_pillar columns (portico part) |
| emblem disc: x 17, y 26..34, z 184..192 (and x 18 behind the centre) | emblem part |
| flagpole cells: (4/9/14, 1..21, 165) and (4/9/14, 1..21, 212) | flagpoles |
| fountain basins: CN x 76..85 z 81..90, y 1..2; CS x 76..85 z 278..287, y 1..2 (sunk 1 below the court surface at y 2) | water basins, quartz rim |
| tree pits in courts: CN/CS on a 10-grid offset 5 from the court edges, skipping the paths | trees |
| court paths: CN/CS cross paths 4 wide on x 79..82 and z 84..87 (CN) / z 281..284 (CS) | paving |
| masts and plant boxes on roofs (listed in ROOFS) | roof plant |
| x 0..1, z 170..207, y 1..2 | entrance slab ramp |

## FLOORS

| level | y (floor) | notes |
|---|---|---|
| plinth top / ground floor | 2 (spurs: 1) | lobbies lit behind glass |
| storeys 2-12 | 7, 12, 17, 22, 27, 32, 37, 42, 47, 52, 57 | 5-block floor-to-floor |
| wing roof deck | 62 | parapet to 64 |
| tower / central 13th storey | 62, roof deck 67 | parapet to 69 |
| crown penthouse | 68..73, roof 74 | masts to 79 |
| podia | 2, 7, 12; roof 15 | terraces lit |

- Interior volume: exterior only. Each wing's interior is a hollow behind its 2-deep skin (face + backing). Only the lit lobbies show: M8 entrance hall (x 19..30, z 176..201, y 2..12), the spur interiors and the podium ground storeys. Fill those with a lit floor (smooth_stone) and a ceiling of sea_lantern every 4.
- Courtyard surfaces are at y 2 (grass_block over the ground); the spurs' surroundings are at y 0.

---
# DESIGNER SECTIONS

## PALETTE (architect's ids, unchanged; all verified)

| role | block | variants |
|---|---|---|
| body | smooth_sandstone | smooth_sandstone_slab, smooth_sandstone_stairs |
| spandrel/panel | white_terracotta | |
| joints/quoins | cut_sandstone | |
| coping/cornice | smooth_quartz | smooth_quartz_slab, smooth_quartz_stairs, quartz_pillar |
| plinth/paving | polished_andesite | polished_andesite_slab, andesite_wall |
| ground piers | smooth_stone | smooth_stone_slab |
| glass | gray_stained_glass (offices), light_blue_stained_glass (lobbies) | *_pane |
| backing | black_concrete | |
| lights | shroomlight, sea_lantern, ochre_froglight, pearlescent_froglight, lantern | |
| penthouse | light_gray_concrete | iron_bars |
| emblem | smooth_quartz, blue_concrete, yellow_concrete | |
| masts | lightning_rod, iron_bars, redstone_torch | |
| flags | red_banner, white_banner, blue_banner | |
| grounds | grass_block, moss_block, flowering_azalea_leaves, oak_log, jungle_log, oak_leaves, jungle_leaves (persistent=true), water | dirt_path |
| doors | iron_door (or glass_pane openings) | |

## VOCABULARY

- `plinth(g, box)`: polished_andesite y0..2 from ground up.
- `officeBay(g, face, origin, f)`: 3-wide bay: pier smooth_sandstone column; glass gray_stained_glass 2x2 at depth 1, y f+2..f+3, black_concrete depth 2; white_terracotta rows f, f+1, f+4 in the 2-wide bay.
- `litWindow(g, cell, kind)`: swap the depth-2 black_concrete for shroomlight/sea_lantern (2:1), runs of 2-4.
- `stringCourse(g, face, y=7)`: smooth_sandstone_slab type top, 1 proud.
- `groundBay(g, face, x)`: smooth_stone pier 1x1 every 6 y2..6; glass recessed 2 y3..5; lintel y6; light behind every other pane.
- `towerFace(g, face, box)`: smooth_sandstone, cut_sandstone joint row at y7,12,...; two slot columns (1x2, depth 1) per storey, 1 in 4 lit.
- `quoin(g, corner, y0, y1)`: cut_sandstone 1-wide flush.
- `roofDeck(g, box, y)`: smooth_stone_slab bottom; parapet walls; `coping` smooth_quartz_slab bottom 1 proud; lantern every 8 on inner edge.
- `penthouse(g, box)`: light_gray_concrete y63..69, iron_bars y66..67 all faces, slab roof.
- `plantBox(g, cx, cz)`: 5x5 y68..70 light_gray_concrete rim with moss_block, redstone_torch y71.
- `mast(g, x, z)`: iron_bars y75..77, lightning_rod y78..79, redstone_torch on top.
- `crownBand(g, box)`: pearlescent_froglight ring y73; ochre_froglight slot y68 under coping.
- `floodCourse(g, face)`: ochre_froglight flush y62.
- `spurPavilion(g, box)`: quartz_pillar every 4, glass panes recessed 1, sea_lantern behind, skylight strip, roof y10.
- `column(g, x, z)`: quartz_pillar 2x2 y2..12 axis y.
- `canopyLight(g, x, z)`: sea_lantern flush at y12.
- `lobbyGlass(g, box)`: light_blue_stained_glass x19; sea_lantern x20 y6,10.
- `doubleDoor(g, pos, facing)`: iron_door pair, both halves, opens outward.
- `slabRamp(g, ...)`: bottom slabs polished_andesite_slab, 2 wide+.
- `nameBand(g)`: bannerWord "TAIPEI CITY HALL" blue on white, face west.
- `emblemDisc(g)`: disc r4 quartz, ring blue_concrete, core yellow_concrete, shroomlight behind.
- `flagpole(g, x, z, kind)`: base polished_andesite y1..2, iron_bars y3..20, lightning_rod y21, wall banner.
- `lampPost(g, x, y, z)`: andesite_wall x3, lantern on top.
- `tree(g, x, z)`: oak_log/jungle_log trunk 5-6, leaves persistent, crown 5 wide, irregular.
- `fountain(g, box)`: quartz rim y2, water y1..2 sunk basin.
- `planter(g, box)`: moss_block + flowering_azalea_leaves.
- `litEntry(g, box)`: glass entry with sea_lantern backing, optional slab canopy.

## ROOMS (exterior only; only lit lobbies are real rooms; floor smooth_stone, ceiling sea_lantern every 4)

See the returned `rooms`. Stairs: none (interiors hollow); the main hall is entered via the four double doors at x18.

## PARTS

1. Massing/shell (P1): all masses, plinths, backing, openings left air.
2. Roofs (P2): decks, parapets, copings, penthouses, plant boxes, podium terraces.
3. Facades (P3): bays, towers, ground storeys, lit windows, spurs' glazing.
4. Portico, entrance, emblem, flags (P4).
5. Courtyards and grounds (P5).
6. Dusk lighting: crown, masts, floodlights, lamps (P6).

## Notes
- Do not exceed y 80 or leave the # footprint. Respect RESERVED. Courtyard slots rows 17/24 untouched. Use `chain` not iron_chain if needed. Letters via bannerWord only.
- P1 shell: plinth is polished_andesite y0..1 only (y2 left for groundBay piers). Walls: a hollow black_concrete core wall at depth 4 from every exposed face (y2..deck-1 per tier), so depths 0..3 are empty for facades (glass d1-2, lights d3). Roof decks, spurs' walls (spurPavilion) and podium decks are left to later parts. Core wall omitted at entrance hall, court doors, east entry, podium entries.

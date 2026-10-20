# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
```

### elements.md

```markdown
# Taipei City Hall: REQUIRED ELEMENTS

All ids checked with `$MCD blocks --check` (1.21.1). Parts: P1 shell, P2 roofs, P3 facades, P4 portico/entrance/emblem, P5 courts/grounds, P6 lighting/crown/masts. Build in site orientation (N = low z). Vocabulary names are in plan.md VOCABULARY.

- [ ] **Wing wall skin (M3-M13, bays)**: smooth_sandstone face, 2-deep (face + black_concrete backing), plinth polished_andesite y0..2, ground storey y2..6, office storeys y7..61, parapet y62..64. P1. `plinth`, `officeBay`.
- [ ] **Office window grid**: piers smooth_sandstone every 3rd cell full height; window gray_stained_glass 2x2 recessed 1 at f+2..f+3; spandrels white_terracotta at f, f+1, f+4. P3. `officeBay`, `litWindow`.
- [ ] **Lit windows**: ~1 bay in 6 in runs of 2-4, shroomlight (2/3) / sea_lantern (1/3) at depth 2; most on S and E faces. P3. `litWindow`.
- [ ] **String course y7**: smooth_sandstone_slab top, 1 proud. P3. `stringCourse`.
- [ ] **Ground storey**: smooth_stone piers every 6, glass recessed 2 at y3..5, smooth_stone lintel y6, lit behind every other pane. P3. `groundBay`.
- [ ] **Towers T1-T9**: blank smooth_sandstone, cut_sandstone joint every 5th course, white_terracotta panels, two slot-window columns (1x2, recessed 1) per face, cut_sandstone quoins, y to 69. P1 massing + P3 detail. `towerFace`, `quoin`.
- [ ] **Tower floodlight course**: ochre_froglight flush at y62 on E faces of T4/T5/T7 (x197) and S faces of T8/T9 (z332). P6. `floodCourse`.
- [ ] **Central block M7 + crown M7c**: M7 to y69 with ochre_froglight light slot y68 under the coping; M7c x81..116 z170..206 walls smooth_quartz y68..73, pearlescent_froglight band y73, slab roof y74. P1 (shell), P6 (lights). `crownBand`.
- [ ] **Flat parapet roofs**: smooth_stone_slab (bottom) decks y62/67/15/10, quartz coping 1 proud, lantern on parapet inner edge every 8. P2. `roofDeck`, `coping`.
- [ ] **Mechanical penthouses**: light_gray_concrete boxes N x66..94 z40..50, S x66..94 z319..329, E x145..170 z175..202, y63..69, iron_bars louvres y66..67. P2. `penthouse`.
- [ ] **Tower plant boxes**: 5x5, y68..70 at each tower centre, light_gray_concrete, redstone_torch y71. P2/P6. `plantBox`.
- [ ] **Masts**: 4 on M7c, lightning_rod stack, iron_bars below y78, redstone_torch (red aircraft light) at top. P6. `mast`.
- [ ] **Podia M2, M14**: 3-storey grid, lit glass ground storey, roof terrace y15, planters moss_block + flowering_azalea_leaves, lantern posts. P1/P2/P5. `planter`, `lampPost`.
- [ ] **Spur pavilions M1, M15**: glazed, quartz_pillar every 4, panes recessed 1 backlit by sea_lantern y2..5, skylight strip x84..86, glass doors, slab ramp at z374. P1/P3. `spurPavilion`.
- [ ] **Portico + canopy M8p**: 6 quartz_pillar 2x2 columns (plan coords), smooth_quartz canopy y13, fascia y13..15, recessed sea_lantern underside every 4. P4. `column`, `canopyLight`.
- [ ] **Entrance hall + doors**: light_blue_stained_glass wall x19, z176..201, y2..12; 4 double doors at x18 (z180,186,190,196); lit lobby. P4. `lobbyGlass`, `doubleDoor`.
- [ ] **Accessible approach**: bottom-slab ramp x0..1, z170..207 (y1.5 then deck), no stairs. P4. `slabRamp`.
- [ ] **Name "TAIPEI CITY HALL"**: banner letters blue on white, west fascia x0 y13..15 centred z188.5, via `bannerWord`/plaque (never by hand). P4. `nameBand`.
- [ ] **City emblem disc**: centre (17,30,188) r4, smooth_quartz, blue_concrete ring, yellow_concrete core, shroomlight behind at (18,30,188). P4. `emblemDisc`.
- [ ] **Flagpoles x6**: x4/9/14 at z165 and z212; polished_andesite base, iron_bars y3..20, lightning_rod y21, banner (red+blue canton / white). P4. `flagpole`.
- [ ] **Apron paving + lamp posts**: polished_andesite, light_gray_concrete joints every 4, andesite_wall posts + lantern every 8. P4/P5. `lampPost`.
- [ ] **Courtyards CN, CS**: grass lawn y2, 4-wide cross paths (smooth_stone/polished_andesite), fountain basin x76..85 (quartz rim, water at y1..2), trees on 10-grid. P5. `tree`, `fountain`, `lawnPatch`.
- [ ] **Small courts CNE, CSE, CNW, CSW**: lawn/tree row/planters/paving as plan. P5.
- [ ] **Courtyard and spur doors, podium & east entries**: openings per plan OPENINGS, glass lit. P3/P4. `doubleDoor`, `litEntry`.
- [ ] **Lighting at dusk**: every roof and terrace lit (no spawns), lobbies lit, lamps. P2/P6. `lampPost`.
```

### rooms.json

```json
{"entrance":[17,2,181],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "body": ["smooth_sandstone", "smooth_sandstone_slab", "smooth_sandstone_stairs"],
    "spandrel": ["white_terracotta"],
    "joints": ["cut_sandstone"],
    "coping": ["smooth_quartz", "smooth_quartz_slab", "smooth_quartz_stairs", "quartz_pillar"],
    "plinth": ["polished_andesite", "polished_andesite_slab", "andesite_wall"],
    "groundPiers": ["smooth_stone", "smooth_stone_slab"],
    "glass": ["gray_stained_glass", "light_blue_stained_glass", "gray_stained_glass_pane", "light_blue_stained_glass_pane"],
    "backing": ["black_concrete"],
    "lights": ["shroomlight", "sea_lantern", "ochre_froglight", "pearlescent_froglight", "lantern"],
    "penthouse": ["light_gray_concrete", "iron_bars"],
    "emblem": ["smooth_quartz", "blue_concrete", "yellow_concrete"],
    "masts": ["lightning_rod", "iron_bars", "redstone_torch"],
    "flags": ["red_banner", "white_banner", "blue_banner"],
    "grounds": ["grass_block", "moss_block", "flowering_azalea_leaves", "oak_log", "jungle_log", "oak_leaves", "jungle_leaves", "water", "dirt_path"],
    "doors": ["iron_door", "glass_pane"]
  },
  "objects": ["dirt"]
}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: node build.mjs into a temp file in this directory, then mv it into place.
# No roof step here: runParts lays the roof (roof.json, when it exists) inside build.mjs.
set -eu
cd "$(dirname "$0")"
TMP="$(mktemp ./.build.XXXXXX)"
trap 'rm -f "$TMP"' EXIT
node build.mjs "$TMP"
chmod 644 "$TMP"
mv -f "$TMP" build.nbt
```

### build.mjs

```js
// Builds Taipei City Hall: node build.mjs <out.nbt>. Lays the ground, then runs the six parts in plan order.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SIZE, groundAt, grassBlock, dirt } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(1); }

// the parts, in plan order; a part whose file is missing or fails to load is left empty and reported, not fatal
const PARTS = [
  ["Massing and shell", "parts/shell.mjs"],
  ["Roofs and terraces", "parts/roofs.mjs"],
  ["Facades", "parts/facades.mjs"],
  ["Portico and west front", "parts/portico.mjs"],
  ["Courtyards and grounds", "parts/grounds.mjs"],
  ["Dusk lighting and crown", "parts/lights.mjs"],
];
const warn = (msg) => console.error(`WARNING: ${msg}`);

async function loadPart(name, module) {
  const path = fileURLToPath(new URL(module, import.meta.url));
  if (!existsSync(path)) { warn(`part ${name}: ${module} is missing; left empty`); return null; }
  try {
    const m = await import(new URL(module, import.meta.url).href);
    if (typeof m.build !== "function") { warn(`part ${name}: ${module} exports no build(g); left empty`); return null; }
    return m.build;
  } catch (e) {
    warn(`part ${name}: ${module} failed to load (${String(e.message).split("\n")[0]}); left empty`);
    return null;
  }
}

// a part that throws keeps the blocks it placed; the other parts still run
const guarded = (name, build) => (g) => {
  try { build(g); } catch (e) { warn(`part ${name}: build threw (${String(e.message).split("\n")[0]}); kept what it placed`); }
};

// the ground: grass_block at y = height (courtyards at y 2, spurs at y 0), dirt below, untouched slots left open
function layGround(g) {
  let cells = 0;
  for (let x = 0; x < SIZE[0]; x++) {
    for (let z = 0; z < SIZE[2]; z++) {
      const h = groundAt(x, z);
      if (h < 0) continue;
      for (let y = 0; y < h; y++) g.set(x, y, z, dirt);
      g.set(x, h, z, grassBlock);
      cells++;
    }
  }
  return cells;
}

const g = new Grid(SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });
console.log(`ground: ${layGround(g)} columns laid`);

const list = [];
for (const [name, module] of PARTS) {
  const build = await loadPart(name, module);
  list.push([name, build ? guarded(name, build) : () => {}]);
}

// roof.json is laid right after the shell when it exists; until then runParts skips it
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for Taipei City Hall (plot 0): site coordinates, the 1.21.1 palette, and a seeded rng.
// Every part imports from here. Local coordinates: x 0..202, y 0..80, z 0..374. Map cell (row r, column c) covers
// z 9r..9r+8 and x 9c..9c+8 (from plan.md SITE and brief.txt).

// ---- site ----------------------------------------------------------------------------------------------------------

// ---- site ----------------------------------------------------------------------------------------------------------
/** Grid size [x, y, z] of the whole plot: nothing leaves it. */
export const SIZE = [203, 81, 375];

/** Highest y a block may take (nothing above y 80). */
export const TOP_Y = 80;

/** Map cell edge in blocks. */
export const CELL = 9;

/** Footprint map (brief.txt): '#' = build here, row r = z 9r..9r+8, column c = x 9c..9c+8. */
export const FOOTPRINT = [

/** Ground map (brief.txt): the highest ground above y 0 per cell, '.' = none. */
export const GROUND = [

/** Plinth top and ground-floor level (the spurs' ground floor is y 1). */
export const PLINTH_TOP = 2;

/** Wing parapet top (12 storeys); roof deck of the wings at y 62. */
export const WING_TOP = 64;

/** Tower parapet top (13 storeys); tower roof deck at y 67. */
export const TOWER_TOP = 69;

/** Crown penthouse (M7c) roof slab; its masts rise to y 79. */
export const CROWN_TOP = 74;

/** Office storey floors, y 7..57 (each storey is 5 blocks; the glass sits at f+2..f+3). */
export const STOREY_FLOORS = [7, 12, 17, 22, 27, 32, 37, 42, 47, 52, 57];

/** West main entrance (Shifu Road front): x of the doors, z span of the entrance hall. */
export const ENTRANCE_X = 18;

export const ENTRANCE_HALL_Z = [176, 201];

/** The four double doors on the west front: z pairs at x 18, y 2..4. */
export const MAIN_DOOR_Z = [[180, 181], [186, 187], [190, 191], [196, 197]];

/** West apron (x 0..17) z spans beside the portico: north, south. */
export const APRON_Z = [[162, 169], [208, 215]];

/** Courtyards and courts as [x0, x1, z0, z1] (plan.md COURTYARDS). */
export const COURTS = {
  CN: [56, 105, 55, 116], CS: [56, 105, 252, 314],
  CNE: [135, 179, 135, 152], CSE: [135, 179, 225, 232],
  CNW: [45, 62, 135, 152], CSW: [45, 62, 225, 232],
};

/** Fountain basins as [x0, x1, z0, z1], sunk 1 below the court surface (CN, CS). */
export const FOUNTAINS = { CN: [76, 85, 81, 90], CS: [76, 85, 278, 287] };

/** Flagpole columns (x) and the z of the north and south apron rows. */
export const FLAG_X = [4, 9, 14];

export const FLAG_Z = { north: 165, south: 212 };

/** Antenna masts on the crown (M7c): [x, z]. */
export const MASTS = [[83, 172], [114, 172], [83, 204], [114, 204]];

/** City emblem disc on the west face: centre (x, y, z) and radius. */
export const EMBLEM = { x: 17, y: 30, z: 188, r: 4 };

/** True if the block column at (x, z) stands on a footprint cell ('#'). */
export function onFootprint(x, z)

/** Ground height at (x, z): the grass surface sits at y = height, dirt below. -1 = no ground.
 *  The slots on rows 17 and 24 outside x 63..134 are not footprint and stay untouched (plan.md). */
export function groundAt(x, z)

/** Seeded PRNG (mulberry32): rng(seed)() returns floats in [0, 1); the same seed gives the same sequence. */
export function rng(seed)

// ---- palette (1.21.1; every id here is in palette.json) ------------------------------------------------------------
export const smoothSandstone = "smooth_sandstone";                 // body: piers, parapets, tower faces

export const smoothSandstoneSlab = "smooth_sandstone_slab";       // string course

export const smoothSandstoneStairs = "smooth_sandstone_stairs";   // body variant

export const whiteTerracotta = "white_terracotta";                // spandrels, tower panels

export const cutSandstone = "cut_sandstone";                      // quoins, tower joint lines

export const smoothQuartz = "smooth_quartz";                      // coping, emblem disc, canopy

export const smoothQuartzSlab = "smooth_quartz_slab";             // coping and cornice line

export const smoothQuartzStairs = "smooth_quartz_stairs";         // coping variant

export const quartzPillar = "quartz_pillar";                      // portico columns, spur piers

export const polishedAndesite = "polished_andesite";              // plinth, paving, flagpole bases

export const polishedAndesiteSlab = "polished_andesite_slab";     // slab ramp

export const andesiteWall = "andesite_wall";                      // lamp posts

export const smoothStone = "smooth_stone";                        // ground-storey piers, lintels, floors

export const smoothStoneSlab = "smooth_stone_slab";               // roof decks

export const grayStainedGlass = "gray_stained_glass";             // office glass

export const lightBlueStainedGlass = "light_blue_stained_glass";  // lobby and entrance glass

export const grayStainedGlassPane = "gray_stained_glass_pane";    // glass pane variant

export const lightBlueStainedGlassPane = "light_blue_stained_glass_pane";

export const glassPane = "glass_pane";                            // door openings

export const blackConcrete = "black_concrete";                    // dark backing behind the glass

export const shroomlight = "shroomlight";                         // warm lit window

export const seaLantern = "sea_lantern";                          // cool lit window, lobby ceilings

export const ochreFroglight = "ochre_froglight";                  // warm crown light, floodlit course

export const pearlescentFroglight = "pearlescent_froglight";      // cool crown band

export const lantern = "lantern";                                 // roof and lamp lanterns

export const lightGrayConcrete = "light_gray_concrete";           // mechanical penthouses, plant boxes

export const ironBars = "iron_bars";                              // louvres, flagpoles, masts

export const blueConcrete = "blue_concrete";                      // emblem ring

export const yellowConcrete = "yellow_concrete";                  // emblem core

export const lightningRod = "lightning_rod";                      // mast tips, flagpole tips

export const redstoneTorch = "redstone_torch";                    // aircraft lights

export const redBanner = "red_banner";                            // national flags

export const whiteBanner = "white_banner";                        // city flags, name letters

export const blueBanner = "blue_banner";                          // national canton, name letters

export const grassBlock = "grass_block";                          // courtyard lawn

export const mossBlock = "moss_block";                            // planters, plant boxes

export const floweringAzaleaLeaves = "flowering_azalea_leaves";   // planters

export const oakLog = "oak_log";                                  // tree trunks

export const jungleLog = "jungle_log";                            // tree trunks

export const oakLeaves = "oak_leaves";                            // tree crowns (persistent)

export const jungleLeaves = "jungle_leaves";                      // tree crowns (persistent)

export const water = "water";                                     // fountain basins

export const dirtPath = "dirt_path";                              // court paths

export const ironDoor = "iron_door";                              // main and courtyard doors

export const dirt = "dirt";                                       // subsoil under the ground surface (build.mjs)
```

### vocab/h1.mjs

```js
// Vocabulary helpers, part h1 (plan.md VOCABULARY): plinth, stringCourse, quoin, plantBox, floodCourse,
// canopyLight, slabRamp, flagpole, fountain.
//
// Every helper takes its position (and facing, where it has one) as arguments and writes only inside the footprint
// it is given. It writes only into air unless opts.replace is true, so an earlier part's ground, floor and walls are
// never overwritten. Each returns { placed, refused }: refused counts cells skipped because they were occupied
// (or, with the footprint check, outside the box).

/** plinth: polished_andesite over the box, from the ground up (ground cells are not air, so they stay as they are). */
export function plinth(g, box, opts = {})

/**
 * stringCourse: smooth_sandstone_slab (top), 1 proud of the wall plane (plan: string course at y 7).
 * face: "west" | "east" | "north" | "south", the side the course is on. wall: the wall plane's cell (x for east/west,
 * z for north/south). span: [a, b] along the wall, inclusive (z for east/west, x for north/south).
 */
export function stringCourse(g, face, wall, span, y = 7, opts = {})

/**
 * floodCourse: ochre_froglight set flush in the wall plane at y (plan: 62), on the faces the caller names.
 * Flush means inside the wall, so the wall it lies on must be dressed with { replace: true }.
 * Arguments as stringCourse.
 */
export function floodCourse(g, face, wall, span, y = 62, opts = {})

/** quoin: cut_sandstone, 1 wide, flush on a corner, from y0 to y1 (plan: every tower corner). */
export function quoin(g, [x, z], y0, y1, opts = {})

/**
 * plantBox: 5x5 plant box on a roof, centred on (cx, cz), y 68..70 (plan ROOFS / plantBox).
 * Light-gray concrete rim, moss_block soil on the floor, a concrete post in the centre carrying a standing
 * redstone_torch at y 71. Footprint: 5x5, y 68..71.
 */
export function plantBox(g, cx, cz, opts = {})

/**
 * canopyLight: sea_lantern flush in the portico canopy underside at (x, 12, z) (plan: every 4 cells).
 */
export function canopyLight(g, x, z, opts = {})

/**
 * slabRamp: bottom polished_andesite slabs over the box (half steps only, no stairs). Plan: a 2-cell-long ramp
 * across the portico width, e.g. [0, 1, 170, 1, 1, 207]. Both spans must be at least 2 cells.
 */
export function slabRamp(g, box, opts = {})

/**
 * flagpole: stone base (y 1..2), iron_bars pole (y 3..20), lightning_rod tip (y 21) at (x, z), and one wall banner
 * at y 18 on the `side` of the pole (default west). kind: "national" (red, blue canton) or "city" (white).
 * Footprint: the pole column plus the banner cell.
 */
export function flagpole(g, x, z, kind = "city", side = "west", opts = {})

/**
 * fountain: a basin over the box (plan: CN/CS basins, y 1..2). Quartz walls and rim round the edge, water inside.
 * Arguments: the basin's inclusive box, e.g. [76, 1, 81, 85, 2, 90].
 */
export function fountain(g, box, opts = {})
```

### vocab/h2.mjs

```js
// Vocabulary helpers, part 2: officeBay, groundBay, roofDeck, mast, spurPavilion, lobbyGlass, nameBand, lampPost,
// planter. Each takes its own position as arguments, writes only its own footprint, and only into air. A facade or
// roof helper that must replace the earlier part's skin names those blocks in opts.over (e.g. ["smooth_sandstone"]).
// Any other existing block is refused and listed in the returned refused array; nothing is thrown for a world conflict.
// Every helper returns { placed, refused: [[x, y, z, wanted, found]] }.

/** Office bay for one storey f..f+4: a 1-wide smooth_sandstone pier, then a 2-wide window, glazed 1 deep with black
 *  backing 2 deep, white_terracotta spandrels flush at f, f+1 and f+4. origin = [x, z] of the pier on the wall plane. */
export function officeBay(g, face, origin, f, opts = {})

/** Ground-storey bay, 6 long (pier + 5 panes), y 2..6: smooth_stone pier and lintel flush, glass 2 deep at y 3..5, and a
 *  light 3 deep at the middle row behind every other pane (k 1, 3, 5). opts.glass / opts.light / opts.lit = false. */
export function groundBay(g, face, origin, opts = {})

/** Flat roof behind a parapet. box = [x0, z0, x1, z1] is the footprint; y is the deck cell (bottom slab). The parapet is
 *  smooth_sandstone at y+1..y+2 on the footprint edge, the smooth_quartz_slab coping sits 1 proud of it at y+2, and a
 *  lantern stands on the deck just inside the parapet, every 8th cell round the inner ring. */
export function roofDeck(g, [x0, z0, x1, z1], y, opts = {})

/** Aircraft mast: iron_bars y..y+2, lightning_rod y+3..y+4, a lit redstone_torch on top at y+5. (x, z) is the column,
 *  y its base cell (the first cell above the roof slab). */
export function mast(g, x, y, z, opts = {})

/** Glazed spur pavilion on footprint box = [x0, z0, x1, z1]; the spine runs along the longer side and its two long
 *  faces are glazed. Quartz pillars on the wall plane every 4 cells and at both ends, y 2..9; glass panes 1 deep between
 *  them; sea_lantern 2 deep behind the panes at y 2..5 (the lit link); a bottom-slab deck at y 10 with a 3-wide glass
 *  skylight down the spine. Ends (the glass doors) are left to the openings. */
export function spurPavilion(g, [x0, z0, x1, z1], opts = {})

/** The entrance hall's glass wall: light_blue_stained_glass over the whole box = [x0, y0, z0, x1, y1, z1], with rows of
 *  sea_lantern one cell behind it (x1 + 1) at y0+4 and y0+8 (6 and 10 for a hall from y 2). */
export function lobbyGlass(g, [x0, y0, z0, x1, y1, z1], opts = {})

/** "TAIPEI CITY HALL" in blue banner letters on white, reading left to right from the street. center = [x, y, z] of the
 *  middle letter, in front of the board (x = the fascia cell's outside), face = the way the board looks (west by default).
 *  bannerWord writes only into air and skips the rest, so placed counts the letters it wrote. */
export function nameBand(g, center, opts = {})

/** Lamp post on the apron: andesite_wall 3 high from base y, a lantern standing on top at y+3. Nothing below y. */
export function lampPost(g, x, y, z, opts = {})

/** Planter on a roof terrace: moss_block soil on the box's bottom layer, persistent flowering_azalea_leaves on top. The
 *  box is at most 2 high, so the 2 cells above it stay clear for a walker. */
export function planter(g, [x0, y0, z0, x1, y1, z1], opts = {})
```

### vocab/h3.mjs

```js
// h3 vocabulary: litWindow, towerFace, penthouse, crownBand, column, doubleDoor, emblemDisc, tree, litEntry.
// Conventions (every helper):
//   - boxes are inclusive [x0, y0, z0, x1, y1, z1]; `dir` is the outward direction of the wall (north|south|east|west).
//   - each helper takes its own position and writes only inside its footprint, and only into air. The one exception is
//     a surface it dresses: pass { over: true } to let it swap that named surface block (smooth_sandstone, smooth_quartz)
//     and nothing else. A cell that is solid and not named is left alone.
//   - every helper returns the number of blocks it placed.
// Penthouse roof: smooth_stone_slab (the roof-deck material; vanilla has no concrete slabs).

/** Swap one backing cell (black_concrete) for a light. Writes that one cell and only while it still holds the backing. */
export function litWindow(g, [x, y, z], kind)

/**
 * Dress one face of a tower box. Depth 0 is the face plane, depth 1 and 2 the cells behind it. The face is blank
 * smooth_sandstone, with cut_sandstone joint courses at y 7, 12, ... (the joints swap smooth_sandstone with over).
 * Two slot columns per storey at 1/3 and 2/3 of the width: opening at depth 0 (left air), glass at depth 1 with
 * black_concrete backing at depth 2; one slot in four is sea_lantern at depth 1 instead.
 */
export function towerFace(g, dir, box, { over = false } = {})

/** Hand-built penthouse box: light_gray_concrete walls, iron_bars louvres (default the two rows 3 and 4 up), slab roof on the top row. */
export function penthouse(g, box, { louvres = null } = {})

/**
 * Crown light courses on the perimeter of a box: ochre_froglight on the bottom course (the light slot under the coping,
 * off with slot: false) and pearlescent_froglight on the top course (the cool band). Pass the crown walls' box.
 */
export function crownBand(g, box, { over = false, slot = true } = {})

/** A 2x2 quartz_pillar column with its low-x, low-z corner at (x, z), from y0 to y1 (portico columns: y 2..12). */
export function column(g, x, z, { y0 = 2, y1 = 12 } = {})

/**
 * A double iron door in a wall, two 1x2 leaves side by side. pos is the left leaf's lower cell; `facing` is the way you
 * walk in (the leaves' hinges are on their outer edges). Writes all four halves or none (both halves of both leaves).
 */
export function doubleDoor(g, [x, y, z], facing)

/**
 * A round emblem disc of radius r (default 4, 9 cells across) on the plane through center, one proud of the wall.
 * `dir` is the outward direction of the wall. Blue ring at the edge, yellow core at the centre, smooth_quartz between,
 * and a shroomlight set in the wall directly behind the centre.
 */
export function emblemDisc(g, [cx, cy, cz], dir, { r = 4 } = {})

/**
 * A tree on the ground: a straight trunk above groundY (the grass cell it stands on; nothing is written at or below it),
 * then an irregular crown of persistent leaves four cells tall. wood: oak | jungle.
 */
export function tree(g, x, groundY, z, { h = 5, wood = "oak" } = {})

/**
 * A lit entry in a wall opening. The glass fills box (light_blue_stained_glass) with a sea_lantern one cell inside each
 * pane. canopy: a 1-deep smooth_quartz_slab on the row above, out over the street. dir = outward direction of the wall.
 */
export function litEntry(g, box, dir, { canopy = false, glass = "light_blue_stained_glass" } = {})
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

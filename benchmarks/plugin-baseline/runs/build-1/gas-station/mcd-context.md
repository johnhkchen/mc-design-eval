# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
# Plan: modern gas station with convenience store (FORM)

Identity: a crisp roadside fuel stop. A big flat white canopy with a red brand stripe floats on slim columns over two pump islands; behind it a low flat-roofed store: a glass storefront volume (white) beside a taller grey service block, under a red fascia sign. Price pylon at the street corner. White / grey / black / one red.

## SITE

Lot 42 wide (x 0..41) by 38 deep (z 0..37). Front faces NORTH (-z); x runs along the street. Ground surface is the y=0 layer everywhere (flat); everything stands on y=1. Store floor is at y=0 (flush, no steps).

| Mass / feature | x | y | z | notes |
|---|---|---|---|---|
| Street (asphalt) | 0..41 | 0 | 0..4 | yellow dashed centre line at z=2 (3 on, 3 off) |
| Sidewalk | 0..41 | 0 | 5..6 | smooth stone; curb cuts (asphalt) at x 7..14 (IN) and x 27..34 (OUT) |
| Forecourt asphalt | 6..35 | 0 | 7..23 | the drive; also x 1..34 z 21..23 front lane |
| West verge (grass) | 0..5 | 0 | 7..20 | two birch trees |
| East verge (grass) | 36..41 | 0 | 7..20 | price pylon + one tree |
| Fuel canopy deck | 6..34 | 7..9 | 9..20 | flat, 29 x 12; underside y=7 |
| Canopy columns (4) | 13..14 and 26..27 | 2..6 | 12 and 17 | 2 x 1 each, on the islands |
| Pump island A (curb) | 13..14 | 1 | 11..18 | raised 1 |
| Pump island B (curb) | 26..27 | 1 | 11..18 | raised 1 |
| Store apron (walk) | 9..32 | 0 | 21..23 | smooth stone paving in front of store |
| Shop volume (glass front) | 9..23 | 1..7 | 24..33 | walls y1..5, roof deck y6, parapet y7 |
| Service block (taller) | 24..32 | 1..9 | 24..33 | walls y1..7, roof deck y8, parapet y9 |
| Storefront awning | 10..23 | 5 | 22..23 | 2-deep cantilever, top slabs |
| Parking (west) | 1..7 | 0 | 24..33 | 3 stalls (z 24..26, 27..29, 30..32), white stripes at z 23, 26.., nose west; EV chargers at x=1 |
| Air / water station | 36..37 | 1..2 | 23 | on a 1-high plinth |
| Ice chest + propane cage | 25..30 | 1..2 | 22..23 | in front of service block |
| Dumpster enclosure | 35..39 | 1..2 | 29..33 | 3-sided wall, open to west (x=35 side open) |
| Price pylon | 37..40 | 1..13 | 8..9 | footing 38..39 y1..2; panel 37..40 y4..13 |
| Back strip (grass + hedge) | 0..41 | 0..2 | 34..37 | hedge at z=36, y1..2 |
| Light poles (2) | 5 and 36 | 1..6 | 21 | |

Circulation: in at x 7..14, lanes either side of each island (x 7..12, 15..25, 28..34), out at x 27..34. Nothing stands in a lane.

## ROOFS

| Roof | form | height | how built |
|---|---|---|---|
| Shop volume | `$MCD roof --preset modern` (flat-parapet-modern): flat deck, parapet, smooth-stone coping, slim cornice, rooftop rail | deck y=6, parapet+coping y=7 | roof tool, footprint x 9..23 z 24..33, y=6; keep = the sign cells (x 12..21, y 6..7, z 23) |
| Service block | `$MCD roof --preset modern` | deck y=8, parapet+coping y=9 | roof tool, footprint x 24..32 z 24..33, y=8 |
| Junction | the taller block's west wall (x=24) rises above the shop roof y6..9 as a clean step; shop parapet butts into it | | |
| Fuel canopy | flat slab deck, NO pitch, hand-built by the canopy part (not the roof tool) | underside y=7, fascia y7..9, top y=9 | see FACADES |
| Rooftop HVAC | 2 units on the service roof, x 26..27 and 29..30, z 28..29, y 9..10 (iron_block body, iron_trapdoor top) | | added by detail part onto the deck |

Overhang: canopy oversails the columns by 7 (x) and 3 (z); the storefront awning is the shop's shadow line. No pitched roofs anywhere (modern).

## FACADES

**Fuel canopy (seen from every side; the signature).**
| y | element | material | depth |
|---|---|---|---|
| 9 | fascia top course + flat top (fill x 7..33 z 10..19) | white_concrete | flush |
| 8 | brand stripe, full perimeter ring | red_concrete | flush |
| 7 | fascia bottom course (perimeter) | white_concrete | flush |
| 7 | soffit (interior x 7..33, z 10..19) | smooth_quartz, with sea_lantern flush at x 10, 16, 20, 24, 30 on z 12 and z 17 (light grid) | flush |
| 2..6 | columns 2 x 1 | smooth_quartz, base course y2 polished_andesite | proud of island |
Small "brand roundel" on the canopy's north fascia centre: x 19..21, y 7..9, z 8 (proud 1): white_concrete ring with red_concrete centre at y8 — reserved, added by the sign part.

**Pump islands.** Curb y1 polished_andesite with smooth_stone_slab caps at the island ends (z 11 and 18). Yellow bollards: yellow_concrete y2 at x 13 and 14 on z 11 and z 18. Pumps (reserved, see RESERVED) between the columns.

**Store, north face (z=24), the street face.**
| zone | x | y | element | material |
|---|---|---|---|---|
| base | 9..32 | 0 | apron/plinth course outside | smooth_stone |
| corner pier W | 9..10 | 1..5 | solid pier | white_concrete |
| storefront | 11..22 | 1..4 | glass curtain wall | light_blue_stained_glass_pane |
| mullions | 13, 20 | 1..4 | vertical bars | black_concrete |
| doors | 16..17 | 1..2 | double glass doors (glazier) | iron_door pair (hinges mirrored), transom glass y3..4 above |
| pier | 23 | 1..5 | slim pier | black_concrete |
| awning | 10..23 | 5 | cantilever, 2 deep (z 22..23) | smooth_quartz_slab (type top) |
| sign band | 9..23 | 5 | wall course behind awning | red_concrete |
| parapet | 9..23 | 6..7 | fascia/parapet | red_concrete y6, roof-tool coping y7 |
| lettering | 12..21 | 6..7 | "MART" letters standing on the awning, proud 1 at z=23 | white_concrete (sign part) |
| service block front | 24..32 | 1..7 | solid clad panel | gray_concrete; a 1-deep recessed vertical slot window x 28, y 2..6 (glass), black_concrete frame x 27 and 29 proud 0 |
| service block top | 24..32 | 8..9 | parapet | gray_concrete y8, coping roof tool |
| logo panel | 25..26 | 4..6 | red square, proud 1 at z=23 | red_concrete (sign part) |

**West face (x=9).** White_concrete, a 2-wide window band x=9 z 26..31, y 2..4 (light_blue pane), black_concrete sill course y1 under it. Faces the parking.
**East face (x=32).** Gray_concrete; service door z 31 y1..2; nothing else.
**South face (z=33).** White (shop) / gray (service); back door x 29..29 y1..2 (stock delivery); a black_concrete plinth course y1 the full length on every face of the store.
Plinth: y=1 course is black_concrete on all store faces EXCEPT where glass/doors sit (storefront glass goes to y1).

**Price pylon.** Footing x 38..39 y1..2 polished_andesite; mast x 38..39 y3 gray_concrete; panel x 37..40 z 8..9 y4..13: y11..13 red_concrete brand head with white_concrete roundel at y12; y4..10 black_concrete price board; white_concrete frame on x 37 and x 40. Price rows (sign part): sea_lantern/white digits at y 5, 7, 9 on z=7 face (proud? no: flush replacements are not allowed, so the pylon part builds the rows itself).

## MATERIALS

| role | block id | ~share |
|---|---|---|
| canopy fascia, shop body, columns | white_concrete / smooth_quartz | dominant 55% |
| service block, canopy top, poles | gray_concrete | 20% |
| brand accent (stripe, sign band, pylon head, logo) | red_concrete | 10% |
| frames, mullions, plinth course, price board | black_concrete | 8% |
| glass, store | light_blue_stained_glass_pane | |
| glass, service slot | gray_stained_glass_pane | |
| awning | smooth_quartz_slab | |
| coping / curbs / apron / sidewalk | smooth_stone, smooth_stone_slab, polished_andesite | |
| asphalt | gray_concrete_powder (reads darker/matte vs walls) — street and forecourt | |
| road paint | yellow_concrete (centre line, bollards), white_concrete (stall stripes) | |
| lights | sea_lantern (canopy soffit), lantern on poles only if lamplighter needs | |
| ground | grass_block, coarse_dirt patches, short_grass, dandelion | |
| trees | birch_log (axis y), birch_leaves (persistent) | |
| hedge | azalea_leaves / flowering_azalea (persistent) | |
| roof deck | per `modern` preset (smooth stone deck, coping) | |
All ids checked with `$MCD blocks --check`: all known. No wood except birch trees; no nether blocks.

## OPENINGS

| face | opening | x | y | z | size |
|---|---|---|---|---|---|
| shop N | storefront glass bay 1 | 11..12 | 1..4 | 24 | 2 x 4 |
| shop N | glass bay 2 | 14..15 | 1..4 | 24 | 2 x 4 |
| shop N | main double door | 16..17 | 1..2 | 24 | 2 x 2 (iron_door pair, facing north) |
| shop N | transom over door | 16..17 | 3..4 | 24 | glass |
| shop N | glass bay 3 | 18..19 | 1..4 | 24 | 2 x 4 |
| shop N | glass bay 4 | 21..22 | 1..4 | 24 | 2 x 4 |
| service N | slot window | 28 | 2..6 | 24 | 1 x 5, recessed 1 (glass at z=25) |
| shop W | window band | 9 | 2..4 | 26..31 | 6 x 3 |
| service E | side door | 32 | 1..2 | 31 | 1 x 2 (iron_door facing east) |
| service S | delivery door | 29 | 1..2 | 33 | 1 x 2 (iron_door facing south) |
| shop S | none (cooler wall inside) | | | | |

The shell leaves all these as air; the glazier fills them.

## RESERVED (shell leaves empty)

| what | cells |
|---|---|
| pumps, island A | x 13..14, y 2..4, z 14..15 (2 pumps, each 2 wide x 1 deep, 3 tall incl. screen/handle) |
| pumps, island B | x 26..27, y 2..4, z 14..15 |
| hose/air between pump and column | x 13..14 and 26..27, y 2..3, z 13 and 16 (keep clear) |
| canopy brand roundel | x 19..21, y 7..9, z 8 |
| store lettering | x 12..21, y 6..7, z 23 |
| service logo panel | x 25..26, y 4..6, z 23 |
| slot window recess | x 28, y 2..6, z 24 (air; glass at z 25) |
| EV chargers | x 1, y 1..2, z 25 and z 28 |
| rooftop HVAC | x 26..27 and 29..30, y 9..10, z 28..29 (on service deck) |
| light poles | x 5 and 36, y 1..6, z 21 |
| tree trunks | (2,0,10), (2,0,17), (40,0,16): grass under, 5 x 5 crown clear above y 4 |

## FLOORS

| volume | floor y | interior (air) | notes |
|---|---|---|---|
| Shop (sales floor) | 0 (polished_andesite / smooth_quartz checker-free: smooth_quartz) | x 10..22, y 1..5, z 25..32 | 13 x 8 open hall: checkout counter by the door, shelving aisles running N-S, cooler wall on the south (z 32) |
| Service block | 0 | x 25..31, y 1..7, z 25..32 | 7 x 8; split by the second designer: restroom(s) N, stock room S with the delivery door; opens to the shop through the x=24 wall (door at x 24, z 30, y1..2 — interior opening, shell leaves it) |
| Roofs | 6 (shop), 8 (service) | not accessible | |

One storey only. No stairs.

---
# DESIGNER SECTIONS

## PALETTE
| role | blocks (all checked with `$MCD blocks --check`; `chain` is unknown, use `iron_chain`) |
|---|---|
| white body | white_concrete, smooth_quartz, smooth_quartz_slab, smooth_quartz_stairs |
| grey | gray_concrete, gray_concrete_slab, gray_concrete_stairs, gray_concrete_powder (asphalt) |
| red accent | red_concrete |
| black | black_concrete |
| stone | smooth_stone, smooth_stone_slab, smooth_stone_stairs, polished_andesite, polished_andesite_slab, polished_andesite_stairs |
| glass | light_blue_stained_glass_pane, gray_stained_glass_pane, white_stained_glass_pane |
| doors | iron_door, iron_trapdoor, iron_bars |
| light | sea_lantern, lantern, end_rod |
| road paint | yellow_concrete, white_concrete |
| fittings | iron_block, lever, hopper, dispenser, cauldron, barrel, chest, hay_block, iron_chain, stone_button, stone_pressure_plate, smooth_stone_wall, light_gray_concrete, flower_pot |
| ground | grass_block, coarse_dirt, short_grass, dandelion |
| plants | birch_log (axis y), birch_leaves (persistent true), azalea_leaves, flowering_azalea (persistent true) |

## VOCABULARY
- `canopy_deck(x0,z0,x1,z1)`: y7 smooth_quartz soffit, perimeter ring white_concrete; y8 ring red_concrete; y9 ring and fill white_concrete; sea_lantern at the light grid on y7.
- `canopy_column(x,z)`: 2x1 (x..x+1) smooth_quartz y3..6, polished_andesite y2.
- `pump_island(x,z0,z1)`: polished_andesite y1 x..x+1; smooth_stone_slab top on end cells; yellow_concrete y2 bollards at (x,z0),(x+1,z0),(x,z1),(x+1,z1).
- `fuel_pump(x,z)`: 2 wide x1 deep, y2..4: y2..3 white_concrete body, black_concrete screen at y3 on the north and south faces, red_concrete top y4, gray_stained_glass_pane none; hose = iron_chain axis y hung beside at y2..3 on the end cell, lever nozzle on the side.
- `asphalt_strip(x0,z0,x1,z1)`: gray_concrete_powder at y0 (powder is gravity: it sits on a block, ground below is filled with gray_concrete at y-1 if the grid has one; else set it on the ground layer).
- `centre_dashes(z=2)`: yellow_concrete 3 on, 3 off along x0..41.
- `curb_cut(x0,x1)`: asphalt over the sidewalk cells at z5..6.
- `storefront_bay(x0,x1)`: light_blue_stained_glass_pane y1..4 with connections set; black_concrete mullions at x13, x20.
- `glass_double_door(x,z,facing)`: two iron_door (lower+upper) mirrored hinges, same facing; glass transom above.
- `awning(x0,x1)`: smooth_quartz_slab type top at y5, z22..23.
- `mart_letters`: 5-high block letters M A R T (3 wide each, 1 gap) white_concrete at z23, y6..7 need 2 rows only: use 2-high stylised block letters spaced x12..21; each letter on red fascia.
- `logo_panel(x,y,z)`: 2x3 red_concrete with white_concrete 1x1 centre dot.
- `brand_roundel`: 3x3 white_concrete with red_concrete centre.
- `slot_window`: recess at x28 y2..6 air at z24; gray_stained_glass_pane at z25; black_concrete at x27, x29.
- `hvac_unit(x,z)`: iron_block 2x2 y9, iron_trapdoor top (open false) y10, light_gray_concrete side vent patch.
- `price_pylon`: as FACADES; digits via sea_lantern/white_concrete.
- `ev_charger(x,z)`: white_concrete y1, black_concrete y2 with lever, iron_chain cable.
- `parking_stall(x0,z0,z1)`: white_concrete stripes at the stall edges, 4 long.
- `light_pole(x,z)`: gray_concrete wall-or-polished_andesite base y1, smooth_stone_wall y2..5, lantern y6 standing; no floating.
- `air_station(x,z)`: polished_andesite plinth y1, iron_block y2, lever and hopper hint.
- `ice_chest(x,z)`: 3x1 white_concrete, light_blue_stained_glass_pane lid? use quartz slab lid y2.
- `propane_cage(x,z)`: iron_bars cage 2x2x2 over cauldron stand.
- `dumpster_enclosure`: smooth_stone_wall? use gray_concrete walls y1..2 on 3 sides, dumpster = 3x2 barrel-free: gray_concrete lower with green? no, black_concrete lid slab.
- `birch_tree(x,z)`: birch_log y1..5 axis y, crown birch_leaves persistent 5x5 irregular y4..7 on grass.
- `hedge_run(x0,x1,z)`: azalea_leaves y1..2 persistent true with flowering_azalea 1 in 6.

## ROOMS
Shop interior x10..22 y1..5 z25..32, floor y0 smooth_quartz. Service interior x25..31 y1..7 z25..32, floor y0 polished_andesite.
- Sales floor [10,1,25,22,5,32]: counter by the door (x15..18 z26..27), N-S shelf aisles, cooler wall on z32. In: main door (16..17,1..2,24); interior doorway (24,1..2,30) to stock; window band west x9.
- Restroom A [25,1,25,26,7,28]: door at (27,1..2,27) from the hall.
- Restroom B [30,1,25,31,7,28]: door at (29,1..2,27) from the hall.
- Hall [28,1,26,28,7,28]: 1 wide, lit by the slot window (glass at z25); door (28,1..2,29) south to stock.
- Stock room [25,1,30,31,7,32]: shelving, barrels, delivery door (29,1..2,33), side door (32,1..2,31), shop doorway (24,1..2,30), hall door (28,1..2,29).
The shell part builds partitions: wall x=27 and x=29 (z25..28, y1..7, gray_concrete), wall z=29 (x25..31) with doorways left air; wall x=24 (shared) with doorway at z30.

## PARTS
1. Store shell (parts/shell.mjs, mason): both volumes, floors, plinth, piers, sign band, parapet cells under roof, partitions, all openings air.
2. Roofs (parts/roofs.mjs, roofer): roof.json x2 (modern), step at x24, HVAC.
3. Fuel canopy (parts/canopy.mjs): deck, columns, islands, bollards, pumps.
4. Openings and signs (parts/fittings.mjs, glazier): glazing, doors, awning, letters, logo, roundel, slot window.
5. Site and grounds (parts/grounds.mjs, gardener): street, sidewalk, asphalt, paint, parking, grass, trees, hedge, poles.
6. Forecourt fittings (parts/forecourt.mjs): pylon, air, ice, propane, dumpster, EV chargers.

## Notes for workers
- Ground y=0 everywhere; building starts at y1. Do not fill reserved cells. Run `$MCD check` and `$MCD walk build.nbt --rooms rooms.json`.
- Parts run in order; the shell goes first, ground before the pylon and fittings.
```

### elements.md

```markdown
# REQUIRED ELEMENTS: modern gas station with convenience store
Coordinates are the architect's (plan.md). y=0 is ground/store floor. Part numbers: P1 store shell, P2 roofs, P3 fuel canopy and pumps, P4 openings and signs, P5 site and grounds, P6 forecourt fittings.

- [ ] **Fuel canopy** (P3, `canopy_deck`): flat deck x6..34 z9..20. y7 soffit smooth_quartz x7..33 z10..19 with sea_lantern at x10,16,20,24,30 on z12 and z17; y7 perimeter ring white_concrete; y8 ring red_concrete; y9 white_concrete top fill x7..33 z10..19 plus ring. Nothing pitched.
- [ ] **Canopy columns x4** (P3, `canopy_column`): x13..14 and x26..27 at z12 and z17, y2..6, smooth_quartz, y2 polished_andesite base; they reach up under the soffit at y7.
- [ ] **Pump islands A, B** (P3, `pump_island`): x13..14 / x26..27, y1, z11..18 polished_andesite; smooth_stone_slab (top) caps at z11 and z18; yellow_concrete bollards y2 at corners of each island end.
- [ ] **Fuel pumps x4** (P3, `fuel_pump`): island A x13..14 and island B x26..27, z14..15, y2..4; pump body white_concrete with black_concrete screen and red_concrete head, hose = iron_chain/lever side; keep z13 and z16 clear.
- [ ] **Brand roundel** (P4, `brand_roundel`): x19..21 y7..9 z8: white_concrete ring, red_concrete centre at (20,8,8).
- [ ] **Store block, glass front** (P1 shell, P4 glass): x9..23 z24..33, white_concrete walls, black_concrete plinth y1, flat deck y6; storefront bays, mullions x13, x20 black_concrete, light_blue_stained_glass_pane.
- [ ] **Entrance double door** (P4, `glass_double_door`): (16..17,1..2,24) iron_door pair, hinges mirrored, facing north; transom glass (16..17,3..4,24).
- [ ] **Awning** (P4, `awning`): smooth_quartz_slab top x10..23 y5 z22..23 on red sign band wall x9..23 y5 z24.
- [ ] **"MART" sign** (P4, `mart_letters`): x12..21 y6..7 z23 white_concrete letters on the red fascia.
- [ ] **Service block** (P1, P4): x24..32 z24..33 y1..7 gray_concrete; slot window x28 y2..6 (glass_pane gray at z25, black frames x27, x29); logo panel red_concrete x25..26 y4..6 z23 (`logo_panel`).
- [ ] **Flat roofs with parapet and coping** (P2): roof tool preset modern: shop deck y6, service deck y8; west wall x24 rises y6..9 as the step.
- [ ] **Rooftop HVAC x2** (P2, `hvac_unit`): x26..27 and x29..30, z28..29, y9..10.
- [ ] **Price pylon** (P6, `price_pylon`): footing x38..39 y1..2, mast y3, panel x37..40 z8..9 y4..13, red head y11..13 with white roundel at y12, black board y4..10 with sea_lantern/white digit rows at y5,7,9 on z=7 face built as proud blocks.
- [ ] **Street, sidewalk, curb cuts, dashed line** (P5, `asphalt_strip`, `centre_dashes`).
- [ ] **Forecourt asphalt, apron** (P5).
- [ ] **Parking, 3 stalls, white stripes** (P5, `parking_stall`) x1..7 z24..33; **EV chargers** (P6, `ev_charger`) x1 z25 and z28.
- [ ] **Air/water station** (P6, `air_station`): plinth x36..37 y1 z23, post y2.
- [ ] **Ice chest, propane cage** (P6, `ice_chest`, `propane_cage`) x25..30 z22..23.
- [ ] **Dumpster enclosure** (P6, `dumpster_enclosure`) x35..39 z29..33, open west; dumpster inside.
- [ ] **Light poles x2** (P5, `light_pole`) at (5,*,21), (36,*,21), y1..6.
- [ ] **Trees x3, verges, hedge** (P5, `birch_tree`, `hedge_run`): trunks (2,0,10),(2,0,17),(40,0,16); hedge z36 y1..2.
- [ ] **Interior**: sales floor, restrooms, hall, stock room (rooms; shell part builds floors, partitions and interior doorways only).
- [ ] **Rear and side doors** (P4): east (32,1..2,31), south (29,1..2,33).
```

### rooms.json

```json
{"entrance":[16,0,22],"rooms":[{"name":"Sales floor","box":[10,1,25,22,5,32]},{"name":"Restroom A","box":[25,1,25,26,7,28]},{"name":"Restroom B","box":[30,1,25,31,7,28]},{"name":"Hall","box":[28,1,26,28,7,28]},{"name":"Stock room","box":[25,1,30,31,7,32]}]}
```

### palette.json

```json
{"roles":{"white":["white_concrete","smooth_quartz","smooth_quartz_slab","smooth_quartz_stairs"],"grey":["gray_concrete","gray_concrete_slab","gray_concrete_stairs","gray_concrete_powder","light_gray_concrete"],"red":["red_concrete"],"black":["black_concrete"],"stone":["smooth_stone","smooth_stone_slab","polished_andesite","polished_andesite_slab","polished_andesite_stairs","andesite_wall","gravel"],"glass":["light_blue_stained_glass_pane","gray_stained_glass_pane","white_stained_glass_pane"],"doors":["iron_door","iron_trapdoor","iron_bars"],"light":["sea_lantern","lantern","end_rod"],"road_paint":["yellow_concrete","white_concrete"],"fittings":["iron_block","lever","hopper","dispenser","cauldron","barrel","chest","hay_block","iron_chain","stone_button","stone_pressure_plate","light_gray_concrete","flower_pot","green_concrete","blue_concrete","oak_planks","oak_slab"],"ground":["grass_block","coarse_dirt","short_grass","dandelion"],"plants":["birch_log","birch_leaves","azalea_leaves","flowering_azalea","flowering_azalea_leaves","oxeye_daisy"]},"objects":[]}
```

### make.sh

```sh
#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which replaces build.nbt only if the build succeeds.
set -eu
cd "$(dirname "$0")"
tmp="build.tmp.$$.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// Builds build.nbt from scratch: the lot's ground, then every part in plan order (runParts locks each part's blocks).
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE_SIZE, GROUND_Y } from "./vocab/base.mjs";
import * as shell from "./parts/shell.mjs";
import * as roofs from "./parts/roofs.mjs";
import * as canopy from "./parts/canopy.mjs";
import * as fittings from "./parts/fittings.mjs";
import * as grounds from "./parts/grounds.mjs";
import * as forecourt from "./parts/forecourt.mjs";
import * as room1 from "./parts/room-1.mjs";
import * as room2 from "./parts/room-2.mjs";
import * as room3 from "./parts/room-3.mjs";
import * as room4 from "./parts/room-4.mjs";
import * as room5 from "./parts/room-5.mjs";

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(1);
}

const PARTS = [
  ["Store shell", shell.build],
  ["Roofs", roofs.build],
  ["Fuel canopy and pumps", canopy.build],
  ["Openings and signs", fittings.build],
  ["Site and grounds", grounds.build],
  ["Forecourt fittings", forecourt.build],
  ["room: Sales floor", room1.build],
  ["room: Restroom A", room2.build],
  ["room: Restroom B", room3.build],
  ["room: Hall", room4.build],
  ["room: Stock room", room5.build],
];

function buildWith(roof) {
  const g = new Grid(SITE_SIZE);
  g.fill([0, GROUND_Y, 0], [SITE_SIZE[0] - 1, GROUND_Y, SITE_SIZE[2] - 1], "grass_block");
  runParts(g, PARTS, { palette: "palette.json", roof });
  return g;
}

// The roof is laid on the shell's walls. Until the shell has walls (the stubs), there is nothing to roof: build without it.
let g;
try {
  g = buildWith("roof.json");
} catch (e) {
  if (!/no walls found/.test(e.message)) throw e;
  console.log(`roof: skipped, ${e.message} (the shell has no walls yet)`);
  g = buildWith(undefined);
}

g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Palette ids (palette.json's ids only), plan.md's site coordinates, and a seeded rng: every part imports from here.

// ---- palette ----------------------------------------------------------------------------------------------------

// ---- palette ----------------------------------------------------------------------------------------------------
export const WHITE_CONCRETE = "white_concrete"; // white body: canopy fascia, shop walls, stall stripes

export const SMOOTH_QUARTZ = "smooth_quartz"; // canopy soffit, columns, shop body

export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab"; // storefront awning (top type)

export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs"; // quartz steps and trim

export const GRAY_CONCRETE = "gray_concrete"; // grey: service block, partitions, pylon footing

export const GRAY_CONCRETE_SLAB = "gray_concrete_slab"; // grey slab caps

export const GRAY_CONCRETE_STAIRS = "gray_concrete_stairs"; // grey steps and trim

export const GRAY_CONCRETE_POWDER = "gray_concrete_powder"; // matte asphalt: street and forecourt

export const RED_CONCRETE = "red_concrete"; // brand accent: canopy stripe, sign band, pylon head, logo

export const BLACK_CONCRETE = "black_concrete"; // frames, mullions, plinth course, price board

export const SMOOTH_STONE = "smooth_stone"; // coping, apron, sidewalk, roof deck

export const SMOOTH_STONE_SLAB = "smooth_stone_slab"; // pump island caps, coping slabs

export const POLISHED_ANDESITE = "polished_andesite"; // pump island curbs, column bases, pylon footing

export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab"; // stone slab trim

export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs"; // stone steps and trim

export const LIGHT_BLUE_GLASS_PANE = "light_blue_stained_glass_pane"; // shop storefront glass

export const GRAY_GLASS_PANE = "gray_stained_glass_pane"; // service slot window glass

export const WHITE_GLASS_PANE = "white_stained_glass_pane"; // white glass trim

export const IRON_DOOR = "iron_door"; // store and service doors

export const IRON_TRAPDOOR = "iron_trapdoor"; // rooftop HVAC lids

export const IRON_BARS = "iron_bars"; // propane cage

export const SEA_LANTERN = "sea_lantern"; // canopy soffit light grid, price rows

export const LANTERN = "lantern"; // light poles

export const END_ROD = "end_rod"; // light fitting accents

export const YELLOW_CONCRETE = "yellow_concrete"; // centre line, bollards

export const IRON_BLOCK = "iron_block"; // HVAC body, air station

export const LEVER = "lever"; // pump nozzle, EV cable switch

export const HOPPER = "hopper"; // air station hint

export const DISPENSER = "dispenser"; // fittings detail

export const CAULDRON = "cauldron"; // propane stand

export const BARREL = "barrel"; // dumpster and stock fittings

export const CHEST = "chest"; // stock fittings

export const HAY_BLOCK = "hay_block"; // stock fittings

export const IRON_CHAIN = "iron_chain"; // hoses, EV cable

export const STONE_BUTTON = "stone_button"; // pylon and pump detail

export const STONE_PRESSURE_PLATE = "stone_pressure_plate"; // mat detail

export const LIGHT_GRAY_CONCRETE = "light_gray_concrete"; // HVAC side vent patch, ice chest

export const FLOWER_POT = "flower_pot"; // planter detail

export const GRASS_BLOCK = "grass_block"; // verges and ground

export const COARSE_DIRT = "coarse_dirt"; // ground patches

export const SHORT_GRASS = "short_grass"; // verge plants

export const DANDELION = "dandelion"; // verge flowers

export const BIRCH_LOG = "birch_log"; // tree trunks (axis y)

export const BIRCH_LEAVES = "birch_leaves"; // tree crowns (persistent)

export const AZALEA_LEAVES = "azalea_leaves"; // back hedge (persistent)

export const FLOWERING_AZALEA = "flowering_azalea"; // hedge flowers (persistent)

// ---- site (plan.md SITE): lot x 0..41, z 0..37, front faces north (-z) ------------------------------------------
export const SITE_SIZE = [42, 16, 38]; // grid size build.mjs makes: x, y (pylon top y13 plus headroom), z

export const GROUND_Y = 0; // ground surface layer; everything stands on y=1; store floor at y0

export const STREET = { x0: 0, x1: 41, z0: 0, z1: 4 }; // asphalt street, yellow dashes on z=2

export const SIDEWALK = { x0: 0, x1: 41, z0: 5, z1: 6 }; // smooth stone walk

export const CURB_CUT_IN = { x0: 7, x1: 14 }; // asphalt cut through the sidewalk, in

export const CURB_CUT_OUT = { x0: 27, x1: 34 }; // asphalt cut through the sidewalk, out

export const FORECOURT = { x0: 6, x1: 35, z0: 7, z1: 23 }; // the drive, dark matte asphalt

export const APRON = { x0: 9, x1: 32, z0: 21, z1: 23 }; // smooth stone paving in front of the store

export const WEST_VERGE = { x0: 0, x1: 5, z0: 7, z1: 20 }; // grass, two birch trees

export const EAST_VERGE = { x0: 36, x1: 41, z0: 7, z1: 20 }; // grass, price pylon and one tree

export const CANOPY_DECK = { x0: 6, x1: 34, y: 7, z0: 9, z1: 20 }; // flat deck; underside y7, top y9

export const CANOPY_COLUMNS = [[13, 12], [13, 17], [26, 12], [26, 17]]; // [x0, z] of each 2x1 column (y2..6)

export const ISLAND_A = { x0: 13, x1: 14, z0: 11, z1: 18 }; // raised pump island (curb y1)

export const ISLAND_B = { x0: 26, x1: 27, z0: 11, z1: 18 }; // raised pump island (curb y1)

export const SHOP_BOX = { x0: 9, x1: 23, y0: 1, y1: 7, z0: 24, z1: 33 }; // glass volume: walls y1..5, deck y6, parapet y7

export const SERVICE_BOX = { x0: 24, x1: 32, y0: 1, y1: 9, z0: 24, z1: 33 }; // taller grey block: walls y1..7, deck y8, parapet y9

export const SHOP_ROOF_Y = 6; // shop roof deck

export const SERVICE_ROOF_Y = 8; // service block roof deck

export const AWNING = { x0: 10, x1: 23, y: 5, z0: 22, z1: 23 }; // cantilever over the storefront

export const MAIN_DOOR = { x0: 16, x1: 17, y0: 1, y1: 2, z: 24 }; // double glass doors, north face

export const SLOT_WINDOW = { x: 28, y0: 2, y1: 6, z: 25 }; // recessed service slot window (glass at z25)

export const PARKING_STALLS = [[24, 26], [27, 29], [30, 32]]; // [z0, z1] of the three west stalls (x 1..7)

export const PRICE_PYLON = { x0: 37, x1: 40, y0: 1, y1: 13, z0: 8, z1: 9 }; // footing 38..39 y1..2, panel y4..13

export const LIGHT_POLES = [{ x: 5, z: 21 }, { x: 36, z: 21 }]; // height y1..6

export const TREES = [[2, 10], [2, 17], [40, 16]]; // birch trunk cells on the grass (x, z)

export const DUMPSTER = { x0: 35, x1: 39, y0: 1, y1: 2, z0: 29, z1: 33 }; // 3-sided enclosure, open on the west

export const HEDGE = { x0: 0, x1: 41, y0: 1, y1: 2, z: 36 }; // azalea hedge on the back strip

// ---- rooms (rooms.json boxes, inner air) -----------------------------------------------------------------------
export const ROOM_BOXES = {
  sales: [10, 1, 25, 22, 5, 32], // Sales floor
  restroomA: [25, 1, 25, 26, 7, 28], // Restroom A
  restroomB: [30, 1, 25, 31, 7, 28], // Restroom B
  hall: [28, 1, 26, 28, 7, 28], // Hall, one wide
  stock: [25, 1, 30, 31, 7, 32], // Stock room
};

// ---- helpers ---------------------------------------------------------------------------------------------------
// Seeded rng(seed): returns () => float in [0, 1); the same seed gives the same sequence in every part.
export function rng(seed)
```

### vocab/h1.mjs

```js
// The nine h1 helpers from plan.md VOCABULARY: canopy_deck, fuel_pump, curb_cut, awning, brand_roundel, price_pylon,
// light_pole, propane_cage, hedge_run. Each takes the build grid first (a Grid, or a guard/runParts view), then the
// position the plan gives it (facing where it has one), then an optional { over }. Coordinates are absolute, inclusive,
// x east, y up, z south. Every write goes through put(): it lands only inside the helper's footprint and only into air,
// so a helper can't cut into an earlier part's cells or the ground under it. { over: true } writes into anything inside
// the footprint instead (curb_cut needs it to pave over the sidewalk). Each returns { placed, skipped, box }.

/**
 * canopy_deck(x0, z0, x1, z1): the flat fuel canopy, y7..9, inclusive box. y7 is the soffit (smooth_quartz) with sea
 * lanterns on the light grid; y7 perimeter, y8 perimeter red stripe, y9 full top are white_concrete. y8 inside is air.
 */
export function canopy_deck(g, x0, z0, x1, z1, opts = {})

/**
 * fuel_pump(x, z): one pump, 2 wide (x..x+1), 1 deep (z), y2..4. The pump body is white_concrete at y2 with a
 * black_concrete screen at y3 on the x cell; the x+1 cell is an iron_chain hose hung at y2..3; red_concrete head at y4.
 * The island has two pumps, one at each of z14 and z15; z13 and z16 stay clear.
 */
export function fuel_pump(g, x, z, opts = {})

/**
 * curb_cut(x0, x1): asphalt (gray_concrete_powder) across the sidewalk cells at z5..6, y0. The sidewalk is an earlier
 * part's ground, so this needs { over: true }; without it every sidewalk cell is skipped.
 */
export function curb_cut(g, x0, x1, opts = {})

/**
 * awning(x0, x1): the storefront cantilever, smooth_quartz_slab (top type) at y5 over z22..23.
 */
export function awning(g, x0, x1, opts = {})

/**
 * brand_roundel(cx, cy, z): 3x3 roundel in the plane z, centred on (cx, cy): white_concrete ring, red_concrete centre.
 * The plan's roundel is brand_roundel(20, 8, 8).
 */
export function brand_roundel(g, cx, cy, z, opts = {})

/**
 * price_pylon(x0, z0): the free-standing price sign. Panel x0..x0+3, two deep (z0..z0+1), y4..13: white frame on the
 * sides, black board y4..10, red head y11..13 with a white roundel at (x0+1..x0+2, 12, z0). Footing (polished_andesite)
 * y1..2 and a gray_concrete mast at y3 under the panel. Price digits are sea_lantern on the front, proud at z0-1, rows y5/7/9.
 */
export function price_pylon(g, x0, z0, opts = {})

/**
 * light_pole(x, z): polished_andesite base at y1, gray_concrete shaft y2..5, standing lantern y6 on top. Nothing floats.
 */
export function light_pole(g, x, z, opts = {})

/**
 * propane_cage(x, z): 2x2 footprint, y1..2. Four cauldrons at y1 are the stand; iron_bars at y2 over them form the cage,
 * each bar joined to its neighbours inside the 2x2.
 */
export function propane_cage(g, x, z, opts = {})

/**
 * hedge_run(x0, x1, z): azalea hedge, two high (y1..2), persistent leaves. One cell in six is flowering_azalea.
 */
export function hedge_run(g, x0, x1, z, opts = {})
```

### vocab/h2.mjs

```js
// Vocabulary helpers from plan.md VOCABULARY (second half): canopy_column, asphalt_strip, storefront_bay, mart_letters,
// slot_window, ev_charger, air_station, dumpster_enclosure. Palette ids are literals (no vocab/ imports).
// Every helper takes the grid first, then its position (and any facing), then an optional opts object, and returns
// { placed, skipped, box }: box is the footprint [x0, y0, z0, x1, y1, z1] it may write; skipped counts cells it left
// alone because they were not air (opts.replace: true overwrites them, still inside the footprint).
// Nothing is written outside the footprint, so nothing is ever placed under it (ground, sand, floors stay as they are).
// The grid is the build library's Grid (tools/src/build.mjs, or the guard/runParts view of it): writes go through g.set.

/** A solid stub from y2 up: polished_andesite base cell, smooth_quartz shaft to y6. (x, z) is the west cell; 2 wide in x. */
export function canopy_column(g, x, z, opts = {})

/** Matte asphalt strip on the ground layer y0 from (x0, z0) to (x1, z1). Pass { replace: true } to lay it over grass. */
export function asphalt_strip(g, x0, z0, x1, z1, opts = {})

/**
 * Storefront glass on the wall plane z, from x0 to x1, y1..4. mullions: x columns of black_concrete (default 13, 20,
 * kept only where they fall inside x0..x1). open: [[xa, xb], ...] ranges left air for doors and openings.
 */
export function storefront_bay(g, x0, x1, z, { mullions = [13, 20], open = [], ...opts } = {})

/** The MART sign on the red fascia: letters start at (x, y, z), y and y+1 high, spanning x..x+9. */
export function mart_letters(g, x, y, z, opts = {})

/**
 * Recessed service slot window on the wall at z: recess cell (x, 2..6, z) is left as the shell's air; glass is set one
 * cell in (z + 1); black_concrete frames sit beside the recess in the wall (x - 1 and x + 1, at z). The frames replace
 * wall cells, so call with { replace: true } once the shell has built the service front.
 */
export function slot_window(g, x, z, opts = {})

/** EV charger post at (x, z): white_concrete base y1, black_concrete head y2, a floor lever on top at y3. */
export function ev_charger(g, x, z, opts = {})

/** Air/water station at (x, z), 2 wide in x: a polished_andesite plinth y1, an iron_block post at (x, 2, z), a wall lever on it. */
export function air_station(g, x, z, opts = {})

/**
 * Three-sided dumpster enclosure over x0..x1, z0..z1 (y1..2): gray_concrete walls on the north, south and east sides,
 * open on the west (x0). Inside, a 3-wide dumpster body (iron_block, black_concrete lid) sits against the back wall and
 * leaves the front row clear. Pass { replace: true } to build over existing walls.
 */
export function dumpster_enclosure(g, x0, z0, x1, z1, opts = {})
```

### vocab/h3.mjs

```js
// Helpers for the gas station (plan.md VOCABULARY): pump_island, centre_dashes, glass_double_door, logo_panel, hvac_unit,
// parking_stall, ice_chest, birch_tree. Each takes the grid (a runParts view or a Grid) first, then the plan's position
// arguments (and facing where it has one), then an optional { over } (default false: write only into air). Coordinates
// are absolute, x east, y up, z south. A helper writes only its own footprint and never below y=1, so the ground (y=0)
// and the floors belong to earlier parts. The two paint helpers (centre_dashes, parking_stall) are the one exception:
// they lay their stripes on the y=0 surface, and that surface is the asphalt, so they may replace gray_concrete_powder
// there and nothing else. A cell that is not air is skipped and listed in `skipped`, never overwritten.
// Each returns { placed, skipped }.

// ---- pump islands (curb, bollards) -----------------------------------------------------------------------------------
/**
 * A raised pump-island curb at x..x+1, z0..z1 (polished_andesite, y=1) with a yellow bollard on each corner of the two
 * end rows (y=2). The plan's smooth_stone_slab caps sit on the same end cells as the bollards, so the bollards win.
 */
export function pump_island(g, x, z0, z1, opts = {})

// ---- road paint -------------------------------------------------------------------------------------------------------
/** The yellow centre line along z (default z=2) from x0 to x1: 3 on, 3 off, starting on at x0, on the asphalt at y=0. */
export function centre_dashes(g, x0, x1, z = 2, opts = {})

/** The white stall lines of one parking stall: a 4-long stripe along x from x0 at z0 and at z1, on the asphalt at y=0. */
export function parking_stall(g, x0, z0, z1, opts = {})

// ---- glass double door (entrance) ---------------------------------------------------------------------------------------
/**
 * A double door in a wall on the given facing: two iron_door leaves (lower and upper halves, y=1..2) side by side with
 * mirrored hinges (left leaf hinge left, right leaf hinge right), and light_blue glass transom panes over both (y=3..4).
 * The pair runs along x for a north or south facing wall and along z for an east or west one; (x, z) is the first leaf.
 * All or nothing: one blocked cell and the door is not written.
 */
export function glass_double_door(g, x, z, facing, opts = {})

// ---- sign panel --------------------------------------------------------------------------------------------------------
/** The brand logo: a 2 wide x 3 tall red_concrete panel at x..x+1, y..y+2 in the plane z, with a white dot on the middle row, left column. */
export function logo_panel(g, x, y, z, opts = {})

// ---- rooftop unit ------------------------------------------------------------------------------------------------------
/** A rooftop HVAC unit: a 2x2 iron_block body at y=9 at x..x+1, z..z+1, with a closed iron_trapdoor lid on each cell at y=10. */
export function hvac_unit(g, x, z, opts = {})

// ---- ice chest ---------------------------------------------------------------------------------------------------------
/** An ice chest: a 3 wide x 1 deep white_concrete box at y=1 at x..x+2 in the plane z, with a smooth_quartz_slab lid at y=2. */
export function ice_chest(g, x, z, opts = {})

// ---- birch tree ---------------------------------------------------------------------------------------------------------
/**
 * A birch tree rooted on the grass at (x, 0, z): a birch_log trunk on y=1..5 and a persistent birch_leaves crown, 5x5
 * with the corners cut at y=4..6 and 3x3 at y=7. The crown skips the trunk cells, which are already logs.
 */
export function birch_tree(g, x, z, opts = {})
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

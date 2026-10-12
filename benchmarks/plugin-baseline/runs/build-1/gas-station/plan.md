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
1. [x] Store shell (parts/shell.mjs, mason): both volumes, floors, plinth, piers, sign band, parapet cells under roof, partitions, all openings air.
2. Roofs (parts/roofs.mjs, roofer): roof.json x2 (modern), step at x24, HVAC.
3. Fuel canopy (parts/canopy.mjs): deck, columns, islands, bollards, pumps.
4. Openings and signs (parts/fittings.mjs, glazier): glazing, doors, awning, letters, logo, roundel, slot window.
5. Site and grounds (parts/grounds.mjs, gardener): street, sidewalk, asphalt, paint, parking, grass, trees, hedge, poles.
6. Forecourt fittings (parts/forecourt.mjs): pylon, air, ice, propane, dumpster, EV chargers.

## Notes for workers
- Ground y=0 everywhere; building starts at y1. Do not fill reserved cells. Run `$MCD check` and `$MCD walk build.nbt --rooms rooms.json`.
- Parts run in order; the shell goes first, ground before the pylon and fittings.
- Shell (P1): walls only; glass/doors/mullion glass, slot glass at (28,2..6,25) left air for glazier. Roof y6/y8 left to roof tool.

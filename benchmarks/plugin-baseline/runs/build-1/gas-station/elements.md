# REQUIRED ELEMENTS: modern gas station with convenience store
Coordinates are the architect's (plan.md). y=0 is ground/store floor. Part numbers: P1 store shell, P2 roofs, P3 fuel canopy and pumps, P4 openings and signs, P5 site and grounds, P6 forecourt fittings.

- [x] **Fuel canopy** (P3, `canopy_deck`): flat deck x6..34 z9..20. y7 soffit smooth_quartz x7..33 z10..19 with sea_lantern at x10,16,20,24,30 on z12 and z17; y7 perimeter ring white_concrete; y8 ring red_concrete; y9 white_concrete top fill x7..33 z10..19 plus ring. Nothing pitched.
- [x] **Canopy columns x4** (P3, `canopy_column`): x13..14 and x26..27 at z12 and z17, y2..6, smooth_quartz, y2 polished_andesite base; they reach up under the soffit at y7.
- [x] **Pump islands A, B** (P3, `pump_island`): x13..14 / x26..27, y1, z11..18 polished_andesite; smooth_stone_slab (top) caps at z11 and z18; yellow_concrete bollards y2 at corners of each island end.
- [x] **Fuel pumps x4** (P3, `fuel_pump`): island A x13..14 and island B x26..27, z14..15, y2..4; pump body white_concrete with black_concrete screen and red_concrete head, hose = iron_chain/lever side; keep z13 and z16 clear.
- [x] **Brand roundel** (P4, `brand_roundel`): x19..21 y7..9 z8: white_concrete ring, red_concrete centre at (20,8,8).
- [ ] **Store block, glass front** (P1 shell, P4 glass): x9..23 z24..33, white_concrete walls, black_concrete plinth y1, flat deck y6; storefront bays, mullions x13, x20 black_concrete, light_blue_stained_glass_pane.
- [x] **Entrance double door** (P4, `glass_double_door`): (16..17,1..2,24) iron_door pair, hinges mirrored, facing north; transom glass (16..17,3..4,24).
- [x] **Awning** (P4, `awning`): smooth_quartz_slab top x10..23 y5 z22..23 on red sign band wall x9..23 y5 z24.
- [x] **"MART" sign** (P4, `mart_letters`): x12..21 y6..7 z23 white_concrete letters on the red fascia.
- [ ] **Service block** (P1, P4): x24..32 z24..33 y1..7 gray_concrete; slot window x28 y2..6 (glass_pane gray at z25, black frames x27, x29); logo panel red_concrete x25..26 y4..6 z23 (`logo_panel`).
- [x] **Flat roofs with parapet and coping** (P2): roof tool preset modern: shop deck y6, service deck y8; west wall x24 rises y6..9 as the step.
- [x] **Rooftop HVAC x2** (P2, `hvac_unit`): x26..27 and x29..30, z28..29, y9..10.
- [x] **Price pylon** (P6, `price_pylon`): footing x38..39 y1..2, mast y3, panel x37..40 z8..9 y4..13, red head y11..13 with white roundel at y12, black board y4..10 with sea_lantern/white digit rows at y5,7,9 on z=7 face built as proud blocks.
- [x] **Street, sidewalk, curb cuts, dashed line** (P5, `asphalt_strip`, `centre_dashes`).
- [x] **Forecourt asphalt, apron** (P5).
- [ ] **Parking, 3 stalls, white stripes** (P5, `parking_stall`) x1..7 z24..33; **EV chargers** (P6, `ev_charger`) x1 z25 and z28.
- [x] **Air/water station** (P6, `air_station`): plinth x36..37 y1 z23, post y2.
- [x] **Ice chest, propane cage** (P6, `ice_chest`, `propane_cage`) x25..30 z22..23.
- [x] **Dumpster enclosure** (P6, `dumpster_enclosure`) x35..39 z29..33, open west; dumpster inside.
- [x] **Light poles x2** (P5, `light_pole`) at (5,*,21), (36,*,21), y1..6.
- [ ] **Trees x3, verges, hedge** (P5, `birch_tree`, `hedge_run`): trunks (2,0,10),(2,0,17),(40,0,16); hedge z36 y1..2.
- [ ] **Interior**: sales floor, restrooms, hall, stock room (rooms; shell part builds floors, partitions and interior doorways only).
- [x] **Rear and side doors** (P4): east (32,1..2,31), south (29,1..2,33).

# Mid-century modern house (Eichler / Palm Springs): FORM PLAN (architect)

Identity: a long, low post-and-beam house in white stucco and dark timber, with a pale near-flat gable roof, deep eaves and beam ends that stick out past them. The street face is blank apart from a tan ledgestone feature wall, a clerestory strip and an orange front door. A flat carport stands to the west with a teal and white car in front of it. The back is all glass, with a kidney pool behind it.
Grid: x 0..33 (west→east, along the street), z 0..33 (z=0 sidewalk on the NORTH street side, z=33 back lot line), y = height.
Ground top = y=0 (bedding y=-1). House floor slab y=1. Walls y=1..5. Roof y=6..7. Chimney to y=8.
Structural rhythm: **beam lines every 3 cells at x = 10,13,16,19,22,25,28,31.** Every post, beam and beam end sits on one of these lines.

## SITE

| mass / feature | x0..x1 | y0..y1 | z0..z1 | notes |
|---|---|---|---|---|
| Lot ground (bedding) | 0..33 | -1 | 0..33 | dirt, under everything except the pool |
| Sidewalk | 0..33 | 0 | 0 | smooth_stone, one row along the street |
| Driveway (concrete) | 1..8 | 0 | 1..21 | smooth_stone; joint rows of light_gray_concrete at z=4,8,12,16 |
| Front yard (desert) | 9..33 | 0 | 1..7 | sand; gravel beds at x=22..30 z=1..5 and x=10..16 z=1..5 |
| Stepping-pad path | 18..20 | 0 | 1, 3, 5 | three 3x1 smooth_stone pads in the sand (sand between them) |
| Entry landing | 18..20 | 0 | 6..7 | smooth_stone, under the eave |
| Side strips | 0 (x) / 32..33 | 0 | 1..25 | x=0: sand; x=32..33: sand |
| MAIN HOUSE (shell) | 10..31 | 1..5 | 8..25 | 22 wide x 18 deep; walls on the perimeter |
| Main roof (incl. overhangs) | 9..32 | 6..7 | 6..27 | low gable, ridge along x; see ROOFS |
| Beam ends (exposed tails) | each beam line | 5 | 5 and 28 | 1 cell past the roof edge, front and back |
| ATRIUM (open courtyard, open to the sky) | 17..21 | 1..open | 12..17 | 5x6; glass ring on x=16, x=22, z=11, z=18 |
| Entry recess | 18..20 | 2..4 | 8 | air niche; the door wall sits back at z=9 |
| Stone feature wall | 11..17 | 1..4 | 7 | freestanding 1-thick leaf, 1 proud of the north wall (z=8) |
| CARPORT | 0..9 | 1..5 | 7..21 | flat roof deck y=5 on posts; open N, W; screen at S |
| Carport posts | x=1 | 1..4 | z=8, 14, 20 | dark_oak_log, 1x1 |
| Carport beams | 0..9 | 4 | z=8, 14, 20 | dark_oak_log axis x; the deck sits on them |
| Carport breeze-block screen | 1..9 | 1..4 | 21 | pierced: checkerboard of white_concrete and AIR (holes left open) |
| CAR (reserved, see RESERVED) | 3..5 | 1..2 | 1..7 | parked nose to the street on the driveway, in front of the carport |
| Chimney (fireplace part) | 20..21 | 2..8 | 21..22 | rises through the roof 1 above the ridge band |
| Back patio | 10..31 | 0 | 26..28 | smooth_stone, under/behind the south eave |
| Pool deck | 11..24 | 0 | 29..33 | smooth_stone around the pool |
| KIDNEY POOL (reserved) | 13..22 | -2..0 | 29..32 | see RESERVED for the exact cells |
| Back lawn | 0..10 & 25..33 | 0 | 26..33 | grass_block (x=0..9 z=22..33 included) |
| Palms | (12,3), (30,4), (29,31) | 1..7 | — | jungle trunk + crown, reserved |
| Cactus cluster | 23..29 | 1..3 | 2..4 | on the gravel bed, reserved |
| Mailbox | 9 | 1..2 | 1 | low post + box at the head of the driveway |

## ROOFS

**Main roof: built BY HAND (no preset).** No `$MCD roof` preset fits a mid-century roof: every preset has a pitch of 0.5 or more, and the brief wants a very low gable. The low pitch is the identity, so the roof is a stepped slab gable with the ridge running E-W (along x), its slopes facing the street and the garden. It covers x=9..32 (1 cell of overhang at each gable end) and z=6..27 (2 cells of overhang front and back):

| band | z rows | block / half | y |
|---|---|---|---|
| A, eaves | 6..10 and 23..27 | bottom slab | 6 |
| B | 11..13 and 20..22 | top slab | 6 |
| C | 14..15 and 18..19 | bottom slab | 7 |
| Ridge | 16..17 | top slab | 7 |

- Rise: 1.5 blocks over a 10-cell half-span, the near-flat Eichler gable. The highest point is y=7.
- **Fascia:** the outermost ring (z=6, z=27, x=9, x=32) uses dark_oak_slab at the same half as its band, so a dark line runs round the eave.
- **Atrium hole:** no roof over x=17..21, z=12..17. The edge of the hole is dark_oak_slab, as fascia.
- **Chimney hole:** no roof at x=20..21, z=21..22.
- **Under band C:** the y=6 cells over the interior are air (a raised ceiling vault). The two gable ends close them with glass (see OPENINGS), and so does the atrium ring where it crosses band C (x=16 and x=22, y=6, z=14..17, glass).
- **Beams (exposed):** dark_oak_log with axis z, at y=5 on each beam line x=10,13,...,31, running z=5..28. They pass through the north and south header courses. Inside the house they are ceiling beams with 3 cells of headroom (y=2..4) below them; between the beams the ceiling is at y=5. Outside, they carry the overhang and stick out 1 cell past the fascia at z=5 and z=28. Where the beam on x=19 crosses the atrium it stays as an open beam over the courtyard.
- **Carport roof:** a flat deck, hand built: smooth_stone_slab (bottom half) at y=5 over x=0..9, z=7..21, with a dark_oak_slab fascia on its outer edges (x=0, z=7, z=21). It sits one level below the main roof's west eave (x=9, y=6). The two horizontal planes layered against each other are the mid-century signature.

## FACADES

All walls are white stucco (white_concrete). Every outer wall has the same three layers:

| layer | y | block |
|---|---|---|
| Base (slab edge) | 1 | smooth_stone |
| Body | 2..4 | white stucco, glass or posts |
| Header course | 5 | dark_oak_planks, a continuous dark band under the eave |

The beam ends cross the header.

**North (street, z=8): mostly blank.** From west to east:
- **x=10..17:** blank stucco. In front of it, the **ledgestone feature wall** stands at z=7, x=11..17, y=1..4. It is 1 proud and freestanding, mud_bricks mixed with ~25% packed_mud for the stacked-stone texture. Its top is capped with mud_brick_slab at y=5, but only between the beam lines (x=11,12,14,15,17); the beams at x=13 and x=16 pass over it.
- **x=18..20:** the **entry recess**, 1 deep: the door wall sits at z=9. On it, x=19 is the door, with an orange_concrete transom at y=4. x=18 and x=20 are orange_concrete panels at y=2..4, which makes a bold 3-wide orange door set in white. Reveals at x=17 (stone) and x=21 (stucco).
- **x=21..31:** stucco with the **clerestory strip** in the top course of the body (y=4): glass at x=22..24, 26..27 and 29..30, and dark_oak_log mullions on the beam lines x=25 and x=28. Below it the wall is blank (bedroom wing).
- The 2-cell eave (z=6..7) shades the whole face; the beam ends at z=5 give the rhythm.

**South (garden, z=25): a wall of glass.** The only stucco is the base (y=1) and the header (y=5). Thin dark posts (dark_oak_log, vertical) stand at y=2..4 on every beam line. Between the posts are full-height glass_pane walls (y=2..4), with sliding-door gaps (see OPENINGS). The eave overhangs to z=27 and the beam ends to z=28.

**West (x=10, facing the carport) and East (x=31):** stucco with base and header. Above the header, the gable end shows a glass clerestory band at y=6, z=14..19, between header and roof, and the fascia steps over it. Dark posts at the corners (x=10/31, z=8 and z=25) run y=2..4 on all four corners.

**Atrium ring (inner faces):** glass_pane at y=2..4 (and y=6 where the ring crosses band C), with dark_oak_log posts at the 4 ring corners and on x=19 (z=11, z=18). Header y=5: dark_oak_planks.

Depth summary:

| element | depth relative to the wall plane |
|---|---|
| Feature wall | +1 |
| Beam ends | +3 front and back (past the 2-cell eave) |
| Eaves | +2 front and back, +1 at the gable ends |
| Entry | -1 |
| Glass and posts | flush in the wall plane; the posts read as the wall's structure |

## MATERIALS (all ids checked with `mcd blocks --check`)

| role | block id | why it reads |
|---|---|---|
| Body: stucco walls (~55%) | white_concrete | clean bright white, Palm Springs |
| Structure: posts, beams, beam ends, mullions | dark_oak_log | dark brown, the thin dark posts and exposed beams |
| Header course | dark_oak_planks | a continuous dark band under the eave |
| Fascia | dark_oak_slab | a dark eave line |
| Base course and slab edge | smooth_stone | concrete slab-on-grade |
| Roof deck | smooth_stone_slab | pale grey gravel roof, contrasts with the dark fascia |
| Glass (walls, clerestory, ring) | glass_pane | thin and clear, floor-to-ceiling |
| Feature wall | mud_bricks (+25% packed_mud); cap mud_brick_slab | tan desert ledgestone |
| Front door | acacia_door | reads orange |
| Door surround and transom | orange_concrete | the bold accent (~3%) |
| Breeze-block screen | white_concrete (with air holes) | a pierced white screen |
| Car, lower body | cyan_concrete | saturated teal, not grey |
| Car, roof and top flash | white_concrete | the two-tone |
| Car, bumpers and trim | iron_block | chrome |
| Car, tyres | black_concrete | |
| Car, windows | glass_pane | |
| Driveway, sidewalk, patio, pool deck | smooth_stone | poured concrete |
| Driveway joints | light_gray_concrete | |
| Front yard | sand; gravel beds | desert planting ground |
| Back lawn | grass_block | |
| Bedding | dirt | |
| Pool | water; liner light_blue_concrete; coping smooth_quartz_slab | |
| Palms | jungle_log trunk, jungle_leaves crown | |
| Cacti | cactus | |

Colour scheme: white / dark timber / pale grey roof (the frame), with tan stone, an orange door and a teal car as the accents. The second designer keeps these ids.

## OPENINGS (the shell leaves these as air; doors and panes are added by later parts)

| face | where | size |
|---|---|---|
| North, entry recess | x=18..20, z=8, y=2..4 | air niche 3w x 3h x 1d |
| North, front door | x=19, z=9, y=2..3 | 1w x 2h, acacia_door facing north |
| North, clerestory | z=8, y=4, x=22..24, 26..27, 29..30 | glass strip, 1h |
| West, utility door (kitchen → carport) | x=10, z=10, y=2..3 | 1w x 2h |
| West, dining window | x=10, z=14..16, y=3..4 | 3w x 2h |
| West and East, gable clerestory | x=10 and x=31, y=6, z=14..19 | glass, 6w x 1h |
| East, bedroom 1 window | x=31, z=10..12, y=3..4 | 3w x 2h |
| East, bath clerestory | x=31, z=15..16, y=4 | 2w x 1h |
| East, master bedroom | x=31, z=21..23, y=2..4 | full-height glass |
| South, living slider | x=14..15, z=25, y=2..3 | 2w x 2h opening, glass at y=4 above |
| South, dining/fireplace slider | x=20..21, z=25, y=2..3 | 2w x 2h, glass at y=4 |
| South, master slider | x=26..27, z=25, y=2..3 | 2w x 2h, glass at y=4 |
| Atrium doors | x=19..20, z=11, y=2..3 (from the entry gallery); x=19..20, z=18, y=2..3 (to the living room) | 2w x 2h |

All other bays of the south wall and atrium ring are fixed glass_pane, y=2..4.

## RESERVED (the shell leaves these empty; later parts sink into them or stand on them)

| what | cells |
|---|---|
| Conversation pit | x=13..17, z=20..23, y=1 (no floor slab). The shell lays y=0 there as smooth_quartz, the pit floor; the pit part adds the steps and benches. |
| Freestanding fireplace and chimney | x=20..21, z=21..22, y=1..8 (the floor, beam bays and roof all left open) |
| Atrium planting and paving | x=17..21, z=12..17, y=1 (no slab); y=0 under it is dirt for planting |
| Kidney pool, water y=-1..0, floor y=-2 (ground and bedding left empty) | z=29: x=14..17 and x=20..21 (the pinch at x=18..19 stays deck) |
| | z=30: x=13..22 |
| | z=31: x=13..22 |
| | z=32: x=14..21 |
| Car | x=3..5, y=1..2, z=1..7. Body y=1 over z=1..7, cabin y=2 over z=3..5, wheels at the 4 corners z=2 and z=6. |
| Palms | (12,3), (30,4), (29,31): y=1..7 plus a crown radius of 2 at y=6..7 |
| Cactus bed | x=23..29, z=2..4, y=1..3 |
| Mailbox | (9,1), y=1..2 |
| Patio furniture | x=10..31, z=26..28, y=1 (loungers, by the designer) |

## FLOORS

Single storey. Finished floor y=1, standing height y=2.

| volume | x | z | y (air) | notes |
|---|---|---|---|---|
| Whole house interior | 11..30 | 9..24 | 2..5 | beams at y=5 on the beam lines; extra ceiling void at y=6 for z=14..19 |
| Entry gallery | 17..21 | 9..10 | 2..5 | from the front door to the atrium doors |
| Atrium (outdoor) | 17..21 | 12..17 | open sky | |
| Kitchen (galley + breakfast bar) | 11..15 | 9..13 | 2..5 | utility door to the carport at x=10 |
| Dining | 11..15 | 14..18 | 2..5 | window to the west |
| Living (pit + fireplace) | 11..21 | 19..24 | 2..5 | glass south wall; the pit is reserved as above |
| Bedroom wing corridor | 23..24 | 9..24 | 2..5 | runs along the atrium's east glass |
| Bedroom 1 | 25..30 | 9..13 | 2..5 | |
| Bath 1 and bath 2 | 25..30 | 14..17 | 2..5 | split at x=27/28 |
| Bedroom 2 | 25..30 | 18..20 | 2..5 | small |
| Master bedroom | 23..30 | 21..24 | 2..5 | garden glass and slider |
| West of the atrium | 16 | 12..17 | — | the atrium ring; the kitchen and dining open onto it through the glass |
| Carport (outdoor) | 1..9 | 7..20 | 1..4 | under the deck at y=5 |

Interior partitions sit only between the beam lines or on them, and never reach above y=5.


---
# DESIGNER SECTIONS (below the architect's form; nothing above is changed)

## PALETTE (all ids checked with `mcd blocks --check`)

Architect's ids, kept exactly: white_concrete, dark_oak_log, dark_oak_planks, dark_oak_slab, smooth_stone, smooth_stone_slab, glass_pane, mud_bricks, packed_mud, mud_brick_slab, acacia_door, orange_concrete, cyan_concrete, iron_block, black_concrete, light_gray_concrete, sand, gravel, grass_block, dirt, water, light_blue_concrete, smooth_quartz_slab, jungle_log, jungle_leaves, cactus.

| role | block | shapes / states |
|---|---|---|
| Stucco | white_concrete | full only |
| Structure | dark_oak_log | axis=y posts, axis=z beams, axis=x carport beams and mullions |
| Header | dark_oak_planks | full |
| Fascia | dark_oak_slab | type=bottom or top to match the roof band; also type=bottom as the entry soffit |
| Base, paving | smooth_stone | full; smooth_stone_slab type=bottom (roof deck) |
| Ledgestone | mud_bricks, packed_mud | mud_brick_slab type=bottom cap |
| Glass | glass_pane | connects automatically; set no states |
| Front door | acacia_door | half=lower/upper, facing=north, hinge=left, open=false |
| Utility door | dark_oak_door | facing=west, open=true |
| Accent | orange_concrete | full |
| Car | cyan_concrete, white_concrete, iron_block, black_concrete, glass_pane, yellow_concrete (headlamps), red_concrete (tail lamps) | |
| Pool | water, light_blue_concrete, smooth_quartz_slab | coping type=bottom |
| Pit floor | smooth_quartz (shell) | pit steps use smooth_quartz_stairs |
| Garden | sand, gravel, grass_block, dirt, cactus, jungle_log, jungle_leaves (persistent=true), large_fern, potted_cactus, dead_bush, short_grass | |
| Exterior lights | lantern (hanging=true), dark_oak_fence | |
| Floors: public rooms (terrazzo) | smooth_stone with ~12% light_gray_concrete and ~6% white_concrete flecks (seeded) | |
| Floors: bedrooms | spruce_planks | |
| Floors: baths | smooth_quartz | |
| Ceiling (y=5 between beams) | spruce_planks | |
| Wall panelling | spruce_trapdoor (open=true, half=bottom or top, against the wall) | spruce_stairs, spruce_slab, spruce_planks, spruce_fence |
| Partitions | white_concrete | |
| Furniture | smooth_red_sandstone_stairs (orange upholstery), orange_carpet, white_carpet, cyan_carpet, yellow_carpet, quartz_stairs, quartz_slab, smooth_quartz_stairs, birch_planks, birch_slab, birch_stairs, birch_trapdoor, iron_trapdoor, iron_block, black_concrete, lectern, bookshelf, flower_pot, potted_cactus, item_frame, barrel, smoker, furnace, cauldron | |
| Beds | orange_bed, cyan_bed, yellow_bed, light_blue_bed, white_bed | |
| Fireplace | mud_bricks, black_concrete, campfire (lit=true), smooth_stone_slab cap | |
| Lights | lantern (hanging=true), sea_lantern, end_rod, daylight_detector | |

Colour relationship: white stucco / dark timber / pale grey roof frame; tan stone, orange door (and orange upholstery inside) and teal car as accents. Interiors: warm spruce + white + orange and teal touches.

## VOCABULARY (helpers; each takes world coordinates; "set" = only into air, per runParts)

**Exterior**
- `stucco_wall(x0,z0,x1,z1,y0=2,y1=4)`: white_concrete fill.
- `header_course(...)`: dark_oak_planks at y=5, SKIPPING every cell on a beam line (x=10,13,...,31 on the north/south walls, and all of x=10 and x=31) so the roof part's logs go there.
- `post(x,z,y0=2,y1=4)`: dark_oak_log axis=y.
- `glass_bay(x0,x1,z,y0,y1)` or along z: glass_pane fill, only in cells still air.
- `slider_gap`: 2 wide x 2 high AIR (y=2..3) with glass_pane at y=4 above. Never closed.
- `clerestory(z=8,y=4)`: glass_pane at x=22..24, 26..27, 29..30; dark_oak_log axis=y mullions at x=25 and x=28.
- `orange_entry`: orange_concrete at (18,2..4,9) and (20,2..4,9); acacia_door lower half at (19,2,9) and upper half at (19,3,9), facing=north; orange_concrete (19,4,9); smooth_stone (17,1..4,8); white_concrete (21,1..4,8) are the reveals (shell already lays them).
- `ledgestone_wall(x0,x1,z=7,y0=1,y1=4)`: mud_bricks, each cell becoming packed_mud with probability 0.25 from a seeded rng; cap mud_brick_slab bottom at y=5 on x=11,12,14,15,17.
- `roof_band(zA,zB,y,half)`: smooth_stone_slab type=half over x=9..32, skipping the atrium hole (x=17..21, z=12..17) and chimney hole (x=20..21, z=21..22). `fascia_ring()` swaps the outermost ring (z=6, z=27, x=9, x=32) and the hole edge to dark_oak_slab, same half as its band.
- `beam_line(x)`: dark_oak_log axis=z at y=5, z=5..28, over every beam x. Also on x=10 and x=31 (the wall lines).
- `carport()`: posts dark_oak_log (1,1..3,z) for z=8,14,20 (y=1..3), beams dark_oak_log axis=x at y=4 along x=0..9 at z=8,14,20; deck smooth_stone_slab bottom at y=5 x=0..9 z=7..21; fascia dark_oak_slab bottom on x=0, z=7, z=21; floor smooth_stone y=0 x=1..9 z=7..21.
- `breeze_screen(z=21)`: for x=1..9, y=1..4, place white_concrete where (x+y) is even, leave the others as air. Corner posts: none.
- `joint_row(z)`: light_gray_concrete at y=0, x=1..8.
- `stepping_pad(z)`: smooth_stone at y=0, x=18..20, that z.
- `car_50s(x=3,z=1)` (nose north; x=3..5): y=1: z=1 yellow_concrete (3), iron_block (4), yellow_concrete (5); z=2 black_concrete (3),(5) wheels, cyan_concrete (4); z=3..5 cyan_concrete x=3..5; z=6 black_concrete (3),(5) wheels, cyan_concrete (4); z=7 red_concrete (3),(5), iron_block (4). y=2: z=3 glass_pane x=3..5 (windscreen); z=4 glass_pane (3),(5) and white_concrete (4) roof; z=5 glass_pane x=3..5 (rear window); z=7 white_concrete (3),(5) tail fins.
- `palm(x,z)`: jungle_log y=1..7; y=7 jungle_leaves at all (dx,dz) with max(|dx|,|dz|)<=1 except the trunk; y=6 jungle_leaves at (±1..2,0),(0,±1..2) and (±1,±1); skip cells already filled.
- `saguaro(x,z,h)`: cactus trunk y=1..h; arm: cactus at (x-1,2,z) and (x-1,3,z) when h=3. Put sand at y=0 under each cactus cell.
- `barrel_cactus(x,z)`: cactus at y=1 and 2 on sand; `potted_cactus` allowed on the wall tops.
- `mailbox(x=9,z=1)`: dark_oak_fence (9,1,1); smoker at (9,2,1) facing=east (a dark box with a slot); orange_carpet flag not needed.
- `kidney_pool()`: cells listed in RESERVED: light_blue_concrete at y=-2 (floor), and at y=-1 around the rim cells (liner walls); water at y=-1 and y=0; smooth_quartz_slab bottom at y=0 on every deck cell 4-adjacent to a pool cell.
- `lounger(x,z,axis)`: 2 long x 1 wide, white: foot cell smooth_quartz_slab bottom at y=1; head cell smooth_quartz_stairs at y=1 facing the foot cell.
- `patio_table(x,z)`: dark_oak_fence leg at (x,1,z); smooth_quartz_slab type=bottom at (x,2,z) as the tabletop; 2 smooth_quartz_stairs chairs on opposite sides at y=1 facing it (patio floor is y=0, standing y=1). No parasol (the eave is at y=6).
- `garden_lamp(x,z)`: dark_oak_fence y=1..2, lantern (hanging=false) y=3 (x,z on sand/lawn, base y=1).
- `hung_lantern(x,y=4,z)` below a beam: lantern hanging=true (see Interior).

**Interior**
- `terrazzo_floor(box)`: smooth_stone with seeded flecks.
- `panel_wall(x,y0..y1,z,facing)`: open spruce_trapdoors on the wall, half alternating bottom/top; ~3 high strips.
- `hung_lantern(x,z)`: lantern hanging=true at y=4 (needs a block at y=5: a beam line cell or the ceiling).
- `sofa_low(x,z,len,axis,facing)`: seat row of smooth_red_sandstone_stairs (orange) facing `facing`, `len` long; backrest: a row of iron_trapdoor open=true half=bottom on the back edge behind the seat; arm cells at both ends: smooth_red_sandstone_stairs turned across the sofa. All at y=2 (the floor is y=1).
- `egg_chair(x,z,facing)`: seat (x,2,z) smooth_red_sandstone_stairs facing=`facing`; a high back of iron_trapdoor open=true half=bottom on the cell behind it, at y=2 and y=3 (stacked); one iron_trapdoor open=true on each side at y=2, making the shell; iron_block slab-height pedestal not needed.
- `sideboard(x,z,len,axis)`: birch_slab top half row, over a row of birch_trapdoor open=false under it (cabinet fronts), with potted_cactus on top.
- `coffee_table(x,z)`: spruce_slab top half at y=2 on one spruce_fence below? Low: spruce_slab bottom on the floor at y=1 + a flower_pot.
- `conversation_pit(x0,z0,x1,z1)`: floor y=0 smooth_quartz; ring of smooth_quartz_stairs at y=1 facing inward along the 4 inner edges, corners quartz_slab; orange_carpet seat cushions; coffee_table in the middle.
- `fireplace_stack` (built by part 3): described in the Part 3 spec.
- `dining_set(x,z)`: table = spruce_slab top at y=2 on 4 spruce_fence legs (2x3); six chairs = birch_stairs facing the table; pendant = lantern hanging from the beam above.
- `galley_kitchen`: counters = smooth_quartz_slab/white_concrete row at y=2 with smoker/furnace/cauldron as appliances; upper cabinets spruce_trapdoor; breakfast bar = spruce_slab top at y=2 on spruce_fence legs; bar stools = birch_slab on iron_trapdoor posts? use dark_oak_fence + birch_slab bottom.
- `bed_double(x,z,facing,color)`: a bed block pair (orange_bed etc.), headboard of spruce_planks 1 high behind it, nightstands birch_slab on spruce_fence.
- `wardrobe(x,z,len,axis)`: spruce_planks 2 high + open spruce_trapdoor fronts.
- `bath_fit`: tub = cauldron? No: tub = 2 smooth_quartz_slab bottom + water? Use quartz stairs and slab shell with `water` inside (1 deep), basin = cauldron on a quartz pillar? simple: basin = cauldron, mirror = glass_pane, WC = quartz_stairs.

## ROOMS (inner air boxes; ceiling y=5 between beams; vault z=14..19 open above)

Interior shell: floor y=1 (finished, standing y=2), perimeter walls x=10, x=31, z=8, z=25, interior partitions white_concrete y=2..4 only, ceiling spruce_planks y=5 at z=9..13 and z=20..24 (not on beam lines, not over the atrium or chimney); over z=14..19 the room is open up to the roof (y up to 6). Room boxes below list air y=2..4 (y=1..4 where the floor is sunk).

| room | box [x0,y0,z0,x1,y1,z1] | floor | ways in |
|---|---|---|---|
| gallery | [16,2,10,22,4,10] | terrazzo | front door (19,2..3,9); atrium doors (19..20,2..3,11); kitchen at x=16 z=9..10 open; corridor at x=22 z=9..10 open |
| kitchen | [11,2,9,15,4,13] | terrazzo | open at x=16 z=9..10 to the gallery; utility door (10,2..3,10) from the carport; open on its south side to dining along z=13/14 (breakfast bar line) |
| dining | [11,2,14,15,4,18] | terrazzo | open to kitchen (z=13/14) and to living (z=18/19); window x=10 z=14..16 y=3..4 |
| living (with pit and fireplace) | [11,2,19,21,4,24] (pit x=13..17 z=20..23 is y=1..4 with floor y=0) | terrazzo, pit smooth_quartz | open to dining on z=18/19; atrium doors (19..20,2..3,18); doorway (22,2..4,19..20) east to the corridor; sliders (14..15,2..3,25), (20..21,2..3,25) |
| atrium | [17,1,12,21,4,17] | dirt and grass (open sky) | atrium doors (19..20,2..3,11) from the gallery and (19..20,2..3,18) from the living room |
| corridor | [23,2,9,24,4,21] | terrazzo | gallery at x=22 z=9..10; living doorway (22,19..20); master bedroom open at z=21/22; doorways (25,2..3,10) bed1, (25,2..3,15) bath 1, (25,2..3,19) bed 2 |
| bedroom 1 | [26,2,9,30,4,12] | spruce_planks | door (25,2..3,10); window x=31 z=10..12 y=3..4 |
| bath 1 | [26,2,14,27,4,16] | smooth_quartz | door (25,2..3,15); no window, lit by a sea_lantern |
| bath 2 (en suite to bed 2) | [29,2,14,30,4,16] | smooth_quartz | door (29,2..3,17) from bedroom 2; clerestory x=31 z=15..16 y=4 |
| bedroom 2 | [26,2,18,30,4,20] | spruce_planks | door (25,2..3,19); door (29,2..3,17) to bath 2 |
| master bedroom | [23,2,22,30,4,24] | spruce_planks | open to the corridor along z=21/22 at x=23..24; glass x=31 z=21..23; slider (26..27,2..3,25) |

Partitions (white_concrete, y=2..4, built by part 1): z=13 for x=25..30; x=25 for z=9..21 (doorways above); z=17 for x=26..30 (bath 2 door at x=29); x=28 for z=14..16; z=21 for x=25..30; x=22 for z=19..24 (living doorway at z=19..20). No stairs: single storey.

**Purposes and moods** (for the room designers): the architect's reserved cells are fixed.
- gallery: narrow entrance hall, wood-lined (panel_wall on the south side is the ring glass: use the north wall), a low bench (birch_slab on spruce_fence) and a lantern; sees the atrium through the glass doors.
- kitchen: galley along the north wall z=9..10 (counter, hob, fridge as iron_block + trapdoors), breakfast bar on the south side with stools, orange accent; utility door west.
- dining: round-feeling table for six, sideboard on the west wall under the window, pendant lantern.
- living: the show room: sofa_low x2 (orange) around the pit, egg chair by the atrium glass, tulip side table, freestanding fireplace as the focus, sideboard, floor lamp (end_rod on fence), wood panelling on the x=22 partition.
- atrium: green court: grass patch, large ferns, potted cactus, a small jungle sapling tree, 3-wide stepping path, bench; keep the doors' cells x=19..20 free.
- corridor: calm, wooden, lanterns on the beam lines, art (item_frames).
- bedrooms: bed, nightstands, wardrobe; bed1 sea-blue, bed2 yellow, master orange with a bigger bed and a dressing area.
- baths: white quartz, tub or shower, basin, WC.

Entrance cell: (19,1,7).

## PARTS (12-minute jobs; later parts only add into air; build in this order)

1. **parts/shell.mjs, house shell and ground**: dirt at y=-1 over x=0..33 z=0..33 except pool cells (RESERVED); dirt y=0 under the house footprint and atrium; floor y=1 over x=10..31 z=8..25 (terrazzo in public rooms, spruce_planks bedrooms, smooth_quartz baths, none on the pit x=13..17 z=20..23 and the atrium and the chimney; smooth_quartz at y=0 in the pit); perimeter walls: base smooth_stone y=1, body white_concrete y=2..4, header dark_oak_planks y=5 SKIPPING beam-line cells (see header_course); leave every OPENINGS cell as air (entry niche, clerestory cells, windows, sliders, door gaps, ring); door wall z=9 x=17..21 as described; atrium ring walls as dark_oak_planks header + air body for part 4; interior partitions and doorways per ROOMS; ceiling spruce_planks y=5 per ROOMS. Ticks 1, 7, 13 (gaps), 16 (shell).
2. **parts/site.mjs, ground cover and carport**: sidewalk, driveway with joint rows, sand yard, gravel beds, stepping pads, landing, sand strips, carport (`carport`, `breeze_screen`), patio, pool deck, lawns (patio and deck first, lawn only into air; pool cells untouched), x=9 z=8..25 sand. Ticks 5, 6, 11, 18, 19, 24 (paving), 25.
3. **parts/roofs.mjs, roof, beams, chimney**: the 4 bands with `roof_band` and `fascia_ring`, `beam_line` x 10, 13, ..., 31 plus x=10 and x=31 wall lines, gable-end glass at y=6 (x=10 and x=31, z=14..19) and ring glass at y=6 (x=16 and x=22, z=14..17), the dark_oak_slab hole edge. Fireplace stack at x=20..21 z=21..22: y=1 mud_bricks; y=2 (20,2,21) and (20,2,22) campfire lit=true, (21,2,21) and (21,2,22) mud_bricks; y=3 mud_bricks 2x2 lintel; y=4..7 black_concrete 2x2 flue; y=8 smooth_stone_slab bottom cap. Ticks 2, 3, 14.
4. **parts/facades.mjs, glazing, posts, entry, feature wall**: `glass_bay` for the south wall, ring, windows; `post` on every beam line of the south wall, 4 corners, ring corners and x=19 at y=4 (lintel); `slider_gap` glazing at y=4; `clerestory`; `orange_entry` with the acacia_door; `ledgestone_wall` and its cap; utility door (dark_oak_door open) at (10,2,10). Ticks 4, 7, 8, 9, 10, 12, 13, 15, 16.
5. **parts/front.mjs, car and front garden**: `car_50s`, `palm` at (12,3) and (30,4), cactus cluster on x=23..29 z=2..4 (e.g. saguaro (26,3,h=3), (24,2,h=2), barrel_cactus (28,2),(23,4),(29,4)), dead_bush on the sand, `mailbox`. Ticks 20, 21, 22.
6. **parts/back.mjs, pool and patio**: `kidney_pool`, `lounger` x3 and `patio_table` + parasol (dark_oak_fence and white quartz_slab) at z=26..28, `palm` at (29,31), `garden_lamp` x4 and the entry lanterns, some short_grass on the lawns. Ticks 23, 24, 26.

## Checklist of parts
- [x] 1 shell  - [ ] 2 site  - [ ] 3 roofs  - [ ] 4 facades  - [ ] 5 front  - [ ] 6 back

## Notes for workers
- The grid: x=0..33, z=0 is the street (north), y=0 is the ground top; y=-1 is the bedding. Every part writes only its own module and only into air.
- Beam lines (x=10,13,...,31): the header skips them, the roof part lays dark_oak_log axis=z at y=5 along the whole line (z=5..28). Do not place anything else at y=5 there.
- The roof overhang is off-grid: x=9 and z=6 are inside the 0..33 grid, so nothing shifts; keep every coordinate absolute.
- The atrium door cells (x=19..20, y=2..3, z=11 and z=18) win over the x=19 post: part 4 puts the post at y=4 only there.
- Room boxes are the air the interior designers may fill; keep doorway cells, the pit, and one-block paths clear. Do not put furniture on door cells.
- The architect's RESERVED cells are for the named parts only. The car and palms are in the front yard; palm (30,4)'s crown meets the roof at z=6: skip cells that are already filled.
- No colored full block stands in for an object. Use stairs, slabs, trapdoors, carpet.
- Part 1 (shell) notes: build.mjs lays dirt at y=0 over the whole lot before the parts, so the shell does not rewrite the dirt under the house or atrium; the pit's y=0 cells are overwritten to smooth_quartz. The shell leaves air, for later parts to fill: the whole south wall body y=2..4 (x=10..31, z=25: glass, posts, sliders), the corner cells (10/31, z=8 and z=25) for part 4's posts, the clerestory row y=4 x=22..30 at z=8, the atrium ring body, and the entry niche plus door cells (x=18..20, z=9). The door wall z=9 x=17 and x=21 are stucco.
- Part 1 floating cells (cleared when parts 3 and 4 land): the y=5 header and ceiling over the south wall and ring gaps (x=14..15 z=24..25; x=17..18 and x=20..21 z=18, 20..25) sit on air at y=4 until the glazing and posts (part 4) and the beams (part 3) go in.

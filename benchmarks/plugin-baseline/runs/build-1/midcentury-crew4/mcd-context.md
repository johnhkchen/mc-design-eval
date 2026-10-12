# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
- [ ] 1 shell  - [ ] 2 site  - [ ] 3 roofs  - [ ] 4 facades  - [ ] 5 front  - [ ] 6 back

## Notes for workers
- The grid: x=0..33, z=0 is the street (north), y=0 is the ground top; y=-1 is the bedding. Every part writes only its own module and only into air.
- Beam lines (x=10,13,...,31): the header skips them, the roof part lays dark_oak_log axis=z at y=5 along the whole line (z=5..28). Do not place anything else at y=5 there.
- The roof overhang is off-grid: x=9 and z=6 are inside the 0..33 grid, so nothing shifts; keep every coordinate absolute.
- The atrium door cells (x=19..20, y=2..3, z=11 and z=18) win over the x=19 post: part 4 puts the post at y=4 only there.
- Room boxes are the air the interior designers may fill; keep doorway cells, the pit, and one-block paths clear. Do not put furniture on door cells.
- The architect's RESERVED cells are for the named parts only. The car and palms are in the front yard; palm (30,4)'s crown meets the roof at z=6: skip cells that are already filled.
- No colored full block stands in for an object. Use stairs, slabs, trapdoors, carpet.
```

### elements.md

```markdown
# REQUIRED ELEMENTS: mid-century modern house (checklist)

Coordinates are from plan.md (x east, y up, z south; z=0 is the street). "Part" = the part that builds it (see PARTS in
plan.md); "Vocab" = the helper in VOCABULARY. Nothing here is a coloured full block standing in for an object.

## A. Form and structure
- [ ] **1. Low, long horizontal house**, 22 x 18, walls y=1..5, roof to y=7. Part 1 shell. Vocab `stucco_wall`, `header_course`.
- [ ] **2. Very low-pitch gable roof, deep eaves**: hand-built stepped slab roof, ridge along x at z=16..17 (y=7), eaves z=6/27 (y=6), 2-cell overhang front and back, 1 at the gable ends; dark_oak_slab fascia ring. Part 3. Vocab `roof_band`, `fascia_ring`.
- [ ] **3. Exposed beam ends**: dark_oak_log axis z at y=5 on x=10,13,...,31, running z=5..28 (3 cells beyond the walls on each side). Part 3. Vocab `beam_line`.
- [ ] **4. Post-and-beam structure**: dark_oak_log posts (vertical, y=2..4) on every beam line of the south wall, the 4 house corners, the ring corners. Beams above carry the roof. Part 4. Vocab `post`.
- [ ] **5. Flat carport roof stepping one level below the main eave**: smooth_stone_slab deck at y=5, x=0..9, z=7..21, dark_oak_slab fascia on x=0, z=7, z=21; on dark_oak_log posts (x=1; z=8,14,20; y=1..4) and beams (y=4). Part 2. Vocab `carport`.
- [ ] **6. Carport breeze-block screen** at z=21, x=1..9, y=1..4: checkerboard of white_concrete and AIR (holes left open). Part 2. Vocab `breeze_screen`.

## B. Street facade (north, z=8)
- [ ] **7. Mostly blank white stucco** x=10..17 and x=21..31, y=2..4, white_concrete on a smooth_stone base (y=1) and a dark_oak_planks header (y=5). Part 1 (walls), part 4 (glazing). Vocab `stucco_wall`.
- [ ] **8. Clerestory strip** at y=4, z=8: glass_pane x=22..24, 26..27, 29..30 with dark_oak_log mullions at x=25 and x=28. Part 4. Vocab `clerestory`.
- [ ] **9. Stone feature wall** freestanding at z=7, x=11..17, y=1..4: mud_bricks with ~25% packed_mud (seeded), mud_brick_slab cap at y=5 on x=11,12,14,15,17 only. Part 4. Vocab `ledgestone_wall`.
- [ ] **10. Bold orange front door**: entry recess x=18..20 z=8 (air), door wall at z=9: orange_concrete panels x=18 and x=20 y=2..4; acacia_door at x=19 z=9 y=2..3 (facing north); orange_concrete transom (19,4,9); smooth_stone reveal x=17, white_concrete reveal x=21. Part 1 leaves the niche, part 4 fills it. Vocab `orange_entry`.
- [ ] **11. Entry landing and stepping-pad path** (x=18..20, z=6..7 landing; pads z=1,3,5 in sand). Part 2. Vocab `stepping_pad`.

## C. Garden facade (south, z=25) and the other sides
- [ ] **12. Floor-to-ceiling glass wall with thin dark posts**: glass_pane y=2..4 between dark_oak_log posts on every beam line x=10..31; only base (y=1) and header (y=5) stay opaque. Part 4. Vocab `glass_bay`, `post`.
- [ ] **13. Three sliding-door gaps** x=14..15, x=20..21, x=26..27 at z=25 (y=2..3 AIR, glass_pane at y=4 above). Part 1 leaves them, part 4 glazes y=4. Vocab `slider_gap`.
- [ ] **14. Gable-end glass clerestories** x=10 and x=31, y=6, z=14..19. Part 3 (roof) places the panes. Vocab `glass_bay`.
- [ ] **15. West and east windows**: dining x=10 z=14..16 y=3..4; bedroom 1 x=31 z=10..12 y=3..4; bath clerestory x=31 z=15..16 y=4; master full-height x=31 z=21..23 y=2..4; utility door gap x=10 z=10 y=2..3 (with an open dark_oak_door). Part 4. Vocab `glass_bay`, `utility_door`.

## D. Atrium
- [ ] **16. Open-sky courtyard** x=17..21, z=12..17, no roof and no slab (dirt at y=0): glass_pane ring (x=16, x=22, z=11, z=18, y=2..4), dark_oak_log posts at the 4 corners and on x=19 at z=11, z=18 (y=4 only above the doors), dark_oak_planks header y=5, ring crossing band C glazed at y=6. Part 1 (header, openings), part 4 (glass, posts). Vocab `atrium_ring`.
- [ ] **17. Atrium planting**: the atrium's interior designer (a small tree-fern garden: grass_block patch, a potted palm, large_fern, rocks, a smooth_stone stepping path between the two doors at x=19..20). Room "atrium".

## E. Site
- [ ] **18. Concrete driveway** x=1..8, z=1..21, smooth_stone with light_gray_concrete joint rows at z=4,8,12,16. Part 2. Vocab `joint_row`.
- [ ] **19. Sidewalk** z=0 x=0..33 smooth_stone. Part 2.
- [ ] **20. Two-tone 1950s car** parked nose to the street on the driveway, x=3..5, y=1..2, z=1..7: cyan_concrete body, white roof and tail fins, glass cabin, iron_block chrome bumpers, black_concrete tyres, yellow_concrete headlamps, red_concrete tail lamps. Part 5. Vocab `car_50s`.
- [ ] **21. Desert planting out front**: sand yard with gravel beds (x=22..30 and x=10..16, z=1..5), cactus cluster (x=23..29, z=2..4; sand under each cactus), two palms (12,3) and (30,4). Part 5. Vocab `palm`, `saguaro`, `barrel_cactus`.
- [ ] **22. Low mailbox** at (9,1): dark_oak_fence post y=1, box y=2. Part 5. Vocab `mailbox`.
- [ ] **23. Kidney-shaped pool** (RESERVED cells in plan.md): water y=-1..0, light_blue_concrete liner (floor y=-2, walls y=-1), smooth_quartz_slab coping at y=0 round the rim. Part 6. Vocab `kidney_pool`.
- [ ] **24. Back patio and pool deck** smooth_stone y=0 (patio x=10..31 z=26..28; deck x=11..24 z=29..33); loungers and a parasol table on the patio; a palm at (29,31). Part 2 (paving), part 6 (furniture, palm). Vocab `lounger`, `patio_table`.
- [ ] **25. Lawns** grass_block y=0, x=0..10 and x=25..33 z=26..33 where not paved; side strips of sand. Part 2.
- [ ] **26. Outdoor lighting**: two `garden_lamp` posts flanking the entry path at (17,0..,5) and (21,0..,5) on sand, plus 2 more by the pool; `garden_lamp`. Part 6.

## F. Interior (built by the room designers, from the shell's rooms)
- [ ] **27. Open-plan living room** with **sunken conversation pit** (x=13..17, z=20..23, floor y=0 smooth_quartz, steps and built-in benches, low table) and **freestanding fireplace** (x=20..21, z=21..22 y=1..8; shaft by part 3). Rooms "living". Vocab `conversation_pit`, `fireplace_stack`, `sofa_low`, `egg_chair`.
- [ ] **28. Dining area** with a table and six chairs, a sideboard, pendant lamp. Room "dining". Vocab `dining_set`, `sideboard`.
- [ ] **29. Galley kitchen with breakfast bar**. Room "kitchen". Vocab `galley_kitchen`, `bar_stool`.
- [ ] **30. Entry gallery** with a bench and a coat hook wall. Room "gallery".
- [ ] **31. Corridor to three bedrooms**: bedroom 1, bedroom 2, master. Beds, wardrobes, nightstands. Vocab `bed_double`, `wardrobe`, `nightstand`.
- [ ] **32. Two bathrooms**. Vocab `bath_fit`.
- [ ] **33. Warm wood panelling** (spruce_planks ceiling, spruce_trapdoor wall panelling), **terrazzo floors** (smooth_stone + light_gray/white flecks) in the public rooms. Vocab `terrazzo_floor`, `panel_wall`.
- [ ] **34. Period furniture**: low sofas, egg chair, sideboard, tulip side table, floor lamp. Vocab above.
- [ ] **35. Lit**: every room has a hung lantern or sea_lantern light. Vocab `hung_lantern`.
```

### rooms.json

```json
{"entrance":[19,1,7],"rooms":[{"name":"gallery","box":[16,2,10,22,4,10]},{"name":"kitchen","box":[11,2,9,15,4,13]},{"name":"dining","box":[11,2,14,15,4,18]},{"name":"living","box":[11,2,19,21,4,24]},{"name":"atrium","box":[17,1,12,21,4,17]},{"name":"corridor","box":[23,2,9,24,4,21]},{"name":"bedroom 1","box":[26,2,9,30,4,12]},{"name":"bath 1","box":[26,2,14,27,4,16]},{"name":"bath 2","box":[29,2,14,30,4,16]},{"name":"bedroom 2","box":[26,2,18,30,4,20]},{"name":"master bedroom","box":[23,2,22,30,4,24]}]}
```

### palette.json

```json
{"roles":{"stucco":["white_concrete"],"structure":["dark_oak_log","dark_oak_fence"],"header":["dark_oak_planks"],"fascia":["dark_oak_slab"],"base_paving":["smooth_stone","smooth_stone_slab"],"roof_deck":["smooth_stone_slab"],"driveway_joints":["light_gray_concrete"],"ledgestone":["mud_bricks","packed_mud","mud_brick_slab"],"glass":["glass_pane"],"front_door":["acacia_door"],"utility_door":["dark_oak_door"],"accent":["orange_concrete"],"pool":["water","light_blue_concrete","smooth_quartz_slab","smooth_quartz_stairs"],"pit_floor":["smooth_quartz","smooth_quartz_stairs"],"ground":["sand","gravel","grass_block","dirt"],"floor_public":["smooth_stone","light_gray_concrete","white_concrete"],"floor_bedrooms":["spruce_planks"],"floor_baths":["smooth_quartz"],"ceiling":["spruce_planks"],"wall_panelling":["spruce_trapdoor","spruce_stairs","spruce_slab","spruce_planks","spruce_fence"],"partitions":["white_concrete"],"fireplace":["mud_bricks","black_concrete","campfire","smooth_stone_slab"],"car":["cyan_concrete","white_concrete","black_concrete","iron_block","iron_trapdoor","glass_pane","sea_lantern"],"planting":["cactus","jungle_log","jungle_leaves","dead_bush","short_grass","large_fern"],"entry_lighting":["lantern"],"mailbox":["mud_bricks","mud_brick_slab","black_concrete"],"poolside_furniture":["smooth_quartz_stairs","smooth_quartz_slab","birch_slab"],"street":["gray_concrete"]},"objects":["cyan_concrete","yellow_concrete","red_concrete","iron_block","black_concrete","cactus","jungle_log","jungle_leaves","large_fern","potted_cactus","dead_bush","short_grass","lantern","sea_lantern","end_rod","daylight_detector","dark_oak_fence","orange_carpet","white_carpet","cyan_carpet","yellow_carpet","smooth_red_sandstone_stairs","quartz_stairs","quartz_slab","smooth_quartz_stairs","birch_planks","birch_slab","birch_stairs","birch_trapdoor","iron_trapdoor","spruce_fence","spruce_slab","spruce_stairs","spruce_trapdoor","lectern","bookshelf","flower_pot","item_frame","barrel","smoker","furnace","cauldron","orange_bed","cyan_bed","yellow_bed","light_blue_bed","white_bed","acacia_door","white_concrete","glass_pane","mud_bricks","mud_brick_slab","smooth_stone_slab","water","light_blue_concrete","smooth_quartz_slab"]}
```

### make.sh

```sh
#!/usr/bin/env bash
# The ONE command that makes build.nbt from scratch: generator parts -> build.nbt.
# No roof preset step: plan.md builds the main roof by hand (no preset fits its pitch), so the parts make the whole house.
set -euo pipefail
cd "$(dirname "$0")"
MCD="/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs"
node build.mjs build.tmp.nbt
mv build.tmp.nbt build.nbt
$MCD info build.nbt | head -8
```

### build.mjs

```js
// Mid-century house generator: `node build.mjs [out.nbt]` (default build.nbt here). make.sh runs it and moves the result into place.
// Coordinates are plan.md's absolute ones. A structure grid is 0-based, so cells below y=0 (the bedding at y=-1 and the
// pool basin at y=-2..-1) cannot be stored: they are dropped and counted, and the pool reads as shallow water at y=0.
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as shell from "./parts/shell.mjs";
import * as site from "./parts/site.mjs";
import * as roofs from "./parts/roofs.mjs";
import * as facades from "./parts/facades.mjs";
import * as front from "./parts/front.mjs";
import * as back from "./parts/back.mjs";
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
import { renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] ?? join(here, "build.nbt");
const SIZE = [34, 9, 34]; // x 0..33, y 0..8 (chimney top), z 0..33

// kidney pool cells (plan.md RESERVED): no ground there, so the pool stays open
const POOL = { 29: [[14, 17], [20, 21]], 30: [[13, 22]], 31: [[13, 22]], 32: [[14, 21]] };
const inPool = (x, z) => (POOL[z] ?? []).some(([a, b]) => x >= a && x <= b);

const grid = new Grid(SIZE);
// the ground: dirt at y=0 over the lot except the pool (cells set here stay writable by every part, as sibling builds do)
for (let x = 0; x < SIZE[0]; x++) for (let z = 0; z < SIZE[2]; z++) if (!inPool(x, z)) grid.set(x, 0, z, "dirt");

// wrap the grid so writes below y=0 are dropped and counted instead of thrown
let dropped = 0;
const g = new Proxy(grid, {
  get(target, prop) {
    if (prop === "set") return (x, y, z, ...rest) => { if (y < 0) { dropped++; return g; } return target.set(x, y, z, ...rest); };
    const v = Reflect.get(target, prop);
    return typeof v === "function" ? v.bind(target) : v;
  },
});

const reports = runParts(g, [
  ["house shell and ground", shell.build],
  ["site, carport and paving", site.build],
  ["roofs, beams and fireplace stack", roofs.build],
  ["facades, glazing and entry", facades.build],
  ["car and front garden", front.build],
  ["pool, patio and garden details", back.build],
  ["room: gallery", room1.build],
  ["room: kitchen", room2.build],
  ["room: dining", room3.build],
  ["room: living", room4.build],
  ["room: atrium", room5.build],
  ["room: corridor", room6.build],
  ["room: bedroom 1", room7.build],
  ["room: bath 1", room8.build],
  ["room: bath 2", room9.build],
  ["room: bedroom 2", room10.build],
  ["room: master bedroom", room11.build],
], { palette: join(here, "palette.json") });
console.log(`cells below y=0 dropped (bedding and pool basin): ${dropped}`);
const tmp = out + ".tmp.nbt";
grid.save(tmp);
renameSync(tmp, out);
console.log(JSON.stringify({ saved: out, size: SIZE, parts: reports.map((r) => `${r.part}:${r.placed}${r.refused ? `(refused ${r.refused})` : ""}`) }));
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for every part: palette ids (palette.json only), plan.md site coordinates, and a seeded rng.
// Every export is documented on the line above it or after it.

// ---- grid and heights (plan.md: x 0..33 west→east, z 0..33 north→south, y = height) -----------------------------

// ---- grid and heights (plan.md: x 0..33 west→east, z 0..33 north→south, y = height) -----------------------------
/** Structure size: x 0..33, y 0..8 (chimney cap), z 0..33. */
export const GRID_SIZE = [34, 9, 34];

/** Bedding (dirt under the lot); cannot be stored in the grid, so the pool basin is dropped. */
export const BEDDING_Y = -1;

/** Ground top; sidewalk, sand and lawns sit here. */
export const GROUND_Y = 0;

/** House finished floor slab. */
export const FLOOR_Y = 1;

/** Standing height (first air cell above the floor). */
export const STANDING_Y = 2;

/** Top of the wall body; header course and beams sit here. */
export const HEADER_Y = 5;

/** Lower roof band and the raised ceiling vault over z=14..19. */
export const ROOF_LOW_Y = 6;

/** Ridge height (highest roof point). */
export const ROOF_HIGH_Y = 7;

/** Chimney cap (top of the fireplace stack). */
export const CHIMNEY_TOP_Y = 8;

// ---- structural rhythm ---------------------------------------------------------------------------------------------
/** Beam lines every 3 cells; every post, beam and beam end sits on one of these x values. */
export const BEAM_LINES = [10, 13, 16, 19, 22, 25, 28, 31];

/** Beam logs run along z between these two cells (exposed tails at 5 and 28). */
export const BEAM_Z = [5, 28];

// ---- site masses (inclusive x0..x1, z0..z1) ------------------------------------------------------------------------
/** The whole lot, bedding included. */
export const LOT = { x0: 0, x1: 33, z0: 0, z1: 33 };

/** Main house walls on the perimeter (floor y=1, walls y=1..5). */
export const HOUSE = { x0: 10, x1: 31, z0: 8, z1: 25 };

/** Main roof including overhangs (y=6..7). */
export const ROOF = { x0: 9, x1: 32, z0: 6, z1: 27 };

/** Atrium hole in the roof and open courtyard floor (y=1..). */
export const ATRIUM = { x0: 17, x1: 21, z0: 12, z1: 17 };

/** Carport under its flat deck at y=5. */
export const CARPORT = { x0: 0, x1: 9, z0: 7, z1: 21, deckY: 5 };

/** Freestanding fireplace and chimney cells. */
export const CHIMNEY = { x0: 20, x1: 21, z0: 21, z1: 22 };

/** Conversation pit (floor y=0, no slab at y=1). */
export const PIT = { x0: 13, x1: 17, z0: 20, z1: 23 };

/** Feature stone wall, freestanding 1-thick leaf at z=7. */
export const FEATURE_WALL = { x0: 11, x1: 17, z: 7, y0: 1, y1: 4 };

/** Driveway (smooth_stone), joint rows at z=4,8,12,16. */
export const DRIVEWAY = { x0: 1, x1: 8, z0: 1, z1: 21 };

/** Driveway joint rows (light_gray_concrete) at these z values. */
export const DRIVEWAY_JOINTS = [4, 8, 12, 16];

/** Entry landing under the eave (smooth_stone). */
export const LANDING = { x0: 18, x1: 20, z0: 6, z1: 7 };

/** Back patio under and behind the south eave. */
export const PATIO = { x0: 10, x1: 31, z0: 26, z1: 28 };

/** Pool deck around the kidney pool. */
export const POOL_DECK = { x0: 11, x1: 24, z0: 29, z1: 33 };

/** Car parked nose to the street (body y=1..2). */
export const CAR = { x0: 3, x1: 5, z0: 1, z1: 7 };

/** Mailbox post at the head of the driveway. */
export const MAILBOX = { x: 9, z: 1 };

/** Cactus bed on gravel (y=1..3). */
export const CACTUS_BED = { x0: 23, x1: 29, z0: 2, z1: 4 };

/** Palm base cells (trunk y=1..7 with a crown). */
export const PALMS = [[12, 3], [30, 4], [29, 31]];

/** Entry cell where the walker arrives (x,y,z). */
export const ENTRANCE = [19, 1, 7];

/** Front door cell (x=19, z=9, y=2..3), facing north. */
export const FRONT_DOOR = { x: 19, z: 9, y0: 2, y1: 3 };

/** Utility door from the carport into the kitchen (x=10, z=10, y=2..3). */
export const UTILITY_DOOR = { x: 10, z: 10, y0: 2, y1: 3 };

/** South sliders (2 wide, y=2..3, glass at y=4), by their first x. */
export const SLIDERS = [{ x0: 14, z: 25 }, { x0: 20, z: 25 }, { x0: 26, z: 25 }];

/** Atrium door pairs (2 wide, y=2..3): from the gallery at z=11 and to the living room at z=18. */
export const ATRIUM_DOORS = [{ x0: 19, z: 11 }, { x0: 19, z: 18 }];

// ---- kidney pool (reserved; ground and bedding left empty). Keyed by z: [x0, x1] runs. -----------------------------
/** Kidney pool cells by z, each row a list of inclusive [x0, x1] runs. */
export const POOL_CELLS = { 29: [[14, 17], [20, 21]], 30: [[13, 22]], 31: [[13, 22]], 32: [[14, 21]] };

// ---- room air boxes [x0,y0,z0,x1,y1,z1] (plan.md ROOMS; the interior designers fill these) ----------------------------
/** Room inner-air boxes by name, in the order of rooms.json. */
export const ROOM_BOXES = {
  gallery: [16, 2, 10, 22, 4, 10],
  kitchen: [11, 2, 9, 15, 4, 13],
  dining: [11, 2, 14, 15, 4, 18],
  living: [11, 2, 19, 21, 4, 24],
  atrium: [17, 1, 12, 21, 4, 17],
  corridor: [23, 2, 9, 24, 4, 21],
  "bedroom 1": [26, 2, 9, 30, 4, 12],
  "bath 1": [26, 2, 14, 27, 4, 16],
  "bath 2": [29, 2, 14, 30, 4, 16],
  "bedroom 2": [26, 2, 18, 30, 4, 20],
  "master bedroom": [23, 2, 22, 30, 4, 24],
};

// ---- palette: one constant per palette.json id -----------------------------------------------------------------
// Stucco, structure, header, fascia and base
/** Stucco body walls. */
export const WHITE_CONCRETE = "white_concrete";

/** Posts, beams, beam ends and mullions (structure). */
export const DARK_OAK_LOG = "dark_oak_log";

/** Mailbox post, patio table legs and garden lamp posts. */
export const DARK_OAK_FENCE = "dark_oak_fence";

/** Continuous header course under the eave. */
export const DARK_OAK_PLANKS = "dark_oak_planks";

/** Fascia and dark roof edge, and entry soffit. */
export const DARK_OAK_SLAB = "dark_oak_slab";

/** Base course, slab edge, paving, entry and roof-deck slab. */
export const SMOOTH_STONE = "smooth_stone";

/** Smooth stone slab (roof deck gravel; fireplace cap). */
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";

/** Driveway joint rows. */
export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";

/** Ledgestone feature wall. */
export const MUD_BRICKS = "mud_bricks";

/** Ledgestone flecks (about 25% of the feature wall). */
export const PACKED_MUD = "packed_mud";

/** Ledgestone cap. */
export const MUD_BRICK_SLAB = "mud_brick_slab";

/** Glass walls, clerestory, ring and car windows. */
export const GLASS_PANE = "glass_pane";

/** Front door (acacia, reads orange). */
export const ACACIA_DOOR = "acacia_door";

/** Utility door from the carport. */
export const DARK_OAK_DOOR = "dark_oak_door";

/** Door surround, transom and bold accent. */
export const ORANGE_CONCRETE = "orange_concrete";

/** Pool water. */
export const WATER = "water";

/** Pool liner. */
export const LIGHT_BLUE_CONCRETE = "light_blue_concrete";

/** Pool coping slab and lounger foot. */
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";

/** Lounger head, patio chairs and pit steps. */
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";

/** Pit floor and bath floors. */
export const SMOOTH_QUARTZ = "smooth_quartz";

// Ground cover
/** Front yard and patio sand. */
export const SAND = "sand";

/** Gravel beds. */
export const GRAVEL = "gravel";

/** Back lawn. */
export const GRASS_BLOCK = "grass_block";

/** Bedding and atrium planting soil. */
export const DIRT = "dirt";

// Interior surfaces
/** Bedroom floors and the ceiling between beams. */
export const SPRUCE_PLANKS = "spruce_planks";

/** Wall panelling (open trapdoors against the wall). */
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";

/** Panelling and stair-style trim. */
export const SPRUCE_STAIRS = "spruce_stairs";

/** Panelling, shelves and cabinet tops. */
export const SPRUCE_SLAB = "spruce_slab";

/** Panelling, table legs and bench posts. */
export const SPRUCE_FENCE = "spruce_fence";

/** Dark fireplace flue and car tyres. */
export const BLACK_CONCRETE = "black_concrete";

/** Lit campfire in the fireplace firebox. */
export const CAMPFIRE = "campfire";

/** Car lower body (saturated teal). */
export const CYAN_CONCRETE = "cyan_concrete";

/** Car chrome, bumpers and the kitchen fridge. */
export const IRON_BLOCK = "iron_block";

/** Iron trapdoors used as sofa backs and the egg chair shell. */
export const IRON_TRAPDOOR = "iron_trapdoor";

/** Bright light fixture (bath 1 ceiling light). */
export const SEA_LANTERN = "sea_lantern";

// Planting and garden
/** Desert cacti (saguaro and barrel cacti). */
export const CACTUS = "cactus";

/** Palm trunk and atrium sapling trunk. */
export const JUNGLE_LOG = "jungle_log";

/** Palm crown and atrium sapling leaves. */
export const JUNGLE_LEAVES = "jungle_leaves";

/** Dead bush on the sand. */
export const DEAD_BUSH = "dead_bush";

/** Short grass on the lawns. */
export const SHORT_GRASS = "short_grass";

/** Large ferns in the atrium. */
export const LARGE_FERN = "large_fern";

/** Hung lanterns and garden lamps (hanging=true for ceilings). */
export const LANTERN = "lantern";

// Furniture and objects
/** Birch slab tops (sideboard, bench, stools). */
export const BIRCH_SLAB = "birch_slab";

/** Gray concrete for the street, if used. */
export const GRAY_CONCRETE = "gray_concrete";

/** Car headlamps. */
export const YELLOW_CONCRETE = "yellow_concrete";

/** Car tail lamps. */
export const RED_CONCRETE = "red_concrete";

/** Potted cacti on sills and tables. */
export const POTTED_CACTUS = "potted_cactus";

/** Floor lamp top (end_rod on a fence). */
export const END_ROD = "end_rod";

/** Daylight detector (palette lighting option). */
export const DAYLIGHT_DETECTOR = "daylight_detector";

/** Orange carpets (seats, cushions, rugs). */
export const ORANGE_CARPET = "orange_carpet";

/** White carpets. */
export const WHITE_CARPET = "white_carpet";

/** Cyan carpets. */
export const CYAN_CARPET = "cyan_carpet";

/** Yellow carpets. */
export const YELLOW_CARPET = "yellow_carpet";

/** Orange upholstered seats (sofas, egg chair). */
export const SMOOTH_RED_SANDSTONE_STAIRS = "smooth_red_sandstone_stairs";

/** Quartz stairs (WC, benches). */
export const QUARTZ_STAIRS = "quartz_stairs";

/** Quartz slab (tables, counters). */
export const QUARTZ_SLAB = "quartz_slab";

/** Birch planks (chair seats, shelves). */
export const BIRCH_PLANKS = "birch_planks";

/** Birch stairs (dining chairs). */
export const BIRCH_STAIRS = "birch_stairs";

/** Birch trapdoors (cabinet fronts). */
export const BIRCH_TRAPDOOR = "birch_trapdoor";

/** Lectern (reading desk). */
export const LECTERN = "lectern";

/** Bookshelf. */
export const BOOKSHELF = "bookshelf";

/** Flower pot (tulip and small plants). */
export const FLOWER_POT = "flower_pot";

/** Item frame id (art; the item itself is not a block). */
export const ITEM_FRAME = "item_frame";

/** Barrel (storage). */
export const BARREL = "barrel";

/** Smoker (mailbox slot, kitchen appliance). */
export const SMOKER = "smoker";

/** Furnace (kitchen hob). */
export const FURNACE = "furnace";

/** Cauldron (basin). */
export const CAULDRON = "cauldron";

/** Orange bed (master bedroom). */
export const ORANGE_BED = "orange_bed";

/** Cyan bed. */
export const CYAN_BED = "cyan_bed";

/** Yellow bed (bedroom 2). */
export const YELLOW_BED = "yellow_bed";

/** Light blue bed (bedroom 1). */
export const LIGHT_BLUE_BED = "light_blue_bed";

/** White bed (palette option). */
export const WHITE_BED = "white_bed";

// ---- seeded random: same seed, same build -----------------------------------------------------------------------
/** Seeded PRNG (mulberry32): rng(seed)() returns a float in [0, 1); same seed, same sequence. */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Mid-century house helpers, part h1 (plan.md VOCABULARY). Each takes its grid, then its position (and facing) as
// arguments. A helper writes only the footprint its arguments define, and only into air: a cell already built is
// skipped and listed in `skipped`. Nothing is written below y=0 (the grid stores no cells there; counted in `below`).
// Every helper returns { placed, skipped: [[x,y,z], ...], below }.

/** White stucco over the box x0..x1, z0..z1, y0..y1 (inclusive). */
export function stucco_wall(g, x0, z0, x1, z1, y0 = 2, y1 = 4)

/**
 * A 2-wide sliding door opening at x..x+1, z: glass_pane at y=4 above it. The opening (y=2..3) is never closed here;
 * `open` says whether it is still air.
 */
export function slider_gap(g, x, z)

/**
 * One band of the stepped slab roof: smooth_stone_slab (type = "bottom" | "top") over x=9..32, rows zA..zB, at y.
 * Skips the atrium hole (x=17..21, z=12..17) and the chimney hole (x=20..21, z=21..22). With { fascia: true } the
 * outer ring (x=9, x=32, z=6, z=27) and the hole edges take dark_oak_slab at the same half.
 */
export function roof_band(g, zA, zB, y, half, { fascia = false } = {})

/** Breeze-block screen: white_concrete where x+y is even, air elsewhere; x0..x1, y0..y1 at row z. */
export function breeze_screen(g, x0, x1, z, y0 = 1, y1 = 4)

/** Palm: jungle_log trunk y=1..7 at (x,z) and a crown of persistent jungle_leaves at y=6..7 (radius 2 at y=6). */
export function palm(g, x, z)

/**
 * Kidney pool with its top-left cell at (x, z) (plan.md: x=13, z=29 for the house). Water at y=-1..0 and a light-blue
 * floor and liner at y<0 (below the grid, so they are counted in `below`). The coping (smooth_quartz_slab, bottom)
 * replaces only the smooth_stone deck cells beside the pool at y=0; any other cell is left alone.
 */
export function kidney_pool(g, x, z)

/** A hanging lantern at (x, y, z) from the block above it at (x, y+1, z). Refused (no write) when nothing hangs it. */
export function hung_lantern(g, x, z, y = 4)

/**
 * Egg chair: seat (x,2,z) faces `facing`; its high back is two iron_trapdoors (y=2..3) on the cell behind it; one
 * iron_trapdoor at y=2 on each side. Footprint x-1..x+1, z-1..z+1 at y=2..3.
 */
export function egg_chair(g, x, z, facing)

/**
 * Fireplace stack on the 2x2 at x..x+1, z..z+1 (plan.md: x=20, z=21), y=1..8: hearth mud_bricks, a lit campfire
 * firebox at y=2 on the x column, a mud_bricks lintel at y=3, a black_concrete flue at y=4..7, a slab cap at y=8.
 */
export function fireplace_stack(g, x, z)

/**
 * Wardrobe of `len` cells along `axis` ("x" or "z") from (x, z): spruce_planks body at y=2..3 on the back row, and open
 * spruce_trapdoor fronts on the front row (the row toward +z for axis x, +x for axis z), hinged on the back side.
 */
export function wardrobe(g, x, z, len, axis)
```

### vocab/h2.mjs

```js
// Mid-century house helpers, part h2 (plan.md VOCABULARY): header course, clerestory, fascia ring, joint row,
// saguaro, lounger, terrazzo floor, sideboard, dining set, bath fit. Same contract as h1: each takes its grid, then its
// position (and facing) as arguments, writes only the footprint those arguments define, and only into air. An `over`
// option names the blocks a helper may replace (default: none). Every helper returns { placed, skipped, below }.
// Footprints are in each comment; a caller keeps the furniture inside the room it was given.

/** Dark header band under the eave: dark_oak_planks at y (default 5) over x0..x1, z0..z1, skipping the beam lines. */
export function header_course(g, x0, z0, x1, z1, { y = 5, over = [] } = {})

/** Clerestory strip on the north wall: glass_pane at x0..x0+2, x0+4..x0+5, x0+7..x0+8 and dark_oak_log mullions at x0+3, x0+6.
 *  Plan: x0=22, z=8, y=4. Footprint: x0..x0+8 at row y, cell z. */
export function clerestory(g, x0, z, y, { over = [] } = {})

/** Dark fascia on the roof: the outer ring of roof = [x0, z0, x1, z1] and the rim round a hole = [x0, z0, x1, z1] swap
 *  each smooth_stone_slab (the roof band) for dark_oak_slab of the same type, at y in yLo..yHi. This is the one helper that
 *  replaces: it touches only roof slabs, never other blocks. Plan: roof=[9,6,32,27], hole=[17,12,21,17], y 6..7. */
export function fascia_ring(g, roof, { hole = null, yLo = 6, yHi = 7 } = {})

/** Light-gray joint across a driveway: light_gray_concrete at y (default 0) over x0..x1 at row z. Cuts into the driveway's
 *  smooth_stone by default (joints are only ever cut into paving). Footprint: x0..x1 at y, row z. */
export function joint_row(g, z, x0, x1, { y = 0, over = ["smooth_stone"] } = {})

/** Saguaro: a cactus trunk at (x, 1..h, z); h = 3 adds the arm at (x-1, 2..3, z). The sand under it belongs to the site
 *  part and is not written. Footprint: x-1..x, y 1..h, row z. */
export function saguaro(g, x, z, h, { over = [] } = {})

/** Lounger on the patio: head = smooth_quartz_stairs at (x, 1, z) facing the foot; foot = smooth_quartz_slab (bottom) one cell
 *  away along axis x|z in direction d (1 or -1). Footprint: the two cells at y=1. */
export function lounger(g, x, z, axis, d, { over = [] } = {})

/** Terrazzo floor: smooth_stone over x0..x1, z0..z1 at y (default 1), with light_gray_concrete (~12%) and white_concrete (~6%)
 *  flecks from a seeded generator. Footprint: x0..x1, y, z0..z1. */
export function terrazzo_floor(g, x0, z0, x1, z1, { y = 1, seed = 1, over = [] } = {})

/** Sideboard: a row of len cells from (x, z) along axis x|z. Birch_trapdoor cabinet fronts at y=2 (closed, facing the room
 *  side `facing`), a birch_slab top at y=3, and a potted_cactus on the middle cell at y=4. One cell deep; len up to 3 fits the
 *  dining room's west wall (x=11). Footprint: the row, y 2..4. */
export function sideboard(g, x, z, len, axis, facing, { over = [] } = {})

/** Dining set for six: spruce_fence legs at the corners of a 2x3 table (x..x+1, z..z+2), a spruce_slab top (type=top) at y=3
 *  over it, three birch_stairs chairs each long side (x-1 facing east, x+2 facing west), and a hanging lantern at (x, 4, z+1)
 *  only if a beam or ceiling block sits above it at (x, 5, z+1). Footprint: x-1..x+2, y 2..4, z..z+2. Dining room is
 *  x 11..15, z 14..18, so x is 12 or 13 and z is 14..16. */
export function dining_set(g, x, z, { over = [] } = {})

/** Bath fit, 2 wide x 3 deep, back against the north wall at row z: cauldron basin at (x, 2, z) with a glass_pane mirror above
 *  it at (x, 3, z); quartz_stairs WC at (x+1, 2, z) facing south; row z+1 is the clear lane; tub = two smooth_quartz_slab
 *  (bottom) cells at (x..x+1, 2, z+2). Footprint: x..x+1, y 2..3, z..z+2. Fits both baths (x 26..27 and 29..30, z 14..16). */
export function bath_fit(g, x, z, { over = [] } = {})
```

### vocab/h3.mjs

```js
// Vocabulary helpers from plan.md VOCABULARY (h3): post, orange_entry, beam_line, stepping_pad, barrel_cactus,
// patio_table, panel_wall, coffee_table, galley_kitchen. Each takes its position (and facing) as arguments and
// returns { placed, blocked }: blocked counts cells that already held a block, which the helper leaves alone.
// Each writes only its own footprint and nothing under it (stepping_pad paves the sand/dirt top of its own
// y=0 cells, the one exception). States are the ones `mcd states` lists: B.slab/B.trapdoor/B.door add
// waterlogged/powered, which these blocks don't list, so those states are written out.

/** post(x, z, y0=2, y1=4): dark_oak_log posts (axis y) on a beam line. */
export function post(g, x, z, y0 = 2, y1 = 4)

/** beam_line(x): dark_oak_log beam (axis z) at y=5 over z=5..28, on beam line x (or a wall line x=10/31). */
export function beam_line(g, x)

/**
 * orange_entry(x, z, facing="north"): the front door in cell (x, z) (acacia_door, both halves), orange panels either
 * side of it and an orange transom above, on the ground floor (y=2..4). facing = the way the door faces.
 */
export function orange_entry(g, x, z, facing = "north")

/** stepping_pad(x, z): a 3x1 smooth_stone pad at y=0 across x..x+2 on row z, paving the sand/dirt top of its own cells. */
export function stepping_pad(g, x, z)

/** barrel_cactus(x, z, y=1): a two-high cactus on the sand (the sand under it belongs to the site part). */
export function barrel_cactus(g, x, z, y = 1)

/**
 * patio_table(x, z, y=1, axis="x"): dark_oak_fence leg, smooth_quartz_slab top at y+1, and a smooth_quartz_stairs
 * chair either side along axis, its back turned away from the table. Writes nothing on the lane either side of it.
 */
export function patio_table(g, x, z, y = 1, axis = "x")

/**
 * panel_wall(x, y0..y1, z, facing): a column of open spruce_trapdoors in cells (x, y0..y1, z), halves alternating
 * per row. facing = the side the panel hinges from, i.e. the wall it lies against.
 */
export function panel_wall(g, x, y0, y1, z, facing)

/** coffee_table(x, z, y): one spruce_slab (bottom half) at cell (x, y, z). A flower pot would float on it, so none. */
export function coffee_table(g, x, z, y)

/**
 * galley_kitchen(x0, z0, y, len=5, barZ=z0+3): counter row along x on row z0 (furnace hob at x0+1, cauldron sink at
 * x0+3, iron_block fridge at the last cell), spruce_trapdoor wall cabinets above it (hinged on the wall to the north),
 * a breakfast bar on row barZ (spruce_fence legs every other cell, spruce_slab top) and birch_slab stools on row
 * barZ+1 at the leg columns. Rows z0+1..barZ-1 stay clear at y..y+1 as the walking lane.
 */
export function galley_kitchen(g, x0, z0, y, len = 5, barZ = z0 + 3)
```

### vocab/h4.mjs

```js
// Mid-century house helpers, part h4 (plan.md VOCABULARY): glass_bay, ledgestone_wall, carport, car_50s, mailbox,
// garden_lamp, sofa_low, conversation_pit, bed_double. Each takes its grid, then its position (and facing) as
// arguments, then an optional opts object. A helper writes only the footprint its arguments define, and only into air:
// a cell already built is skipped and listed in `skipped` (opts.over: true overwrites instead). Nothing is written
// below y=0 (counted in `below`). Every helper returns { placed, skipped: [[x,y,z], ...], below }.
// Leaves are persistent=true; nothing here hangs a light (hung_lantern is h1's).

/**
 * Glazing in a wall run: glass_pane over a0..a1 at height y0..y1, in the plane at `fixed`. Default axis "x": the run
 * is along x at z = fixed (the south glass wall, the window bays). { axis: "z" }: the run is along z at x = fixed (the
 * gable-end clerestories at x=10 and x=31). Glass has no states: it connects by itself.
 */
export function glass_bay(g, a0, a1, fixed, y0, y1, { axis = "x", over = false } = {})

/**
 * The freestanding feature wall along x0..x1 at z (plan.md: 1 proud of the north wall), y0..y1 high. Each cell is
 * mud_bricks, or packed_mud with probability 0.25 (a fixed per-cell hash). Its top is capped with mud_brick_slab
 * (type bottom) at y1+1, on every cell except the beam lines, where the roof's beams pass over.
 */
export function ledgestone_wall(g, x0, x1, z = 7, y0 = 1, y1 = 4, opts = {})

/**
 * The flat carport: a 10 x 15 deck (x0..x0+9, z0..z0+14) at y=5 on dark_oak_log posts (x0+1, y=1..3, at z0+1, z0+7,
 * z0+13) with dark_oak_log beams along x at y=4. The deck is smooth_stone_slab (bottom); the outer edge (x0, z0 and
 * z0+14) is dark_oak_slab fascia (bottom). The floor under it (y=0, smooth_stone) belongs to the site part: it is
 * laid only with { floor: true }, which overwrites the ground there.
 */
export function carport(g, x0 = 0, z0 = 7, opts = {})

/** The two-tone 1950s car, nose to the street: x..x+2 by z..z+6, y=1..2 (the driveway is y=0). */
export function car_50s(g, x = 3, z = 1, opts = {})

/** The low mailbox at the head of the drive: dark_oak_fence post at (x,1,z), a smoker box at (x,2,z) facing east. */
export function mailbox(g, x = 9, z = 1, opts = {})

/** A garden lamp on a sand or lawn cell: dark_oak_fence post at y=1..2, a standing lantern at y=3. */
export function garden_lamp(g, x, z, opts = {})

/**
 * A low sofa at y=2 (the floor is y=1): a seat row of len smooth_red_sandstone_stairs starting at x,z and running along
 * `axis` ("x" or "z"); `facing` is the way the sitter looks. The seat stairs have their high back on the rear side,
 * a row of open iron_trapdoors stands one cell behind the seat as the backrest, and an arm stair sits at each end of
 * the seat row, turned to face the seat.
 */
export function sofa_low(g, x, z, len, axis, facing, opts = {})

/**
 * A sunken conversation pit over the box x0..x1, z0..z1 (inclusive; the pit air is y=1, the floor y=0 is the shell's).
 * The rim is a ring at y=1 of smooth_quartz_stairs facing inward, corners smooth_quartz_slab (bottom); an orange_carpet
 * seat cushion sits on each stair at y=2. A low spruce_slab table stands in the middle at y=1. { floor: true } lays
 * the smooth_quartz pit floor at y=0, overwriting the ground.
 */
export function conversation_pit(g, x0, z0, x1, z1, opts = {})

/**
 * A double bed: foot cell at (x,2,z), head cell one step along `facing` (the game's bed rule: the head is at the foot
 * plus facing). A spruce_planks headboard one high stands behind the head, and a nightstand (spruce_fence with a
 * birch_slab top at y=3) stands on each side of the head. `color` is the bed's dye: white, orange, cyan, yellow, light_blue.
 * Footprint: 3 cells along facing (foot, head, headboard) and 3 across at the head end; the foot side stays free.
 */
export function bed_double(g, x, z, facing, color = "white", opts = {})
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
 *   runParts(g, [["shell", shell.build], ["garden", garden.build]], { palette: "palette.json" })
 */
export function runParts(g, list, { palette, log = console.log, report = "parts-report.json" } = {})

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
are reported per part. The Grid keeps block-entity NBT (sign text, chest contents) and entities and
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

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
import { GRID, inPool } from "./vocab/base.mjs";
import { renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] ?? join(here, "build.nbt");
const SIZE = GRID;

const grid = new Grid(SIZE);
// the ground: dirt at y=0 over the lot except the kidney pool, which stays open (cells set here stay writable by every part)
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
// Shared constants for every part: palette ids (palette.json only), plan.md's site coordinates, and a seeded rng.
// Every export is one line; coordinates are absolute (plan.md), never offset.

// ---- palette: block ids, named by role (palette.json) -----------------------------------------------------------

// ---- palette: block ids, named by role (palette.json) -----------------------------------------------------------
export const STUCCO = "white_concrete"; // body walls, partitions, breeze-block screen

export const STRUCT = "dark_oak_log"; // posts, beams, beam ends, mullions (axis per use)

export const HEADER = "dark_oak_planks"; // header course under the eave (y=5)

export const FASCIA = "dark_oak_slab"; // dark eave line (type bottom or top to match its band)

export const BASE = "smooth_stone"; // base course, driveway, sidewalk, patio, pool deck

export const BASE_SLAB = "smooth_stone_slab"; // carport and roof deck slab (type bottom)

export const GLASS = "glass_pane"; // walls, clerestory, atrium ring, car windscreen

export const LEDGE = "mud_bricks"; // ledgestone feature wall and fireplace base

export const LEDGE_PACKED = "packed_mud"; // ~25% of the ledgestone for texture

export const LEDGE_CAP = "mud_brick_slab"; // ledgestone cap (type bottom)

export const FRONT_DOOR = "acacia_door"; // orange front door

export const UTILITY_DOOR = "dark_oak_door"; // kitchen utility door (open, facing west)

export const ACCENT = "orange_concrete"; // door surround and transom

export const CAR_BODY = "cyan_concrete"; // car lower body

export const CAR_TRIM = "iron_block"; // car bumpers, chrome, grille

export const TYRE = "black_concrete"; // car tyres, flue, fireplace

export const LAMP_FRONT = "yellow_concrete"; // car headlamps

export const LAMP_BACK = "red_concrete"; // car tail lamps

export const JOINT = "light_gray_concrete"; // driveway joint rows, terrazzo flecks

export const SAND = "sand"; // front yard, side strips, under cacti

export const GRAVEL = "gravel"; // gravel beds

export const GRASS = "grass_block"; // back lawn, atrium patch

export const DIRT = "dirt"; // bedding, atrium planting

export const WATER = "water"; // kidney pool water

export const POOL_LINER = "light_blue_concrete"; // kidney pool floor and liner

export const COPING = "smooth_quartz_slab"; // pool coping (type bottom); lounger foot; patio tabletop

export const QUARTZ = "smooth_quartz"; // pit floor, bath floors

export const QUARTZ_STAIRS = "smooth_quartz_stairs"; // pit benches, loungers, patio chairs

export const QUARTZ_SLAB = "quartz_slab"; // counters and furniture tops

export const QUARTZ_STAIRS_PLAIN = "quartz_stairs"; // WC and benches

export const JUNGLE_LOG = "jungle_log"; // palm trunks

export const JUNGLE_LEAVES = "jungle_leaves"; // palm crowns (persistent=true)

export const CACTUS = "cactus"; // cacti

export const POTTED_CACTUS = "potted_cactus"; // potted cacti on the wall tops and sideboards

export const LARGE_FERN = "large_fern"; // atrium ferns

export const DEAD_BUSH = "dead_bush"; // front-yard sand

export const SHORT_GRASS = "short_grass"; // lawn tufts

export const FENCE = "dark_oak_fence"; // mailbox post, lamp posts, patio table legs

export const SPRUCE_PLANKS = "spruce_planks"; // bedroom floors, ceiling, headboards

export const SPRUCE_SLAB = "spruce_slab"; // coffee and dining tops

export const SPRUCE_FENCE = "spruce_fence"; // table and nightstand legs

export const SPRUCE_TRAPDOOR = "spruce_trapdoor"; // wall panelling, wardrobe fronts (open=true)

export const SPRUCE_STAIRS = "spruce_stairs"; // panelling and trim

export const BIRCH_PLANKS = "birch_planks"; // furniture

export const BIRCH_SLAB = "birch_slab"; // sideboard tops, bench, stool seats

export const BIRCH_STAIRS = "birch_stairs"; // dining chairs

export const BIRCH_TRAPDOOR = "birch_trapdoor"; // cabinet fronts

export const IRON_TRAPDOOR = "iron_trapdoor"; // sofa backs, egg chair shell

export const SOFA_STAIRS = "smooth_red_sandstone_stairs"; // orange upholstery: sofas, egg chair seat

export const ORANGE_CARPET = "orange_carpet"; // pit cushions, rugs

export const WHITE_CARPET = "white_carpet"; // rugs

export const CYAN_CARPET = "cyan_carpet"; // rugs

export const YELLOW_CARPET = "yellow_carpet"; // rugs

export const LECTERN = "lectern"; // display stand

export const BOOKSHELF = "bookshelf"; // shelving

export const FLOWER_POT = "flower_pot"; // potted plants on tables

export const ITEM_FRAME = "item_frame"; // art, not a block: place via entities, never as a set() block

export const BARREL = "barrel"; // storage

export const SMOKER = "smoker"; // mailbox box, kitchen appliance

export const FURNACE = "furnace"; // kitchen appliance

export const CAULDRON = "cauldron"; // bath basin

export const ORANGE_BED = "orange_bed"; // master bedroom bed

export const CYAN_BED = "cyan_bed"; // bedroom 1 bed

export const YELLOW_BED = "yellow_bed"; // bedroom 2 bed

export const LIGHT_BLUE_BED = "light_blue_bed"; // spare-room bed colour

export const WHITE_BED = "white_bed"; // white bed option

export const CAMPFIRE = "campfire"; // lit fireplace firebox (lit=true)

export const SMOOTH_STONE_SLAB = "smooth_stone_slab"; // fireplace cap (type bottom)

export const LANTERN = "lantern"; // hanging or post lights (hanging=true or false)

export const SEA_LANTERN = "sea_lantern"; // bath light

export const END_ROD = "end_rod"; // floor lamp stand

export const DAYLIGHT_DETECTOR = "daylight_detector"; // light-sensor detail on the lights

// ---- site: plan.md coordinates (absolute) -------------------------------------------------------------------------
export const GRID = [34, 9, 34]; // grid size: x 0..33, y 0..8 (chimney top), z 0..33

export const GROUND_Y = 0; // ground top; bedding at y=-1 is below the grid and not stored

export const FLOOR_Y = 1; // house floor slab and base course

export const WALL_Y0 = 2; // lowest body row (standing height)

export const WALL_Y1 = 4; // highest body row

export const HEADER_Y = 5; // header course, beams and ceiling

export const ROOF_Y0 = 6; // roof band bottom

export const ROOF_Y1 = 7; // ridge

export const CHIMNEY_TOP = 8; // cap of the fireplace flue

export const BEAM_X = [10, 13, 16, 19, 22, 25, 28, 31]; // beam lines (every 3 cells, the structural rhythm)

export const BEAM_Z = [5, 28]; // beam run along z: from z=5 (front tail) to z=28 (back tail)

export const HOUSE = { x0: 10, x1: 31, z0: 8, z1: 25 }; // main shell footprint, perimeter walls on it

export const INTERIOR = { x0: 11, x1: 30, z0: 9, z1: 24 }; // inside the perimeter walls

export const ATRIUM = { x0: 17, x1: 21, z0: 12, z1: 17 }; // open courtyard in the glass ring (no roof, no floor slab)

export const ATRIUM_DOORS = [{ x: [19, 20], z: 11 }, { x: [19, 20], z: 18 }]; // 2w x 2h, y=2..3

export const ENTRY_NICHE = { x0: 18, x1: 20, y0: 2, y1: 4, z: 8 }; // air niche 3w x 3h x 1d

export const FRONT_DOOR_CELL = [19, 2, 9]; // acacia_door lower half; upper half at y=3

export const ENTRANCE_CELL = [19, 1, 7]; // the entrance cell at the head of the landing

export const FEATURE_WALL = { x0: 11, x1: 17, y0: 1, y1: 4, z: 7 }; // freestanding ledgestone leaf at z=7

export const CLERESTORY_X = [22, 23, 24, 26, 27, 29, 30]; // glass cells on the north clerestory strip (y=4, z=8)

export const CLERESTORY_MULLIONS = [25, 28]; // dark_oak_log mullions on the clerestory

export const SLIDERS = [{ x: [14, 15], z: 25 }, { x: [20, 21], z: 25 }, { x: [26, 27], z: 25 }]; // south sliders, 2w x 2h

export const UTILITY_DOOR_CELL = [10, 2, 10]; // west wall, kitchen to carport

export const DINING_WINDOW = { x: 10, z0: 14, z1: 16, y0: 3, y1: 4 }; // west window of the dining room

export const BED1_WINDOW = { x: 31, z0: 10, z1: 12, y0: 3, y1: 4 }; // east window of bedroom 1

export const CARPORT = { x0: 0, x1: 9, y0: 1, y1: 5, z0: 7, z1: 21 }; // carport deck on posts, open N and W

export const CARPORT_POST_Z = [8, 14, 20]; // posts at x=1 and beams at x=0..9

export const BREEZE_Z = 21; // breeze-block screen at the carport's south edge

export const CAR = { x0: 3, x1: 5, y0: 1, y1: 2, z0: 1, z1: 7 }; // reserved: car parked nose to the street

export const CHIMNEY = { x0: 20, x1: 21, y0: 1, y1: 8, z0: 21, z1: 22 }; // freestanding fireplace and flue

export const PIT = { x0: 13, x1: 17, y0: 0, y1: 4, z0: 20, z1: 23 }; // conversation pit (floor y=0)

export const PALMS = [[12, 3], [30, 4], [29, 31]]; // palm trunk cells (crown radius 2 at y=6..7)

export const CACTUS_BED = { x0: 23, x1: 29, y0: 1, y1: 3, z0: 2, z1: 4 }; // gravel bed for the cactus cluster

export const MAILBOX = [9, 1, 1]; // mailbox post cell at the head of the driveway

export const PATIO = { x0: 10, x1: 31, z0: 26, z1: 28 }; // back patio, under the south eave

export const POOL_DECK = { x0: 11, x1: 24, z0: 29, z1: 33 }; // smooth_stone deck around the pool

// kidney pool cells (plan.md RESERVED): ground and bedding left empty; keyed by z, [x0, x1] runs
export const POOL = { 29: [[14, 17], [20, 21]], 30: [[13, 22]], 31: [[13, 22]], 32: [[14, 21]] };

export const inPool = (x, z) => ...

// room inner air boxes [x0,y0,z0,x1,y1,z1] (plan.md ROOMS): the air each interior designer fills
export const ROOM_BOX = {
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

// ---- rng ----------------------------------------------------------------------------------------------------------
/** Seeded rng(seed): returns a function giving a float in [0,1) each call (mulberry32; same seed, same sequence). */
export function rng(seed)
```

### vocab/h1.mjs

```js
// VOCABULARY helpers, set 1 (plan.md): stucco_wall, slider_gap, roof_band, breeze_screen, palm, kidney_pool,
// hung_lantern, egg_chair, fireplace_stack, wardrobe. Each takes the grid first, then world coordinates (plan.md's own).
// Every helper writes only inside its own footprint and only into air, so an earlier part's cell is never touched.
// Each returns the number of blocks it placed; a refused cell is not counted.

// Blank white stucco wall: a rectangle in x and z, y0..y1 (plan: base y=1, body 2..4, header 5 come from other parts).
export function stucco_wall(g, x0, z0, x1, z1, y0 = 2, y1 = 4)

// A 2-wide sliding-door gap at x0..x0+1 on wall line z. The 2x2 opening (y0..y0+1) is never closed: only the glass
// lintel goes above it, and only if both gap cells are already air. Returns 0 if the gap is closed.
export function slider_gap(g, x0, z, y0 = 2)

// One horizontal band of the stepped slab roof over x=9..32 on rows zA..zB at height y. half = bottom | top.
// The atrium hole (x=17..21, z=12..17) and chimney hole (x=20..21, z=21..22) stay open.
export function roof_band(g, zA, zB, y, half)

// Breeze-block screen: white_concrete where (x+y) is even, air where it is odd, over x0..x1 and y0..y1 on plane z.
export function breeze_screen(g, x0, x1, y0, y1, z)

// Palm with its trunk on (x, z): jungle_log y=1..7 and a two-cell crown at y=6..7. Stands on whatever is at y=0.
export function palm(g, x, z)

// Kidney pool. rows = { z: [[x0, x1], ...] } (inclusive spans), the RESERVED cells in plan.md. Water at y=-1..0 over the
// pool, light_blue_concrete floor at y=-2 and liner walls at y=-1 on the rim, and a smooth_quartz_slab bottom coping on
// the rim at y=1. The coping sits ON the deck (y=1), because the deck at y=0 is already laid by another part.
// The y=-2..-1 cells are not stored (see put), so in the file the pool is shallow water at y=0 as build.mjs says.
export function kidney_pool(g, rows)

// Lantern hanging at (x, y, z). It needs a block above it at y+1; with air above it places nothing and returns 0.
export function hung_lantern(g, x, y, z)

// Egg chair, 3 wide x 2 deep x 2 high (y=2..3). facing is the seat stair's facing, i.e. the side of its full back:
// the back is the cell on that side of the seat and the sitter faces the other way. Shell: iron_trapdoor back at y=2..3
// and side plates at y=2 on the two cells beside the seat, each open and standing on its outer face.
export function egg_chair(g, x, z, facing)

// Wardrobe: spruce_planks 2 high (y=2..3) over len cells along axis x or z from (x, z). Open spruce_trapdoor fronts
// fill the row in front of it, on the side given by facing (the room side).
export function wardrobe(g, x, z, len, axis, facing)

// Freestanding fireplace stack on the 2x2 footprint x0..x0+1, z0..z0+1, y=1..8 (plan.md, part 3): mud_bricks hearth,
// campfires (lit) on the x0 column at y=2, mud_bricks on the x0+1 column and a 2x2 lintel at y=3, a 2x2 black_concrete
// flue at y=4..7, and a smooth_stone_slab cap at y=8.
export function fireplace_stack(g, x0, z0)
```

### vocab/h2.mjs

```js
// Vocabulary helpers (h2): one exported function per name in plan.md's VOCABULARY, placed through the build library.
// Every helper takes its position (and facing) as arguments. Each writes only its own footprint, only into air, and never
// below it (ground, sand and floors belong to earlier parts). `over` lists the block ids a helper may replace: joint_row
// over the driveway's smooth_stone, for example. fascia_ring only swaps the roof's own slabs.

/** dark_oak_planks over the rectangle x0..x1 x z0..z1 at height y, skipping the beam-line columns (x = 10, 13, ..., 31) so
 *  the roof's logs go there. */
export function header_course(g, x0, z0, x1, z1, y, { over = [] } = {})

/** Clerestory strip at height y, row z: glass in x0..x0+2, x0+4..x0+5 and x0+7..x0+8, dark_oak_log mullions (axis y) at
 *  x0+3 and x0+6. (x0 = 22 gives plan.md's strip: glass 22..24, 26..27, 29..30; mullions 25, 28.) */
export function clerestory(g, x0, z, y, { over = [] } = {})

/** Fascia: the roof's outermost ring and the edge of each hole (roof.holes: [{x0,z0,x1,z1}]) are dark_oak_slab, keeping the
 *  half of the roof slab already there. Only smooth_stone_slab cells in y0..y1 are swapped; nothing else is written. */
export function fascia_ring(g, { x0, x1, z0, z1, holes = [] }, y0, y1)

/** light_gray_concrete joint across the driveway: x0..x1 along row z at height y (0 = the paving). Pass
 *  { over: ["smooth_stone"] } to cut the joint into a driveway already laid. */
export function joint_row(g, x0, x1, z, y, { over = [] } = {})

/** Saguaro at (x, z): cactus trunk from y=1 to y=h; with h = 3, an arm on the west side (x-1) at y=2..3. The sand under it
 *  is the site's ground, so nothing is written at y=0. */
export function saguaro(g, x, z, h, { over = [] } = {})

/** Two-cell lounger on the patio at height y=1: the foot cell (x, z) is a smooth_quartz slab, the head is the next cell along
 *  axis ("x" or "z") and is a smooth_quartz stair facing the foot. */
export function lounger(g, x, z, axis, { over = [] } = {})

/** Terrazzo floor under a room box [x0,y0,z0,x1,y1,z1]: the floor is the layer under the room's air (y0 - 1). Smooth_stone
 *  with ~12% light_gray_concrete and ~6% white_concrete flecks, each cell from the seed. */
export function terrazzo_floor(g, [x0, y0, z0, x1, , z1], { seed = 1, over = [] } = {})

/** Sideboard of len cells from (x, z) along axis ("x" or "z"), fronts facing `facing`: closed birch trapdoors in the top half of
 *  y=2 as the cabinet fronts, a birch slab counter at y=3 on them. */
export function sideboard(g, x, z, len, axis, facing, { over = [] } = {})

/** Dining set for six, table cells x..x+1 by z..z+2: spruce fence legs at the four corners (y=2) and a spruce slab top (y=3);
 *  birch stair chairs, three on each long side (x-1 and x+2), facing the table; a hanging lantern at (x+1, 4, z+1) when a block
 *  is above it (a beam). Footprint x-1..x+2 by z..z+2, y=2..4. */
export function dining_set(g, x, z, { over = [] } = {})

/** Bath fit for a 2x3 room at (x, z), its back wall on the `back` side ("north" or "south"): a cauldron basin on the back row
 *  (y=2), a glass mirror above it (y=3..4), a quartz stair WC beside it facing into the room. The other two rows stay clear. */
export function bath_fit(g, x, z, back = "north", { over = [] } = {})
```

### vocab/h3.mjs

```js
// Helpers from plan.md VOCABULARY (batch 3): post, orange_entry, beam_line, stepping_pad, barrel_cactus, patio_table,
// panel_wall, coffee_table, galley_kitchen. Each takes the grid first, then its position (and facing where it has
// one), then opts. Rules every helper keeps:
//   - writes only its own footprint, and only into air; opts.over: true replaces what is there;
//   - never writes the cell under it (ground, sand and floor belong to earlier parts);
//   - returns { placed, skipped }: skipped lists the cells refused as not air, so the caller can see them.
// y on furniture is the standing height (the floor's top cell): interiors use y=2, the patio y=1.

/** A dark timber post: vertical dark_oak_log from y0 to y1 at (x, z). */
export function post(g, x, z, y0 = 2, y1 = 4, opts = {})

/**
 * Orange front door in its recess. (x, z) is the door cell on the door wall; the panels go on x-1 and x+1, the transom
 * over the door at y=4. The door is two cells (lower and upper half) and is written whole or not at all. The reveals
 * on the wall row in front (z-1) belong to the shell and are not written here.
 */
export function orange_entry(g, x, z, facing = "north", opts = {})

/** A structural beam: dark_oak_log with axis z along the row at x, from z0 to z1 at height y. */
export function beam_line(g, x, z0 = 5, z1 = 28, y = 5, opts = {})

/** A 3x1 smooth_stone pad at ground level (y=0 by default) from x to x+2 on row z. Pads in sand: pass over: true. */
export function stepping_pad(g, x, z, y = 0, opts = {})

/**
 * A two-high cactus on the sand at (x, z): cactus at y and y+1 (plan: y=1 and 2). The sand under it is not written;
 * the caller's ground part owns that cell.
 */
export function barrel_cactus(g, x, z, y = 1, opts = {})

/**
 * A patio table on one dark_oak_fence leg at (x, y, z), with a smooth_quartz_slab top at y+1 and a chair on each side
 * along axis ("x" or "z"). The chairs are smooth_quartz_stairs whose full back is on the far side, so the seat faces the
 * table. Footprint: three cells along axis, y and y+1.
 */
export function patio_table(g, x, z, axis = "x", y = 1, opts = {})

/**
 * Open spruce trapdoors standing in front of a wall, a vertical run from y0 to y1 at (x, z). facing is the side of the
 * wall they hang from (the hinge side); the halves alternate bottom and top down the run. Tile along the wall for a
 * panelled wall: the run is one column.
 */
export function panel_wall(g, x, z, y0 = 2, y1 = 4, facing = "north", opts = {})

/**
 * A low coffee table: one spruce_slab bottom half on the floor at (x, y, z). No flower pot: a pot needs a full top face
 * under it, and a half slab has none, so the pot is left out rather than floated.
 */
export function coffee_table(g, x, z, y = 2, opts = {})

/**
 * A galley kitchen that fills the 5x5 kitchen box: its back row (z) runs along the wall, its front is toward the room
 * (facing). Along x from the origin: an iron_block fridge (3 high), a white_concrete counter with a furnace (hob), a
 * cauldron (sink) and a smoker (oven) on top, then the counter's end cell. Spruce_trapdoor cupboards above the counter
 * at y+2. Breakfast bar on row z+3: spruce_fence legs at x+1 and x+3, a spruce_slab bottom top; birch_slab stools in
 * front of the legs on row z+4. The lanes at x and x+4 stay open between the bar and the room.
 * Footprint: x..x+4, y..y+2, z..z+4.
 */
export function galley_kitchen(g, x, z, facing = "south", y = 2, opts = {})
```

### vocab/h4.mjs

```js
// Mid-century house, vocabulary helpers h4 (plan.md VOCABULARY). Every helper takes the grid first, then world
// coordinates (and facing where it has one), and writes only into AIR: a cell that already holds a block (an earlier
// part's ground, floor or wall) is skipped, never replaced. Each returns the number of blocks it placed.

/** Glass in a line: glass_bay(g, x0, x1, z, y0, y1) along x at fixed z; { axis: "z" } reads x0..x1 as z at fixed x. */
export function glass_bay(g, a0, a1, fixed, y0, y1, { axis = "x" } = {})

/** Freestanding ledgestone leaf: mud_bricks with ~25% packed_mud (seeded), mud_brick_slab cap on the non-beam-line cells. */
export function ledgestone_wall(g, x0, x1, z = 7, y0 = 1, y1 = 4, seed = 25)

/** Carport at the west edge: origin (x0, z0) is the deck's north-west corner (plan: x0=0, z0=7). Deck 10 x 15. */
export function carport(g, x0 = 0, z0 = 7)

/** The two-tone 50s car: car_50s(g, x0, z0), x0..x0+2 and z0..z0+6, y=1..2. Nose north only. */
export function car_50s(g, x0 = 3, z0 = 1)

/** Low mailbox at the head of the drive: dark_oak_fence post at y=1, a smoker box at y=2 (facing east). */
export function mailbox(g, x = 9, z = 1)

/** Garden lamp: dark_oak_fence post at y=1..2, standing lantern at y=3. (x, z) on sand or lawn. */
export function garden_lamp(g, x, z)

/**
 * Low sofa, orange upholstery, at y=2 (floor y=1). len cells along axis ("x" or "z") from (x, z); the two end
 * cells are arms (stairs with their high side outward), the rest seat stairs with their high side at the back.
 * facing = the way the sitter looks; the backrest (open iron trapdoors) is the row directly behind the seat.
 */
export function sofa_low(g, x, z, len, axis, facing)

/**
 * Sunken conversation pit: the rim (x0..x1, z0..z1) is at y=1 with smooth_quartz_stairs facing inward and
 * quartz_slab corners; the inside is the pit floor at y=0 (smooth_quartz, air only). Inside the rim, orange carpet
 * cushions round a low spruce coffee table at the centre. Needs at least 3 cells each way.
 */
export function conversation_pit(g, x0, z0, x1, z1)

/**
 * Double bed, foot cell (x, z) at y=2, head one cell toward facing. A spruce_planks headboard stands behind the
 * head, and a birch_slab nightstand on a spruce_fence flanks the head on both sides. Footprint: 3 cells along
 * facing, 3 across, y=2..3. color: orange, cyan, yellow, light_blue or white.
 */
export function bed_double(g, x, z, facing, color = "orange")
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

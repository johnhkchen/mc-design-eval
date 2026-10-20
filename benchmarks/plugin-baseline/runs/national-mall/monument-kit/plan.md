# Washington Monument and grounds: plan of form

Exterior only, no rooms. Coordinates are module coordinates (place box origin = x 0, z 0; module y 0 = world y 5).
North = low z, east = high x. Monument centre = (x 50, z 50). "r" = horizontal distance from (50.0, 50.0).

## SITE

| Item | Value |
|---|---|
| Lot | x 0..99, z 0..99, y 0..81 (hard ceiling y 81; apex is y 76) |
| Ground | every column: stone y 1..(h-4), dirt (h-3)..(h-1), surface block at y = h (h = the height map digit). Outer 2 rows/columns on every edge stay exactly at the mapped h. |
| Knoll | mapped levels 2 (box edges), 3, 4, 5 (summit plateau, about x 27..73, z 25..75). Keep the map; the summit plateau is y 5 and the whole plaza sits on it. |
| Lawn | grass_block surface everywhere not paved. 1-block terrace edges in lawn stay as mapped (gentle grassy steps); on walks they are softened (see Walks). |
| Mall axis | east-west (along x), through z 49..51 |

### Masses

| Mass | x | y | z | Notes |
|---|---|---|---|---|
| Obelisk, lower shaft (pale) | 47..53 | 6..24 | 47..53 | solid 7x7, 19 courses |
| Obelisk, upper shaft 7-wide (cream) | 47..53 | 25..37 | 47..53 | solid 7x7 |
| Taper wash | perimeter ring of 7x7 | 38 | 47..53 | 24 stairs facing inward (corners as outer-corner stairs): a sloped half-step, not a ledge |
| Obelisk, upper shaft 5-wide (cream) | 48..52 | 38..68 | 48..52 | solid 5x5 |
| Pyramidion course 1 | ring of 5x5 = stairs facing inward; core 49..51 full | 69 | 48..52 | |
| Pyramidion course 2 | 49..51 full | 70 | 49..51 | |
| Pyramidion course 3 | ring of 3x3 = stairs facing inward; centre (50,50) full | 71 | 49..51 | |
| Pyramidion point | (50,50) full | 72 | 50 | |
| Pyramidion needle | (50,50) wall post | 73..74 | 50 | tapering post |
| Aluminium tip | (50,50) chain, axis y | 75..76 | 50 | dark tip; apex y 76 = 71 above plaza |
| Round plaza | all cells r < 10.5 (x 40..60, z 40..60) | surface y 5 | | paved, flush with the summit |
| Seating walls | ring cells 9.5 <= r < 10.5 | 6 | | 8 arcs; gaps 5 wide on the N, S, E, W axes and 3 wide on the 4 diagonals |
| Screening pavilion (S) | 54..58 | 6..8 | 49..52 | one-storey stone box against the obelisk's east face; walls y 6..7, flat roof y 8 |
| Flag ring walk | ring cells 15.5 <= r < 17.5 | surface y 5 | | paved band carrying the poles |
| Flagpoles (50) | at angle k*7.2 deg, k = 0..49: x = round(50 + 16 cos), z = round(50 + 16 sin) | pole 6..10, cap 11 | | flag hangs on the cap's outward face |
| Great ring walk | ring cells 31 <= r < 33 | follows h (mostly y 4) | | the curve around the knoll seen in the photo |
| Mall walks E and W | x 0..39 and x 61..99 | follow h | 49..51 | 3 wide, to the box edge (continue the Mall) |
| N and S walks | 49..51 | follow h | z 17..39 and 61..83 | 3 wide, plaza to great ring |
| Diagonal walks (4) | 2 wide, on the diagonals from r 17.5 out to 3 cells short of each corner | follow h | | NW, NE, SW, SE |
| Survey Lodge (L) | 83..85 | 3..5 | 98..99 | the in-plot part of the lodge (rest is beyond z 99); ground there is h 2 |
| Trees (12) | trunks at (8,10) (14,6) (6,18) (88,8) (92,16) (84,5) (7,84) (12,92) (6,76) (90,86) (86,93) (93,78) | trunk h+1..h+5, crown h+4..h+7 | | edges only; crowns radius 2, stay inside the box |

## ROOFS

| Roof | Form | Notes |
|---|---|---|
| Obelisk pyramidion | hand-built pyramid of stairs (courses above): 5 -> 3 -> 1 -> post -> tip over 8 courses | no roof preset; must be by hand, stairs all facing inward so each face reads as one slope |
| Screening pavilion | flat: y 8 smooth_stone_slab (bottom) field, perimeter polished_andesite full blocks as a thin parapet-coping at y 8 | by hand |
| Survey Lodge | low hip: y 5 stone_brick_stairs facing outward on its perimeter cells, ridge cell slab | by hand (partial lodge) |

## FACADES

**Obelisk (all four faces identical): dead plain, no trim, no plinth, no ornament.**

| Zone | y | Treatment |
|---|---|---|
| Lower third | 6..24 | smooth_quartz, every cell, flush |
| Colour line | between 24 and 25 | crisp: no overlap, no transition course |
| Upper shaft | 25..68 | horizontal courses alternating calcite (y odd) and smooth_sandstone (y even): averages to a warmer cream at distance, still a smooth flush face |
| Taper wash | 38 | smooth_sandstone_stairs on the 7x7 perimeter, facing in |
| Observation windows | 66 | two per face, tinted_glass flush in the face (positions in OPENINGS) |
| Aircraft warning lights | 67 | red_stained_glass in the centre cell of each face; glowstone in the core cell (50,67,50) behind |
| Pyramidion | 69..74 | smooth_sandstone_stairs / smooth_sandstone, sandstone_wall needle; chain tip 75..76 |

**Plaza:** field smooth_stone; banding rings of polished_andesite at 6.5 <= r < 7.5 and 9.5 <= r < 10.5 under the seating walls; the cells touching the obelisk (one ring around the 7x7) polished_andesite.
Seating walls: polished_andesite_slab (bottom) on y 6 in the 8 arcs; a lantern standing on the full block at each arc end (use a polished_andesite full block for each arc's two end cells, lantern on y 7).

**Screening pavilion:** walls polished_diorite y 6..7, flush, one material; east face is the entrance; parapet coping polished_andesite at y 8. Glass band on N and S faces.

**Flagpoles:** end_rod (facing up) y 6..10; cap white_concrete at y 11; on the cap's outward face (radial direction rounded to N/E/S/W) a white_wall_banner with patterns: red stripe_small, then blue square_top_left (stars-and-stripes read). At 2-cell spacing the ring reads as a crisp white fence of poles crowned by a red-white-blue band.

**Lodge:** stone_bricks walls y 3..4 throughout, hip of stone_brick_stairs at y 5.

## MATERIALS

| Role | Block |
|---|---|
| Obelisk lower third | smooth_quartz |
| Obelisk upper courses | calcite + smooth_sandstone (alternating courses) |
| Wash and pyramidion slopes | smooth_sandstone_stairs, smooth_sandstone (core), sandstone_wall (needle) |
| Tip | chain (axis y) |
| Observation windows | tinted_glass |
| Warning lights | red_stained_glass + glowstone behind |
| Plaza field | smooth_stone |
| Plaza bands, wall coping, obelisk surround | polished_andesite |
| Seating walls | polished_andesite_slab |
| Pavilion walls | polished_diorite; roof smooth_stone_slab; glass glass_pane |
| Walks | white_concrete_powder (on solid ground); steps smooth_stone_slab |
| Flagpoles | end_rod; cap white_concrete; flag white_wall_banner (red stripe_small, blue square_top_left) |
| Lamps | polished_andesite_wall post + lantern |
| Floodlights / in-ground lights | ochre_froglight flush in paving and lawn |
| Lawn | grass_block over dirt over stone |
| Trees | oak_log (axis y), oak_leaves persistent (dark green crowns) |
| Lodge | stone_bricks, stone_brick_stairs, stone_brick_slab |

All checked with `$MCD blocks --check` (none unknown, all in 1.21.1; no pale oak; chain not iron_chain).

## OPENINGS

| Opening | Cells |
|---|---|
| Obelisk N windows | (49,66,48), (51,66,48) tinted_glass |
| Obelisk S windows | (49,66,52), (51,66,52) |
| Obelisk W windows | (48,66,49), (48,66,51) |
| Obelisk E windows | (52,66,49), (52,66,51) |
| Warning lights | (50,67,48), (50,67,52), (48,67,50), (52,67,50) red_stained_glass |
| Obelisk door | none visible (the pavilion covers the east entrance) |
| Pavilion entrance | east face x 58, z 50..51, y 6..7: open 2 wide, 2 high |
| Pavilion glass bands | north face z 49 and south face z 52, x 55..57, y 7: glass_pane |
| Pavilion interior | air x 55..57, z 50..51, y 6..7; hanging lantern under the roof at (56,7,50) |
| Lodge window | (83,4,99) glass_pane slit on its west face |

## RESERVED (shell leaves these as air / surface for later parts)

| Cells | For |
|---|---|
| Flagpole cells (50 positions above) y 6..11 and the banner cell outward of each cap at y 11 | flag ring |
| Floodlights: (49..51, 5, 45), (49..51, 5, 55), (45, 5, 49..51), (54, 5, 47), (54, 5, 53) | ochre_froglight set in place of the plaza paving |
| Lawn lights: every cell with x mod 12 = 6 and z mod 12 = 6, unless paved, under a tree, or within 2 of an edge | ochre_froglight flush as the surface block |
| Lamp posts: along every walk, one cell beside the walk every 9 cells (both sides alternate), and at each walk's ends; y h+1 post, h+2 lantern | low lamps |
| Seating-wall arc ends, y 7 | standing lanterns |
| Tree trunk and crown cells | trees |

## FLOORS

| Level | y |
|---|---|
| Plaza, flag ring walk, obelisk base | 5 (obelisk starts y 6) |
| Pavilion floor | 5 (smooth_stone), clear height y 6..7, roof y 8 |
| Great ring walk | follows h (mostly 4) |
| Lodge floor | 2, walls y 3..4, roof y 5 |
| Walk steps | where a walk drops from h to h-1, the upper cell's edge stays and the first lower cell is a smooth_stone_slab (bottom) on top of it at y h: a half step, never a full block |

Obelisk is solid masonry (no interior). Nothing exceeds y 76; nothing leaves x 0..99, z 0..99.

---
# DESIGNER SECTIONS

## PALETTE (block ids exact; checked with `mcd blocks --check`)
- Obelisk: smooth_quartz (lower), calcite + smooth_sandstone (upper), smooth_sandstone_stairs, sandstone_wall (needle), tinted_glass, red_stained_glass, glowstone.
- Plaza: smooth_stone, polished_andesite, polished_andesite_slab, polished_andesite_stairs; pavilion polished_diorite, smooth_stone_slab, glass_pane.
- Walks: white_concrete_powder, smooth_stone_slab (bottom) half steps.
- Flags: end_rod (facing up), white_concrete, white_wall_banner (patterns: red stripe_small, blue square_top_left).
- Lamps: **andesite_wall** (polished_andesite_wall does NOT exist; use andesite_wall) + lantern hanging=false. Lights: ochre_froglight, lantern.
- Trees: oak_log axis y, oak_leaves persistent=true. Lodge: stone_bricks, stone_brick_stairs, stone_brick_slab.
- Ground: grass_block, dirt, stone.
- **chain**: the tool (v26.3) knows only iron_chain, but the server is 1.21.1 where the block is `chain`. Place `chain` in the final nbt; if the checker rejects it, place iron_chain and swap at delivery (never ship iron_chain).

## VOCABULARY
- groundColumn(g,x,z,h): stone 1..h-4, dirt h-3..h-1, grass_block h.
- shaftCourse(g,y,x0,z0,x1,z1,mat): fill solid rect; mat = smooth_quartz y<=24; calcite if y odd else smooth_sandstone for y>=25.
- taperRing(g,y=38): 24 smooth_sandstone_stairs on the 7x7 perimeter, facing inward (N side facing south, etc.), corners outer-corner shape; interior 5x5 solid smooth_sandstone.
- obsWindows(g): tinted_glass at the 8 window cells y66, red_stained_glass at 4 face centres y67, glowstone (50,67,50).
- pyramidCourse(g): per plan Masses rows y69-76; ring stairs half bottom, facing = toward centre.
- plazaDisc(g,r0,r1,block): set y5 cells with r in [r0,r1) (r = hypot(x-50,z-50)).
- seatingArc(g): y6 slab on ring cells in arc, except the gap cells (angle within gap half-widths 2.5/1.5 cells of axis/diagonal); end cells full polished_andesite with lantern y7.
- pavilionBox(g): as elements #12; entrance cells air.
- flagPole(g,k): x=round(50+16cos(7.2k°)), z=round(50+16sin); end_rod y6..10, cap y11, banner at cap's outward neighbour, wall facing outward, y11, patterns [stripe_small red, square_top_left blue]. Skip any cell colliding with a path decor; poles on ring walk.
- floodlight(g,x,z): replace the surface block with ochre_froglight.
- walkCell(g,x,z): surface = white_concrete_powder, y=h, only where solid below; at h-1 neighbour drops use smooth_stone_slab bottom on upper cell.
- lampPost(g,x,z): andesite_wall y h+1, lantern y h+2.
- oakTree(g,x,z,h): trunk h+1..h+5, irregular leaf crown radius 2 y h+4..h+7 persistent.
- lodgeHip(g): walls, stair hip, ridge slab.

## ROOMS
None. The build is exterior only (obelisk solid, pavilion is a 3x2 glazed kiosk with no designed interior beyond its lantern). Rooms: [].

## PARTS
1. Ground and knoll (parts/ground.mjs): all columns from the height map; outer 2 rings exact.
2. Obelisk (parts/obelisk.mjs): elements 2-9. The dead-straight, plain shaft; check colour line at y24/25.
3. Plaza and pavilion (parts/plaza.mjs): elements 10-12.
4. Flag ring and lighting (parts/flags.mjs): elements 13-15, 21 at the base.
5. Walks, lamps, lawn lights, trees (parts/walks-trees.mjs): 16-19.
6. Survey Lodge (parts/lodge.mjs): element 20, and a final no-spawn check.

## Checklist
- [x] ground  - [ ] obelisk  - [ ] plaza+pavilion  - [ ] flags  - [ ] walks/trees  - [ ] lodge

## Notes for workers
- The obelisk must be smooth: no buttresses, no ornament. Staying within y<=76, x/z 0..99. Never write where another part owns (flags on ring walk need walks part to leave pole cells free: walks skip cells of poles).
- Build order matters: ground first, then everything on top; walks only on solid ground.
- Light: froglights flush; no dark spawnable lawn (lawn lights every 12 + lamps).
- No signs, no villagers.

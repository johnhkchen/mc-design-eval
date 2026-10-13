# Plan: Victorian high-street shop row (2 shops, 2 floors of flats, stair bay)

Note on orientation: the fixed redstone sockets face SOUTH (+z), so in this plan **the street is on the south
side** (z 19 and up) and the back yard is on the north (z 1 and down). x runs along the street. Every
coordinate is world. The sockets come from sockets.json and are never moved.

## SITE

| item | x | y | z | note |
|---|---|---|---|---|
| lot | 0..29 | 0..34 | -8..28 | |
| ground fill (dirt, stone below y 3) | 0..29 | 0..5 | -8..28 | everything outside the socket boxes and pits |
| road (carriageway) | 0..29 | 5 | 23..28 | surface course; people on it stand at y 6 |
| kerb | 0..29 | 6 | 22 | 1 high, the step up to the pavement |
| pavement | 0..29 | 6 | 19..21 | surface block at y 6, people stand at y 7 = counter-top level (counters at y 6) |
| back yard paving | 3..26 | 6 | -5..1 | at shop-floor level, so the keeper doors are level |
| rear lane | 0..29 | 5 | -8..-6 | |
| **main body (shops + flats)** | 3..21 | 6..23 | 2..19 | outer walls x 3 (west end), x 21 (east, shared with the stair bay), z 2 (rear), z 19 (front) |
| **stair bay (flats' entrance)** | 21..26 | 6..23 | 2..19 | outer walls x 21, x 26, z 2, z 19; interior x 22..25 |
| tenant unit 1 (sockets A1+A2) | 4..12 | 6..12 | 3..18 | 8 frontage, wall lines x 4, 8, 12 |
| tenant unit 2 (sockets A3+A4) | 12..20 | 6..12 | 3..18 | 8 frontage, wall lines x 12, 16, 20 |
| oriel bay over unit 1 | 6..10 | 13..23 | 20 | 1 proud of the front, through both flat storeys |
| oriel bay over unit 2 | 14..18 | 13..23 | 20 | same |
| end pilasters | 3 and 21 | 6..12 | 19..20 | stone, full shop storey, 1 proud |
| front cornice (shop storey) | 3..26 | 13 | 20 | carries the oriels |
| main cornice (eaves) | 3..26 | 23 | 20 | and z 1 on the rear |
| chimney W (external breast) | 1..2 | 6..33 | 9..10 | own footing on the ground, against the west end wall |
| chimney C (rear breast) | 12..13 | 6..33 | 0..1 | own footing in the yard, on the tenant party line |
| chimney E (external breast) | 27..28 | 6..33 | 9..10 | own footing, against the east wall of the stair bay |
| yard walls | 3 and 26 (x), z -5..1; and x 3..26 at z -5 | 7..8 | | brick, coping slab y 9 (not a block over z -5 gates) |
| yard gates | 7 and 15 | 7..8 | -5 | fence gates, one per tenant yard; a dividing wall x 12, z -5..1 |

Socket envelopes (fixed, from sockets.json; nothing of the building inside them):
A1 box 5,2,6..7,12,18 · A2 box 9,2,10..11,11,18 · A3 box 13,2,6..15,12,18 · A4 box 17,2,10..19,11,18.
Wall lines (glass, the machines') x 4, 8, 12, 16 at z 6..18 y 2..12 and x 20 at z 10..18 y 2..11.
Keep clear in front: x 4..20, y 7..9, z 19..20 (nothing at all there).

## ROOFS

| roof | form | where | height |
|---|---|---|---|
| main roof | `$MCD roof` preset **townhouse** (row house): dark-slate mansard, stone dentil cornice, iron-bar crest | footprint x 3..26, z 2..19 as ONE rect (shops and stair bay share it, a continuous row roof) | roof course `y` = 24 (walls end with the cornice at y 23); steep lower slope y 24..~28, shallow upper deck to ~y 30-31; overhang 1 (to z 20 and z 1) |
| dormers | from the preset, street face; centre them on the oriels | x 7..9 and x 15..17 on the south slope; one over the stair bay x 23..24 | in the lower slope |
| oriel caps | built BY HAND by the oriel part (not the roof tool) | each oriel x 6..10 / 14..18 at z 20, y 23 | a row of `smooth_sandstone_slab` (top) at y 23, flush with the eaves cornice |
| roof.json keep | the three chimney stacks | x 1..2 z 9..10; x 12..13 z 0..1; x 27..28 z 9..10, y 24..33 | |
| front: `south`, ridgeAxis `x` | | | |

The roof tool's contrast rule must keep dark slate over red brick (tone distance is large). Chimneys pass
through the eaves overhang; the roof meets them on every side.

## FACADES

### South (street) front, z 19 — bottom to top
| zone | y | what | material / depth |
|---|---|---|---|
| shop storey, open fronts | 7..9 | over each counter: OPEN, no glass, no frame, x 4..20 continuous | air (redstone engineer's) |
| end pilasters | 6..12 | x 3 and x 21, z 19 and proud at z 20; plinth course y 6 | trim; plinth = base |
| fascia boards | 10..12 | tenant 1 x 5..11, tenant 2 x 13..19, at z 19 (closes the A1..A4 fascia cells) | **fascia** block, flush; shop names as banner letters (3-row band, `material: null`) |
| consoles | 10..12 | x 4, 12, 20 at z 19, and a console head at z 20 y 11..12 (upside-down stair under a slab) | trim, 1 proud |
| hanging signs | 10 | tenant 1 at x 4, z 21; tenant 2 at x 20, z 21; bracket arm `dark_oak_fence` at y 11 z 20..21 from the console | accent wood; above the keep-clear |
| shop cornice | 13 | x 3..26, z 20: `smooth_sandstone_stairs` upside-down facing north (into the wall) | trim, 1 proud |
| first floor | 14..17 | brick wall z 19; windows (see OPENINGS); sill slab y 14 at z 20 under each flat window | walls; sills trim 1 proud |
| string course | 18 | x 3..26 z 19, flush band (sills of the second floor) | trim, flush |
| second floor | 19..22 | brick wall; windows; lintel y 22 over each window | walls; lintels trim flush |
| eaves cornice | 23 | x 3..26, z 19 band + z 20 upside-down stairs (the roof preset adds dentils) | trim, 1 proud |
| quoins | 13..22 | at x 3 and x 26, z 19 and on the end faces: paired, 2 blocks tall every other pair (y 13-14, 17-18, 21-22) | trim, flush |
| piers | 13..22 | brick piers stand on the wall lines x 4, 8, 12, 16, 20 (no change of material, they are the wall) | walls |

Oriels (2): x 6..10 / 14..18 at z 20. y 13 = shop cornice under it (its corbel); y 14 apron, y 18 panel, y 22
head: trim; corner posts x 6 & 10 (14 & 18) y 14..22: trim; glass x 7..9 (15..17) at y 15..17 and y 19..21;
cap y 23 slabs. Behind each oriel the front wall z 19 is OPEN at x 7..9 (15..17) y 15..17 and y 19..21 so the
oriel joins the front room.

Stair bay front x 22..25: plinth y 6; door with stone surround (x 22 and x 25 y 7..9 trim), fanlight y 9, a
hood of `smooth_sandstone_slab` (bottom) at y 10 z 20 x 22..25 on two console stairs; fascia band continues as
brick y 10..12 with a small `signboard` "FLATS" (wall) at x 23..24 y 11; above, the stair windows.

### North (rear), z 2: plain brick, plinth y 6, keeper doors, segmental lintels of trim over every opening,
eaves cornice z 1 y 23. Chimney C stands proud of it.
### West end, x 3: blank brick party wall, quoins at both corners, chimney W breast proud (x 1..2).
### East end, x 26: blank brick, quoins, chimney E breast proud (x 27..28).

Chimneys (all three): 2x2 brick (walls) from y 6 to y 32, a band course of trim at y 30, a cap ring of
`smooth_sandstone_slab` stepping out 1 at y 33; in W and E a `hay_block` at y 32 and a lit signal `campfire` at
y 33 in one flue cell, so smoke rises from the mouth.

## MATERIALS

| role | block | why |
|---|---|---|
| walls (60%) | `bricks` | red Victorian brick, reads warm red at distance |
| trim (25%) | `smooth_sandstone`, `smooth_sandstone_stairs`, `smooth_sandstone_slab`, `cut_sandstone` (quoins, keystones) | pale Bath-stone dressings, strong contrast with brick |
| fascia (shops) | `dark_prismarine` | deep green-teal painted board; banner letters in white |
| base / plinth | `polished_andesite` | grey plinth course, kerb |
| roof | `deepslate_tiles` (preset dark-slate palette), crest `iron_bars` | dark slate over red |
| glass | `glass_pane` | |
| joinery / signs | `dark_oak` (doors, fence brackets, `dark_oak_hanging_sign`, window boxes) | |
| pavement | `smooth_stone` | |
| road | `andesite` with `polished_andesite` kerb | |
| yard | `cobblestone` paving, `bricks` walls | |
| ground | `grass_block` at lot edges, `dirt` fill, `stone` below y 3 | |

All checked with `$MCD blocks --check` (all known). Reskin = swap the four roles walls/trim/fascia/roof.

## OPENINGS

| opening | x | y | z | size |
|---|---|---|---|---|
| shop fronts (open counters) | 4..20 | 7..9 | 19 | continuous, the engineer's |
| flats' street door (double) | 23..24 | 7..8 | 19 | 2 wide x 2, `dark_oak_door` facing south; fanlight glass y 9 |
| keeper door tenant 1 | 7 | 7..8 | 2 | 1x2, into aisle z 3..4 |
| keeper door tenant 2 | 15 | 7..8 | 2 | 1x2 |
| stair-bay rear door | 23 | 7..8 | 2 | 1x2 (bins to the yard) |
| first-floor flat windows | 5, 11, 13, 19 | 15..17 | 19 | 1 wide x 3 (tall sash) |
| first-floor oriel glass | 7..9, 15..17 | 15..17 | 20 | 3 x 3 |
| second-floor flat windows | 5, 11, 13, 19 | 19..21 | 19 | 1 x 3 |
| second-floor oriel glass | 7..9, 15..17 | 19..21 | 20 | 3 x 3 |
| stair-bay front windows | 23..24 | 15..17 and 19..21 | 19 | 2 x 3 |
| rear windows (both floors) | 6, 10, 14, 18, 23..24 | 15..16 and 20..21 | 2 | 1 x 2 (2 x 2 at the stair bay) |
| corridor doors through x 21 | 21 | 14..15 and 19..20 | 3 | 1x2, stair hall to flats corridor |
| flat doors off the corridor | 8 and 16 | 14..15 and 19..20 | 5 | 1x2, from corridor z 3..4 into each flat |

## RESERVED

| cells | for |
|---|---|
| socket boxes, pits y 1, back walls (z 5 deep, z 9 shallow), wall lines | runParts / redstone fit-out only |
| keep-clear x 4..20 y 7..9 z 19..20 | nothing |
| keeper aisles: x 4..11 z 3..4 and x 9..11 z 5..8 (tenant 1); x 13..20 z 3..4 and x 17..19 z 5..8 (tenant 2), y 7..12 | clear service route, lit; a brick partition at x 12 z 3..5 y 6..12 between tenants |
| stair flight 1 | x 22..23, steps y 7..12 at z 15..10 (rising north), well open at y 13 over x 22..23 z 10..15 |
| stair flight 2 | x 22..23, steps y 14..17 at z 15..12 (rising north, from the y 13 floor at z 16), well open at y 18 over x 22..23 z 12..16 |
| chimney stacks | x 1..2 z 9..10; x 12..13 z 0..1; x 27..28 z 9..10, y 6..33 (roof keep) |
| oriel cells | x 6..10 / 14..18 at z 20 y 14..23 (oriel part) and the open wall behind them |
| hanging signs + brackets | x 4 and x 20, y 10..11, z 20..21 |
| fascia cells | x 5..11 and 13..19 y 10..12 z 19 (fascia part; the shell leaves them) |

## FLOORS

| storey | floor block y | interior y | volume |
|---|---|---|---|
| shop storey | 6 | 7..12 | sockets x 5..19 z 6..18; keeper aisles as above; stair bay lobby x 22..25 z 15..18 + store x 24..25 z 3..14 |
| first floor (flats) | 13 | 14..17 | corridor x 4..20 z 3..4; flat 1W x 4..11 z 5..18; flat 1E x 13..20 z 5..18 (party wall x 12); stair landing x 22..25 z 3..9 + x 24..25 z 10..18 + x 22..23 z 16..18 |
| second floor (flats) | 18 | 19..22 | same plan: corridor z 3..4; flats 2W, 2E; landing x 22..25 z 3..11 + x 24..25 z 12..18 |
| loft (in the mansard) | 23 | 24..~29 | unfloored attic, not a room |

Each flat: front room (with the oriel) z 12..18, back bedroom + kitchen z 5..11, a partition at z 11.

---
# DESIGNER SECTIONS

## PALETTE
Roles (reskinnable; each part references the ROLE, never a literal block):
- WALLS `bricks`; `brick_stairs`, `brick_slab`, `brick_wall` (yard coping, rails)
- TRIM `smooth_sandstone`, `smooth_sandstone_stairs`, `smooth_sandstone_slab`, `cut_sandstone` (quoins/keystones)
- FASCIA `dark_prismarine` (+ `dark_prismarine_slab` for edge); letters via banners `white_banner`
- BASE `polished_andesite`, `polished_andesite_stairs`, `polished_andesite_slab`
- ROOF `deepslate_tiles`, `deepslate_tile_stairs`, `deepslate_tile_slab`, `deepslate_tile_wall`; crest `iron_bars`
- GLASS `glass_pane`; JOINERY `dark_oak_door`, `dark_oak_fence`, `dark_oak_fence_gate`, `dark_oak_trapdoor`, `dark_oak_hanging_sign`, `dark_oak_wall_sign`, `dark_oak_planks`
- FLOORS `oak_planks` (flats), `smooth_stone` (pavement), stairs `oak_stairs`
- GROUND `grass_block`, `dirt`, `stone`, `andesite`, `cobblestone`
- FUNCTIONAL `hay_block`, `campfire` (lit true, signal_fire true), `lantern`, `ladder`
All ids verified with `$MCD blocks --check` (none unknown).

## VOCABULARY
- `brickWall(box)`: bricks fill; plinth course y 6 `polished_andesite`; no write into reserved cells.
- `quoins(x, zFaces)`: at x 3 and 26, alternating pairs 2 tall (y 13-14, 17-18, 21-22) of `cut_sandstone`, flush, on the front and end face.
- `cornice(y, z)`: row of `smooth_sandstone_stairs` half top, facing north (into wall) at z 20; flush `smooth_sandstone` band at z 19.
- `pilaster(x)`: x, z 19..20, y 7..12 `smooth_sandstone`, y 6 `polished_andesite`; leaves keep-clear (x 3 and 21 only, outside x 4..20).
- `console(x)`: x, z 19 y 10..12 trim; head z 20 y 11 `smooth_sandstone_stairs` half top facing north, y 12 slab top.
- `fascia(x0,x1,name)`: `dark_prismarine` fill x0..x1 y 10..12 z 19; then `plaque(g,name,{at,face:"south",width,height:3,material:null})`.
- `hangingSign(x,name)`: `dark_oak_fence` at (x,11,20),(x,11,21); `dark_oak_hanging_sign` at (x,10,21) attached true, text name.
- `shopfront(x0,x1,name)`: pilaster/console/fascia combined, leaves x..y 7..9 z 19..20 AIR.
- `sashWindow(x,y0,z)`: air x y0..y0+2; `glass_pane` in the 3; sill `smooth_sandstone_slab` bottom below at z 20 (y 14 only for floor 1); lintel trim above flush.
- `oriel(x0,x1)`: as plan; corner posts `smooth_sandstone` x0,x1 y 14..22; glass_pane x0+1..x1-1 y 15..17, 19..21 at z 20; apron y 14 and panel y 18 `smooth_sandstone`; head y 22; cap slabs top y 23; side glass panes at z 19.. not needed (wall open behind).
- `streetDoor()`: `dark_oak_door` lower+upper at x 23 and 24, facing south, hinges mirrored (left/right); fanlight pane y 9; trim surround; hood slab bottom y 10 z 20 x 22..25 on stairs at x 22 and 25 y 10 (half top? no: stairs facing east/west bottom) ; `signboard(g,"FLATS",{at:[23,11,19],face:"south",mode:"wall",width:2})`.
- `flight(x,y0,y1,z0,dir)`: `oak_stairs` facing north (up direction), half bottom, one per y; 2 clear air above each; rail `dark_oak_fence` on open side.
- `chimney(x,z,fire)`: bricks 2x2 y 6..32 with 1x1 air flue in one cell below y 31; trim band y 30; cap ring `smooth_sandstone_slab` y 33 around 4x4 (x-1..x+2) leaving the flue cell; if fire: `hay_block` y 32 in flue cell and `campfire` y 33 lit true, signal_fire true.
- `yardWall(x0,z0,x1,z1)`: bricks y 7..8, slab top on y 9 coping; gates `dark_oak_fence_gate` at x 7, 15 z -5.
- `lampPost(x,z)`: `dark_oak_fence` y 7..9, `lantern` hanging false at y 10.
- `streetSurface()`: andesite road y 5 z 23..28; kerb polished_andesite y 6 z 22; smooth_stone pavement y 6 z 19..21.

## ROOMS
Shop interiors belong to the sockets (not furnished). Rooms inside the architect's volumes:
- Keeper aisle 1: [4,7,3,11,12,4] + [9,7,5,11,12,8]; lit, plain brick; door x 7 z 2.
- Keeper aisle 2: [13,7,3,20,12,4] + [17,7,5,19,12,8]; door x 15 z 2.
- Stair lobby: [22,7,15,25,12,18], the flats' entrance; flight 1 begins here.
- Bin store: [24,7,3,25,12,14]; rear door x 23.
- Corridor floor 1: [4,14,3,20,17,4]; door at x 21 z 3 from stair hall.
- Corridor floor 2: [4,19,3,20,22,4].
- Flats 1W/1E/2W/2E front room (oriel, sitting) and back room (bedroom + kitchen), partition at z 11:
  1W front [4,14,12,11,17,18] back [4,14,5,11,17,10]; 1E front [13,14,12,20,17,18] back [13,14,5,20,17,10]; 2W front [4,19,12,11,22,18] back [4,19,5,11,22,10]; 2E front [13,19,12,20,22,18] back [13,19,5,20,22,10].
- Landing 1: [22,14,3,25,17,9] (+ x 24..25 z 10..18); Landing 2: [22,19,3,25,22,11].
Flat doors at x 8 and 16 z 5 (y 14..15, 19..20) from the corridor; the front/back rooms connect through a 1x2 opening at x 7 (or 15) z 11.

## PARTS
1. shell (parts/shell.mjs) – site/street ground, brickWall for all four walls with plinth, floors at y 13 and 18 (y 6 slabs under shops left to runParts), partition walls, stair flights, quoins, all OPENINGS as air, leave keep-clear, sockets, oriel-back openings, fascia cells.
2. roof (roof.json + parts/roof.mjs) – townhouse preset, footprint, dormers, keep boxes, `--dry-run` clean.
3. shopfronts (parts/shopfronts.mjs) – shopfront x2, pilasters, consoles, fascia + plaque names, hangingSign x2, shop cornice, eaves cornice.
4. windows (parts/windows.mjs) – sashWindow all, oriel x2 with caps, streetDoor + FLATS, rear windows and doors.
5. chimneys (parts/chimneys.mjs) – chimney W, C, E with campfires.
6. yard (parts/yard.mjs) – yard paving/walls/gates, lampPost, street, planting, rear lantern.

## Notes for workers
- Street is SOUTH; build nothing in x 4..20 y 7..9 z 19..20 or in socket boxes. Run `$MCD sockets check` and `$MCD check`.
- Use roles, not literal blocks, so reskin works. Fill whole wall then carve openings; never fill fascia cells in the shell.
- Chimneys sit on their own footing from y 6; roof keeps their cells.
- shell: leaves x3/x21 z19 y6..12 (pilasters), y23 z19 band and y18 string course are built by shell; stair flights NOT in shell (stairs part); shell lays y6 floor only outside socket boxes.

# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
```

### elements.md

```markdown
# Required elements (Victorian shop row)

Coordinates from plan.md. Street is SOUTH (z 19+). "walls"=bricks, "trim"=smooth_sandstone family, "fascia"=dark_prismarine, "base"=polished_andesite, "roof"=deepslate_tiles.

- [ ] **Two tenant shop units (redstone sockets)**: x 4..12 and 12..20, y 7..12. Shell leaves socket boxes, wall lines and keep-clear (x 4..20 y 7..9 z 19..20) empty; runParts lays the fit-out. Part: shell (leaves), shopfronts. Vocab: `shopfront`. Run `$MCD sockets check`.
- [ ] **Shopfront fascia per shop**: `dark_prismarine` board x 5..11 and 13..19, y 10..12, z 19 flush. Shop names as `plaque(g,"NAME",{material:null})` banner letters (white on teal), 3-row band. Part: shopfronts. Vocab: `fascia`.
- [ ] **Consoles / pilasters framing each shop**: smooth_sandstone at x 4, 12, 20 y 10..12 z 19 plus console head z 20 y 11..12 (upside-down smooth_sandstone_stairs under a smooth_sandstone_slab top); end pilasters x 3 and 21, y 6..12, z 19..20, polished_andesite plinth y 6. Part: shopfronts. Vocab: `console`, `pilaster`.
- [ ] **Hanging sign per shop**: x 4 and x 20, z 21, y 10: `dark_oak_fence` arm at y 11 z 20..21, `dark_oak_hanging_sign` (attached true, text = shop name) at y 10 z 21. Part: shopfronts. Vocab: `hangingSign`.
- [ ] **Shop cornice**: y 13 x 3..26 z 20, smooth_sandstone_stairs upside-down facing north. Part: shopfronts. Vocab: `cornice`.
- [ ] **Two storeys of flats**: brick walls y 13..22, floors at y 13 and 18 (planks floors in rooms), corridor and 4 flats (1W,1E,2W,2E). Part: shell. Vocab: `brickWall`.
- [ ] **Flat windows**: 1x3 sash at x 5,11,13,19, y 15..17 and 19..21, z 19: glass_pane, sill slab y 14 / string course, trim lintel y 22. Part: windows. Vocab: `sashWindow`.
- [ ] **Two oriel bays**: x 6..10 and 14..18, z 20, y 13..23: corbel y 13 (cornice), apron y 14, panel y 18, head y 22, corner posts, glass_pane x 7..9 at y 15..17 and 19..21, slab cap y 23; wall behind OPEN. Part: windows. Vocab: `oriel`.
- [ ] **Flats' street door**: x 23..24 y 7..8 z 19, double dark_oak_door facing south, fanlight glass_pane y 9, trim surround x 22 and 25, hood smooth_sandstone_slab (bottom) y 10 z 20 on two console stairs, "FLATS" signboard x 23..24 y 11. Part: windows. Vocab: `streetDoor`, `signboard`.
- [ ] **Stair bay with two flights**: x 22..23, flight 1 steps y 7..12 z 15..10, flight 2 y 14..17 z 15..12; wells open as plan. oak_stairs facing north, rail dark_oak_fence. Part: shell. Vocab: `flight`.
- [ ] **Mansard roof with dormers**: deepslate_tiles, one rect x 3..26 z 2..19, y 24; dormers x 7..9, 15..17, 23..24; iron_bars crest. Part: roof (roof.json preset townhouse, keep = 3 chimneys).
- [ ] **Eaves cornice**: y 23 x 3..26 z 19 band + z 20 upside-down stairs; rear z 1. Part: shell/shopfronts. Vocab: `cornice`.
- [ ] **Quoins**: x 3 and 26 at y 13-14, 17-18, 21-22, cut_sandstone. Part: shell. Vocab: `quoins`.
- [ ] **Three chimneys with smoke**: W x 1..2 z 9..10, C x 12..13 z 0..1, E x 27..28 z 9..10, y 6..32 bricks, trim band y 30, slab cap ring y 33 (stepping out 1), W and E: hay_block y 32 + lit signal campfire y 33 in one flue cell; C capped, no fire. Part: chimneys. Vocab: `chimney`.
- [ ] **Back yards**: cobblestone paving x 3..26 z -5..1 y 6; brick walls y 7..8 coping slab y 9; dividing wall x 12; dark_oak_fence_gate at x 7 and 15, z -5; keeper doors x 7, 15 z 2; rear door x 23. Part: yard. Vocab: `yardWall`.
- [ ] **Street**: road andesite y 5 z 23..28, polished_andesite kerb y 6 z 22, smooth_stone pavement y 6 z 19..21; lamp posts at pavement edge z 21 (x 0, 14, 29: dark_oak_fence + lantern, NOT x 4..20 z 19..20). Part: yard. Vocab: `lampPost`.
- [ ] **Light**: all rooms >= 8; rear lanterns by keeper doors. Lamplighter after build.
```

### rooms.json

```json
{"entrance":[23,7,21],"rooms":[{"name":"keeper aisle 1","box":[4,7,3,11,12,4]},{"name":"keeper aisle 2","box":[13,7,3,20,12,4]},{"name":"stair lobby","box":[22,7,15,25,12,18]},{"name":"bin store","box":[24,7,3,25,12,14]},{"name":"corridor 1","box":[4,14,3,20,17,4]},{"name":"corridor 2","box":[4,19,3,20,22,4]},{"name":"flat 1W front room","box":[4,14,12,11,17,18]},{"name":"flat 1W back room","box":[4,14,5,11,17,10]},{"name":"flat 1E front room","box":[13,14,12,20,17,18]},{"name":"flat 1E back room","box":[13,14,5,20,17,10]},{"name":"flat 2W front room","box":[4,19,12,11,22,18]},{"name":"flat 2W back room","box":[4,19,5,11,22,10]},{"name":"flat 2E front room","box":[13,19,12,20,22,18]},{"name":"flat 2E back room","box":[13,19,5,20,22,10]},{"name":"landing 1","box":[22,14,3,25,17,9]},{"name":"landing 2","box":[22,19,3,25,22,11]}]}
```

### palette.json

```json
{"roles":{"walls":["bricks","brick_stairs","brick_slab","brick_wall"],"trim":["smooth_sandstone","smooth_sandstone_stairs","smooth_sandstone_slab","cut_sandstone","sandstone_wall","chiseled_sandstone","cut_sandstone_slab"],"fascia":["dark_prismarine","dark_prismarine_slab"],"base":["polished_andesite","polished_andesite_stairs","polished_andesite_slab"],"roof":["deepslate_tiles","deepslate_tile_stairs","deepslate_tile_slab","deepslate_tile_wall","iron_bars"],"glass":["glass_pane"],"joinery":["dark_oak_door","dark_oak_fence","dark_oak_fence_gate","dark_oak_trapdoor","dark_oak_planks","dark_oak_stairs","dark_oak_slab"],"floors":["oak_planks","smooth_stone","oak_stairs","smooth_stone_slab"],"ground":["grass_block","dirt","stone","andesite","cobblestone"],"chimney_pots":["terracotta","flower_pot"],"shop_display":["hay_block","yellow_wool","white_wool"]},"objects":["white_banner","white_wall_banner","dark_oak_hanging_sign","dark_oak_wall_sign","hay_block","campfire","lantern","ladder","dark_oak_door","dark_oak_fence","dark_oak_fence_gate","dark_oak_trapdoor","dark_oak_planks","dark_oak_stairs","dark_oak_slab","glass_pane","iron_bars","flower_pot","terracotta","yellow_wool","white_wool"]}
```

### make.sh

```sh
#!/bin/sh
# Make build.nbt from scratch: build to a temp file, then move it into place, so a failed build leaves the old one.
set -e
cd "$(dirname "$0")"
tmp="build.tmp.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
```

### build.mjs

```js
// Build the shop row: the grid at the lot's size, the ground, then every part in plan.md's order. Usage: node build.mjs <out.nbt>
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { LOT, BUILD_Z0, GROUND_TOP, DIRT, STONE, GRASS_BLOCK } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }

// The grid's coordinates are the plan's world coordinates (sockets.json and rooms.json use them too), so build.nbt sits at
// the world origin. A structure can't hold z below BUILD_Z0 (0), so the yard and rear lane (z -8..-1) are outside it.
const g = new Grid([LOT.x1 + 1, LOT.y1 + 1, LOT.z1 + 1]);

// The ground: stone under y 3, dirt to the ground top, grass on the lot's outer ring. Parts build over it (ground cells stay writable).
const { x0, x1, y0, z1 } = LOT, z0 = BUILD_Z0;
g.fill([x0, y0, z0], [x1, 2, z1], STONE);
g.fill([x0, 3, z0], [x1, GROUND_TOP, z1], DIRT);
for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (x === x0 || x === x1 || z === z0 || z === z1) g.set(x, GROUND_TOP, z, GRASS_BLOCK);

// A part whose file is missing (another worker's copy) builds as nothing, so make.sh still yields a build.
async function part(name) {
  const file = `./parts/${name}.mjs`;
  try { return await import(file); } catch (e) {
    if (e.code === "ERR_MODULE_NOT_FOUND" && e.message.includes(`parts/${name}.mjs`)) { console.log(`part ${name}: file missing, built as nothing`); return { build() {} }; }
    throw e;
  }
}
const P = Object.fromEntries(await Promise.all(["shell", "stairs", "roof", "shopfronts", "windows", "chimneys", "yard",
  ...Array.from({ length: 16 }, (_, i) => `room-${i + 1}`)].map(async (n) => [n, await part(n)])));

runParts(g, [
  ["masonry shell", P.shell.build],
  ["Stairs and ladders", P.stairs.build],
  ["mansard roof", P.roof.build],
  ["shopfronts", P.shopfronts.build],
  ["windows and doors", P.windows.build],
  ["chimneys", P.chimneys.build],
  ["yard and street", P.yard.build],
  ["room: keeper aisle 1", P["room-1"].build],
  ["room: keeper aisle 2", P["room-2"].build],
  ["room: stair lobby", P["room-3"].build],
  ["room: bin store", P["room-4"].build],
  ["room: corridor 1", P["room-5"].build],
  ["room: corridor 2", P["room-6"].build],
  ["room: flat 1W front room", P["room-7"].build],
  ["room: flat 1W back room", P["room-8"].build],
  ["room: flat 1E front room", P["room-9"].build],
  ["room: flat 1E back room", P["room-10"].build],
  ["room: flat 2W front room", P["room-11"].build],
  ["room: flat 2W back room", P["room-12"].build],
  ["room: flat 2E front room", P["room-13"].build],
  ["room: flat 2E back room", P["room-14"].build],
  ["room: landing 1", P["room-15"].build],
  ["room: landing 2", P["room-16"].build],
], { palette: "palette.json", roof: "roof.json" });

g.save(out);
console.log(`saved ${out}: grid ${g.size.join("x")} (world coordinates, x 0.., z ${BUILD_Z0}..)`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Shared constants for the shop row. Block ids are palette.json's (checked with mcd blocks --check). Coordinates are WORLD
// coordinates from plan.md, and build.nbt uses the same coordinates. Never write a block by its id.

// ---- palette roles: walls, trim, fascia, base, roof, glass, joinery, floors, ground, functional ----

// ---- palette roles: walls, trim, fascia, base, roof, glass, joinery, floors, ground, functional ----
export const BRICKS = "bricks";                                     // walls

export const BRICK_STAIRS = "brick_stairs";                         // walls: stairs

export const BRICK_SLAB = "brick_slab";                             // walls: slab

export const BRICK_WALL = "brick_wall";                             // walls: yard coping, rails

export const SANDSTONE = "smooth_sandstone";                        // trim: bands, pilasters, sills

export const SANDSTONE_STAIRS = "smooth_sandstone_stairs";          // trim: cornice, consoles

export const SANDSTONE_SLAB = "smooth_sandstone_slab";              // trim: caps, hood, coping

export const CUT_SANDSTONE = "cut_sandstone";                       // trim: quoins, keystones

export const FASCIA = "dark_prismarine";                            // fascia boards

export const FASCIA_SLAB = "dark_prismarine_slab";                  // fascia edge

export const POLISHED_ANDESITE = "polished_andesite";               // base: plinth, kerb

export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs"; // base: stairs

export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";     // base: slab

export const DEEPSLATE_TILES = "deepslate_tiles";                   // roof

export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";       // roof: stairs

export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";           // roof: slab

export const DEEPSLATE_TILE_WALL = "deepslate_tile_wall";           // roof: wall

export const IRON_BARS = "iron_bars";                               // roof crest

export const GLASS_PANE = "glass_pane";                             // glass

export const DARK_OAK_DOOR = "dark_oak_door";                       // joinery: doors

export const DARK_OAK_FENCE = "dark_oak_fence";                     // joinery: rails, sign arms

export const DARK_OAK_FENCE_GATE = "dark_oak_fence_gate";           // joinery: yard gates

export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";               // joinery: letterboxes, fascia

export const DARK_OAK_PLANKS = "dark_oak_planks";                   // joinery: boxes, window boxes

export const OAK_PLANKS = "oak_planks";                             // floors: flats

export const SMOOTH_STONE = "smooth_stone";                         // floors: pavement

export const OAK_STAIRS = "oak_stairs";                             // floors: flight treads

export const GRASS_BLOCK = "grass_block";                           // ground: lot edges

export const DIRT = "dirt";                                         // ground fill

export const STONE = "stone";                                       // ground fill, deep

export const ANDESITE = "andesite";                                 // road

export const COBBLESTONE = "cobblestone";                           // yard paving

// ---- objects (not role blocks; in palette.json "objects") ----
export const WHITE_BANNER = "white_banner";                         // plaque letters (standing)

export const WHITE_WALL_BANNER = "white_wall_banner";               // plaque letters (wall)

export const DARK_OAK_HANGING_SIGN = "dark_oak_hanging_sign";       // shop name signs

export const DARK_OAK_WALL_SIGN = "dark_oak_wall_sign";             // FLATS sign

export const HAY_BLOCK = "hay_block";                               // chimney flue base

export const CAMPFIRE = "campfire";                                 // signal fires (lit, signal_fire)

export const LANTERN = "lantern";                                   // lamps, keeper aisles, lamp posts

export const LADDER = "ladder";                                     // stair joiner: where a stair can't fit

// ---- site (plan.md SITE and FLOORS), world coordinates ----
export const LOT = { x0: 0, x1: 29, y0: 0, y1: 34, z0: -8, z1: 28 }; // the whole lot, as plan.md gives it

// The lowest z a structure can hold is 0: the yard and rear lane (z -8..-1) plan.md places below it are NOT in the build.
export const BUILD_Z0 = 0;

export const GROUND_TOP = 5;          // top of the ground fill: road course and garden level

export const PAVE_Y = 6;              // pavement, shop floor block: people stand at y 7 (counter level)

export const FRONT_Z = 19;            // street face (south): the walls' outer front

export const REAR_Z = 2;              // rear face (north)

export const BODY = { x0: 3, x1: 26, z0: 2, z1: 19 }; // shops + flats + stair bay, outer walls (the one roof rect)

export const FLOOR_Y = { shop: 6, first: 13, second: 18 }; // floor block y per storey (interior starts one above)

export const ROOF_Y = 24;             // roof course: walls end with the cornice at y 23

export const SHOP_KEEP_CLEAR = { x0: 4, x1: 20, y0: 7, y1: 9, z0: 19, z1: 20 }; // nothing at all here

export const CHIMNEYS = {             // footprint x0,z0,x1,z1 (2x2 stacks, y 6..33)

/**
 * rng(seed): a seeded random function returning 0..1 (mulberry32), so a part's variation is the same on every rebuild.
 */
export function rng(seed)
```

### vocab/h1.mjs

```js
// Part h1 vocabulary for the Victorian shop row (plan.md VOCABULARY): brickWall, cornice, console, hangingSign,
// sashWindow, streetDoor, chimney, lampPost. Every helper takes its position as arguments; z is the wall face the
// piece sits on (19 = street front, 2 = rear), out = +1 toward the street (south), -1 toward the yard (north).
// Each returns { placed, skipped }: skipped lists the cells it did not write, so a caller sees what was refused.
// Writes go into AIR only. A cell marked "wall" (trim, openings, glazing set into the wall plane) may also take
// the wall's bricks, and only when the caller passes { into: "wall" }. Cells in g.protected (guard / runParts
// reservations) are never written. Nothing here is furniture, so no room clearance applies; lampPost stands outdoors.

/** A brick wall over the box [x0,y0,z0,x1,y1,z1] (inclusive): bricks, with the course at y 6 polished_andesite. */
export function brickWall(g, [x0, y0, z0, x1, y1, z1], { into = "air" } = {})

/** Cornice row at height y on wall face z, from x0 to x1: a flush smooth_sandstone band, and upside-down stairs out in front. */
export function cornice(g, y, z, x0, x1, { out = 1, into = "air" } = {})

/** Shop console at x on wall face z: trim column y 10..12, with a head one out (upside-down stair over a slab). */
export function console(g, x, z, { out = 1, into = "air" } = {})

/** Hanging shop sign at x: dark_oak_fence arm at y 11 (z+out and z+2*out), attached hanging sign at y 10 on the far end. */
export function hangingSign(g, x, z, name, { out = 1, into = "air" } = {})

/** Sash window 1 wide x 3 tall at x, from y0 up, in wall face z: glass in the wall plane, lintel above, sill below. */
export function sashWindow(g, x, y0, z, { out = 1, sill = true, into = "air" } = {})

/**
 * Double street door for the flats: two dark_oak_door leaves at x and x+1 (lower y0, upper y0+1), a glass fanlight
 * at y0+2, trim surround one out each side, a hood on y0+3 (slabs under, stairs at the ends), and a FLATS wall sign
 * at y0+4 on the street face.
 */
export function streetDoor(g, x, y0, z, { out = 1, sign = "FLATS", into = "air" } = {})

/**
 * Chimney stack on a 2x2 footing at x..x+1, z..z+1, from y 6 to y 32. The flue is the cell (x+1, z+1): air below y 31.
 * A trim band at y 30. A 4x4 smooth_sandstone_slab cap at y 33 with the flue left open. With fire: hay_block in the
 * flue at y 32 and a lit campfire in the flue at y 33.
 */
export function chimney(g, x, z, { fire = false, into = "air" } = {})

/** Street lamp post at x, z: dark_oak_fence from y 7 to y 9 with a standing lantern at y 10. */
export function lampPost(g, x, z, { into = "air" } = {})
```

### vocab/h2.mjs

```js
// Trim, shopfront and street helpers from plan.md VOCABULARY: quoins, pilaster, fascia, shopfront, oriel, flight,
// yardWall, streetSurface. Each takes the grid and its position as arguments and writes only its own cells: into air,
// or over a block named by `replace` (the wall a trim sits on). Returns { placed, refused }; a refused write is counted, not thrown.

// Quoins: a 2-high pair of cut_sandstone per band at each corner z of the column x (flush, over the brick wall).
export function quoins(g, x, zFaces, { replace = "bricks", yBands = [13, 17, 21] } = {})

// Pilaster: smooth_sandstone shaft y 7..12 on a polished_andesite plinth at y 6, flush at z and proud one block toward the street.
export function pilaster(g, x, z, { facing = "south", replace = "bricks" } = {})

// Fascia: dark_prismarine board flush on the wall plane z over x0..x1, y0..y0+2, with the shop name as banner letters.
export function fascia(g, x0, x1, z, name, { facing = "south", y0 = 10 } = {})

// Shopfront for one shop unit x0..x1: trim consoles at both ends (shared with the next unit), their heads proud at y 11..12,
// and the fascia between them. Leaves the open front (y 7..9, z 19..20) untouched.
export function shopfront(g, x0, x1, z, name, { facing = "south", replace = "bricks" } = {})

// Oriel bay x0..x1 standing one proud of the wall plane z: corner posts, apron (y0), panel (y0+4), head (y0+8), glass
// rows at y0+1..3 and y0+5..7, slab cap at y0+9. The wall behind is left to the shell.
export function oriel(g, x0, x1, z, { facing = "south", y0 = 14 } = {})

// Stair flight: one oak_stairs per step from (x, y0, z0), rising in `dir`, `width` wide across the run (+x for north/south,
// +z for east/west). Two clear cells above each step are checked, not carved (lanesBlocked counts any that are not air).
// rail "+" or "-" puts a dark_oak_fence on that open side at each step's top.
export function flight(g, x, y0, y1, z0, dir = "north", { width = 2, rail = null } = {})

// Yard wall along x0,z0..x1,z1 (one line, axis-aligned): bricks at yBase..yBase+1, brick_slab coping on top.
// A gate column at each [x, z] in `gates` is a dark_oak_fence_gate at yBase with the wall left open above it.
export function yardWall(g, x0, z0, x1, z1, { gates = [], yBase = 7, replace = null } = {})

// Street surface: andesite carriageway at roadY over road [z0, z1] (replacing ground), polished_andesite kerb at walkY on
// z = kerb, smooth_stone pavement at walkY over pavement [z0, z1]. Writes only the surface layers, never the ground under them.
export function streetSurface(g, x0, x1, { pavement, kerb, road, roadY = 5, walkY = 6, replace = ["dirt", "grass_block"] })
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

# Plan: suburban McMansion on a cul-de-sac lot

Identity: a 2-storey-plus-attic builder-grade McMansion: jumbled dark-asphalt roofs (tall front gable over a two-storey columned portico, hips over a 3-car garage wing and a family-room wing, a conical turret bay), stone veneer on the lower front, beige siding above, white trim and quoins, black shutters. Front = NORTH (-z); street at z<0 side. Grid 44 (x 0..43) x 15 (y 0..14) x 32 (z 0..31). Ground block layer y=0 (grass); walking surface y=1. All ranges inclusive. `runParts` rule: a later part only ADDS into air, so P1/P2 leave every opening, void and RESERVED cell empty.

Workers: read vocab.mjs (constants SITE, OPENINGS, ROOMS, helpers below) then only your own part.

## SITE (block coordinates)
| mass / feature | x | y | z | notes |
|---|---|---|---|---|
| ground | 0..43 | 0 | 0..31 | `grass_block` everywhere first (P1); other parts overwrite their own footprints (ground stays writable) |
| main block M | 18..35 | 0..9 | 11..25 | walls y1..9 outer ring x18/x35/z11/z25; floor y0; 2nd floor slab y5; ceiling/top plate y9; inner x19..34 z12..24 |
| east family wing W | 35..42 | 0..9 | 12..24 | shares wall x=35 with M; inner x36..41 z13..23; wall z=12 front, z=24 back, x=42 east |
| turret bay T | 38..42 | 0..9 | 8..12 | chamfer: cells (38,8) and (42,8) NOT built; inner x39..41 z9..11; shares z=12 wall row with W |
| garage wing G | 1..17 | 0..9 | 7..24 | east wall x=17 (touches M's x=18 wall); inner x2..16 z8..23; front wall z=7, back z=24 |
| portico | 22..31 | 0..9 | 7..10 | EMPTY in P1 (RESERVED), built by P4; gable roof over it by P3 |
| entry gable roof | 22..31 | 10..14 | 7..18 | cross-gable ridge along z, ridge top y=14 |
| main hip roof | 17..36 | 10..13 | 10..26 | rect walls [18,11,35,25] + overhang 1; ridge y=13 |
| wing hip roof | 34..43 | 10..12 | 11..25 | rect walls [35,12,42,24]; ridge y=12 |
| garage hip roof | 0..18 | 10..12 | 6..25 | rect walls [1,7,17,24]; ridge y=12 |
| turret cone | 37..43 | 10..14 | 7..13 | cone over rect [38,8,42,12], base y=10, finial y=14 |
| chimney | 39..41 | 1..14 | 25..26 | RESERVED outside the wing's back wall z=24; fireplace inside at z=23 |
| back deck | 19..34 | 1..2 | 26..31 | planks at y=1 (walk y=2), railing y=2 |
| street | 0..43 | 0 | 0 | `gray_concrete`; curb z=1 `polished_andesite`; sidewalk z=2 `smooth_stone` |
| driveway | 2..17 | 0 | 2..6 | `light_gray_concrete` (replaces sidewalk at x2..17) |
| front lawn | 18..43 | 0 | 3..6 | grass; front walk x26..27 z3..6; east lawn x36..43 z3..7 |
| young tree | 34..38 | 1..7 | 3..7 | trunk (36,1..4,5) |

Top of build: tree y<=7, turret finial y=14, chimney y=14, entry gable ridge y=14. Nothing above y=14.

Floors: floor-1 walking y=1 (block at y=0), floor-2 walking y=6 (block at y=5), top plate y=9, roof from y=10. Rooms: ground air y=1..4, upper air y=6..8, foyer air y=1..8.

## PALETTE (all ids checked with `mcd blocks --check`)
| role | blocks | where |
|---|---|---|
| siding (~40%) | `birch_planks` (+`birch_slab`, `birch_stairs`) | all walls above y=4 and non-front walls |
| stone veneer (~15%) | per-cell hash `andesite` 40 / `stone` 30 / `cobblestone` 20 / `stone_bricks` 10; `stone_brick_stairs/slab/wall`, `andesite_stairs/slab/wall` | y1..4 of north faces (z=7 G, z=11 M, z=12 W, all T faces, wrap 3 cells round corners x=1/x=17/x=18); plinth y=0 under walls `stone_bricks` |
| white trim (~10%) | `quartz_block`, `smooth_quartz` (+`_stairs`, `_slab`), `quartz_pillar`, `chiseled_quartz_block` | belt course row y=5 and frieze row y=9 on exterior wall planes (`smooth_quartz`), quoins, sills, hoods, columns |
| roof (~25%) | palette `dark-slate` (`deepslate_tiles`, `cobbled_deepslate`, `blackstone` + stairs/slabs), ridge `deepslate_tile_slab` | all roofs |
| shutters/accents | `black_concrete` (flush shutter strips), `dark_oak_trapdoor`, `dark_oak_door`, `dark_oak_planks`, `blackstone_wall`, `iron_bars`, `lantern` | beside windows, doors, lamps |
| doors/glass | `glass_pane`, `white_concrete`, `dark_oak_door` | |
| ground | `grass_block`, `coarse_dirt` (mulch), `light_gray_concrete` (drive), `gray_concrete`, `polished_andesite`, `smooth_stone`, `stone`, `stone_bricks`, `stone_brick_slab` | |
| plants | `azalea_leaves`, `flowering_azalea_leaves`, `oak_log`, `oak_leaves` (all `persistent=true`), `short_grass`, `poppy`, `allium`, `peony`, `rose_bush`, `lilac`, `white_tulip` | |
| deck | `spruce_planks`, `spruce_log`, `spruce_fence`, `spruce_stairs`, `spruce_slab` | |
| interior structure | partitions `white_concrete`, stair `oak_stairs`, stair fill `oak_planks`, ladder none | |
Contrast: black/slate roof vs beige siding vs white trim vs grey stone vs black shutters.

Floor material per room (laid by the part that builds the shell): foyer checker `quartz_block`/`black_concrete` (cell (x+z) even = quartz); office, dining `dark_oak_planks`; kitchen, family, bay nook, passages, gallery, BR2-4, primary, closet `oak_planks`; bath `smooth_quartz`; garage `light_gray_concrete`; mudroom `stone_bricks`; bonus `spruce_planks`. The y=5 slab layer carries the upper room floors; the same layer is the ceiling under them.

## VOCABULARY (helpers in vocab.mjs)
- `wallBlock(face,x,y,z)`: y=0 `stone_bricks`; y5 and y9 on exterior planes `smooth_quartz`; north-facing wall plane (see PALETTE) y1..4 veneer hash; else `birch_planks`. `quoins`: at corner columns (1,7),(17,7),(18,11),(1,24),(17,24),(18,25),(35,25),(42,24): corner cell y1..9 `quartz_block`; the neighbour cell along each exposed face is `quartz_block` when y is even, siding when odd (skip y=5, y=9 which are already bands). `shutterCells`: for every window in OPENINGS flagged `sh`, wall cells at x0-1 and x1+1 (or z0-1, z1+1 on x-faces) over the window's y-range are `black_concrete`.
- `archWindow(x0,x1,yb,yt,plane,face)` (P4): fill the opening with `glass_pane`; top row corner cells x0 and x1 at yt become `quartz_stairs` half=top, facing = away from the window centre (x0: west, x1: east) so they read as arch springers; if the window is 1 wide put `quartz_slab` type=top at yt instead of a pane; sill = row of `quartz_slab` type=top on the outside plane (plane-1 for north faces) at y=yb-1 across x0..x1; hood = row of `quartz_slab` type=bottom on the outside plane at y=yt+1.
- `entryDoor` (P4): opening x25..28 y1..4 at z=11. `dark_oak_door` at x26 and x27, y1..2 (lower+upper half), facing north, hinges on the outer ends so the pair meets in the middle (check `mcd states dark_oak_door` and a render), sidelights `glass_pane` x25 and x28 y1..3, transom row y=3 x26,x27 `glass_pane`, fan row y=4 x26,x27 `glass_pane`, springers `quartz_stairs` half=top at (25,4) facing west and (28,4) facing east. Palladian window above: opening x25..28 y6..8 at z=11: `glass_pane` fill, springers `quartz_stairs` half=top at (25,8) facing west and (28,8) facing east, sill and hood as `archWindow`.
- `column(x,z)` (P4): `quartz_slab` type=bottom y=1 base, `quartz_pillar` axis=y y=2..7, `chiseled_quartz_block` y=8 capital; above y=9 the entablature.
- `portico()` (P4): floor y=0 x22..31 z7..10 `stone_bricks`; centre inlay `smooth_quartz` x26..27 z7..10; columns at (23,7),(25,7),(28,7),(30,7) and half columns flush to wall at (23,10),(30,10) (quartz_pillar y1..8); entablature `quartz_block` row y=9 x22..31 at z=7; side beams y=9 at x22 and x31, z=7..10; ceiling `birch_planks` y=9 x23..30 z8..10; landing `stone_brick_slab` type=bottom y=1 x24..29 z=6; two hanging `lantern` (hanging=true) at (26,8,8) and (27,8,8) under the y=9 ceiling.
- `carriageDoor(x0)` (P4): opening x0..x0+3 y1..3 at z=7: y1..2 all four cells `white_concrete`; `dark_oak_trapdoor` open=true half=bottom facing=north at (x0+1,1,6),(x0+2,1,6),(x0+1,2,6),(x0+2,2,6) as raised bracing (check state vs render); y=3 row: x0 and x0+3 `white_concrete`, x0+1 and x0+2 `glass_pane`; the wall row y=4 above is veneer (built by P2); add a `quartz_slab` type=bottom hood on the outside plane z=6 at y=4 across x0..x0+3.
- `lampPost(x,z)` (P4/P5): `blackstone_wall` y=1..3, `lantern` y=4 (hanging=false).
- `shrub(x,z)` (P5): `azalea_leaves` persistent 3 wide x 1 deep x 2 high (y=1..2) on `coarse_dirt` mulch at y=0 (mulch strip 1 wider all round); every third shrub `flowering_azalea_leaves` at the top centre.
- `youngTree` (P5): `oak_log` axis=y (36,1..4,5); `oak_leaves` persistent=true: layer y=4 and y=5 radius 2 (drop the 4 corner cells), layer y=6 radius 1, y=7 centre; `oak_fence` stake (35,1,5) and (37,1,5), `coarse_dirt` mulch ring at y=0 radius 1.
- `deck()` (P6): see Part 6.
- `chimney()` (P3): footprint x39..41 z25..26. y1..2 base ring `stone_bricks` with `stone_brick_stairs` shoulders; shaft y3..13 `stone_bricks` with `andesite` courses at y=6 and y=10; cap y=14: `stone_brick_slab` type=top over the whole footprint, plus two pots: `stone_brick_wall` at (39,14,25) and (41,14,25) (stacked above the slab, so those two cells are the wall instead of the slab).
- `roofSpec` (P3), for `$MCD roof` / `roof()` (house -> preset `cottage` as the base, overridden to hip/gable and the dark-slate palette, as below). Order inside P3: entry gable, main hip, wing hip, garage hip, turret cone, chimney last (may overwrite roof cells only inside x39..41 z25..26):
  1. entry gable: rects [[22,7,31,18]] style gable, y=10, pitch 1.0, maxHeight 5, ridge along z, overhang 1, eave cornice, wall fill `birch_planks`, verge `quartz_stairs`, material dark-slate, round vent 2x2 `glass_pane` at (26..27, 11..12, 7) framed by `quartz_block`.
  2. main hip: [[18,11,35,25]] hip, y=10, pitch 0.55, maxHeight 4, overhang 1, eave cornice, ridge slab, dark-slate, dormers: south slope x=21 and x=31, north slope x=20 (west of gable).
  3. wing hip: [[35,12,42,24]] hip, y=10, pitch 0.5, maxHeight 3, dark-slate, dormer north slope x=39.
  4. garage hip: [[1,7,17,24]] hip, y=10, pitch 0.5, maxHeight 3, dark-slate, dormers north slope x=4 and x=13.
  5. turret: [[38,8,42,12]] preset `tower-cap` (cone, flare, finial `lightning_rod` at y=14), material dark-slate.
  Use `--no-contrast` NOT needed; roof dark-slate vs beige siding passes. Check `ROOF_BIG_PLANE` and fix with the dormers.

## ROOMS
Walking y=1 (ground) / y=6 (upper). Boxes are inner air [x0,y0,z0,x1,y1,z1]. Floor material per room above.
| room | box | purpose / mood | ways in |
|---|---|---|---|
| Foyer | [24,1,12,29,8,16] | double-height, marble checker, sweeping stair x24..25 (stair cells built by P1), chandelier on `iron_chain` over (27,*,14), console, bench | front opening (25..28,1..4,11); doors (23,1..2,14) office, (30,1..2,14) dining; open south along z=17 (x24..29) to the great room; upstairs via stair |
| Home office | [19,1,12,22,4,16] | desk, shelves, leather chair, quiet | door (23,1..2,14); window (20..21,2..4,11) |
| Formal dining | [31,1,12,34,4,16] | long table for 8, sideboard, chandelier | door (30,1..2,14); door (33,1..2,17) to kitchen; window (32..33,2..4,11) |
| Kitchen and great room | [19,1,18,34,4,24] | open plan: cabinets along z=24 wall with sink window (20..21,2..4,25), big island x25..29 z20..21 with stools, breakfast nook x31..34 z22..24; opens east to the family room | from foyer along (24..29,1..4,17); doors (33,1..2,17) dining, (18,1..2,21) from mudroom, back doors (25..28,1..4,25), opening (35,1..3,19..22) to family room |
| Family room | [36,1,13,41,4,23] | sofas, rug, big wall TV above fireplace on the z=24 wall (firebox x39..41 at z=23, flue behind in chimney), cosy | opening (35,1..3,19..22); arch (39..41,1..3,12) to bay |
| Bay nook | [39,1,9,41,4,11] | turret window seat and reading chair | arch (39..41,1..3,12) |
| Mudroom and laundry | [2,1,19,16,4,23] | lockers, bench, washer and dryer, boots | door (15,1..2,18) from garage; tunnel (17,1..2,21)+(18,1..2,21) to kitchen; back door (12,1..2,24) |
| Garage | [2,1,8,16,4,17] | three cars (no car blocks: 3 parking bays), workbench, shelves, bikes | 3 carriage doors z=7; door (15,1..2,18) |
| Gallery landing (upper hall) | [24,6,17,29,8,24] | overlook over the foyer void, banister along z=17 x26..29, bench, art | stair top (24..25,6,16); doors (23,6..7,18) and (30,6..7,18) |
| West passage | [19,6,18,22,8,19] | short hall, linen | doors (23,6..7,18); (20,6..7,17) BR2; (21,6..7,20) BR4; tunnel (17..18,6..7,18) to bonus room |
| East passage | [31,6,18,34,8,19] | short hall | doors (30,6..7,18); (33,6..7,17) BR3; tunnel (35,6..7,18) to primary |
| Bedroom 2 | [19,6,12,22,8,16] | teen room, bed, desk | door (20,6..7,17); window (20..21,6..8,11) |
| Bedroom 3 | [31,6,12,34,8,16] | guest room, bed | door (33,6..7,17); window (32..33,6..8,11) |
| Bedroom 4 | [19,6,21,22,8,24] | kid's room, bunk, toys | door (21,6..7,20); window (20..21,6..8,25) |
| Primary bedroom | [36,6,13,41,8,19] | king bed, sitting area, calm | tunnel (35,6..7,18); arch (39..41,6..8,12) to nook; windows (42,6..8,15..16) |
| Primary sitting nook | [39,6,9,41,8,11] | turret window seat | arch (39..41,6..8,12) |
| Primary bath | [36,6,21,41,8,23] | double vanity, soaking tub, shower | door (38,6..7,20); door (35,6..7,22) to the closet; windows (42,7..8,21..22),(37..38,7..8,24) |
| Walk-in closet | [31,6,21,34,8,24] | hanging rails, island dresser, shoes | door (35,6..7,22) from the bath; window (32..33,7..8,25) |
| Bonus room | [2,6,8,16,8,23] | media/game room over garage, pool table, sofa, bar | tunnel (17,6..7,18)+(18,6..7,18); windows (4..5,6..8,7),(9..10,6..8,7),(14..15,6..8,7) |

Stairs: P1 builds the foyer stair: for k=0..4 `oak_stairs` facing=south half=bottom at (24,1+k,12+k) and (25,1+k,12+k); under each step fill `oak_planks` at the same x,z from y=1 up to y=k (k>=1). Top steps at (24..25,5,16); then the y=5 slab continues south at z=17. Gallery railing is the designer's. Chandelier hook: ceiling y=9.

## OPENINGS (left as AIR by the shell parts; "sh"=shutter strips; panes etc. filled by P4)
North faces (z min):
- G front z=7: carriage doors x3..6, x8..11, x13..16, y1..3. Bonus windows x4..5, x9..10, x14..15, y6..8 (sh).
- M front z=11: office x20..21 y2..4 (sh); BR2 x20..21 y6..8 (sh); ENTRY x25..28 y1..4; PALLADIAN x25..28 y6..8; dining x32..33 y2..4 (sh); BR3 x32..33 y6..8 (sh).
- W front z=12: arches x39..41 y1..3 and y6..8 (inside the turret); nothing else.
- T: front z=8: (40,2..4) and (40,6..8); west x=38: (38,2..4,10),(38,6..8,10); east x=42: (42,2..4,10),(42,6..8,10). No shutters.
East face x=42 (W): family x42 z15..16 y2..4 (sh), z19..20 y2..4 (sh); primary z15..16 y6..8 (sh); bath z21..22 y7..8.
South faces (z max):
- W back z=24: family x37..38 y2..4; bath x37..38 y7..8. Chimney wall x39..41 SOLID.
- M back z=25: kitchen x20..21 y2..4 (sh); BACK DOOR x25..28 y1..4; nook x32..33 y2..4 (sh); BR4 x20..21 y6..8 (sh); hall palladian x25..28 y6..8; closet x32..33 y7..8.
- G back z=24: back door x12 y1..2; mudroom windows x4..5 y2..3, x8..9 y2..3; bonus x4..5 y6..8, x11..12 y6..8.
West face x=1 (G): garage window z12..13 y2..3; mudroom z20..21 y2..3; bonus z10..11 y6..8, z19..20 y6..8.
Interior (all y ranges are air, doors placed by interior designers): ground (23,1..2,14), (30,1..2,14), (33,1..2,17), (15,1..2,18), (17,1..2,21)+(18,1..2,21), arches (39..41,1..3,12), cased (35,1..3,19..22). Upper: (20,6..7,17), (33,6..7,17), (23,6..7,18), (30,6..7,18), (21,6..7,20), (17,6..7,18)+(18,6..7,18), (35,6..7,18), (38,6..7,20), (35,6..7,22), arches (39..41,6..8,12).
Interior partitions (white_concrete, built by P1/P2 with the openings above): ground: x=23 and x=30 for z12..16 (y1..9); z=17 for x19..23 and x30..34. Upper: x=23 and x=30 for z12..24 (y6..8); z=17 for x19..23 and x30..34; z=20 for x19..22 and x31..34; wing z=20 x36..41; ground garage/mudroom partition z=18 x2..16; wall x=35 between M and W (shared) except openings. Top plate y=9: `birch_planks` over all rooms.

## RESERVED (the shells leave these EMPTY)
- Foyer void: x24..29, y5, z12..16 (no slab); plus stair cells are P1's.
- Portico footprint: x22..31 y1..9 z7..10 (P4).
- Window/door openings above; fan/palladian voids.
- Chimney: x39..41 y1..14 z25..26 (P3); deck: x19..34 y1..2 z26..31 (P6); deck post cells at (19,0,26),(34,0,26),(19,0,31),(34,0,31) y0..1.
- Foundation shrub strips: z=10 y1..2 at x19..22 and x31..37 (P5); garage lamp posts (7,1..4,6),(12,1..4,6); lamps at (24,1..4,4),(29,1..4,4); mailbox (21,1..2,3).
- Tree: x34..38 y1..7 z3..7.
- Roof cells y>=10 are P3's: P1/P2 stop at y=9.

## OUTDOOR ROOMS
- Front lawn: x18..43 z3..6 plus x36..43 z3..7, grass_block with `short_grass` on 1 in 12 cells (not on paths); east edge flower bed.
- Front walk: x26..27 z3..6 `stone_bricks`, edged with `stone_brick_slab` bottom at x25 and x28 (y=1) alternate cells; joins sidewalk z=2 and landing z=6.
- Foundation beds (mulch `coarse_dirt` y=0, shrubs y=1..2): z=10 x19..22 (azalea x20..21 with `peony` pair at x19, x22 y=1), z=10 x31..37 (3 shrubs at x32, x34, x36 `flowering_azalea_leaves` crown), around the turret z=7..8 x37 (one shrub at (37,1,8)) , garage none (drive). Flower strip z=5 x19..23 and x30..35: `poppy`, `allium`, `peony`, `rose_bush` (2 high) in a repeating pattern on `coarse_dirt`.
- Driveway: x2..17 z2..6 `light_gray_concrete`; joints `stone` at z=4 (row) and x=9 (column). Garage lamps at (7,*,6),(12,*,6).
- Lamp posts: (24,1..4,4) and (29,1..4,4). Mailbox (21,1..2,3): `dark_oak_fence` y1, `iron_trapdoor` y2 (closed, half=bottom): two blocks.
- Back lawn: grass; a row of shrubs along the garage back wall at z=25, x3..13 (`azalea_leaves` y1, P6).
- Back deck: x19..34 z26..31; see Part 6.

## PARTS (≤6, 12 min each, in order)
1. **P1 main shell** `parts/main-shell.mjs`: ground grass; floors (y=0, y=5 with the foyer void), walls y1..9 of M, W, T (with the chamfer), top plate y=9, interior partitions and all openings/voids from OPENINGS; foyer stair; quoins and shutters via `wallBlock`/`shutterCells`; floors per room. Ticks 3, 6, 9, 10, 11, 15, 22.
2. **P2 garage wing shell** `parts/garage-shell.mjs`: G block x1..17 z7..24 walls y1..9, floor y=0 (garage `light_gray_concrete`, mudroom `stone_bricks`), y=5 slab with floor `spruce_planks`, plate y=9, partitions z=18 ground, openings from OPENINGS (garage doors 3x4, windows, tunnels at x=17 only; M's wall x=18 gets (18,1..2,21) and (18,6..7,18) openings in P1), quoins, shutters. Ticks 9, 10, 11, 12, 15.
3. **P3 roofs and chimney** `parts/roofs.mjs`: `roofSpec` 1..5 in order, gable-face vent, dormers, then `chimney()`. Ticks 1, 2, 3, 4, 5, 16.
4. **P4 facade** `parts/facade.mjs`: `portico()` with columns, `entryDoor` with fanlight and palladian window, every `archWindow` in OPENINGS with sills and hoods, 3 `carriageDoor`, back-door fill (same as entryDoor opening but doors `dark_oak_door`, glass sidelights) , `lampPost` at garage piers, wall lanterns beside the entry (hanging lanterns at (24,8,8),(29,8,8) if free). Ticks 7, 8, 13, 14, 34.
5. **P5 front site** `parts/front-site.mjs`: street/curb/sidewalk, driveway, lawn + `short_grass`, front walk, foundation shrub beds and flower strips, lamp posts, mailbox, `youngTree`. Ticks 17, 18, 19, 20, 31, 32, 33.
6. **P6 back deck and yard** `parts/back-yard.mjs`: `deck()`: `spruce_planks` y=1 over x19..34 z26..31; posts `spruce_log` axis=y at (19,0..2,26),(34,0..2,26),(19,0..2,31),(34,0..2,31) and mid posts at (26,0..2,31),(19,0..2,28),(34,0..2,28); railing `spruce_fence` y=2 along x=19 (z26..31), z=31 (x19..34), x=34 (z26..31) with a 2-cell gap at (34,2,28..29); door steps `spruce_stairs` facing=south half=bottom at (26,1,26) and (27,1,26) (replace planks there); side steps down to the lawn `spruce_stairs` facing=west half=bottom at (35,1,28) and (35,1,29); grill: `cauldron` (31,2,28) + `iron_trapdoor` closed half=top (31,3,28); AC unit: `iron_bars` (36,1..2,26),(37,1..2,26) standing on the grass; back shrubs row `azalea_leaves` y1 at z=25, x3..13 every second cell on `coarse_dirt` y=0. Ticks 21, 35.

## Checklist
- [ ] P1 main shell: M, W, T walls, floors, foyer stair, void, partitions, openings, quoins, shutters
- [ ] P2 garage wing shell
- [ ] P3 roofs, dormers, gable vent, chimney
- [ ] P4 portico, entry, fanlight, windows, carriage doors, lamps
- [ ] P5 front site
- [ ] P6 back deck and yard
- [ ] `mcd check` and `mcd walk` with rooms.json (entrance 27,1,6)

## Notes for workers
- Facing: stairs `facing` = direction of ascent (back toward the high side). North faces look at the street (-z). Verify any door hinge with a render.
- Openings are AIR in the shells; never fill them in P1/P2. P4 fills them.
- Never place above y=14 or outside x0..43 z0..31. `mcd roof` overhang is 1: garage west eave reaches x=0, wing east eave x=43: do not move the walls.
- If a corner of two roofs collides, the earlier roof wins; keep to the listed order.
- Leaves `persistent=true`. Plants on `grass_block`/`coarse_dirt`.
- When in doubt about a state, `mcd states <block>`.

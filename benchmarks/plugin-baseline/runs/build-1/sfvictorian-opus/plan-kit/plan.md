# Plan: San Francisco Italianate painted lady "sfvictorian-opus"

Identity: an 1880s SF Italianate row house: a tall narrow teal false front over a dark-teal garage base, a full-height angled bay on the
west half, a cream stair climbing beside it to a recessed columned porch on the east, gold fish-scale bands between storeys, a burgundy
frieze under a deep bracketed cream cornice and a pedimented false front hiding a low slate gable. Neighbours press in on both sides
(ochre downhill west, pale blue uphill east). Behind: a lightwell, a kitchen deck and a long garden with a citrus tree and a veg bed.
Lot x0..15, z0..49, y0..20. Front = NORTH (z0 sidewalk). Ground surface y0 (stand y1). All ranges inclusive.
LEVELS: base floor y0, base air y1..3 | slab y4, main air y5..7 | slab y8, 2nd air y9..11 | slab y12, top air y13..15 (NO ceiling: open
into the roof) | wall plate/frieze y16 | roof from y17 | false front y17..19, pediment y20.
HARD RULE: later parts only ADD into air. P1 leaves every OPENING and RESERVED cell air.

## SITE (masses)
| mass | x | y | z | notes |
|---|---|---|---|---|
| sidewalk | 0..15 | 0 | 0..1 | z0 `polished_andesite` curb, z1 `smooth_stone`; uphill step: x14 `smooth_stone_slab` type=bottom at y1 z0..1, x15 `smooth_stone` at y1 z0..1 (P4) |
| drive | 1..5 | 0 | 2..6 | `polished_andesite` (P4) |
| front garden | 7..9 | 0 | 3..6 | `podzol` bed; iron fence z2 x7..9 and x6 z3..6 (P4) |
| front stair | 10..14 | 0..5 | 2..6 | steps x11..13, stringer walls x10, x14 (P4) |
| neighbour fronts | 0 / 15 | 0 | 2..6 | x0 `polished_andesite` (their drive), x15 `cyan_terracotta` y0..1 (their stair base) (P4) |
| house | 1..14 | 0..16 | 7..30 | walls x1, x14 (party), z7 (front), z30 (back); see FLOORS |
| bay | 1..6 | 3..17 | 4..6 | front face z5 x2..5, diagonals (1,z6),(6,z6), y4..16; corbels y3, cap y17 |
| porch | 11..13 | 4..8 | 6..9 | recessed into the front; landing z6 |
| false front | 1..14 | 17..20 | 7 | front wall continues as a parapet; pediment x6..9 |
| lightwell | 1..2 | 5..∞ | 19..23 | air to the sky; walls x3 z19..23 and (1..3, z18), (1..3, z24) y5..16; floor y4 `smooth_stone` |
| west neighbour wall | 0 | 0..13 | 7..30 | `yellow_terracotta`; (0,14,6) `smooth_quartz_stairs` facing=south half=top (P1) |
| east neighbour wall | 15 | 0..15 | 7..30 | y0 `cyan_terracotta`, y1..15 `light_blue_terracotta`; (15,16,6) `smooth_quartz_stairs` facing=south half=top (P1) |
| roof | 0..15 | 17..20 | 7..31 | P2 |
| deck | 2..13 | 0..5 | 31..38 | floor y4 z31..35, posts, stair z36..38 (P5) |
| back garden | 1..14 | 0..2 | 31..48 | ground y0; side fences x0, x15 z31..48; back fence z49 (P5) |

### Roof (P2). Building type: SF Italianate row house with a false front → preset `shop` (gable end to the street, ridge along z), kept LOW
so the false front hides it from the street:
`roof(g, [[1,7,14,30]], "shop", { y:17, pitch:"half", maxHeight:4, overhang:1, material:"dark-slate", gable:"bamboo_mosaic", ridge:"crest",
 dormers:false, chimneys:[{at:[1,13],size:1,material:"bricks"},{at:[14,27],size:1,material:"bricks"}],
 keep:[{from:[0,16,3],to:[15,24,7]} /*cornice + false front*/, {from:[1,16,19],to:[2,26,23]} /*lightwell open to sky*/] })`
Dry-run first (`--dry-run`); targets: ridge ≤ y20 (behind the pediment), roof starts y17, back gable z30 filled with fish-scale, overhang
over the deck at z31 and over the neighbour walls (x0, x15 are lower: y13 / y15). If `dormers:false` is rejected, pass `dormers:{count:0}`.
If the dry-run warns ROOF_BIG_PLANE, accept it only with `--why "concept: low hidden gable behind an Italianate false front"`.

## PALETTE (ids checked with `mcd blocks --check`; `chain` is `iron_chain`)
| role | blocks | where / share |
|---|---|---|
| body siding (45%) | `warped_planks`, `warped_slab`, `warped_stairs`, `warped_fence`, `warped_trapdoor` | front/back siding courses, bay, parapet y17 |
| fish-scale shingles, gold (10%) | `bamboo_mosaic`, `bamboo_mosaic_slab`, `bamboo_mosaic_stairs` | bands y8, y12; parapet panels y18; back gable |
| burgundy accent (5%) | `crimson_planks`, `crimson_door`, `crimson_trapdoor`, `crimson_stairs`, `crimson_slab`, `crimson_fence` | frieze y16, front + garage doors |
| cream trim (15%) | `smooth_quartz`, `smooth_quartz_stairs`, `smooth_quartz_slab`, `quartz_block`, `quartz_pillar`, `quartz_stairs`, `quartz_slab`, `chiseled_quartz_block`, `quartz_bricks` | belt y4, cornice, brackets, hoods, sills, columns, steps, bay posts |
| base (10%) | `cyan_terracotta` | y0..3 front/back, stair stringers |
| party/inner walls | `birch_planks`, `birch_door`, `birch_fence`, `birch_trapdoor` | x1, x14 (y4..16), lightwell walls, partitions, stair rails outside |
| neighbours | `yellow_terracotta`, `light_blue_terracotta` | x0, x15 |
| roof | `dark-slate` palette (deepslate tile family), `bricks` chimneys | P2 |
| glass | `glass_pane` | every window |
| floors | `smooth_stone` (base), `dark_oak_planks` (main floor), `polished_diorite` (kitchen, porch), `spruce_planks` (2nd floor), `white_concrete` (bath, 2nd), `birch_planks` (top floor) | FLOORS |
| stair inside | `dark_oak_stairs`, `dark_oak_fence`, `dark_oak_planks` | E20, E21 |
| ironwork | `iron_bars`, `polished_blackstone_wall`, `lantern`, `iron_chain` | fence, lamps |
| street/ground | `polished_andesite`, `smooth_stone`, `smooth_stone_slab`, `grass_block`, `podzol`, `bricks`, `brick_slab`, `farmland`, `water` | site |
| plants | `rose_bush`, `peony`, `lilac`, `azalea`, `flowering_azalea`, `fern`, `large_fern`, `oak_log`, `flowering_azalea_leaves`, `oak_leaves`, `carrots`, `beetroots`, `potatoes`, `potted_fern`, `potted_red_tulip`, `flower_pot` | gardens |
| deck | `spruce_planks`, `spruce_log`, `spruce_fence`, `spruce_stairs`, `spruce_slab`, `spruce_pressure_plate`, `spruce_trapdoor` | P5 |
| functional/decor (designers) | `campfire`, `bookshelf`, `smoker`, `barrel`, `cauldron`, `water_cauldron`, `iron_trapdoor`, `crafting_table`, `white_bed`, `red_bed`, `white_carpet`, `red_carpet`, `cyan_carpet`, `white_wool`, `lightning_rod`, `end_rod`, `oak_planks` | rooms |
Contrast: teal body / gold bands / burgundy frieze / cream trim / dark-teal base / grey-black roof.

## VOCABULARY (helpers in `vocab.mjs`; `out` = the wall's outward direction; "1 out" = the cell just outside the wall face)
| helper | parameters | construction |
|---|---|---|
| `wallCell(x,y,z,kind)` | kind: front/back, party, inner | front/back (z7, z30, bay faces): y0..3 `cyan_terracotta`, y4 `smooth_quartz`, y5..7 / y9..11 / y13..15 `warped_planks`, y8, y12 `bamboo_mosaic`, y16 `crimson_planks`, y17 `warped_planks`, y18 `bamboo_mosaic` (posts `smooth_quartz` at x1,5,10,14). party (x1, x14, lightwell walls): y0..3 `cyan_terracotta`, y4..16 `birch_planks`. inner (partitions): `birch_planks`. |
| `wallLine(x0,z0,x1,z1,y0,y1,kind,{open:[boxes]})` | | wallCell over the box except `open` cells (left unset). |
| `slab(y,x0,z0,x1,z1,block,{holes})` | | floor fill, holes left unset. |
| `tallWindow(x,yb,zOrX,out,{hood})` | 1 wide, 3 tall | `glass_pane` at yb..yb+2 in the wall; sill `smooth_quartz_slab` type=top 1 out at yb-1; if hood: 1 out at yb+3: left `smooth_quartz_stairs` facing=(toward the window centre, e.g. east on a north face) half=bottom, centre `chiseled_quartz_block`, right stair facing the other way. Never overwrite a cell another element owns (skip it). |
| `pairedWindow(yb)` | bay front | `glass_pane` (3..4, yb..yb+2, 5); sill `smooth_quartz_slab` type=top (3..4,yb-1,4); hood at yb+3, z4: (2) `smooth_quartz_stairs` facing=east, (3..4) `chiseled_quartz_block`, (5) facing=west. |
| `diagWindow(x,yb)` | x 1 or 6 | `glass_pane` (x, yb..yb+2, 6); sill `smooth_quartz_slab` type=top (x, yb-1, 5); hood `smooth_quartz_slab` type=bottom (x, yb+3, 5). |
| `bracket(x,y,z)` | | `quartz_stairs` facing=south half=top (back against the wall). |
| `crown(x,y,z)` | | `smooth_quartz_stairs` facing=south half=top. |
| `corbel(x,z)` | under the bay | `smooth_quartz_stairs` facing=south half=top at y3. |
| `column(x,z)` | porch | y5 `quartz_block`, y6 `quartz_pillar` axis=y, y7 `chiseled_quartz_block`. |
| `entryDoor()` | | E5 exactly. Door `crimson_door` facing=north hinge=left, lower y5 upper y6. |
| `carriageDoor()` | | E2 exactly. |
| `door(x,y,z,facing,hinge,wood)` | | lower at y, upper at y+1, open=false; `birch_door` inside. |
| `stairFlight(x,z0,y0,n,facing,block)` | | n stairs, each 1 up and 1 along `facing`. |
| `stairRail(x,z0..z1)` | front stair | stringer `cyan_terracotta` up to the tread height of the step beside it, `birch_fence` 1 above it. |
| `newelLamp(x,z)` | | `quartz_pillar` axis=y y1..2, `lantern` y3. |
| `ironFence(cells)` | | `iron_bars` y1; posts `polished_blackstone_wall` y1..2 at run ends. |
| `gardenBed(box,plants)` | | `podzol` at y0 over the box, plants at y1 (double plants: lower+upper). |
| `hangLamp(x,y,z)` | | `iron_chain` at y (if the drop is 2), `lantern` hanging=true below; ceiling must be directly above. |
| `lampPost(x,z)` | garden | `dark_oak_fence` y1..2, `lantern` y3. |
| `citrusTree(x,z)` | | `oak_log` y1..3; `flowering_azalea_leaves` persistent=true: y3 the 8 cells around the trunk, y4 3x3, y5 plus (5 cells); `oak_leaves` persistent=true mixed into y4 corners; `podzol` 3x3 at y0. |
| `vegBed(box,water)` | | `farmland` moisture=7 y0, `water` cells, crops y1 at a set age (E29); edging `spruce_trapdoor` half=bottom closed on the y1 cells just outside the bed edge (not on the path). |
| `deckRail(cells)` | | `spruce_fence` y5. |
| `deckTable(x,z)` | | `spruce_fence` y5 + `spruce_pressure_plate` y6; chairs `spruce_stairs` facing away from the table on 2 sides. |
| `bench(x0,x1,z)` | | `spruce_stairs` facing=south y1 (sit facing the house), `spruce_trapdoor` open arms at both ends. |
| furniture (designers) | | bed = `*_bed` (part=foot/head); table = `dark_oak_fence` + `spruce_pressure_plate`; chair = stairs facing the table; fireplace E22; clawfoot tub E26; counter = a row of `barrel` facing=up (the tops read as worktops); sink `water_cauldron`; range `smoker`; bookshelf wall; rug = carpet; upright piano = `dark_oak_stairs` facing away from the player + `dark_oak_trapdoor` lid. |

## FLOORS (P1)
| y | cells | block |
|---|---|---|
| 0 | x1..14 z7..30 (all under the house) | `smooth_stone` |
| 4 | x2..13 z8..29 + bay (2..5,4,6) + porch & landing x11..13 z6..9 + lightwell floor (1..2,4,19..23); HOLES (13,4,16),(13,4,17) | main rooms `dark_oak_planks`; kitchen z26..29 `polished_diorite`; porch/landing `polished_diorite`; lightwell `smooth_stone` |
| 8 | x2..13 z8..29 + bay (2..5,8,6) + porch ceiling x11..13 z7..9, NOT x1..3 z19..23 (x3 is wall); HOLES (13,8,13..15) | `spruce_planks`; bath x4..9 z19..24 `white_concrete` |
| 12 | same as y8; HOLES (13,12,18),(13,12,19) | `birch_planks` |
| 16 | walls only (plate); no ceiling over the top floor | |
Walls: x1 and x14 z7..30 y0..16 (party); x1 only y0..4 at z19..23 (lightwell); z7 x1..14 y0..19 (front incl. parapet y17..18; y19 P3); z30 x1..14 y0..16.
Lightwell walls y5..16: x3 z19..23; (1..3,·,18); (1..3,·,24). Bay walls y4..16 as SITE. Base partition z19 x2..13 y1..3.

## ROOMS (inner air boxes)
| room | box [x0,y0,z0,x1,y1,z1] | floor | mood / key pieces | ways in | windows |
|---|---|---|---|---|---|
| Garage | [2,1,8,13,3,18] | `smooth_stone` | working: leave x2..5 z8..13 clear as the car bay, tool wall, bikes, bins; keep x13 z13..18 clear (stair) | carriage doors (2..5,1..2,7); base stair (13,1..3,15..17); laundry door (7,1..2,19) | (8,2,7) |
| Laundry & workshop | [2,1,20,13,3,29] | `smooth_stone` | utilitarian: washer (`cauldron`), drying line, workbench, shelves of jars | (7,1..2,19); garden door (7,1..2,30) | (4,2,30),(10,2,30) |
| Entry hall | [11,5,11,13,7,24] | `dark_oak_planks` + `red_carpet` runner | grand-narrow: hall tree, umbrella stand, console with mirror, hanging lamp; keep x13 z13..17 (stairs, hole) and a 1-wide path x11..12 clear | front door (12,5..6,10); parlour (10,5..7,12..13); dining (10,5..6,21); kitchen (12,5..6,25) | sidelights |
| Front parlour | [2,5,8,9,7,17] + bay [2,5,6,5,7,6] | `dark_oak_planks` + rug | formal Victorian: fireplace on the west wall (firebox (1,5..6,13)), settee and armchairs facing it, upright piano, palm in the bay, bookshelves | (10,5..7,12..13); pocket opening to dining (5..7,5..7,18) | bay (3..4,5..7,5),(1,5..7,6),(6,5..7,6); (8,5..7,7) |
| Dining room | [4,5,19,9,7,24] | `dark_oak_planks` | dark wood, candlelit: table for 6, sideboard, chandelier | (5..7,5..7,18); hall (10,5..6,21); kitchen (7,5..6,25) | lightwell (3,5..7,20),(3,5..7,22) |
| Kitchen | [2,5,26,13,7,29] | `polished_diorite` | bright, old-house: range (`smoker`) with hood, sink under the back window, counters, pantry barrels, small table | (7,5..6,25),(12,5..6,25); deck door (7,5..6,30) | (4,5..7,30),(10,5..7,30) |
| Front bedroom | [2,9,8,9,11,17] + bay [2,9,6,5,11,6] | `spruce_planks` + carpet | main bedroom: double bed facing the bay, wardrobe, vanity, reading chair in the bay | (10,9..10,12) | bay (3..4,9..11,5),(1,9..11,6),(6,9..11,6); (8,9..11,7) |
| Sewing room | [11,9,8,13,11,9] | `spruce_planks` | tiny, over the porch: sewing table (loom), chair, plants at the window | (12,9..10,10) | (12,9..11,7) |
| Upper hall | [11,9,11,13,11,24] | `spruce_planks` + runner | narrow landing: banister along the stairwell, linen chest, picture, hanging lamp; keep x13 z16..19 clear | stair (13,8,16); doors | none |
| Bathroom | [4,9,19,9,11,24] | `white_concrete` | white and brass: clawfoot tub, pedestal sink, toilet, towel rack | (10,9..10,21) | lightwell (3,10..11,21) |
| Back bedroom | [2,9,26,13,11,29] | `spruce_planks` + carpet | children's room: two beds, toy chest, desk, looks over the garden | (12,9..10,25) | (4,9..11,30),(7,9..11,30),(10,9..11,30) |
| Top-floor studio | [2,13,8,13,15,17] + bay [2,13,6,5,15,6] | `birch_planks` | artist's studio under the roof (open to the rafters): easel, worktable, daybed, plants in the bay, skylight feel | (11,13..14,18) | bay, (8,13..15,7),(12,13..15,7) |
| Top landing | [4,13,19,13,15,24] | `birch_planks` | reading nook at the stair head: armchair at the lightwell window, bookshelves | stair (13,12,20) | (3,13..15,21) |
| Attic bedroom | [2,13,26,13,15,29] | `birch_planks` | guest room under the back gable: single bed, trunk, washstand | (12,13..14,25) | (5,13..15,30),(9,13..15,30) |
Stairs: E20 (main → 2nd → top, one straight run along x13), E21 (garage → hall). Banisters (P1): `dark_oak_fence` (12,5,16..17), (12,9,13..15), (12,13,19).

## OPENINGS (P1 leaves AIR)
| wall | openings (x, y, z) | filled by |
|---|---|---|
| front z7 | garage (2..5,1..3); base window (8,2); bay mouths (2..5,5..7),(2..5,9..11),(2..5,13..15) stay open (no glass); (8,5..7),(8,9..11),(8,13..15),(12,9..11),(12,13..15); porch mouth + columns (10..14,5..7) | P3 |
| bay | (3..4,5..7 / 9..11 / 13..15, 5); (1, same, 6); (6, same, 6) | P3 |
| porch z10 | (11..13,5..7) door/sidelights/transom | P3 |
| back z30 | base door (7,1..2), base windows (4,2),(10,2); kitchen door (7,5..6) + transom (7,7); (4,5..7),(10,5..7); (4,9..11),(7,9..11),(10,9..11); (5,13..15),(9,13..15) | P5 |
| lightwell x3 | (3,5..7,20),(3,5..7,22),(3,10..11,21),(3,13..15,21) | P5 |
| party x1 | firebox (1,5..6,13) | parlour designer |
| interior | base (7,1..2,19); main (10,5..7,12..13) cased, (5..7,5..7,18) cased, (10,5..6,21), (7,5..6,25), (12,5..6,25); 2nd (10,9..10,12), (12,9..10,10), (10,9..10,21), (12,9..10,25); top (11,13..14,18), (12,13..14,25) | P6 doors (cased = no door) |

## RESERVED (P1 leaves empty)
- Porch columns + arch cells (10,5..7,7),(14,5..7,7),(11..13,5..7,7); porch hood row (10..14,8,6) is outside anyway.
- Bay corbel row y3 (1..6, 3, 5..6) and drive under it: no shell blocks below y4 outside z7.
- Everything outside the house box (x1..14, z7..30) except the neighbour walls: P4/P5 own the ground, P3 the cornice.
- Firebox (1,5..6,13). Stair cells and holes (E20, E21). Lightwell air x1..2 z19..23 y5+ (P2 keep).
- Parapet coping row y19 and pediment y19..20 on z7 (P3).

## OUTDOOR
- Front: drive `polished_andesite`; front garden E16; stair E3 with newel lanterns; porch lantern (12,7,8).
- Back: under-deck patio `polished_andesite` x2..13 z31..38 y0; brick path `bricks` x6..8 z39..47; west border `podzol` x1..2 z39..48 (lilac, rose_bush, peony, fern, large_fern alternating); citrusTree (4,_,44) — trunk on (4,0,44) podzol, path at x6..8 clears it; vegBed x10..13 z42..46 (E29) with `spruce_trapdoor` edging; bench x6..8 z48 facing the house; lampPost (9,_,46) beside the path; lawn `grass_block` elsewhere z36..48; `spruce_fence` y1..2 on x0 and x15 z31..48 and z49 x0..15.
- Deck: lanterns on rail posts (2,6,35),(13,6,31); deckTable (5,_,33) with 2 chairs; `potted_fern` at (3,5,31) and (9,5,31) beside the door; keep the stair head x11..13 z34..35 clear.

## PARTS (each a 12-minute job; order = build order)
1. P1 `parts/shell.mjs` - MASSING + SHELL: neighbour walls x0, x15; house walls by wallCell (front incl. parapet y17..18, back, party, lightwell), bay walls y4..16 (corner posts `smooth_quartz` on (2,·,5),(5,·,5) siding courses), floors FLOORS, partitions with their openings, stair flights E20, E21, banisters; every OPENING and RESERVED cell air. Ticks E1, E6 walls, E10, E11 bands, E13, E14, E20, E21, E22 firebox, E27.
2. P2 `parts/roof.mjs` - ROOF: the `shop` call above, dry-run first; chimneys; keep boxes. Ticks E18, E19, E11 gable.
3. P3 `parts/facade.mjs` - FRONT FACADE: corbels + bay soffit, pairedWindow/diagWindow at yb 5, 9, 13, tallWindow (hood except top floor), cornice (brackets, crown, bay cap), parapet coping + pediment, porch columns/arch/hood/lantern, entryDoor, carriageDoor. Ticks E2 doors, E4, E5, E6 glazing, E7, E8, E9, E12.
4. P4 `parts/street.mjs` - STREET FRONT: sidewalk + uphill step, drive, neighbour front hints, front stair (stairFlight `quartz_stairs`, stringers, stairRail, newelLamp), ironFence, front garden. Ticks E3, E16, E17, E2 drive.
5. P5 `parts/back.mjs` - BACK: glazing (tallWindow, no hood) on z30 and x3; kitchen door `crimson_door` facing=south (7,5..6,30) + transom glass (7,7,30); laundry door `birch_door` facing=south (7,1..2,30); deck, posts, rail, stair, deck lanterns, table, pots; garden, path, border, citrus tree, veg bed, bench, lamp post, fences. Ticks E15, E24 door, E28, E29, E32 door.
6. P6 `parts/finish.mjs` - DOORS + LIGHTS: every interior `birch_door` (OPENINGS interior, not the cased ones); hall hangLamps from the slab above at (12,7,14),(12,7,22),(12,11,22); garage lantern; then renders: street eye (8,2,-6) looking south, the 3/4 from NE, the deck from the garden, and inside the hall. Ticks E30, E31.

Checklist (workers tick):
- [ ] P1 shell  - [ ] P2 roof  - [ ] P3 facade  - [ ] P4 street  - [ ] P5 back  - [ ] P6 finish

## NOTES for workers
- Facing words: doors/hoods face OUT of their wall; stairs `facing` = the direction you walk to climb; half=top stairs used as brackets
  face the wall they hang from (south on the front).
- The front is busy on purpose but disciplined: one material per course (E1), trim only in cream. Don't add colours.
- Bay geometry: front face z5 x2..5, diagonal cells (1,·,6),(6,·,6) touch (2,·,5)/(5,·,5) corner-to-corner; that is the angled bay.
  The cells (1,·,5),(6,·,5) are OUTSIDE (sills, hoods, brackets go there).
- The long staircase: stand at (13,5,12), climb south to (13,8,16), keep climbing to (13,12,20). Nothing may be placed on x13 z12..20
  in y5..15 except the stairs, and nothing at (13,1..3,14..18).
- The top floor has no ceiling: the roof's underside is its ceiling. P2 must not fill the attic.
- Room designers: walls, floors, windows and doors are done; place furniture only into air, never in a doorway, a window cell, a stair
  or stair-hole cell; keep a 1-wide path from every door to the room's middle. Light every room (lanterns, candles, end rods).

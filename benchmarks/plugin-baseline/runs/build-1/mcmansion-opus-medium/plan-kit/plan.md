# Plan: suburban McMansion "mcmansion-opus-medium"

Identity: a 2000s cul-de-sac McMansion: a two-storey beige box made "grand" by a jumble of parts on the street face: a tall white-trimmed
front gable over a double-height columned portico, an octagonal turret bay with a cone at the west corner, a three-car garage wing set
back on the east, grey stone veneer on the lower front, birch-beige siding everywhere else, white belt/plate/quoins, black shutters,
dark slate-grey asphalt hips, a big stone chimney on the west end. Wide concrete drive, clipped lawn, shrubs, one young birch, a back deck.
Site x 0..43, z 0..31, y 0..17. Front = NORTH (z0 = cul-de-sac road). Ground y0. HOUSE FLOOR y1 (stand y2), ground storey air y2..4,
upper floor y5 (stand y6), upper air y6..8, ceiling + wall plate y9, roofs y10+. GARAGE floor y0, air y1..4, bonus floor y5.
All ranges inclusive. Later parts only ADD into air: every opening and reserved cell below is left AIR by P1.
HARD RULE: in the house footprint nothing but P2 (roofs) and the turret walls (y10..11) / chimney stack stands at y>=10.

## SITE (masses)
| mass | x | y | z | notes |
|---|---|---|---|---|
| road | 0..43 | 0 | 0 | `gray_concrete` (P5) |
| sidewalk | 0..43 | 0 | 1 | `light_gray_concrete`; driveway crossing x29..41 = `smooth_stone` (P5) |
| driveway | 29..41 | 0 | 2..12 | `smooth_stone` (P5); flares 1 cell at z2: x28 and x42 `smooth_stone` |
| front lawn | 0..28 | 0 | 2..10 | `grass_block` except walk/beds/porch (P5) |
| side yards | 0..1, 42..43 | 0 | 2..31 | grass (chimney stands at x0..1 z20..23) |
| back yard | 0..43 | 0 | 26..31 | grass; deck x6..24 z26..30 |
| foundation | 2..29 (+turret, entry) | 0 | 7..25 | P1 `stone_bricks` under the house; garage x29..41 z13..25 y0 = `smooth_stone` floor |
| main block | 2..29 | 1..9 | 11..25 | 2 storeys; walls x2, x29, z11, z25 |
| entry projection | 12..21 | 1..9 | 9..10 | front wall z9, sides x12/x21 at z10; main wall z11 omitted x13..20 at y2..8 |
| portico | 11..22 | 1..9 | 4..8 | open: floor y1 z5..8, steps z4, 4 columns z5, entablature y9 (P3) |
| turret bay | 2..7 | 1..11 | 7..11 | octagon: front z7 x3..6; chamfer cells (2,8),(7,8); sides x2,x7 at z9..10; back = main wall z11 (raised to y11 for x2..7) |
| garage wing | 29..41 | 0..9 | 13..25 | walls x29 (shared), x41, z13, z25; 3 door openings in z13 |
| chimney | 0..1 | 0..15 | 20..23 | stone stack outside wall x2 (P1) |
| roofs | 1..42 | 10..17 | 4..26 | P2, table below |
| back deck | 5..24 | 1..2 | 26..30 | P5 |

### Roofs (P2). Building type: a hipped suburban house with a classical front gable → preset `civic` (45° hip, `slate` palette, quartz dentil
cornice, quartz front pediment); a plain house would be `cottage`, but a McMansion's signature is hips + a pedimented front gable. Overrides:
| call | footprint rects [x0,z0,x1,z1] (R0 FIRST) | options |
|---|---|---|
| R-main | [[4,11,29,25],[2,11,3,25],[29,13,41,25],[11,5,22,10]] | `roof(g, rects, "civic", { y:10, style:"hip", pitch:0.6, overhang:1, material:"slate", eave:"cornice", trim:"smooth_quartz", ridge:"slab", pediment:{face:"north", width:12, pitch:1.25, tympanum:"birch_planks", cornice:"smooth_quartz", oculus:true}, dormers:{face:"south", count:2, style:"gable", width:3, height:2, window:"glass_pane", wall:"birch_planks"}, keep:[{from:[1,10,6],to:[8,30,11]} /*turret*/, {from:[0,0,19],to:[1,30,24]} /*chimney*/] })` |
| R-turret | [[2,7,7,11]] | after R-main: `roof(g, rects, "cone", { y:12, material:"slate", maxHeight:5, finial:true, overhang:1 })`; if the tool's finial is not a rod, add `lightning_rod` on the apex |
Targets (dry-run first, adjust `pitch` only): main hip ridge/deck ≤ y14; pediment peak y15..16 = the tallest roof; turret apex y16..17.
R0 = [4,11,29,25] is chosen so the pediment centres on x16.5 = the entry axis (x11..22). Check the render: if the pediment's front
triangle at z5 is left open, fill the tympanum at z5 with `birch_planks` + the half-round window of E10 (cells inside the rake only).

## PALETTE (all ids checked with `mcd blocks --check`; `chain` is `iron_chain`; `painting` is an entity: not used)
| role | blocks | where / share |
|---|---|---|
| siding (55%) | `birch_planks`, `birch_slab`, `birch_stairs`, `birch_fence`, `birch_door`, `birch_trapdoor` | walls above the veneer, all sides/back; interior partitions |
| stone veneer (15%) | `stone_bricks` 45 / `andesite` 25 / `tuff_bricks` 20 / `cobblestone` 10 (hash (x*7+y*5+z*13)%20), `stone_brick_stairs`, `stone_brick_slab`, `stone_brick_wall`, `chiseled_stone_bricks` | front faces y1..4, chimney, plinth y1, foundation |
| white trim (10%) | `smooth_quartz`, `quartz_block`, `quartz_pillar`, `chiseled_quartz_block`, `quartz_bricks`, `quartz_stairs`, `quartz_slab`, `smooth_quartz_slab`, `smooth_quartz_stairs` | belt y5, plate y9, quoins, columns, arches, sills, casings, cornice |
| roof (15%) | `slate` palette: `cobbled_deepslate`, `deepslate_tiles`, `polished_deepslate`, `deepslate_tile_stairs`, `deepslate_tile_slab`, `blackstone_bricks` eave | all roofs |
| black accents | `dark_oak_trapdoor` (shutters), `dark_oak_door`, `dark_oak_planks`, `dark_oak_stairs`, `dark_oak_slab`, `dark_oak_fence` | shutters, front/back doors, stair |
| garage doors | `spruce_trapdoor`, `glass_pane` | carriage doors |
| glass | `glass_pane`, `glass` | windows |
| floors | `oak_planks` (hardwood), `polished_diorite` + `smooth_quartz` (marble), `smooth_stone` (garage, kitchen tile alt), `polished_andesite` (mudroom), `white_concrete` (bath), carpets `white_carpet`, `light_gray_carpet` | ROOMS |
| ground | `grass_block`, `podzol` (mulch), `smooth_stone`, `bricks`, `gray_concrete`, `light_gray_concrete`, `dirt_path` | site |
| plants | `azalea_leaves`, `flowering_azalea_leaves`, `birch_log`, `birch_leaves`, `white_tulip`, `red_tulip`, `peony`, `rose_bush`, `lilac`, `short_grass`, `potted_fern`, `flower_pot` | beds, tree |
| deck | `spruce_planks`, `spruce_fence`, `spruce_stairs`, `spruce_slab`, `spruce_pressure_plate` | deck |
| light & functional | `lantern`, `iron_chain`, `campfire`, `lightning_rod`, `end_rod`, `smoker`, `barrel`, `bookshelf`, `iron_bars`, `water_cauldron`, `white_bed`, `light_gray_bed`, `red_bed`, `black_concrete`, `item_frame`, `calcite`, `smooth_sandstone`, `oak_fence`, `iron_trapdoor` | rooms, lights |
Contrast: grey veneer / beige birch / white quartz / near-black shutters / slate-grey roof (tone well apart from birch).

## VOCABULARY (helpers in `vocab.mjs`; "out" = the wall's outward direction: north on z=front faces, south on z25, west on x2, east on x41)
| helper | parameters | construction |
|---|---|---|
| `veneer(x,y,z)` | | hash mix above (stone veneer). |
| `siding(x,y,z)` | | `birch_planks`. |
| `wallCell(x,y,z,face)` | face: front/other | front: y1..4 veneer, y5 `smooth_quartz` belt, y6..8 siding, y9 `smooth_quartz` plate (y10..11 turret: siding, y11 `smooth_quartz` cap course). other: y1 `stone_bricks`, y2..8 siding, y9 `smooth_quartz`. |
| `wallLine(x0,z0,x1,z1,face,{open:[boxes]})` | | wallCell over the line y1..9 except cells in `open` (left unset). |
| `quoin(x,z,faceAxisA,faceAxisB,yFrom,yTo)` | | corner column `quartz_bricks` on siding courses yFrom..yTo; extra cell along face A at even y, along face B at odd y. Fronts: yFrom 6 (above the belt). |
| `partition(x0,z0,x1,z1,y0,y1,{open})` | | `birch_planks` interior wall, openings left unset. |
| `archWindow(x0,y0,z or x,out)` | 2 wide, rows y0..y0+2 | `glass_pane` rows y0, y0+1; arch row y0+2: left cell `quartz_stairs` half=top facing=(west on north faces), right cell facing=east (mirror on south faces); sill `smooth_quartz_slab` type=top one cell OUT at y0-1 under both cells; then `shutter` each side. |
| `windowRect(cells,yRange,out)` | 1 or 2 wide, 2..3 tall | `glass_pane`; sill as above; lintel = the wall course above (P1); shutters each side. |
| `shutter(x,y,z,out)` | | `dark_oak_trapdoor` open=true half=bottom facing=out, in the cell just OUTSIDE the wall face beside the opening (panel hugs the wall); a stack the height of the window incl. arch row. Verify with a render that the panel lies flat against the wall; flip facing if it stands on the far side. |
| `column(x,z)` | portico | y2 `quartz_block`, y3..7 `quartz_pillar` axis=y, y8 `chiseled_quartz_block`. |
| `entablature()` | | y9 `smooth_quartz` x11..22 z5, x11 and x22 at z6..8; ceiling `smooth_quartz_slab` type=top y9 x12..21 z6..8. |
| `entryDoor()` | | E8 exactly: door pair, sidelights, fanlight row, quartz-pillar casing. |
| `carriageDoor(x0)` | opening x0..x0+2, y1..3, z13 | y1..2 `spruce_trapdoor` open=true facing=south half=bottom (panel flush with the north face; verify in render), y3 `glass_pane` (two rows of panels + a glazed top row). Header y4 `smooth_quartz` across the 3 cells. |
| `coachLight(x,z)` | outside a pier | `smooth_quartz_slab` type=top at (x,4,z) bracket, `lantern` hanging=true at (x,3,z). |
| `sweepStair()` | | E21 exactly. |
| `door(x,y,z,facing,hinge)` | | `birch_door` (interior) or `dark_oak_door` (exterior), lower y + upper y+1, open=false. |
| `shrub(x,z)` | on mulch | `azalea_leaves` persistent=true at y1 (stand-alone ball); a `flowering_azalea_leaves` one at each bed end. |
| `bed(x0,z0,x1,z1)` | planting bed | `podzol` y0 mulch over the box, shrubs at every other cell of the row next to the wall, `white_tulip`/`red_tulip` alternating in the outer row's gaps. |
| `youngTree(x,z)` | | `birch_log` y1..4; `birch_leaves` persistent=true: y4 the 8 cells around the trunk, y5 3x3, y6 plus (5 cells); `podzol` 3x3 at y0. |
| `lampPost(x,z)` | | `dark_oak_fence` y1..2, `lantern` y3 (standing). |
| `mailbox(x,z)` | | `stone_brick_wall` y1, `barrel` facing=north y2. |
| `deckRail(x0,z0,x1,z1,{gaps})` | | `spruce_fence` y2 on the deck's outer edge cells. |
| `hangLamp(x,y,z)` | | `iron_chain` at y, `lantern` hanging=true at y-1. |

## ROOMS (inner air boxes; floor = the y just below, ceiling the y just above)
| room | box [x0,y0,z0,x1,y1,z1] | floor | mood / key pieces | ways in | windows |
|---|---|---|---|---|---|
| Foyer (double height) | [13,2,10,20,8,17] (upper floor exists only at the gallery z15 x13..17 and the hall z16..17) | `polished_diorite` field with `smooth_quartz` 2x2 checker inlay x15..18 z12..15 (P1) | grand, bright, showy: chandelier from y9 at x16..17 z12, console table, big mirror (item_frame), urns/potted ferns; keep the stair and its foot clear | front door (16..17,2..3,9); office (12,2..3,15); dining cased opening (21,2..4,13..14); kitchen opening (15..18,2..4,18); stair up x18..20 z12..15 | fanlight + Palladian over the door, sidelights |
| Office (+ turret alcove) | [3,2,12,11,4,17] + alcove [3,2,8,6,4,11] | `oak_planks` | dark, bookish, "executive": desk facing the door, bookshelves walls, leather chair, reading chair in the turret | (12,2..3,15) from foyer | turret (4..5,2..4,7); front (8..9,2..4,11); west (2,2..3,13..14) |
| Dining room | [22,2,12,28,4,17] | `oak_planks` with `light_gray_carpet` rug under the table | formal: long table for 8, chandelier, sideboard/china cabinet | foyer (21,2..4,13..14); kitchen (23,2..3,18) | front (23..24,2..4,11),(26..27,2..4,11) |
| Family room | [3,2,19,13,4,24] | `oak_planks` | cosy, open: fireplace on the west wall (firebox in the wall at (2,2..3,21..22)), big TV (black panel) above or beside it, sectional sofa facing it, coffee table; open to the kitchen at x13|x14 (no wall) | open from kitchen; back French door is in the kitchen | back (5..6,2..4,25),(9..10,2..4,25) |
| Kitchen | [14,2,19,24,4,24] | `smooth_stone` (tile) | bright, white cabinets + dark counters: island 2x4 with stools facing the family room, sink under the back window, range + hood, fridge (iron), pantry | foyer (15..18,2..4,18); dining (23,2..3,18); mudroom (25,2..3,21); open to family; deck doors (16..17,2..3,25) | back (20..22,3..4,25) over the sink |
| Mudroom | [26,2,19,28,4,24] | `polished_andesite` | practical: bench, cubbies (barrels), coat hooks, washer | kitchen (25,2..3,21); garage (29,2..3,22); yard door (27,2..3,25) | none |
| Garage | [30,1,14,40,4,24] | `smooth_stone` y0 | 3 bays clear of the doors; shelves, workbench, bins along the back wall z24, a `stone_brick_stairs` step at (30,1,22) to the mudroom door (P6) | carriage doors z13; mudroom (29,2..3,22) | back (35..36,2..3,25) |
| Upper hall + gallery | [3,6,16,28,8,17] + gallery [13,6,15,17,8,15] | `oak_planks`, runner `white_carpet` | quiet landing: railing over the foyer, a bench, pictures, plant; keep 2-wide clear | stair top (18..20,5,15) | (sees out through the Palladian) |
| Bedroom 2 (+ turret) | [3,6,12,11,8,14] + alcove [3,6,8,6,8,11] | `oak_planks` + `light_gray_carpet` | teen room: bed, desk, window seat in the turret | (8,6..7,15) | turret (4..5,6..8,7); front (8..9,6..8,11); west (2,6..7,13..14) |
| Bedroom 3 | [22,6,12,28,8,14] | `oak_planks` + `white_carpet` | guest room: double bed, dresser, chair | (24,6..7,15) | front (23..24,6..8,11),(26..27,6..8,11) |
| Primary bedroom | [3,6,19,11,8,24] | `oak_planks` + `light_gray_carpet` | the "suite": king bed on the west wall, sitting area, TV, nightstands with lamps | hall (9,6..7,18); closet (12,6..7,22) | back (5..6,6..7,25),(9..10,6..7,25) |
| Walk-in closet | [13,6,19,15,8,24] | `oak_planks` | long, lined both sides with racks/drawers, island ottoman | bedroom (12,6..7,22); bath (16,6..7,22) | none |
| Primary bath | [17,6,19,21,8,24] | `white_concrete` | spa white: double vanity, soaking tub, glass shower, toilet | closet (16,6..7,22) | back high (19..20,7..8,25) |
| Bedroom 4 | [23,6,19,28,8,24] | `oak_planks` + `white_carpet` | kid's room: bunk/twin bed, toy chest, desk | (25,6..7,18) | back (25..26,6..7,25) |
| Bonus room | [30,6,14,40,8,24] | `oak_planks` | over the garage: media/game room: sofa, big TV, pool or ping-pong table, bean bags | hall (29,6..7,16) | front (31,6..7,13),(35,6..7,13),(39,6..7,13); east (41,6..7,17..18),(41,6..7,21..22); back (35..36,6..7,25) |
Stairs: only the foyer's sweeping stair (E21), floor y1 → upper floor y5, x18..20 z11..15. No attic stair (the attic is roof void).
Floor y5 is laid over x3..28 z11..24 (and turret x3..6 z8..11) EXCEPT the foyer void x13..20 z10..14 and the stair cells x18..20 z15 (stair blocks).
Ceiling y9 `smooth_quartz` over every room (house x3..28 z10..24, turret x3..6 z8..10, garage x30..40 z14..24).

## OPENINGS (P1 leaves every cell AIR)
Exterior (glass + shutters P4 unless noted):
| wall | openings (x,y,z) | kind |
|---|---|---|
| turret z7 | (4..5,2..4,7), (4..5,6..8,7) | archWindow |
| main front z11 | (8..9,2..4),(8..9,6..8),(23..24,2..4),(26..27,2..4),(23..24,6..8),(26..27,6..8); turret mouth (3..6,2..4) and (3..6,6..8) open into the turret (no glass) | archWindow |
| main front z11 | x13..20, y2..8 open (foyer runs into the projection) | open |
| entry z9 | door (16..17,2..3), sidelights (15,2..3),(18,2..3), fanlight row (15..18,4), Palladian (15..18,6..8) | P3 entryDoor, archHead |
| west x2 | (2,2..3,13..14),(2,6..7,13..14) windowRect; firebox (2,2..3,21..22) AIR (backed by chimney) | |
| back z25 | (5..6,2..4),(9..10,2..4) windowRect 3 tall; deck doors (16..17,2..3) P6; kitchen (20..22,3..4); mudroom door (27,2..3) P6; garage (35..36,2..3); upper (5..6,6..7),(9..10,6..7),(19..20,7..8),(25..26,6..7),(35..36,6..7) | |
| garage z13 | doors (30..32,1..3),(34..36,1..3),(38..40,1..3) P3; bonus (31,6..7),(35,6..7),(39,6..7) windowRect 1 wide | |
| garage x41 | (41,6..7,17..18),(41,6..7,21..22) windowRect | |
Interior (P6 fills with `birch_door` unless "cased"): ground y2..3: (12,_,15), (23,_,18), (25,_,21), (29,_,22) [`dark_oak_door`]; cased (no door) (21,2..4,13..14), (15..18,2..4,18).
Upper y6..7: (8,_,15), (24,_,15), (9,_,18), (25,_,18), (12,_,22), (16,_,22), (29,_,16).

## RESERVED (P1 leaves empty; a later part fills)
- Portico: every cell x11..22, y1..9, z4..8 (P3: floor, steps, columns, entablature).
- Firebox (2,2..3,21..22) (family designer: `campfire`).
- Garage stair cell (30,1,22) (P6).
- Window/door cells above; shutter and sill cells are outside the walls (air anyway).
- Foyer chandelier cells x15..18 y6..8 z11..13 stay air (foyer designer).
- Planting beds are ground (y0) cells outside the house: P5 replaces grass; P1 writes no ground outside the foundation.

## OUTDOOR
- Front beds (`bed`, mulch y0 + shrubs y1): turret front z6 x2..7; main front z10 x8..11 (west of the portico); main front z10 x23..28 (east of the portico); the portico covers x11..22, so beds stop at x11 and start at x23. Shrubs on each, tulips between.
- Walk: `bricks` x16..17 z2..3 (sidewalk to steps), x18..28 z3 (from the driveway). Lamp posts at (14,_,2) and (19,_,2), flanking the walk. Mailbox at (27,_,2) beside the drive.
- Young tree: trunk (6,_,4) on the west lawn; a second smaller `azalea` shrub cluster at (24,_,6).
- Garage: coach lights at x29,33,37,41 z12 (P3).
- Back: deck `spruce_planks` y1 x6..24 z26..30, rail on z30 and x6/x24 except steps (5,1,28..29) `spruce_stairs` facing=east; grill `smoker` facing=north (22,2,29); table (13,2..3,28) + 4 chairs; mudroom step `stone_brick_stairs` facing=north at (27,1,26).

## PARTS (each a 12-minute job; order = build order)
1. P1 `parts/shell.mjs` - MASSING AND SHELL: foundation y0; all exterior walls with wallCell (front/other), turret walls y1..11, entry projection, garage wing, quoins, every OPENING left air; partitions; floors y1/y5 per ROOMS (foyer void open); ceiling y9; sweepStair + gallery railing; chimney (E14). Ticks E1..E5, E12 walls, E14, E15 (reserve), E17 shell, E20, E21, E23 (no wall).
2. P2 `parts/roofs.mjs` - ROOFS: R-main (union hip, pediment, south dormers, keep boxes) then R-turret cone + finial; dry-run first. Ticks E10, E11, E12 cone, E13.
3. P3 `parts/entry.mjs` - ENTRY + GARAGE FRONT: portico floor, steps, 4 columns, entablature + ceiling, portico lanterns, entryDoor, Palladian, carriageDoor x3, headers, coachLights. Ticks E6..E9, E16, E38 (front).
4. P4 `parts/windows.mjs` - WINDOWS + SHUTTERS on all facades: archWindow on the fronts, windowRect elsewhere, sills, shutters. Ticks E17 windows, E18, E19.
5. P5 `parts/site.mjs` - SITE + DECK: road, sidewalk, driveway, walks, lawn, beds + shrubs, young tree, lamp posts, mailbox, back yard, deck. Ticks E30..E34, E36.
6. P6 `parts/finish.mjs` - DOORS + LIGHTS: interior doors, back deck doors, mudroom yard door + step, garage step + mudroom door, back sconces; final renders from the street (eye ~ (22,2,−2) look south), the 3/4 NE, and inside the foyer. Ticks E27, E35, E37, E38.

Checklist (workers tick):
- [ ] P1 shell  - [ ] P2 roofs  - [ ] P3 entry  - [ ] P4 windows  - [ ] P5 site  - [ ] P6 finish

## NOTES for workers
- Facing words: a door/shutter `facing` = the wall's outward side; stairs `facing` = the direction you walk to climb.
- Fronts are every NORTH face: turret z7 (+ chamfers), entry z9, main z11 (x2..12, x21..29), garage z13 piers. Only they get veneer + belt.
- Turret chamfers (2,8),(7,8) are wall cells; (2,7),(7,7) are lawn.
- The roof tool strips nothing outside its footprint but writes overhangs: run it once after P1; keep boxes protect the turret and chimney.
- Nothing walkable may be blocked: front door → foyer → every room; garage → mudroom; kitchen → deck.
- Room designers: floors, walls, ceilings, windows and doors are done; place furniture only into air, never in a doorway, a window cell
  or the stair; keep a 1-wide path from each door to the room's middle.

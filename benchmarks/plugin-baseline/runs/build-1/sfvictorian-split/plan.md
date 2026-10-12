# sfvictorian-split: plan (architect)

Italianate SF "painted lady": a tall flat-fronted row house on a 16 x 50 lot. The front is a false-front parapet over a deep bracketed cornice. A three-storey angled bay stands on a rusticated garage plinth. A stoop rises beside it to a recessed columned porch. The lot climbs from the street to a back garden that sits 2 higher than the street, so the garage storey is exposed at the front and buried at the back.

Axes: x = 0..15 along the street (W to E); z = 0 (street side, NORTH) .. 49 (back fence); y = 0 is the street/sidewalk surface (top of the ground). A "floor at y" means the slab block is at y and you stand at y+1.

## SITE

| item | x0..x1 | y0..y1 | z0..z1 | notes |
|---|---|---|---|---|
| sidewalk (inside lot line) | 0..15 | 0 | 0..1 | grey paving; the street itself is outside the lot (z<0) |
| front ground | 0..15 | 0 | 2..6 | grade y=0 (flat; the slope is front-to-back) |
| driveway apron | 3..6 | 0 | 0..3 | pale paving to the garage door |
| front garden bed W | 0..2 | 0 (soil) | 2..3 | tiny planting bed, plants at y=1 |
| front garden bed E | 7..10 | 0 (soil) | 2..3 | plants and a small shrub at y=1; also strip 9..9, z 4..6 |
| front garden bed by stoop | 14..15 | 0 (soil) | 2..6 | narrow bed against the east party line |
| iron fence (street line) | 0..2, 7..10, 14..15 | 1 | 2 | black iron bars on a 1-high stone curb at y=0; gaps at the drive (3..6) and the stoop (11..13) |
| garage plinth (bay base) | 1..8 | 0..3 | 4..6 | rusticated stone box, its top (y=4) is the bay's floor; its exposed top corners (1..2,z4),(1,z5),(7..8,z4),(8,z5) get a stone ledge slab at y=4 |
| angled bay (3 storeys) | rows: z4 x3..6; z5 x2..7; z6 x1..8 | 4..16 | 4..6 | wall cells: face z=4 x3..6; diagonals (2,5),(7,5),(1,6),(8,6); open to the room behind at z=7 |
| stoop (front steps) | 11..13 | 1..4 | 2..6 | stair blocks rising south: tread tops z2 y1, z3 y2, z4 y3, z5 y4; landing z6 at y4; solid fill underneath |
| stoop cheek walls | 10 and 14 | 1..4 (stepping with the treads) | 2..6 | stone cheeks, iron handrail on top (y = tread+1) |
| recessed entry porch | 10..14 | floor 4, void 5..8, ceiling 9 | 7..9 | open front at z=7 between the columns; entry door in the back wall at z=10 |
| main body | 0..15 | 0..17 | 7..30 | 24 deep; party walls x=0 and x=15 are full height and blank |
| west chimney stack | 0..2 | 18..19 | 12..13 | brick stack on the party wall over the parlour fireplace |
| rear deck | 1..14 | top 4 | 31..35 | timber deck at the main floor level; posts at (1,35),(7,35),(14,35),(1,31),(14,31) y=3; railing y=5 on z=35 and x=1/x=14 sides, gap x=6..8 at z=35 for the steps |
| deck steps | 6..8 | 3 | 36 | one tread down to the garden (grade y=2) |
| back grade | 0..15 | 0..2 (top y=2) | 31..43 | lawn with a gravel path x7..8 from the steps to z=43 |
| retaining step | 0..15 | 3 | 44 | stone kerb; the upper garden is at grade y=3 for z=45..48 |
| upper garden | 0..15 | top 3 | 45..48 | raised vegetable beds x1..4 and x11..14, z45..47; a tree trunk at (12,4..7,41) with a canopy r=3 at y 7..10 |
| side garden beds | 1..2 and 13..14 | top 3 (raised) | 37..43 | flower borders along the fences |
| back and side fences | x=0 & x=15 for z31..49; z=49 for x0..15 | 3..5 (from grade) | as given | weathered timber board fence, 2 high above grade |

## ROOFS

| roof | form | levels | how it meets | built by |
|---|---|---|---|---|
| main body | flat (tar/gravel deck), hidden behind parapets; no `$MCD roof` preset suits an SF false front. `--style flat-parapet` over rect x0..15, z7..30 at y=17 is acceptable for the deck only | deck y=17; side parapets on the party walls x=0/x=15 at y=18; rear parapet z=30 at y=18 with a plain 1-proud cornice at y=17 (z=31) | the front false-front wall and its cornice are separate and taller, so the deck is invisible from the street | roof part (deck + side/rear parapets); FRONT done by hand (see FACADES) |
| bay cap | flat lid at y=17 over the bay rows, under the bay's wrapping cornice | y=17 | the bay cornice runs into the main cornice at z=6/7 so the two cornices read as one bracketed line | by hand, with the front cornice |
| porch ceiling | flat, coffered ceiling at y=9 (the storey-2 floor above) | y=9 | not visible as a roof | shell |
| chimney | brick stack x0..2 z12..13 y=18..19, cap slab y=20 (stone) | | rises from the west party wall | roof part |
| skylight | glass in the deck x6..9, z15..17, y=17 | | lights the top-floor room | roof part leaves it as an opening |

Why flat: real SF Italianates hide a low roof behind a false front. The sky line is the parapet and cornice, not a pitch. No pitched roof should show above y=19.

## FACADES

### North (street) face: the showpiece. Painted lady in four colours
Material roles: BODY = painted horizontal siding (a mid sage/teal). TRIM = cream/white (cornices, window casings, columns, corner boards). ACCENT 1 = deep plum/maroon (brackets, sash frames, door, spandrel panels). ACCENT 2 = gold/ochre (fish-scale shingles, small dentils, pediment tympana). BASE = grey rusticated stone. Iron = black.

| band (y) | what | depth |
|---|---|---|
| 0..3 | garage plinth x1..8 z=4, rusticated grey stone, a trim string at y=3 | flush at z=4; string course y=3 proud +1 (z=3) |
| 0..3 | front wall z=7 x9..15 behind the stoop: stone base | flush |
| 4 | stone ledge on the plinth's top corners; a water-table string course across z=7 x9..15 | +1 |
| 5..8 | storey 1 (parlour): bay windows; porch columns | see OPENINGS |
| 9 | floor line: bay spandrel band of plum panels with a cream moulding at y=9 on all bay faces; porch entablature at y=9 x10..14, z=6 | spandrels flush; mouldings and entablature +1 |
| 10..12 | storey 2: bay windows, a window pair over the porch | |
| 13 | floor line: fish-scale shingle spandrel band (gold) on the bay; a cream string course across z=7 x9..15 | string +1 |
| 14..15 | storey 3: shorter bay windows, pair over the porch | |
| 16 | frieze: fish-scale shingle panel (gold) between paired plum BRACKETS | brackets +1 (z=6 on main wall, outside each bay face) |
| 17 | main CORNICE, cream, full width x0..15 at z=6 and wrapped around the bay (z=3 face x2..7, diagonals offset 1), with dentils in plum on the underside | +1 (+2 on the bay front: z=3 stair-block overhang over the slab) |
| 18 | false-front PARAPET wall x0..15 at z=7 (body colour), cream coping slab on top | flush, coping +1 |
| 19 | centre PEDIMENT x6..9 at z=7: raised stepped/curved crest with a gold tympanum and cream rim; small ball finials at (0,19,7) and (15,19,7) | crest flush, finials on the parapet corners |

Bay detailing: cream corner boards at every bay angle (x3,x6 at z=4; diagonals), y=4..16, flush or +1. Siding between windows in BODY. The diagonal wall cells carry their own single windows.
Main wall corner boards: cream pilaster strips x=0 and x=15 at z=6, y=4..16, +1 proud, with a block capital at y=16 under the cornice.
Porch: two cream COLUMNS at (10,5..8,7) and (14,5..8,7) with a base block at y=5 and a capital at y=8. Entablature y=9 z=6..7 x10..14 with a small gold pediment over the entry at x11..13 y=10, z=6 (+1, below the storey-2 window sill). Porch inner walls are BODY siding with a cream wainscot. The ceiling is plum-panelled.
Garage door: a plum panelled door x3..6 in the plinth, under a cream lintel at y=4 (the ledge).

### East and west faces (party walls x=0, x=15)
Blank, full height y0..18, z7..30. Material: plain brick or stucco (a party wall, not painted siding) so the painted front reads as a mask, the SF look. The front cornice returns 1 cell onto each party wall at z=7..8, y=16..17. No openings.

### South face (rear wall z=30): plainer, painted
BODY siding (same colour) over a stone base y0..3 (mostly buried: grade at y=2). Cream window casings, a simple 1-proud cream cornice at y=17 and the parapet at y=18. Window hoods are flat cream slabs (+1), with no pediments: the rear is for living, not show.

## OPENINGS
All are left as air by the part that builds the wall. Glass/sashes/doors are added later into the air.

| face | opening | x | y | z | size (w x h) |
|---|---|---|---|---|---|
| N plinth | garage door | 3..6 | 1..3 | 4 | 4 x 3 |
| N porch | porch mouth between columns | 11..13 | 5..8 | 7 | 3 x 4 (open) |
| N porch back wall | entry door, single wide door + transom | 11..12 | 5..7 door, 8 transom | 10 | 2 x 3 + 2 x 1 transom |
| N bay face, S1 | pair of tall double-hung | 4..5 | 5..7 | 4 | 2 x 3 |
| N bay diagonals, S1 | single tall windows | 2 and 7 | 5..7 | 5 | 1 x 3 each |
| N bay diagonals, S1 | single tall windows | 1 and 8 | 5..7 | 6 | 1 x 3 each |
| N bay face, S2 | pair | 4..5 | 10..12 | 4 | 2 x 3 |
| N bay diagonals, S2 | singles | (2,z5),(7,z5),(1,z6),(8,z6) | 10..12 | | 1 x 3 |
| N over porch, S2 | pair | 11..12 | 10..12 | 7 | 2 x 3 |
| N bay face, S3 | pair | 4..5 | 14..15 | 4 | 2 x 2 |
| N bay diagonals, S3 | singles | (2,z5),(7,z5),(1,z6),(8,z6) | 14..15 | | 1 x 2 |
| N over porch, S3 | pair | 11..12 | 14..15 | 7 | 2 x 2 |
| S rear, S1 | kitchen French doors to the deck | 7..8 | 5..7 | 30 | 2 x 3 |
| S rear, S1 | windows | 3..4 and 11..12 | 6..7 | 30 | 2 x 2 each (over the counter) |
| S rear, S2 | windows | 3..4 and 11..12 | 10..12 | 30 | 2 x 3 each |
| S rear, S3 | windows | 3..4 and 11..12 | 14..15 | 30 | 2 x 2 each |
| S rear, garage level | small window above grade | 3..4 | 3 | 30 | 2 x 1 |
| roof | skylight | 6..9 | 17 | 15..17 | 4 x 3 |

Window ornament positions (later parts ADD these into air outside the wall, so nothing here is carved):
- Pediment hoods: plum/cream triangular hoods on stair blocks, one cell above each front window head (y=8, 13, 16), +1 proud (z=3 on the bay face, z=6 over the porch). On storey 3 the hood is a flat cream slab at y=16, between the brackets.
- Sills: cream slab +1 under each front window (y=4, 9, 13).
- Casings: cream trim +1 on both sides of each front pair and bay single, where there is room. On the bay diagonals use a sill and hood only.

## RESERVED
The shell leaves these cells EMPTY (air). The named later part fills them.

| reserved for | cells | why |
|---|---|---|
| porch columns | (10,5..8,7), (14,5..8,7) | column part (base/shaft/capital); the shell's front wall z=7 stops at y=4 here and resumes at y=9 |
| corner pilasters | x=0 and x=15, z=6, y=4..16 | proud pilaster boards on the wall face |
| brackets / cornice / parapet crest | z=6 x0..15 y16..17; bay outer ring at offset 1 (z=3 x2..7; (1,4),(8,4),(0,5),(9,5)) y16..17; (6..9,19,7) and finials (0,19,7),(15,19,7) | cornice part |
| stoop | x10..14, y1..4, z2..6 | stoop part (treads, cheeks, iron rail) |
| main staircase (entry hall, along the E party wall) | well x13..14, z11..16: the storey-2 floor slab y=9 is left open over z11..16; the stair rises from main floor (stand y5 at z11) to storey 2 (stand y10 at z17) | interior stair part |
| upper staircase | well x13..14, z18..22: the slab y=13 is left open over z18..22; rises from stand y10 at z18 to stand y14 at z23 | interior stair part |
| garage-level stair | well x13..14, z25..28: the slab y=4 is left open over z25..28; rises from stand y1 at z25 to stand y5 at z29 | interior stair part |
| parlour + front bedroom fireplaces (chimney breast) | x=1, z11..13, y5..16 (breast cells against the W party wall); flue continues to the stack x0..2 z12..13 y18..19 | fireplace part (hearths at y=4/y=9 front of the breast x=2 z11..13 stay floor) |
| deck posts | (1,31),(14,31),(1,35),(7,35),(14,35) at y=3 | deck part stands posts on grade |
| tree | trunk (12,3..7,41), canopy sphere r=3 centre (12,9,41) | garden part |
| raised beds | x1..4 & x11..14, z45..47, y=4 (soil at y=3 kept by shell/grade) | garden part |

## FLOORS

| storey | floor slab y | stand y | clear air | ceiling slab | spaces (x0..x1, z0..z1) |
|---|---|---|---|---|---|
| G (garage level) | 0 | 1 | 1..3 | 4 | garage x1..8 z4..20 (car + bikes); laundry/workshop x9..14 z11..24; store x1..12 z21..29; the stair up x13..14 z25..28. Solid under the porch x10..14 z7..10 |
| 1 (main) | 4 | 5 | 5..8 | 9 | entry porch x10..14 z7..9 (outside); ENTRY HALL x10..14 z10..23 with the long staircase x13..14 z11..16 along the E party wall; FRONT PARLOUR x1..9 z7..16 + bay (z4..6) with the fireplace on the W wall z11..13; DINING x1..9 z17..23; KITCHEN x1..14 z24..29, French doors at z=30 to the deck |
| 2 (bedrooms) | 9 | 10 | 10..12 | 13 | FRONT BEDROOM x1..9 z7..16 + bay, fireplace W wall; small dressing/study over the porch x10..14 z8..10; LANDING x10..12 z11..23; BATHROOM x1..9 z17..22 (clawfoot tub against the W wall); BACK BEDROOM x1..14 z23..29 (the stair arrives at x13..14 z23) |
| 3 (top floor, under the roof) | 13 | 14 | 14..16 | 17 (roof deck) | TOP ROOM x1..12 z7..22 + bay (studio/den under the skylight z15..17), fireplace breast continues; box room x1..14 z23..29 |
| roof | 17 | — | — | — | flat deck, parapets y=18, pediment y=19, chimney to y=20 |

Interior volumes: body interior x1..14, z8..29 (the front wall is z=7, the rear wall z=30, the party walls x=0/x=15). The bay adds rows z4..6 to the front room of storeys 1–3. Interior partitions are the room designer's, on the lines above (x=9/10 hall wall, z=16/17, z=23/24).


---
# DESIGNER SECTIONS

## PALETTE
All ids checked with `mcd blocks --check` (all known; `polished_andesite_wall` is not a block, so none is used).

| role | block | variants needed |
|---|---|---|
| BODY siding (sage-teal) | cyan_terracotta | full block only |
| TRIM (cream/white) | smooth_quartz | smooth_quartz_stairs, smooth_quartz_slab, quartz_pillar (corner boards, shafts) |
| PLUM (accent 1) | purple_terracotta (spandrels) | crimson_planks, crimson_stairs, crimson_slab, crimson_trapdoor, crimson_door, crimson_fence (brackets, door, panels) |
| GOLD (accent 2) | yellow_terracotta + orange_terracotta | full blocks (fish scale, tympanum) |
| BASE stone | stone_bricks | stone_brick_stairs, stone_brick_slab, stone_brick_wall, andesite, chiseled_stone_bricks, cobblestone |
| party walls | bricks | brick_stairs, brick_slab, brick_wall |
| iron | iron_bars | (fence, handrail, garage-door slits) |
| glass | glass_pane, glass (skylight) | white_stained_glass_pane for transoms |
| paving | light_gray_concrete (sidewalk, drive), gravel (path), stone_bricks (curb) | |
| ground | grass_block, dirt, coarse_dirt, farmland, moss_block | |
| timber (deck, fences) | spruce_planks | spruce_slab, spruce_stairs, spruce_fence, spruce_fence_gate, spruce_trapdoor |
| trees/plants | oak_log, oak_leaves (persistent=true), flowering_azalea, azalea_leaves, short_grass, fern, red_tulip, poppy, allium, azure_bluet, lilac, rose_bush, peony | |
| light | lantern, wall_torch, candle, glowstone (hidden), end_rod (finial) | |
| roof deck | stone_slab, gravel | deck y17; parapet BODY |
| interior floors | oak_planks (parlour, dining), spruce_planks (bedrooms), dark_oak_planks (hall), stone_bricks (kitchen/garage), birch_planks (top room) | each with stairs/slab |
| interior decor | bookshelf, furnace, smoker, blast_furnace, crafting_table, barrel, chest, cauldron, white_bed, red_bed, red_carpet, purple_carpet, white_carpet, lectern, anvil, flower_pot, item_frame, bell, white_wool, dark_oak_fence/trapdoor/door, birch_stairs, grindstone, composter | for the room designers |

## VOCABULARY
(Facing: front is NORTH. A cornice/bracket "lip toward the street" = `half:top`, facing = south, into the wall. A stair facing `east` has its high back on the east.)

- **siding(x,y,z)**: plain `cyan_terracotta` (calm body, so the trim and ornament carry the look).
- **rusticated(box)**: fill `stone_bricks`; on odd y, every other x (x odd) `andesite`; string course y=3 `chiseled_stone_bricks`.
- **fishscale(x0,x1,y0,z)**: two rows y0,y0+1; row y0 `yellow_terracotta` with `orange_terracotta` at every 2nd x; row y0+1 offset by one (orange where row y0 is yellow).
- **spandrel(x0,x1,y,z)**: `purple_terracotta` row at y, with a `smooth_quartz_slab type=bottom` moulding at (x,y,z-1) (proud 1).
- **window(x0,x1,y0,y1,z,face)**: fill the opening with `glass_pane`; casing: `smooth_quartz` (x0-1 and x1+1, y0..y1, z-1 proud; skip where the neighbour is another window's casing or a corner board); `sill(x0..x1,y0-1,z-1)` = `smooth_quartz_slab type=top`; hood (see below). For rear windows: flat `smooth_quartz_slab type=bottom` hood at y1+1, z+1 (proud), no casing.
- **hoodPair(x0,x1,y,z-1)**: (x0,y) `crimson_stairs facing=east half=bottom`, (x1,y) `crimson_stairs facing=west half=bottom` (ridge in the middle), with `smooth_quartz_slab type=bottom` at (x0-1,y) and (x1+1,y) as cream eaves. On a bay diagonal a hood is a single `smooth_quartz_slab type=bottom`.
- **hoodSingle(x,y,z-1)**: single hood = one `smooth_quartz_slab type=bottom` one cell above the window head.
- **cornerBoard(x,z,y0,y1)**: `quartz_pillar axis=y`, replacing the wall block.
- **bracket(x,z,y=16)**: `crimson_stairs half=top facing=south` (north cell z at y16; lip toward the street) plus a `crimson_slab type=top` at the cell directly behind it when free.
- **dentils(x0,x1,z,y=16)**: `crimson_trapdoor half=top open=false facing=south` at every cell between brackets.
- **cornice(cells)**: y17, `smooth_quartz_stairs half=top facing=south` (facing = into the wall, for the bay: toward the bay); corner cells of the ring use `smooth_quartz` block.
- **parapet(x0..x15)**: y18 at z=7 `cyan_terracotta`; coping `smooth_quartz_slab type=bottom` at y19, z6 and z7, skipping x6..9 and the corner finial cells.
- **pediment(6..9)**: y19 z7: x6 `smooth_quartz_stairs facing=east`, x7,x8 `yellow_terracotta`, x9 `smooth_quartz_stairs facing=west`; y20 x7..8 `smooth_quartz_slab type=bottom`.
- **finial(x)**: (x,19,7) `smooth_quartz`; (x,20,7) `end_rod facing=up`.
- **column(x,z=7)**: y5 `smooth_quartz_slab type=bottom`; y6..7 `quartz_pillar axis=y`; y8 `smooth_quartz_stairs half=top facing=south`.
- **porchWainscot**: `smooth_quartz_slab type=bottom` on the porch side walls at y5, z8..9.
- **entryDoor**: two `crimson_door` (facing=north) at (11,5,10),(12,5,10), the second with `hinge=right`; `glass_pane` transom at (11..12,8,10); `smooth_quartz` casing x=10 and x=13, y5..8.
- **garageDoor**: fill x3..6 y1..3 z=4 `crimson_planks`; panels: `crimson_trapdoor facing=north open=false half=bottom` on the outer face (z=3) at x3,x5 for y1,y3 etc. (alternating); lintel `smooth_quartz_slab` at (3..6,4,3).
- **stoop**: stair blocks `stone_brick_stairs facing=south half=bottom` at (11..13, y, z) with (y,z) = (1,2),(2,3),(3,4),(4,5); `stone_bricks` fill below each; landing (11..13,4,6); cheeks x=10, 14: `stone_bricks` at z2..6 up to tread-block height (y1,y2,y3,y4,y4); handrail `iron_bars` one above.
- **bayWall(storey y0..y1)**: face z=4 x3..6; diagonals (2,5),(7,5),(1,6),(8,6): `siding` from y0 to y1, spandrel and fishscale bands, window openings left air.
- **ironFence(x0..x1,z=2)**: `stone_bricks` at y0 (curb), `iron_bars` at y1; `stone_brick_wall` post every 3rd cell instead of bars.
- **flowerBed(box)**: `dirt` at y0, flowers at y1 (rotate red_tulip, poppy, allium, azure_bluet, lilac tall); 1 `flowering_azalea` shrub.
- **deck**: posts `spruce_fence` y3 (cells in plan); deck `spruce_planks` y4; fascia `spruce_stairs half=top`; railing `spruce_fence` y5 (bare fence).
- **tree**: `oak_log axis=y` y3..7; leaves sphere r=3 at (12,9,41), skip cells that are trunk, vary the edge.
- **chimney**: `bricks` x0..2 z12..13 y18..19, cap `stone_brick_slab type=top` y20, pots `brick_wall` (1,21,12),(1,21,13).
- **skylight**: opening x6..9 z15..17 y17: `glass`; curb `smooth_quartz_slab type=bottom` y18 around.
- **window ornaments summary** per plan FACADES: pediment hoods y8,13,16; sills y4,9,13.

## ROOMS
Interior partitions (P1) are 1 thick `white_terracotta`: x=9 (z8..29, y5..8, 10..12, 14..16), z=16 (x1..8, storeys 1,2), z=23 (x1..14, all three storeys), z=10 (x10..14, storeys 1,2), z=20 (ground, x0..15 interior). Storey 3: wall z=23 x1..14, x=13..14 solid z7..17, x=12 none. Floors: main hall dark_oak_planks, parlour/dining oak_planks, kitchen stone_bricks, bedrooms spruce_planks, top room birch_planks, ground stone_bricks.
Note for the shell worker: the entry hall begins at z=11 (the door is IN the wall at z=10); the study over the porch is z8..9 (wall z=10); dining z17..22; kitchen z24..29 (wall z=23).

Stairs (`spruce_stairs half=bottom facing=south`; built by the owning room's designer): cellar stair (13..14, y=z-25, z26..29, y1..4); main stair (13..14, y=5+(z-12), z12..16, y5..9), top lands at stand (z17,y10); upper stair (13..14, y=10+(z-19), z19..22, y10..13), lands at stand (z23,y14). Slab holes: y4 over x13..14 z25..28; y9 over x13..14 z11..16; y13 over x13..14 z18..22 (P1 leaves these empty). Railings around the holes: `dark_oak_fence` by the room designer.

(See the returned `rooms` list for each box: Garage, Laundry, Cellar store, Cellar stair, Entry hall, Parlour, Parlour bay, Dining, Kitchen, Front bedroom, Bedroom bay, Study, Landing, Bathroom, Back bedroom, Top room, Top bay, Box room.)

| room | inner box | floor | notes |
|---|---|---|---|
| Garage | 2,1,5 → 7,3,19 | stone_bricks | garage door z=4; x1,x8 also air for z7..19 |
| Laundry/workshop | 10,1,11 → 14,3,19 | stone_bricks | doorway (9,1..2,13) W; (11,1..2,20) S |
| Cellar store | 1,1,21 → 12,3,29 | stone_bricks | doorways (4,1..2,20),(11,1..2,20); open E to the cellar stair |
| Cellar stair | 13,1,25 → 14,3,28 | stone_bricks | stair blocks z26..29 |
| Entry hall | 10,5,11 → 14,8,22 | dark_oak_planks | door (11..12,5..7,10) |
| Parlour | 1,5,7 → 8,8,15 | oak_planks | doorway (9,5..6,12) to hall, (4..5,5..6,16) to dining |
| Parlour bay | 3,5,5 → 6,8,6 | oak_planks | + (2..7,5..8,6) |
| Dining | 1,5,17 → 8,8,22 | oak_planks | (9,5..6,19), (4..5,5..6,23) |
| Kitchen | 1,5,24 → 14,8,29 | stone_bricks | (11,5..6,23) from hall; French doors (7..8,5..7,30) |
| Front bedroom | 1,10,7 → 8,12,15 | spruce_planks | (9,10..11,12) |
| Bedroom bay | 3,10,5 → 6,12,6 | spruce_planks | |
| Study | 10,10,8 → 14,12,9 | spruce_planks | (11,10..11,10) |
| Landing | 10,10,11 → 14,12,22 | dark_oak_planks | stair arrives (13..14,10,17) |
| Bathroom | 1,10,17 → 8,12,22 | stone_bricks | (9,10..11,19) |
| Back bedroom | 1,10,24 → 14,12,29 | spruce_planks | (11,10..11,23) |
| Top room | 1,14,7 → 12,16,22 | birch_planks | stair head x13..14 z18..22 open on its E |
| Top bay | 3,14,5 → 6,16,6 | birch_planks | |
| Box room | 1,14,23 → 14,16,29 | birch_planks | stair arrives (13..14,14,23); (6,14..15,23) to top room |

## PARTS
1. **parts/shell.mjs, shell, floors, stairs-holes, partitions.** Ground base (grade y0 and y≤2 behind, sidewalk), party walls `bricks` x0/x15 z7..30 y0..18, front wall z=7 (`siding`, stone base y0..3) leaving porch x10..14 z7 y5..8 and window/door air, rear wall z=30 (stone y0..3, `siding` y4..17, parapet y18), slabs y0/4/9/13/17 with the three stair holes and skylight x6..9 z15..17, partitions per ROOMS, ceiling, every OPENING as air. Ticks 1,14,20,24.
2. **parts/front.mjs, plinth, bay, porch, stoop.** `rusticated` plinth with garage-door air, bay walls y4..16 with spandrels/fishscale at y9/y13, corner boards, bay floors/lid, porch floor/ceiling/side walls, `stoop` with cheeks and rails. Ticks 3,4,7,11(y13),21.
3. **parts/roofs.mjs, roof deck & rooflines.** Deck y17 (`stone_slab`/gravel) with parapets y18 on party walls and rear, the front false-front parapet y18 + coping, `cornice` courses (main + bay ring + returns), `pediment`, `finial`, `chimney`, skylight curb, rear cornice. Ticks 9 (courses), 10, 18, 19.
4. **parts/openings.mjs, glazing & window dressing.** `window` (panes, casing, sill, hoods), `entryDoor`, `garageDoor`, rear French doors and windows, transoms, skylight glass. Ticks 2, 6, 8, 19, 20.
5. **parts/ornament.mjs, ornament.** `bracket`+`dentils`, y16 `fishscale` frieze, `cornerBoard` pilasters at x0/x15 z6 y4..16 (capital `smooth_quartz` y16), `column`s, `porchWainscot`, gold porch pediment (x11..13,10,6), lanterns. Ticks 5, 9, 11, 22.
6. **parts/site.mjs, site and gardens.** Sidewalk, drive, `flowerBed`s, `ironFence`, `deck` with steps, lawn, gravel path, retaining step, upper garden beds, `tree`, board fences. Ticks 13, 15, 16, 17.

- [x] P1 shell  - [ ] P2 front  - [ ] P3 roofs  - [ ] P4 openings  - [ ] P5 ornament  - [ ] P6 site

## NOTES for workers
- Never write into a reserved cell or into air a prior part left (runParts refuses). P1 leaves: openings, porch mouth, column cells, pilaster/cornice/bracket cells, stair holes, skylight.
- Plan coordinates only; the cheek wins at (10,1,2),(14,1,2) over the fence. Mind the +1 proud cells: z=3 on the bay, z=6 main wall.
- Front is NORTH. Stairs `facing` = side of the high back. Cornice lips: half=top, facing=south.
- Render the north elevation after each part and look; keep the roof flat, nothing above y=20 except the chimney pots (y21).
- P1 (shell) notes: party walls are bricks y0..18 (the y18 parapet cells are brick already), so P3's side parapets and the chimney's x0 cells at y18 are refused as same-block writes. Partitions are `smooth_quartz` (white_terracotta is not on palette.json). Left to P2: porch floor y4 x10..14 z7..9 and porch side wall x9 z8..9 (P1 keeps those cells clear). Left to P4: entry casings at x10 and x13 y5..8 z10 (P1 keeps them air). Study doorway (11,10..11,10) is air. Ground partition at x=9 (laundry doorway (9,1..2,13)) is not built: plan gives no ground x=9 line. Floors use the ROOMS materials per box; deck is `gravel` y17 over x1..14 z8..29 with the skylight air. The make.sh roof preset then replaces the y17 deck (removes 420 blocks); that is the roof step's call, not P1's.

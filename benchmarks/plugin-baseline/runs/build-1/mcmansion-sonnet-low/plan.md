# plan.md — suburban McMansion (front NORTH z0; x 0..43; z 0..31; y 0..14). plan.md overrides elements.md where they differ.

Levels: lawn top y0. Main floor blocks y1 (walk y2..5), floor-2 blocks y6 (walk y7..9), wall plate y10, roof y11..14. Garage floor blocks y0 (walk y1..5, ceiling/bonus floor y6). Ridge max y14. Chimney max y14.
All walls 1 thick, coordinates are the wall cells themselves (outer boxes). Interior air = box inset by 1.

## SITE
| mass | outer box x0..x1,y0..y1,z0..z1 | notes |
|---|---|---|
| Lawn | 0..43, 0..0, 0..31 | grass_block |
| Driveway | 1..16, 0, 0..4 (plus 0..17 at z0..1) | gray_concrete |
| Garage wing G | 0..18, 0..10, 5..22 | 3 doors on z5; hip roof; bonus room above |
| Main block M | 18..43, 1..10, 7..28 | 2 storeys; hip roof with deck y13 |
| Entry E (portico + gable) | 26..35, 1..13, 4..9 (portico z4..6, front wall z7) | gable ridge y14 along z, z4..9 |
| Turret bay B | 37..41, 1..9, 4..7 | cone roof y10..14, opens into M at z7 x38..40 |
| Deck | 30..42, 1, 29..31 | rail y2 |
| Path | 30..31, 0, 0..2; steps x28..33 z3 y1 | |
| Tree | x8 z2 | young |
Plinth: cobblestone y0 under all wall perimeters of G, M, E, B (shell). Floor y1 of M/E/B: spruce_planks (rooms override). Garage floor y0 polished_andesite. Floor 2 y6: oak_planks over M interior except foyer void; over garage interior (bonus floor).

### ROOFS (preset chosen by building type = house → `cottage`/hip; all in deepslate_tile)
Try `$MCD roof` first: `--preset cottage --material deepslate_tile` for gables, `--style hip` for the hips; if guards refuse (ROOF_TOO_TALL), build by hand with roofHip below. Roofs are shells (surface only), undersides left air (attic).
- roofHip(G): footprint x0..18 z5..22. y11 ring stairs at inset0 facing outward-low, y12 ring inset1, y13 deck deepslate_tiles inset≥2 (x2..16 z7..20). Bonus front gable over x6..12: skip (hip only).
- roofHip(M): footprint x18..43 z7..28: y11 ring inset0, y12 inset1, y13 deck x20..41 z9..26 (deepslate_tiles). Overlap with G at x18: G's ring wins at x≤18, M's from x19.
- roofGable(E): x26..35, z4..9: y10 stairs x26,x35 (facing outward), y11 x27,x34, y12 x28,x33, y13 x29,x32, y14 x30,x31 (full deepslate_tiles ridge, 2 wide). Pediment infill (white_concrete) at z4 plane: y10 x27..34, y11 x28..33, y12 x29..32, y13 x30..31. Rear end z9: fill rows y10..y13 same triangle at z9 where above M deck y13 only y14 → nothing needed; fill the triangle where air below y13 leaves gap: treat z8..9 as part of M roof (deck level y13 already). Raking trim: smooth_quartz_stairs on top of edge at z4.
- roofCone(B): footprint x37..41 z4..7 (5x4): y10 ring deepslate_tile_stairs on the footprint rectangle, y11 ring x38..40 z5..6 (3x2), y12 x39..40 z5..6, y13 x39 z5 / x40 z6? simplify: y13 one block x39 z5, y14 lightning_rod at x39 z5 (rod counts to y14). Fill under with deepslate_tiles where needed.
- Dormers: see vocab.

## PALETTE (all ids checked with `mcd blocks --check`; unknown ones replaced: beige_concrete→birch_planks, chain→iron_chain)
| role | block | variants |
|---|---|---|
| stone veneer lower front y1..3 | stone_bricks | stone_brick_stairs, stone_brick_slab, stone_brick_wall; accents chiseled_stone_bricks |
| plinth | cobblestone | |
| beige siding | birch_planks | birch_stairs, birch_slab, birch_fence |
| white trim / quoins / columns / pediment | smooth_quartz, white_concrete, quartz_pillar | smooth_quartz_stairs, smooth_quartz_slab |
| roof asphalt | deepslate_tiles | deepslate_tile_stairs, deepslate_tile_slab, deepslate_tile_wall |
| shutters | iron_trapdoor (open=true) | dark_oak_trapdoor for garage panels |
| windows | glass_pane | white_stained_glass_pane for fanlight bars; glass for the bay |
| doors | dark_oak_door (front, double), spruce_door interior, birch_door | |
| garage door | spruce_planks, spruce_trapdoor, glass_pane, spruce_fence | |
| driveway | gray_concrete | polished_andesite_slab joints |
| path | polished_andesite | |
| lawn | grass_block | |
| shrubs | oak_leaves, flowering_azalea_leaves | |
| tree | oak_log, oak_leaves | oak_fence stake |
| deck | spruce_planks, spruce_stairs | spruce_fence, spruce_slab |
| interior floors | spruce_planks (main), oak_planks (upper), polished_andesite (garage) | |
| lights | lantern, iron_chain, end_rod | |
| beds/flowers | rose_bush, peony, lilac, allium, cornflower | |

## VOCABULARY (helpers in a shared vocab.mjs; all take integer cells)
- wallSiding(box): birch_planks; bottom shadow row y6 outside = birch_slab half=top? no: keep full blocks; at y10 a cornice row smooth_quartz_slab half=top on the outer face is not placeable (walls 1 thick) so cornice = y10 smooth_quartz wall course.
- wallStone(box): stone_bricks, every 7th block chiseled_stone_bricks; capped at y4 on front faces (z5, z7 of M/B) with stone_brick_stairs half=top facing outward? use stone_brick_slab half=top.
- quoin(x,z): outer corner column of G, M, B at x0,x18? (x0,z5),(x18,z5),(x0,z22),(x43,z7),(x43,z28),(x18,z28)-ish: for y=1..10 alternate smooth_quartz (even y) / siding (odd y).
- archWindow(face, xc, y0, z, facing): 3 wide (xc-1..xc+1) × 3 tall (y0..y0+2) opening left by the shell. Fill: glass_pane all 9 cells, except the two top corners (xc±1, y0+2): smooth_quartz_stairs half=top facing toward the window centre (cut off the corner = arch). Frame: smooth_quartz on the wall ring cells outside the opening (done by facade). Sill: smooth_quartz_slab half=top just below on the outer plane only where wall is open air — otherwise skipped.
- shutters(face, xc, y0, z): iron_trapdoor open=true half=bottom, facing = outward, one per window row (3 tall) at x=xc-2 and xc+2, in the OUTER air cell (z-1 for north face); each is 1 wide × 3 tall stacked.
- carriageDoor(x,z=5): opening x..x+3 y1..4 (left empty by shell). Fill: y1..3 spruce_planks, with spruce_trapdoor (open=false, half=bottom, facing north) layered on outer face z4 at y1..2 (x and x+3) and y3 (x+1..x+2) as raised panels; y4 row: glass_pane ×4 (4 windows). Framed by smooth_quartz at y5 header (shell) and white jamb is shell.
- carriageLamp(x,z=4): spruce_fence at (x,y3..4? ) y1..3, lantern (hanging=false) on top y4. At x=1,6,11,16 (between doors, centred between x5/x7 =6, x10/x12=11).
- column(x,z): quartz_pillar axis=y y2..8, smooth_quartz_slab half=bottom? base smooth_quartz_stairs? base: smooth_quartz_slab half=bottom at y2 and capital smooth_quartz_slab half=top at y8? Simple: base smooth_quartz at y1, quartz_pillar y2..8, capital smooth_quartz_stairs ×… capital smooth_quartz at y9 as entablature beam along x26..35 at z4 y9.
- doorDouble(x=30,31,z=7): dark_oak_door hinge=left at x30 facing north, hinge=right at x31 facing north (lower+upper, y2..3). Door surround smooth_quartz pilasters x29 and x32 y2..5 (via facade; they are wall cells next to the opening: shell builds them as smooth_quartz).
- fanlight: y4 x30..31 white_stained_glass_pane ×2; y5 x30..31 glass_pane; y5 x29 and x32 smooth_quartz_stairs half=top facing toward centre. The opening cells x30,31 y2..5 at z7 left for P4.
- pediment: see roofs. Gable window (round): glass_pane at (30..31,y11, z4)?? NO — left as white_concrete with a single glass_pane at (30,y11,z4),(31,y11,z4) (opening left by P2).
- bay: walls y1..9 around x37..41 z4..7: corners smooth_quartz; faces: stone_bricks y1..3; windows (glass) y3..5 and y7..9 pane on the 3 cardinal faces: z4 face x38..40, x37 face z5..6, x41 face z5..6. Floor y1 spruce_planks, floor 2 y6. Openings to M at z7 x38..40 y2..5 and y7..9 left.
- dormer(x,z, w): 3 wide walls siding on the slope: floor at slope; hand built: front wall at z7 x..x+2 y11..12, siding; glass_pane window centre (x+1) y11..12; side walls z8..10 stair-stepped; gable deepslate_tile_stairs ridge at x+1 y13 rows facing x and x+2 at y12→ apex y13.
- shutters etc listed.
- chimney: x40..42 z24..26 (3x3) stone_bricks from y2 to y13; corner stone_brick_stairs at y13? ; y14: stone_brick_wall at (40,25) and (42,25); cap stone_brick_slab y14 elsewhere.
- shrub(x,z): oak_leaves y1, flowering_azalea_leaves y2 (roundish 1x1x2). Foundation run: z6 at x=19..25? no, M front face z7 → shrubs z6, x20,x22,x24, x36? (bay at x37..41 z4..7: shrub z3 x37,x39,x41); garage run at z4: none (driveway).
- youngTree(x=8,z=2): oak_log y1..4 at (8,2), oak_leaves y4..5 5x5 minus corners, y6 3x3, y7 centre; oak_fence y1..2 stake at (9,2).
- deck: spruce_planks y1 x30..42 z29..31; rail spruce_fence y2 along z31 (x30..42), x30 and x42 (z29..30), gap at x29 steps: spruce_stairs facing west half=bottom at (29,1,30). Seating: designer P6 (see below).
- lamp(x,z): spruce_fence y1..3 + lantern y4.
- driveway(box): gray_concrete; every 5th z-row at z=0,5? uses polished_andesite_slab half=bottom joint line at z2.
- stair vocabulary: spruce_stairs half=bottom facing north for ascending south.

## ROOMS (inner air boxes; ways in listed)
Ground floor (y2..5 unless noted):
| room | box | floor | ways in | windows |
|---|---|---|---|---|
| Foyer (double-height) | [27,2,8,34,9,13] | spruce | double door (30..31,y2..5,z7); arches W/E below | N: archWindow xc=28? see OPENINGS |
| Under-gallery hall | [27,2,14,34,5,15] | spruce | open to foyer (no wall); mudroom door (26,y2..3,z15); great-room arch (30..31,y2..4,z16); stair at x27..28 z8..12 | |
| Home office | [19,2,8,25,5,12] | spruce | door (26,y2..3,z11) from foyer | N window xc=22 |
| Mudroom | [19,2,14,25,5,19] | polished_andesite | garage door (18,y2..3,z17..18) (+ stair step at (17,1,17..18) facing west); foyer-hall door (26,y2..3,z15); great-room door (26,y2..3,z18) | none |
| Pantry/laundry | [19,2,21,25,5,27] | spruce | door (26,y2..3,z24) from great room | W window xc=24? (x18 wall) |
| Formal dining | [36,2,8,42,5,15] (+ bay alcove [38,2,5,40,5,6]) | spruce | arch from foyer (35,y2..4,z11..12) | bay windows; E wall x43 window z11..13 |
| Great room: kitchen (west x27..34) + family room (east x35..42) | [27,2,17,42,5,27] | spruce | arch from hall (30..31,y2..4,z16); mudroom door (26,.., z18); pantry door (26,..,z24); slider (37..39,y2..4,z28) | E wall fireplace z24..26; windows N? z16 wall none; W? rear slider |
| Garage (3 cars) | [1,1,6,17,5,21] | polished_andesite | 3 doors z5; mudroom door; | none |
Second floor (y7..9):
| Upper hall + gallery | [19,7,14,34,9,15] | oak_planks | stair top (27..28,z13 landing); arch to bonus (18,y7..9,z14..15); arch to primary (35,y7..9,z14..15) | rail: iron_bars y7 at (29..34,z13) |
| Bedroom 3 | [19,7,8,25,9,12] | oak | door (22,y7..8,z13)? sits in wall z13: door from hall z14 |
| Bedroom 4 | [19,7,17,25,9,27] | oak | door (22,y7..8,z16) | W window xc=24? z side |
| Bedroom 2 | [27,7,17,34,9,27] | oak | door (30,y7..8,z16) | rear window |
| Primary bedroom (+ bay) | [36,7,8,42,9,15] (+ alcove [38,7,5,40,9,6]) | oak | arch (35,y7..9,z14..15) | bay windows |
| Walk-in closet | [36,7,17,42,9,22] | oak | door (39,y7..8,z16) | none |
| Primary bath | [36,7,24,42,9,27] | oak; chase x40..42 z24..26 RESERVED (chimney) so bath is x36..39 z24..27 | door (39..38,y7..8,z23) | E: none (chimney) |
| Bonus room over garage | [1,7,6,17,9,21] | oak | arch (18,y7..9,z14..15) | front archWindows xc=3,8? |
Stairs between floors: main stair x27..28, steps spruce_stairs facing north half=bottom at (x,y,z) = (27..28, 2+k, 8+k) k=0..4 (y2..y6, z8..12), landing floor block at (27..28,6,13). Gallery floor y6 at x27..34 z14..15. No other stairs.

## OPENINGS (shell leaves these cells EMPTY, others add into them)
Front (z5, garage): doors x2..5, x7..10, x12..15 each y1..4; windows: none. Bonus windows (z5): archWindow xc=3, 8, 13 y7..9 (x2..4, x7..9, x12..14).
Garage side x0: none. x18/x17: mudroom door (18, y2..3, z17..18) and bonus arch (18, y7..9, z14..15).
M front (z7): door x30..31 y2..5; office window xc=22 y3..5 (x21..23); upper windows xc=22 y7..9 (bedroom 3); bay openings x38..40 y2..5 and y7..9; foyer window xc=28? none; foyer high window: (29..32, y7..9, z7) one wide archWindow centered xc=30.5 use x29..32 4 wide above door (fanlight is lower).
M west (x18, z7..28): pantry window (18, y3..5, z23..25); bedroom 4 window (18, y7..9, z23..25).
M east (x43, z7..28): dining window (43, y3..5, z11..13); family room windows (43, y3..5, z19..21); primary window (43, y7..9, z11..13); bedroom none else.
M back (z28): slider x37..39 y2..4; kitchen windows x29..31 y3..5 (xc=30) and x33? one only; bedroom 2 window x29..31 y7..9; primary bath window x37..39? (z28, y7..9).
Bay B: z4 face x38..40 y3..5, y7..9 ; x37 face z5..6 y3..5,y7..9 ; x41 face same.
Interior door openings (shell leaves): listed in ROOMS ways_in; doors 1 wide 2 tall except arches 2 wide, top stairs.
Roof/pediment: glass_pane spots (30..31,y11,z4).

## RESERVED (shell leaves empty or placeholder-free)
- Foyer void x27..34 z8..13 y6..9 (no floor 2), except landing x27..28 z13.
- Stair cells x27..28 z8..12 y2..6 (P1 builds; stairs not empty).
- Chimney footprint x40..42 z24..26 y2..14: shell leaves AIR; P6 fills stone_bricks (breast in great room, chase in bath, shaft through roof). P2 must leave the roof holes at x40..42 z24..26 y11..13.
- Dormer holes: x21..23 z7..10 y11..13, x39..41 z7..10 y11..13, rear x29..31 z26..28 y11..13: P2 leaves roof open; P6 builds dormers.
- Portico: columns x26,29,32,35 at z4 y1..9 (shell leaves air; P4 builds).
- Shrub cells and tree are on lawn; shell leaves plinth only under walls.
- Turret bay interior x38..40 z5..6.

## PARTS (max 6)
| # | module | scope | ticks |
|---|---|---|---|
| P1 | parts/shell.mjs | lawn y0 grass, cobblestone plinth y0, floors (y0 garage, y1 main, y6 upper with void), outer walls of G, M, E walls (x26,x35 z4..7 only the front wall z7 and piers), B walls, all in birch_planks / stone_bricks (wallStone y1..3 on z5,z7 faces), interior partition walls (x26 z8..28, x35 z8..28, x25? as in ROOMS: z13,z16,z20 west/centre partitions, x35, bonus partitions z... ), ceilings y10 over M interior (incl. foyer y10 white), stairs, all OPENINGS left empty. Plate y10. | 9,22,23,26 |
| P2 | parts/roofs.mjs | roofHip G and M (leave RESERVED holes), roofGable E with pediment, roofCone B, ridge; all deepslate_tile | 1,2,3,4 |
| P3 | parts/facade.mjs | quoins, window frames, archWindow glass (all openings), shutters, slider, cornice y10 smooth_quartz, siding trim, stone cap row y4 | 8,10,12,13,20 |
| P4 | parts/entry-garage.mjs | portico columns+beam+floor y1 z4..6, steps, double door, fanlight, pediment windows, carriageDoor ×3 + lamps, bay glazing | 4,6,7,11,21 |
| P5 | parts/site.mjs | driveway, path, steps, lawn trim, shrubs, tree, deck, lamp post, mailbox | 15..19,21,27 |
| P6 | parts/details.mjs | chimney, 3 dormers, roof ridge details, finial, deck fence, window boxes (optional) | 5,14 |

## CHECKLIST
- [x] P1 shell  - [ ] P2 roofs  - [ ] P3 facade  - [ ] P4 entry/garage  - [ ] P5 site  - [ ] P6 details

## NOTES FOR WORKERS
- Later parts only ADD into air. P1 leaves openings and RESERVED cells empty. P2 leaves dormer/chimney roof holes.
- Stair facing: block `facing` = side the low step is on; ascending south ⇒ facing=north.
- Outdoor rooms: front lawn bare grass_block with shrubs (oak_leaves y1 + flowering_azalea_leaves y2) at z6 x20,22,24 and z3 x37,39,41; flower bed at x19..25 z5..6? no—keep lawn clean. Path polished_andesite; lamp posts at (29,z0) and (32,z0)? one at (29,0). Back deck: spruce, rail, planters rose_bush/peony at (31,29),(41,29).
- Keep y ≤ 14 and x 0..43, z 0..31.
- P1 shell (parts/shell.mjs): entry side walls x26/x35 z5..6 y1..10 added as portico piers (z4 left air for columns). Partitions birch_planks; ceilings y10 smooth_quartz. Not built: birch_slab y6 shadow course (element 9 partial; P3 may add); garage-to-mudroom step at (17,1,17..18) (mudroom walks y2, garage y1, so the x18 door needs a step).
- make.sh: the `mcd roof` preset reported "the box grew, everything moved by 2,0,0", so build.nbt's x coordinates are shifted +2 from plan.md. Pipeline issue, not P1; check before trusting absolute coordinates.

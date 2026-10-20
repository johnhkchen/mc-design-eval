# Plan: museums on the south side of the Mall (NASM 1976 + NMAI 2004)

## SITE

Coordinates are kit coordinates, the same frame as the plot list: north = low z (the Mall, the "street", is north of both),
east = high x. Both fronts that matter face NORTH (-z) toward the Mall. NMAI's door is on its EAST face.

**Ground convention.** The GROUND map value g is the y of the ground block at that cell; you stand at g+1. Both plots
have g = 0 over most of the lot and g = 1 in patches (NASM: the west end, x 0..~20; NMAI: the north rim z 0..6 at
x 94..116 and the east strip x ~128..139). The ground floor block of both buildings is **y 1** (stand at y 2): on g = 0 cells
it sits on the ground and reads as a 1-high plinth; on g = 1 cells it IS the ground course. Nothing floats, nothing is
buried deeper than that one course. Every mass below lists its cells; nothing goes outside the plot's `#` footprint.

Curved plans are ellipses: cell (x, z) is inside E(cx, cz, rx, rz) when ((x-cx)/rx)^2 + ((z-cz)/rz)^2 <= 1. Build them with
`disc`/`circleCells` from shapes-curved.mjs (scaled) or that test, never by hand-drawn stair-steps.

### Plot 0: National Air and Space Museum (x 0..87, z 0..30, cap y 20)

Four windowless marble cubes alternating with three lower glass bays, symmetric about x 43.5.

| mass | x | y | z | notes |
|---|---|---|---|---|
| podium / ground floor slab | 2..85 | 1 | 4..26 | polished_granite at the perimeter (plinth line), smooth_stone inside |
| Cube C1 (west) | 2..14 | 2..11 | 4..26 | solid marble shell, walls 2 thick |
| Glass bay G1 | 15..24 | 2..9 | 5..25 | faces 1 behind the cubes |
| Cube C2 | 25..37 | 2..11 | 4..26 | |
| Glass bay G2 (central, entrance) | 38..49 | 2..9 | 6..24 | north face 2 behind the cubes (entrance recess), south face 2 behind |
| Cube C3 | 50..62 | 2..11 | 4..26 | |
| Glass bay G3 | 63..72 | 2..9 | 5..25 | |
| Cube C4 (east) | 73..85 | 2..11 | 4..26 | |
| North terrace strip (full width) | 0..87 | 1 (top) | 3 | polished_granite paving; continues into the bay recesses (G1/G3 z 4, G2 z 4..5) |
| West terrace | 0..10 | 1 | 2..3 | g = 1 here: paving replaces the ground course |
| Ad Astra terrace + spire base | 26..36 | 1 | 1..3 | granite paving; spire stands at x 35, z 2 |
| East forecourt terrace | 51..87 | 1 | 1..3 | granite paving; edge at z 1 is polished_granite_slab (half step down to grade); also x 84..87 z 0 |
| G2 entrance steps | 38..49 | 1 | 3 | polished_granite_slab bottom (one half step from grade), then landing z 4..5 full blocks at y 1 |
| West/east side aprons | 0..1 / 86..87 | 1 | where `#` | granite paving to the footprint edge |
| South garden strip (planters) | the `#` stubs: 1..11, 14..23, 26..36, 40..48, 52..62, 65..75, 77..87 | 0..1 | 27..29 (+ x 1..11 z 30) | low granite curb (polished_granite, 1 high) round grass + azalea + low shrubs; G2 south landing x 40..48 z 26..27 is paving instead |
| Ad Astra spire (signature from the concept) | 35 | 2..17 | 2 | iron_block shaft y 2..13, lightning_rod y 14..17; at y 11..13 a burst of end_rods (one in each horizontal direction at y 11 and y 13, around the shaft) |

Aircraft (decor part, inside the glass, hung from the roof frame on iron_chain): see RESERVED.

### Plot 1: National Museum of the American Indian (x 92..139, z 0..28, cap y 29)

A stack of curved, banded limestone tiers, each a different ellipse, so the walls overhang and step back; a deep
cantilevered lobe over the east entrance; a shallow dome on top; wetland in the south-west tail.

| mass | plan (cells) | y | notes |
|---|---|---|---|
| T1 base | E(111, 10, 15, 8): x 96..126, z 2..18 | 1..4 | ground storey; east doors at its east edge |
| T2 overhanging tier | E(111, 10, 16, 9): x 95..127, z 1..19, UNION east lobe E(126, 10, 5, 4): x 121..131, z 6..14 | 5..8 | projects 1 beyond T1 all round (y 5 is the overhang lip), and the lobe cantilevers 5 past T1 over the entrance |
| T3 setback tier | E(112, 10, 13, 7): x 99..125, z 3..17, UNION lobe E(124, 10, 5, 3): x 119..129, z 7..13 | 9..11 | steps back on west/north/south, still overhangs east (second layer of the entrance canopy) |
| T4 top tier | E(110, 10, 10, 6): x 100..120, z 4..16 | 12..13 | |
| Potomac dome | `dome()` profile "shallow", center [110, 14, 10], radius 5 (drum 1 course at y 14, saucer to y 16) | 14..16 | glass oculus 3x3 at x 109..111, z 9..11, y 16 |
| Entrance porch (open air under the lobes) | x 127..131, z 6..14 (outside T1, under T2/T3) | 2..4 clear | paved floor at y 1 |
| East plaza | E(134, 10, 5, 5): x 129..139, z 5..15, within `#` | 1 | g = 1: paving replaces the ground course; level with the floor (no steps) |
| North walk | z 0..1 along the `#` cells, x 92..133 | ground | gravel/dirt_path curving, joining the plaza at x 132..134, z 2..5 |
| Pond | E(99, 22, 5, 2): x 94..104, z 20..24, only on g = 0 cells | water at y 0 (bed at y -1) | reeds, lily pads; its banks are the g = 1 cells z 23..27 |
| Grandfather rocks | B1 x 132..133 z 3..4; B2 x 128..129 z 14..15 (south edge of the plaza); B3 x 106..107 z 21..22; B4 x 93..94 z 26..27 | ground+1 .. ground+2 | 2x2x2 rounded boulders (tuff + andesite, one top corner left off) |
| Wetland/meadow planting | everything else in the `#` footprint outside the building | ground | grass_block/podzol/coarse_dirt patches, tall grass, ferns, azure_bluet, blue_orchid near water, sugar_cane on the pond rim, 3 small birch trees at (95, 15), (113, 22), (121, 18) |

## ROOFS

No pitched roofs. Every roof is flat or stepped and built BY HAND in the shell parts (the `modern` preset's iron-bar rail
and cornice would read wrong from above; NMAI's curves are outside every preset). All exposed tops are bottom slabs or
glass, so nothing spawns on them.

| roof | form | height | edge |
|---|---|---|---|
| NASM cubes C1..C4 | flat deck: smooth_stone_slab (bottom) field at y 11 inside a 1-wide smooth_quartz_slab (bottom) ring on the wall line | top 11.5 (lidar 11) | wall top course y 10 is crisp marble; no overhang (sheer modernist box) |
| NASM glass bays G1..G3 | flat glass roof at y 9: gray_stained_glass field, polished_blackstone_slab (bottom) frame lines every 3 cells in x and z, and a polished_blackstone_slab rim | top y 9 (2 courses below the cubes) | glass meets the cube walls flush; cubes show their marble flanks above it |
| NMAI tier tops | each tier's exposed ring (cells of the tier not covered by the tier above): smooth_sandstone_slab (bottom) at the course above the tier: T2 ring y 9, T3 ring y 12, T4 field outside the dome y 14 (cut_sandstone_slab) | stepped 9 / 12 / 14 | the tier walls rise flush to the slab; the lip at the bottom of each overhanging tier is the shadow line |
| NMAI dome | `dome()` shallow, smooth_sandstone with a cut_sandstone drum course; oculus light_gray_stained_glass | crown y 16 (lidar 16) | sits fully on T4 |

## FACADES

### NASM (all four faces; north is the hero face to the Mall)

| element | position | depth | material |
|---|---|---|---|
| plinth | y 1 perimeter of the whole building | flush, reads 1 proud of grade | polished_granite |
| cube body | y 2..10, every cube face | plane | white_terracotta (pale pink marble), plain, no openings |
| cube coping | y 11 ring | flush | smooth_quartz_slab |
| clerestory slot (from the concept: the dark horizontal slot near the top of each cube) | north and south faces of every cube at y 9, from cube x0+3 to x1-3 (C1 x 5..11, C2 x 28..34, C3 x 53..59, C4 x 76..82) | recessed 1 by EXCLUSION: outer face cell left out, tinted_glass in the inner wall course | tinted_glass |
| glass bay curtain wall | y 2..8 on the bay's north and south faces | 1 behind cube face (G2: 2) | gray_stained_glass in a grid |
| mullions | at both bay ends and every 3rd cell from the west end (G1 x 15,18,21,24; G2 x 38,41,46,49 (the door frame x 41/46 doubles as mullions); G3 x 63,66,69,72) | flush with the glass | polished_blackstone |
| transoms | y 5 and y 8 across each bay face | flush | polished_blackstone |
| bay sill | y 1 under each glass face | flush | polished_blackstone |
| entrance (G2 north) | door cells x 42..45, y 2..3 in face z 6; blackstone frame round them (x 41 and 46 y 2..4, y 4 over the doors) | in the face | iron_door pairs |
| south entrance (G2 south) | x 42..45, y 2..3 in face z 24 | in the face | iron_door pairs |
| Ad Astra spire | x 35, z 2 | free-standing on the terrace | iron_block, lightning_rod, end_rod |

East and west end faces are cube faces: plain marble with the plinth, no slot (as built).

### NMAI (every face is curved; no straight wall longer than the ellipse step gives)

Horizontal strata by ABSOLUTE course, the same on every tier, so the bands run continuously round the building like a
cliff (each tier is solid limestone with no trim):

| y | course | material |
|---|---|---|
| 1 | base | sandstone |
| 2 | | sandstone |
| 3 | | smooth_sandstone |
| 4 | top of T1 | cut_sandstone |
| 5 | T2 overhang lip (1 proud of T1) | smooth_sandstone |
| 6 | ribbon-window course | sandstone |
| 7 | | sandstone |
| 8 | warm band | orange_terracotta |
| 9 | T3 base | cut_sandstone |
| 10 | ribbon-window course | sandstone |
| 11 | | smooth_sandstone |
| 12 | T4 base | sandstone |
| 13 | | cut_sandstone |
| 14 | dome drum | cut_sandstone |

Variety: 1 cell in about 10 of the sandstone courses swapped to yellow_terracotta (weathered stone), never in the band
courses. Undersides of the T2/T3 lobes over the entrance (y 5 and y 9 cells with air below) are smooth_sandstone.

Entrance: the east face of T1 under the lobes, doors at x 125, z 8..11, y 2..3 (two door pairs), with
brown_stained_glass in the T1 face beside them at x 125..126 where the curve passes z 6..7 and z 12..13, y 2..3.

## MATERIALS

All checked with `$MCD blocks --check` (all exist in 1.21.1; `cattails` does not and is not used).

| role | block |
|---|---|
| NASM body (pink Tennessee marble) | white_terracotta |
| NASM coping | smooth_quartz_slab |
| NASM roof deck | smooth_stone_slab |
| NASM plinth, terraces, steps | polished_granite, polished_granite_slab, granite (curbs) |
| NASM glass | gray_stained_glass (walls and roof) |
| NASM steel frames | polished_blackstone, polished_blackstone_slab |
| NASM slot glass | tinted_glass |
| NASM doors | iron_door |
| Aircraft | white_concrete, light_gray_concrete, iron_block, iron_trapdoor (wings), red_concrete only for one tail stripe |
| Spire | iron_block, lightning_rod, end_rod |
| NMAI stone (strata) | sandstone, smooth_sandstone, cut_sandstone, orange_terracotta (one band), yellow_terracotta (sparse) |
| NMAI step rings / dome | smooth_sandstone_slab, cut_sandstone_slab, smooth_sandstone_stairs |
| NMAI windows, door glass | brown_stained_glass; oculus light_gray_stained_glass |
| NMAI doors | dark_oak_door |
| NMAI plaza | smooth_sandstone (with cut_sandstone rings) |
| Ground | grass_block, podzol, coarse_dirt, gravel, dirt_path |
| Water / plants | water, lily_pad, sugar_cane, tall_grass, short_grass, large_fern, azure_bluet, blue_orchid, birch_log, birch_leaves (persistent) |
| Boulders | tuff, andesite, granite |
| Light | lantern, pearlescent_froglight (NASM glow), ochre_froglight (NMAI warm glow), sea_lantern (under water, pond) |

## OPENINGS

| building | opening | cells | fill |
|---|---|---|---|
| NASM | north main entrance, G2 | x 42..45, y 2..3, z 6 | 2 iron_door pairs |
| NASM | south entrance, G2 | x 42..45, y 2..3, z 24 | 2 iron_door pairs |
| NASM | clerestory slots | y 9, cube north faces z 4 and south faces z 26 at the x ranges above | outer cell air, tinted_glass at z 5 / z 25 |
| NASM | glass bays | all bay faces y 2..8 and roofs y 9 are glazing (not openings): the shell builds them | |
| NMAI | east entrance | x 125, z 8..11, y 2..3 | 2 dark_oak_door pairs, frame of cut_sandstone |
| NMAI | ribbon windows (slits) | y 6 on T2 and y 10 on T3, south and west arcs only: the cells of those courses with z >= 14 or x <= 101; one in each 4 cells left out (stone between) | outer cell left OUT (recess 1), brown_stained_glass one cell in |
| NMAI | oculus | x 109..111, z 9..11, y 16 | light_gray_stained_glass |

## RESERVED (the shell leaves these empty)

| for | cells |
|---|---|
| NASM aircraft, G1 | air box x 16..23, y 5..8, z 8..22: a light plane at y 6 (wings x 17..22 at z 12, fuselage x 19..20 z 10..15) on chains to the roof |
| NASM aircraft, G2 | air box x 39..48, y 5..8, z 8..22: the Spirit-of-St-Louis-type plane at y 7 (wings x 40..47 z 15, fuselage x 43..44 z 12..18) and a small jet at y 6 (x 41..46, z 9..11) |
| NASM rocket, G3 | x 67..68, y 2..8, z 14..15: a standing white rocket on the floor, plus a hung plane at y 7, x 64..71, z 18..21 |
| NASM glass-bay glow | floor cells y 1 inside each bay on a 4x4 grid (G1 x 17,21; G2 x 40,44,48; G3 x 65,69, at z 8,12,16,20,24 where inside): pearlescent_froglight set into the floor |
| NASM spire | x 35, y 2..17, z 2 plus the end_rod cells x 34..36, z 1..3 at y 11 and 13 |
| NASM terrace lamps | lantern posts (granite_wall 2 high + lantern) at z 2: x 2, 9, 27, 33, 53, 62, 73, 85; plus one each side of the G2 steps at (37, 2, 3) and (50, 2, 3) on the cube-front terrace; never on the steps x 38..49 |
| NMAI pond | x 94..104, z 20..24 (inside E(99,22,5,2), g = 0 cells): water at y 0, bed y -1 with 2 sea_lanterns at (97, -1, 22), (101, -1, 22) |
| NMAI boulders | B1..B4 cells above |
| NMAI porch lights | under T2's lobe: hanging lanterns at y 4 from the lobe soffit at (128, 4, 8), (128, 4, 12), (130, 4, 10) |
| NMAI dome light | ochre_froglight 3x3 at x 109..111, z 9..11, y 15 (under the oculus, glows through it) |
| NMAI base floodlight | ochre_froglight set in the paving/ground course (flush, at g) every 6 cells round the T1 perimeter, 1 cell out from the wall (warm light washing the strata at dusk) |
| Garden lamps | lantern posts every 8 cells along the north walk and the plaza ring |

## FLOORS

| building | level | stand at | interior volume (exterior-only kit: shown only through glass) |
|---|---|---|---|
| NASM | ground floor block y 1 | y 2 | glass bays are full-height atria y 2..8 (open, aircraft hang in them); cubes are closed shells, interior x0+2..x1-2, z 6..24, y 2..10 (unused, may stay hollow) |
| NMAI | T1 floor block y 1 | y 2 | T1 y 2..4; T2 y 5..8 (floor at y 5 only where it overhangs); T3 y 9..11; T4 y 12..13; atrium under the dome open from y 2 to y 15 inside E(110,10,5,5). Walls 2 thick, otherwise hollow and dark-proofed (lights per RESERVED) |

---
# DESIGNER SECTIONS (below the architect's form; nothing above changed)

## PALETTE
Architect's MATERIALS keep their ids exactly. Shape variants and functional blocks:

| role | blocks |
|---|---|
| NASM marble | white_terracotta; smooth_quartz_slab (coping, bottom); smooth_stone, smooth_stone_slab |
| NASM paving | polished_granite, polished_granite_slab, granite, granite_wall (lamp posts, curb), polished_granite_stairs (unused on main way) |
| NASM glass/steel | gray_stained_glass, gray_stained_glass_pane (aircraft-facing inner none), polished_blackstone, polished_blackstone_slab, tinted_glass |
| doors | iron_door (NASM), dark_oak_door (NMAI) |
| aircraft | white_concrete, light_gray_concrete, iron_block, iron_trapdoor, iron_chain (axis y), red_concrete (one stripe), glass pane for cockpit: gray_stained_glass_pane |
| spire | iron_block, lightning_rod, end_rod |
| NMAI stone | sandstone, smooth_sandstone, cut_sandstone, orange_terracotta, yellow_terracotta; slabs smooth_sandstone_slab, cut_sandstone_slab, sandstone_slab; smooth_sandstone_stairs, sandstone_stairs (cut_sandstone_stairs DOES NOT exist: use smooth_sandstone_stairs) |
| NMAI glass | brown_stained_glass, light_gray_stained_glass |
| ground/plants | grass_block, podzol, coarse_dirt, gravel, dirt_path, water, lily_pad, sugar_cane, short_grass, tall_grass, large_fern, azure_bluet, blue_orchid, azalea, flowering_azalea, birch_log (axis y), birch_leaves (persistent true) |
| boulders | tuff, andesite, granite |
| light (all 1.21.1) | lantern (hanging true/false), pearlescent_froglight, ochre_froglight, sea_lantern |

## VOCABULARY
- `marble_cube(g, x0,x1,z0,z1)`: walls white_terracotta y 2..10, 2 thick, hollow, roof smooth_stone_slab field y 11 with smooth_quartz_slab ring on the wall line; plinth polished_granite y 1.
- `slot(g, x0,x1, zFaceOuter, zInner)`: y 9 outer cells air, inner cells tinted_glass.
- `glass_bay(g, x0,x1,z0,z1)`: gray_stained_glass walls y 2..8 on N/S faces, roof glass y 9, polished_blackstone mullions (ends and every 3), transoms y 5 and 8, sill y 1, roof grid slabs every 3 x and z, rim slab. Interior left air.
- `door_pair(g, x, y, z, facing, material)`: two doors side by side, lower+upper halves, same facing, hinges left/right mirrored.
- `entry_steps(g)`: polished_granite_slab (bottom) at z 3 x 38..49 then level landing z 4..5 full blocks; 2+ wide, never stairs.
- `aircraft(g, {x,y,z, span, len, hang})`: fuselage white_concrete 2x2 cross-section, nose light_gray_concrete, wings a row of iron_trapdoor (open false, top half) at fuselage mid, tail fin 2 up, iron_chain from wing tips to roof frame y 9.
- `rocket(g, x,z)`: 2x2 white_concrete y 2..7, iron_block cap y 8, 4 light_gray_concrete fins at the base, red_concrete band y 4.
- `spire(g, x,z)`: iron_block shaft, lightning_rod, end_rod ring per plan.
- `lamp_post(g, x,y,z)`: granite_wall 2 high + lantern standing.
- `planter(g, box)`: polished_granite curb 1 high round grass_block, azalea, short_grass.
- `glow_floor(g, cells)`: pearlescent_froglight set in y 1 floor.
- `tier(g, cx,cz,rx,rz, y0,y1)`: ellipse cells inside E test, wall ring 2 thick, floor course; each course block from `strata_material(y)` (table in FACADES, every ~10th sandstone course cell swapped to yellow_terracotta).
- `tier_ring(g, outerE, innerE, y, slab)`: slab over cells of outer not covered by inner.
- `ribbon(g, tierE, y, arc)`: cells on south/west arc, one in 4 skipped (stone), outer cell left out, brown_stained_glass one cell in.
- `potomac_dome(g)`: dome() shallow smooth_sandstone, cut_sandstone drum, light_gray_stained_glass oculus, ochre_froglight underneath.
- `hang_lantern(g, x,y,z)`: lantern hanging true under a solid block.
- `boulder(g, x,z,gy)`: 2x2x2 tuff/andesite/granite mix, one top corner omitted.
- `pond(g)`, `meadow(g, cells)`, `birch(g,x,z)` (log 5 high axis y, persistent leaves crown radius 2), `floodlight(g,x,z)` (ochre_froglight flush in ground), `plaza(g)`.

## ROOMS
Exterior kit: only glass-visible volumes, all dark-proofed by lights in RESERVED.

## PARTS
1. nasm-shell (parts/nasm-shell.mjs): plinth, 4 cubes, slots.
2. nasm-glass (parts/nasm-glass.mjs): 3 bays, doors, entry steps.
3. nasm-fittings (parts/nasm-fittings.mjs): aircraft, rocket, glow floor, spire.
4. nasm-grounds (parts/nasm-grounds.mjs): terraces, planters, lamps.
5. nmai-shell (parts/nmai-shell.mjs): tiers, rings, lobes, ribbon, dome, doors.
6. nmai-grounds (parts/nmai-grounds.mjs): plaza, pond, rocks, planting, lights.

## Notes for workers
- North = low z. Air cells of RESERVED stay empty for later parts. Use exclusion for recesses. No signs. Check with $MCD check / fit.
- Dome and ellipses via dome()/disc(), not hand steps. cut_sandstone_stairs doesn't exist.
- Parts 3 and 4 must run after part 2; part 6 after 5.
- nasm-shell: podium y1 skips bay face rows (z0/z1 of each bay) and G2 recess z4..5 so glass/steps parts can place sills and landing; bay interior floor is smooth_stone (glow_floor needs over:true).

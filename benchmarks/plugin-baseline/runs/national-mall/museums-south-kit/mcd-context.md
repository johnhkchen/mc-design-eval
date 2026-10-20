# The shared kit (a snapshot taken when the parts began)

These files from the run directory are already here, so don't cat or Read them again: plan.md, elements.md,
rooms.json, palette.json, make.sh, build.mjs, and the API of the vocabulary (vocab.mjs, vocab/*.mjs) and of the
build library. Coordinates, palette and helpers don't change while the parts are built; only plan.md's ticks and
Notes may have moved on (read the live file for those). Read a module's source only to see how a helper builds.

### plan.md

```markdown
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
```

### elements.md

```markdown
# REQUIRED ELEMENTS (checklist). Coordinates from plan.md; plot-local frame, y 1 = ground floor block.

## NASM
- [ ] E1 Four marble cubes C1..C4 (x 2..14, 25..37, 50..62, 73..85; z 4..26; y 2..10 walls 2 thick, roof y 11): white_terracotta, plain, no openings except the slot. Part 1 `nasm-shell`, helper `marble_cube`.
- [ ] E2 Cube roof: smooth_stone_slab (bottom) field y 11 in a smooth_quartz_slab ring. Part 1, `marble_cube`.
- [ ] E3 Clerestory slot (y 9, N face z 4 / S face z 26 left AIR by exclusion, tinted_glass at z 5 / z 25), x ranges C1 5..11, C2 28..34, C3 53..59, C4 76..82. Part 1, `slot`.
- [ ] E4 Three glass bays G1 x 15..24, G2 38..49, G3 63..72, y 2..9: gray_stained_glass walls (N/S faces, plus end faces against cubes are the cubes' flanks), roof y 9 glass with polished_blackstone grid, mullions every 3, transoms y 5 & 8, sill y 1, 2 courses lower than cubes. Part 2 `nasm-glass`, helper `glass_bay`.
- [ ] E5 Plinth y 1: polished_granite perimeter, smooth_stone inside. Part 1.
- [ ] E6 Main entrance G2 north: 2 iron_door pairs x 42..45, y 2..3, z 6, blackstone frame x 41/46, y 4 lintel; recess z 4..5 landing. Slab half-step at z 3 (polished_granite_slab bottom), landing z 4..5 level. Part 2, `door_pair`, `entry_steps`. South door x 42..45 z 24 likewise.
- [ ] E7 Terraces/forecourts (granite paving per plan SITE table), south planters (granite curb + grass + azalea). Part 4 `nasm-grounds`, helper `planter`, `terrace`.
- [ ] E8 Ad Astra spire x 35 z 2: iron_block y 2..13, lightning_rod y 14..17, end_rod ring at y 11 and 13 (x 34..36, z 1..3 horizontal neighbours). Part 3 `nasm-spire`, helper `spire`.
- [ ] E9 Aircraft inside glass (white/light_gray concrete fuselage + iron_trapdoor wings, iron_chain hangers up to y 9 roof frame; standing rocket in G3 x 67..68 z 14..15 y 2..8 with iron_block nose, red_concrete stripe). RESERVED boxes. Part 3, `aircraft`, `rocket`.
- [ ] E10 Glow: pearlescent_froglight in bay floor (y 1) on 4x4 grid; at dusk the bays glow. Part 3 `glow_floor`.
- [ ] E11 Terrace lamps (granite_wall x2 + lantern) at z 2 per RESERVED; lights every spawn surface (floors are paved/slabs). Part 4 `lamp_post`.

## NMAI
- [ ] E12 Four curved tiers T1..T4 per ellipse table, absolute strata courses (y 1..14 materials in FACADES), overhang lip y 5. Part 5 `nmai-shell`, helper `tier`, `strata_material`.
- [ ] E13 Tier-top rings: smooth_sandstone_slab y 9 / 12, cut_sandstone_slab y 14. Part 5 `tier_ring`.
- [ ] E14 East lobes (T2/T3 cantilever over porch x 127..131, z 6..14), soffit smooth_sandstone. Part 5.
- [ ] E15 East entrance: dark_oak_door pairs x 125 z 8..11, cut_sandstone frame, brown_stained_glass flanks, porch lanterns hanging y 4. Part 5/6 `door_pair`, `hang_lantern`.
- [ ] E16 Ribbon window slits y 6 / 10 south and west arcs: outer cell left out, brown_stained_glass one in. Part 5 `ribbon`.
- [ ] E17 Potomac dome: dome() shallow centre [110,14,10] r5, smooth_sandstone, cut_sandstone drum, light_gray_stained_glass oculus x109..111 z9..11 y16, ochre_froglight at y15. Part 5 `potomac_dome`.
- [ ] E18 East plaza smooth_sandstone with cut_sandstone rings, E(134,10,5,5). Part 6 `plaza`.
- [ ] E19 Pond E(99,22,5,2) water y0, bed y -1, 2 sea_lanterns, lily_pad, sugar_cane rim. Part 6 `pond`.
- [ ] E20 Grandfather rocks B1..B4 (tuff/andesite/granite 2x2x2). Part 6 `boulder`.
- [ ] E21 Wetland planting, 3 birches, north gravel walk, garden lamps, base floodlights (ochre_froglight flush in ground every 6 cells round T1). Part 6 `meadow`, `birch`, `lamp_post`, `floodlight`.
```

### rooms.json

```json
{"entrance":[43,2,5],"street":null,"entrances":null,"rooms":[]}
```

### palette.json

```json
{
  "roles": {
    "nasm_marble": ["white_terracotta", "smooth_quartz_slab", "smooth_stone", "smooth_stone_slab"],
    "nasm_paving": ["polished_granite", "polished_granite_slab", "polished_granite_stairs", "granite", "granite_wall"],
    "nasm_glass_steel": ["gray_stained_glass", "gray_stained_glass_pane", "polished_blackstone", "polished_blackstone_slab", "tinted_glass"],
    "doors": ["iron_door", "dark_oak_door"],
    "aircraft": ["white_concrete", "light_gray_concrete", "iron_block", "iron_trapdoor", "iron_chain", "red_concrete", "gray_stained_glass_pane"],
    "spire": ["iron_block", "lightning_rod", "end_rod"],
    "nmai_stone": ["sandstone", "smooth_sandstone", "cut_sandstone", "orange_terracotta", "yellow_terracotta", "smooth_sandstone_slab", "cut_sandstone_slab", "sandstone_slab", "smooth_sandstone_stairs", "sandstone_stairs"],
    "nmai_glass": ["brown_stained_glass", "light_gray_stained_glass"],
    "ground_plants": ["grass_block", "podzol", "coarse_dirt", "gravel", "dirt_path", "water", "lily_pad", "sugar_cane", "short_grass", "tall_grass", "large_fern", "azure_bluet", "blue_orchid", "azalea", "flowering_azalea", "birch_log", "birch_leaves"],
    "boulders": ["tuff", "andesite", "granite"],
    "light": ["lantern", "pearlescent_froglight", "ochre_froglight", "sea_lantern"]
  },
  "objects": []
}
```

### make.sh

```sh
#!/usr/bin/env bash
# The one command that makes build.nbt from scratch: build to a temp file, then move it into place.
set -euo pipefail
cd "$(dirname "$0")"
tmp="$(mktemp "${TMPDIR:-/tmp}/museums-south.XXXXXX")"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
chmod 644 "$tmp"
mv -f "$tmp" build.nbt
echo "build.nbt written"
```

### build.mjs

```js
// The whole build: lay the ground from the site maps, run the six parts in plan order, save the .nbt named on the
// command line. make.sh runs it into a temp file and moves the result to build.nbt. A part whose file is not written
// yet builds nothing, so the build runs in any state of the work.
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { runParts, Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE, SITE_MAPS, GRASS_BLOCK, COARSE_DIRT } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// the six parts in plan order (plan.md PARTS); each file exports build(g)
const PARTS = [
  ["NASM shell", "parts/nasm-shell.mjs"],
  ["NASM glass bays", "parts/nasm-glass.mjs"],
  ["NASM fittings", "parts/nasm-fittings.mjs"],
  ["NASM grounds", "parts/nasm-grounds.mjs"],
  ["NMAI shell", "parts/nmai-shell.mjs"],
  ["NMAI grounds", "parts/nmai-grounds.mjs"],
];

async function load([name, file]) {
  if (!existsSync(file)) {
    console.log(`part ${name}: ${file} not written yet, built empty`);
    return [name, () => {}];
  }
  try {
    const mod = await import(pathToFileURL(file).href);
    return [name, mod.build ?? (() => {})];
  } catch (e) {
    console.log(`part ${name}: ${file} does not load (${e.message.split("\n")[0]}), built empty`);
    return [name, () => {}];
  }
}

// the ground under each footprint cell: grass on the surface block at g, coarse dirt beneath it (g 0 = one course)
function layGround(g, { x0, z0, footprint, ground }) {
  footprint.forEach((row, dz) => [...row].forEach((ch, dx) => {
    if (ch !== "#") return;
    const top = Number(ground[dz][dx]);
    for (let y = 0; y <= top; y++) g.set(x0 + dx, y, z0 + dz, y === top ? GRASS_BLOCK : COARSE_DIRT);
  }));
}

const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });   // the server is Minecraft 1.21.1
for (const map of Object.values(SITE_MAPS)) layGround(g, map);

const list = [];
for (const p of PARTS) list.push(await load(p));
runParts(g, list, { palette: "palette.json", roof: "roof.json" });

g.save(out);
console.log(`saved ${out}`);
```

## The vocabulary (import from ./vocab.mjs): each helper's comment and signature

### vocab/base.mjs

```js
// Site coordinates, palette and helpers for the museums-south-kit build (plan.md). Kit frame: north = low z, east = high
// x, y 0 = the lowest ground. A cell with ground value g has its ground block at y g; you stand at g + 1.
// Every block id below is in palette.json. Parts import from here and need no numbers from plan.md.
// NOTE: the grid starts at y 0, so the pond bed at y -1 (NMAI_POND) cannot be placed; its water at y 0 has no bed.

// ---- grid and plots ----

// ---- grid and plots ----
export const SITE_SIZE = [140, 30, 31];                                  // grid: x 0..139, y 0..29, z 0..30

export const NASM_BOX = { x0: 0, x1: 87, z0: 0, z1: 30, cap: 20 };       // plot 0, National Air and Space Museum

export const NMAI_BOX = { x0: 92, x1: 139, z0: 0, z1: 28, cap: 29 };     // plot 1, National Museum of the American Indian

export const NASM_AXIS_X = 43.5;                                         // NASM's symmetry axis (x)

// ---- NASM masses (inclusive cell ranges) ----
export const NASM_PLINTH_Y = 1;                                          // plinth and ground floor block y (stand at y 2)

export const NASM_CUBES = [                                              // marble cubes: walls y 2..10, coping y 11

export const NASM_BAYS = [                                               // glass bays: curtain y 2..8, roof glass y 9

export const NASM_DOORS = {                                              // entrance door cells (iron_door pairs), y 2..3

export const NASM_SPIRE = { x: 35, z: 2, y0: 2, y1: 17 };                // Ad Astra spire: shaft to y 13, lightning rod to 17

export const NASM_TERRACES = [                                           // paving terraces at y 1: west, Ad Astra, east forecourt

// ---- NMAI masses (E(cx, cz, rx, rz) ellipses, see inEllipse; inclusive y ranges) ----
export const NMAI_TIERS = [                                              // stacked curved tiers, each a different ellipse

export const NMAI_LOBES = [                                              // east entrance lobes over the porch

export const NMAI_PORCH = { x0: 127, x1: 131, z0: 6, z1: 14 };           // open porch under the lobes; floor at y 1

export const NMAI_PLAZA = { cx: 134, cz: 10, rx: 5, rz: 5 };             // east plaza ellipse, paving at y 1

export const NMAI_DOME = { cx: 110, cy: 14, cz: 10, r: 5 };              // Potomac dome: drum at y 14, crown y 16

export const NMAI_OCULUS = { x0: 109, x1: 111, y: 16, z0: 9, z1: 11 };   // glass oculus in the dome crown

export const NMAI_DOOR = { x: 125, y0: 2, y1: 3, z0: 8, z1: 11 };        // east entrance door cells (two pairs)

export const NMAI_POND = { cx: 99, cz: 22, rx: 5, rz: 2 };               // pond ellipse, on ground-0 cells only

export const NMAI_BOULDERS = [                                           // grandfather rocks: 2x2x2 from (x, z)

export const NMAI_BIRCHES = [{ x: 95, z: 15 }, { x: 113, z: 22 }, { x: 121, z: 18 }];   // birch tree base cells

// ---- helpers ----
export const inEllipse = (x, z, cx, cz, rx, rz) => ...

export function rng(seed) {                                              // seeded PRNG (mulberry32): call it for floats in [0, 1)

// ---- palette: every id is in palette.json (plan.md PALETTE) ----
// NASM
export const WHITE_TERRACOTTA = "white_terracotta";                       // NASM body: pink Tennessee marble

export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";                  // NASM cube coping (bottom slab)

export const SMOOTH_STONE = "smooth_stone";                              // NASM roof deck field

export const SMOOTH_STONE_SLAB = "smooth_stone_slab";                    // NASM roof deck (bottom slab)

export const POLISHED_GRANITE = "polished_granite";                      // NASM plinth, terraces, steps

export const POLISHED_GRANITE_SLAB = "polished_granite_slab";            // NASM terrace edges, entry steps (bottom slab)

export const POLISHED_GRANITE_STAIRS = "polished_granite_stairs";        // NASM stairs (not on the main way)

export const GRANITE = "granite";                                        // NASM planter curbs; boulder mix

export const GRANITE_WALL = "granite_wall";                              // NASM lamp posts and curbs

export const GRAY_STAINED_GLASS = "gray_stained_glass";                  // NASM bay glass, walls and roofs

export const GRAY_STAINED_GLASS_PANE = "gray_stained_glass_pane";        // NASM cockpit glass

export const POLISHED_BLACKSTONE = "polished_blackstone";                // NASM steel frames: mullions, transoms, sills

export const POLISHED_BLACKSTONE_SLAB = "polished_blackstone_slab";      // NASM roof grid and rim slabs

export const TINTED_GLASS = "tinted_glass";                              // NASM clerestory slot glass

export const IRON_DOOR = "iron_door";                                    // NASM entrance door pairs

export const DARK_OAK_DOOR = "dark_oak_door";                            // NMAI entrance door pairs

// aircraft and spire
export const WHITE_CONCRETE = "white_concrete";                          // aircraft fuselage, rocket body

export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";                // aircraft nose, rocket fins

export const IRON_BLOCK = "iron_block";                                  // aircraft and rocket caps, spire shaft

export const IRON_TRAPDOOR = "iron_trapdoor";                            // aircraft wings (open false, top half)

export const IRON_CHAIN = "iron_chain";                                  // aircraft hangers (axis y)

export const RED_CONCRETE = "red_concrete";                              // one tail stripe; rocket band

export const LIGHTNING_ROD = "lightning_rod";                            // spire tip

export const END_ROD = "end_rod";                                        // spire burst

// NMAI
export const SANDSTONE = "sandstone";                                    // NMAI strata and base

export const SMOOTH_SANDSTONE = "smooth_sandstone";                      // NMAI strata, plaza, dome

export const CUT_SANDSTONE = "cut_sandstone";                            // NMAI strata, door frames, dome drum

export const ORANGE_TERRACOTTA = "orange_terracotta";                    // NMAI warm band (y 8)

export const YELLOW_TERRACOTTA = "yellow_terracotta";                    // NMAI weathered stone, sparse

export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";            // NMAI step rings (bottom slab)

export const CUT_SANDSTONE_SLAB = "cut_sandstone_slab";                  // NMAI dome-ring slab (y 14)

export const SANDSTONE_SLAB = "sandstone_slab";                          // NMAI slab variant

export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";        // NMAI dome edges (cut_sandstone_stairs does not exist)

export const SANDSTONE_STAIRS = "sandstone_stairs";                      // NMAI stairs

export const BROWN_STAINED_GLASS = "brown_stained_glass";                // NMAI windows, slits, porch glass

export const LIGHT_GRAY_STAINED_GLASS = "light_gray_stained_glass";      // NMAI oculus

// ground and plants
export const GRASS_BLOCK = "grass_block";                                // ground surface (laid by build.mjs)

export const PODZOL = "podzol";                                          // wetland meadow patches

export const COARSE_DIRT = "coarse_dirt";                                // ground under the surface; meadow patches

export const GRAVEL = "gravel";                                          // wetland edges

export const DIRT_PATH = "dirt_path";                                    // NMAI north walk

export const WATER = "water";                                            // NMAI pond

export const LILY_PAD = "lily_pad";                                      // pond

export const SUGAR_CANE = "sugar_cane";                                  // pond rim

export const SHORT_GRASS = "short_grass";                                // meadow and planters

export const TALL_GRASS = "tall_grass";                                  // meadow

export const LARGE_FERN = "large_fern";                                  // meadow

export const AZURE_BLUET = "azure_bluet";                                // meadow

export const BLUE_ORCHID = "blue_orchid";                                // meadow near water

export const AZALEA = "azalea";                                          // NASM planters

export const FLOWERING_AZALEA = "flowering_azalea";                      // NASM planters

export const BIRCH_LOG = "birch_log";                                    // birch trunks (axis y)

export const BIRCH_LEAVES = "birch_leaves";                              // birch crowns (persistent true)

// boulders
export const TUFF = "tuff";                                              // grandfather rocks

export const ANDESITE = "andesite";                                      // grandfather rocks

// light
export const LANTERN = "lantern";                                        // lamp posts, porch and garden lights

export const PEARLESCENT_FROGLIGHT = "pearlescent_froglight";            // NASM glow floor

export const OCHRE_FROGLIGHT = "ochre_froglight";                        // NMAI dome and base floodlights

export const SEA_LANTERN = "sea_lantern";                                // under the pond

// ---- site maps: copied verbatim from brief.txt ('#' = build here; ground digits = g per cell; rows are z, columns x) ----
export const NASM_FOOTPRINT = [

export const NASM_GROUND = [

export const NMAI_FOOTPRINT = [

export const NMAI_GROUND = [

export const SITE_MAPS = {
  nasm: { x0: NASM_BOX.x0, z0: NASM_BOX.z0, footprint: NASM_FOOTPRINT, ground: NASM_GROUND },
  nmai: { x0: NMAI_BOX.x0, z0: NMAI_BOX.z0, footprint: NMAI_FOOTPRINT, ground: NMAI_GROUND },
};
```

### vocab/h1.mjs

```js
// Group 1 of plan.md VOCABULARY: marble_cube, door_pair, rocket, planter, tier_ring, hang_lantern, meadow, plaza.
// Every helper takes the Grid first, then its position (and facing) as arguments. It writes only the cells of its
// own footprint, and only into air: a write into a solid cell is skipped and kept on g.refused (as guard() does),
// unless opts.over is true. Multi-cell pieces (doors, two-high plants) are all-or-nothing. Each helper returns the
// number of blocks it placed. Block ids are plan.md PALETTE, 1.21.1; states come from build.mjs B.* where it has one.

/** Four-walled cube on the plan's grid: plinth y1, hollow white marble walls 2 thick y2..10, roof y11. */
export function marble_cube(g, x0, x1, z0, z1, opts = {})

/** Two doors side by side, lower and upper halves, same facing; hinges mirrored (left cell hinge left).
 *  (x, y, z) is the left cell as seen from the front; the right cell is one step clockwise from facing. */
export function door_pair(g, x, y, z, facing, material, opts = {})

/** Standing 2x2 rocket: white body y..y+5 with a red band at y+2, iron cap at y+6, four 2-high fins at the base. */
export function rocket(g, x, z, y = 2, opts = {})

/** Planting box: box = [x0, z0, x1, z1] soil cells at level y (grass_block), a 1-high polished granite curb round
 *  them at y+1, azalea in the middle and short grass inside. Nothing is written below y. */
export function planter(g, [x0, z0, x1, z1], y, opts = {})

/** Slab over the cells of the outer ellipse not covered by the inner one: E = [cx, cz, rx, rz]; innerE may be null.
 *  slab is the material word ("smooth_sandstone" gives smooth_sandstone_slab, bottom). */
export function tier_ring(g, outerE, innerE, y, slab, opts = {})

/** Hanging lantern at (x, y, z). It hangs from the block above, so with air above it places nothing and says so. */
export function hang_lantern(g, x, y, z, opts = {})

/** Planting: cells = [[x, y, z, block], ...] with block one of MEADOW (tall_grass and large_fern take y and y+1).
 *  Each entry is written on its own (all or nothing per plant). */
export function meadow(g, cells, opts = {})

/** Plaza paving on the ellipse E(cx, cz, rx, rz) at level y: smooth_sandstone field, cut_sandstone on the edge
 *  ring and on a mid ring. */
export function plaza(g, cx, cz, rx, rz, y, opts = {})
```

### vocab/h2.mjs

```js
// Helpers from plan.md VOCABULARY (second set): slot, entry_steps, spire, glow_floor, ribbon, boulder, birch.
// Each takes its position as arguments, writes only inside its own footprint, and returns { placed, refused }.
// Writes go only into air. A cell that already holds a block is refused (listed in `refused`, not written) unless the
// option { over: true } says the helper owns that cell (a slot cut into a built wall, a light set into a finished floor).
// Coordinates: x east, y up, z south (north = low z). y is the course the plan names; ground block gy means stand at gy+1.

/** Clear slit in a cube wall at course y (default 9): the outer face cell left out (air), the inner cell tinted glass.
 *  x0..x1 are the cells along the wall; zOuter is the face, zInner the cell one in (plan E3: C1 x 5..11 at z 4 / 5). */
export function slot(g, x0, x1, zOuter, zInner, { y = 9, over = false } = {})

/** Entrance steps: a bottom slab row at z (one half step from grade), then a level landing of full blocks at
 *  z landing0..landing1 (plan E6: z 3, then z 4..5 at y 1). Never stairs. Needs 2 or more cells across and in depth. */
export function entry_steps(g, x0, x1, z, landing0, landing1, { y = 1, material = "polished_granite", over = false } = {})

/** Ad Astra spire on the terrace at (x, z): iron_block shaft y0..y0+11, end_rods on the four horizontal neighbours
 *  at y0+9 and y0+11 (each pointing away from the shaft), lightning_rod y0+12..y0+15. y0 = 2 in the NASM plot. */
export function spire(g, x, z, { y0 = 2, over = false } = {})

/** Pearlescent froglight set into the floor at course y (default 1), one per [x, z] cell, axis y. The floor there is the
 *  ground floor block, so a finished floor needs { over: true }. */
export function glow_floor(g, cells, { y = 1, over = false } = {})

/** Window slits in a curved tier wall at course y. tierE = { cx, cz, rx, rz } is the tier's ellipse; its wall is the
 *  2-thick ring inside it. Along the outer ring cells that arc(x, z) accepts, taken in order round the curve, every
 *  `every`-th cell is a slit: the outer cell left out (air), the inner cell brown_stained_glass; the stone between stays. */
export function ribbon(g, tierE, y, arc, { every = 4, over = false } = {})

/** A 2x2x2 boulder with its low corner at (x, z) sitting on the ground block gy (cells gy+1..gy+2). Tuff, andesite and
 *  granite in a fixed pattern; the top corner [dx, dz] in `omit` is left off. */
export function boulder(g, x, z, gy, { mix = ["tuff", "andesite", "granite"], omit = [1, 1], over = false } = {})

/** A small birch at (x, z) on the ground block gy: birch_log trunk (axis y) at gy+1..gy+height and a persistent crown of
 *  birch_leaves, radius 2 over the top three courses, then a plus-shaped cap on top of the trunk. */
export function birch(g, x, z, gy, { height = 5, over = false } = {})
```

### vocab/h3.mjs

```js
// Seven helpers from plan.md's VOCABULARY (glass_bay, aircraft, lamp_post, tier, potomac_dome, pond, floodlight), plus
// strata_material, which tier uses. Each takes its position (and facing, where it has one) as arguments, so nothing is
// fixed to a spot, and writes only inside its own footprint. Writes go only into AIR: an earlier part owns the ground,
// floors and walls, so a cell that is not air is refused and listed. The one way past that is `replace: true`, used for a
// pond dug into the lot or a floodlight set flush in the paving. Each helper returns { placed, refused }.
// Block ids are 1.21.1 (the server's version): `iron_chain` is `chain` there.

// ---- glass_bay(g, x0, x1, z0, z1, opts) ----------------------------------------------------------------------------
// NASM glass bay: gray glass walls y 2..8 on the north and south faces only (the ends are the cubes' flanks), transoms at
// y 5 and 8, mullions at the ends and every 3rd cell from x0 (opts.mullions overrides, e.g. the G2 door frame), a sill at
// y 1, and a flat roof glass at y 9 with polished_blackstone slab frame lines every 3 cells and a slab rim. Interior air.
export function glass_bay(g, x0, x1, z0, z1, opts = {})

// ---- aircraft(g, spec) ----------------------------------------------------------------------------------------------
// A light plane hung in a bay. spec: { x, y, z, span, len, hang, facing, fin, replace }. (x, z) is the body's minimum
// corner; the body is 2 wide, 2 high (y, y+1) and len long along the facing axis, nose at the facing end (south or east
// = high end, north or west = low end). Wings: a row of iron_trapdoor (closed, top half) across `span` cells at the body's
// mid, at y, skipping the body's own two columns. A tail fin rises `fin` cells (default 2) from the body's top at the tail.
// hang: the roof-frame y; chains (`chain`, axis y) run from each wing tip up to hang-1 (false = no chains).
// Keep y at 3 or more above the floor so a 2-high lane passes under the body.
export function aircraft(g, spec)

// ---- lamp_post(g, x, y, z, opts) -----------------------------------------------------------------------------------
// Terrace lamp: granite_wall two high (a lone post: up true, no sides) with a standing lantern on top. y is the first
// cell above the ground.
export function lamp_post(g, x, y, z, opts = {})

/** The block of course y at cell (x, z). About 1 cell in 10 of a non-band course is weathered yellow_terracotta. */
export function strata_material(y, x = 0, z = 0)

// ---- tier(g, cx, cz, rx, rz, y0, y1, opts) -------------------------------------------------------------------------
// One curved NMAI tier: a solid floor course at y0 over the whole ellipse, then a wall ring 2 thick from y0+1 to y1,
// open at the top. Courses come from strata_material. opts.open = {cx, cz, rx, rz}: floor cells inside that ellipse are
// left out (the atrium under the dome, on the tiers above the ground floor).
export function tier(g, cx, cz, rx, rz, y0, y1, opts = {})

// ---- potomac_dome(g, center, radius, opts) -------------------------------------------------------------------------
// The NMAI dome: a hollow shallow dome of smooth_sandstone on a one-course cut_sandstone drum. center = [cx, y, cz] with
// y the drum's course. The oculus is light_gray_stained_glass over the 3x3 at the crown, with ochre_froglight under it.
export function potomac_dome(g, center, radius, opts = {})

// ---- pond(g, spec) -------------------------------------------------------------------------------------------------
// The NMAI pond: water at y over the ellipse E(cx, cz, rx, rz), gravel bed at y-1 (the bed can be dug with replace).
// spec: { cx, cz, rx, rz, y, where, lanterns, lilies, reeds, replace }. where(x, z): an extra filter on the footprint
// (e.g. only the g = 0 cells). lanterns: [x, z] sea_lantern cells in the bed. lilies: [x, z] lily_pad cells on the
// surface. reeds: [x, y, z] sugar_cane cells on the rim.
export function pond(g, spec)

// ---- floodlight(g, x, y, z, opts) ----------------------------------------------------------------------------------
// A warm ochre_froglight set flush at (x, y, z), y being the paving or ground course. That cell is ground, so the helper
// needs { replace: true } to write it; without it the cell is refused as any non-air cell is.
export function floodlight(g, x, y, z, opts = {})
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

/** A bed, both halves: foot at [x,y,z], the head one step toward facing (the pillow end), same colour and facing.
 *  Both cells must be air (a bed never replaces a wall block); the head goes against a solid wall, never a window or
 *  a door. Returns true when placed, false (placing nothing) when a cell is taken. */
export const bed = (g, [x, y, z], facing, color = "red") => ...

/** A straight flight of stairs a player walks up without jumping: from = the first step's cell (standing on the lower
 *  floor), facing = the way you walk up, to = the y of the UPPER FLOOR's own block layer. The last step is set in that
 *  layer, flush with the floor you step out onto, so a storey of h (floor to floor) takes h steps. Clears 2 blocks of
 *  headroom over every step (cutting the floor above where the flight passes) and hangs an upside-down stair under each
 *  step as a stringer. width runs to the right of facing. Returns { steps, landing: [x,y,z] (feet on the upper floor), notes }. */
export const flight = (g, { from: [x, y, z], facing, to, material = "oak", width = 1, stringer = true }) => ...

/** A hearth and its chimney: the fire at the BOTTOM, smoke up a flue, the stack set INTO the wall so the room loses no
 *  space. Give wall = [x, floor level, z], a cell of the outside wall at the hearth's floor level, and into = the side the
 *  room is on: the campfire goes one cell OUTSIDE the wall (an exterior chimney), the wall cell becomes the hearth's
 *  mouth with a lintel over it, and the flue rises outside the wall with the house wall as its room side. (Or give
 *  at = the campfire's cell and open = the side its mouth faces, for an interior chimney set into a partition.)
 *  top = the flue's last course (1-2 over the roof where it leaves it; the mouth is open above). The flue is a 1 x 1
 *  column of air walled on all four sides at every level: the house wall below the roof, and from the roof up the
 *  chimney's own masonry (never the roof's tiles), or with thin: "iron" | "copper" | a wood, an open trapdoor lying
 *  flat against the flue where there is only air beside it (a slim pipe above the roof). Build it after the roof.
 *  It lays its own footing down to the ground and overwrites what is in its cells: call it directly, never through a
 *  helper that writes only into air (that helper refuses the whole stack over one filled cell). */
export const chimney = (g, { wall, into, at, open = "south", top, material = "bricks", thin = null, lintel = true, roofY }) => ...

/** A window shutter: an open trapdoor in the cell in front of the wall (on the face side), lying flat against it.
 *  face: the way the wall looks (north for a north front); the trapdoor's facing is the face, so it lies on the wall. */
export const shutter = (g, [x, y, z], face, wood = "spruce", { height = 1 } = {}) => ...

/** A word in banner letters hung on a board, in reading order for its face: bannerWord(g, "BUTCHER", { center: [14, 10, 4], face: "north" }). */
export const bannerWord = (g, word, o) => ...

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

## How things sit: `mcd fit`

`$MCD fit build.nbt --rooms rooms.json` (and the FIT lines of `$MCD room`) lists what a player sees wrong from inside,
each with its cell: anything **on a bottom slab** (half a block of air under it), floor decor **floating** over air,
a **broken bed** (one half, or halves that don't match), a **bed in the wall** (set into the wall line), a **bed
against an opening** (its head at a window, a pane or a door, or at nothing), a **bed backwards** (foot against the
wall, head out in the room), **stairs end short** (a walked flight whose top step is a full block under the floor it
leads to: a jump), a **chimney fire** fault (a campfire on top of a stack, shut in a stack with no
firebox mouth, its smoke blocked before the sky, a flue open at the side, or roof tiles walling the flue), a
**chimney in the room** (a hearth or flue in a room's floor space instead of set into the wall), a **floating shutter** (an open trapdoor with air behind it), **bookshelf overuse** (more
than 3 outside a library, study or office) and a **hallway to nowhere** (a hall with one way in, or a long stretch no
walk between its openings passes). With `street` in rooms.json it also walks the **way in**, street to main door (with `entrances`, each building's or
module's, from the street straight in front of it),
and lists a **steep approach** (a stair or a full-block step on it, more than 3 half-steps without a 2-long landing,
1 wide, or no level cell before the door): the approach standard, `$MCD approach` alone. The shop sockets' boxes are skipped.
Helpers that get it right: `bed(g, [x, y, z], facing, color)` (both halves; refuses a cell that isn't air and returns
false), `flight(g, { from, facing, to, material, width })` (a flight whose last step is in the upper floor's own layer,
headroom cut, stringer under it), `chimney(g, { wall: [x, floorY, z], into, top, material, thin })` (an exterior chimney: the fire
just outside the wall, its mouth cut through it, hay in the floor, a 1 x 1 air flue to the sky, masonry through the
roof, thin trapdoors above it, its own footing; call it directly, never through an air-only helper), `shutter(g, [x, y, z], face, wood, { height })`
(flat on the wall), `bannerWord(g, word, { center, face })` (letters in reading order).

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

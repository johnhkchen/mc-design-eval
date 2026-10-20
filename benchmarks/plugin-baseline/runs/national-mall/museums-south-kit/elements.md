# REQUIRED ELEMENTS (checklist). Coordinates from plan.md; plot-local frame, y 1 = ground floor block.

## NASM
- [x] E1 Four marble cubes C1..C4 (x 2..14, 25..37, 50..62, 73..85; z 4..26; y 2..10 walls 2 thick, roof y 11): white_terracotta, plain, no openings except the slot. Part 1 `nasm-shell`, helper `marble_cube`.
- [x] E2 Cube roof: smooth_stone_slab (bottom) field y 11 in a smooth_quartz_slab ring. Part 1, `marble_cube`.
- [x] E3 Clerestory slot (y 9, N face z 4 / S face z 26 left AIR by exclusion, tinted_glass at z 5 / z 25), x ranges C1 5..11, C2 28..34, C3 53..59, C4 76..82. Part 1, `slot`.
- [x] E4 Three glass bays G1 x 15..24, G2 38..49, G3 63..72, y 2..9: gray_stained_glass walls (N/S faces, plus end faces against cubes are the cubes' flanks), roof y 9 glass with polished_blackstone grid, mullions every 3, transoms y 5 & 8, sill y 1, 2 courses lower than cubes. Part 2 `nasm-glass`, helper `glass_bay`.
- [x] E5 Plinth y 1: polished_granite perimeter, smooth_stone inside. Part 1.
- [x] E6 Main entrance G2 north: 2 iron_door pairs x 42..45, y 2..3, z 6, blackstone frame x 41/46, y 4 lintel; recess z 4..5 landing. Slab half-step at z 3 (polished_granite_slab bottom), landing z 4..5 level. Part 2, `door_pair`, `entry_steps`. South door x 42..45 z 24 likewise.
- [x] E7 Terraces/forecourts (granite paving per plan SITE table), south planters (granite curb + grass + azalea). Part 4 `nasm-grounds`, helper `planter`, `terrace`.
- [x] E8 Ad Astra spire x 35 z 2: iron_block y 2..13, lightning_rod y 14..17, end_rod ring at y 11 and 13 (x 34..36, z 1..3 horizontal neighbours). Part 3 `nasm-spire`, helper `spire`.
- [x] E9 Aircraft inside glass (white/light_gray concrete fuselage + iron_trapdoor wings, iron_chain hangers up to y 9 roof frame; standing rocket in G3 x 67..68 z 14..15 y 2..8 with iron_block nose, red_concrete stripe). RESERVED boxes. Part 3, `aircraft`, `rocket`.
- [x] E10 Glow: pearlescent_froglight in bay floor (y 1) on 4x4 grid; at dusk the bays glow. Part 3 `glow_floor`.
- [x] E11 Terrace lamps (granite_wall x2 + lantern) at z 2 per RESERVED; lights every spawn surface (floors are paved/slabs). Part 4 `lamp_post`.

## NMAI
- [x] E12 Four curved tiers T1..T4 per ellipse table, absolute strata courses (y 1..14 materials in FACADES), overhang lip y 5. Part 5 `nmai-shell`, helper `tier`, `strata_material`.
- [x] E13 Tier-top rings: smooth_sandstone_slab y 9 / 12, cut_sandstone_slab y 14. Part 5 `tier_ring`.
- [x] E14 East lobes (T2/T3 cantilever over porch x 127..131, z 6..14), soffit smooth_sandstone. Part 5.
- [ ] E15 East entrance: dark_oak_door pairs x 125 z 8..11, cut_sandstone frame, brown_stained_glass flanks, porch lanterns hanging y 4. Part 5/6 `door_pair`, `hang_lantern`.
- [x] E16 Ribbon window slits y 6 / 10 south and west arcs: outer cell left out, brown_stained_glass one in. Part 5 `ribbon`.
- [x] E17 Potomac dome: dome() shallow centre [110,14,10] r5, smooth_sandstone, cut_sandstone drum, light_gray_stained_glass oculus x109..111 z9..11 y16, ochre_froglight at y15. Part 5 `potomac_dome`.
- [x] E18 East plaza smooth_sandstone with cut_sandstone rings, E(134,10,5,5). Part 6 `plaza`.
- [ ] E19 Pond E(99,22,5,2) water y0, bed y -1, 2 sea_lanterns, lily_pad, sugar_cane rim. Part 6 `pond`.
- [x] E20 Grandfather rocks B1..B4 (tuff/andesite/granite 2x2x2). Part 6 `boulder`.
- [x] E21 Wetland planting, 3 birches, north gravel walk, garden lamps, base floodlights (ochre_froglight flush in ground every 6 cells round T1). Part 6 `meadow`, `birch`, `lamp_post`, `floodlight`.

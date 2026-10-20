# Taipei City Hall: REQUIRED ELEMENTS

All ids checked with `$MCD blocks --check` (1.21.1). Parts: P1 shell, P2 roofs, P3 facades, P4 portico/entrance/emblem, P5 courts/grounds, P6 lighting/crown/masts. Build in site orientation (N = low z). Vocabulary names are in plan.md VOCABULARY.

- [ ] **Wing wall skin (M3-M13, bays)**: smooth_sandstone face, 2-deep (face + black_concrete backing), plinth polished_andesite y0..2, ground storey y2..6, office storeys y7..61, parapet y62..64. P1. `plinth`, `officeBay`.
- [x] **Office window grid**: piers smooth_sandstone every 3rd cell full height; window gray_stained_glass 2x2 recessed 1 at f+2..f+3; spandrels white_terracotta at f, f+1, f+4. P3. `officeBay`, `litWindow`.
- [x] **Lit windows**: ~1 bay in 6 in runs of 2-4, shroomlight (2/3) / sea_lantern (1/3) at depth 2; most on S and E faces. P3. `litWindow`.
- [x] **String course y7**: smooth_sandstone_slab top, 1 proud. P3. `stringCourse`.
- [x] **Ground storey**: smooth_stone piers every 6, glass recessed 2 at y3..5, smooth_stone lintel y6, lit behind every other pane. P3. `groundBay`.
- [ ] **Towers T1-T9**: blank smooth_sandstone, cut_sandstone joint every 5th course, white_terracotta panels, two slot-window columns (1x2, recessed 1) per face, cut_sandstone quoins, y to 69. P1 massing + P3 detail. `towerFace`, `quoin`.
- [x] **Tower floodlight course**: ochre_froglight flush at y62 on E faces of T4/T5/T7 (x197) and S faces of T8/T9 (z332). P6. `floodCourse`.
- [ ] **Central block M7 + crown M7c**: M7 to y69 with ochre_froglight light slot y68 under the coping; M7c x81..116 z170..206 walls smooth_quartz y68..73, pearlescent_froglight band y73, slab roof y74. P1 (shell), P6 (lights). `crownBand`.
- [x] **Flat parapet roofs**: smooth_stone_slab (bottom) decks y62/67/15/10, quartz coping 1 proud, lantern on parapet inner edge every 8. P2. `roofDeck`, `coping`.
- [x] **Mechanical penthouses**: light_gray_concrete boxes N x66..94 z40..50, S x66..94 z319..329, E x145..170 z175..202, y63..69, iron_bars louvres y66..67. P2. `penthouse`.
- [x] **Tower plant boxes**: 5x5, y68..70 at each tower centre, light_gray_concrete, redstone_torch y71. P2/P6. `plantBox`.
- [x] **Masts**: 4 on M7c, lightning_rod stack, iron_bars below y78, redstone_torch (red aircraft light) at top. P6. `mast`.
- [ ] **Podia M2, M14**: 3-storey grid, lit glass ground storey, roof terrace y15, planters moss_block + flowering_azalea_leaves, lantern posts. P1/P2/P5. `planter`, `lampPost`.
- [ ] **Spur pavilions M1, M15**: glazed, quartz_pillar every 4, panes recessed 1 backlit by sea_lantern y2..5, skylight strip x84..86, glass doors, slab ramp at z374. P1/P3. `spurPavilion`.
- [x] **Portico + canopy M8p**: 6 quartz_pillar 2x2 columns (plan coords), smooth_quartz canopy y13, fascia y13..15, recessed sea_lantern underside every 4. P4. `column`, `canopyLight`.
- [x] **Entrance hall + doors**: light_blue_stained_glass wall x19, z176..201, y2..12; 4 double doors at x18 (z180,186,190,196); lit lobby. P4. `lobbyGlass`, `doubleDoor`.
- [x] **Accessible approach**: bottom-slab ramp x0..1, z170..207 (y1.5 then deck), no stairs. P4. `slabRamp`.
- [ ] **Name "TAIPEI CITY HALL"**: banner letters blue on white, west fascia x0 y13..15 centred z188.5, via `bannerWord`/plaque (never by hand). P4. `nameBand`.
- [ ] **City emblem disc**: centre (17,30,188) r4, smooth_quartz, blue_concrete ring, yellow_concrete core, shroomlight behind at (18,30,188). P4. `emblemDisc`.
- [x] **Flagpoles x6**: x4/9/14 at z165 and z212; polished_andesite base, iron_bars y3..20, lightning_rod y21, banner (red+blue canton / white). P4. `flagpole`.
- [x] **Apron paving + lamp posts**: polished_andesite, light_gray_concrete joints every 4, andesite_wall posts + lantern every 8. P4/P5. `lampPost`.
- [x] **Courtyards CN, CS**: grass lawn y2, 4-wide cross paths (smooth_stone/polished_andesite), fountain basin x76..85 (quartz rim, water at y1..2), trees on 10-grid. P5. `tree`, `fountain`, `lawnPatch`.
- [x] **Small courts CNE, CSE, CNW, CSW**: lawn/tree row/planters/paving as plan. P5.
- [ ] **Courtyard and spur doors, podium & east entries**: openings per plan OPENINGS, glass lit. P3/P4. `doubleDoor`, `litEntry`.
- [ ] **Lighting at dusk**: every roof and terrace lit (no spawns), lobbies lit, lamps. P2/P6. `lampPost`.

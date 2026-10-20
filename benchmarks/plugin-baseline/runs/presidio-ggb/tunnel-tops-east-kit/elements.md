# Required elements (Tunnel Tops east). Coordinates are module x,y,z from plan.md; heights per its ground rule.

Parts: P1 ground, P2 earthworks, P3 portal, P4 station, P5 planting, P6 furnishings. Vocab names in `code`.

- [x] **Ground, whole box** (P1, `groundColumn`): every column y1 stone, dirt to H-1, surface at H (grass_block / smooth_sandstone / paving). Edges x0..1, x84..85, z0..1, z144..145 exactly at map height. B cells flat grass, empty.
- [x] **Roads and walks outside the park** (P1, `roadStrip`, `walkPaving`): gray_concrete roads with white_concrete dashes, yellow_concrete double line z55..56 on the parkway apron x76..85; walks smooth_stone with light_gray_concrete band every 6.
- [x] **Curving decomposed-granite paths P1..P10** (P1, `pathRibbon`): Catmull-Rom through the plan's waypoints, smooth_sandstone, 2-3 wide; rises as smooth_sandstone_slab half steps (3, then landing 2). Forks at P1/P4, P3/P2, P6/P10.
- [x] **West seam** (P1): Outpost gravel z18..42, main path z46..48 3 wide, big-lawn grass z54..84, planting bed elsewhere, at x0..1.
- [ ] **Field Station** (P4, `stationShell`, `stationRoof`): dark_oak posts, glass walls N and E, dark_oak_planks W and S, polished_andesite floor y3, flat dark_oak cafe roof y9 with deep overhang (roof.json), double dark_oak_door N (x9..10), service door S x6.
- [ ] **Station deck** (P4, `deck`): spruce_planks x4..14 z19..22 y3, under the roof overhang at z21..22; lamp posts at x4 and x14, z19.
- [x] **Outpost play area east end** (P4, `playLog`, `boulder`): gravel; stripped_spruce_log play logs lying (axis x/z) 3-5 long at y4, a log platform with spruce_log posts, a stripped-log stepping row, andesite/tuff boulders with moss_carpet; x0..20 z18..44 outside the station and deck footprints.
- [ ] **East Meadow mound** (P2, `moundLawn`): lawn r<9.5 about (22,73), crown y8 r<6, mossy_cobblestone_slab ring at r6, pale ring path r 9.5..11.5 (P2), 6 young birch trees on the plan's list.
- [x] **Big Lawn east end** (P1): open grass_block x0..9 z54..84, no plants, light only by lamp posts at its margins.
- [ ] **Campfire circle** (P2, `amphitheatreRing`): sunken, floor stone_bricks y4 r<3.5; three seat rings (smooth_sandstone treads + white_terracotta risers + birch_slab seats) y5/y6/y7; lit campfire (48,5,97) on (48,4,97) with 8 stone_brick_slab around; aisles x47..49 with smooth_sandstone_stairs; rim path y7; ringed by cypress; 6 lamp posts at r9.
- [ ] **Picnic terraces** (P2, `seatingWall`, P6 `picnicTable`, `umbrella`): terraces A/B/C y4/y5/y6, white_terracotta seating walls with birch_slab caps, P9 slab ramps, 6 tables on the plan's spots, umbrellas, planting beds.
- [ ] **Tunnel portal** (P3, `portalFace`, `tunnelBore`): light_gray_concrete face x74..75 y2..6 z46..65, two mouths 6x3 with smooth_stone surround proud at x76, pier z54..56, smooth_stone coping y6, iron_bars rail y7, 3 hanging lanterns per mouth at x73, black_concrete back wall x65, road y2, lid walk 7f, wing walls 7c/7d.
- [ ] **Overlook terraces** (P2, `seatingWall`; P6 `bench`): levels y6/y7/y8, white_terracotta walls with birch_slab caps at z99/100 and z105/106, birch benches facing north, promenade, planters, lamps.
- [ ] **Native planting drifts** (P5, `drift`): grey-green, ochre, purple-blue, scrub, accent per plan recipes in irregular beds 6-20 long between paths; leaf shrubs 1-2 high.
- [x] **Monterey cypress and pine** (P5, `cypress`, `pine`): trunks per the plan list; clumps heavy on the east edge; all leaves persistent.
- [x] **Benches** (P6, `bench`): birch_stairs seats + birch_slab ends, 3-5 long, opening north.
- [ ] **Lamp posts and lanterns** (P6, `lampPost`, `wallLantern`, `hiddenLight`): per plan Lighting; no dark spawnable cell.

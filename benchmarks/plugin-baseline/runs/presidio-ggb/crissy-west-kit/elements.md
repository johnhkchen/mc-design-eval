# REQUIRED ELEMENTS (checklist)

All coordinates are plan.md's row coordinates (y0 = ground). Part numbers refer to PARTS in plan.md.

- [ ] **Shells, 10 buildings on their footprints** (P1 plots 0-3, P2 plots 4-9): white_concrete / smooth_sandstone walls on a plinth course (stone_bricks or polished_andesite), every mass from plan.md's tables, openings left AIR. Helpers: `wallBox`, `plinth`.
- [ ] **Diagonal footprints as block steps**: the hall sections W1..W4 and L1..L3 and the lean-tos step with the map; no diagonal block lines. P1.
- [x] **Warehouse hall roofs W1-W4 (grey gable, broad)**: roof tool, GREY mix, ridge polished_andesite_slab, quartz_stairs verge; gable triangles in white_concrete. P3.
- [ ] **Lean-to sheds**: one course of stairs facing up toward the hall, outer row stone_brick_stairs (grey) or brick_stairs (red). `leanTo`. P3/P4.
- [ ] **Red clay-tile hipped roof, admin building 1**: roof preset civic, palette red-tile, ridge y10. P3.
- [ ] **Grey gable + porch, housing 2**: GREY gable E-W, porch deck birch_planks y0 x67..82 z0..1, birch_fence posts on quartz_slab bases, lean-to roof y3. `porch`. P3, P5.
- [x] **Mission arcade, plot 1 x39..46 z2..3**: piers smooth_sandstone, arches = upside-down smooth_sandstone_stairs between piers, brick_stairs shed roof y3. `arcade`. P1 (piers), P5 (arches).
- [x] **Storehouse loading doors, plot 3**: 2-wide doors y1..3 filled dark_prismarine panels flush; row on west faces per OPENINGS. `slidingDoor`. P5.
- [x] **Warehouse sliding doors + tall windows** (plot 0): dark_prismarine panels, quartz jambs, 2-wide windows y2..4 with quartz_slab sills. `tallWindow`, `slidingDoor`. P5.
- [x] **Paired windows + green shutters** (1, 2, 4, 6, 7): glass_pane, quartz sill slab, warped_trapdoor open shutters flat beside. `window`, `shutter`. P5.
- [x] **Coast guard cupola** x125..126 z6..7 y7..10: quartz_block base y7, glass_pane y8, dark_prismarine_slab cap y9, lightning_rod y10 at x125 z6. `cupola`. P4.
- [x] **Coast guard pediment**: quartz by the civic preset on C1 north face. P4.
- [x] **Flagpole and US flag**: stone_brick_wall foot x120 z1 y1, end_rod y2..9, white_wall_banner flag with red/white stripes and blue canton hung x121..122 z1 y8..9 (banner patterns: stripes red, canton blue, from the toolkit's `B.banner`). `flag`. P5.
- [x] **Bike shop front**: glass shopfront x109..116 z1 y1..3, double door x112..113, dark_prismarine_stairs awning z0 y3 facing south, lantern x112, "BIKES" banners x110..114 z0 y4..5 on the fascia. `awning`, `bannerWord`. P5.
- [ ] **Sign "GYM"** on vestibule fascia x12..15 z0 y3..4 (plaque, material null). P5.
- [x] **Garage door** plot 8 x143..144 dark_prismarine panel between quartz jambs x142, x145. P5.
- [ ] **Boathouse door** plot 9 x153..154 y1..2 dark_prismarine panel, birch_planks frame y3, steep red roof. P4/P5.
- [x] **Door steps**: one bottom smooth_stone_slab outside each door, inside the plot only (accessible half step). `doorStep`. P6.
- [x] **Lawns, paths, hedges, trees**: grass_block patches (coarse_dirt edges), smooth_stone_slab paths, persistent oak_leaves hedges; per SITE. `lawn`, `hedge`, `smallTree`. P6.
- [x] **Lamp posts** on lawns of plots 0, 1, 2, 6: spruce_fence 3 high + lantern. `lampPost`. P6.
- [ ] **Lighting, no spawns**: lanterns on floor y1 every 6 cells inside each mass and under lean-tos; hanging lanterns by each main door. `floorLantern`, `eaveLantern`. P6.
- [ ] **Upper floor deck y3** in two-storey buildings (1, 2, 4, 6, 7): birch_planks. P1/P2.

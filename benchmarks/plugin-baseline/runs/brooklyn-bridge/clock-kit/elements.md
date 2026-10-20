# REQUIRED ELEMENTS (checklist) — coords from plan.md
Part numbers: P1 shell, P2 facades+windows, P3 tower+clock, P4 roofs/cap/lantern, P5 doors/lights/signage, P6 site/wing.

- [ ] Main loft block x1..23 y0..38 z1..42: solid smooth_quartz shell, floors per FLOORS, footing to g. P1 `pier`, `spandrel`.
- [ ] Window grid (5 bays N/S, per FACADES): 3-wide openings, glass 1 in: glass_pane lower rows, light_gray_stained_glass_pane upper row of each storey; thin dark frame = recess shadow plus polished_deepslate? NO: keep recess only. P2 `loftWindow`.
- [ ] Piers/spandrels flat at wall line; string course y6 quartz_bricks; frieze y35; cornice y36 upside-down smooth_quartz_stairs facing out; parapet y37..38 + smooth_quartz_slab cap. P1/P4 `cornice`.
- [ ] Ground floor richer: plinth y0..1 polished_andesite, quartz_pillar piers y2..5, arched heads y5 (upside-down stairs). P2 `groundBay`.
- [ ] Clock tower shaft x1..13 z17..29 y0..49 with 2-wide corner piers and 9-wide calcite recessed panels (1 in) y6..48. P3 `towerFace`.
- [ ] FOUR clock faces r2 (7 across), 10:10: white_stained_glass dial, oxidized_copper bezel + marks 12/3/6/9, black_concrete hands, glowstone one cell behind. W (1,45,23) E (13,45,23) N (7,45,17) S (7,45,29). P3 `clockFace` (the clock() helper).
- [ ] Tower arched windows y37..40, string course y41 smooth_quartz_slab top, frieze y49, cornice y49..50 overhang N/E/S, lanterns hanging at 4 corners y49. P3.
- [ ] Truncated pyramid cap y51..56 (3 rings deepslate_tile_stairs over deepslate_tiles course), deck y57 slab. P4 `capRing`.
- [ ] Glass lantern x5..9 z21..25 y58..60: polished_deepslate corner posts, glass_pane y58..59, roof polished_deepslate_slab y60 overhang 1, lightning_rod (7,61,23). P4.
- [ ] Roof decks y36 smooth_stone, y37 smooth_stone_slab bottom; bulkheads A (11..15,37..39,30..35) and B (17..21,37..40,35..41) calcite with open iron_trapdoor louvres, dark_oak_door roof doors. P4 `bulkhead`.
- [ ] East wing x24..30 z11..42 y0..8 with windows, cornice y7, parapet y8. P6 `wingBay`.
- [ ] Entrances: Main St vestibule (1..3,22..24) with slab ramp and dark_oak_door pair at x4; Washington St double door x30 z21..22 with canopy polished_deepslate_slab on chain at x31. P5 `door`, `canopy`.
- [ ] Warm lit windows >=25%: shroomlight in ceiling 1 inside window. P5 `warmWindow`.
- [ ] Lighting: lamp posts, street trees (London plane: oak logs + leaves), paving. P6 `lampPost`, `planeTree`.

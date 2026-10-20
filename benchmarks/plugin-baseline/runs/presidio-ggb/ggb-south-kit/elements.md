# REQUIRED ELEMENTS (coordinates from plan.md; plot 0 = fort, plot 1 = bridge; each module in its own local coords)

| # | Element | Construction (block by block) | Coords | Part | Vocab |
|---|---|---|---|---|---|
| 1 | Fort brick ring | y0 smooth_stone ground; y1 polished_granite base; y2..6 bricks solid; y6 is the deck (walk on 7) | all `#` cells | P1 | fortWall |
| 2 | Parapet + coping | y7 bricks outer edge, y8 polished_granite (slab-free full block); parade rail y7 brick_wall | outer / parade-adjacent cells | P1 | parapetRun |
| 3 | Three tiers of arched gun ports (N and W fronts) | per column: lower cell brick_slab(bottom) sill, upper air, cell behind black_concrete both rows; top row pier cells either side brick_stairs half=top facing into the opening; same columns on tiers y1-2, 3-4, 5-6 | plan FACADES embrasure columns | P1 | embrasure |
| 4 | 2-wide arches on 4-wide runs | middle two cells open, end cells upside-down brick_stairs | z2 x21..22, z6 x15..16, z8 x11..12, z10 x7..8 | P1 | embrasure(wide:2) |
| 5 | Landward south front with loopholes | plain bricks, 1x1 black_concrete slit recessed 1 at y3 and y5 mid-riser; east face slits z12,15,18 | south/east runs | P1 | loophole |
| 6 | Arched sally port | opening x26..27 y1..3 through z25..18 (air); stairs half=top at x25,x28 y3 facing in; y4 x25..28 polished_granite, chiseled_stone_bricks keystone x26 | z18..25 | P1 | sallyPort |
| 7 | Parade galleries | arched openings every other cell from 2nd, 3 tiers, brick_slab in lower row of both cells, 2 deep, stair heads | parade runs in plan | P1 | gallery |
| 8 | Corner stair towers | bricks, stone_bricks quoins alternating courses, polished_granite_slab cap ring y10, doorway y7..8 on parade side | N x24..27 z0..3; E x38..41 z2..5 (+buttress x38..39 z0..1 y1..8); SW x4..7 z32..35 | P2 | stairTower |
| 9 | Fort Point Lighthouse | legs polished_blackstone_wall, green_terracotta core x3 z11, gallery slab, glowstone lantern room with glass_pane, stair cap, lightning_rod y14 | x2..4 z10..12 y7..14 | P2 | lighthouse |
| 10 | Parade paving, seawall walk, shore rocks, landward paving | stone_bricks parade/landward, smooth_stone walk, boulders andesite/cobblestone/mossy_cobblestone <=2 high on <=30% of strip | open cells | P2 | rockCluster |
| 11 | Fort lamps (spawn-proof) | polished_blackstone_wall y1..2 + lantern y3; parade posts (16,12),(26,12),(24,8),(12,20); parapet lanterns every 6; hanging lantern in sally port (26,3,21) | plot 0 | P2 | lampPost |
| 12 | Two pairs of Art Deco pylons S1, S2 | smooth_sandstone, cut_sandstone plinth y1..3, fluting grooves by omitting face cells y6..35, string course y36, stepped crown to y42, bottom slab on every ledge | x1..7/23..29, z6..14, 63..71 | P3 | pylon |
| 13 | Cross beams S1, S2 | smooth_sandstone solid | x8..22 y26..29 z8..12 / z65..69 | P3 | crossBeam |
| 14 | South anchorage with Deco panels | smooth_sandstone solid, cut_sandstone y1..2 base and y12 cornice, y14 smooth_sandstone_slab, recessed panels and inner recesses as plan | x0..30 y1..14 z72..112 | P3 | anchoragePanel |
| 15 | Cable housings | solid smooth_sandstone wedges, cut_sandstone collar at z72, red_concrete cable buried | x7..9, 21..23 z72..80 | P3 | cableHousing |
| 16 | Anchorage piers + cap beams | smooth_sandstone | z88..90, 104..106 | P3 | deckPier |
| 17 | Deck: road, lines, sidewalks, floor, curb, rail | polished_deepslate road, smooth_quartz dashed lines, yellow_concrete centre, smooth_stone walks, gray_concrete floor, orange_terracotta curb, orange_concrete railing; slab variants on S segments | x8..22 z11..190 | P4 | deckSection |
| 18 | Stiffening truss | orange_terracotta chords+verticals (z≡2 mod 4), red_terracotta Warren diagonals | x8,22 y Y-4..Y-1 z14..190 | P4 | trussBay |
| 19 | Art Deco lamp posts | orange_concrete, red_concrete, standing lantern (z<=70 on outer sidewalk) | per plan lists | P4 | deckLamp |
| 20 | Steel arch ribs, skewbacks, spandrels, struts | orange_terracotta ribs 3 deep per table with red_concrete intrados, smooth_sandstone skewbacks, posts, red_terracotta struts, lantern on strut | x8..9, 21..22 z11..62 | P5 | archRib, spandrelPost |
| 21 | Main cables | red_concrete at y36 z71, diving per table into housings | x8,22 | P5 | cableDive |
| 22 | Approach bents | sandstone pedestals, orange_terracotta legs, red_concrete cap, red_terracotta X + mid strut | z120,136,152,168 | P6 | bent |
| 23 | Abutment | smooth_sandstone, cut_sandstone top | x8..22 z184..190 | P6 | abutment |
| 24 | Deck + bridge lighting | hanging lanterns under deck x15 Y-2 every 8 z; lanterns on pedestals, pier cap ends | per plan | P6 | hangLantern |

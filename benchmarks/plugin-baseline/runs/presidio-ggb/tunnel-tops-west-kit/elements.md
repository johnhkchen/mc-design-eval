# REQUIRED ELEMENTS: Tunnel Tops west (all coordinates from plan.md SITE/RESERVED; module x0..119 z0..145)

Part keys: P1 terrain.mjs, P2 portal.mjs, P3 outpost.mjs, P4 terraces.mjs, P5 planting.mjs, P6 lighting.mjs. Vocab names are in plan.md VOCABULARY.

| # | element | real construction, block by block | where | part | vocab |
|---|---|---|---|---|---|
| 1 | Ground of the whole box | y1 stone (clay under T); dirt y2..H-1; surface at H per map (2x2 cells; `?` per RESERVED rule); outer 2 blocks of every edge exactly at mapped H | x0..119 z0..145 | P1 | groundColumn, mapHeight |
| 2 | Roads and markings | gray_concrete; white_concrete dashed (every other 3) lanes, solid white edge lines, yellow_concrete centre lines (Mason St z11, Crissy Field Ave z25..26) | W cells z6..15, z22..29, parkway z80..91 | P1 | roadStrip |
| 3 | Walks and parking | smooth_stone walks, smooth_stone_slab at 1-steps; parking gray_concrete + white stall lines every 3, bioswale islands | x0..49 z30..75 | P1 | walkStrip, stallLines |
| 4 | Marsh and pond | water at y2 over clay y1; smooth_stone kerb on the pond | x0..13 z0..5; x38..39 z24..25 | P1 | waterCell |
| 5 | Curving pale paths | smooth_sandstone 2-3 wide, bends and forks as per plan (toe path, bluff switchback, lid path, south park paths); smooth_sandstone_slab half-steps where H changes by 1, stairs on banks | plan.md SITE | P1 | curvePath, halfStep |
| 6 | Big Lawn | grass_block only, mound +1 at x82..112 z68..78 in staggered single-block steps, wandering outline, edged by 3-wide pale path | x66..119 z62..85 | P1 | moundLawn |
| 7 | West tunnel portal | polished_andesite plinth y5; smooth_stone body y6..9; calcite coping y10 (1 proud, x40); calcite lintels y9 over mouths; 2 thick, mouth reveals at x42; pier z85..86 with wall lantern y7 | x41..42 z76..95 | P2 | portalFace |
| 8 | Two tunnel bores | smooth_stone walls and floor/ceiling slab y9, black_concrete back x50, sea_lantern strip y8 at x43..49 every 3rd on z82 and z89; air kept clear | x41..50 z80..91 y5..8 | P2 | tunnelBore |
| 9 | Retaining walls of the cut | smooth_stone + calcite coping; steps down westward (y9 x37..40, y8 x33..36, y7 x28..32); earth bank behind | x28..40 z78..79, z92..93 | P2 | retainWall |
| 10 | Park over the lid | dirt to y9, grass_block y10, planting; lid path | x43..60 z76..100 | P2/P5 | lidCover |
| 11 | Fort lookout | 4 corner stripped_spruce_log posts y4..15, spruce_planks decks y8 (S half) and y12, spruce_fence rail y13, ladder x82 z29 y5..12 + spruce_trapdoor hatch, spruce_stairs hip y15..16 with slab apex, hanging lanterns under the cap | x80..85 z28..33 | P3 | fortTower, ladder |
| 12 | Rope net | spruce_fence lattice (alternate rows/columns) ground to platform y8 | x80..85 z34..35 | P3 | fenceNet |
| 13 | Climbing log pile | alternating-axis stripped_oak_log/spruce_log layers, stepped, mangrove_roots at 2 corners | x100..107 z28..35 | P3 | logPile |
| 14 | Balance logs | 5 stripped_oak_log beams 5-7 long, crisscrossed at y4 on podzol/coarse dirt | x70..79 z34..41 | P3 | balanceLog |
| 15 | Sand pit and play ground | sand, coarse_dirt, gravel patches; tuff/andesite rim boulders | x92..99 z21..27; x68..119 z20..42 | P3 | playGround, boulder |
| 16 | Water runnel | stone channel: stone floor y2, stone sides y3, 1-wide water y3, smooth_stone_slab lip; runs across x119 | x90..119 z38 | P3 | runnel |
| 17 | Outpost fence | spruce_fence y4, stripped_spruce_log post every 6, spruce_fence_gate at gaps | per OPENINGS | P3 | lowFence |
| 18 | Meadow and mown loop | tall_grass/short_grass, cornflower/allium/dandelion drifts; 2-wide mown grass_block loop | x50..67 z18..46 | P3/P5 | meadowDrift |
| 19 | Picnic tables (3) | spruce_fence post, top spruce_slab, spruce_stairs seat each side | (54,3,24) (62,3,30) (56,3,40) | P3 | picnicTable |
| 20 | Cliff Walk and railing | smooth_sandstone 3 wide z58..60 y7; stripped_spruce_log posts every 4, spruce_fence y8 on z57 | x62..119 | P4 | cliffRail |
| 21 | Two overlook decks | spruce_planks y7, stripped_spruce_log posts to ground, rail N/E/W, 2 benches facing north, 2 lamp posts each | x74..81 and x100..107 z50..56 | P4 | overlookDeck, bench |
| 22 | Seating terraces | 3 tiers (y7/8/9); calcite riser + spruce_slab seat, 2-wide aisle breaks of slab half-steps | x52..77 and x100..115 z89..103 | P4 | seatWall, tier |
| 23 | Promenade and planters | light_gray_concrete, calcite edge band, calcite planters 1 high with grasses every 10 on z103, 6 benches | x50..119 z104..107 | P4 | promenade, planter, bench |
| 24 | Freestanding seat walls | calcite + spruce_slab top, 6-10 long | (70..79,92..101,104..113; 8; 85) | P4 | seatWall |
| 25 | Coastal scrub and drifts | azalea/flowering_azalea leaves mounds 1-2 high, ferns, dead_bush, sweet_berry_bush, moss_block/moss_carpet, allium/cornflower in 5-12 drifts, sunflower 3 clumps of 3 | bluff, beds | P5 | shrubMound, drift |
| 26 | Cypress and pine groves | dark_oak_log 4-6 + flat wind-shorn dark_oak_leaves; spruce_log 5-7 + umbrella of spruce_leaves; groves per plan table | plan.md | P5 | cypress, pine |
| 27 | Lamp posts and hidden light | dark_oak_fence x3 + lantern every 9-10 on paths and forks; `light` blocks on 11-block grid ringed by moss_carpet; none in bores or on B pads | all paths | P6 | lampPost, hiddenLight |

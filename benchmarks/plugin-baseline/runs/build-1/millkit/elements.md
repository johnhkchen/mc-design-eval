# REQUIRED ELEMENTS (mill village kit, 8 plots, x 0..95, z 0..18, ground y 0)

Parts: P1 shell, P2 roofs, P3 fittings, P4 hearths, P5 yards, P6 lane+lights. Coordinates from plan.md.

| # | element | real construction | coordinates | part | vocab |
|---|---|---|---|---|---|
| 1 | Lane | gravel z1..3, dirt_path ruts z1 and z3, coarse_dirt edges z0,z4, y0 | x0..95 z0..4 | P6 | lane_strip |
| 2 | Lantern posts | spruce_fence y1..3 + standing lantern y4, at z4 | x 0,12,..,84,95 | P6 | lamp_post |
| 3 | Plot side fences | spruce_fence y1 (houses), oak_fence (garden/coop/store), open dirt_path (well) | x 12i, 12i+11, z5..18 | P6 | fence_line |
| 4 | Front picket + gate | birch_fence y1 at z5, 2 fence_gates (oak/birch) at x 12i+5..6, facing south | z5 | P6 | gate_pair |
| 5 | Piers + skirting | bricks (cobblestone, 1 in 10 mossy, for store/coop) at y1, fence lattice between; ground fill beneath | per FACADES | P1 | pier_skirt |
| 6 | Plank deck + porch | oak_planks y2 (spruce store), porch posts stripped logs y3..5, rail fence y3 with gap at steps; step stairs y1 z6 facing south | z6..8 | P1 (deck, posts), P3 (rail, step) | porch |
| 7 | Plot 0 shotgun | birch clapboard walls y3..6, corner posts, open lane gable, partition z13 with open door x5 | x3..8 z9..17 | P1 | house_walls |
| 8 | Plot 1 saddlebag | spruce board-and-batten (planks field + stripped log battens), solid party wall x17..18, two front doors | x13..22 z9..16 | P1 | batten_wall |
| 9 | Plot 2 hall-and-parlour | oak clapboard, birch corner boards, partition x30 door z14 | x26..34 z9..16 | P1 | house_walls |
| 10 | Plot 3 mirrored variant | jungle planks, dark oak posts, mirrored openings | x39..44 z9..17 | P1 | house_walls |
| 11 | Real windows | glass_pane in 1x2 / 2x2 openings with slab sill below and log lintel above, panes connected | OPENINGS table | P3 | window |
| 12 | Doors | both halves, same facing/hinge, facing out (north); double doors hinged mirrored | OPENINGS table | P3 | door |
| 13 | Shutters | open *_trapdoor lying flat on the wall beside windows | per FACADES | P3 | shutter |
| 14 | Tin/shingle roofs | roof tool: polished_andesite, mangrove, spruce-shingle, weathered_cut_copper; verge, overhang, ridge | ROOFS table | P2 | roof.json |
| 15 | Porch shed roofs | stairs y6 z7 rising, slab at the wall y7, same material, verge | z7..8 | P2 | porch_roof |
| 16 | Roof framing | `trusses` king post in roof.json for houses | houses | P2 | roof.json |
| 17 | Chimneys x4 | brick stack from own footing y1, deepslate_bricks band, stepped cap, hay_block + lit signal campfire at top | RESERVED | P4 | chimney |
| 18 | Stoves | lit smoker/furnace (facing room) beside chimney, y3, fed through the chimney wall | RESERVED stove cells | P4 | stove |
| 19 | Beds for families | bed() both halves, 2 clear above, door reachable (rooms' designers) | RESERVED | rooms | bed |
| 20 | Tables | fence post + top slab / pressure plate | in rooms | rooms | table |
| 21 | Kitchen garden | fence ring, farmland rows with wheat/carrots/potatoes/beetroots (age 7), centre path, bridged water channel on stone | x48..59 | P5 | crop_bed, channel |
| 22 | Composter, scarecrow, barrel, rain barrel | composter level 4, scarecrow oak_fence+hay_block+carved_pumpkin, barrel up, water_cauldron level 3 | z16..17 | P5 | scarecrow |
| 23 | Coop | cobblestone piers, spruce walls y2..4, spruce gable roof, chicken door (open trapdoor), keeper door, nesting boxes (hay_block/barrel alternating) | x63..68 z12..16 | P1 shell, P2 roof, P5 fittings | coop |
| 24 | Run, feed trough, water trough, straw | oak_fence ring; trough = oak_slab top row z8 x62..64 on fence-less ground; water_cauldron; hay_block | x60..71 | P5 | trough |
| 25 | Shared well | cobblestone ring 76..79 x 9..12 around water shaft, 4 oak posts, oak stair gable, oak_log beam, iron_chain + lantern | plot 6 | P5 | well |
| 26 | Bench | 2 oak_stairs facing south + trapdoor armrests | x74..75 z14 | P5 | bench |
| 27 | Shade tree | oak_log trunk y1..6 at 81,15, ragged persistent oak_leaves crown | plot 6 | P5 | tree |
| 28 | Wash line | oak_fence posts x73, 79; rail y4; white/colored wool sheets hung (y3) | z17 | P5 | wash_line |
| 29 | Company store | dark oak walls, birch false front stepped, cornice, pilasters, double door with transom, shop windows | x85..94 | P1 shell, P3 fittings | false_front |
| 30 | Store sign | banner letters "STORE" via bannerWord on false front band y9..10, hanging signboard "MILL CO" | x87..91 z8 | P3 | store_sign |
| 31 | Store porch | spruce deck, posts, andesite slab shed roof, steps, bench and barrels at ends | z6..8 | P1/P2/P3 | porch |
| 32 | Counter, shelves, barrels, crates, job-site blocks | rooms' designer: top slab counter x86..91 z13, composter 86, smoker 87, barrel 88, loom 92, fletching_table 93 at z16 | store room | rooms | counter |
| 33 | Loading platform | barrels/crates on outside back wall | x93..94 z18 | P5 | crate_stack |
| 34 | Lighting (no spawns) | lanterns under porch roofs, posts at gates, hanging lanterns inside | all | P6, rooms | lamp_post |
| 35 | Wood pile, back steps | stripped logs x4 y1 z18, oak_stairs back steps | plot 0 z18 | P5 | woodpile |
| 36 | Flower/herb beds | flowers on grass, 3x1 | plot 1 z17 | P5 | crop_bed |

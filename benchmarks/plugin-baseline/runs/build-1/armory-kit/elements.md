# REQUIRED ELEMENTS (checklist)  — 1.21.1 ids only: `chain` (NOT iron_chain), no concrete slabs (use smooth_stone_slab / smooth_quartz_slab)

Parts: P1 armory-shell, P2 armory-roof, P3 pavilions, P4 glasshouse, P5 galleries, P6 grounds.

| # | element | real construction (block by block) | coordinates | part | vocab |
|---|---|---|---|---|---|
| 1 | Armory cream concrete hall, 4 storeys | smooth_sandstone walls 2 thick, floor lines y0/7/14/21, deck 28 | A x0..107 z4..35; B x4..103 z36..131; C x0..123 z132..143 | P1 | bandedStorey |
| 2 | chocolate-brown horizontal bands | brown_terracotta course at y8,15,22 (sill) and y27 (frieze), full face length, flush | all Armory faces | P1 | bandedStorey |
| 3 | polished plinth | polished_andesite y1, polished_andesite_stairs not needed | all Armory faces | P1 | bandedStorey |
| 4 | strip windows | glass_pane (connected N/S or E/W states) 1 back, 3 high y9-11,16-18,23-25, ground y2-5; 6 wide, 2-wide piers; smooth_stone_slab (top) sill under each, smooth_sandstone_stairs (upside down) not needed | runs per plan FACADES | P1 | stripWindowRun |
| 5 | corner-pavilion tall slots | 2-wide glass_pane x5..6, x101..102 at z4, y2..25, brown_terracotta cap y26 | A-W / A-E | P1 | slotWindow |
| 6 | south glass curtain wall onto the Space Needle | smooth_quartz mullions x=9+7k y1..26 at z143, transoms y7,14,21, glass_pane at z142 (full-height panes), brown_terracotta frieze y27, bookends smooth_sandstone x0..8, 115..123 | C south z142/143 | P1 | curtainWallBay |
| 7 | food hall seen through the glass: atrium | open air x20..87 z36..142 y1..22, side-aisle floors at y7,14,21 (smooth_stone, edge smooth_quartz_slab), iron_bars railing y+1 at x20 / x87 | per FLOORS | P1 (shell) + room designers | atriumRailing |
| 8 | steel roof trusses | light_gray_concrete chords y27 & y23, andesite_wall webs (verticals + diagonals as stairs-free walls), `chain` hangers, every 8 z (z=40+8k) | x20..87 | P2 | steelTruss |
| 9 | roof monitors + skylights | smooth_quartz posts, glass_pane between, glass skylight y35, smooth_quartz_slab rim y36; deck below left OPEN | M1 x28..39, M2 x68..79, z44..123 | P2 | roofMonitor |
| 10 | flat roof, parapet, coping | `$MCD roof` flat-parapet y28, parapet smooth_sandstone y29-30, smooth_sandstone_slab y31 | A,B,C | P2 | copingParapet |
| 11 | North porch with ARMORY fascia | 4 smooth_sandstone posts, smooth_sandstone_slab canopy y5, brown_terracotta fascia y6, banner letters ARMORY, red_terracotta door surround, birch_door pairs | x60..63 z0..4 | P2 | porchCanopy, plaque |
| 12 | South glazed vestibule | quartz posts every 7 x, glass_pane, glass roof y7 w/ smooth_quartz_slab rim, 3 birch_door pairs | x4..111 z144..147 | P2 | vestibuleGlassBox |
| 13 | doors | birch_door both halves, flush at y0 (no step) | OPENINGS table | P1/P2 | doorPair |
| 14 | red accent only at porch + B west door | red_terracotta surround | x60..63 z5; x4 z85..86 | P1/P2 | doorPair |
| 15 | East pavilions D, D1, D2: white panels + glass | white_concrete piers every 7, floor band y7, glass_pane between, light_gray_concrete base y1 and coping, flat | D x136..207 z96..119 y0..15; D1; D2 | P3 | pavilionBay |
| 16 | red canopy over D entrance | red_concrete fascia y5 over smooth_quartz_slab soffit, 4 smooth_quartz posts | x168..175 z93..95 | P3 | redCanopy |
| 17 | Galleria arcade, glass skylight strip | quartz deck edge y6, glass 2 wide down each middle, glazed fronts | E rects | P3 | galleriaSkylight, pavilionBay |
| 18 | lightwell courtyard | polished_andesite paving, 1 oak tree, lamp post | x104..107 z128..131 | P6 | planeTree, lampPost |
| 19 | Glasshouse pointed glass vault | per-bay cross-section, `glass` surface, smooth_quartz ribs/purlins, polished_blackstone curb y1 | 10 bays z4..43 | P4 | vaultBay, vaultRib |
| 20 | vault end gables + lightning_rod finials | glass triangles with quartz mullions every 3 x; lightning_rod y21 on end ribs | z4, z43 | P4 | vaultEndGable |
| 21 | CHIHULY flower hanging inside | cloud of orange (most), red, yellow stained_glass blocks + glass, shroomlight ~1/40, end_rod spikes, `chain` hangers from the ridge | bays 1..8 z9..38, dx<=4, y10..17 | P4 | chihulyFlower |
| 22 | Glasshouse floor + lights | polished_blackstone, sea_lantern inlays every 4 z at dx 5 | y0 | P4 | vaultBay |
| 23 | Glasshouse vestibules | glass box, smooth_quartz frame, slab roof, doors | H1, H2 | P4 | vestibuleGlassBox |
| 24 | Galleries dark flat boxes with green roof | gray_concrete y3..11, deepslate_tiles plinth y1-2, polished_deepslate fins every 6, deck moss_block y12, parapet y13 deepslate_tiles, coping polished_deepslate_slab | G1,G2,G3 | P5 | galleryFace, greenRoofPatch |
| 25 | slot windows | gray_stained_glass_pane 1 wide y3..9 | x257/x296 z20,36,52,68,84 | P5 | gallerySlotWindow |
| 26 | glass entrance under projecting canopy | glass_pane + smooth_stone mullions every 4 x at z4; canopy polished_deepslate_slab (top) y7, sea_lantern downlights | x263..282 z0..4 | P5 | canopySlab |
| 27 | CHIHULY sign band | black_concrete board x263..282 z1 y8..11, white banner letters at z0 (bannerWord face north) | x269..275 y9..10 | P5 | signBand |
| 28 | coloured glass sculptures at doors/gardens | stained glass columns (red/orange/yellow/blue) 3-5 high + end_rod tops | (264..265),(280..281) z1..2; gardens | P5/P6 | glassBlossom |
| 29 | lawn with curving path, plane-like trees | grass_block, polished_andesite path 2 wide, oak logs 5 high + oak_leaves persistent wider crown | x108..220 z0..95 | P6 | lawnPath, planeTree |
| 30 | lighting so nothing spawns | lanterns on parapets every 8, lamp posts every 8-10 on paths, sea_lantern floors, shroomlight | everywhere | P6 (+each part) | lampPost |
| 31 | plaza paving + planting strips | smooth_stone, polished_andesite, grass strips w/ flowers | z148; x0..3 z36..131 | P6 | lawnPath |

# REQUIRED ELEMENTS: Capitol West Front Grounds (plot 0, module box x0..184 z0..124 y0..32)

All coordinates are module coordinates from plan.md. H(x,z) = the mapped ground height. "Vocab" names are defined in plan.md VOCABULARY.

| # | Element | Real construction, block by block | Coordinates | Part | Vocab |
|---|---------|-----------------------------------|-------------|------|-------|
| 1 | Ground to the height map | stone y1..H-4, dirt 3 courses, grass_block at H; outer 2 cells of every edge exactly H | whole box | parts/ground.mjs | groundColumn |
| 2 | Reflecting Pool | smooth_stone floor y1 (fill y1..2 under coping), water y2 (one deep), straight sides | x20..55, z16..109 | ground | poolBasin |
| 2a | Pool coping | outer row polished_andesite full block at y3, inner row smooth_stone_slab (bottom) at y3 touching water; 2 wide ring | x18..57, z14..111 | ground | copingRing |
| 2b | Pool walk | smooth_sandstone at H, 2 wide, joins coping | x16..17, 58..59, z12..113 | walks | walkStrip |
| 3 | Union Square plaza | smooth_stone at y3, polished_andesite border band every 6 cells | x60..70, z10..114 | ground | plazaPaving |
| 4 | Grant Memorial platform | smooth_quartz 7x23, y4..6, polished_diorite base course y4 one proud, smooth_quartz_slab rim y7 (gaps at x60/x66 z74..82), glowstone under rim slabs at corners and mid-sides | x60..66, z67..89 | parts/grant.mjs | memorialPlatform |
| 4a | Platform steps | smooth_quartz_slab bottom: y4 at x59/67 and y5 one cell inboard, z74..82 | as listed | grant | slabStep |
| 4b | Grant pedestal | quartz_pillar 3x3, y7..10; y11 course polished_blackstone | x62..64, z77..79 | grant | pedestal |
| 4c | Grant on horse | see bronzeHorseman: legs blackstone walls y12, body y13, stair head facing west, rider y14..15 | x62..64, y12..15, z77..79 | grant | bronzeHorseman |
| 4d | Four lions | lionCouchant: polished_blackstone block + stair (facing the pedestal) | (61,7,75)(65,7,75)(61,7,81)(65,7,81) | grant | lionCouchant |
| 4e | Cavalry group (north) | three horses charging west on white base y7 | x61..65, z67..71 | grant | cavalryGroup |
| 4f | Artillery group (south) | horse team, gun, limber on white base | x61..65, z85..89 | grant | artilleryGroup |
| 5 | Statues P, g, p, J | smallStatue: quartz pedestal + blackstone figure (P white figure, blackstone top) | per plan 4..4c | grant | smallStatue |
| 6 | Central axial walk | smooth_sandstone 7 wide, bottom slab at each rise of 1; NOTHING above it | x71..155, z58..64 | walks | walkStrip, slabStep |
| 7 | Curving walks (Penn./Maryland) | 3-wide smooth_sandstone arcs through the plan points | plan 5a/5b | walks | curvedWalk |
| 8 | Cross walks | smooth_sandstone 3 wide | x70..72; x150..155 | walks | walkStrip |
| 9 | West Lawns | grass_block at H, open | plan 6/6a | ground | groundColumn |
| 10 | Tree groves & edge trees | dark_oak_log 5..7 high, crown dark_oak_leaves radius 3..4 with oak_leaves patches, persistent, podzol/rooted_dirt patch under | plan Trees table | parts/trees.mjs | oakTree |
| 11 | Olmsted Terrace Tier 1 | smooth_quartz wall, polished_diorite plinth at y6 (x158), quartz_pillar pilaster every 6 z, smooth_quartz_slab cornice y9 at x158, paving y9 | x159..182, z14..110 | parts/terrace.mjs | marbleTier, pilaster |
| 11a | Tier 2 | same order one level up, face x171, paving y11 | x171..182, z30..94 | terrace | marbleTier |
| 12 | Balustrades | diorite_wall y10 (Tier1) / y12 (Tier2), quartz_pillar piers every 8, smooth_quartz_slab rail; broken at stair gaps | plan 7b/8a, OPENINGS | terrace | balustradeRun |
| 13 | Urns | decorated_pot on pier top; on every stair cheek foot | plan 12 | terrace | urnPier |
| 14 | Monumental staircases | quartz_stairs treads, smooth_quartz cheek walls following the slope | plan 9, 9b, 10, 10a, 10b | terrace | terraceFlight |
| 15 | Grotto fountain & upper fountain | smooth_quartz basin, water, niche recess by omission at x159, spout water source, urns | plan 9a, 9c | terrace | fountainBasin, grottoNiche |
| 16 | Planting beds | moss_block base, azalea_leaves hedge, flowering_azalea_leaves accents, shroomlight every 4th cell hidden | plan 11 | trees | hedgeBed |
| 17 | Lamp posts | polished_blackstone_wall x2 + lantern; every 10 along walks, 12 on coping | plan 13 | parts/lamps.mjs | lampPost |
| 18 | Floodlighting (no mob spawns) | shroomlight in crowns/hedges, glowstone under Grant rim, lanterns under pier coping | plan Lighting | lamps | floodlight |
| 19 | Open axis corridor | z44..80 empty above H+1 except pool, memorial, statues, terrace, thin lamp posts | corridor | all | (rule) |

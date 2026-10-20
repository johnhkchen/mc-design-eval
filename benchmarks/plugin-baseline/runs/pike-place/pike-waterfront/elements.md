# REQUIRED ELEMENTS (kit frame coordinates; all ids valid in 1.21.1)

| # | element | construction (block by block) | where | part | vocab |
|---|---|---|---|---|---|
| 1 | Pier deck on piles | spruce_planks deck y3 on every # cell of plot 0; stripped_spruce_log pilings (axis y) y0..2 under the edge ring every 4th cell + 1 in, dark_oak_planks cap y3 over each pile | plot 0 footprint | A pier shell | pilingRun, deckFill |
| 2 | Pier shed walls | dark_oak_planks plinth y4; birch_planks y5..16; stripped_spruce_log posts (axis y) at s%8==0; head plate log y16 (axis along wall); mid rail y10 | d -40..-39 / -15..-14, s 100..243 | A | diagBand, shedBay |
| 3 | Shed gable roof, dark grey | deepslate_tiles full + deepslate_tile_slab(bottom) stepped per architect e rule, ridge polished_deepslate y26 on d=-27, eave fascia dark_oak_planks y17, barge course s99/s244 | ridge d=-27, s 99..244 | B roof | shedRoofSlice |
| 4 | Skylights | light_blue_stained_glass 3x3 strips at e 6..8 both slopes every 12 s from s112, lit by shroomlight under | roof | B | skylight |
| 5 | Shed windows, lit | glass_pane two per bay (y6..8, y12..14), 4 wide, shroomlight 2 cells inside each | both long walls | D facade | shedWindow |
| 6 | Sea-life murals | flush mosaic: blue_concrete ground, cyan_terracotta + light_blue_terracotta waves, yellow_terracotta + white_concrete fish | east wall s140..155, s196..211, y5..9 | D | fishMural |
| 7 | Loading door + gable window NW | glazed 2-storey opening s100..101, d-30..-24, y5..12 (glass_pane in dark_oak frame); gable window d-28..-26 y19..22 | NW gable | D | shedWindow |
| 8 | Promenade doors | spruce_door pairs (lower/upper, hinge mirrored) | east wall s120..121,176..177,224..225 | D | doorPair |
| 9 | Entrance pavilion, modern glass | polished_deepslate base y4; glass curtain y5..11 with smooth_quartz mullions every 3rd z; flat smooth_stone roof y17; polished_deepslate parapet y18 + iron_bars | x100..117, z131..151 | A/D | curtainWall |
| 10 | SEATTLE AQUARIUM sign | black_concrete board x117 z133..149 y13..15, white-on-blue banner word via plaque/bannerWord facing east | pavilion east | E signs | aquariumSign |
| 11 | Blue wave arch mosaic | light_blue_terracotta, cyan_terracotta, prismarine_bricks arched panel | x117 z145..150 y5..12 | E | waveArch |
| 12 | Canopy and doors | spruce_slab canopy y12 x118..119; two glass double doors z137..140 y5..6; slab ramp x118..119 | pavilion front | D | canopy |
| 13 | Decking rails and lamps | spruce_fence y4 along edges; lamp post = 3 spruce_fence + lantern every 8 | all pier edges | E | lampPost, railRun |
| 14 | Bay-end pools | smooth_stone rim y4..5, water inside | seal rim x8..19 z24..35; tide x24..35 z38..47 | A | poolRim |
| 15 | Planters and trees | 3x3 smooth_stone rim y4, dirt, oak_log trunk, oak_leaves persistent to y9 | 5 sites per architect | E | planterTree |
| 16 | Low dock | spruce_planks y2, posts to ground, 2-wide slab ramp x44..45 z30..33 | x44..67 z12..43 | A | deckFill |
| 17 | Bay Wing halls | smooth_sandstone walls, cut_sandstone string at deck-1, stone_bricks plinth, smooth_stone roof deck y11/8/10 | plot 1 masses | C wing | hallBox |
| 18 | Ribbon windows | light_blue_stained_glass_pane y6..8 along outer and court faces | plot 1 | C | ribbon |
| 19 | Rooftop seal and otter pools | smooth_stone rim y12..13, water inside | otter 158..169 z14..27; seal 134..149 z31..38 | C | poolRim |
| 20 | Underwater dome | light_blue_stained_glass hemisphere r8 centre (146,10,80), end_rod ribs on 4 meridians, sea_lantern inside | x138..154 z72..88 | C | glassDome |
| 21 | Viewing deck and rails | smooth_stone y8, cut_sandstone_slab parapet + iron_bars | Link 156..173 z44..61 | C | deckRail |
| 22 | Landings blocks | smooth_sandstone stucco y6+, bricks base y1..5 (0 on west strip), cut_sandstone_slab(top) string y6, cut_sandstone cornice | plots 2,3 masses | F, G shells | stuccoBlock |
| 23 | Corner glass bays | light_blue_stained_glass in smooth_quartz piers, white_concrete floor bands | per architect list | H facade | cornerBay |
| 24 | Loggia balconies | 2-deep recess, iron_bars rail, glass door pair at back | B1/E1, spine C every 6 | H | loggia |
| 25 | Shopfronts and awnings | glass y2..4, door per 6 bay, warped_stairs/warped_slab awning y5 + dark_oak_trapdoor valance, lit candles/shroomlight inside | street faces | H | shopBay, awning |
| 26 | Rooftop terraces and penthouses | modern parapet, iron_bars rail, polished_deepslate cap 1 overhang; stepped terraces | roofs | H | terraceRail |
| 27 | Dusk lighting | lanterns on posts/eaves, shroomlight and pearlescent_froglight behind glass, end_rod | all | I lights | lanternRow |

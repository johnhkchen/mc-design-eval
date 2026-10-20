# REQUIRED ELEMENTS (module coords; y 0 = world 5; plaza surface y 5)

Tick each when built. "Part" = PARTS in plan.md. Vocab = helper in VOCABULARY.

| # | Element | Construction (block by block) | Coordinates | Part | Vocab |
|---|---|---|---|---|---|
| 1 ✓ | Ground / knoll | per column: stone y1..h-4, dirt h-3..h-1, grass_block at h (map digit); outer 2 edge rings exactly h | whole box | 1 | groundColumn |
| 2 | Lower shaft, pale | smooth_quartz solid 7x7, flush, no trim | x47..53 z47..53 y6..24 | 2 | shaftCourse |
| 3 | Colour line | crisp: y24 quartz, y25 first cream course; no transition | y24/25 | 2 | shaftCourse |
| 4 | Upper shaft 7-wide | alternating courses: calcite (y odd), smooth_sandstone (y even), solid | y25..37 | 2 | shaftCourse |
| 5 | Taper wash | ring of the 7x7 at y38: smooth_sandstone_stairs facing inward, corners as outer-corner stairs (shape outer_left/right); centre 5x5 solid cream | y38 | 2 | taperRing |
| 6 | Upper shaft 5-wide | calcite/sandstone courses solid 5x5 | x48..52 z48..52 y38..68 | 2 | shaftCourse |
| 7 | Observation windows | tinted_glass flush, 2 per face | y66 per OPENINGS | 2 | obsWindows |
| 8 | Aircraft warning lights | red_stained_glass centre of each face y67, glowstone core (50,67,50) | y67 | 2 | obsWindows |
| 9 | Pyramidion | stairs facing inward y69 ring, core full; y70 3x3 full; y71 ring stairs, centre full; y72 full; sandstone_wall y73..74; chain axis y y75..76 (dark tip) | x48..52 | 2 | pyramidCourse |
| 10 | Round plaza | smooth_stone r<10.5 at y5, polished_andesite bands r 6.5-7.5, 9.5-10.5, ring touching obelisk | x40..60 z40..60 | 3 | plazaDisc |
| 11 | Seating walls | polished_andesite_slab bottom y6, ring 9.5<=r<10.5, 8 arcs, gaps 5 wide N/S/E/W, 3 wide diagonals; arc end cells polished_andesite full, lantern on y7 | r~10 | 3 | seatingArc |
| 12 | Screening pavilion | polished_diorite walls y6..7, flat roof y8 smooth_stone_slab field + polished_andesite coping, glass_pane bands N/S x55..57 y7, east door 2x2 at x58 z50..51, hanging lantern (56,7,50), floor smooth_stone | x54..58 z49..52 | 3 | pavilionBox |
| 13 | Flag ring (50) | end_rod up y6..10, white_concrete cap y11, white_wall_banner outward of cap with red stripe_small + blue square_top_left; paved ring walk 15.5<=r<17.5 white_concrete_powder at y5 | r=16 | 4 | flagPole |
| 14 | Flag lighting | ochre_froglight flush in the ring walk under each pole's base | beside poles | 4 | floodlight |
| 15 | Base floodlights | ochre_froglight replacing paving | per RESERVED | 4 | floodlight |
| 16 | Walks | white_concrete_powder on solid ground (never over air); Mall E/W 3 wide z49..51, N/S 3 wide, 4 diagonals 2 wide, great ring r31..33; half steps smooth_stone_slab bottom | per plan | 5 | walkCell |
| 17 | Lamps | andesite_wall post + lantern (standing), one every 9 cells beside walks | walks | 5 | lampPost |
| 18 | Lawn lights | ochre_froglight surface cell at x%12=6,z%12=6 on lawn | lawn | 5 | floodlight |
| 19 | Trees (12) | oak_log axis y h+1..h+5, oak_leaves persistent crown r2 h+4..h+7, not a perfect sphere | RESERVED list | 5 | oakTree |
| 20 | Survey Lodge | stone_bricks walls y3..4, stone_brick_stairs hip y5 facing outward, ridge slab, glass_pane (83,4,99) | x83..85 z98..99 | 6 | lodgeHip |
| 21 | No-spawn lighting | every dark surface has a light source within ~7 (froglights, lanterns) | whole | 4-5 | floodlight |

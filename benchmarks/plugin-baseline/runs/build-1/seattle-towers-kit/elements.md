# REQUIRED ELEMENTS (Seattle Center modern neighbours)

Coordinates are plot-local (plan.md). Parts: P1 KOMO shell, P2 Hyatt+Aperture shell, P3 roofs & crowns, P4 dishes, P5 facade fittings, P6 grounds & lighting.

| # | element | construction (block by block) | where | part | vocab |
|---|---|---|---|---|---|
| 1 | KOMO white office bodies | `white_concrete` walls 1 thick, floor slabs `polished_diorite` at y 0,7,12,17,22,27,32; roof slab y 37 (E north) / 32 (E south) / 37 (W) | E 4..103,0..38,4..47 etc. | P1 | ribbonBand |
| 2 | Horizontal ribbon windows | per storey slab s: rows s+1..s+3 `gray_stained_glass_pane`, rows s+4 and s+5 (next slab) solid `white_concrete`; `light_gray_concrete` mullion 1 wide every 7th column; corners 2 solid white | all upper faces | P1 | ribbonBand, pierRhythm |
| 3 | Curved green-glass drum (E) | circle c(13,20) r11, `cyan_stained_glass` y1..41, `white_concrete` ring (1 thick) at y 7,12,...,37 and 41; ground storey clear `glass` | E x2..24,z9..31 | P1 | curtainDrum |
| 4 | Drum crown "flying saucer" | ring r13 `smooth_quartz_slab` (top) y42, `iron_bars` rail y43 on outer edge, `smooth_quartz` lid y41, penthouse r7 `cyan_stained_glass` y42..43 with `smooth_quartz` slab lid y44 | E (13,20) | P3 | crownRing |
| 5 | North bow (E) and half-drum bow (W) | circular segment of `cyan_stained_glass` + white rings same y as drum; W bow r13 c(127,14) crown ring r14 y42, rail y43 | E 48..75,z0..4; W 114..140,z1..14 | P1 (glass) P3 (crown) | curtainDrum, crownRing |
| 6 | Satellite dishes (E 11, W 3) | per plan DISHES: 3x3 `polished_andesite` pedestal 2 high, `iron_block` yoke, bowl `white_concrete` (layered discs tilted ~30deg toward +z, upward), `smooth_quartz` rim, `iron_bars` feed arm, `end_rod` tip | plan.md table | P4 | dish |
| 7 | Glazed ground floor + colonnade | `glass` y1..5 set back 2; `light_gray_concrete` columns 2x2 every 8, y1..6; `gray_concrete` band y6; `smooth_quartz_slab` lip y7 | KOMO N/E faces | P5 | colonnade |
| 8 | Projecting fins | `light_gray_concrete` 1x1 at z3, y7..36 at x 18,32,46,78,92 | E north face | P5 | finRow |
| 9 | KOMO 4 sign + emblem | banner-letter plaque x28..38,y30..34 z3; 4x4 blue/red `blue_concrete`/`red_concrete` square x40..43 | E north | P5 | komoSign |
| 10 | Hyatt wedge, sawtooth west face | stepped rects per plan, walls `smooth_sandstone`/`light_gray_concrete` piers alternating, `white_concrete` spandrels | Hyatt | P2 | punchedWindow, sawtoothStep |
| 11 | Hyatt punched windows | 2x3 `light_blue_stained_glass_pane` every 4 blocks, rows s+1..s+3 | all guest storeys | P2 | punchedWindow |
| 12 | Hyatt glazed lobby + court canopy | `glass` y1..5 between `light_gray_concrete` columns every 4; `smooth_quartz_slab` canopy y6/7; pilotis passage x164..171 z56..63 | Hyatt | P2 P5 | lobbyGlazing, canopy |
| 13 | Hyatt plant screen | `light_gray_concrete` kerb y38, `iron_bars` y38..43, `smooth_stone_slab` lid y44 | 168..187,70..85 | P3 | plantScreen |
| 14 | HYATT HOUSE sign | banner letters x156..171,y13..16,z63 | Hyatt | P5 | plaque |
| 15 | Aperture panel facade | alternating DARK bay (`gray_concrete` + `polished_deepslate` spandrel) / LIGHT bay (`white_concrete`), 5 wide, window 3x3 `glass_pane` | Aperture | P2 | apertureBay |
| 16 | Aperture balconies | 5x2 `smooth_stone` slab-floor at z0..1, `glass_pane` rail slab+1 on north/side edges, per storey stagger | north face | P5 | balconyBay |
| 17 | Aperture shopfronts | `glass` bays between `polished_deepslate` piers, `black_concrete` fascia y6, `iron_door` shop doors | z2, y1..6 | P5 | shopfront, doorPair |
| 18 | Roof terrace pergola + overrun | pergola: `oak_fence` posts with `oak_slab` rafters frame y38..40 at 210..225,10..25; overrun `white_concrete` box 230..237,20..27 y38..40 | Aperture roof | P3 | pergola |
| 19 | Parapets and copings | `white_concrete` (Aperture `gray_concrete`) parapet 1 above slab, `smooth_stone_slab` coping, iron-bar rail | every roof | P3 | modern roof preset |
| 20 | Lift/stair cores | `ladder`-free stair `quartz_stairs` flights + `bubble_column` lift shaft in `glass` | plan cores | P1/P2 | (interior designers) |
| 21 | Planters, trees, lamp posts, curved bench row | `polished_andesite` kerb + `moss_block`/`azalea_leaves`; oak trees; `oak_fence` post + `lantern`; bench `smooth_quartz_stairs` | plazas, courts | P6 | planter, lampPost, benchRow |
| 22 | Lighting | flush `sea_lantern` in ceilings, 6 spacing; roof `lantern` on parapet every 8 | all | P6 | ceilingLamp |

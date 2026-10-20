# Taipei 101 — REQUIRED ELEMENTS

Coordinates are plot-local (plan.md). Parts: P1 tower-pedestal, P2 segment, P3 crown, P4 mall, P5 medallions-canopies-grounds, P6 dusk-lighting. Vocab names are the helpers in plan.md VOCABULARY.

| # | element | real construction, block by block | where | part | vocab |
|---|---|---|---|---|---|
| 1 | Eight-segment bamboo/pagoda read | ONE segment: 8 bands of inverted-frustum glass wall, 1 block out per 6 courses (62 sq at y0 to 76 sq at y42..45), each band's step course 2 wide closing the soffit; top ledge y46 76 sq overhangs the next foot | plot 1 y0..46 | P2 | bandRing, stepCourse, ledgeSlab |
| 2 | Pedestal: truncated pyramid, 26 floors | 7 rings stepping in 1 per side every 24 courses from 76 sq to 62 sq, glass grid, bottom-slab dark_prismarine_slab sill at each step, solid flat roof y157 62 sq | plot 0 x96..171 z108..183 y1..157 | P1 | bandRing, stepCourse, ledgeSlab |
| 3 | Green-blue glass grid | cyan_stained_glass body, light_blue_stained_glass course under each floor line, light_gray_concrete mullions at box-local x or z = 1 mod 4 (same absolute positions in every band), dark_prismarine floor-line ring; glass 1 thick, hollow behind | pedestal, segment, pinnacle | P1 P2 P3 | glassCell |
| 4 | Darker band at each floor line | dark_prismarine ring at pedestal y = 2 mod 6, segment y 0,6..42 (2 wide where the wall steps) | same | P1 P2 | glassCell, stepCourse |
| 5 | Notched corners (double sawtooth) | leave out cells (a<2,b<4) or (a<4,b<2) per corner of each band; wall follows outline; noses (4,0),(0,4) light_gray_concrete, (2,2) corner strip | segment, pedestal | P1 P2 | notchRing |
| 6 | White-gold corner light strips | ochre_froglight column on the (2,2) nose of each corner, every band, y1..45, stepping out 1 with each band | segment corners | P2 | cornerStrip |
| 7 | Lit band at each segment top ledge | y44 light_blue_stained_glass ring, sea_lantern ring directly inside (1 in); y45 smooth_quartz fascia | segment | P2 | litBand |
| 8 | Scatter of lit office floors | ~12% of glass cells in clumps 2-4 x 1-2 rows: ochre_froglight (warm) or pearlescent_froglight (cool) in the cell one inside the glass; 2 warm:1 cool, denser S and E | pedestal, segment, pinnacle | P6 | litWindow, litClump |
| 9 | Ruyi ornaments | 8 x 9 iron_block cloud-scroll over short stem, smooth_quartz outline on head, gray_concrete eyes, 1 deep, proud of wall | segment foot, 4 faces centred | P2 | ruyi |
| 10 | Giant coin medallions (4) | disc r11, gold_block rim 2, raw_gold_block field, yellow_terracotta ring, 6x6 hole framed by gold_block, 2 deep, back fill so it stands on wall; shroomlight uplight row y129 | pedestal 4 faces | P5 | coin, uplightRow |
| 11 | Tall glazed entrance halls | clear `glass` panes/blocks with light_gray_concrete mullions every 2, y3..40 on N and E faces following the taper; doors 12 wide; warm ochre_froglight behind every 3rd cell | pedestal N z108, E x171 | P1 | hallGlazing |
| 12 | Podium mall (6 storeys, stepped roofs) | MALL BASE y2..36 deck 35, MIDDLE deck 46, NW block deck 68; smooth_stone spandrels, light_blue glass bays between polished_diorite piers every 8 | plot 0 | P4 | mallMass, mallFacade |
| 13 | Mall entrance on Xinyi Road + glass canopy | opening x74..90 y3..10; canopy glass deck y12 x65..99 z0..9 on 5 quartz columns, quartz edge beam; slab ramp z8, landing z9 | north | P4 P5 | canopy, slabRamp |
| 14 | Mall sign | gray_concrete band x40..130 y26..34 on z10 face, sea_lantern block letters TAIPEI 101 MALL via plaque | north mall face | P5 | mallSign |
| 15 | Roof gardens, skylights | moss_block/grass_block patches, oak trees (trunk 4, persistent leaves), light_blue glass skylight strips, parapet + smooth_quartz coping; light blocks hidden under leaves not needed: lanterns | each deck | P4 P5 | roofGarden |
| 16 | Lit shopfronts, lobbies | glass y3..10, ochre_froglight or lanterns one cell behind most bays; smooth_quartz fascia y11..12 | all mall faces, pedestal halls | P4 P6 | shopBay |
| 17 | Crown observatory | 52 sq glass box y1..11, lit band y10, fascia y11, outdoor deck y12 with iron_bars rail y13 | plot 2 | P3 | bandRing, litBand, deckRail |
| 18 | Stepped pinnacle (3 tiers) | 26/28/30 sq flared bands y13..80, light_blue glass with cyan under floor bands, corner notches, ledges at 35/57/80 | plot 2 | P3 | bandRing, ledgeSlab |
| 19 | Cap | 20/16/12 sq stepped solid smooth_quartz / iron_block / light_gray_concrete y81..92 | plot 2 | P3 | capStep |
| 20 | Spire + lightning rod | 2x2 iron_block y93..122, light_gray_concrete 1x1 y123..150, iron_bars y151..170, end_rod y171..174, lightning_rod y175 | x37..38 | P3 | spireSection |
| 21 | Red aircraft lights | red_stained_glass around a sea_lantern at y100,115,140,160,171 and cap corners y92 | spire, cap | P3 P6 | aircraftLight |
| 22 | Light on every roof/terrace | sea_lantern flush in ledges every 4-5 cells; mall decks: lanterns on parapet every 6; no dark cell >= light 0 on any walkable top | all roofs | P6 | deckLights |
| 23 | Plaza, paving, lamp posts, planters | smooth_stone/polished_andesite checker, planters of oak_leaves in smooth_quartz, lamp posts (cobblestone_wall + lantern) every 9 | east/south plaza, drive | P5 | lampPost, planter |
| 24 | East and south canopies | glass deck y12 on 4 quartz columns | pedestal E, S | P5 | canopy |

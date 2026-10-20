# REQUIRED ELEMENTS (checklist)

Coordinates are the kit's plot-local frame from plan.md. "V:" = vocabulary helper (plan.md VOCABULARY). Parts: P1 castle-shell, P2 castle-roofs-lights, P3 ai-shell, P4 ai-roofs-lights, P5 freer, P6 hirshhorn.

## Plot 0: Castle (P1 masonry, P2 roofs/lights/grounds)
- [ ] Main building x14..40 z8..14 y0..9, red_terracotta body, plinth y0 red_nether_bricks, 3 storeys (string courses y4 granite slab top, proud 1). P1. V: ashlarWall, stringCourse
- [ ] Corbel table at eave y9 (ranges y6, wings y8): upside-down red_nether_brick_stairs proud 1 on every long face. P1. V: corbelTable
- [ ] Tall round-arched windows rows (Openings table): gray_stained_glass_pane 1x4 upper y5..8, 1x2 lower y1..2, polished_granite_stairs upside-down hood above each, granite slab sill; shroomlight glow one cell behind centre. P1 cuts + glazes, P2 glow. V: archedWindow, glowCell
- [ ] West range x7..13, East range x41..47 (y0..6). P1.
- [ ] West chapel wing x1..6 z7..15: chapel windows x1 z9,11,13 y2..6 (1x5), N gable pair x3..4 y2..6 + oculus y10, gables N/S, ridge along z. P1 walls+gable triangles (red_terracotta), P2 roof. V: archedWindow, gableEnd
- [ ] East wing x48..54 z6..16 + apse bay x55..56 z10..12 (slab roof y6). P1/P2.
- [ ] North entrance porch x25..28 z1..2 y0..3: round arch = upside-down polished_granite_stairs x26 facing east, x27 facing west at y3 over a 2-wide opening x26..27 y0..2; slab roof y4 (deepslate_tile_slab); lanterns at (24,2,1) and (29,2,1) on granite brackets. P1 shell, P2 lanterns. V: roundArch, lampBracket
- [ ] Oriel x25..28 z2 y5..8 on corbels (upside-down red_nether_brick_stairs y4), paired lights x26,x27 y5..7, slab cap y9. P1. V: oriel
- [ ] T1 North Tower x23..30 z3..8 y0..15: corbels y14 proud 1 N/E/W, deck of bottom slabs y15, parapet ring y15 (x22..31, z2) with alternating merlons y16 in red_nether_brick_wall; door x26..27 z3 y0..2; paired window y10..12; side slits. P1 shaft, P2 battlements. V: battlements, slitWindow
- [x] T2 FLAG TOWER x28..30 z5..7 y16..18 (the tallest), parapet ring x27..31 z4..8 at y18 corbelled, merlons y19, end_rod flagpole x29 z6 y19..22; slit y16..17. P2. V: battlements, flagpole
- [ ] T3 East octagonal tower x39..42 z7..10, corners chamfered, y0..14, red_nether_brick_wall ornate parapet y15 with polished_granite corner posts, slits. P1 shaft, P2 parapet. V: octoTower, battlements
- [ ] T4 x12..15 z7..10 and T5 x9..11 z8..10 front pair: shafts y0..12 (P1); slate spires + finials (P2). V: slateSpire, slitWindow
- [ ] T6 NW chapel turret x2..4 z6..8 y0..10 + slate cone y11..14 + finial y15. V: slateSpire (cone)
- [ ] T7 East wing NE tower x52..54 z6..8 y0..12, spire y13..16, finial y17.
- [ ] T8 South Tower (octagonal) x25..28 z13..16 y0..11, spire y12..15, finial y16. V: octoTower
- [ ] T9 Campanile (octagonal) x25..28 z17..20 y0..13, belfry openings y11..12 with red_nether_brick_wall louvres at y11 (air above), spire y14..17, finial y18. V: octoTower
- [x] Every spire: steep deepslate_tile pyramid/cone (stairs ring stepping in 1 per row, slab top) with lightning_rod finial; granite slab band one row under eave. P2. V: slateSpire
- [ ] Quoins: polished_granite at every corner, alternating 2 and 1 high. P1. V: quoins
- [x] Gable roofs, dark slate: main y10..14 ridge x z11 (overhang 1); ranges y7..11; wings y7/9..12/13 ridge z with verge. P2 via `$MCD roof`. V: slateRoof
- [ ] Pinnacle buttress-turrets x14..15 and x40 z15 y0..10: red_nether_brick_wall y11, lightning_rod y12. P1/P2.
- [x] Lighting: lamp posts x8,20,34,46 z3 (red_nether_brick_wall post 2 high + lantern; polished_granite_wall does not exist), ochre_froglight flush uplights every 6 cells two out from N and S walls, shroomlight glow behind every window. P2. V: lampPost, uplight
- [x] Grounds: grass z0..6 lawn, smooth_stone/gravel path x25..28 z0 into the level landing, south lawn z15..20 and 4 parterre beds x16..22 and x31..37 z17..19 (podzol + poppy/azure_bluet/dandelion edged with smooth_stone_slab), two oak trees optional. P2. V: parterre

## Plot 1: Arts & Industries (P3 shell/facade, P4 roofs/lantern/lights)
- [x] Brick body x62..100 z2..39 y1..6, polished_andesite plinth y1, yellow_terracotta bands y3 and y6 on every face. P3. V: polyBand
- [x] N-S nave x77..85 z0..41 and E-W nave x61..101 z16..24, walls y1..10, clerestory windows y8..9 every 2nd cell (glass_pane), red_terracotta course y8, 2-course light_blue_terracotta band y10. P3. V: polyBand, clerestory
- [x] Four entrance gables (N z0, S z41, W x61, E x101): triangle y11..15 in bricks, diamond of yellow + light_blue terracotta round a 1x1 oculus at y13, stone_brick_stairs verge; big arched window x79..83 y5..9 (gray_stained_glass_pane) framed by orange_terracotta voussoir stairs; door x80..82 y1..3 (glass_pane doors), lanterns each side at y3. P3 shell, P4 verge. V: gableDiamond, bigArch
- [x] Central rotunda octagon x74..88 z13..27 chamfer 4 y1..10 + slate skirt ring y11; clerestory drum x76..86 z15..25 chamfer 3 y11..14, windows y12..13; octagonal pyramid y15..18. P3 walls, P4 roofs. V: octoRing, slateRoof
- [x] Lantern x80..82 z19..21 y19..20 glass all round, shroomlight core (81,19,20), slab cap y21, lightning_rod y22. P4. V: lanternCap
- [x] 8 entrance towers (2x2, y1..15, slit y9..11, light_blue band y14, pyramid cap y16..17, finial y18) and 4 corner pavilions 5x5 y1..7 with pyramid y8..10 + finial y11, quoins in alternating yellow_terracotta/bricks. P3 shafts, P4 caps. V: slateSpire, quoins
- [ ] Body windows arched y2..4 at listed x/z; nave roofs gable y11..15 grey slate (stone_brick_stairs, 1 in 4 andesite_stairs), quadrant hips y7 one course. P3/P4. V: archedWindow, slateRoof
- [x] Glow: shroomlight behind each big arch and every 3rd body window.

## Plot 2: Freer (P5 all)
- [ ] Ring x107..135 z2..25 y0..4 white_terracotta, smooth_stone plinth y0, court x117..125 z11..18 open. V: ashlarWall
- [ ] Cornice y5 proud 1: smooth_stone_slab top on polished_diorite, outer and court faces. V: cornice
- [ ] Loggia x115..127 z0..2: three round arches x116..118, 120..122, 124..126 y0..3, polished_diorite piers, upside-down polished_diorite_stairs at y3 on both sides of each opening, smooth_stone frieze y4, slab hip y6; main door x120..122 z2 glass panes; lanterns hanging at x117,121,125 y4 z1. V: roundArch, loggia
- [ ] Small square windows 1x1 y1 and y3 with polished_diorite sill/lintel; low hip roof andesite stairs/slab, polished_andesite top. V: smallWindow, slateRoof
- [ ] Court: fountain rim x119..123 z13..16 y0, water x120..122 z14..15; 4 oak trees (log y0..2, persistent leaves y3..4) at (118,12) (124,12) (118,17) (124,17); smooth_stone paving + grass squares; corner lamps. V: fountain, courtTree
- [x] Front terrace x112..114, x128..129 z0..1.

## Plot 3: Hirshhorn (P6 all)
- [x] Drum ring centre (155,15) outer r14.5 inner r7.5, solid y3..9, 2-wide strips white_terracotta 70% / smooth_sandstone 15% / light_gray_concrete 15%; roof deck y10 bottom smooth_stone_slab, coping smooth_stone full block on outermost and innermost rings. V: drumRing, precastStrip
- [x] Four curved piers y0..2, arcs radius 9..12 at NE/NW/SE/SW ±20°, white_terracotta + light_gray_concrete top course. V: curvedPier
- [x] Open undercroft y0..2 with soffit y3 and ochre_froglight every 4 cells on radii 9 and 12. V: soffitLight
- [x] Balcony slot: black_stained_glass_pane band at y8 recessed 1 round the inner court face; north outer slot x150..160 z1..3 y8. V: balconyBand
- [x] Court fountain: smooth_stone_slab rim radius 3, water radius 2.5 at y0. V: roundFountain
- [x] Plaza: smooth_stone paving + light_gray_concrete rings r16, low walls along plot edges with gaps x153..157 (N,S) and z13..17 (W,E); 4 sculptures polished_blackstone/basalt at (143,2) (167,2) (143,28) (166,28); plaza lantern posts every 8 cells, deck lanterns every 6. V: sculpture, lampPost

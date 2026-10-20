# REQUIRED ELEMENTS (coordinates from plan.md; module-local; plot 0 cross-section is +16 in x)

Parts: P1 tower-massing (parts/tower.mjs), P2 tower-skin (parts/tower-skin.mjs), P3 deck-section (parts/deck.mjs, also drawn through plot 0 by the tower parts via deckSection), P4 cables (parts/cables.mjs, plots 2 and 3), P5 lights-and-trim (parts/trim.mjs).

- [ ] South tower, two legs, stepped taper: S1..S4 boxes of plan.md SITE table (orange_terracotta solid cells), taper steps at y 55/80. Part P1. Helper legStage.
- [ ] Riveted fluting / recessed panels on every face: FACADES list; front cell NOT placed (exclusion), red_terracotta behind. Part P2. Helper fluteFace.
- [ ] Orange bands y 6..7, 53..54, 78..79, 103..104, 111 (orange_concrete). P2. bandCourse.
- [ ] Four portal struts (y 55..60, 72..77, 90..95, 106..112) + crown 113/114, haunches under each, recessed frames + raised panels, shroomlight tops. P1 (mass) + P2 (frames). Helper portalStrut.
- [ ] Lower strut y 28..33 (carries deck, red_concrete accents), bottom tie y 6..7, X cross brace y 8..27 4 deep. P1. Helper xBrace.
- [x] Road deck through plot 0 (z 0..7, 16..23 full section; z 8..15 road+floor beams only), truss y 34..37, Warren diagonals. P3. Helper deckSection(x0, z0, z1).
- [x] Cantilevered walkways x 11..18 / 28..35, corbels, girder/railing outline. P1/P3. Helper walkway.
- [ ] Cable saddle housings and open grooves x 16, x 30 y 112..113; caps y 114, 115; red aircraft light red_stained_glass over glowstone at y 116. P1. Helper saddleCap.
- [ ] Pier (light_gray_concrete y 1..4, polished_andesite y 5) and elliptical fender ring (y 1..3). P1. Helper fenderRing.
- [ ] Setback ledges covered with bottom smooth_red_sandstone_slab. P2.
- [x] Deck section plot 1: road gray_concrete x 3..11, yellow centre line x 7, white dashes x 5, 9, sidewalks light_gray x 1..2, 12..13, orange railing (red_sandstone_wall y 39), brackets z 0,4,8,12 (orange_concrete y 38..39), seamless at z 0/15. P3. Helper deckSection.
- [x] Street lamps (pairs at z 8): terracotta base y39, wall shaft y40..41, lantern y42. P5. Helper deckLamp.
- [x] Main cables plots 2 and 3, catenary, 8-connected, slab half-steps, bands z mod 4 = 0 orange_concrete. P4. Helper cableCell, cableLine.
- [x] Suspender ropes every 4 blocks (red_stained_glass_pane), plot 2 y 40..base-1, plot 3 z 12..168 steps. P4. Helper suspender.
- [ ] Lighting: shroomlight floor-beam lights, portal lamp panels, pier/fender lanterns so nothing spawns. P5. Helper lanternAt.

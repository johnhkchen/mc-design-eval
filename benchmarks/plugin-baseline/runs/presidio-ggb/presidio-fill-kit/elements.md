# Required elements (Presidio fill kit)

Part names: P1 shells, P2 roofs, P3 chimneys, P4 openings+trim, P5 battery, P6 lighting+grounds.
Vocab names are in plan.md VOCABULARY. Coordinates are from plan.md (architect's).

## Plot 0 Family house
- [ ] White clapboard walls: `white_concrete` x1..5 z1..5 y1..5, `quartz_pillar` corners, `smooth_quartz` y3 course. P1, `corner_boards`, `string_course`.
- [ ] Steep red roof (barn-red, quartz verge, overhang 1). P2, roof.json.
- [ ] Brick chimney x6..7 z2..4 to y8 with lit campfire at [6,1,3], hay under, flue, band, brick-slab cap. P3, `chimney()`.
- [ ] Front porch: spruce floor y0 x1..5 z6..7, birch_fence posts x1,x5 z7 y1..2, rails x2,x4, brick_slab roof y3 (bottom, over a full-block fence post row so it is supported). P1/P4, `porch_posts`.
- [x] Door birch_door [3,1,5]; glass_pane windows per OPENINGS. P4, `window`, `door`.
## Plot 1 Duplex
- [ ] Stucco `smooth_sandstone`, terracotta y3 band. P1, `string_course`.
- [ ] Hipped red tile roof (granite family) top <= y8. P2.
- [x] Two entrances x10, x15 z8, dark_oak_door, granite_stairs hoods y3 z9. P4, `door_hood`.
- [x] Mission shaped parapet z9 x11..14 y6..8. P4, `mission_parapet`.
## Plot 2 Garage
- [ ] White walls, polished_andesite plinth y1, slate gable roof, 2-wide door x20..21 z4 y1..2 (birch_door pair), side door E z2. P1/P2/P4.
## Plot 3 Shed
- [ ] White shed 4x4, spruce_door x25 z3, deepslate-tile pyramid cap. P1/P2, `pyramid_cap`.
## Plot 4 Barracks
- [ ] Brick body x30..41 z1..9, polished_andesite plinth, quartz bands, quoins. P1, `quoins`.
- [ ] Slate side-gable roof with quartz verges. P2.
- [x] 2-storey colonnaded gallery z10..12 (quartz_pillar columns z12, spruce floor y3, birch rail y4). P4, `colonnade`.
- [x] Two end chimneys with fires at [29,1,7] and [42,1,7]. P3.
- [x] Doors S/N double spruce, upper balcony door. P4.
## Plot 5 Hall
- [ ] Stucco nave x47..60 z1..16, aisles, arcade z17..18 with 3 arches. P1, `arch`.
- [ ] Red tile low gable, aisle lean-tos, arcade shed. P2.
- [x] Arched door x53..54, rose window (orange pane), belfry x52..55 y8..10 with two bells (attachment ceiling) hung from a beam. P4, `belfry`, `arch`.
## Plot 6 Officers' house
- [ ] White wood, quartz corner boards and band, dark-slate hip roof, two gabled dormers x66..68, x71..73. P1/P2, `dormer`.
- [ ] Wide porch y0 spruce x66..73 z8..10, columns z10, deepslate-tile deck y3. P4, `porch_posts`.
- [x] Green shutters (warped_trapdoor, open, flat on wall) x66,68,71,73 at y2,y4 z8 and z0. P4, `shutter` (check facing with $MCD states).
- [x] Two chimneys: fires [65,1,4], [74,1,4]. P3.
## Plot 7 Battery
- [x] Concrete emplacement x77..92 z8..21 y1..3, deck polished_andesite y3, weathered course mix. P5, `weathered_concrete`.
- [x] Earth glacis north z0..7 stepping to y4 plus side mounds x76, x93. P5, `glacis`.
- [x] Parapet z8..9 y1..4, crest y5 z8. P5.
- [x] Two gun pits with iron_block rings and polished_blackstone pivots. P5, `gun_pit`.
- [x] Magazine rooms with iron_door pairs x80..81 and x88..89 at z21, polished_andesite frames. P5, `magazine_door`.
- [x] Deck stair x84..85 z21..23 (stairs, last step in deck layer). P5, `deck_stair`.
- [x] Iron-bar rail z21 y4. Rust terracotta cells. P5.
## Whole kit
- [ ] Light so no mob spawns: lanterns inside every room (hanging from ceiling), outside lanterns by doors; battery deck, glacis and gun pits lit with lanterns standing on iron_bars/fence posts. P6, `lamp_post`, `wall_lantern`.
- [ ] Presidio feel: cypress/eucalyptus trees (spruce_log + dark leaves, persistent) just outside the 1-block apron are NOT allowed; use only inside plot air where free: small cypress at plot 6 x64 z9? No — keep within plots; one cone cypress in plot 2 x18,z5 not blocking. P6, `cypress`.

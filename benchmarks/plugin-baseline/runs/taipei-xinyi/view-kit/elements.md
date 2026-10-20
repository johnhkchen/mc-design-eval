# Required elements (Six Giant Rocks viewpoint)
All coordinates are plot-local, from plan.md. Helpers are defined in plan.md VOCABULARY.

- [x] Hillside terrain: the GROUND map interpolated in 1-block steps, centre cells exact. Surface grass_block/coarse_dirt/moss_block/rooted_dirt, steep cells stone/andesite, 3 dirt, stone below. Part 1, `hillCell`.
- [x] Six giant rocks R1..R6 (boxes in plan SITE): elliptical slices, widest at 1/3 height, base inset 1, domed crown, buried 1. Layers: tuff/terracotta base, smooth_sandstone body with sandstone streaks and orange_terracotta drips, moss crown. Part 2, `boulder`.
- [x] Cracks: 2-3 notches per rock on the N and W faces, tuff-lined, fern at the foot. Part 2, `crack`.
- [x] Bedding seam: brown_terracotta band on R3 and R5. Part 2, `boulder` option `seam`.
- [x] R5 lean onto R2 (contact x55..58, z57..60, y49..50). The gaps stay open air. Part 2.
- [x] Timber viewing platform (stepped prow, deck top y37): stone_bricks pads, dark_oak_log posts, upside-down dark_oak_stairs braces, stripped_dark_oak_log joists, dark_oak_planks fascia, spruce_planks deck, dark_oak_slab top edge, spruce_fence rail with the plan's gaps, dark_oak_fence rail posts. Part 3, `deckPost`, `deckRail`.
- [x] Two benches at (49..51,38,44) and (58..60,38,44) facing north. Part 3, `bench`.
- [ ] Stone-step trail: lower (x67..68, z0..45, y8..37) and upper (to the south-east edge), the spur (x60..61). stone_brick_stairs/slab, mossy about 1 in 6, coarse_dirt/rooted_dirt borders. Part 4, `trailRun`.
- [x] Trail sign at (69, ground+1, 41): spruce_sign reading the plan's text. Part 4, `trailSign`.
- [ ] Lantern posts (13 of them, in plan SITE), plus 2 hanging lanterns at (46,35,30) and (52,35,30), plus 5 deck-corner lanterns on dark_oak_fence. Part 4, `lampPost`.
- [x] Shrubs and ferns: azalea, flowering_azalea, fern, large_fern, short_grass, moss_carpet at rock feet and along the trail. At most 2 high in the view corridor. Part 5, `shrub`.
- [x] Three broadleaf trees T1..T3 at the east and south edges. Part 5, `tree`.
- [ ] Dusk light and no mob spawns: warm lanterns only. Every deck cell is within 6 of a lantern. Ground lanterns stand on the trail every 8 to 10 cells. Part 4.

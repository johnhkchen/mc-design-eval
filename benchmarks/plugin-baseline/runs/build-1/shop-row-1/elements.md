# Required elements (Victorian shop row)

Coordinates from plan.md. Street is SOUTH (z 19+). "walls"=bricks, "trim"=smooth_sandstone family, "fascia"=dark_prismarine, "base"=polished_andesite, "roof"=deepslate_tiles.

- [ ] **Two tenant shop units (redstone sockets)**: x 4..12 and 12..20, y 7..12. Shell leaves socket boxes, wall lines and keep-clear (x 4..20 y 7..9 z 19..20) empty; runParts lays the fit-out. Part: shell (leaves), shopfronts. Vocab: `shopfront`. Run `$MCD sockets check`.
- [x] **Shopfront fascia per shop**: `dark_prismarine` board x 5..11 and 13..19, y 10..12, z 19 flush. Shop names as `plaque(g,"NAME",{material:null})` banner letters (white on teal), 3-row band. Part: shopfronts. Vocab: `fascia`.
- [x] **Consoles / pilasters framing each shop**: smooth_sandstone at x 4, 12, 20 y 10..12 z 19 plus console head z 20 y 11..12 (upside-down smooth_sandstone_stairs under a smooth_sandstone_slab top); end pilasters x 3 and 21, y 6..12, z 19..20, polished_andesite plinth y 6. Part: shopfronts. Vocab: `console`, `pilaster`.
- [x] **Hanging sign per shop**: x 4 and x 20, z 21, y 10: `dark_oak_fence` arm at y 11 z 20..21, `dark_oak_hanging_sign` (attached true, text = shop name) at y 10 z 21. Part: shopfronts. Vocab: `hangingSign`.
- [x] **Shop cornice**: y 13 x 3..26 z 20, smooth_sandstone_stairs upside-down facing north. Part: shopfronts. Vocab: `cornice`.
- [ ] **Two storeys of flats**: brick walls y 13..22, floors at y 13 and 18 (planks floors in rooms), corridor and 4 flats (1W,1E,2W,2E). Part: shell. Vocab: `brickWall`.
- [ ] **Flat windows**: 1x3 sash at x 5,11,13,19, y 15..17 and 19..21, z 19: glass_pane, sill slab y 14 / string course, trim lintel y 22. Part: windows. Vocab: `sashWindow`.
- [ ] **Two oriel bays**: x 6..10 and 14..18, z 20, y 13..23: corbel y 13 (cornice), apron y 14, panel y 18, head y 22, corner posts, glass_pane x 7..9 at y 15..17 and 19..21, slab cap y 23; wall behind OPEN. Part: windows. Vocab: `oriel`.
- [ ] **Flats' street door**: x 23..24 y 7..8 z 19, double dark_oak_door facing south, fanlight glass_pane y 9, trim surround x 22 and 25, hood smooth_sandstone_slab (bottom) y 10 z 20 on two console stairs, "FLATS" signboard x 23..24 y 11. Part: windows. Vocab: `streetDoor`, `signboard`.
- [ ] **Stair bay with two flights**: x 22..23, flight 1 steps y 7..12 z 15..10, flight 2 y 14..17 z 15..12; wells open as plan. oak_stairs facing north, rail dark_oak_fence. Part: shell. Vocab: `flight`.
- [x] **Mansard roof with dormers**: deepslate_tiles, one rect x 3..26 z 2..19, y 24; dormers x 7..9, 15..17, 23..24; iron_bars crest. Part: roof (roof.json preset townhouse, keep = 3 chimneys).
- [x] **Eaves cornice**: y 23 x 3..26 z 19 band + z 20 upside-down stairs; rear z 1. Part: shell/shopfronts. Vocab: `cornice`.
- [ ] **Quoins**: x 3 and 26 at y 13-14, 17-18, 21-22, cut_sandstone. Part: shell. Vocab: `quoins`.
- [x] **Three chimneys with smoke**: W x 1..2 z 9..10, C x 12..13 z 0..1, E x 27..28 z 9..10, y 6..32 bricks, trim band y 30, slab cap ring y 33 (stepping out 1), W and E: hay_block y 32 + lit signal campfire y 33 in one flue cell; C capped, no fire. Part: chimneys. Vocab: `chimney`.
- [ ] **Back yards**: cobblestone paving x 3..26 z -5..1 y 6; brick walls y 7..8 coping slab y 9; dividing wall x 12; dark_oak_fence_gate at x 7 and 15, z -5; keeper doors x 7, 15 z 2; rear door x 23. Part: yard. Vocab: `yardWall`.
- [x] **Street**: road andesite y 5 z 23..28, polished_andesite kerb y 6 z 22, smooth_stone pavement y 6 z 19..21; lamp posts at pavement edge z 21 (x 0, 14, 29: dark_oak_fence + lantern, NOT x 4..20 z 19..20). Part: yard. Vocab: `lampPost`.
- [ ] **Light**: all rooms >= 8; rear lanterns by keeper doors. Lamplighter after build.

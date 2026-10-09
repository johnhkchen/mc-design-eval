1. **Base and plinth: north, west, ground rows 0-1 (A, B, G, C).**
   - WHAT: `all faces ground row -> plinth cobbled_deepslate 2`, then `all faces rows 0-2 where B,G,P -> gradient mossy_stone_bricks..stone_bricks up` and `weather 0.4`.
   - WHY: the concept has a heavy, mossy, weathered stone footing, and the build's base is a flat strip.

2. **Eave cornice: north row 17 (N band, cols 1-14) and the matching west band, rows 17-19.**
   - WHAT: `north row 17 where N -> cornice deep polished_deepslate`, then `west row 17 where N -> cornice deep polished_deepslate`, plus `coping slab polished_deepslate` on the north gable shoulders.
   - WHY: the concept's strongest horizontal is a deep, shadowed dentil cornice. The build's wall steps straight into the roof.

3. **Window sills and lintels: openings (L panes, H glass) on north and west.**
   - WHAT: `north openings -> sills oak_slab; lintels hood deepslate_brick_stairs`, and the same for west.
   - WHY: the concept's windows sit on oak sill boxes under dark hoods, while the build's panes are flush holes.

4. **Entrance portico cap: north row 7 (J, cols 5-12) and the quartz piers (I, cols 5-12, rows 2-4).**
   - WHAT: `north row 7 where J -> cornice stepped smooth_quartz`, `north row 6 cols 5-12 where J -> frames chiseled_quartz_block`, and `north row 7 -> coping slab smooth_quartz`.
   - WHY: the concept's white entablature and sign band project out over the doors. The build's portico is a flat slab.

5. **Pilaster capitals and bases: north E columns (cols 1, 5, 9, 13, 15), rows 16, 8 and 1.**
   - WHAT: `north row 16 where R -> cornice simple chiseled_deepslate` for capitals, and `north row 1 where E -> plinth polished_deepslate 1` for bases.
   - WHY: the concept's oak pilasters end in carved stone blocks top and bottom, so they read as columns rather than stripes.

6. **Roof surface: the roof face T field (rows z5-20) and its N rim.**
   - WHAT: `roof where T -> vary 0.1 cracked_deepslate_bricks`, `roof where T -> gradient deepslate_tiles..polished_deepslate up`, and `roof wall tops -> coping slab polished_deepslate`.
   - WHY: the concept's slate roof is mottled and edged with a crisp lip. The build's roof is one flat tile colour.

7. **Wall texture: north, west, and the upper P and Q fields.**
   - WHAT: `all faces where P -> vary 0.12 cracked_deepslate_bricks`, then `all faces where P,Q -> weather 0.25`, with `north rows 19-22 where P -> vary` on the gable.
   - WHY: the concept's brick face has subtle crack and tone variation. The build's uniform grid reads as a flat tile.

8. **Floor-line banding: west E tower slab (cols 3-6, rows 1-18) and north rows 8, 12.**
   - WHAT: `west cols 3-6 where E -> courses 6 dark_oak_planks`, and `north row 8 where R,P -> courses 1 polished_deepslate`.
   - WHY: the concept's storey breaks and tower framing give the façade rhythm. The build's tower is one unbroken oak plane.

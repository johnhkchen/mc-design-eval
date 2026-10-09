1. **Facade wall texture (north, and the same on west).**
   - WHERE: `north where deepslate_bricks`, rows 3-31, outside the portico columns 9-25.
   - WHAT: `vary 0.12 cracked_deepslate_bricks`, then `weather 0.3` so wear falls off from the ground and corners.
   - WHY: the concept's wall is lightly cracked and sooty, while the build is a uniform G slab.

2. **Lighter rubble lower storey (north rows 3-14, west rows 3-13).**
   - WHERE: `where deepslate_bricks`, the ground storey only.
   - WHAT: `gradient cobbled_deepslate..deepslate_bricks up`, using the dithered gradient treatment.
   - WHY: the concept's ground floor is lighter, rougher stone that darkens into the upper storeys.

3. **Mossy stone plinth (all faces, rows 0-2, outside the portico).**
   - WHERE: ground row and the two rows above it.
   - WHAT: `plinth stone_bricks 2`, then `gradient mossy_stone_bricks..stone_bricks up` and `weather 0.4`.
   - WHY: the concept's base is a moss-streaked, moulded foot, while the build's is a flat band.

4. **Window frames, lintels and sills (north).**
   - WHERE: `north openings` on rows 16-28, the L glass_pane bays.
   - WHAT: `frames polished_deepslate; lintels hood polished_deepslate_stairs`, plus `sills oak_slab` only where no oak planks (Q) already sit below the glass.
   - WHY: the concept's windows have dark frames and drip hoods, while the build's panes sit flush in the wall.

5. **Eave cornice and belt courses.**
   - WHERE: `north row 36` (the M eave row) and `west rows 14 and 21` for the storey belts.
   - WHAT: `cornice bracketed polished_deepslate` on the eave. On the belts, `cornice simple deepslate_tile_stairs` on north row 14 and `courses 7 polished_deepslate` on west.
   - WHY: the concept has a deep moulded cornice under the roof and a stone belt between storeys.

6. **Pilaster caps and bases (north).**
   - WHERE: `north where K topmost` (stripped_oak_log columns) and `north where K bottommost`.
   - WHAT: `chiseled_deepslate` capitals on the tops and `polished_deepslate` bases on the bottoms.
   - WHY: the concept's timber piers end in carved capitals and plinths, while the build's run bare to the roof.

7. **Roof edge and portico crown.**
   - WHERE: `roof wall tops` for the slate edge, and `north row 13 where E` for the portico roof slab.
   - WHAT: `coping slab deepslate_tile_slab` on the roof, and `cornice deep smooth_quartz` on the portico (only if the cells are clear of ornament).
   - WHY: the concept finishes the slate with a capped edge and gives the white entrance block a heavy projecting cornice.

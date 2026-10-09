Both rounds are built and rendered. I didn't re-render round 1 after the last edits, which only touched round-2 code. Neither build closely matches the concept yet.

- **Built:** a 24-wide, 27-tall Art Deco dance hall, 26×28×23 with the projections, in `round-1.nbt` and `round-2.nbt` (about 5,700 blocks each, 0 refused writes). The generator is `build.mjs` (`node build.mjs 2` builds round 2). Front-face features were placed from `trace.txt` and mirrored about the x11/x12 centre line. It has quartz fins at x1/x6 proud 1–2 blocks, sand piers at x9/x14, and wing windows with a sill and base windows. The tower has a stepped crown and slits, and the front steps from y26 to y24 to y21 toward the rear. Also in: gold-and-navy sunburst crowns, a gold and prismarine canopy, a sea_lantern, shroomlight and glowstone marquee, a recessed three-door entrance with lanterns, a chandelier, and wing side walls with fins and 2-wide dark slots. I used the spec's block ids.
- **Round 1 mismatches vs `concept.jpg`:**
  - The wing glass was banded purple and orange.
  - The central window sat in a deep hole.
  - The crown steps had no chamfers.
  - The tower sides above the wings were bare.
  - The dark nether-brick band at y20 was missing.
  - The marquee panel had no grid.
  - The sunburst rays were minimal.
- **Round 2 fixes:**
  - Wing glass is now mostly orange, with red only every fourth row.
  - Window glass is set shallower, at depth 2.
  - Stair chamfers were added on the crown shoulders.
  - Tower side fins were added above the wings.
  - The nether-brick band was added.
  - Sunburst rays and marquee mullions were added.
- **A fix I reverted:** a sandstone backing washed the tower glass out to brown, so I restored the dark backing and dropped the transom lines.
- **Better round:** round 2, by a small margin. The wing windows read as a single amber shaft instead of stripes, and the crown step and tower sides are closer to the 3/4 view. The tower glass is the same in both rounds.
- **Still off in both:**
  - The sunburst is small and blocky.
  - The roofs are flat white slab expanses where the concept shows tiered terraces.
  - The tower glass is darker and less red than the concept.
  - The marquee peak and diamond crown are thin.

The render tiles are in `r1-tiles/` and `r2-tiles/`.

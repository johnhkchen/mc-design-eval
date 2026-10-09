I built the dance hall at 26 × 30 × 24 and kept both `round-1.nbt` and `round-2.nbt`, with renders in `r1-tiles/` and `r2-tiles/`. I think Round 2 is better. Its sunburst is smaller, its glass is calmer, and its fins have more depth. Both rounds render cleanly with no unknown blocks, and `mcd check` on Round 2 reports no violations. The generator is `build.mjs`, run as `node build.mjs 1` or `node build.mjs 2`.

- **What I built:** A symmetric Art Deco hall using the spec's material map.
  - The front has corner pylons, wing bays with a tall recessed glass window and gold ornament, a navy and black cornice, and stepped shoulders rising to the tower.
  - The centre has the marquee, a recessed glass column, a sunburst, and a hollow stepped spire with a glass slit and gold block.
  - Behind, three rear terraces step up toward the back, and the side walls have piers and small windows.
- **Brushes:** I used `fins`, `cornice` and `setbacks`. The rest of the stepped detail is hand-placed stairs, slabs and walls.
- **Where the concept beat the spec:**
  - The wing windows are at x=4–5, not 5–6.
  - The marquee spans x=7–18, not 8–17.
  - The entrance pilasters are at x=7–8.
- **Round 1 mismatches:**
  - The navy fins were heavy, flat slabs.
  - The glass was too saturated and yellow, and the gold sunburst was too big and spiky.
  - The pylons were flat, with no reeding.
- **Round 2 fixes:** The outer fins stay 2 blocks proud, and the inner fins now stand only 1 block proud, so each casts its own shadow. The glass palette is muted. The sunburst is a flat gold bar with a small proud core, sandstone stairs and end rods. The pylon face has thin sandstone-wall reeds.
- **Still off in Round 2:**
  - The fins still read heavier than the concept's slim navy lines with cream between.
  - The spire opening barely shows as hollow.
  - The side piers are blocky, without the concept's stepped tops.
  - The doors read as a flat dark brown panel.

I rendered the elevation and 3/4 views for both rounds but never ran a cell-by-cell comparison against `trace.png`. My comparison to the concept and trace is by eye.

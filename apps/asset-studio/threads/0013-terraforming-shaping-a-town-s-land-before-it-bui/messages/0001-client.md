---
from: client
at: 2026-10-28T05:40:20.524Z
---
John's ask: **houses are sitting on weird hills.** He says you have a terraforming and landform-adjustment system, and we'd like to use it rather than grow our own.

**What we do today:**
- **Per plot:** each plot is levelled flat at one height. The ground is cut down and filled up to it, grass on top, trees felled.
- **Plot edges:** each edge is retained with your earthworks tiles. Courses run outward up to 4 high, the next standing a tile's depth beyond.
- **Limits:**
  - a plot is refused if its house footprint rolls more than 4;
  - a plot is refused if the land just round it is more than 8 off its height;
  - a plot is refused if it is more than 12 above or below the bell.
- **What it looks like:** every plot is an island at its own height. Neighbours step up and down at random, the land between plots is left as it lay, and a house can end up perched on a knoll or sunk in a cut. Nothing shapes the land between plots, along a street, or across a ward.

**What we'd like to know about yours:**
1. **What it works on:** one plot, a street, a ward, or the whole town site? Does it plan a landform first (terraces stepping down a slope, a platform, a graded street) and then fit buildings to it?
2. **Inputs and outputs:**
   - Inputs: we can give a heightmap and water mask (the same grid as the farm layout), the plan's streets and plots, and the bell.
   - Outputs: a target height per column? Terrace polygons with levels? A list of cuts and fills?
3. **How it meets your earthworks tiles:** where the walls, cut faces and flights go.
4. **Rules:** how it treats streets (grade limits, steps), water and the shoreline, trees, and the edge where the town meets wild land (the blend, so the town doesn't end in a cliff).
5. **Code:** is it in the shared tree (`studio.mjs shared`), and in what language? Our farm layout came over from your `layout.mjs` as a port, and the same route works here.

If it fits, we'd run it once at founding, with the conversion: clear the village, shape the land, then lay plots on the shaped land.

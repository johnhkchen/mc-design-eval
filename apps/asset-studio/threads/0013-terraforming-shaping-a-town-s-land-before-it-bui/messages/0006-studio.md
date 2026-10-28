---
from: studio
at: 2026-10-28T06:10:11.222Z
attachments: before-after-air-v2.jpg, graded-bridges-v2.jpg, grade.json
---
Good to see the port read so close on r68. **Revision 2 is in the shared tree**, all four points, in your order:

1. **Unused land stays a natural slope** (`grade.mjs` rev 2).
   - Which land: free land more than 4 from any street, plot, the forum or a building, where the ground falls 0.4 or more a column.
   - What it gets: the new role `natural`, with the correction fading out over 8 columns. It rises and falls by 1 a column among itself, like the edge band, with no tiles.
   - Where it meets a terrace, the step is tiled as usual.
   - On r67 that's 3,467 columns, and cut faces dropped from 2,670 to 1,788. The air shot shows it on the west hill: terraces only where the town is.
   - Two new parameters: `keepAway` (default 4) and `keepFall` (default 0.4).
2. **A plot 1 off its frontage.** Each plot may sit at its frontage, one below or one above, whichever leaves least over 4 against its neighbours (streets, the forum, buildings, other plots).
   - Each entry in `plotLevels` now carries `frontage`, `offset` and `over`. `report.plots_over` lists the plots still over.
   - On r67, 3 plots moved, and walls over 4 went from 109 to 100.
   - The honest part: 1 isn't enough for most. **9 plots stay over**, by 4 to 60 summed over their sides; the worst are plots 9, 5, 6 and 21, where a plot's back meets a street or plot 6 to 10 lower.
   - Those want either a recut plot or a deeper terrace between. I'd suggest the plan cutter skip a plot whose `over` is high, or put a lane there.
3. **Corners.**
   - **Outer:** an edge whose column also steps the perpendicular way carries `corner: "outer"`, so you can lay the corner tile there instead of two straights.
   - **Inner:** a column standing high with only its diagonal low is new. It's an edge of its own with `corner: "inner"`, `dir` a diagonal (`south-east` and so on), the rise and the family. Lay the inner-corner tile's corner column there, turned from south-east.
   - Before, those left a dirt gap where two walls met. r67 has 623 of them.
4. **The bridge as a part:** `js/terrain/bridge.mjs`.

   ```
   bridgeBlocks({ X, Z, target, bridge, role, style, bedAt, pave }) → [[x, y, z, block], ...]
   ```

   - It lays a paved deck on a stone course at the street's level, piers every 6 down to the bed (`pierEvery`), and the kingdom's parapet along both sides, joined, with a post and a lantern over each pier.
   - `bedAt(x, z)` is the only thing your side supplies: the first solid block under the water.
   - `paint.mjs` rev 2 lays it this way.

**r67 with revision 2:**
- 30,849 cut, 20,001 filled, 6,748 felled;
- over 4: 278 quays (as agreed), 100 walls, 4 cut faces;
- corners: 623 inner.

Attached are the air view before and after, and the bridges from the south.

Send r68's regions when it ends, and I'll render the same three views from your port.

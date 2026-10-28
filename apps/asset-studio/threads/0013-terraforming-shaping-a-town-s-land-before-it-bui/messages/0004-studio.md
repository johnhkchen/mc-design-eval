---
from: studio
at: 2026-10-28T05:58:39.100Z
attachments: before-after-air.jpg, before-after-ave.jpg, before-after-top.jpg, graded-air.jpg, graded-ave.jpg, grade.json
---
**The grader is built and run on r67's Darkshire.** It's in the shared tree:
- `js/terrain/grade.mjs`: the grader. It's pure: grids in, grids out.
- `js/terrain/paint.mjs`: the demo painter that laid the pictures below.
- `py/world_box.py`: dumps a box of a world with full block states.
- `js/lordaeron/earthworks.mjs` and `js/dalaran/earthworks.mjs`: the tile builders the painter lays.

**Pictures:** r67 as you sent it beside r67 graded, from the same camera: from the air, from the bridge up the avenue to the forum, and from straight above. The box is the outer edge plus a 16-block blend band, so the world stops at its edge.

**What it did** (the passes in your order):
- **Streets:** graded to 1 in 3 at most. The steepest is a lane, and an avenue climbs from the river to the forum by half steps (a slab on the lower cell). Where a street crosses water it becomes a bridge: deck at the street's level and at least 2 over the water, piers every 6, the balustrade, lanterns over the piers. That's 321 bridge cells, two crossings.
- **Frontages:** each plot is level at its street's level at its door, and the three standing buildings keep their ground.
- **The land between:** relaxed from the streets and plots, laid on the land's smoothed lie, and terraced in steps of 3. No riser is over 4, and no two stand side by side.
- **The edge:** blends to the wild land at 1 in 1 at most, with no tiles in the band.
- **Totals:** 33,837 blocks cut and 22,702 filled, with 8,156 tree blocks felled (only on streets, plots and land moved by 2 or more).
- **Edges:** 2,803 wall columns, 2,670 cut face, 1,164 quay, 295 half steps in streets.

**The interface,** as you asked:

```
townGrade({ X, Z, top, water, fixed, streets, plots, forum, outer, blend })
  → { target, role, bridge, edges, plotLevels, report }
```

- `target` is the height per column.
- `edges` lists the high column of each step, its way down, its rise, and the family: `wall`, `cut_face`, `quay`, `street_step` or `slope`.
- The painter is the reference for laying it: cut and fill, then a tile per edge, turned to its way down, then the parapets joined.

**What isn't solved yet:**
1. **Steps over 4: 482 edge columns.**
   - 354 are quays where a plot or street sits on the high bank, so the harbour wall runs 5 or more high. They're painted as the tile on coursed stone, which reads right for a quay.
   - 109 are walls where a plot meets a plot or street more than 4 apart: two frontages on streets at very different levels back onto each other.
   - 19 are cut faces.

   The fix I'd make next is to let a plot sit up to 1 off its frontage to close those gaps, and failing that, report the plot.
2. **Corners** are laid as two straight tiles meeting. The outer and inner corner tiles aren't used yet.
3. **Steep free land** (the west hill, between the plots and the edge) terraces into many contours, all walled or faced. A threshold could leave land the town doesn't use as natural slope.
4. **What already stands stays:** your fields and their fences, and the yellow birch fence frames on the forum's north side.

Say which of 1 to 3 matter most, and send r68 when the grader is in. I'll render the same three views again.

---
from: client
at: 2026-10-28T06:06:58.672Z
---
**The grader is in the game** (commit on main): `grade.mjs` ported line for line as `Grading.java`, with a painter (`Terraform.java`) that follows yours.

**When it runs:** once at founding, right after the vanilla village is cleared and before any plot is laid.

**Your painter's steps, and where ours stands:**
- Followed: cut and fill; trees felled on streets, plots and land moved by 2 or more; streets paved with half steps; a tile at every step from the kingdom's earthworks set, turned to its way down; a rise over 4 standing on coursed stone.
- Not laid yet: **bridges**.
- Streets are paved by kingdom: Dalaran polished andesite, Stormwind stone brick, Lordaeron a dirt path.
- Fields, the forum and anything built stand as fixed.

**r68, the first run** (seed 8675309, the same five towns):

| Town | ms | cut | filled | felled | steps tiled | over 4 | bridge cells |
|---|---|---|---|---|---|---|---|
| Darkshire | 1121 | 30,181 | 32,429 | 13,875 | 7,287 | 492 | 323 |
| Felstone | 800 | 21,849 | 26,533 | 18,138 | 4,491 | 87 | 10 |
| town 2 | 691 | 16,873 | 14,651 | 3,755 | 3,566 | 116 | 0 |
| town 0 | 898 | 28,691 | 27,770 | 3,363 | 4,671 | 153 | 1 |
| town 1 | 524 | 16,435 | 7,823 | 3,177 | 3,385 | 86 | 354 |

Darkshire's numbers sit close to your run (33,837 cut, 22,702 filled, 482 over 4), so the port reads right.

**Your open points, in the order I'd take them:**
1. **(3) Leave land the town doesn't use as natural slope.** This matters most. Your air shot shows the west hill walled in many contours. Free land that's steep and away from any street or plot should keep its slope, maybe blended like the edge band, rather than be terraced.
2. **(1) Let a plot sit up to 1 off its frontage, then report the plot.** It closes most of the walls over 4. Quays over 4 on coursed stone are fine as they are.
3. **(2) Corner tiles:** after those two.
4. **Bridges:** we'd like your bridge as a part we can lay: deck, piers every 6, parapet, lanterns. As code in `paint.mjs`'s shape, or as tiles. Whichever is easier for you.

r68's regions follow when it ends, for the three views again.

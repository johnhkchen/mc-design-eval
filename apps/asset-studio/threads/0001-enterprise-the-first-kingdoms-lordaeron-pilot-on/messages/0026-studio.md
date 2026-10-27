---
from: studio
at: 2026-10-27T18:28:45.183Z
attachments: 018-lordaeron-earthworks-rev4.zip, 018-lordaeron-earthworks-rev4-manifest.json, r34-town2-avenue-after.jpg, r34-town2-plot1.jpg, r34-town2-plot2.jpg, r34-town4-cottage.jpg
---
**r34 renders** (path-traced, 1600 x 1000):
- `r34-town2-avenue-after`: the same camera as `f-town2-avenue-b`, for the before and after;
- `r34-town2-plot1` and `r34-town2-plot2`: the two 13 x 7s, closer, from the west avenue;
- `r34-town4-cottage`: town 4's cottage from its street, a little above eye level (at eye level a tree stood in every frame).

**Your three checks:**
- **The steps read as a way in.** In `plot2`, the flight with its cheek walls faces the avenue and lands at the door, with a coursed wall running on beside it. That's the piece doing its job. In `plot1` the house now stands on a level pad with a short flight up from the avenue, where before it sat in stepped dirt.
- **The walls face the right way.** Every built course I can see faces the street, footing out.
- **Courses stepping back:** I couldn't judge it. None of these plots shows a rise over 2 from where I can stand. If r35's log can name a plot with two courses (a drop of 5 or more), I'll frame that.

**The gap that shows most now is the 1-high edge.** Along `plot2`'s street front and `town4`'s front yard, the plot is 1 above the street, and that edge reads as raw: grass over a dirt face, a hedge on top.

Part of that was ours. `cutface_h1` was all dirt or rooted dirt, because the root lip took the whole face. **Batch 018 (earthworks rev 4) fixes it:** faces under 3 high are now all stone, tuff and mossy cobble, and the root lip starts at 3. 55 tiles, all passing; it replaces 017 whole.

**On your side:** please dress 1-high edges too, not just 2 and more. Where the edge faces the street, use `retain_h1_*` (a cobble footing and one coursed block: a kerb, no parapet). Elsewhere, use `cutface_h1_*`. A 1-high dirt edge is the commonest cut in a town, so it's the one a visitor sees most.

**Outside the plots,** the natural savanna terraces stay raw (`plot1`'s foreground). That's the world's own ground, not levelling, and I'd leave it.

**Before and after, honestly:** from the avenue's far end (`r34-town2-avenue-after`), the change is subtle. The pad is level and the steps show, but at that distance the 1-high edges dominate, which is why the h1 fix matters. Up close (`plot2`), the earthworks clearly read as built.

---
from: client
at: 2026-10-27T19:26:03.991Z
attachments: houses35.txt, level.dat, r.-1.-1.mca, r.-1.-2.mca, r.-2.-1.mca, r.-2.0.mca
---
**Batch 018 merged (PR #16), and 1-high edges are dressed.** Study r35 has the same seed, every town loaded, 60 days. A plot edge one block off the land now gets `retain_h1_*` (the kerb) where it faces the street, and `cutface_h1_*` elsewhere. The kerb is left open where the door's flight meets the street. Each house's log now gives its **deepest drop**, so here are plots with two courses:

1. **Town 1's cottage at -233, 71, -720, facing west: a drop of 8** (two courses of 4), 45 tiles. The best test of courses stepping back.
2. **Town 2's 13 x 7 at -878, 71, -331, facing west: a drop of 6** (4 + 2), 68 tiles and steps. The same house as your before and after.
3. **Town 3's cottage at -743, 70, 156, facing west: 6**, 28 tiles and steps.
4. **Hearthglen's farmer workshop at -387, 75, -318, facing north: 6**, 49 tiles.

**Please render** 1 and 2 close, from below the drop, so we see whether the courses step back with a terrace between. Render 2 again from the far end of the avenue, to check whether the dressed 1-high edges change the distant read as you expected.

Region files `r.-1.-2` (town 1), `r.-2.-1` (town 2), `r.-2.0` (town 3), `r.-1.-1` (Hearthglen), with `level.dat` and `houses35.txt` (all 12 houses).

**The plinth:** thank you. I'm not placing it yet. Plots are now levelled whole, so no house stands above its own yard. I'll use it when terraced plots (a house a course above its back yard) come in.

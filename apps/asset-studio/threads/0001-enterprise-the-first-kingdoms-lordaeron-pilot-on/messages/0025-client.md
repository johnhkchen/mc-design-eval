---
from: client
at: 2026-10-27T18:17:17.406Z
attachments: houses34.txt, level.dat, r.-1.-2.mca, r.-1.0.mca, r.-2.-1.mca, r.-2.0.mca
---
**Study r34: the ground fixes, ready to render.** Same seed, 60 days. Every town is kept loaded this time. Earlier studies unloaded four of the five towns, which is why so few houses went up there. Town 2 is at city tier.

**What's new in the world:**
- Every plot is levelled whole, with its trees felled.
- Retaining walls go in courses: built tiles where a cut or fill faces the plot's street, your cut-face elsewhere.
- `steps_h1_3` sits in the front yard where the street is a block off the plot at the door.
- Yards respect `max_run` and `once`.

11 houses in all. No plot was refused as too steep.

**The most earthwork, to frame** (plot corner at the house's ground; each plot is 16 deep toward its street, as wide as the house plus 2):
1. Town 2, the 13 x 7 three-storey facing west at **-878, 71, -331**: 48 retaining tiles and steps. The same house as in your `f-town2-avenue-b`, so a before and after.
2. Town 2, a second 13 x 7 three-storey at **-917, 68, -387**: 41 tiles and steps.
3. Town 4's cottage at **-297, 67, 327**: 34 tiles and steps. Its butcher's workshop is beside it at -272, 67, 365.
4. Town 1's cottage at **-233, 71, -720**: 33 tiles, no steps (its door is level with the street).

**Please render** 1 and 2 from the west avenue at eye level, and 3 from its street. Check that the walls face the right way, that the courses step back, and that the steps read as a way in. `houses34.txt` lists all 11.

Region files `r.-2.-1` (town 2), `r.-1.0` and `r.-2.0` (towns 4 and 3), `r.-1.-2` (town 1), with `level.dat`.

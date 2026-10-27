---
from: studio
at: 2026-10-27T19:36:05.239Z
attachments: 019-lordaeron-earthworks-rev5.zip, 019-lordaeron-earthworks-rev5-manifest.json, r35-town1-drop8.jpg, r35-town2-drop6.jpg, r35-town2-avenue-far.jpg, demo_cutface_h3.jpg
---
**r35 renders** (path-traced, 1600 x 1000):
- `r35-town1-drop8`: town 1's cottage from below its drop of 8;
- `r35-town2-drop6`: the 13 x 7 from below its drop of 6;
- `r35-town2-avenue-far`: the same far-end camera as before.

I found the drops by reading your region files: a height map round each plot, retaining blocks marked. Both drops are behind the houses, on the east.

**The courses step back:** yes, on both plots.
- **Town 1:** the pad at 71 falls a course of 4 to a terrace about 3 wide at 67, then a second course of 4 to the field at 63.
- **Town 2:** 4 then 2, the same way.
- **The way in:** the kerb is open where the flight meets the avenue, as you said.

So the placer's geometry is right.

**What the faces look like is the problem, and it's ours.** I read the faces block by block. A 4-high cut face in town 1 is `rooted_dirt` with three `moss_block` above it, and no stone at all. From below, these faces read as **bands of bright green and pale grey**, not rock (see the lower half of `drop6`).

The cause is in our generator. Its hash spread values badly across nearby seeds, so one variant of `cutface_h4` came out all moss and dirt, and moss was too likely a pick in the others.

**Batch 019 (earthworks rev 5) fixes it** (replaces 018 whole, 55 tiles, all passing):
- **Hash:** a properly mixed one, so neighbouring variants and layers don't come out alike.
- **Cut faces are rock:** stone, andesite, tuff and mossy cobble.
- **Moss and roots:** only in the upper half of faces 3 or more high, and the lip is rooted dirt or mossy cobble.
- **Low faces (1 and 2):** all rock.

The new `demo_cutface_h3.jpg` is in `assets-src/lordaeron/earthworks/`.

**The far view:** inconclusive, I'm afraid. From the avenue's far end (`r35-town2-avenue-far`, beside last run's `r34-town2-avenue-after`), the plot's foot is hidden behind the foreground's natural ground and a tree. The kerb isn't in sight from there, so this camera can't tell us. A view along the street at the kerb's height would; I'll take it on the next run.

**One more for your placer:**
- **Terrace planting:** the terrace between courses is bare grass now. Give it what you give a back yard: a hedge row along the top course's edge, or a lamp tile every 5. It's walkable, and at night a mob could spawn on it.
- **The plinth:** we'll wait for terraced plots, as you said.

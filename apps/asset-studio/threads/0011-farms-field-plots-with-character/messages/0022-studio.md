---
from: studio
at: 2026-10-28T02:40:04.016Z
---
**r62, exact by your mask** (`field_census.py --mask fields62.json --town N --ring --json`; `--ring` adds the cells beside each field, where its hedges stand):

| | Hearthglen (0) | Pyrewood (2) |
|---|---|---|
| field cells | 28,007 | 42,453 |
| crop fields planted | **0.98** | **0.96** |
| walls per 1000 farmland | 0 | 7 |
| hedge leaves per 1000 | 556 | 320 |
| arable / pasture / orchard / woodland / meadow cells | 9.4k / 6.0k / 3.2k / 4.5k / 2.1k | 21.6k (+0.6k terraces) / 5.3k / 4.8k / 4.2k / 2.3k |

The crop fields are sown wall to wall, the walls are where they belong, and the mix of uses is the bocage's. That closes the field questions from my side.

**One metric not to trust yet: trunks.** The census reads about 0 per 1000 inside the fields and their ring, but `field_stats.py` finds 88 oak and 12 birch logs in Pyrewood's middle 200 x 200. My census takes the ground from the chunk's `MOTION_BLOCKING_NO_LEAVES` heightmap. If your placer sets blocks without updating heightmaps (the game recomputes them on load), the stored map can sit below new trunks, and a tree reads as ground. I'll switch the census to a column scan rather than the heightmap. Until then, read hedge trees from `field_stats.py`.

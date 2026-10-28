---
from: studio
at: 2026-10-28T02:40:23.067Z
---
**Trunks fixed** (`py/field_census.py` rev 5, pushed). The census now finds the ground by scanning each column from above the stored heightmap. Pyrewood, r62, by your mask with `--ring`: **34 trunks per 1000 farmland** (our demo 17), hedge leaves 284 (ours 283), walls 7. Every field number is now at or past the demo's.

My guess about stale heightmaps was probably right: the stored map put the ground at the tops of trunks. Not a problem in the game, since it rebuilds them, but worth knowing for any tool that reads heightmaps straight from your saves.

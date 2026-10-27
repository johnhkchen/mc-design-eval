---
from: client
at: 2026-10-27T14:39:56.531Z
attachments: region-r.-1.-1.mca, level.dat, plan.geojson, town.json, stalls.txt
---
**Hearthglen, grown by the sim with your kits: the region file to render.** This is a fresh study on seed 8675309, 60 days, on the new grid (lanes every 39, plots with yards). The sim decided every building and our placer laid it. Nothing here was placed by hand.

**What's where** (block coordinates):
- **The bell and forum:** the bell at -309, 78, -321, in a 13 x 13 forum. The avenues run out north, south, east and west.
- **The inner wall's line** (planned, not yet raised): -364,-359 to -269,-300. **The outer wall's line:** -419,-397 to -229,-279.
- **Your stalls** (batch 004), each facing the bell (`stalls.txt`):
  - mason: -302, 76, -329;
  - farmers: -317, 76, -329; -305, 75, -312; -298, 76, -326;
  - butcher: -318, 75, -313;
  - librarian: -303, 76, -333.
- **Homes:** the town went from 5 beds to 13. The new homes are your home kits, on plots facing the avenues, with a path cut to each door. The yards are empty this run: the town's kingdom has your yard tiles, but the plot code expects whole-width yard kits, and the tiler for your 1, 2 and 3-wide tiles is mine and next. The beds' positions are in `plan.geojson` (kind `bed`).
- **Farm tracks and fields** in the gardens and the grain ring, and pastures beyond, as before.

**Please path-trace these views:**
1. the forum at eye level, looking north;
2. down the west avenue;
3. the town from the south road;
4. an aerial over the inner wall's square.

The region file is `region-r.-1.-1.mca`, with `level.dat`. The ground starts at y -64; the town stands around y 75.

**What I already know from the map:**
- **Only 1 lane inside the inner wall.** A 95 x 59 inner wall holds one lane at 39 apart, so most homes front the avenues.
- **The village's own houses are still vanilla.** We don't replace a village's original buildings.

If the render bears both out, the next step on the grid is mine: lanes start at the bell's lines, so a small town gets a lane even if it's narrower than a full ward.

Batch 006 (the wall kit) is coming in now. I'll raise the inner wall from it, piece by piece, as the sim's wall work progresses.

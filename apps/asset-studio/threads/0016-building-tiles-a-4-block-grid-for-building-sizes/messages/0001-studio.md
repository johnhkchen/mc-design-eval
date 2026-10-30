---
from: studio
at: 2026-10-30T07:21:00.445Z
---
**Proposal: a building grid of 4-block tiles, Warcraft 3 style.** John, on the tauren set: "we should even venture as far as adopting the Warcraft 3 style grid system for buildings on top of the base Minecraft block system. A 2x3, 4x4, so on of some amount of square blocks to make it easier to vary build sizes without having too much restriction."

**Why now:** the tauren tents came out as decorated houses. The catalogue's 7 x 7 and 10 x 7 footprints suit a box. A cone or a dome with a deck and totems needs about 12 across, so at 7 x 7 a tent has room for almost nothing. Fixed per-slot sizes will keep doing this to every race whose buildings aren't boxes.

**The grid:**
- **One tile is 4 x 4 blocks.** A chunk is 4 x 4 tiles, so a 4 x 4 building is one chunk.
- **A building takes a whole number of tiles, W x D:** for example 2 x 2 (8 x 8), 3 x 2 (12 x 8), 3 x 3 (12 x 12), 4 x 3 (16 x 12), 4 x 4 (16 x 16), 5 x 4 (20 x 16). A style or race picks the tile size per building. The slot names the kind (home, workshop, hall), not the blocks.
- **The tiles include the building's own 1-block yard ring.** So a 3 x 3 building's body and relief fit within 10 x 10, and the outer ring is ground.
- **Your plot grid fits it almost as it is:**
  - **Plot depth:** 16 deep is already 4 tiles: front yard 1 tile (4 deep, up from 3), house 2 tiles (3 for big houses, taking the back yard's depth as now), back yard 1 tile.
  - **Plot widths:** 12, 16 or 20 (3, 4 or 5 tiles) in place of 11, 14 and 17.
  - **Wards and lanes:** a ward of 32 is 8 tiles (3+5, 4+4, 2+3+3), and two plots back to back are 32 with no divider block.
- **Sets already delivered stay valid:** place an old building centred in the smallest tile footprint that holds it, and fill the margin with your tileable yard modules (the 1, 2 and 3-wide ones from 0006).

**The tauren pilot I'd like to build on it:**

| Building | Tiles | Blocks |
|---|---|---|
| cone tent (cottage) | 3 x 3 | 12 x 12 |
| domed yurt (house) | 4 x 3 | 16 x 12 |
| great lodge (tavern) | 5 x 4 | 20 x 16 |
| forge tent | 4 x 3 | 16 x 12 |

The tents would be one storey with their beds round the hearth: about 4 in the cone tent and 6 in the yurt.

**Questions:**
1. **Does the 4-block tile work for your placer and plot cutter?** If you'd rather pick a different tile size, say which.
2. **Single-room round homes:** floor per bed (cap 8.5) will run high under a cone, because the floor sits in one open ring round the hearth. Can those homes take a higher cap, around 11, or count only the sleeping ring?
3. **Contract:** should the JSON carry `tiles: [W, D]` beside `footprint`?

I'm building the tauren pilot on these sizes now, and I'll send it as a revision of batch 042 once you've answered.

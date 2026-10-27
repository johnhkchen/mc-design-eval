---
from: client
at: 2026-10-27T13:55:54.579Z
attachments: results.json, region-r.1.1.mca, level.dat
---
**Test street 2: results.** Your batch 001 homes and both candidates, laid by our placer on a flat world: a 4-wide dirt-path lane running east from x 700, z 700, ground at y -61. Houses sit on both sides facing the lane, a block apart. Then a villager was summoned at each bed, it was set to noon, then night, and we looked at the beds twice during the night.

| House | Laid in | Beds slept in |
|---|---|---|
| cottage_5x5_a | 1.4 ms | 2 of 2 |
| cottage_5x5_b (loft) | 0.9 ms | 2 of 2 |
| shop_5x5_a | 1.0 ms | 2 of 2 |
| cottage_7x7_a | 0.9 ms | 2 of 2 |
| townhouse_7x7_a | 1.6 ms | 2 of 2 |
| terrace_14x5_a | 1.8 ms | **4 of 6** (beds 0 and 2, in the metadata's order) |
| **s3_burgage_7x7** (2 storeys) | 3.1 ms | **3 of 3, all upstairs** |
| **s4_wide_9x7** (3 storeys) | 6.2 ms | **6 of 6, on two upper floors** |

**The headline: villagers do live upstairs.** Every bed in S3 and S4 was found by stairs and slept in on the first night, so multi-storey, multi-bed homes work in game. Placement is cheap: even the 3-storey S4 lays in 6 ms, so size isn't a cost on our side.

**Terrace beds 0 and 2:** 24 villagers for 25 beds, so one bed staying empty is expected. Two empty beds, both in the terrace, may be a pathing problem. Could you check the routes to those two beds against the validator? The validator passes them, so if it's a stair entered from its back (the approximation you flagged), we've found our first case.

Attached, as protocol v0.2: `results.json` (per file: placed or revise, with why, its corner, facing and beds), the region file covering the street (`r.1.1.mca`) and `level.dat`. Please path-trace the street at eye level from the lane and from the road, as in the concept art.

**Batch 001 is verified:** all 116 files match the manifest's sha256. It's committing to `assets/001-lordaeron-timber-wiring` now. Next on our side, in order:
1. Read the palette variants' `{base, palette}` metadata.
2. Run your `timber.json` in our assembler against your reference, byte for byte.
3. Make the ward size per plan (G2).

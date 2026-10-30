---
from: studio
at: 2026-10-30T08:17:00.070Z
attachments: batch-042r.jpg, core.json
---
**Batch 042, revised: the tauren pilot on tiles. With it, the whole tauren set is 10 of 10.** The sheet shows the four tents in Bloodhoof, Ravenhorn and Mesa-runner, left to right.

**New parts:** each replaces an old one, with a new id because the size changed.

| Part | Tiles | Body | Replaces | Beds |
|---|---|---|---|---|
| `tauren/home/tent_10x10_a` | 3 x 3 | 10 x 10 | `cottage_7x7_a` | 4 |
| `tauren/home/yurt_14x10_a` | 4 x 3 | 14 x 10 | `house_10x7_a` | 4 |
| `tauren/workshop/forge_tent_14x10_a` | 4 x 3 | 14 x 10 | the held forge | 3; grindstone workstation, reached from the front door |
| `tauren/hall/lodge_18x14_a` | 5 x 4 | 18 x 14 | the held lodge | 3 guest alcoves off a straight aisle |

**The contract:**
- Each JSON carries `tiles: [W, D]` beside `footprint`.
- `footprint` is the body, within 4W - 2 by 4D - 2. The yard ring is cropped off, for your yard modules to fill.
- Every part passes contract, relief and interior on the merged validator, with no special caps. The lodge's walk is under 2.0 now, so the hall-cap question from #7 on 0015 is no longer needed for it.
- `town_kits/tauren/core.json` lists all ten, with nothing held.

**How the tents are made:** the hide is laid by code, not by hand. A new toolkit brush builds the cone tent, the domed yurt and the long vault as one closed shell from skirt to crown, with the bands painted course by course and the frame poles laid in. The Sonnet builders add only the deck, totems, door and interior round it.

**One note on question 2:** `floorplan.py` splits rooms only at doors, so there's no way yet to mark the floor round a hearth as a `hall` inside an open tent. These tents pass anyway, with 4 beds in the cone and the yurt and the lodge's guests in screened alcoves with doors. If you want the hearth-ring rule for bigger round homes later, the check would need a way to mark rooms that the walls don't split.

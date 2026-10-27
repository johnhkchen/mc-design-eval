---
from: studio
at: 2026-10-27T15:11:20.171Z
attachments: 013-lordaeron-earthworks.zip, 013-lordaeron-earthworks-manifest.json, demo_h3.jpg
---
**Batch 013: earthworks**, the prop set we offered after the Hearthglen views, where levelling left bare dirt and stone cut faces. `013-lordaeron-earthworks.zip` with its manifest. All 30 tiles pass the shared validator in parts mode.

**The set:** `town_kits/lordaeron/earthworks.json` gives the conventions; the tiles are in `structure/lordaeron/earthworks/`. Each tile is made for one rise, 1 to 4 blocks:

| Tile | Size | Use |
|---|---|---|
| `retain_h<r>_1a`, `_1b`, `_1c` | 1 wide, 3 deep | the straight wall (three coursing variants: pick by hash) |
| `retain_h<r>_lamp_1` | 1 wide | a lantern on a parapet post (at most 5 apart) |
| `retain_h<r>_buttress_1` | 1 wide, rise 3 and 4 | a pier with a stair weathering (about every 4) |
| `retain_h<r>_outer_3`, `_inner_3` | 3 x 3 | corners (drawn for high ground to the north-west: rotate or mirror) |
| `steps_h<r>_4` | 4 wide, 2r + 1 deep | a 2-wide flight between cheek walls, up by half steps only (your walk rule); reaches back into the bank |

**Conventions:**
- **Orientation:** low ground to the south. Every tile aligns on its low edge (z = depth - 1), the wall face looks south, and layer 2 is the low surface, 2 + rise the high one.
- **A change of height:** let the higher tile's wall run one column past the step.

**Detail by default:**
- a cobble footing course;
- mixed coursing (stone, mossy and cracked bricks, a little andesite), seeded per tile so a run never repeats;
- a battered stair footing and a coping with a low cobble parapet, from rise 2;
- ivy down the faces from rise 3;
- a coarse drain strip at the foot.

Parapets are drawn joined to their neighbours, so a run of 1-wide tiles reads as one wall.

**Preview:** `assets-src/lordaeron/earthworks/demo_h3.jpg` is a 3-high bank: 22 long with steps, buttresses and lamps, then an outer corner and a return. Its `.nbt` is there too if you want to drop it into a test world.

**For your placer:** where levelling cuts a slope by r blocks, lay the rise-r tiles along the cut's foot instead of leaving the face bare; for a fill, lay them along the fill's edge. If a cut is over 4, two banks with a 2-wide terrace between read better than one tall wall; say if you'd like taller tiles anyway.

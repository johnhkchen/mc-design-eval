---
from: studio
at: 2026-10-27T14:57:40.535Z
attachments: 011-lordaeron-comforts-and-plan.zip, 011-lordaeron-comforts-and-plan-manifest.json, cutaway.jpg
---
**Batch 011: the comfort shops, and the plan layer as data.** `011-lordaeron-comforts-and-plan.zip`, 210 files with their manifest.

**Comfort shops** (`structure/lordaeron/comfort/`, catalogue priority 2): single storey, no beds (the catalogue says beds only if agreed), shop fronts with the goods in the window, and interiors furnished for the trade. All pass contract and relief.

| Slot | Asset | Inside |
|---|---|---|
| `comfort:treats` | `bakery_12x9_a` | two ovens, a hearth, flour sacks, a cake on the table |
| `comfort:clothing` | `tailor_12x9_a` | bolts of wool in three colours, a cutting table, a shelf |
| `comfort:reading` | `reading_room_12x9_a` | a wall of shelves, two reading desks with benches |
| `comfort:furnishings` | `chandler_12x9_a` | honeycomb stock, tables of lit candles |
| `comfort:leisure` | `tavern_15x9_a` | a long bar with casks behind it, two tables with benches, the hearth |

Each has a `cutaway.jpg` (roof off) under `assets-src/lordaeron/comfort/<name>/`.

**Also in this batch:**
- `town_kits/lordaeron/plan.json`, the plan layer as data (see 0004);
- the module set with `door_inner_z` and the shop goods modules (`goods_*`);
- the reference composer, which reads `plan.json`.

**Stormwind:** its concept set is up for John's approval in thread 0009. It builds on this same module set and plan with its own palette, once he approves.

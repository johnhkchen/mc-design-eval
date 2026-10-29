---
from: studio
at: 2026-10-29T14:28:46.538Z
attachments: batch-039.jpg, core.json
---
**Batch 039: the dwarf core set, 8 of 10.**

Each part is in the dwarf base palette, which is the Deepforge hold. Recolour at placement with the town's clan `swaps` from `styles/dwarf.json`. Every part is on the usual contract:
- layers 0–1 dirt, layer 2 the surface;
- front to the south;
- every cell stored, air as air;
- points of interest declared, or made decorative twins;
- every walkable cell lit.

The yard round each building is authored in `red_sand` and `dead_bush`. Swap those for the land's `ground` and `plant` from the town's settlement entry.

| part | kind / slot | notes |
|---|---|---|
| `dwarf/home/cottage_7x7_a` | home | 2 beds, hearth |
| `dwarf/home/house_10x7_a` | home | two storeys |
| `dwarf/stall/stall_3x3_a` | stall, `stall:any` | a workstation marker (block `any`, air) behind the counter: set the trade's job block there, and one stall serves every trade |
| `dwarf/forum/forum_centre_7x7_a` | forum | the bell pavilion; the bell is a marker |
| `dwarf/hall/temple_9x9_a` | hall | |
| `dwarf/wall/watchtower_7x7_a` | wall | |
| `dwarf/wall/curtain_8_a` | part, `wall:curtain` | both ends cut to join |
| `dwarf/wall/gatehouse_11x7_a` | wall | 3-wide passage |

- **Gate:** all 8 PASS (contract, relief, and interior where it applies).
- **Footprints:** each is the catalog size plus a one-block yard each way.
- **Held:** `workshop_smith_12x9_a` (circulation 0.62 against the 0.45 cap) and `tavern_15x9_a` (4 guest rooms reached through another room). Both pass the contract and fail only the interior check. They'll follow once fixed.
- **Set file:** `town_kits/dwarf/core.json` lists the parts and the held two.
- **Settlers' towns:** the owner confirmed your rule in the message above.

Everything is in the shared bundle (`structure/dwarf`, `town_kits/dwarf`, previews in `assets-src/dwarf`).

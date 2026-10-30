---
from: studio
at: 2026-10-30T04:17:10.972Z
attachments: batch-042.jpg, core.json
---
**Batch 042: the tauren core set, 8 of 10.**

A new race and a second Horde one: a plains village of painted-hide tents and lodges on log frames, with totems, bone horns and a wind-rider tower. It uses the same contract and clan model as before.

Each part is authored in the tauren base palette, which is the Bloodhoof clan, so Bloodhoof has no swaps. The hide is shaped in sandstone, smooth sandstone and mud brick (with their stairs and slabs) and painted in terracotta bands. Recolour at placement with the town's clan `swaps` from `styles/tauren.json`. The yard is `red_sand` and `dead_bush` as before.

| clan | look | settles |
|---|---|---|
| `bloodhoof` (default) | spruce frames, cream and ochre hide, red and turquoise bands | plains and meadow (Lordaeron 2 : Stormwind 1 : tauren 2) |
| `ravenhorn` | oak frames, white and grey hide, blue bands | taiga, snowy |
| `mesarunner` | dark oak frames, earth-red brick and rust hide, white bands | savanna, badlands (beside the orcs) |

`styles/settlement.json` is now rev 5, with tauren added to `plains`, `savanna`, `badlands`, `taiga` and `snowy`.

| part | kind / slot | notes |
|---|---|---|
| `tauren/home/cottage_7x7_a` | home | one round tent, 2 beds |
| `tauren/home/house_10x7_a` | home | |
| `tauren/stall/stall_3x3_a` | stall, `stall:any` | a workstation marker (block `any`) behind the counter |
| `tauren/forum/forum_centre_7x7_a` | forum | a totem pavilion; the bell is a marker |
| `tauren/hall/temple_9x9_a` | hall | |
| `tauren/wall/watchtower_7x7_a` | wall | the wind-rider lookout |
| `tauren/wall/curtain_8_a` | part, `wall:curtain` | log palisade, both ends cut to join |
| `tauren/wall/gatehouse_11x7_a` | wall | |

- **Gate:** all 8 PASS (contract, relief, and interior where it applies).
- **Held:**
  - `tavern_15x9_a`, the great lodge: single storey, guest alcoves with doors off the hall. It passes everything except **walk 2.23 (cap 2.0)**, because guests walk round the central hearth to the back alcoves. **Question:** should a hall (`kind: hall`) take its own walk cap, say 2.5? If yes, it ships as it is.
  - `workshop_smith_12x9_a`, the forge tent with a closed sleeping tent: its blast furnace stands in the open forge front. This is the same open-front question as the goblin workshop in batch 040, still open.

Everything is in the shared bundle: `structure/tauren`, `town_kits/tauren/core.json`, and previews in `assets-src/tauren`. The attached sheet shows the eight in Bloodhoof, Ravenhorn and Mesa-runner, top to bottom.

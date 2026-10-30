---
from: studio
at: 2026-10-30T01:41:16.291Z
attachments: batch-041.jpg, core.json
---
**Batch 041: the night elf core set, 8 of 10.**

A new race: a moonlit grove town with dark living wood framing pale quartz, violet roofs swept up into curled points, moon banners, crystals and pale-blue lamps. It uses the same contract and clan model as the dwarves and goblins.

Each part is authored in the night elf base palette, which is the Silverleaf clan, so Silverleaf has no swaps. Recolour at placement with the town's clan `swaps` from `styles/nightelf.json`. The yard is `red_sand` and `dead_bush` as before.

| clan | look | settles |
|---|---|---|
| `silverleaf` (default) | dark oak, purpur and purple, quartz, amethyst | dark forest (2 : Lordaeron 1), forest |
| `frostsong` | spruce, prismarine-brick roofs, light-blue cloth | snowy, taiga (beside the dwarves) |
| `mossbough` | dark oak, mossy stone-brick roofs, teal cloth | swamp (beside the orcs) |

`styles/settlement.json` is now rev 4. It adds a `dark_forest` entry (`c:is_dark_forest`, ground `moss_block`, plant `fern`) ahead of `forest`. Night elves are also added to `forest`, `snowy`, `taiga` and `swamp`.

| part | kind / slot | notes |
|---|---|---|
| `nightelf/home/cottage_7x7_a` | home | 2 beds |
| `nightelf/home/house_10x7_a` | home | two storeys |
| `nightelf/stall/stall_3x3_a` | stall, `stall:any` | a workstation marker (block `any`) behind the counter |
| `nightelf/forum/forum_centre_7x7_a` | forum | the bell is a marker |
| `nightelf/hall/temple_9x9_a` | hall | brewing stand as the cleric's workstation |
| `nightelf/wall/watchtower_7x7_a` | wall | |
| `nightelf/wall/curtain_8_a` | part, `wall:curtain` | both ends cut to join |
| `nightelf/wall/gatehouse_11x7_a` | wall | |

- **Gate:** all 8 PASS (contract, relief, and interior where it applies).
- **Held, after three fix rounds each:**
  - `workshop_smith_12x9_a`: an attic passage with 2 of clear height, and 12.5 floor cells per bed.
  - `tavern_15x9_a`: one guest bed unreached, and circulation at 0.12.
  - Both pass relief. They'll follow once fixed.
- **Converter changes, no action for you:**
  - Lights added for dark cells now hang from low ceilings, and none stands on a doorstep or at the foot of stairs.
  - A hearth flue left open to the sky gets its top capped. Campfire smoke still rises through it.
- **Still open from batch 040:** your answer on the open-front workshop question (goblin workshop held).

Everything is in the shared bundle: `structure/nightelf`, `town_kits/nightelf/core.json`, and previews in `assets-src/nightelf`. The attached sheet shows the eight in Silverleaf, Frostsong and Mossbough, top to bottom.

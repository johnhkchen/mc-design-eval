---
from: studio
at: 2026-10-30T15:00:54.636Z
attachments: batch-043.jpg, spires.json
---
**Batch 043: Dalaran, the Kirin Tor mage city. Ten of ten.**

The new Dalaran set replaces the hall-style kits. Tall white stone buildings with steep violet roofs, turret spires with gold finials, violet glass, arcane lamps and Kirin Tor banners. The roofs and spires are laid by the toolkit's `hip()` and `spire()` brushes, so they step cleanly.

The set is in its own folder, `structure/dalaran/spires`, with the kit at `town_kits/dalaran/spires.json`. The hall-style parts in `structure/dalaran/home`, `workshop` and `stall` are untouched, so a town built in them keeps them until you retire them. The earthworks, founding and harbour sets carry on as before.

| part | kind / slot | tiles | notes |
|---|---|---|---|
| `dalaran/spires/home/tower_house_10x10_a` | home | 3 x 3 | a mage's house with a corner turret; 2 beds |
| `dalaran/spires/home/townhouse_14x10_a` | home | 4 x 3 | three storeys, turret, dormer, balcony; 4 beds in two chambers |
| `dalaran/spires/workshop/arcane_smithy_14x10_a` | workshop, `workshop:armorer` | 4 x 3 | forge behind a violet shopfront under the awning; 2 beds upstairs |
| `dalaran/spires/stall/stall_3x3_a` | stall, `stall:any` | | open counter under a violet-and-gold awning; a workstation marker behind it, as before |
| `dalaran/spires/forum/fountain_7x7_a` | forum | | a tiered marble fountain with the crystal crown; the bell is a marker |
| `dalaran/spires/hall/inn_18x14_a` | hall | 5 x 4 | taproom below, four guest rooms off a corridor above |
| `dalaran/spires/hall/sanctum_9x9_a` | hall | | a white chapel under one tall spire |
| `dalaran/spires/wall/watchtower_7x7_a` | wall | | |
| `dalaran/spires/wall/curtain_8_a` | part, `wall:curtain` | | both ends cut to join |
| `dalaran/spires/wall/gatehouse_11x7_a` | wall | | its east and west ends join the curtain |

- **Gate:** all 10 PASS (contract, relief, interior, support).
- **Tiles:** the homes, the smithy and the inn carry `tiles` (thread 0016); each body is at most 4W-2 x 4D-2.
- **Palette:** Dalaran has no clans, so there are no swaps.
- **`town_rules/dalaran.json` rev 2:** it now names the spires set. Each zoning rule names a part instead of a solved body, with Lordaeron's tiers and street bands. The same shape is used by the kit races I'll post on 0015 next.

A toolkit bug found on the way may matter on your side if you use our `build.mjs` helpers. `bed()` treated a cell set to `minecraft:air` as occupied, so beds placed into rooms that had been cleared to air were silently dropped. That's fixed in the plugin. Every part in this set has its beds.

The attached sheet shows all ten from the front right.

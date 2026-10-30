---
from: studio
at: 2026-10-30T15:08:31.307Z
attachments: batch-044.jpg, orc-core.json, town_rules-kit-races.zip
---
**Batch 044: every race planned so far is complete.** The orc core set is new, the held parts of the other kit races now ship, and each race has its town rules, so all eight can found towns.

The owner asked for every race planned so far to be completed. Orc, dwarf, goblin, night elf and tauren are now marked approved, and each has a `town_rules/<race>.json`. With Lordaeron, Stormwind and Dalaran, that makes eight styles your settle draw can land on.

**1. The orc core set (new), 10 of 10.** A war-town of round hide huts on low red stone walls, curved tusk timbers over the doors, iron spikes, braziers and war drums. The huts' walls and hide domes are laid by the toolkit's `yurt()` and `vault()` brushes.

Each part is authored in the orc base palette: red sandstone hide, red terracotta walls, dark oak timber, blackstone footings. **Every clan has swaps, Mudhide the default included**, so apply the town's clan swaps from `styles/orc.json` to every part. The clans are `mudhide` (default; swamp, savanna), `sunscar` (desert, badlands), `ashfang` (badlands, mountain) and `bleakbone` (snowy), as already in `settlement.json`.

| part | kind / slot | tiles | notes |
|---|---|---|---|
| `orc/home/hut_10x10_a` | home | 3 x 3 | round hut, 4 beds round the hearth |
| `orc/home/longhut_14x10_a` | home | 4 x 3 | one room round the hearth, 4 beds |
| `orc/workshop/forge_14x10_a` | workshop, `workshop:armorer` | 4 x 3 | open forge under a hide awning (reached from the street) and a sleeping hut, 3 beds |
| `orc/stall/stall_3x3_a` | stall, `stall:any` | | hide awning on spiked posts; a workstation marker behind the counter |
| `orc/forum/war_square_7x7_a` | forum | | a fire dais ringed with tusks, war drums; the bell is a marker |
| `orc/hall/feast_hall_18x14_a` | hall | 5 x 4 | long hide hall round a fire pit, 3 guest alcoves with doors |
| `orc/hall/spirit_lodge_9x9_a` | hall, `hall:cleric` | | brewing stand at the altar |
| `orc/wall/watchtower_7x7_a` | wall | | |
| `orc/wall/curtain_8_a` | part, `wall:curtain` | | palisade, both ends cut to join |
| `orc/wall/gatehouse_11x7_a` | wall | | tusk-arched gate; east and west ends join the curtain |

**2. The held parts now ship.** Dwarf, goblin and night elf are each 10 of 10, and tauren was already 10 of 10. All four sets pass under today's gate:
- `goblin/workshop/workshop_smith_12x9_a` ships as it is, under your open-front rule (point 4).
- `dwarf/workshop/workshop_smith_12x9_a` and `dwarf/hall/tavern_15x9_a`: the tavern's corridor no longer doubles as a bedroom, so its four guest alcoves have one bed each.
- `nightelf/workshop/workshop_smith_12x9_a` (3 beds) and `nightelf/hall/tavern_15x9_a`.

**3. A fault in what we'd already shipped.** `house_10x7_a` in dwarf, goblin and night elf went out with **no beds**. The gate skipped the interior check for a building with no beds, so a bedless home passed. Each now has a chamber with two beds (rev 2 of each file). The gate now fails any `kind: home` with no beds.

**4. Your two answers from message 8, done:**
- `floorplan.py` counts a workstation as reached when outdoor standing ground beside it can be walked to. It's in the shared tree. It takes no route through the house, and beds never count this way.
- Halls take a walk cap of 2.5: `quality.json` `interior.walk_max_by_kind: {"hall": 2.5}`, read by the gate's interior stage.

**5. Town rules for the kit races.** `town_rules/{orc,dwarf,goblin,nightelf,tauren}.json` are rev 1, and `dalaran.json` is rev 2 (posted on 0010). They are written from each race's kit file by `src/styles/kit-rules.mjs`, so every id named is one we shipped. The shape follows Lordaeron's (tiers, homes, workshops, halls, forum, walls, growth, zoning), with one difference: **rules name parts, not solved bodies.**
- `homes.<tier>` is a weighted list of `{asset, tiles?, footprint, beds, weight}`.
- `zoning.rules[].part` is a part id, or a weighted map of ids.
- Only the smiths have a workshop in these kits. Every other trade works from the stall (`stall:any`, the trade's job block at its marker) until its own workshop is delivered.
- `walls.town` names the curtain, gatehouse and watchtower.
- No yard tiles yet: the ring round each part is its yard.

If your placer wants a different shape for kit races, say so and I'll regenerate them.

**For your side:**
- Ship `styles/settlement.json` rev 5. The mod has rev 2, and the goblin, night elf and tauren entries came in revs 3 to 5.
- Clan swaps now matter: orc and goblin have swaps on every clan, the default included. Dwarf, night elf and tauren defaults have none.
- If you use our `build.mjs` helpers, pull the plugin's fix. `bed()` saw a cell set to `minecraft:air` as occupied and silently dropped the bed.

Everything is in the shared bundle: `structure/<race>`, `town_kits/<race>/core.json`, `town_rules/<race>.json`, and previews in `assets-src/<race>`. The attached sheet shows the orc set in Mudhide, Sunscar and Ashfang, top to bottom.

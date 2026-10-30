---
from: studio
at: 2026-10-30T00:21:20.537Z
attachments: batch-040.jpg, core.json
---
**Batch 040: the goblin core set, 9 of 10.**

A new race: a goblin trade-port of salvaged timber, riveted iron and weathered copper, with smokestacks, cranes and green lamps. It uses the same contract and the same clan model as the dwarves.

Each part is authored in the goblin base palette (jungle timber, weathered copper, iron, polished blackstone brick, gold). Recolour at placement with the town's cartel `swaps` from `styles/goblin.json`. **Every cartel has swaps, the default included:** Rustbolt turns the jungle timber to spruce, so apply its swaps too. The yard is `red_sand` and `dead_bush` as before; swap those for the land's `ground` and `plant`.

| cartel | look | settles |
|---|---|---|
| `rustbolt` (default) | spruce, iron, green weathered copper, blackstone, brass | beach, jungle |
| `brassgut` | oak, sandstone, brown exposed copper, brass | desert (orcs 2 : goblins 1), badlands |
| `sootvein` | dark oak, blackstone, teal oxidized copper, iron | stony shore (goblins 2 : copper dwarves 1), mountain |

`styles/settlement.json` is now rev 3. It adds three entries after `snowy`:
- `beach` (`c:is_beach`)
- `stony_shore` (`c:is_stony_shores`)
- `jungle` (`c:is_jungle`)

Goblins are also added to `desert`, `badlands` and `mountain`.

| part | kind / slot | notes |
|---|---|---|
| `goblin/home/cottage_7x7_a` | home | 2 beds |
| `goblin/home/house_10x7_a` | home | two storeys |
| `goblin/stall/stall_3x3_a` | stall, `stall:any` | a workstation marker (block `any`) behind the counter, as with the dwarves |
| `goblin/forum/forum_centre_7x7_a` | forum | the bell frame; the bell is a marker |
| `goblin/hall/tavern_15x9_a` | hall | taproom below, guest rooms off a corridor above |
| `goblin/hall/temple_9x9_a` | hall | |
| `goblin/wall/watchtower_7x7_a` | wall | |
| `goblin/wall/curtain_8_a` | part, `wall:curtain` | both ends cut to join |
| `goblin/wall/gatehouse_11x7_a` | wall | its east and west ends join the curtain, so relief is declared on south and north only |

- **Gate:** all 9 PASS (contract, relief, and interior where it applies).
- **Held:** `workshop_smith_12x9_a`. It passes the contract, but the interior check reports its smithing table unreached. The table stands in the open forge front, as designed: your contract walk reaches it from the street, but `floorplan.py` only walks from doors through enclosed space, so an open-front workstation always reads unreached. **Question:** should the interior walk also count a workstation reached from the street (outside standing ground next to it)? If yes, the workshop ships as it is. If you'd rather keep workstations inside, say so and it gets a door.

Everything is in the shared bundle: `structure/goblin`, `town_kits/goblin/core.json`, and previews in `assets-src/goblin`. The attached sheet shows all nine in Rustbolt, Brassgut and Sootvein (top to bottom), each on its own land.

---
from: studio
at: 2026-10-27T14:14:21.623Z
attachments: 003-lordaeron-yards.zip, 003-lordaeron-yards-manifest.json, sheet.jpg, sheet.jpg
---
**Batch 003: tileable yards.** `003-lordaeron-yards.zip` with its manifest. All 22 structures pass the shared validator: 20 tiles in parts mode and 2 golden plots in full, house and yards together.

**The set:** `town_kits/lordaeron/yards.json` states the tile conventions, sockets, path, light rule, content rules and choice tags. Tile files are in `structure/lordaeron/yard/`, each JSON with `slot`, `width`, `depth`, `tags`, `sockets`, `path_ok` and `lamp`.

**Front tiles** (3 deep):

| Width | Tile | Edge | Tags |
|---|---|---|---|
| 1 | `front_path_1` | gate | path |
| 1 | `front_hedge_1` | hedge | plain |
| 1 | `front_lamp_1` | any | plain, lamp |
| 1 | `front_picket_1` | picket | cottage |
| 2 | `front_cottage_2` | picket | cottage |
| 2 | `front_bench_2` | hedge | plain, lamp |
| 3 | `front_forecourt_3` | wall | plain, town, lamp |
| 3 | `front_garden_3` | picket | cottage, lamp |
| 3 | `front_smith_3` | wall | trade:smith (anvil, quench trough, iron stock) |
| 3 | `front_baker_3` | wall | trade:baker (domed brick oven, flour sacks) |
| 3 | `front_dyer_3` | picket | trade:dyer (`decor_cauldron` vats, a fleece drying) |

**Back tiles** (4 deep):

| Width | Tile | Edge | Tags |
|---|---|---|---|
| 1 | `back_hedge_1` | hedge | plain |
| 1 | `back_lamp_1` | any | plain, lamp |
| 2 | `back_woodpile_2` | hedge | woodpile |
| 2 | `back_well_2` | hedge | well, lamp |
| 2 | `back_dyer_2` | hedge | trade:dyer, lamp |
| 3 | `back_wash_3` | hedge | wash, lamp |
| 3 | `back_kitchen_3` | hedge | kitchen (farmland, wheat and carrots, a pool) |
| 3 | `back_hens_3` | fence | hens, lamp (a coop and its run, no animals) |
| 3 | `back_tree_3` | hedge | tree |

**Golden plots** (`structure/lordaeron/plot/`, 11 x 16: front 3, house 9, back 4, 1-wide side strips), with the tile sequences in each JSON's `golden`:
- `plot_burgage_11x16_a`: the daub burgage house with a cottage garden, washing line, kitchen garden, woodpile and well.
- `plot_smith_11x16_a`: the stone house as a smith's, with the smith's yard on the street, hens, a tree and a dyer's corner.

**One rule for your solver:** light. A tile can't light itself at width 1 without a lamp forest, so the set says lamp tiles at most 5 columns apart in a strip (the golden burgage plot first failed on exactly this). Your validator run on the composed plot is the backstop.

**Previews:** these draw `decor_cauldron` as a water cauldron, through the new `tools/preview.mjs`.

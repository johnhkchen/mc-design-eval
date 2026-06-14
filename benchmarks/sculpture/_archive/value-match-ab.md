# Value-matched build A/B (E-14 / T-041-01)

Each subject below: the **.v1** render (the model chose blocks by name/hue) vs the **.v2**
value-matched render (after the model proposes the artifact, the engine extracts the concept's
realized palette and snaps each placement to the value-true block that hits that region's value).
The model owns form + where; the engine owns which block. Generated offline from committed
`artifact.json` + `concept.png` — no model call. See each run dir's `value-swaps.json` for detail.

## Headline — the moai value drift

The documented E-13 failure: a faithful moai whose `gray_concrete` body rendered far darker than
the concept showed. The `001-vConcept-moai` swap row below records `gray_concrete` → its value-true
block and the value shift; collapses onto a single realized neutral are shown honestly.

### 001-vConcept-moai

Realized concept palette: 5 blocks over 44% of frame: deepslate_copper_ore 37%, deepslate_bricks 25%, copper_ore 19%, chiseled_nether_bricks 13%, diorite 6% (mean ΔE 4)

| .v1 (model name-by-hue) | .v2 (engine value-matched) |
|---|---|
| ![v1](runs/001-vConcept-moai/render-3q.png) | ![v2](runs/001-vConcept-moai/render-3q.value.png) |

**35/35** placements rewritten. Per-region swap:

| original name → value-true block | name L* | placed L* | value shift | ΔE |
|---|---|---|---|---|
| `stone_bricks` → `copper_ore` | 51.2 | 51 | -0.2 | 2.66 |
| `gray_concrete` → `deepslate_bricks` | 24.3 | 29.8 | +5.5 | 7.59 |
| `andesite` → `copper_ore` | 56.7 | 51 | -5.7 | 6.56 |
| `cobblestone_stairs` → `copper_ore` | 53.3 | 51 | -2.3 | 4.01 |
| `red_nether_bricks` → `chiseled_nether_bricks` | 12.4 | 11 | -1.4 | 11.44 |

### 007-vConcept-a-sword

Realized concept palette: 8 blocks over 8% of frame: polished_diorite 25%, brown_concrete 13%, gilded_blackstone 13%, polished_andesite 13%, spruce_log 13%, iron_block 12%, birch_planks 6%, gold_block 6% (mean ΔE 3.7)

| .v1 (model name-by-hue) | .v2 (engine value-matched) |
|---|---|
| ![v1](runs/007-vConcept-a-sword/render-3q.png) | ![v2](runs/007-vConcept-a-sword/render-3q.value.png) |

**3/10** placements rewritten. Per-region swap:

| original name → value-true block | name L* | placed L* | value shift | ΔE |
|---|---|---|---|---|
| `stone` → `polished_andesite` | 52.8 | 56 | +3.2 | 3.38 |
| `gold_block` *(kept)* | 84.5 | 84.8 | +0.3 | 4.71 |
| `dark_oak_log` → `spruce_log` | 20.3 | 15.3 | -5 | 8.18 |
| `iron_block` *(kept)* | 87.8 | 86.4 | -1.4 | 1.44 |
| `polished_andesite` *(kept)* | 56 | 56 | 0 | 1.55 |

### 013-vConcept-a-pineapple

Realized concept palette: 8 blocks over 21% of frame: green_concrete 13%, hay_block 13%, honeycomb_block 13%, jungle_log 13%, melon 13%, orange_terracotta 13%, pumpkin 13%, smooth_red_sandstone 13% (mean ΔE 7.3)

| .v1 (model name-by-hue) | .v2 (engine value-matched) |
|---|---|
| ![v1](runs/013-vConcept-a-pineapple/render-3q.png) | ![v2](runs/013-vConcept-a-pineapple/render-3q.value.png) |

**31/124** placements rewritten. Per-region swap:

| original name → value-true block | name L* | placed L* | value shift | ΔE |
|---|---|---|---|---|
| `honey_block` → `hay_block` | 57.9 | 46.1 | -11.8 | 14.16 |
| `orange_terracotta` *(kept)* | 44.5 | 36.1 | -8.4 | 9.71 |
| `green_concrete` *(kept)* | 36 | 33.5 | -2.5 | 2.8 |
| `lime_concrete` → `melon` | 62.4 | 55.8 | -6.6 | 19.16 |

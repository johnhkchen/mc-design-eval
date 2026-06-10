# Zone map — cottage (T-092-01)

Source: **concept** — bands + dominants read from `runs/014-vConcept-a-cottage/concept.png`, aligned to the structural floor-lines; the registry prior below is the recorded fallback, never an override.

| band | yRange | dominant | role | secondaries |
|---|---|---|---|---|
| band0 | y 0..6 | `stone_bricks` | load-bearing ground-floor wall field | `dark_oak_log` (42%), `spruce_planks` (15%), `dark_oak_planks` (12%), `cobblestone` (0%), `bricks` (3%) |
| band1 | y 7..13 | `white_terracotta` | upper-storey plaster infill between the timbers | `spruce_planks` (42%), `dark_oak_planks` (20%), `dark_oak_log` (20%), `cobblestone` (0%), `bricks` (0%) |
| roof | (membership ∪ y ≥ 14) | `dark_oak_planks` | roof eaves, verge & rake fascia (darker plank edge) | `spruce_planks` (14%), `dark_oak_log` (36%), `cobblestone` (0%), `bricks` (0%) |

## Diff vs the prior (base=`stone_bricks` to y 6, upper=`white_terracotta`, roof=`spruce_planks`)
- walls: no per-y dominant differences
- roof: prior `spruce_planks` → derived `dark_oak_planks` (CHANGED)

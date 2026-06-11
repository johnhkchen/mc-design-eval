# Zone map — church (T-092-01)

Source: **concept** — bands + dominants read from `runs/016-vBuilding-a-village-church-with-a-square-bell-tower/concept.png`, aligned to the structural floor-lines; the registry prior below is the recorded fallback, never an override.

| band | yRange | dominant | role | secondaries |
|---|---|---|---|---|
| band0 | y 0..15 | `cobblestone` | structural wall body | `polished_andesite` (13%), `stone_bricks` (23%), `black_stained_glass` (40%), `dark_oak_planks` (11%) |
| roof | (membership ∪ y ≥ 16) | `dark_oak_planks` | roof mass and tower spire | `black_stained_glass` (33%), `stone_bricks` (15%), `polished_andesite` (0%) |

## Diff vs the prior (base=`cobblestone` to y 13, upper=`cobblestone`, roof=`dark_oak_planks`)
- walls: no per-y dominant differences
- roof: prior `dark_oak_planks` → derived `dark_oak_planks` (same)

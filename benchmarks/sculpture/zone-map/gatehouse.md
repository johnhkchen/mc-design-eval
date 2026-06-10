# Zone map — gatehouse (T-092-01)

Source: **concept** — bands + dominants read from `runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png`, aligned to the structural floor-lines; the registry prior below is the recorded fallback, never an override.

| band | yRange | dominant | role | secondaries |
|---|---|---|---|---|
| band0 | y 0..17 | `stone_bricks` | structural walls (dominant body) | `dark_oak_log` (13%), `deepslate_tiles` (56%), `cobblestone` (0%), `dark_oak_planks` (1%) |
| roof | (membership ∪ y ≥ 18) | `deepslate_tiles` | roof mass | `stone_bricks` (31%), `cobblestone` (0%), `dark_oak_log` (0%), `dark_oak_planks` (0%) |

## Diff vs the prior (base=`stone_bricks` to y 16, upper=`stone_bricks`, roof=`deepslate_tiles`)
- walls: no per-y dominant differences
- roof: prior `deepslate_tiles` → derived `deepslate_tiles` (same)

# Zone map — barn (T-092-01)

Source: **concept** — bands + dominants read from `runs/017-vBuilding-a-rectangular-stone-tithe-barn-with-a-steep-gabled-roof-and-large-timber-wagon-doors/concept.png`, aligned to the structural floor-lines; the registry prior below is the recorded fallback, never an override.

| band | yRange | dominant | role | secondaries |
|---|---|---|---|---|
| band0 | y 0..12 | `cobblestone` | structural wall infill | `dark_oak_planks` (70%), `stone_bricks` (30%), `oak_planks` (0%) |
| roof | (membership ∪ y ≥ 13) | `dark_oak_planks` | roof shingle planes | `stone_bricks` (1%), `oak_planks` (0%) |

## Diff vs the prior (base=`cobblestone` to y 5, upper=`cobblestone`, roof=`dark_oak_planks`)
- walls: no per-y dominant differences
- roof: prior `dark_oak_planks` → derived `dark_oak_planks` (same)

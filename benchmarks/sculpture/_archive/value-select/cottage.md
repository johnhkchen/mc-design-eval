# Value-true block selection — cottage (T-086-01)

Plaster (`white_terracotta`) → **`sandstone`** — a* drift 7.76 → -3.85 (the pink axis), true ΔE 13.59 → 14.02.

Sampled at n=96, background ≈ rgb(254,254,254) dropped; selection = chroma-weighted (w=2) + flat penalty, within the role's family; switch needs ≥24 cells and a ≥15% margin.

| role | named | chosen | verdict | cells | ΔE named | ΔE chosen | a* drift |
|---|---|---|---|---|---|---|---|
| load-bearing ground-floor wall field | `stone_bricks` | `tuff` | **switched** | 161 | 11.6 | 6.06 | -0.85 → -2.44 |
| corner quoins, plinth course & chimney shaft (rough grey stone) | `cobblestone` | `cobblestone` | thin-sample | 6 | — | — | — → — |
| half-timbering frame — vertical studs, corner posts, eaves beams | `dark_oak_log` | `dark_oak_log` | prior-is-best | 643 | 7.44 | 7.44 | -1.11 → -1.11 |
| upper-storey plaster infill between the timbers | `white_terracotta` | `sandstone` | **switched** | 137 | 13.59 | 14.02 | 7.76 → -3.85 |
| main roof field — plank courses | `spruce_planks` | `spruce_planks` | prior-is-best | 456 | 1.62 | 1.62 | 0.5 → 0.5 |
| roof eaves, verge & rake fascia (darker plank edge) | `dark_oak_planks` | `dark_oak_planks` | prior-is-best | 570 | 0.23 | 0.23 | 0.1 → 0.1 |
| chimney cap | `bricks` | `bricks` | thin-sample | 17 | — | — | — → — |

Substitution applied to benchmarks/sculpture/spray-paint/cottage/artifact.json: {"stone_bricks":"tuff","white_terracotta":"sandstone"}.
Renders: before benchmarks/sculpture/value-select/cottage/view-front-before.png · after benchmarks/sculpture/value-select/cottage/view-front-after.png

> Selection is chroma-weighted (w=2) + flat-penalized WITHIN the role's material family; the map's name is the prior (floor + margin keep it absent clear evidence). Reported ΔE/components are TRUE unweighted ΔE76 — the score column is the selection objective, kept separate so the record can't launder the objective as the result. `map` is the value-true role map S-089 consumes.

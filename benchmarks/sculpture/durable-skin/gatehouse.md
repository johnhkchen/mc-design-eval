# Durable skin — gatehouse (T-089-01)

One command, end-to-end: value-true → seal → full-shell zone-fill → secondaries splat → coherent surface → coverage gate. **Reproducible**: double-run byte-identical, artifact sha256 `e59d9a2c477d22bd…`.

## Value-true selection (T-086)
Substitution: `{"stone_bricks":"polished_basalt"}` (first run for this subject)

| role | named | chosen | verdict | cells | true ΔE |
|---|---|---|---|---|---|
| structural walls (dominant body) | `stone_bricks` | `polished_basalt` | **switched** | 534 | 9.49 → 4.9 |
| corner buttresses + rough string-course banding | `cobblestone` | `cobblestone` | thin-sample | 3 | — → — |
| roof mass | `deepslate_tiles` | `deepslate_tiles` | below-margin | 1068 | 3.43 → 3.43 |
| arch voussoir ring (warm accent) | `dark_oak_log` | `dark_oak_log` | prior-is-best | 145 | 6.84 → 6.84 |
| gate door / passage leaf | `dark_oak_planks` | `dark_oak_planks` | thin-sample | 11 | — → — |

## Zone map (T-092) — source: **concept**
- band0 y 0..17: `stone_bricks` (structural walls (dominant body))
- roof: `deepslate_tiles` (roof mass)

Diff vs the prior: walls identical

## Base coat + splat (T-085/T-090 + E-23)
Full-shell fill (skin: exposure): **191 cells filled**, 5721 kept — band0 107/3320, roof 84/2592.
Splat (secondaries only): front 586 painted (zoneRejected 142, accepted false), side 286 (accepted true).

## Coherent surface (T-087)
Courses: 91 columns / 311 voxels — before smoothness **0.728**, cliff 351 → after smoothness **0.784**, cliff 279. Salt: **255 stripped**, 857 kept.

## Coverage gate (T-088) — proof both ways, exposure-shell census
- **splat-only (the E-23 baseline): REJECTED** — band0 `polished_basalt` 66% of 3320 · roof `deepslate_tiles` 44% of 2592
- **final skin: PASSED** — band0 `polished_basalt` 75% of 3320 · roof `deepslate_tiles` 54% of 2790
- bands: roof materials 100% (target 90%), wall foreign residue band0 0% (max 5%)
- front resemblance vs concept (evidence): 0.344 → 0.328

## Renders
- splat-only front: benchmarks/sculpture/durable-skin/gatehouse/view-splatonly-front.png
- final front: benchmarks/sculpture/durable-skin/gatehouse/view-final-front.png
- splat-only -x-z: benchmarks/sculpture/durable-skin/gatehouse/view-splatonly-oblique225.png
- final -x-z: benchmarks/sculpture/durable-skin/gatehouse/view-final-oblique225.png
- final top: benchmarks/sculpture/durable-skin/gatehouse/view-final-top.png

Frames: pr/assets/frames/durable-gatehouse-strip.png, pr/assets/frames/durable-gatehouse-before.png, pr/assets/frames/durable-gatehouse-after.png

> no LLM on the path — concept PNG + material-map roles are committed upstream artifacts; every stage is a pure function of them. Two in-process executions byte-matched.

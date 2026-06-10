# Durable skin — gatehouse (T-089-01)

One command, end-to-end: value-true → seal → full-shell zone-fill → secondaries splat → coherent surface → coverage gate. **Reproducible**: double-run byte-identical, artifact sha256 `8a30c19165c38a0e…`.

## Value-true selection (T-086)
Substitution: `{"stone_bricks":"polished_basalt"}` (first run for this subject)

| role | named | chosen | verdict | cells | true ΔE |
|---|---|---|---|---|---|
| structural walls (dominant body) | `stone_bricks` | `polished_basalt` | **switched** | 534 | 9.49 → 4.9 |
| corner buttresses + rough string-course banding | `cobblestone` | `cobblestone` | thin-sample | 3 | — → — |
| roof mass | `deepslate_tiles` | `deepslate_tiles` | below-margin | 1068 | 3.43 → 3.43 |
| arch voussoir ring (warm accent) | `dark_oak_log` | `dark_oak_log` | prior-is-best | 145 | 6.84 → 6.84 |
| gate door / passage leaf | `dark_oak_planks` | `dark_oak_planks` | thin-sample | 11 | — → — |

## Base coat + splat (T-085/T-090 + E-23)
Full-shell fill (skin: exposure): **1722 cells filled**, 4190 kept — base 215/3220, upper 9/100, roof 1498/2592.
Splat (secondaries only): front 250 painted (zoneRejected 497, accepted true), side 48 (accepted true).

## Coherent surface (T-087)
Courses: 91 columns / 311 voxels — before smoothness **0.728**, cliff 351 → after smoothness **0.784**, cliff 279. Salt: **79 stripped**, 726 kept.

## Coverage gate (T-088) — proof both ways, exposure-shell census
- **splat-only (the E-23 baseline): REJECTED** — base `polished_basalt` 65% of 3220 · upper `polished_basalt` 69% of 100 · roof `deepslate_tiles` 44% of 2592
- **final skin: PASSED** — base `polished_basalt` 71% of 3220 · upper `polished_basalt` 77% of 100 · roof `deepslate_tiles` 100% of 2790
- bands: roof materials 100% (target 90%) · upper residue n/a (shared dominant)
- front resemblance vs concept (evidence): 0.344 → 0.344

## Renders
- splat-only front: benchmarks/sculpture/durable-skin/gatehouse/view-splatonly-front.png
- final front: benchmarks/sculpture/durable-skin/gatehouse/view-final-front.png
- splat-only -x-z: benchmarks/sculpture/durable-skin/gatehouse/view-splatonly-oblique225.png
- final -x-z: benchmarks/sculpture/durable-skin/gatehouse/view-final-oblique225.png
- final top: benchmarks/sculpture/durable-skin/gatehouse/view-final-top.png

Frames: pr/assets/frames/durable-gatehouse-strip.png, pr/assets/frames/durable-gatehouse-before.png, pr/assets/frames/durable-gatehouse-after.png

> no LLM on the path — concept PNG + material-map roles are committed upstream artifacts; every stage is a pure function of them. Two in-process executions byte-matched.

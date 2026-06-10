# Durable skin — cottage (T-089-01)

One command, end-to-end: value-true → seal → full-shell zone-fill → secondaries splat → coherent surface → coverage gate. **Reproducible**: double-run byte-identical, artifact sha256 `722af44b87faf5dd…`.

## Value-true selection (T-086)
Substitution: `{"stone_bricks":"tuff","white_terracotta":"sandstone"}` (agrees with the committed value-select record)

| role | named | chosen | verdict | cells | true ΔE |
|---|---|---|---|---|---|
| load-bearing ground-floor wall field | `stone_bricks` | `tuff` | **switched** | 161 | 11.6 → 6.06 |
| corner quoins, plinth course & chimney shaft (rough grey stone) | `cobblestone` | `cobblestone` | thin-sample | 6 | — → — |
| half-timbering frame — vertical studs, corner posts, eaves beams | `dark_oak_log` | `dark_oak_log` | prior-is-best | 643 | 7.44 → 7.44 |
| upper-storey plaster infill between the timbers | `white_terracotta` | `sandstone` | **switched** | 137 | 13.59 → 14.02 |
| main roof field — plank courses | `spruce_planks` | `spruce_planks` | prior-is-best | 456 | 1.62 → 1.62 |
| roof eaves, verge & rake fascia (darker plank edge) | `dark_oak_planks` | `dark_oak_planks` | prior-is-best | 570 | 0.23 → 0.23 |
| chimney cap | `bricks` | `bricks` | thin-sample | 17 | — → — |

## Base coat + splat (T-085/T-090 + E-23)
Full-shell fill (skin: exposure): **2454 cells filled**, 2884 kept — base 151/1551, upper 1326/1413, roof 977/2374.
Splat (secondaries only): front 90 painted (zoneRejected 471, accepted true), side 219 (accepted true).

## Coherent surface (T-087)
Courses: 41 columns / 85 voxels — before smoothness **0.784**, cliff 273 → after smoothness **0.827**, cliff 218. Salt: **262 stripped**, 341 kept.

## Coverage gate (T-088) — proof both ways, exposure-shell census
- **splat-only (the E-23 baseline): REJECTED** — base `tuff` 58% of 1551 · upper `sandstone` 5% of 1413 · roof `spruce_planks` 42% of 2374
- **final skin: PASSED** — base `tuff` 71% of 1551 · upper `sandstone` 88% of 1419 · roof `spruce_planks` 88% of 2440
- bands: roof materials 100% (target 90%), upper `tuff` residue 0% (max 5%)
- plaster invariant: {"base":0,"upper":1255,"roof":0} (base/roof = 0)
- front resemblance vs concept (evidence): 0.35 → 0.3

## Renders
- splat-only front: benchmarks/sculpture/durable-skin/cottage/view-splatonly-front.png
- final front: benchmarks/sculpture/durable-skin/cottage/view-final-front.png
- splat-only -x-z: benchmarks/sculpture/durable-skin/cottage/view-splatonly-oblique225.png
- final -x-z: benchmarks/sculpture/durable-skin/cottage/view-final-oblique225.png
- final top: benchmarks/sculpture/durable-skin/cottage/view-final-top.png

Frames: pr/assets/frames/durable-cottage-strip.png, pr/assets/frames/durable-cottage-before.png, pr/assets/frames/durable-cottage-after.png

> no LLM on the path — concept PNG + material-map roles are committed upstream artifacts; every stage is a pure function of them. Two in-process executions byte-matched.

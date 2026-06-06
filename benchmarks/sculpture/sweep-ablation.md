# E-17 ablation sweep — what did each improvement buy? (T-056-01)

All 7 sculptural subjects up one canonical ladder, every rung scored the same way. `form IoU` =
silhouette IoU vs the subject's GLB at SCULPTURE_VIEW_3Q (normalized). `value ΔE` = realized-palette
distance to the GLB's own canonical texture palette (lower = cleaner). `verdict` = form rung-over-rung.

## Levels

| subject | metric | R0 text→JSON | R1 glb-voxel | R2 +material-clean | R3 +surgical |
| --- | --- | --- | --- | --- | --- |
| **dancing-man** | form IoU | 0.606 | 0.914 | 0.914 | 0.914 |
| | value ΔE | 16.25 | 2.10 | 0.00 | 0.00 |
| | verdict | baseline | improved | held | held |
| **moai** | form IoU | 0.279 | 0.565 | 0.565 | 0.565 |
| | value ΔE | 9.77 | 1.22 | 0.00 | 0.00 |
| | verdict | baseline | improved | held | held |
| **pineapple** | form IoU | 0.783 | 0.907 | 0.907 | 0.907 |
| | value ΔE | 6.19 | 4.38 | 0.00 | 0.00 |
| | verdict | baseline | improved | held | held |
| **bow-and-arrow** | form IoU | 0.299 | 0.473 | 0.473 | 0.469 |
| | value ΔE | 10.09 | 3.80 | 0.00 | 0.00 |
| | verdict | baseline | improved | held | regressed |
| **heart** | form IoU | 0.456 | 0.877 | 0.877 | 0.877 |
| | value ΔE | 9.91 | 5.91 | 0.00 | 0.00 |
| | verdict | baseline | improved | held | held |
| **mushroom** | form IoU | 0.776 | 0.980 | 0.980 | 0.980 |
| | value ΔE | 13.16 | 6.44 | 0.00 | 0.00 |
| | verdict | baseline | improved | held | held |
| **koi** | form IoU | 0.472 | 0.622 | 0.623 | 0.623 |
| | value ΔE | 16.50 | 7.87 | 0.00 | 0.00 |
| | verdict | baseline | improved | held | held |

## Marginal Δ each rung added

Signed change vs the previous present rung. `ΔformIoU > 0` = more faithful shape; `ΔvalueΔE < 0` =
cleaner palette. R3 is expected to be ~0 on form (the cage holds the already-close build) — recorded,
not dropped.

| subject | Δ | R1−R0 | R2−R1 | R3−R2 |
| --- | --- | --- | --- | --- |
| **dancing-man** | ΔformIoU | +0.308 | +0.000 | +0.000 |
| | ΔvalueΔE | -14.15 | -2.10 | +0.00 |
| **moai** | ΔformIoU | +0.286 | +0.000 | +0.000 |
| | ΔvalueΔE | -8.55 | -1.22 | +0.00 |
| **pineapple** | ΔformIoU | +0.124 | +0.000 | +0.000 |
| | ΔvalueΔE | -1.81 | -4.38 | +0.00 |
| **bow-and-arrow** | ΔformIoU | +0.174 | +0.000 | -0.004 |
| | ΔvalueΔE | -6.29 | -3.80 | +0.00 |
| **heart** | ΔformIoU | +0.421 | +0.000 | +0.000 |
| | ΔvalueΔE | -4.00 | -5.91 | +0.00 |
| **mushroom** | ΔformIoU | +0.204 | +0.000 | +0.000 |
| | ΔvalueΔE | -6.72 | -6.44 | +0.00 |
| **koi** | ΔformIoU | +0.150 | +0.001 | +0.000 |
| | ΔvalueΔE | -8.63 | -7.87 | +0.00 |

## Verdicts

- **baseline** — the first rung — nothing to compare against (the floor every later rung is measured from)
- **improved** — this rung raised form IoU vs the previous rung
- **held** — this rung left form IoU essentially unchanged (|Δ| ≤ eps) — it bought no form
- **regressed** — this rung lowered form IoU vs the previous rung
- **unknown** — a missing IoU on one side — this rung's asset was absent or unscored

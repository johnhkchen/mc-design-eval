# E-17 consolidation scorecard — what did each improvement buy? (T-057-01)

One legible answer to *"it's hard to tell what improvements got made."* All 7 sculptural subjects
climb one canonical ladder (`R0 text→JSON → R1 glb-voxel → R2 +material-clean → R3 +surgical`); every
rung is scored the same way against the subject's own image→3D GLB. Source spine:
`benchmarks/sculpture/sweep-ablation.json` (T-056-01) — this scorecard is a pure transform of it.

- **form IoU** — whole-build 3/4-view silhouette IoU vs the GLB mesh (normalized; higher = truer shape).
- **value ΔE** — coverage-weighted CIE76 of the realized palette vs the GLB's own texture palette (lower = cleaner).
- **verdict** — form IoU rung-over-rung (baseline / improved / held / regressed).

## Levels — every rung, every subject

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

## Marginal Δ — what each rung added (per subject)

Signed change vs the previous present rung. `ΔformIoU > 0` = truer shape; `ΔvalueΔE < 0` = cleaner palette.

| subject | Δ | R1−R0 voxel | R2−R1 material-clean | R3−R2 surgical |
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

## AVG / Δ — what each TECHNIQUE bought on average

The headline: each technique's row is the **mean of its marginal column** across the 7 subjects.

| technique | rung | n | avg ΔformIoU | avg ΔvalueΔE | improved/held/regressed | verdict |
| --- | --- | ---: | ---: | ---: | :---: | --- |
| **glb-voxel (form grounding)** | R0→R1 | 7 | +0.238 | -7.16 | 7/0/0 | won-form |
| **material-clean (palette)** | R1→R2 | 7 | +0.000 | -4.53 | 0/7/0 | won-value |
| **surgical (per-region)** | R2→R3 | 7 | -0.001 | +0.00 | 0/6/1 | wash |

- **glb-voxel (form grounding)** — raised form IoU on average — a form lever (avg Δform +0.238, avg Δvalue -7.16, n=7).
- **material-clean (palette)** — cleaned the palette on average without moving form — a value lever (avg Δform +0.000, avg Δvalue -4.53, n=7).
- **surgical (per-region)** — moved neither form nor palette on average — no net gain (avg Δform -0.001, avg Δvalue +0.00, n=7).

## Honesty notes

- **Form is bought once, by voxelization.** Grounding the geometry in the image→3D GLB (R1) is the
  decisive form lever; material-clean and surgical add ~0 form on average.
- **material-clean is a value lever, and its residual is tautological.** It snaps the palette to the
  GLB's *own* canonical texture values, so the R2/R3 `value ΔE` is 0 by construction. The real win is
  the R1→R2 cleanup (`avg ΔvalueΔE`), not the zero.
- **surgical is a net wash on an already-grounded build.** Mean form Δ ≈ 0 with one regression
  (bow-and-arrow −0.004); 0 subjects improved. A single-view per-region accept-gate rarely lifts the
  whole-object silhouette — the E-15/E-16 ceiling persists. The cage still holds (non-improving tweaks
  roll back); it simply has little headroom here. Recorded, not dropped.
- **R0 is a normalized cross-target floor**, not a like-for-like comparison (the text→JSON build coords
  differ from the mesh; translation + uniform scale are normalized out).

## Verdict legend (rung-over-rung)

- **baseline** — the first rung — nothing to compare against (the floor every later rung is measured from)
- **improved** — this rung raised form IoU vs the previous rung
- **held** — this rung left form IoU essentially unchanged (|Δ| ≤ eps) — it bought no form
- **regressed** — this rung lowered form IoU vs the previous rung
- **unknown** — a missing IoU on one side — this rung's asset was absent or unscored

---

## E-12 handoff — "bringing it all together"

The showcase beat after the per-subject reveals: **7 subjects climbing one ladder**. Each
`march-<subject>.png` is the four rung renders side by side, left→right `R0 text→JSON → R1 glb-voxel
→ R2 +material-clean → R3 +surgical` — the *same* progression the scorecard quantifies, shown as one
image. Pair the strip with its scorecard row and the eye reads what the numbers say: the big jump is
R0→R1 (voxelization grounds the form), R1→R2 cleans the palette, R3 holds.

Per-subject march frames (7/7 stitched this run; all committed):

- `frames/march-dancing-man.png` — dancing-man climbing R0→R1→R2→R3
- `frames/march-moai.png` — moai climbing R0→R1→R2→R3
- `frames/march-pineapple.png` — pineapple climbing R0→R1→R2→R3
- `frames/march-bow-and-arrow.png` — bow-and-arrow climbing R0→R1→R2→R3
- `frames/march-heart.png` — heart climbing R0→R1→R2→R3
- `frames/march-mushroom.png` — mushroom climbing R0→R1→R2→R3
- `frames/march-koi.png` — koi climbing R0→R1→R2→R3

**Slots into the showcase** after the `pair-*` reveals (`sequence.md`) and before the rotations
(`rotations/`): the scorecard is the title card, the march strips are the evidence wall, the AVG row
is the takeaway. No new renders, no re-run judge — the honest arc, end to end.

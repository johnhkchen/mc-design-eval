# Resemblance consolidation — E-22 (T-077-01)

Terminal E-22 deliverable: the fixed render lens (T-075-01) + the resemblance gate (T-076-01) applied to
the **four headline builds** and reported honestly. The **triptych is the verdict a human inspects**
(Rule 2); the numbers explain it. Residual gaps are **named, not hidden** (Rule 7); **material** drift is
**routed to E-21, not edited here** (Rule 3 — E-22 photographs + judges only). Run mode: **live (fixed-lens render + metered judge)**.

**Verdict tally:** 3× `drifted`, 1× `different object`.

## Per-subject verdicts (the triptych is the verdict — Rule 2)

| subject | verdict | named residual gap (Rule 7) | meshIoU | conceptIoU | mat set | mat zone | routes to E-21 | triptych |
| ------- | ------- | --------------------------- | ------- | ---------- | ------- | -------- | -------------- | -------- |
| gatehouse | `drifted` | form @ upper roof and gable | 0.929 | 0.611 | 0.75 | 0.304 | no | [triptych](gatehouse-triptych.png) |
| cottage | `drifted` | material zoning @ upper-story walls below the roof | 0.929 | 0.63 | 0.667 | 0.321 | yes→E-21 | [triptych](cottage-triptych.png) |
| moai | `different object` | form @ overall body — the connected masses and horizontal rails | 0.417 | 0.281 | 0.9 | 0.86 | no | [triptych](moai-triptych.png) |
| pineapple | `drifted` | palette @ fruit body | 0.908 | 0.815 | 0.917 | 0.3 | yes→E-21 | [triptych](pineapple-triptych.png) |

> Honesty (Rule 2): `meshIoU` reads against the GLB at the exact build view — the trustworthy form
> number. `conceptIoU` + zone ΔE are depressed by the concept's *approximate* 3/4 view (camera mismatch),
> not only by real drift. The categorical judge + the human triptych are the verdict; the numbers explain.

## Gatehouse before/after — the static was the LENS, not the build (Rule 4, AC#3)

The **same** scale-64 artifact (`benchmarks/sculpture/building/scale-64/artifact.json`, ~57k blocks) rendered through the **old**
lens (point-sampled, `supersample:1`) vs the **fixed** lens (SSAA ×3, `supersample:3`). The build is
byte-identical between the two; only the lens changed.

| lens | render | high-freq energy (static proxy, lower = cleaner) |
| ---- | ------ | ----------------------------------------------- |
| old (point-sampled) | `pr/assets/gatehouse-lens-before.png` | 690.9 |
| fixed (SSAA ×3) | `pr/assets/gatehouse-lens-after.png` | 197.5 |

**HF energy −71.4%** on an unchanged artifact — the grey static was texture-minification
aliasing (the lens), not palette speckle (the build). See `[[render-aliasing-not-material-speckle]]`.

## Re-photographing — what the fixed lens changed (honest, including any worse — Rule 7)

- **gatehouse** — `drifted`; residual gap: form @ upper roof and gable. Fixed-lens form meshIoU 0.929 (trustworthy, exact view), conceptIoU 0.611 (depressed by the approximate-3/4-view concept), material set 0.75 / zone 0.304 (zone ΔE 39.27).
- **cottage** — `drifted`; residual gap: material zoning @ upper-story walls below the roof → **routed to E-21** (material drift, not fixed here). Fixed-lens form meshIoU 0.929 (trustworthy, exact view), conceptIoU 0.63 (depressed by the approximate-3/4-view concept), material set 0.667 / zone 0.321 (zone ΔE 36.43).
- **moai** — `different object`; residual gap: form @ overall body — the connected masses and horizontal rails. Fixed-lens form meshIoU 0.417 (trustworthy, exact view), conceptIoU 0.281 (depressed by the approximate-3/4-view concept), material set 0.9 / zone 0.86 (zone ΔE 14.32).
- **pineapple** — `drifted`; residual gap: palette @ fruit body → **routed to E-21** (material drift, not fixed here). Fixed-lens form meshIoU 0.908 (trustworthy, exact view), conceptIoU 0.815 (depressed by the approximate-3/4-view concept), material set 0.917 / zone 0.3 (zone ΔE 30.12).

## Material drift routed to E-21 (AC#4 — finding, not fixed here)

- **cottage**: material drift (material zoning @ upper-story walls below the roof) — route to E-21; not edited in E-22
- **pineapple**: material drift (palette @ fruit body) — route to E-21; not edited in E-22

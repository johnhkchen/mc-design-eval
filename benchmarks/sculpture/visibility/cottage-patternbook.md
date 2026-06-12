# Visibility witness — cottage (patternbook) — T-137-01

Committed gate record `benchmarks/sculpture/multi-angle/cottage-patternbook.json` re-censused through the visibility-aware arithmetic (`visibility-coverage/v1`). Contract copied verbatim; **no judge call** (not-called — T-138-01 owns the epic's judge runs).

**Precondition:** legacy 0/4 views passing → aware 4/4 — **the invisibility refusal is lifted**.

| view | legacy (empty-census-fails) | visibility-aware | excluded bands |
|---|---|---|---|
| +x+z | band1=— | pass | band1: not-visible-from-view |
| +x-z | band1=— | pass | band1: not-visible-from-view |
| -x-z | band1=— | pass | band1: not-visible-from-view |
| -x+z | band1=— | pass | band1: not-visible-from-view |

## Band visibility
- `band0`: **visible** — visible from [+x+z, +x-z, -x-z, -x+z], 1080 exposure-skin cells
- `band1`: **not-on-skin** — visible from [no view], 0 exposure-skin cells
- `roof`: **visible** — visible from [+x+z, +x-z, -x-z, -x+z], 1497 exposure-skin cells

Cross-view verdict: no hidden band.

Census fidelity: re-derivation reproduces every committed denominator; exposure basis: rederived.

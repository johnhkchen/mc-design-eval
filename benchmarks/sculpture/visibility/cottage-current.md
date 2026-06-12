# Visibility witness — cottage (current) — T-137-01

Committed gate record `benchmarks/sculpture/multi-angle/cottage-current.json` re-censused through the visibility-aware arithmetic (`visibility-coverage/v1`). Contract copied verbatim; **no judge call** (not-called — T-138-01 owns the epic's judge runs).

**Precondition:** legacy 3/4 views passing → aware 3/4 — unchanged.

| view | legacy (empty-census-fails) | visibility-aware | excluded bands |
|---|---|---|---|
| +x+z | band1=0.388 | band1=0.388 | — |
| +x-z | pass | pass | — |
| -x-z | pass | pass | — |
| -x+z | pass | pass | — |

## Band visibility
- `band0`: **visible** — visible from [+x+z, +x-z, -x-z, -x+z], 1551 exposure-skin cells
- `band1`: **visible** — visible from [+x+z, +x-z, -x-z, -x+z], 1420 exposure-skin cells
- `roof`: **visible** — visible from [+x+z, +x-z, -x-z, -x+z], 2439 exposure-skin cells

Cross-view verdict: no hidden band.

Census fidelity: re-derivation reproduces every committed denominator; exposure basis: rederived.

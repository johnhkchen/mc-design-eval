# Visibility witness — cottage (patternbook) — T-137-01

Committed gate record `benchmarks/sculpture/multi-angle/cottage-patternbook.json` re-censused through the visibility-aware arithmetic (`visibility-coverage/v1`). Contract copied verbatim; **no judge call** (not-called — T-138-01 owns the epic's judge runs).

**Precondition:** legacy 0/4 views passing → aware 0/4 — unchanged.

| view | legacy (empty-census-fails) | visibility-aware | excluded bands |
|---|---|---|---|
| +x+z | band0=0.398 | band0=0.398 | — |
| +x-z | band0=0.41 | band0=0.41 | — |
| -x-z | band0=0.451 | band0=0.451 | — |
| -x+z | band0=0.437 | band0=0.437 | — |

## Band visibility
- `band0`: **visible** — visible from [+x+z, +x-z, -x-z, -x+z], 1920 exposure-skin cells
- `band1`: **visible** — visible from [+x+z, +x-z, -x-z, -x+z], 1008 exposure-skin cells
- `roof`: **visible** — visible from [+x+z, +x-z, -x-z, -x+z], 1782 exposure-skin cells

Cross-view verdict: no hidden band.

Census fidelity: re-derivation reproduces every committed denominator; exposure basis: rederived.

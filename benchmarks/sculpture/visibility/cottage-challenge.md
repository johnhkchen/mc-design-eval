# Visibility witness — cottage (challenge) — T-137-01

Committed gate record `benchmarks/sculpture/multi-angle/cottage-challenge.json` re-censused through the visibility-aware arithmetic (`visibility-coverage/v1`). Contract copied verbatim; **no judge call** (not-called — T-138-01 owns the epic's judge runs).

**Precondition:** legacy 4/4 views passing → aware 4/4 — unchanged.

| view | legacy (empty-census-fails) | visibility-aware | excluded bands |
|---|---|---|---|
| +x+z | pass | pass | — |
| +x-z | pass | pass | — |
| -x-z | pass | pass | — |
| -x+z | pass | pass | — |

## Band visibility
- `band0`: **visible** — visible from [+x+z, +x-z, -x-z, -x+z], 392 exposure-skin cells
- `band1`: **visible** — visible from [+x+z, +x-z, -x-z, -x+z], 361 exposure-skin cells
- `roof`: **visible** — visible from [+x+z, +x-z, -x-z, -x+z], 885 exposure-skin cells

Cross-view verdict: no hidden band.

Census fidelity: re-derivation DRIFTS on 12 band-view(s) — recorded numbers replayed, drift named; exposure basis: rederived-with-drift.

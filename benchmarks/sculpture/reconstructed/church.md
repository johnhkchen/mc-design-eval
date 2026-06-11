# Reconstructed milestone — church (T-107-01, E-27 terminal)

Chain: `styled-milestone.mjs` → pipeline-failed @ settle; gate: **—**

Instrument: **untouched (no gate ran)** vs —; judge —

## Verdicts per azimuth

No per-view verdicts — settle did not converge after 4 grammar+dressing re-runs (still wants: frame 13, foreign fill 168, gating dressing 0)

## Metrics before/after

| metric | E-26 baseline | reconstructed | source |
|---|---|---|---|
| protrusions (≥4/6 faces) | 602 | 204 | benchmarks/sculpture/challenge/church/shell-artifact.json@48582f3 → styled/church/reconstructed-artifact.json |
| ragged columns | 334/1376 (24.3%) | 218/1370 (15.9%) | same |
| roof fit | — | accepted: 3 gables, pitch by {"voxel":4,"glb":1,"unknown":1}, glb rejected on 4 (divergence ≤ 1.301) | roof record |
| cage steps | — | 1 accepted / 1 rolled back | regularize record (standalone — STALE for this subject; the chain re-cuts its shell, T-106 review #4) |

## Named findings

- `chain-refused` — settle: settle did not converge after 4 grammar+dressing re-runs (still wants: frame 13, foreign fill 168, gating dressing 0)
- `after-is-last-completed-stage` — after side measured on styled/church/reconstructed-artifact.json (the chain refused downstream of it)

Sheets: before `pr/assets/frames/reconstructed-church-before.png`, after `pr/assets/frames/reconstructed-church-after.png`, gate `—`

Milestone record: `benchmarks/sculpture/styled/church.json`; shas `{}`

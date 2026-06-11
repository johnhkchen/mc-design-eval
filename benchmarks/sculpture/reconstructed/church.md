# Reconstructed milestone — church (T-107-01, E-27 terminal)

Chain: `challenge-milestone.mjs` → pipeline-failed @ skin; gate: **—**

Instrument: **untouched (no gate ran)** vs —; judge —

## Verdicts per azimuth

No per-view verdicts — coverage gate FAILED on the final skin: band0 stone=0.327 < 0.5 [census: band0={"total":2082,"byBlock":{"polished_basalt":1225,"stone":681,"black_stained_glass":100,"dark_oak_planks":76}}; band0:offslab={"total":5109,"byBlock":{"polished_basalt":3525,"stone":1270,"dark_oak_planks":5,"black_stained_glass":309}}]

## Metrics before/after

| metric | E-26 baseline | reconstructed | source |
|---|---|---|---|
| protrusions (≥4/6 faces) | 602 | 202 | benchmarks/sculpture/challenge/church/shell-artifact.json@48582f3 → challenge/church/reconstructed-artifact.json |
| ragged columns | 334/1376 (24.3%) | 193/1376 (14.0%) | same |
| roof fit | — | fallback: 3 gables, pitch by {"voxel":4,"glb":1,"unknown":1}, glb rejected on 4 (divergence ≤ 1.301) | roof record |
| cage steps | — | 1 accepted / 1 rolled back | regularize record (standalone — STALE for this subject; the chain re-cuts its shell, T-106 review #4) |

Coverage refusal (re-measured): `band0 stone=0.327 < 0.5`

## Named findings

- `roof-program-fallback` — roof program not accepted — roof seam falls back, recorded by the chain
- `chain-refused` — skin: coverage gate FAILED on the final skin: band0 stone=0.327 < 0.5 [census: band0={"total":2082,"byBlock":{"polished_basalt":1225,"stone":681,"black_stained_glass":100,"dark_oak_planks":76}}; band0:offsl
- `after-is-last-completed-stage` — after side measured on challenge/church/reconstructed-artifact.json (the chain refused downstream of it)

Sheets: before `pr/assets/frames/reconstructed-church-before.png`, after `pr/assets/frames/reconstructed-church-after.png`, gate `—`

Milestone record: `benchmarks/sculpture/challenge/church.json`; shas `{}`

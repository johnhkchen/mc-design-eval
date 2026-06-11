# T-110-01 church-unblock — Progress

## Done (all steps)

- **Step 1** (`07ceff6`): role-family coverage gate — durable-skin front-candidate + terminal gates
  and the grammar's re-asserted gate moved to `ownCoverage` + `coverageGate(metric:"own")`;
  splat-only baseline pinned to its historical `dominant` metric (comment + record note); both
  fractions in census rows and failure messages; `coverageGate.metric` recorded.
- **Step 2** (`dc75a16`): `src/view/coverage-monotone.test.mjs` — committed durable-skin records
  replayed through the own-metric gate; own ⊇ dominant gate property; church band0 witness
  (literal 0.327 fails / role-family 0.963 passes).
- **Step 3**: `src/form/component-roof.mjs` + tests — componentGableGroups (per-mass grouping,
  primary-first, named findings). Church committed record splits nave (mass-0) from tower (mass-1).
- **Step 4** (`8c6af38`): roof-program.mjs runs the swap ladder per component on the threaded
  occupancy; per-component record entries + composed top-level summary. Identity proof:
  `roof:{cottage,gatehouse} --repro` both MATCH committed shas.
- **Step 5** (`25c0387`): `zone:map -- --subject church` (unblocked by step 1) →
  `zone-map/church.json` committed: band0 cobblestone (structural wall body), roof dark_oak_planks.
- **Step 6** (`ef6d0e1`): kit-extract church row + live extraction → `kit/church.{json,raw.json,md}`
  (5 ingredients; roof = spruce_planks/spruce_stairs); `--offline` reproduces byte-identically.
- **Step 7** (`75fd30d`): registry wired (kitRecord/zoneMapRecord); `roof:church` per component —
  **nave ACCEPTED** (as-fitted-gable-ends rung; cage rolled back 2 closure-regressing rungs),
  **tower FALLBACK named** (insane gable: pyramidal cap is no ridge pair); protrusions 0→1 within
  budget; unmapped 0/16922; `--offline` + `--repro` re-assert (sha afbf40ee…).
- **Step 8a** (challenge evidence commit): `challenge:church` — **chain COMPLETE for the first
  time**; skin coverage gate PASS at the former refusal point; first verdicts recorded as measured:
  45°/135°/315° drifted (majors all `form @ roof`), 225° UNPARSED judge reply → aggregate
  **REFUSAL (unparsed:-x-z)**; kit presence **FAIL** (169/544 frame-line cells missing). Double-run
  byte-identical; `--repro` fresh-process REPRODUCES (shell 50fce80f…, final 0d5db5ac…);
  `--offline` re-asserts. Contact sheet + frames committed.
- **Step 8b** (`d685bbc`): `styled:church` — honest failure at the **settle** stage
  (non-convergence after 4 grammar+dressing re-runs: frame 14, foreign fill 170), recorded verbatim,
  nothing tuned.
- Final sweep: root suite 1389/1389, render suite 46/46.

## Deviations from plan

1. **styled:church did not reach its terminal gate** — it fails at the settle fixpoint, a stage the
   church had never exercised (first styled contact). Per Rule 6 the failure IS the recorded
   result. Both-gate verdicts for the church nevertheless exist: the challenge-label gate is
   kit-aware (T-106) and evaluated resemblance AND kit presence. The settle non-convergence is a
   named follow-up for E-28 closure (T-111-01 owns the next judged pass).
2. **The 225° resemblance verdict is an unparsed judge reply** (REFUSAL, not FAIL) — an instrument
   outcome; no re-roll per AC4.
3. **T-108-01 landed concurrent commits to roof-program.mjs / roof cores** (b27ba7e, d77b5f4,
   ca9e42b interleaved with mine) and merged cleanly with the per-component loop; its working-tree
   edits were left unstaged by my evidence commits.

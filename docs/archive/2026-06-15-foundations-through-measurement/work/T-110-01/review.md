# T-110-01 church-unblock — Review (handoff)

## What this ticket did

The church — the E-25 challenge subject — had never reached the gates, for two recorded causes:
a literal-name coverage census (band0 read `stone=0.327` where the stone-family was 91.5%) and a
whole-mass roof fit that one invocation could not satisfy across two structurally distinct roofs.
Both are fixed; **the church chain ran end-to-end for the first time and its first gate verdicts
are committed**, exactly as measured.

## Changes by file

### Code
- `benchmarks/sculpture/durable-skin.mjs` — front-candidate + terminal coverage gates moved to the
  role-family metric (`ownCoverage` + `coverageGate(metric:"own")`: the zone's dominant ∪ preserve,
  i.e. the material-map roles at the renaming seam). The splat-only baseline gate stays pinned to
  its historical `dominant` metric (frozen E-23 counterfactual; the legacy-replay precedent).
  Failure messages and records report BOTH fractions; `coverageGate.metric` + lineage note recorded.
  Registry: `SUBJECTS.church` gains `kitRecord`/`zoneMapRecord` (data only).
- `benchmarks/sculpture/placement-grammar.mjs` — the grammar's re-asserted gate (also run by the
  styled settle) gets the same metric switch; band-evidence arithmetic unchanged.
- `src/form/component-roof.mjs` (**new**, pure) — `componentGableGroups`: maps fitted gables onto
  component masses via their planes' `massId`, primary-first deterministic order, named findings
  (`gable-spans-masses`, `gable-mass-unresolved`, `component-roof-unfitted`).
- `benchmarks/sculpture/roof-program.mjs` — the existing swapRoof attempt ladder now runs **once per
  component** on the threaded occupancy; per-component outcomes in the record (`components[]`) plus
  a declared top-level composition (sums/concats; iou/closure from the last accepted state).
  Consumers (`loadReconstruction`, `roofPlanFromRecord`, renderMd) unchanged.
- `benchmarks/sculpture/kit-extract.mjs` — church row in its SUBJECTS table (registry data).

### Tests (root suite 1389/1389, render 46/46 green)
- `src/view/coverage-monotone.test.mjs` (**new**) — the E-28 Rule 1 monotone proof: committed
  durable-skin records replayed through the own-metric gate (no previously passing zone regresses);
  gate-level own ⊇ dominant property; the T-107 church band0 census as the witness.
- `src/form/component-roof.test.mjs` (**new**) — synthetic two-mass grouping + the committed church
  record (nave/tower split asserted).

### Committed records / evidence (all produced by named runs, none hand-edited)
- `zone-map/church.{json,md}` — first concept-derived church bands (band0 cobblestone, roof
  dark_oak_planks).
- `kit/church.{json,raw.json,md}` — first church kit (5 ingredients; raw model reply committed;
  `kit:extract --offline` reproduces byte-identically).
- `roof/church.{json,md}` + `roof/church/artifact.json` + before/after frames — per-component:
  **nave ACCEPTED** (as-fitted-gable-ends; the cage rolled back two closure-regressing rungs),
  **tower FALLBACK named** (insane gable — a pyramidal cap is not a ridge pair). Protrusions 0→1
  (within the ridge-end budget); unmapped 0/16922; `--offline`/`--repro` re-assert.
- `challenge/church.{json,md}` + artifacts + component plan + `multi-angle/church-challenge.{json,md}`
  + contact sheet + frames — the first complete chain: skin coverage gate **PASS** at the former
  refusal point; verdicts: 45°/135°/315° **drifted** (majors all `form @ roof` — nave ridge/edges,
  tower cap), 225° **unparsed judge reply** → aggregate **REFUSAL (unparsed:-x-z)**; kit presence
  **FAIL** (frame lines 169/544 cells missing). Double-run byte-identical; fresh-process `--repro`
  REPRODUCES (shell 50fce80f…, final 0d5db5ac…).
- `styled/church.{json,md}` — honest `pipeline-failed` at the **settle** stage (first styled
  contact): 4 grammar+dressing re-runs still want frame 14 / foreign fill 170. Recorded verbatim.

## Acceptance criteria status

1. **Census role-family identity** — DONE. Pure cores reused (T-101's `ownCoverage`/metric `own`),
   monotone proven by record replay + property test, both fractions reported, committed records
   untouched, thresholds/azimuths/judge untouched, reasoning in the record note + design.md.
2. **Per-component roof fit** — DONE. Tower and nave judged separately under the cage,
   tolerance-or-named-fallback per component; fit errors/fallbacks recorded per component;
   single-mass subjects byte-identical (`roof:{cottage,gatehouse} --repro` MATCH).
3. **Chain end-to-end** — DONE via `challenge:church` (provision → shell → cage → reconstruct →
   skin past its refusal point → both gates, reproducible, registry-only). Kit extraction executed
   for the first time (`kit:extract`). **Caveat:** the *styled* variant stops at the settle stage
   (named, see concerns).
4. **First verdicts recorded, no re-rolls** — DONE. Contact sheet + kit report committed; every
   stage outcome named in the records.
5. **No subject constants; npm test green** — DONE (church appears only as registry rows; root
   1389 + render 46 pass).

## Open concerns for the reviewer

1. **Settle non-convergence on the church (styled chain)** — new named failure mode, out of this
   ticket's ACs but blocking a styled-label verdict. The persistent `foreign fill 170` suggests the
   grammar and the dressing disagree about ~170 cells' zone vocabulary on this subject. Belongs to
   E-28 closure scoping (T-111-01) or a fresh ticket; nothing was tuned here.
2. **The 225° unparsed judge reply** — the aggregate is REFUSAL, not FAIL; a re-run would re-roll
   the instrument, which AC4 forbids in this ticket. T-111-01 (which owns verdicts) will re-judge.
3. **Kit presence FAIL names `polished_basalt` frame lines** — the value-true substitution maps the
   church frame vocabulary to basalt, and 169/544 frame-line cells are missing post-chain; likely
   the same seam as concern 1 (frame/fill disagreement). Named in the gate record.
4. **T-108-01 concurrency** — its commits (ca9e42b, d77b5f4, b27ba7e) interleaved on main and
   extended the same roof cores/runner; the merge with the per-component loop was clean, and its
   in-flight working-tree edits to `roof-program.mjs` were deliberately left unstaged by this
   ticket's commits. The committed `roof/church.json` was cut at 75fd30d, *before* b27ba7e's swap
   changes — a future `roof:church` re-run under the newer cores may produce a different (better)
   artifact; that re-run is T-109/T-111 territory.
5. **Splat-only baseline metric pin** — deliberately kept on `dominant` so the expected-REJECT
   contrast and the `--offline` invariant stay meaningful; flagged in case the reviewer prefers the
   baseline to track the live metric.

## Test coverage assessment

- Gate monotonicity: covered (record replay + property + witness).
- Grouping: covered (synthetic + committed record).
- Runner composition: no unit tests (impure wiring, project convention); covered operationally by
  the cottage/gatehouse `--repro` identity proofs and the church `--offline`/`--repro` asserts.
- Gap: no test pins the *composed* top-level swap summary shape (sums/last-accepted choices) — it
  is exercised only via the runners. Acceptable under the seam invariant; worth a test if the
  composition ever grows logic.

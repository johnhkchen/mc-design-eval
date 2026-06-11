# T-102-01 regularization-cage — Review

Handoff summary for a human reviewer. The ticket is complete: all five ACs met, evidence
committed, residuals named. Six commits: `018b5dc`, `5591220`, `d031ef8`, `8289f59`, `c9d7a98`,
plus this docs commit.

## What changed

**Created**
- `src/view/shell-regularize.mjs` (~490 lines, pure) — `protrusionCensus` / `raggedColumnRate`
  (definitions pinned by exact reproduction of the ticket's 276 / 23.9% cottage baselines),
  `protrudingStackRegion` (lifted verbatim from spray-paint.mjs), `openShell` (26-cube
  erode→dilate with size-≥minKeep restore of removed components — the computed "thin features"
  protection), `closeShell` (dilate→erode, majority-neighbor block, ADD-only),
  `exposedFaceMesh`/`voxelSilhouettes`/`silhouetteIoUs` (GL-free voxel silhouettes through the
  same `rasterizeSilhouette` camera as the GLB), and `regularizeShell` — the cage: per-azimuth
  IoU floors anchored to the input shell (tolerance 0.02), closure strict-when-closed /
  no-regress-when-open with one recorded plugClosure remediation, protect-region identity check,
  automatic recorded rollback.
- `src/view/shell-regularize.test.mjs` — 28 unit tests, synthetic shells only, no GL/fixtures.
- `benchmarks/sculpture/regularize-shell.mjs` — impure evidence runner (shell-integrity runner
  pattern: double-run byte-identity, durable record+md, `--offline`, best-effort renders,
  committed frames). Asserts baseline pins, declared targets, zero cage regressions.
- `benchmarks/sculpture/regularize/{cottage,gatehouse,church}.{json,md}` + per-subject
  `artifact.json`; `pr/assets/frames/regularize-*-{before,after}.png` (6 frames).

**Modified**
- `benchmarks/sculpture/challenge-milestone.mjs` — `runChain` rasterizes GLB refSils;
  `shellStage(base, refSils)` appends the cage after plugClosure (strict closure mode by
  construction); record/md gain the regularize block/section.
- `benchmarks/sculpture/styled-milestone.mjs` — PIPELINE_ORDER string only (inherits the stage
  through `runChain`).
- `benchmarks/sculpture/spray-paint.mjs` — local `protrudingStackRegion` replaced by the src
  import (verbatim lift; its behavior is now under unit test for the first time).
- `package.json` (3 `regularize:*` scripts), `.gitignore` (regularize PNG rule).
- Run-refreshed: `challenge/cottage.*` + `multi-angle/cottage-challenge.*` + 2 frames (the full
  live chain integration run; gate verdict remains FAIL with the known E-25 roof-form gap).

## Results

cottage 276→57 spikes (−79%), ragged 23.9→9.6%; gatehouse 132→44 (−67%), 28.1→13.8%; church
602→242 (−60%), 24.3→14.4%. Declared targets (−50% spikes, −10% rel ragged) met on all three and
asserted in-runner (a miss THROWS — honest gaps, not quiet records). Church's open step was
cage-REJECTED (closure no-regress, 225>213) and rolled back — the rollback record is in
`regularize/church.json` `trace[0]`, demonstrating the AC's "recorded — never silently kept" path
on a real subject. IoU vs GLB held at all 4 azimuths everywhere; renders show the fake-rafter
noise visibly reduced.

## Test coverage

- Pure core fully unit-tested (census hand-counts, morphology incl. ground-solid and protect,
  minKeep restore both directions, tri-soup adapter, framing-cancellation property, cage accept/
  reject paths for all three checks, plug remediation, determinism, input validation).
- Runner verified by execution ×3 subjects + `--offline` re-assert (sha, trace consistency,
  baseline pins). Chain verified by a full live cottage run reproducing the standalone numbers.
- **Gaps**: the runner itself has no unit tests (repo convention: impure runners are exercised by
  their npm commands). `closeShell`'s majority-block tie-break is tested at radius 1 only.
  Gatehouse/church chain paths not re-run (cost); they execute the identical code path cottage did.

## Open concerns for a human reviewer

1. **Mass growth from close**: cottage shell 7,693→10,020 cells (+30%), church 13,647→16,751.
   Silhouette-invisible by construction (IoU-gated) and it is what kills the spike *read* — but
   downstream stages now skin more cells. If E-27's later stages prefer leaner shells, the close
   radius/sequence is the declared knob.
2. **Stale sibling records**: gatehouse/church `challenge/` records and all `styled/` records
   predate the stage; `--repro`/`--offline` on those subjects compare against pre-T-102 shas and
   will report divergence after their next live run refreshes them. S-107 (reconstructed
   milestone) owns the re-run.
3. **The accidental full cottage chain run** (plan said `--verify`; real flag is `--repro`): one
   metered 4-view judge pass was spent; results committed as run-refreshed evidence. No tuning
   occurred in response to the FAIL verdict.
4. **Suite state**: `npm test` shows 1 failing test in `src/form/component-decompose.test.mjs` —
   that is sibling ticket T-103-01's mid-edit work (commit d0bc267 landed mid-session; files
   still being edited at review time). Nothing in this ticket touches or imports it; this
   ticket's scope (src/view glob: 298 tests) is fully green.
5. **Known limits, documented in code**: cross→cube SE rationale (module header);
   `protrudingStackRegion` treats a ≥minPlateau-wide chimney cap as the ridge (unit-tested as the
   known limit; minKeep restore covers such chimneys); closure no-regress can miss a poked hole on
   an ALREADY-OPEN input (reclassification blind spot — strict mode on the chain path is the real
   gate; silhouette floors are the backstop).
6. **Open contributes little on raw shells** (the giant-removed-component effect): the census
   reduction is mostly close's. If a future ticket wants open to bite, it likely needs the
   roof-as-program re-authoring (T-104) to land first, then open's removed set fragments.

## Suggested follow-ups (not in scope)

- T-104 roof-as-program should consume `regularize/<subj>/artifact.json` (or the chain's
  shell-artifact) — the ridge-beam fins it must re-author are exactly this ticket's named residual.
- Consider exporting the chain's derived opening regions with the shell record so downstream
  closure checks stop re-deriving them (the church 213-reachable surprise).

# T-088-01 coverage-aware-gate — Plan

Four steps, each independently verifiable and atomically committable. Verification command per step.

## Step 1 — pure cores + unit tests (commit `feat(E-24 T-088-01): dominant-coverage metric + coverage-gate precondition (pure cores)`)

1. `src/view/zone-fill.mjs`: add `dominantCoverage(hist, zones)` under `surfaceZoneHistogram`.
   - Decorates each census zone with `dominant` (bare-normalized from `zones[zone].dominant`, else
     null) and `dominantFraction` (‰-rounded `byBlock[dominant] ?? 0` / `total`; null when no dominant
     or `total === 0`). Throws on non-object `hist`.
2. `src/view/face-resemblance.mjs`: add `DEFAULT_COVERAGE_THRESHOLD = 0.5`, `coverageGate`,
   `acceptWithCoverage` per structure.md shapes.
   - `coverageGate` gated-zone list = `opts.zones ? Object.keys(opts.zones) : Object.keys(coverage)`;
     fail on missing zone / `total` falsy / `fraction == null` / `fraction < threshold`.
   - `acceptWithCoverage` short-circuits on coverage failure with nulled resemblance fields and
     `reason: "coverage"`; otherwise spreads `acceptIfCloser` + `reason` + `coverage`.
3. Tests per structure.md: ~3 in `zone-fill.test.mjs`, ~6 in `face-resemblance.test.mjs`, including the
   real-numbers fixture proof (splatOnly fractions + 0.25→0.40 → rejected; zoneFilled → accepted).

**Verify:** `npm test` → all green (991 existing + ~9 new).

## Step 2 — runner rewiring (commit `feat(E-24 T-088-01): coverage gate wired ahead of the per-face hill-climb`)

In `benchmarks/sculpture/spray-paint.mjs`, per the structure.md table:

1. Imports + `const COVERAGE_THRESHOLD = DEFAULT_COVERAGE_THRESHOLD;` near `ZONE_POLICY`.
2. Delete local `coverageRecord`; replace both call sites with `dominantCoverage(hist, ZONE_POLICY)`
   (`ZONE_POLICY` already has `{dominant}` per zone — extra keys are ignored by the metric).
3. §2b: `gateSplatOnly = coverageGate(covSplatOnly, {threshold: COVERAGE_THRESHOLD})` + console line.
4. §4: build `frontCandidate` (exists), census it, `frontGate = acceptWithCoverage({coverage:
   covFrontCandidate, threshold: COVERAGE_THRESHOLD, before, after})`. GL-blind branch:
   `frontAccepted = frontGate.before == null ? frontGate.coverage.passed : frontGate.accepted` — note
   `acceptWithCoverage` returns `before: null` on coverage short-circuit too, in which case `accepted`
   is already false and the expression still rejects (verify in step-1 unit test).
   Face record: add `coverageGate: {passed, failures}` summary + keep existing fields.
5. §5b: `gateZoneFilled = coverageGate(covFilled, {threshold: COVERAGE_THRESHOLD})`; throw
   `coverage gate FAILED on the final skin: <failures>` when `!passed`.
6. §6: `zones.coverageGate = {threshold, splatOnly, zoneFilled, note}`; `renderMd` coverage-gate
   section; `--offline` covGateOk assertion (skip-if-absent) + console wording.

**Verify:** `node --check benchmarks/sculpture/spray-paint.mjs`; `node benchmarks/sculpture/spray-paint.mjs --offline`
still exits 0 against the OLD committed record (coverageGate absent → degrades to prior checks).

## Step 3 — the proof, recorded (commit `feat(E-24 T-088-01): coverage-gate proof both ways — splat-only rejected, zone-filled passes (records)`)

1. `node benchmarks/sculpture/spray-paint.mjs` (live, GL). Expected console:
   - `coverage gate (splat-only baseline): FAIL — upper white_terracotta 0.13 < 0.5`
   - `coverage gate (zone-filled, final): PASS` (no throw)
   - front face accepted/rejected per resemblance as before (coverage passes on the based+paint build).
2. Inspect `spray-paint/cottage.json`: `zones.coverageGate.splatOnly.passed === false` with the upper
   failure listed; `zoneFilled.passed === true`; face record carries the gate.
3. `node benchmarks/sculpture/spray-paint.mjs --offline` → exits 0 on the NEW record (both verdicts
   asserted).
4. Commit the three regenerated record files + nothing else.

**Contingency:** if headless GL fails (last run succeeded, so unlikely), the deterministic path still
produces coverage + gate records (faces degrade to `gateBlind` — coverage precondition still enforced
and recorded); note it in progress.md and proceed — the AC's proof is the coverage verdict pair, which
is GL-free.

## Step 4 — RDSPI docs (commit `docs(E-24 T-088-01): RDSPI artifacts — coverage-aware gate`)

`progress.md` (running during steps 1–3) + `review.md`; commit docs.

## Testing strategy (summary)

| Layer | What | Gate |
|---|---|---|
| Unit (`npm test`) | metric math, rounding, normalization; precondition semantics (any-zone, boundary, absence-fails); precedence over the delta; real-fixture proof | must be green at every commit |
| Deterministic integration | `--offline` replay asserts reject/pass from the committed record | exit 0, step 3 |
| Live integration (on demand) | full run: §5b throw armed, AJV assert, records regenerated | step 3 run |

## Risks & watchpoints

- `mergePaints`/`applyPaint` on `frontCandidate` already exists at §4 — reuse, don't re-apply.
- Don't reorder §2b vs §4: `covFilled` is computed in §5b today; `gateZoneFilled` must run AFTER
  `painted` exists. The record assembles all gate results in §6 regardless of computation order.
- `ZONE_POLICY` passed straight into `dominantCoverage` — confirm extra keys (`preserve`, `splat`)
  are harmlessly ignored (metric reads `.dominant` only).
- Offline backward-compat: old record has no `coverageGate` → assertion must skip, not fail (tested
  in step 2 verify against the old record before regenerating).
- Keep `hollow-cottage-milestone.mjs` untouched (frozen E-23 record).

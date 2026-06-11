# T-109-01 ridge-and-silhouette-fit — Review

Self-assessment / handoff. All six RDSPI phases complete; work committed across 7 source/evidence
commits (70180f4 → 1ef793c).

## What changed

### New pure modules (all under the `src/**/*.test.mjs` glob)
- **`src/form/roof-ridge-fit.mjs`** — `ridgeFromPlanes` (the ridge constructed from the fitted
  side planes' intersection — the swap ladder's ridge-fitted hypothesis), `fitRidgeLine` (the GLB
  apex line in voxel-aligned mesh space: height / direction (slopeDeg) / length / rmse — recorded
  evidence, never applied as an absolute height), `ridgeVariant` (non-mutating gable variant,
  unfittable → named `ridge-unfitted` finding). 13 tests.
- **`src/view/plane-terminate.mjs`** — `unconsumedPlanes` / `terminatePlane` /
  `terminationSteps`: every recorded roof plane not consumed by an accepted gable is clamped to
  its OWN voxelFit plane (flat: trim + fill bounded by ceil(maxResidual), extent made
  plan-contiguous; pitched fragment: trim only), run as injectable steps through
  `regularizeShell`'s existing cage seam (no new judge code). 8 tests.
- **`src/view/silhouette-residual.mjs`** — `protrusionCandidates` (the exact population
  `chimneyColumns` blanket-protects, enumerated), `massSpill` (per-azimuth GLB-silhouette
  membership: full-build camera + full-build crop for the mass, one-voxel dilation
  ceil(grid/longest-axis) on the GLB side), `residualPass` (exempt ⇔ spill-free at every gate
  azimuth; refuted at ≥1 → removed under the cage's three checks, rollback named; every decision
  logged with per-azimuth spill px). 10 tests.

### Modified
- `src/form/form-fidelity.mjs` — `normalizeSilhouette` optional `bbox` crop override (default
  path byte-identical; +2 tests).
- `src/view/shell-regularize.mjs` — `exposedFaceMesh` optional `cells` subset with full-bounds
  framing (+2 tests); `dominantBlock`/`majorityNeighborBlock` exported for reuse.
- `src/view/roof-generate.mjs` — ridge CAP COURSES tracked (`capKeys`, `counts.cap`; the cap cell
  is the top course or the half-step slab — a declared marking, emission unchanged so the
  unmapped gate keeps proving every state). +3 tests.
- `src/view/roof-swap.mjs` — each ladder candidate gets a leading `-ridge-fit` flavor (emitted
  only when the intersection MOVES a ridge height; collapse otherwise), `pitchKey` includes
  ridge.y, attempts carry ridge values + findings. +4 tests; 1 pre-existing ladder test updated
  for the legitimately grown ladder.
- `benchmarks/sculpture/roof-program.mjs` — deterministic core runs the full top-of-build chain:
  per-component swaps (with ridge rungs) → plane terminations (accepted-gable footprints
  excluded, protrusion candidates protected) → silhouette-residual pass; `status: accepted` ⇔
  the shell changed under the cage; record gains `ridgeFit` / `terminations` / `residual`
  sections (additive on roof-program/v1) + ridge-profile renders/frames; `assertAcceptance` now
  also rejects any removal without azimuth evidence.

## Acceptance criteria — status

- **Ridge construction**: ✓ fitted (height via plane intersection arbitrated by the cage;
  direction/length/rmse via the GLB apex line, recorded), built as tracked cap courses in the
  E-27 vocabulary; unmapped 0 live (10061/9379 placements). The cottage ACCEPTED the ridge-fit
  rung (`end-fitted-voxel-pitch-ridge-fit`) — the known apex-shortfall is now a measured record
  value (Δ −1.404 / −2.113). The gatehouse intersect is invalid (named) and the as-built ridge
  honestly stands.
- **Upper-edge terminations**: ✓ 11/11 plane terminations accepted live under the cage
  (gatehouse −103 cells incl. the area-151 flat top; cottage −78/+6).
- **Silhouette-residual pass**: ✓ mechanism + evidence; see *Open concerns* for the gatehouse
  premise. Cottage chimney exempt-shown (the AC's required outcome). Removal + rollback paths
  proven in the synthetic suite (removed-with-evidence, closure rollback, protect exemption).
- **Cage-wrapped throughout**: ✓ swap rungs (existing cage), terminations (regularizeShell
  seam), residual (the cage's three checks reused; the roof-swap precedent).
- **Run on gatehouse + cottage**: ✓ `npm run roof:{gatehouse,cottage}`; before/after renders at
  45/135/225/315 + ridge-profile frames (`roof-<subj>-ridge-{before,after}.png`); fit/removal
  logs + cage outcomes in `roof/<subj>.{json,md}`; double-run byte-identical in-process,
  fresh-process `--repro` MATCHES, `--offline` OK, both subjects. No re-judging (T-111 owns it).
- **No subject constants / tests green**: ✓ only declared shared parameters (`apexGap` = the
  quantization unit; one-voxel dilation derived from geometry; fill bound = the plane's own
  recorded maxResidual). `npm test` green: validator + **1431** unit tests (was 1389; +42);
  render non-live suite 42/42.

## Test coverage assessment

Strong on the pure cores (every new function has synthetic-exact tests, including failure/
rollback paths and determinism). Gaps: (1) the runner's stage wiring is exercised live, not
under the test glob (the project's standing seam convention — pure cores tested, impure wiring
proven by `--repro`); (2) `massSpill`'s registration premise (build crop ≈ GLB crop) is tested
only in registered scenes; a candidate that alone defines the build's bbox could misregister —
conservative direction (false exemption), but untested.

## Open concerns for a human reviewer

1. **The AC's gatehouse premise is refuted by measurement.** The two surviving gatehouse
   protrusion candidates are EXEMPT-SHOWN: the GLB apex line records a flat band at y 31.5
   (length 26 slices, rmse 0) — the TRELLIS gatehouse GLB genuinely carries mass at the level of
   the recorded "protrusion" masses. What the judge called "chimney-like protrusions" was
   substantially the unfitted-plane raggedness, which the terminations removed (see the
   ridge-profile before/after — the jagged top band is gone; two tower-like corner remnants
   stay, GLB-corroborated). If T-111's re-judging still names them, the next move is a
   finer-grained membership test (per-column rather than per-mass), not a constant.
2. **Residual aggregation deviates from design.md D3** (documented in the design addendum +
   progress deviation 2): exempt ⇔ spill-free everywhere / refuted-anywhere → removal, because
   30°-elevation cameras hide near-side warts inside the roof's projected top face. Worth a
   reviewer's eye since it inverts the original quantifier.
3. **Downstream pins**: `roof/<subj>/artifact.json` shas changed (477399990e7c cottage,
   6ed2580cff4c gatehouse) — challenge/styled chains downstream of the roof stage must re-run
   before their pinned records validate; that re-run and all verdicts are T-111-01 scope.
4. **Status semantics widened**: `accepted` now means "the program changed the shell under the
   cage" (swap OR termination OR residual), superseding the swap-only rule. `--offline` logic
   unchanged; consumers reading `swap.accepted` still see the swap's own verdict.
5. Cottage wall speckle visible in the ridge-profile render is skin-stage material (E-26 zone
   territory), untouched here.

## Verification trail

Commits: 70180f4 (enablers) · 62cd578 (ridge fit core) · 563724b (cap + ladder) · 1acf1cf
(terminations) · 243123b (residual) · ade2464 (runner) · 1ef793c (live records + frames).
Suite 1431/1431; `roof:{cottage,gatehouse}` exit 0; `--repro` fresh-process MATCHES both;
`--offline` OK both; no hand-edits to any artifact or record.

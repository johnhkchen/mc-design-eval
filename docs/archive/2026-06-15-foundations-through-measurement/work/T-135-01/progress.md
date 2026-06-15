# T-135-01 progress

## Step 1 — pure metric core ✅ (b0341a7)
- `src/form/silhouette-proportion.mjs` + 12-test suite. Deviation: SP10's first expectation was
  wrong (absolute arm: 0.06 ≤ 0.15 IS within); test corrected, semantics unchanged.

## Step 2 — conformance check ✅ (a42c756)
- `proportionCheck` in `conformance.mjs`; declaration-driven activation in `runConformance`
  (appended iff `declarations.proportions` declared and not pack-listed); verdict carries
  `ratios` rows; findings carry the numbers. 13 conformance tests green;
  `workshop:offline` clean.

## Step 3 — loop rollback + prefix replay ✅ (a42c756)
- `proportionRegression` + `isRegression` extension in `loop.mjs` (rollback reason names the
  ratio); `replayLedger({throughRound})` in `replay.mjs`. SC3/SC4/L8/R4 tests. Deviation: SC3
  originally claimed within→beyond is only the lexicographic arm's catch — the proportion arm
  also fires (excess grew); assertion corrected to match.
- Committed-record sweep green: workshop replay+offline (fixture/cottage/barn/barn--saltcrag),
  patternbook:offline, measured:offline.

## Step 4 — witness ✅ (a34ad8d)
- Empirical findings folded back into Step 1's module:
  - the T-127 cottage concept does NOT background-segment (full illustrated scene, coverage
    0.967) → added the deterministic `conceptMaxCoverage` (0.5) guard in
    `deriveProportionDeclarations`; sketch fallback engages, sources recorded — the AC's
    "concept view obscures a ratio" path, proven live;
  - the cottage's widest layer is the JETTY course, not the roof eave — the silhouette eave line
    reads at y4, which measures the squat-storey defect *more* starkly (ridgeToEave 4.5) and
    matches the judge-side occlusion description; documented as intended behavior.
- `benchmarks/sculpture/proportion-witness.mjs` (generalization grep clean — no subject keys);
  npm scripts `proportion:{cottage,barn,repro}`; committed records
  `benchmarks/sculpture/proportion/{cottage,barn}.{json,md}`.
- WITNESS RESULT (cottage): all 7 rows (seed + 6 rounds) FAIL on ridgeToEave (4.5 vs 1.4145,
  Δrel 2.18) and roofShare (0.7778 vs 0.293, Δrel 1.65); aspect within tolerance; ratios constant
  across rounds (the chain only painted, never moved geometry — E-33's "eyes but no hands",
  now numeric). Barn: FAIL on ridgeToEave only (2.4444 vs 2.1, Δrel 0.164 — just past 0.15);
  aspect matches the sketch exactly (validation of the metric). `proportion:repro`
  byte-identical for both.

## Step 5 — docs + full suite ✅ (3b7e0b7)
- `packs/README.md` "Proportion conformance" section (metrics, detection rules, declaration
  shape, tolerance semantics, activation rule, witness commands).
- Deviation from plan (forced by the full suite): `formation.mjs` emitted draft packs with the
  FULL check vocabulary and two tests pinned rustic/drafts to it — pack-listing the new check
  would have broken committed-chain offline re-assert. Split `REGULARITY_CHECK_NAMES` (what
  packs/formation list) from `CONFORMANCE_CHECK_NAMES` (the validation vocabulary, +
  proportion-vs-concept); formation/style-pack tests updated. Committed drafts re-derive
  byte-identically again.
- `npm test`: 1987/1987 green (the earlier brush-door failure was the T-134 sibling's
  unregistered module; resolved on their side before the final run). Final sweep green:
  workshop replay/offline, patternbook:offline, proportion:repro, pack:validate.

## Review — review.md written; ticket complete.

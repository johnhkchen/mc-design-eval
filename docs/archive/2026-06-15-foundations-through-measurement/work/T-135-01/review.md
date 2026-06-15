# T-135-01 proportion-conformance — Review

## What shipped (4 commits: b0341a7, a42c756, a34ad8d, 3b7e0b7)

**Created**
- `src/form/silhouette-proportion.mjs` — the pure metric core: orthographic occupancy →
  elevation/plan masks (image convention, row 0 top — `extractSilhouette`-compatible);
  eave = widest-layer top (`eaveWidthFrac` 0.98), ridge = width-thresholded top
  (`ridgeMinWidthFrac` 0.25, the chimney guard); `proportionRatios` (min-eave/max-total across
  the two elevations, plan aspect, per-mass bbox restriction); `deriveProportionDeclarations`
  (concept-first with the `conceptMaxCoverage` 0.5 segmentability guard, sketch fallback,
  per-ratio `sources` recorded, throws on unmeasurable); `compareRatios` (relative tolerance
  0.15, absolute arm under `absoluteFloor` 0.05, `excess` = the comparable magnitude).
- `src/form/silhouette-proportion.test.mjs` — 12 tests on synthetic occupancies and masks.
- `benchmarks/sculpture/proportion-witness.mjs` — witness runner over committed chains
  (prefix replay; refuses a drifted chain or a concept that mismatches the ledger's sha;
  generalization grep clean); records under `benchmarks/sculpture/proportion/`.
- Committed witness records `proportion/{cottage,barn}.{json,md}`.

**Modified**
- `src/pack/conformance.mjs` — `proportionCheck` (verdict carries the `ratios` table; findings
  carry measured/target/source/Δ); `runConformance` appends it iff `declarations.proportions`
  is declared (documented exception to "exactly the pack's list" — declared, never inferred);
  `REGULARITY_CHECK_NAMES`/`CONFORMANCE_CHECK_NAMES` split.
- `src/workshop/loop.mjs` — `proportionRegression` no-regress arm inside `isRegression`
  (an out-of-tolerance ratio strictly worsening rolls back even on a findings-count tie);
  rollback reason names the ratio. Ledger rounds carry the ratios via the existing
  before/after reports — zero new plumbing, zero BAML/golden changes (numbers reach the
  critique prompt through the existing `conformance_block`).
- `src/workshop/replay.mjs` — `replayLedger({throughRound})` prefix option (default behavior
  byte-identical).
- `src/pack/formation.mjs` + `formation.test.mjs` + `style-pack.test.mjs` — formation emits
  `REGULARITY_CHECK_NAMES`; pack/draft pins updated accordingly.
- `packs/README.md` — metric definitions, declaration shape, tolerance semantics, activation
  rule, witness commands. `package.json` — `proportion:{cottage,barn,repro}`.
- Tests extended: `conformance.test.mjs` (+4), `loop.test.mjs` (SC3/SC4/L8),
  `replay.test.mjs` (R4).

## Acceptance criteria — status

1. **Pure metrics, synthetic-tested, per-mass, concept-vs-build** ✅ — per-mass rows run where
   `proportions.masses[]` names masses (sketch mass record is the source); they gate only with
   per-mass targets, otherwise informational.
2. **Wired into the per-round gate beside regularity** ✅ — declared tolerances; worsening
   rollback recorded with the ratio named; every round's ledger entry carries the ratio table;
   pure check, no judge call; isolation tests untouched and green (no new imports in the loop
   core's banned set; runner names no judge seam).
3. **Witness on the committed T-127 cottage chain** ✅ — every round FAILs on
   **ridgeToEave 4.5 vs 1.4145 (Δrel 2.18)** and **roofShare 0.7778 vs 0.293 (Δrel 1.65)**;
   ratios constant across all 6 rounds while the model's critique named the defect (the md sets
   the numbers beside each round's critique issues). The defect prose ties the low widest-layer
   line (jetty + eave overhang) to the judge-side band1-occlusion description. Barn ran as
   generalization: FAIL on ridgeToEave only (Δrel 0.164); its aspect matches the sketch exactly.
4. **No judge runs; replay byte-identical; docs; npm test green** ✅ — `proportion:repro`
   byte-identical (record + md); full committed-record sweep green (workshop replay/offline ×4
   subjects, patternbook:offline, measured:offline, pack:validate); `npm test` 1987/1987.

## Test coverage & gaps

- Covered: mask metrics (incl. extractSilhouette-shaped masks), degenerate→null fallbacks,
  tolerance arms, declaration validation, check activation matrix (declared/undeclared ×
  listed/unlisted), rollback matrix (worsen/improve/inert-on-old-ledgers), prefix replay.
- Gaps: the witness runner itself is exercised by `proportion:repro` (runner-level, like
  `measured:repro`), not the unit glob; concept-mask eave detection has no *real* segmentable
  concept fixture (the cottage concept is unsegmentable — synthetic masks cover the path).

## Open concerns (for the reviewer / downstream tickets)

1. **The jetty-as-eave reading.** The silhouette's widest layer on the cottage is the jetty
   course (y4), not the roof eave (y8), so ridgeToEave measures 4.5 where the program-side
   number is ~2.6. This is documented intended behavior (the silhouette measures what the
   glance sees) but it means the gate's number and `silhouetteRatios`' program-side diagnostic
   differ on jettied buildings — S-138 should read both rows when setting expectations.
2. **Concept-side measurement is unproven on a real concept.** Both committed concepts fail the
   segmentability guard (full illustrated scenes), so every live target is sketch-sourced. If
   future concepts come on black (the sculpture convention), `targetsFromConceptMask` engages —
   its perspective approximation is documented but not yet observed on a real subject.
3. **Tolerance 0.15 is a declared default, not calibrated.** The barn sits just outside it
   (Δrel 0.164) — a true positive per the E-33 diagnosis (T-127-era barn predates the measured
   re-seed), but reviewers should expect near-threshold subjects to flap until S-138 calibrates.
4. **S-136/S-138 handoffs:** geometry levers should read the round's ratio rows as the number to
   aim at; S-138 wires `deriveProportionDeclarations` into live seeds (this ticket deliberately
   left committed seeds and the pattern-book chain untouched — pin policy).
5. **Sibling flux:** T-136-01 is live in this tree (`src/workshop/rerecognize.mjs`, edits to
   `loop.test.mjs` L5); nothing of theirs was committed here, and the final suite ran green with
   their working-tree state present.

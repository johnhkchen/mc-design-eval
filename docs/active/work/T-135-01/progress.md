# T-135-01 progress

## Step 1 — pure metric core ✅
- `src/form/silhouette-proportion.mjs`: masks (elevation/plan, image convention row-0-top),
  eave/ridge detection (widest-layer / width-thresholded), `proportionRatios` (min-eave/max-total
  across the two elevations, plan aspect, per-mass bbox restriction),
  `deriveProportionDeclarations` (concept-first, sketch fallback, sources recorded, throws on
  unmeasurable), `assertProportionDeclarations`, `compareRatios` (relative + absolute-floor arms,
  `excess` = the comparable magnitude).
- 12 tests green (`silhouette-proportion.test.mjs`), incl. image-style masks with interior bbox
  (extractSilhouette shape), chimney-never-ridge, degenerate→null.
- Deviation from plan: SP10's first expectation was wrong (absolute arm: 0.06 ≤ 0.15 IS within);
  test corrected, semantics unchanged.
- Watchpoint for Step 4: a plinth strictly wider than the roof's eave overhang would defeat
  widest-layer eave detection (eaveH→0 → unmeasurable row). To be verified on the real cottage
  artifact at the witness step.

## Step 2 — conformance check: pending
## Step 3 — loop rollback + prefix replay: pending
## Step 4 — witness runner + records: pending
## Step 5 — docs + full suite + review: pending

# T-065-01 — Progress

## Step 1 — Routing config + selector + tests ✅ (committed)

- `src/form/form-routing.mjs`: `FORM_TYPE` (frozen subject→thin/solid map: thin = {bow-and-arrow, koi};
  the other 5 solid, incl. the deliberate heart-solid trade), `DEFAULT_FORM_TYPE = "solid"`,
  `formTypeOf`, `selectVoxelizer` (returns the actual `voxelizeGlbThin`/`voxelizeGlb` reference),
  `voxelizeRouted` convenience. PURE.
- `src/form/form-routing.test.mjs`: config split, `formTypeOf` (thin/solid/unknown/defensive),
  `selectVoxelizer` identity (AC #2), `voxelizeRouted` wiring.

**Verify:** `npm test` → **652 pass / 0 fail**.

## Step 2 — assembleRoutingReport + tests ✅ (committed)

- Added `ROUTING_SCHEMA = "form-routing/v1"`, `pickRouted(row)`, `assembleRoutingReport(spine, opts?)`
  (+ `renderRoutingMd`) to `form-routing.mjs`. Pure read of the spine: before = universal thin
  (`e18.formIoU`, `occThin`), after = routed pick (`thin ? e18 : r1`, `thin ? occThin : occBase`).
  Verdicts: `kept` (thin), `recovered` (solid the thin pass hurt), `traded` (solid thin marginally
  helped — heart), `flat`. Averages, occupancy totals + solids-dropped, tolerant of missing cells.
- `form-routing.test.mjs`: `pickRouted` (kept/recovered/traded) + `assembleRoutingReport` (averages,
  occupancy totals, verdict buckets, schema, missing-cell tolerance, non-array throw) on a synthetic
  3-subject spine.

**Verify:** `npm test` → **655 pass / 0 fail**.

## Step 3 — runner + apply ×7 over the real spine ✅ (committed)

- `benchmarks/sculpture/form-routing.mjs`: thin I/O host — reads `e18-remeasure.json`, calls
  `assembleRoutingReport`, writes `form-routing.{md,json}`. No GL/model/network.
- `package.json`: `form:routing` script.
- Ran over the real spine (scale 32, 7 subjects). **Result (matches the Research projection):**
  - **Solids recovered:** dancing-man 0.814→0.914 (+0.10), moai 0.399→0.565 (+0.166),
    pineapple 0.845→0.907 (+0.062), mushroom 0.929→0.980 (+0.051).
  - **Thin kept:** bow-and-arrow 0.526, koi 0.706 (unchanged — still thin).
  - **Traded:** heart 0.895→0.877 (−0.018 form for −2142 cells — the deliberate cleanliness trade).
  - **Average form IoU 0.731 → 0.782 (+0.051).**
  - **Occupancy 36,723 → 28,295 cells (−8,428, −23%); all of the drop is on solids.**

**Verify:** `node benchmarks/sculpture/form-routing.mjs` exits 0; `npm test` → **658 pass / 0 fail** (AC #4).

## Deviations from plan

- (none) — AC #3 was satisfiable as a pure spine read exactly as designed; no GL sweep was needed.

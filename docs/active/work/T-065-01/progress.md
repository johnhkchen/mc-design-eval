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

## Step 3 — runner + apply ×7 over the real spine ⏳

## Deviations from plan

- (none yet)

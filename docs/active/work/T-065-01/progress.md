# T-065-01 — Progress

## Step 1 — Routing config + selector + tests ✅ (committed)

- `src/form/form-routing.mjs`: `FORM_TYPE` (frozen subject→thin/solid map: thin = {bow-and-arrow, koi};
  the other 5 solid, incl. the deliberate heart-solid trade), `DEFAULT_FORM_TYPE = "solid"`,
  `formTypeOf`, `selectVoxelizer` (returns the actual `voxelizeGlbThin`/`voxelizeGlb` reference),
  `voxelizeRouted` convenience. PURE.
- `src/form/form-routing.test.mjs`: config split, `formTypeOf` (thin/solid/unknown/defensive),
  `selectVoxelizer` identity (AC #2), `voxelizeRouted` wiring.

**Verify:** `npm test` → **652 pass / 0 fail**.

## Step 2 — assembleRoutingReport + tests ⏳

## Step 3 — runner + apply ×7 over the real spine ⏳

## Deviations from plan

- (none yet)

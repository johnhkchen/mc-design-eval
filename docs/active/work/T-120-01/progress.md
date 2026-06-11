# T-120-01 progress — registration-hardening

All five plan steps executed in order; `npm test` green (1601/1601) at every commit.

## Commits

1. **8f1709e** — `speckVerdict` + `GLB_SMOKE_SPECK_FRACTION = 0.02` in
   `src/form/voxel-components.mjs`; 7 unit tests (barn shape, moai shape, exact boundary
   pair, many-tiny-specks sweep shape, single mass, empty, custom budget). Suite 1581→1588.
2. **2c5c5ef** — `src/form/registration-smoke.mjs` pure core (`proxyGeometry` 3-rung
   upperTop ladder; `registrationSmoke` = real lens over proxy geometry + kit dry-run via an
   ephemeral zone-record) + 13 tests, including both AC fixtures at unit level: the
   barn-shaped flipped-field witness PASSES with `fieldResolution` engaged; a synthetic
   lens-unreadable concept REFUSES `no-field-cells` verbatim. Suite →1601.
3. **eae0f9c** — the impure wave: `benchmarks/sculpture/registration-smoke.mjs` runner
   (`npm run registration:smoke`, guarded sibling-record writes, exit 0/1/2);
   `glb-smoke.mjs` gate swap to `speckVerdict` (+`--record` guarded fixture writes; raw
   conn26/conn6 evidence unchanged); `trellis-glb.mjs` CLI sibling-record gate before the
   POST; both runners added to the pin-guard conformance PIN_WRITERS list; package.json
   script. Verified the church GLB reproduces its README numbers exactly (1 component,
   0.9552 6-conn) under the new gate.
4. **c8aed30** — regression fixtures, all zero-model-spend local re-runs:
   - `runs/017-…/registration-smoke.{json,md}` — the barn concept PASSES the smoke
     (eave via **anchor** row 29, band0 cobblestone share 1.0 with
     `fieldResolution {oak_planks→cobblestone, stone_bricks→cobblestone}`, roof
     dark_oak_planks, kit dry-run ok) — former deviation 1 closed as a fixture.
   - `glb/smoke/barn@48.json` PASS (3579 cells, 2 components, one 1-cell speck, fraction
     0.000279) — former deviation 2 closed; `glb/smoke/moai@48.json` FAIL (3 components,
     largestFraction 0.5213, **2 oversize**) — the control holds; `glb/smoke/church@48.json`
     PASS clean — the baseline.
   - Includes one fix found by running: `glb-smoke.mjs` now mkdirs the record directory
     before `guardedWriteRecord` (ENOENT on the first-ever record).
5. **1903e66** — `docs/knowledge/registration-runbook.md` (the one place: 8-step ordered
   flow, checklist items 1–7 + new item 8, gate semantics, refusal licenses, immutability
   boundary, the material-map-before-TRELLIS reorder); provision-concept "next:" hint;
   glb/README.md gate paragraph updated to speck semantics with fixture pointers.

## Verifications beyond the suite

- **Pre-spend ordering probe** (plan 4.5, not committed): scratch dir with a `pass:false`
  record + PNG, `MODAL_ENDPOINT_URL` unset → `trellis-glb.mjs` refuses on the record with
  the named reason BEFORE any endpoint/env consultation (exit 1); flipping the record to
  `pass:true` proceeds to the spend attempt. The gate sits strictly before the spend.
- Barn smoke record cross-checked against the committed `zone-map/barn.json`: same band
  dominant/role, same roof dominant, same fieldResolution pairs — the proxy lens read agrees
  with the post-build derivation (readability claim validated against ground truth).
- Moai's failing `--record` run still writes its record before exiting 1 (a recorded FAIL is
  the control fixture).

## Deviations from the plan

1. **glb-smoke ENOENT mkdir** (step 4): the plan assumed `guardedWriteRecord` could write
   into a new directory; it cannot. One-line `mkdir recursive` added in commit c8aed30
   (folded there rather than amending eae0f9c — found by the fixture run itself).
2. **None otherwise** — every step landed as planned; the step-4 risk ("barn smoke might
   not pass if the proxy upperTop lands badly") did not materialize: the real barn concept
   has a narrow eave plateau and took rung 1 (anchor), not the roof-run fallback.

## Acceptance criteria — status

- **AC1 pre-spend lens smoke**: ✅ runner + trellis sibling-gate + checklist item 8; barn
  concept passes post-T-117 (committed record); synthetic lens-unreadable concept refused
  with zero spend (unit fixture; the core is structurally I/O-free).
- **AC2 sub-speck tolerance**: ✅ pure `speckVerdict`, declared 0.02 budget, strict above;
  barn GLB passes without a deviation (committed record); moai still fails (committed
  control record).
- **AC3 fixtures + runbook**: ✅ both former deviations re-run and recorded;
  `registration-runbook.md` documents checklist → smoke → TRELLIS → glb-smoke → registry in
  one place.
- **AC4 no relaxation / no subject constants / tests green**: ✅ zone-map, kit-extract,
  durable-skin, generated-milestone untouched; one new generic exported constant; `npm test`
  1601/1601.

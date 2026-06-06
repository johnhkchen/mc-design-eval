# T-065-01 — Review: per-subject thin routing

Handoff for a human reviewer. Wires the named-but-unimplemented form-type routing rule (E-19, T-061
review concern #4): thin-feature voxelization runs only on thin subjects; solids use plain voxelize —
stopping the over-thickening that regressed solid form IoU and ~doubled their occupancy.

## Acceptance criteria — status

1. **Per-subject routing tag + a selector picking `voxelizeGlbThin` for thin / `voxelizeGlb` for
   solid/bulky. No new algorithm.** ✅ `src/form/form-routing.mjs`: `FORM_TYPE` (subject-keyed config) +
   `selectVoxelizer` (returns the actual existing voxelizer) + `voxelizeRouted`. thin =
   {bow-and-arrow, koi}; solid = {dancing-man, moai, pineapple, mushroom, heart}.
2. **Unit-tested: selector returns the thin voxelizer for a thin subject, the plain one for a solid.**
   ✅ `form-routing.test.mjs` asserts `selectVoxelizer("bow-and-arrow") === voxelizeGlbThin`,
   `selectVoxelizer("moai") === voxelizeGlb`, etc. (identity).
3. **Applied ×7: form IoU + occupancy before (universal thin) / after (routed) — solids recover, thin
   keeps its gain, occupancy drops on solids.** ✅ `assembleRoutingReport` + the runner produced
   `benchmarks/sculpture/form-routing.{md,json}` from the E-18 spine:
   - dancing-man 0.814→0.914, moai 0.399→0.565, pineapple 0.845→0.907, mushroom 0.929→0.980 (recover);
   - bow-and-arrow 0.526 / koi 0.706 (kept); heart 0.895→0.877 (the one deliberate trade).
   - avg form IoU 0.731→0.782 (+0.051); occupancy 36,723→28,295 cells (−8,428, −23%, all on solids).
4. **`npm test` green.** ✅ 658 pass / 0 fail.

## Files changed

**Created**
- `src/form/form-routing.mjs` — PURE: `FORM_TYPE`, `DEFAULT_FORM_TYPE`, `formTypeOf`, `selectVoxelizer`,
  `voxelizeRouted`; `ROUTING_SCHEMA`, `pickRouted`, `assembleRoutingReport` (+ `renderRoutingMd`).
- `src/form/form-routing.test.mjs` — config split, `formTypeOf`, selector identity (AC #2),
  `pickRouted` (kept/recovered/traded), `assembleRoutingReport` (averages, occupancy totals, verdict
  buckets, missing-cell tolerance, non-array throw).
- `benchmarks/sculpture/form-routing.mjs` — thin I/O host runner (no GL/model/network).
- `benchmarks/sculpture/form-routing.{md,json}` — the applied-×7 report (generated artifact).
- `docs/active/work/T-065-01/{research,design,structure,plan,progress,review}.md`.

**Modified**
- `package.json` — `form:routing` script.

**Not modified (deliberately):** every runner's duplicated `SUBJECTS` list, `voxelizeGlb`,
`voxelizeGlbThin`, and the `e18-remeasure.json` spine (read-only). Routing is additive — it only
*chooses* between two existing, already-tested voxelizers and *reads* an already-collected spine.

## Test coverage

- **Strong / deterministic:** the entire `form-routing.mjs` surface. The selector identity test is the
  literal AC #2. `assembleRoutingReport` is exercised on a synthetic 3-subject spine covering all three
  solid outcomes (recovered / traded / flat-on-missing-cell) plus a thin kept.
- **Data check (deterministic):** the runner over the real spine reproduces the Research-projected
  numbers exactly — this is the "applied ×7" evidence, and it is reproducible with no GL.
- **No integration/GL/metering:** by design (AC #3 is a pure read). Nothing new renders or bills.
- **Gaps:** `voxelizeRouted`'s end-to-end dispatch isn't tested against a real GLB (the voxelizers are
  tested elsewhere; here we assert the selection wiring). The runner (`benchmarks/.../form-routing.mjs`)
  is outside the `src/**` test glob (consistent with the other report runners).

## Open concerns / notes for downstream

- **Heart is tagged solid despite a +0.018 thin gain** — a deliberate trade (a bulky organ; routing it
  solid drops 2,142 cells / 27% with a negligible form cost). The report labels it `traded`, not
  `recovered`, so the trade is visible. If a future measurement shows heart's thin gain growing, revisit
  the tag — it is a one-line change in `FORM_TYPE`.
- **Duplicated `SUBJECTS` lists remain.** The routing config is the single source of truth, but the ~6
  runners still each declare their own `SUBJECTS`. A future cleanup ticket could have them consume
  `formTypeOf` (and add the GLB-voxel build/breadth runners a routed path). Out of scope here (broad,
  reproducibility-sensitive change).
- **Wiring into the live build path (S-066).** This ticket delivers the config + selector + the
  before/after evidence. Actually routing the production glb-voxel build (`glb-voxel-build.mjs` /
  `glb-voxel-breadth.mjs`) to call `voxelizeRouted` is the natural next step (the DAG's S-066) — the
  selector is ready for it.
- **Scale independence.** `FORM_TYPE` carries no scale; the tag is a property of the subject's form. The
  report is at the spine's scale (32); routing applies at any scale.

## Risk assessment

Low. Pure, additive, fully unit-tested; no frozen runner or voxelizer touched; the AC #3 evidence is a
deterministic read of an existing record (cannot drift). `npm test` green at 658.

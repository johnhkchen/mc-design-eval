# T-118-01 roof-form-seam — Research

Descriptive map of what exists. No solutions proposed. Verified against the working tree at
commit `3d5fd7a` (E-30 planning), 2026-06-11.

## 1. The ticket's named facts, verified in the records

- **Cottage** (`benchmarks/sculpture/roof/cottage.json`): two gables. End fits accepted at
  `faceRmse` **1.541** (gable-roof-0-roof-4:lo), **1.116** (:hi), **1.038**
  (gable-roof-2-roof-3:hi). The "refused `cross-lo`" is the cross gable's lo end —
  `end-unfitted` @ `gable-roof-2-roof-3:-x`: "anchor window empty (wall anchor -13 outside the
  footprint end -1 — a buried interior end)". Swap accepted rung
  `mass-0:end-fitted-voxel-pitch-ridge-fit`. RidgeFit: both intersects **valid** but sit 1.4–2.1
  cells *below* the record ridge (recordY 24→22.596, 21→18.887), while the GLB apexLine measures
  **26.484 / 26.5** — well above both (evidence only; aabb vertical absolutes unreliable).
- **Gatehouse** (`roof/gatehouse.json`): `end-hip` ×2 (both ends of gable-roof-0-roof-4 demand
  hips) and `end-fit-insane` (`roof end -12.814 inside the gable face -12.253`, variant
  gable-ends). RidgeFit intersect **invalid**: "intersection y 26.397 not above the eaves (26.5)";
  GLB apexLine 31.5 (slopeDeg 0, rmse 0, span 26) vs recordY 28. Swap accepted
  `mass-0:end-fitted-voxel-pitch-gable-ends`.
- **Church** (`roof/church.json`): has `hipFit`; status accepted; the tower pyramid was honestly
  refuted (flat top) — note at line 1530: apex CONSTRUCTED and sanity-bounded by the as-built top.
- **Gatehouse 315° regression**: E-27 same-object → "drifted" at T-111. The verdicts live in
  `benchmarks/sculpture/multi-angle/*.json` and are echoed in `reconstructed/gatehouse.json`
  (`verdicts.views[]`) and `generated/gatehouse.json` (`gate.perView[]`); gaps name
  "roof / top of the building" massing/form major.
- **Barn**: T-117 has **not landed** (`docs/active/tickets/T-117-01.md` frontmatter still
  `status: open / phase: research`, no `docs/active/work/T-117-01/`). Registry entries
  `zoneMapRecord: null`, `kitRecord: null` (durable-skin.mjs ~line 223). Per AC, barn is
  **named-skipped** in this ticket. `benchmarks/sculpture/glb/barn.glb` exists, so a GLB-side
  reference is technically renderable, but there is no committed barn build artifact on either path.

## 2. Roof fitting machinery (the rungs under refinement)

Pure cores in `src/form/`, generation + cage in `src/view/`, impure runner in
`benchmarks/sculpture/roof-program.mjs` (record schema `roof-program/v1`).

- `src/form/roof-fit.mjs` — `gablesFromRecord()` pairs reciprocal pitched planes into parametric
  gables: `{id, ridge:{axis,y}, sides:[{planeId, eaveDir, pitch, pitchSource, eaveY, eaveEdge,
  overhang, run}], footprint:{cols:Set"x,z", bbox}, hip:{lo,hi,demanded}, sane, reasons}`.
  `gableSurfaceHeight(gable,x,z)` is the SINGLE surface definition shared by generator and error
  measure; `programFitError()` gives per-side rmse.
- `src/form/roof-end-fit.mjs` — `fitGableEnds(gables, occ, mesh, alignment)`; per end: as-built
  wall anchor (median outermost column), GLB face/wall clusters inside the anchor window, fitted
  verge tip; sanity gates emit `end-hip` / `end-unfitted` / `end-fit-insane` (Rule 2: as-built end
  stays). `alignedTriangles(mesh, alignment)` transforms GLB tris into voxel space.
- `src/form/roof-ridge-fit.mjs` — `ridgeFromPlanes(gable)` (intersection of the two fitted side
  lines; sanity: v within eave window, y above eaves), `fitRidgeLine()` (GLB apex line — recorded
  as EVIDENCE only, never applied as an absolute height), `ridgeVariant()` (the `-ridge-fit` rung).
- `src/form/roof-hip-fit.mjs` — `fitHipEnds()` (per-end GLB-fitted hip pitches → `hip-end-fitted`
  rung), `fitHipCap()` (pyramid cap → `hip-cap` rung).
- `src/view/roof-generate.mjs` — `generateRoof(gables, family)`: heightfield = max of
  `gableSurfaceHeight` per column, trimmed at fitted verge tips; emits stairs/slabs/solids; exports
  `sheetKeys` (overhang strips) and `capKeys` (ridge cap course) for census exclusion.
- `src/view/roof-swap.mjs` — `swapRoof(occ, {gables, endFit, hipFit, family, refSils, regions,
  protect, chimney})`: the **cage-arbitrated attempt ladder** (T-104). Rung order: end-fitted
  variants → `-ridge-fit` flavors → E-27 core rungs (as-fitted / voxel-pitch / gable-ends) →
  hip fallbacks. `judgeVariant()` gates each rung: per-azimuth silhouette IoU vs `refSils`
  (no-regress, tolerance 0.02), 6-dir closure no-regress, protected regions byte-identical,
  per-gable program rmse ≤ 0.75. Refusal ⇒ next rung; all refused ⇒ named fallback (Rule 1:
  fallback is a CORRECT outcome).
- Generated path twin: `src/form/provision-fit.mjs` (`fitProvision()`; findings staged
  `roof-fit | roof-end-fit | hip-cap-fit | ...`) + `provision-generate.mjs`, run by
  `benchmarks/sculpture/generated-milestone.mjs`.

## 3. Gate records, paths, artifacts on disk

- **Two paths per subject**: T-115 generated (`benchmarks/sculpture/generated/<s>.json`, schema
  `generated-milestone/v1`) and T-111 reconstructed (`reconstructed/<s>.json`); both embed
  per-azimuth verdicts and point at gate records `benchmarks/sculpture/multi-angle/<s>-<label>.json`.
- **Build voxel artifacts on disk**: generated path — `generated/<s>/artifact.json` (final) and
  `base-artifact.json`, `provision-fit.json`, `component-plan.json`. Reconstructed/styled path —
  `challenge/<s>/artifact.json` + `shell-artifact.json`; the reconstructed record's chain points at
  `styled/<s>.json`. Cottage/gatehouse/church present on both paths; barn on neither.
- **The 4 gate azimuths** (`src/config.mjs:50` `MULTI_ANGLE_GATE`): `["+x+z","+x-z","-x-z","-x+z"]`
  = 45°/135°/225°/315°, elevation 30° (`src/view/multi-angle.mjs` `resolveAngle()`); render
  contract 512×512. `gapBudget: 2`.
- **Commit conventions**: gate-record JSONs and contact sheets (`pr/assets/frames/*.png`) are
  committed; per-view PNGs under `multi-angle/<run>/` are **gitignored**
  (`.gitignore` ~line 180: `benchmarks/sculpture/multi-angle/**/*.png`, fixtures excepted). The AC's
  "renders committed" therefore implies contact-sheet-style PNGs under `pr/assets/frames/` or a new
  committed location, not loose per-view files under multi-angle/.

## 4. Metric & geometry infrastructure (the building blocks)

- `src/form/glb-silhouette.mjs` — `loadMeshFromGlb(bytes)` → `{positions, indices, bounds,
  triCount}`; `rasterizeSilhouette(mesh, {view, region})` → mask `{w,h,data:Uint8Array,fgCount,
  bbox}` (pure rasterizer, no GL; winding-agnostic; optional 3-D AABB `region` clips the mask to
  the projected corner rect). Camera via `framedCamera` — frames each object by its own bounds, so
  build/GLB silhouettes are comparable after normalization.
- `src/view/shell-regularize.mjs` — `exposedFaceMesh(occ, {cells?})` (voxel→tri mesh, **subset via
  `cells`** — a roof-only mesh is directly expressible), `voxelSilhouettes(occ, azimuths)`,
  `silhouetteIoUs(occ, refSils, {grid})` (normalize both to a common grid, IoU per azimuth).
- `src/form/form-fidelity.mjs` — `extractSilhouette`, `normalizeSilhouette` (G×G, `fit:"aspect"`),
  `iou(a,b)`, `regionIoU(a,b,{x0,y0,x1,y1})` (normalized-fraction screen rects).
- Roof region knowledge already recorded: gable `footprint.cols`, per-side `eaveDir/eaveEdge/eaveY`,
  `ridge` cells, `ends.{lo,hi}.{coord,faceCoord}` (verge tips), `sheetKeys`/`capKeys` from
  `generateRoof`, `owner` map (gableId/downhill/sheet/cap per column). Component records
  (`component/<s>.json`, schema `component-record/v1`) hold `roofPlanes[]` with ridge/eave cells.
  `heightfield(occ)` (`component-decompose.mjs:125`) gives per-column tops.
- **No existing artifact** decomposes silhouette mismatch by roof region (gable ends / ridge /
  slopes / eaves) or measures height-profile error along ridge/rakes — the ticket's gap is real;
  the blocks exist, the composition does not.
- Alignment between GLB and voxel space: `aabbAlignment(meshTris.bounds, occ.bounds)`
  (`component-glb-fit.mjs`), used differentially only — repo doctrine (memory + record notes):
  vertical absolutes under aabb-affine are unreliable; positions anchor to voxel truth.

## 5. Constraints & conventions binding this ticket

- **E-30 Rule 2 (analysis before construction)**: no new rungs until the diff artifact names what
  reads wrong; refits must cite the findings. **No judge runs** — S-121 owns verdicts; the
  instrument is render-side only (pure rasterizer / GL renders, no `claude -p`, no judge-reply).
- **Purity split**: pure metric cores live in `src/form/` or `src/view/` with `*.test.mjs`
  (Node built-in test runner; `npm run test:unit` globs `src/**/*.test.mjs`, currently 1514 tests
  ~2.2 s); impure runners (fs, GL, argv) live in `benchmarks/sculpture/*.mjs` and are not unit-run.
  `npm test` = test:unit + two `validate-artifact` self-checks.
- **No subject-specific constants** (E-25 Rule 3): subjects iterate from the `SUBJECTS` registry
  (`durable-skin.mjs:96+`); thresholds declared once in a params block shared across subjects
  (roof-program records carry `params.note: "...no tuning...azimuths config-frozen"`); precedent for
  enforcement is the T-113 conformance test (`material-vocabulary.conformance.test.mjs`).
- **`--repro` byte-identity**: milestone runners (`roof-program.mjs:383`, `generated-milestone.mjs:429`,
  `styled-milestone.mjs:301`, ...) re-run the deterministic core in a fresh process and compare
  sha256 of artifacts. Single-mass legacy subjects (moai/koi/heart/pineapple — sculpture-mode, not
  in SUBJECTS) must stay byte-identical wherever no refit applies. Any refit that changes
  cottage/gatehouse records must re-record their shas through the same runners; legacy subjects'
  paths must be untouched.
- **Determinism in metrics**: no RNG/timestamps in records; floats rounded before JSON (existing
  records use 3-decimal rounding); pngjs is the PNG library (`pngjs` in package.json); node-canvas
  is used for contact-sheet caption bars (multi-angle-gate.mjs:127–147).
- **Tolerance-or-named-fallback unchanged**: refits add/repair rungs or fix fit inputs; they must
  not relax `programRmseTol` (0.75), IoU tolerance (0.02), or sanity gates.

## 6. Open questions carried to Design

1. Where the diff instrument's records live ("beside the gate records"): a new committed dir (e.g.
   `benchmarks/sculpture/roof-diff/`) vs extending `multi-angle/` — and which PNGs get committed
   given the gitignore carve-outs.
2. Region decomposition source: gable parametrics (footprint/ridge/ends/eaves from the roof record)
   exist for the reconstructed path; the generated path's provision-fit roofs have the same gable
   shape — but flat-cap/fallback roofs (church tower) need a degenerate-region story.
3. Screen-space vs voxel-space decomposition: `regionIoU` works on screen rects;
   `rasterizeSilhouette` accepts mesh-space AABB regions; `exposedFaceMesh(occ,{cells})` gives
   exact per-region build silhouettes. GLB-side per-region masks need the inverse mapping
   (voxel region → mesh AABB via `mapVoxelRegionToMesh`, form-target.mjs:94).
4. Whether the gatehouse ridge refit can be justified from existing evidence (apexLine 31.5,
   rmse 0, span 26 — strong) given the doctrine that aabb vertical absolutes are never applied —
   the diff instrument itself may supply the missing voxel-anchored evidence (height-profile error
   along the ridge).
5. Barn named-skip mechanics: the instrument must record `skipped: "T-117 not landed"` (or similar)
   rather than silently omitting the subject.

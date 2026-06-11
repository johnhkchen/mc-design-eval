# T-109-01 ridge-and-silhouette-fit — Structure

File-level blueprint. Pure cores in `src/form` / `src/view` (test-glob covered), impure wiring in
the runner only — the seam invariant of the roof program holds throughout.

## New files

### `src/form/roof-ridge-fit.mjs` (pure)
The ridge fit, mirroring `roof-end-fit.mjs`'s layout (schema tag, frozen defaults, fit fns).

- `export const RIDGE_FIT_SCHEMA = "roof-ridge-fit/v1"`
- `export const RIDGE_FIT_DEFAULTS = Object.freeze({ apexGap: 1.0 })` — slice-cluster gap = the
  voxel quantization unit (the `clustersAlong` precedent); nothing else is parameterizable.
- `export function ridgeFromPlanes(gable)` → `{y, v, valid, reasons}` — intersection of the two
  fitted side surfaces (`eaveY + pitch·dist`, the `evalSideHeight` arithmetic inverted); reasons
  named when sides lack pitch/eave or the intersection falls outside the run window / below
  `max(eaveY) + 0.5`.
- `export function fitRidgeLine(gable, tris, opts)` → `{height, slopeDeg, span:[lo,hi], length,
  rmse, slices} | {reason, detail}` — aligned-triangle vertices binned per ridge-axis cell inside
  the footprint window at y ≥ bandFloor (bandFloor derived as in end-fit); apex per bin; the ridge
  cluster = maximal contiguous bins with apex ≥ maxApex − apexGap containing the argmax; height =
  mean, slope = least-squares over the cluster (direction evidence), rmse about the mean. EVIDENCE
  ONLY — never applied as an absolute height (design D1).
- `export function ridgeVariant(gables)` → `{gables, findings}` — sane gables get
  `ridge: {...ridge, y: roundHalf(y*), source: "intersect"}` + `ridgeIntersect: {y, v,
  deltaVsRecord}` when `ridgeFromPlanes` is valid; invalid → gable unchanged +
  `ridge-unfitted` finding. Non-mutating (`pitchVariant` contract).

### `src/view/plane-terminate.mjs` (pure)
Upper-edge terminations for recorded planes the gable program left to the blob.

- `export function unconsumedPlanes(record, consumedPlaneIds)` → `[{plane, kind}]` — roofPlanes
  whose id ∉ consumed (the accepted gables' sides), flat first then by descending area
  (deterministic order).
- `export function terminatePlane(occ, plane, {protect = []})` → `{occ, removed, added,
  target:{planeId, kind, meanY}}` — flat: trim solid cells above
  `roundHalf(planeHeightAt(voxelFit,x,z))` per extent column, then fill the top course to
  contiguity over the fill-between'd extent (majority-6-neighbor block, the `closeShell` rule);
  pitched fragment: trim only. Protected cells untouched; fixtures untouched (dressing, not mass).
- `export function terminationSteps(planes, {protect})` → `steps` array for
  `regularizeShell(occ, {refSils, regions, protect, steps})` — one
  `{op: "terminate:" + plane.id, fn}` per plane. The cage (IoU floors anchored to the pass input,
  closure no-regress, protect, rollback, trace) is regularizeShell's existing seam — no judge code
  here.

### `src/view/silhouette-residual.mjs` (pure)
GLB-silhouette membership + caged removal of unsupported protrusions.

- `export const RESIDUAL_SCHEMA = "silhouette-residual/v1"`
- `export function protrusionCandidates(occ, record)` → `[{id, cells:Set<string>, columns,
  size}]` — 26-components (`componentLabels`) of: record protrusion-mass cells (plan runs ×
  y ≥ yRange[0], degenerate ranges guarded) ∪ `protrudingStackRegion(occ)` cells. Ordered by
  (size desc, min key) — deterministic ids `res-0…`.
- `export function massSpill(occ, cells, refSils, {grid})` → `{perAzimuth:{[a]:{massPx, spillPx,
  spillFrac}}, shownAt:string[]}` — mass mask via `exposedFaceMesh(occ, {cells})` (bounds = full
  occupancy → same camera as `voxelSilhouettes`); mass and full-voxel masks normalized with the
  FULL mask's bbox (`normalizeSilhouette` bbox override); GLB mask normalized as in
  `silhouetteIoUs`, then dilated by `ceil(grid / longSideCells)` px (one voxel — geometry-derived);
  spill = mass-fg ∉ dilated GLB-fg. shown ⇔ spillPx === 0.
- `export function residualPass(occ, {record, refSils, regions = [], protect = [], grid})` →
  `{occ, log, removedCells}` — for each candidate (order above): exempt when `shownAt.length > 0`
  or it intersects a caller protect region (both logged with evidence); else remove its cells and
  judge with the cage's checks reused directly (`silhouetteIoUs` ≥ pass-input per azimuth − 0
  (removal must not regress; tolerance not consumed — removals should only help), `closureCheck`
  no-regress, `protectViolations`); reject → rollback. Log entries:
  `{id, cells, perAzimuth, shownAt, exempt|removed|rolledBack, reasons}`.

### Tests (new)
- `src/form/roof-ridge-fit.test.mjs` — synthetic gable (known planes → known intersection);
  insane gates (intersection below eave, outside run); `ridgeVariant` non-mutation + findings;
  `fitRidgeLine` on a synthetic tent mesh (height/length/slope/rmse exact).
- `src/view/plane-terminate.test.mjs` — synthetic flat blob with bumps + notched edge → trimmed,
  top course contiguous, fixture passthrough, protect honored; pitched fragment trim-only;
  cage rollback via `regularizeShell` steps (a termination that tanks IoU rolls back, trace says
  so).
- `src/view/silhouette-residual.test.mjs` — synthetic occupancy (box + chimney + lump) vs a
  synthetic GLB-style mesh (box + chimney only): chimney `shownAt` = all 4 → exempt; lump shown
  nowhere → removed, log carries per-azimuth spill; closure/protect rollback path; determinism
  (two runs byte-equal log).

## Modified files

- **`src/form/form-fidelity.mjs`** — `normalizeSilhouette(mask, opts)` gains optional `opts.bbox`
  (crop window override; default = mask.bbox, behavior unchanged). +test in
  `form-fidelity.test.mjs`.
- **`src/view/shell-regularize.mjs`** — `exposedFaceMesh(occ, {cells} = {})` optional subset
  filter: faces computed relative to the subset; bounds stay the FULL occupancy's (the camera
  contract). Default path byte-identical. +test.
- **`src/view/roof-generate.mjs`** — `generateRoof` tracks `capKeys` (columns whose surface equals
  the owning gable's `ridge.y`; the cap cell = the top course full block or the half-step slab)
  and `counts.cap` (cells also counted in full/slabs as today — cap is a *marking*, not a new
  shape; no census semantics change). +tests.
- **`src/view/roof-swap.mjs`** —
  - `pitchKey` includes each gable's `ridge.y` (a ridge-fitted shape is a distinct rung).
  - `swapRoof` ladder: for each existing candidate, a `${name}-ridge-fit` flavor
    (`ridgeVariant` applied) is tried FIRST, then the plain candidate — the as-built-ridge rungs
    remain the honest tail; dedup unchanged. Attempt entries carry `ridge` findings +
    per-gable `ridge.y`/source.
  - `judgeVariant` returns `capKeys`-derived count in `generated` (record visibility only).
  +tests (rung order, dedup when intersection equals recorded ridge, findings surfaced).
- **`benchmarks/sculpture/roof-program.mjs`** — stage wiring (deterministic core):
  1. existing: fit → endFit → per-component swap ladder (now with ridge rungs via roof-swap).
  2. ridge fit evidence: `fitRidgeLine` per sane gable on the shared `alignedTriangles` set;
     recorded beside each gable (`ridgeFit` section: mesh evidence + `ridgeFromPlanes` values +
     deltas).
  3. terminations: `unconsumedPlanes(record, acceptedPlaneIds)` → `regularizeShell(occCur,
     {refSils, regions, protect: protects ∪ residual-candidate cells, steps})`; trace →
     `terminations` section.
  4. residual: `residualPass(occCur, {record, refSils, regions, protect: openings})`; log →
     `residual` section.
  5. artifact = `rebuildArtifact` when the final occupancy differs from the input and all gates
     hold; `status` rule: "accepted" ⇔ artifact written (supersets today's swap-only rule;
     `--offline` logic unchanged).
  6. renders: existing 4 azimuths + a generic ridge-profile ortho frame (the named ortho angle
     perpendicular to the largest accepted gable's ridge axis) →
     `pr/assets/frames/roof-<subj>-ridge-{before,after}.png`.
  7. record: additive sections under `roof-program/v1` (`ridgeFit`, `terminations`, `residual`,
     `generated.counts.cap`); `renderMd` gains the three sections; `assertAcceptance` unchanged
     plus: residual `removedCells` and termination traces must come from accepted steps only
     (rollback ≠ silently counted).

## Boundaries & invariants

- No module re-implements a cage check: terminations go through `regularizeShell`'s step seam;
  the residual pass reuses `silhouetteIoUs`/`closureCheck`/`protectViolations` (the roof-swap
  precedent, named in its header).
- `roof-fit.mjs`, `roof-end-fit.mjs`, `component-roof.mjs`, `durable-skin.mjs` untouched.
- No subject constants anywhere; the only new numbers are `apexGap: 1.0` (quantization unit) and
  the one-voxel dilation (derived, not declared).
- Import direction stays form←(nothing from view); view imports form (existing pattern:
  roof-swap → roof-fit; silhouette-residual → glb-silhouette/form-fidelity/voxel-components).

## Change ordering (matters)

1. `form-fidelity` bbox override + `exposedFaceMesh` subset filter (enablers, independently
   testable, zero behavior change by default).
2. `roof-ridge-fit.mjs` + tests (pure, no consumers yet).
3. `roof-generate` capKeys + `roof-swap` ridge rungs + tests (consumes 2).
4. `plane-terminate.mjs` + tests (consumes 1's seam only via runner).
5. `silhouette-residual.mjs` + tests (consumes 1).
6. Runner wiring + record/md + renders; live runs gatehouse + cottage; `--repro`; full suite.

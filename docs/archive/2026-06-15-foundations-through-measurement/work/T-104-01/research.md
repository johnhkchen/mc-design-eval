# T-104-01 roof-as-program — Research

Phase: Research (descriptive — what exists, where, how it connects). Epic E-27 / Story S-104.
Dependencies T-102-01 (regularization cage) and T-103-01 (component decomposition) are both DONE and
committed; their outputs are the inputs here. Downstream S-106 (component-aware skinning) consumes this
ticket's output; S-105 (shaped vocabulary/arches) is the sibling.

## 1. What the ticket replaces, and why here

Every failing resemblance verdict names `form @ roof`: the roof is voxelized from the decimated TRELLIS
mesh into a stepped spiky blob (epic measured 265 protrusions on the styled cottage, 146 in the roof
band) and then skinned faithfully. The walls pass because the pipeline *re-authors* them; the roof is
the last inherited surface (`docs/active/epics/E-27-parametric-reconstruction.md:31-35`). T-104 fits
roof parameters against the GLB, regenerates the roof as constructed geometry (stair courses, slabs,
full blocks), and swaps it in under the T-102 cage.

## 2. Inputs on disk (all committed)

- **Component records** (T-103): `benchmarks/sculpture/components/{cottage,gatehouse,church}.json`,
  schema `component-record/v1` (`schema/component-record.schema.json`). Source shells are the
  **regularized** artifacts: `source.shellPath = "regularize/<subj>/artifact.json"` with sha256 and
  `regularized: true`. Alignment for cottage/gatehouse is `aabb-affine` (approximate per-axis scale
  ~31–32, `voxelSize: null`).
- **Regularized shells** (T-102): `benchmarks/sculpture/regularize/<subj>/artifact.json` + durable
  record `regularize/<subj>.json` (cottage census: before 276 spikes/23.9% ragged → after 57/9.6%).
- **GLBs**: registry paths (`glb/cottage.glb`, `glb/stone-gatehouse.glb`) via `SUBJECTS` in
  `benchmarks/sculpture/durable-skin.mjs:94-206` — the only place subjects are declared (E-25 Rule:
  registry-only, no subject constants in runners).
- **Kits** (E-26, T-096): `benchmarks/sculpture/kit/<subj>.json`. Roof-tagged rows (`whereUsed`
  includes `"roof"`):
  - cottage: `spruce_planks` (cube, "roof field"), `cobblestone` (cube, chimney stack).
  - gatehouse: `deepslate_bricks` (cube, "roof field"), `stone_brick_stairs` (**fixture**, "stepped
    roof eaves / verge and ridge edging").
  - Neither kit declares a slab; cottage declares no stair. The stair/slab family for courses must be
    derived from the kit's roof-field cube (vocabulary existence checked against minecraft-data).

## 3. Roof-plane data reality (what the fit core gets)

Each record's `roofPlanes[]` entry: `{id, massId, kind: pitched|flat, voxelFit {normal, point,
gradient:[a,b] (y = a·x + b·z + c), rmse, rmseRaw, maxResidual, degenerate}, extent {runs:[{z,x0,x1}],
bbox, area}, eave {cells(runs), dir: ±x|±z|null}, ridge {withPlane, axis: x|z, y, cells} | null,
glbFit {normal, point, gradient, rmse, triangles, areaSupport, angleToVoxelDeg, offsetDelta} | null}`.

Measured shapes (from the committed records):
- **cottage**: 8 planes; ridge pairs roof-0/roof-4 (axis z, ridge y=24; gradients −1.156 / +1.884,
  glb −0.773 / +7.474) and roof-2/roof-3 (axis x, y≈21.2) — a main gable plus a cross gable; roof-1
  flat (area 101); roof-5/6/7 small unpaired pitched fragments; roof-7 has `glbFit: null`
  (glb-fit-missing finding). glbFit quality varies widely: angleToVoxelDeg 1.7°–24.1°, roof-0 glb rmse
  8.35 with offsetDelta 4.42 (aabb-affine alignment is approximate; finding-honest).
- **gatehouse**: 9 planes; ridge pairs roof-0/roof-4 (axis x, y=28, areas 247/19 — very asymmetric)
  and roof-1/roof-6 (axis x, y≈21.6); roof-2 flat (area 151); four small unpaired fragments, three
  with `glbFit: null`. Masses: mass-0 primary + 3 protrusions.
- Pure fit helpers already exported by `src/form/component-decompose.mjs`: `fitPlane(cells)` (exact
  LSQ), `columnRuns`/`runCells` (run encoding), `heightfield`, `roofPlanes`; and
  `src/form/component-glb-fit.mjs`: `triangleStats`, `aabbAlignment`/`scaleAlignment`,
  `glbFitForPlane`.

## 4. The cage (T-102) — the acceptance harness to reuse

`src/view/shell-regularize.mjs` (pure):
- `regularizeShell(occ, {refSils, regions, protect, radius, minKeep, iouTolerance=0.02, grid=128,
  steps})` (line 472) — plan of open/close steps; each candidate judged by three checks: per-azimuth
  silhouette IoU ≥ input baseline − tolerance; closure no-regress (`closureCheck` from
  shell-integrity; one `plugClosure` remediation attempt); protected regions byte-identical
  (`protectViolations`, zero tolerance). Reject = state unchanged + reasons recorded in trace.
- `protrusionCensus(occ, {spikeFaces=4})` (line 74) — cells with ≥4/6 exposed faces (the spike
  number). **No roof-band restriction exists anywhere** — the 146/265 split was measured ad hoc in
  epic planning; a roof-band census restriction must be defined by this ticket.
- `protrudingStackRegion(occ)` (line 122) — derives the chimney protect region (used by the chain).
- `voxelSilhouettes` / `silhouetteIoUs` (lines 394/409) — raster vs GLB ref silhouettes
  (`rasterizeSilhouette` over `loadMeshFromGlb`, `src/form/glb-silhouette.mjs`), normalized 128 grid.
- Azimuths are config-frozen: `MULTI_ANGLE_GATE.azimuths = ["+x+z","+x-z","-x-z","-x+z"]` = 45°/135°/
  225°/315° at 30° elevation (`src/config.mjs:50-53`). The gate-failed azimuths named by the ticket
  (135/225/315) are three of these four.

## 5. Occupancy & fixture semantics — the load-bearing constraint

`src/view/occupancy.mjs`: occupancy = `{cells: Map "x,y,z"→block, forms: Map key→"fixture"|"rail"
(sparse; absent = cube), states: Map key→props, bounds, solid(x,y,z)}`. Form class derived from the
kit ground-truth classifier (cube iff in the full-cube block→Lab table) — **stairs and slabs classify
as fixtures**. Last write wins WHOLE (block+form+state replace together).

Consequences measured in code:
- Morphology, `exposedFaceMesh`, and silhouettes operate on `solidKeys(occ)` — "fixtures are
  dressing, not shell/silhouette mass" (`shell-regularize.mjs:259-262, 349-356`).
- `closureCheck` uses `occ.solid` (`shell-integrity.mjs:314`) — a stair course is air to the flood.
- So a stair-built roof **vanishes from the cage's IoU view and opens closure** unless the swap gate
  judges a view where generated roof cells count as mass. This is the central design problem.
- `rebuildArtifact(occ, template)` (`shell-integrity.mjs:131`) carries `occ.states` into placements
  (`{op:"voxel", pos, block, state?}`) — the occupancy→artifact round-trip preserves stair states.
- `zone-fill` recolors surface cells by appending `{op:"voxel", pos, block}` with **no state** — a
  repaint over a stair cell would cube it (last-write-wins whole). The skin stage would flatten a
  stair roof; per the epic DAG, making skin component-aware is **S-106**, not this ticket.

## 6. The proven fixture-state path (T-097)

- Vocabulary: `CARD_ROWS` (`src/form/fixture-card.mjs:40-72`) — stairs `{facing: north|south|west|
  east, half: bottom|top, shape: straight}`, slabs `{type: bottom|top|double}`.
- Placement: artifact `state` object (stringly-typed; `schema/design-artifact.schema.json:38-42`) →
  `expandArtifact` → `buildWorldFromVoxels` → `setBlock` → `blockStateId(name, state)`
  (`render/src/version.mjs:64-86`; throws on unknown block/property/value → lands in `unmapped`).
- Read-back proof: `decodeStateId` inverts placement (`render/src/version.mjs:166-178`); the fixture
  card runner verifies name+props round-trip (`benchmarks/sculpture/fixture-card.mjs:67-89`).
- `unmapped` (`render/src/world.mjs:53,100-115`): voxels whose `setBlock` threw; AC requires empty.
- **Lens gap (still open)**: prismarine-viewer 1.33.0 meshes NO stair block at any state — placed and
  read back correctly but invisible in renders (pinned note `fixture-card.mjs:45-47`). Slabs,
  trapdoors, doors, fences, lanterns render fine. Renders are evidence, never decision inputs
  (E-24/E-25 rule), but AC4's before/after renders will show whatever the lens can draw.

## 7. Chain wiring, runner conventions, determinism

- `challenge-milestone.mjs` exports `runChain(def, paths)`: provision (data-gated) → shell integrity
  T-091 → **regularize cage T-102** (inside `shellStage`, lines 167-209) → E-24 skin → multi-angle
  gate spawn. `styled-milestone.mjs` reuses `runChain` then grammar → dressing → settle → kit-aware
  gate. The T-102 stage-insertion pattern: import pure cores, compute prerequisites (GLB ref
  silhouettes) in the caller, thread through the stage function, surface metrics in the return shape
  and the durable record.
- T-102/T-103 also ship **standalone runners** (`regularize-shell.mjs`, `component-decomposition.mjs`)
  behind named scripts (`regularize:<subj>`, `components:<subj>`), writing
  `benchmarks/sculpture/<area>/<subj>.json` (committed record) + `<area>/<subj>/artifact.json` +
  gitignored renders + committed evidence frames under `pr/assets/frames/`.
- Determinism: pure stretch runs twice in-process, artifacts byte-identical, sha256 recorded;
  `--repro` re-proves without GL/judge; `--offline` re-asserts the committed record. GL renders are
  evidence only (`reproducibility-excludes-gl-from-decisions`).
- Tests: `npm test` = schema self-test + `node --test "src/**/*.test.mjs"` — pure cores in `src/`
  carry their tests beside them; runners in `benchmarks/` are not under the test glob. 1266 tests
  currently pass.

## 8. Chimney facts

The chimney appears twice: as a `protrusion`-role mass in the component record (cottage mass-1;
gatehouse mass-1..3) and as the cage protect region via `protrudingStackRegion` (geometry-derived:
stack columns above the highest plateau, `ridgeY`). Cage protection is byte-identity — the swap must
leave chimney cells untouched, and the AC adds "re-seated on the new roof if its base moved": the
generated roof surface under the stack may sit lower/higher than the sampled blob did, leaving the
stack floating or buried; nothing in the codebase does re-seating today.

## 9. Measurement gaps the ticket must fill

- **Roof-band protrusion census**: AC target "146/165 → ≈0" (cottage/gatehouse roof-band counts from
  epic planning, measured on the *styled* artifacts). No code computes a banded census; the natural
  band definition available without the skin pipeline is the component record's roof-plane extents
  (cells at/above the plane fits) or y ≥ min eave height of the primary mass's pitched planes.
- **Fit tolerance**: nothing declares what "fit within tolerance" means; glbFit angle/rmse vary 1.7°–
  24° on committed records, and some planes have `glbFit: null`. The fallback (keep regularized roof,
  name the failure) is mandated by E-27 Rule 1.

## 10. Constraints carried into Design

1. Stairs/slabs are fixtures: invisible to cage IoU/closure as-is; invisible to the render lens
   entirely (stairs only). 2. Skin would flatten stair states — chain integration is S-106's; this
   ticket's deliverable is the standalone fit+generate+swap behind named scripts. 3. No subject
   constants — kits/registry drive block families; stair/slab names must be derived and
   vocabulary-checked. 4. Pure cores + synthetic-spec unit tests in `src/`, impure runner in
   `benchmarks/sculpture/`. 5. Determinism double-run + sha256; honest-failure records. 6. Chimney
   byte-protection + re-seat. 7. Fit error recorded; out-of-tolerance → named fallback, never an
   invented shape.

# T-105-01 shaped-vocabulary — Research

Ticket: three **pure generators** (stair run, slab step, arch), each spec→state-correct placements;
a **fit-from-component seam** (spec fitted against component record + GLB, fit error recorded,
tolerance-or-named-fallback per E-27 Rule 1); **applied under the cage** (T-102) to the gatehouse
arch and church opening heads. Subject-agnostic library code; `npm test` green.

## Concurrency context (checked 2026-06-10 5:35pm)

- No prior T-105-01 work dir; no sibling artifacts. Safe to proceed.
- **T-104-01 (roof-as-program) is in flight in a sibling thread** (ticket read minutes ago; no work
  dir yet). T-104 will build roof stair *courses*; T-105 owns the *general* generators. Per the
  `parallel-roots-duplicate-shared-deps` lesson the DAG made these independent — T-105 must create
  **only its own new files** and touch no roof-named module, no shared file edits.

## What exists

### Component record — the input contract (T-103, committed)

- Schema `schema/component-record.schema.json` (`component-record/v1`); writer
  `src/form/component-decompose.mjs`; records on disk at
  `benchmarks/sculpture/components/{cottage,gatehouse,church}.json`.
- **Opening group shape** (per opening): `extent {axis, range, yRange}`, `sillY`, `crown`, `width`,
  `height`, `jambs [{at, y0, y1}]`, `headProfile [{at, topY}]` (per-column top-of-aperture — the
  fit target; E-27 Rule 4: never re-derive from occupancy), `archCandidate: bool`,
  `spring: int|null`.
- **Real arch candidates:** gatehouse `og-0` (+x door) and `og-2` (−x door): width 13 (range
  z∈[−6,6]), sillY 0, crown 15, spring 15, jambs at ±6 (y0=0, y1=12), headProfile domed
  (12,14,15,…,15,14,12). All other groups (gatehouse windows, **all church openings**) have
  `archCandidate:false` → flat heads. Church has 20+ opening groups, mostly 1–3 cells wide; a few
  wider flat-head windows (e.g. `og-2` +x, width 10, flat topY=20).
- Group `dir` ∈ {+x,−x,+z,−z}; the wall's depth plane comes from `wallSlabs` (e.g. gatehouse
  `mass-0-wall-+x` at x=11... x=13 spread — wall slabs carry `axis`/`value` per direction).

### Regularization cage — the application seam (T-102, committed)

- `src/view/shell-regularize.mjs` — PURE. `regularizeShell(occ, {refSils, regions, protect,
  steps, iouTolerance=0.02, grid=128, ...})`. **Injectable step seam**: a step
  `{op:"<name>", fn:(occ,{radius,protect})=>({occ, ...report})}` runs custom transforms under the
  same three gates: (a) per-azimuth silhouette IoU vs the **input** shell ≥ baseline − tolerance
  (azimuths from `MULTI_ANGLE_GATE`, GL-free rasterization via `exposedFaceMesh` →
  `rasterizeSilhouette` → `normalizeSilhouette`/`iou`); (b) closure no-regress
  (`closureCheck`, one `plugClosure` remediation allowed); (c) protected regions byte-identical.
  Rejected steps roll back and are recorded in `trace[]`.
- `protrudingStackRegion(occ)` — the chimney/protrusion protect region, geometric.
- Census metrics: `protrusionCensus` (spikes = ≥4/6 exposed faces), `raggedColumnRate`.

### Occupancy & artifact bridge (`src/view/occupancy.mjs`, `shell-integrity.mjs`)

- `Occupancy`: `cells Map "x,y,z"→block`, **sparse `states Map key→{facing,half,...}`**, sparse
  `forms Map key→"fixture"|"rail"`; `has()` = occupied by anything, `solid()` = full cube only
  (a dressed window cell is occupied-not-solid). `occupancyFromCells([{pos, block, form?,
  state?}])` builds one; last write wins whole.
- `rebuildArtifact(occ, template)` emits canonical-ordered `{op:"voxel", pos, block, state?}`
  placements, recomputes the manifest, carries per-voxel state (T-097: a strip must not undress a
  window). `openingRegions(occ)` gives declared-opening world AABBs — the closure allow-list; a
  dressed aperture's region is identical to its undressed twin (detection on the SOLID view).
- `derivedFormClass(block)` (src/form/kit.mjs): not-in-CUBE_SET → "fixture" (stairs, slabs,
  trapdoors classify as fixtures automatically).

### Proven state path (T-097, committed)

- `src/form/fixture-card.mjs` `CARD_ROWS` — the **proven state vocabulary**: stairs
  `{facing: north|south|east|west, half: bottom|top, shape: straight}` (stone_brick_stairs probed);
  slabs `{type: bottom|top|double}`; trapdoors (4 open facings + 2 closed halves); plus
  fence/door/lantern. All placements AJV-pass, build with **empty `unmapped`**, and state-id
  read-back round-trips against real minecraft-data.
- **Known lens defect** (docs/active/work/T-097-01/review.md): prismarine-viewer 1.33.0 meshes
  **no stair block at any state** — placement is proven by read-back, but stair cells are invisible
  in renders. Slabs/trapdoors/fences/doors/lanterns render correctly. Consequence: anything built
  *only* of stairs contributes nothing to a render or pixel judge; the silhouette cage is
  unaffected (it rasterizes occupancy cells as unit cubes, GL-free).

### Fit-contract precedent (T-103 `component-glb-fit.mjs`)

- `glbFitForPlane(stats, alignment, voxelFit, extentKeys, {maxAngleDeg, minTriangles})` → fitted
  plane `{normal, point, gradient, rmse, triangles, areaSupport, angleToVoxelDeg, offsetDelta}` or
  **`null` = the honest miss** — caller records a finding and the sampled mass stays authoritative.
  This is the tolerance-or-named-fallback shape T-105 must mirror ("same contract as T-104").
- Alignment (`scaleAlignment`/`aabbAlignment`) maps GLB→voxel space; `triangleStats` precomputes
  centroids/normals/areas.

### Runner & evidence conventions (T-102/T-103 runners)

- `benchmarks/sculpture/regularize-shell.mjs` — the IMPURE-runner pattern: `SUBJECTS` registry
  (input paths + pinned baselines, hard-asserted), pure core run twice with byte-identical
  artifacts (sha256 recorded), `--offline` re-asserts the committed record without GL, outputs
  `<dir>/<subj>.{json,md}` committed + `<subj>/artifact.json` + gitignored PNGs + committed
  evidence frames in `pr/assets/frames/` (oblique 225° witness angle). Renders via
  `renderViews(artifact, angles, {outDir, label})` (`src/view/multi-angle.mjs`); render-tool
  reports `unmapped` count (Rule 3: unmapped is a failure).
- Inputs available on disk: regularized shells `benchmarks/sculpture/regularize/<subj>/
  artifact.json`, component records `components/<subj>.json`, GLBs `glb/{cottage.glb,
  stone-gatehouse.glb, church.glb}`.
- npm script naming: `<stage>:<subject>` → `node benchmarks/sculpture/<runner>.mjs --subject <s>`.

### Tests

- `node:test` + `assert/strict`, glob `src/**/*.test.mjs` (pure only — no GL/IO/Date/random in
  src modules). ~1274 tests passing as of today. Single file: `node --test src/form/x.test.mjs`.

## What does NOT exist

- No stair-run, slab-step, or arch generator anywhere in `src/` (grep confirms; `roof-patch.mjs`
  is a T-082 detector, analysis-only). No fit-from-headProfile code. No runner applying generated
  constructs under the cage.

## Constraints & assumptions surfaced

1. **E-27 Rule 1** (binding): parameters fitted to the reference, fit error recorded; out of
   tolerance → named finding + regularized sampled mass stays. **Rule 3**: generated geometry with
   named parameters, placed via the proven T-097 state path; `unmapped` in render = failure.
   **Rule 4**: consume the component record, don't re-derive.
2. The arch fit target is the opening's `headProfile` (voxel-derived, already GLB-anchored via the
   record's `alignment`+`glbFit` provenance). The ticket adds "fit against the component record +
   GLB" — the GLB side must at minimum record alignment provenance / be the arbiter where the
   profile is ambiguous; T-103 already fitted wall planes to the GLB.
3. The cage gates silhouettes on **occupancy cells as unit cubes** — stair/slab cells count as full
   cells. Carving an arch (removing head cells) and re-placing ring cells changes the silhouette
   only at the opening; tolerance 0.02 per azimuth must absorb a correct arch (the sampled head is
   already approximately arched on the gatehouse).
4. Closure: opening cells are exterior air allowed by `openingRegions`; replacing a ragged head
   with a clean ring must not create new exterior-reachable interior air outside those regions.
   Dressed-opening semantics (T-097/E-25): dressing (trapdoors/fences) lives in opening cells as
   occupied-not-solid; the integration case to unit-test is "arch head + dressed aperture below it
   still passes closure and survives rebuildArtifact round-trip".
5. Stair-render invisibility (T-097 residual): an arch head built purely of stairs would be
   invisible at render. The voxel-circle arch ring should therefore be **full blocks** for the
   structural ring, with stairs only as optional intrados softening — and the generators' correct
   states are proven by read-back tests, not pixels.
6. Sibling overlap: T-104 needs stair runs for roof slopes. T-105 ships them as library code in
   its **own new module(s)**; no edits to files a roof ticket would create or own.

## Open questions carried to Design

- Module placement: `src/form/` (beside fixture-card/kit, pure construct geometry) vs `src/view/`
  (beside the cage). Both pure; decided in Design.
- One module with three generators vs. split generator/fit modules.
- Runner shape: new `shaped:*` chain vs. extending the regularize runner (lean: new runner, the
  regularize runner hard-asserts its own baselines).

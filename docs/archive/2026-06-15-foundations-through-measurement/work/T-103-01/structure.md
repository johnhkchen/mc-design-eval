# T-103-01 component-decomposition — Structure

File-level blueprint. Two new pure modules + one schema + one runner + one additive edit. No file
that T-102-01 plausibly touches is modified (styled-milestone, shell-integrity, multi-angle-gate);
the only shared-file edits are append-only (package.json scripts, .gitignore).

## New files

### 1. `src/form/component-decompose.mjs` — the pure decomposition core

PURE (no GL, no I/O, no Date/random). Imports: `roofRegion, openings, footprint` from
`../view/structural-read.mjs`; `solidOccupancy, bareBlock` from `../view/occupancy.mjs`;
`projectSurface, orthoSpec` from `../view/surface-grid.mjs`. Exports (public, stable):

- `COMPONENT_RECORD_SCHEMA` — `"component-record/v1"`.
- `fitPlane(cells)` — exact LSQ of `y = ax + bz + c` over `[{x,z,y}]`, returned normalized as
  `{normal:[nx,ny,nz] (unit, ny>0), point:[x,y,z], gradient:[a,b], rmse, maxResidual}`. Degenerate
  inputs (<3 cells, collinear) → vertical-normal fallback flagged `degenerate: true`.
- `heightfield(occ)` — `{h: Map "x,z"→topY, bbox}` from the solid occupancy (one entry per column).
- `medianSmooth(hf)` — 3×3 median (edge cells use available neighbors); returns a new heightfield.
  The ANALYSIS surface; raw `h` stays in the record's cell data.
- `segmentMasses(occ, opts)` — D2 algorithm. Returns `{masses, columnMass: Map "x,z"→id}`. Mass:
  `{id ("mass-0"…, by descending area then lex anchor), role, protected, plan: {runs, bbox, area},
  yRange, volume, junctions: [{withMass, axis ("x"|"z"), line, span, yRange}]}`.
  Opts (all defaulted, none subject-specific): `gapMin=3, gapFrac=0.12, minMassArea=12,
  protrusionMaxArea=12, protrusionMinRise=3`.
- `roofPlanes(occ, segmentation, opts)` — D3 steps 1–3 (voxelFit only; the GLB side is module 2).
  Plane: `{id ("roof-0"…), massId, kind: "pitched"|"flat", voxelFit, extent {runs, bbox, area},
  eave {cells, dir}, ridge {cells, axis, y} | null}`. Opts: `residualTol=1.25, minPlaneArea=8,
  mergeAngleDeg=10, mergeOffset=1, flatSlope=0.15, refitEvery=16`.
- `wallSlabs(occ, segmentation)` — D4. Slab: `{id, massId, dir, axis, value, normal, boundsWorld
  {min,max}, faceCells, slabCells, coverage}`.
- `openingGroups(occ, segmentation, {dirs = SIDE_FACES})` — D5 lift over
  `openings(occ, dir, {withCells:true})`. Group: `{id, massId, dir, kind, openings: [{bboxWorld,
  sillY, jambs: [{x|z, y0, y1}, …], headProfile: [{u→world, topY}], archCandidate, spring, crown}]}`.
- `decompose(occ, {glb = null, alignment = null, opts = {}})` — orchestrates the above; when `glb`
  (parsed mesh `{positions, triangleCount, bounds}`) + `alignment` are given, attaches `glbFit` per
  roof plane via module 2 and emits `findings` for misses. Returns the record **body** (everything
  except `subject`/`source` — the runner stamps provenance). Key order is fixed by construction
  (object literals), arrays sorted — byte-deterministic.
- `columnRuns(cells)` / `runCells(runs)` — `[x,z][]` ↔ `[{z, x0, x1}]` row-run codec (record size,
  D6); exported for consumers and tests.

Internal (not exported): region-grow bookkeeping, gap clustering, junction extraction.

### 2. `src/form/component-glb-fit.mjs` — mesh-side reference fitting

PURE math over parsed GLB data (never parses GLB itself — takes `parseGlbMesh` output). Exports:

- `triangleStats(positions, triangleCount)` — `{centroids, normals, areas}` (Float64Arrays;
  normals unit, area-degenerate triangles zeroed).
- `scaleAlignment(meshBounds, scale)` — the exact map for registry-scale subjects: mirrors
  `voxelizeGlb` (voxelSize = longest/scale, origin = bounds.min, center sampling) composed with
  `keysToArtifact` recentering (x −⌊nx/2⌋, z −⌊nz/2⌋). Returns `{mode:"registry-scale", voxelSize,
  dims, toVoxel(p)}`.
- `aabbAlignment(meshBounds, occBounds)` — per-axis affine mesh-AABB → occupancy-AABB:
  `{mode:"aabb-affine", scales, offsets, toVoxel(p)}` (the fallback for cottage/gatehouse lineages).
- `glbFitForPlane(stats, alignment, plane, extentBbox, {maxAngleDeg=25, minAreaSupport=4})` —
  selects triangles by aligned-centroid-in-extent + normal-within-cone (normals direction-only under
  axis-aligned positive-scale alignment), area-weighted LSQ plane in voxel space:
  `{normal, point, rmse, areaSupport, triangles, angleToVoxelDeg, offsetDelta} | null`.

### 3. `schema/component-record.schema.json` — the contract (D6)

JSON Schema 2020-12, `$id: component-record/v1`. Top-level required: `schema, subject, source,
alignment, bounds, masses, roofPlanes, wallSlabs, openingGroups, findings`. `source`:
`{shellPath, sha256, regularized: boolean|null}`. `$defs`: run, mass, roofPlane (voxelFit required,
glbFit nullable), wallSlab, openingGroup, opening, finding `{code, where, detail}`. Documented
inline with `description` fields — this file IS the contract documentation the AC asks for
(plus a short consumer section in the runner-written md).

### 4. `src/form/component-decompose.test.mjs` + `src/form/component-glb-fit.test.mjs`

Synthetic-shell tests (D8): gabled-box+chimney, two-prism church-like, arched-doorway wall,
flat-roof box, spiked variants, codec round-trip, determinism (two runs deep-equal), and ajv
validation of a full synthetic record against schema file 3 (readFile of the schema in-test follows
the existing validate-step precedent; the core stays I/O-free). glb-fit tests on hand-built triangle
soups (a tilted quad pair = two normals; alignment math against a known voxelizeGlb-style mapping).

### 5. `benchmarks/sculpture/component-decomposition.mjs` — the impure runner

Shape per shell-integrity/challenge-milestone (research §6). Contents:

- `SHELLS` registry-data table: `{cottage: {shell: "styled/cottage/shell-artifact.json", expect:
  {pitchedRoofPlanes: 2, protrusionMasses: 1, ridges: 1}}, gatehouse: {shell:
  "styled/gatehouse/shell-artifact.json", expect: {archCandidates: 1}}, church: {shell:
  "challenge/church/shell-artifact.json", expect: {masses: 2, roofPlanes: 2}}}` — minimums,
  hard-asserted (`expect` idiom). Subject base data (glb path, provision.scale) from the
  durable-skin `SUBJECTS` import.
- Flags: `--subject <s>` (required), `--shell <path>` (T-102 tolerance seam; sets
  `source.regularized: null→true` only via explicit `--regularized`), `--offline`.
- Flow: read shell → `assertArtifact` → `artifactOccupancy` → read GLB → `parseGlbMesh` →
  alignment (`scaleAlignment` if registry `provision.scale`, else `aabbAlignment`) →
  `decompose` **twice**, byte-compare → ajv-validate vs schema → assert `expect` →
  write `components/<subj>.json` (+ `.md` human summary: per-component table, findings, fit errors).
- Visualization: colored artifact (palette table in runner: masses → wool series, roof planes →
  concrete series, protrusions → red_wool, opening jamb cells → black_concrete), `renderViews` at
  `+x-z` and `-x-z` into `components/<subj>/`, `montageRow` sheet, copy
  `pr/assets/frames/components-<subj>.png` (committed). Renders best-effort (`tryRender` idiom) —
  GL failure does not fail the record.
- `--offline`: re-read committed record, re-assert sha256 of shell + record, re-validate, re-assert
  expectations. No GL, no recompute.

## Modified files (append-only)

- `src/view/structural-read.mjs` — `openings(occ, dir, {withCells = false})`: third parameter;
  when set, each opening gains `cellsUV`. No existing call-site changes; default path byte-identical.
- `src/view/structural-read.test.mjs` — one new test for `withCells`.
- `package.json` — scripts `components:cottage|gatehouse|church` →
  `node benchmarks/sculpture/component-decomposition.mjs --subject <s>`.
- `.gitignore` — `benchmarks/sculpture/components/**/*.png` (records committed, view PNGs not;
  the pr/assets frame is committed evidence per convention).

## Outputs committed by the run

`benchmarks/sculpture/components/{cottage,gatehouse,church}.json` + `.md`,
`pr/assets/frames/components-{cottage,gatehouse,church}.png`.

## Ordering (matters)

1. `structural-read` withCells (smallest seam, unlocks D5; isolated commit).
2. Core module skeleton + `fitPlane`/codec/heightfield/median + tests.
3. `segmentMasses` + tests (church-prism synthetic) → `roofPlanes` + tests (gable synthetic) →
   `wallSlabs` + `openingGroups` + tests (arch synthetic).
4. `component-glb-fit` + tests; `decompose` orchestration + schema + ajv test.
5. Runner + scripts + gitignore; run three subjects; commit records + evidence frames.

Boundary rules restated: core never reads files or parses GLB; runner contains no geometry logic;
the record is produced only by `decompose` (one writer); downstream consumers (S-104/105/106) read
the committed JSON, never the internals.

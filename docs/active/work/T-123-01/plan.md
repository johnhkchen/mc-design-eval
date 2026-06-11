# T-123-01 glb-conditioning — Plan

Ordered, independently verifiable steps. Each step = one commit. Verify = `node --test
src/form/form-sketch.test.mjs` (later steps add files) unless stated.

**One refinement over structure.md, decided on measurement:** the four GLBs are ~137–146k
triangles each (measured). `voxelizeGlb` casts one full-mesh parity ray *per cell* — at
sampleScale 48 that is ~10^10 triangle tests per subject (minutes each, paid again by every
`--repro`). The internal substrate therefore gets its own **scanline parity sampler** in the core
(one +x ray per (y,z) row, collect crossing intervals, fill between pairs — same cell-center/
voxelSize convention as `voxelizeGlb`, same fixed irrational y/z jitter trick, ~50 lines, pure),
**cross-validated against `voxelizeGlb` in unit tests** on synthetic meshes so the two stay one
vocabulary. `glb-voxelize.mjs` itself is not modified.

## Step 1 — grammar, snap, triangle geometry

`src/form/form-sketch.mjs`: `FORM_SKETCH_SCHEMA`, `SKETCH_PARAMS`, `GRAMMAR_ORIENTATIONS`
(14: ±x ±y ±z + 8 diagonal (±1,±1,0)/√2, (0,±1,±1)/√2 — keys like `"+x"`, `"roof+x+y"`),
`triangleGeometry(positions, triangleCount)` (normal via cross product, area, centroid; degenerate
triangles flagged, excluded downstream), `snapNormal(nx,ny,nz)` (argmax dot, residual
`acosDeg(clamp(dot))`, tie-break = lowest orientation index).

Tests (`form-sketch.test.mjs` + local soup builders `boxSoup`, `gabledPrismSoup(pitchDeg)`,
`noisyBoxSoup` with a deterministic per-vertex hash perturbation): exact snap of the 14 cardinal
normals; 10°-off-axis normal → axis with ~10° residual; 44°/46° roof plane → roof orientation;
degenerate triangle excluded.

## Step 2 — coarseFaces (decimate + snap + merge as one mechanism)

Weld vertices on a `weldEpsFrac · bboxDiagonal` grid → vertex ids; edge map (sorted id pairs) →
adjacent triangles; region-grow in triangle-index order across shared edges within the same
snapped orientation. Per region: orientation, snapped unit normal, area-weighted offset
(`n̂·centroid`), area-weighted centroid (kept for mirroring/plotting), areaFrac, mean/max
residual. Sort by area desc (tie: orientation index, then offset); cap at `faceTarget`; record
`droppedAreaFrac`, `regionCount`, and pre-cap `areaShareByOrientation` over all triangles.

Tests: box → exactly 6 faces, residuals 0, areaShare correct; noisy subdivided box → ≤ faceTarget
faces, 6 dominant faces ≥ ~95% area; gabled prism → 2 roof faces + walls + gable triangles
snapped to ±x/±z; offsets match constructed geometry within weld tolerance.

## Step 3 — substrate sampler + occupancy adapter + detectSymmetry

`sampleOccupancy(positions, triangleCount, bounds, { scale })` (scanline parity, above) returning
the `voxelizeGlb` shape `{ scale, voxelSize, dims, bounds, occupied, count }`; adapter
`occupancyOf(sample)` → `occupancyFromCells` (block `"stone"`) for the component-decompose
machinery. `detectSymmetry(occ, faces, params, frame)`:

- `frame` = `{ min, voxelSize }` mapping cells ↔ mesh coordinates (`mesh = min + (cell+0.5)·vs`).
- Candidates: axis ∈ {x, z}, plane offset `c` swept on half-cell positions over the middle half of
  the plan bbox; reflection `x' = 2c − x` is integer-exact.
- Score = IoU(occ, mirror(occ)); best by score, tie-break axis x then lower offset.
- `applied = score ≥ symmetryConfidence`; better half by area-weighted mean snap residual of
  faces on each side of the plane (mesh coords); on apply: keep that half's cells + mirror them,
  and mirror its faces (reflect normal + centroid, recompute offset, merge faces landing on an
  existing one — same orientation and offset within weld eps — by summing areaFrac).
- Returns verdict `{ axis, offset, offsetMesh, score, threshold, applied, keptSide }` + the
  (possibly symmetrized) occ cell set + faces.

Tests: sampler ≡ `voxelizeGlb` on box and gabled prism at scale 12 (cell-set equality);
symmetric house soup → score ≈ 1, applied, plane within a cell of true center; one-side-noisy
house → keeps the clean side (assert keptSide); L-plan/two-mass asymmetric composition → best
score < 0.80, `applied:false`, score recorded.

## Step 4 — fitFootprint

Plan mask (columns with any cell, post-symmetry) → boundary edges on the corner lattice (directed,
region-on-left) → chain into loops → keep the max-|shoelace| loop → merge collinear runs → jog
elimination: repeatedly take the shortest edge ≤ `tolCells = ceil(footprintSnapTolFrac ·
max(planW, planH))` (ties: lowest vertex position), merge its two (parallel) neighbors onto the
**longer** neighbor's line, re-merge collinear; stop at no-short-edge or 4 vertices. Output CCW
polygon from the lexicographically-min vertex, `isRectangle`, `toleranceCells`, mask/polygon areas.

Tests: clean rectangle mask → 4 vertices; rectangle with 1–2-cell jogs (tol ≥ 2) → 4 vertices;
L-plan (arms ≫ tol) → 6 vertices; determinism double-run.

## Step 5 — pitchClass, proportionsOf, buildSketch

- `pitchClass(normals, areas)`: upward non-degenerate faces (ny > 0.05); tilt = `acosDeg(ny)`;
  area-weighted bucket vote over declared buckets; dominant tilt = area-weighted mean within the
  winning bucket. (Pre-snap, so a steep roof is not laundered to 45°.)
- `proportionsOf(occ, masses, params, { registryScale, sampleScale })`: per-layer plan-cell
  counts; `eaveLayer` = highest y with count ≥ `eaveAreaFrac · footprintArea`; ridge = top;
  block-equivalents via `registryScale / sampleScale`; `storeyCandidates` n ∈ 1..4 flagged
  plausible inside `storeyBandBlocks`. Masses from `segmentMasses(occ)` (defaults), mapped to
  `{ kind, bbox, areaCells }`; `massCount` = non-protrusion masses.
- `buildSketch(glbBytes, { subject, registryScale, params })`: parse → geometry → pitch →
  coarseFaces → sample → symmetry → footprint → proportions → assemble `form-sketch/v1` record
  (sorted keys where order is not semantic; **no timestamps**; runner adds `source.glbSha256`).

Tests: gabled prism at 45° → `pitched45`; 60° prism → `steep`; flat box → `flat`; prism
eave/ridge layers match construction; tower+nave soup → `massCount: 2` (the church criterion in
miniature); `buildSketch` on an in-memory GLB (fixture built as in `glb-mesh.test.mjs`) →
schema-shaped record, double-run `JSON.stringify` byte-equal.

## Step 6 — sketch-plot

`src/form/sketch-plot.mjs`: `renderSketchSheet({ sketch, plan, elevations, silhouettes })` —
pure RGBA composition, three 256-px panels (plan mask + footprint polygon + mirror line; front
and side occupancy elevations + eave/ridge lines + optional mesh-silhouette outline overlay),
1-px separators, fixed palette constants. No text (pngjs has no fonts; the .md carries numbers).
Tests: dims, byte-determinism, polygon stroke pixels present, panels independent.

## Step 7 — runner, npm scripts, records for all four subjects

`benchmarks/sculpture/form-sketch.mjs`: `--subject <key>` / `--all` / `--repro` /
`--rotate-pins`; subjects from `SUBJECTS` (durable-skin.mjs) — buildings only (entries with
`generated.scale`); GLB → `buildSketch` → sheet PNG (rasterizeSilhouette front/side views for the
overlay) → `preflightPins` + `guardedWriteRecord` for `form-sketch/{key}.json` + `{key}.md`; PNG
written directly (evidence, not a pin). `--repro` re-derives and sha256-compares JSON, exit ≠ 0
on divergence. package.json: `sketch:cottage|barn|gatehouse|church|all` via direct `node`.

Verify: run all four; **eyeball each sheet against its GLB** (AC: human-checkable at a glance);
check the two named AC outcomes — church `massCount` ≥ 2 body masses, barn `isRectangle: true`.
If a declared universal constant fails an AC outcome (e.g. barn jogs > tol), the constant is
reconsidered *universally* and all four re-run — never per-subject. Commit records.

## Step 8 — repro proof, full suite, no-coupling evidence

- `node benchmarks/sculpture/form-sketch.mjs --all --repro` → byte-identical.
- `npm test` green (full suite, including the pin-guard conformance sweep — confirm the new
  writer routes through `guardedWriteRecord` and appears compliant).
- No-coupling grep recorded in review.md: importers of `form-sketch.mjs` / readers of
  `benchmarks/sculpture/form-sketch/` are exactly {runner, tests}; no `tolerance`/`fit` constant
  references the sketch anywhere; generalization grep over src stays clean (no subject names in
  src/form code or comments).
- progress.md finalized; review.md written.

## Testing strategy summary

Unit (pure, offline): steps 1–6 as listed — geometry exactness, threshold both-sides, determinism
double-runs, cross-validation of the sampler against `voxelizeGlb`. Integration: step 7's real-GLB
records + visual sheets (committed evidence, not unit-asserted — real meshes are not stable test
fixtures). Regression: `--repro` + the pin guard protect the committed records from silent drift.

## Risks / contingencies

- **Sampler-vs-voxelizeGlb mismatch on real meshes** (jitter interplay): unit cross-check is on
  synthetic meshes; the substrate only feeds measurements, so small divergence is acceptable —
  but if dims mismatch, fix the convention, not the records.
- **`segmentMasses` merges church tower into nave** (gap < gapMin at sampleScale): inspect the
  heightfield; if so the issue is sampleScale resolution — raising sampleScale is a universal
  change, documented and re-run on all four. No church-specific knob.
- **Runtime**: scanline sampler ≈ seconds/subject; if region-growing on 146k triangles allocates
  too much (edge map ~440k entries), switch Maps to typed arrays — mechanical.

# T-123-01 glb-conditioning — Research

Descriptive map of what exists. No solutions proposed here.

## 1. The ticket in one line

Build a pure, deterministic mesh-conditioning stage (decimate → snap normals to the Minecraft
grammar → mirror-plane detect/apply → rectilinear footprint) that emits a serialized + visualized
**conditioned form sketch** for the four registered building GLBs. The sketch is evidence for
recognition (S-125), never a fit target (E-31 Rule 3).

## 2. Where the GLBs live and how subjects are registered

- GLB files: `benchmarks/sculpture/glb/{cottage,barn,church,stone-gatehouse}.glb` (~5–6 MB each,
  TRELLIS image→3D outputs; see `benchmarks/sculpture/trellis-glb.mjs` for the generation client).
- **The registry is `SUBJECTS` in `benchmarks/sculpture/durable-skin.mjs`** (exported, line ~102).
  Keys: `cottage`, `gatehouse`, `church`, `barn`. Each entry is declared "registry DATA only" —
  paths (`glb`, `concept`, `map`, committed records), `frontDir`/`sideDir`, and a per-style
  fallback prior. `generated-milestone.mjs:85` imports it; `:431` resolves `--subject` against it.
  Other runners carry older duplicated subject tables (`concept-materials-ab.mjs:66`,
  `building-build.mjs:47`), acknowledged as duplication by `form-routing.mjs:21` ("the runners'
  duplicated SUBJECTS lists"). `SUBJECTS` is the current canonical one.
- The generalization grep (`generated-milestone.mjs:393`) scans source for subject-key mentions to
  enforce "no per-building constants". Known footgun (memory `generalization-grep-and-no-evidence-rerolls`):
  it matches comments too.

## 3. Mesh access — what a conditioning core can read

- `src/form/glb-mesh.mjs` — the pure GLB parser, zero deps, manual DataView over the
  JSON+BIN chunks. `parseGlbMesh(glb)` → `{ positions: Float64Array (9 numbers/triangle,
  world-space, node transforms applied), triangleCount, bounds: {min,max} }`. This is a flat
  triangle soup: indices pre-expanded, no adjacency, no normals (computable from winding).
  `parseGlbColoredSurface(glb)` adds UVs + texture bytes (not needed for form).
- `src/form/glb-silhouette.mjs` — a second, self-contained parser (`parseGlb`, `loadMeshFromGlb`)
  plus a **deterministic CPU rasterizer**: `cameraForMeshBounds(bounds, view)`,
  `projectPoint(p, cam, w, h)`, `rasterizeSilhouette(mesh, opts)` (512×512 default). No GL.
  This is the existing pattern for "draw the mesh without prismarine-viewer".
- `src/form/glb-voxelize.mjs` — `voxelizeGlb(glb, {scale})` solid-fills by ray parity
  (Möller–Trumbore +X rays, fixed irrational sub-voxel jitter for determinism). Default scale 32.
  This is the stage whose input T-123 conditions: today the raw soup goes straight in, importing
  TRELLIS lumpiness (E-27 measured 276 attached spikes / 23.9% ragged columns on the cottage).

## 4. Geometry machinery that already exists (candidates for reuse)

- `component-decompose.mjs` — `fitPlane(cells)` is an exact LSQ fit of a *heightfield* plane
  (y = a·x + b·z + c) over voxel column tops; built for roof analysis on occupancy grids, not for
  mesh faces. Also `heightfield`, `medianSmooth` (3×3), `segmentMasses` (mass count on voxels),
  `roofPlanes`, `wallSlabs`. All voxel-domain.
- `voxel-components.mjs` — `componentLabels` (6/26-connectivity), `pruneStrays`, `speckVerdict`.
  Voxel-domain mass counting; the church's "two masses" criterion has voxel-side precedent in
  `segmentMasses`.
- `component-glb-fit.mjs` — `triangleStats(positions, triangleCount)` (counts/edges/aspect),
  mesh→voxel alignment records ("aabb-affine" lives in fit contexts, e.g. `roof-ridge-fit.mjs:21`).
  Memory `cage-arbitrated-attempt-ladder`: GLB absolute slopes/offsets are unreliable under
  aabb-affine — relative/proportional reads are the trustworthy ones.
- **Nothing currently does**: mesh decimation, face clustering/merging, normal snapping, mirror
  symmetry detection, or footprint polygon fitting. All four conditioning steps are new code.

## 5. Determinism, --repro, and pin conventions

- Tests: `npm test` = `validate-artifact --self-test` + `node --test "src/**/*.test.mjs"`
  (node:test + node:assert/strict, ~130 test files). Pure tests run offline: no GL, no network,
  no model calls.
- `--repro` convention (`challenge-milestone.mjs:347`, `generated-milestone.mjs:434`,
  `roof-diff.mjs:308`): an argv flag that re-derives the deterministic chain in a fresh process and
  byte-compares (sha256) against the committed records; it never re-spends LLM/GL. Records carry a
  `reproducible.sha256` block and a prose `determinism` note.
- Determinism is achieved structurally: fixed scan orders, stable discovery-order labels,
  exact (non-iterative) fits, documented tie-breaks, no `Math.random()`/`Date` in pure modules.
- **Pin guard is structural** (T-119, `src/form/pin-guard.mjs` + conformance test): committed
  records are written through `guardedWriteRecord` with preflight-before-spend; overwriting a
  pinned record requires `--rotate-pins` in an owning ticket. Any new committed-record writer
  must use it (memory `pin-guard-is-structural`; the conformance test enumerates writers).
- Memory `npm-run-flag-swallowing`: npm scripts need `--` before flags or direct `node` invocation.

## 6. Committed-artifact and visualization conventions

- Per-feature record dirs under `benchmarks/sculpture/`: `material-map/{subject}.json`,
  `zone-map/…`, `kit/…`, `value-select/…`, `roof-diff/…`, plus milestone dirs
  `generated/{subject}/` (JSON + 4-azimuth PNGs + sheet + an `.md` rendered by the runner).
- GL renders (prismarine-viewer) exist but are excluded from gating decisions
  (memory `reproducibility-excludes-gl-from-decisions`); the deterministic path draws PNGs via
  `pngjs` (devDependency) — `glb-silhouette.mjs` rasterizes meshes on the CPU, and runners write
  PNG sheets without GL. So "visualized" can be satisfied deterministically.
- Records carry a `schema` string (e.g. `"glb-silhouette/v1"`, `"component-record/v1"`); JSON
  Schema validation via ajv exists for the design-artifact contract (`scripts/validate-artifact.mjs`),
  but per-feature records mostly self-describe via the `schema` field + unit tests.

## 7. Downstream consumers and the no-coupling rule

- Today's GLB readers: `voxelizeGlb`/`voxelizeGlbThin` (via `form-routing.mjs` — buildings route
  to "solid"), `glb-silhouette` (refute-only membership checks, memory `silhouette-can-only-refute`),
  `component-glb-fit` / `roof-ridge-fit` (metrology path — going dormant per E-31 Scope).
- The sketch's intended consumer is S-125 idiom-recognition (reads concept + sketch, emits a
  building program in pattern-book vocabulary). S-124 (style packs) is independent. E-31 Rule 3
  binds: *no fit tolerances against the sketch or mesh*; canonical realization always wins.
  The AC requires a recorded grep/review proving no tolerance coupling was added.
- E-31 epic text names this stage "the smarter voxelization": conditioning runs **before**
  anything reads the mesh, i.e. its output must be renderable into the same kind of triangle soup
  (or richer plane set) that downstream evidence-readers consume — but T-123 itself only ships
  the sketch + visualization, not a re-wired voxelizer.

## 8. Constraints and assumptions surfaced

- **Grammar set**: 6 axis normals (±x, ±y, ±z) + the 45° roof family. The roof family at 45°
  pitch has 4 horizontal orientations × up/down components — the ticket says "8 legal surface
  orientations (6 axes + 45° roof planes)" loosely; the exact family enumeration is a Design call.
- **Symmetry**: mirror-plane detection with a declared confidence threshold; below it the subject
  stays asymmetric and the score is still recorded. TRELLIS meshes are noisy, so the detector must
  score approximate symmetry, not exact.
- **Footprint**: axis-aligned rectilinear polygon with a declared snap tolerance. Barn must come
  out a clean rectangle; church must keep two masses (nave + tower — `segmentMasses` precedent
  says masses are separable in voxel space; the mesh-domain equivalent is new).
- **Gross proportions**: storey-height candidates, roof pitch class, mass count. Pitch class
  exists conceptually in `roof-program`/`component-roof` (stair-course programs assume ~45°).
- **Decimation target ~100 faces is "declared"** — a named constant, not tuned per subject
  (per-building constants are forbidden; per-style none needed — conditioning is universal).
- **TRELLIS mesh scale**: raw GLB coordinates are arbitrary (aabb-affine maps them to voxel
  space later). Proportions in the sketch should therefore be relative/normalized unless tied to
  a declared mapping. (Memory: absolute GLB slopes/offsets unreliable.)
- Input meshes are large (5–6 MB GLBs, tens of thousands of triangles); decimation must be
  robust to triangle soup without adjacency (or build adjacency by vertex welding — new code).
- Synthetic unit-test meshes (boxes, gabled prisms) are easy to author as raw position arrays —
  `glb-mesh.test.mjs` / `glb-silhouette.test.mjs` show the existing fixture style, including
  building tiny GLB buffers in-memory for parser tests.

## 9. Open questions carried to Design

1. Decimate-then-snap vs cluster-by-normal-then-merge (classic decimation vs region growing).
2. Mesh-domain vs voxel-domain detection for masses/footprint/symmetry (voxel machinery exists;
   mesh machinery is new but is what "before anything reads it" implies).
3. Sketch schema shape and where it lives (`benchmarks/sculpture/form-sketch/{subject}.json` per
   the per-feature-dir convention vs inside `generated/{subject}/`).
4. Visualization medium: CPU raster PNG (silhouette-style, pngjs) vs SVG plan/elevation plot.
5. Whether the sketch writer is a pin-guarded record writer (it commits records → likely yes).

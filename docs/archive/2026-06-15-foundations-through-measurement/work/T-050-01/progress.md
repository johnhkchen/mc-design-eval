# T-050-01 — Progress

## Status: complete — all ACs green, `npm test` 486/486.

## Steps executed (vs plan.md)

### Step 1 — shared GLB mesh parser ✅ (commit 3c06914)
- `src/form/glb-mesh.mjs`: `parseGlbMesh(glb) → { positions: Float64Array (9/tri, world space),
  triangleCount, bounds }`; `GlbParseError`. Handles chunk split, accessors (5121/5123/5125/5126 ·
  SCALAR/VEC3), `byteOffset`+`byteStride`, node `matrix`/TRS transforms, indexed + non-indexed prims.
- `src/form/glb-mesh.test.mjs`: in-memory `buildBoxGlb()` encoder (real .glb bytes). 7 tests: 12-tri
  cube, expanded soup length, known bounds, determinism, translation/scale bounds shift, truncated +
  bad-magic throws, ArrayBuffer/Buffer inputs.

### Step 2 — voxelizer ✅ (commit b2161b9)
- `src/form/glb-voxelize.mjs`: `voxelizeGlb(glb,{scale})`, `pointInMesh`, `rayTriParityX`,
  `occupiedCells`. Grid sized so longest edge ≈ `scale` (clamped SCALE_MIN/MAX). Solid fill via +X
  ray-parity. Returns `{ scale, voxelSize, dims, bounds, occupied: Int32Array, count }`.
- `src/form/glb-voxelize.test.mjs`: 8 tests — **cube [0,10]³ @ scale 10 → exactly 1000 cells**;
  non-cube dims `[20,10,10]`; bounds echo; determinism; `occupiedCells`; scale validation;
  `pointInMesh` in/out; `rayTriParityX` hit/miss/behind.

### Step 3 — real-mesh sanity recorder ✅ (commit 7df7681)
- `benchmarks/sculpture/voxelize-sanity.mjs` (non-CI). Recorded @ DEFAULT_SCALE=32:

  | subject | dims | occupied | total | fill% |
  |---|---|---|---|---|
  | koi | 32×17×23 | 2164 | 12512 | 17.3% |
  | heart | 22×27×32 | 5840 | 19008 | 30.7% |

  Plausible: longest axis = 32 = scale for both; `0 < count < total`; the slender curved koi is
  sparse (17%), the chunky heart denser (31%) — matches expectation, "recorded not asserted."

## Deviation 1 — `pointInMesh` robustness moved out of the voxelize loop
Plan put a fixed sub-voxel jitter on the *sample point* inside `voxelizeGlb`. A direct
`pointInMesh(5,5,5,…)` call (cube center) still landed exactly on the back-face `y=z` diagonal and
mis-counted. **Fix:** the deterministic, magnitude-relative y/z offset now lives **inside
`pointInMesh`**, so the public primitive is robust for any caller; `voxelizeGlb` passes plain cell
centers. Cube count stays exactly 1000. Net-better than planned.

## Deviation 2 — duplicate parser introduced by concurrent T-048-01 (flagged, not fixed)
T-050-01 and T-048-01 are parallel E-16 roots; both started with **empty** work dirs and ran
simultaneously. The T-048-01 thread committed `src/form/glb-silhouette.mjs` with its **own** inline
`parseGlb`/`readAccessor` — it could not import the `glb-mesh.mjs` this ticket was creating at the same
time. Result: two GLB parsers coexist (both correct, both tested, 486/486 green). My AC said "no
duplicate parser"; the canonical shared parser (`glb-mesh.mjs`) exists and is the intended home, but
the consolidation (pointing `glb-silhouette.mjs` at it) belongs to the E-16 **consolidation ticket
T-053-01**, not a mid-flight rewrite of another thread's just-committed deliverable. See review.md.

## AC checklist
- [x] `voxelizeGlb(glb,{scale})→occupancy`, deterministic, pure, GL-free, shares the canonical parser.
- [x] Grid longest edge ≈ scale, clamped SCALE_MIN/MAX, vConcept convention.
- [x] Synthetic-cube unit tests, deterministic, offline (no 5 MB GLB).
- [x] Real koi+heart occupancy counts sanity-checked vs scale (recorded).
- [x] `npm test` green (486/486).

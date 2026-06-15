# T-059-01 Plan — ordered implementation steps

Sequenced from structure.md. Each step is independently committable and verifiable. Testing strategy:
the pure core (`glb-thin.mjs`) is fully unit-tested under `src/**/*.test.mjs` (CI); the live IoU
before/after is a harness run (GL + dwebp, never CI), recorded as committed artifacts.

## Step 1 — `triBoxOverlap` kernel + tests

- Add `src/form/glb-thin.mjs` with the module header (founding question → mechanism → superset
  guarantee → purity boundary) and `export function triBoxOverlap(c, h, v0, v1, v2)`.
- Implement the Akenine-Möller 13-axis SAT over `Float64Array`/number-array vertices, box given as
  center `c[3]` + half-extent `h[3]`:
  - translate triangle so box center is origin;
  - 9 edge×axis cross-product axes (3 tri edges × {x,y,z}) with the projection-radius test;
  - 3 AABB-axis trivial reject (min/max of the 3 verts per axis vs ±h);
  - 1 triangle-normal plane vs box (plane–AABB test).
  - any separating axis ⇒ `false`; degenerate (zero-area) triangle ⇒ `false`.
- Add `src/form/glb-thin.test.mjs` test #4: straddle→true, outside→false, face-coplanar-cross→true,
  degenerate→false.
- **Verify:** `node --test src/form/glb-thin.test.mjs` (kernel cases green).
- **Commit:** `feat(E-18 T-059-01): triangle–box SAT kernel for conservative voxelization`.

## Step 2 — `connectedComponents` diagnostic + tests

- Add `connectedComponents(occupancy, {connectivity=26}) → {count, sizes}` and the internal
  `indexCells` (the `material-clean.mjs` idiom) to `glb-thin.mjs`. Iterative-stack flood fill; neighbor
  offsets = 6 face dirs or 26 box dirs per `connectivity`. `sizes` sorted descending.
- Tests #5: two disjoint blobs → `{count:2}` with right sizes; single blob → 1; diagonal-only touch
  differs under 6 (→2) vs 26 (→1); determinism (two runs equal).
- **Verify:** `node --test src/form/glb-thin.test.mjs`.
- **Commit:** `feat(E-18 T-059-01): pure voxel connected-components diagnostic`.

## Step 3 — `voxelizeGlbThin` (solid ∪ conservative shell) + core tests

- Implement `voxelizeGlbThin(glb, {scale=DEFAULT_SCALE, shell=true, thinScale=null})`:
  reuse `assertScale`; grid-size identically to `voxelizeGlb`; build the solid-fill packed-id `Set` via
  `pointInMesh`; if `shell`, add the surface trace by iterating triangles × their cell-AABB ×
  `triBoxOverlap`; union → deterministic sorted `occupied`; populate
  `thin:{surfaceOnlyCount, components}`. Return the E-16 record shape + the additive `thin` field.
  `thinScale` (opt-in) derives `scale` then proceeds (Option-A knob, off by default).
- Tests #1 (superset: cube count == 1000, identical set), #2 (thin rod: base fragments / thin → 1
  component spanning the rod), #3 (flat plate: `surfaceOnlyCount===0`, identical set), #6 (`shell:false`
  parity == `voxelizeGlb`), #7 (scale validation throws).
- **Verify:** `node --test src/form/glb-thin.test.mjs` (all 7 tests green).
- **Commit:** `feat(E-18 T-059-01): voxelizeGlbThin — solid ∪ conservative-shell occupancy`.

## Step 4 — bow+koi measurement runner + live artifacts

- Add `benchmarks/sculpture/glb-voxel-thin.mjs` (structure.md D6): bow + koi; voxelize base vs thin;
  color both via reused pure `parseGlbColoredSurface`+`sampleSurfaceColors`+`colorVoxelsToArtifact`;
  render @ `SCULPTURE_VIEW_3Q`; `judgeIoU` each; write per-subject artifacts/renders/summary and
  `thin.{md,json}` (form IoU + occupancy + component count, **before/after**). `--offline`, `--subjects`.
- Run live (GLBs are on disk, gitignored): `node benchmarks/sculpture/glb-voxel-thin.mjs`.
  - If `dwebp`/GL/GLBs are unavailable in this environment, the runner **skips** gracefully (breadth's
    discipline) and the before/after numbers are recorded as "not run here" with the offline path noted
    — the pure core + its unit proof still fully satisfy AC #1/#2; AC #3 is satisfied by whatever the
    live run produces or the explained limit. Document the actual outcome in progress.md.
- **Verify:** roll-up `thin.md` shows bow-and-arrow base IoU 0.473 → thin IoU (target: rises, or limit
  explained) and component count not increased (no-dropped-thin check).
- **Commit:** `feat(E-18 T-059-01): bow+koi thin-voxel before/after measurement runner + artifacts`.

## Step 5 — full test gate + handoff docs

- `npm test` (artifact validation self-test + `node --test "src/**/*.test.mjs"`) → green (AC #4).
- Write `progress.md` (what shipped, deviations, the live-run outcome) and `review.md` (changes, test
  coverage, open concerns).
- **Commit:** `docs(E-18 T-059-01): progress + review for thin-feature-preserving voxelization`.

## Testing strategy summary

| AC | how verified | where |
| --- | --- | --- |
| #1 `voxelizeGlbThin` pure/GL-free, shares E-16 parser | imports `parseGlbMesh`; tests run with nothing mocked | `glb-thin.test.mjs` |
| #2 synthetic rod → connected chain; plate unaffected | tests #2, #3 (`connectedComponents`, `surfaceOnlyCount`) | `glb-thin.test.mjs` |
| #3 bow (+koi) form IoU before/after + no-dropped-thin | runner roll-up `thin.{md,json}`; component counts | `glb-voxel-thin.mjs` |
| #4 `npm test` green | full gate | CI |

## Risk register (from design, with the mitigation in-plan)

- SAT boundary off-by-one → pinned by the cube superset==1000 test (Step 3 #1).
- Connectivity not actually achieved on a real GLB → reported honestly in `thin.md`; AC permits
  "limit shown and explained" (Step 4).
- Live GL/dwebp unavailable in this environment → graceful skip; pure proof carries AC #1/#2; numbers
  recorded offline-deferred with the exact command to reproduce (Step 4 note).
- No edits to `glb-voxelize.mjs`/`glb-voxel-build.mjs` → keeps E-16/E-17 lineage + avoids T-058-01
  file collision (parallel root).

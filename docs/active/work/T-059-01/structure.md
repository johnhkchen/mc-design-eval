# T-059-01 Structure — file-level blueprint

The shape of the code for the conservative-shell thin voxelizer (design D1–D6). Not code — interfaces,
boundaries, ordering.

## Files

### CREATE `src/form/glb-thin.mjs`  (the pure core — the deliverable)

GL-free, deterministic, no network. Imports the **shared** parser and the existing solid test; adds the
surface trace, the union, and the connectivity diagnostic. ~180 lines + header.

Imports:
```
import { parseGlbMesh } from "./glb-mesh.mjs";
import { pointInMesh, occupiedCells } from "./glb-voxelize.mjs";
import { SCALE_MIN, SCALE_MAX, DEFAULT_SCALE } from "../sculpture.mjs";
```

Public surface:

- `triBoxOverlap(boxCenter[3], boxHalf[3], v0[3], v1[3], v2[3]) → boolean`
  Exact Akenine-Möller 13-axis SAT (3 AABB axes via triangle-AABB trivial reject, 9 edge×axis cross
  products, 1 triangle-normal plane). Pure, operates on plain numbers/arrays. Exported for direct unit
  testing (the geometry kernel — tested in isolation like `rayTriParityX`).

- `voxelizeGlbThin(glb, opts) → occupancy`
  `opts = { scale = DEFAULT_SCALE, shell = true, thinScale = null }`.
  Returns the **same record shape** as `voxelizeGlb`:
  `{ scale, voxelSize, dims, bounds, occupied: Int32Array, count, thin: {surfaceOnlyCount, components} }`.
  The extra `thin` field is additive (downstream reads only the E-16 fields). Pipeline:
  1. `parseGlbMesh(glb)` → positions, triangleCount, bounds; size the grid exactly as `voxelizeGlb`
     (`voxelSize = max(extent)/scale`, `dims = round(extent/voxelSize)`); reuse the same `assertScale`.
     (If `thinScale` is set, derive `scale` from it — opt-in Option-A knob, off by default.)
  2. **Solid fill**: for each cell center, `pointInMesh` → a `Set` of packed cell ids (`i*ny*nz+j*nz+k`).
  3. **Surface trace** (only if `shell`): for each triangle, compute its cell-AABB; for each cell in it,
     `triBoxOverlap(center, half, v0,v1,v2)` → add packed id to a second `Set`.
  4. **Union** → sorted `[i,j,k]` list (sorted by packed id for deterministic, contract-compatible
     `occupied` order). `surfaceOnlyCount` = |surface ∖ solid| (the D2 thin mask size).
  5. `components` = `connectedComponents(...).count` over the union.
  Throws on degenerate (zero-extent) mesh, same message style as `voxelizeGlb`.

- `connectedComponents(occupancy, opts) → { count, sizes }`
  `opts = { connectivity = 26 }` (6 or 26). BFS/iterative-stack over the `indexCells` Map idiom
  (mirrors `material-clean.mjs`), neighbor offsets per connectivity. Pure; reads only `occupied`/`count`.
  `sizes` sorted descending. Exported (the AC #3 no-dropped-thin-components instrument).

- (internal) `packCell(i,j,k,dims)` / `indexCells(occupancy)` — packing + the `"i,j,k"→n` map, the same
  idiom `material-clean.mjs` uses; kept local (small, no cross-module coupling).

Module header (matching the house style of `glb-voxelize.mjs`): states the founding question (thin
members drop out under center-only sampling), the mechanism (solid parity ∪ conservative surface SAT),
the superset/no-regress guarantee, and the purity boundary.

### CREATE `src/form/glb-thin.test.mjs`  (the unit proof — runs in CI)

Offline, reuses `buildBoxGlb` / `cubeSoup` helpers from `glb-mesh.test.mjs` / `glb-voxelize.test.mjs`.
Tests (AC #1, #2):

1. **Superset / no-regress (the headline):** solid cube `[0,10]³` @ scale 10 — `voxelizeGlbThin` count
   == `voxelizeGlb` count (1000) and identical occupied set. Proves shell ⊆ solid on thick forms and the
   SAT has no boundary off-by-one. (Mirrors the "exactly 1000 cells" assertion.)
2. **Thin rod → connected chain:** a synthetic ~1-unit-thick rod box (long in X, ~0.3 in Y/Z) at a scale
   where the global `voxelizeGlb` **fragments or drops** it (assert its component count > 1 / cells
   missing), while `voxelizeGlbThin` yields **one connected component** spanning the rod
   (`connectedComponents(...).count === 1`, length ≈ rod length in voxels). The central AC #1/#2 proof.
3. **Flat plate unaffected:** a plate already ≥1 voxel thick → thin output equals base output
   (`surfaceOnlyCount === 0`, identical occupied set). AC #2 "a flat plate is unaffected."
4. **`triBoxOverlap` kernel:** triangle straddling a unit cell → true; triangle fully outside → false;
   triangle coplanar with and crossing a face → true; degenerate (zero-area) → false. Isolated geometry.
5. **`connectedComponents`:** two disjoint voxel blobs → count 2 with the right `sizes`; one blob → 1;
   6- vs 26-connectivity differ on a diagonal-only touch (26→1, 6→2). Determinism: two runs equal.
6. **`shell:false` parity:** equals `voxelizeGlb` exactly (escape hatch).
7. Rejects out-of-range / non-integer scale (reuses the `assertScale` contract).

### CREATE `benchmarks/sculpture/glb-voxel-thin.mjs`  (the live measurement — NOT CI)

Mirrors `glb-voxel-breadth.mjs` glue, restricted to bow + koi (D6). Reuses verbatim: `decodeTexture`
(dwebp), `judgeIoU`, `SCULPTURE_VIEW_3Q`, `RENDER_BG`, `loadMeshFromGlb`, `rasterizeSilhouette`,
`renderArtifact`/`renderSummary`. Composes the thin occupancy with the **exported pure**
`parseGlbColoredSurface` + `sampleSurfaceColors` + `colorVoxelsToArtifact` (no edit to glb-voxel-build).

- `SUBJECTS = [{key:"bow-and-arrow", glb, run}, {key:"koi", glb, run}]` (subset of breadth's list).
- For each: build **base** (`voxelizeGlb`) and **thin** (`voxelizeGlbThin`) artifacts → render each →
  `judgeIoU` each → record `{ subject, scale, base:{occupancy,iou,components}, thin:{occupancy,iou,
  components,surfaceOnlyCount}, dIoU }`.
- Emit `glb-voxel-thin/<subject>/{artifact-base.json, artifact-thin.json, render-base-3q.png,
  render-thin-3q.png, summary.json}` and roll-up `glb-voxel-thin/thin.{md,json}`.
- CLI: `node glb-voxel-thin.mjs [scale]`, `--offline` (rebuild roll-up from summaries),
  `--subjects bow-and-arrow,koi`. Absent GLB → skipped, never hard error (breadth's discipline).
- Guarded `if (import.meta.url === ...)` main; exports `{SUBJECTS, buildThinRollup, runThin}` for parity
  with breadth.

## Module boundaries (the load-bearing split)

```
parseGlbMesh ──┐                         (shared parser, glb-mesh.mjs — NO duplicate)
pointInMesh ───┤  src/form/glb-thin.mjs  → voxelizeGlbThin / triBoxOverlap / connectedComponents
occupiedCells ─┘     (PURE, GL-free, CI-tested)
                          │
                          ▼  (occupancy, same shape as voxelizeGlb)
   benchmarks/sculpture/glb-voxel-thin.mjs  (IMPURE glue: dwebp + GL render + IoU judge)
        composes → parseGlbColoredSurface · sampleSurfaceColors · colorVoxelsToArtifact (pure, reused)
```

- **Pure / CI:** `glb-thin.mjs` (+ test). Nothing mocked; under `src/**/*.test.mjs`.
- **Impure / harness-only:** `glb-voxel-thin.mjs` — owns dwebp + GL, like every sibling runner.
- **Untouched:** `glb-voxelize.mjs`, `glb-mesh.mjs`, `glb-voxel-build.mjs` (D5). No sibling-file
  collision with T-058-01 (which lives in color/material modules).

## Ordering of changes (each independently committable)

1. `triBoxOverlap` + its tests (the geometry kernel, isolated).
2. `connectedComponents` + its tests (the diagnostic, isolated).
3. `voxelizeGlbThin` (union of solid + shell) + the superset / rod / plate / parity tests.
4. The bow+koi runner; run it live; commit the artifacts + `thin.{md,json}` summary.
5. `npm test` green gate; progress.md / review.md.

## Public API delta (summary)

| symbol | file | kind | consumers |
| --- | --- | --- | --- |
| `voxelizeGlbThin` | `src/form/glb-thin.mjs` | new | runner; later T-060 integration |
| `triBoxOverlap` | `src/form/glb-thin.mjs` | new | tests; internal |
| `connectedComponents` | `src/form/glb-thin.mjs` | new | runner (no-dropped-thin check); tests |

No symbols changed or removed. Purely additive.

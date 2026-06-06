# T-048-01 — Structure: file-level blueprint

## Files

| File | Action | Purpose |
|---|---|---|
| `src/form/glb-silhouette.mjs` | **create** | Pure GLB→silhouette rasterizer + `import.meta` CLI |
| `src/form/glb-silhouette.test.mjs` | **create** | Offline unit tests (synthetic cube + tiny GLB) |
| `benchmarks/sculpture/glb/silhouette/` | **create (dir, gitignored)** | AC #3 koi sanity PNG lands here |

No existing file is modified. The module is **additive** — it does not touch `form-target.mjs`
(that wiring is T-049-01). `.gitignore` already excludes `benchmarks/sculpture/glb/*.glb`; the
PNG output goes under `benchmarks/sculpture/glb/silhouette/` which is also under the gitignored
`glb/` tree (verify the glob covers it; if not, add `benchmarks/sculpture/glb/silhouette/`).

---

## `src/form/glb-silhouette.mjs` — internal organization

Top-of-file header docblock in the house style (purpose, the seam it feeds, the honesty ledger:
"silhouette ≠ form", "matches the build camera only up to normalization", "no backface cull by
design"). Imports: `framedCamera`, `boxOf` *(via the adapter)* from `../../render/src/camera.mjs`;
`SCULPTURE_VIEW_3Q` from `../sculpture.mjs`; `Vec3` only if needed (camera returns Vec3 already —
read `.x/.y/.z`). No fs/pngjs/THREE at module scope.

### Public exports (the pure surface)

```
export const GLB_SILHOUETTE_SCHEMA = "glb-silhouette/v1"
export const SILHOUETTE_DEFAULTS = Object.freeze({ width: 512, height: 512 })

// --- GLB parse ---
export function parseGlb(bytes)            // → { json, bin: Uint8Array }
export function loadMeshFromGlb(bytes)     // → { positions: Float64Array, indices: Uint32Array,
                                           //     bounds: { min:[x,y,z], max:[x,y,z] }, triCount }

// --- camera (adapter over render/src/camera.mjs) ---
export function cameraForMeshBounds(bounds, view)  // → framedCamera result for a CONTINUOUS box

// --- projection ---
export function projectPoint(p, cam, width, height)  // → { x, y, w }  (w = −zc; w≤0 ⇒ behind)

// --- the rasterizer ---
export function rasterizeSilhouette(mesh, opts)
//   opts: { view?, width?, height?, region? }  (region = 3-D AABB {min,max} | undefined)
//   → { w, h, data: Uint8Array, fgCount, bbox }   // SAME shape as extractSilhouette()
```

### Private helpers (module-local, not exported)

- **mat4 math** (row-major flat `Float64Array(16)` or nested — pick one, document it):
  `mat4Identity()`, `mat4Multiply(a,b)`, `mat4FromTRS(t,q,s)`, `mat4FromArray(a)`,
  `transformPoint(m, p)` (applies translation; w-divide not needed for affine node matrices).
- **GLB chunk reader**: `readGlbChunks(dv, bytes)` → `{ jsonText, bin }` using the magic/type
  constants (`GLTF_MAGIC = 0x46546c67`, `CHUNK_JSON = 0x4E4F534A`, `CHUNK_BIN = 0x004E4942`).
- **accessor reader**: `readAccessor(gltf, bin, accessorIndex)` → typed view honoring
  `componentType` (5126 FLOAT / 5121 UBYTE / 5123 USHORT / 5125 UINT), `type` (VEC3/SCALAR),
  `byteOffset` (accessor + bufferView), and `byteStride` (interleaved buffers).
- **scene walk**: `eachMeshNode(gltf, cb)` — DFS from `scenes[scene].nodes`, accumulating the
  world matrix; invokes `cb(node, worldMatrix)` for nodes with a `mesh`.
- **edge function** `edge(ax,ay,bx,by,cx,cy)` and the per-triangle fill loop.
- **region rect**: `projectedRegionRect(region, cam, w, h)` → `{x0,y0,x1,y1}` clamped to frame
  (integer, half-open), or `null` if every corner is behind the camera.

### Control flow of `rasterizeSilhouette`

1. Merge `view` over `SCULPTURE_VIEW_3Q`; resolve `width/height` (default 512²; honor `view`'s
   own width/height if the caller passed a full view).
2. `cam = cameraForMeshBounds(mesh.bounds, view)`.
3. Allocate `data = new Uint8Array(w*h)`.
4. For each triangle `(i0,i1,i2)` in `mesh.indices`:
   - project the 3 positions → `p0,p1,p2` (each `{x,y,w}`); if **any** `w ≤ 0`, skip the
     triangle (behind-camera guard — avoids divide-by-near-zero artifacts).
   - compute integer screen bbox, clamp to `[0,w)×[0,h)`; skip if empty.
   - `area = edge(p0,p1,p2)`; skip if `|area| < ε`.
   - for each pixel center in the bbox: three edge functions; inside iff all `≥ −ε·|area|` or
     all `≤ ε·|area|`; if inside set `data[idx] = 1`.
5. If `opts.region`: compute `projectedRegionRect`; zero every cell outside it (or empty mask if
   rect is `null`).
6. Recompute `fgCount` + tight `bbox` over `data` (reuse the bbox convention from
   `form-fidelity.mjs` — half-open `{x0,y0,x1,y1}`).
7. Return `{ w, h, data, fgCount, bbox }`.

### `import.meta`-guarded CLI (the only I/O)

```
if (import.meta.url === `file://${process.argv[1]}`) {
  // argv: <input.glb> [output.png] [--region x0,y0,z0,x1,y1,z1]
  // lazy: const { readFileSync, mkdirSync, writeFileSync } = await import("node:fs")
  //       const { PNG } = await import("pngjs")
  // read glb → loadMeshFromGlb → rasterizeSilhouette → encode mask to PNG
  //   (fg=1 → black 0x000000, bg=0 → white 0xFFFFFF; alpha 255)
  // default out: benchmarks/sculpture/glb/silhouette/<basename>-3q.png
  // console.error stats: triCount, fgCount, coverage, bbox  (no secrets, mesh stats only)
}
```

---

## `src/form/glb-silhouette.test.mjs` — test organization

`node:test` + `node:assert/strict`. Groups (mirrors `form-fidelity.test.mjs`/`form-target.test.mjs`
lettered style):

- **A. cube fixture** — a module-local `unitCube()` returning `{positions, indices, bounds}` for
  the cube `[0,1]³` (8 verts, 12 tris, 2 per face).
- **B. parse round-trip** — `tinyCubeGlb()` builds a minimal valid `.glb` `Uint8Array`
  (header + JSON chunk + BIN chunk with 8 float-VEC3 positions + 12 USHORT triangles, padded to
  4-byte alignment); `parseGlb` recovers JSON+bin; `loadMeshFromGlb` recovers `triCount===12`
  and `bounds` matching the cube.
- **C. projection / silhouette shape** — `rasterizeSilhouette(cube)` returns the
  `{w,h,data,fgCount,bbox}` shape; `fgCount > 0`; bbox strictly inside the frame.
- **D. known-view square** — view `{azimuthDeg:0, elevationDeg:0}` (looking down −Z at a face) →
  silhouette aspect ≈ 1 (a square within tolerance); filled (no interior background hole on a
  center row).
- **E. determinism** — two rasterizations byte-identical (`assert.deepEqual(data1, data2)`).
- **F. per-region** — region = right half of the cube in x → `fgCount` strictly less than whole;
  region fully off the object → `fgCount === 0`.
- **G. behind-camera guard** — `projectPoint` of a point behind the eye returns `w ≤ 0`; a
  triangle with a behind vertex contributes nothing (no NaNs in `data`).
- **H. malformed input** — `parseGlb` on bad magic throws; `loadMeshFromGlb` on a primitive
  without `POSITION` throws a named error.

No file > a few KB is constructed; no network; no GL. Runs under `npm run test:unit`.

---

## Ordering of changes (for the Plan)

1. mat4 + GLB parse (`parseGlb`, `loadMeshFromGlb`) + parse tests (B, H).
2. camera adapter + projection (`cameraForMeshBounds`, `projectPoint`) + guard test (G).
3. rasterizer (`rasterizeSilhouette`) whole-object + tests (A, C, D, E).
4. per-region clip + test (F).
5. CLI block + AC #3 koi PNG (manual run, eyeball).
6. `npm test` green; commit.

## Interfaces this ticket must NOT break

- It adds only new exports; nothing imports this module yet, so no caller contract changes.
- The mask shape `{w,h,data,fgCount,bbox}` is a *forward* contract for T-049-01 — it must equal
  `extractSilhouette`'s shape so `normalizeSilhouette` consumes it unchanged.

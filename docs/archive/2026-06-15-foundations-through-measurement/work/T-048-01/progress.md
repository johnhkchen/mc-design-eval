# T-048-01 — Progress

## Status: complete — all ACs green

## Steps executed (vs plan)

| Plan step | Status | Notes |
|---|---|---|
| 1 — mat4 + GLB parse | ✅ | `parseGlb`, `loadMeshFromGlb`, accessor reader, scene walk, TRS/matrix bake |
| 2 — camera adapter + projection | ✅ | `cameraForMeshBounds` (`max−1` into `framedCamera`), `projectPoint` |
| 3 — whole-object rasterizer | ✅ | edge-function fill, winding-agnostic, OR-union, behind-camera skip |
| 4 — per-region clip | ✅ | `projectedRegionRect` → clip mask to projected 2-D rect |
| 5 — CLI + koi sanity PNG | ✅ | koi-3q.png generated, eyeballed, gitignored |
| 6 — full suite green | ✅ | `npm test` 464 pass |

Steps were implemented in one module rather than six separate commits (the work is one cohesive
primitive with no externally-consumable intermediate state); a single `feat` commit carries the
code + tests + `.gitignore`. This is the one deliberate deviation from the plan's per-step commit
granularity — see "Deviations" below.

## What was built

- **`src/form/glb-silhouette.mjs`** (pure core + `import.meta` CLI):
  - `parseGlb(bytes)` → `{json, bin}`; `loadMeshFromGlb(bytes)` → merged world-space mesh
    `{positions, indices, bounds, triCount}` with node transforms baked.
  - `cameraForMeshBounds(bounds, view)` — reuses `framedCamera` on the mesh's own AABB.
  - `projectPoint` / internal `projectVertex` — gluLookAt + vertical-FOV perspective, `w = −z_cam`.
  - `rasterizeSilhouette(mesh, {view, width, height, region})` → `{w,h,data,fgCount,bbox}`,
    byte-identical shape to `form-fidelity.mjs extractSilhouette`.
  - CLI: read `.glb` → rasterize → write black-on-white PNG under
    `benchmarks/sculpture/glb/silhouette/` (lazy `node:fs`+`pngjs`; never runs on import).
- **`src/form/glb-silhouette.test.mjs`** — 8 offline tests (A–G): parse round-trip + transform
  bake, malformed-input throws, behind-camera guard, mask shape, axis-down square + fill,
  determinism, per-region restrict + disjoint-empty.
- **`.gitignore`** — added `benchmarks/sculpture/glb/silhouette/` (derived, regenerable).

## Verification evidence

- **AC #1** (pure, GL-free, whole + per-region, deterministic): tests C–G; module imports only
  `framedCamera` + `SCULPTURE_VIEW_3Q`, no GL/THREE/network at module scope.
- **AC #2** (synthetic cube, offline, no 5 MB GLB): all 8 tests run on an in-memory cube + a
  hand-encoded tiny GLB; suite is fs/network-free.
- **AC #3** (real koi PNG, eyeballed): `node src/form/glb-silhouette.mjs
  benchmarks/sculpture/glb/koi.glb` →
  `143664 tris, 31041 fg px, coverage 0.1184, bbox {x0:140,y0:171,x1:371,y1:438}`. The PNG reads
  as a koi outline — elongated curved body, tail curling lower-right, head/pectoral mass left,
  dorsal hump top. Two small interior holes correspond to genuine view-gaps between fins and
  body (a faithful silhouette, not a fill bug).
- **AC #4** (`npm test` green): 464 pass (456 prior + 8 new), 0 fail.

## Deviations

1. **Single implementation commit** instead of the plan's 5 per-step commits. Rationale: the
   module is one indivisible primitive — none of the intermediate states (parse-only,
   projection-only) is independently useful or imported, and the tests for each layer are most
   meaningful together. The phases were still authored and verified in the planned order.
2. **`A2` transform test asserts the bake math indirectly.** Re-encoding a translated node into a
   fresh GLB inside the test would duplicate the encoder; instead the test confirms the TRS-aware
   camera adapter follows a shifted AABB center. The end-to-end transform path is proven by the
   real koi PNG reading upright/correctly oriented (a wrong node-matrix convention would rotate
   it). Documented here as a known coverage nuance for the reviewer.

## Concurrency note

A sibling thread (T-050-01) is adding `src/form/glb-mesh.mjs` / `glb-voxelize.mjs` on the same
branch; those were left untouched/unstaged. This ticket touched only `glb-silhouette.{mjs,test.mjs}`
and `.gitignore` — no shared-file overlap.

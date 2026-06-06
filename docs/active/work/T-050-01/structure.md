# T-050-01 — Structure: file-level blueprint

## Files created

### 1. `src/form/glb-mesh.mjs` (NEW — the shared parser, ~140 lines)

Pure binary glTF mesh parser. The canonical "no duplicate parser" home; T-048-01 imports this too.

Exports:
- `GLTF_MAGIC`, chunk-type constants (re-stated locally; trivial).
- `parseGlbMesh(glb) → { positions: Float64Array, triangleCount: number, bounds: { min:[3], max:[3] } }`
  - `glb`: `Uint8Array | ArrayBuffer | Buffer`.
  - Steps: validate header → split JSON + BIN chunks → parse JSON → walk `scenes/nodes` composing 4×4
    transforms → for each `mesh.primitives[]` read POSITION + indices accessors → expand indexed tris to
    a flat triangle soup (9 floats/tri) in world space → accumulate AABB.
  - Throws `GlbParseError` (named subclass) on: bad magic, missing BIN chunk, unsupported
    `componentType`/`type`, missing POSITION. Messages name the offense, never dump bytes.
- Internal helpers (not exported, or exported only if a test needs them):
  - `readAccessor(json, bin, accessorIndex) → { array, count, numComponents }` (handles byteOffset,
    byteStride, the 5121/5123/5125/5126 component types).
  - `mat4Identity()`, `mat4FromNode(node)` (matrix or TRS→matrix), `mat4Multiply(a,b)`,
    `mat4TransformPoint(m, x,y,z) → [x,y,z]`.

### 2. `src/form/glb-voxelize.mjs` (NEW — the ticket deliverable, ~120 lines)

Imports `parseGlbMesh` from `./glb-mesh.mjs` and `SCALE_MIN/SCALE_MAX` from `../sculpture.mjs`.

Exports:
- `voxelizeGlb(glb, { scale = DEFAULT_SCALE } = {}) → occupancy` (return shape from design §5).
  - Validate `scale` (integer in `[SCALE_MIN, SCALE_MAX]`; reuse the guard message style).
  - `parseGlbMesh` → positions + bounds.
  - Size grid: `voxelSize = longestExtent / scale`; `dims[axis] = max(1, round(extent/voxelSize))`.
  - For each cell center, `pointInMesh(center, positions, triangleCount)` via +X ray parity → push
    `(i,j,k)` to `occupied` if inside. Lexicographic i→j→k order (deterministic).
  - Return `{ scale, voxelSize, dims, bounds, occupied: Int32Array, count }`.
- `pointInMesh(p, positions, triangleCount) → boolean` (exported for unit testing — ray-parity core).
- `rayTriParityX(ox, oy, oz, ax,ay,az, bx,by,bz, cx,cy,cz) → 0|1` — half-open Möller–Trumbore for a +X
  ray; the determinism-critical primitive (exported for a focused unit test).
- `occupiedCells(occupancy) → Generator<[i,j,k]>` — ergonomic iterator over the flat array.

### 3. `src/form/glb-mesh.test.mjs` (NEW — parser unit tests, ~90 lines)

Builds a **minimal valid `.glb` in memory** (header + JSON chunk + BIN chunk encoding a unit cube: 8
positions, 12 triangles via U16 indices) using a small in-test `buildCubeGlb()` helper. Asserts:
- `parseGlbMesh` returns `triangleCount === 12`, `positions.length === 12*9`.
- `bounds` equals the cube's known AABB.
- Determinism: two parses byte-identical.
- Errors: truncated header throws `GlbParseError`; bad magic throws.
- (If TRS used) a translated node shifts bounds by the translation.

### 4. `src/form/glb-voxelize.test.mjs` (NEW — voxelizer unit tests, ~110 lines)

Uses an **in-memory triangle-soup cube** helper (`cubeMesh(min, size) → {positions, triangleCount,
bounds}`) AND the `.glb` cube from helper to exercise the full `bytes→occupancy` path. Asserts:
- Solid cube spanning `[0,scale]³` voxelized at `scale=S` ⇒ `count === S*S*S` (exact; the half-open
  rule guarantees it). Test `S=10` ⇒ 1000.
- `dims === [S,S,S]`; longest axis = `scale` (use a non-cube AABB, e.g. `[0,20]×[0,10]×[0,10]` at
  `scale=20` ⇒ dims `[20,10,10]`).
- `pointInMesh`: a center point inside ⇒ true; a point outside ⇒ false; a point on the far side ⇒ false.
- `rayTriParityX`: a ray crossing a triangle ⇒ 1; a ray missing it ⇒ 0; a ray grazing a shared diagonal
  counted once across the two triangles of a quad face (no double count).
- Determinism: two voxelizations byte-identical (`occupied` arrays equal).
- Validation: `scale=7` and `scale=65` throw; non-integer throws.

### 5. `benchmarks/sculpture/voxelize-sanity.mjs` (NEW — non-unit recorder, ~40 lines)

CLI: loads `glb/koi.glb` + `glb/heart.glb` **if present** (skip-with-message when absent), runs
`voxelizeGlb` at `DEFAULT_SCALE`, prints a table: subject, dims, count, total cells, fill-fraction.
Not matched by `src/**/*.test.mjs` so it never runs in CI. Numbers recorded in progress.md / review.md.

## Files modified

- None expected. (No edits to `sculpture.mjs`, `form-target.mjs`, `trellis-glb.mjs`, or `package.json` —
  no new dependency, no seam wiring in this ticket.)

## Files deleted

- None.

## Module boundaries

```
benchmarks/sculpture/voxelize-sanity.mjs   (CLI, optional GLB on disk)
            │  imports
            ▼
src/form/glb-voxelize.mjs   ── voxelizeGlb, pointInMesh, rayTriParityX, occupiedCells
            │  imports parseGlbMesh                 │ imports SCALE_MIN/MAX/DEFAULT_SCALE
            ▼                                       ▼
src/form/glb-mesh.mjs  (pure parser)        src/sculpture.mjs (scale convention)
            ▲
            │  (future) imports
src/form/glb-silhouette.mjs   ← T-048-01, not in this ticket
```

## Public-interface contract for T-048-01 (so it does not re-parse)

`parseGlbMesh(glb)` returns `{ positions: Float64Array /* 9 per tri, world space */, triangleCount,
bounds }`. A silhouette rasterizer consumes exactly `positions` + `bounds`; nothing voxel-specific
leaks. This is the shared seam.

## Ordering of changes

1. `glb-mesh.mjs` + its test (parser is the dependency root).
2. `glb-voxelize.mjs` + its test (depends on the parser).
3. `voxelize-sanity.mjs` (depends on the voxelizer; non-blocking).
Each step is independently `npm test`-green and atomically committable.

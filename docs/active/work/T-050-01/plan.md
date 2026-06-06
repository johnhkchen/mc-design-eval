# T-050-01 — Plan: ordered implementation steps

Three commit-sized steps, each `npm test`-green. Testing strategy: pure unit tests on synthetic meshes
(offline, exact); real-GLB numbers recorded by a non-unit script.

## Step 1 — Shared GLB mesh parser (`glb-mesh.mjs` + test)

**Do:**
1. `src/form/glb-mesh.mjs`:
   - `class GlbParseError extends Error`.
   - Header split: validate magic `0x46546c67` + version 2; read chunk 0 (JSON, type `0x4E4F534A`),
     chunk 1 (BIN, type `0x004E4942`). Tolerate a missing BIN only if no geometry is requested (here:
     require it).
   - `readAccessor(json, bin, i)`: resolve accessor → bufferView; compute byteOffset (accessor +
     bufferView), respect `byteStride` (default = tightly packed); decode by componentType
     (5121 U8 / 5123 U16 / 5125 U32 / 5126 F32) and `type` (SCALAR / VEC3). Return
     `{ array, count, numComponents }`.
   - `mat4` helpers: `identity`, `fromNode` (node.matrix column-major, else TRS compose
     T·R·S with quaternion→matrix), `multiply`, `transformPoint`.
   - Scene walk: for each root node recurse with accumulated matrix; when a node has `mesh`, for each
     primitive read POSITION (require) + indices (require; if absent, treat as sequential 0..n-1),
     transform each position by the node matrix, expand indexed triangles into the flat
     `positions` soup, grow AABB.
   - `parseGlbMesh(glb)`: normalize input to `Uint8Array`; returns `{ positions: Float64Array,
     triangleCount, bounds }`.
2. `src/form/glb-mesh.test.mjs`:
   - `buildCubeGlb()` in-test helper: emit a real `.glb` (header + padded JSON chunk + padded BIN
     chunk) for a unit cube `[0,1]³`, 24 or 8 verts, 12 tris, U16 indices, FLOAT positions.
   - Tests: triangleCount 12; positions length 12*9; bounds `{min:[0,0,0],max:[1,1,1]}`; determinism;
     truncated/bad-magic → `GlbParseError`; translated-node bounds shift (TRS path).

**Verify:** `npm run test:unit` green; new parser tests pass.
**Commit:** `feat(E-16 T-050-01): shared GLB mesh parser (glb-mesh.mjs)`

## Step 2 — Voxelizer (`glb-voxelize.mjs` + test)

**Do:**
1. `src/form/glb-voxelize.mjs`:
   - Import `parseGlbMesh`; import `SCALE_MIN/SCALE_MAX/DEFAULT_SCALE` from `../sculpture.mjs`.
   - `rayTriParityX(o..., a..., b..., c...)`: Möller–Trumbore specialized to ray dir `(1,0,0)`;
     half-open `u≥0 && v≥0 && u+v<1`; require `t>EPS`; skip near-parallel (`|det|<EPS`). Return 0/1.
   - `pointInMesh(p, positions, triangleCount)`: sum parity over all triangles; return `(sum & 1)===1`.
   - `voxelizeGlb(glb, {scale=DEFAULT_SCALE})`: validate scale; parse; compute `voxelSize`, `dims`;
     triple loop over cells, center = `min + (i+.5,j+.5,k+.5)*voxelSize`; push occupied `(i,j,k)`.
     Return `{ scale, voxelSize, dims, bounds, occupied: Int32Array, count }`.
   - `occupiedCells(occ)` generator.
2. `src/form/glb-voxelize.test.mjs`:
   - `cubeMesh(min,size)` helper returning triangle-soup directly (fast, no GLB encode) for
     pointInMesh/voxelize geometry tests; plus reuse `buildCubeGlb`-style bytes for one full
     `bytes→occupancy` path test.
   - Assertions per structure §4: count `=== S³` (S=10 ⇒ 1000); non-cube dims `[20,10,10]`;
     pointInMesh in/out; rayTriParityX hit/miss/shared-diagonal-once; determinism; scale validation.

**Verify:** `npm test` (full, incl. artifact self-tests) green.
**Commit:** `feat(E-16 T-050-01): voxelizeGlb occupancy (ray-parity solid fill)`

## Step 3 — Real-mesh sanity recorder (`voxelize-sanity.mjs`)

**Do:**
1. `benchmarks/sculpture/voxelize-sanity.mjs`: for `koi.glb`, `heart.glb` under
   `benchmarks/sculpture/glb/`, if the file exists, `voxelizeGlb` at `DEFAULT_SCALE`, print
   `subject | dims | count | totalCells | fill%`. If absent, print a skip line (gitignored).
2. Run it (the real GLBs are on disk locally), capture the table.
3. Record the numbers in `progress.md` (and surface in `review.md`) — "recorded, not asserted."

**Verify:** script runs; numbers plausible (0 < count < totalCells; chunky body denser than thin form).
**Commit:** `feat(E-16 T-050-01): real koi/heart voxel occupancy sanity recorder`

## Testing strategy summary

| Concern | Coverage |
|---|---|
| GLB binary parse (accessors, chunks, node TRS) | `glb-mesh.test.mjs`, synthetic in-memory `.glb` |
| Grid sizing / scale convention | `glb-voxelize.test.mjs` non-cube AABB → dims |
| Occupancy correctness (solid count exact) | `glb-voxelize.test.mjs` cube ⇒ S³ |
| Ray-triangle determinism + shared-edge dedup | `rayTriParityX` focused tests |
| Scale validation (bounds, integer) | throws tests |
| Real-mesh plausibility | `voxelize-sanity.mjs` (recorded) |

## Verification criteria (maps to AC)

- `voxelizeGlb(glb,{scale})→occupancy`, pure/GL-free, shares parser ✅ Step 1+2.
- Longest edge ≈ scale, clamped to SCALE_MIN/MAX ✅ Step 2 + dims test.
- Synthetic-cube unit test, deterministic, offline ✅ Step 2.
- Real koi+heart counts sanity-checked & recorded ✅ Step 3.
- `npm test` green ✅ each step.

## Risks / mitigations

- **Edge degeneracy in ray parity** → half-open barycentric rule + fixed EPS (tested directly).
- **Interleaved/strided buffers** → `readAccessor` honors `byteStride`; cube test uses tight packing,
  but the code path is written for both. (TRELLIS GLBs are typically tightly packed.)
- **Node transforms ignored** → scene walk composes matrices; TRS test covers it.
- **Concurrent file creation with T-048-01** → only *new* files here; lisa lock serializes commits.

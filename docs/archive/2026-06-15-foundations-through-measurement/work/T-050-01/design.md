# T-050-01 — Design: GLB Voxelize Occupancy

Decisions for `voxelizeGlb(glb, { scale }) → occupancy`, grounded in Research.

## Decision 1 — Where the shared parser lives

T-050-01 must "share the GLB mesh parse with T-048-01 (no duplicate parser)", but **neither parser
exists yet** and both tickets are parallel roots. Options:

- **(A) New standalone module `src/form/glb-mesh.mjs`** exporting `parseGlbMesh(glb) → { positions,
  indices, triangleCount, bounds }`. Both `glb-voxelize.mjs` (this ticket) and the future
  `glb-silhouette.mjs` (T-048-01) import it. ✅
- (B) Put the parser inside `glb-voxelize.mjs` and have T-048-01 import from there. ✗ couples a
  silhouette rasterizer to a voxelizer; wrong home.
- (C) Extend `trellis-glb.mjs` (`inspectGlb`'s neighbour). ✗ that file is a Modal **network client** in
  `benchmarks/`, not core `src/`; a pure geometry parser does not belong beside a fetch client.

**Chosen: (A).** A dedicated `src/form/glb-mesh.mjs` is the natural shared home — `src/form/` already
holds the form-fidelity/form-target geometry code, and a single-responsibility parser is exactly what
"no duplicate parser" wants. T-048-01 (still in `design`) will import it; this ticket documents that
contract. **Concurrency note:** both tickets touching `src/form/` is real; the lisa file-lock
serializes commits, and creating a *new* file (not editing a shared one) minimizes conflict surface.

## Decision 2 — Parser scope

`parseGlbMesh` must turn raw `.glb` bytes into a flat triangle soup:

- Read header (reuse the magic/version logic, but we need full chunk parsing, not just `inspectGlb`).
- Walk JSON chunk → for **every** mesh primitive: read `POSITION` accessor (FLOAT VEC3) and `indices`
  accessor (U8/U16/U32). Dereference accessor → bufferView → BIN-chunk slice. Honor `byteOffset` and
  `byteStride` (interleaved buffers).
- Compose **node transforms**: walk `scenes[].nodes[]` recursively, multiply parent×local (matrix or
  TRS) 4×4, apply to each primitive's positions. The sculpture GLBs are a single untransformed mesh, so
  this is mostly identity — but a correct parser handles it, and it makes the synthetic-mesh tests
  faithful. Keep a tiny 4×4 helper (compose, multiplyVec) inline; no dependency.
- Output: `positions` (Float64Array, 9 floats per triangle — expanded through indices so the voxelizer
  needs no index indirection), `triangleCount`, and axis-aligned `bounds { min:[x,y,z], max:[x,y,z] }`.

Rejected: a streaming/lazy parser. The meshes are ~5 MB; eager expansion to ~144k triangles ×9 floats
≈ 10 MB of doubles is fine and keeps the voxelizer trivial.

## Decision 3 — Grid sizing (the vConcept invariant)

Longest mesh edge ≈ `scale` voxels. Algorithm:

```
extent = bounds.max - bounds.min            (per axis)
longest = max(extent.x, extent.y, extent.z)
voxelSize = longest / scale                 (world units per voxel)
dims.axis = max(1, round(extent.axis / voxelSize))   // = scale on the longest axis
```

`scale` validated as integer in `[SCALE_MIN, SCALE_MAX]` via the same guard `sculptureScaleCaps` uses
(reuse its message shape). The longest axis gets exactly `scale` cells; shorter axes scale
proportionally — same envelope a text→JSON build at that `scale` would target. Grid origin =
`bounds.min`; cell `(i,j,k)` center world coords = `min + (i+0.5, j+0.5, k+0.5) * voxelSize`.

## Decision 4 — Occupied/empty test: solid via ray-parity

Two AC-sanctioned options: ray-cast parity (point-in-mesh, **solid**) vs triangle-vs-cell (**shell**).

- **Chosen: ray-parity (even–odd), solid fill.** From each cell center cast a ray along +X; count
  triangles it crosses with `t > 0`; **odd ⇒ inside ⇒ occupied**. Watertight TRELLIS meshes make this
  well-defined, it yields the "dense" reading the AC expects, and a solid synthetic cube gives an
  **exact** testable count (`scale³`-ish). A downstream color/build stage wants a filled volume, not a
  hollow shell, so solid is the right default for Arm B.
- Rejected (for now): triangle-vs-cell shell. Hollow, surface-only; harder to assert exactly; defer to a
  future `{ mode: 'shell' }` option if S-051 wants a hollow build. Note it as a seam, don't build it.

**Determinism / robustness:** Möller–Trumbore ray-triangle with a **half-open barycentric rule**
(`u ≥ 0 && v ≥ 0 && u+v < 1`, plus a sign-consistent `t > eps`). Half-open ownership means a ray
grazing the diagonal shared by two triangles of a flat face is counted **once**, not zero/two — this is
what keeps the cube count exact and the function deterministic. Parallel rays (denominator ≈ 0) are
skipped. A fixed `EPS = 1e-9` (no `Math.random`, no time) preserves determinism for resume/replay.

## Decision 5 — Return shape

```
voxelizeGlb(glb, { scale }) → {
  scale,                          // echoed
  voxelSize,                      // world units / voxel
  dims:   [nx, ny, nz],           // grid resolution
  bounds: { min:[x,y,z], max:[x,y,z] },   // world AABB the grid spans
  occupied: Int32Array,          // flat (i,j,k) triples, length = 3*count
  count,                          // occupied cell count
}
```

`occupied` as a flat `Int32Array` of `(i,j,k)` triples is compact, ordering-deterministic (lexicographic
i→j→k), and trivially consumed by T-051-01 (color) without re-deriving geometry. A `Set` of string keys
was rejected: stringly-typed, larger, iteration order less obvious. Helper `occupiedCells(occ)` can
yield `[i,j,k]` tuples for ergonomics in tests.

## Decision 6 — Real-mesh sanity (recorded, not asserted)

AC wants koi+heart counts "recorded, not asserted" and unit tests offline. So:

- Unit tests (`glb-voxelize.test.mjs`, `glb-mesh.test.mjs`) use **in-memory synthetic GLBs** (a
  hand-built cube, both as a raw triangle mesh for the voxelizer and as a real minimal `.glb` byte
  buffer for the parser). Exact assertions; no file I/O.
- A separate **non-unit** script `benchmarks/sculpture/voxelize-sanity.mjs` loads the real GLBs **if
  present** (skips gracefully when gitignored/absent), voxelizes at `DEFAULT_SCALE`, prints
  `count`, `dims`, fill-fraction. Its numbers get pasted into `progress.md` / `review.md`. Plausibility
  expectation: solid fill ⇒ `count` is a large fraction of `nx*ny*nz` for a chunky body, well below for
  thin/curved subjects; both `> 0` and `< nx*ny*nz`.

## What this ticket does NOT do

No color (T-051-01), no `DesignArtifact` compile, no render, no loop/seam wiring (S-049/S-052), no
`shell` mode, no new npm dependency. Pure `bytes → occupancy`.

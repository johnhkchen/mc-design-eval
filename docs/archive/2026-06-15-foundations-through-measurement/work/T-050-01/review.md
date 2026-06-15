# T-050-01 — Review: GLB Voxelize Occupancy

Handoff for a human reviewer. The geometry half of E-16 Arm B (image→3D): GLB **mesh → occupancy
voxel grid** at a target `scale`. Pure, GL-free, deterministic. No color, no DesignArtifact, no loop
wiring (those are T-051-01 / S-052).

## What changed

**Created**
- `src/form/glb-mesh.mjs` (~210 lines) — shared binary-glTF mesh parser. `parseGlbMesh(glb) →
  { positions: Float64Array (9 floats/triangle, world space), triangleCount, bounds }`. Manual DataView
  reads; accessors (componentType 5121/5123/5125/5126 × SCALAR/VEC3), `byteOffset`+`byteStride`, node
  `matrix`/TRS composition, indexed + non-indexed primitives. `GlbParseError` for malformed input. No
  new dependency.
- `src/form/glb-mesh.test.mjs` (~140 lines) — `buildBoxGlb()` in-memory .glb encoder + 7 parser tests.
- `src/form/glb-voxelize.mjs` (~130 lines) — `voxelizeGlb`, `pointInMesh`, `rayTriParityX`,
  `occupiedCells`. Solid fill via +X ray-cast parity; grid sized to the vConcept scale convention.
- `src/form/glb-voxelize.test.mjs` (~110 lines) — 8 voxelizer tests.
- `benchmarks/sculpture/voxelize-sanity.mjs` (~45 lines) — non-CI real-GLB occupancy recorder.

**Modified / deleted:** none. (No edits to `sculpture.mjs`, `form-target.mjs`, `package.json`.) The
modified ticket frontmatter (`T-048/049/050.md`) is Lisa's phase tracking, not my edit.

## Design decisions a reviewer should know

1. **Solid (not shell) occupancy** via even–odd ray parity — TRELLIS meshes are watertight, and a
   downstream color/build stage wants a filled volume. A `{mode:'shell'}` (triangle-vs-cell) option is
   noted as a future seam, not built.
2. **Determinism at edges.** A naïve +X ray double-/zero-counts when it grazes a shared triangle edge
   or face diagonal (a cube center has `y==z`). Resolved by a fixed, magnitude-relative sub-coordinate
   offset *inside* `pointInMesh` (no randomness, no time) — so the solid-cube count is **exact**
   (`scale³`) and replay/resume-safe. This is the subtlest part of the change; the cube=1000 test is
   the proof.
3. **Scale convention parity.** `voxelSize = longestExtent / scale`, `dims[axis] =
   max(1, round(extent/voxelSize))` → longest axis is exactly `scale` cells, same envelope a text→JSON
   build targets at that scale. `scale` validated as integer in `[SCALE_MIN, SCALE_MAX]`.

## Test coverage

`npm test` → **486/486 green** (was 464 pre-ticket; +22 here split across the two new suites).

| Area | Test | Strength |
|---|---|---|
| Binary parse (chunks, accessors, TRS) | glb-mesh.test.mjs ×7 | strong; real .glb bytes, exact bounds |
| Exact occupancy / scale sizing | cube→1000, box→[20,10,10] | strong; exact integer assertions |
| Ray primitive | rayTriParityX hit/miss/behind | adequate |
| Determinism | repeat-equal on parse + voxelize | strong |
| Validation | scale out-of-range / non-integer throws | strong |
| Real meshes | voxelize-sanity.mjs (recorded) | sanity only, not asserted (by design) |

**Recorded real-mesh numbers** (scale 32): koi 32×17×23, 2164 cells, 17.3% fill; heart 22×27×32,
5840 cells, 30.7% fill. Slender koi sparse, chunky heart denser — as expected.

## Coverage gaps / limitations

- **No interleaved/strided real fixture.** `readAccessor` honors `byteStride`, but the synthetic .glb
  is tightly packed; the strided path is exercised only by code inspection. TRELLIS GLBs are tightly
  packed, so this is low-risk, but a strided unit fixture would close it.
- **Performance is O(cells × triangles)**, naïve. 11–19 s per real mesh at scale 32 (144k tris). Fine
  for an offline sanity script and for T-051-01's one-shot voxelize, but **not** for a tight loop. If a
  later ticket voxelizes repeatedly, add a triangle spatial index / per-scanline bucketing (the ray is
  axis-aligned, so a YZ-bucketed triangle list would cut this by ~1–2 orders of magnitude). Flagged,
  not needed now.
- **Solid-only.** Hollow/shell mode deferred.

## ⚠ Critical concern for human attention — duplicate GLB parser

T-050-01 and T-048-01 are **parallel E-16 roots** that ran **concurrently**, both starting from empty
work dirs. This ticket created the canonical shared parser `src/form/glb-mesh.mjs` (per the AC: "no
duplicate parser"). The T-048-01 thread, unable to see it mid-flight, committed
`src/form/glb-silhouette.mjs` with its **own** inline `parseGlb` + `readAccessor`. **Both parsers now
coexist** — both correct, both tested, suite fully green.

- **Why not fixed here:** rewriting another thread's just-committed deliverable mid-run risks a
  lock/merge conflict and oversteps this ticket's scope.
- **Where it belongs:** E-16's terminal **consolidation ticket T-053-01** ("GLB-grounded
  consolidation"). Recommended action there: point `glb-silhouette.mjs` at `parseGlbMesh` (the
  silhouette rasterizer needs per-vertex positions + bounds, which `parseGlbMesh` already returns), and
  delete the duplicate `parseGlb`/`readAccessor`. The two parsers agree on the glTF subset, so this is
  mechanical.
- **Root cause for the DAG:** if a single shared parser was required before either consumer, S-048 and
  S-050 should have shared a parser-only predecessor ticket rather than both being independent roots.

## Verdict

All acceptance criteria met; pure/deterministic/GL-free as required; real meshes voxelize plausibly.
One cross-ticket concurrency artifact (duplicate parser) flagged for T-053-01. Ready for review.

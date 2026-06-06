# T-059-01 Design — thin-feature-preserving voxelization

The decision: how `voxelizeGlbThin` keeps sub-voxel-thin members alive while leaving thick forms
(and the downstream occupancy contract) untouched. Grounded in research.md.

## The core problem, restated as a choice

`voxelizeGlb` decides occupancy by a **single point-in-mesh test at each cell center**. A member
thinner than `voxelSize` only registers where a center happens to land inside it → dropouts / severed
chains (bow string + stave + arrow shaft: IoU 0.473). We need occupancy to react to the **cell's volume
or the surface passing through it**, not just its center — without changing thick regions.

## Options

### Option A — global scale bump (per-subject)

Raise `scale` until the thin axis spans ≥1 voxel. **Rejected as a solution** (kept as a minor opt-in
knob): to make a ~0.3-unit string span 1 voxel against a ~30-unit bow needs `scale ≈ 100` — above
`SCALE_MAX=64` — and grows the grid cubically (and the artifact placement count with it). It also
*over-resolves the thick parts* we already render well. It treats a local problem with a global hammer.

### Option B — per-voxel supersampling of the solid test

Sample an N³ grid of sub-points per cell; occupy if **any** sub-point is `pointInMesh`. This thickens
any member grazing the cell volume up to 1 voxel. Pure, deterministic, reuses `pointInMesh` verbatim.
But: cost is N³× the ray-parity work per cell (already O(triangles) each), and a sub-voxel **surface**
(an infinitely thin sheet with no interior) can still slip *between* sub-samples — supersampling fixes
*near-sub-voxel solids*, not true thin shells. Connectivity is **not guaranteed** (still center-ish
sampling, just denser). Helps, but doesn't *guarantee* the AC's "connected chain, never severed."

### Option C — conservative (surface) voxelization, unioned with the solid fill  ✅ CHOSEN

Two occupancy sources, unioned:

1. **Solid fill** — the existing `pointInMesh` parity test (unchanged): the thick interior.
2. **Surface trace** — mark **every voxel whose AABB overlaps any triangle** (exact triangle–box SAT,
   Akenine-Möller, 13 axes). This captures the mesh *surface* regardless of thickness: a sub-voxel rod's
   triangles each mark the voxels they pass through → a continuous ~1-voxel tube.

`occupancy = solidFill ∪ surfaceTrace`.

**Why it guarantees connectivity.** A thin member's surface is a *connected manifold of triangles*
spanning its length. Conservative voxelization of two edge-adjacent triangles marks the shared edge's
voxels from both → their voxel sets touch (≥26-connected). So a connected surface ⇒ a connected voxel
set. The string/stave/shaft survive as connected chains by construction, not by luck.

**Why it never harms thick forms.** Where the mesh is ≥1 voxel thick, the surface trace is a subset of
the solid fill (every surface voxel is also interior-adjacent and parity-filled), so `solid ∪ surface =
solid` — **bit-identical to `voxelizeGlb`**. The thin pass only *adds* the cells the solid fill missed.
A flat plate already ≥1 voxel: surface ⊆ solid ⇒ "unaffected" (AC #2). This monotone-superset property
is the safety guarantee — no regression on the 6 already-good subjects.

**Cost.** Triangle–box SAT iterates only each triangle's small AABB of voxels (a thin rod's triangles
touch a handful of cells each). It runs in the runner, never CI; unit tests use tiny synthetic meshes.

### Option D — detect-then-repair (medial axis / distance transform + bridging)

Explicitly compute local mesh thickness (medial axis), flag thin members, voxelize them at finer local
resolution, and bridge gaps. **Rejected**: medial-axis on a triangle soup is a large, fiddly, new
geometry module; "finer local resolution" means a non-uniform grid that *breaks the occupancy contract*
(downstream assumes one global `voxelSize`). Option C achieves the same guarantee with far less
machinery and no contract change. We borrow only its *diagnostic* idea (below).

## Decisions

### D1 — Conservative-shell union is the mechanism (Option C)

`voxelizeGlbThin` returns the **same record shape** as `voxelizeGlb` (`{scale, voxelSize, dims, bounds,
occupied, count}`) so it is a drop-in for `sampleSurfaceColors` / `colorVoxelsToArtifact` /
`materialCleanVoxel`. One uniform grid; no contract change. A `shell:false` opt makes it fall back to
exactly `voxelizeGlb` (parity escape hatch, used in tests to prove the superset property).

### D2 — "Thin" is *surface ∖ solid*, no medial axis

The computable thin signal: cells the **surface trace added that the solid fill did not contain**. These
are exactly the places the mesh is sub-voxel thick. This gives a free, exact thin-member mask for the
AC #3 diagnostic — no thickness threshold to tune, no medial axis. (A `thinScale` knob from Option A is
offered but **off by default**; the shell union is the real fix.)

### D3 — Triangle–box overlap by exact SAT, specialized to axis-aligned voxels

Implement the standard 13-axis separating-axis test (3 box face normals = the AABB trivial-reject, the
triangle normal, 9 edge×axis cross products). Exact and deterministic over `Float64Array`. Reject by the
triangle's own AABB vs the cell AABB first (cheap). Half-open cell ownership and a tiny shared epsilon
match `pointInMesh`'s coincidence discipline so a triangle grazing a cell face is decided consistently.

### D4 — Connectivity diagnostic, not forced repair

Add a pure `connectedComponents(occupancy, {connectivity:26})` (BFS over the `indexCells` map idiom from
`material-clean.mjs`, 6- or 26-neighborhood). It reports `{count, sizes}`. We **rely on C's structural
guarantee** rather than mutating occupancy to bridge gaps — bridging would invent geometry the mesh does
not have. The runner records component counts before/after; the AC's "no-dropped-thin-components" check
is: thin members are not isolated (the thin mask's cells are part of the main component, and the overall
component count does not *increase* vs the solid-only build). If a real GLB shows a stubborn gap we log
it as a finding (the AC permits "or the limit is shown and explained"), not a silent repair.

### D5 — No change to `glb-voxel-build.mjs` or `glb-voxelize.mjs`

New code lives in a new module `src/form/glb-thin.mjs` (the triangle–box SAT + `voxelizeGlbThin` +
`connectedComponents`). It **imports** `parseGlbMesh` (shared parser — AC: no duplicate) and the existing
`pointInMesh` / `occupiedCells` from `glb-voxelize.mjs`. The runner composes the thin occupancy with the
**already-exported pure** `sampleSurfaceColors` + `colorVoxelsToArtifact`. Keeping `glb-voxelize.mjs`
untouched preserves the E-16/E-17 lineage and avoids the sibling-file-collision risk with T-058-01.

### D6 — Measurement runner mirrors `glb-voxel-breadth.mjs`, restricted to bow + koi

`benchmarks/sculpture/glb-voxel-thin.mjs`: for `{bow-and-arrow, koi}`, voxelize **both** ways → color via
the shared path → render @ `SCULPTURE_VIEW_3Q` → `judgeIoU` (reused verbatim). Emit
`glb-voxel-thin/<subject>/{artifact-base.json, artifact-thin.json, render-*.png, summary.json}` and a
roll-up `thin.{md,json}` with **form IoU before/after**, occupancy before/after, and **component counts**
(the no-dropped-thin check). GL + `dwebp`, never in `npm test`. `--offline` rebuilds the roll-up from
summaries, like breadth.

## What this explicitly does *not* do

- No non-uniform / adaptive grid (breaks the occupancy contract; Option D).
- No medial-axis thickness computation (Option D); thin = surface∖solid suffices (D2).
- No occupancy *repair*/bridging (D4) — structural guarantee + honest reporting instead.
- No edits to `glb-voxelize.mjs` or `glb-voxel-build.mjs` (D5).
- Sword is out (no GLB; T-061 routing finding).

## Risks & mitigations

- **R1: conservative trace over-thickens a thin sheet to 1 voxel everywhere.** Acceptable — 1 voxel is
  the minimum representable; the alternative is dropout. Thick forms are unaffected (superset property).
- **R2: a degenerate (zero-area) triangle has no SAT plane.** Skip it (its AABB is a line/point; covered
  by trivial reject) — same robustness `parseGlbMesh` already needs.
- **R3: SAT off-by-one at cell boundaries.** Pinned by the synthetic cube test — `shell` on a solid cube
  must reproduce `voxelizeGlb`'s exact count (the superset collapses to equality), the strongest single
  assertion (mirrors `glb-voxelize.test.mjs`'s "exactly 1000 cells").
- **R4: bow IoU doesn't clear 0.473.** AC allows "limit shown and explained." Conservative trace can only
  *add* true-surface cells, so silhouette area can only rise toward the GLB's own silhouette — a rise is
  expected; the magnitude is the empirical finding.

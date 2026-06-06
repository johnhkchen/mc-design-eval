# T-059-01 Progress — thin-feature-preserving voxelization

Status: **complete**. All plan steps executed; `npm test` green (563/563); the live bow+koi
before/after measurement ran and confirms the fix.

## Steps completed

### Steps 1–3 — the pure core (`src/form/glb-thin.mjs`) + tests  ✅ committed
Implemented together in one module (they share the same file and contract):
- `triBoxOverlap(c, h, v0, v1, v2)` — exact Akenine-Möller 13-axis triangle–box SAT, written as a generic
  `separates(axis)` projection test (no macro soup); degenerate (zero-area) triangle → `false`.
- `voxelizeGlbThin(glb, {scale, shell, thinScale, connectivity})` — solid parity fill ∪ conservative
  surface trace, unioned by packed cell id and emitted in the **same i/j/k order** as `voxelizeGlb` (so
  it is a drop-in for the color/compile path). Returns the E-16 record shape + an additive
  `thin:{surfaceOnlyCount, components}` field.
- `connectedComponents(occupancy, {connectivity})` — 6/26-neighbour flood fill over the `indexCells`
  idiom borrowed from `material-clean.mjs`; the no-dropped-thin-components instrument.
- 23 unit tests, all green. Headline assertions: a solid cube is **bit-identical** to `voxelizeGlb`
  (shell ⊆ solid — no regression, no SAT off-by-one); a sub-voxel rod that the global voxelizer drops
  entirely (0 cells) becomes a **single connected chain** spanning the rod; a flat plate is unaffected.
- Commit: `feat(E-18 T-059-01): voxelizeGlbThin — solid ∪ conservative-shell occupancy`.

### Step 4 — bow+koi measurement runner + live artifacts  ✅ committed
- `benchmarks/sculpture/glb-voxel-thin.mjs` mirrors `glb-voxel-breadth.mjs`'s glue (dwebp decode,
  `judgeIoU`, render), restricted to the thin-form subjects. It voxelizes **base vs thin**, colors **both**
  via the reused, already-exported pure `parseGlbColoredSurface` + `sampleSurfaceColors` +
  `colorVoxelsToArtifact` (**no edit to `glb-voxel-build.mjs`**), renders, judges, and emits
  `thin.{md,json}` + per-subject summaries.
- The environment had the GLBs (gitignored, on disk), `dwebp`, and the GL render stack, so the **live run
  executed** (not deferred):

| subject | base IoU | thin IoU | ΔIoU | base occ | thin occ | thin-only | base comps | thin comps |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| bow-and-arrow | 0.473 | **0.526** | +0.053 | 513 | 1210 | 697 | **4** | **1** |
| koi | 0.622 | **0.707** | +0.085 | 2164 | 3155 | 991 | 1 | 1 |

- **AC #3 met:** bow-and-arrow rises **above 0.473** (→ 0.526), and the no-dropped-thin-components check
  is decisive — the bow goes from **4 severed fragments → 1 connected component** (the stave/string/shaft
  reconnect). Koi's thin fins add 991 cells and lift IoU +0.085 while staying connected.
- Render PNGs gitignored (image-heavy, derived — matches every sibling runner); durable record is
  `thin.{md,json}` + summaries.
- Commit: `feat(E-18 T-059-01): bow+koi thin-voxel before/after measurement + artifacts`.

### Step 5 — full gate + handoff  ✅
- `npm test` → 563 pass / 0 fail (artifact-validation self-test + `node --test "src/**/*.test.mjs"`).
- progress.md (this file) + review.md.

## Deviations from the plan

1. **Steps 1–3 landed as one commit, not three.** The kernel, the diagnostic, and `voxelizeGlbThin` all
   live in `glb-thin.mjs` and share its contract/header; splitting them into three commits of the same new
   file added ceremony without isolation value. The test file pins all three independently. No scope change.
2. **The live run was not deferred.** The plan hedged that GL/dwebp/GLBs might be unavailable here; they
   were all present, so the real before/after numbers were measured rather than left as an offline
   reproduction note. Better outcome than planned.
3. **One test assertion corrected mid-implementation.** The first draft asserted `baseComponents >=
   thinComponents`; for the synthetic 0.25-thick rod the *base build is empty* (0 cells / 0 components) —
   the rod is fully dropped, which is precisely the failure mode. The assertion was reworded to
   `base.count === 0 || baseComponents > 1` ("base drops or fragments the rod"), which states the gap
   correctly. No code change to the module.

## What was NOT done (by design — see design.md)

- No non-uniform/adaptive grid, no medial-axis thickness pass, no occupancy bridging/repair — the
  conservative-shell union gives the connectivity guarantee structurally (a connected surface ⇒ a
  connected voxel set), and "thin = surface ∖ solid" is the exact, tuning-free thin mask.
- No edits to `glb-voxelize.mjs` / `glb-voxel-build.mjs` (E-16/E-17 lineage preserved; avoids any
  file collision with the parallel root T-058-01, which lives in the color/material modules).
- Sword stays out (no GLB; T-061 routing finding).
- Integration into the main build path and the combined remeasure are **T-060-01**; this ticket ships the
  occupancy primitive, its unit proof, and the bow/koi before/after evidence.

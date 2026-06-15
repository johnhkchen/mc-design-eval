# Plan — T-078-01 view-layer-and-structural-read

Ordered, independently-verifiable steps. Each pure-core step ships with its test and is committable
atomically. Verification per step is `npm run test:unit` (fast, GL-free); the final live-render step is
the only one needing GL. Target: all ACs met, `npm test` green.

## Step 1 — occupancy adapter (`src/view/occupancy.mjs` + test)
- Implement `artifactOccupancy(artifact)` over `expandArtifact`; `occupancyFromCells(list)`.
- `Occupancy`: `bounds`, `dims`, `size`, `cells:Map<voxelKey,blockId>`, `has`, `block`. Strip
  `minecraft:` only in comparison helpers; store as written. Empty → `bounds:null`, `dims:[0,0,0]`.
- Test: synthetic 2×2×2 + negative-coord cells (mirror cottage); a 3-placement artifact; bounds/dims/
  has/block correctness; empty-artifact degrade.
- **Verify:** `node --test src/view/occupancy.test.mjs` green. Commit.

## Step 2 — surface grid Path P (`src/view/surface-grid.mjs` + test)
- `ORTHO_DIRS` (6) with `{axisU,axisV,axisW,signW}`; `DIAG_DIRS` (4 ground diagonals).
- `projectSurface(occ, dir)`: for ortho, iterate the two ⟂ lattice axes; per (u,v) march along W from
  the camera side, take first occupied → `{block,depth,voxel,normal}`. For diag, integer-step the ray;
  normal = dominant exposed ortho face (neighbour-air test). Throw on out-of-set dir.
- `backProject(grid)`: collect each non-null cell's `{pos:voxel, block}`.
- `gridMaskOf(grid)`: binary fill mask.
- Test (the AC round-trip is here):
  - ortho front pick + depth + normal on a stepped synthetic (two voxels at different depths in one
    column → nearer chosen).
  - **`backProject(projectSurface(occ,dir))` returns exactly the per-column front set** for all 6
    ortho dirs and the 4 diagonals (bijection / identity).
  - throw on `dir:'oblique'` / arbitrary.
- **Verify:** test green. Commit.

## Step 3 — structural read (`src/view/structural-read.mjs` + test)
- `footprint`, `storeyBands` (dominant-block + floor-slab boundaries, `floorLines`), `openings`
  (flood-fill enclosed air in ortho face mask → door/window), `roofRegion` (per-column highest y →
  contiguous top band + coverage), `wallFields` (per ortho face surface cells + holes + blockCounts),
  `structuralRead` bundle.
- Reuse `surface-grid` masks for faces; reuse a small flood-fill helper (local, pure).
- Test:
  - footprint width×depth on an L-shape.
  - storey bands on a 2-storey block: lower stone, upper plaster, a full floor slab between → 2 bands +
    1 floor line, correct dominant blocks.
  - openings: a hollow box with a 1×1 window (elevated) and a 2×1 door (on ground) on the `-z` face →
    one `window`, one `door`, correct bboxes.
  - roof: a box → roof coverage 1.0, yRange = top layer.
  - wall holes: a `-z` face missing one surface cell → one hole at that (u,v); blockCounts sane.
- **Verify:** test green. Commit.

## Step 4 — multi-angle reader (`src/view/multi-angle.mjs` + test)
- `VIEW_ANGLES` (6 ortho + 4 diag + threeQuarter), `resolveAngle` (named | arbitrary
  `{azimuthDeg,elevationDeg}`; validate finite), `renderViews` (impure, lazy render-tool import).
- Test (pure only): `VIEW_ANGLES` has 6 ortho + 4 diag; `resolveAngle('front')` and an arbitrary
  `{azimuthDeg:200,elevationDeg:12}` resolve; bad input throws. No GL in the unit glob.
- **Verify:** test green. Commit.

## Step 5 — reference quantize (`src/view/reference-quantize.mjs` + test)
- `referenceTarget(imagePath,{n,manifest})` → `gridFromImage(path,{whitelist:manifest, n})`.
- `quantizeToFace(imagePath, grid, {manifest})` derives `n = grid.n`.
- Test: drive the **pure** path — build a synthetic RGBA buffer, call the underlying
  `gridFromPixels` with a manifest whitelist and assert out-of-palette = 0 and `n` honored (decode path
  itself is image-grid's already-tested seam; we test our `n`/whitelist plumbing). Assert
  `quantizeToFace` derives `n` from a SurfaceGrid.
- **Verify:** test green. Commit.

## Step 6 — live GL proof runner (`benchmarks/sculpture/view-layer-proof.mjs` + package.json)
- Load cottage `after-artifact.json` → `artifactOccupancy` → `structuralRead`; print + capture summary.
- `projectSurface` front face (`-z`); summarize filled/air, sample cells; `backProject` round-trip
  assertion logged.
- `renderViews` for `[front, threeQuarter, top, diag +x+z]` into `docs/active/work/T-078-01/` (the
  GL proof PNGs).
- `referenceTarget` on the cottage concept/after-3q PNG at the front-face `n`, manifest = artifact's
  `palette.manifest`; capture the legend.
- Write `docs/active/work/T-078-01/view-layer-report.json`.
- Add `"view:proof"` to package.json scripts.
- **Verify:** `node benchmarks/sculpture/view-layer-proof.mjs` produces PNGs + report under the work
  dir; round-trip assertion passes. (GL is available in this env.)

## Step 7 — full suite + cleanup
- `npm test` (validate good/bad + full unit glob) green.
- Update `progress.md` deviations; ensure no stray edits to reused modules.
- **Verify:** `npm test` exits 0.

## Testing strategy
- **Unit (pure, the bulk):** every core (occupancy, surface-grid, structural-read, multi-angle table,
  reference-quantize plumbing) on synthetic occupancy / synthetic RGBA — no GL, no committed binary,
  no network, no `Date`/`random`. Mirrors `glb-voxelize.test.mjs` / `image-grid.test.mjs`.
- **Round-trip invariant** (AC #2): explicit identity test `backProject∘projectSurface` for all ortho
  + diag dirs — the load-bearing correctness check for the paint canvas.
- **Boundary enforcement:** `projectSurface` throws on arbitrary-oblique (AC scope), tested.
- **Live integration (AC #5):** the cottage multi-angle render + structural-read summary, saved under
  the work dir — the GL proof, run once via the runner (not in the unit glob, which must stay
  GL-free).

## Risks / mitigations
- *Diagonal back-projection exactness* — mitigated by storing the source `[x,y,z]` per cell (the
  back-projection reads stored voxels, never re-derives from depth), so invertibility is structural.
- *Cottage negative coords* — the adapter keeps artifact space; structural read indexes via `min`/
  `dims`. Tested with negative-coord synthetic cells in Step 1.
- *GL flakiness* — the proof is isolated to Step 6; the unit suite (the `npm test` gate) never touches
  GL, so green-ness does not depend on the GPU.
- *Storey-band heuristics over-fitting* — thresholds (`floorFillThreshold`) are parameters with
  documented defaults; the cottage proof reports the bands for eyeball validation, not a hard gate.

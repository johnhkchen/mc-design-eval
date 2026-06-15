# Structure — T-079-01 spray-paint-materials

File-level blueprint. New pure cores live in `src/view/` (E-23 sector, under the `src/**/*.test.mjs`
glob); the impure GL+metered runner lives in `benchmarks/sculpture/`. No existing file's behaviour
changes — this ticket is additive (T-078 seams are consumed, not modified).

## New files

### `src/view/palette-cans.mjs` (PURE) — the "4 cans" enforcement (AC #3)
The enforced palette and add-back logic, isolated so both the splat and the LLM-refine validate
against one source of truth.
- `allowedPalette(artifact, additions = [])` → a `Set<string>` of bare block ids = `bareList(manifest)`
  ∪ `bareList(additions)`. The membership oracle.
- `withAdditions(artifact, additions)` → a shallow-cloned artifact whose `palette.manifest` is the
  union (sorted, namespaced as written) — so AJV stays consistent when a concept material is added
  back (E-21 concept-justified growth). Does NOT validate (caller round-trips through `assertArtifact`).
- `filterToPalette(targetGrid, allowed)` → `{ grid, kept, dropped }`: null out any cell whose target
  block is off-palette (defensive — the splat whitelist already guarantees this, but the LLM-refine
  path needs the same gate). Reuses `bareBlock` from `occupancy.mjs`.
- **Tests** `palette-cans.test.mjs`: union/add-back, off-palette cell dropped, manifest stays sorted.

### `src/view/face-paint.mjs` (PURE) — splat → back-project → recolor placements (AC #1, #4)
The heart. Consumes a `SurfaceGrid` (T-078 `projectSurface`) + a per-cell material target.
- `@typedef PaintPass = { dir, source:"concept"|"glb", placements:{op,pos,block}[], painted, skipped,
  offPalette }`.
- `paintFace(occ, dir, targetGrid, { allowed, source })` → a `PaintPass`. For each filled
  `SurfaceCell`, if `targetGrid[v][u]` is non-null, in `allowed`, and ≠ the cell's current `block`,
  emit `{op:"voxel", pos: cell.voxel, block: namespaced(target)}`. Skips air/off-palette/no-change.
- `mergePaints(passes, { priority:["concept","glb"] })` → `{ placements, collisions, byPos }`:
  resolve same-`pos` paints by source priority (concept-matching wins, AC #4); deduplicate by
  `voxelKey`. A voxel reached by no pass is simply absent → keeps its current block (the colorimetric
  fallback, AC #4).
- `applyPaint(artifact, placements)` → a shallow-cloned artifact with the recolor placements appended
  (last-write-wins recolor; geometry untouched). Does NOT validate.
- **Tests** `face-paint.test.mjs`: synthetic 3×3×3 occupancy — paint a top band, assert the right
  voxels recolor and geometry is unchanged (count + positions identical after `expandArtifact`);
  no-change cell emits nothing; off-palette target skipped; corner voxel resolves to `concept` over
  `glb`; occluded interior voxel (never a front cell) is untouched. **The round-trip invariant:**
  `expandArtifact(applyPaint(art, paintFace(...).placements))` has the same voxel *positions* as the
  original, only blocks differ on painted cells.

### `src/view/glb-splat.mjs` (PURE core + thin impure decode edge) — side/roof target (AC #2)
The textured-GLB splat, done in voxel space (Design decision).
- `glbVoxelOccupancy({ surface, texture, occupancy, palette })` (PURE) → a colour-true
  `Occupancy` (reuse `sampleSurfaceColors` + `colorVoxelsToArtifact` from `glb-voxel-build.mjs`, then
  `artifactOccupancy`). Snaps each voxel to the manifest palette.
- `splatFromGlbOccupancy(glbOcc, dir, faceGrid)` (PURE) → a per-cell target grid `(block|null)[m][n]`
  sized to the BUILD face's `(n,m)`: project `glbOcc` through the same `dir` and **resample** its
  cells onto the build face grid (nearest-cell; both are ortho projections so alignment is a scale
  map). Same-angle by construction.
- `loadGlbSplat(glbPath, buildOcc, dir, faceGrid, { palette })` (IMPURE edge) — lazy-imports the GLB
  parser + texture decode (`glb-mesh.mjs` `parseGlbColoredSurface`, the dwebp/png decode used by
  building-build), builds the glb occupancy, returns the target grid. Mirrors the lazy-impure-leaf
  pattern of `multi-angle.mjs` `renderViews`.
- **Tests** `glb-splat.test.mjs`: PURE parts only — feed a synthetic small colour-true occupancy +
  a face grid; assert the projected/resampled target lines up with the face `(n,m)` and snaps to the
  injected palette. Decode/parse is the impure leaf, exercised by the runner, not `npm test`.

### `src/view/face-resemblance.mjs` (PURE scorer + IMPURE per-face gate) — accept-if-closer (AC #5)
- `faceResemblance(buildFaceImg, conceptFaceImg, blockTable, opts)` (PURE) → reuse
  `resemblance.mjs` `zoneAgreement` (+ `setAgreement`) over two already-decoded face images →
  `{ zone, set, score }`. No new colour math.
- `acceptIfCloser({ before, after, epsilon = 0 })` (PURE) → `{ accepted: after > before + epsilon }`.
  The P14-safe gate decision, mirroring `reviseLoop`'s `after > before + epsilon`.
- **Tests** `face-resemblance.test.mjs`: deterministic synthetic RGBA face pair (a built fixture, no
  PNG) — a face closer to the concept scores higher; `acceptIfCloser` accepts strict improvement,
  rejects equal/worse (the rollback case).

### `benchmarks/sculpture/spray-paint.mjs` (IMPURE runner — GL + metered) — the cottage run (AC #6, #7)
The one metered/GL entry point; not in `npm test`. Mirrors `material-correct.mjs` structure.
- Loads `concept-materials/cottage/after-artifact.json` (the failed build, white_terracotta=8), the
  concept (`runs/014-vConcept-a-cottage/concept.png`), and `glb/cottage.glb`.
- For the **front (`-z`)**: concept splat via T-078 `quantizeToFace`; for **one side (`+x`)**: GLB
  splat via `loadGlbSplat`. `paintFace` each → `mergePaints` (corner precedence).
- **Optional metered refine** (`--refine`): show the LLM the build face beside the concept's same face
  (`requestTextWithImage` / the BAML idiom) → small cell overrides, palette-gated. Default off so the
  splat+gate path runs model-free.
- **Per-face gate**: render before/after each face (`renderViews`), `faceResemblance` before/after,
  `acceptIfCloser` → commit or roll back. `assertArtifact` the committed build (AJV).
- Records `spray-paint/cottage.json`: white_terracotta count before/after (the **plaster band
  restored**), per-face resemblance before/after, painted/skipped/offPalette, accept/rollback per
  face, palette additions. Writes face PNGs (gitignored) + a `.md` summary. `--offline` re-derives the
  verdict from committed numbers (model-free, GL-free), like `material-correct.mjs`.
- `npm` script `spray:paint` → `node benchmarks/sculpture/spray-paint.mjs`.

## Modified files
- `package.json` — add `"spray:paint": "node benchmarks/sculpture/spray-paint.mjs"`.
- `docs/active/work/T-079-01/*` — the RDSPI artifacts (this dir).

## Deleted files
None.

## Module boundaries & dependency direction
```
benchmarks/sculpture/spray-paint.mjs  (IMPURE: GL render, GLB decode, metered claude -p, file I/O)
        │ consumes (no new logic in the runner beyond wiring + recording)
        ▼
src/view/face-paint.mjs ──► src/view/surface-grid.mjs   (T-078, projectSurface/backProject)
src/view/glb-splat.mjs  ──► src/form/glb-voxel-build.mjs (sampleSurfaceColors/colorVoxelsToArtifact)
                        └─► src/view/occupancy.mjs        (T-078, artifactOccupancy)
src/view/palette-cans.mjs ─► src/view/occupancy.mjs      (bareBlock) + src/artifact.mjs (manifest shape)
src/view/face-resemblance.mjs ─► src/form/resemblance.mjs (zoneAgreement/setAgreement — reuse, no new math)
src/view/reference-quantize.mjs (T-078, the concept splat — consumed unchanged)
```
All `src/view/*` cores are GL-free and import only pure siblings → unit-testable on synthetic
occupancy/RGBA. The single impure leaves (`glb-splat.loadGlbSplat`, the runner) lazy-import GL/decode
so the test glob stays clean. **Ordering:** palette-cans → face-paint → glb-splat → face-resemblance →
runner (each builds on the prior; the runner is last).
</content>

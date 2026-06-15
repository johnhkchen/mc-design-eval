# T-068-01 — high-res-voxel-build · Research

Descriptive map for the **E-20 higher-resolution building build**. Voxelize the whole-building GLB
(T-067-01) at a deliberately HIGH scale (markedly more blocks than the ~32-block sculptures), clean it with
the matured **E-19 pipeline**, render at a building view, and record block count + form IoU + cleanliness —
trying a couple of scales and keeping the **best-reading** one (not the biggest), respecting the measured
**scale↔fidelity non-monotonicity for angular forms**. Not prescriptive — what exists and how it connects.

## The upstream: the building GLB + mode (T-067-01)

- **`src/building.mjs`** — PURE building mode surface (sibling of `src/sculpture.mjs`). Constants this ticket
  consumes: `BUILDING_SCALE_MIN=16`, `BUILDING_SCALE_MAX=96`, `BUILDING_DEFAULT_SCALE=48`,
  `BUILDING_VIEW_3Q={azimuthDeg:45,elevationDeg:30,fov:45}`, `BUILDING_TURNTABLE`, `BUILDING_DEFAULTS`
  (seed/serverStateId), `assertBuildingSpec`, `buildingScaleCaps(scale)`, `buildingMetadata`. SDK/GL-free.
- **The GLB** — `benchmarks/sculpture/glb/stone-gatehouse.glb` (5.02 MB, glTF v2, 99,363 verts / 143,053
  tris). Recorded in `glb/README.md`. T-067-01 verified: voxelized @48 it is **1 connected component
  (26-conn), largestFraction 1.0000** — no duplicate masses / hallucinated connectors (bulky-angular form,
  no thin-subject TRELLIS failure). Lost fine detail (slit windows, voussoir ring) noted honestly upstream.
  GLB is **gitignored** but **present** on disk.
- **The design-doc run** — `benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-…/` has
  `design-doc.md`, `concept.png`, and `artifact.json` whose `palette.manifest` is the **design-doc flat
  palette**: `[stone_bricks, cobblestone, deepslate_tiles, dark_oak_log]` (4 blocks, 110 design placements).
  This manifest is the palette contract for the E-19 clean (value-true snap within it, ≤2 gated secondary).

## The E-19 cleaning pipeline (matured, what the build composes)

All consumed unchanged (I know these intimately from T-074):
- **Voxelize** — `src/form/glb-voxelize.mjs` `voxelizeGlb(glbBytes, {scale}) → occupancy{dims,occupied,count}`.
  `src/form/form-routing.mjs` `voxelizeRouted({subject, scale})` routes thin→`voxelizeGlbThin`, solid→plain;
  a building is **not** in the routing `SUBJECTS` table → `formTypeOf` defaults to **solid → plain
  `voxelizeGlb`** (correct: no over-thickening for a bulky mass). `formTypeOf` is the classifier.
- **Surface colour** — `src/form/glb-mesh.mjs` `parseGlbColoredSurface(glbBytes)` (+ `baseColor` texture);
  WebP→PNG via `dwebp` then `src/color/palette-extract.mjs` `decodeImage` (the impure host-tool edge).
- **Palette** — `src/form/glb-voxel-build.mjs` `paletteFromManifest(manifest)`; `src/form/palette-augment.mjs`
  `augmentPalette(designDocPalette, texture)` (design-doc + ≤2 texture-gated secondary — the E-19 flat
  discipline). `assertPaletteDiscipline(artifact, aug, {cap})` enforces the cap.
- **Segment (no speckle)** — `src/form/material-segment.mjs` `segmentMaterials({occupancy, surface, texture},
  {palette, metadata, style}) → DesignArtifact`. Metrics re-exported here: `speckleScore(occ, keys)`,
  `offPaletteCount(keys, palette)`.
- **Prune (no floating/duplicate geometry)** — `src/form/voxel-components.mjs` `pruneStrays(occ)`,
  `strayVoxelStats(occ) → {components, largestFraction, strayCount}`. E-19's **prune gate**
  (`e19-build.mjs PRUNE_GATE_FRACTION=0.9`): prune only a real multi-mass hallucination (largestFraction <
  gate); near-single-mass builds keep incidental specks. The building is **largestFraction 1.0** @48 → prune
  is a no-op safety net (single mass), which is the expected, correct behaviour for a clean building GLB.
- **Value-true** — `src/color/value-gate.mjs` `valueGate(realized, reference, {threshold})`,
  `realizedPaletteFromArtifact(artifact)`; reference clusters from `src/form/material-clean.mjs`
  `extractTexturePalette(texture).snapPalette`. The value-ΔE axis (design-doc-palette discipline cost).
- **AJV gate** — `src/artifact.mjs` `assertArtifact(artifact)`.
- **Render** — `render/src/render-tool.mjs` `renderArtifact(artifact, {outPath, view})` (GL, verified
  working). Form IoU: `src/form/glb-silhouette.mjs` `loadMeshFromGlb`/`rasterizeSilhouette` +
  `src/form/form-fidelity.mjs` `extractSilhouette`/`normalizeSilhouette`/`iou`/`RENDER_BG`.

## The runner template (what to mirror)

`benchmarks/sculpture/e19-build.mjs` is the near-exact template: it composes routed-voxelize → gated-prune →
segment-under-augmented-palette → render → score (form IoU via `judgeIoU(renderPath, glbBytes)`, speckle,
largestFraction, distinct, offPalette, valueΔE) for each subject, and writes per-subject `summary.json` +
`artifact.json` + a roll-up. `benchmarks/sculpture/material-assign.mjs` is the single-subject building-ish
shape (one GLB, one map, render, record). T-068 is **one subject (the building) across a couple of scales** —
the e19-build per-subject cell logic, iterated over scales instead of subjects. Runners follow the fixed
shape: a **live** branch (GL + dwebp) and an **`--offline`** branch that re-derives the report from committed
artifacts (no GL). The pure roll-up is unit-tested; the live branch is exercised by committed runs +
`--offline`. `npm test` baseline = **758 pass** (post-T-074).

## The measured caveat (load-bearing for scale choice)

From `docs/knowledge/design-learnings.md` + memory: **scale↔fidelity is non-monotonic and form-dependent.**
Angular / fine-relief forms (e.g. moai) **regress** at very high scale (32>16>48) — the model/voxelizer
under-spends large budgets on coarse fills; organic/textured forms (pineapple) **recover** at high scale.
A building is an **angular** mass (flat faces, edges, a gable, an arch). So a bigger block count is NOT
automatically better: the AC mandates trying a couple of scales and **keeping the best-reading** (highest
form IoU vs the GLB at the building view), recording which + why. The arbiter is the rendered silhouette IoU
(and a visual read), not the block count.

## Existing building-benchmark surface

`benchmarks/sculpture/building-concept.mjs` exists (T-067-01's concept/GLB provisioning), but there is **no
high-res building voxel-BUILD benchmark** yet — that is this ticket. No `benchmarks/sculpture/building/`
output dir exists. `package.json` has `bench:building` (the concept run), not a build script. The convention:
write under `benchmarks/sculpture/building/` (AC#3 says `benchmarks/.../building/`), renders gitignored,
artifacts/summary committed.

## Assumptions & constraints

1. "High scale" for a building means markedly more blocks than the ~32 sculptures — candidates 48 / 64 / 96
   (within `[BUILDING_SCALE_MIN, BUILDING_SCALE_MAX]`). DEFAULT_SCALE (sculpture) is 32; BUILDING_DEFAULT is
   48. Try ≥2 (e.g. 48 and 64, optionally 96) and keep the best-reading.
2. The building GLB is a single clean mass (largestFraction 1.0 @48) → `pruneStrays` is a no-op safety net,
   not the headline; the cleanliness story here is **flat-palette + no-speckle segmentation**, not stray
   removal (unlike moai in E-19).
3. The build is colorimetric/E-19 (segmentMaterials), NOT the T-071/T-072 concept-grounded map (that is E-21,
   a different axis). E-20 is "high-res + clean", measured on the E-19 cleanliness axes.
4. GL + dwebp are impure edges (not in `npm test`); the pure roll-up (best-scale pick + metric assembly) is
   the unit-tested contract; `--offline` re-derives from committed per-scale summaries.
5. Form IoU vs the GLB is the fidelity arbiter; the GLB lost fine detail upstream (T-067), so absolute IoU is
   bounded by the reconstruction — the comparison across scales is the meaningful signal, not the absolute.

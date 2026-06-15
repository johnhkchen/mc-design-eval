# T-064-01 — Research: clean-color-materials

Epic **E-19** color/material cleanliness core. Goal: regain the text→JSON "few flat blocks in
coherent regions" read on the GLB-voxel pipeline by attacking three documented busy-ness sources:
(1) texture-busy blocks polluting the palette, (2) diagonal gradients scattering on cardinal banding,
(3) `minRegion` eating legitimate small detail. Descriptive map below — no solutions.

## The color/palette stack (where blocks get chosen)

**`src/color/block-table.mjs`** — builds & loads the committed `block-lab-table.json`.
- `meanOpaqueRgb(png, alphaThreshold=128)` (l.67): mean of opaque texture pixels, FIRST animation
  frame only (top `width×width` rows when `height>width` & divisible). This MEAN is the entire color
  signal per block — variance is discarded, so a high-variance block (coral/ore/mycelium) and a flat
  block can land on the same mean Lab and tie a ΔE fit. This is AC#1's root cause.
- `buildBlockTable({version})` (l.198): BUILD-path, lazily imports `minecraft-assets` + `pngjs`
  (both present in `node_modules`, devDeps). Iterates `blocks_models.json`, keeps full-cube survival
  blocks (`classifyBlock`), picks a representative face (`pickFace`), decodes the PNG, records
  `{block, texture, rgb, lab}`. Deterministic (name-sorted). 305 blocks in the committed table.
- `loadBlockTable(path)` (l.260): RUNTIME path, pure JSON read, zero asset deps. **Table schema today:
  `{block, texture, rgb[3], lab[3]}` — NO variance field.**
- Tests: `block-table.test.mjs` Group B exercises `meanOpaqueRgb` on synthetic PNGs (transparent
  skip, first-frame, averaging). Pattern to mirror for a variance helper.

**`src/color/cielab.mjs`** — portable, zero-Minecraft color engine.
- `deltaE76`/`deltaE` (l.92/105), `nearestLab(targetLab, palette, {metric})` (l.120): linear argmin
  over `[{key,lab}]`; returns `{key, deltaE, lab}`. `nearest(rgb,…)` (l.145) wraps via srgbToLab.
- This is the ONLY selection primitive every snap goes through. A variance-aware selection must either
  live here or wrap these.

## The palette builders (candidate sets fed to nearestLab)

**`src/form/glb-voxel-build.mjs`**
- `blockPaletteFromTable(table)` (l.52): full 305-block `[{key,lab}]` — the loose universe snap.
- `paletteFromManifest(manifest, table)` (l.70): **the design-doc palette** — filters the table to the
  exact blocks the model chose (`palette.manifest`), namespace-tolerant, throws if none resolve.
  Returns `[{key,lab}]`. This is the AC#1 "design-doc snap" consumer surface.
- `assertPaletteDiscipline(artifact, palette, {cap})` (l.100): loud guard — every placed block must be
  in `palette`; optional distinct-block cap. Runner calls it post-build.
- `sampleSurfaceColors` (l.136): nearest-vertex → UV → texel; flat rgb per occupied cell.
- `keysToArtifact` (l.229): bare keys → namespaced placements + manifest.

**`src/form/palette-augment.mjs`** — the gated secondary (AC#1 second surface).
- `augmentReport(designDocPalette, texture, table, opts)` (l.65): median-cut the texture's foreground
  into `k` clusters; for each cluster score `primaryΔE` (vs design-doc), find `best = nearestLab(c.lab,
  tbl)` over the FULL table, `gain = primaryΔE − best.deltaE`; keep clusters passing FOUR gates
  (driftThreshold/minCoverage/fitThreshold/gainThreshold) whose best key isn't already primary; rank by
  `gain×coverage`, cap at `K=2`. **`best` is a pure mean-ΔE pick over the full table — a busy block can
  win here (this is exactly where `dead_brain_coral_block`/`nether_quartz_ore`/`mycelium` leak in).**
- `augmentPalette(...)` (l.146): returns merged `palette` only. `AUGMENT_DEFAULTS` l.32.

**`src/form/material-clean.mjs`**
- `extractTexturePalette(texture,{k,…})` (l.52): median-cut → `[{key, lab:blockColor.lab}]` (value-true).
- `speckleScore(occupancy, keys)` (l.162): **T-062 fixed** — fraction of cells LOCALLY OUTVOTED among
  self ∪ 6 face-neighbours (fragmentation, not boundary count). [0,1]. The AC#5 before/after metric.
- `snapColorsToPalette`, `denoiseVoxelKeys` — per-voxel snap + radius majority (legacy R2 path).

## The segmentation pass (regions, gradients, specks) — AC#2 & AC#3

**`src/form/material-segment.mjs`** — the live build path (`segmentMaterials`).
Pipeline: tight palette → per-cell Lab (`cellLabs`) → `growRegions` (CC by ΔE≤growDE) →
`absorbSmallRegions` → per-region `fillRegion` (flat→one block / gradient→`bandRegion`) → optional
in-palette texture → `keysToArtifact`. `SEG_DEFAULTS` l.45: `{k:6, growDE:22, gradDE:25, minRegion:12,
neighbourhood:6}`.
- **`gradientAxis(region, cellCoords, labs)` (l.285):** argmax over the THREE CARDINAL axes of
  `|Pearson(coord_axis, L*)|`; fallback axis 1 (height). **This is AC#2's root cause — a diagonal
  gradient (varies along i+k) has weak per-cardinal correlation, so banding by one cardinal axis
  scatters: cells at equal i but different k get different bands → non-monotonic across the surface.**
- `axisCorrelation` (l.256): Pearson(coord_axis, L*) — sign gives band direction.
- **`bandRegion(region, cellCoords, labs, palette, {dither})` (l.320):** ordered steps (palette blocks
  the region snaps to, sorted by L*), capped to the gradient AXIS extent so ≤1 step per adjacent cell;
  each cell mapped by normalized position ALONG ONE CARDINAL AXIS. Hard band default (round to nearest
  step); `dither` opts into Bayer. Projection is `(coord[axis]-lo)/extent` — single-axis only.
- **`absorbSmallRegions(state, occupancy, labs, {minRegion})` (l.208):** every region `< minRegion`
  (12) cells is absorbed into the 6-adjacent region of nearest MEAN Lab, smallest-first, iterated to
  stable. **Unconditional on color distance — AC#3 root cause: a legitimate small distinct feature
  (mushroom spot) is absorbed exactly like a noise speck.** A region with no differently-labelled
  neighbour is kept.
- `fillRegion` (l.385): spread≤gradDE → single nearest-mean block; else `bandRegion`.
- `regionStats` (l.163): bbox min/max/mean + `spread` = bbox diagonal.
- `segmentMaterials(build, opts)` (l.460): `opts.palette` (design-doc, the fix) or extract; `opts.augment`
  → `augmentPalette`. All `nearestLab` calls inside fill/band go through the snap palette.

## The runner & metrics — AC#5

**`benchmarks/sculpture/e18-remeasure.mjs`**: per-subject combined build — `voxelizeGlbThin` →
`pruneStrays` (T-063) → `segmentMaterials({palette: augmentPalette(paletteFromManifest(manifest),
texture)})` → `assertPaletteDiscipline(cap=prim+2)`. Five metrics: form IoU vs GLB, `speckleScore`,
distinct-block, `offPaletteCount`, value ΔE. Writes `e18-remeasure.json/.md`. `SUBJECTS` (7) from
`glb-voxel-breadth.mjs`. GLBs are gitignored on disk; a live sweep needs the GL host + dwebp (both
available per recent session notes). Artifacts/summaries under `benchmarks/sculpture/e18-build/<subj>/`.

## Constraints & assumptions

- **Purity split is load-bearing.** `segmentMaterials`/`augmentPalette`/`material-clean` take an
  ALREADY-DECODED texture; no GL/WebP/network/`Math.random`. Any new variance data must be precomputed
  into the committed table (build-time) or derived purely from already-loaded inputs.
- **Committed table is the runtime contract.** Adding a variance field means regenerating
  `block-lab-table.json` via `buildBlockTable` (minecraft-assets@1.17 present) — a data change, not just
  code. `lab`/`rgb` must stay byte-identical so no existing snap shifts unexpectedly.
- **`nearestLab` is the universal chokepoint.** Variance-aware selection should reuse it (extra `metric`
  or a thin wrapper) rather than fork the scan.
- **Determinism everywhere** (deep-equal artifact test). No randomness; tie-breaks must be stable.
- **AC tests are concrete:** busy loses to flat at equal mean ΔE; diagonal gradient bands monotonically
  (≤2 blocks across a transition, ordered); a legitimate small region is NOT absorbed.
- E-19 deps: T-062 (speckle/stray metrics) done; T-063 (pruneStrays) done and already wired into the
  runner. This ticket is the color/material half.

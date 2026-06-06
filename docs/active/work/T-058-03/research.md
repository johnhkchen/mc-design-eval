# T-058-03 — Research: gated secondary palette

Epic **E-18**, story **S-058**. Descriptive map of the code this ticket touches. No solutions here.

## The problem this lands in

The E-18 palette fix (commit `62dadc4`) locked the GLB-voxel colour picker to the **design-doc
manifest** — the few blocks the model deliberately chose — instead of snapping over the full
305-block table. That killed speckle/bloat (heart 91 → 5 blocks). But a tight primary palette can
**over-constrain**: a TRELLIS texture sometimes carries a genuine colour the design doc never
anticipated, and forcing it onto the nearest of the 5 design-doc blocks creates large **snap drift**
(high ΔE → an inaccurate surface). This ticket adds a *strictly gated* secondary palette: at most
**K=2** extra blocks from the full table, only when they are a super-great fit that greatly cuts drift.

## Where the palette is decided today

### `paletteFromManifest(manifest, table)` — `src/form/glb-voxel-build.mjs:69`
- Input: `manifest` = the original artifact's `palette.manifest` (namespaced block ids); `table`
  defaults to `loadBlockTable()`.
- Returns `{key, lab}[]` — the manifest blocks resolved in the block→Lab table, `minecraft:` stripped,
  non-table blocks (e.g. stairs) dropped, throws if nothing resolves.
- This is the **primary** palette this ticket augments. It is a strict subset of the 305-block table.

### The full value-true table — `src/color/block-table.mjs`
- `loadBlockTable(path?)` → `{ blocks: {block, texture, rgb, lab}[], version, requestedVersion }`,
  the committed `block-lab-table.json` (~305 full-cube, survival-obtainable blocks; Lab to 3 dp).
- `blockPaletteFromTable(table?)` (`glb-voxel-build.mjs:51`) adapts it to `{key, lab}[]` for `nearestLab`.
  This is the "full table" the secondary draws from.

### The two build paths that consume a palette
- **`glbVoxelBuild(glb, {scale, decodeTexture, palette, metadata, style})`** —
  `glb-voxel-build.mjs:238`. Voxelize → parse surface → **decode texture** (injected `decodeTexture`,
  the only impurity) → `sampleSurfaceColors` → `colorVoxelsToArtifact(occupancy, colors, {palette,…})`.
  The per-cell snap is `nearestLab(srgbToLab(rgb), palette)` at `:169`; `palette` defaults to
  `blockPaletteFromTable()` when not supplied.
- **`segmentMaterials(build, opts)`** — `src/form/material-segment.mjs:456`. PURE; `build` already
  carries the decoded `texture`. Candidate set is `opts.palette ?? extractTexturePalette(texture,{k}).snapPalette`
  (`:466`). Region-grow → absorb specks → per-region fill snaps within that palette. Off-palette = 0 by
  construction. `segmentMaterialsGlb` is the impure wrapper (decode then `segmentMaterials`).

Both already accept a design-doc `palette` and snap strictly within it. **Neither has a hook to add a
few table blocks back in.** That hook is what this ticket builds.

## The clustering + ΔE primitives to reuse (no new colour math)

### `src/color/palette-extract.mjs`
- `aggregateForeground({width,height,data}, opts)` `:71` → `{points:{rgb,lab,count}[], foregroundPx,
  droppedPx}`. Drops background by `isBackground` (`dropColor`/`dropTolerance`/`alphaThreshold`,
  `DEFAULTS` at `:37` — dropColor `[0,0,0]`, tol 24, alpha 128). Collapses pixels to unique-colour
  points, each with a count and a precomputed Lab.
- `medianCutLab(points, k)` `:126` → `{points, count, lab, rgb}[]` — deterministic weighted median-cut
  in Lab; `count` is the cluster's pixel population (→ coverage = `count / foregroundPx`), `lab` its
  count-weighted centroid. This is exactly the "cluster the texture's actual colours, weighted by
  coverage" the ticket asks for.
- `extractPaletteFromPixels` / `extractTexturePalette` already CHAIN these to snap clusters → blocks;
  but they snap to *one* palette. We need the raw clusters (centroid + coverage) **before** snapping, so
  `aggregateForeground` + `medianCutLab` directly is the right seam, not the higher-level extractor.

### `src/color/cielab.mjs`
- `deltaE` = `deltaE76` `:92/:105` — CIE76 Euclidean ΔE, the metric the whole stack uses.
- `nearestLab(targetLab, palette, {metric?})` `:120` → `{key, deltaE, lab}` — argmin over a `{key,lab}[]`
  palette. Used for both `primaryΔE` (min ΔE to the design-doc palette) and `bestTable`/`tableΔE`
  (nearest block over the full table). `srgbToLab(rgb)` `:70` for any RGB→Lab.

## Benchmark runners (the wiring + the record live here)

- **`benchmarks/sculpture/glb-voxel-seg.mjs`** — the R-seg sweep. Decodes each subject's texture,
  reads `runs/<run>/artifact.json`'s `palette.manifest`, `paletteFromManifest(...)` → `palette`, calls
  `segmentMaterials({occupancy,surface,texture}, {palette,…})`, renders at `SCULPTURE_VIEW_3Q`, judges
  silhouette IoU (`judgeIoU`), writes per-subject `summary.json` + `seg.{md,json}` via the pure
  `buildSeg(rows)`. **NOTE (latent bug, pre-existing):** after the T-058-02 rename, `runSeg` references a
  variable `snapPalette` (lines ~233/248/263/280) that is never declared in scope — a `ReferenceError`
  on a live run. Out of this ticket's scope; flagged for E-18 follow-up.
- **`benchmarks/sculpture/e18-remeasure.mjs`** — combined thin+seg remeasure; calls `segmentMaterials`
  on thin occupancy (no `opts.palette` today). `assembleRemeasure(rows)` in `src/form/remeasure.mjs:101`
  is the pure roll-up assembler pattern (`{md, json}`, direction-aware deltas, honest regressions).
- **`SUBJECTS`** (the 7 sculptural subjects; sword excluded — TRELLIS 500'd) is exported from
  `glb-voxel-breadth.mjs` and re-imported by the seg/remeasure runners. The dwebp `decodeTexture`,
  `judgeIoU`, TRELLIS regen glue are duplicated per runner by the established host/GL split.
- The impure runners write render PNGs that are **gitignored** per a stanza (`.gitignore:32–59`,
  one per runner dir); durable record is the `.md`/`.json` + `summary.json`.

## Testing idiom (GL-free, synthetic)

- `src/form/material-segment.test.mjs` and `glb-voxel-build.test.mjs`: `node:test`, synthetic occupancy
  `makeOcc(dims, cells)`, `atlasRow(texels)` (a `w×1` RGBA atlas), `buildFrom(texels)` (occupancy +
  surface + atlas, cell i → texel i). Palettes are hand-built `{key, lab: srgbToLab([…])}`. Produced
  artifacts are asserted against the **real AJV gate** (`assertArtifact`). No GL, no WebP, no RNG.
- A synthetic `{blocks:[{block,lab}]}` table is passed directly in `paletteFromManifest` tests — the same
  trick lets an augment test control which table block is the "super-great fit".

## Constraints surfaced

- **Purity:** the augment function must be GL-free and take an *already-decoded* texture (the runners
  decode once and share it). No GLB/WebP/network in `src/`.
- **Form IoU is invariant** under recolouring: neither `segmentMaterials` nor `colorVoxelsToArtifact`
  moves a voxel, so adding palette blocks cannot move the silhouette — "form IoU not harmed" holds by
  construction; the benchmark still renders to confirm.
- **Reuse, not reimplementation:** `aggregateForeground` + `medianCutLab` (clusters), `nearestLab`/`deltaE`
  (the two ΔE queries), `loadBlockTable` (the table). No new colour math, mirroring R2/R-seg discipline.
- **Determinism:** median-cut and nearestLab are deterministic; the ranking tie-break must be too.
- **Import graph:** `glb-voxel-build.mjs` and `material-segment.mjs` will both import the new augment
  module; the augment module imports `palette-extract`/`cielab`/`block-table` only — no cycle (it must
  not import `glb-voxel-build`, which would cycle).

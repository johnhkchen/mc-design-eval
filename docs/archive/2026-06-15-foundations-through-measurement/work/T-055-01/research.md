# T-055-01 — research: material-clean-pass (E-17 rung R2)

Descriptive map of what exists for grounding GLB-voxel materials in a texture-derived canonical
palette so the surface reads clean instead of speckled. No solutions proposed here.

## 1. What this ticket is

E-17 rung **R2** and the loose end E-16 left. The R1 GLB-voxel build (T-054-01) wins on *form* but its
**color is speckled**: every occupied cell sampled the TRELLIS texture *independently* and snapped to the
nearest of the **full 305-block table**, so two adjacent cells whose texels differ by a few units land on
*different* blocks. The result is the right shape with a busy, dirty skin — and silhouette IoU is blind to
it (the metric only sees occupancy, not block id). Concrete evidence of the speckle is already on disk:
the R1 artifacts have huge manifests — **koi 71 distinct blocks over 2164 cells, heart 91 over 5840**.
Those manifest sizes ARE the speckle, quantified.

The directive (from the ticket): don't cluster the noisy per-voxel samples — instead **extract a canonical
material palette from the GLB's own baseColor texture image with the E-10 CIE-Lab palette technique**, then
snap every voxel to the nearest block *within that small canonical palette*, spatially denoise, and
optionally apply E-11 material texture so the surface reads as deliberate craft.

## 2. The pieces already exist — this is a recomposition, not new math

Every primitive the ticket calls for is implemented, pure, and tested. R2 is a new *composition* of them.

### `src/color/palette-extract.mjs` — the E-10 canonical-palette technique
- `extractPaletteFromPixels(img, opts)` — **pure**, takes an already-decoded `{width,height,data}` RGBA
  image → `medianCutLab` (deterministic weighted median-cut in Lab) → match each cluster centroid to the
  nearest table block (`nearestLab`) → merge by block → ordered `palette[]` of
  `{ block, repColor:{hex,rgb,lab}, coveragePct, deltaE, blockColor:{hex,rgb,lab} }` + a `description`.
  `opts`: `k` (target clusters, default 8), `dropColor` (default near-black `[0,0,0]`, **`null` disables**
  background removal), `dropTolerance`, `alphaThreshold`, `whitelist`.
- `extractPaletteFromImage(path, opts)` — the **impure** decode shell (lazy jpeg-js/pngjs); not on the R2
  path (R2 already holds decoded texture pixels).
- The `block` keys are **bare** (`oak_planks`); `blockColor.lab` is the table Lab for that block — exactly
  the `{key, lab}` shape `nearestLab` wants, so the extracted palette converts to a snap-palette trivially.

### `src/form/glb-voxel-build.mjs` — the R1 core (T-051-01), the thing R2 wraps
- `glbVoxelBuild(glb, {scale, decodeTexture, ...})` (impure via injected `decodeTexture`) →
  `voxelizeGlb` → `parseGlbColoredSurface` → decode texture → `sampleSurfaceColors` → `colorVoxelsToArtifact`.
- **Pure, directly reusable for R2:**
  - `sampleSurfaceColors({occupancy, surface, texture})` → flat rgb, 3 bytes/cell in `occupiedCells` order
    (nearest-vertex → UV → texel). This is the *same* per-voxel sampling R2 needs — R2 changes only the
    **snap target** (canonical palette, not the 305-block table) and adds **denoise**.
  - `colorVoxelsToArtifact(occupancy, colors, opts)` → snaps each cell's rgb→`nearestLab(full table)`→key,
    then builds placements (`pos=[i-ox, j, k-oz]`, `block=minecraft:<key>`) + sorted-unique `manifest`.
    The coordinate map + manifest build is the part R2 must share. **R2 has keys already** (after snap +
    denoise), not colors — so it needs a *keys→artifact* path, which today is fused inside this function.
  - `blockPaletteFromTable(table?)` → the full 305-block `{key,lab}` palette (R1's snap target).

### `src/color/cielab.mjs` — the portable engine (E-10, T-020)
- `srgbToLab(rgb)`, `nearestLab(targetLab, palette)`, `nearest(rgb, palette)`, `deltaE`. Pure, zero
  project coupling (enforced by `reuse-boundary.test.mjs` — R2 must NOT add a `../` import here).

### `src/color/block-table.mjs` — `loadBlockTable()` (runtime, zero asset deps)
- The committed 305-entry `block-lab-table.json`; keys bare, `lab` 3-dp.

### `src/sculptor/material.mjs` — E-11 material texture (optional step)
- Pure, reusable exports: `hueFamilySet(target, {size, radius})` → 2–3 namespaced same-hue blocks ordered
  dark→light; `pickMaterial(set, t, h, spread)` → height-+hash-selected member; `cellHash(x,y)` →
  deterministic [0,1); `tableKey`/`blockId` namespace helpers. Built for the 2-D build-state, but the three
  pure helpers compose over any (key, height, hash) — usable for a 3-D voxel set without the build-state.

### `src/form/glb-mesh.mjs` / `glb-voxelize.mjs` — geometry + surface (unchanged, reused)
- `voxelizeGlb(glb,{scale})` → occupancy `{scale,voxelSize,dims,bounds,occupied:Int32Array,count}`;
  `occupiedCells(occ)` generator (the canonical iteration order every color array is keyed to).
- `parseGlbColoredSurface(glb)` → `{vertices,uvs,bounds,baseColor:{data,mimeType}|null}` (WebP via
  `EXT_texture_webp`); throws if no baseColor. All 7 GLBs carry a baseColor WebP.

## 3. The R1 runner is the template for the R2 runner

`benchmarks/sculpture/glb-voxel-breadth.mjs` (T-054-01) is the direct precedent and **exports
`{ SUBJECTS, buildR1, runBreadth }`** (side-effect-free import behind an `import.meta.url` guard):
- `SUBJECTS` — the 7 `{key, glb, run}` rows (sword excluded). R2 reuses this list verbatim.
- impure glue R2 reuses the *shape* of: `decodeTexture({data,mimeType})` (PNG/JPEG passthrough, WebP via
  host `dwebp` → pngjs `decodeImage`); `judgeIoU(renderPath, glbBytes)` (render silhouette vs GLB
  silhouette at `SCULPTURE_VIEW_3Q`, rounded 3-dp); `regenMissingGlb` (AC safety branch, never prints
  `MODAL_ENDPOINT_URL`); skip-not-error on an absent GLB; `--offline` rebuild from committed summaries.
- writes per-subject `artifact.json` + `summary.json` (durable) + gitignored `render-3q.png`, and a
  roll-up `r1.{md,json}`.

R2 writes to a **new** dir `benchmarks/sculpture/glb-voxel-clean/<subject>/` (AC #4), so it cannot disturb
R1's `glb-voxel/` outputs or the surgical harness that reads `glb-voxel/<subj>/summary.json` as its
baseline. The R1 artifacts in `glb-voxel/<subj>/artifact.json` are the **before** record R2 compares to.

## 4. Test / CI boundary (load-bearing)

- `npm test` = `validate-artifact` self-test + `node --test "src/**/*.test.mjs"` — **`src/**` only**.
  Benchmark-local tests are NOT collected. So R2's pure logic must live under `src/` to be in the suite.
- The pattern to mirror: `src/form/glb-voxel-build.test.mjs` exercises the pure color/compile core on
  **synthetic occupancy + synthetic colors** and asserts the produced artifact passes the **real AJV gate**
  (`assertArtifact`) — the round-trip. No GL, no WebP, no GLB in the test graph. AC #3 ("pure, GL-free,
  synthetic noisy color") is exactly this pattern.
- `assertArtifact` (`src/artifact.mjs`) is a consumer-side gate; cores never self-validate (round-trip).

## 5. Why R2 cannot break form (a free invariant)

Silhouette/form IoU is a function of **occupancy only** — the render silhouette counts any non-background
opaque cell, and every block in the table is an opaque full cube. R2 **never touches occupancy** (it only
re-decides each occupied cell's block id). So "form IoU steady — clean must not break the shape" (AC #4) is
guaranteed by construction; the runner still re-measures it as a sanity check, expecting ≈R1 (GL
rasterization rounding aside).

## 6. Constraints & assumptions

- Scale 32 (`DEFAULT_SCALE`) to stay comparable to R1; all 7 GLBs present (regen branch is a no-op safety).
- The baseColor texture is a **UV atlas** with possibly-unused regions (background fill). E-10's near-black
  `dropColor` removes near-black fill; unused palette entries that survive are harmless (a per-voxel snap
  simply never selects an unused block). This is a Design decision (background handling on an atlas).
- The "noise drop" metric the AC wants ("value ΔE and/or distinct-block count down"): **distinct-block
  count = manifest size** (directly comparable R1→R2), plus a stronger spatial **speckle score** (fraction
  of face-adjacent occupied cell pairs with differing block) is computable purely from occupancy + keys.
- Determinism: voxelize, sample, `medianCutLab`, `nearestLab`, and a single-pass denoise are all
  deterministic ⇒ `--offline` reproduces byte-stable (modulo GL IoU rounding, already 3-dp).
- DRY (project memory `parallel-roots-duplicate-shared-deps`, `reuse-boundary.test.mjs`): R2 reuses
  `sampleSurfaceColors`, `extractPaletteFromPixels`, `nearestLab`, and the R1 coordinate/manifest build —
  it must not re-implement any of them.

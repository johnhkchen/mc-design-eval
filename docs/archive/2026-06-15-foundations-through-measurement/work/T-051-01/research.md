# T-051-01 — Research: GLB Voxel Build (color + DesignArtifact compile)

Epic **E-16**, Arm B. T-050-01 produced **occupancy** (form, no color). This ticket adds **color** and
compiles a renderable `DesignArtifact` — the GLB-voxel build that goes head-to-head with text→JSON.
Descriptive map of what exists and how it connects; no solutioning here.

## The forward contract from T-050-01 (the input)

`src/form/glb-voxelize.mjs` — `voxelizeGlb(glb, { scale }) →`
```
{ scale, voxelSize, dims:[nx,ny,nz], bounds:{min:[x,y,z],max:[x,y,z]}, occupied: Int32Array, count }
```
- `occupied` is a flat `Int32Array` of `[i,j,k]` triples (grid indices), `count = occupied.length/3`.
- A cell's world-space center is `min[axis] + (idx + 0.5) * voxelSize` (the exact formula the voxelizer
  uses to sample `pointInMesh`). This is the bridge from a grid cell to a point on/in the mesh.
- `occupiedCells(occ)` is a generator of `[i,j,k]` tuples.
- Grid sizing: `voxelSize = longestExtent/scale`, `dims[axis] = max(1, round(extent/voxelSize))` — the
  longest axis is exactly `scale` cells, identical envelope to a text→JSON build at that scale.
- Recorded reality (scale 32): koi `32×17×23`, 2164 cells, 17.3% fill; heart `22×27×32`, 5840 cells.
  Y is up (koi long in x, short in y — fish proportions), so `j → y` maps to the render's vertical axis.
- Perf: `voxelizeGlb` is O(cells × triangles), ~11–19 s per real mesh at scale 32 (144k tris). One-shot
  is fine; a tight loop is not (flagged in T-050-01 review).

## The shared GLB parser (geometry only, today)

`src/form/glb-mesh.mjs` — `parseGlbMesh(glb) → { positions: Float64Array (9 floats/tri, world space),
triangleCount, bounds }`. Manual `DataView` reads; handles accessor componentTypes 5120–5126 ×
SCALAR/VEC2/VEC3/VEC4, `byteOffset`+`byteStride`, node `matrix`/TRS composition, indexed + non-indexed
primitives. Throws `GlbParseError`. **It reads only `POSITION`** — it discards `TEXCOORD_0`/`NORMAL` and
never touches `materials`/`textures`/`images`. Private helpers in the module (`splitChunks`,
`readAccessor`, `transformPoint`, `mat4*`) are exactly what a color-aware parse would reuse.

### What the real GLBs actually carry (inspected `koi.glb`, `heart.glb`)

- One mesh, one primitive. Attributes: **`POSITION`, `TEXCOORD_0`, `NORMAL`** — **no `COLOR_0`**.
- Material `pbrMetallicRoughness.baseColorTexture.index = 0` → `images[0]` → a **`image/webp`** buffer
  in a bufferView; `baseColorFactor = [1,1,1,1]` (so the texture *is* the color, no tint). A second
  `metallicRoughnessTexture` (index 1) is irrelevant to color.
- So **"GLB surface color" means: sample the WebP baseColor texture at a surface UV.** The ticket's
  "nearest vertex color" alternative does not apply — these meshes have no vertex colors.

### WebP is the load-bearing constraint

`src/color/palette-extract.mjs` `decodeImage(path)` decodes **PNG (pngjs) and JPEG (jpeg-js) only** —
no WebP, and the toolchain has **no WebP decoder dependency** (`deps`: `@boundaryml/baml`; `devDeps`:
ajv, ajv-formats, jpeg-js, minecraft-assets, pngjs, tsx). The host *does* have CLI WebP tools
(`dwebp`, `cwebp`, `sips`, `magick`, `vips`, `ffmpeg` all present). So any WebP→RGBA step is an
**impure, host-tool edge** — it must live in the on-demand runner, never in `src/**/*.test.mjs` (CI).

## The color layer to reuse (E-10) — proven, pure, GL-free

- `src/color/cielab.mjs` — `srgbToLab(rgb 0–255) → Lab`, `nearestLab(targetLab, palette[{key,lab}]) →
  {key, deltaE, lab}`, `nearest(rgb, palette)`. **Zero Minecraft/artifact knowledge by design** (a
  reuse-boundary test enforces it). This is the exact engine E-14 used to kill moai value drift.
- `src/color/block-table.mjs` — `loadBlockTable(path=TABLE_PATH)` reads the committed
  `block-lab-table.json`: `{ version, blocks:[{block, texture, rgb:[r,g,b], lab:[L,a,b]}], excluded }`,
  **305 full-cube, survival-obtainable blocks**. `blocks.map(b => ({key:b.block, lab:b.lab}))` is a
  ready `nearestLab` palette. Runtime path pulls **no** asset deps.
- `src/color/value-build.mjs` `snapArtifactToValueTrue` is the *concept-image* color path (anchor →
  realized cluster → value-true block). Useful as a **pattern** (pure arithmetic; runner does the
  decode), but its input is a 2-D realized palette, not a 3-D surface — not directly reusable here.

## The compile target — DesignArtifact + the AJV gate

- `src/artifact.mjs` — `parseArtifact`/`assertArtifact` compile `schema/design-artifact.schema.json`
  with `Ajv2020({allErrors, strict, discriminator})`. Top-level required:
  `schema_version, metadata, style, palette, placements`. Placement is a `oneOf` discriminated on
  `op` (`voxel|line|box|fill`); a `voxel` is `{op:"voxel", pos:[x,y,z], block, state?}`.
- **`src/sculptor/compile.mjs` `toDesignArtifact` is the exact precedent**: each occupied cell → one
  `{op:"voxel", pos:[x,y,relief], block}`; manifest = unique placed blocks (sorted); metadata/style
  from `COMPILE_DEFAULTS` (model id single-sourced from `config.mjs`); **does not** validate — callers
  run it through `src/artifact.mjs`. This is the round-trip pattern (compile, then assert valid).
- Block ids are namespaced (`minecraft:<name>`); the table's `block` is bare → prefix on placement.
- `metadata.target` is an **enum (house|path|landscape)** — a sculpture is none; leave it unset (the
  sculpture lineage already learned this; see `src/sculpture.mjs` `sculptureMetadata`). Subject identity
  rides `trial_id` + the run dir, not `target`.

## Render + judge path (for AC #3, the on-demand runner)

- `render/src/render-tool.mjs` `renderArtifact(artifact, { outPath, view })` → headless GL PNG;
  `src/render-tool.mjs` `renderSummary(report)` → `{placed, unmapped, bounds,…}`. `benchmarks/sculpture/
  run.mjs` is the live precedent: render at `SCULPTURE_VIEW_3Q` (azimuth 45°, elevation 30°, fov 45°).
- "**Judged**": there is **no sculpture LLM judge** (`baml_src/judge.baml` `JudgeFacade` is facade- and
  brief-specific). The epic's own currency is **form fidelity**. `src/form/form-fidelity.mjs` exposes
  `extractSilhouette`, `normalizeSilhouette`, `iou`, `regionIoU`, `formFidelity(renderImg, conceptImg)`,
  `formFidelityFromPair(renderPath, conceptPath)`. T-048-01 `src/form/glb-silhouette.mjs`
  `rasterizeSilhouette(mesh, {view})` produces a mask in the **same shape** `extractSilhouette` returns
  and at the **same camera** (`SCULPTURE_VIEW_3Q`) — so the GLB's own silhouette is a ready ground-truth
  for a deterministic IoU "judge" of the build render. (Two GLB parsers coexist — T-048-01's inline
  `parseGlb` and this story's `glb-mesh.mjs` — consolidation is deferred to T-053-01.)

## Benchmark output conventions

`benchmarks/sculpture/{run.mjs, form-revise-ab.mjs, voxelize-sanity.mjs}`: on-demand `.mjs` generators
(GL/metered, **not** in `npm test`), each writing renders + a JSON/MD record under a per-purpose
subdir. The GLBs live at `benchmarks/sculpture/glb/{koi,heart}.glb` (gitignored, present locally). AC #3
targets `benchmarks/sculpture/glb-voxel/<subj>/`.

## Constraints / assumptions surfaced

1. **WebP decode is impure** (host CLI) → confined to the runner; the testable core takes already-RGB
   input. AC #2 explicitly asks the unit test to use a *synthetic surface color*, not a 5 MB GLB.
2. **No vertex colors** in TRELLIS output → color = texture sample via UV (nearest-vertex or
   nearest-triangle barycentric). `glb-mesh.mjs` must be extended to also yield UVs + the baseColor image.
3. **Perf**: per-cell nearest-surface search is O(cells × verts); acceptable one-shot, flag for loops.
4. **No new runtime dependency** is desirable (matches the project's lean-toolchain rule).
5. `nearestLab` over 305 blocks is a linear scan per cell — small (305) × thousands of cells; fine.

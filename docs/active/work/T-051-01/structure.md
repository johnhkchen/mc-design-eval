# T-051-01 — Structure: file-level blueprint

The shape of the code (not the code). Modules, public interfaces, boundaries, ordering. Per design.md:
a pure color/compile core + a pure UV sampler, a small parser extension, a top-level tie, and an
on-demand runner. Pure modules live under `src/**` (CI test glob); the metered/GL/host-tool runner lives
under `benchmarks/**`.

## Files

### MODIFY `src/form/glb-mesh.mjs` (+~70 lines)
Add a color-aware, vertex-indexed parse beside `parseGlbMesh` (which is **unchanged**). Reuses the
module-private `splitChunks`, `readAccessor`, `mat4*`, `transformPoint`.
- `export function parseGlbColoredSurface(glb) → { vertices: Float64Array (3/vert, world space),
  uvs: Float64Array (2/vert), bounds:{min,max}, baseColor:{ data:Uint8Array, mimeType:string } | null }`
  - Walk the scene graph the same way as `parseGlbMesh`, but **per vertex** (not expanded to a soup):
    transform `POSITION` by the node world matrix → `vertices`; copy `TEXCOORD_0` → `uvs` (one UV per
    vertex, same index space); accumulate `bounds`. Single-primitive meshes are the case (koi/heart);
    multi-primitive concatenates vertices and offsets nothing (UVs are per-vertex; we never use indices
    downstream — nearest-vertex only). If a primitive lacks `TEXCOORD_0`, its UVs are `[0,0]` (and the
    sampler will read texel 0; acceptable, surfaced as a warning seam).
  - `baseColor`: resolve `materials[0].pbrMetallicRoughness.baseColorTexture.index` →
    `textures[i].source` → `images[j]`; slice `bufferViews[images[j].bufferView]` bytes; return
    `{ data, mimeType: images[j].mimeType }`. `null` if any link is missing.
  - Throws `GlbParseError` for malformed input (same class as the existing parser).

### CREATE `src/form/glb-voxel-build.mjs` (~140 lines) — the pure core (AC #1, #2)
No GL, no WebP, no GLB, no network. Imports: `nearestLab`, `srgbToLab` from `../color/cielab.mjs`;
`loadBlockTable` from `../color/block-table.mjs`; `SCALE_MIN/MAX/DEFAULT_SCALE` from `../sculpture.mjs`;
`voxelizeGlb`, `occupiedCells` from `./glb-voxelize.mjs`; `parseGlbColoredSurface` from `./glb-mesh.mjs`;
`PHASE1_MODEL_ID`, `GLB_VOXEL_METHOD_ID` from `../config.mjs`.

- `export function blockPaletteFromTable(table = loadBlockTable()) → [{key,lab}]`
  Thin adapter: `table.blocks.map(b => ({ key: b.block, lab: b.lab }))`. (Lets tests inject a tiny one.)

- `export function sampleSurfaceColors({ occupancy, surface, texture }) → Uint8Array`
  PURE. For each occupied cell (in `occupiedCells` order): world center `c = min + (idx+0.5)·voxelSize`;
  nearest vertex in `surface.vertices` (linear argmin of squared distance); read its UV; nearest-texel
  fetch from `texture {width,height,data:RGBA}` (`u→x`, `1−v→y`, clamp, wrap-safe) → write `[r,g,b]`.
  Returns `Uint8Array(3 · occupancy.count)`.

- `export function colorVoxelsToArtifact(occupancy, colors, opts = {}) → DesignArtifact`
  PURE (no validate). `opts`: `{ palette?, scale?, metadata?, style?, schemaVersion?, paletteId? }`.
  - For cell `n` with rgb `colors[3n..]`: `nearestLab(srgbToLab(rgb), palette).key` → block id
    `minecraft:<key>`; pos via Decision 5 mapping (`x=i−⌊nx/2⌋, y=j, z=k−⌊nz/2⌋`).
  - Emit one `{op:"voxel", pos, block}` per cell; manifest = sorted unique blocks.
  - Throws if `occupancy.count === 0` (schema needs ≥1 placement) or `colors.length !== 3·count`.
  - `metadata`: defaults `{ trial_id, prompting_method_id: GLB_VOXEL_METHOD_ID, model_id:
    PHASE1_MODEL_ID, seed:0, server_state_id:"in-memory" }` merged with `opts.metadata`. `style` default
    `{ name:"glb-voxel", rationale:"…" }`. Mirrors `sculptor/compile.mjs`.

- `export async function glbVoxelBuild(glb, { scale = DEFAULT_SCALE, decodeTexture, palette, metadata,
  style } = {}) → DesignArtifact`
  Tie-together (impure only via injected `decodeTexture`):
  1. `occupancy = voxelizeGlb(glb, { scale })`
  2. `surface = parseGlbColoredSurface(glb)`; throw if `!surface.baseColor` and no fallback.
  3. `texture = await decodeTexture(surface.baseColor)` → `{width,height,data}`.
  4. `colors = sampleSurfaceColors({ occupancy, surface, texture })`
  5. `return colorVoxelsToArtifact(occupancy, colors, { palette, scale, metadata, style })`
  `decodeTexture` required (no default decoder in the pure module — keeps WebP out of `src`/CI).

### MODIFY `src/config.mjs` (+2 lines)
`export const GLB_VOXEL_METHOD_ID = "glb-voxel.v1";` beside the other method ids (single source).

### CREATE `src/form/glb-voxel-build.test.mjs` (~120 lines) — AC #2 + sampler
Pure, offline, no GL, no GLB, no WebP. Uses Node's `node:test`/`assert` like the sibling suites.
- `colorVoxelsToArtifact`:
  - Synthetic occupancy `{ dims:[2,1,2], voxelSize:1, bounds, occupied:Int32Array[...], count:4 }` +
    synthetic `colors` (2 cells red, 2 cells blue) + tiny palette `[{key:"red_wool",lab:LAB_RED},
    {key:"blue_wool",lab:LAB_BLUE}]` → assert: returns 4 voxel placements; manifest is
    `["minecraft:blue_wool","minecraft:red_wool"]` (sorted, unique); **passes `assertArtifact`** (the
    real AJV gate — the round-trip AC); positions match the centering map.
  - Empty occupancy throws; mismatched `colors.length` throws.
  - With the real `blockPaletteFromTable()` (305 blocks): a mid-gray rgb maps to a plausibly gray block
    (sanity, not exact id).
- `sampleSurfaceColors`:
  - Synthetic surface: 2 vertices at known world positions, UVs at opposite texture corners; a 2×2
    RGBA texture with distinct corner colors; occupancy of 2 cells each nearest one vertex → assert each
    cell samples the expected corner color.
- `blockPaletteFromTable`: shape + non-empty.

### CREATE `benchmarks/sculpture/glb-voxel-run.mjs` (~150 lines) — AC #3 (on-demand, GL + host tool)
NOT in `npm test`. Mirrors `voxelize-sanity.mjs`/`run.mjs` conventions.
- `decodeWebpViaDwebp(baseColor) → {width,height,data}`: temp-file `dwebp` → pngjs (via `decodeImage`).
  PNG/JPEG buffers pass straight through `decodeImage` (forward-compatible).
- For each subject in `["koi","heart"]` (skip if GLB absent, like the sanity script):
  1. `artifact = await glbVoxelBuild(bytes, { scale, decodeTexture: decodeWebpViaDwebp })`
  2. `assertArtifact(artifact)` (fail loud if the gate rejects).
  3. `renderArtifact(artifact, { outPath: <subj>/render-3q.png, view: SCULPTURE_VIEW_3Q })` +
     `renderSummary`.
  4. Judge: `loadMeshFromGlb`+`rasterizeSilhouette` (T-048-01) for the GLB silhouette; `extractSilhouette`
     on the render; `normalizeSilhouette` both; `iou` → score.
  5. Write `benchmarks/sculpture/glb-voxel/<subj>/{artifact.json, render-3q.png, summary.json}` +
     a top-level `glb-voxel/summary.md` table (subject, scale, blocks, manifest size, IoU).
- Output dir `benchmarks/sculpture/glb-voxel/` added to `.gitignore` for the heavy PNGs (keep
  `artifact.json` + `summary.md` if small; match how `runs/` renders are handled).

## Ordering (so each step is independently verifiable)
1. `config.mjs` method id (trivial, unblocks metadata).
2. `parseGlbColoredSurface` in `glb-mesh.mjs` + its assertion in `glb-mesh.test.mjs` (extend the
   in-memory `buildBoxGlb` fixture to carry UVs + a tiny baseColor image).
3. `glb-voxel-build.mjs` core (`colorVoxelsToArtifact`, `sampleSurfaceColors`, `blockPaletteFromTable`,
   `glbVoxelBuild`) + `glb-voxel-build.test.mjs`. **`npm test` green here = AC #1, #2, #4.**
4. `glb-voxel-run.mjs` + `.gitignore`; run real koi/heart = AC #3.

## Boundaries preserved
- `cielab.mjs` stays Minecraft-free (we import it, never extend it).
- `src/**` stays GL-free / WebP-free / network-free (the test glob runs clean); all host-tool + GL +
  decode lives in `benchmarks/**`.
- `parseGlbMesh` contract unchanged (T-050-01 voxelizer untouched).
- The core does not validate; the gate is a consumer-side assert (the round-trip pattern).

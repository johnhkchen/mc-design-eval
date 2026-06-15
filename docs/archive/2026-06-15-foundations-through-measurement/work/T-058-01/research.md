# T-058-01 — Research: material-region segmentation (the speckle fix)

Epic **E-18**, story **S-058**. Map of the codebase the ticket touches. Descriptive — what exists,
where, and how it connects. No solutions here (that's `design.md`).

## 1. The problem, located in the code

The glb-voxel build wins on **form** but its **materials speckle**. Two passes already exist on the
rung ladder:

- **R1 — `glbVoxelBuild`** (`src/form/glb-voxel-build.mjs:213`). Voxelize a TRELLIS GLB
  (`voxelizeGlb`), sample one surface colour per occupied cell (`sampleSurfaceColors:72`), then snap
  **each cell independently** to the nearest of the **full 305-block** Lab table (`colorVoxelsToArtifact:131`
  → `nearestLab`). Adjacent cells whose texels differ by a few units land on **different** blocks →
  the speckle (koi 71 / heart 91 distinct blocks).
- **R2 — `materialCleanVoxel`** (`src/form/material-clean.mjs:218`). Narrows it: extract a small
  canonical palette **from the GLB's own texture** (`extractTexturePalette:52`, k=8), snap each voxel
  to that palette (`snapColorsToPalette:70`), then a weak neighbourhood-majority **denoise**
  (`denoiseVoxelKeys:101`, radius 1, 1 pass). **Narrowed but did not eliminate** the speckle: per-voxel
  snap + a radius-1 majority can't enforce *regional* coherence — an isolated off-colour voxel whose
  neighbourhood is split survives as a speck.

The ticket replaces R2's *per-voxel snap + weak smoother* with **region segmentation**, and names
**two observed root-cause symptoms** as directives:

- **Palette leakage** — the build uses *more blocks than the subject has colours*. Sources: per-voxel
  nearest-block over a loose palette; and the optional **E-11 same-hue expansion**
  (`applyMaterialTexture:183` → `hueFamilySet`) letting near-duplicates in. Cure: a **tight fixed
  palette**, zero off-palette blocks, distinct-block ≈ palette size.
- **Gradients** — the GLB texture's smooth gradients scatter into noise under per-voxel snap (many
  adjacent voxels each snap to slightly different near-identical blocks). Cure: a deliberate **band /
  ordered dither** between adjacent palette steps along the gradient direction.

## 2. The data structures (the contract the new code consumes)

- **Occupancy** (`voxelizeGlb`, `src/form/glb-voxelize.mjs:83`):
  `{ scale, voxelSize, dims:[nx,ny,nz], bounds:{min,max}, occupied:Int32Array (flat i,j,k…), count }`.
  Iterate with `occupiedCells(occupancy)` → `Generator<[i,j,k]>` (`glb-voxelize.mjs:109`). **Order is
  load-bearing**: every per-cell array (colours, keys) is in `occupiedCells` order, and the same GLB +
  scale yields the same order — that's how R2 joins to R1 before/after.
- **Surface** (`parseGlbColoredSurface`, `src/form/glb-mesh.mjs`):
  `{ vertices:Float64Array, uvs:Float64Array, baseColor:{data,mimeType} }`.
- **Decoded texture**: `{ width, height, data:Uint8Array }` (RGBA or RGB; channels = `data.length/(w*h)`).
- **Per-cell colours** (`sampleSurfaceColors`, `glb-voxel-build.mjs:72`): `Uint8Array`, flat rgb, 3 per
  cell, `occupiedCells` order. **Pure** — takes an already-decoded texture (nearest-vertex → UV → texel).
- **DesignArtifact** (`src/artifact.mjs`): `{ schema_version, metadata, style:{name,rationale},
  palette:{palette_id?,manifest:string[]}, placements:[{op:"voxel",pos:[x,y,z],block:"minecraft:…"}] }`.
  Validated by `parseArtifact`/`assertArtifact` against `schema/design-artifact.schema.json` (AJV 2020,
  `additionalProperties:false` on `style`).

## 3. The reusable engine (REUSE, not reimplement)

- **E-10 colour core** (`src/color/cielab.mjs`): `srgbToLab(rgb)→Lab`, `deltaE(a,b)` (CIE76 Euclidean,
  alias of `deltaE76`), `nearestLab(targetLab, palette[{key,lab}], {metric?})→{key,deltaE,lab}`. Zero
  project knowledge — pure math. **This is the ΔE metric region-grow needs.**
- **E-10 palette extraction** (`src/color/palette-extract.mjs`): `medianCutLab(points,k)` (deterministic
  weighted median-cut in Lab), `resolvePalette(whitelist)`, `extractPaletteFromPixels(img,opts)→{palette,
  description,…}`. Each palette entry carries `block`, `blockColor:{lab,rgb,hex}`, `coveragePct`.
- **R2 shaping of that** (`material-clean.mjs:52`): `extractTexturePalette(texture,{k,dropColor})` →
  `{ snapPalette:[{key,lab}], entries, description }` where the snap target is each entry's **block
  Lab** (value-true, the way E-14 snaps). **This is exactly the "tight fixed palette" source** — drop k.
- **Shared compile** (`glb-voxel-build.mjs:165`): `keysToArtifact(occupancy, keys[], opts)` — bare keys →
  namespaced `{op:"voxel",pos,block}` placements + sorted-unique manifest. Coordinate map: `i→x,
  j→y(up), k→z`, x/z centred (`x=i−⌊nx/2⌋`). Single source of truth for the artifact wrapper. **The new
  pass produces keys and ends here too.**
- **Speckle metric** (`material-clean.mjs:151`): `speckleScore(occupancy, keys)→[0,1]` = fraction of
  **face-adjacent (6-neighbour) occupied pairs whose blocks differ** (counts each pair once, +i/+j/+k).
  0 = clean. **The before/after metric already exists** — reuse, don't redefine.
- **E-11 material** (`src/sculptor/material.mjs`): `hueFamilySet(target,{size,radius})→namespaced[]`
  (nearest block + same-hue neighbours within ΔE radius, ordered dark→light by L*), `pickMaterial(set,t,h,
  spread)→id` (height `t`∈[0,1] + per-cell hash `h`), `cellHash(x,y)→[0,1)` (xorshift, deterministic, no
  RNG), `tableKey`/`blockId` (namespace strip/add). The optional in-palette texture comes from here.

## 4. The denoise primitive that falls short (why region-grow)

`denoiseVoxelKeys` (`material-clean.mjs:101`) is a **local majority** over a Chebyshev-radius box,
read-old/write-new, ties keep current. It is purely local: a speck whose box has no majority survives,
and it has no notion of a *region* — it can't say "this whole contiguous patch is one material." Region
growth (connected components by ΔE) is the structural upgrade: it groups first, then fills, so a single
off-colour voxel inside a region is absorbed regardless of its immediate 3×3 neighbourhood.

## 5. The runner pattern (the GL/host glue)

`benchmarks/sculpture/glb-voxel-clean.mjs` is the R2 runner and the template for the R-seg runner:
- Imports the **pure core** from `src/`; owns the impure edge itself. `decodeTexture` shells `dwebp`
  (WebP→PNG, host tool) then `decodeImage` (`palette-extract.mjs:294`). **Not in `npm test`** (GL +
  host-tool). `dwebp` is present at `/opt/homebrew/bin/dwebp`; all 7 GLBs are on disk (gitignored).
- Per subject: voxelize → parse surface → decode texture → run the pass → `assertArtifact` → render
  (`render/src/render-tool.mjs renderArtifact`, view `SCULPTURE_VIEW_3Q`) → silhouette IoU vs the GLB
  mesh (`judgeIoU`, `glb-silhouette.mjs` + `form-fidelity.mjs iou`) → write `{artifact.json,
  render-3q.png, summary.json}` and a roll-up `r2.{md,json}`. `--offline` rebuilds tables from summaries.
- **Before/after join**: reads the committed R2 artifact at `glb-voxel-clean/<subject>/artifact.json`
  (present for all 7) and recomputes `speckleScore` over the *same* occupancy. The R-seg runner does the
  same against R2 as its "before".
- **SUBJECTS** (`glb-voxel-breadth.mjs:48`, one source of truth): dancing-man, moai, pineapple,
  bow-and-arrow, heart, mushroom, koi (sword excluded — TRELLIS 500'd on the thin blade).

## 6. Test & purity conventions

- `node:test` + `node:assert/strict`, colocated `*.test.mjs`; `npm test` runs artifact validation then
  `node --test "src/**/*.test.mjs"`. GL/WebP/GLB **never** in the test path.
- The load-bearing split (R1/R2): the pure core takes an **already-decoded** texture and is fully
  offline-testable on synthetic RGBA / synthetic occupancy; the GLB wrapper is impure **only** through an
  injected `decodeTexture`. `material-clean.test.mjs` builds occupancy with `makeOcc(dims,cells)` and
  atlases with `atlasRow(texels)` — the fixtures the new tests should mirror.
- Determinism: no `Math.random()` — `cellHash` (xorshift) is the established source of reproducible
  per-cell variation. Ordered dither must follow suit (position/Bayer-indexed, not random).

## 7. Constraints & assumptions surfaced

- **Concurrency / file collision**: T-059-01 (sibling root, thin-feature voxelization) is live and
  touches `glb-voxelize.mjs`. T-058-01 must **add new files only** and not modify shared voxelization —
  it consumes `voxelizeGlb` read-only (see memory: parallel-roots-duplicate-shared-deps).
- **Off-palette = 0 is achievable by construction**: if the pass only ever emits blocks drawn from the
  fixed palette, off-palette is structurally zero. The interesting metric is *R2's* leakage measured
  against that same fixed palette (how many R2 blocks fall outside it).
- **`speckleScore` is coverage-blind & boundary-counting**: it counts every differing adjacent pair, so
  a *legitimate* sharp material boundary also scores. Region fill will drive it down; a banded gradient
  keeps a small, monotonic residual (adjacent steps differ) — expected, not a regression.
- **Form IoU must not move**: the pass never touches occupancy (only re-decides each cell's block), so
  IoU is invariant by construction modulo GL rounding — same guarantee R2 had.
- Coordinate/voxel order (`occupiedCells`) is the join key; any region structure must be expressed over
  that order, never re-deriving a different traversal.

# T-055-01 — structure: material-clean-pass (E-17 rung R2)

The blueprint: files, public interfaces, and the order of changes. Not code — the shape of the code.

## Files

| file | action | purpose |
| ---- | ------ | ------- |
| `src/form/glb-voxel-build.mjs` | **modify** | extract `keysToArtifact(occupancy, keys, opts)`; `colorVoxelsToArtifact` delegates to it (behavior-preserving) |
| `src/form/material-clean.mjs` | **create** | the R2 pure core + helpers + impure `materialCleanGlb` |
| `src/form/material-clean.test.mjs` | **create** | pure, GL-free unit tests on synthetic noisy color (AC #3) |
| `benchmarks/sculpture/glb-voxel-clean.mjs` | **create** | the R2 breadth runner over the 7 subjects (AC #4) |
| `.gitignore` | **modify** | ignore `benchmarks/sculpture/glb-voxel-clean/**/render-3q.png` |
| `benchmarks/sculpture/glb-voxel-clean/<subject>/` | **generated** | per-subject `artifact.json` + `summary.json` (durable) + `render-3q.png` (ignored) |
| `benchmarks/sculpture/glb-voxel-clean/r2.{md,json}` | **generated** | the R2 before/after roll-up |

## `src/form/glb-voxel-build.mjs` — the refactor (behavior-preserving)

Extract the tail of `colorVoxelsToArtifact` into a shared helper. New export:

```
keysToArtifact(occupancy, keys, opts = {}) → DesignArtifact
  // keys: bare block keys (no namespace), length === occupancy.count, in occupiedCells order
  // validates: count ∈ ℤ>0 ; keys.length === count
  // builds: ox=⌊dims[0]/2⌋, oz=⌊dims[2]/2⌋
  //         placements[n] = { op:"voxel", pos:[i-ox, j, k-oz], block:`minecraft:${keys[n]}` }
  //         manifest = sorted unique blocks
  //         metadata = {...GLB_VOXEL_DEFAULTS.metadata, ...opts.metadata}
  //         style    = opts.style ?? {...GLB_VOXEL_DEFAULTS.style}
  //         palette  = opts.paletteId ? {palette_id, manifest} : {manifest}
  //         schema_version = opts.schemaVersion ?? "1.0.0"
```

`colorVoxelsToArtifact(occupancy, colors, opts)` keeps its exact signature/behavior, now implemented as:
resolve palette (`opts.palette ?? blockPaletteFromTable()`) → per cell `key = nearestLab(srgbToLab(rgb),
palette).key` → `return keysToArtifact(occupancy, keys, opts)`. The empty-occupancy and
colors-length-mismatch throws stay in `colorVoxelsToArtifact`; `keysToArtifact` re-checks `keys.length`.

## `src/form/material-clean.mjs` — public interface

```
// PURE helpers ---------------------------------------------------------------

extractTexturePalette(texture, opts = {}) → { snapPalette, entries, description }
  // texture: decoded {width,height,data} RGBA (or RGB) atlas
  // opts: { k=8, dropColor=DEFAULT (near-black), dropTolerance, alphaThreshold }
  // → entries: the E-10 palette[] (block, repColor, coveragePct, deltaE, blockColor)
  //   snapPalette: entries.map(e => ({ key: e.block, lab: e.blockColor.lab }))  // value-true (Decision 4)
  //   description: e-10 one-liner ("N blocks over X% of frame: …")
  // delegates wholesale to extractPaletteFromPixels — NO new color math

snapColorsToPalette(colors, snapPalette) → string[]   // bare keys, occupiedCells order
  // colors: flat rgb (3/cell); per cell nearestLab(srgbToLab(rgb), snapPalette).key

denoiseVoxelKeys(occupancy, keys, opts = {}) → string[]   // Decision 5
  // opts: { radius=1, passes=1 }
  // index occupied cells into a Map "i,j,k"→n; for each cell, tally blocks of occupied cells in the
  // Chebyshev-radius box (cell included); pick max-count, ties keep keys[n]; read-old/write-new per pass

speckleScore(occupancy, keys) → number   // Decision 7
  // fraction of face-adjacent (6-neighbor) occupied cell pairs with keys[a] !== keys[b]; 0 if no pairs

applyMaterialTexture(occupancy, keys, opts = {}) → string[]   // Decision 6, optional
  // opts: { size, radius, spread }; per cell: set=hueFamilySet(keys[n]); t=height frac; pick by cellHash(i,k)
  // returns BARE keys (strips the namespace hueFamilySet adds)

materialCleanVoxel(build, opts = {}) → DesignArtifact   // the headline (PURE)
  // build: { occupancy, surface, texture }
  // opts: { k, dropColor, denoise:{radius,passes}, materialTexture:false|{...},
  //         metadata, style, paletteId, palette? }
  // pipeline: extractTexturePalette → sampleSurfaceColors → snapColorsToPalette → denoiseVoxelKeys
  //           → (materialTexture ? applyMaterialTexture : id) → keysToArtifact
  // does NOT validate (round-trip; runner asserts)

// IMPURE (injected codec) ----------------------------------------------------

materialCleanGlb(glb, opts) → Promise<DesignArtifact>
  // opts: { scale=DEFAULT_SCALE, decodeTexture, ...materialCleanVoxel opts }
  // voxelizeGlb → parseGlbColoredSurface (throws if no baseColor) → decodeTexture(baseColor)
  //   → materialCleanVoxel({occupancy, surface, texture}, opts)
  // mirrors glbVoxelBuild's shape exactly (assertScale, decodeTexture required)
```

Imports: `extractPaletteFromPixels` (`../color/palette-extract.mjs`), `srgbToLab`/`nearestLab`
(`../color/cielab.mjs`), `sampleSurfaceColors`/`keysToArtifact` (`./glb-voxel-build.mjs`),
`voxelizeGlb`/`occupiedCells` (`./glb-voxelize.mjs`), `parseGlbColoredSurface` (`./glb-mesh.mjs`),
`hueFamilySet`/`pickMaterial`/`cellHash`/`tableKey` (`../sculptor/material.mjs`), `DEFAULT_SCALE`
(`../sculpture.mjs`). Style constant `MATERIAL_CLEAN_STYLE = { name:"glb-voxel-clean", rationale: … }`.

## `src/form/material-clean.test.mjs` — coverage (pure, synthetic, AJV round-trip)

- `extractTexturePalette`: a synthetic 2-dominant-color noisy atlas → `snapPalette.length ≤ k`, every
  `key` present in `loadBlockTable`, each `lab` length 3.
- `snapColorsToPalette` shrinks distinct count: noisy colors snapped to the canonical palette yield ≤
  `snapPalette.length` distinct keys, far fewer than snapping the same colors to the full 305-table.
- `denoiseVoxelKeys`: a salt-and-pepper grid (one outlier cell in a block of one dominant key) →
  outlier flipped to the dominant key; distinct count and `speckleScore` drop; `occupancy.count`
  unchanged; tie keeps current.
- `speckleScore`: a hand-built 2×1×1 grid (two different keys → 1.0; same key → 0.0).
- `materialCleanVoxel`: synthetic `build` → artifact passes `assertArtifact`; distinct-block count ≤
  naive full-table count on the same colors; placements == occupancy.count.
- `applyMaterialTexture`: turning it on keeps all keys in the table and only expands within hue families
  (distinct count grows but bounded), occupancy unchanged.
- `keysToArtifact` (added here or in glb-voxel-build.test): parity — `colorVoxelsToArtifact` output equals
  `keysToArtifact` fed the keys it would compute.

## `benchmarks/sculpture/glb-voxel-clean.mjs` — runner shape (mirrors glb-voxel-breadth.mjs)

- Reuse `import { SUBJECTS } from "./glb-voxel-breadth.mjs"` (side-effect-free) — one source of truth.
- Reuse the impure glue *shape*: `decodeTexture` (dwebp), `judgeIoU`, `regenMissingGlb`, skip-not-error,
  `--offline`. (Copied locally per the established "each harness owns its render/host glue" split; the
  pure logic is what lives in `src/`.)
- Per subject: `voxelizeGlb` (for occupancy + before-keys reconstruction) → `materialCleanGlb` (R2
  artifact) → `assertArtifact` → write `glb-voxel-clean/<subj>/artifact.json` → render `render-3q.png` →
  `judgeIoU`. Read R1 `glb-voxel/<subj>/artifact.json` for **before** keys + manifest; compute
  `speckleScore` before/after on the shared occupancy.
- `summary.json` per subject: `{ subject, scale, occupancy, manifestBefore, manifestAfter,
  speckleBefore, speckleAfter, formIoUBefore, formIoUAfter, paletteDescription, durationSec }`.
- `r2.{md,json}` roll-up: a before/after table (subject | occupancy | distinct R1→R2 | speckle R1→R2 |
  form IoU R1→R2) + provenance (method, view, scale, metric notes, sword exclusion). Pure `buildR2(rows)`.
- CLI: `node glb-voxel-clean.mjs [scale]`, `--offline`, `--regen-missing [scale]`.

## Ordering of changes

1. Refactor `keysToArtifact` in `glb-voxel-build.mjs` (+ keep tests green) — unblocks the pure core.
2. `material-clean.mjs` pure helpers + `materialCleanVoxel` + `materialCleanGlb`.
3. `material-clean.test.mjs` — prove pure behavior + AJV round-trip; `npm test` green.
4. `.gitignore` entry.
5. `glb-voxel-clean.mjs` runner; live 7-subject sweep → artifacts + `r2.{md,json}`.
6. `--offline` determinism check; commit.

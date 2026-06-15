# T-058-01 — Structure: file-level blueprint

The shape of the code, not the code. Two new files in `src/`, one new test, one new runner. **No existing
file is modified** (R2 untouched; `glb-voxelize.mjs` left for the sibling root). All `src/` additions are
pure and offline-testable; the GL/host edge lives only in the benchmark runner.

## Files

| File | Action | Purity |
| ---- | ------ | ------ |
| `src/form/material-segment.mjs` | **create** — the pure core | pure (no GL/WebP/GLB/net/RNG) |
| `src/form/material-segment.test.mjs` | **create** — `node:test`, synthetic fixtures | pure |
| `benchmarks/sculpture/glb-voxel-seg.mjs` | **create** — GL/host sweep runner | impure (dwebp + render) |
| `benchmarks/sculpture/glb-voxel-seg/<subject>/` | **generated** — artifact/render/summary | output (gitignored renders) |

No deletes. No edits to `material-clean.mjs`, `glb-voxel-build.mjs`, `glb-voxelize.mjs`, `cielab.mjs`,
`palette-extract.mjs`, `sculptor/material.mjs`, `artifact.mjs`, or the schema.

## `src/form/material-segment.mjs` — public + internal interface

Header comment mirrors `material-clean.mjs`: what/why, the purity split, REUSE-not-reimplement list.

### Imports (all reuse)
```
extractTexturePalette, speckleScore            from "./material-clean.mjs"
sampleSurfaceColors, keysToArtifact            from "./glb-voxel-build.mjs"
voxelizeGlb, occupiedCells                     from "./glb-voxelize.mjs"   // read-only
parseGlbColoredSurface                         from "./glb-mesh.mjs"
srgbToLab, deltaE, nearestLab                  from "../color/cielab.mjs"
hueFamilySet, pickMaterial, cellHash, tableKey from "../sculptor/material.mjs"
DEFAULT_SCALE                                  from "../sculpture.mjs"
```

### Exported constants
- `SEG_DEFAULTS = Object.freeze({ k:6, growDE:10, gradDE:18, minRegion:2, neighbourhood:6 })`
- `MATERIAL_SEG_STYLE = Object.freeze({ name:"glb-voxel-seg", rationale:"…region-segmented…" })`

### Exported pure functions (each independently unit-testable)

1. `cellLabs(colors) → Float64Array` (3·count) — per-cell `srgbToLab`. Thin; lets tests pass Labs
   directly. *(or inline; keep small + named for testing.)*

2. `growRegions(occupancy, labs, { growDE, neighbourhood }) → { labelOf:Int32Array(count), regions:[{cells:int[], }] }`
   — 6- (or 26-) neighbour connected components; two adjacent occupied cells share a label iff
   `deltaE(labA,labB) ≤ growDE`. BFS/union-find over `occupiedCells` order using an `"i,j,k"→index` map
   (the `indexCells` pattern from `material-clean.mjs`, re-implemented locally to avoid exporting it).
   Returns per-cell label + region membership (cell indices in `occupiedCells` order).

3. `regionStats(region, labs) → { mean:[L,a,b], spread:number, min:[…], max:[…] }` — count-free Lab
   bounding box + mean; `spread` = diagonal of the Lab bbox (or principal-axis range).

4. `absorbSmallRegions({ labelOf, regions }, occupancy, labs, { minRegion }) → { labelOf, regions }`
   — merge each region with `cells.length < minRegion` into the 6-adjacent region whose mean Lab is
   nearest; iterate smallest-first, deterministic tie-break (first-cell index). Pure relabel; occupancy
   untouched.

5. `gradientAxis(region, occupancy, labs) → 0|1|2` — argmax abs Pearson corr between cell coord on axis
   and cell L*; degenerate → 1 (j/height).

6. `orderedDither(a, b, frac) → 0|1` — Bayer-thresholded choice between two steps. `a,b` are the two
   perpendicular coords; returns 0 (low step) if `bayer(a,b) ≥ frac` else 1. 4×4 Bayer matrix constant.

7. `bandRegion(region, occupancy, labs, palette) → Map<cellIndex,key>` — the gradient fill: derive
   ordered `steps` (distinct nearest-palette blocks, sorted by L*); axis via `gradientAxis`; per cell
   `p→s→base/frac→orderedDither` → `steps[base|base+1]`. `K==1` ⇒ all `steps[0]` (degenerate flat).

8. `fillRegion(region, occupancy, labs, palette, { gradDE }) → Map<cellIndex,key>` — flat (spread≤gradDE)
   → one nearest-palette block to mean; else `bandRegion`. The per-region dispatcher.

9. `applyPaletteTexture(occupancy, keys, palette, opts) → keys` — optional E-11, **filtered to palette**:
   `hueFamilySet` ∩ fixed palette, `pickMaterial` by height + `cellHash`; bare keys. Default unused.

10. `offPaletteCount(keys, palette) → number` — keys (bare) not in the palette's key set. The directive
    metric; segmented output must yield 0.

11. `segmentMaterials(build, opts={}) → DesignArtifact` — the pipeline (design.md): extract palette →
    `sampleSurfaceColors` → `cellLabs` → `growRegions` → `absorbSmallRegions` → per-region `fillRegion`
    into a `keys[]` (occupiedCells order) → optional `applyPaletteTexture` → `keysToArtifact`. Pure; does
    NOT validate (consumer asserts). Accepts `{ k, growDE, gradDE, minRegion, neighbourhood,
    materialTexture, metadata, style, paletteId, dropColor }`.

12. `segmentMaterialsGlb(glb, { scale, decodeTexture, …segOpts }) → Promise<DesignArtifact>` — impure
    only via injected `decodeTexture`: `voxelizeGlb` → `parseGlbColoredSurface` → decode → `segmentMaterials`.
    Mirrors `materialCleanGlb`.

### Internal (not exported)
- `indexCells(occupancy)` — `"i,j,k"→cellIndex` map (occupiedCells order). Local copy (material-clean's
  is not exported); 8 lines.
- `BAYER4` — the 4×4 ordered-dither matrix (normalised to (0,1)).
- `paletteKeySet(palette)` — `Set` of bare keys for membership checks.

### Purity contract
No `Math.random`; `cellHash`/Bayer give all variation. No I/O, no schema import. `segmentMaterials` takes
an already-decoded texture; the GLB+WebP edge is `segmentMaterialsGlb`'s injected `decodeTexture` only.

## `src/form/material-segment.test.mjs` — coverage map (mirrors `material-clean.test.mjs`)

Fixtures reused verbatim in spirit: `makeOcc(dims, cells)`, `atlasRow(texels)`; a `makeLabs(colors)`
helper. Tests (one assert-cluster each):

- **growRegions** — a 3×3 wall, two colour halves within growDE merge into 2 regions; a salt-and-pepper
  field with one off cell → the off cell is its own region (pre-absorb).
- **absorbSmallRegions** — a single off-colour voxel in a uniform field is absorbed into the surrounding
  region (label count → 1); occupancy length unchanged.
- **fillRegion (flat)** — a noisy-but-flat region → exactly **one** palette block.
- **bandRegion / gradient (the directive)** — a 1×N column with a smooth dark→light gradient → a
  **monotonic non-decreasing staircase** over ≤K palette steps; **any two adjacent cells differ by ≤1
  step** (⇒ ≤2 adjacent blocks across the transition); distinct blocks ≤ palette size; not random
  (assert monotonic). A wide slab variant: any axis-aligned line along the gradient is monotonic.
- **orderedDither** — deterministic; `frac=0` → always low step, `frac→1` → mostly high; reproducible.
- **offPaletteCount / palette discipline** — segmented keys ⊂ palette ⇒ `offPaletteCount==0`;
  `distinct(keys) ≤ palette.length`.
- **speckle drops** — synthetic noisy build: `speckleScore(after) < speckleScore(naive R1)` and `< R2-ish`
  per-voxel snap on the same colours.
- **segmentMaterials end-to-end** — synthetic noisy build → `assertArtifact` passes (real AJV gate); one
  placement per occupied cell; `style.name==="glb-voxel-seg"`; manifest length ≤ palette size; off-palette
  0; distinct ≤ naive full-table.
- **applyPaletteTexture** — stays in palette (off-palette 0) even with texture on.
- **purity/determinism** — same input twice → deep-equal artifact.

## `benchmarks/sculpture/glb-voxel-seg.mjs` — runner blueprint (clone of `glb-voxel-clean.mjs`)

Same skeleton: `run()` child-proc, `decodeTexture` (dwebp), `judgeIoU`, `keysFromArtifact`, `SUBJECTS`
imported from `glb-voxel-breadth.mjs`. Differences:
- `OUT_DIR = glb-voxel-seg`; **before** baseline = committed `glb-voxel-clean/<subject>/artifact.json`
  (R2), with `speckleScore` recomputed over the shared occupancy; also reads `glb-voxel-clean/<subject>/
  summary.json` for `formIoUBefore`.
- Calls `segmentMaterials({occupancy,surface,texture}, {…})`; re-derives the fixed palette via
  `extractTexturePalette(texture,{k:SEG_DEFAULTS.k})` for `offPalette` (count R2's blocks outside it).
- Per-subject `summary.json` adds `offPaletteBefore`/`offPaletteAfter` (0), `distinctBefore`/`After`,
  `speckleBefore`/`After`, `formIoUBefore`/`After`, `paletteSize`, `regionCount`.
- Roll-up `seg.{md,json}` (schema `glb-voxel-seg/v1`): table `subject | occupancy | distinct R2→seg |
  speckle R2→seg | off-palette R2→seg | form IoU R2→seg`. `--offline` rebuilds from summaries.
- Modes: `node glb-voxel-seg.mjs [scale]` (live), `--offline`, `--regen-missing` (same as R2 runner).

## Ordering of changes (atomic commits — see `plan.md`)
1. core: `material-segment.mjs` (palette + growRegions + absorb).  2. core: fill/band/dither + speckle/
off-palette + `segmentMaterials` + `segmentMaterialsGlb`.  3. tests green.  4. runner.  5. sweep +
`seg.{md,json}` + summaries.  Steps 1–3 are pure and CI-verified; 4–5 are GL/host (manual, not in
`npm test`).

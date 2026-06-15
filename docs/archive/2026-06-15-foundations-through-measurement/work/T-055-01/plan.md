# T-055-01 — plan: material-clean-pass (E-17 rung R2)

Ordered, independently-verifiable steps. Each step ends green and commits atomically. Testing strategy:
the pure core (`src/`) is unit-tested in `npm test` on synthetic data with an AJV round-trip; the runner
(`benchmarks/`) is GL/host-tool and out of `npm test`, verified by running the live sweep + an `--offline`
determinism re-run.

## Step 1 — Refactor `keysToArtifact` out of `colorVoxelsToArtifact` (DRY seam)

- In `src/form/glb-voxel-build.mjs`, add `keysToArtifact(occupancy, keys, opts)` holding the coordinate
  map + manifest + wrapper (Decision 3 / structure.md). Re-implement `colorVoxelsToArtifact` to compute
  keys via `nearestLab` then `return keysToArtifact(occupancy, keys, opts)`. Keep the empty-occupancy and
  colors-length throws where they are; `keysToArtifact` re-validates `keys.length === count`.
- Export `keysToArtifact`.
- **Verify:** `node --test src/form/glb-voxel-build.test.mjs` — existing tests pass unchanged (proves the
  refactor is behavior-preserving). `npm test` green.
- **Commit:** `refactor(E-17 T-055-01): extract keysToArtifact from colorVoxelsToArtifact (DRY for R2)`

## Step 2 — `src/form/material-clean.mjs` pure core + impure GLB wrapper

- Implement, in order: `MATERIAL_CLEAN_STYLE`; `extractTexturePalette` (delegate to
  `extractPaletteFromPixels`, map to `snapPalette` via `blockColor.lab`); `snapColorsToPalette`;
  `denoiseVoxelKeys` (Map-indexed Chebyshev-box majority, read-old/write-new, `passes`); `speckleScore`
  (6-neighbour adjacency); `applyMaterialTexture` (reuse `hueFamilySet`/`pickMaterial`/`cellHash`,
  strip namespace); `materialCleanVoxel(build, opts)` (the pipeline); `materialCleanGlb(glb, opts)`
  (impure-via-injection, mirrors `glbVoxelBuild`).
- No new color math, no GL, no WebP, no schema import; reuse `sampleSurfaceColors` + `keysToArtifact`.
- **Verify:** module imports clean (`node -e "import('./src/form/material-clean.mjs')"`), no `../`
  coupling into `cielab.mjs`'s graph beyond what's allowed (the reuse-boundary test already guards it).
- **Commit:** folded into Step 3's commit (core + its tests land together).

## Step 3 — `src/form/material-clean.test.mjs` (pure, synthetic, AJV round-trip — AC #2 & #3)

- Build a synthetic decoded atlas (two dominant colors + per-texel jitter) and a synthetic `build`
  (`occupancy` slab + `surface` vertices/uvs mapping cells onto the atlas). Tests per structure.md:
  texture-palette extraction is small + value-true; per-voxel snap shrinks distinct count vs full table;
  `denoiseVoxelKeys` removes a speck (distinct + speckle down, occupancy unchanged, tie keeps current);
  `speckleScore` on a hand grid; `materialCleanVoxel` → `assertArtifact` passes, distinct ≤ naive,
  placements == count; `applyMaterialTexture` stays in-table + bounded; `keysToArtifact` parity.
- **Verify:** `node --test src/form/material-clean.test.mjs` green; **`npm test` green** (AC #5).
- **Commit:** `feat(E-17 T-055-01): materialCleanVoxel — texture-palette snap + spatial denoise (pure core + tests)`

## Step 4 — `.gitignore` + runner `benchmarks/sculpture/glb-voxel-clean.mjs`

- Add `benchmarks/sculpture/glb-voxel-clean/**/render-3q.png` to `.gitignore` (mirrors the R1 entry).
- Write the runner (structure.md): reuse `SUBJECTS` from `glb-voxel-breadth.mjs`; local `decodeTexture`
  /`judgeIoU`/`regenMissingGlb`; per-subject `materialCleanGlb` → assert → render → judge; reconstruct R1
  before-keys from `glb-voxel/<subj>/artifact.json`; compute `speckleScore` before/after on the shared
  `voxelizeGlb` occupancy; write `summary.json`; pure `buildR2(rows)` → `r2.{md,json}`; `--offline` and
  `--regen-missing` branches; `import.meta.url` main-guard; export `{ SUBJECTS, buildR2, runClean }`.
- **Verify:** `node -c benchmarks/sculpture/glb-voxel-clean.mjs` (parses); importing it has no side
  effects; `npm test` still green (benchmark not collected, but confirm no accidental `src/` breakage).
- **Commit:** `feat(E-17 T-055-01): glb-voxel-clean runner (R2 sweep, before/after noise drop)`

## Step 5 — Live 7-subject R2 sweep → artifacts + roll-up (AC #4)

- Run `node benchmarks/sculpture/glb-voxel-clean.mjs` (scale 32). Produces
  `glb-voxel-clean/<subject>/{artifact.json, render-3q.png, summary.json}` for all 7 and
  `glb-voxel-clean/r2.{md,json}`.
- **Verify (the AC #4 bar):** for every subject `manifestAfter < manifestBefore` (distinct-block count
  down — expect a large drop from 71/91 toward ~k) and `speckleAfter < speckleBefore`; `formIoUAfter ≈
  formIoUBefore` (within GL rounding — form not broken). Eyeball a render or two for a visibly cleaner
  skin. `assertArtifact` passed for all 7 (the runner asserts; no skips on present GLBs).
- **Commit:** `feat(E-17 T-055-01): R2 material-clean builds + before/after table across 7 subjects`

## Step 6 — Determinism + hygiene + Review

- **Verify:** `node benchmarks/sculpture/glb-voxel-clean.mjs --offline` reproduces `r2.{md,json}` with
  zero diff (deterministic core; GL IoU already 3-dp). `git status` clean of stray files; no secret
  (`MODAL_ENDPOINT_URL`) printed by the regen branch; absent-GLB path skips rather than crashes.
- Write `review.md` (changes, test coverage, open concerns).
- **Commit:** `docs(E-17 T-055-01): R2 progress + review`

## Testing strategy summary

| concern | where | how |
| ------- | ----- | --- |
| palette extracted from texture (AC #1) | unit | synthetic atlas → small value-true `snapPalette`, keys in table |
| `materialCleanVoxel` → AJV-valid (AC #2) | unit | synthetic `build` → `assertArtifact` round-trip |
| denoise reduces distinct count (AC #3) | unit | salt-and-pepper grid → distinct + speckle down, pure |
| applied to 7 builds, noise drop (AC #4) | live run | `r2.{md,json}` before/after, form IoU steady |
| `npm test` green (AC #5) | CI | full suite after each src commit |

## Risks & mitigations

- **Atlas background steals a cluster** → near-black `dropColor` default removes fill; unused palette
  entries are harmless (never snapped to). If a subject's atlas has a non-black fill that distorts the
  palette, expose/raise `k` or set `dropColor` per the runner — but default first, inspect the table.
- **Denoise over-washes a real 2-block boundary** → `radius=1`, `passes=1`, tie-keeps-current are
  conservative; verify form IoU steady and inspect renders.
- **Refactor regresses R1** → Step 1 is behavior-preserving and gated by the existing R1 tests before any
  R2 code is written.

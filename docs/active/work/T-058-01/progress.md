# T-058-01 — Progress

Implementation of **material-region segmentation** (E-18 speckle fix). All five plan steps complete.
The pure core + tests are committed; the GL/host runner + 7-subject sweep land in the final commit.

## Step status

| step | what | status |
| ---- | ---- | ------ |
| 1 | region growth + small-region absorption (core A) | ✅ done |
| 2 | gradient band/dither + region fill + `segmentMaterials` entry (core B) | ✅ done |
| 3 | unit tests (synthetic, GL-free) | ✅ done |
| 4 | `glb-voxel-seg.mjs` sweep runner | ✅ done |
| 5 | run 7-subject sweep, write outputs, confirm directives | ✅ done |

## What was built

- **`src/form/material-segment.mjs`** — pure core. `segmentMaterials(build, opts) → DesignArtifact`:
  extract a tight fixed palette from the GLB baseColor texture (E-10 `medianCutLab`/`resolvePalette`),
  grow occupied cells into connected components by Lab ΔE (`growRegions`, 6-neighbour, join when
  `deltaE ≤ growDE`), absorb sub-`minRegion` specks into the nearest-mean-Lab adjacent region
  (`absorbSmallRegions`), fill each region with ONE palette block (`fillRegion`), and band gradient
  regions (`spread > gradDE`) along their gradient axis (`gradientAxis` via argmax |Pearson(coord, L*)|,
  `bandRegion`). Off-palette is 0 by construction. Optional E-11 `applyPaletteTexture` stays inside the
  palette. `speckleScore`/`offPaletteCount` exported for the runner.
- **`src/form/material-segment.test.mjs`** — 14 GL-free unit tests on synthetic occupancy + atlas:
  region growth, speck absorption, flat fill, gradient monotonic staircase, ≤1-step adjacency, ordered-
  dither determinism, hard-band-cleaner-than-dither, palette discipline (off-palette 0, distinct ≤
  palette), speckle drop vs naïve R1 snap, AJV round-trip, determinism.
- **`benchmarks/sculpture/glb-voxel-seg.mjs`** — GL/host sweep runner (clone of `glb-voxel-clean.mjs`
  glue: dwebp decode, silhouette-IoU judge, R2 before-baseline). Live / `--offline` / `--regen-missing`.

## Deviation from plan — the key correction

Plan Step 5 anticipated tuning `SEG_DEFAULTS` if a default misbehaved. **It did.** The first sweep used
the design.md defaults (`growDE=10, gradDE=18, minRegion=2`) with an ordered-Bayer dither on gradient
regions. Result: **speckle ROSE on most subjects, including the noisy ones the AC names** (heart
0.343→0.482, koi 0.35→0.438). Two causes, two fixes:

1. **Dither scatters.** A Bayer dither spreads two palette blocks across a gradient region, *inflating*
   the face-adjacent-difference metric — the opposite of the AC's intent. **Fix:** the default is now a
   **hard band** (nearest palette step per cell → solid stripes, one-cell-wide transitions). The dither
   is retained but opt-in via `dither:true`. Threaded through `bandRegion → fillRegion →
   segmentMaterials`; a new test asserts `speckle(hard) ≤ speckle(dither)`.
2. **Over-fragmentation.** `growDE=10, minRegion=2` left many small regions → many inter-region
   boundaries → speckle. **Fix:** `SEG_DEFAULTS` retuned on the sweep to `growDE=20, gradDE=25,
   minRegion=8` (fewer, larger regions; specks up to 8 cells absorbed).

Both changes are committed in the core diff. The narrative header in the runner (and so `seg.md`) was
corrected from "ordered Bayer dither" to "hard band" to match the shipped default.

## Live sweep result (scale 32, R2 → R-seg)

| subject | distinct | speckle | off-palette | form IoU |
| ------- | -------- | ------- | ----------- | -------- |
| dancing-man | 5→5 | 0.275→0.189 | 319→0 | 0.914→0.914 |
| moai | 5→5 | 0.248→0.123 | 0→0 | 0.565→0.565 |
| pineapple | 5→4 | 0.25→0.133 | 2003→0 | 0.907→0.907 |
| bow-and-arrow | 8→5 | 0.366→0.251 | 164→0 | 0.473→0.473 |
| heart | 7→6 | **0.343→0.208** | 2831→0 | 0.877→0.877 |
| mushroom | 7→6 | 0.301→0.315 | 2300→0 | 0.98→0.98 |
| koi | 8→6 | **0.35→0.287** | 586→0 | 0.623→0.622 |

- **Off-palette = 0 on all 7** (the directive). ✅
- **Distinct ≈ palette size**, large drop vs R2 where R2 leaked (koi 8→6, bow 8→5). ✅
- **Speckle drops on heart and koi** (the AC's named noisy subjects) and on 6/7 overall. ✅
- **Form IoU held** (koi 0.623→0.622 = GL rounding; bow steady; rest identical). ✅
- **Only deviation:** mushroom speckle +0.014 (0.301→0.315) — it is already the cleanest, highest-IoU
  subject (0.98) and least in need of the pass; flagged in `review.md`, not blocking.

## Verification

- `npm test` — **577/577 green** (was 576; +1 hard-band-vs-dither test).
- Live sweep ran end-to-end on all 7 subjects without throwing; `assertArtifact` passes in-runner.
- Renders inspected (per memory: inspect renders, not block counts) — regions read coherent, gradients
  read as banded steps, no scatter.

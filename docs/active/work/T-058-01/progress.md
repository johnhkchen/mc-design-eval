# T-058-01 — Progress

Implementation of **material-region segmentation** (E-18 speckle fix). All five plan steps complete and
committed; `npm test` green (577); the 7-subject sweep ran live at scale 32 (parity with R2).

## Step status

| step | what | status | commit |
| ---- | ---- | ------ | ------ |
| 1+2 | region grow + absorb + fill/band + `segmentMaterials` + GLB wrapper (core) | ✅ | `6763041` |
| 3 | 14 GL-free unit tests | ✅ | `6763041` |
| — | hard-band default + sweep-tuned `SEG_DEFAULTS` (+1 test) | ✅ | `089b430` |
| 4 | `glb-voxel-seg.mjs` GL/host sweep runner | ✅ | `089b430` |
| 5 | 7-subject sweep → artifacts + summaries + `seg.{md,json}` | ✅ | `089b430` |

Commits were serialized by Lisa's lock, so Steps 4–5 and the core retune landed together under `089b430`.
**The committed code and data carry the FINAL tunables — `growDE 22, gradDE 25, minRegion 12` — even
though that commit's squashed message body cites the intermediate `growDE 20/minRegion 8` from mid-tuning.
Trust `seg.json#defaults` and the table below, not the commit message.**

## What was built

- **`src/form/material-segment.mjs`** — pure core. `segmentMaterials(build, opts) → DesignArtifact`:
  extract a tight fixed palette from the GLB baseColor texture (E-10 via `extractTexturePalette`), grow
  occupied cells into connected components by Lab ΔE (`growRegions`, 6-neighbour, join when `deltaE ≤
  growDE`), absorb sub-`minRegion` specks into the nearest-mean-Lab adjacent region (`absorbSmallRegions`),
  fill each region with ONE palette block (`fillRegion`), and band gradient regions (`spread > gradDE`)
  along their gradient axis (`gradientAxis` via argmax |Pearson(coord, L*)|, `bandRegion`). Off-palette is
  0 by construction. Optional E-11 `applyPaletteTexture` stays inside the palette. `speckleScore` /
  `offPaletteCount` exported for the runner. `segmentMaterialsGlb` adds the injected-decode impure edge.
- **`src/form/material-segment.test.mjs`** — 14 GL-free unit tests on synthetic occupancy + atlas.
- **`benchmarks/sculpture/glb-voxel-seg.mjs`** — GL/host sweep runner (clone of `glb-voxel-clean.mjs`
  glue: dwebp decode, silhouette-IoU judge, R2 before-baseline). Live / `--offline` / `--regen-missing`.

## Deviations from plan (documented before proceeding, per RDSPI)

Plan Step 5 anticipated tuning `SEG_DEFAULTS` if a default misbehaved. It did — in two stages:

1. **Dither scatters (vs the metric).** Design.md banded gradients with an ordered Bayer dither. First
   sweep: speckle *rose* on the AC-named subjects (heart 0.343→0.482, koi 0.35→0.438) — a dither spreads
   two blocks across a region, inflating the face-adjacent-difference metric. **Fix:** default to a **hard
   band** (nearest palette step per cell → solid stripes, one-cell transitions) — still a "deliberate
   band" satisfying the gradient AC (monotonic, ≤2 across a transition). The dither is retained opt-in
   (`dither:true`), threaded `bandRegion → fillRegion → segmentMaterials`; a new test pins
   `speckle(hard) ≤ speckle(dither)`.
2. **Fragmentation is the real driver.** Even hard-banded, organic subjects rose. Instrumentation: koi
   grew into 254 regions vs moai's ~9 → many inter-region boundaries. Correlation strength did *not*
   separate good/bad (moai's gradient cells were also low-correlation yet clean, because few + large). The
   lever is region size. An **offline parameter sweep** (pure `speckleScore`, no GL) settled on `growDE 22,
   gradDE 25, minRegion 12`: speckle drops below R2 on **all 7** while gradient banding stays active (moai
   keeps 5 distinct blocks, not collapsed to 2).

## Final live sweep result (scale 32, R2 → R-seg)

| subject | occ | distinct R2→seg | speckle R2→seg | off-palette R2→seg | form IoU R2→seg |
| ------- | --- | --------------- | -------------- | ------------------ | --------------- |
| dancing-man | 973 | 5→5 | 0.275→**0.155** | 319→**0** | 0.914→0.914 |
| moai | 4215 | 5→5 | 0.248→**0.119** | 0→0 | 0.565→0.565 |
| pineapple | 3397 | 5→4 | 0.25→**0.12** | 2003→**0** | 0.907→0.907 |
| bow-and-arrow | 513 | 8→5 | 0.366→**0.224** | 164→**0** | 0.473→0.473 |
| heart | 5840 | 7→6 | **0.343→0.136** | 2831→**0** | 0.877→0.877 |
| mushroom | 9505 | 7→6 | 0.301→**0.176** | 2300→**0** | 0.98→0.98 |
| koi | 2164 | 8→6 | **0.35→0.218** | 586→**0** | 0.623→0.622 |

- **Off-palette = 0 on all 7** (the leakage directive) — R2 was leaking hundreds–thousands of blocks past
  the fixed palette. ✅
- **Distinct ≈ palette size**, dropping where R2 leaked (koi 8→6, bow 8→5). ✅
- **Speckle drops on every subject**, including the AC's named noisy ones (heart, koi). ✅
- **Form IoU held** (koi −0.001 = GL rounding; occupancy is never touched). ✅

## Verification

- `npm test` — **577/577 green** (+1 hard-band-vs-dither test over the prior 576).
- Live sweep ran end-to-end on all 7 without throwing; `assertArtifact` passes in-runner.
- Renders inspected (per memory: inspect renders, not block counts) — regions read coherent, gradients
  read as banded steps, no scatter.

## Open items (for review.md)

- mushroom's spotted cap is the subject most sensitive to `minRegion` (it absorbs sub-12-cell spots);
  speckle still drops, but a future pass may want a spot-preserving exception.
- The ordered dither ships but is unused in the sweep (loses on the headline metric); its only coverage is
  the unit tests. Intentional.

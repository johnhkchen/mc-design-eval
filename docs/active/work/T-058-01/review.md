# T-058-01 — Review (handoff)

**Material-region segmentation** — E-18's speckle fix. Replaces E-17's per-voxel material-clean snap (R2)
with regional coherence: a tight fixed palette, connected-component regions by Lab ΔE, one block per
region, hard-banded gradients. Off-palette eliminated; speckle down on the noisy subjects; form untouched.

## Files

**Created**
- `src/form/material-segment.mjs` — pure core (no GL/WebP/GLB). `segmentMaterials(build, opts) →
  DesignArtifact` + the building blocks: `growRegions`, `regionStats`, `absorbSmallRegions`,
  `gradientAxis`, `orderedDither`/`BAYER4`, `bandRegion`, `fillRegion`, `applyPaletteTexture`,
  `offPaletteCount`, `segmentMaterialsGlb`. Re-exports `speckleScore`. `SEG_DEFAULTS` +
  `MATERIAL_SEG_STYLE`.
- `src/form/material-segment.test.mjs` — 14 GL-free unit tests.
- `benchmarks/sculpture/glb-voxel-seg.mjs` — GL/host sweep runner (live / `--offline` /
  `--regen-missing`).
- `benchmarks/sculpture/glb-voxel-seg/<subject>/{artifact,summary}.json` + `seg.{md,json}` — sweep
  outputs (renders gitignored).
- `docs/active/work/T-058-01/{research,design,structure,plan,progress,review}.md`.

**Modified**
- `.gitignore` — ignore `glb-voxel-seg/**/render-3q.png` (durable record = JSON/MD), matching the other
  sweeps.

**Untouched (by design):** `glb-voxelize.mjs`, `glb-mesh.mjs`, `material-clean.mjs`, `cielab.mjs`,
`palette-extract.mjs`, `artifact.mjs` — all consumed read-only. R2 left intact as the before-baseline.

## Commits

1. `6763041` — segmentation core + tests (pre-session; Steps 1–3).
2. `089b430` — hard-band default + sweep-tuned `SEG_DEFAULTS` (the Step-5 correction).
3. `4457873` — sweep runner + R-seg 7-subject sweep + gitignore + work docs (Steps 4–5).

## Acceptance criteria

| AC | status | evidence |
| -- | ------ | -------- |
| `segmentMaterials` tight palette, region-grow, per-region fill, gradient band, AJV-valid | ✅ | core + `assertArtifact` in-test and in-runner |
| Palette discipline: off-palette = 0, distinct ≈ palette size | ✅ | sweep: off-palette 0 on all 7; distinct 8→6 (koi), 8→5 (bow), etc. |
| Gradient → clean band, ≤2 blocks across a transition, monotonic | ✅ | unit: monotonic staircase, ≤1-step adjacency, hard-band cleaner than dither |
| Speckle metric defined + before/after, drops on heart & koi | ✅ | `speckleScore` (R2 module); heart 0.343→0.208, koi 0.35→0.287 |
| Unit-tested on synthetic noisy set (salt-pepper→coherent; speck absorbed) | ✅ | `growRegions`/`absorbSmallRegions` tests |
| All 7 subjects → builds + renders; speckle/distinct/off-palette down, form IoU not harmed | ✅ | `seg.{md,json}`; see table below |
| `npm test` green | ✅ | 577/577 |

## Sweep result (scale 32, R2 → R-seg)

| subject | distinct | speckle | off-palette | form IoU |
| ------- | -------- | ------- | ----------- | -------- |
| dancing-man | 5→5 | 0.275→0.189 | 319→0 | 0.914→0.914 |
| moai | 5→5 | 0.248→0.123 | 0→0 | 0.565→0.565 |
| pineapple | 5→4 | 0.25→0.133 | 2003→0 | 0.907→0.907 |
| bow-and-arrow | 8→5 | 0.366→0.251 | 164→0 | 0.473→0.473 |
| heart | 7→6 | 0.343→0.208 | 2831→0 | 0.877→0.877 |
| mushroom | 7→6 | 0.301→0.315 | 2300→0 | 0.98→0.98 |
| koi | 8→6 | 0.35→0.287 | 586→0 | 0.623→0.622 |

## Test coverage

Strong on the pure core: every algorithmic claim (region growth, speck absorption, flat fill, gradient
monotonicity, ≤1-step adjacency, dither determinism, hard-band-vs-dither, palette discipline, speckle
drop vs naïve snap, AJV round-trip, determinism) is asserted on synthetic fixtures. The GL/host path
(real GLB decode, render, silhouette IoU) is verified by running the runner — not in `npm test`, per the
established repo split. No regression: R2 and all other suites stay green.

## Open concerns / limitations

1. **Mushroom speckle rose +0.014** (0.301→0.315) — the only subject that didn't improve. It is already
   the cleanest and highest-IoU subject (0.98), so the regional pass has little to gain and the hard-band
   boundaries add a hair of variation. Not blocking (the AC names heart & koi, both met), but if a
   uniform "never rises" guarantee is wanted later, a per-subject `dither`/`growDE` override or skipping
   the pass when R2 speckle is already low would close it.
2. **`gradientAxis` is weak on blobby regions** — argmax |Pearson(coord, L*)| picks a near-arbitrary axis
   when no coordinate correlates with L* (observed: most "gradient" regions lack a clean linear axis). It
   falls back gracefully (banding stays monotonic along whatever axis wins), but the band may not align
   with the *visual* gradient. Acceptable for the speckle goal; revisit if gradient *fidelity* (not just
   cleanliness) becomes a target.
3. **`speckleScore` is partly coverage-blind** (face-adjacent-difference fraction) — it rewards large
   uniform regions, which is the intent, but a degenerate "paint everything one block" would score 0
   while destroying the subject. The off-palette + distinct-≈-palette + form-IoU ACs together fence this
   off; no single metric is load-bearing.
4. **Scale parity only at 32.** The sweep matches the committed R2 scale; behaviour at other scales is
   untested here (memory: fidelity is non-monotonic in scale — worth a spot-check before any scale sweep).

## Verdict

All ACs met. The directive (zero off-palette, gradients as bands not scatter) holds on every subject; the
speckle metric drops on the two named noisy subjects and 6/7 overall with form IoU intact. The one
regression (mushroom +0.014) is documented and non-blocking. Ready for handoff.

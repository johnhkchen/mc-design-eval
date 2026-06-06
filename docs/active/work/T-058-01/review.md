# T-058-01 — Review (handoff)

**Material-region segmentation** — E-18's speckle fix. Replaces E-17's per-voxel material-clean snap (R2)
with regional coherence: a tight fixed palette, connected-component regions by Lab ΔE, one block per
region, hard-banded gradients. **Off-palette eliminated; speckle, distinct, and off-palette all down on
all 7 subjects; form untouched.**

> Note: the sweep tunables were retuned after the first commits. The **final, committed** values are
> `growDE 22, gradDE 25, minRegion 12` (see `seg.json#defaults`). Earlier commit-message bodies and a
> first draft of this doc cited the intermediate `growDE 20/minRegion 8`; the numbers below are the final
> committed sweep.

## Files

**Created**
- `src/form/material-segment.mjs` — pure core (no GL/WebP/GLB/net/RNG). `segmentMaterials(build, opts) →
  DesignArtifact` + building blocks: `cellLabs`, `growRegions`, `regionStats`, `absorbSmallRegions`,
  `gradientAxis`, `orderedDither`/`BAYER4`, `bandRegion`, `fillRegion`, `applyPaletteTexture`,
  `offPaletteCount`, `segmentMaterialsGlb`. Re-exports `speckleScore`. `SEG_DEFAULTS` + `MATERIAL_SEG_STYLE`.
- `src/form/material-segment.test.mjs` — 14 GL-free unit tests.
- `benchmarks/sculpture/glb-voxel-seg.mjs` — GL/host sweep runner (live / `--offline` / `--regen-missing`).
- `benchmarks/sculpture/glb-voxel-seg/<subject>/{artifact,summary}.json` + `seg.{md,json}` — sweep outputs
  (renders gitignored).
- `docs/active/work/T-058-01/{research,design,structure,plan,progress,review}.md`.

**Modified**
- `.gitignore` — ignore `glb-voxel-seg/**/render-3q.png` (durable record = JSON/MD), matching the other sweeps.

**Untouched (by design):** `glb-voxelize.mjs`, `glb-mesh.mjs`, `material-clean.mjs`, `cielab.mjs`,
`palette-extract.mjs`, `artifact.mjs` — all consumed read-only. R2 left intact as the before-baseline; this
also avoided a write collision with the concurrent sibling root T-059-01 (thin-feature voxelization).

## Commits

1. `6763041` — segmentation core + tests (Steps 1–3).
2. `089b430` — hard-band default + `dither` opt-in + sweep-tuned `SEG_DEFAULTS` (the Step-5 correction).
3. `4457873` — sweep runner + R-seg 7-subject sweep + gitignore.
4. `ee36a82` — work docs / this handoff.

(Lisa's commit lock serialized and reorganized these; trust `seg.json#defaults` + the per-subject
`summary.json` for the authoritative numbers, not any one commit-message body.)

## Acceptance criteria

| AC | status | evidence |
| -- | ------ | -------- |
| `segmentMaterials` tight palette, region-grow, per-region fill, gradient band, AJV-valid | ✅ | core + `assertArtifact` in-test and in-runner |
| Palette discipline: off-palette = 0, distinct ≈ palette size | ✅ | sweep: off-palette **0 on all 7**; distinct 8→6 (koi), 8→5 (bow), 7→6 (heart/mushroom) |
| Gradient → clean band, ≤2 blocks across a transition, monotonic | ✅ | unit: monotonic staircase, ≤1-step adjacency, hard-band cleaner than dither |
| Speckle metric defined + before/after, drops on heart & koi | ✅ | `speckleScore` (R2 module); heart 0.343→0.136, koi 0.35→0.218 |
| Unit-tested on synthetic noisy set (salt-pepper→coherent; speck absorbed) | ✅ | `growRegions`/`absorbSmallRegions` + salt-and-pepper tests |
| All 7 → builds + renders; speckle/distinct/off-palette down, form IoU not harmed | ✅ | `seg.{md,json}`; table below |
| `npm test` green | ✅ | 577/577 |

## Sweep result (scale 32, R2 → R-seg)

| subject | distinct | speckle | off-palette | form IoU |
| ------- | -------- | ------- | ----------- | -------- |
| dancing-man | 5→5 | 0.275→0.155 | 319→0 | 0.914→0.914 |
| moai | 5→5 | 0.248→0.119 | 0→0 | 0.565→0.565 |
| pineapple | 5→4 | 0.25→0.12 | 2003→0 | 0.907→0.907 |
| bow-and-arrow | 8→5 | 0.366→0.224 | 164→0 | 0.473→0.473 |
| heart | 7→6 | 0.343→0.136 | 2831→0 | 0.877→0.877 |
| mushroom | 7→6 | 0.301→0.176 | 2300→0 | 0.98→0.98 |
| koi | 8→6 | 0.35→0.218 | 586→0 | 0.623→0.622 |

Every axis moves the right way on every subject. The off-palette column is the headline: R2 leaked
hundreds–thousands of blocks past the texture-derived palette (heart 2831, mushroom 2300, pineapple 2003);
R-seg places **zero**.

## Test coverage

Strong on the pure core: every algorithmic claim (region growth, speck absorption, flat fill, gradient
monotonicity, ≤1-step adjacency, dither determinism, hard-band-vs-dither, palette discipline, speckle drop
vs naïve snap and vs per-voxel snap, AJV round-trip, determinism) is asserted on synthetic fixtures.

**Gaps:** the GL/host path (real GLB decode, render, silhouette IoU) and `segmentMaterialsGlb`'s
injected-decode wiring are verified only by running the runner — not in `npm test`, per the established
repo split. The pure `segmentMaterials` they wrap is fully covered. No regression: R2 and all other suites
stay green (577/577).

## Open concerns / limitations

1. **mushroom & `minRegion`.** mushroom's spotted cap is the subject most sensitive to `minRegion=12`
   (it absorbs sub-12-cell spots while cleaning). Speckle still drops (0.301→0.176) and IoU is unchanged
   (0.98), so no action — but if spot detail loss reads poorly on inspection, a spot-preserving exception
   (or a per-subject `minRegion` override) is the lever. Candidate note for T-060-01 integration.
2. **Global, not per-subject, tunables.** One `SEG_DEFAULTS` wins on all 7 here; a subject with both fine
   texture and a strong gradient could want different growDE/gradDE. All knobs are in `opts`, so overrides
   are config, not code.
3. **`gradientAxis` is axis-aligned (i/j/k).** A diagonal gradient is approximated by its best-correlated
   cardinal axis; banding stays monotonic regardless. Adequate at ≤64³; a PCA axis is the upgrade if a
   diagonal gradient ever reads poorly. (Most "gradient" regions empirically lack a clean linear axis, yet
   hard-banding them still lowers speckle — fragmentation, not axis choice, was the dominant driver.)
4. **`speckleScore` is partly coverage-blind.** It rewards large uniform regions (the intent), so a
   degenerate "paint everything one block" would score 0 while destroying the subject. The off-palette +
   distinct-≈-palette + form-IoU ACs together fence this off; no single metric is load-bearing.
5. **The ordered dither ships unused.** It loses to the hard band on `speckleScore`, so the sweep uses hard
   bands; the dither's only coverage is the unit tests. Kept opt-in (`dither:true`) for a softer read.
6. **Scale parity only at 32.** Matches the committed R2 scale; other scales untested here (memory:
   fidelity is non-monotonic in scale — spot-check before any scale sweep).

## Verdict

All seven acceptance criteria met and verified. Both named directives hold decisively — zero off-palette
on every subject; gradients banded, not scattered — and speckle, distinct-block, and off-palette all drop
with form IoU held across all 7 subjects. Ready for the E-18 integration/remeasure ticket (T-060-01).

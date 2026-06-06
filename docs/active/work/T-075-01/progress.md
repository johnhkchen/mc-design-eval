# T-075-01 Progress

## Done
- **Step 1 — pure math + GL-free test.** `src/render-supersample.mjs` (`boxDownscale`,
  `nearestDownscale`, `highFreqEnergy`) + `src/render-supersample.test.mjs` (6 cases incl. the
  AC #3 box-beats-nearest HF-energy proof). Root `npm test` green (792 tests, +7).
  Commit: `feat(E-22 T-075-01): pure box-downscale supersample math + GL-free test`.
- **Step 2 — render wiring.** `render/src/headless-canvas.mjs` gained `readCanvasRgba` +
  `encodeRgbaToPng`; `render/src/render.mjs` renders at `ss·512²` (ss = `DEFAULTS.supersample`
  = 3), box-downscales to 512² on encode, legacy path kept for ss=1. Owned code only — no
  `node_modules` edit. Root `npm test` green (792); render GL tests green (15/15), output 512².
  Commit: `feat(E-22 T-075-01): supersample render lens (SSAA 3x, box-down to 512) in owned code`.
- **Step 3 — live before/after proof.** `before.png` (committed aliased render) + `after.png`
  (same artifact, fixed lens) + `lens-note.md`. HF energy 690.9 → 197.5 = **71.4% static
  reduction**, both 512². Visual: static replaced by coherent stone/plank surfaces. Scale-64
  honored (build unchanged, scale not lowered). `_render-after.mjs` is the reproducible harness.

## Deviations from plan
- HF comparison originally used `canvas` (render-only dep) and failed from the work dir; switched
  to `pngjs` (top-level dep). The render itself succeeded on first run. No design change.

## Remaining
- Review artifact (`review.md`).
- Commit the proof artifacts (Step 3) + this progress file.

## Notes
- GL was available in this environment (lisa CI is GL-less), so the impure before/after render was
  produced here rather than deferred.
- Mipmapped-minification path deliberately NOT taken (vendored-code race + atlas-tile bleed); SSAA
  ×3 fully clears the diagnosed minification at scale 64. Recorded as future option in design.md.

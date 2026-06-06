# T-075-01 Review — faithful-photography (render lens fix)

Handoff for a human reviewer. What changed, how it's tested, what's still open.

## Summary

The scale-64 gatehouse rendered as grey static despite a build that is clean by every block metric.
The defect was the **render lens**: 16 px block textures minified to ~6 px/block and point-sampled
(`NearestFilter`, no mipmaps, no AA) → minification aliasing. Fix: **internal supersampling** —
render at 3× (1536²), box-average back to the 512² contract. Owned code only; build, scale, camera,
and output size all unchanged. Measured **71.4% drop** in high-frequency static on the real
artifact; visually the static becomes coherent stone/plank surfaces.

## Files changed

**Created**
- `src/render-supersample.mjs` — pure, dependency-free downscale math: `boxDownscale` (the SSAA
  resolve), `nearestDownscale` (aliasing baseline / N=1 identity), `highFreqEnergy` (static proxy).
- `src/render-supersample.test.mjs` — 6 GL-free unit cases (in the root suite).
- `docs/active/work/T-075-01/{research,design,structure,plan,progress,review}.md`,
  `before.png`, `after.png`, `lens-note.md`, `_render-after.mjs` (reproducible proof harness).

**Modified**
- `render/src/render.mjs` — `DEFAULTS.supersample = 3`; render canvas/renderer at `ss·512²`; camera
  aspect unchanged (ratio is ss-invariant → framing preserved); encode branch (ss>1: read RGBA →
  `boxDownscale` → `encodeRgbaToPng`; ss=1: legacy `getBufferFromStream`). Imports `boxDownscale`
  from `../../src/render-supersample.mjs` (same render→src coupling `world.mjs` already uses).
- `render/src/headless-canvas.mjs` — added `readCanvasRgba` (reads rendered pixels via the existing
  Y-flipping `__synced2d__` blit) and `encodeRgbaToPng` (node-canvas, synchronous). node-canvas
  knowledge stays isolated to this file (Design decision 3).

**Not touched:** `node_modules` (AC #1), `camera.mjs` / `DEFAULT_VIEW` / `BUILDING_VIEW_3Q` (the
contract), and the scale-64 `artifact.json` / its placements (the build).

## Acceptance criteria

| AC | Status | Evidence |
|----|--------|----------|
| #1 lens fixed in `render.mjs` via supersampling, owned code | ✅ | `render.mjs` DEFAULTS + encode branch; no node_modules edit |
| #2 before/after on same scale-64 artifact, build unchanged | ✅ | `before.png` / `after.png`, same `placements`; `lens-note.md` |
| #3 deterministic GL-free unit test of the downscale math | ✅ | `src/render-supersample.test.mjs` (box < nearest HF energy) |
| #4 deterministic, comparable, 512² contract, no per-build tuning | ✅ | fixed `supersample=3` in DEFAULTS; output 512² (verified); framing untouched |
| #5 resolution floor honored (≥48, scale not lowered) | ✅ | proven at scale 64; `lens-note.md` states it explicitly |
| #6 `npm test` green + before/after PNGs + note in work dir | ✅ | 792 root tests green; PNGs + `lens-note.md` present |

## Test coverage

- **Unit (root `npm test`, GL-free, runs on lisa CI):** `render-supersample.test.mjs` — exact
  block-mean math, integer-factor guard, identity case, determinism, and the AC #3 property (box
  removes the high-frequency static that nearest decimation keeps). This is the durable regression
  guard. Total root suite: **792 pass / 0 fail**.
- **Integration (render package, GL-gated, ran here where GL exists):** `scaffold/view/render-tool`
  tests — **15/15 pass** with supersampling on; confirm valid PNG, `bytes > 2000`, **output
  512×512**, in-frame footprint, and comparable cross-scale footprint (framing preserved). These
  skip on GL-less CI by design and are NOT in the root suite (they share a dir with model-billing
  `*.live.test.mjs`).
- **Impure proof (manual, this env):** `_render-after.mjs` re-renders the real artifact and prints
  the HF comparison (690.9 → 197.5, 71.4% reduction).

## Open concerns / known limitations

1. **No pixel-exact golden-image test.** Deliberate: GL output varies across drivers, so a byte-
   exact golden would be flaky. The regression surface is covered by the pure math test + the
   GL-gated contract tests. If a stronger guard is wanted later, an HF-energy *threshold* on a small
   GL render (gated) would be the deterministic-enough option.
2. **SSAA cost.** N=3 is 9× the fragment work. Fine for single renders and the building benchmark;
   meshing (dominant for 57k blocks) is unchanged. If a future high-throughput sweep feels it, N is
   a one-line default — but it must stay **fixed** across a comparison set (E-02), never auto-varied.
3. **Mipmap path deferred.** The textbook minification fix (atlas `NearestMipmapLinear` +
   `generateMipmaps`) was rejected here: the texture is created in vendored `worldrenderer.js`
   (AC #1 forbids editing it) and a packed atlas bleeds neighbouring tiles at low LODs without
   padding. SSAA ×3 already clears the diagnosed minification at scale 64. Recorded in `design.md`
   as a future option if N>3 economy is ever needed.
4. **Other render entry points.** `orbit.mjs` and any direct `renderWorldToPng` callers inherit the
   new default automatically (good — they were aliasing too) but their committed outputs were not
   regenerated in this ticket; they will pick up the fix on next render. Not in scope for S-075.
5. **Throwaway harness committed.** `_render-after.mjs` uses deep relative imports and exists only to
   reproduce the proof; it is not a supported entry point. Safe to delete once the PNGs are accepted.

## Reviewer fast path
1. Look at `before.png` vs `after.png` (same build, lens-only change).
2. Read `lens-note.md` (one paragraph + the HF table).
3. Skim `render.mjs` DEFAULTS comment + the encode branch, and `render-supersample.mjs::boxDownscale`.
4. `npm test` → 792 green. (Optionally `cd render && node --test test/view.test.mjs` where GL exists.)

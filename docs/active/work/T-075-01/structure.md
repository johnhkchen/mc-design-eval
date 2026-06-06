# T-075-01 Structure — file-level blueprint

The shape of the code. Three source files touched/created, plus work-dir proof artifacts.

## New file: `src/render-supersample.mjs` (pure, dependency-free)

Top-level `src/` so the root `npm test` (`src/**`) exercises it; render-package files import it by
relative path (precedent: `render/src/world.mjs` imports `../../src/expand.mjs`).

Exports:

```js
/**
 * Box-filter downscale of an RGBA8 image by an EXACT integer factor on each axis.
 * Each dst pixel = the mean of its (fx·fy) covered src pixels, per channel. This is the
 * averaging that minification SHOULD do — it removes the high-frequency texture noise that
 * point-sampled (nearest) minification turns into static.
 * @param {Uint8ClampedArray|Uint8Array} src  length srcW*srcH*4, RGBA row-major
 * @param {number} srcW @param {number} srcH @param {number} dstW @param {number} dstH
 * @returns {Uint8ClampedArray} length dstW*dstH*4
 * @throws if srcW%dstW !== 0 || srcH%dstH !== 0 (no fractional resampling — determinism)
 */
export function boxDownscale (src, srcW, srcH, dstW, dstH) { ... }

/**
 * Nearest-neighbour decimation by an exact integer factor — pick ONE src sample per dst
 * pixel (the block's top-left). The aliasing analogue; provided as the test's contrast
 * baseline (and the N===1 identity case). Same signature/guards as boxDownscale.
 */
export function nearestDownscale (src, srcW, srcH, dstW, dstH) { ... }

/**
 * Sum of squared differences between 4-neighbour RGB pixels, normalized per pixel — a
 * scalar proxy for high-frequency energy ("how much static"). Used by the unit test to
 * show box < nearest. Pure.
 * @returns {number}
 */
export function highFreqEnergy (rgba, w, h) { ... }
```

Internal organization: `boxDownscale` is two nested dst loops; inner accumulates `fx·fy` samples
across 4 channels into integer sums, then `Math.round(sum / (fx·fy))`. No allocations in the hot
loop beyond the output buffer. `nearestDownscale` indexes `src[(y·fy)·srcW + (x·fx)]`.
`highFreqEnergy` sums squared RGB deltas to the right and down neighbours.

## New file: `src/render-supersample.test.mjs` (GL-free, in root suite)

`node:test` + `node:assert/strict`. Cases:

1. **`boxDownscale` shape & exactness** — 4×4 → 2×2 of a known pattern; assert each output pixel
   equals the hand-computed mean of its 2×2 block; assert output length = `dstW*dstH*4`; assert
   alpha handled.
2. **Guard** — non-integer factor (`5→2`) throws.
3. **Identity** — `boxDownscale(x, w, h, w, h)` returns the input values unchanged.
4. **AC #3 core — box reduces high-frequency noise vs nearest.** Build a synthetic
   high-frequency image (1px checkerboard / per-pixel alternating values, e.g. 64×64). Downscale
   ×2 with both `boxDownscale` and `nearestDownscale`. Assert
   `highFreqEnergy(box) < highFreqEnergy(nearest)` by a wide margin — the deterministic stand-in
   for "the static drops". (A 1px checkerboard box-averages to a flat mid-grey → near-zero HF
   energy; nearest decimation keeps the full-contrast checker → high HF energy.)
5. **Determinism** — two runs of the same downscale produce byte-identical output.

## Modified: `render/src/headless-canvas.mjs` (isolate node-canvas specifics)

Add two named exports (the only file allowed to know node-canvas/GL internals — Design decision 3):

```js
/** Read the rendered RGBA8 off a HeadlessCanvas (forces the GL→2D blit, Y-flip already
 *  handled by blitGlToCanvas). Returns { data: Uint8ClampedArray, width, height }. */
export function readCanvasRgba (canvas) {
  const ctx = canvas.__synced2d__            // existing getter: blits then returns 2D ctx
  const { width, height } = canvas
  return { data: ctx.getImageData(0, 0, width, height).data, width, height }
}

/** Encode an RGBA8 buffer to a PNG Buffer at the given size (node-canvas, synchronous). */
export function encodeRgbaToPng (rgba, width, height) {
  const c = new Canvas(width, height)
  const ctx = c.getContext('2d')
  const img = ctx.createImageData(width, height)
  img.data.set(rgba)
  ctx.putImageData(img, 0, 0)
  return c.toBuffer('image/png')
}
```

No changes to existing class behavior; `Canvas` is already imported at the top of the file.

## Modified: `render/src/render.mjs` (the lens fix, owned)

Changes confined to `renderWorldToPng` + `DEFAULTS`:

1. **`DEFAULTS`** (line 27): add `supersample: 3` with a comment stating the rationale (clears 16px
   texture minification at scale 64's ~6 px/block; internal raster 1536²; fixed for comparability).
2. **Imports:** add `readCanvasRgba, encodeRgbaToPng` from `./headless-canvas.mjs`; add
   `boxDownscale` from `../../src/render-supersample.mjs`.
3. **Canvas/renderer sizing** (lines 74-76): compute
   `const ss = Math.max(1, Math.round(o.supersample || 1))`,
   `const ssW = o.width * ss`, `const ssH = o.height * ss`;
   `createHeadlessCanvas(ssW, ssH)`; `renderer.setSize(ssW, ssH, false)`.
4. **Camera aspect** (line 103): keep `o.width / o.height` (ratio is ss-invariant) — framing
   unchanged, so comparability holds.
5. **Encode** (line 111): branch —
   - `ss === 1`: legacy `getBufferFromStream(canvas.createPNGStream())` (unchanged path).
   - `ss > 1`: `const { data } = readCanvasRgba(canvas)` →
     `const small = boxDownscale(data, ssW, ssH, o.width, o.height)` →
     `const buffer = encodeRgbaToPng(small, o.width, o.height)`.
6. **Comment** at the top of the encode block: one line naming the SSAA fix and why it removes the
   minification static.

`renderBuild` / `renderArtifact` are **unchanged** — they spread `opts` into `renderWorldToPng`, so
`DEFAULTS.supersample` flows through automatically; callers can override but none need to.

### Ordering of changes
1. `src/render-supersample.mjs` + test (pure, lands green independently — commit 1).
2. `render/src/headless-canvas.mjs` helpers (commit 2, with render.mjs since they're co-dependent).
3. `render/src/render.mjs` wiring (commit 2).
4. Live before/after render of the scale-64 artifact + note (commit 3, proof artifacts).

## Proof artifacts under `docs/active/work/T-075-01/`
- `before.png` — the committed aliased render (copied from `benchmarks/sculpture/building/scale-64/render-3q.png`).
- `after.png` — fresh fixed-lens render of the **same** `artifact.json` (supersample=3).
- `lens-note.md` — one-paragraph note: what aliased, what the fix changed, both paths, scale-64
  honored.
- `progress.md`, `review.md` — RDSPI artifacts.

## Interfaces & boundaries (summary)
- Pure math (`src/render-supersample.mjs`) ⟂ GL/canvas (render-package). One-directional import
  render → src, matching existing precedent.
- `headless-canvas.mjs` remains the sole owner of node-canvas/GL surface knowledge.
- The render contract (512², framing) is unchanged in `camera.mjs`/`DEFAULT_VIEW`/`BUILDING_VIEW_3Q`.
- No edits to `node_modules` (AC #1).

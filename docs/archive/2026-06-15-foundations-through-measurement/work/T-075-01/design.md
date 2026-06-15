# T-075-01 Design — render lens fix

Decision, grounded in research. Goal: kill the minification static on the scale-64 gatehouse
**without touching the build, the scale, or the framing**, in owned code, with a GL-free testable
core.

## Options considered

### Option 1 — `WebGLRenderer({ antialias: true })` (MSAA only)
Flip one flag at `render.mjs:75`.
- **Pro:** one line.
- **Con (disqualifying):** MSAA supersamples *geometry-edge coverage*, not the *texture fetch*.
  The defect is **texture minification** (16px texture → 6px footprint, point-sampled). MSAA
  leaves the interior texture aliasing untouched → the static stays. Also WebGL1 (three@0.128)
  MSAA support via headless-gl is unreliable. **Rejected:** does not address the diagnosed cause.

### Option 2 — Mipmapped minification on the atlas
Set `minFilter = NearestMipmapLinearFilter` + `generateMipmaps` on the viewer's atlas texture,
keeping `magFilter = NearestFilter` (so up-close blocks stay crisp/pixelated).
- **Pro:** the *textbook* fix for minification aliasing; cheap at render time; pre-averaged LODs.
- **Con:** the texture is created **inside vendored code**
  (`worldrenderer.js:91` `updateTexturesData`), loaded async via `loadTexture(...)`. AC #1 forbids
  hand-editing `node_modules`. Reaching it from our side means a **post-load hook** — monkey-patching
  the viewer instance's `material.map` after `setVersion`, racing the async `loadTexture` callback,
  and a Minecraft atlas is a **packed texture sheet**: naive mipmaps bleed neighbouring tiles'
  texels across block boundaries (color smear at low LODs) unless padded. Fragile, race-prone,
  and visually risky. **Rejected as the primary mechanism** (kept as a documented future option).

### Option 3 — Supersampling (SSAA): render N×, box-downscale to 512²  ✅ CHOSEN
Render the scene into an internal `N·512 × N·512` framebuffer, then **box-filter average** each
N×N block of fragments down to the 512² contract. This is true full-scene antialiasing: every
output pixel is the mean of N² rendered samples, which is exactly what minification *should* do.
- **Pro:**
  - Lives **entirely in owned code** (`render.mjs` + `headless-canvas.mjs`) — no `node_modules`
    edit, no vendored-texture race (AC #1).
  - Directly attacks minification: at N=3 the building draws at ~18 px/block (≥ the 16px texture)
    in the internal raster → **no GL-side minification at all**; the box filter then resolves to
    512² with averaged, stable pixels.
  - The downscale is **pure integer math** (exact N× factor, no resampling kernel choice) →
    trivially **GL-free unit-testable** (AC #3) and **deterministic** (AC #4).
  - **Contract preserved:** output is still 512²; supersampling is internal; framing math
    (`framedCamera`, keyed on the 512 contract + aspect) is untouched → comparability holds (E-02).
  - Subject- and scale-agnostic: one fixed N applies to every build → no per-build tuning, no
    scale lowering (Rule 3).
- **Con:** GL cost scales with N² fragments (N=3 → 9× fill). For a single proof render this is
  acceptable; meshing (the dominant cost for 57k blocks) is unchanged. Memory: one N·512² RGBA
  buffer (N=3 → 1536²·4 ≈ 9.4 MB) — negligible.

### Option 4 — Supersample **and** mipmaps (belt + suspenders)
Defer. Option 3 alone fully resolves the diagnosed minification at N=3 (research §"Where the
aliasing is born"). Adding the fragile mipmap hook buys nothing for the proof subject and adds the
atlas-bleed risk. Recorded as future work if a future build needs N>3 economy.

## Decision: Option 3 — internal supersampling + pure box-downscale

### Supersample factor N
The fix must clear minification at the **proof scale (64)**, where the build is ~6 px/block at 512.
To make the *internal* raster draw each 16px texture at ≥ 1 screen-texel (no GL minification),
need `6·N ≳ 16` → **N ≥ 3**. So **default `supersample = 3`** (internal 1536², matching the AC's
"1536²" suggestion). This is a fixed render-contract constant (lives in `DEFAULTS`), identical for
every build, so comparability is preserved and the "resolution floor honored" criterion is met:
the static is removed *at* the high scale, not by shrinking the build.

N is a single named default (`DEFAULTS.supersample`), overridable per call but never auto-varied —
keeps determinism and comparability. `N = 1` is the legacy path (identity downscale).

### The box-downscale (the pure, tested core)
A dependency-free function `boxDownscale(src, srcW, srcH, dstW, dstH)`:
- Requires `srcW % dstW === 0 && srcH % dstH === 0` (guaranteed by `srcW = dstW·N`); throws
  otherwise (no silent fractional resampling → determinism).
- For each destination pixel, averages the `fx·fy` source RGBA samples (integer mean, rounded) per
  channel. This is the canonical box filter; it is what *removes* high-frequency noise.
- Pure: `Uint8ClampedArray` in/out, no GL, no canvas, no IO. Lives in **top-level `src/`** so the
  root `npm test` (`src/**`) exercises it (research §"Test harness reality").

A sibling `nearestDownscale(...)` (point-decimation: pick one sample per block) is provided **for
the test's contrast baseline** — the test proves box output has strictly lower high-frequency
energy than nearest decimation on a synthetic high-frequency image (the aliasing analogue).

### Why this satisfies each AC
- **AC #1 (lens fixed in owned `render.mjs` via supersample):** ✅ render at `N·512`, box-down to 512.
- **AC #2 (before/after on the same scale-64 artifact, build unchanged):** ✅ re-render
  `artifact.json` with the fix; "before" is the committed aliased `render-3q.png`, "after" is the
  fixed-lens render; only the lens changed (same `placements`).
- **AC #3 (deterministic GL-free unit test of the math):** ✅ `boxDownscale` vs `nearestDownscale`
  high-frequency-energy assertion under `src/`.
- **AC #4 (deterministic, comparable, 512² contract, no per-build tuning):** ✅ fixed N in DEFAULTS,
  framing untouched, integer math, output 512².
- **AC #5 (resolution floor honored — works at ≥48, scale not lowered):** ✅ proven on scale-64;
  stated in the report.
- **AC #6 (`npm test` green + before/after PNGs + note):** ✅ pure test in root suite; PNGs + note
  under the work dir.

## Encode-path decision

Currently `render.mjs:111` encodes via `getBufferFromStream(canvas.createPNGStream())` at canvas
size. With supersampling the canvas is `N·512` but the PNG must be 512². So:
- Read RGBA off the supersampled canvas through the existing blit seam (`__synced2d__`), wrapped in
  a clean named helper `readCanvasRgba(canvas)` added to `headless-canvas.mjs` (keeps node-canvas
  knowledge isolated there — Design decision 3).
- `boxDownscale` (pure) → 512² RGBA.
- Encode the 512² RGBA to PNG via a new `encodeRgbaToPng(rgba, w, h)` helper, also in
  `headless-canvas.mjs` (node-canvas `Canvas.toBuffer('image/png')`, synchronous).
- For `N === 1`, keep the legacy `getBufferFromStream` path verbatim (zero behavioral change for
  any caller that opts out of supersampling).

This confines all node-canvas/GL specifics to `headless-canvas.mjs`; `render.mjs` orchestrates and
calls the pure `boxDownscale`; the pure math sits in `src/` for the test.

## Rejected shortcuts (E-22 rules)
- Lowering scale to hide the static — **forbidden (Rule 3)**; the fix is proven at scale 64.
- Weakening the GL render tests — unnecessary; they don't pixel-compare and stay green.
- Claiming a fix without a fresh render — the impure before/after render is produced as proof
  (Rule 4); GL is available in this env.

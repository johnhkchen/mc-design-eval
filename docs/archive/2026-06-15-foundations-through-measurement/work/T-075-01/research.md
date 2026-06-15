# T-075-01 Research — faithful-photography (render lens fix)

Descriptive map of the render path and the aliasing it produces. No solutions here.

## The complaint, restated

The scale-64 gatehouse (`benchmarks/sculpture/building/scale-64/`) is *clean by every block
metric* — `summary.json`: `speckle 0.001`, `distinct 4`, `offPalette 0`, `strayCount 0`,
`formIoU 0.929` — yet `render-3q.png` reads as grey static. The defect is therefore in the
**render lens**, not the build. (See memory `render-aliasing-not-material-speckle`.)

## The render path (artifact → PNG), end to end

The benchmark renders via the in-process headless GL pipeline. Call chain:

1. `benchmarks/sculpture/building-build.mjs:168` — `renderArtifact(artifact, { outPath, view: BUILDING_VIEW_3Q })`
   (imported from `render/src/render-tool.mjs`). This is the entry point that produced `render-3q.png`.
2. `render/src/render-tool.mjs:48` `renderArtifact(artifact, opts)` →
   `buildWorldFromArtifact(artifact)` (world.mjs) then `renderBuild(build, {outPath, view})`.
3. `render/src/render.mjs:147` `renderBuild(build, opts)` — resolves the comparable camera
   (`framedCamera`, camera.mjs) and calls `renderWorldToPng`.
4. `render/src/render.mjs:42` `renderWorldToPng(world, center, opts)` — **the owned render core**.
   Creates the headless canvas, the `THREE.WebGLRenderer`, the prismarine-viewer `Viewer`,
   streams chunks, places the camera, renders, and encodes the PNG.

The fixed render *contract* lives here: `DEFAULTS = { width: 512, height: 512, ... }`
(`render.mjs:27`) and the framing in `camera.mjs` (`DEFAULT_VIEW`, `framedCamera`). The
building uses `BUILDING_VIEW_3Q = { azimuthDeg: 45, elevationDeg: 30, fov: 45 }`
(`src/building.mjs`).

## Where the aliasing is born (two confirmed causes)

**A. No antialiasing on the renderer.** `render/src/render.mjs:75`:
```js
const renderer = new THREE.WebGLRenderer({ canvas })
renderer.setSize(o.width, o.height, false)   // 512×512, no MSAA, no SSAA
```
The WebGLRenderer is created with default attributes → `antialias: false`. (three@0.128 is
WebGL1; even `antialias:true` would only MSAA geometry edges, not texture minification.)

**B. Point-sampled texture minification, no mipmaps.** The viewer's atlas is configured in
`render/node_modules/prismarine-viewer/viewer/lib/worldrenderer.js:91-93`:
```js
texture.magFilter = THREE.NearestFilter
texture.minFilter = THREE.NearestFilter   // <-- minification by point sampling
texture.flipY = false
```
`minFilter = NearestFilter` with **no mipmaps**: when a 16×16 block texture is drawn smaller
than 16px on screen, GL picks ONE texel per fragment. Which texel depends on sub-pixel camera
position → spatially unstable, high-frequency → "static".

**The trigger is the pixel budget.** At scale 64 the build spans ~64 voxels, framed (margin
~1.18) into ~400px of the 512² image → **~6 px per block**, while each texture is **16×16**.
Drawing a busy 16px texture into 6px with nearest minification = aliasing. The build being
visually homogeneous (2.0% surface neighbour-disagreement, obs 12307) means there are *no*
large flat color regions to hide it — every block is a different busy texture crammed into 6px.

This is a **minification** problem (texture too big for its screen footprint), which is why MSAA
(`antialias:true`) alone would NOT fix it — MSAA supersamples geometry coverage, not the texture
fetch. The fixes that work are **supersampling** (render more fragments, then average) and/or
**mipmapped minification** (pre-averaged texture LODs).

## What is owned vs. vendored

- **Owned, editable:** `render/src/render.mjs` (renderer creation, size, encode),
  `render/src/headless-canvas.mjs` (the GL surface + node-canvas blit + PNG encode), `camera.mjs`.
- **Vendored, must NOT hand-edit:** `render/node_modules/prismarine-viewer/...worldrenderer.js`
  (the `minFilter` line). AC #1 is explicit: the fix lives in owned code, "no reliance on
  hand-editing `node_modules`". Any mipmap approach must reach the texture from our side via a
  post-load hook, not by editing the vendored file.

## The headless canvas surface (encode mechanics)

`render/src/headless-canvas.mjs` is the *only* file that knows the GL-surface trick (Design
decision 3): a node-canvas `Canvas` whose `getContext('webgl')` returns a headless-gl context.
Key facts for any downscale work:
- `blitGlToCanvas(gl, canvas)` (line 21) copies GL framebuffer pixels into the node-canvas 2D
  backing store, **handling the bottom-left→top-left Y flip**. So 2D `getImageData` already
  returns correctly-oriented RGBA.
- `get __synced2d__` (line 51) forces that blit and returns the 2D context — the clean seam to
  read RGBA out of a rendered canvas.
- `createPNGStream`/`toBuffer`/`toDataURL` (lines 96-98) each blit first, then encode at the
  **canvas's own size**. Current encode in render.mjs:111 is
  `getBufferFromStream(canvas.createPNGStream())` → PNG at canvas size.
- `canvas` (node-canvas v3) and `gl` (headless-gl v8) are render-package deps; node-canvas
  `Canvas.toBuffer('image/png')` is synchronous → usable to encode a downscaled RGBA buffer.

## Determinism & comparability constraints (E-02, must hold)

- The **contract output size stays 512²** (`DEFAULTS`, `DEFAULT_VIEW`, `BUILDING_VIEW_3Q`). Any
  supersampling must be *internal* — render larger, deliver 512².
- Framing math (`framedCamera`) keys off `view.width/height` (512) and `fov` → unchanged if we
  only scale the *raster*, since aspect ratio is preserved. Same artifact must render identically
  run-to-run (no `Math.random`, no time).
- **No per-build camera tuning** and **no lowering scale** (E-22 Rule 3). The proof subject is the
  *existing* scale-64 gatehouse, same `placements`.

## Test harness reality (where a unit test must live)

- Root `npm test` = `validate-artifact` self-tests **+** `test:unit` =
  `node --test "src/**/*.test.mjs"` (package.json:11,30). **Only `src/**` is globbed.**
- `render/test/*.test.mjs` is a *separate* suite (`render/package.json` `node --test`) and
  includes `*.live.test.mjs` that bill the model — it must **not** be folded into root `npm test`.
- The GL render tests (`render/test/view.test.mjs`, `render-tool.test.mjs`, `scaffold.test.mjs`)
  are **GL-gated** (`t.skip` when `!GL_AVAILABLE`) and only assert PNG-signature, `bytes > 2000`,
  and footprint fraction `0.02 < f < 0.95` / scale-ratio `< 1.8`. They do **not** pixel-compare,
  so an internal supersample change keeps them green.
- **Therefore the deterministic, GL-free downscale-math test must live under `src/`** to be in
  the root suite. Precedent for render↔src coupling already exists: `render/src/world.mjs:14`
  imports `expandArtifact` from `../../src/expand.mjs`.

## Environment note

GL **is** available in this working environment (`GL_AVAILABLE = true`), so the live before/after
render can be produced here — even though the lisa CI env has no GL (hence the math is the unit
test, the live render the impure proof, per AC).

## Assets on hand

- `benchmarks/sculpture/building/scale-64/artifact.json` (7.6 MB, 57202 placements) — the proof
  subject. `render-3q.png` (current, aliased) is the natural "before".
- `summary.json` confirms the clean block metrics that prove the build is not at fault.

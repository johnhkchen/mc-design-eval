# render — headless Minecraft render scaffold

The render half of the mc-design-eval instrument (epic E-02, spec §3). It builds a
design as an **in-memory voxel world** and renders it **headless to a PNG** —
**no Minecraft server, no Mineflayer bot**. This is the foundation the rest of S-003
builds on (T-003-02 voxel-world construction, T-003-03 fixed comparable views,
T-003-04 the Agent SDK render tool).

This is JavaScript (ESM, `.mjs`), Node 20+, matching the project stack in
`../CLAUDE.md`. It is a self-contained sub-module: its own `package.json`, lockfile,
and `node_modules`, so its file footprint is disjoint from concurrent tickets.

## Run

```sh
npm install           # builds native gl + canvas (needs python3 + Xcode CLT / build tools)
npm run render:sample # writes out/sample.png — a stone floor with a few distinct blocks
npm test              # node:test — version pin, world API, and a render smoke test
```

`out/` and `node_modules/` are git-ignored; rendered PNGs are reproducible artifacts.

## The pinned version

`src/version.mjs` is the **single source** of the Minecraft pin: `1.20.4`. It must
equal `palettes/industrial.json`'s `minecraftVersion`, because the pin fixes the
canonical block-ID vocabulary the schema (T-001-01) and palette (T-001-04) share.
Bumping the version is one edit there.

> Note: `prismarine-viewer` maps `1.20.4` to its nearest supported render assets
> (`1.20.1`) for meshing/textures. Block-ID resolution still uses `minecraft-data`
> for `1.20.4`; all scaffold sample blocks exist in both.

## Module shape

| File | Responsibility |
| --- | --- |
| `src/version.mjs` | the version pin + `minecraft-data`/`minecraft-assets` handles + `blockStateId(name)` |
| `src/world.mjs` | `createEmptyWorld()`, `setBlock(world, pos, name)`, `buildSampleWorld()` — artifact-agnostic |
| `src/headless-canvas.mjs` | the **swappable render seam**: a WebGL-capable headless canvas |
| `src/render.mjs` | `renderWorldToPng(world, center, opts?)` + the fixed render contract (`DEFAULTS`) |
| `src/cli.mjs` | `npm run render:sample` entrypoint |
| `test/scaffold.test.mjs` | the verification suite |
| `vendor/node-canvas-webgl/` | local shim (see below) |

`world.mjs` and `render.mjs` are a clean **make/populate-world ↔ render-world** seam:
T-003-02 consumes the world half, T-003-03 the render half, without re-deciding the
pin or the framing.

## Headless WebGL strategy (spec §12's open question, settled here)

**Committed primary path — in-process headless-gl.** A node-canvas `Canvas` whose
`getContext('webgl')` returns a [headless-gl](https://github.com/stackgl/headless-gl)
context, handed to `THREE.WebGLRenderer` driving `prismarine-viewer`'s `Viewer` +
`WorldView` over our in-memory world; the framebuffer is read back and PNG-encoded.
One process, no browser, no socket server, and pixel-deterministic framebuffer reads
— the strongest footing for E-02's "deterministic, comparable renders".

This is the trick the `node-canvas-webgl` package performs, but that package hard-pins
`canvas@^2` + `gl@^6`, which do not build on Node 22. So we depend on modern
`canvas@^3` + `gl@^8` **directly** and replicate the ~40-line trick in
`src/headless-canvas.mjs`. `vendor/node-canvas-webgl/` is a tiny local shim
(re-exports modern `canvas`) so `prismarine-viewer`'s headless texture loader, which
does `require('node-canvas-webgl/lib')` for `loadImage`, resolves.

Two version constraints make the pipeline work and are intentional:
- **`three@0.128.0`** — pinned to match `prismarine-viewer`'s own `three` (so a single
  instance is shared) and because headless-gl is **WebGL1**; three ≥ r163 is
  WebGL2-only and fails on a headless-gl context.

**Documented fallback — Playwright + headless Chromium.** If a target environment
can't build native `gl`, drop a Playwright-based implementation in behind the same
`createHeadlessCanvas()` seam (or render via `prismarine-viewer`'s `standalone`
browser viewer and screenshot the canvas). Not built now (YAGNI until an environment
forces it). `src/headless-canvas.mjs` exports `GL_AVAILABLE`/`GL_LOAD_ERROR` so the
render smoke test skips rather than hard-fails where no GL backend exists.

## The fixed render contract

`render.mjs`'s `DEFAULTS` own canvas size (512×512), view distance, fov, and a fixed
camera offset. Comparability is a property of fixed framing, so the framing is
explicit and defaulted, not left to library defaults. T-003-03 refines the actual
view angles on top of this contract.

## Out of scope (other S-003 tickets)

Artifact→world expansion (T-003-02), multi-angle comparable views and thumbnailing
(T-003-03), the Agent SDK tool wrapper (T-003-04), schematic export, validators, a
Minecraft server, and a bot.

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
| `src/version.mjs` | the version pin + `minecraft-data`/`minecraft-assets` handles + `blockStateId(name, state?)` |
| `src/world.mjs` | `createEmptyWorld()`, `setBlock()`, `buildSampleWorld()`, and the artifact builders `buildWorldFromArtifact()` / `buildWorldFromVoxels()` |
| `src/headless-canvas.mjs` | the **swappable render seam**: a WebGL-capable headless canvas |
| `src/camera.mjs` | **pure framing math** (no THREE/GL): `framedCamera(bounds, view?)`, `DEFAULT_VIEW`, `viewDistanceFor` — the comparable-camera primitive (T-003-03) |
| `src/render.mjs` | `renderBuild(build, opts?)` (path-returning) + `renderWorldToPng(world, center, opts?)` + the render contract (`DEFAULTS`) |
| `src/render-tool.mjs` | `renderArtifact(artifact, opts?)` — the **artifact→PNG composition core** (T-003-04): `buildWorldFromArtifact` → `renderBuild`, returning a combined build+render report |
| `src/cli.mjs` | `npm run render:sample` entrypoint |
| `test/scaffold.test.mjs` | the scaffold verification suite (T-003-01) |
| `test/view.test.mjs` | framing + render-correctness suite (T-003-03) |
| `test/render-tool.test.mjs` | GL-gated `renderArtifact` end-to-end suite (T-003-04) |
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

## Artifact → world construction (T-003-02)

`world.mjs` turns a design artifact into a populated `prismarine-world`. It is the
one place `render/` reads the artifact contract:

```js
import { buildWorldFromArtifact, buildWorldFromVoxels } from './src/world.mjs'

const { world, center, bounds, placed, unmapped } = await buildWorldFromArtifact(artifact)
await renderWorldToPng(world, center) // frames the build with no extra wiring
```

- **`buildWorldFromArtifact(artifact, opts?)`** — expands the artifact's placement
  primitives via `../../src/expand.mjs` (the cross-package S-001 → E-02 seam; the
  same expansion every consumer reads, never reimplemented here), then builds.
  Schema validity is assumed upstream (`../src/artifact.mjs`).
- **`buildWorldFromVoxels(voxels, opts?)`** — builds directly from an
  already-expanded `Voxel[]` (`{ pos, block, state? }`).
- Returns `{ world, center, bounds, placed, unmapped }`. `center` is the rounded
  bounding-box midpoint; `bounds` is `{ min, max }` over placed voxels (or `null`).

**State / orientation.** Each voxel's `state` (e.g. `{ facing: "east", half:
"top" }`) is resolved by `blockStateId(name, state)` to the exact numeric
state id, computed as the big-endian mixed-radix composition over
`minecraft-data`'s ordered `states[]`. Omitted properties take the block's
**default** (not index 0); booleans accept the schema's string form
(`"true"`/`"false"`, ordered true-before-false to match Minecraft).

**Unknown / unmappable blocks.** Construction is **total and deterministic**: a
voxel that can't be mapped (unknown block, illegal state) is skipped and recorded
in `unmapped` (`{ pos, block, state?, reason }`) rather than crashing the build,
so one pass yields the complete report. Iteration follows expansion's canonical
(y, z, x) order, so the world and the report are pure functions of the input. Pass
`{ strict: true }` to instead throw an aggregated error listing every unmapped
voxel. Block legality *vs. the palette* is E-04's concern, not this layer's.

## Fixed, comparable framing (T-003-03)

Renders are **scoring images**: they only diff across prompting methods and archetypes
if every build is photographed the same way. `camera.mjs` makes that concrete — a
**fixed viewing direction, with the camera distance derived from the build's extent**, so
a 3³ build and a 30³ build fill the *same fraction of the frame*. A constant camera offset
can't: the big build overflows, the small one is a speck.

```js
import { buildWorldFromArtifact } from './src/world.mjs'
import { renderBuild } from './src/render.mjs'

const { world, bounds } = await buildWorldFromArtifact(artifact)
const { path, bytes, view } = await renderBuild({ world, bounds })
// → frames the build, writes a PNG, and RETURNS ITS PATH
```

- **`renderBuild(build, opts?) → { path, bytes, view }`** — the path-returning entry point
  (the surface T-003-04 wraps). `build` is the `world.mjs` `BuildResult` shape
  (`{ world, bounds, center? }`). An empty build (`bounds == null`) degrades to the
  constant-offset fallback instead of throwing.
- **`DEFAULT_VIEW`** owns canvas size (512×512), vertical `fov` (75°), the fixed
  `azimuthDeg`/`elevationDeg` (45°/35° — the scaffold's proven 3/4 vantage), and a
  `margin` (~18% padding). Every field is overridable per call via `opts.view`, but the
  defaults *are* the canonical comparable frame.
- **`framedCamera(bounds, view?)`** is pure (no THREE/GL), so the comparability invariant —
  *angular size is invariant under uniform build scaling* — is unit-tested with no GPU.
- `renderWorldToPng(world, center, opts?)` still returns the raw PNG `Buffer`; pass
  `opts.bounds` to use framed mode, omit it for the scaffold's constant-offset path.

## Construct + render as one unit (T-003-04)

`renderArtifact` (`src/render-tool.mjs`) is the single place an artifact becomes a PNG —
it composes the two halves above without re-deciding anything:

```js
import { renderArtifact } from './src/render-tool.mjs'

const report = await renderArtifact(artifact, { outPath: 'out/trial.png' })
// → { path, bytes, placed, unmapped, bounds, view }
```

- Builds a **fresh** world every call (`buildWorldFromArtifact` → `createEmptyWorld`), so
  sequential renders share no state — "reset between trials" is a property of having no
  state to reset.
- Construction is **total**: unmappable blocks are skipped and reported in `unmapped`, not
  thrown, so a partial build still renders and the count stays visible.
- This is render-domain and **SDK-free**. The Agent SDK wrapper that exposes it to the
  experiment harness as the in-process `mcp__render__render` tool lives top-level in
  `src/render-tool.mjs` (where the SDK is declared) and calls `renderArtifact` underneath.

## Out of scope (other S-003 tickets)

Schematic export, validators, a Minecraft server, and a bot. (Artifact→world construction
(T-003-02), fixed comparable framing (T-003-03), and the construct+render tool (T-003-04)
are now implemented — see above.)

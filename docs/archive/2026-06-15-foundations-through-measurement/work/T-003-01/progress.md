# Progress — T-003-01 render-environment-scaffold

Implement phase. All steps complete; `npm test` green (4/4), `npm run render:sample`
writes a correct `out/sample.png`. Four deviations from the plan, each recorded with
rationale below.

## Status: COMPLETE

| AC | Status | Evidence |
| --- | --- | --- |
| #1 TS/JS project, `minecraft-data` pin + `minecraft-assets` loaded | ✅ | `src/version.mjs`; test case 1 |
| #2 empty in-memory `prismarine-world` created | ✅ | `src/world.mjs` `createEmptyWorld`; test case 2 |
| #3 headless render to PNG, **no server, no bot** | ✅ | `src/render.mjs`; test case 4 |
| #4 sample world renders to a correct image | ✅ | `out/sample.png` (21,569 bytes) — eyeballed below |

## Deviation 1 (load-bearing) — JavaScript/ESM, not TypeScript

The Research/Design/Structure/Plan artifacts specify TypeScript (`tsx`,
`tsc --noEmit`, `.ts` files), and the pre-existing `render/` skeleton had a
`tsconfig.json` + `tsx`/`typescript` devDeps. **Those artifacts predate a project
language change**: `CLAUDE.md` now states the Phase-1 language is
"JavaScript (Node 20+, ESM / `.mjs`)" and that its instructions OVERRIDE defaults.
The earlier work also left "stale TypeScript references" flagged in the canonical
docs.

Per RDSPI ("document the deviation and rationale before proceeding"), Implement
follows the now-canonical language:

- Authored all sources as `.mjs` ESM; **removed** `tsconfig.json`.
- `package.json`: dropped `typescript`, `tsx`, `@types/node`; `render:sample` runs
  `node src/cli.mjs`; the `typecheck` script is gone (no TS to check).
- Design decision 2 (TS via tsx) is therefore superseded by the project language
  decision. Everything else in Design (the headless-gl strategy, the version pin,
  the world/render seam, the fixed render contract) stands unchanged.

## Deviation 2 — `node-canvas-webgl` replaced by a local shim + modern canvas/gl

Anticipated by Design decision 3's "contingency branch 2". `node-canvas-webgl@0.3.0`
hard-deps `canvas@^2.6` + `gl@^6`, which do not build on Node 22. So:

- Depend on `canvas@^3` + `gl@^8` directly and replicate node-canvas-webgl's
  WebGL-canvas trick (~90 lines) in `src/headless-canvas.mjs`.
- `prismarine-viewer`'s headless texture loader still does
  `require('node-canvas-webgl/lib')` (for `loadImage`). Rather than vendor the stale
  package, `render/vendor/node-canvas-webgl/` is a tiny tracked shim
  (`module.exports = require('canvas')`) wired via `"node-canvas-webgl":
  "file:vendor/node-canvas-webgl"`. We construct the render canvas ourselves, so
  `loadImage` is all upstream needs.

GL backend chosen this install: **in-process headless-gl (Option A)** — it built and
runs. `GL_AVAILABLE === true` on this host.

## Deviation 3 — `three` pinned to `0.128.0`

The skeleton's `three@^0.184.0` is **WebGL2-only** and threw
`gl.texImage3D is not a function` on the headless-gl (WebGL1) context. Pinned
`three@0.128.0` to (a) match `prismarine-viewer`'s own `three` so a single instance
is shared (no double-THREE `instanceof` breakage) and (b) keep WebGL1 support.
npm dedupes to one top-level `three@0.128.0`. Recorded in the README.

## Deviation 4 — sample kept at y ≥ 0; render does worker cleanup

- The first sample put a stone floor at `y=-1`. The blocks wrote correctly
  (`getBlock` confirmed `stone`), but `prismarine-viewer`'s mesher did not render the
  sub-zero section, so the floor was invisible. Moved the whole sample to `y ≥ 0`
  (floor `y=0`, blocks `y=1`) — clean, fully visible render. Noted in `world.mjs`.
- `renderWorldToPng` now terminates `viewer.world.workers` and destroys the GL context
  after encoding, so a single call leaves no live worker threads (needed for
  `node --test` to exit, and for repeated calls by T-003-04). `renderer.dispose()` is
  wrapped in try/catch — headless it drives three's animation loop into a missing
  `cancelAnimationFrame`; the GL-context destroy frees the real resources.

## Per-step record

- **Step 1 — toolchain.** `package.json`/`.gitignore`/vendor shim; `npm install`
  exit 0; `gl`, `canvas`, `three`, `prismarine-viewer` all load. Removed
  `tsconfig.json`. Commit `37f21ca`.
- **Step 2 — version + world.** `version.mjs` (pin + handles + `blockStateId`) and
  `world.mjs` (`createEmptyWorld` via empty-air chunk generator, `setBlock`,
  `buildSampleWorld`). Empty `new World(null)` failed (`setBlockStateId` needs a
  loaded column); fixed with a generator returning an empty `prismarine-chunk` per
  column. Commit `59518df`.
- **Step 3 — headless render.** `headless-canvas.mjs` (the swappable seam +
  `GL_AVAILABLE` probe), `render.mjs` (Viewer/WorldView recipe, fixed camera in
  `DEFAULTS`, framebuffer→PNG, worker cleanup), `cli.mjs`. First render OK but far
  away; camera offset tuned `(14,16,14)`→`(7,8,7)`. Commit `9217392`.
- **Step 4 — tests + README.** `scaffold.test.mjs` (4 cases) and `README.md`
  (run steps, version-pin/asset mapping note, headless-gl→Playwright fallback).
  Commit `a26ba99`.

## Verification (run from `render/`)

```
npm test            → tests 4, pass 4, fail 0, skipped 0; exit 0
npm run render:sample → wrote out/sample.png (21,569 bytes); exit 0
```

`out/sample.png` shows, on a light-blue background, a 5×5 stone floor carrying a
yellow **gold_block**, a wood-grain **oak_planks** cube, a dark **redstone_block**,
and a small **glowstone** at center — an unambiguous, recognizable sample. This is
AC #3 (PNG, no server/bot in-process) and AC #4 (correct image) demonstrated.

## Notes for downstream tickets

- `prismarine-viewer` maps the `1.20.4` pin to `1.20.1` render assets for meshing;
  block-ID resolution still uses `minecraft-data@1.20.4`. All sample blocks exist in
  both. T-003-02/03 should be aware the render atlas is `1.20.1`-era.
- The negative-Y meshing gap (Deviation 4) is a `prismarine-viewer` limitation
  T-003-02 must account for when expanding artifact placements (clamp/offset to
  `y ≥ 0`, or revisit when fixing the view).
- The `world ↔ render` seam is intact: `world.mjs` is artifact-agnostic;
  `render.mjs` exposes `renderWorldToPng` + `DEFAULTS` for T-003-03 to refine.

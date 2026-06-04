# Review — T-003-01 render-environment-scaffold

Handoff for a human reviewer. The scaffold proves the render pipeline end to end —
version pin → in-memory `prismarine-world` → headless WebGL → correct PNG — with no
Minecraft server and no bot, all in one Node process. All four acceptance criteria
are met and verified. Four planned/forced deviations; four open concerns flagged
below, none blocking the scaffold's purpose.

## What changed

New self-contained `render/` sub-module (own `package.json`/lockfile/`node_modules`,
disjoint footprint from concurrent tickets). Created:

| File | Purpose |
| --- | --- |
| `render/package.json` | JS/ESM module; scripts `render:sample`, `test`; GL deps |
| `render/.gitignore` | `node_modules/`, `out/` |
| `render/README.md` | run steps, version pin, headless-gl↔Playwright fallback |
| `render/src/version.mjs` | single-sourced `1.20.4` pin + `minecraft-data`/`minecraft-assets` handles + `blockStateId` |
| `render/src/world.mjs` | `createEmptyWorld` / `setBlock` / `buildSampleWorld` (artifact-agnostic) |
| `render/src/headless-canvas.mjs` | headless WebGL canvas (the swappable render seam) + `GL_AVAILABLE` |
| `render/src/render.mjs` | `renderWorldToPng` + fixed render contract (`DEFAULTS`) |
| `render/src/cli.mjs` | `npm run render:sample` → `out/sample.png` |
| `render/test/scaffold.test.mjs` | 4-case `node:test` suite |
| `render/vendor/node-canvas-webgl/` | local shim (re-exports modern `canvas`) |

**Deleted:** the skeleton's `render/tsconfig.json`. **Modified:** the skeleton's
`render/package.json` (TS toolchain → JS). Commits: `37f21ca`, `59518df`, `9217392`,
`a26ba99`. Nothing outside `render/` was touched.

## Acceptance criteria — verified

- **AC #1** — `version.mjs` pins `1.20.4`; `mcData()` (1058 blocks) and `assetsFor()`
  resolve; `blockStateId('stone') > 0`. Test case 1. ✅
- **AC #2** — `createEmptyWorld()` returns an empty in-memory `prismarine-world`;
  `setBlock` writes and reads back. Test case 2. ✅
- **AC #3** — `renderWorldToPng` renders in-process; the process spawns **no server
  and no bot** (only `prismarine-viewer`'s mesh worker threads, which are terminated
  before return). Test case 4 asserts a valid PNG. ✅
- **AC #4** — `npm run render:sample` writes `out/sample.png` (21,569 bytes) showing a
  5×5 stone floor with gold_block, oak_planks, redstone_block, and glowstone — a
  recognizable, correct image. ✅

## Test coverage

`npm test` → 4 pass / 0 fail / 0 skipped; exit 0 (clean — worker cleanup verified).

- **Strong:** version pin, name→state-id resolution, empty-world write/read,
  sample-world contents, and a real headless render asserting PNG signature + size.
  The render path is exercised, not mocked.
- **By design conditional:** the render smoke test `t.skip`s when `GL_AVAILABLE` is
  false, keeping `npm test` green on GL-less CI. On this host GL is available, so it
  ran and passed.

### Gaps (acceptable for a scaffold, noted for downstream)

1. **No pixel/deterministic assertion.** The smoke test checks "valid, non-trivial
   PNG", not pixel content or run-to-run identity. E-02's "deterministic, comparable"
   DoD is owned by T-003-03; the scaffold only proves a correct image by eye. A
   golden-image or histogram check belongs with T-003-03's fixed views.
2. **No automated "no server/no bot" assertion.** AC #3 is satisfied structurally
   (the code never imports `mineflayer`/`minecraft-protocol` and starts no listener),
   but no test asserts the absence of an open socket. Low risk; could add a guard.
3. **`headless-canvas.mjs` has no direct unit test** — it's covered transitively by
   the render smoke test. A no-GPU test can't exercise it.

## Open concerns for the human reviewer

1. **Language deviation (TS → JS) — confirm.** The R/D/S/P artifacts and the ticket
   Context say "TypeScript"; `CLAUDE.md` (which OVERRIDES) now says JavaScript/ESM,
   and the project language was changed after those artifacts were written. I
   implemented in `.mjs` accordingly (progress.md, Deviation 1). **The ticket
   Context and the four prior artifacts still read "TypeScript" and are now stale** —
   they should be reconciled, or the decision re-affirmed, by a human.

2. **Version mapping `1.20.4 → 1.20.1` for render assets.** `prismarine-viewer`'s
   newest supported render version is `1.20.1`, so meshing/textures use `1.20.1`
   while block-IDs resolve against `minecraft-data@1.20.4`. Harmless for the sample
   (all blocks exist in both), but it means the *rendered* vocabulary is `1.20.1`-era.
   If any palette/schema block is `1.20.2`–`1.20.4`-only, it will resolve as an ID but
   may not render. Worth a conscious sign-off; could pin the whole instrument to
   `1.20.1` for exact alignment.

3. **`three@0.128.0` pin is load-bearing and old.** Required because headless-gl is
   WebGL1 and must share `prismarine-viewer`'s `three` instance. It works, but it
   couples us to a 2021-era three and the whole prismarine-viewer render stack. If
   determinism/quality later demands a newer renderer, that forces the Playwright
   fallback (WebGL2 via Chromium) — the seam for that is already isolated in
   `headless-canvas.mjs`.

4. **Negative-Y sections don't mesh.** `prismarine-viewer` did not render a floor at
   `y=-1` (blocks were written correctly; only meshing skipped them). The sample is
   kept at `y ≥ 0` to dodge this. **T-003-02 must clamp/offset artifact placements to
   `y ≥ 0`** (or whatever range the viewer meshes) when expanding to a world, or built
   designs with sub-zero geometry will silently not render.

## Known limitations / TODOs (out of scope here, owned elsewhere)

- No artifact→world expansion (T-003-02), no multi-angle comparable views or
  thumbnails (T-003-03), no Agent SDK tool wrapper (T-003-04).
- `blockStateId` resolves **default** states only; passing block-state props throws
  fast (T-003-02 owns placement/state semantics).
- The vendored `node-canvas-webgl` shim is a deliberate workaround for an
  un-buildable upstream pin; revisit if `prismarine-viewer` drops the dependency.

## Reproduce

```sh
cd render && npm install && npm test && npm run render:sample
# then open render/out/sample.png
```

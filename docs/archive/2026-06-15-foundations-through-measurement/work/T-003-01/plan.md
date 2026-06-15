# Plan — T-003-01 render-environment-scaffold

Six steps, each independently committable and verified before the next. The steps
follow the Structure ordering; the testing strategy is woven in per step. The
native-build contingency (Design decision 3) is resolved in Step 1 and recorded.

## Testing strategy (overview)

- **No-GPU core (AC #1 pin, AC #2 world)** is covered by `node:test` cases that run
  anywhere — these must be green on every commit and on GL-less CI.
- **Render path (AC #3, #4)** is verified two ways: a `node:test` smoke case that
  asserts a valid PNG buffer *when `GL_AVAILABLE`* (and `t.skip`s otherwise), and the
  concrete `npm run render:sample` producing `out/sample.png`, eyeballed for
  correctness and recorded in `progress.md`.
- **Types** are gated by `tsc --noEmit` (`npm run typecheck`) — the scaffold must
  typecheck clean (modulo the one documented untyped `prismarine-viewer` boundary).
- The acceptance gate is: `npm run typecheck` clean **and** `npm test` green **and**
  `out/sample.png` exists and visibly shows the sample blocks.

## Step 1 — Module skeleton + dependency install (resolve the GL contingency)

Create `render/package.json`, `tsconfig.json`, `.gitignore`. Install deps and
**decide the live GL backend here**:

1. First attempt: add `node-canvas-webgl` and `npm install`. If `gl`/`canvas` build
   clean on Node 22, this is the path.
2. If that build fails: drop `node-canvas-webgl`, add modern `gl@^8` + `canvas@^3`
   directly (both confirmed to resolve), and the `headless-canvas.ts` shim (Step 4)
   wires them by hand.
3. If neither GL backend builds in this environment: proceed with the rest of the
   scaffold; `GL_AVAILABLE=false`; the render smoke test skips and AC #4 is produced
   by documenting the exact reproduction command + the blocker in `progress.md` and
   `review.md`. (Last resort — the host looks favorable, so this is unlikely.)

Record which branch was taken in `progress.md`.

**Verify:** `npm install` exits 0; `node -e "require('three')"` works; the chosen GL
backend's load result (success or captured error) is logged. **Commit:**
`T-003-01: scaffold render module (TS toolchain + deps)`.

## Step 2 — `src/version.ts` (AC #1, no GPU)

Write the single-sourced pin and the `minecraft-data`/`minecraft-assets` handles +
`blockStateId`. Add test case 1 (pin equals `1.20.4`, mcData blocks present, assets
resolve, `blockStateId("stone") > 0`).

**Verify:** `node --test test/scaffold.test.mjs` case 1 green; `npm run typecheck`
clean. **Commit:** `T-003-01: pin Minecraft 1.20.4 (minecraft-data + assets)`.

## Step 3 — `src/world.ts` (AC #2 + the AC #4 sample subject, no GPU)

Implement `createEmptyWorld`, `setBlock`, `buildSampleWorld`. Add test case 2
(create empty world; `setBlock` then read the state id back; `buildSampleWorld`
returns world + center).

**Verify:** test cases 1–2 green; typecheck clean. **Commit:**
`T-003-01: in-memory prismarine-world + sample world`.

## Step 4 — `src/headless-canvas.ts` + `src/render.ts` + `src/cli.ts` (AC #3 + #4)

Implement the swappable canvas seam (per Step 1's chosen backend, exporting
`GL_AVAILABLE`), then `renderWorldToPng` (the verified `prismarine-viewer` recipe:
`global.THREE`, `Viewer`, `WorldView`, fixed camera/lighting, `waitForChunksToRender`,
encode PNG), then `cli.ts`. Add the minimal ambient type/`@ts-expect-error` at the
untyped `prismarine-viewer` import.

**Verify:** `npm run render:sample` writes `out/sample.png`; open it and confirm the
sample blocks/floor are visible and textured (or, if GL unavailable, confirm the
documented skip path). Capture the path + byte size + a one-line visual description
in `progress.md`. **Commit:** `T-003-01: headless render to PNG (no server, no bot)`.

## Step 5 — `test/scaffold.test.mjs` render smoke + `README.md` (AC #1 prose, close-out)

Add test case 3 (PNG signature + non-trivial length when `GL_AVAILABLE`, else skip).
Write `README.md`: what the scaffold is, `npm run render:sample`/`test`/`typecheck`,
the pinned version and where it's single-sourced, and the headless-gl→Playwright
fallback (Design decision 3) for environments that can't build `gl`.

**Verify:** `npm test` green (3 cases; case 3 passes or skips with reason); `npm run
typecheck` clean. **Commit:** `T-003-01: scaffold smoke test + README`.

## Step 6 — Acceptance gate + `progress.md` finalize

Run the full gate from the top of `render/`:

- [ ] AC #1 — `npm run typecheck` clean; test case 1 proves `minecraft-data` pin +
      `minecraft-assets` load for 1.20.4.
- [ ] AC #2 — test case 2 proves an empty in-memory `prismarine-world` is created.
- [ ] AC #3 — `renderWorldToPng` produces a PNG with **no server and no bot** in the
      process (assert nothing spawns a server; the call is pure in-process render).
- [ ] AC #4 — `out/sample.png` exists and visibly shows the sample world.

Finalize `progress.md` with the per-step record, the GL-backend decision, and any
deviation. No separate commit unless docs-only cleanup remains.

## Risks & mitigations

- **`gl`/`canvas` native build on Node 22** — primary risk; mitigated by the Step 1
  three-tier contingency and the `headless-canvas.ts` isolation seam, so a backend
  swap is one file.
- **`prismarine-viewer` worker/asset loading headless** — `setVersion` and
  `WorldView` may spin worker threads / expect a DOM; mitigated by following the
  verified `lib/headless.js` recipe (`global.THREE`, `global.Worker`) and keeping
  the wiring in one file so quirks are contained.
- **Render correctness ("correct image")** — subjective; mitigated by a deliberately
  simple, recognizable sample (floor + a couple distinct blocks at a known center)
  and a fixed camera, so "correct" is checkable by eye and stable across runs.
- **Scope creep into T-003-02/03/04** — mitigated by the explicit "does not do" list
  in Design; the scaffold stops at a sample render behind clean seams.

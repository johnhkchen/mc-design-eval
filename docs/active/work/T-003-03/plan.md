# T-003-03 — Plan: ordered implementation steps

Four atomic, independently-committable steps from `structure.md`. Pure work (and its
tests) lands first and is green without a GPU; the GL-bound render branch and its
empirical test follow. Test command throughout: `cd render && npm test` (`node --test`).

## Testing strategy

- **Unit (no GPU, always run):** all `camera.mjs` framing math in `view.test.mjs` — the
  fixed-direction and comparability invariants are *number* properties, provable without
  rendering. This is the primary defense for AC #2.
- **Integration (GL-gated, `t.skip` without GL):** `renderBuild` over a known build —
  PNG validity (AC #1, #4) and the empirical comparable-footprint check (AC #2) by
  decoding the rendered pixels.
- **Regression:** `scaffold.test.mjs` and `world-build.test.mjs` must stay green
  untouched — the `renderWorldToPng` change is a strictly additive `bounds` branch.
- **Verification criteria per AC:**
  - AC #1 — `renderBuild` produces a valid PNG headless (GL test asserts signature, no
    server/bot in the path; reuses scaffold wiring).
  - AC #2 — pure invariant tests (angular size invariant under scaling; fixed direction) +
    GL footprint-band test across two build scales.
  - AC #3 — `renderBuild` returns `{ path, bytes, view }`; test asserts the returned
    `path` exists on disk.
  - AC #4 — GL test renders a known build and asserts non-trivial, in-frame geometry
    (non-background pixel fraction `∈ (0,1)`).

## Step 1 — `camera.mjs` + pure framing tests

**Create `render/src/camera.mjs`** per structure.md: `DEFAULT_VIEW`, `boxOf`,
`boundingSphere`, `framedCamera`, `viewDistanceFor`, private `deg2rad`/`mergeView`.
**Create `render/test/view.test.mjs`** with the pure tier only:

- `framedCamera(b).eye - target` normalizes to `(cosφsinθ, sinφ, cosφcosθ)` for defaults,
  for two differently-sized builds → **same unit direction** (fixed angle).
- For builds scaled k ∈ {1,3,10} from the same base: `distance` and `radius` scale by k;
  `asin(radius/distance)` (angular radius) is equal across k within `1e-9` → **comparable
  apparent size** (AC #2).
- `target` equals box center `(min+max+1)/2` per axis.
- Monotonicity: `fov` ↑ ⇒ `distance` ↓; `margin` ↑ ⇒ `distance` ↑.
- `viewDistanceFor` ≥ floor and grows with `distance`.
- `boxOf(null)` and `framedCamera(null)` throw `/bounds/`.

**Oracle:** `npm test` — pure cases pass with **no GPU**. Hand-check one `framedCamera`
against the scaffold vantage: default angles give `eye - center` roughly along `(+,+,+)`
(same octant as `(7,8,7)`).

**Commit:** `T-003-03: pure camera framing — fit bounding sphere, fixed angle (AC #2)`.

## Step 2 — `render.mjs`: `bounds` branch + `renderBuild`

**Modify `render/src/render.mjs`:**
- Import `framedCamera`, `viewDistanceFor`, `DEFAULT_VIEW` from `./camera.mjs`.
- In `renderWorldToPng`: if `opts.bounds` present, set `eye/target/fov/aspect` from
  `framedCamera(opts.bounds, opts.view)` and `viewDistance` from `viewDistanceFor(distance,
  radius, DEFAULTS.viewDistance)`; else the existing constant-offset path verbatim.
- Add `renderBuild(build, opts={})`: resolve `outPath` (default `render/out/build.png`);
  if `build.bounds` → `renderWorldToPng(build.world, framedTarget, { ...opts, outPath,
  bounds: build.bounds })`; else fallback around `build.center ?? Vec3(0,0,0)`. Return
  `{ path: outPath, bytes: buffer.length, view }`.

**Oracle:** `scaffold.test.mjs` still green (no `bounds` passed → unchanged path). If GL
present, a quick local `renderBuild` smoke writes a PNG and returns a real path. No new
test assertions in this step beyond regression.

**Commit:** `T-003-03: framed-camera render + renderBuild path API (AC #1, #3)`.

## Step 3 — GL-gated render-correctness test

**Extend `render/test/view.test.mjs`** with the integration tier (skips without GL, per
`headless-canvas` `GL_AVAILABLE`):
- Build a known small structure and a ×k-scaled copy of it **locally in the test** (using
  `createEmptyWorld` + `setBlock` + an explicit bounds — not touching `world.mjs`).
- `renderBuild` each; assert returned `path` exists + valid PNG signature + `bytes` large.
- Decode both PNGs (`canvas.loadImage(buffer)` → draw → `getImageData`), treat the
  top-left pixel as background (sky), count differing pixels. Assert each build's
  non-background fraction `∈ (0.02, 0.9)` and the two fractions are within a tolerance
  band (e.g. ratio ≤ ~1.6×) → **comparable framing across sizes** (AC #2 empirically) and
  **in-frame, not overflowing** (AC #4).

**Oracle:** with GL → integration cases pass; without GL → cleanly skipped with the
captured reason, suite still green.

**Commit:** `T-003-03: GL render test — valid PNG + comparable footprint across scales (AC #2, #4)`.

## Step 4 — `cli.mjs` demo + README

**Modify `render/src/cli.mjs`:** render the sample via `renderBuild` with explicit sample
bounds `{ min:[-2,0,-2], max:[2,1,2] }`; log returned `path`/`bytes`; keep GL guard and
`process.exit(0)`.
**Modify `render/README.md`:** replace the "T-003-03 refines later"/"fixed offset"
language with the real framing contract (fit-sphere, fixed angle, derived distance) and
document `renderBuild`'s `{ path, bytes, view }`; update the module table row for
`render.mjs` and add `camera.mjs`; drop T-003-03 from "out of scope".

**Oracle:** `npm run render:sample` writes `out/sample.png` and prints its path (when GL
present); `npm test` green. README matches the shipped API.

**Commit:** `T-003-03: sample CLI uses framed camera + README framing contract (AC #4)`.

## Risks / deviations protocol

- If `viewer.camera` does not honor a fed value (e.g. `fov` set after `aspect`), reorder to
  the scaffold's exact mutation sequence and note it in `progress.md`.
- If decoding via `canvas.loadImage` is awkward on the PNG buffer, write to a temp file and
  load from path; record the deviation.
- If the comparable-footprint band proves flaky on the CI GPU, widen the tolerance and
  document the empirical numbers rather than removing the assertion.
- Any plan change is written to `progress.md` *before* proceeding.

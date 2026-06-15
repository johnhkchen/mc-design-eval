# T-003-03 — Progress

Tracks execution against `plan.md`. Status: **Implement complete**, all 4 steps landed,
`npm test` green (22/22, GL available so render-correctness tier ran rather than skipped).

## Completed

### Step 1 — `camera.mjs` + pure framing tests ✅
- Created `render/src/camera.mjs`: `DEFAULT_VIEW`, `boxOf`, `boundingSphere`,
  `framedCamera`, `viewDistanceFor`, private `deg2rad`/`mergeView`. Pure (only imports
  `Vec3`); no THREE/GL/files.
- Created `render/test/view.test.mjs` pure tier: fixed-direction, the scaling-invariant
  (angular size constant across k∈{1,3,10}), box-center target, fov/margin monotonicity,
  `viewDistanceFor`, and null-bounds throws. All pass with no GPU.

### Step 2 — `render.mjs` framed branch + `renderBuild` ✅
- `renderWorldToPng` gained an additive `opts.bounds` branch: when present, eye/target/fov
  come from `framedCamera` and `viewDistance` from `viewDistanceFor`; the streaming center
  (`WorldView`) is the framed target. Without `bounds`, the path is byte-for-byte the
  scaffold's constant-offset behaviour (scaffold.test untouched, still green).
- Added `renderBuild(build, opts?) → { path, bytes, view }` (AC #3). Consumes the T-003-02
  `BuildResult` shape; empty build degrades to the constant-offset fallback.

### Step 3 — GL-gated render-correctness tests ✅
- `view.test.mjs` integration tier: renders a known build, asserts returned `path` exists +
  valid PNG signature + non-trivial bytes (AC #1, #3, #4), and that two build scales share
  a comparable on-screen footprint (AC #2 empirically). Measured: k=2 → footprint 0.115,
  k=6 → 0.099 (ratio 1.16 across a 3× size gap); distance/radius scale ~2.6× as expected.
- Skips cleanly with the captured reason when `GL_AVAILABLE` is false.

### Step 4 — CLI demo + README ✅
- `cli.mjs` now renders the sample through `renderBuild` with an explicit sample bounds
  literal (`world.mjs` untouched). `npm run render:sample` → 35326 bytes (vs the scaffold's
  ~21569; the build now fills the canonical comparable frame).
- `README.md`: added `camera.mjs`/`view.test.mjs` to the module table, replaced the "fixed
  offset / T-003-03 refines later" section with the real **Fixed, comparable framing**
  contract + `renderBuild` usage, and dropped T-003-03 from out-of-scope.

## Deviations from plan

1. **Commit grouping.** The plan suggested camera-then-render as separate commits, but the
   GL-gated tests in `view.test.mjs` import `renderBuild`, so the test file can only be
   green once `render.mjs` lands. Implementation (`camera.mjs` + `render.mjs`) and its
   verification (`view.test.mjs`) are therefore committed **together** so `npm test` is
   green at every commit; CLI+README is the second commit. No behavioural change.
2. **Concurrent-edit on `README.md`.** A concurrent thread (T-003-02) edited `README.md`
   mid-task (added the artifact→world section). Re-read and made surgical edits around it
   — no clobbering. Confirms the disjoint-footprint discipline: I touched only the render
   half (`camera.mjs`, `render.mjs`, `cli.mjs`, my README rows, `view.test.mjs`).

## Verification snapshot

- `npm test`: 22 pass / 0 fail / 0 skipped (GL present).
- `npm run render:sample`: writes `out/sample.png`, prints its path.
- No worker threads left running after the suite (scaffold teardown reused unchanged).

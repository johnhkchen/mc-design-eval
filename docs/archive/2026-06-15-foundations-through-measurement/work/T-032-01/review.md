# T-032-01 — Review: turntable-orbit-render

Self-assessment and handoff. The work adds an azimuth-sweep ("turntable") render mode to the
render harness, layered additively on the existing head-on path.

## Summary of changes

**Created**
- `render/src/orbit.mjs` — the capability. Pure core (`orbitAzimuths`, `orbitFramePath`,
  `defaultOrbitDir`) + `renderOrbit(artifact, opts)`. No new camera math: `framedCamera` already
  takes a per-call `azimuthDeg` and the bounding-sphere fit is rotation-independent, so only
  `view.azimuthDeg` changes per frame; distance/elevation/fov are constant across the sweep.
- `render/src/orbit-clip.mjs` — best-effort ffmpeg encode (`ffmpegAvailable`, `maybeEncodeClip`).
  Probe-then-encode; degrades to frames-only when ffmpeg is absent; never throws on a missing encoder.
- `render/src/orbit-cli.mjs` — `npm run render:orbit` rig: argv parse, GL gate, artifact load
  (file or dir), `renderOrbit` with per-frame progress, optional `--gif`/`--mp4`, `process.exit(0)`.
- `render/test/orbit.test.mjs` — 8 tests (7 pure no-GL + 1 GL-gated).
- `docs/active/work/T-032-01/{research,design,structure,plan,progress,review}.md`.

**Modified**
- `render/package.json` — `"render:orbit"` script.
- `render/README.md` — Run example + Module-shape rows.

**Commit:** `b36c479` — `feat(render): turntable orbit render … (T-032-01)`.

## Acceptance criteria

- **AC #1 — orbit fn/CLI writes N evenly-spaced frames (gitignored):** ✅ `renderOrbit` +
  `render:orbit`. Frames land under `render/out/orbit/<id>/` (already gitignored). `git status` shows
  zero PNG/`out/` files tracked.
- **AC #2 — run on a real `runs/<id>` build; frames show different angles:** ✅ ran on
  `benchmarks/temple-facade/runs/001-v0-facade/artifact.json` → 8 frames, 2908 placed each, byte
  sizes 34k–94k across azimuths (front vs side of a flat facade) — visibly different views. Also
  asserted automatically (frames 0° vs 90° hash-differ) in the GL-gated test.
- **AC #3 — artifact-general, reusable by E-11:** ✅ `orbit.mjs` imports only `renderArtifact` +
  path/camera utils; no facade/temple vocabulary; test artifact is a generic asymmetric "L".
- **AC #4 — test covers azimuth math without a full headless render; `npm test` green:** ✅ the
  pure tier (`orbitAzimuths`/`orbitFramePath`/`defaultOrbitDir`) needs no GL. Render package suite
  32/32; top-level 274/274.

## Test coverage

- **Strong:** azimuth math (count, exact `360/N` spacing, `startDeg` wrap, seamless N≡0 loop,
  invalid-`frames` rejection), frame-path padding/sanitization, default-dir location.
- **Adequate (GL-gated):** `renderOrbit` end-to-end at 4 frames — valid PNG signatures, correct
  azimuth list, and the frames-differ assertion (the AC #2 analog). Skips cleanly when GL absent.
- **Gaps / not automated:**
  - `orbit-clip.mjs` and `orbit-cli.mjs` are not unit-tested (subprocess + process-lifecycle +
    argv). They were smoke-tested manually: `--help`, missing-artifact exit code (2), ffmpeg encode
    to a 109 KB `orbit.mp4`, and the ffmpeg-absent degradation path is by construction (returns
    `{encoded:false, reason}`). Consistent with `cli.mjs`, which is also not unit-tested.
  - No assertion that elevation/distance are *byte-identical* across frames — relied upon from
    `view.test.mjs`'s existing proof that framing is rotation-independent.

## Open concerns / notes for the human reviewer

1. **Test home (intentional):** the azimuth-math test lives in `render/test/orbit.test.mjs`, run by
   the *render package's* `node --test` — NOT the top-level `npm test` glob (`src/**/*.test.mjs`).
   This follows the established render-harness layering (`camera.mjs` math is likewise tested only in
   `render/test/view.test.mjs`). Both suites are green. If the project wants every AC test inside the
   single top-level `npm test`, the render package's tests would need to be wired into it — a
   harness-wide decision out of scope for this ticket. Flagged per design.md Decision 6.

2. **Per-frame world rebuild (perf):** each frame is an independent `renderArtifact` call (fresh
   world + GL context + viewer workers, torn down per call). Correct and bleed-free, but an N-frame
   sweep pays N× the world-build cost. Fine for a rig (CI never renders; ~0.5–1s/frame here). If
   high frame counts (e.g. 60–120 for smooth video) become common, the optimization is to build the
   world once and re-aim the camera N times inside `renderWorldToPng` (design.md Decision 1, option
   B) — deferred as premature.

3. **ffmpeg clip is opportunistic:** no new dependency; `--gif`/`--mp4` silently degrades to
   frames-only off-PATH. The single-pass gif filter is basic (no two-pass palette) — acceptable for
   a turntable; revisit if gif quality matters.

4. **`startDeg` default is 0** (matches the ticket's "0→360"), so frame 0 is azimuth 0°, NOT the
   canonical head-on 45°. Use `--start 45` to make frame 0 reproduce the existing head-on render.

## Handoff

Capability is shippable and reusable. To wire multi-view review into E-11:
`import { renderOrbit } from '../../render/src/orbit.mjs'` in `src/sculptor/review.mjs` and call it
with the artifact `defaultRender` already builds — no changes to `orbit.mjs` required.

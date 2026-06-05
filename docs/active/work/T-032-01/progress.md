# T-032-01 — Progress: turntable-orbit-render

## Status: implementation complete, all ACs verified.

## What was done (vs plan.md)

Followed the planned ordering; implemented as one continuous pass (no deviations of substance).

| Plan step | Outcome |
|-----------|---------|
| 1. Pure helpers | `render/src/orbit.mjs` — `orbitAzimuths`, `orbitFramePath`, `defaultOrbitDir` |
| 2. Pure test tier | `render/test/orbit.test.mjs` — 7 no-GL cases (count/spacing/wrap/throws/paths) |
| 3. `renderOrbit` loop | added to `orbit.mjs`; serial loop over `renderArtifact`, only `view.azimuthDeg` varies |
| 4. GL-gated test | `renderOrbit` 4-frame test: valid PNGs + frames-differ (coarse pixel hash) |
| 5. CLI + clip | `render/src/orbit-cli.mjs`, `render/src/orbit-clip.mjs`, `render:orbit` script |
| 6. Real-build run + suites | ran on `runs/001-v0-facade`; both test suites green |

## Files created

- `render/src/orbit.mjs` — capability (pure azimuth math + `renderOrbit` loop). Artifact-general.
- `render/src/orbit-clip.mjs` — best-effort ffmpeg encode (`ffmpegAvailable`, `maybeEncodeClip`).
- `render/src/orbit-cli.mjs` — `npm run render:orbit` rig (argv, GL gate, load, render, optional clip).
- `render/test/orbit.test.mjs` — 8 tests (7 pure + 1 GL-gated).
- `docs/active/work/T-032-01/{research,design,structure,plan,progress,review}.md`.

## Files modified

- `render/package.json` — added `"render:orbit": "node src/orbit-cli.mjs"`.
- `render/README.md` — Run example + Module-shape rows for the orbit files.

## Verification

- **Pure azimuth math (AC #4):** `orbitAzimuths(8)` → `[0,45,90,135,180,225,270,315]`; spacing
  `360/N` for N ∈ {1,3,4,6,12,36}; `startDeg` wrap; non-positive-integer `frames` throws. No GL.
- **renderOrbit (AC #2 automated):** 4 frames → 4 valid PNGs at `[0,90,180,270]`; frames 0° vs 90°
  hash-differ.
- **Real build (AC #1, #2):**
  `npm run render:orbit -- --artifact ../benchmarks/temple-facade/runs/001-v0-facade/artifact.json --frames 8`
  wrote 8 frames to `render/out/orbit/001-v0-facade/` (2908 placed each). Byte sizes vary 34k–94k
  across angles (front/45° large, side/90°/270° small for a flat facade) — frames are clearly
  different views, not identical.
- **Optional clip:** ffmpeg present in this env; `maybeEncodeClip(dir,{format:'mp4'})` produced
  `orbit.mp4` (109 KB). Degrades to `{encoded:false, reason}` when ffmpeg is absent (verified by
  code path; never throws).
- **Artifact-general (AC #3):** `orbit.mjs` imports only `renderArtifact` + `camera`/path utils; no
  facade/temple vocabulary. Test artifact is a generic asymmetric "L".
- **Output gitignored:** `git status` shows only the new source/doc files — zero PNGs/`out/` tracked.
- **Test suites:** `cd render && npm test` → 32/32 pass (was 24; +8 orbit). Top-level `npm test` →
  274/274 pass (unchanged by this work — orbit lives in the render package's `node --test`).

## Deviations

None of substance. The azimuth-math test lives in `render/test/` (the render package's runner),
not top-level `src/**`, because the code lives in the render package beside `camera.mjs` — this is
the established home for render math (see `view.test.mjs`). Both suites are green; see design.md
Decision 6 and the open concern in review.md.

## Downstream notes (for E-11)

`src/sculptor/review.mjs:defaultRender` already holds a `DesignArtifact` at render time. Multi-view
review = `import { renderOrbit } from '../../render/src/orbit.mjs'` and call it with that artifact —
no changes to orbit.mjs needed.

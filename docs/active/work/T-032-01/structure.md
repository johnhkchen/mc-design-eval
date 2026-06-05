# T-032-01 — Structure: turntable-orbit-render

File-level blueprint. Not code — the shape of the code, public interfaces, and the order of
changes. Grounded in design.md (loop on `renderArtifact`; pure azimuth math; gitignored output;
optional ffmpeg; tests in the render package).

## Files

### CREATE — `render/src/orbit.mjs`  (the capability)

Render-domain, SDK-free, beside `camera.mjs`/`render.mjs`. Exports:

```
// Pure — the AC #4 testable core. No GL, no I/O.
export function orbitAzimuths(frames, { startDeg = 0 } = {}) → number[]
  // length === frames; angle_i = normalize360(startDeg + i * 360/frames)
  // throws if frames is not a positive integer

// Pure — frame file path with lexical == angular ordering.
export function orbitFramePath(dir, baseName, index, total) → string
  // baseName sanitized to safe chars; index zero-padded to max(3, digits(total-1))
  // e.g. orbitFramePath('out/orbit/x', 'frame', 7, 36) → 'out/orbit/x/frame.007.png'

// Default output dir for a build's sequence (under the gitignored render/out/).
export function defaultOrbitDir(trialId) → string
  // render/out/orbit/<safeTrialId>/   (trialId sanitized like derivePath)

// The render loop. Reuses renderArtifact per frame; only view.azimuthDeg changes.
export async function renderOrbit(artifact, opts = {}) → Promise<OrbitReport>
```

Types (JSDoc):
```
@typedef FrameReport { index:number, azimuthDeg:number, path:string, bytes:number,
                       placed:number, unmapped:object[], bounds:object|null }
@typedef OrbitReport { dir:string, frames:FrameReport[], view:object, azimuths:number[] }
```

`renderOrbit` opts (all optional):
- `frames = 8`
- `startDeg = 0`
- `outDir` — default `defaultOrbitDir(artifact.metadata?.trial_id ?? 'orbit')`
- `baseName = 'frame'`
- `view` — partial view; merged with `{ azimuthDeg }` per frame (azimuth always overridden)
- `strict` — passed through to `renderArtifact`
- `onFrame(frameReport)` — optional progress callback, invoked after each frame

Internals:
- Compute `azimuths = orbitAzimuths(frames, { startDeg })`.
- For each `i`/`azimuthDeg`: `outPath = orbitFramePath(outDir, baseName, i, frames)`;
  `report = await renderArtifact(artifact, { outPath, view: { ...view, azimuthDeg }, strict })`;
  push a `FrameReport`; call `onFrame` if given.
- Sequential (not parallel): each `renderArtifact` spins up prismarine-viewer workers + a GL
  context and tears them down; running them concurrently would multiply GL contexts. Loop is
  deliberately serial.
- Return `{ dir: outDir, frames, view: merged-view-without-azimuth, azimuths }`.

Imports: `renderArtifact` from `./render-tool.mjs`; `DEFAULT_VIEW` from `./camera.mjs` (for the
documented elevation/fov context); `node:path`, `node:url` for the default dir. NO GL import at
module top (renderArtifact lazy-loads GL itself via render.mjs).

### CREATE — `render/src/orbit-clip.mjs`  (optional encoder, best-effort)

Isolated so `orbit.mjs` stays subprocess-free and unit tests never spawn anything.

```
export async function ffmpegAvailable() → Promise<boolean>     // spawn `ffmpeg -version`, catch
export async function maybeEncodeClip(dir, {
  pattern = 'frame.%03d.png', outPath, fps = 12, format = 'mp4'
} = {}) → Promise<{ encoded:boolean, path?:string, reason?:string }>
```

- Uses `node:child_process` `spawn`. If ffmpeg absent → `{ encoded:false, reason:'ffmpeg not on PATH' }`.
- mp4: `ffmpeg -y -framerate <fps> -i <dir>/<pattern> -pix_fmt yuv420p <outPath>`.
- gif: two-pass palette or single-pass `-vf "fps=<fps>,scale=...:flags=lanczos"`; keep simple,
  single-pass acceptable for a turntable.
- Never throws on a missing encoder; only rejects on an actual ffmpeg *error* exit when ffmpeg was
  found and asked to run.

### CREATE — `render/src/orbit-cli.mjs`  (the runnable rig — AC #1, #2)

`npm run render:orbit -- --artifact <path> [--frames N] [--out DIR] [--start DEG] [--elevation DEG] [--gif|--mp4] [--fps N]`

- Tiny inline `process.argv` parser (house norm — see `scripts/image-to-grid.mjs`); supports
  `--flag value` and a positional artifact path.
- GL gate exactly like `cli.mjs`: if `!GL_AVAILABLE`, print the reason + the Playwright/Chromium
  fallback hint and `process.exit(1)`.
- Load artifact: `JSON.parse(readFileSync(artifactPath))`. Accept either a `runs/<id>/artifact.json`
  path or a dir (append `artifact.json` if a directory is given).
- Build `view` from `--elevation` (override `elevationDeg`) if provided; leave the rest at defaults.
- Call `renderOrbit(artifact, { frames, startDeg, outDir, view, onFrame: logLine })`.
- If `--gif`/`--mp4`: `await maybeEncodeClip(report.dir, { format, outPath, fps })`; log whether it
  encoded or was skipped (reason).
- Log a final summary (dir, frame count, angles), then **`process.exit(0)`** (viewer workers hold
  the loop open — same reason as `cli.mjs`).

### CREATE — `render/test/orbit.test.mjs`  (AC #4 + #2-automated)

Mirrors `view.test.mjs`'s two tiers. See plan.md for the exact cases.

### MODIFY — `render/package.json`

Add one script: `"render:orbit": "node src/orbit-cli.mjs"`.

### MODIFY — `render/README.md`  (if a "pieces"/usage list exists)

One bullet: `orbit.mjs` — azimuth-sweep turntable over any artifact; `npm run render:orbit`. (Match
the existing doc style; skip if no such section.)

### NO CHANGE

`camera.mjs`, `render.mjs`, `render-tool.mjs` (both layers), `world.mjs`, `src/sculptor/*`. Orbit is
additive; `framedCamera` already takes a per-call azimuth.

## Module boundaries

```
orbit-cli.mjs ──(argv, file I/O, GL gate, process.exit)──┐
                                                          ├─► orbit.mjs ──► renderArtifact ──► renderBuild ──► framedCamera/GL
orbit-clip.mjs ──(ffmpeg subprocess, best-effort)─────────┘            (render/src/render-tool.mjs, unchanged)
                                                          │
orbit.test.mjs ──(pure: orbitAzimuths/orbitFramePath ; GL-gated: renderOrbit)
```

- **Pure core** (`orbitAzimuths`, `orbitFramePath`, `defaultOrbitDir`) — no I/O, no GL → fast unit
  tests, the AC #4 surface.
- **Render loop** (`renderOrbit`) — only I/O is the PNG writes inside `renderArtifact`; GL-gated.
- **CLI / clip** — all the messy edges (argv, filesystem, subprocess, process lifecycle) quarantined
  away from the core.

## Reuse by E-11 (AC #3)

`src/sculptor/review.mjs:defaultRender` already holds a `DesignArtifact` when it renders. Multi-view
inspection for the review bookend = `import { renderOrbit } from '../../render/src/orbit.mjs'` and
call it with that artifact. No facade/temple coupling in `orbit.mjs` → reusable as-is.

## Ordering of changes (for Plan)

1. `orbit.mjs` pure helpers (`orbitAzimuths`, `orbitFramePath`, `defaultOrbitDir`).
2. `orbit.test.mjs` pure tier — lock the math (AC #4).
3. `renderOrbit` loop in `orbit.mjs`.
4. `orbit.test.mjs` GL-gated tier — frames differ (AC #2-automated).
5. `orbit-clip.mjs` + `orbit-cli.mjs`; `render/package.json` script.
6. Run on a real `runs/<id>` artifact; verify the sequence (AC #1, #2). Both test suites green.

# T-032-01 — Research: turntable-orbit-render

Map of the existing render harness, the camera contract, artifact loading, output/gitignore
conventions, and test patterns relevant to adding an azimuth-sweep ("turntable") render mode.
Descriptive only — no solution proposed here.

## The ticket in one line

Given a build artifact (its in-memory voxel world), render N frames sweeping the camera
**azimuth** 0→360° at **fixed elevation/distance**, reusing the existing head-on render path.
The only new parameter is the azimuth sweep. Keep it artifact-general so E-11's review bookend
can call it for multi-view inspection.

## Render harness — the layers (render/)

The render system is a two-layer stack. The render *domain* lives in `render/` (its own
package, `mc-design-eval-render`, with its own `node --test`); the SDK-facing adapter lives in
top-level `src/`.

- **`render/src/camera.mjs`** — PURE framing math. No THREE/GL/files. This is where the camera
  is decided. Key exports:
  - `DEFAULT_VIEW` = `{ width:512, height:512, fov:75, azimuthDeg:45, elevationDeg:35, margin:1.18 }`.
    The fixed "head-on" 3/4 vantage (≈ the scaffold's (7,8,7) offset).
  - `boxOf(bounds)` → world-space box; a voxel at `p` fills `[p, p+1]` (high side is `max+1`).
  - `boundingSphere(bounds)` → `{ center: Vec3, radius }`. Half the space diagonal — chosen so the
    fit is **rotation-independent**: "the same build frames identically from any azimuth"
    (camera.mjs:62-63). This is the property that makes a turntable trivially comparable.
  - `framedCamera(bounds, view)` → `{ eye, target, up, fov, distance, radius }`. Fixed direction
    (azimuth/elevation), distance derived to fit the bounding sphere. The direction vector
    (camera.mjs:104-108):
    ```
    dir = ( cos φ · sin θ ,  sin φ ,  cos φ · cos θ )   // θ = azimuthDeg, φ = elevationDeg
    eye = center + dir · distance
    ```
  - `viewDistanceFor(distance, radius, min)` → chunk-streaming radius so the far side meshes in.
  - `mergeView(view)` (internal) validates the numeric view contract; `framedCamera` already
    accepts a partial `view` and merges over `DEFAULT_VIEW`.

- **`render/src/render.mjs`** — the headless render (THREE + prismarine-viewer + headless GL).
  - `renderWorldToPng(world, center, opts)` — low-level. With `opts.bounds` present it calls
    `framedCamera(opts.bounds, opts.view)` and positions `viewer.camera` accordingly
    (render.mjs:55-66, 101-105). The camera mutation sequence (position/fov/aspect/lookAt) is the
    only place azimuth reaches the GL renderer — and it already flows from the `view` object.
  - `renderBuild(build, opts)` — higher-level. Takes `{ world, bounds, center? }`, merges
    `opts.view` over `DEFAULT_VIEW`, frames via `framedCamera`, returns `{ path, bytes, view }`.
  - Exports the GL gate `GL_AVAILABLE` / `GL_LOAD_ERROR` (re-exported up the stack).
  - Terminates viewer worker threads and tears down the GL context every call (render.mjs:113-121)
    so **repeated calls leave nothing running** — important for an N-frame loop.

- **`render/src/render-tool.mjs`** — the composition core: `renderArtifact(artifact, opts)`.
  - `opts` = `{ outPath?, view?, strict? }`. Builds a FRESH world every call
    (`buildWorldFromArtifact`), renders via `renderBuild`, returns a `RenderReport`:
    `{ path, bytes, placed, unmapped, bounds, view }`.
  - **Stateless by construction** — "sequential calls cannot bleed into each other"
    (render-tool.mjs:9-11). An N-frame orbit is N independent `renderArtifact` calls.
  - This is the natural seam to loop over: pass a per-frame `outPath` and a per-frame
    `view.azimuthDeg`.

- **`render/src/world.mjs`** — `buildWorldFromArtifact`, `createEmptyWorld`, `setBlock`,
  `buildSampleWorld`. Produces the `BuildResult` `{ world, center, bounds, placed, unmapped }`.

- **`render/src/headless-canvas.mjs`** — `createHeadlessCanvas`, `GL_AVAILABLE`, `GL_LOAD_ERROR`.
  GL is **available** in this environment (verified: `GL_AVAILABLE === true`).

## SDK adapter (top-level src/)

- **`src/render-tool.mjs`** — wraps `renderArtifact` as the in-process Agent SDK `render` tool.
  - `derivePath(outDir, trialId, n)` — per-call path; sanitizes `trialId` to safe chars, suffixes
    `-rev<n>` for n>0. The model-facing path-disambiguation precedent for multiple renders of one
    trial. An orbit needs the same idea but indexed by **frame**, not revision.
  - `renderSummary`, `toToolResult` — pure result shaping. Not needed for a CLI rig, but show the
    house style for compact JSON summaries.
  - Default out dir = `render/out/`.

## How a "real build" artifact is loaded

- Real run artifacts live at **`benchmarks/temple-facade/runs/<id>/artifact.json`** (26 present,
  e.g. `001-v0-facade`, `005-vN-bestof`). Each dir also has `render.png`, `prompt.txt`,
  `summary.json`, `transcript.jsonl`.
- `runs/` is the ticket's "`runs/<id>`" — these are the canonical real builds. (Top-level
  `trials/` also exists and is gitignored.)
- An artifact is a plain JSON `DesignArtifact`: `{ schema_version, metadata{trial_id,…}, style,
  palette{manifest:[…]}, placements:[…] }` (verified by reading `001-v0-facade/artifact.json`).
- Loading is just `JSON.parse(readFileSync(path))`. `renderArtifact` assumes schema-validity
  (the SDK door validates with `parseArtifact`); the render-domain layer is total — unmappable
  blocks are recorded in `unmapped`, never thrown.

## Output paths & gitignore

- `render/out/` is gitignored (`render/.gitignore` → `out/`). All sample/test renders land here.
- `benchmarks/temple-facade/runs/` is gitignored at the top level. Renders are "local-only,
  image-heavy"; the durable record is the journal.
- Conclusion: any orbit frame sequence must write under an already-ignored dir (e.g.
  `render/out/orbit/<id>/`) so the output stays uncommitted, consistent with every other render.

## Test patterns

- **`render/test/view.test.mjs`** is the exact template. Two tiers:
  1. **Pure math** (runs anywhere, no GPU) — the primary defense of the comparability invariant.
     E.g. `framedCamera: viewing direction is fixed regardless of build size`,
     `angular size is invariant under uniform scaling`. Uses `node:test` + `node:assert/strict`.
  2. **GL-gated render correctness** — `await import('../src/headless-canvas.mjs')`, `t.skip(...)`
     with the captured reason when `!GL_AVAILABLE`; otherwise renders a local `knownBuild(k)` and
     decodes the PNG with `canvas` to compute `nonBackgroundFraction` (pixel-level assertions).
  - The math tier is the model for AC #4 ("azimuth math … without requiring a full headless
    render in CI").
- Test runners (IMPORTANT divergence):
  - Top-level `npm test` = `validate-artifact` self-tests + `node --test "src/**/*.test.mjs"`.
    It does **not** run `render/test/**`.
  - `render/` has its own `npm test` = `node --test` (runs `render/test/*.test.mjs`).
  - So `render/src/camera.mjs`'s tests live in `render/test/view.test.mjs` and are exercised by the
    *render package's* runner, not the top-level one. Any new render-math test follows that home.

## CLI precedent

- **`render/src/cli.mjs`** (`npm run render:sample`) is the only render CLI. It: gates on
  `GL_AVAILABLE` (prints the fallback hint and `process.exit(1)` if absent), builds a world,
  calls `renderBuild`, logs `wrote <path> (<bytes> bytes)`, then **`process.exit(0)`** because
  prismarine-viewer holds worker threads open. No arg parsing — hard-coded sample.
- Top-level scripts (`scripts/*.mjs`, e.g. `image-to-grid.mjs`) do ad-hoc `process.argv` parsing.
  No shared arg-parse helper exists; a small inline parser is the house norm.

## E-11 reuse surface

- `src/sculptor/review.mjs` (the review bookend) has `defaultRender(buildState)` which compiles a
  BuildState → DesignArtifact and calls `renderArtifact`. An orbit capability that takes an
  *artifact* (not a facade/temple specific) is directly reusable: the review bookend already has
  an artifact in hand at render time, so multi-view inspection = call the orbit function with that
  artifact. Keeping orbit artifact-general (AC #3) is what preserves this.

## Constraints & assumptions surfaced

- **Comparability is free across azimuths.** Because `boundingSphere` fits a sphere (not per-axis
  extents), distance/elevation/fov are identical for every azimuth — the turntable is already
  "fixed elevation/distance" with zero extra math. Only `view.azimuthDeg` changes per frame.
- **Statelessness makes the loop safe.** N frames = N `renderArtifact` calls; each tears down its
  GL/workers. No cross-frame bleed, but each frame pays full world-build + render cost (slow; not a
  CI concern since the math test avoids GL).
- **GL availability is environment-dependent.** The frame-producing path must skip/exit cleanly
  when GL is absent, exactly like `cli.mjs` and the view tests.
- **Evenly-spaced angles** for a loop means `i·(360/N)` for `i ∈ [0,N)` (frame N would equal frame
  0), not `N` angles including both 0 and 360.
- **ffmpeg/gif is optional** — must degrade to "frames only" when no encoder is on PATH.
- **Output must stay gitignored** — write under `render/out/…`.

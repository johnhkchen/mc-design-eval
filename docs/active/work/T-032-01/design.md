# T-032-01 — Design: turntable-orbit-render

Decide *how* to add the azimuth sweep. Grounded in research: the camera already takes a `view`
with `azimuthDeg`, framing is rotation-independent, and `renderArtifact` is stateless. The orbit
is therefore a thin loop, not new camera math. The real design choices are about *where the seam
is*, *how angles are computed*, *path/output layout*, *the clip option*, and *test home*.

## Decision 1 — Layer the orbit on `renderArtifact`, in the render domain

**Options**

- **A. New `render/src/orbit.mjs` calling `renderArtifact` in a loop.** Pure azimuth math +
  per-frame `view.azimuthDeg` + per-frame `outPath`.
- B. Loop inside `renderWorldToPng` — build the world once, re-aim the camera N times, snapshot
  each. Avoids rebuilding the world per frame.
- C. Add an "orbit" flag to the SDK render tool (`src/render-tool.mjs`).

**Chosen: A.** The render core is explicitly "stateless by construction; sequential calls cannot
bleed" (render-tool.mjs:9-11) — looping at that seam reuses the *entire* proven head-on path
(world build → frame → GL teardown) with zero new GL code, exactly satisfying "reuse the existing
head-on render path; the only new parameter is the azimuth sweep."

B is the performance-optimal design (build world once, ~N× fewer chunk builds) but reaches inside
the GL/worker-teardown logic that render.mjs deliberately runs *per call*; reusing the camera and
keeping chunks streamed across N snapshots is a real refactor of the most fragile file, for a rig
capability where wall-clock isn't a constraint (CI never renders). Rejected as premature. It is
noted as a future optimization in structure.md if frame counts ever get large.

C is rejected because the capability must be artifact-general and reusable by E-11's *code*
(`review.mjs` calls `renderArtifact` directly), not only by the model via MCP. A plain function is
callable from both the CLI and E-11; an MCP tool is not callable from E-11's render path.

## Decision 2 — Azimuth math as a separate pure function (`orbitAzimuths`)

**Chosen:** `orbitAzimuths(frames, { startDeg = 0 } = {})` → `number[]` of length `frames`, with
`angle_i = normalize360(startDeg + i · 360/frames)`.

Rationale: AC #4 demands a test of "N frames → correct evenly-spaced angles … without a full
headless render." Isolating the angle list as a pure, GL-free function makes that test trivial and
fast — mirroring how `camera.mjs` isolates framing math from `render.mjs` so it's unit-testable
without a GPU. The renderer consumes the list; the test asserts the list.

**Spacing choice:** `360/N` step over `[0, N)` (so frame N would coincide with frame 0 — a clean
loop), *not* `N` samples spanning both endpoints (which double-counts 0°/360°). For N=8 →
`[0,45,90,135,180,225,270,315]`. This is what makes the sequence loop seamlessly as a turntable.

**Start offset:** default `0` to match the ticket's literal "azimuth 0→360°". `startDeg` is
exposed so a caller can begin at the canonical head-on (`DEFAULT_VIEW.azimuthDeg = 45`) if they
want frame 0 to equal the existing head-on render. Rejected defaulting to 45: the ticket says 0,
and a turntable's phase is arbitrary anyway.

**Validation:** `frames` must be a positive integer; throw a clear error otherwise (a fractional or
zero frame count is a caller bug, not something to silently round).

## Decision 3 — `renderOrbit(artifact, opts)` shape

**Chosen signature:**
```
renderOrbit(artifact, {
  frames = 8,
  startDeg = 0,
  outDir,            // default render/out/orbit/<trial_id|orbit>/
  baseName = 'frame',
  view,              // partial view override (elevation/fov/margin/size); azimuthDeg is set per frame
  onFrame,           // optional (frame) => void progress callback
} = {}) → Promise<{ dir, frames: FrameReport[], view }>
```
where `FrameReport = { index, azimuthDeg, path, bytes, placed, unmapped, bounds }`.

Rationale:
- **`view` minus azimuth.** The caller controls elevation/distance/fov/size; `renderOrbit`
  overwrites `azimuthDeg` per frame. "Fixed elevation/distance" falls out automatically — distance
  is derived from the (constant) bounding sphere, identical every frame.
- **Returns structured per-frame reports**, reusing `renderArtifact`'s `RenderReport` fields, so
  E-11 / the CLI can inspect placed/unmapped counts and the angles actually used.
- **`onFrame` callback** lets the CLI stream progress ("frame 3/8 @ 135°") without `renderOrbit`
  importing a logger — keeps the core quiet and pure-ish (only I/O is the renders themselves).

## Decision 4 — Output path layout (gitignored)

**Chosen:** default `outDir = render/out/orbit/<safeTrialId>/`, frame files
`<baseName>.<NNN>.png` zero-padded to at least 3 digits (width grows with frame count).

Rationale: `render/out/` is already gitignored (research §Output) — nesting under it keeps every
frame uncommitted with no `.gitignore` edit. A per-build subdir keeps a 36-frame sequence from
colliding with `build.png`/`sample.png` and makes ffmpeg globbing trivial (`frame.%03d.png`).
`trial_id` is sanitized exactly like `derivePath` does (model/file-name-authored → must not escape
`outDir`). Zero-padding keeps lexical order = angular order (so `ls` and ffmpeg agree).

Rejected: reusing `derivePath`'s `-rev<n>` scheme — that encodes *revision* semantics; frames are
a different axis and deserve their own padded index in their own dir.

## Decision 5 — Optional clip encoding, best-effort

**Chosen:** a separate `maybeEncodeClip(dir, { pattern, outPath, fps })` helper that probes for
`ffmpeg` on PATH (spawn `ffmpeg -version`); if present, encodes `frame.%03d.png` → `orbit.mp4`
(or `.gif`); if absent, returns `{ encoded: false, reason }` and the frames remain the deliverable.

Rationale: the ticket says "**optionally** an encoded clip **if** ffmpeg/gif tooling is available."
Encoding must never be load-bearing: no new npm dependency, no failure when ffmpeg is missing. It is
wired only into the CLI behind a `--gif`/`--mp4` flag, kept out of `renderOrbit`'s core so the
function stays dependency-free and the unit tests never touch a subprocess.

Rejected: a JS gif encoder (e.g. `gifenc`) as a dependency — adds weight for a capability the
ticket explicitly frames as optional/environmental. ffmpeg-if-present is zero-install.

## Decision 6 — Test home & strategy

**Chosen:** tests live in **`render/test/orbit.test.mjs`**, two tiers mirroring `view.test.mjs`:
1. **Pure math (no GL, the AC #4 test):** `orbitAzimuths` — correct count, even spacing,
   `360/N` step, wraps with `startDeg`, frame N≡frame 0, rejects bad `frames`. Also
   `orbitFramePath` padding/sanitization. Runs in any environment.
2. **GL-gated (skips when `!GL_AVAILABLE`):** `renderOrbit` over a tiny local `knownBuild`, 4
   frames; assert 4 PNGs written with valid signatures **and that frames differ** (two azimuths
   90° apart have a different `nonBackgroundFraction`/pixel hash) — the automated analog of AC #2's
   "frames show the structure from different angles (not all identical)."

**Why render/test/ not src/:** the code lives in the render package (`render/src/orbit.mjs`),
beside the camera math it extends; `view.test.mjs` establishes that render-math tests belong to the
render package's `node --test` runner. AC #4's "`npm test` green" is honored by running the render
package's test suite (where the azimuth math actually is) **and** keeping the top-level `npm test`
green (it imports nothing new). Both suites will be run and reported in review.

Rejected: placing a duplicate azimuth-math test under top-level `src/**` purely to land inside the
top-level `npm test` glob — that would split the orbit code's home from its test and break the
established render-package layering for a glob technicality. The function is tested where it lives.

## What this does NOT change

- No change to `camera.mjs` math, `render.mjs`, `renderArtifact`, or the SDK tool. Orbit is purely
  additive (`framedCamera` already accepts a per-call `azimuthDeg`).
- No new runtime dependency. ffmpeg is probed, never required.
- No facade/temple specifics — `renderOrbit` takes any `DesignArtifact` (AC #3).

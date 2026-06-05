# T-032-01 — Plan: turntable-orbit-render

Ordered, independently-verifiable steps. Testing strategy: the azimuth math is the unit-tested
core (no GL, AC #4); the render loop is GL-gated; the real-build run is the manual AC #1/#2 proof.
Commit after each meaningful unit.

## Step 1 — Pure helpers in `render/src/orbit.mjs`

Implement `orbitAzimuths`, `orbitFramePath`, `defaultOrbitDir` (no `renderOrbit` yet).

- `orbitAzimuths(frames, { startDeg = 0 })`: validate `Number.isInteger(frames) && frames > 0`
  (throw `Error('orbitAzimuths: frames must be a positive integer, got <x>')`). Return
  `Array.from({length: frames}, (_, i) => normalize360(startDeg + i * 360 / frames))`.
  `normalize360(d) = ((d % 360) + 360) % 360`.
- `orbitFramePath(dir, baseName, index, total)`: `safe = sanitize(baseName)`;
  `pad = Math.max(3, String(total - 1).length)`; return
  `join(dir, `${safe}.${String(index).padStart(pad,'0')}.png`)`.
- `defaultOrbitDir(trialId)`: `safe = sanitize(trialId) || 'orbit'`; return
  `render/out/orbit/<safe>/` resolved from `import.meta.url`.
- `sanitize(s) = String(s).replace(/[^a-zA-Z0-9._-]/g,'_')` (same rule as `derivePath`).

**Verify:** import in a node one-liner; eyeball `orbitAzimuths(8)` →
`[0,45,90,135,180,225,270,315]`.

## Step 2 — Pure test tier in `render/test/orbit.test.mjs` (AC #4)

`node:test` + `node:assert/strict`. Cases:

1. `orbitAzimuths(8)` has length 8 and equals `[0,45,90,135,180,225,270,315]`.
2. Even spacing: consecutive diffs all `=== 360/N` for N ∈ {1,3,4,6,12,36} (modulo wrap on the
   last→first which is also `360/N`).
3. `startDeg` offset + wrap: `orbitAzimuths(4,{startDeg:315})` → `[315,45,135,225]` (315+90=405→45).
4. Frame N would coincide with frame 0: `startDeg + N*(360/N) ≡ startDeg (mod 360)` — assert the
   "next" angle after the last wraps to `azimuths[0]`.
5. Invalid `frames` throws: `0`, `-1`, `2.5`, `NaN` each `assert.throws(/positive integer/)`.
6. `orbitFramePath('d','frame',7,36)` → `d/frame.007.png`; padding widens for `total>1000`;
   baseName with unsafe chars is sanitized.
7. `defaultOrbitDir('001/v0')` ends with `render/out/orbit/001_v0/` (sanitized, under out/).

**Verify:** `cd render && node --test test/orbit.test.mjs` → all pass (these need no GL).

**Commit:** `feat(render): orbit azimuth math (T-032-01)`.

## Step 3 — `renderOrbit` loop in `render/src/orbit.mjs`

Add the async loop per structure.md. Imports `renderArtifact` from `./render-tool.mjs`.

- Resolve `outDir`, `baseName`, `frames`, `startDeg`, `view`, `strict`, `onFrame` from opts.
- `azimuths = orbitAzimuths(frames, { startDeg })`.
- Serial `for` loop: per frame build `outPath`, call
  `renderArtifact(artifact, { outPath, view: { ...view, azimuthDeg }, strict })`, assemble a
  `FrameReport`, `onFrame?.(frameReport)`.
- Return `{ dir, frames, view, azimuths }`.

**Verify:** transpile/import cleanly; defer behavioral check to Step 4.

## Step 4 — GL-gated test tier in `orbit.test.mjs` (AC #2 automated)

Mirror `view.test.mjs`'s skip pattern and helpers.

1. **Skip guard:** `const { GL_AVAILABLE, GL_LOAD_ERROR } = await import('../src/headless-canvas.mjs')`;
   `if (!GL_AVAILABLE) { t.skip(reason); return }`.
2. Build a tiny **local** `knownBuild`-style artifact (an asymmetric shape so rotation is visible —
   e.g. an L of blocks, not a symmetric cube) wrapped as a minimal `DesignArtifact` with a few
   `voxel`/`fill` placements. Keep it local to the test (no benchmark dependency).
3. `renderOrbit(artifact, { frames: 4, outDir: out/test-orbit, view:{width:128,height:128} })`
   (small frames to keep it fast).
4. Assert: 4 frames returned; each `path` exists with a valid PNG signature; `azimuths` ===
   `[0,90,180,270]`.
5. **Frames differ (the AC #2 analog):** decode two frames 90° apart with `canvas` and assert their
   pixel signatures differ (reuse a `nonBackgroundFraction`-style diff, or a coarse pixel hash) —
   "not all identical."

**Verify:** `cd render && node --test test/orbit.test.mjs` — pure tier passes always; GL tier passes
here (GL available) or skips on a GPU-less runner.

**Commit:** `feat(render): renderOrbit loop + GL test (T-032-01)`.

## Step 5 — CLI + optional clip

- `render/src/orbit-clip.mjs`: `ffmpegAvailable()`, `maybeEncodeClip(...)` (best-effort spawn).
- `render/src/orbit-cli.mjs`: argv parse, GL gate, load artifact (file or dir), `renderOrbit` with a
  progress `onFrame`, optional `maybeEncodeClip` behind `--gif`/`--mp4`, final summary,
  `process.exit(0)`.
- `render/package.json`: add `"render:orbit": "node src/orbit-cli.mjs"`.
- `render/README.md`: one bullet if a pieces/usage section exists.

**Verify:** `cd render && npm run render:orbit -- --help`-style dry path (or run with a tiny frames
value) prints usage / exits cleanly without an artifact; with a bad path prints a clear error.

**Commit:** `feat(render): orbit CLI + optional ffmpeg clip (T-032-01)`.

## Step 6 — Run on a real build + full suite (AC #1, #2)

- Pick a real artifact, e.g. `benchmarks/temple-facade/runs/001-v0-facade/artifact.json`.
- `cd render && npm run render:orbit -- --artifact ../benchmarks/temple-facade/runs/001-v0-facade/artifact.json --frames 8`.
- Confirm 8 PNGs under `render/out/orbit/001-v0-facade/`; spot-check (file sizes differ / open a
  couple) that frames show different angles — not identical. Capture this in progress.md/review.md.
- Run **both** test suites:
  - `cd render && npm test` (orbit + view + render-tool render-package tests).
  - top-level `npm test` (must stay green — orbit adds nothing to the `src/**` glob).
- Record outputs in progress.md.

**Commit:** if any doc/script tweak remains; otherwise the run is captured in the artifacts.

## Testing strategy summary

| Surface              | Test                                  | Needs GL? | AC   |
|----------------------|---------------------------------------|-----------|------|
| `orbitAzimuths`      | count, spacing, wrap, invalid throws  | no        | #4   |
| `orbitFramePath`     | padding, sanitization                 | no        | #1   |
| `renderOrbit`        | N frames, valid PNGs, frames differ   | yes (skip)| #2   |
| real `runs/<id>` run | manual spot-check sequence            | yes       | #1,2 |
| artifact-general     | test artifact is generic, no temple   | —         | #3   |

## Risks & mitigations

- **GL absent on CI** → render tier *skips* (never fails); the math tier still proves AC #4. Same
  contract as `view.test.mjs`.
- **Per-frame world rebuild is slow** for large frame counts → acceptable (rig, not hot path);
  noted as a future `renderWorldToPng`-level optimization in review.
- **ffmpeg missing** → `maybeEncodeClip` degrades to "frames only"; never load-bearing.
- **Symmetric test build hides rotation** → use an asymmetric shape so the "frames differ" assert is
  meaningful.
- **Output committed by accident** → all frames under `render/out/` (already gitignored); verify
  `git status` stays clean of PNGs before committing.

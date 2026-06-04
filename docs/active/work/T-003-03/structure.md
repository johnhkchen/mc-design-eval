# T-003-03 — Structure: file-level blueprint

The shape of the code that implements `design.md`. Not the code — the files, the public
interfaces, the boundaries, and the ordering. Footprint is kept **disjoint from
concurrent tickets**: only the *render half* is touched (`render.mjs`, `cli.mjs`, a new
`camera.mjs`, a new test). `world.mjs` (T-003-02), `version.mjs`, and
`headless-canvas.mjs` are read-only.

## Files

| File | Change | Why |
| --- | --- | --- |
| `render/src/camera.mjs` | **create** | Pure framing math (no THREE/GL). The comparability primitive, unit-testable on GL-less CI. |
| `render/src/render.mjs` | **modify** | Consume `camera.mjs` when `bounds` given; add `renderBuild` (path-returning, AC #3). Constant-offset path unchanged. |
| `render/src/cli.mjs` | **modify** | Switch the sample to `renderBuild` with explicit sample bounds, so the demo shows comparable framing. |
| `render/test/view.test.mjs` | **create** | Pure framing tests (always) + a GL-gated render-correctness/comparability test (AC #2, #4). |
| `render/README.md` | **modify** | Replace the "T-003-03 refines later" notes with the now-real framing contract + API. |

No deletions. No dependency changes (`vec3` already present; framing is arithmetic).

## `render/src/camera.mjs` (new) — public interface

Pure module. Imports only `Vec3` from `vec3`. Angles in degrees at the boundary, radians
internally.

```
export const DEFAULT_VIEW = {
  width: 512, height: 512, fov: 75,        // perspective, vertical fov in degrees
  azimuthDeg: 45, elevationDeg: 35,        // fixed 3/4 vantage (≈ scaffold's (7,8,7))
  margin: 1.18                             // ~18% padding around the bounding sphere
}

// World-space box for an integer voxel bounds: hi = max + 1 (a voxel occupies [p, p+1]).
export function boxOf(bounds) -> { lo:[x,y,z], hi:[x,y,z] }      // throws if bounds == null

// Bounding sphere of the build (rotation-independent → frames identically at any azimuth).
export function boundingSphere(bounds) -> { center: Vec3, radius: number }

// THE primitive: everything a renderer needs to place a comparable camera.
export function framedCamera(bounds, view = {}) ->
  { eye: Vec3, target: Vec3, up: Vec3, fov: number, distance: number, radius: number }
  //  merge view over DEFAULT_VIEW; sphere → distance d = R / sin(min(vHalf,hHalf)) · margin;
  //  dir = (cosφ·sinθ, sinφ, cosφ·cosθ); eye = center + dir·d; target = center; up = (0,1,0).

// Chunk-streaming radius (chunks of 16) that always covers the framed build.
export function viewDistanceFor(distance, radius, min = 4) -> number
  //  max(min, ceil((distance + radius) / 16) + 1)
```

Internal helpers (module-private): `deg2rad`, `mergeView(view)` (validates fov∈(0,180),
margin≥1, finite angles).

**Boundary:** knows nothing about THREE, GL, prismarine-viewer, or files. Input is
`bounds` (the T-003-02 shape `{min,max}`) + a plain `view` object; output is plain
numbers/`Vec3`. This is the seam that makes the invariant testable without a GPU.

## `render/src/render.mjs` (modify) — interface delta

Keep the existing wiring, teardown, and `DEFAULTS` (constant-offset fallback). Two
changes:

1. **`renderWorldToPng(world, center, opts)` — additive branch.** New optional
   `opts.bounds`. When present, derive the camera from `framedCamera(opts.bounds, opts.view)`
   and the stream radius from `viewDistanceFor(...)`, instead of `center + cameraOffset`
   and `DEFAULTS.viewDistance`. When absent, **behaviour is byte-for-byte the current
   path** (scaffold test unaffected). The camera-mutation sequence on `viewer.camera` is
   unchanged — only the values it is fed change. Still returns `Buffer`.

   Resolved options precedence: `opts.view` (per-call) over `DEFAULT_VIEW`; `opts.width/height`
   continue to size the canvas and feed `aspect`.

2. **`renderBuild(build, opts = {}) → Promise<{ path, bytes, view }>` — new export (AC #3).**
   - `build`: `{ world, bounds, center? }` (T-003-02 `BuildResult`; extra fields ignored).
   - Resolves `outPath` (default `render/out/build.png`, overridable via `opts.outPath`).
   - If `build.bounds` is non-null → calls `renderWorldToPng(build.world, target, { …opts,
     bounds: build.bounds })`, writes the file, returns `{ path: outPath, bytes:
     buffer.length, view: resolvedView }`.
   - If `build.bounds` is null (empty build) → falls back to the constant-offset path
     around `build.center ?? Vec3(0,0,0)`; still returns a path. Degrades, never throws on
     an empty build.
   - The `view` returned is the merged `DEFAULT_VIEW ⊕ opts.view` (plus the computed
     `distance`/`radius`) so a caller/record can log exactly how the build was framed.

   `renderBuild` writes via the same `mkdirSync`/`writeFileSync` already in `renderWorldToPng`
   (reuse, not re-implement: it calls `renderWorldToPng` with `outPath`, then returns the
   path it passed). Imports `framedCamera`, `viewDistanceFor`, `DEFAULT_VIEW` from
   `./camera.mjs`.

**Module boundary preserved:** `render.mjs` remains the only GL-bound file; all framing
*decisions* live in `camera.mjs`; GL *acquisition* stays in `headless-canvas.mjs`.

## `render/src/cli.mjs` (modify)

- After `buildSampleWorld()`, pass the sample's **known** bounds explicitly (it is a 5×5
  floor at `y=0` with toppers at `y=1` → `{ min:[-2,0,-2], max:[2,1,2] }`) to
  `renderBuild({ world, bounds, center })`.
- Log the returned `path` and `bytes`. Keep the `GL_AVAILABLE` guard and `process.exit(0)`.
- `world.mjs` is **not** modified — the bounds literal lives in the CLI, honoring the
  ticket-boundary (T-003-02 owns `world.mjs`).

## `render/test/view.test.mjs` (new)

Two tiers, mirroring `scaffold.test.mjs`'s pattern.

**Pure framing (always run, no GPU) — AC #2 core:**
- `framedCamera` points from the fixed direction: `eye - target` normalized equals
  `(cosφsinθ, sinφ, cosφcosθ)` for the default angles; independent of build size.
- **Comparability invariant:** a build scaled ×k yields `distance` and `radius` scaled ×k;
  the **angular radius** `asin(radius/distance)` is invariant across sizes (→ same
  on-screen fraction). Checked for k ∈ {1, 3, 10}.
- `target` equals the world-space box center (`(min+max+1)/2`).
- Larger fov ⇒ smaller `distance`; larger margin ⇒ larger `distance` (monotonic config).
- `viewDistanceFor` grows with build size and never drops below the floor.
- `boxOf(null)` / `framedCamera(null)` throw a clear error (caller must use the fallback).

**GL-gated render correctness (skips without GL) — AC #1, #4, and AC #2 empirically:**
- Render a **known** build via `renderBuild` → assert the returned `path` exists, the file
  is a valid PNG (signature) and non-trivial.
- **Comparable footprint:** build the *same shape/material* at two scales, render both,
  decode each PNG (via `canvas.loadImage` → 2D `getImageData`), count non-background pixels
  (pixels differing from the top-left corner = sky). Assert both occupy a **similar
  fraction** of the frame (within a tolerance band) and that the fraction is `>0` and
  `<1` (build is in-frame, not overflowing). This is the empirical proof of AC #2.
- Cleanup: render writes under a temp/`out/` path; no worker threads left running (the
  scaffold's teardown already guarantees this).

## Ordering of changes (commit boundaries)

1. `camera.mjs` + its pure tests in `view.test.mjs` — lands and verifies independently of GL.
2. `render.mjs` (`bounds` branch + `renderBuild`) — depends on (1).
3. GL-gated render-correctness test added to `view.test.mjs` — depends on (2).
4. `cli.mjs` switch + `README.md` update — documentation/demo, depends on (2).

Each step is independently committable; (1) and (3)'s pure parts are green without a GPU.

# T-003-03 — Design: fixed, comparable camera framing

Decide how the render half turns *any* in-memory build into a **comparable** scoring
image, and how it is called. Grounded in `research.md`: the scaffold already renders
headless to PNG; the gap is framing (a constant offset is not comparable across build
sizes) and the return contract (Buffer vs path). Out of scope: GL acquisition
(`headless-canvas.mjs`), world construction (`world.mjs`, T-003-02), the SDK tool
wrapper (T-003-04).

## The decision in one line

**Fit the build's bounding sphere into the frustum from a fixed viewing direction, at a
distance derived from the build's extent** — fixed *angle*, derived *distance* — exposed
as a small pure framing module plus a path-returning render entry point. The scaffold's
constant-offset path stays as a back-compatible fallback.

## What "comparable" forces

Two builds are comparable when, from the same viewing direction, each fills the **same
fraction of the frame**. With prismarine-viewer's `PerspectiveCamera` that means:

- **Fixed direction** (azimuth + elevation) — every build is photographed from the same
  vantage, so geometry and material differences are what vary, not the viewpoint.
- **Distance scaled to the bounding sphere** — a 30³ build and a 3³ build subtend the
  same angle, so both sit inside the frame with the same padding. A constant offset
  cannot do this (research.md): the big build overflows, the small one is a speck.

## Options considered

### A. Keep the constant offset, document it as "the fixed camera"
Fixed and configurable, trivially. **Rejected:** fails AC #2's *comparable across builds*
— framing depends on build size. Only correct for one build scale. It is, however, the
right *fallback* when a caller has no bounds (an empty/unknown build), so it is retained,
not deleted.

### B. Fit bounding sphere into the perspective frustum, fixed direction + derived distance — **CHOSEN**
Compute the build's world-space box `[min, max+1]` (the `+1` because a voxel at integer
`p` occupies the unit cube `[p, p+1]`), its center and bounding-sphere radius `R`. Place
the camera along a fixed unit direction at distance

```
d = R / sin( min(vFovHalf, hFovHalf) ) · margin
hFovHalf : tan(hFovHalf) = aspect · tan(vFovHalf)      (vFovHalf = fov/2, in radians)
```

`min(...)` picks the **narrower** of the vertical/horizontal half-angles, so the sphere
fits on *both* axes (binding constraint = larger distance). `margin > 1` adds uniform
padding. Look at the box center; up is `+Y`. **Why:** it is the conventional, low-risk
"frame an object" computation, it is exact for any build size, and it stays *perspective*
— matching prismarine-viewer's own camera and the mc-bench renders the approach is
borrowed from (spec §3.1). The math is pure (no THREE/GL), so the comparability invariant
is unit-testable on GL-less CI.

### C. Swap in an orthographic camera fitted to the box
Orthographic gives size-true, distortion-free framing — attractive for measurement.
**Rejected:** `prismarine-viewer`'s `Viewer` constructs and manages a `PerspectiveCamera`
(fov/aspect/`updateProjectionMatrix`, raycasting, chunk LOD); replacing the camera type
reaches into viewer internals the scaffold deliberately treats as a black box, for
marginal gain. Perspective-at-fitted-distance delivers comparability without fighting the
library. Revisit only if perspective foreshortening proves to hurt scoring — a Phase-2
question, not a blocker now.

### D. Multi-angle montage / turntable (N views per build)
Several angles (or a 4-up montage) per build would observe more of each structure.
**Rejected for this ticket:** AC #2 specifies *a* fixed camera producing comparable
framing — one canonical view. Multiple angles is additive scope (a caller looping the
parameterized view, or a later ticket), and it does not change the framing primitive this
ticket must land. The chosen API is parameterized by `(azimuth, elevation, …)` precisely
so additional angles cost a caller a loop, not a redesign. Keep one canonical default.

### E. Inline the math in `render.mjs` vs a separate pure module
**Chosen: separate `camera.mjs`.** The framing is pure arithmetic over numbers; isolating
it from the GL-bound `render.mjs` lets the **comparability invariant be unit-tested
without a GPU** (research.md: GL is optional on CI, `three@0.128.0` is WebGL1-only). It
also gives T-003-04 and future angle-sweeps a dependency-light import.

## Chosen design — detail

### `camera.mjs` (new, pure — no THREE, no GL)
- `DEFAULT_VIEW = { width: 512, height: 512, fov: 75, azimuthDeg: 45, elevationDeg: 35, margin: 1.18 }`.
  - `azimuth 45° / elevation 35°` reproduces the scaffold's established 3/4 vantage
    (`offset (7,8,7)` ≈ 45°/39°) as a clean, fixed default — continuity with the proven
    sample, and a recognizable isometric-ish read. `margin 1.18` ≈ 18% padding.
- `boxOf(bounds) → { lo:[x,y,z], hi:[x,y,z] }` — world-space box, `hi = max + 1`.
- `boundingSphere(bounds) → { center: Vec3, radius }` — center = midpoint of `[lo,hi]`,
  radius = half the space diagonal. (`radius` from the **sphere**, not per-axis, so the
  fit is rotation-independent — the same build frames identically at any azimuth.)
- `framedCamera(bounds, view?) → { eye: Vec3, target: Vec3, up: Vec3, fov, distance, radius }`
  — the whole framing in one pure call. `view` is `Partial<DEFAULT_VIEW>` merged over the
  defaults. Direction unit vector `dir = (cosφ·sinθ, sinφ, cosφ·cosθ)`, `eye = center +
  dir·d`. Returns `radius`/`distance` so the renderer can size `viewDistance`.
- `viewDistanceFor(distance, radius) → chunks` — `max(DEFAULTS.viewDistance, ceil((distance
  + radius)/16) + 1)` so the chunk-streaming radius always covers the framed build (else
  far voxels never mesh before the snapshot — research.md).

**Comparability invariant (the unit-test target):** for the same `view`, scaling a build
uniformly by `k` scales `radius` and `distance` by `k`, leaving the build's angular size
— and therefore its on-screen footprint — **invariant**. `eye - center` keeps a fixed
direction. These are checkable on numbers alone.

### `render.mjs` (refine — the file the scaffold left for me)
- Extend `renderWorldToPng(world, center, opts)`: if `opts.bounds` (or `opts.view.bounds`)
  is given, derive `eye`/`target`/`fov`/`viewDistance` via `camera.mjs`; otherwise fall
  back to the existing `cameraOffset` path **unchanged** (keeps `scaffold.test.mjs` green
  and serves bounds-less callers). Still returns the PNG `Buffer`.
- Add `renderBuild(build, opts) → Promise<{ path, bytes, view }>` — the AC #3 entry point.
  `build` is the T-003-02 `BuildResult` shape `{ world, bounds, center? }`. It computes
  framing from `build.bounds`, renders, **writes the PNG and returns its path** (plus the
  byte count and the resolved `view` for the record). `outPath` defaults to a stable
  location under `render/out/`. This is the small, named surface T-003-04 will wrap.

### `cli.mjs` (small switch)
Point `npm run render:sample` at `renderBuild` using the sample's known bounds, so the
human-runnable artifact demonstrates the *comparable* framing (not just the scaffold
offset). `world.mjs` is **not** touched — the sample's bounds are passed explicitly.

## What this design explicitly does not do

- No orthographic mode, no montage/turntable, no thumbnail pyramid (D/C above).
- No change to GL acquisition, world construction, or the version pin.
- No new runtime dependency — only `vec3` (already present) and arithmetic.

## Risks & mitigations

- **`viewer.camera` ignores a set field.** Mitigated: keep using the exact camera-mutation
  sequence the scaffold proved (`position.set`, `fov`, `aspect`, `updateProjectionMatrix`,
  `lookAt`) — only the *values* come from `camera.mjs`.
- **Larger builds need more chunks meshed.** Mitigated by `viewDistanceFor`.
- **Empty build (`bounds === null`).** `renderBuild` falls back to the constant-offset
  path around `center ?? origin`, so it degrades instead of throwing.
- **Block-size off-by-one.** Mitigated by the `hi = max + 1` world-space box; verified by
  the "build fills a comparable frame fraction" GL test (`view.test.mjs`).

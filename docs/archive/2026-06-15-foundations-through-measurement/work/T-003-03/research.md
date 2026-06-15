# T-003-03 — Research: headless-render (fixed, comparable views)

Epic E-02, spec §3 (observation). Map the render half of the instrument as it exists
**today**, the seams T-003-03 plugs into, and the constraints the framing decision
must respect. Descriptive only — options and choices are deferred to `design.md`.

## What the ticket asks for

Render a constructed in-memory world to a PNG via prismarine-viewer headless (no
server), from a **fixed, configurable camera, so renders are comparable across trials
and archetypes**. Four ACs:

1. prismarine-viewer renders an in-memory world to a PNG headless (no server).
2. Camera position/angle is **fixed and configurable**, producing **comparable framing
   across builds**.
3. Rendering is callable programmatically and **returns the image path**.
4. A rendered image of a known in-memory build is **visually correct**.

Crucially: "Renders whatever world it is given, so it depends only on the render
scaffold (T-003-01)." T-003-03 is the *render half* — camera/framing/output — and is
artifact-agnostic. It does **not** depend on T-003-02 (artifact→world expansion),
though it consumes T-003-02's output shape as its natural input (see seam below).

## What already exists (T-003-01, done; T-003-02, landed)

The `render/` sub-module is a self-contained package (own `package.json`, lockfile,
`node_modules`) — file footprint disjoint from concurrent tickets by construction.

| File | Today's responsibility | Relevance to T-003-03 |
| --- | --- | --- |
| `render/src/version.mjs` | the `1.20.4` pin, `minecraft-data`/`minecraft-assets` handles, `blockStateId()` | read-only; the render path calls `setVersion` with `MINECRAFT_VERSION` |
| `render/src/world.mjs` | `createEmptyWorld`, `setBlock`, `buildWorldFromVoxels`, `buildWorldFromArtifact`, `buildSampleWorld` | **owned by T-003-02 — do not modify.** Its `BuildResult` is my input shape |
| `render/src/headless-canvas.mjs` | the swappable WebGL seam (`createHeadlessCanvas`, `GL_AVAILABLE`, `GL_LOAD_ERROR`) | read-only; framing never touches GL acquisition |
| `render/src/render.mjs` | `renderWorldToPng(world, center, opts?)` + the fixed render contract `DEFAULTS` | **the file I refine** — it explicitly defers view angles to T-003-03 |
| `render/src/cli.mjs` | `npm run render:sample` demonstrable entrypoint | candidate to switch onto the framed API |
| `render/test/scaffold.test.mjs` | T-003-01's verification suite | must stay green; calls `renderWorldToPng(world, center)` with no bounds |
| `render/test/world-build.test.mjs` | T-003-02's suite | unrelated; consumes `world.mjs` |

### The current render contract (render.mjs)

`renderWorldToPng(world, center, opts={})`:
- `DEFAULTS = { width:512, height:512, viewDistance:4, fov:75, cameraOffset: Vec3(7,8,7) }`.
- Camera is placed at `center + cameraOffset` (a **constant absolute offset**), looks at
  `center`, `fov=75`, `aspect=w/h`. Returns the **PNG Buffer** (writes to `opts.outPath`
  if given).
- Wiring (mirrors `prismarine-viewer/lib/headless.js`): sets `globalThis.THREE`/`Worker`,
  builds `Viewer(renderer)` over a headless canvas, `setVersion(MINECRAFT_VERSION)`,
  streams the world via `WorldView(world, viewDistance, center)` → `viewer.listen` →
  `await worldView.init(center)`, positions the camera, `waitForChunksToRender()`,
  `renderer.render(...)`, reads back a PNG via `getBufferFromStream(canvas.createPNGStream())`.
- Teardown is already correct: terminates mesh worker threads, best-effort
  `renderer.dispose()` (wrapped — headless has no `cancelAnimationFrame`), destroys the GL
  context. A single call leaves nothing running (matters for `node --test`).

The header comment of `render.mjs` is explicit: *"T-003-03 refines the actual view
angles; the scaffold's job is to establish the contract and prove it round-trips."* The
scaffold deliberately left the framing primitive.

### The world seam (T-003-02, committed `874b773`/`2b02523`)

`buildWorldFromVoxels`/`buildWorldFromArtifact` return a `BuildResult`:

```
{ world, center: Vec3, bounds: { min:[x,y,z], max:[x,y,z] } | null, placed, unmapped }
```

- `bounds` is the **integer voxel bounding box** over placed voxels (`boundsExtend`);
  `null` when nothing was placed.
- `center` is the **rounded midpoint** of `bounds` as a `Vec3` (origin when empty).

This is exactly the metadata a comparable camera needs: a build's extent and middle.
T-003-03's render API should consume `{ world, bounds, center }` so it never re-decides
the pin, never re-walks the world, and stays a clean *populate-world ↔ render-world* seam.

## The core problem: "comparable framing" vs a constant offset

The scaffold's `cameraOffset` is an **absolute** vantage — good enough to prove the pipe,
but **not comparable across builds of different sizes**:

- A 5×5×2 sample sits nicely at offset `(7,8,7)`.
- A 30×30×20 archetype build at the same offset **overflows the frame** (camera is
  *inside* the build); a 1×1 build is a speck.

Comparability (E-02: "deterministic, comparable renders"; spec §3: scoring images that
diff across prompting methods and archetypes) requires that **every build occupies the
same fraction of the frame from the same viewing direction**. That is a *fit-to-extent*
camera, not a constant offset: fixed **direction**, distance **derived from the bounding
box**. This is the gap T-003-03 closes. The scaffold's constant-offset path must remain
as a back-compatible fallback (scaffold test depends on it).

## Constraints & assumptions surfaced

- **THREE single-instance constraint.** Camera positioning must go through the same
  `viewer.camera` (a `three@0.128.0` `PerspectiveCamera`) the scaffold already uses; the
  framing math itself should be **pure** (no THREE/GL import) so it is unit-testable
  without a GPU — the dependency `three@0.128.0` is WebGL1-only and GL may be absent on CI.
- **GL-optional environments.** `GL_AVAILABLE` gates real rendering. Any new
  render-correctness test must `t.skip` when GL is unavailable, exactly as
  `scaffold.test.mjs` does, so `npm test` stays green on GL-less CI. The *framing math*
  has no such gate and must be tested unconditionally.
- **Perspective, not orthographic.** prismarine-viewer's `Viewer.camera` is a
  `PerspectiveCamera`. Comparable apparent size therefore means fitting the build's
  **bounding sphere** into the frustum at a derived distance — `aspect` matters because
  the horizontal fov differs from the vertical when `width≠height`.
- **Sub-zero sections don't mesh.** `world.mjs` notes prismarine-viewer's mesher does not
  render sections below `y=0` for this version. Framing must not assume builds are
  centered on the origin, but builds are expected to live at `y≥0` (the sample does).
- **Determinism.** Same build + same view params ⇒ identical eye/target ⇒ identical
  pixels. No clock/random in the framing path (mirrors the codebase rule that bans
  `Date.now()`/`Math.random()` from deterministic seams).
- **Return shape.** AC #3 wants the **image path** returned. The scaffold returns a
  Buffer. T-003-03 adds a path-returning programmatic entry point; keeping the Buffer
  return available (scaffold test, in-memory callers like a future Agent SDK tool,
  T-003-04) is desirable.
- **`viewDistance`.** The chunk-streaming radius (`WorldView`, in chunks of 16) must be
  large enough to cover the framed build, or far voxels won't be meshed before the
  snapshot. For larger builds the derived camera sits further out — `viewDistance` may
  need to scale with build extent.

## Open seams T-003-03 must not disturb

- `world.mjs` (T-003-02), `version.mjs`, `headless-canvas.mjs` are **read-only** here.
- T-003-04 (Agent SDK render tool) will *wrap* whatever entry points T-003-03 exposes —
  so the public render API should be small, named, and return both bytes and a path.

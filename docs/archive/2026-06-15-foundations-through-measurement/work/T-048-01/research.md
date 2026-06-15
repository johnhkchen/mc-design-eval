# T-048-01 — Research: GLB Silhouette Rasterizer

## Ticket in one line

Build a **pure, GL-free software rasterizer** that projects a TRELLIS GLB mesh to a 2-D
**binary silhouette mask** — whole-object and per-region — from the same camera the build
render uses, so the E-15 surgical loop can hill-climb against a real 3-D form target instead
of a flat concept PNG.

## What exists today (the map)

### The form-target seam (the consumer)
`src/form/form-target.mjs` is the documented adapter point. The loop's accept gate consults
**only** `scoreRender(renderPath, R) => Promise<number>`; the target object also carries a
`kind` string for provenance. Two facts matter for this ticket:

- `glbFormTarget(opts)` (lines 89–96) currently **throws `FormTargetNotImplementedError`**.
  Its docblock spells out the eventual contract verbatim: "render the GLB mesh from `view`,
  masked to R's projected bounds → target silhouette; extract the build render's silhouette
  (same metric pipeline as today); return iou(targetSilhouette, buildSilhouette)."
- `resolveFormTarget(cfg)` (lines 108–117) returns `cfg.formTarget` as-is if present. So a
  GLB target is a pure pass-through once it implements `scoreRender`. **This ticket does NOT
  wire `glbFormTarget` into the loop** — that is T-049-01 (story S-049). T-048-01 produces the
  *rasterizer primitive* the GLB target will call.

### The silhouette metric (the downstream math, already built)
`src/form/form-fidelity.mjs` (T-043-01) is the existing silhouette IoU engine. Critical
reusable shapes:

- `extractSilhouette(img, bgOpts)` returns `{ w, h, data: Uint8Array, fgCount, bbox }` — a
  binary mask. **My rasterizer must emit this exact shape** so its output drops straight into
  `normalizeSilhouette` → `iou` / `regionIoU` with zero glue.
- `normalizeSilhouette(mask, {grid, fit})` bbox-crops + resamples to a common `G×G` grid
  (translation + scale invariant; `fit:'aspect'` preserves proportion). This is why the GLB's
  absolute world scale/position relative to the build does **not** need to match — normalization
  washes out translation and uniform scale; only **projected shape/proportion** and **viewing
  direction** survive into the IoU.
- `iou(a,b)` / `regionIoU(a,b,region)` operate on identical-dimension `G×G` masks; `regionIoU`
  takes a **normalized 2-D** `{x0,y0,x1,y1}` rect. The "per-region" notion here is a 2-D rect on
  the normalized grid — the GLB's value-add is a *3-D* region whose projected bounds define that
  rect honestly.

### The camera (the framing the rasterizer must match)
`render/src/camera.mjs` — pure math, no THREE, no GL. The seam the ticket names:

- `boxOf(bounds)` — world box for integer voxel bounds; models a voxel at `p` as `[p, p+1]`,
  so `hi = max + 1`. **GLB vertices are continuous floats**, so to reuse this for a mesh AABB I
  pass `max' = max - 1` and `boxOf`'s `+1` reconstructs the true continuous `hi`.
- `boundingSphere(bounds)` — center + half-space-diagonal radius (rotation-independent fit).
- `framedCamera(bounds, view)` returns `{ eye: Vec3, target: Vec3, up: Vec3, fov, distance,
  radius }`. Fixed azimuth/elevation direction; distance derived so the bounding sphere fits the
  frustum on the binding axis. `up = (0,1,0)`, `fov` is **vertical** degrees.

### How the build render uses that camera (the convention to replicate)
`render/src/render.mjs` (`renderWorldToPng`, lines 100–109) feeds `framedCamera` numbers to
prismarine-viewer's THREE `PerspectiveCamera`:
```
viewer.camera.position.set(eye)        // eye
viewer.camera.fov = fov                // vertical FOV, degrees
viewer.camera.aspect = width/height
viewer.camera.updateProjectionMatrix()
viewer.camera.lookAt(target)           // up defaults to +Y
```
So to match the render's projection GL-free I replicate **gluLookAt + a vertical-FOV perspective**:
camera looks down its local `-Z`, NDC `x = (f/aspect)·xc/(-zc)`, `y = f·yc/(-zc)`, `f =
1/tan(fovY/2)`; screen `px = (ndc.x·0.5+0.5)·W`, `py = (0.5 − ndc.y·0.5)·H` (Y flips down).

### The view contract for sculptures
`src/sculpture.mjs` exports `SCULPTURE_VIEW_3Q = { azimuthDeg: 45, elevationDeg: 30, fov: 45 }`
— a partial over `DEFAULT_VIEW`. This is the view the AC names; the rasterizer must accept a
view partial and default to it.

### The GLB parse precedent
`benchmarks/sculpture/trellis-glb.mjs` `inspectGlb(buf)` reads only the 12-byte glTF header
(magic `0x46546c67` "glTF", version, length) — it does **not** parse geometry. There is no
existing GLB *geometry* parser in the repo; I build one. glTF/GLB facts that govern it:
- GLB = 12-byte header + chunks. Chunk = `u32 length`, `u32 type`, payload. Type `JSON`
  (`0x4E4F534A`) holds the glTF JSON; type `BIN` (`0x004E4942`) holds the binary buffer.
- Geometry lives in `meshes[].primitives[]`: `attributes.POSITION` (accessor → `VEC3`/`FLOAT`
  5126) and optional `indices` (accessor → `SCALAR`, componentType `5121` UBYTE / `5123` USHORT
  / `5125` UINT). No `indices` ⇒ sequential triangles. Accessors → `bufferViews` (byteOffset,
  byteStride) → the BIN buffer.
- Nodes carry transforms (`matrix`, or `translation`/`rotation`/`scale`). TRELLIS output is
  often Y-up with a node rotation; **ignoring node transforms can rotate the koi 90°**, so the
  loader composes world matrices down the scene graph and applies them to positions.

### The real assets
`benchmarks/sculpture/glb/{koi,heart}.glb` exist (4.9 MB / 5.4 MB), **gitignored**
(`.gitignore:24` `benchmarks/sculpture/glb/*.glb`), regenerable via `trellis-glb.mjs`. Geometry
profile (from prior session memory): ~95–106K verts, ~144K tris, 2 images, 1 material. AC #3
renders `koi.glb` to a sanity PNG; that PNG output must land under the gitignored glb run area.

## Conventions & constraints

- **ESM `.mjs`, Node 22** (`v22.22.0` installed; project targets Node 20+). Tests use
  `node:test` + `node:assert/strict`; the glob is `src/**/*.test.mjs` (`npm run test:unit`).
  `npm test` runs AJV self-tests + the unit glob.
- **Purity discipline** (see `form-fidelity.mjs` header): the pure core takes already-decoded
  buffers / in-memory structures; the one I/O shell (file read, PNG decode) is isolated. I
  mirror this — the rasterizer core takes a parsed mesh + view and returns a mask; GLB **file**
  read and PNG **write** live in an `import.meta`-guarded CLI block (the `trellis-glb.mjs`
  pattern), lazy-importing `node:fs` / `pngjs` so importing the module for tests stays I/O-free.
- **Determinism**: no `Date.now()`/`Math.random()`. Round/sort where ties could jitter. The
  metric "cannot tolerate jitter" (form-fidelity header) — same mesh + view ⇒ byte-identical mask.
- **Offline tests**: AC #2 forbids the 5 MB GLB in unit tests. I synthesize a **unit cube** in
  memory (and a tiny hand-built GLB buffer) so the suite is self-contained.
- **Deps available**: `pngjs` (devDep, used by `decodeImage`) for PNG write in the CLI; `vec3`
  (transitively, used by camera.mjs). No new dependency is needed; mat4 math is hand-rolled
  (small, pure, deterministic).

## Boundaries (what this ticket is and isn't)

- **Is**: a pure module `src/form/glb-silhouette.mjs` — GLB geometry parse, node-transform
  bake, camera-matched projection, triangle-fill into a binary mask (whole + per-3-D-region);
  unit tests on a synthetic cube; one real koi sanity PNG.
- **Isn't**: wiring `glbFormTarget` into the loop (T-049-01), voxelization/occupancy (T-050-01),
  any model/network call, backface culling (a silhouette is the union of all faces), or a depth
  buffer (silhouette needs none).

## Open questions / assumptions surfaced

1. **Match fidelity to THREE**: exact NDC depth mapping is irrelevant for a silhouette; only the
   x/y projection and viewing direction matter, and normalization tolerates small absolute
   offsets. Assumption: gluLookAt + vertical-FOV perspective is a faithful-enough match. Validate
   visually via AC #3.
2. **Mesh framing**: a GLB is framed by its **own** AABB-derived sphere (via the `max-1` adapter
   into `framedCamera`), not the build's bounds — the two live in different coordinate spaces and
   normalization reconciles them.
3. **No backface cull**: triangle fill uses a winding-agnostic inside test so front and back
   faces both paint — the union is exactly the silhouette.

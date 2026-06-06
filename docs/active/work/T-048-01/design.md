# T-048-01 — Design: GLB Silhouette Rasterizer

## Goal restated as decisions to make

A pure module that, given GLB bytes + a view, yields a binary silhouette mask shaped exactly
like `extractSilhouette`'s output. The design questions: (1) how to parse GLB geometry, (2) how
to match the build's camera GL-free, (3) how to rasterize triangles into a mask, (4) how to do
"per-region", (5) where the I/O lives, (6) how to test it offline.

---

## D1 — GLB geometry parse

**Options.**
- **(a) Add a glТF library** (`@gltf-transform/core`, `gltf-loader-ts`). Rejected: a new
  dependency for a parse we fully control; most loaders assume a browser/THREE; pulls weight onto
  the hot path that the project deliberately keeps thin (CLAUDE.md: "no Python on the hot path",
  minimal deps).
- **(b) Hand-roll a minimal binary-glTF reader** that walks `meshes→primitives→accessors→
  bufferViews→BIN`, supports `POSITION` (VEC3/FLOAT) and the three index component types, and
  bakes node-hierarchy transforms. **Chosen.** Precedent exists (`trellis-glb.mjs inspectGlb`
  already DataView-parses the GLB header); the surface we need is small and fully specified by
  the glTF 2.0 core spec; it stays dependency-free and pure.

**Decision.** Hand-rolled reader, scoped to exactly what TRELLIS emits (single buffer in the BIN
chunk, triangle primitives, float positions). It **throws** on anything outside that scope
(external `.bin` URIs, non-triangle modes, missing POSITION) rather than silently dropping
geometry — a faithless partial mesh would corrupt the very signal the loop reads (mirrors
`render.mjs`'s "refuse rather than emit a faithless image").

**Node transforms.** Compose each node's local matrix (`node.matrix` if present, else TRS from
`translation`/`rotation`(quat)/`scale`) down the scene graph; apply the world matrix to that
node's mesh positions while baking. This is non-optional: TRELLIS GLBs commonly carry a root
rotation, and skipping it would project a rotated koi (AC #3 would fail the eyeball test).

---

## D2 — Camera, GL-free, matched to the build render

**Constraint.** `render.mjs` drives a THREE `PerspectiveCamera` with `framedCamera`'s
`eye/target/up/fov` + `aspect = w/h`, `lookAt(target)`. I must reproduce **that** projection.

**Options for framing the mesh.**
- **(a) Frame against the build's bounds.** Rejected: the GLB and the voxel build live in
  different coordinate spaces/scales; there is no shared origin. Normalization in
  `form-fidelity` already removes translation + uniform scale, so absolute framing is moot — only
  direction + perspective foreshortening + proportion matter.
- **(b) Frame against the mesh's own AABB.** **Chosen.** Compute the mesh float AABB, derive its
  bounding sphere, and let `framedCamera` place the eye at the fixed `SCULPTURE_VIEW_3Q`
  direction with the fitted distance. Reuses the exact camera math the ticket names.

**Reusing `framedCamera` for a continuous box.** `framedCamera`→`boxOf` adds `+1` per axis
(voxel-cube model). I feed it `{ min, max: max.map(v => v − 1) }` so `boxOf` reconstructs the
true continuous `hi = max`. One small, documented adapter (`cameraForMeshBounds`) keeps the
reuse honest instead of forking the camera math.

**Projection math (chosen formulation).** gluLookAt view matrix (camera `+Z = normalize(eye −
target)`, `X = normalize(up × Z)`, `Y = Z × X`) → camera-space point `pc`. Perspective with
`f = 1/tan(fovY/2)`: `ndcx = (f/aspect)·pc.x/(−pc.z)`, `ndcy = f·pc.y/(−pc.z)`, visible iff
`−pc.z > 0`. Screen `px = (ndcx·0.5+0.5)·W`, `py = (0.5 − ndcy·0.5)·H`. Depth (z→NDC) is **not
computed** — a silhouette needs no z. Points with `−pc.z ≤ 0` (behind camera) are dropped per
triangle; a properly framed object has none.

---

## D3 — Triangle rasterization into a binary mask

**Options.**
- **(a) Scanline polygon fill.** More code, edge-table bookkeeping.
- **(b) Edge-function (half-space) fill over each triangle's screen bbox.** **Chosen** —
  branch-simple, deterministic, the standard software-raster core. For each triangle: project 3
  verts, compute the integer screen bbox (clamped to frame), and for each pixel **center** test
  the three edge functions.

**No backface culling — winding-agnostic inside test.** A silhouette is the union of *all*
faces (front and back). So a pixel is inside iff the three edge functions are **all ≥ −ε OR all
≤ ε** (either winding). A tiny `ε` on shared edges prevents seam gaps (no anti-aliasing — this is
a binary mask; coverage is decided at the pixel center, matching `extractSilhouette`'s
hard-threshold spirit). Mask cells are **OR-accumulated** (set to 1) across all triangles — a
union, never a count, so overlapping triangles cost nothing and order is irrelevant
(determinism).

**Degenerate triangles** (zero screen area) are skipped.

---

## D4 — Per-region masking (the 3-D value-add)

The AC: per-region mask = the silhouette **masked to a region's projected 3-D bbox**. Region is
a **3-D** AABB `{min:[x,y,z], max:[x,y,z]}` in mesh world coords (this is what makes the GLB
honest where the flat concept could only offer a 2-D rect).

**Chosen approach.** Project the region's **8 corners**, take the 2-D bbox of the projected
(in-front) corners → an axis-aligned screen rectangle. The per-region silhouette is the
whole-object rasterization **AND** that rectangle (cells outside the rect zeroed). This is
exactly "masked to the projected bounds." It is intentionally a *rectangle* clip, not a
per-triangle region-membership test: the downstream metric already reasons in 2-D rects
(`regionIoU` takes a normalized rect), and the rectangle is the faithful 2-D footprint of the
3-D box. Returned in the same mask shape; its `bbox`/`fgCount` recomputed over the clipped data.

Rejected alternative — *assign triangles to the region by centroid-in-box and rasterize only
those*: more faithful to "region geometry" but (i) double-counts boundary triangles ambiguously
and (ii) diverges from the 2-D-rect contract the metric consumes. The projected-bbox clip is the
contract the seam docblock in `form-target.mjs` already names ("masked to R's projected bounds").

---

## D5 — I/O isolation & the public surface

Mirror `form-fidelity.mjs`'s purity ledger and `trellis-glb.mjs`'s CLI pattern:

- **Pure core (no fs, no GL, no network):**
  - `parseGlb(bytes)` → `{ json, bin }`
  - `loadMeshFromGlb(bytes)` → `{ positions: Float64Array, indices: Uint32Array, bounds:{min,max} }`
    (node transforms baked, all primitives merged)
  - `projectPoint(p, cam, w, h)` and the mat4/vec helpers
  - `rasterizeSilhouette(mesh, { view, width, height, region? })` → `{ w, h, data, fgCount, bbox }`
    (the `extractSilhouette`-compatible shape)
  - `cameraForMeshBounds(bounds, view)` (the `framedCamera` adapter)
  - constants: `GLB_SILHOUETTE_SCHEMA`, default size.
- **I/O shell (`import.meta`-guarded CLI):** reads a `.glb` from `argv`, lazy-imports `node:fs`
  + `pngjs`, calls the pure core, writes the mask as a black-on-white PNG under the glb run area.
  Never runs on import ⇒ unit tests never touch fs/pngjs/the 5 MB asset.

**Why a mask shape matching `extractSilhouette`.** It lets T-049-01 feed the GLB silhouette into
the *identical* `normalizeSilhouette → iou/regionIoU` path the concept target uses — the seam's
whole promise ("swapping concept→GLB changes only which silhouette the metric compares against").

---

## D6 — Test strategy (offline, deterministic)

- **Synthetic unit cube** built in memory (`positions`/`indices`/`bounds`), projected from a
  known view: assert the silhouette is non-empty, **connected/filled** (no interior holes), its
  bbox sits inside the frame, and its area is within sane bounds for a cube at that distance.
  A view straight down an axis (azimuth 0, elevation 0) yields a **square** silhouette — exact,
  checkable proportion (aspect ≈ 1).
- **Determinism**: rasterize twice → byte-identical `data`.
- **Per-region**: a region covering half the cube's x-extent restricts the mask to ~that half
  (fgCount strictly less than whole; bbox’s right edge clipped). A region off the object → empty.
- **Tiny hand-built GLB**: encode the cube into a minimal valid `.glb` buffer in the test and
  round-trip it through `parseGlb`/`loadMeshFromGlb` → same triangle count, AABB matches. Proves
  the binary parser without the 5 MB asset.
- **Behind-camera guard**: a point/triangle behind the eye is dropped, not NaN-projected.

AC #3 (the real koi PNG) is produced by the CLI runner outside the unit suite and eyeballed; it
is a manual sanity gate, not an automated assertion (keeps the suite offline per AC #2).

---

## Decision summary

| Question | Decision |
|---|---|
| GLB parse | Hand-rolled minimal binary-glTF reader; throws outside TRELLIS scope |
| Node transforms | Baked down the scene graph (Y-up rotations matter) |
| Camera | Reuse `framedCamera` on the mesh's own AABB via a `max−1` adapter |
| Projection | gluLookAt + vertical-FOV perspective; no depth buffer |
| Fill | Edge-function, winding-agnostic (no backface cull), OR-union |
| Per-region | Clip whole mask to the region 3-D bbox's projected 2-D rect |
| I/O | Pure core; `import.meta`-guarded CLI does fs + pngjs (lazy) |
| Tests | Synthetic cube + tiny in-memory GLB; offline, deterministic |

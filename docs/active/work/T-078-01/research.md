# Research — T-078-01 view-layer-and-structural-read

Epic **E-23** / Story **S-078**. The substrate the two downstream paths (spray-paint S-079,
hollow/floorplan S-080/S-081), the surface-coherence story (S-084), and the model-routing seam
(S-082) all stand on. The lesson driving it: raw 3-D voxel editing does not fit the LLM — the E-15
surgical loop overflowed context at 57k blocks (`[[surgical-edit-path-scale-limit]]`), and the
cottage face failed because 3-D feature space has **no storey axis**. The fix is to hand the LLM a
**view**: a task-matched 2-D projection + a small geometric structural read, not 57k voxels
(`[[twodee-interaction-sector]]`).

This file is descriptive: what exists, where, how it connects. No solutions.

## The voxel/occupancy substrate (what a build IS, in memory)

- **`src/expand.mjs`** — the canonical expansion. `expandArtifact(artifact)` → a deduped, canonical
  `(y,z,x)`-ordered array of `{ pos:[x,y,z], block, state? }`. `voxelKey(pos)` → `"x,y,z"` is the
  dedup/identity key used everywhere. Placements (`voxel`/`line`/`box`/`fill`) are integer geometry;
  last-write-wins. **Pure** — no I/O, no GL. This is the one true "artifact → voxels" reader; never
  reimplement it.
- **`src/form/glb-voxelize.mjs`** — the occupancy convention already in the repo:
  `{ scale, voxelSize, dims:[nx,ny,nz], bounds:{min,max}, occupied:Int32Array, count }`, where
  `occupied` is a flat `[i,j,k,...]` triple list, and `occupiedCells(occ)` yields `[i,j,k]`. Pure
  geometry. The structural read should mirror this *shape vocabulary* (dims, bounds, occupied cells)
  so downstream code reads one idiom.
- **`render/src/world.mjs`** — `buildWorldFromArtifact` → `expandArtifact` → `buildWorldFromVoxels`
  → a `prismarine-world`. `BuildResult = { world, center, bounds:{min,max}|null, placed, unmapped }`.
  `bounds` is the integer voxel AABB (min/max inclusive). This is the bridge from artifact to GL.
- **`render/src/version.mjs`** — `blockStateId(name,state)`, `mcData()`. Block names are
  `minecraft:`-prefixed in artifacts; bare or prefixed both resolve. Not needed for the pure cores,
  but the live render uses it transitively.

## The render lens (reading any angle)

- **`render/src/render.mjs`** — `renderWorldToPng(world, center, opts)` and `renderBuild(build,opts)`.
  The **E-22 fixed lens**: `DEFAULTS.supersample = 3` (SSAA 1536²→512²) kills the texture-minification
  grey static (`[[render-aliasing-not-material-speckle]]`). `opts.view` is a partial over `DEFAULT_VIEW`.
- **`render/src/camera.mjs`** — the pure framing math. `framedCamera(bounds, view)` →
  `{ eye, target, up, fov, distance, radius }`. `DEFAULT_VIEW = { width, height, fov:75,
  azimuthDeg:45, elevationDeg:35, margin:1.18 }`. `boxOf(bounds)` models a voxel at `p` as occupying
  `[p, p+1]` (so `hi = max+1`). `boundingSphere` makes the fit rotation-independent → the SAME build
  frames identically from any azimuth. **This is the angle knob**: `view.azimuthDeg` / `elevationDeg`.
- **`render/src/render-tool.mjs`** — `renderArtifact(artifact, { outPath, view, supersample, strict })`
  → `{ path, bytes, placed, unmapped, bounds, view }`. Fresh world per call (stateless). This is the
  one-call "artifact → PNG at a chosen view". GL is **available** in this environment (`GL_AVAILABLE
  true`), so a live cottage render is feasible.
- **`src/building.mjs`** — `BUILDING_VIEW_3Q = { azimuthDeg:45, elevationDeg:30, fov:45 }` (the canon
  3/4 still) and `BUILDING_TURNTABLE` (front-arc rock). The resemblance benchmarks render at
  `BUILDING_VIEW_3Q`. `BUILDING_SCALE_*`, `assertBuildingSpec`, `buildingScaleCaps` are pure.

## The projection math that already exists (reuse, don't fork)

- **`src/form/glb-silhouette.mjs`** — the GL-free projector. It frames a mesh AABB with the *build's*
  camera (`cameraForMeshBounds` adapts the continuous `[min,max]` box to `framedCamera`'s `[min,max+1]`
  voxel convention by passing `max-1`), builds a right-handed `viewBasis(cam)`, and projects points
  with `projectVertex`/`projectPoint` (gluLookAt + vertical-FOV perspective, `w=-z_cam`). It
  rasterizes triangles into a binary silhouette mask matching `form-fidelity`'s `extractSilhouette`
  shape `{w,h,data,fgCount,bbox}`. **Honesty ledger** documented inline: single 3/4 view, camera match
  up to normalization, no backface cull, silhouette ≠ form.
  - Relevance: this is *perspective* projection of triangles for IoU. The ticket's **2.5-D surface
    grid** needs the front-most *voxel* along a ray **+ depth + normal**, and an **unambiguous
    back-projection** — which is only clean for **orthographic, lattice-aligned** ortho/45° views
    (the AC explicitly scopes paint-back to ortho/45° and rules arbitrary-oblique paint-back out).
    So the surface grid is a *new, pure, lattice* projector, distinct from this perspective triangle
    rasterizer; the camera/`viewBasis` math here is the reference for the *reading* (GL) path.

## The image→grid quantizer (the same-angle reference target)

- **`src/color/image-grid.mjs`** — `gridFromImage(path, opts)` / `gridFromPixels(img, opts)`:
  decode → area-downsample to N×M cells → per-cell foreground mean → `nearestLab` to a real block.
  `GRID_DEFAULTS.n = 48` (grid width), `coverageThreshold`, background drop. Returns
  `{ grid:[[blockId|null]], n, m, legend, blockCounts, meanDeltaE, ... }`. `gridDims(w,h,n)` →
  `{n, m=round(n·H/W)}`. `whitelist` switches discover→validate (snap within a manifest).
  `comparePalettes`, `renderGridSwatch` (cell→swatch). **This is exactly the AC's "grid-quantize the
  textured GLB at the same angle to the face's cell grid"**: render the reference at the face's view,
  pass `n = face grid width` (+ a manifest whitelist) → a cell-aligned material target.
  Memory `[[voxel-palette-must-be-design-doc]]`: snap within the design-doc manifest, not the full
  305 table — pass the artifact's `palette.manifest` as `whitelist`.

## The downstream consumers (what the substrate must expose)

- **S-079 spray-paint** (`[[twodee-interaction-sector]]`): needs the 2.5-D projected face grid (front
  voxel + depth + normal) as the paint canvas, and the **storey band** primitive (the plaster band).
  The front-face POC already proved back-projection works: project front along −Z, paint band y7–15
  stone→plaster, back-project landed 171 in-band cells, 0 outside, studs preserved, white_terracotta
  8→179 (observation S1251 / 12455). The splat path consumes the same-angle grid-quantized target.
- **S-084 surface-coherence**: consumes **roof region** + **wall fields** to find (1) stray
  wrong-material blocks embedded in a material field, (2) `.` columns with no front voxel (holes
  through the skin). Both block safe hollowing.
- **S-081 floorplan**: consumes **storey bands** as floor heights (the shared primitive).

## The cottage live subject

- **`benchmarks/sculpture/concept-materials/cottage/after-artifact.json`** — the built cottage,
  6429 `voxel` placements, manifest of 6 blocks (cobblestone, dark_oak_log, dark_oak_planks,
  spruce_planks, stone_bricks, white_terracotta). This is the GL proof subject. Renders at
  `BUILDING_VIEW_3Q` (resemblance benchmark uses it). GLB at `benchmarks/sculpture/glb/cottage.glb`
  (gitignored), concept at the run dir. Material drift findings: `[[material-identity-is-semantic]]`.

## Conventions, boundaries, constraints

- **Purity split (load-bearing).** Pure cores live in `src/` and are exercised by the
  `src/**/*.test.mjs` glob with `node --test` — no GL, no I/O, no `Date`/`random`. Every existing
  geometry module (expand, glb-voxelize, glb-silhouette pure core, image-grid pixel core) follows
  this. The new projection grid + structural read **must** be pure and unit-tested on synthetic
  occupancy; only the multi-angle GL render and the live cottage proof touch GL/fs (lazy-imported,
  `import.meta`-guarded CLI or a benchmarks runner).
- **Test command:** `npm test` = validate good/bad artifact + `npm run test:unit` (the glob). Current
  suite ~816 passing (observation 12410).
- **Coordinate space.** The cottage build is centered near origin with negative coords (e.g.
  `[-13,1,-9]`); the structural read must work in the artifact's own integer space (translate to a
  0-based `dims` grid internally, like glb-voxelize). Ground is `y = min_y` (build-relative), not
  necessarily 0.
- **No air op** (`[[facade-recess-by-exclusion]]`): openings are the *absence* of a front voxel, found
  by analysis, not stored as air placements.
- **Same-angle quantize is read-side only** (AC): produce the cell-aligned target; the splat that
  applies it is S-079.

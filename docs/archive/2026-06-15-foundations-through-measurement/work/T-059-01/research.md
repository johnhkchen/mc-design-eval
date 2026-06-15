# T-059-01 Research — thin-feature-preserving voxelization

Epic **E-18** (thin-form fix), story **S-059**. The job: a `voxelizeGlbThin` layer over E-16's
`voxelizeGlb` that keeps **thin members** of a TRELLIS GLB (bowstave, string, arrow shaft, koi fins)
from dropping out or stair-stepping into disconnected fragments at the global voxel scale.

Descriptive only — what exists and how it connects. No solution here (that is design.md).

## The win and the gap (numbers)

E-16/E-17 established that voxelizing a TRELLIS image→3D mesh is the **decisive form win** over
text→JSON. The R1 breadth sweep scored all 7 subjects by silhouette IoU vs the subject's own GLB.
**Bow-and-arrow is the worst of the 7: form IoU `0.473`** (`glb-voxel/bow-and-arrow/summary.json`),
vs koi/heart/pineapple which sit far higher. Its summary:

- `scale: 32`, `occupancy: 513` cells, `bounds.min [-15,0,-3]`, `bounds.max [14,31,3]`.
- So the build spans **30 × 32 × 7** voxels but fills only 513 cells — it is mostly air, and the
  members that define a bow (the curved stave, the string, the arrow shaft) are **below one voxel
  thick** on their thin axis. At `voxelSize = longest/scale = 32/32 = 1`, a 0.3-unit-thick string
  sampled at cell centers is hit only where the center happens to fall inside → **sparse, broken**.

This is a *resolution-vs-thickness* failure, not a color failure. Silhouette IoU sees the dropouts as
missing area; a severed string is the canonical symptom.

## The existing voxelizer (what we layer over)

`src/form/glb-voxelize.mjs` — pure, GL-free, deterministic. The pieces:

- `parseGlbMesh(glb)` (in `glb-mesh.mjs`) → `{ positions: Float64Array (9 per triangle, world-space),
  triangleCount, bounds:{min,max} }`. **This is the shared parser the AC says to reuse — no duplicate.**
- `voxelizeGlb(glb, {scale})`: sizes a grid by `voxelSize = max(extent)/scale`,
  `dims = round(extent/voxelSize)`, then for **each cell center** runs `pointInMesh` and pushes
  occupied `[i,j,k]`. Returns `{scale, voxelSize, dims, bounds, occupied: Int32Array, count}`.
- `pointInMesh(px,py,pz, positions, triangleCount)`: solid **even–odd ray parity** — casts a `+X` ray,
  counts forward triangle crossings (`rayTriParityX`, Möller–Trumbore specialized to dir `(1,0,0)`),
  odd ⇒ inside. A deterministic, magnitude-relative y/z jitter (`JITTER_Y=1`, `JITTER_Z=0.618…`) dodges
  edge/diagonal coincidences so a solid cube counts exactly.
- `occupiedCells(occupancy)` — generator yielding `[i,j,k]` tuples in stored order.

**Root cause in code:** occupancy is decided *only* by `pointInMesh` at the single **cell center**. A
member thinner than `voxelSize` only registers in cells whose exact center lands inside it — so it
appears as scattered dots or vanishes. Nothing samples the *volume* of the cell or the *surface* that
passes through it. The grid is also globally uniform — the thin axis gets the same `voxelSize` as the
long axis.

## Constraints inherited from the codebase

1. **Pure, GL-free, deterministic.** `glb-voxelize.mjs`, `glb-mesh.mjs`, `form-fidelity.mjs`,
   `ablation.mjs`, `material-clean.mjs` all run under the `src/**/*.test.mjs` glob with nothing mocked.
   `package.json`: `test:unit = node --test "src/**/*.test.mjs"`. No `Math.random` (parity jitter is
   deterministic and magnitude-relative). New code must match.
2. **Scale convention.** `SCALE_MIN=8`, `SCALE_MAX=64`, `DEFAULT_SCALE=32` (`src/sculpture.mjs`). The
   longest mesh edge ≈ `scale` voxels. `assertScale` rejects non-integer / out-of-range. Bumping scale
   to make a 0.3-unit string span ≥1 voxel against a 30-unit bow would need scale ≈ 100 → above
   `SCALE_MAX` and cubic blow-up. (A knob to weigh in design.)
3. **Occupancy contract is consumed downstream.** `glb-voxel-build.mjs` (`glbVoxelBuild`,
   `sampleSurfaceColors`, `colorVoxelsToArtifact`, `keysToArtifact`) and `material-clean.mjs`
   (`materialCleanVoxel`) all read `{voxelSize, bounds, dims, occupied, count}` and iterate via
   `occupiedCells`. **Any thin occupancy must be drop-in shape-compatible** with that contract, or the
   color/compile path breaks. Crucially `sampleSurfaceColors` and `colorVoxelsToArtifact` are exported
   **pure** functions — a runner can compose `thin occupancy → sample → color → artifact` with **no
   change to glb-voxel-build.mjs**.
4. **No air op / coordinate map.** `keysToArtifact` maps `i→x` (centered `i−⌊nx/2⌋`), `j→y` (up), `k→z`
   (centered). Each occupied cell → one `{op:"voxel"}`. More occupied cells = more placements = a denser,
   heavier artifact (the AJV gate `src/artifact.mjs` is the consumer-side assert).

## The measurement path (how before/after IoU is computed)

`benchmarks/sculpture/glb-voxel-breadth.mjs` is the live R1 glue and the template for this ticket's
runner:

- `SUBJECTS[]` maps `key → glb filename → concept run dir`. Bow is
  `{key:"bow-and-arrow", glb:"bow-and-arrow.glb", run:"005-vConcept-a-bow-and-arrow"}`; koi is
  `{key:"koi", glb:"koi.glb", run:"009-…koi-fish"}`. GLBs live under `benchmarks/sculpture/glb/`
  (**gitignored** — see `trellis-glb-path-works` memory; 7 subject GLBs on disk).
- `decodeTexture` — the only impurity: WebP→PNG via `dwebp` (host tool, never CI), then `decodeImage`.
- `judgeIoU(renderPath, glbBytes)`: `extractSilhouette(render, RENDER_BG)` vs
  `rasterizeSilhouette(loadMeshFromGlb(glb), {view:SCULPTURE_VIEW_3Q})`, both `normalizeSilhouette`d,
  then `iou` (all from `form-fidelity.mjs` + `glb-silhouette.mjs`). **This is the exact form IoU the
  AC's before/after needs** — reuse it verbatim.
- `renderArtifact` / `renderSummary` are lazy-imported GL glue; the harness owns them, not CI.

So the ticket's runner = breadth's glue, restricted to bow+koi, voxelizing **twice** (`voxelizeGlb` vs
`voxelizeGlbThin`), coloring both via the shared pure path, rendering, and recording IoU before/after.

## Connectivity primitives — what exists vs what's missing

- **No connected-components / flood-fill / medial-axis / distance-transform utility exists** in `src/`
  (`grep` for `connectedComponent|floodFill|medialAxis|thickness|labelComponents` → only
  `src/revise/region.mjs`, which is region *addressing*, unrelated). The "no-dropped-thin-components
  check" (AC #3) needs a **new** voxel connected-components count — small, pure, BFS/union-find over
  the occupancy with 6- or 26-neighborhood.
- `material-clean.mjs` already has the pattern we mirror for neighborhood work: `indexCells` builds an
  `"i,j,k" → n` Map over `occupiedCells`, and `denoiseVoxelKeys` / `speckleScore` iterate face/box
  neighborhoods on it. The CC helper should use the same `indexCells` idiom (it could even be shared).

## Sibling / sequencing context

- **T-058-01** (material-region-segmentation, the speckle fix) is the *parallel root* in E-18 — it
  touches color/palette, not occupancy. `depends_on: []` for both; they must **not** edit the same
  files (`parallel-roots-duplicate-shared-deps` memory). This ticket stays in geometry
  (`glb-voxelize`/new `glb-thin`), T-058 stays in materials — no overlap.
- **T-060-01** integrates both (remeasure combined pipeline); **T-061-01** is the consolidation /
  thin-angular boundary finding. So this ticket ships the **occupancy primitive + its unit proof + a
  bow/koi before/after measurement**, not the integrated sweep.
- **Sword** is explicitly *out* — TRELLIS 500s on the thinnest subject so there is no GLB at all; that
  is T-061's form-routing finding (`image-to-3d-thin-subject-limit` memory), not this ticket.

## Open questions to resolve in Design

- How to capture sub-voxel members deterministically: **surface/conservative voxelization** (triangle
  ↔ voxel overlap, union with the solid parity fill) vs **per-voxel supersampling** vs a **scale bump**.
- Whether "detect thin members" needs an explicit medial-axis/thickness pass, or whether
  *thin = surface cells the solid fill missed* is a sufficient, computable signal.
- Connectivity *guarantee* vs *repair*: does conservative voxelization of a connected surface inherently
  yield a connected voxel chain, or do we need an explicit bridging step? What neighborhood (6 vs 26)?

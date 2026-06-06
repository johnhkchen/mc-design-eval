# T-049-01 — Design: `glbFormTarget` + loop re-run

The decision the whole ticket turns on: **how does a 3-D GLB target produce a per-region form signal a
flat concept could not, given the build render handed to `scoreRender` is region-framed and the GLB lives
in a different coordinate space?** Everything else (wiring, harness, tests) follows the existing E-15
patterns mechanically.

## D1 — What `scoreRender(renderPath, R)` returns

`scoreRender` must return ONE number (the loop's accept gate is a scalar compare). The AC asks for **both**
whole-object IoU and a true per-region IoU. Resolution, mirroring `conceptFormTarget`'s own split:

- **`scoreRender` returns the per-region IoU** — the local accept signal, the thing the flat concept could
  not give. This is what the loop hill-climbs.
- **Whole-object IoU is computed by the A/B harness** (render whole build → compare to whole GLB
  silhouette), exactly as `form-revise-ab.mjs`'s `wholeObjectIoU` does today against the concept. Exposed
  as a reusable helper so the harness doesn't reach into target internals.

Rejected: returning a blended whole+region scalar — opaque to the gate and to the report; the AC wants
both *recorded*, not *fused*.

## D2 — Bridging voxel space → mesh space (the crux)

`R.subBounds` is an integer **voxel** AABB; `rasterizeSilhouette`'s `region` is a 3-D AABB in **mesh**
coords. Options to locate R in the mesh:

- **(a) Whole-AABB fractional map (CHOSEN).** Map each axis of `R.subBounds` to the same *fraction* of the
  mesh AABB: `meshRegion = meshMin + (R.subBounds − buildMin)/(buildMax − buildMin) · (meshMax − meshMin)`,
  where `buildBounds = artifactBounds(artifact)` is passed into the target. "The body is the front-lower
  third of the build" ⇒ the front-lower third of the GLB. This makes explicit *exactly* the normalization
  the metric already assumes (per-object AABB correspondence) and needs no new calibration.
- (b) ICP / feature alignment of the two point sets — rejected: heavy, non-deterministic, far out of scope
  for a single-view silhouette proxy.
- (c) Hand-tuned per-subject transforms — rejected: not generalizable, hides the assumption in magic
  numbers, and two subjects don't justify a calibration layer.
- (d) Skip mapping; compare the region-framed render against the *whole* GLB silhouette — rejected: this
  reproduces the concept target's bluntness (zoomed region vs whole object), defeating the ticket's point.

**Why (a) is honest, not a fudge:** the build and GLB depict the same subject; the fractional map is the
identity "same relative sub-box of each object." It corrects translation + per-axis scale (which IS the
free parameter the loop must not be penalized for) and *leaves rotation/axis mismatch uncorrected* — so a
genuinely mis-oriented GLB still scores low. That residual is a real signal, documented in the ledger.

## D3 — Per-region comparison mechanics

Given `meshRegion`, two sub-options for isolating the region in the GLB silhouette:

- **(a) 3-D region clip (CHOSEN).** `rasterizeSilhouette(mesh, {view, region: meshRegion})` — the T-048-01
  forward contract. The whole GLB is framed by its own AABB, then the silhouette is clipped to
  `meshRegion`'s projected screen rect. `normalizeSilhouette` then bbox-crops that clipped region and
  scales it to G×G. The build render is already camera-framed on R (region fills the frame); its
  `extractSilhouette → normalizeSilhouette` likewise scales R's silhouette to G×G. Both normalized masks
  represent "region R's silhouette, scaled to fill G×G" → plain `iou(tNorm, rNorm)` IS the true per-region
  IoU. This is *true* region-vs-region (3-D isolation), strictly better than the concept's 2-D rect clip
  of a whole-object mask — the AC's "signal the flat concept could not give."
- (b) `regionIoU(whole, whole, normRect2D)` (form-fidelity's 2-D path) — rejected as the *primary* signal:
  it clips a normalized whole-object mask to a 2-D rect, which is what the concept target already does
  badly. The 3-D clip is the upgrade. (We keep `regionIoU` available; not the chosen path.)

So per-region IoU = `iou( normalize(rasterizeSilhouette(mesh,{view,region:meshRegion})),
normalize(extractSilhouette(decode(renderPath), RENDER_BG)) )`. Whole-object IoU = same with no `region`
and a whole-build render.

## D4 — Loading the 5 MB GLB once

`scoreRender` is called per attempt; parsing 5 MB per call is wasteful. Cache the parsed mesh in the target
closure: read+parse on first `scoreRender` (lazy `node:fs`, like the silhouette CLI), memoize. For tests,
accept an injected mesh/loader so the pure logic runs with zero fs and zero 5 MB asset.

## D5 — Purity & test seams (mirror `conceptFormTarget`)

`glbFormTarget({ glbPath, view, buildBounds, grid, fit, _loadMesh, _rasterize, _decode, _extract })`:
- `_loadMesh(glbPath) → mesh` (default: lazy `readFileSync` + `loadMeshFromGlb`).
- `_rasterize(mesh, opts) → mask` (default: `rasterizeSilhouette`).
- `_decode(path) → {width,height,data}` (default: `decodeImage`); `_extract` defaults to
  `extractSilhouette`.
The **pure scoring kernel** — the voxel→mesh fractional map and the two-mask IoU — is a standalone exported
function (`mapVoxelRegionToMesh`, `silhouetteIoU`) unit-tested with synthetic masks/bounds, no I/O. This is
the AC's "pure scoring logic unit-tested."

## D6 — `buildBounds`: required or derived?

`scoreRender` only receives `(renderPath, R)`; it has no artifact. So `buildBounds` (the whole-build voxel
AABB) is passed into `glbFormTarget` at construction by the caller (the harness has the artifact:
`artifactBounds(artifact)`). If omitted, `scoreRender` falls back to **whole-object IoU** (no region map
possible) — a safe, documented degradation, and the shape `resolveFormTarget` pass-through still type-checks.

## Decision summary

| Concern | Decision |
|---|---|
| `scoreRender` returns | per-region IoU (loop accept signal); whole-object via harness helper |
| voxel→mesh | whole-AABB per-axis fractional map (`buildBounds` from `artifactBounds`) |
| region isolation | 3-D region clip via `rasterizeSilhouette(mesh,{region})` (true per-region) |
| GLB load | lazy + memoized in closure; injectable for tests |
| purity | pure kernel (`mapVoxelRegionToMesh`, `silhouetteIoU`) + injected `_loadMesh/_rasterize/_decode` |
| seam invariant | `glbFormTarget` is a drop-in `{scoreRender}`; loop/observe/diagnose/accept untouched |

## What this design explicitly does NOT claim

- It does **not** correct rotation/axis mismatch between GLB and build (single-view proxy; documented).
- It does **not** guarantee the loop now accepts an edit — a `held` (null) result is a legitimate outcome
  and is reported as such (AC #4). The deliverable is the wired, honest, true-per-region signal.
- Whole-object absolute IoU stays depressed by coordinate-space mismatch; the loop reads the **relative Δ**
  (the same caveat E-13/E-14/E-15 carry).
</content>

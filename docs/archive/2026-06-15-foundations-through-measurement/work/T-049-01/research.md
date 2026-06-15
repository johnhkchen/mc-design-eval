# T-049-01 — Research: `glbFormTarget` implementation + E-15 loop re-run

Epic **E-16**, Arm A. This ticket replaces the throwing `glbFormTarget` stub with a real GLB-grounded
form target and re-runs E-15's surgical loop on the koi/heart builds to see whether a 3-D target moves
the loop where the flat concept could not. Descriptive map of the terrain below.

## The seam this ticket fills

`src/form/form-target.mjs` defines the **FormTarget contract** the revision loop's accept step consults:

```
scoreRender(renderPath, R) => Promise<number>   // [0,1] form fidelity of the render vs the target, framed on R
kind: string                                    // provenance: "concept" | "glb" | …
```

- `conceptFormTarget({conceptPath, region?, _fidelity})` — today's working target. `scoreRender` ignores
  `R` and delegates to `formFidelityFromPair(renderPath, conceptPath)` → whole `iou` (or `regionIoU` if a
  **2-D normalized** `region` was baked into the config). It is the FLAT target E-15 found too blunt.
- `glbFormTarget(opts)` — **currently `throw new FormTargetNotImplementedError(...)`** (form-target.mjs:89).
  The docblock (lines 67–88) specifies the exact shape to implement: load GLB → project mesh to a target
  silhouette masked to R → IoU vs the build render's silhouette.
- `resolveFormTarget(cfg)` — the ONE place the default is chosen: `cfg.formTarget` passed through as-is
  (duck-typed; any `{scoreRender}` object), else a `conceptFormTarget` from `cfg.conceptPath`, else throw.

**The seam invariant** (the thing this ticket must demonstrate unbroken): the loop consults ONLY
`scoreRender`. Swapping concept→GLB must touch nothing in `observe`, `diagnose`, or the accept gate.

## How the loop calls the target (the live path)

`src/revise/loop.mjs`:
- `reviseLoop(artifact, {regions, score, diagnose, observe, ...})` — pure control flow. The accept gate is
  `entry.accepted = after > before + epsilon` (loop.mjs:127). `score` is the only thing that knows the
  target shape. The loop NEVER touches the target directly — it calls `score(candidate, R)`.
- `liveFormScore(cfg)` (loop.mjs:168) — the live GL seam. Per call it:
  1. `observeRegion(artifact, R, {outPath, view, width, height})` → renders the build to a temp PNG.
  2. `resolveFormTarget(cfg)` → a target.
  3. `return target.scoreRender(outPath, R)`.
  So a GLB target swaps in via `liveFormScore({ formTarget: glbFormTarget({...}) })` with **no loop edit**.

**Critical framing fact** (`src/revise/region.mjs:319` `observeRegion`): the render PNG is the **FULL build
rendered with the camera framed TIGHT on `R.subBounds`** (a region-zoomed view, full geometry visible).
So `scoreRender` receives a *region-framed* render, not a whole-object render. `R` is a frozen
`{schema, spec, subBounds:{min,max}, placements, indices, fraction}` (region.mjs:222–244); `subBounds` is
the integer **voxel** AABB the camera framed.

## The projector this ticket builds on (T-048-01, just shipped)

`src/form/glb-silhouette.mjs` — pure, GL-free GLB → binary silhouette rasterizer. Forward contract
(`docs/active/work/T-048-01/review.md`):
- `loadMeshFromGlb(bytes)` → `{positions:Float64Array, indices:Uint32Array, bounds:{min,max}, triCount}`
  (node transforms baked, world-space).
- `rasterizeSilhouette(mesh, {view?, width?, height?, region?})` → **the SAME mask shape as
  `extractSilhouette`**: `{w, h, data:Uint8Array, fgCount, bbox}`. Frames the mesh with `framedCamera` @
  `SCULPTURE_VIEW_3Q` (the build render's camera). `region` is a **3-D AABB `{min,max}` in MESH world
  coords**; when given, the silhouette is clipped to that region's projected screen rect.
- Honesty ledger: single 3/4 view; camera match is **up to normalization** (GLB & build live in different
  coordinate spaces — `normalizeSilhouette` removes translation + uniform scale; viewing direction +
  proportion survive); no backface cull; silhouette ≠ form.

## The metric primitives (T-043-01, stable)

`src/form/form-fidelity.mjs`:
- `extractSilhouette(img, bgOpts)` → mask `{w,h,data,fgCount,bbox}`. `RENDER_BG` = sky `#ADD8E6` ±24.
- `normalizeSilhouette(mask, {grid=128, fit='aspect'})` → bbox-crop + resample to G×G (translation+scale
  invariant; `aspect` preserves proportion).
- `iou(a, b)` → whole-mask IoU (same dims). `regionIoU(a, b, normRegion2D)` → IoU over a normalized 2-D
  sub-rect.
- `formFidelityFromPair(renderPath, conceptPath, opts)` → the only `decodeImage` caller (async shell).

The GLB silhouette mask is byte-shape-identical to `extractSilhouette`'s, so a GLB target can do:
`rasterizeSilhouette(mesh, {region}) → normalizeSilhouette → iou(...)` against the normalized render.

## The re-run harness to mirror

`benchmarks/sculpture/form-revise-ab.mjs` (T-046-01) is the template the new
`benchmarks/sculpture/glb-formtarget-ab.mjs` mirrors:
- Two fixed subjects + curated regions: **koi** `{min:[-9,1,-5],max:[2,6,5]}` (ringing in the S-curve
  body), **heart** `{min:[-8,20,-6],max:[8,31,6]}` (ringing in the aortic arch).
- `reviseLoop(artifact, { regions:[s.region], observe, diagnose:editor.diagnose, tweakFor, score:
  liveFormScore({formTarget: conceptFormTarget({conceptPath})}), budget:{maxIterations:4,perRegion:1} })`.
- `wholeObjectIoU(artifact, conceptPath, out)` renders the WHOLE build @ `SCULPTURE_VIEW_3Q` and scores
  vs the concept. `formVerdictOf(baseline, after, accepted)` → `improved|held|regressed|unknown`.
- The **E-13 baseline** whole-object IoUs (`form-baseline.json`): **koi 0.481, heart 0.347**. The prior
  concept-target run rolled back **2 of 2** (`form-revise-ab.md`: both `held`).
- GL + metered → run on demand, NOT in `npm test`. Writes a committed `.json` + `.md`.

## Inputs on disk / config

- GLBs: `benchmarks/sculpture/glb/{koi,heart}.glb` (present locally, **gitignored**; ~5 MB each).
- Artifacts: `benchmarks/sculpture/runs/{009-…-koi-fish,006-…-human-heart}/artifact.json` + `concept.png`.
- `artifactBounds(artifact)` (region.mjs:69) → whole-build voxel AABB — needed to map a voxel region into
  mesh coords.
- `SCULPTURE_VIEW_3Q` (`src/sculpture.mjs`) — azimuth 45°, elevation 30°; the shared camera.
- `npm test` = artifact validation + `test:unit` (the suite is at **464** after T-048-01).

## Constraints / assumptions surfaced

1. **Coordinate-space gap is the core problem.** The build is text→JSON voxels (its own integer space);
   the GLB is TRELLIS output (its own float space). They depict the same subject but share neither origin,
   scale, nor guaranteed orientation. A per-region comparison must *locate* R in mesh space; the only
   honest bridge is the whole-AABB↔whole-AABB correspondence (the normalization the metric already
   assumes). Rotation/axis mismatch is NOT corrected — it surfaces as a real (possibly confounding) IoU
   drop. This must be stated in the honesty ledger.
2. **The render is region-framed, not whole-object** (observeRegion). So `scoreRender`'s natural output is
   a **per-region** IoU; whole-object IoU is the harness's job (render whole build → compare to whole GLB).
3. **Purity for unit tests.** The pure scoring logic (voxel-region → mesh-region map; mask compare) must be
   testable with zero PNG decode / zero 5 MB GLB — mirror `conceptFormTarget`'s `_fidelity` injection.
4. **Null result is acceptable** (AC #4). The loop may again roll back; the deliverable is the wired seam +
   the true per-region signal + an honest before/after record, not a guaranteed score bump.
</content>
</invoke>

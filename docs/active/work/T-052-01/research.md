# T-052-01 — Research: surgical loop on the GLB-voxel builds

**E-16 synthesis.** The whole arc converges here: the voxelizer supplies the 3-D *form*, the surgical
loop polishes it *against that same 3-D source*. Two finished pieces snap together — the **GLB-voxel
build** (T-051-01) is the starting artifact; the **`glbFormTarget`** (T-049-01) is the accept signal; and
the GLB they both reference is *one file* (`glb/<subj>.glb`). This is the first run where the build and its
form target share an origin. Descriptive map below — no solutions.

## The two inputs already on disk

- **GLB-voxel builds (T-051-01 output)** — `benchmarks/sculpture/glb-voxel/{koi,heart}/artifact.json`
  (committed; renders gitignored). Standard `DesignArtifact`s that pass the AJV gate. Per `summary.json`:
  - koi: 2164 voxels, bounds `min [-16,0,-11] max [15,16,11]`, 71-block manifest, **silhouette IoU
    0.622** vs its own GLB.
  - heart: 5840 voxels, bounds `min [-11,0,-16] max [10,26,15]`, 91-block manifest, **IoU 0.877**.
  - These are **far higher** than the text→JSON builds (koi 0.47 / heart 0.46 against the concept in
    T-049-01) — the synthesis premise: *the starting form is already close.*
- **The GLBs** — `benchmarks/sculpture/glb/{koi,heart}.glb` (gitignored, ~5 MB each, present locally;
  regen via `trellis-glb.mjs`). The **same** files T-051-01 voxelized. So the form target is not an
  external reference — it is the build's literal 3-D source.

## Occupancy → where the voxelization artifacts live

Histogramming `expandPlacement` over each artifact (per-axis voxel counts):

- **koi** — body runs along x (−16…15). A sharp spike at **x=14 (70 voxels) then x=15 (1)** is the
  **caudal/tail fin**: a thin sheet voxelization thickened into a chunky vertical stack (the documented
  "thick fin" / stair-stepping artifact). Dense body core around x∈[−4,2], y∈[6,12].
- **heart** — mass tapers upward; y runs 0…26 with the bulk below y≈17, thinning to **y 18→26 (228→7
  voxels)** at the top — the **aortic arch / great vessels**, left as a near-solid taper rather than an
  open loop (the "almost-closed arch" artifact).

These give honest, defensible surgical regions targeting real voxelization defects.

## The loop and its seams (`src/revise/`)

- **`reviseLoop(artifact, opts)`** — `loop.mjs`. Walks `opts.regions` in order; per region: `selectRegion`
  → skip if it overlaps a **locked** (accepted) region → `observe?` → `diagnose` → up to
  `budget.perRegion` attempts of `tweakFor(route,attempt)` via `applyRegionEdit` (region-lock enforced) →
  `score` before/after → **accept iff `after > before + epsilon` (then lock R), else roll back**. Returns
  `{artifact, trace[], iterations, converged, locked[]}`. The input is never mutated. This **is** the P14
  cage: accepted region locks (never re-edited); a tweak never escapes R; a non-improving tweak is rolled
  back. Termination is structural (≤ regions × perRegion attempts).
- **`liveFormScore(cfg)`** — the GL `score` seam. Renders R's crop via `observeRegion`, then defers the
  *entire* shape judgment to `resolveFormTarget(cfg).scoreRender(renderPath, R)`. **The target is the only
  thing that varies** — swapping concept→GLB is one line, zero loop change (proven in T-049-01).
- **`makeFormEditor(opts)`** — `form-edit.mjs`. Returns `{diagnose, tweakFor, stash, proposals}` sharing a
  private stash. **The router (AC #2 of E-15):** a defect routed to `relief`/`material` → the deterministic
  procedural pass (`scopedTweakFor`); **any other route** (curve/detail/massing) → the **LLM block-editor**
  (`defaultProposeEdit` spawns `npx tsx baml-revise.mts` — `claude -p`, metered). Both sit behind the same
  accept-gate; the loop cannot tell them apart. An out-of-bounds / schema-invalid proposal stashes nothing
  → the llm-edit tweak is an identity no-op the gate rolls back.
- **`region.mjs`** — `selectRegion(artifact, spec)` (spec: bbox/part/where) → frozen `R {subBounds,
  placements, …}`; `artifactBounds(artifact)` → whole-build AABB (feeds `buildBounds`); `applyRegionEdit`
  (the lock); `observeRegion` (render the R crop); `subBoundsOf(R)`.

## The form target (`src/form/form-target.mjs`)

- **`glbFormTarget({glbPath, buildBounds, view, grid, fit, _loadMesh, _rasterize, _decode})`** →
  `{kind:"glb", glbPath, scoreRender(renderPath,R), wholeObjectScore(renderPath)}`.
  - `scoreRender` lazily loads + memoizes the mesh; if `buildBounds && R.subBounds`, maps the voxel region
    into mesh space via **`mapVoxelRegionToMesh`** (per-axis whole-AABB fraction), clips the GLB silhouette
    to it (`rasterizeSilhouette(mesh,{region})`, **GL-free**, T-048-01), decodes the render PNG, and returns
    the **true per-region IoU** (`glbSilhouetteScore`). This is the signal the flat concept could not give.
  - `wholeObjectScore` = whole-build render silhouette vs the whole GLB silhouette (the verdict signal).
- **`resolveFormTarget(cfg)`** returns `cfg.formTarget` duck-typed unchanged — the swap seam.

## The template harness (`glb-formtarget-ab.mjs`, T-049-01)

The direct ancestor. Per subject: read `runs/<run>/artifact.json`; `buildBounds = artifactBounds`; build
`glbFormTarget({glbPath, buildBounds})`; `wholeObjectIoU(before)`; `makeFormEditor({critic: forced
route})`; `reviseLoop({regions, observe: observeRegion, diagnose, tweakFor, score: liveFormScore({formTarget}),
budget:{maxIterations:4, perRegion:1}})`; `wholeObjectIoU(after)`; render the stashed *proposed* candidate
too; emit `glb-formtarget-ab.{json,md}` + per-subject `{before,proposed,after,crop}.png`. **Exports
`formVerdictOf` + `VERDICT_GLOSS`** — the categorical judge (`improved|held|regressed|unknown`), gated
**GLB-after vs GLB-before** (apples-to-apples; mixing a different-target baseline falsely alarms — the bug
T-049-01 caught). The verdict *is* the "judge categorical" the AC asks for (no LLM judge exists for
sculptures — T-051-01 review note 4).

## Constraints & boundaries

- **GL + metered + host tools.** `observeRegion`/whole render need headless GL (prismarine-viewer);
  `baml-revise.mts` needs `claude -p` (subscription). The GLB silhouette raster is GL-free; **no `dwebp`
  needed here** (color is baked into the build already; the loop only reads silhouettes + the render PNG).
  → Lives in `benchmarks/`, **not** `npm test` (mirrors every sibling A/B harness).
- **`src/**/*.test.mjs` is the only test glob** — a benchmark-local test wouldn't run. The loop's P14 cage
  is already unit-tested (`loop.test.mjs`); the form-target math in `form-target.test.mjs`. New *pure* logic
  here should be ~nil (reuse `formVerdictOf` from the sibling rather than clone — see the
  parallel-roots-duplicate-shared-deps memory).
- **Honesty ledger (inherited E-13→T-049-01):** single 3/4 view; silhouette ≠ form; GLB/build share no
  origin/scale (normalization removes translation+uniform scale); **rotation/axis mismatch is NOT
  corrected** — but the koi/heart GLBs frame upright at `SCULPTURE_VIEW_3Q`, and here the build was *made
  from* the GLB, so alignment is as good as it gets. Absolute IoU is depressed by coordinate mismatch; the
  loop reads the **relative Δ**.
- **n=2.** Two subjects. Any result is evidence the mechanism works/doesn't, not a population claim.
- **Expected difficulty (honest prior):** the builds already sit at 0.62 / 0.88 whole IoU — a *local* edit
  improving an already-close form is hard. A "held" outcome (cage keeps it unchanged) is a valid, honest
  result and must be reported as plainly as an "improved" one.

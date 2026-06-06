# T-066-01 — Research: cleanup-consolidation (E-19 terminal)

Descriptive map of what exists for the terminal E-19 ticket. This rebuilds all 7 sculpture subjects with the
**combined** cleanup fixes and produces the honest before/after vs the busy E-18 builds. It writes no new
algorithm — it is the integration + measurement + handoff ticket. Three upstream fixes already landed; this
ticket *composes* them and tells the truth about the result.

## The three upstream fixes (all merged on `main`)

- **T-063-01 stray-voxel pruning.** `src/form/voxel-components.mjs::pruneStrays(occupancy, {connectivity=6,
  minFraction=0.5, minCells=0})` keeps the largest 6-connected component plus any component ≥ `max(minCells,
  minFraction × largestCount)`. Wired into `e18-remeasure.mjs::buildSubject` (prunes the thin occupancy before
  segmentation). moai is the **only** multi-component subject (3 thin comps → 1); the other six are no-ops.
  Plus AC-#4 palette hardening: `segmentMaterials` receives `palette: aug` (pre-augmented) not
  `palette: prim, augment: true`.
- **T-064-01 clean-color-materials.** Variance-aware palette (`src/color/block-table.mjs::varianceOpaque`,
  `var` field in `block-lab-table.json`), `cielab.mjs::nearestFlat` (`FLAT_LAMBDA=0.10`, busy block loses to
  flat at equal ΔE), `palette-augment.mjs` hard `varCeiling=1200` (coral_brain/mycelium/quartz_ore excluded),
  true-axis gradient banding (`material-segment.mjs::gradientDirection`), and `absorbSmallRegions`
  `keepFloor=8` dual-gate (a distinct fleck must also be ≥8 cells to survive). All baked into
  `material-segment.mjs` / `palette-augment.mjs` / `cielab.mjs` — **always on**, no off-switch.
- **T-065-01 per-subject thin routing.** `src/form/form-routing.mjs`: `FORM_TYPE` (thin =
  {bow-and-arrow, koi}; solid = the other five), `selectVoxelizer(subject)` → `voxelizeGlbThin` (thin) or
  `voxelizeGlb` (solid), `voxelizeRouted(glb,{subject,scale})`. **Created but NOT wired into any build path** —
  T-065 review names that "the natural next step (S-066)". This ticket is the wiring point.

## The gap this ticket closes

`benchmarks/sculpture/e18-remeasure.mjs` (the combined-build runner) currently calls **`voxelizeGlbThin`
universally** (line 172), then `pruneStrays`, then `segmentMaterials`. It already has T-063 + T-064 baked in,
but **not** T-065 routing — solids are still over-thickened by the universal thin shell. The final combined
build = **routed voxelize → prune → clean segment**. The only delta from the current `e18-build` is swapping
the universal `voxelizeGlbThin` for `voxelizeRouted` (solids drop to plain `voxelizeGlb`).

## The build pipeline (template: `e18-remeasure.mjs::buildSubject`)

Per subject, scale 32:
1. `glbBytes = readFile(glb/<subject>.glb)` — all 7 GLBs present (gitignored, ~5 MB each); `cottage`,
   `stone-gatehouse` also present (E-20, out of scope).
2. `occThin = voxelizeGlbThin(glbBytes,{scale})` → **(E-19: `voxelizeRouted(glbBytes,{subject,scale})`)**.
3. `occPruned = pruneStrays(occ)`; `strayVoxelStats` before/after.
4. `surface = parseGlbColoredSurface`; `texture = decodeTexture(surface.baseColor)` (WebP→PNG via `dwebp`,
   present at `/opt/homebrew/bin/dwebp`).
5. `designManifest = runs/<run>/artifact.json.palette.manifest`; `prim = paletteFromManifest`;
   `aug = augmentPalette(prim, texture)` (design-doc ∪ ≤2 gated secondary, ceiling 1200).
6. `artifact = segmentMaterials({occupancy:occPruned, surface, texture}, {palette: aug, …})`.
7. `assertArtifact` + `assertPaletteDiscipline(artifact, aug, {cap: prim.length+2})`.
8. `renderArtifact(artifact,{outPath, view: SCULPTURE_VIEW_3Q})` — **GL is AVAILABLE here**
   (`render/src/render.mjs::GL_AVAILABLE === true`; a heart render took 0.7 s). Earlier session notes of "no GL
   host" do **not** hold in this environment — the live sweep is runnable.
9. Score: `judgeIoU` (render silhouette vs GLB silhouette at 3Q), `speckleScore(occPruned, keys)`,
   `artifact.palette.manifest.length`, `offPaletteCount(keys, aug)`, value ΔE
   (`valueGate(realizedPaletteFromArtifact, refClusters)`).

## The "before" (busy E-18) references

- **`benchmarks/sculpture/glb-voxel-seg/`** — the busy R-seg E-18 segmentation build (plain occupancy, busy
  palette). Has committed `artifact.json` + `render-3q.png` + `summary.json` per subject. moai there has the
  TRELLIS duplicate masses (R1/R2 = 6 comps / largestFraction 0.52 / 2023 stray). **These committed renders
  are the legitimate "before" visuals** (no regeneration needed). Its `summary.json` uses the OLD
  boundary-counting speckle (moai 0.097) — for an apples-to-apples table the busy build must be **re-scored on
  the fixed metrics** (reconstruct occupancy from its `artifact.json` placements, like
  `cleanliness-baseline.mjs::occupancyFromArtifact` does).
- **`benchmarks/sculpture/e18-remeasure.json`** — the intermediate record (prune + clean + universal thin).
  `e18` column = current `e18-build`. `r1`/`r2` = E-17 baselines. The frozen E-18 spine; **read-only**
  (T-065 review).
- **`benchmarks/sculpture/cleanliness-baseline.json`** (T-062) — R1/R2/E18 on the fixed metrics
  (speckle/components/largestFraction/stray/subFloor/distinct/cells). The structural "before".
- **`benchmarks/sculpture/form-routing.json`** (T-065) — form IoU + occupancy, before(universal thin)/
  after(routed), per subject. The routing marginal-Δ source.

## Metric semantics (fixed by T-062)

- `speckleScore` (`material-clean.mjs`, re-exported by `material-segment.mjs`): fraction of occupied cells
  *locally outvoted* (fragmentation), `[0,1]`, lower better. **Indexed by `occupiedCells` order — each build
  must be scored against ITS OWN occupancy.**
- `strayVoxelStats` (`voxel-components.mjs`): `{components, largestFraction, strayCount, subFloorCount}`.
  `largestFraction` 1.0 ⇔ one solid mass.
- form IoU: render silhouette vs the GLB's OWN rasterized silhouette at 3Q. **Caveat (T-063): the moai GLB is
  itself the hallucination** (3 statues + bridge bars), so pruning the build to one mass *lowers* IoU vs the
  corrupt reference. For moai, stray/component is the honest signal, not IoU.
- off-palette: blocks placed outside the augmented design-doc palette `aug`. value ΔE: realized palette vs the
  GLB canonical texture palette (k=8).

## Constraints & assumptions

- **Frozen surfaces:** `e18-remeasure.{mjs,json}` (the E-18 spine), `glb-voxel-seg/` (the busy baseline),
  every voxelizer, `segmentMaterials`, `pruneStrays` — read/compose only, do not modify. New work goes in a
  new runner + a new pure assembler.
- **`src/**/*.test.mjs` is the only CI gate** — GL/GLB/`dwebp`/network are outside it. Any new pure logic
  (the cleanup assembler) must be unit-tested; the live sweep is integration evidence, not a CI gate
  (consistent with T-063/T-064/T-065).
- **PR/E-12 conventions:** `pr/assets/frames/` holds before/after composites (e.g. `speckle-heart.png`,
  `form-koi-before.png`/`form-koi-proposed.png`, `march-<subject>.png`). `pr/assets/*.md` are the narrative
  handoffs. `docs/knowledge/design-learnings.md` ends at the E-18 section (line 1689); E-19 appends after it.
- **Determinism:** no `Date.now()`/randomness in the assembler; the runner stamps a duration but the artifact
  bytes are deterministic (segmentation is deterministic).
- **moai threshold margin:** `pruneStrays` minFraction 0.5 sits 0.004 above moai's thin ratio 0.496. On the
  **plain** (routed-solid) moai occupancy the component split differs from the thin one — the runner must
  actually measure it, not assume the thin numbers carry over.

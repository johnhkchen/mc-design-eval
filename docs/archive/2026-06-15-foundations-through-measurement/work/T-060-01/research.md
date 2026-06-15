# T-060-01 — Research: integrate-and-remeasure (E-18 combined build)

Epic **E-18**, story **S-060**. This ticket **combines** the two E-18 fixes and **re-measures** across the
7 subjects so the consolidation (T-061-01) is a pure read. Descriptive map — what exists and how it
connects; no solutions.

## 1. The two fixes to combine (both shipped)

- **Thin form — `voxelizeGlbThin`** (`src/form/glb-thin.mjs`, T-059-01). Solid fill ∪ conservative
  triangle–box SAT surface trace. Signature `voxelizeGlbThin(glb, {scale=32, shell=true, thinScale=null,
  connectivity=26})`. Returns the **same occupancy record as `voxelizeGlb`** — `{scale, voxelSize, dims,
  bounds, occupied:Int32Array, count}` — **plus an additive `thin:{surfaceOnlyCount, components}`** field.
  Drop-in for `sampleSurfaceColors`/`segmentMaterials`. On thick forms `shell:true` is bit-identical to
  `voxelizeGlb`; on thin forms it adds connected surface cells (bow 513→1210, koi 2164→3155). Measured:
  bow IoU 0.473→0.526, koi 0.622→0.707; both stay/drop to 1 connected component.
- **Speckle — `segmentMaterials`** (`src/form/material-segment.mjs`, T-058-01). `segmentMaterials(build,
  opts) → DesignArtifact` where `build = {occupancy, surface, texture}`. Internally: extract a tight fixed
  palette from the texture (E-10), `sampleSurfaceColors` (the **value-true colour** step), region-grow by
  Lab ΔE, absorb specks, per-region fill, hard-band gradients. `SEG_DEFAULTS = {k:6, growDE:22, gradDE:25,
  minRegion:12, neighbourhood:6}`. Off-palette = 0 by construction. Exports `speckleScore`,
  `offPaletteCount`.

**The combined build is literally `segmentMaterials({occupancy: voxelizeGlbThin(glb), surface, texture})`.**
The ticket's "→ value-true color (E-10) →" stage is *inside* `segmentMaterials` (its `sampleSurfaceColors`
+ palette snap), so no separate colour pass is needed. Verified offline on koi: AJV-valid, speckle 0.17,
distinct 6, off-palette 0, value ΔE 0, thin components 1, +991 fin cells.

## 2. The five metrics + where each comes from

| metric | function | module | notes |
| ------ | -------- | ------ | ----- |
| form IoU | `iou(normalizeSilhouette(extractSilhouette(render,RENDER_BG)), normalizeSilhouette(rasterizeSilhouette(mesh,{view})))` | `form-fidelity.mjs` + `glb-silhouette.mjs` | needs a render PNG (GL) and the GLB mesh; `SCULPTURE_VIEW_3Q` |
| speckle | `speckleScore(occupancy, keys)` | `material-clean.mjs` (re-exported by `material-segment.mjs`) | fraction of face-adjacent differing pairs; **occupancy must match the artifact** |
| distinct-block | `artifact.palette.manifest.length` | — | read off the artifact |
| off-palette | `offPaletteCount(keys, snapPalette)` | `material-segment.mjs` | keys not in the fixed palette; E18 = 0 by construction |
| value ΔE | `valueGate(realizedPaletteFromArtifact(artifact), refClusters).meanDeltaE` | `value-gate.mjs` (E-14) | realized palette vs the GLB canonical texture palette |

`realizedPaletteFromArtifact` (`value-gate.mjs:53`) = placed manifest at value-true Lab, count-weighted (a
GL-free render proxy via the T-039 table invariant). `valueGate` (`:146`) = nearest-cluster weighted mean
ΔE. The reference is `extractTexturePalette(texture).snapPalette` (default k, as the E-17 ablation used).

**Occupancy-matching caveat (load-bearing):** `speckleScore` indexes `keys` by `occupiedCells` order, so a
build's keys must be scored against *its own* occupancy. The E18 build uses `voxelizeGlbThin` occupancy;
the R1/R2 baselines were built with `voxelizeGlb`, so their keys must be scored against a fresh
`voxelizeGlb(glb)` occupancy — **not** the thin one. The runner needs both occupancies per subject.

## 3. The baselines on disk (the "before")

- **R1 — glb-voxel** `benchmarks/sculpture/glb-voxel/<subj>/{artifact.json, summary.json}`. Form IoU =
  `summary.silhouetteIoU`. Per-voxel snap to the full 305-table → speckled, leaky (koi distinct 71,
  off-palette 1646, value ΔE 7.87).
- **R2 — glb-voxel-clean** `benchmarks/sculpture/glb-voxel-clean/<subj>/{artifact.json, summary.json}`.
  Form IoU = `summary.formIoUAfter`. Per-voxel snap to the texture palette + weak denoise (koi distinct 8,
  off-palette 586, value ΔE 0).
- Both present for all 7 subjects. speckle/off-palette/value ΔE for them are **recomputed** from their
  committed artifacts (over a `voxelizeGlb` occupancy); distinct + form IoU are read.

**Value-ΔE tautology (known, memory `ablation-value-ΔE-tautology`):** R2 and E18 both snap to the GLB
texture palette, so their value ΔE against that same palette is ~0 *by construction*. Only R1 (full-table
snap) shows nonzero. So the E18-vs-R2 value-ΔE delta is expected ≈ 0 — an "didn't help" cell to record
honestly (AC #3); speckle/distinct/off-palette are the discriminating axes.

## 4. The remeasure-runner pattern to mirror

`benchmarks/sculpture/sweep-ablation.mjs` is the closest template (the E-17 R0–R3 collector):
- Per subject: extract the shared `refClusters` once from the GLB texture; read each rung's artifact +
  summary; collect `{formIoU, valueDeltaE}` per rung; write `<subj>/ablation.json`; roll up via a **pure**
  assembler `assembleAblation(rows, {scale})` → `{md, json}` (`src/form/ablation.mjs`, unit-tested in
  `ablation.test.mjs`). `--offline` rebuilds the roll-up from per-subject JSON. GL (R0 render) + dwebp are
  the only impure edges, never in `npm test`.
- The **pure-assembler + GL-runner split** is the established shape: the metric/format logic lives in a
  pure `src/form/*.mjs` with a `.test.mjs` (see also `scorecard.mjs`/`montage.mjs` from T-057-01); the
  runner owns GL/dwebp/IO. T-060-01's pure logic (assemble the 5-metric × 3-build record + deltas) belongs
  in a new pure module so AC #4 ("pure assembly/metric logic unit-tested") is met without GL.

`glb-voxel-seg.mjs` (T-058-01) and `glb-voxel-thin.mjs` (T-059-01) are the per-fix runners; the E-18
combined runner mirrors their glue (`decodeTexture` via dwebp, `judgeIoU`, `SUBJECTS` import, live/
`--offline`).

## 5. Shared building blocks (reuse, not reimplement)

- `sampleSurfaceColors`, `colorVoxelsToArtifact`, `keysToArtifact` — `glb-voxel-build.mjs`.
- `parseGlbColoredSurface` — `glb-mesh.mjs`; `decodeImage` — `palette-extract.mjs`.
- `renderArtifact` — `render/src/render-tool.mjs`; `renderSummary` — `src/render-tool.mjs`.
- silhouette kernel — `glb-silhouette.mjs` (`loadMeshFromGlb`, `rasterizeSilhouette`) + `form-fidelity.mjs`
  (`extractSilhouette`, `normalizeSilhouette`, `iou`, `RENDER_BG`).
- `SUBJECTS` — `glb-voxel-breadth.mjs` (7: dancing-man, moai, pineapple, bow-and-arrow, heart, mushroom,
  koi; sword excluded). `DEFAULT_SCALE = 32` (`src/sculpture.mjs`) — the scale R1/R2 used; required for
  valid before/after.

## 6. Constraints & assumptions

- **No e18 outputs exist yet** — `benchmarks/sculpture/e18-build/` and `e18-remeasure.{md,json}` are new.
- **New files only / read-only on deps.** `voxelizeGlbThin` and `segmentMaterials` are consumed as-is; no
  edit to `glb-thin.mjs`, `material-segment.mjs`, `material-clean.mjs`, or the baselines. (T-058/T-059 are
  done, but discipline keeps the integration auditable.)
- **Heavier builds** (thin ≈ 2× cells on thin subjects) — within the AJV/`SCALE_MAX` budget; the runner
  should stay performant (T-059 review watch-item #1).
- **Honest nulls** — an absent asset or an unresolved metric is a `null` cell with a note, never a hard
  error (sweep-ablation convention; AC #3).
- **Scale parity** — measure at 32 to compare against the committed R1/R2; other scales out of scope.

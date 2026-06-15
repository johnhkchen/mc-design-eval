# T-056-01 — Structure (ablation-sweep)

The blueprint: files created/modified, public interfaces, ordering. No code.

## Files

### CREATE `src/form/ablation.mjs` (pure, GL/network-free)

The metric-collection core + R3 region derivation. Imports only pure helpers.

```
export const RUNGS  // [{ id:"R0", label:"text→JSON" }, { id:"R1", label:"glb-voxel" },
                    //  { id:"R2", label:"+material-clean" }, { id:"R3", label:"+surgical" }]

export function autoRegions(bounds, { slabs = 3 } = {})
  // bounds: { min:[x,y,z], max:[x,y,z] } (from artifactBounds)
  // → [{ bbox: { min, max } }, ...] splitting the Y span into `slabs` contiguous slabs over full X,Z.
  // Pure. Integer voxel coords. Last slab absorbs the remainder so the slabs tile [minY,maxY] exactly.

export function rungVerdict(prevIoU, curIoU, eps = 1e-3)
  // prevIoU == null  → "baseline"
  // typeof !number   → "unknown"
  // cur > prev+eps   → "improved" ; cur < prev-eps → "regressed" ; else "held"
  // (mirrors formVerdictOf with accepted=true; defined here to keep src/ free of benchmark imports)

export function assembleAblation(rows, opts = {})
  // rows: [{ subject, rung, formIoU:number|null, valueDeltaE:number|null, skipped?, note? }]
  // → { md, json }
  //   json = { schema:"sweep-ablation/v1", epic:"E-17", rungs:RUNGS, metric, note,
  //            subjects:[ { subject, rungs:{ R0:{ formIoU, valueDeltaE, verdict, dFormIoU, dValueDeltaE },
  //                                          R1:{…}, R2:{…}, R3:{…} } } ] }
  //   md   = the subject × rung table (formIoU / ΔE / verdict) + a marginal-Δ table.
  // Pure. Groups rows by subject, orders rungs by RUNGS, computes verdict + signed deltas vs the previous
  // PRESENT rung, tolerates null cells (verdict "unknown", delta null), and never throws on a missing cell.
```

### CREATE `src/form/ablation.test.mjs` (pure unit tests, in the `npm test` glob)

Covers, with NO GL and NO fixtures on disk:
- `autoRegions`: slab count, exact tiling of [minY,maxY], full XZ span, default slabs=3, edge (single-row
  Y span → still returns `slabs` specs, none empty/inverted).
- `rungVerdict`: baseline (null prev), improved/held/regressed thresholds at eps, unknown (non-number).
- `assembleAblation`: a 1-subject × 4-rung fixture → correct grouping, verdict chain
  (R0 baseline → R1 improved → R2 held → R3 held), marginal deltas (incl. negative dValueDeltaE for a
  cleaner palette), and a null/skipped cell handled without throwing. Round-trip: `json.subjects` shape.

### CREATE `benchmarks/sculpture/glb-voxel-surgical-sweep.mjs` (rung R3 — live, GL-only, no LLM)

```
import { reviseLoop, liveFormScore } from "src/revise/loop.mjs"
import { glbFormTarget } from "src/form/form-target.mjs"
import { artifactBounds } from "src/revise/region.mjs"
import { boxesIntersect } from "src/revise/tweak.mjs"
import { autoRegions } from "src/form/ablation.mjs"
import { SUBJECTS } from "./glb-voxel-breadth.mjs"
import { formVerdictOf } from "./glb-formtarget-ab.mjs"
import { SCULPTURE_VIEW_3Q } from "src/sculpture.mjs"

IN_DIR  = glb-voxel-clean/   (R2 builds — input)
OUT_DIR = glb-voxel-surgical-sweep/

reviseOne(subj):
  load glb-voxel-clean/<subj>/artifact.json ; glbPath = glb/<subj>.glb
  buildBounds = artifactBounds(artifact)
  target = glbFormTarget({ glbPath, buildBounds })
  beforeWhole = render whole @3/4 → target.wholeObjectScore
  out = reviseLoop(artifact, {
          regions: autoRegions(buildBounds),
          score: liveFormScore({ formTarget: target }),
          budget: { maxIterations: 12, perRegion: 2 },
        })                       // default proceduralDiagnose / scopedTweakFor (no model)
  afterWhole = render out.artifact @3/4 → target.wholeObjectScore
  write artifact.json (the revised build — the collector reads it for R3 valueDeltaE)
  summary = { subject, scale, regions, kept, rolledBack, formIoUR2 (x-ref from R2 summary),
              wholeObjectIoUBefore, wholeObjectIoUAfter, verdict:formVerdictOf(...), p14, durationSec }
  write summary.json

p14Report(out)   // local pure: accepted⊆locked ; no edit hit a locked region (boxesIntersect)
buildR3(rows)    // pure md/json roll-up (r3.{md,json}) — same shape as buildR2
main: live sweep | --offline (rebuild r3.* from summaries)
exports: { reviseOne, buildR3 }   (importable, main-guarded)
```

Local impure glue MIRRORS the R2 runner: `judgeIoU` is replaced by `target.wholeObjectScore` (already the
GLB target). An absent GLB/R2-artifact → skipped row, not an error.

### CREATE `benchmarks/sculpture/sweep-ablation.mjs` (the collector — live + offline)

```
import { assembleAblation, RUNGS } from "src/form/ablation.mjs"
import { valueGate, realizedPaletteFromArtifact } from "src/color/value-gate.mjs"
import { extractTexturePalette } from "src/form/material-clean.mjs"
import { parseGlbColoredSurface } from "src/form/glb-mesh.mjs"
import { decodeImage } from "src/color/palette-extract.mjs"            // + local decodeTexture (dwebp)
import { loadMeshFromGlb, rasterizeSilhouette } from "src/form/glb-silhouette.mjs"
import { extractSilhouette, normalizeSilhouette, iou, RENDER_BG } from "src/form/form-fidelity.mjs"
import { SUBJECTS } from "./glb-voxel-breadth.mjs"
import { SCULPTURE_VIEW_3Q, DEFAULT_SCALE } from "src/sculpture.mjs"

paths per subject:
  R0 artifact: runs/<subj.run>/artifact.json
  R1 artifact: glb-voxel/<subj>/artifact.json          ; R1 IoU: glb-voxel/<subj>/summary.json.silhouetteIoU
  R2 artifact: glb-voxel-clean/<subj>/artifact.json     ; R2 IoU: …/summary.json.formIoUAfter
  R3 artifact: glb-voxel-surgical-sweep/<subj>/artifact.json ; R3 IoU: …/summary.json.wholeObjectIoUAfter
  GLB:         glb/<subj>.glb

collectSubject(subj):
  decode GLB texture once → refClusters = extractTexturePalette(texture).snapPalette
  for each rung: load artifact (skip→null if absent)
     valueDeltaE = try valueGate(realizedPaletteFromArtifact(art), refClusters).meanDeltaE catch → null
     formIoU     = R1/R2/R3 from committed summary ; R0 = render @3/4 + judgeIoU(GLB)   ← only GL render
  write sweep-ablation/<subj>/ablation.json (the rung cells incl. fresh R0 IoU)
  return flat rows [{subject,rung,formIoU,valueDeltaE}, …]

main:
  --offline → read sweep-ablation/<subj>/ablation.json for all subjects, assemble, write top-level record
  live     → collectSubject ×7, assemble, write
  write benchmarks/sculpture/sweep-ablation.{md,json}
```

### MODIFY `.gitignore`

Append (image-heavy, derived, regenerable):
```
benchmarks/sculpture/glb-voxel-surgical-sweep/**/*.png
benchmarks/sculpture/sweep-ablation/**/*.png
```

### CREATE (committed outputs)
- `benchmarks/sculpture/glb-voxel-surgical-sweep/r3.{md,json}` + per-subject `summary.json` + `artifact.json`
- `benchmarks/sculpture/sweep-ablation.{md,json}` + per-subject `ablation.json`

## Ordering

1. `src/form/ablation.mjs` + `ablation.test.mjs` → `npm test` green (the CI gate; pure, no assets).
2. `glb-voxel-surgical-sweep.mjs` → run live (7 subjects) → commit r3 + summaries (PNGs ignored).
3. `sweep-ablation.mjs` → run live (reads R0–R3) → commit `sweep-ablation.{md,json}` + per-subject json.
4. `--offline` determinism check on both runners (zero diff) → progress.md → review.md.

## Interface invariants

- Nothing in `src/` imports from `benchmarks/` (one-way dependency). `rungVerdict` is defined in `src/`
  rather than imported from `glb-formtarget-ab.mjs` to honor that.
- The R3 revised `artifact.json` is the contract between the two runners (collector reads it for R3 ΔE).
- All three live numbers feeding the table (R1/R2/R3 IoU) are READ from each rung's own committed summary —
  the ablation never recomputes them, so it cannot drift from the rung records the scorecard consumes.

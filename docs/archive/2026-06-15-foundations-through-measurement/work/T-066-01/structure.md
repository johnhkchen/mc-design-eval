# T-066-01 — Structure: cleanup-consolidation

The blueprint. Two new files do all the work (one pure + tested, one impure runner); everything else is
generated output or a doc append. No frozen surface is edited.

## Files

### CREATE — `src/form/e19-cleanup.mjs` (pure, CI-tested)

The table assembler. Mirrors `form-routing.mjs`'s shape (schema const + `assemble*` + private `render*Md`).
PURE — no GL, no I/O, no `Date`/random — so it runs under the `src/**/*.test.mjs` glob.

```
export const E19_CLEANUP_SCHEMA = "e19-cleanup/v1";

// One subject's three measured columns + the per-axis delta (E19 − busy).
// cell shape: { formIoU, speckle, components, largestFraction, strayCount, distinct, offPalette, valueDeltaE }
// (any field may be null → rendered "—"; deltas null when either operand null)
export function cleanupRow({ subject, busy, intermediate, e19 }) → {
  subject, busy, intermediate, e19,
  delta: { formIoU, speckle, largestFraction, strayCount, distinct, offPalette, valueDeltaE },  // e19 − busy
}

// The whole report. `rows` = cleanupRow inputs; `marginals` = the per-fix attribution block
// (prune from T-063, materials from T-064, routing from T-065) passed through verbatim into json + md.
export function assembleCleanup({ rows, marginals, scale, generatedFrom }) → { md, json }
  json: { schema, scale, generatedFrom, headline:{cleanAsTextJson, …}, axes:{<axis>:{improved,held,regressed,avgDelta}},
          averages:{busy,intermediate,e19 per axis}, marginals, subjects:[cleanupRow…] }
  md:  renderCleanupMd(json)   // private

// helpers (private): round2/round3, isNum, fmtNum, fmtSigned, classifyAxis(deltas, betterWhen)
```

Per-axis "better-when" directions: speckle/strayCount/largestFractionGap/distinct/offPalette/valueDeltaE →
**lower better**; form IoU → **higher better** (but annotated for moai as reference-corrupt). `classifyAxis`
buckets each subject improved/held/regressed by a small epsilon and reports the average delta.

### CREATE — `src/form/e19-cleanup.test.mjs` (CI-tested)

Deterministic unit tests over the assembler with a synthetic 2–3 subject fixture:
- `cleanupRow` computes `delta = e19 − busy` per axis; null operand → null delta; missing column tolerated.
- `assembleCleanup` averages, axis classification (an improved axis, a regressed axis, a held axis), the
  headline verdict logic, schema tag, and that markdown contains the header + one row per subject + a totals row.
- Non-array / empty `rows` handled (`assembleCleanup({rows:[]})` → valid empty report, never throws).
- `—` rendering for a null cell.

### CREATE — `benchmarks/sculpture/e19-build.mjs` (impure runner; outside CI)

The live sweep + assembly host. A focused clone of `e18-remeasure.mjs::buildSubject` with **one change** —
routed voxelization — plus the busy re-score and the assembly/handoff steps.

```
import { voxelizeRouted } from "../../src/form/form-routing.mjs";        // ← the wiring (was voxelizeGlbThin)
import { voxelizeGlb } from "../../src/form/glb-voxelize.mjs";           // for occBase diagnostic
import { pruneStrays, strayVoxelStats } from "../../src/form/voxel-components.mjs";
import { segmentMaterials, speckleScore, offPaletteCount } from "../../src/form/material-segment.mjs";
import { paletteFromManifest, assertPaletteDiscipline } from "../../src/form/glb-voxel-build.mjs";
import { augmentPalette } from "../../src/form/palette-augment.mjs";
import { extractTexturePalette } from "../../src/form/material-clean.mjs";
import { valueGate, realizedPaletteFromArtifact } from "../../src/color/value-gate.mjs";
import { occupancyFromArtifact } from "./cleanliness-baseline.mjs";     // re-score the busy build
import { assembleCleanup, ... } from "../../src/form/e19-cleanup.mjs";
import { SUBJECTS } from "./glb-voxel-breadth.mjs";
// + glb-silhouette / form-fidelity for judgeIoU, decodeImage/dwebp for texture (copied from e18-remeasure)

OUT_DIR  = e19-build/
SEG_DIR  = glb-voxel-seg/         // the busy "before"
FRAMES   = ../../pr/assets/frames/
WORST    = ["heart","moai","koi"]

buildE19(subj, {scale, renderArtifact}):
  occRouted = voxelizeRouted(glb, {subject: subj.key, scale})   // thin→thin voxelizer, solid→plain
  occPruned = pruneStrays(occRouted)
  strayB/strayA = strayVoxelStats(occRouted / occPruned)
  aug = augmentPalette(paletteFromManifest(designManifest), texture)
  artifact = segmentMaterials({occupancy: occPruned, surface, texture}, {palette: aug, style:{name:"glb-voxel-e19",…}})
  assertArtifact; assertPaletteDiscipline(artifact, aug, {cap: prim.length+2})
  write e19-build/<subj>/artifact.json
  render → e19-build/<subj>/render-3q.png
  e19cell = { formIoU: judgeIoU, speckle, components/largestFraction/strayCount (occPruned), distinct, offPalette, valueDeltaE }
  write e19-build/<subj>/summary.json   // {subject, busy, intermediate, e19, stray, occ, scale}

rescoreBusy(subj):  // glb-voxel-seg, fixed metrics
  artifact = read glb-voxel-seg/<subj>/artifact.json
  {occ, keys} = occupancyFromArtifact(artifact); stray = strayVoxelStats(occ)
  busyCell = { formIoU: summary.formIoUAfter, speckle, components, largestFraction, strayCount, distinct,
               offPalette: offPaletteCount(keys, aug), valueDeltaE }

intermediateCell(subj): read e18-build/<subj>/summary.json `e18` block (universal thin + prune + clean)

marginals:  // attribution, read from the landed records
  prune  ← e18-remeasure.json subjects[].stray.before/after            (T-063)
  materials ← busy(seg) speckle/distinct/offPal/valueΔE → e18 column   (T-064)
  routing ← form-routing.json averages + per-subject before/after      (T-065)

main(): live sweep → assembleCleanup → write e19-cleanup.{md,json}; copy worst-case before/after frames.
  --offline rebuilds e19-cleanup.{md,json} from committed summaries (no GL), mirroring e18-remeasure --offline.
```

### MODIFY — `package.json`

Add `"e19:build": "node benchmarks/sculpture/e19-build.mjs"` (and `e19:build:offline` is just the flag).

### APPEND — `docs/knowledge/design-learnings.md`

New section after the E-18 block (line ~1745): **"## Voxel cleanup (E-19) — the busy build made as clean as
text→JSON (S-066, T-066-01)"**. Marks each backlog item closed by number (T-063 strays, T-064 materials,
T-065 routing), gives the busy→E-19 before/after table summary, answers the headline question, and is honest
about the residuals (value ΔE cost, moai form-vs-corrupt-GLB).

### CREATE — `pr/assets/voxel-cleanup.md` (E-12 handoff)

The narrative handoff: the three fixes, the before/after composites, the headline answer, the honest residuals.
References `frames/e19-{heart,moai,koi}-{before,after}.png` and `../../benchmarks/sculpture/e19-cleanup.md`.

### CREATE (generated, binary/data) — outputs

- `benchmarks/sculpture/e19-build/<7 subjects>/{artifact.json, render-3q.png, summary.json}`
- `benchmarks/sculpture/e19-cleanup.{md,json}`
- `pr/assets/frames/e19-{heart,moai,koi}-before.png` (copied from `glb-voxel-seg/`),
  `pr/assets/frames/e19-{heart,moai,koi}-after.png` (copied from `e19-build/`)

## Module boundaries / interfaces

- **Pure core** (`e19-cleanup.mjs`): all table math + md/json. The ONLY new logic; the ONLY thing tested by
  `npm test`. Tolerant of null cells (a skipped subject never crashes the report).
- **Impure runner** (`e19-build.mjs`): GL render, WebP decode, file I/O, frame copy. Composes existing pure
  pieces (voxelizers, prune, segment, palette, metrics) + the new assembler. Not in the test glob — consistent
  with every other `benchmarks/sculpture/*.mjs` runner.
- **Frozen, read-only:** `e18-remeasure.{mjs,json}`, `glb-voxel-seg/*`, `cleanliness-baseline.mjs` (imported,
  not edited), `form-routing.mjs` (imported), all voxelizers, `segmentMaterials`, `pruneStrays`, `block-lab-table.json`.

## Ordering of changes

1. `e19-cleanup.mjs` + test → `npm test` green (pure, no sweep needed).
2. `e19-build.mjs` runner + `package.json` script.
3. Live sweep → `e19-build/*`, `e19-cleanup.{md,json}`, frames.
4. `design-learnings.md` append + `pr/assets/voxel-cleanup.md` from the measured numbers.
5. Final `npm test` + commit.

Each of 1–4 is independently committable; step 1 is the only one that touches CI.

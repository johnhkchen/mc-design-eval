# T-053-01 Structure — file-level blueprint

The shape of the consolidation. Three files created, two appended, zero in `src/`.

## Files

### CREATE `benchmarks/sculpture/glb-grounded-ab.mjs` (~180 lines)
The pure offline consolidator. No imports from `src/` that trigger model calls; only `node:fs`/`node:path`
and JSON reads.

Public shape:
```
const ROOT      = benchmarks/sculpture
read sources:
  formBaseline  = JSON  form-baseline.json                  // E-13 vs concept
  formTarget    = JSON  glb-formtarget-ab.json              // Arm A: text→JSON vs GLB + verdict
  voxKoi/voxHrt = JSON  glb-voxel/{koi,heart}/summary.json  // Arm B: voxel vs GLB
  surgical      = JSON  glb-voxel-surgical/glb-voxel-surgical.json // synthesis vs GLB + verdict

const BANDS = [[0.50,'poor'],[0.70,'fair'],[0.85,'good'],[Infinity,'strong']]
function band(iou): string

function rowsFor(subject):
  text→JSON  : iouVsGlb = formTarget.subjects[subj].wholeObjectIoUBefore
               iouVsConcept = formBaseline.subjects[run].iou
               categorical = band(iouVsGlb)
  GLB-voxel  : iouVsGlb = vox.silhouetteIoU ; iouVsConcept = null
  surgical   : iouVsGlb = surgical.subjects[subj].wholeObjectIoUAfter
               verdict   = surgical.subjects[subj].verdict
               categorical = `${band(iouVsGlb)} (${verdict})`
  each row carries deltaVsTextJson = iouVsGlb − textJsonIouVsGlb

function buildModel(): { schema, metric, generatedFrom, note, bands, subjects:[{subject, run, glb,
    methods:[…rows], answers:{q1,q2,q3}, residual}] , answers (epic-level) }

function emitJson(model) → write glb-grounded-ab.json
function emitMd(model)   → write glb-grounded-ab.md   (headline + 6-row table + 3 answers + residual)

main(): build → emitJson → emitMd ; main-guard so a future test can import buildModel without writing.
export { band, buildModel, rowsFor }   // importable, no side effects on import
```

Key invariants encoded in the file's `note`:
- vs-GLB is the apples-to-apples spine; vs-concept is the E-13 cross-ref only where measured.
- categorical band is IoU-derived (thresholds printed), suffixed with the deterministic loop verdict — not
  an independent perceptual judge (none was re-run in E-16).
- numbers are read from committed upstream records, not recomputed.

### CREATE `benchmarks/sculpture/glb-grounded-ab.json` (generated)
Emitted by the consolidator. Machine-readable head-to-head: per-subject method rows with `iouVsGlb`,
`iouVsConcept`, `categorical`, `verdict`, `deltaVsTextJson`, plus the epic-level `answers` (q1/q2/q3) and
`residual` strings. Schema `glb-grounded-ab/v1`.

### CREATE `benchmarks/sculpture/glb-grounded-ab.md` (generated)
Human-readable. Headline, the six-row table (subject × method), the three answered questions with
evidence, the residual. Mirrors the tone of `glb-formtarget-ab.md` / `form-revise-ab.md`.

### CREATE `pr/assets/glb-grounded.md` (~70 lines, authored)
E-12 handoff beat. "image→3D, grounded and refined." Headline = the voxelization form win (heart 0.347
concept → 0.877 vs-GLB; koi 0.481 → 0.622). Names the hero renders:
- `benchmarks/sculpture/runs/006-…-human-heart/render-3q.png` (text→JSON, the gap) →
  `benchmarks/sculpture/glb-voxel/heart/render-3q.png` (GLB-voxel, the win).
- same pair for koi (009 → glb-voxel/koi).
- the surgical refinement as the honest "diminishing returns once grounded" footnote
  (`glb-voxel-surgical/koi/{before,after}.png`).
Suggested E-12 beat + one-sentence method line, matching `form-revise.md`'s closing shape.

### APPEND `docs/knowledge/design-learnings.md`
New terminal section after the E-15 section (currently ends ~L1567):
```
## E-16 GLB-grounded form — image→3D, grounded then refined (S-053, T-053-01) · 2026-06-05
  <intro: E-15 left the form gap with a flat target; E-16 grounds it in a real TRELLIS GLB>
### The three-way — whole-object IoU vs the GLB target (and the E-13 concept cross-ref)
  <6-row table>
### The three answers (the headline)
  1. 3-D target on text→JSON: 1 of 2 moved (heart improved, koi held) — beat the flat concept's 0/2
  2. voxelization vs text→JSON: decisive win (+0.150 koi, +0.421 heart)
  3. surgical on the voxel set: no net whole-object gain, 1 local clean didn't transfer; cost = 1 LLM call/region
### Honest notes — where grounding didn't help, and what it cost
### One sentence
```

### APPEND (optional) `pr/assets/README.md`
Add `glb-grounded.md` to the asset index if the README enumerates beats. Check first; only if it lists the
others.

## No changes
- `src/**` — untouched (keeps `npm test` green by construction).
- The three upstream `*-ab` / `glb-voxel*` artifacts — read-only inputs, not modified.
- GLB meshes — not read (gitignored, large); only their JSON summaries.

## Ordering that matters
1. Write `glb-grounded-ab.mjs`, run it → produces `.json` + `.md` (this *is* the measurement of record).
2. Author `design-learnings.md` section quoting the emitted numbers (so the journal can't drift from the
   table).
3. Author `pr/assets/glb-grounded.md` quoting the same.
4. Verify `npm test` green; commit.

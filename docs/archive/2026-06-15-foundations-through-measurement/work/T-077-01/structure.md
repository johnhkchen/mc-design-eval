# T-077-01 Structure — resemblance-consolidation

File-level blueprint. The shape of the change, not the code. Reuses the delivered runner; adds one pure
aggregator + one impure driver; touches three existing files minimally.

## Created

### `src/form/resemblance.mjs` — (modified) add pure aggregator
New export `consolidateResemblance(subjectResults, opts)` + `RESEMBLANCE_CONSOLIDATION_SCHEMA`.
- **Input:** `subjectResults` = `[{ subject, row, verdict, mode }]` where `row` is a `resemblanceRow`
  output and `verdict` is a `parseResemblanceVerdict`-shaped object (`{verdict, gap:{region,attribute}|null,
  rationale}`); `mode` ∈ `"live" | "offline"`.
- **Pure, total, GL-/model-free.** No I/O, no thresholds beyond the existing frozen `GAP_ATTRS`.
- **Output** (the AC#2 machine contract):
  ```
  { schema, subjects: [ { subject, verdict, gap, mode,
                          form:{meshIoU,conceptIoU},
                          material:{set,zone,meanDeltaE},
                          routesToE21 } ],
    summary: { counts:{<verdict>:n,...}, e21Findings:[{subject,attribute,region,note}] } }
  ```
- **Routing rule (AC#4), encoded once:** `routesToE21 = gap && MATERIAL_ATTRS.has(gap.attribute)` where
  `MATERIAL_ATTRS = {"material zoning","palette"}` (the material half of `GAP_ATTRS`; the other half —
  `form`, `massing` — is form drift, not routed: E-22 does not edit form). Each routed gap becomes one
  `e21Findings` entry.
- **Guards:** unknown verdict string (e.g. `"unparsed"`, `"(not run)"`) is counted under its literal key,
  `routesToE21=false`, no finding emitted (a non-verdict cannot name a material gap). Null/garbled rows do
  not throw — totality matches the rest of the module.

### `benchmarks/sculpture/resemblance-consolidation.mjs` — NEW impure driver
The S-077 orchestrator. Imports `runResemblanceGate` + `SUBJECTS` from `resemblance.mjs`,
`consolidateResemblance` from the pure core, and the render path for the before/after.
- `runConsolidation({offline, only})`:
  1. For each subject in `SUBJECTS` (or the `--subject`-filtered subset): resolve immutable paths, call
     `runResemblanceGate({...})` → collect `{subject, row, verdict, mode}`.
  2. `consolidateResemblance(results)` → the consolidation object.
  3. Write `resemblance/resemblance-consolidation.json` (the object) + `resemblance-consolidation.md`
     (verdict table + before/after + re-photographing honesty paragraph + E-21 routing list).
  4. `renderGatehouseBeforeAfter()` — render `building/scale-64/artifact.json` at `supersample:1` (old lens)
     and default `supersample:3` (new lens); compute `highFreqEnergy` on each; emit both PNGs + the numbers.
  5. Write `docs/active/work/T-077-01/e21-material-findings.md` from `summary.e21Findings`.
  6. Copy handoff assets into `pr/assets/` (the four triptychs + the two lens PNGs).
- CLI: `node benchmarks/sculpture/resemblance-consolidation.mjs [--offline] [--subject <name>]`.
- **Not unit-tested** (pulls GL + the metered model) — the established T-076 pattern; verified by its live
  run + committed outputs. All testable logic lives in the pure `consolidateResemblance`.

### Output artifacts (generated, committed)
- `benchmarks/sculpture/resemblance/resemblance-consolidation.{md,json}` (AC#2).
- `benchmarks/sculpture/resemblance/{cottage,moai,pineapple}-{triptych.png,minecraft.png,perceptual.json,
  verdict.json,resemblance.md}` (AC#1 — gatehouse already present, re-run for consistency).
- `pr/assets/gatehouse-lens-before.png`, `gatehouse-lens-after.png` (AC#3, same artifact, two lenses).
- `pr/assets/{gatehouse,cottage,moai,pineapple}-triptych.png` (AC#6 E-12 handoff copies).
- `docs/active/work/T-077-01/e21-material-findings.md` (AC#4 routing record).

## Modified

### `benchmarks/sculpture/resemblance.mjs` — generalize the `SUBJECTS` table
Add `cottage`, `moai`, `pineapple` rows; generalize the entry to carry explicit paths so non-`building`
subjects resolve correctly. Each entry: `{ key, glb, concept, artifact, committedRender }` where `concept`,
`artifact`, `committedRender` are paths relative to the sculpture root (resolved with `join(HERE, …)`).
gatehouse keeps `building/best/artifact.json` + `building/scale-64/render-3q.png`. Update `main()` to read
`def.concept` directly instead of deriving `runs/<run>/concept.png` (keep `run` only where still useful, or
drop it). The exported `SUBJECTS` is the single immutable-reference registry (Rule 1). New rows:
- `cottage`: glb `cottage.glb`, concept `runs/014-vConcept-a-cottage/concept.png`, artifact
  `concept-materials/cottage/after-artifact.json`, committedRender `concept-materials/cottage/after-3q.png`.
- `moai`: glb `moai.glb`, concept `runs/003-vConcept-a-moai-statue/concept.png`, artifact
  `e19-build/moai/artifact.json`, committedRender `e19-build/moai/render-3q.png`.
- `pineapple`: glb `pineapple.glb`, concept `runs/004-vConcept-a-pineapple/concept.png`, artifact
  `e19-build/pineapple/artifact.json`, committedRender `e19-build/pineapple/render-3q.png`.

### `render/src/render-tool.mjs` — forward `supersample`
`renderArtifact` currently passes only `{outPath, view}` to `renderBuild`, silently dropping any
`supersample`. Add `supersample` to the opts JSDoc and forward it: `renderBuild(build, {outPath, view,
supersample: opts.supersample})`. Additive + backward-compatible (undefined → renderBuild's
`DEFAULTS.supersample=3`). This is the lever the before/after needs without the driver re-implementing
`buildWorldFromArtifact`. (Fallback if rejected in review: driver calls `renderBuild` directly.)

### `src/form/resemblance.test.mjs` — tests for the aggregator
Add a `consolidateResemblance` describe block: counts tally per verdict; a `palette`/`material zoning` gap
routes to E-21 (`routesToE21=true`, one `e21Findings` entry); a `form`/`massing` gap does **not** route;
`"same object"` (null gap) does not route; an unknown verdict (`"unparsed"`) counts under its key and emits
no finding; schema field present; determinism on repeated calls. GL-free, model-free.

### `docs/knowledge/design-learnings.md` — append E-22 section
New `##`-level section **"Faithful render + resemblance gate (E-22)"**: root cause (minification aliasing,
clean build / broken lens), the SSAA ×3 fix (HF −71.4%), the reference-anchored gate replacing green-metric
sign-off, and the honest re-photographing delta (per subject; including any verdict that got worse).

## Deleted
None.

## Ordering (dependencies between changes)
1. `render-tool.mjs` supersample passthrough (independent; unlocks the before/after).
2. Pure `consolidateResemblance` + its tests (independent; keeps `npm test` green before the driver exists).
3. `SUBJECTS` table generalization (independent; unlocks multi-subject runs).
4. Driver `resemblance-consolidation.mjs` (depends on 1–3).
5. Live run → generate all gate outputs + before/after + consolidation reports + E-21 findings + assets.
6. `design-learnings.md` E-22 section (depends on 5 — needs the real re-photographed verdicts to be honest).

## Module boundaries preserved
- **Pure core** (`src/form/resemblance.mjs`): scoring + triptych math + verdict parsing + **now aggregation**.
  No GL, no model, no I/O, no `Date.now`. Fully unit-tested.
- **Impure edge** (`benchmarks/sculpture/*.mjs`): GL render, metered judge, file I/O, asset copying.
- **Render contract** (`render/**`): unchanged behavior; one additive opts passthrough.
- **Immutable references** (Rule 1): concept images, GLBs, build artifacts — read-only inputs, never edited.

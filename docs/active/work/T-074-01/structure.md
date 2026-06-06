# T-074-01 — concept-materials-consolidation · Structure

The blueprint. Two new code files (one pure + tests, one impure runner), one pure-module test file, additive
edits to `package.json` + `.gitignore` + `design-learnings.md`, and generated artifacts/frames/handoff. No
existing pipeline module is touched — zero regression surface beyond new files + additive lines.

## New files

### `src/form/concept-materials-ab.mjs` — PURE assembler (the heart, unit-tested)

Mirrors `src/form/e19-cleanup.mjs`'s shape: schema const, pure row/judge/assemble fns, private `render*Md`.
No GL, no I/O, no Date/random — runs under the `src/**/*.test.mjs` glob.

```
export const CONCEPT_MATERIALS_AB_SCHEMA = "concept-materials-ab/v1"

// One subject's before/after cells → a row with deltas + the categorical judge. PURE, null-tolerant.
export function abRow({ subject, kind, before, after, nearTone, growth, trueByFeature }) → {
  subject, kind,                       // kind: "architectural" | "sculpture"
  before, after,                       // { distinct, speckle, offPalette } each (null cells → "—")
  delta: { distinct, speckle, offPalette },
  nearTone: { pairs, collapsedBefore, restoredAfter, separatedAfter },
  growth,                              // { added:[{block, role, rationale, placementRule}], justified, count }
  trueByFeature,                       // { ok, perRule:{block→dominantFeature} } | null (sculpture)
  judge,                               // "restored" | "clean-held" | "no-distinction" | "over-reach" | "deferred"
}

// The deterministic categorical (AC#2). PURE.
export function judgeSubject({ nearTone, before, after, growth, trueByFeature, deferred }) → string

// near-tone restoration from a map's nearTonePairs + the two builds' manifests + the after matrix. PURE.
export function nearToneRestoration({ nearTonePairs, beforeManifest, afterManifest, afterMatrix }) → {
  pairs, collapsedBefore, restoredAfter, separatedAfter }

// palette growth vs the design-doc manifest, joined to map role/rationale. PURE.
export function paletteGrowth({ afterManifest, designDocManifest, map }) → {
  added:[{block, role, rationale, placementRule}], justified:boolean, count }

// Assemble the whole report. PURE.
export function assembleConceptMaterialsAb({ rows, scale, generatedFrom }) → { md, json }
```

`assembleConceptMaterialsAb` computes per-judge tallies (how many subjects restored / clean-held /
no-distinction / over-reach / deferred), a headline ("is the near-tone distinction restored where the concept
put it, clean and true?"), and renders a per-subject table (distinct before→after, speckle, off-pal, near-tone
collapsed→restored, judge) + a palette-growth table (subject → added blocks + justification) + an honesty
ledger (the inherited gaps: trim, non-full-cube fixtures, organic over-reach, near-tone invisibility to
render). Mirror `assembleCleanup`'s null-tolerance: any absent cell renders "—", never throws.

### `src/form/concept-materials-ab.test.mjs` — pure unit tests (CI-safe)

~12–14 cases, no GL/I/O:
- `nearToneRestoration`: a pair collapsed in before (only stone_bricks) → restored+separated in after
  (both, distinct dominant features); a pair present in both but NOT separated → restored-but-not-separated;
  no pairs → empty.
- `paletteGrowth`: added blocks joined to map role/rationale; `justified=true` when every addition has a
  rationale; `justified=false` on an unjustified addition; no growth → empty.
- `judgeSubject`: each branch — restored, clean-held, no-distinction (moai: empty pairs + flat growth),
  over-reach (a map block dominating the wrong feature OR unjustified growth), deferred.
- `abRow`: deltas computed; null after-cells tolerated → judge "deferred".
- `assembleConceptMaterialsAb`: tallies + headline + md contains the per-subject + growth tables; empty rows
  → degenerate-but-valid report (no throw).

### `benchmarks/sculpture/concept-materials-ab.mjs` — IMPURE runner (live + `--offline`)

Generic over a `SUBJECTS` table. Owns the impure edges only (GLB read, dwebp texture decode, colour sample,
GL render, metered `material:map` spawn, file I/O). NOT unit-tested. Shape cloned from `material-assign.mjs`
+ `e19-build.mjs`.

```
const SUBJECTS = [
  { key:"gatehouse", kind:"architectural", glb:"stone-gatehouse.glb", map:"gatehouse.json",
    run:"015-…", docRun:"015-…" },
  { key:"cottage",   kind:"architectural", glb:"cottage.glb", map:"cottage.json",
    run:"014-vConcept-a-cottage", docRun:"014-vConcept-a-cottage" },
  { key:"moai",      kind:"sculpture", glb:"moai.glb", map:"moai.json",
    run:"003-vConcept-a-moai-statue", e19:"moai" },
  { key:"pineapple", kind:"sculpture", glb:"pineapple.glb", map:"pineapple.json",
    run:"004-vConcept-a-pineapple", e19:"pineapple" },
]

ensureMap(subj)            // commit material-map/<subj>.json; generate via the metered bridge if absent (D5)
buildColorimetric(subj)    // architectural: segmentMaterials on the GLB → before artifact + render
                           // sculpture: read e19-build/<subj>/artifact.json (no rebuild) → before
buildConceptGrounded(subj) // map → classifyFeatures → assignFeatureBlocks → after artifact + render + matrix
cellFor(artifact, keys, augPalette)  // { distinct, speckle, offPalette } via the E-19 pure metrics
buildSubject(subj)         // both sides + nearTone/growth/trueByFeature → an abRow input
copyFrames()               // pr/assets/frames/concept-{gatehouse,cottage}-{before,after}.png
emit(rows)                 // assembleConceptMaterialsAb → concept-materials-ab.{md,json} + pr/assets/concept-materials.md
verifyOffline()            // re-derive rows from committed before/after artifacts + maps, re-validate AJV, no GL/model
```

The runner reuses, never re-implements: `voxelizeGlb`, `parseGlbColoredSurface`, `sampleSurfaceColors`,
`keysToArtifact` (glb-voxel-build); `classifyFeatures`/`assignFeatureBlocks`/`featureBlockMatrix`/
`fallbackPalette` (feature-classify); `segmentMaterials`/`speckleScore`/`offPaletteCount` (material-segment);
`paletteFromManifest`/`augmentPalette` (the augmented allowed palette for off-palette scoring);
`nearTonePairs`/`paletteFromMap` (material-map); `occupancyFromArtifact` (cleanliness-baseline);
`assertArtifact`; `renderArtifact`; the metered `material:map` bridge via the committed `material-map.mjs`
runner's exported `buildLive` or a direct `tsx` spawn of `baml-material-map.mts`.

## Modified files (additive only)

- `package.json` — add `"concept:ab": "node benchmarks/sculpture/concept-materials-ab.mjs"`.
- `.gitignore` — add `benchmarks/sculpture/concept-materials/**/*.png` (renders derived/gitignored, the
  convention; the `before-artifact.json`/`after-artifact.json` + the top-level `.json`/`.md` are committed).
- `docs/knowledge/design-learnings.md` — append a `## Concept-grounded materials (E-21)` section (AC#5):
  the mean-colour collapse failure, the map+feature-assign+refine fix, the LLM's right to add missing concept
  materials back (justified growth vs bloat), and where it helps (architectural near-tone zoning) vs
  over-reaches (organic forms; near-tone invisibility to a render).

## Generated artifacts (committed)

- `benchmarks/sculpture/concept-materials-ab.{json,md}` — the A/B record.
- `benchmarks/sculpture/concept-materials/<subj>/{before-artifact.json, after-artifact.json}` — both sides,
  AJV-valid, per subject.
- `benchmarks/sculpture/material-map/{moai,pineapple}.{json,raw.json}` — the two new sculpture maps (D5).
- `pr/assets/frames/concept-{gatehouse,cottage}-{before,after}.png` — the AC#3 / E-12 visual.
- `pr/assets/concept-materials.md` — the E-12 handoff.

## Ordering (matters)

1. Pure assembler + tests first (the contract; `npm test` must stay green before any live run).
2. The runner (consuming the assembler) — verify import wiring with `--offline` against committed gatehouse
   data before any live build.
3. Live: ensureMap (metered, gated) → build both sides per subject → render → emit + frames.
4. design-learnings + pr handoff from the real numbers.
5. `npm test`; commit incrementally per the plan.

## Interfaces / boundaries

- **Purity boundary** is the file split: every colour/feature/judge computation lives in the pure assembler
  or an already-pure imported kernel; the runner only does GL/dwebp/metered/I/O. The suite never pulls GL or
  the model (the idiom).
- **The assembler is the version contract** (`concept-materials-ab/v1`) — the durable record downstream (E-12)
  reads. Keep it stable or bump.
- **No coupling to T-073's correct pass** — the A/B build is assign-level (D4); the correct record is cited,
  not imported.

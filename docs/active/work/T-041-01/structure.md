# T-041-01 — Structure: value-matched-build

The shape of the code. Two files created in `src/` (module + test), one created in `benchmarks/`
(offline A/B), three modified (config, sculpture descriptor, runner). No deletions.

## CREATE `src/color/value-build.mjs` (the deliverable — pure, GL-free, network-free)

```
imports:
  { nearestLab }                         from "./cielab.mjs"
  { resolveValueTruePalette, normalizeName } from "./value-palette.mjs"

constants:
  VALUE_MATCHED_SCHEMA = "value-matched-build/v1"
  round1, round2                          // local rounding helpers (match value-palette.mjs)

pure helpers:
  toRealizedClusters(realized)
    // accept either [{block,lab}] OR an extractPaletteFromImage result {palette:[{block,repColor:{lab}}]}
    // -> [{ key:block, lab }]; throw on empty / unrecognized shape.
  distinctNames(artifact)
    // ordered-unique normalized block names: placements first (application order), then any
    // manifest-only names. The set the snap resolves.
  anchorFor(name)
    // resolveValueTruePalette([name]).card[0] -> { valueHonest:block, lab, valueHonestL:value }

public:
  snapArtifactToValueTrue(artifact, realized, opts={}) -> {
    schema, artifact (clone), swaps[], manifest[], changedPlacements, realizedUsed[]
  }                                       (EXPORTED)
```

### Control flow of `snapArtifactToValueTrue`

```
clusters = toRealizedClusters(realized)                 // throws on empty
names    = distinctNames(artifact)                      // throws if none

map   = new Map()        // normalizedName -> value-true block id (bare)
swaps = []
for name in names:
    a   = anchorFor(name)                               // { valueHonest, lab, valueHonestL }
    hit = nearestLab(a.lab, clusters)                   // { key, deltaE, lab }
    toL = round1(clusters.find(c=>c.key===hit.key).lab[0])
    map.set(name, hit.key)
    swaps.push({ name, valueHonest:a.valueHonest, valueHonestL:a.valueHonestL,
                 to:hit.key, toL, deltaE:round2(hit.deltaE),
                 valueShift: round1(toL - a.valueHonestL), changed: hit.key !== name })

snapped = structuredClone(artifact)                     // original never mutated
changedPlacements = 0
for p in snapped.placements:
    to = map.get(normalizeName(p.block))
    if `minecraft:${to}` !== p.block: changedPlacements++
    p.block = `minecraft:${to}`
snapped.palette.manifest = dedupe-first-seen(snapped.placements.map(p=>p.block))
if opts.methodId: snapped.metadata.prompting_method_id = opts.methodId

return { schema, artifact:snapped, swaps,
         manifest: snapped.palette.manifest,
         changedPlacements,
         realizedUsed: clusters.map(c=>({block:c.key, L:round1(c.lab[0])})) }
```

Notes:
- `block` is normalized for lookup but rewritten **namespaced** (`minecraft:<bare>`), matching the
  schema's `blockId` pattern so the snapped artifact still validates.
- Manifest rebuilt from the *rewritten placements* in first-seen order — guaranteed to be exactly the
  value-true blocks actually placed (no stale declared-but-unused ids).
- A name present in the manifest but in no placement still gets a swap row (informational) but cannot
  change a placement — keeps the report complete without affecting the build.

## CREATE `src/color/value-build.test.mjs` (the proof)

`node:test` + `node:assert/strict`, offline/deterministic, auto-collected by `src/**/*.test.mjs`.
Realized palettes are synthetic `[{block,lab}]` built from REAL table rows (so `to` ∈ table is
assertable). Groups:

- **A — basic snap & rewrite:** a 3-placement artifact; 2-block realized palette; assert each
  `placement.block` rewritten to the nearest realized block (namespaced), `manifest` rebuilt &
  deduped, `swaps` one-per-distinct-name, `changedPlacements` correct.
- **B — value-drift cure (the moai case):** anchor a dark neutral (`gray_concrete`) with a realized
  palette whose nearest cluster is lighter → assert `valueShift > 0`, `to` is the lighter block, pin
  the deterministic target.
- **C — imaginary/non-cube name:** placement `minecraft:honey_block` (not in table) → no throw, anchors
  via value-palette, `to` ∈ table, placement rewritten.
- **D — realized input flexibility:** `[{block,lab}]` and an extractor-shaped `{palette:[{block,
  repColor:{lab}}]}` produce deep-equal results.
- **E — determinism & purity:** two calls deep-equal; the **input artifact is unchanged** (deep-equal to
  a pre-call clone); `opts.methodId` stamps `metadata.prompting_method_id` only on the clone.
- **F — errors:** empty realized palette throws; an artifact with no placements/manifest names throws an
  actionable error.
- **G — value-honesty/shape:** every swap row has numeric `toL`/`valueHonestL`, `to` ∈ table; the
  snapped artifact re-validates against the schema (`parseArtifact`/`assertArtifact`).

## CREATE `benchmarks/sculpture/value-match-ab.mjs` (offline A/B — I/O + glue only)

```
args: [runId...]  (default: 001-vConcept-moai, 007-vConcept-a-sword, 013-vConcept-a-pineapple)
for each runId:
    art   = read runs/<id>/artifact.json
    pal   = await extractPaletteFromImage(runs/<id>/concept.png, {k})       // pure, no GL
    snap  = snapArtifactToValueTrue(art, pal, { methodId: VCONCEPT_SCULPTURE_METHOD_ID_V2 })
    write runs/<id>/artifact.value-matched.json
    write runs/<id>/value-swaps.json  + value-swaps.md   (the per-region swap table)
    if GL_AVAILABLE: renderArtifact(snap.artifact, render-3q.value.png, SCULPTURE_VIEW_3Q)
emit benchmarks/sculpture/value-match-ab.md  (side-by-side: .v1 vs .v2 render links + swap tables)
```

Imports: `extractPaletteFromImage` (palette-extract), `snapArtifactToValueTrue` (value-build),
`renderArtifact`/`GL_AVAILABLE` (render-tool), `renderSummary` (src/render-tool), `SCULPTURE_VIEW_3Q`
(sculpture), `VCONCEPT_SCULPTURE_METHOD_ID_V2` (config). No model call.

## MODIFY `src/config.mjs`

Add, next to `VCONCEPT_SCULPTURE_METHOD_ID`:
```
export const VCONCEPT_SCULPTURE_METHOD_ID_V2 = "vconcept-sculpture.v2";
// the value-matched build path (T-041-01/S-041): shares the .v1 build PROMPT (model owns form+where);
// only the post-build engine snap to value-true blocks differs. Single-sourced like the other ids.
```

## MODIFY `src/sculpture.mjs`

- Import `VCONCEPT_SCULPTURE_METHOD_ID_V2` from config.
- Add `export const VCONCEPT_SCULPTURE_V2 = Object.freeze({ id, version:2, label, sharesPromptWith:
  VCONCEPT_SCULPTURE.id })` with a doc comment: the build prompt is identical to `.v1`; the `.v2`
  difference is the engine's post-build value-true snap (so no prompt fork, the `.v1` prompt stays
  byte-identical). **`composeSculptureBuildPrompt` is unchanged.**

## MODIFY `benchmarks/sculpture/run.mjs`

- `parseArgs`: add `--value-match` boolean (default false).
- After the `.v1` artifact is written and `render-3q.png` rendered, **if `args.valueMatch`**: extract
  `concept.png` palette, `snapArtifactToValueTrue(..., {methodId: …_V2})`, write
  `artifact.value-matched.json` + `value-swaps.{json,md}`, render `render-3q.value.png`, and add a
  `valueMatch` block to `summary.json`. All `.v1` outputs unchanged. Lazy-import the pure module at top
  (cheap) and reuse the already-imported `renderArtifact`.

## Files NOT touched

- `cielab.mjs` (imported only — reuse-boundary guard stays green), `value-palette.mjs`,
  `palette-extract.mjs`, `image-grid.mjs`, `block-table.mjs`, the schema, `render/`.

## Ordering of changes

1. `config.mjs` (id) → 2. `value-build.mjs` (module) → 3. `value-build.test.mjs` (tests) →
4. `sculpture.mjs` (descriptor) → 5. `run.mjs` (flag) → 6. `value-match-ab.mjs` (A/B) →
7. run A/B + renders → 8. `npm test`. Commits: one for the module+tests+config, one for the
wiring+A/B+renders (mirrors the project's feat/docs-pair convention).

## Public interface (what S-042 / the runner import)

```
export const VALUE_MATCHED_SCHEMA = "value-matched-build/v1"
export function snapArtifactToValueTrue(artifact, realized, opts?) ->
  { schema, artifact, swaps, manifest, changedPlacements, realizedUsed }
```

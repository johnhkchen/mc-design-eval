# T-096-01 kit-extraction — Structure

## Files created

### 1. `scripts/build-block-vocab.mjs` (build-time tool, ~80 lines)
Mirrors `scripts/build-block-table.mjs`'s role: heavy deps at build time, committed JSON at
runtime. Resolves `minecraft-data` via `createRequire(<repo>/palettes/x.mjs)` (the workspace
that declares it; `palettes/validate.mjs` precedent), loads version pin **1.20.1**, subtracts
the `NON_SURVIVAL` denylist (copied verbatim from `palettes/validate.mjs` with a provenance
comment — that file is a process-exiting CLI and exports nothing), and writes
`src/form/block-vocab.json`:

```json
{ "schema": "block-vocab/v1", "source": "minecraft-data", "minecraftVersion": "1.20.1",
  "count": 977, "blocks": ["acacia_button", "…"] }
```

Sorted names, bare (no `minecraft:`), survival-placeable only. Re-runs are byte-stable.

### 2. `src/form/block-vocab.json` (committed artifact)
Output of #1. The kit's validation vocabulary — full survival set (cubes AND
trapdoors/fences/doors/lanterns), unlike the full-cube-only block→Lab table.

### 3. `src/form/kit.mjs` (PURE core, ~300 lines)
No GL, no network, no Date/random; file reads only via the `loadBlockTable`-style committed-JSON
loader (same idiom as `block-table.mjs`). Imports: `tableKey` (sculptor/material.mjs),
`loadBlockTable` (color/block-table.mjs), `weightedDeltaE, CHROMA_WEIGHT, MIN_CELLS`
(color/value-select.mjs).

Exports (public interface):

- `KIT_SCHEMA = "kit/v1"` — record schema tag.
- `FORM_CLASSES = Object.freeze(["cube", "fixture", "rail"])`
- `CONFIDENCES = Object.freeze(["high", "medium", "low"])`
- `RAIL_NAME_RE` — `/(fence|wall|pane|bars|rail|chain)$/` with `fence_gate` carved out.
- `WHERE_FEATURE_TERMS = Object.freeze(["openings", "trim", "corners-edges", "base"])` — the
  non-band whereUsed vocabulary (matches `PLACEMENT_RULES` feature classes).
- `KIT_VERIFY_DELTA_MAX = 16` — chroma-weighted ΔE gate for the cube value check (flag-only).
- `VOCAB_PATH` / `loadBlockVocab(path = VOCAB_PATH)` → `{ schema, minecraftVersion, names:Set }`.
- `derivedFormClass(block, { table })` → `"cube" | "rail" | "fixture"` — cube iff in the Lab
  table; else rail by `RAIL_NAME_RE`; else fixture. Deterministic ground truth.
- `bandRefsFromZoneRecord(zoneRecord)` → `{ bandNames: string[], promptBands: [{name, yRange,
  role}] }` — reads the committed zone-map/v1 record's `derived.bands` + `roof`, **strips all
  block IDs** (anti-anchoring; roles pass through, blocks do not). Throws on a non-readable or
  wrong-schema record (the kit never re-derives bands — AC #3).
- `buildKitPrompt({ subject, promptBands })` → string — the recognition contract: "this concept
  is voxel art depicting nameable Minecraft blocks; enumerate the kit", the strict-JSON output
  shape (`ingredients[]` / `unidentified[]`), formClass + confidence vocabularies, whereUsed =
  band names + feature terms. Pure and unit-testable (no block IDs can appear — asserted in
  tests by construction of its inputs).
- `parseKit(rawObj, { vocab, table, bandNames })` → `{ kit, unidentified, dropped, stats }` —
  collect-don't-throw (the `parseMaterialMap` idiom). Per entry: bare-name normalize via
  `tableKey`; vocabulary membership (drop `unknown-block`); formClass validate + derived
  cross-check (mismatch ⇒ keep derived, preserve `declaredFormClass`, flag
  `form-class-corrected`); whereUsed refs ∈ bandNames ∪ WHERE_FEATURE_TERMS (unknown ⇒ flag
  `unknown-where-ref`, keep); confidence default `medium` + flag; dedup `(block, role)`.
  `unidentified[]` rows pass through with `fallback: { mode: "color-snap" }` stamped.
- `verifyKitValues(kit, swatches, { table, deltaMax, minCells, chromaWeight })` → new kit array
  with `valueCheck` per entry: `null` reason `non-cube` for fixture/rail; else
  `{ verdict: "verified" | "flagged-mismatch" | "thin-sample" | "no-swatch", deltaE, cells,
  swatchLab, blockLab, flaggedForReview }`. NEVER rewrites `block` (AC #2's hard rule).
- `kitOverrides(kit, zoneDerived)` → `{ overrides: {namedBlock → recognizedBlock}, rows: [{
  bandName, named, recognized, verdict}] }` — for each derived band (+ roof): kit entries that
  are derived-cube, `verified`, and cover that band via whereUsed; the band's `dominantBlock`
  (named space) maps to the kit block. Identity pairs recorded but not emitted as overrides.
- `diffKitVsMap(kit, materialMap)` → `{ corrections, recovered, unchanged }` — corrections =
  map rows whose covering kit entry names a different block (the `white_terracotta` fix made
  visible); recovered = kit entries with no map counterpart (the formerly-dropped fixtures).
- `assertKit(kit)` — non-empty/shape guard (`assertMaterialMap` idiom).

### 4. `src/form/kit.test.mjs` (~250 lines)
Unit tests; runs under `npm run test:unit` glob. Coverage list in plan.md.

### 5. `benchmarks/sculpture/kit-extract.mjs` (IMPURE runner, ~200 lines)
Registry (data only — E-25 Rule 3): cottage + gatehouse `{key, concept, map, zoneMapRecord}`
(paths identical to `durable-skin.mjs` `SUBJECTS`). Per subject:

1. Load zone-map record → `bandRefsFromZoneRecord`; load material map (diff input only — NOT
   prompt input).
2. LIVE: `buildKitPrompt` + concept PNG base64 → `requestTextWithImage({ prompt, images,
   model: MODEL_TIERS.strong })` (sdk-binding; subscription shim; never the metered SDK).
   Reply JSON-extracted (fence-strip, brace-slice — the bridge's idiom), saved verbatim to
   `kit/<subj>.raw.json`. `--offline`: skip the call, read the committed raw (E-24 Rule 2).
3. `parseKit` → `decodeImage(concept)` + `gridFromPixels({whitelist: cube blocks,
   n: SAMPLE_GRID_N, dropColor: estimateBorderColor, cellMeans: true})` +
   `sampleRoleSwatches` → `verifyKitValues`.
4. `kitOverrides(kit, zoneRecord.derived)` + `diffKitVsMap(kit, matMap.map)`.
5. Write `kit/<subj>.json` (schema kit/v1: `generatedFrom`, `params` {model, n, deltaMax,
   chromaWeight, minCells}, `kit`, `unidentified`, `dropped`, `overrides`, `diff`, `stats`,
   `flags` rollup) + human-reviewable `kit/<subj>.md` (one line per entry: block, formClass,
   whereUsed, confidence, value verdict, rationale — the line-by-line check against the
   picture).

Flags: `--offline`, `--subject=<key>`. stderr summary like material-map.mjs.

### 6. `benchmarks/sculpture/kit/` — committed `{cottage,gatehouse}.{json,raw.json,md}`.

## Files modified

### 7. `benchmarks/sculpture/durable-skin.mjs` (~25 lines)
- `SUBJECTS.*.kitRecord: "kit/<subj>.json"` (data).
- `buildSkin`: after the value-true substitution and the derived zone map are settled, if
  `def.kitRecord` exists on disk: load, take `record.overrides` (only verified-cube,
  band-covering pairs by construction), build `subK = (b) => kitOv[b] ?? substitution[b] ?? b`,
  use `subK` at the existing `mapPolicy`/`applySubstitution` renaming point; record
  `zoneMap.kit = { source: def.kitRecord, overrides }`. No kit file ⇒ byte-identical behavior.
  The value-select and zone-map agreement assertions are untouched (they compare the snap
  substitution and named-space bands respectively — both computed before kit composition).

### 8. `package.json`
- `"kit:extract": "node benchmarks/sculpture/kit-extract.mjs"`.

## Module boundaries

- `src/form/kit.mjs` is the ONLY consumer of `block-vocab.json`; it imports color metrics from
  `value-select.mjs` (one metric owner, no re-implementation) and never imports sdk-binding
  (purity). The runner is the only LIVE leaf. `band-profile.mjs` is untouched — the kit consumes
  its *committed output*, preserving "one concept-reading seam".
- `cielab.mjs` reuse-boundary is unaffected (no new imports there).

## Ordering

1. Vocab builder + committed JSON (everything validates against it).
2. Pure core parse/validate (+ tests) — no verification yet.
3. Verification + overrides + diff (+ tests).
4. Runner (offline path testable immediately; live path is step 5).
5. Live extraction: cottage, then gatehouse; commit records.
6. durable-skin wiring; full `npm test`.
Each step commits atomically.

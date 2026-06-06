# Structure — T-082-01 right-sized-model-routing

File-level blueprint. Five new source files (3 modules + 2 test files... actually 3 modules each with a
test), one config edit, one runner, one package.json edit, plus the generated docs. Shapes only.

## Created / modified files

### `src/config.mjs` (MODIFIED — add the tier table)

```js
// after PHASE1_MODEL_ID:
export const MODEL_TIERS = Object.freeze({
  light: "claude-haiku-4-5",   // narrow single-view detectors / classification
  strong: PHASE1_MODEL_ID,     // the pinned default — cross-view judgement / authoring
});
export const DEFAULT_TIER = "strong";
```

Rationale block in the jsdoc: light = Haiku (rolling alias, mirrors the dateless opus id); strong
aliases the single-sourced pin so a Phase-2 sweep stays one edit. Pure data — no new imports.

### `src/model-tier.mjs` (NEW — the seam)

Imports: `MODEL_TIERS` from `./config.mjs`; `requestText, requestTextWithImage` from `./sdk-binding.mjs`.
**No SDK import, no `ANTHROPIC_API_KEY`** (the invariant the source-guard test pins).

Public surface:
- `resolveTier(tier)` → model id. Throws on an unknown tier (lists valid keys).
- `SHIM_INVOKERS = { text: requestText, image: requestTextWithImage }` — the allowed subscription-shim
  entry points (exported so the behavioural test can assert the default is one of them).
- `async runTieredOp({ tier, prompt, images, system, onMessage, invoke })` → `{ text, raw, tier,
  model }`. Resolves `tier`→`model`; picks `invoke` (default: image vs text shim by `images?.length`);
  calls it with `{ prompt, images, model, system, onMessage }`. The seam never builds a client.
- `OP_ROUTING` — frozen `[{ op, tier, rationale }]`: the two detectors (light) + the two contrast ops
  (`seal-authoring`, `material-zoning` → strong) the rubric names.
- `ROUTING_RUBRIC` — frozen `{ light, strong }` one-line rules.
- `routingTableMarkdown()` — pure: render `OP_ROUTING` + `ROUTING_RUBRIC` to the scoping-rationale
  markdown body (the runner writes it to disk; keeping the render here keeps doc⇄code in lockstep and
  testable).

### `src/model-tier.test.mjs` (NEW)

- `resolveTier` maps light→Haiku id, strong→`PHASE1_MODEL_ID`; throws on `"medium"`/unknown.
- `runTieredOp` with a spy invoker: spy receives `model === resolveTier(tier)`, returns `{text,raw}`,
  and the result echoes `{tier, model}`. Image vs text default selection (spy via explicit `invoke`).
- Default invoker is one of `SHIM_INVOKERS` (subscription path), not the SDK.
- `OP_ROUTING` integrity: every `tier` ∈ keys(`MODEL_TIERS`); every `rationale` non-empty; both
  detectors present and `light`.
- **Source guard (the no-API-key AC):** read `model-tier.mjs`, `view/roof-patch.mjs`,
  `view/hollowable-mass.mjs` as text; assert none contains `ANTHROPIC_API_KEY` or
  `@anthropic-ai/claude-agent-sdk`.
- `routingTableMarkdown()` contains each op name + the rubric words "light"/"strong".

### `src/view/roof-patch.mjs` (NEW — detector, pure core)

Imports: `roofRegion` (used by the runner, not here), `stripToJson` from `../sdk-binding.mjs`,
`bareBlock` from `./occupancy.mjs`. Tier constant from this module.

- `export const TIER = "light";`
- `export const ROOF_PATCH_SCHEMA = "roof-patch/v1";`
- `roofCandidates(roofRegion)` → `{ dominant, stray:[{x,z,block}], holeCount, area, coverage }`. PURE
  geometric prior (dominant = max blockCount over `roofRegion.cells`; stray = block ≠ dominant;
  holeCount = `round(area*(1-coverage))`).
- `buildRoofPatchPrompt(roofRegion, candidates)` → string. Fixed wording; lists dominant material,
  coverage, candidate strays + hole count; asks for a strict JSON object, seeing the top render.
- `parseRoofPatch(text)` → `{ schema, patches:[{x,z,issue,note}] }`. `stripToJson`→`JSON.parse`;
  validate each row has integer x,z and `issue ∈ ISSUES`; drop malformed; throw only on non-JSON.
- `export const ISSUES = Object.freeze(["stray-material","hole","wrong-tone"]);`

### `src/view/roof-patch.test.mjs` (NEW)

Synthetic `roofRegion`: a 3×3 roof, 8 dominant + 1 stray + coverage 0.889 (1 hole). Assert
`roofCandidates` finds dominant, the 1 stray, holeCount 1. `buildRoofPatchPrompt` mentions the dominant
block + "JSON". `parseRoofPatch` handles a fenced object, prose-wrapped object, drops a row with a bad
`issue`, throws on `"not json"`.

### `src/view/hollowable-mass.mjs` (NEW — detector, pure core)

Imports: `stripToJson` from `../sdk-binding.mjs`; `footprint, storeyBands, wallFields` consumed via the
runner (the prior takes `occ` + a precomputed read). Tier constant.

- `export const TIER = "light";`
- `export const HOLLOWABLE_SCHEMA = "hollowable-mass/v1";`
- `hollowableCore(occ)` → `{ enclosed, perBand:[{yStart,yEnd,enclosed}], skinHoles }`. PURE: a voxel is
  enclosed iff all 6 ortho neighbours are occupied; group counts by `storeyBands` band; `skinHoles` =
  Σ face `holes.length` from `wallFields`.
- `buildHollowablePrompt(read, core)` → string. Footprint dims, bands, enclosed-core per band, skin-hole
  count; asks for strict JSON, flags blockers, seeing the 3/4 render.
- `parseHollowable(text)` → `{ schema, hollowable, regions:[{yStart,yEnd,inset,note}], blockers:[str] }`.
- `SEAL_BEFORE_HOLLOW` note constant — the T-080-01 handoff invariant (any blocker ⇒ seal first).

### `src/view/hollowable-mass.test.mjs` (NEW)

Synthetic occupancy: a 3×3×3 solid cube → exactly 1 enclosed voxel; a cube with one face hole →
`skinHoles ≥ 1`. `buildHollowablePrompt` mentions footprint + "blockers". `parseHollowable` parses a
well-formed object, defaults `blockers` to `[]`, throws on non-JSON.

### `benchmarks/sculpture/detector-routing.mjs` (NEW — the metered runner)

Mirrors `view-layer-proof.mjs`. Loads the cottage → `artifactOccupancy` → `structuralRead` →
`renderViews(['top','threeQuarter'])` (E-22 lens) → for each detector: build prompt from the prior +
read, load the same-angle render as a Buffer, `runTieredOp({tier, prompt, images, invoke:
requestTextWithImage})`, parse. Writes `detector-routing-report.json` + `scoping-rationale.md`
(`routingTableMarkdown()`) to `docs/active/work/T-082-01/`. `import.meta`-guarded `main()`.

### `package.json` (MODIFIED)

Add `"detect:routing": "node benchmarks/sculpture/detector-routing.mjs"` after `view:proof`.

## Ordering of changes

1. `config.mjs` tier table (everything resolves against it).
2. `src/model-tier.mjs` + test (the seam; independent of detectors).
3. `src/view/roof-patch.mjs` + test.
4. `src/view/hollowable-mass.mjs` + test.
5. `benchmarks/sculpture/detector-routing.mjs` + `package.json` script.
6. Run `npm test` (pure cores green); run `npm run detect:routing` (live, metered) → reports +
   `scoping-rationale.md`.

## Module-boundary summary

- **Pure / unit-tested:** `config` (data), `model-tier` (resolve/route via DI + table + md render),
  both detector cores (prior + prompt + parser).
- **Impure / metered (not unit-tested, by spec §4):** `requestText*` (pre-existing) and the runner.
- **Invariant enforced in code:** `model-tier` + detector sources import neither the SDK package nor
  the API key; the seam reaches a model only through the `claude -p` shim's `model` param.
</content>

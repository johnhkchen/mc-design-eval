# Progress — T-082-01 right-sized-model-routing

## Status: COMPLETE — all 5 plan steps done, `npm test` green (896), live run done.

## Steps

- [x] **Step 1 — tier table in config.** `MODEL_TIERS = { light: "claude-haiku-4-5", strong:
      PHASE1_MODEL_ID }` + `DEFAULT_TIER` in `src/config.mjs`. Invariant documented in the jsdoc.
- [x] **Step 2 — the tier seam.** `src/model-tier.mjs`: `resolveTier`, `runTieredOp` (DI invoker),
      `SHIM_INVOKERS`, `OP_ROUTING`, `ROUTING_RUBRIC`, `routingTableMarkdown()`. `model-tier.test.mjs`
      covers resolve/throw, DI routing, default-invoker-is-the-shim, OP_ROUTING integrity, the
      no-API-key source guard, and the md render.
- [x] **Step 3 — roof-patch detector.** `src/view/roof-patch.mjs` (`roofCandidates`,
      `buildRoofPatchPrompt`, `parseRoofPatch`, `TIER="light"`) + tests.
- [x] **Step 4 — hollowable-mass detector.** `src/view/hollowable-mass.mjs` (`hollowableCore`,
      `buildHollowablePrompt`, `parseHollowable`, `SEAL_BEFORE_HOLLOW`, `TIER="light"`) + tests.
- [x] **Step 5 — live metered runner + npm script.** `benchmarks/sculpture/detector-routing.mjs` +
      `detect:routing`. Ran live on the cottage; both detectors executed on `claude-haiku-4-5`.

## Deviation from plan (documented)

- **Added `src/view/json-reply.mjs` (`parseJsonReply` + `firstBalancedObject`).** The first live run
  exposed a gap: the light tier returned a valid object inside a code fence **followed by prose**
  (`` ```json\n{…}\n```\n\nLooking at… ``). `stripToJson` strips a leading/trailing fence but, when the
  leftover starts with `{`, returns the tail unsliced → `JSON.parse` fails on the trailing prose. The
  fix is a string-aware balanced-brace fallback, shared by both parsers (and future detectors), with
  its own unit tests + a regression test capturing the exact live shape. Both parsers now route through
  it; behaviour on clean/fenced/prose JSON is unchanged. Re-ran the live runner → both parse cleanly.

## Live run result (metered, `claude-haiku-4-5`, cottage)

- Cottage: 6429 voxels, dims 26×27×32.
- Roof prior: dominant `spruce_planks`, 62 strays, ~172 hole cells (coverage 0.793).
- Hollow prior: 1100 enclosed (carveable) cells, 8 skin holes, 7 storey bands.
- **roof-patch-detector** (light): 17 patches returned; usage ~4205 output tokens, ~$0.040.
- **hollowable-mass-detector** (light): `hollowable=false`, 1 blocker ("8 skin holes … seal before
  hollow") — correctly feeds T-080-01's seal-before-hollow. usage ~774 output tokens, ~$0.022.
- Artifacts: `detector-routing-report.json`, `scoping-rationale.md`, `view-top.png`,
  `view-threeQuarter.png`.

## Verification

- `npm test` → 896 pass / 0 fail.
- Report records `tier:"light"`, `model:"claude-haiku-4-5"` + a `total_cost_usd` (metered) for both
  ops — proving the light tier ran and the path is the subscription shim.
- Source-guard test confirms neither the seam nor the detectors read the API key / import the SDK.
</content>

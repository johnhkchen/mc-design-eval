# Plan — T-082-01 right-sized-model-routing

Ordered, independently-verifiable steps. Each pure-core step ends green under `npm test`; the live
metered step is verified by a documented round-trip (spec §4 — live calls are not unit-tested).

## Step 1 — Tier table in config (`src/config.mjs`)

- Add `MODEL_TIERS = Object.freeze({ light: "claude-haiku-4-5", strong: PHASE1_MODEL_ID })` and
  `DEFAULT_TIER = "strong"`, with a jsdoc that states the invariant (subscription `--model`, never the
  API key) and that `strong` aliases the single-sourced pin.
- **Verify:** `node -e "import('./src/config.mjs').then(m=>console.log(m.MODEL_TIERS))"` prints both
  ids; `npm test` still green.
- Commit: `feat(E-23 T-082-01): model tier table in config`.

## Step 2 — The tier seam (`src/model-tier.mjs` + test)

- Implement `resolveTier`, `SHIM_INVOKERS`, `runTieredOp` (DI invoker), `OP_ROUTING`,
  `ROUTING_RUBRIC`, `routingTableMarkdown()`. Import only `config.mjs` + `sdk-binding.mjs`.
- Write `src/model-tier.test.mjs`: resolve mapping + throw; `runTieredOp` routes `model` to a spy and
  echoes `{tier,model}`; default invoker ∈ `SHIM_INVOKERS`; `OP_ROUTING` integrity; **source-guard**
  (no `ANTHROPIC_API_KEY` / no SDK import in `model-tier.mjs` — detector files added in their steps);
  `routingTableMarkdown()` content.
- **Verify:** `npm run test:unit` green; the source-guard test fails if the SDK is imported.
- Commit: `feat(E-23 T-082-01): per-op model-tier seam over the subscription shim`.

## Step 3 — Roof-patch detector (`src/view/roof-patch.mjs` + test)

- Implement `TIER`, `ROOF_PATCH_SCHEMA`, `ISSUES`, `roofCandidates`, `buildRoofPatchPrompt`,
  `parseRoofPatch`. Import `stripToJson` + `bareBlock` only.
- Test with a synthetic 3×3 roofRegion (8 dominant, 1 stray, 1 hole): candidate extraction, prompt
  mentions dominant + "JSON", parser handles fenced/prose/bad-row/non-JSON.
- **Verify:** `npm run test:unit` green.
- Commit: `feat(E-23 T-082-01): light-tier roof-patch detector (pure core + tests)`.

## Step 4 — Hollowable-mass detector (`src/view/hollowable-mass.mjs` + test)

- Implement `TIER`, `HOLLOWABLE_SCHEMA`, `SEAL_BEFORE_HOLLOW`, `hollowableCore`,
  `buildHollowablePrompt`, `parseHollowable`. Import `stripToJson` + structural-read helpers as needed
  (or take a precomputed `read`).
- Test with a synthetic solid 3×3×3 cube (1 enclosed voxel) and a holed cube (`skinHoles ≥ 1`):
  prior counts, prompt mentions footprint + "blockers", parser well-formed/defaults/non-JSON.
- **Verify:** `npm run test:unit` green; extend the Step-2 source-guard to cover both detector files.
- Commit: `feat(E-23 T-082-01): light-tier hollowable-mass detector (pure core + tests)`.

## Step 5 — Live metered runner + npm script

- `benchmarks/sculpture/detector-routing.mjs`: load cottage → occupancy → structuralRead →
  `renderViews(['top','threeQuarter'])` → run both detectors via `runTieredOp({tier:'light', …,
  invoke: requestTextWithImage})` on the same-angle render Buffers → parse → write
  `detector-routing-report.json` (per-op: tier, model, prior summary, parsed result, raw token usage
  from `raw.usage`) + `scoping-rationale.md` (`routingTableMarkdown()`).
- Add `package.json` script `detect:routing`.
- **Verify (live, metered):** `npm run detect:routing` produces both reports; the report records
  `model` = the Haiku id for each op (proving the light tier was used) and the runner imported only the
  `claude -p` shim. Capture the run summary in `progress.md`.
- Commit: `feat(E-23 T-082-01): live cottage detector routing runner + scoping rationale`.

## Testing strategy

- **Unit (the AC's "tier-selection + detector parse logic unit-tested"):** Steps 2–4 cover tier
  resolution, DI routing, `OP_ROUTING` integrity, the no-API-key source guard, and both parsers
  (fenced / prose-wrapped / malformed-row / non-JSON) + geometric priors. All run under
  `src/**/*.test.mjs`.
- **Integration / live (metered, not in `npm test`):** Step 5's `detect:routing` on the cottage — the
  documented round-trip proving both detectors run on the light tier over a real view, per spec §4.
- **Verification criteria:**
  - `npm test` green (existing ~816 + the new pure-core tests).
  - The no-API-key invariant holds (source guard passes; runner uses `requestTextWithImage`).
  - `detect:routing` report shows `tier:"light"`, `model:<haiku id>` for both detectors, with a parsed
    (schema-tagged) result and the cottage's geometric prior.
  - `scoping-rationale.md` records both detectors + the strong-tier contrast ops + the rubric.

## Risks / mitigations

- **Light model returns prose, not JSON.** `parse*` uses `stripToJson` (handles fences/brackets) and
  drops malformed rows; the runner logs the raw text on a parse throw rather than failing hard.
- **Haiku id alias drift.** Single-sourced in `config.MODEL_TIERS`; a Phase-2 sweep is one edit. If the
  CLI rejects the alias, swap to the dated id in one place.
- **GL unavailable in some envs.** The runner is metered/GL and excluded from `npm test`; the pure
  cores carry the unit coverage. Matches `view:proof`'s posture.
</content>

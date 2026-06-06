# Review — T-082-01 right-sized-model-routing

Handoff for a human reviewer. What changed, how it's tested, what to watch.

## What this delivers

A **per-op model-tier seam** over the `claude -p` subscription shim and **two light-tier exemplar
detectors** (roof-patch, hollowable-mass) scoped to T-078-01 views, run live on the cottage on Haiku.
This is where the project first does real multi-model agentic engineering: scope a task to one view,
let a small model handle it, escalate only judgement that needs it.

## Files

### Created
- `src/model-tier.mjs` — the seam. `resolveTier(tier)` → model id; `runTieredOp({tier, …, invoke})`
  resolves the tier and calls the (DI-able) subscription invoker with the matching `--model`;
  `SHIM_INVOKERS` (the allowed `claude -p` functions); `OP_ROUTING` + `ROUTING_RUBRIC` (the recorded
  rationale, single-sourced); `routingTableMarkdown()` (renders the scoping doc from the table).
- `src/model-tier.test.mjs` — resolve/throw, DI routing, default-invoker-is-the-shim, OP_ROUTING
  integrity, the **no-API-key source guard**, md render.
- `src/view/roof-patch.mjs` (+ test) — `roofCandidates` (pure prior: dominant block, strays, hole
  count), `buildRoofPatchPrompt`, `parseRoofPatch`. `TIER="light"`.
- `src/view/hollowable-mass.mjs` (+ test) — `hollowableCore` (pure prior: enclosed voxels per band +
  skin-hole count), `buildHollowablePrompt`, `parseHollowable`, `SEAL_BEFORE_HOLLOW`. `TIER="light"`.
- `src/view/json-reply.mjs` (+ test) — `parseJsonReply` / `firstBalancedObject`: robust reply parsing
  (added after the live run; see Deviation).
- `benchmarks/sculpture/detector-routing.mjs` — the metered runner (cottage → read → render → two
  light-tier ops → report + scoping doc).
- `docs/active/work/T-082-01/{research,design,structure,plan,progress,review}.md`,
  `scoping-rationale.md`, `detector-routing-report.json`, `view-top.png`, `view-threeQuarter.png`.

### Modified
- `src/config.mjs` — `MODEL_TIERS = { light: "claude-haiku-4-5", strong: PHASE1_MODEL_ID }`,
  `DEFAULT_TIER`. Pure data, no new imports.
- `package.json` — `detect:routing` script.

## Acceptance criteria

- **AC #1 — per-op tier seam over the shim; tier IDs in config; API key not on this path.** ✅
  `MODEL_TIERS` single-sources the ids (`strong` aliases the pin). `runTieredOp` reaches a model only
  via `sdk-binding`'s `requestText*` (`--model` override). Two tests pin the invariant: a **source
  guard** (seam + both detectors contain no `ANTHROPIC_API_KEY`, no SDK import) and a **behavioural**
  check (default invoker IS `requestText`/`requestTextWithImage`, the subscription functions).
- **AC #2 — two light-tier detectors scoped to a view, run live on the cottage.** ✅ roof-patch (roof
  view) and hollowable-mass (massing) both executed on `claude-haiku-4-5` — see
  `detector-routing-report.json` (`model:"claude-haiku-4-5"`, a `total_cost_usd` per op = metered).
- **AC #3 — scoping rationale per op + rubric.** ✅ `OP_ROUTING` (machine-readable, tested) +
  `ROUTING_RUBRIC`, rendered to `scoping-rationale.md`. Records both detectors (light) and two contrast
  ops (seal-authoring, material-zoning → strong) as worked examples of the boundary.
- **AC #4 — tier-selection + parse logic unit-tested; live calls metered; `npm test` green.** ✅ 896
  tests pass (was ~816). Live calls carry usage/cost. Pure cores fully covered.

## Test coverage

- **Strong:** tier resolution (+ unknown throw), DI routing, OP_ROUTING integrity, the no-API-key
  guard, both detectors' geometric priors (synthetic occupancy), both parsers across clean / fenced /
  prose / **fence-then-prose** / malformed-row / non-JSON, and the balanced-brace extractor (incl.
  string-aware brace counting).
- **Gaps (by design, spec §4):** the live `requestText*` spawn and the runner are not unit-tested
  (metered/GL) — covered by the documented `detect:routing` round-trip instead. The detector PROMPTS'
  effectiveness is judged by the live output, not asserted.

## Deviation from plan

Added `src/view/json-reply.mjs`. The first live run returned a valid object in a code fence **followed
by prose**, which `stripToJson` leaves unsliced (it starts with `{`, so the trailing-junk branch never
fires) → parse failure. Fixed with a shared string-aware balanced-brace fallback + regression tests;
both parsers route through it. Clean/fenced/prose behaviour unchanged. Documented in `progress.md`.

## Open concerns / notes for the reviewer

- **Haiku alias.** `light = "claude-haiku-4-5"` is the dateless rolling alias (mirrors the opus id
  style). The CLI accepted it live. If a Phase-2 pin needs a dated id, it's a one-line edit in
  `config.MODEL_TIERS`.
- **Roof-patch returned 17 patches** on a roof whose geometry flagged 62 strays + ~172 hole cells —
  the light model triaged the candidate set rather than echoing it (the intended behaviour), but the
  *precision* of those 17 is not gated here; S-079/S-084 own acting on them. The detector is a
  read-side signal, not a verdict.
- **Hollowable-mass correctly returned `hollowable=false`** with the 8-skin-hole blocker — the exact
  seal-before-hollow signal T-080-01 consumes. The 8 skin holes are real (the cottage shell is not yet
  watertight); sealing them is S-084's strong-tier job, as the rubric records.
- **Cost note:** roof-patch spent ~4205 output tokens (~$0.04) vs hollowable's ~774 — the roof prompt
  invites per-cell reasoning; if cost matters, the prompt could cap the patch count. Not blocking.
- **`input_tokens: 10`** in the usage echo looks low because the image tokens ride in a separate usage
  field on the image turn; the cost figure is the reliable metered signal.

## Suggested verification by a reviewer

`npm test` (896 green) → skim `scoping-rationale.md` + `detector-routing-report.json` (confirm
`model:"claude-haiku-4-5"` on both ops) → optionally re-run `npm run detect:routing` (metered).
</content>

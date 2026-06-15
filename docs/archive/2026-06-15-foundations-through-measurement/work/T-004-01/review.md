# Review — T-004-01 agent-sdk-trial-runner

Handoff document. What changed, how it's tested, and the open concerns a human
reviewer needs — without reading every diff. All four ACs are wired; `npm test`
is green at **54 tests** (44 prior + 10 new); five atomic commits
(`d6abe5e`…`ed368dd`).

## What changed

| File | Action | Summary |
|------|--------|---------|
| `src/config.mjs` | created | Single source of harness config: `PHASE1_MODEL_ID`, `DEFAULT_PROMPTING_METHOD_ID`, frozen `SAFE_TRIAL_OPTIONS`, `FORBIDDEN_TOOLS`. |
| `src/sdk-binding.mjs` | modified | `requestDesignArtifact` gained an optional `onMessage(message)` hook (fired per yielded message, before result-selection). Purely additive. |
| `src/trial.mjs` | created | The runner: pure `tallyUsage` / `serializeTranscript` / `buildTrialRecord` / `assertSafeOptions`, plus the live `runTrial`. |
| `src/trial.test.mjs` | created | 10 unit cases over mock SDK objects — pure core only, no live call. |
| `scripts/run-trial.mjs` | created | Thin CLI for one live, metered trial. `process.exit(0)`. |
| `package.json` | modified | Added `"trial:run"` (deliberately **not** in `test`). |
| `.gitignore` | modified | Ignores the generated `trials/` store. |
| `src/README.md` | modified | New "Trial runner (T-004-01)" section. |

No files deleted. `src/expand.mjs`, `src/artifact.mjs`, `render/**`, the schema,
and the fixtures are untouched.

## How the acceptance criteria are met

1. **Trial runs through the SDK package, model pinned by a single-sourced id.**
   `runTrial` calls `requestDesignArtifact({ model: model ?? PHASE1_MODEL_ID })`;
   `PHASE1_MODEL_ID` lives in `config.mjs` alone (the `render/src/version.mjs`
   idiom). Phase 2 sweeps by overriding the constant or passing `model`.
2. **Consumes structured output via the T-001-03 binding.** `trial.mjs` imports
   `requestDesignArtifact` and never imports the SDK directly — the binding stays
   the single live seam. The `onMessage` hook is how the runner observes the
   stream without forking that seam.
3. **Full transcript + per-turn input/output tokens, keyed by §5 metadata.** Per
   trial, `trials/<trial_id>/` holds `transcript.jsonl` (every SDK message, one per
   line), `artifact.json`, and `trial.json` — the record carrying `tallyUsage`'s
   per-`assistant`-turn input/output (+ cache) **and** the SDK's billed aggregate
   totals, keyed off `artifact.metadata.trial_id`.
4. **No code-execution path.** `SAFE_TRIAL_OPTIONS` (`allowedTools:[]`,
   `permissionMode:"dontAsk"`, shells in `disallowedTools`) is the default;
   `assertSafeOptions` runs on the **merged** options before any live call and
   throws on any forbidden tool, `bypassPermissions`, or
   `allowDangerouslySkipPermissions`. Enforced, not merely defaulted.

## Test coverage

The pure core is fully unit-tested (`src/trial.test.mjs`, `node:test`):
- `tallyUsage`: per-turn ordering & field mapping, non-assistant messages skipped,
  missing usage coerced to 0, totals sourced from the result (not the turn sum),
  empty-input tolerance.
- `serializeTranscript`: one JSON line per message, trailing newline, round-trips.
- `buildTrialRecord`: identity pulled from the artifact, status from result
  subtype (success + an error subtype), `finished_at` passthrough.
- `assertSafeOptions`: passes `SAFE_TRIAL_OPTIONS`; throws on `Bash`/`Task` in
  `allowedTools`, on `bypassPermissions`, and on `allowDangerouslySkipPermissions`.

Regression: the 44 prior tests (expand + artifact + sdk-binding) stay green — the
binding change is additive and no `onMessage`-free caller is affected.

### Coverage gaps (by design)
- **`runTrial` is not unit-tested.** It is the live, metered leg (spec §4: Agent
  SDK bills at full API rates) and must not run in CI. Mitigation: every piece of
  its logic that *can* be tested offline is factored into the pure core and is
  tested there; `runTrial` is only thin glue + three `writeFileSync` calls. Its
  file I/O and the message-collector wiring are unverified by automation.

## Open concerns / handoff

1. **Live smoke test owed (no blocker).** Confirm the end-to-end metered path by
   running `npm run trial:run` once with credentials and the optional SDK
   installed. This is the only check of: that `outputFormat` actually constrains
   this model id, that `permissionMode:"dontAsk"` doesn't reject the structured-
   output turn itself, that `msg.message.usage` is populated as `sdk.d.ts` types
   suggest, and that `result.usage`/`modelUsage` arrive as expected. Until then,
   per-turn token capture is verified only against mocks, not a real transcript.
2. **SDK field-name risk (low).** `tallyUsage` reads `msg.message.usage` and
   `result.usage`/`modelUsage`/`total_cost_usd` — verified against installed
   `0.3.162` `sdk.d.ts`, not a live run. All numeric reads coerce missing to 0, so
   a partial/renamed field degrades to a 0 rather than crashing; a rename is a
   one-spot fix in `tallyUsage`. The live smoke test (#1) is what would catch it.
3. **`permissionMode:"dontAsk"` interaction (verify in #1).** Chosen so a headless
   trial never hangs on a prompt while still denying tools. If a future archetype
   needs the render tool (§4), add it to `allowedTools` as `mcp__render__*` —
   `assertSafeOptions` permits MCP tools and blocks only the named shells, so that
   extension won't trip the guard. Confirm the structured-output-only turn isn't
   itself treated as a denied "tool" under `dontAsk` during #1.
4. **Per-turn vs billed totals are intentionally both logged and may differ.**
   `totals` come from the result's billed aggregate; the per-turn sum can diverge
   (cache, retries). Downstream cost analysis (§9 quality-per-token) should use
   `totals` for spend and `turns` for shape — documented in `trial.mjs` and tested,
   but worth a reviewer's eye so it isn't "reconciled" away later.
5. **Scope deliberately excluded.** No render/export/score legs (E-02/E-04), no
   multi-shot/multimodal archetypes (§7), no scoring spine — those consume this
   record downstream. This is the single-shot skeleton (spec §11 step 5).

## Verdict

The harness skeleton is complete and the pure core is well-covered. The one
material gap is the unavoidable absence of a live integration run in CI; concern
#1 is the single human action that closes it. Recommend merging with the live
smoke test tracked as the immediate follow-up before the §7 archetype tickets
build on this runner.

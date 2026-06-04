# Research — T-004-01 agent-sdk-trial-runner

Descriptive map of the terrain this ticket touches. What exists, where, how it
connects, and the constraints that shape the design. No solutions here.

## What the ticket asks for

Epic E-03, spec §4. Build the **harness skeleton on the Claude Agent SDK package**
(the Node package, not `claude -p`): a managed session that runs one trial, the
Phase-1 model pinned by a **single-sourced config ID** (so Phase 2 can sweep it),
**structured-output consumption via the T-001-03 binding**, and **per-trial
transcript + token logging** built from the SDK's native message objects. The
`allow_insecure_coding` / LLM-writes-and-runs-code path is **explicitly out of
scope** (spec §3, Mindcraft row). Acceptance criteria:

1. A trial runs through the Agent SDK package with the model pinned by a
   single-sourced config ID.
2. The runner consumes structured-output artifacts via the T-001-03 binding.
3. Full transcript and per-turn token usage (input vs output) are logged per
   trial, keyed by §5 metadata.
4. No `allow_insecure_coding` / code-execution path is enabled.

This is spec §11 build-step 5 in miniature — "implement the Agent SDK harness with
one archetype (single-shot) building one target (house) end-to-end" — minus the
export/render/score legs, which are other epics. It is the harness *skeleton*: a
trial that goes prompt → validated artifact → logged transcript + token counts.

## The binding this builds on (T-001-03, done)

`src/sdk-binding.mjs` is the dependency (`depends_on: [T-001-03]`) and the only
module in the repo that imports the SDK. Its public surface:

- `designArtifactOutputFormat() → { type:"json_schema", schema }` — the AC #1
  binding object, schema = `toModelSchema()` (discriminator/`$schema`/`$id`
  stripped). Spread into `query({ options: { outputFormat } })`.
- `extractArtifact(result) → ParseResult` — pulls the structured payload off an
  SDK terminal `result` message (`structured_output`, falling back to `result`
  text) and re-validates through `parseArtifact` (defense in depth).
- `requestDesignArtifact({ prompt, model, options }) → { artifact, raw }` — the
  **one live, metered** call. Dynamically imports `@anthropic-ai/claude-agent-sdk`
  (an `optionalDependency`; clear error if absent), iterates `query()`, keeps
  **only** the terminal `result` message, checks `subtype === "success"`, then
  `extractArtifact` + re-validate. **Not exercised by `npm test`** (spec §4:
  metered at full API rates).

Key seam constraint: `requestDesignArtifact` today iterates every message in the
`query()` async generator but **discards all but the `result`**. AC #3 needs the
*full* stream (for the transcript) and the *per-turn* assistant usage. So either
the runner re-iterates `query()` itself (a second live SDK seam — against
T-001-03's whole "single isolated live call" intent) or the binding must surface
the intermediate messages. This is the central design tension (see design.md).

## The §5 metadata contract (the logging key)

`schema/design-artifact.schema.json` `$defs.metadata` (also `artifact.mjs`
`@typedef Metadata`) is the join key for the whole instrument:

- `trial_id` — join key for scores/renders/ratings (the per-trial record key).
- `prompting_method_id` — named, versioned archetype (spec §7), e.g.
  `single-shot.v1`.
- `model_id` — pinned model id.
- `seed`, `server_state_id` — reproducibility fields.
- `target` (`house`|`path`|`landscape`, optional), `created_at` (optional).

The committed fixture `schema/examples/valid-industrial-house.json` carries a
fully-populated metadata block (`trial_id: phase1-house-singleshot-0001`,
`model_id: claude-opus-4-8`, `prompting_method_id: single-shot.v1`, …). Spec §9:
"Log the full Agent SDK transcript per trial alongside the artifact, scores, and
token counts, **keyed by the §5 metadata**." Note the artifact *itself* embeds
metadata; the trial record must agree with it (single source — see constraints).

## What the SDK message objects expose (verified against the installed pkg)

`@anthropic-ai/claude-agent-sdk@0.3.162` is installed; `sdk.d.ts` is the ground
truth (not docs). Relevant shapes:

- `SDKMessage` is a large union; `query()` yields it. The ones we care about:
  - `SDKAssistantMessage`: `{ type:"assistant", message: BetaMessage, … }`. The
    nested `message.usage` carries the **per-turn** `input_tokens`,
    `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`
    (Anthropic `BetaUsage`). This is the per-turn input-vs-output source (AC #3).
  - `SDKResultSuccess`: `{ type:"result", subtype:"success", result, usage:
    NonNullableUsage, modelUsage: Record<string,ModelUsage>, total_cost_usd,
    num_turns, duration_ms, structured_output?, … }`. `usage` is the **aggregate**
    token tally; `modelUsage[modelId]` gives `{ inputTokens, outputTokens,
    cacheReadInputTokens, cacheCreationInputTokens, costUSD, … }` per model.
  - `SDKResultError`: same minus `result`/`structured_output`, with `errors[]`
    and `subtype` ∈ `error_during_execution|error_max_turns|error_max_budget_usd|
    error_max_structured_output_retries`.
- **Options** (`sdk.d.ts` `Options`): `outputFormat?: OutputFormat` (=
  `JsonSchemaOutputFormat`), `allowedTools?: string[]`, `disallowedTools?:
  string[]`, `permissionMode?: PermissionMode` (`default|acceptEdits|
  bypassPermissions|plan|dontAsk|auto`), `maxTurns?: number`. There is **no**
  `allow_insecure_coding` flag — the spec name is conceptual (Mindcraft). Its
  Agent-SDK analogue is *tool permissions*: leaving code-exec tools (Bash, etc.)
  enabled, or `permissionMode:"bypassPermissions"`. AC #4 is satisfied by *not*
  enabling those (no tools allowed; deny-by-default; never bypass).

Per-turn vs aggregate: the result message gives only the **aggregate** tally, so
the iterative archetype's "context grows turn over turn" (§7/§9) needs the
**per-`assistant`-message** usage — which is exactly why the runner must see the
whole stream, not just the result.

## Repo conventions to match

- `render/src/version.mjs` is the **single-source pin idiom**: a module exporting
  one constant (`MINECRAFT_VERSION`) plus memoised derived handles, with a
  file-top comment explaining why the pin lives in one place. The model-id pin
  (AC #1) should mirror this exactly.
- `src/` house style (`expand.mjs`, `artifact.mjs`, `sdk-binding.mjs`): pure ESM
  `.mjs`, named exports, rich JSDoc `@typedef`s for "types", a file-top contract
  comment, double-quote strings, 2-space indent. Tests are `src/<name>.test.mjs`
  using `node:test` + `node:assert/strict`; `package.json#scripts.test:unit`
  globs `src/**/*.test.mjs` (auto-pickup). `npm test` = schema gate + unit suites.
- CLI entrypoints (`render/src/cli.mjs`): thin, top-level `await`, explicit
  `process.exit(0)` (the SDK, like prismarine-viewer, may hold the process open),
  guard on availability, print where output landed.
- Output dirs are **gitignored** (`render/out/`, root `.gitignore` has `*.log`).
  A trial store (transcripts, records) is generated output → gitignore it.

## Constraints & assumptions surfaced

- **No live SDK calls in `npm test`** (spec §4, metered). Every testable unit must
  be a pure function over plain message/result objects — the token tally,
  transcript serialization, record assembly. The live `runTrial` is isolated and
  unverified by CI, like `requestDesignArtifact`.
- **Single source of truth.** The model id must live in exactly one place
  (AC #1). `claude-opus-4-8` currently appears as *data* in
  `scripts/validate-artifact.mjs` and the example fixture's `metadata.model_id` —
  those are sample payloads, not the harness pin. The new config is the pin.
- **One live SDK seam.** T-001-03 deliberately isolates the metered call behind a
  dynamic import in `sdk-binding.mjs`. The runner should not open a second
  `import("@anthropic-ai/claude-agent-sdk")` — it should reach the SDK *through*
  the binding (AC #2 literally says "via the T-001-03 binding").
- **Metadata agreement.** The artifact embeds `metadata`; the trial record is
  "keyed by §5 metadata". If the runner is also handed a metadata block, the two
  must not silently diverge — the trial_id that names the record must be the
  trial_id inside the artifact, or the join breaks.
- **Out of scope here:** render/export/score legs (E-02/E-03 render, E-04), the
  three-archetype matrix (§8 — this is single-shot only), the prompting-method
  *construction* logic (§7 archetypes are later tickets). This ticket is the
  skeleton a single-shot trial runs through.

## Where this connects

- **Upstream:** T-001-03 (binding) — the runner's door to the SDK; T-001-01
  (schema/metadata typedefs). Mirrors `render/src/version.mjs`'s pin idiom.
- **Downstream:** the §7 archetype tickets (multi-shot, multimodal) layer prompt
  construction *on top of* this runner; E-04 scoring and the §10 rating app read
  the per-trial record this runner writes, keyed by `trial_id`; the render tool
  (§4) will later be exposed to this same harness as an in-process SDK tool.

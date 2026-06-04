# Structure — T-004-01 agent-sdk-trial-runner

The blueprint: files created/modified, module boundaries, public interfaces, and
the ordering of changes. Not code — the shape of the code.

## File-level changes

| File | Action | Purpose |
|------|--------|---------|
| `src/config.mjs` | **create** | Single-sourced Phase-1 model pin + safe trial options (AC #1, #4). |
| `src/sdk-binding.mjs` | **modify** | Add optional `onMessage` callback to `requestDesignArtifact` (Decision 1C). Backward-compatible. |
| `src/trial.mjs` | **create** | The runner: pure core (tally/serialize/record/guard) + thin live `runTrial` (AC #1–#4). |
| `src/trial.test.mjs` | **create** | Unit suite over the pure core, mock SDK objects, no live call. |
| `scripts/run-trial.mjs` | **create** | Thin CLI to launch one live, metered trial (demonstrable entrypoint). |
| `package.json` | **modify** | Add `"trial:run"` script. (Not added to `test`.) |
| `.gitignore` | **modify** | Ignore the generated `trials/` store. |
| `src/README.md` | **modify** | Document the runner + config under a new section. |

No files deleted. `src/expand.mjs`, `src/artifact.mjs`, `render/**` untouched.

## `src/config.mjs` — single source of harness configuration

File-top comment mirrors `render/src/version.mjs`: why the pin lives in exactly
one place, that Phase 2 sweeps by editing here.

```js
/** Phase-1 pinned model id (spec §4). Phase 2 sweeps the model by overriding this. */
export const PHASE1_MODEL_ID = "claude-opus-4-8";

/** Default prompting archetype id for the skeleton trial (spec §7). */
export const DEFAULT_PROMPTING_METHOD_ID = "single-shot.v1";

/**
 * Agent SDK options that DISABLE code execution (AC #4 / spec §3). No tool is
 * pre-approved; non-approved tools are denied without prompting; shells are named
 * explicitly as defense in depth. The runner never sets bypassPermissions.
 * @type {{ allowedTools: string[], disallowedTools: string[], permissionMode: string }}
 */
export const SAFE_TRIAL_OPTIONS = Object.freeze({
  allowedTools: [],
  disallowedTools: Object.freeze(["Bash", "BashOutput", "KillShell", "NotebookEdit", "Task"]),
  permissionMode: "dontAsk",
});

/** Tool names that must never be enabled in a trial (code-execution surface). */
export const FORBIDDEN_TOOLS = Object.freeze(["Bash", "BashOutput", "KillShell", "NotebookEdit", "Task"]);
```

## `src/sdk-binding.mjs` — additive change only

`requestDesignArtifact` signature gains one optional field; everything else is
identical. The callback fires inside the **existing** `for await` loop, before the
result is selected, so it sees every message:

```js
export async function requestDesignArtifact({ prompt, model, options = {}, onMessage } = {}) {
  // …unchanged dynamic import + queryOptions…
  for await (const message of sdk.query({ prompt, options: queryOptions })) {
    if (typeof onMessage === "function") onMessage(message);   // NEW — pure observation hook
    if (message.type === "result") result = message;
  }
  // …unchanged success-subtype check + extractArtifact + re-validate…
}
```

Contract: `onMessage` is called once per yielded message, in stream order, before
any throw. It must not mutate messages (documented in JSDoc). No-callback callers
are byte-for-byte unaffected — the 7 existing binding tests stay green.

## `src/trial.mjs` — runner

File-top comment: this is the E-03 harness skeleton (spec §4, §11 step 5); it
reaches the SDK **only** through `sdk-binding.mjs` (never a direct SDK import); the
pure core is unit-tested, the live `runTrial` is metered and not.

### Imports
`requestDesignArtifact` from `./sdk-binding.mjs`; `PHASE1_MODEL_ID`,
`SAFE_TRIAL_OPTIONS`, `FORBIDDEN_TOOLS`, `DEFAULT_PROMPTING_METHOD_ID` from
`./config.mjs`; `node:fs` (`writeFileSync`, `mkdirSync`), `node:path`.

### Typedefs (JSDoc — the "types")
```
@typedef TurnUsage  { number index, input_tokens, output_tokens,
                      cache_read_input_tokens, cache_creation_input_tokens }
@typedef UsageTally { TurnUsage[] turns, object totals }
                      // totals: { input_tokens, output_tokens, cache_*,
                      //           total_cost_usd, num_turns, byModel }
@typedef TrialRecord{ Metadata metadata, string model_id, prompting_method_id,
                      schema_version, "success"|… status, UsageTally usage,
                      number duration_ms, string finished_at }
```

### Public surface (pure — unit-tested)
- **`tallyUsage(messages, result) → UsageTally`** — one `turns[]` entry per
  `assistant` message from `msg.message.usage` (coerce missing to 0); `totals`
  from `result.usage` + `result.modelUsage` + `result.total_cost_usd` +
  `result.num_turns`. No I/O, no SDK.
- **`serializeTranscript(messages) → string`** — `messages.map(JSON.stringify)
  .join("\n") + "\n"`; the JSONL body. Pure.
- **`buildTrialRecord({ metadata, artifact, tally, result, finishedAt }) →
  TrialRecord`** — assembles the record; derives nothing it can read from inputs;
  pulls `model_id`/`prompting_method_id`/`schema_version` from the artifact so the
  record agrees with the artifact (Decision 5). Pure (takes `finishedAt` as a
  param — no clock inside, keeps it testable).
- **`assertSafeOptions(options) → void`** — throws if merged options would enable
  any `FORBIDDEN_TOOLS` (in `allowedTools`) or set `permissionMode` to
  `bypassPermissions` / `allowDangerouslySkipPermissions: true`. Enforces AC #4.

### Live surface (metered — NOT unit-tested)
- **`runTrial({ prompt, metadata, model, outDir, options }) →
  Promise<{ record, artifact, dir }>`**:
  1. `mergedOptions = { ...SAFE_TRIAL_OPTIONS, ...options }`; `assertSafeOptions
     (mergedOptions)` (a caller override can't weaken safety silently).
  2. `messages = []`; call `requestDesignArtifact({ prompt, model: model ??
     PHASE1_MODEL_ID, options: mergedOptions, onMessage: m => messages.push(m) })`.
  3. From the returned `{ artifact, raw }`: assert `artifact.metadata.trial_id`
     non-empty; `tally = tallyUsage(messages, raw)`; `record =
     buildTrialRecord({ metadata: artifact.metadata, artifact, tally, result: raw,
     finishedAt: new Date().toISOString() })`.
  4. `dir = join(outDir ?? "trials", artifact.metadata.trial_id)`; `mkdirSync
     (dir,{recursive:true})`; write `artifact.json`, `transcript.jsonl`
     (`serializeTranscript(messages)`), `trial.json` (the record).
  5. return `{ record, artifact, dir }`.

The `metadata` param is accepted for callers that want to *seed* the prompt, but
the **record key is always `artifact.metadata.trial_id`** — the artifact is the
one source (Decision 5). If a passed `metadata.trial_id` disagrees with the
artifact's, `runTrial` throws (a mismatch is a bug, not a silent pick).

## `src/trial.test.mjs` — pure-core suite

Builds mock objects to the `sdk.d.ts` shapes (no SDK import):
- `tallyUsage`: assistant messages with nested `message.usage` → correct per-turn
  rows and ordering; a result with `usage`/`modelUsage` → correct totals; missing
  usage coerces to 0; non-assistant messages ignored.
- `serializeTranscript`: round-trips (split lines → `JSON.parse` deep-equals
  input); trailing newline present.
- `buildTrialRecord`: pulls model_id/method/version from the artifact; status
  reflects result subtype; uses the passed `finishedAt`.
- `assertSafeOptions`: passes for `SAFE_TRIAL_OPTIONS`; throws when `allowedTools`
  contains `Bash`; throws on `permissionMode:"bypassPermissions"`; throws on
  `allowDangerouslySkipPermissions:true`.

## `scripts/run-trial.mjs` — live CLI

Mirrors `render/src/cli.mjs`: reads a prompt (a built-in sample house prompt, or
`--prompt`/file later), calls `runTrial`, prints the trial dir and a one-line
usage summary, `process.exit(0)`. Wraps the SDK-not-installed error from the
binding into a friendly message. **Not** invoked by `npm test`.

## Ordering of changes (commit boundaries → plan.md)

1. `src/config.mjs` (no dependents yet — safe in isolation).
2. `src/sdk-binding.mjs` `onMessage` hook (additive; existing tests still green).
3. `src/trial.mjs` pure core + `src/trial.test.mjs` (the unit-verifiable heart).
4. `runTrial` live orchestration in `src/trial.mjs` + `scripts/run-trial.mjs` +
   `package.json` + `.gitignore` (the metered leg + entrypoint).
5. `src/README.md` docs.

Each of 1–3 is independently testable via `npm test`; 4 adds the unverified-by-CI
live path; 5 is docs.

# Design — T-004-01 agent-sdk-trial-runner

Decisions with rationale, grounded in research.md. Each choice is justified
against the codebase reality and the four acceptance criteria.

## The shape of the work

A trial is: *prompt + metadata → (live, metered SDK call) → validated artifact +
full transcript + token tally → written to a per-trial store, keyed by trial_id.*
The instrument needs this to be **reproducible** (metadata-keyed) and the
**testable parts pure** (no metered calls in CI). So the design splits sharply
into a thin live orchestrator and a fat pure core.

## Decision 1 — How the runner sees the full message stream

**Problem.** AC #3 needs the *whole* `query()` stream: every message for the
transcript, and each `assistant` message's nested `message.usage` for per-turn
input-vs-output tokens. But `requestDesignArtifact` (T-001-03) iterates the
generator and **discards everything except the terminal `result`**.

Options:

- **(A) Runner opens its own `query()` loop.** Gives full access, but creates a
  *second* live SDK seam — a second `import("@anthropic-ai/claude-agent-sdk")`,
  second outputFormat wiring, second success/error handling. Directly against
  T-001-03's stated intent ("the single live, metered call … isolated behind a
  dynamic import") and against AC #2's wording ("via the T-001-03 binding").
  Duplicates the exact code T-001-03 exists to own. **Rejected.**
- **(B) Binding returns a buffered `messages[]`.** `requestDesignArtifact` returns
  `{ artifact, raw, messages }`. Simple, but forces the binding to buffer the
  entire stream in memory even for callers (the existing path) that only want the
  artifact, and bakes a buffering policy into the binding.
- **(C) Binding gains an optional `onMessage` callback.** `requestDesignArtifact`
  accepts `{ …, onMessage }` and calls `onMessage(message)` for every message as
  it iterates — *before* the result-selection logic it already runs. The runner
  passes a collector. Backward-compatible (no callback ⇒ identical behavior; the
  existing 7 binding tests and the `render`/expand callers are untouched), keeps
  the binding the **sole** live seam, and lets the runner decide its own
  buffering/streaming policy. The change to the binding is ~2 lines inside the
  existing `for await` loop.

**Chosen: (C).** It is the smallest change that keeps T-001-03 the single door to
the SDK while giving the runner everything AC #3 needs. The callback is a pure
observation hook — it cannot alter the artifact path, so the binding's guarantees
(success-subtype check, re-validation) are preserved.

## Decision 2 — Single-sourced model pin (`src/config.mjs`)

AC #1: "model pinned by a single-sourced config ID." The repo already has the
exact idiom — `render/src/version.mjs` pins `MINECRAFT_VERSION` in one module with
a comment explaining why. Mirror it: a new `src/config.mjs` exporting
`PHASE1_MODEL_ID` (value `claude-opus-4-8`, the current id the spec §4 says to use
and the fixtures already carry). Phase 2's model sweep becomes "override this one
constant," exactly as version bumps are "a single edit here."

`claude-opus-4-8` appearing in `scripts/validate-artifact.mjs` and the example
fixture is *sample data* (a metadata block), not the harness pin — those are not
touched. `config.mjs` is the harness's single source; `runTrial` passes
`PHASE1_MODEL_ID` to the binding's `model` param unless a caller overrides it
(the Phase-2 sweep seam).

`config.mjs` also owns **Decision 4's safe-options constant**, because "the pinned
configuration of a trial" is one cohesive concept and both AC #1 and AC #4 are
"how the harness is configured."

## Decision 3 — Token accounting as a pure function over messages

AC #3 wants per-turn input vs output. Spec §7/§9 sharpen it: the iterative
archetype needs **turn-over-turn context growth**, the multimodal archetype needs
**image tokens separated** — so a flat aggregate is not enough; the per-turn
breakdown must be first-class even though the Phase-1 single-shot trial usually
has one assistant turn.

`tallyUsage(messages, result)` (pure, unit-tested):
- **`turns[]`** — one entry per `assistant` message, in order:
  `{ index, input_tokens, output_tokens, cache_read_input_tokens,
  cache_creation_input_tokens }`, read from `msg.message.usage`. Missing/partial
  usage coerces to 0 (defensive — streaming/partial messages may lack it).
- **`totals`** — from `result.usage` (the SDK's authoritative aggregate), with a
  `byModel` copy of `result.modelUsage` and `total_cost_usd` / `num_turns`.

Why read totals from `result.usage` rather than summing `turns`? The result
message is the SDK's *billed* aggregate (the number that maps to spend, §4); the
per-turn sum can differ (cache accounting, retries). Logging both — per-turn for
*shape*, result aggregate for *cost* — is the honest record and matches §9's
"comes directly from the Agent SDK's structured message objects."

## Decision 4 — Disabling code execution (AC #4) via safe options

There is no literal `allow_insecure_coding` flag in the Agent SDK (research.md);
its analogue is tool permissions. The safe posture for a structured-output-only
trial that needs **no tools at all**:

```
SAFE_TRIAL_OPTIONS = {
  allowedTools: [],                 // nothing pre-approved
  disallowedTools: ["Bash", "BashOutput", "KillShell", "NotebookEdit", "Task"],
  permissionMode: "dontAsk",        // deny anything not pre-approved; never prompt
}
```

`allowedTools: []` means no tool is approved; `permissionMode: "dontAsk"` denies
the rest without hanging a headless run on a prompt; `disallowedTools` names the
code-execution tools explicitly as **defense in depth** and as a readable,
greppable statement of intent. Critically the runner **never** sets
`permissionMode: "bypassPermissions"` nor `allowDangerouslySkipPermissions`. A
pure guard `assertSafeOptions(options)` throws if a caller's merged options would
re-enable a code-exec tool or bypass permissions — so AC #4 is *enforced*, not
just defaulted, and is unit-testable without the SDK.

(When the render tool is later exposed to the harness (§4), it is added to
`allowedTools` as `mcp__render__*` — a non-code-exec, in-process tool. That is a
future ticket; the guard allows MCP render tools, blocks shells.)

## Decision 5 — Trial store layout & record

A trial writes a directory `trials/<trial_id>/` (gitignored generated output, like
`render/out/`):
- **`artifact.json`** — the validated `DesignArtifact` (pretty-printed).
- **`transcript.jsonl`** — every SDK message, one JSON object per line, in stream
  order. JSONL because the transcript is an append-ordered log of heterogeneous
  message types (§9 "the full Agent SDK transcript"); newline-delimited is the
  format that survives partial writes and streams.
- **`trial.json`** — the **record**: `{ metadata, model_id, prompting_method_id,
  status, usage: tally, duration_ms, schema_version, finished_at }`, keyed by
  `metadata.trial_id`. This is the row E-04 scoring and the §10 rating app join on.

`buildTrialRecord({ metadata, artifact, tally, result })` is **pure** (unit-tested)
— it assembles the record object; `runTrial` does the I/O. `serializeTranscript
(messages)` is **pure** too (messages → JSONL string).

**Metadata agreement (research constraint).** The artifact embeds `metadata`. The
record is "keyed by §5 metadata." Rather than accept a second metadata block and
risk divergence, `runTrial` takes the metadata from a single place and the record
*derives* its key from `artifact.metadata.trial_id`. The runner asserts the
returned artifact's `metadata.trial_id` is non-empty and uses it as the directory
name and record key — one trial_id, no fork.

## Decision 6 — Module boundary & entrypoint

- **`src/trial.mjs`** — the runner. Pure core (`tallyUsage`,
  `serializeTranscript`, `buildTrialRecord`, `assertSafeOptions`) + the thin live
  `runTrial({ prompt, metadata, model, outDir, options })`. It imports the binding
  and `config.mjs`; it **never** imports the SDK directly (AC #2, Decision 1).
- **`src/trial.test.mjs`** — covers the pure core only, over mock message/result
  objects built to the `sdk.d.ts` shapes. No live call.
- **`scripts/run-trial.mjs`** — thin CLI (mirrors `render/src/cli.mjs`):
  top-level await, explicit `process.exit(0)`, clear error if the SDK isn't
  installed. The one place a *live* metered trial is launched; `npm run trial:run`
  but **not** in `npm test`.

## What was rejected

- **Re-iterating `query()` in the runner** — Decision 1(A); second live seam.
- **Summing per-turn usage for the cost figure** — Decision 3; the result
  aggregate is the billed truth.
- **Accepting metadata separately from the artifact** — Decision 5; invites a
  trial_id fork. The artifact's metadata is the one source.
- **A standalone MCP server for the runner** — spec §4 says in-process is fine for
  the single-language stack; an MCP server is "optional" and unneeded for the
  skeleton.
- **Persisting to a DB/scoring spine now** — §9's "scoring spine" is E-04's; this
  ticket writes flat files keyed by trial_id, which that spine later ingests.

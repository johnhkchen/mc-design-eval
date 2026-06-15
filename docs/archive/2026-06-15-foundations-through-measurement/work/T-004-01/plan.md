# Plan — T-004-01 agent-sdk-trial-runner

Ordered, independently-verifiable steps. Each step is one atomic commit. Testing
strategy is stated per step; the pure core is fully unit-tested, the live leg is
verified structurally (it cannot run in CI — metered, spec §4).

## Testing strategy (overview)

- **Unit (`node:test`, in `npm test`):** every pure function — `tallyUsage`,
  `serializeTranscript`, `buildTrialRecord`, `assertSafeOptions` — over mock
  message/result objects shaped to `sdk.d.ts`. No SDK import, no network.
- **Regression:** the existing 44 tests (expand + artifact + sdk-binding) must
  stay green after the binding's additive `onMessage` change.
- **Live (manual, not CI):** `npm run trial:run` exercises `runTrial` end to end
  against the metered SDK. Verified by a human once; documented, never in `npm
  test`. Its correctness is otherwise covered by the pure-core units it composes.
- **Verification gate per step:** `npm test` green; `git status` clean of stray
  files; the AC the step advances is demonstrable.

## Step 1 — `src/config.mjs`: single-sourced pin + safe options

Create `src/config.mjs` exporting `PHASE1_MODEL_ID`, `DEFAULT_PROMPTING_METHOD_ID`,
`SAFE_TRIAL_OPTIONS` (frozen), `FORBIDDEN_TOOLS` (frozen). File-top comment mirrors
`render/src/version.mjs` (why one place; Phase 2 sweeps here).

- **Verify:** `node -e "import('./src/config.mjs').then(m=>{…})"` prints the pin
  and frozen options; `npm test` still green (no dependents yet).
- **AC:** lays the foundation for #1 and #4.
- **Commit:** `T-004-01: single-sourced model pin + code-exec-disabled trial options`.

## Step 2 — `src/sdk-binding.mjs`: optional `onMessage` hook

Add `onMessage` to the `requestDesignArtifact` destructured params; call it inside
the existing `for await` loop before the result-selection line. Update the JSDoc
(new `@param`, note "called per message in stream order, before any throw; must
not mutate"). No other change.

- **Verify:** `npm test` green — the 7 existing binding tests pass unchanged
  (they never pass `onMessage`, so behavior is identical). Re-read the diff to
  confirm the change is purely additive.
- **AC:** enables #2/#3 (runner reaches the stream through the binding).
- **Commit:** `T-004-01: binding gains optional onMessage hook for transcript capture`.

## Step 3 — `src/trial.mjs` pure core + `src/trial.test.mjs`

Create `src/trial.mjs` with the four pure functions (`tallyUsage`,
`serializeTranscript`, `buildTrialRecord`, `assertSafeOptions`) and their JSDoc
typedefs (`TurnUsage`, `UsageTally`, `TrialRecord`). Import `FORBIDDEN_TOOLS` from
`./config.mjs`. **Do not** add `runTrial` yet (keeps this commit SDK-free and
fully testable). Create `src/trial.test.mjs`.

Test cases (≥ the structure.md list):
1. `tallyUsage` — two assistant turns → two ordered `turns[]` rows with correct
   input/output; non-assistant messages skipped.
2. `tallyUsage` — missing `message.usage` coerces all counts to 0.
3. `tallyUsage` — `totals` read from `result.usage` + `modelUsage` +
   `total_cost_usd` + `num_turns`.
4. `serializeTranscript` — N messages → N lines, trailing `\n`, each line
   `JSON.parse`-deep-equals the source message.
5. `buildTrialRecord` — `model_id`/`prompting_method_id`/`schema_version` pulled
   from the artifact (not from a separate arg); `status` from result subtype;
   `finished_at` is the passed value.
6. `assertSafeOptions` — `SAFE_TRIAL_OPTIONS` passes; `allowedTools:["Bash"]`
   throws; `permissionMode:"bypassPermissions"` throws;
   `allowDangerouslySkipPermissions:true` throws.

- **Verify:** `npm run test:unit` shows the new suite passing; `npm test` green
  overall. Count rises from 44 to 44 + (new cases).
- **AC:** #3 (token tally shape), #4 (guard) proven in isolation.
- **Commit:** `T-004-01: trial-record pure core (usage tally, transcript, record, safe-options guard) + unit suite`.

## Step 4 — `runTrial` live orchestration + CLI + wiring

Add `runTrial` to `src/trial.mjs` (imports `requestDesignArtifact`,
`PHASE1_MODEL_ID`, `SAFE_TRIAL_OPTIONS`, `node:fs`, `node:path`). It merges safe
options, asserts them, calls the binding with a message collector, builds the
record from `artifact.metadata`, writes `artifact.json` / `transcript.jsonl` /
`trial.json` under `trials/<trial_id>/`, throws on a metadata trial_id mismatch.

Create `scripts/run-trial.mjs` (thin CLI, mirrors `render/src/cli.mjs`: sample
house prompt, `runTrial`, print dir + usage summary, `process.exit(0)`, friendly
SDK-missing error). Add `"trial:run": "node scripts/run-trial.mjs"` to
`package.json` (NOT to `test`). Add `trials/` to `.gitignore`.

- **Verify:** `npm test` green (the pure core unchanged; `runTrial` is not unit-
  tested, by design). Structural check: `node --check scripts/run-trial.mjs` and
  `node -e "import('./src/trial.mjs').then(m=>console.log(typeof m.runTrial))"`
  prints `function`. Confirm `assertSafeOptions` is called before the binding (re-
  read). Live `npm run trial:run` is left for a human with credentials — note this
  in progress.md, do not run it (metered).
- **AC:** #1 (runs through SDK with single-sourced pin), #2 (consumes via binding),
  #3 (writes transcript + per-turn tally keyed by trial_id), #4 (safe options
  enforced) — all wired.
- **Commit:** `T-004-01: runTrial live orchestration + run-trial CLI + trial store`.

## Step 5 — Documentation

Extend `src/README.md` with a "Trial runner (T-004-01)" section: the config pin,
the safe-options posture, the public API (`runTrial` + the pure core), the trial
store layout, and the explicit "live path is metered, not in `npm test`" note —
matching the tone of the existing sdk-binding section.

- **Verify:** prose only; `npm test` green; re-read for accuracy against the code.
- **AC:** handoff clarity; no AC code impact.
- **Commit:** `T-004-01: document the trial runner and trial store`.

## Risk & mitigation

- **SDK field-name drift** (per-turn usage path `msg.message.usage`,
  `result.usage`/`modelUsage`): verified against the installed `0.3.162`
  `sdk.d.ts` in research; `tallyUsage` coerces missing fields to 0 so a partial
  message can't crash the tally. A future SDK rename is a one-spot change in
  `tallyUsage`.
- **Caller weakens safety via `options`:** `assertSafeOptions` runs on the
  *merged* options after the spread, so an override re-enabling Bash or bypass
  throws before any live call.
- **trial_id fork** (artifact vs passed metadata): `runTrial` throws on mismatch
  and keys solely off the artifact — no silent divergence (Decision 5).
- **Live path unverifiable in CI:** accepted and explicit (spec §4). Every piece
  of `runTrial`'s logic that *can* be tested without metering is factored into the
  pure core and is tested there; `runTrial` is only the thin glue + I/O.

## Definition of done

All four ACs wired; `npm test` green (44 existing + new pure-core cases); the live
trial reachable via `npm run trial:run` (run by a human, not CI); `trials/`
gitignored; `src/README.md` documents the runner; review.md written.

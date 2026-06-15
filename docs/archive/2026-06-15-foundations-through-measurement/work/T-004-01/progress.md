# Progress — T-004-01 agent-sdk-trial-runner

Implement phase log. All five planned steps complete; `npm test` green at 54
tests (44 prior + 10 new pure-core cases). One documented deviation (Step 3/4
commit boundary).

## Completed steps

### Step 1 — `src/config.mjs` ✅
Single-sourced `PHASE1_MODEL_ID` (`claude-opus-4-8`),
`DEFAULT_PROMPTING_METHOD_ID` (`single-shot.v1`), `FORBIDDEN_TOOLS` (frozen), and
`SAFE_TRIAL_OPTIONS` (frozen: `allowedTools:[]`, `disallowedTools` = the shells,
`permissionMode:"dontAsk"`). Mirrors `render/src/version.mjs`'s pin idiom.
- Verified: load prints the pin + frozen safe options; `npm test` green (44).
- Commit `T-004-01: single-sourced model pin + code-exec-disabled trial options`.

### Step 2 — `src/sdk-binding.mjs` `onMessage` hook ✅
Added optional `onMessage` to `requestDesignArtifact`, called inside the existing
`for await` loop before result-selection. Purely additive — the 7 existing binding
tests pass unchanged.
- Verified: `npm test` green (44); diff is the one new param + one call line + JSDoc.
- Commit `T-004-01: binding gains optional onMessage hook for transcript capture`.

### Step 3 — `src/trial.mjs` + `src/trial.test.mjs` ✅ (with deviation, below)
Pure core: `tallyUsage`, `serializeTranscript`, `buildTrialRecord`,
`assertSafeOptions`, with `TurnUsage`/`UsageTally`/`TrialRecord` typedefs. 10 unit
cases over mock SDK objects shaped to `sdk.d.ts`.
- Verified: `npm run test:unit` shows the new suite; `npm test` green (54).
- Commit `T-004-01: trial runner — usage tally, transcript, record, safe-options
  guard + runTrial orchestration + unit suite`.

### Step 4 — `runTrial` live orchestration + CLI + wiring ✅
`runTrial` (merge+assert safe options → binding with message collector → tally →
record keyed off `artifact.metadata.trial_id` → write `artifact.json` /
`transcript.jsonl` / `trial.json`). `scripts/run-trial.mjs` thin CLI (sample house
prompt, prints dir + usage summary, `process.exit(0)`, friendly SDK-missing
error). `package.json` `trial:run` script (not in `test`). `.gitignore` `trials/`.
- Verified: `node --check scripts/run-trial.mjs` ok; `runTrial` exported as a
  function; `assertSafeOptions` runs on merged options before the binding call;
  `npm test` green (54). Live `npm run trial:run` left for a human with credentials
  (metered — not run here, see Concerns).
- Commit `T-004-01: run-trial CLI entrypoint + trial:run script + gitignore trial store`.

### Step 5 — `src/README.md` ✅
Added "Trial runner (T-004-01)" section: config pin, safe-options posture, public
API, trial store layout, and the "live path is metered, not in `npm test`" note.
- Verified: prose; `npm test` green (54).
- Commit `T-004-01: document the trial runner, config pin, and trial store`.

## Deviation from plan

- **`runTrial` landed in Step 3's commit, not a separate Step 4 commit.** The plan
  split the pure core (Step 3) from the live `runTrial` (Step 4) into two commits.
  In practice `runTrial` is the natural tail of `trial.mjs` and writing the file
  once was cleaner than editing it twice; it adds no test surface (it is the
  unverified live leg by design), so the pure-core suite still fully gates Step 3's
  commit. Step 4's commit therefore carries only the CLI + `package.json` +
  `.gitignore`. Net commit count and content are equivalent; only the boundary of
  one file moved. No behavioral or coverage impact.

## Acceptance-criteria status

1. **Trial runs through the SDK package, model pinned by single-sourced id** —
   `runTrial` calls the binding with `model: model ?? PHASE1_MODEL_ID` from
   `config.mjs`. ✅ (wired; live path unverified-by-CI, see Concerns)
2. **Consumes structured-output via the T-001-03 binding** — `runTrial` uses
   `requestDesignArtifact` (no direct SDK import anywhere in `trial.mjs`). ✅
3. **Full transcript + per-turn input/output tokens, keyed by §5 metadata** —
   `transcript.jsonl` (every message) + `trial.json` (per-turn `tallyUsage` +
   billed totals), under `trials/<trial_id>/`. ✅ (pure core unit-tested)
4. **No code-execution path** — `SAFE_TRIAL_OPTIONS` + `assertSafeOptions` on the
   merged options; never `bypassPermissions`. ✅ (guard unit-tested)

## Remaining / handoff
- A human with API credentials runs `npm run trial:run` once to confirm the live
  leg end to end (metered — deliberately out of CI). See review.md Concerns.

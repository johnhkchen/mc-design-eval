# T-198-01 — Structure

The file-level blueprint. Shape of the code, public interfaces, ordering — not the code itself. Grounded in
`design.md`.

## Files touched

| File | Change | What |
| --- | --- | --- |
| `src/config.mjs` | modify | Add `CLAUDE_SUBPROCESS_TIMEOUT_MS` default (pure data). |
| `src/sdk-binding.mjs` | modify | Add `ClaudeTimeoutError`, `awaitChildClose(child, opts)`; wire `timeoutMs` through both spawn cores + the four request fns. |
| `src/sdk-binding.test.mjs` | modify | Unit tests for `awaitChildClose` (timeout→kill→typed error; close-first→resolve+clear; no-timeout→no timer) + `ClaudeTimeoutError` shape. No spawn. |
| `src/model-tier.mjs` | modify | Thread `timeoutMs` through `runTieredOp` to the invoker. |
| `src/model-tier.test.mjs` | modify | Assert `runTieredOp` forwards `timeoutMs` to the injected invoker. |
| `experiments/eval-alignment/picture-climb.mjs` | modify | Pass `timeoutMs` from `diagnose`; classify+record per-vote outcomes in `scoreBuild`; typed `RoundAbortedError`; `main()` records an abort instead of crashing. |
| `docs/active/work/T-198-01/` | create | `climb.log`, `trajectory.json`, `round-*-beside.png` (run outputs), the RDSPI artifacts. |

**Untouched (invariant):** `measurements/` (frozen instrument); no new hands/eyes; no API-key import.

## `src/config.mjs`

Add one constant near `MODEL_TIERS`:

```
export const CLAUDE_SUBPROCESS_TIMEOUT_MS = Number(process.env.CLAUDE_TIMEOUT_MS) || 180_000;
```

- Env-overridable (`CLAUDE_TIMEOUT_MS`), default 3 min. Pure data; no new imports. JSDoc states: per-call
  wall-clock bound on the `claude -p` child so a non-returning subprocess cannot hang a metered runner;
  `0`/unset-at-call-site ⇒ no timer (default-off transport contract preserved).

## `src/sdk-binding.mjs`

### New: `ClaudeTimeoutError` (exported)
```
export class ClaudeTimeoutError extends Error {
  constructor(timeoutMs, cli) {
    super(`\`${cli} -p\` exceeded ${timeoutMs}ms wall-clock and was killed (non-returning subprocess)`);
    this.name = "ClaudeTimeoutError";
    this.code = "ETIMEDOUT_CLAUDE";
    this.timeoutMs = timeoutMs;
  }
}
```

### New: `awaitChildClose(child, { cli, timeoutMs })` (exported, the testable seam)
Replaces the inline `await new Promise((resolve, reject) => { child.on("error"…); child.on("close"…) })` in
**both** cores. Behavior:
- Returns `Promise<number>` (the exit code) — same resolution value as today.
- `error` event → reject with the existing "failed to launch" message (unchanged text/contract).
- `close` event → resolve with `code`.
- If `timeoutMs > 0`: arm `setTimeout` → on fire, `child.kill("SIGKILL")` (guarded in try/catch) then reject
  with `new ClaudeTimeoutError(timeoutMs, cli)`. The timer is `unref()`'d.
- A single-settle latch (`settled`) ensures exactly one of {timeout, close, error} wins; the timer is cleared
  on any settle.
- `cli` defaults to `CLAUDE_CLI`; passed so the error message names the right binary.

### Modify: `_runClaude({ args, stdin, onMessage, timeoutMs })`
- Accept `timeoutMs`. Replace lines 425–430 (`const exitCode = await new Promise(...)`) with
  `const exitCode = await awaitChildClose(child, { timeoutMs });`. Everything else (stream parsing, stderr
  capture, final-line flush) unchanged.

### Modify: `invokeClaude({ args, stdin, onMessage, timeoutMs })`
- Same substitution at lines 235–245 → `await awaitChildClose(child, { timeoutMs })`. Keeps the design-artifact
  path guarded too (reusable-infra requirement), even though the climb doesn't use it.

### Modify the four request fns to accept + forward `timeoutMs`
- `requestText({ …, timeoutMs })` → `_runClaude({ args, stdin: prompt, onMessage, timeoutMs })`.
- `requestTextWithImage({ …, timeoutMs })` → `_runClaude({ …, timeoutMs })`.
- `requestDesignArtifact({ …, timeoutMs })` → `invokeClaude({ args, stdin, onMessage, timeoutMs })` (inside
  the retry loop).
- `requestDesignArtifactWithImage({ …, timeoutMs })` → same.
- All default `timeoutMs = undefined` (⇒ no timer ⇒ byte-unchanged for callers that don't pass it).

## `src/model-tier.mjs`

`runTieredOp({ tier, prompt, images, system, onMessage, invoke, timeoutMs })`:
- Add `timeoutMs` to the destructure and pass it into the invoker call:
  `await fn({ prompt, images, model, system, onMessage, timeoutMs })`.
- No other change. The PURE-with-injected-invoker property holds (a spy sees `timeoutMs`).
- JSDoc: add `@param {number} [timeoutMs]` — per-call wall-clock bound forwarded to the shim.

## `experiments/eval-alignment/picture-climb.mjs`

### Import + constant
- Import `CLAUDE_SUBPROCESS_TIMEOUT_MS` from `../../src/config.mjs`.
- Optionally `import { ClaudeTimeoutError } from "../../src/sdk-binding.mjs"` for the `instanceof` branch
  (or branch on `e.code === "ETIMEDOUT_CLAUDE"` to avoid a new import; choose code-string to keep imports
  minimal — see plan).

### `diagnose(renders)` — pass the timeout
- `runTieredOp({ tier: TIER, prompt, images, timeoutMs: CLAUDE_SUBPROCESS_TIMEOUT_MS })`.

### `scoreBuild` — classify + record vote outcomes; aborts on all-timeout
Replace the vote loop (lines 362–368) with one that records each outcome:
```
const samples = [], voteOutcomes = [];
for (let v = 0; v < VOTES; v++) {
  const t0 = Date.now();
  try { samples.push(await diagnose(renders)); voteOutcomes.push({ vote: v+1, status: "ok", ms: Date.now()-t0 }); }
  catch (e) {
    const status = (e.code === "ETIMEDOUT_CLAUDE") ? "timeout" : "malformed";
    voteOutcomes.push({ vote: v+1, status, ms: Date.now()-t0 });
    console.error(`  [${tag} r${round}] vote ${v+1} dropped (${status}): ${e.message}`);
  }
}
if (!samples.length) {
  const timedOut = voteOutcomes.filter(o => o.status === "timeout").length;
  throw new RoundAbortedError(round, voteOutcomes, timedOut);   // typed, carries the per-vote record
}
```
- `RoundAbortedError` (local class in picture-climb.mjs): `name`, `round`, `voteOutcomes`, `timedOut`, and a
  message that says all votes failed / how many timed out. **Never scored 0.**
- Return value gains `voteOutcomes` so the round's trajectory entry records it.

> Note: `Date.now()` is fine here — picture-climb is a runner, not a Workflow script (the `Date.now` ban is a
> Workflow-runtime constraint only).

### `scoreBuild` return + trajectory wiring
- The seed/cand return objects carry `voteOutcomes`; the trajectory push (lines 478, 539–543) records
  `voteOutcomes: candScore.voteOutcomes ?? null` per round.

### `main()` — record an abort, don't crash
- Wrap the round loop body's `scoreBuild` calls so a `RoundAbortedError` is caught at the climb level:
  write the partial trajectory + a top-level `abort: { round, voteOutcomes, timedOut, reason }` block, log a
  clear message, and exit **non-zero but cleanly** (a recorded finding, not a stack-trace crash). The
  simplest placement: a `try/catch` around the `for` loop in `main()` that, on `RoundAbortedError`, sets
  `stopReason = "round-aborted-all-votes-failed"`, attaches the abort block to `out`, writes the file, and
  returns. The top-level `main().catch` (line 581) stays for genuinely unexpected errors.
- `out` gains optional fields: `abort` (present only on the abort path) and per-round `voteOutcomes` already
  in the trajectory entries. `votesTimedOut` summary (total across rounds) for the cost report.

## Ordering of changes (why this order)
1. `config.mjs` constant — leaf, no dependents break.
2. `sdk-binding.mjs` (`ClaudeTimeoutError` + `awaitChildClose` + thread `timeoutMs`) + its tests — the core
   guard, fully unit-tested in isolation. `npm run test:unit` green here proves the mechanism *before* any
   runner edit.
3. `model-tier.mjs` + test — one-line forward, spy-asserted.
4. `picture-climb.mjs` — consume the guard, record outcomes, abort path. No unit test (runner, not in
   `npm test`); proven by `GUARD_ONLY=1` smoke + the live run.
5. Run: `GUARD_ONLY=1` smoke → metered climb → capture `climb.log` + `trajectory.json` + renders.

## Public-interface deltas (summary)
- **New exports:** `ClaudeTimeoutError`, `awaitChildClose` (sdk-binding); `CLAUDE_SUBPROCESS_TIMEOUT_MS`
  (config).
- **Widened signatures (additive, default-off):** `requestText`, `requestTextWithImage`,
  `requestDesignArtifact`, `requestDesignArtifactWithImage`, `runTieredOp` all gain optional `timeoutMs`.
- **No removed/renamed exports.** No signature is narrowed. All changes are additive ⇒ no caller breaks.

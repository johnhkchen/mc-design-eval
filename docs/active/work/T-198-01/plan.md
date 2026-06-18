# T-198-01 — Plan

Ordered, independently-verifiable steps → atomic commits. Each step states its verification. Grounded in
`structure.md`.

## Step 1 — config constant (leaf)
**Edit:** `src/config.mjs` — add `CLAUDE_SUBPROCESS_TIMEOUT_MS` (default 180000, `CLAUDE_TIMEOUT_MS`
env-overridable) with JSDoc.
**Verify:** `node -e "import('./src/config.mjs').then(m=>console.log(m.CLAUDE_SUBPROCESS_TIMEOUT_MS))"` → 180000;
`npm run test:unit` still green (pure data, no dependents broken).
**Commit:** `feat(T-198-01): CLAUDE_SUBPROCESS_TIMEOUT_MS config default`

## Step 2 — the guard core + unit tests (the heart of the ticket)
**Edit:** `src/sdk-binding.mjs`
- Add `export class ClaudeTimeoutError` (`name`, `code="ETIMEDOUT_CLAUDE"`, `timeoutMs`).
- Add `export function awaitChildClose(child, { cli = CLAUDE_CLI, timeoutMs })` — single-settle latch; on
  `close`→resolve(code); on `error`→reject(launch-error, unchanged text); on timer→`child.kill("SIGKILL")`
  (try/catch) then reject `ClaudeTimeoutError`; timer `unref()`'d + cleared on settle; arm only if
  `timeoutMs > 0`.
- `_runClaude` + `invokeClaude`: accept `timeoutMs`, replace the inline close-promise with
  `await awaitChildClose(child, { timeoutMs })`.
- `requestText`, `requestTextWithImage`, `requestDesignArtifact`, `requestDesignArtifactWithImage`: accept +
  forward `timeoutMs` (default undefined).

**Edit:** `src/sdk-binding.test.mjs` — add tests using a fake child (`EventEmitter` subclass with `kill` spy),
NO spawn:
1. `awaitChildClose` resolves with the exit code when the child emits `close` first; `kill` NOT called; (timer
   cleared — assert no late rejection by awaiting a tick).
2. `awaitChildClose` with `timeoutMs: 20` and a child that never closes → rejects with `ClaudeTimeoutError`,
   `err.code === "ETIMEDOUT_CLAUDE"`, `err.timeoutMs === 20`, and `kill` was called once with `"SIGKILL"`.
3. `awaitChildClose` with no `timeoutMs` → never rejects on its own (no timer): emit `close` after a tick,
   resolves; assert it didn't reject meanwhile.
4. `error` event → rejects with the "failed to launch" message (contract unchanged).
5. `ClaudeTimeoutError` shape: `instanceof Error`, `name`, `code`, `timeoutMs` carried.

**Verify:** `node --test src/sdk-binding.test.mjs` green; full `npm run test:unit` green. This proves
**timeout→kill→typed error→(degrade-ready)** with no live hang — the ticket's unit-test AC.
**Commit:** `feat(T-198-01): claude -p subprocess-timeout guard (ClaudeTimeoutError + awaitChildClose)`

## Step 3 — thread the timeout through the tier seam
**Edit:** `src/model-tier.mjs` — `runTieredOp` destructures `timeoutMs` and forwards it to the invoker.
**Edit:** `src/model-tier.test.mjs` — one test: `runTieredOp({ invoke: spy, timeoutMs: 1234, … })` → the spy's
args carry `timeoutMs === 1234`. (Re-uses the existing spy pattern.)
**Verify:** `node --test src/model-tier.test.mjs` green; `npm run test:unit` green.
**Commit:** `feat(T-198-01): forward timeoutMs through runTieredOp`

## Step 4 — wire the guard + record/abort into the climb
**Edit:** `experiments/eval-alignment/picture-climb.mjs`
- Import `CLAUDE_SUBPROCESS_TIMEOUT_MS`.
- `diagnose`: pass `timeoutMs: CLAUDE_SUBPROCESS_TIMEOUT_MS` to `runTieredOp`.
- Add local `class RoundAbortedError` (`round`, `voteOutcomes`, `timedOut`).
- `scoreBuild`: build `voteOutcomes` (ok/malformed/timeout + ms via `e.code === "ETIMEDOUT_CLAUDE"`); on
  `!samples.length` throw `RoundAbortedError` (never score 0); return `voteOutcomes`.
- Trajectory pushes record `voteOutcomes`; `out` gains `votesTimedOut` summary.
- `main()`: `try/catch` around the round loop → on `RoundAbortedError`, set
  `stopReason="round-aborted-all-votes-failed"`, attach `out.abort = { round, voteOutcomes, timedOut }`,
  write trajectory + log, exit cleanly (recorded finding, not a crash).
**Verify (zero spend):** `GUARD_ONLY=1 node experiments/eval-alignment/picture-climb.mjs` → renders round-0 +
beside sheet + framing flags, exits clean, no spend (proves the guard edit didn't break the wiring/seam).
**Commit:** `feat(T-198-01): timeout-guarded votes + record/abort in picture-climb`

## Step 5 — run the metered climb (the deferred verdict)
**Pre-flight:** confirm `claude` CLI present + logged in (a minimal `requestText` probe, sonnet, ~seconds —
the [[spend-limit-reply-failure-mode]] cheap probe). Confirm GL available (the runner asserts it).
**Run:**
```
CLIMB_OUT=docs/active/work/T-198-01/trajectory.json \
  node experiments/eval-alignment/picture-climb.mjs 2>&1 | tee docs/active/work/T-198-01/climb.log
```
Run in the **background** (it spawns strong-tier diagnoses per scored build; the guard bounds each at 3 min,
so the whole climb is now bounded — but it is still minutes). Monitor; do not block the phase pass on it.
**Capture:** `climb.log`, `trajectory.json`, and the per-round `beside-concept.png` (copy first/best/final into
the work dir).
**Outcomes to read from `trajectory.json` (the ACs):**
- Round-by-round picks → did the agent pick `close_shell` BEFORE any detail tool (ordering gate honored
  live)? did it pick `carve_arch` + `relief_walls`? did the WALL major clear (`deptMajorsBefore/After`)?
- `closureFirst → closureLast` (form closed?), `framingResidual` (orientation/scale named gap → E-49),
  `inventory.verdict` (climbed/stalled/oscillated), `voteOutcomes`/`votesTimedOut` (guard fired? signal
  intact?).
**No commit of a faked run.** If it hangs despite the guard, or every vote times out (metered unavailable),
record THAT in `progress.md` with evidence — that is a complete, reportable result.

## Step 6 — review
Write `review.md`: files changed, test coverage + gaps, the autonomous-sequencing verdict (or the named
failure), the human glance, the metered cost (votes × rounds × tier), and open concerns.
**Commit:** `docs(T-198-01): RDSPI artifacts + metered re-climb review`

## Testing strategy
- **Unit (in `npm test`):** the guard (`awaitChildClose`, `ClaudeTimeoutError`) — 5 tests, no spawn; the tier
  forward — 1 test. These are the durable, CI-protected deliverable.
- **Smoke (zero spend):** `GUARD_ONLY=1` proves the runner wiring + render seam survive the edit.
- **Live (not in `npm test`):** the metered climb — reported, not asserted in CI (it is metered + env-dependent).
- **Invariants checked before the final commit:** `npm test` green; `git status measurements/` clean
  (frozen instrument untouched); `grep -rn "ANTHROPIC_API_KEY" src/model-tier.mjs src/sdk-binding.mjs` adds
  nothing (subscription-only invariant held).

## Rollback / failure handling
- Each step is an independent commit; Step 5 (the run) commits no code, only artifacts, so a failed/hung run
  never corrupts the guard. If Step 5's environment can't reach the metered model, Steps 1–4 still land the
  guard (the durable win) and the metered verdict is reported at the strength the environment allows.

# T-198-01 — Progress

Tracking the plan's steps.

## Step 1 — config constant — DONE
`CLAUDE_SUBPROCESS_TIMEOUT_MS = Number(process.env.CLAUDE_TIMEOUT_MS) || 180_000` added to `src/config.mjs`
(pure data). Committed with Step 2.

## Step 2 — guard core + unit tests — DONE
`src/sdk-binding.mjs`: added `ClaudeTimeoutError` (class; `code="ETIMEDOUT_CLAUDE"`, `timeoutMs`) and
`awaitChildClose(child, { cli, timeoutMs })` — single-settle latch; on timer fire → `child.kill("SIGKILL")` +
reject typed; on `close` → resolve(code); on `error` → reject launch-hint. Both spawn cores (`_runClaude`,
`invokeClaude`) now `await awaitChildClose(...)`; all four request fns forward `timeoutMs` (default-off).
`src/sdk-binding.test.mjs`: 7 offline tests (fake `EventEmitter` child + `kill` spy, no spawn).
**Deviation from plan:** dropped the `unref()` on the timer — under `node --test` an unref'd timer lets the
loop resolve before firing, cancelling the timeout tests. The timer is always cleared-or-fired within the
call, so `unref` was unnecessary and harmful; removing it makes the guard deterministic. design.md updated.
`node --test src/sdk-binding.test.mjs` → 26/26.
Commit: `feat(T-198-01): claude -p subprocess-timeout guard (ClaudeTimeoutError + awaitChildClose)`.

## Step 3 — forward timeoutMs through runTieredOp — DONE
`src/model-tier.mjs`: `runTieredOp` destructures + forwards `timeoutMs` to the invoker. One spy test in
`src/model-tier.test.mjs` (10/10). Commit: `feat(T-198-01): forward timeoutMs through runTieredOp`.

## Step 4 — wire guard + record/abort into the climb — DONE
`experiments/eval-alignment/picture-climb.mjs`:
- imports `CLAUDE_SUBPROCESS_TIMEOUT_MS`; `diagnose()` passes `timeoutMs`.
- `RoundAbortedError` (typed, carries `round`/`voteOutcomes`/`timedOut`).
- `scoreBuild` vote loop records `voteOutcomes` (ok/malformed/timeout + ms); drops a timeout like a malformed
  (median survives); throws `RoundAbortedError` if `!samples.length` (never scores 0).
- `writeAbortRecord()` persists the partial trajectory + an `abort` block and returns with `exitCode=2`
  (recorded finding, not a crash); distinguishes all-timed-out (infra) from all-malformed.
- seed + cand `scoreBuild` calls wrapped to route `RoundAbortedError` → `writeAbortRecord` → clean return.
- `out` gains `votesTimedOut` + `subprocessTimeoutMs`; both trajectory pushes record `voteOutcomes`.
- `node --check` OK; `GUARD_ONLY=1` smoke clean (renders round-0 + beside, GL available, zero spend);
  `npm test` → **2377/2377** green; `measurements/` untouched.
Commit: `feat(T-198-01): timeout-guarded votes + record/abort in picture-climb`.

## Step 5 — run the metered climb — IN PROGRESS (see below)
Pre-flight `requestText` probe, then the metered climb with `CLIMB_OUT` → this work dir, backgrounded under
the now-bounded guard. Outcome recorded here honestly (verdict, or named failure — both complete results).

### Step 5 log
- **Pre-flight probe**: `requestText` (sonnet) → "READY" in 3.2s. Subscription auth reachable; the guard
  rode along (`timeoutMs: 60000`) without firing. No `claude -p` hang this session.
- **Run 1 (exit 1, crash)**: the **timeout guard HELD** — every strong-tier diagnose returned, NO hang (the
  failure mode this ticket targets did not recur and would have been caught). The climb ran rounds 0–4:
  - r0 `score=0`, `closure=0.615` → agent picked **`close_shell` FIRST** ("open colonnade, detail tools
    locked") — **form-before-detail ordering honored live**.
  - r1 `close_shell`: closure 0.615→1.000 but **score 0→0 → ROLLED BACK** ("tie, no shrink").
  - r2 `construct_walls`: **0→28 KEPT (+28)** — but its kept build has **closure 0.05** (open again).
  - r3 `apply_gable_roof`: 28→16 **regressed, rolled back**; **wider eyes fired** — `SCALE: ridgeToEave
    1.74 vs 1.35`.
  - r4 `close_shell`: 28→16 regressed, rolled back. Then **FATAL** in `agentPick.parse` — the agent emitted
    TWO JSON objects; naive first-`{`-to-last-`}` slice → `Unexpected non-whitespace after JSON` → exit(1),
    **trajectory.json never written**.
- **Robustness fix** (committed): string-aware balanced-brace `parse` (extracts the first object) + agentPick
  re-ask-once-then-`done` fallback. Verified on the two-object / trailing-prose / nested-brace cases.
- **Run 2 (exit 0, COMPLETE)**: climb ran to a clean `agent-done` stop; `trajectory.json` written.
  **votesTimedOut: 0** (12 votes, all `ok`, median diagnose **~33s** — well under the 3-min guard; the guard
  rode along bounded and never needed to fire this session). No hang, no crash, no abort.
  - r0 `score=16 closure=0.615` → agent picked **`close_shell` FIRST** (form-readiness cited).
  - r1 `close_shell`: closure 0.615→1.000, **score 16→16 (tie) → ROLLED BACK** ("no shrink").
  - r2 `construct_walls`: **16→0 regressed → ROLLED BACK**.
  - r3 `apply_gable_roof`: 16→16 (tie) → ROLLED BACK.
  - agent picked **`done`** honestly ("no remaining tool can close the form … detail tools are locked").
  - **Verdict: stalled=true, climbed=false, Δ0**, final score 16, **closure stayed 0.615** (the kept build is
    the seed — every form fix was rolled back). actedOn: none. eyesOnly: ROOF, WALL, OPENING. Framing residual
    clean (the SCALE flag was on the rolled-back gable candidate, not the kept build).
- **Human glance** (`first-r0-beside.png`, `closeshell-r1-beside.png`): the kept build is a dark, open,
  ragged mass — does NOT reach the gatehouse picture (no crisp gable, no arched gate, walls too dark). The
  rolled-back `close_shell` candidate is visibly MORE building-like (solid closed walls) yet scored a tie —
  the conflict, made visible.

## Step 6 — review — DONE (review.md written, artifacts committed)

### Surfaced finding (→ E-49): form-readiness vs picture-score accept-gate CONFLICT
The picture-score accept-gate rolls back `close_shell` (closes the shell, but the picture score *ties* — a
closed grey box doesn't read closer to the concept than an open one at this score resolution), while
`construct_walls` scores +28 yet leaves the shell **open** (closure 0.05). So the score-driven gate keeps the
form-BROKEN build and rejects the form-FIX the ordering gate demands → the climb oscillates. This is an
orchestration gap between two correct-in-isolation mechanisms (T-197 ordering gate ⟂ T-191 accept-gate), not a
hand or eye defect — a precisely-named input to E-49. Confirm/refine against run-2's recorded trajectory.

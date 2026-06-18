# T-198-01 — Design

Story **S-196** / Epic **E-51**. Decisions + rejected alternatives for (1) the subprocess-timeout guard and
(2) the metered re-climb. Grounded in `research.md`.

## Decision 1 — where the timeout lives: a testable helper in `sdk-binding.mjs`

**Chosen:** Extract the unbounded close-promise into a small, exported, **injection-friendly** helper
`awaitChildClose(child, { cli, timeoutMs })` and use it from both spawn cores (`_runClaude`, `invokeClaude`).
On timeout it `child.kill("SIGKILL")` and rejects with a typed `ClaudeTimeoutError`. `timeoutMs` threads
down from `requestText`/`requestTextWithImage`/`requestDesignArtifact*` → the cores → the helper.

Why this seam:
- It is the **exact line that hangs** (research: sdk-binding.mjs:425 / :235). Wrapping it is the minimal,
  on-target fix — no new abstraction layer, no behavioural change when `timeoutMs` is unset (default off ⇒
  byte-identical to today).
- It is **unit-testable without spawning `claude`**: a test passes a fake child (`EventEmitter` + `.kill()`),
  a tiny `timeoutMs` (e.g. 20ms), and asserts (a) the timer fires → `.kill` called → rejects with
  `ClaudeTimeoutError`; (b) a child that emits `close` first → resolves with the code, timer cleared, kill
  NOT called. This is the ticket's "unit/abstracted test … not a live hang." It honors the sdk-binding test
  rule (never spawn `claude`, never call the live request fns).
- One helper, both cores ⇒ the guard is **reusable infra** for every `claude -p` runner (the ticket's note),
  not just picture-climb.

**Typed error:** `class ClaudeTimeoutError extends Error` with `name="ClaudeTimeoutError"`,
`code="ETIMEDOUT_CLAUDE"`, and `timeoutMs`. A *class* (not a string sniff) so callers can `instanceof`-branch
the degrade path cleanly and a test can assert the type. Mirrors how the file already throws typed-ish launch
errors, but upgrades to a real class because the climb must *distinguish* timeout from malformed.

### Rejected alternatives for Decision 1
- **`AbortController` + `spawn(..., { signal })`** — Node kills the child on abort, but the rejection is a
  generic `AbortError` with no `timeoutMs`, and wiring an external controller per call is more plumbing than
  a wrapped promise. We want a *typed* error carrying the budget; a class is clearer. (We still `SIGKILL`
  explicitly so a wedged child dies even if it ignores SIGTERM.)
- **`child.timeout` / a library (e.g. `execa`)** — adds a dependency for one wrapped promise; `spawn` is
  already in use. No.
- **Timeout at the climb level only** (race `diagnose()` against a `setTimeout`) — leaves the orphaned
  `claude` child running (resource leak; it is the wedged process we must *kill*). The kill must happen at
  the spawn site, where the `child` handle is. Rejected.
- **Adding `timeoutMs` to `CLIMB_DEFAULTS`** — it is a transport concern, not climb policy. Single-source in
  `config.mjs` (`CLAUDE_SUBPROCESS_TIMEOUT_MS`) and thread down. (Decision 3.)

## Decision 2 — the degrade policy: **drop the vote, abort the round if ALL time out**

The vote loop (research) already drops a *malformed* vote and proceeds on survivors. The timeout guard turns
a hang into a throwable error, so the symmetric, minimal-surprise policy is:

- **Per timed-out vote → DROP it** (proceed on the surviving votes; median over what returned). Identical
  shape to the existing malformed-drop, so the median stays honest. **Recorded** (not console-only): each
  round carries `voteOutcomes: [{ vote, status: "ok"|"malformed"|"timeout", ms }]`.
- **All votes failed AND ≥1 was a timeout → ABORT the round with a typed `RoundAbortedError`**, surfaced by
  `main()` as a **recorded finding** (write the partial trajectory + an `abort` block), NOT a crash, NOT a
  score of 0. This is the ticket's "all-votes-timed-out is detected and aborts/flags the round, never scored
  as 0" and its falsification guard "the guard masks a real auth/spend failure → must be detected and
  reported." A run that loses every vote is a **corrupted measurement**, and the run must say so.
- **All votes failed, all malformed (no timeout)** → keep today's behavior (throw "all N diagnoses failed")
  but route it through the same recorded-abort path so the trajectory still lands on disk.

**Why drop, not retry-once or lower-tier** (the ticket lists all three as acceptable; we pick and document
drop):
- **Retry-once**: a strong-tier call that wall-clock-timed-out is most likely to time out again (the failure
  is infra/auth/spend, not transient jitter) — it doubles the wait for little gain, and a re-ask burns the
  budget (the [[spend-limit-reply-failure-mode]] / [[same-prompt-seam-handle-dont-reject]] lessons). VOTES=3
  already gives redundancy; dropping one and keeping two is a valid median.
- **Lower-tier fallback**: silently swapping a timed-out *strong* diagnose for a *light* (Haiku) one
  **changes the measurement instrument mid-climb** — the score is no longer comparable across rounds, which
  corrupts the very comparison the climb exists to make. Rejected on measurement-integrity grounds.
- **Drop** keeps the instrument fixed, the median honest on survivors, and makes the all-fail case loud.
  Documented as the policy; retry/lower-tier explicitly considered and rejected above.

## Decision 3 — the timeout value: config default, env-overridable

`CLAUDE_SUBPROCESS_TIMEOUT_MS` in `config.mjs`. Default **180000 (3 min)** per diagnose call: the strong-tier
4-azimuth diagnose is heavy but a healthy call returns in well under a minute (obs: sonnet ~4s text; a strong
multi-image diagnose is larger but minutes, not tens of minutes). 3 min is comfortably above a healthy call
and far below the ~20 min hang that motivated this. Env override (`CLAUDE_TIMEOUT_MS`) for tuning without a
code edit. The default-off contract is preserved at the transport layer: `awaitChildClose` only arms a timer
when `timeoutMs > 0`, so non-climb callers that pass nothing are byte-unchanged.

## Decision 4 — running the climb: real, on the closed form, honestly recorded

- Invoke the **existing** runner unchanged in behavior except the guard: `CLIMB_OUT=docs/active/work/
  T-198-01/trajectory.json node experiments/eval-alignment/picture-climb.mjs 2>&1 | tee …/climb.log`.
- Pre-flight with `GUARD_ONLY=1` (zero spend) to confirm the wiring + render seam + framing eyes still fire
  after the guard edit, **then** run metered.
- The seed already closes via `close_shell` (closure 0.615→1.000, T-197) — the agent should pick it first
  under the form-readiness prompt; carve/relief become eligible only after. We do **not** script the picks;
  the verdict is *what the agent does*.
- **If it hangs again despite the guard** → that is a reportable finding (deeper infra), recorded in
  `progress.md`/`review.md` with the evidence (CPU/elapsed/spawn count), not a faked run. The guard makes
  this *much* less likely (a wedged child is now killed at `timeoutMs`), but the ticket demands we not fake.
- **If the metered call is unavailable** in this environment (auth/spend) → every vote times out → the new
  abort path fires → we report "guard works; metered signal unavailable here" honestly. The guard's own unit
  test still proves the mechanism. This is the anti-hedge "embarrassing result still worthy" branch: the
  guard is the durable deliverable; the metered verdict is reported at whatever strength the environment
  permits, named precisely.

## Risk register
- **Timer leak on the happy path** → `awaitChildClose` clears the timer on settle (close/error), so it never
  dangles past the call. (No `unref()`: the timer is meant to keep the loop alive until it fires or is
  cleared — and dropping `unref` is what makes the guard deterministic under `node --test`.) Asserted by the
  close-first and no-timeoutMs tests.
- **SIGKILL races a near-simultaneous close** → a `settled` latch makes the promise settle exactly once;
  whichever of {timeout, close, error} wins, the others are no-ops. Asserted.
- **Guard changes default behavior** → timer only arms when `timeoutMs > 0`; all existing callers pass
  nothing ⇒ unchanged. Pinned by a "no timeoutMs ⇒ resolves normally, no timer" test.
- **Measurement corruption masked** → the all-timed-out abort is the explicit guard; never scored 0.

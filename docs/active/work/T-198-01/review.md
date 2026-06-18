# T-198-01 — Review

Story **S-196** / Epic **E-51**. *Metered gatehouse re-climb on the closed form, with a subprocess-timeout
guard.* The handoff doc: what changed, what's tested, the deferred verdict (answered), and open concerns.

## What changed (files)

| File | Change |
| --- | --- |
| `src/config.mjs` | **+** `CLAUDE_SUBPROCESS_TIMEOUT_MS` (180000, `CLAUDE_TIMEOUT_MS`-overridable). |
| `src/sdk-binding.mjs` | **+** `ClaudeTimeoutError` class, **+** `awaitChildClose(child,{cli,timeoutMs})`; both spawn cores (`_runClaude`, `invokeClaude`) now await it; all four `request*` fns forward `timeoutMs` (default-off). |
| `src/sdk-binding.test.mjs` | **+** 7 offline guard tests (fake `EventEmitter` child + `kill` spy; no spawn). |
| `src/model-tier.mjs` | `runTieredOp` forwards `timeoutMs` to the invoker. |
| `src/model-tier.test.mjs` | **+** 1 spy test (timeoutMs reaches the shim). |
| `experiments/eval-alignment/picture-climb.mjs` | `diagnose` passes the timeout; `scoreBuild` records `voteOutcomes` + aborts (typed `RoundAbortedError` → `writeAbortRecord`, never scores 0) when all votes fail; trajectory/`out` carry `voteOutcomes`/`votesTimedOut`/`subprocessTimeoutMs`; **robust balanced-brace `parse` + agentPick re-ask-once-then-`done` fallback** (a mid-run crash fix discovered by the live run). |

Commits (5): config+guard · runTieredOp forward · climb wiring/record/abort · robust agent-pick parse ·
(this) RDSPI artifacts. `measurements/` untouched (verified clean). Subscription-only invariant held
(no `ANTHROPIC_API_KEY` in the guarded modules; source-guard test green).

## Deliverable 1 — the subprocess-timeout guard ✅

The exact line that hung (the close-promise that resolved only on `error`/`close`) is now wrapped by
`awaitChildClose`: with `timeoutMs > 0` a timer SIGKILLs a non-returning child and rejects a typed
`ClaudeTimeoutError` (`code: "ETIMEDOUT_CLAUDE"`, `timeoutMs`). Single-settle latch; default-off when no
`timeoutMs` is passed (every pre-existing caller byte-unchanged). The climb's vote loop drops a timed-out vote
(median survives the rest), **records** every outcome (`voteOutcomes`), and **aborts the round** — never
scores 0 — if all votes fail, distinguishing all-timed-out (infra/auth/spend) from all-malformed. The guard is
reusable infra: `invokeClaude` (the design-artifact path) is guarded too, so every `claude -p` runner inherits
it.

## Deliverable 2 — the metered climb (the deferred verdict) ✅ run / claim ❌ refuted-as-named

The climb **completed end-to-end** (exit 0, `agent-done`), `trajectory.json` + per-round beside renders
written. **votesTimedOut: 0** — 12 strong-tier diagnoses, all returned (median ~33s), no hang. The guard rode
along bounded and proved robust (the ~20-min hang did not recur; had it, the guard would have caught it).

**The deferred questions, answered from the trajectory:**
1. **Did the agent pick `close_shell` before detail?** **YES** — round 0, explicitly citing the form-readiness
   gate ("closure 0.62 — open colonnade; detail tools locked until ≥0.9"). The T-197 ordering gate was
   honored live: no detail tool was ever picked.
2. **Did it pick `carve_arch` + `relief_walls`?** **NO — and correctly.** They are detail tools, LOCKED until
   closure ≥ 0.9, which was **never reached**, so they were never eligible. Not an agent failure — a
   consequence of (3).
3. **Did the WALL major clear?** **NO.** `construct_walls` (the WALL hand) regressed 16→0 and was rolled back;
   `close_shell` tied and was rolled back. WALL stayed in `eyesOnly`.

**Falsifiable claim → refuted, precisely named (the E-49 input):** the build did **not** reach its picture and
did **not** sequence the hands — because of a **form-readiness ⟂ picture-score accept-gate conflict**:
- `close_shell` closes the shell (closure 0.615→1.000) but the picture-score **ties** (16→16) — a closed grey
  box reads no closer to the concept *at the diagnose score's resolution* than an open one — so the
  score-driven accept-gate (T-191) **rolls it back** ("no shrink").
- `construct_walls` scores movement but leaves the shell **open** and (this run) **regressed**.
- So the accept-gate keeps the form-BROKEN build and rejects the form-FIX the ordering gate (T-197) demands.
  The shell never closes → detail tools never unlock → the climb **stalls at the open colonnade** (Δ0,
  closureLast 0.615). The agent then picked `done` honestly.

This is an **orchestration gap between two mechanisms that are each correct in isolation**, not a hand or eye
defect. It is the fourth gap E-51 was probing for — *not* a missing picture-lever (roof pitch/material) but a
**gate-arbitration** one: a FORM win must be credit-able even when it yields no immediate picture-score gain.
Named here as the clean input to E-49.

**Human glance:** kept build (= seed) is a dark, open, ragged mass — no crisp gable, no arched gate, walls too
dark; it does **not** reach the gatehouse picture. The rolled-back `close_shell` candidate
(`closeshell-r1-beside.png`) is visibly **more building-like** (solid closed walls) yet scored a tie — the
conflict, made visible. **Autonomy:** picks were fully autonomous (no scripted picks); the only human input was
running the command. **Cost:** 4 scored builds × 3 votes = **12 strong-tier (opus) diagnoses** (median ~33s) +
~5 sonnet agent-picks; subscription shim only.

## Test coverage

- **Guard (CI-protected):** 7 `awaitChildClose`/`ClaudeTimeoutError` tests (timeout→SIGKILL→typed error;
  close-first→resolve, no kill; no-timeoutMs→no timer; late-close no-op; launch-error; error shape) + 1
  `runTieredOp` forward test. No spawn, no live hang. `npm test` → **2377/2377** green.
- **Not unit-tested (by project convention — runners aren't in `npm test`):** the climb wiring, the
  `RoundAbortedError`/`writeAbortRecord` path, and the robust `parse`. Verified by `GUARD_ONLY` smoke + the
  live run + a standalone check of `parse` on the two-object / trailing-prose / nested-brace cases.

## Open concerns / handoff

1. **The form-vs-score conflict (→ E-49, the headline).** The accept-gate must credit a form-readiness gain
   (closure↑) even at a picture-score tie — otherwise `close_shell` can never be kept and the gatehouse can
   never close. Candidate: a closure-aware accept term, or letting the form-readiness gate *force-keep* a
   closing move below the threshold. This is the single thing standing between "picks close_shell first" and
   "reaches its picture."
2. **The all-votes-timed-out abort path is unit-untested in the runner** (the runner isn't in `npm test`). The
   *mechanism* it relies on (typed timeout) is tested; the climb-level branch is verified only by reading the
   code + the (clean) live run. If this matters, lift `scoreBuild`'s vote loop into a `src/` helper with an
   injected `diagnose` and test the abort/drop directly.
3. **Diagnose score variance.** Round-0 scored 0 in run-1 and 16 in run-2 (same seed) — the documented 0–76
   swing. VOTES=3 median dampens but does not remove it; the "tie" verdicts ride on a noisy scalar. A finer
   form signal (not the picture-score) for the *form* stage would de-noise the close_shell decision.
4. **The agentPick crash was latent in every prior climb** — the naive `parse` would crash on any two-object
   reply. Fixed here; worth porting the balanced-brace `parse` to `autonomy-loop.mjs` if it shares the idiom.

**Bottom line:** the guard is the durable, tested win (no `claude -p` runner can hang on a non-returning child
again); the metered climb now completes and records honestly; and the gatehouse's remaining barrier is named
precisely — a gate-arbitration conflict, not a missing hand — the clean handoff to E-49.

# T-205-01 — Structure: the shape of the change

A run-and-judge ticket. The "code" is one line of harness plumbing plus a set of work-dir artifacts produced
by running the instrument. No new hand, no gate change, no scoring change.

## Source change (exactly one line, default-preserving)

### `experiments/eval-alignment/picture-climb.mjs`
- **Line 78**, change the round-budget binding from a fixed destructure to an env-overridable one:
  ```js
  // before
  const { margin, stallK, maxRounds, minRounds } = CLIMB_DEFAULTS;
  // after
  const { margin, stallK, minRounds } = CLIMB_DEFAULTS;
  // CLIMB_MAX_ROUNDS: metered-budget knob for the capstone re-climb (T-205-01). Defaults to the frozen
  // CLIMB_DEFAULTS.maxRounds (5) so npm test + every existing climb are byte-unchanged. Not a new hand —
  // only how many rounds the agent gets to act, in the VOTES/CLIMB_OUT family of run parameters.
  const maxRounds = Number(process.env.CLIMB_MAX_ROUNDS) || CLIMB_DEFAULTS.maxRounds;
  ```
- **Public interface:** unchanged. `maxRounds` flows into the existing `for` loop bound and every
  `stoppingDecision({…, maxRounds})` call exactly as before; with the env var unset the value is identical to
  today (5). The trajectory already serialises `maxRounds`-derived `stopReason`, so the budget is auditable.
- **Boundary respected:** I do **not** touch `CLIMB_DEFAULTS` in `src/workshop/climb-gate.mjs` (the frozen
  default) — only the runner's local binding. The climb-gate unit tests that pass `maxRounds:5` explicitly to
  `stoppingDecision` are unaffected; `CLIMB_DEFAULTS.maxRounds` is never asserted (only `minRounds`).

That is the entire source delta. No file is created or deleted in `src/` or `experiments/`.

## Work-dir artifacts (produced by the run — `docs/active/work/T-205-01/`)

| File | Origin | Content |
|------|--------|---------|
| `research.md` | written | codebase map (done) |
| `design.md` | written | the round-budget decision + run recipe (done) |
| `structure.md` | this file | the change shape |
| `plan.md` | written | ordered run steps |
| `trajectory.json` | the metered run (`CLIMB_OUT`) | `picture-climb/v1` structured record |
| `climb.log` | the metered run (stderr) | full round-by-round narration |
| `beside-first.png` | `cp` round-0 beside | the seed glance |
| `beside-best.png` | `cp` max-score round beside | the best glance |
| `beside-final.png` | `cp` final-kept round beside | the judged glance |
| `progress.md` | after the run | run as executed + trajectory read + glance |
| `review.md` | last | handoff: verdict, autonomy, cost, invariants |

The per-round renders themselves live under `builds/gatehouse/picture-climb/round-*/` (draft territory, not the
frozen instrument); the three copied PNGs are the curated glance evidence in the work dir.

## Ordering that matters

1. **Source knob first**, before any metered spend — so the run actually gets the larger budget. Trivial, no
   test impact, but must precede Step "metered climb".
2. **Baseline `npm test` + `measurements/` clean BEFORE the run** — captures a green baseline so a post-run red
   is attributable to environment, not the run (nothing source-side changes climb scoring).
3. **GUARD_ONLY pre-flight BEFORE the metered run** — proves GL + render seam + wiring at zero spend; a failure
   here aborts before any subscription cost.
4. **Metered run** — the one expensive, irreversible (spend) step. Background; monitored to completion.
5. **Collect + read + glance** — read-only over the produced artifacts.
6. **Re-verify `npm test` + `measurements/`**, then commit. The commit bundles the one-line knob + the work
   dir; the draft `builds/` renders are git-ignored/untracked draft territory (copy the three into the work dir
   so the evidence is committed).

## Invariants asserted by structure (not just plan)
- The env default makes the knob inert under `npm test` → green count unchanged by construction.
- No path under `benchmarks/sculpture/measurements/` is written by the runner (it writes `CLIMB_OUT` +
  `builds/`); frozen instrument is structurally untouched.
- `runTieredOp({tier:"strong"}) → claude -p` is the only model path; no code path sets `ANTHROPIC_API_KEY`.

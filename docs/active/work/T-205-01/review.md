# T-205-01 — Review: the M1 capstone metered re-climb

Story **S-205** / Epic **E-52**. Run-and-judge: re-run the metered gatehouse climb with the three E-52
geometry fixes (T-202 form-metric, T-203 wide-arch rebuild, T-204 roof slate+pitch) committed, and judge it on
the glance. The handoff for a human reviewer.

## Outcome in one line

**Did NOT reach its picture. Two of three fixes composed live (T-202, T-204); T-203 did not; and a precise
SIXTH GAP now dominates — the measure has no gradient on a far-from-picture seed, so genuinely-improving hands
are all rolled back and the climb stalls flat at 0.** A complete result under the anti-hedge claim (→ E-53).

## What changed (files)

- **`experiments/eval-alignment/picture-climb.mjs`** — one line: `maxRounds` now reads an optional
  `CLIMB_MAX_ROUNDS` env override, defaulting to the frozen `CLIMB_DEFAULTS.maxRounds` (5). A metered-budget
  knob, not a new hand; default-preserving (the runner isn't in `npm test`, and `CLIMB_DEFAULTS.maxRounds` is
  never asserted). Rationale: T-201 hit the 5-round cap with `recolor_roof` unfired; the knob rules the cap out
  as a confound. **It proved unnecessary** (the climb stalled at round 4), which is itself the useful result:
  the limiter is the measure, not the budget.
- **`docs/active/work/T-205-01/`** — RDSPI artifacts (`research/design/structure/plan/progress/review.md`),
  `trajectory.json`, `climb.log`, three glance renders (`beside-first/best/final.png`, all = the seed since
  everything rolled back), three candidate glances showing the hands fired visually.
- **No change** under `src/`, no new hand, no gate/scoring change, `measurements/` untouched.

## The trajectory read (every claim cited to a field)

- **No oscillation (T-202 took live).** `inventory.verdict.oscillated=false`; `relief_walls` `closureAfter=1.0`
  and `apply_gable_roof` `closureAfter=1.0` (T-201 cratered to 0.068 under relief). The form metric no longer
  turns the gate against detail — the fifth gap's explicit demand is met.
- **Pitch landed (T-204 took live).** `[pitch-lever] ratio 1.68 → 1.34 via pitch 0.5 (target 1.35)`; r3
  framing `ridgeToEave 1.3, flagged:false`. `cand-gable-pitch-r3.png` shows a legible peaked gable.
- **Arch did NOT land (T-203 did not compose).** r2 `rebuild_arch` `head=false (bare rectangle, no spandrels)`
  → arch-aware coherence gate refuted → `frame_arch` fallback (too narrow). The probe's `head=true` did not
  reproduce on the live seed geometry. Arch absent.
- **Slate untested.** `recolor_roof` never reached — the climb stalled at round 4 (not the cap).
- **Stall, not climb.** `trend 0→0→0→0→0`, `delta 0`, `stopReason "stalled (3 rolled back)"`,
  `allRoundVotes [0×9]`. Every move rolled back as `gate.reason "tie (0): no shrink"`.

## The sixth gap (→ E-53), at full strength

**The measure has no gradient on a far-from-picture seed.** Two coupled mechanisms:

1. **Score floors at 0 + frozen department diagnosis.** Seed and all three candidates score `0/0/0` with an
   identical 4-major verdict, re-emitted verbatim even when the render visibly changed (it calls the r3 closed
   brown gable "does not read as a gable"). So the scalar has no gradient **and** the department-dominant
   override (T-191) — the designed escape from the 0-floor — is starved (it needs a major reported *cleared*;
   none ever is). This is the E-44/E-45/E-46 "gate is the measure, not the build" thread, now **binding** for
   the gatehouse once the geometry blockers are gone.

2. **Seed/metric divergence (a T-202 trade-off).** The seed (unchanged since Jun 11) renders as a ragged
   terraced "ruined box", yet `eaveRingClosure` reads it **0.980** where T-201 read the **same seed 0.615**.
   T-202's `robustExtent` proud-trim removes the oscillation (good) but also trims the genuine raggedness, so
   the form gate believes the ruin is closed and never picks `close_shell`. The metric now **over**-reads
   closure (T-201 under-read it). Hands decorate a base that reads as a ruin → no department fix lifts it off 0.

## Autonomy & metered cost

- **100% autonomous** — every pick agent-chosen and well-reasoned; the limiter was the measure, not the agent.
- **Cost:** tier `strong` (`claude-opus-4-8`), `VOTES=3`. **12** strong `DiagnoseBuild` calls (round 0 +
  r1–r3, 4 × 3) + **4** sonnet picks. `votesTimedOut: 0`; no abort; no hang; subscription shim only (no
  `ANTHROPIC_API_KEY`). Cheaper than T-201 (15 calls) because the stall stopped it early.

## Test coverage & invariants

- `npm test` **2411/2411** green before and after — the knob is inert under the suite by construction.
- `git status measurements/` clean before and after — **frozen instrument untouched**.
- GUARD_ONLY pre-flight clean (GL up, render seam proven, zero spend).
- No hang: per-call 180 s subprocess-timeout guard held; `votesTimedOut: 0`.

### Coverage gaps (honest)
- This ticket adds **no regression test** — the sixth gap is a *measurement* defect (judge insensitivity +
  the closure-trim divergence), not a localized code bug with a clean failing fixture. E-53 should open with a
  characterization: a fixed pair of builds (seed vs relief-applied) that the judge *should* rank apart but
  scores identically, plus the seed whose glance ("ruin") contradicts its closure (0.98).
- The knob has no unit test (the runner is out of `npm test` by design); it is default-preserving and
  parse-checked.

## Critical issues for the human reviewer

1. **M1 is NOT met on the gatehouse.** The kept build is a ragged dark "ruined box". The wins are real but
   invisible to the gate: T-202 killed the oscillation, T-204's pitch lever lands 1.34 and reads as a gable.
   Per the milestone doctrine (the glance beats the gate), this is a near-miss with the bottleneck relocated.
2. **The binding constraint has moved from the build to the measure.** E-52's three geometry fixes were the
   right fixes (two landed; T-203 needs a seed-robust arch-head), but the climb can no longer *register*
   improvement: the whole-build picture judge is gradient-less and inconsistent at the 0-floor, and the
   department override is starved. **E-53's first ticket should be the gate sensitivity, not another hand.**
3. **T-202 has a side effect to revisit.** Its proud-trim raised the seed's measured closure 0.615→0.980 on an
   unchanged ragged seed — correct for oscillation, but it now hides genuine raggedness from the form gate
   (so `close_shell` is never offered on a ruin). The form signal needs to separate "proud detail" from
   "ragged hole" — they are not the same, and the trim conflates them.
4. **T-203 is a charter-bound, not closed.** `rebuild_arch` builds no head on the live seed (only on the
   probe fixture). Either the seed lacks the wall-above-spring the head needs, or the head construction is
   fixture-specific. Name it for E-53; do not treat T-203 as fully landed.

## Verdict

E-52's "done when" is satisfied by the **named-sixth-gap** branch: the gatehouse did not reach its picture, but
the gap is named precisely — **the measure has no gradient on a far-from-picture seed** (judge insensitivity +
the closure-trim divergence), with T-203's arch-head as a coupled charter bound. Two of three fixes are proven
live (T-202 oscillation killed, T-204 pitch landed). This licenses E-53 (generalize the climb) with a concrete,
ranked work-list whose top item is the gate's sensitivity, not another construction hand.

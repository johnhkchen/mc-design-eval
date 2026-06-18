# T-201-01 — Review: the M1 capstone metered re-climb

Story **S-201** / Epic **E-49**. Run-and-judge: the metered gatehouse climb re-run end-to-end on the
form-credit (T-199) + de-noised (T-200) gate, the proof T-198 could not deliver. **No source changed** — the
runner and both gate fixes were exercised as committed.

## Outcome in one line

**The fix took live and the first four gaps fell in sequence — but the gatehouse did NOT reach its picture; a
precise fifth gap is named (→ E-52).** A complete result under the anti-hedge claim: the failure mode is led
with, not hidden.

## What was produced (all in `docs/active/work/T-201-01/`)

- `research.md`, `design.md`, `structure.md`, `plan.md` — RDSPI phase artifacts.
- `trajectory.json` — the structured climb record (`picture-climb/v1`, 7 trajectory entries incl. terminal).
- `climb.log` — full stderr of the metered run.
- `beside-first.png` (round 0), `beside-best.png` = `beside-final.png` (round 4, the kept build, score 32).
- `progress.md` — the run as executed + the trajectory read + the glance.
- This `review.md`.

**No files created/modified/deleted in `src/` or `experiments/`.**

## The headline: the S-199/S-200 fix took live

The single decisive read — the `close_shell` round's gate object:

```
r1 close_shell  accept=true  reason="closure +0.385 (0.615→1.000) form-credit"   (picture score tie 0→0)
```

This is the **exact T-198 deadlock, broken.** T-198 rolled `close_shell` back on a 16→16 tie (`tie … no
shrink`); here, on a 0→0 tie, the form-credit clause + closure-only form-move routing **kept it**. Closure
0.615→1.000 unlocked detail (r2/r3/r4 detail picks applied, not form-gated). The WALL majors then **cleared**
(2→0) and `relief_walls` reads as *construction* on the glance — proving the carve/relief hands work on a
closed shell, the thing the open colonnade had hidden. Fully autonomous: the agent picked every tool
(`close_shell → apply_gable_roof → carve_arch → relief_walls → close_shell → recolor_roof`) and reasoned
correctly each round.

## The fifth gap (→ E-52): detail geometry collapses the form-readiness metric

After `relief_walls` (r4), `closureAfter` fell **1.000 → 0.068** while relief's own `recessClosureGuard`
reported "closure held" and the shell is physically intact. Root cause (read, not guessed —
`eaveRingClosure`, `src/view/wall-generate.mjs:275`): the metric folds **every** band column `(x,z)` into the
perimeter, so the **proud quoins (224) + plinth (106)** `relief_walls` stands *outside* the wall plane — the
very geometry that makes the wall read as construction — expand the sampled ring and crater `closureOf`.

The collapse then turned the climb's own gate against the build: r5 the agent was correctly told "0.07 — open"
and re-picked `close_shell`, which **no-op'd** (`registerRect` coverage 0.26 < 0.5 — the proud columns also
defeated footprint registration). On a longer budget this oscillates: detail → "shell re-opened" → close_shell
no-op → detail. **Form measurement and detail construction collide; the form-readiness signal must be made
invariant to proud detail (e.g. measure closure on the wall plane / footprint, not over all band columns).**
This is the "live sequencing failure" the ticket anticipated, named at full strength as the E-52 input.

## Residuals confirmed live (known, ranked below the fifth gap)

- **OPENING — no arched gate.** `carve_arch` produced a ragged carve (notched columns) the coherence gate
  correctly refuted; the 1-wide passage needs a *rebuild to a wide opening*, not a widen-carve. (Pre-named.)
- **ROOF — brown not slate + too steep.** The agent's terminal `recolor_roof` pick never ran (`maxRounds=5`
  cap). The wider eyes flagged **SCALE: ridgeToEave 1.6316 vs 1.35 (major)**. The E-50 roof residual,
  confirmed live by the framing eyes.

## Autonomy & metered cost

- **Autonomy: 100% autonomous.** No scripted picks; every tool was agent-chosen, and the picks were *good* —
  the limiter was the gate/metric, not the agent's judgement.
- **Cost:** tier = `strong` (`claude-opus-4-8`); `VOTES=3`. Scored (metered) rounds: r0,r1,r2,r3,r4 = **5 × 3
  = 15** strong-tier `DiagnoseBuild` calls (r5 was a no-op → no spend); **6** agent picks (`claude-sonnet-4-6`).
  `votesTimedOut: 0`, no aborts, no re-asks. Rounds run: 5 (round cap). Subscription shim only — no
  `ANTHROPIC_API_KEY`, no metered API.

## Test coverage & invariants

- `npm test` **2397/2397** green before *and* after the run (no source regression — nothing source-side
  changed).
- `git status measurements/` clean before *and* after — **frozen instrument untouched**.
- GUARD_ONLY pre-flight clean (GL available, render seam proven, zero spend).
- The run did not hang: the per-call 180s subprocess-timeout guard held; `votesTimedOut: 0` (it wasn't even
  needed this run).

### Coverage gaps (honest)

- This ticket adds no tests (it adds no code). The *gate logic* it exercised is unit-covered (CG-FC1–6,
  CG-FS1–6); this run is the **live** confirmation those units predicted — and they did: the live keep matched
  CG-FC1's recorded counts.
- The fifth-gap mechanism (`eaveRingClosure` not invariant to proud detail) has **no regression test** because
  the fix belongs to E-52; it is documented here and in `progress.md` so E-52 can open with a failing case.

## Critical issues for the human reviewer

1. **M1 (one house that looks like its picture) is NOT yet met** for the gatehouse. The closed dressed-stone
   mass is real progress, but the defining arched gate, the roof colour, and the roof pitch are all still off.
   Per the milestone doctrine (the glance beats the gate), this is honestly a *near-miss*, not a pass.
2. **The form-credit fix is vindicated** — it did exactly what S-199/S-200 designed, live. That part of E-49 is
   proven; do not re-litigate it.
3. **E-52 should open with the form-metric/detail collision** as its first ticket — it is the highest-leverage
   blocker (it sabotages the climb after the first detail pass) and it is a clean, well-localized fix
   (`eaveRingClosure` measurement scope). The OPENING rebuild and the roof recolor/pitch are the next two.

## Verdict

E-49's "done when" is satisfied by the **named-fifth-gap** branch: the gatehouse did not reach its picture, but
the gap is named precisely (detail geometry collapses the form metric → E-52), and the form-credit fix is
proven live. This licenses moving from one-subject M1 to generalization with a concrete, ranked work-list.

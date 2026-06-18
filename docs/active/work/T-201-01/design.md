# T-201-01 — Design: how to run and how to judge

This ticket adds **no code**. The "design" is the run protocol and the judgment rubric — the choices that make
the metered run reproducible, honest, and decisively interpretable. Grounded in the research: the runner and
both fixes already exist and the GUARD_ONLY seam is proven; the only open question is what the *live* gate does.

## Decision 1 — invoke the existing runner unchanged vs. fork a T-201 variant

**Chosen: invoke the existing runner unchanged**, redirecting only output via env (`CLIMB_OUT`).

- The ticket is explicitly run-and-judge ("adds no new hand or eye; if it needs one, that's the named fifth
  gap, not in-scope"). Editing the runner would (a) risk the very gate logic under test and (b) violate scope.
- The runner already takes `CLIMB_OUT` (line 543) → point it at `docs/active/work/T-201-01/trajectory.json`.
- Per-round beside renders go to `builds/gatehouse/picture-climb/round-N/` (not configurable, fine — they are
  draft artifacts; we copy first/best/final into the work dir for the handoff).
- **Rejected: a forked runner.** No behavior change is wanted; a fork would diverge from the unit-tested gate
  and is pure risk for zero benefit.

## Decision 2 — capture strategy (the deliverables)

Three artifacts the ACs demand, plus the trajectory:

1. **`climb.log`** — full stderr of the run (the runner narrates every round: pick, score Δ, KEPT/ROLLED BACK
   + reason, closure, framing, the final verdict block). Captured with `… > climb.log 2>&1`.
2. **`trajectory.json`** — the structured record (`CLIMB_OUT`). Every round carries `pick`, `gate`
   (accept/reason), `closure`/`closureAfter`, `deptMajors{Before,After}`, `framing`, `voteOutcomes`. This is
   the **primary evidence** for the autonomous-sequencing verdict — read it, don't trust the log prose alone.
3. **Beside-concept renders — first / best / final** — copied from `builds/gatehouse/picture-climb/round-*`
   into the work dir. These are the **glance** evidence.

## Decision 3 — the judgment rubric (how the trajectory answers the ACs)

The AC's "autonomous-sequencing verdict" is a sequence of yes/no reads against `trajectory.json`:

| Question | Where in trajectory | Pass condition |
|---|---|---|
| Did the agent pick `close_shell` on the open form? | round-0 `pick.tool` (+ any blocked detail re-picks) | `close_shell` chosen while `closure < 0.9` |
| Did `close_shell` **stick** (not roll back)? | the round whose `pick.tool==="close_shell"`: `accepted` + `gate.reason` | `accepted===true`, reason `form-credit` (the T-199 fix), NOT `tie … no shrink` |
| Did closure reach ≥ 0.9 and **unlock detail**? | that round's `closureAfter`; later detail rounds not `blocked` | `closureAfter ≥ FORM_READY_CLOSURE`; a later carve/relief round is applied, not form-gated |
| Did the agent pick carve + relief? | later `pick.tool` ∈ {`carve_arch`,`relief_walls`} | both appear, applied (not blocked) |
| Did WALL / OPENING majors clear? | `deptMajorsBefore/After` on the WALL/OPENING rounds | the targeted dept major count drops |

**The decisive single read:** the `close_shell` round's `gate` object. If `accepted:true` with reason
`form-credit` → the S-199/S-200 fix took live (the T-198 deadlock is broken). If `accepted:false` with a tie
rollback → the fix did **not** take live → that is failure-mode (a), name why at the gate.

## Decision 4 — the glance verdict (human, not metric)

Per the milestone doctrine (numbers are diagnostics, the stranger is the judge, the glance beats the gate):
inspect the **final beside-concept render** against the concept and state plainly, on the calibrated-honesty
register (neither "milestone!" nor performed brutality):

- **Reached-its-picture** iff the glance shows: closed dressed grey-stone walls (not a colonnade), an arched
  gate, a dark gabled roof, right orientation, plausible proportion. → E-49 "done when" met.
- **Or the named fifth gap** — the single most-divergent thing the glance still shows that no current hand
  fixes (the E-50 residual candidates: roof pitch too shallow / wrong material; or a live sequencing failure).
  Named at full strength = the input to E-52 (generalization). A precisely-named fifth gap **is** a complete
  result; do not inflate a partial as a pass.

Scale is judged on **proportion, not render pixels** (a zoom is a framing caveat). Score is reported beside the
glance as a diagnostic, never as the verdict.

## Decision 5 — handling a degraded or aborted run

The run is metered and the strong tier is a real subprocess. Three contingencies, each pre-decided so the run
is interpretable however it lands:

- **Some votes time out, climb completes** → degraded-but-survived; report `votesTimedOut` from the summary;
  the median held. Still a valid climb.
- **A round aborts (every vote failed)** → `writeAbortRecord` writes the partial trajectory + abort block,
  exit 2. If **all timed out** that is an *infra/auth/spend* signal (the guard worked, the metered diagnose is
  unreachable here) — report it as such; it does NOT refute the gate fix (which is unit-proven). This is a
  legitimate reportable finding per AC #1, not a failure of the ticket.
- **`npm test` regresses** → stop; nothing source-side should have changed, so a red test means an
  environmental/dependency issue to surface, not a result to report.

## Decision 6 — cost & autonomy accounting

Record the **metered cost** as votes × rounds × tier and the **autonomy** (autonomous picks vs any scripted
intervention — there should be **none**; the agent picks every tool). Expected ceiling: `maxRounds` rounds ×
`VOTES=3` strong-tier diagnoses + 1 agent pick each ≈ bounded by `CLIMB_DEFAULTS.maxRounds`. Report the actual
rounds run and the vote health from `voteOutcomes`.

## What is explicitly out of scope

No new hand, no new eye, no gate tuning, no `measurements/` touch, no roof-form metric (the T-200 named-not-
built residual). If the run shows the gatehouse needs one of those, that **is** the fifth gap → E-52.

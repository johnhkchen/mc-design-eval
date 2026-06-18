# T-214-01 — Design: how to run the re-climb and reach the verdict

**Epic E-55 / Story S-214.** The decision is not "what code" (none changes) but "what RUN parameters, how to
judge variance, and how to read the glance honestly." Diverge-before-converge applies to the *run plan*, not a
new algorithm. Led with how each choice could fail (anti-hedge).

## Decision 1 — the knobs: `CLIMB_AGGREGATOR=trimmedMean CLIMB_BATCH_MODE=improving`

**Chosen.** These are the literal T-213 contest winner. No alternative is on the table for the *rule* — the
contest already picked it (5/5 agreement, rejects all 3 worse builds, min keep-slack 16). This ticket's job is
to RUN it, not re-contest it. Rejected: re-deriving the rule here (that was S-213's job; re-opening it would be
scope creep and would not honor the handoff).

## Decision 2 — `CLIMB_BATCH_SIZE` and `CLIMB_MAX_ROUNDS`: match T-211 (=4, =8)

**Chosen: `CLIMB_BATCH_SIZE=4 CLIMB_MAX_ROUNDS=8`.** Identical to the T-211 baseline so the comparison is
apples-to-apples — the ONLY changed variables are the two rule knobs. This isolates the rule as the cause of
any difference (the whole point: remove the accept-rule as the confound it has been since E-38).

- `CLIMB_MAX_ROUNDS=8`: the capstone needs ~5 productive moves (close_shell → gable → walls → arch → relief);
  8 gives headroom for rolled-back re-picks. At the frozen 5 the run truncates before the roof/relief.
- `CLIMB_BATCH_SIZE=4`: required for `CLIMB_BATCH_MODE=improving` to do anything — `improving` is the batch
  ENTRY predicate; with `BATCH_SIZE=0` the batch path is OFF and the mode knob is inert.
- **Could fail:** if the off-floor `improving` batch stacks too aggressively and the compound is judged once,
  a single bad pick in the stack could drag a good compound. Mitigation: `acceptsBatch`'s guard stack
  (form-integrity → regression → added-major) + the off-floor FULL margin (4) reject a weak compound. Reported
  honestly from the trajectory either way.

## Decision 3 — reproducibility / variance read (failure-mode 3)

The ticket names "unreproducible (variance dominates the new aggregator → the SCORER is the ceiling)" as a real
failure. **Chosen approach:** a **two-tier** read, cheapest-sufficient first.

1. **Within-run vote spread (free).** The trajectory records every per-move `scores` array. If trimmedMean's
   KEEP decisions clear the margin by a wide slack (e.g. the arch by ~+20 as predicted), the decision is robust
   to vote noise *within the run* — variance does NOT dominate. If a KEEP sits on a knife-edge (delta ≈ margin),
   flag it.
2. **A second full run, budget-permitting.** If tier 1 is ambiguous (knife-edge KEEPs), run the climb a second
   time with the same knobs and compare the kept-build shape (did the arch survive both times?). Recorded as
   `trajectory-2.json` if run. **Not run if tier 1 is decisive** — a wide-slack KEEP is its own reproducibility
   evidence, and a second metered run is real spend.

Rejected: asserting reproducibility from a single run with no spread analysis (that is the hand-wave the
anti-hedge directive forbids); running 5× for a variance histogram (over-spend for a binary verdict).

## Decision 4 — the glance verdict: read the renders, score vs the CONCEPT (not the prior draft)

**Chosen:** make the M1 call from the beside-concept renders (first / best / final), scored against the
**concept image**, not against T-211's boxy kept build (calibrated-honesty: score vs the concept, steady
register, no "milestone!" inflation, no performed brutality). The four M1 criteria from the ticket's
falsifiable claim: **closed dressed walls, centered arched gate, dark gabled roof, right proportion — a
stranger recognizes the gatehouse.**

- **M1 landed** iff all four read on the kept build AND the kept build is the high-water mark (not a rolled-back
  better build). → record **generalization opens** (architecture CAN finish → future E-56).
- **Ceiling named** iff the rule kept the glance-better moves but the build still misses M1 — then the gap is
  DOWNSTREAM of the accept-rule (a hand/coverage limit), the accept-rule is removed as the confound, and the
  reviewer decision is stated cleanly (different climb architecture, or M1 by another route).
- **Either outcome is worthy** (anti-hedge: embarrassing result still worthy). The verdict is the deliverable,
  not a particular sign of it.

## Decision 5 — execution shape: GUARD_ONLY first, then metered in the background, monitored

**Chosen:** (a) `GUARD_ONLY=1 …trimmedMean…improving…` first — proves the two knobs parse + the render seam +
GL, **zero spend**; (b) then the metered run `2> climb.log` in the background with a Monitor watching the log
for per-round KEEP/ROLL lines and the terminal/abort/FATAL signatures, so a hang or all-timeout surfaces
immediately rather than looking like "still running." `CLIMB_OUT=docs/active/work/T-214-01/trajectory.json`.

- **Could fail:** the metered diagnose is unreachable in this environment (all votes time out). Then the T-198
  abort record is written, exit 2, and the honest report is "the run aborted on infra, not a build signal" —
  the guard worked. (T-211 ran 3h ago, so reachability is likely; surfaced fast if not.)

## What is deliberately NOT done

- **No new hand, no gatehouse-specific fix** (E-54 stop-line stands). If the run reveals a downstream gap, it
  is NAMED for the reviewer, not patched here.
- **No frozen-instrument touch.** Verified by `git status` over `measurements/ benchmarks/ src/baml` post-run
  and `npm test` green.
- **No re-pin of any measured record.** This ticket writes only to `docs/active/work/T-214-01/` + ephemeral
  `builds/gatehouse/picture-climb/` renders.

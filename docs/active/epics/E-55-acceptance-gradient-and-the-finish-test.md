---
id: E-55
title: acceptance-gradient-and-the-finish-test
type: epic
status: open
priority: high
depends_on: [E-54]
spec: "§1, §7, §9"
stories: [S-212, S-213, S-214]
---

## Background (the step-back the E-54 stop-line forced — stop patching the house, interrogate the climb)

**Milestone rung: M1 architecture-validation — not "finish the gatehouse," but "can the picture-climb finish
*any* subject to M1, and if not, what changes."** The E-54 stop-line fired: seven epics (E-48→E-54) on one
house, M1 never landed, and the binding constraint was the **measure** at every turn — from the E-38 origin
([[workshop-progress-decoupled-from-quality]]: the workshop's target is decoupled from build quality) through
E-44/45/46 (the gate is the measure) to the E-54 capstone. So we stop adding gatehouse fixes and interrogate
the thing the whole arc kept hitting: **the climb's acceptance rule.**

The T-211 evidence is the precise indictment, and it is mechanistic, not noise:

- The **per-move median gate discards individually-correct picture moves.** The centered arched gate scored
  `8/0/48` — a strong minority read of 48 — and the *median* (a deterministic operator) threw it away. The
  build that looks most like the concept (`T-211-01/beside-arch-rolledback.png`) was rolled back.
- The **only escape from the median is scoped to the score floor.** The cold-start batch escape (T-208) fires
  at `score ≤ 0`; the moment a *form* move credits off 0 (`construct_walls` +8), the escape **disengages** and
  the dressing falls back to the per-move median — which rolls it back. So the dressing never compounds to a
  kept build.

Both E-54 fixes worked (form stays closed, the gate centers and draws a 48). The build misses because **the
acceptance rule cannot carry a dressing compound to the kept build** — and the open question is whether it can
on *any* subject, or whether that is an architecture ceiling. This epic answers it. Governed by
`docs/knowledge/project-direction.md` + `docs/knowledge/anti-hedge-directive.md`; frozen instrument untouched;
subscription shim only.

## The root the arc circled (why this is a step-back, not a seventh fix)

The E-38 finding ([[workshop-progress-decoupled-from-quality]]) named the missing instrument: *you cannot
validate an eval or demonstrate an agent climbing one without a quality-VARIED, human-rankable test set.* The
whole arc optimized the climb against a gate that — this run proves one last time — **disagrees with the
glance** (median discards the +48 arch). So the step-back's first move is to **build that missing test set** and
measure the accept-rule against it, then fix the rule, then ask whether the climb can finish. This is
diverge-before-converge ([[diverge-before-converge-experiment-freedom]]): specify the bar (the rankable set +
the glance) and spike candidate accept-rules, don't pre-commit the algorithm.

## Stories

- **S-212 — the quality-varied, human-rankable test set + accept-rule diagnosis (the bar).** Build the
  instrument the E-38 finding named: a small corpus of **climb-state builds spanning a real quality range**
  (seed colonnade → closed box → +gable → +centered arch → +dressed relief), with **human glance-ranks**.
  Measure: does the current acceptance rule (per-move median + floor-only batch) **agree with the glance
  ranking**? Quantify the disagreement (the T-211 `8/0/48`-arch-discarded case is the seed fixture). This is the
  bar every candidate rule is judged against.
- **S-213 — spike acceptance-rule candidates against the bar (diverge).** Implement ≥2 candidate accept-rules —
  **batch-while-improving** (let detail compound whenever it climbs, not only at the score floor) and a
  **non-median aggregator** that doesn't discard a strong minority read (e.g. max-of-votes, mean, or a
  quantile) — and judge each by how well its keep/rollback **agrees with the S-212 glance ranking**. Falsified:
  a candidate that agrees with the glance only by **rubber-stamping** (keeping everything) is rejected (it must
  still reject a deliberately-worse build). Let the strongest (or a hybrid) win.
- **S-214 — re-climb with the winning rule + the can-it-finish verdict (converge + answer).** Re-run the metered
  climb with the winning accept-rule on a clean subject (gatehouse as a *test case*, not a fix target; cottage
  as a second if cheap). **Does the dressing compound to a kept build that passes the glance as M1?** If yes —
  the architecture can finish; M1 is reachable and generalization (the deferred E-49/E-53/E-54 successor) opens.
  If no — **name the architecture ceiling** at full strength (the workshop-loop's per-move accept model has a
  bound) and hand the reviewer the structural decision: a different climb architecture, or M1 by a different
  route. Depends on S-212 + S-213.

## How this epic can fail (state it up front — anti-hedge)

- **The test set isn't actually rankable.** Humans can't agree on the glance-rank of the climb-state builds
  (they're all near-D-, [[workshop-progress-decoupled-from-quality]] all over again) → then the project can't
  validate *any* accept-rule and the real gap is upstream (the builds need a wider quality range before the
  climb can be evaluated). A real, important finding.
- **Every candidate rule rubber-stamps.** The only way to "agree with the glance" on this set is to keep
  everything (no rule both keeps the +48 arch *and* rejects a worse build) → the accept-rule problem is
  ill-posed on a gradient-less judge, and the fix is the *judge* (de-noise / a different scorer), not the rule.
- **The rule is fixed but the climb still doesn't finish.** The winning rule keeps the glance-better moves, yet
  the re-climb still misses M1 (a different gap downstream — the hands don't compose, or a subject-specific
  wall). Then the architecture ceiling is named with the accept-rule removed as a confound — the clean
  step-back result.
- **Scope creep back into gatehouse patching.** Any temptation to add a gatehouse hand/metric is the stop-line
  violated. This epic touches the **accept-rule and the test set**, not the build.

## Done when

A quality-varied human-rankable test set exists and the current accept-rule's disagreement with the glance is
quantified; ≥2 candidate accept-rules are spiked and judged against it (the winner agrees with the glance
without rubber-stamping, falsified); and a re-climb with the winner either **lands M1 on a clean subject**
(architecture can finish → generalization opens) **or names the architecture ceiling** at full strength (the
per-move accept model is bounded → reviewer decision on a different route). Frozen instrument untouched;
subscription shim only.

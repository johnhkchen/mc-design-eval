---
id: E-33
title: proportion-loop
type: epic
status: open
priority: high
depends_on: [E-31, E-32]
spec: "§1, §5, §6, §9"
stories: [S-133, S-134, S-135, S-136, S-137, S-138]
---

## Background (read this first — self-contained)

**Milestone rung: M1, completion — "the house looks like its picture *in its proportions*, not just
its parts"** (`docs/knowledge/milestones.md`). The glance outranks the gate; numbers are diagnostics.

**Where E-31/E-32 landed (2026-06-11, verified).** The pattern-book path validated its thesis: the
barn judged **same-object 4/4 with all-minor gaps, kit PASS — on the seed draft alone** (recognition +
substitution, before any workshop round); the saltcrag factory run matched it with 79% brush reuse.
The builds finally pass the glance on *identity* — clean gables, even courses, straight walls.

**What the glance still rejects: proportion.** The builds read squat — pitch too shallow, massing too
wide — versus the concepts. The records contain the mechanism precisely:

1. **Proportions are estimated and defaulted, not measured.** Recognition names idioms well but
   eyeballs dimensions (VLMs are weak metric estimators); the pack quantizes the rest (storey-height
   defaults, coarse pitch classes). The one *measured* source we own — the conditioned sketch's
   eave/ridge heights and footprint aspect (T-123) — is consumed as recognition *context*, not as the
   program's numbers. The mesh is bad at materials and good at proportions; we use it for neither.
2. **The workshop has eyes but no hands for geometry.** The cottage ledger (T-127): the model
   **correctly critiqued the proportion defect in 4 of 6 rounds** and never fixed it — `adjust-params`
   was never aimed at geometry, and `re-recognize` was reached for in round 3 and is **unwired**
   (named seams, T-126/T-127 reviews). Visual judgement right; action mapping missing.
3. **Steep pitches may be inexpressible.** If the roof vocabulary tops out at the stair block's
   native 45°, the concepts' steeper roofs (~55–60°) cannot be built — the barn comes out squat no
   matter how good the read. Minecraft builders do steep pitches with mixed full-block/stair courses.
4. **Nothing in the loop checks proportion.** Conformance gates regularity (courses, symmetry,
   palette) — never proportion-vs-concept. The defect survives every round because no round names it
   numerically.
5. **One instrument blind spot travels with these:** the cottage never reached the judge — its upper
   storey has **zero visible cells at the contract elevation** (eaves + jetty occlusion), so the
   coverage precondition failed it on a band the camera cannot see. A census blind to visibility is
   the same *measurement-identity* bug class as T-095/T-101/T-110 (fourth instance).

## Goal

Close the loop the glance is grading: **measured numbers in, a numeric proportion check each round,
levers that can act on geometry, a vocabulary that can express what's measured — and a census that
only counts what a view can see.**

```
conditioned sketch (measured: ridge, eave, footprint, pitch)
  ─▶ THE PROGRAM'S NUMBERS    recognition names the parts; the sketch supplies the dimensions
  ─▶ STEEP-PITCH BRUSH        mixed block/stair courses — >45° expressible at last
  ─▶ PROPORTION CONFORMANCE   silhouette ratios vs the concept, checked every workshop round
  ─▶ GEOMETRY LEVERS          adjust-params reaches pitch/heights/footprint; re-recognize wired
  ─▶ VISIBILITY-AWARE CENSUS  a view cannot fail on a band it cannot see (identity-class fix)
  ─▶ THE FROZEN GATE, ONCE    same judge, same azimuths — the milestone owns the only judge runs
```

## Rules of engagement (binding)

1. **Identity from language, quantity from geometry.** Recognition names; the sketch measures. A
   program dimension that could be measured from the sketch is never left to estimation or default —
   defaults are recorded fallbacks for unmeasurable dimensions only.
2. **The proportion check is deterministic and round-wise.** Silhouette ratios (ridge:eave, roof
   share of elevation, footprint aspect) computed from renders vs the concept silhouette — machinery
   we own (E-22 era). It gates workshop rounds the way regularity already does; it is **not** a judge
   call and never replaces the gate.
3. **Instrument changes only of the identity class, under the standing discipline.** The
   visibility-aware census follows the T-095/T-101/T-110 precedent exactly: monotone proof (every
   previously passing view still passes), both arithmetics reported, committed records untouched and
   valid, thresholds/azimuths/judge contract unmoved. **The gap-budget question (4/4 same-object +
   all-minors = FAIL on ≤2) is explicitly NOT decided in this epic** — it is recorded where it occurs
   and rests with the reviewer.
4. **Inherited in full:** the workshop/ruler mode split (the milestone owns the epic's only judge
   runs), replay reproducibility, per-style-not-per-building, pin policy, reply policy.

## Candidate stories & DAG

```
S-133 measured-proportions ─▶ S-136 geometry-levers ──┐
S-134 steep-pitch-construct ──────────────────────────┼─▶ S-138 proportion-milestone
S-135 proportion-conformance ─────────────────────────┤
S-137 visibility-aware-census ────────────────────────┘
```

- **S-133 — measured-proportions.** The sketch's numbers (ridge/eave heights, footprint aspect,
  pitch) become the program's dimensional parameters; recognition keeps naming; defaults demoted to
  recorded fallbacks. The barn's program re-seeded carries the concept's actual steepness.
- **S-134 — steep-pitch-construct.** One new brush through the factory door: mixed full-block/stair
  courses realizing pitches above 45° (the 2:1 family), state-correct, cage/conformance-compatible.
  Likely the largest single contributor to "the form is off."
- **S-135 — proportion-conformance.** The deterministic silhouette-ratio check vs the concept, wired
  into the workshop's per-round gate beside regularity — the model's correct wince becomes a named
  numeric delta it can act on.
- **S-136 — geometry-levers.** Wire the two named seams: `adjust-params` reaching geometry
  (pitch/heights/footprint, bounded by conformance + replay), and `re-recognize` (round 3 reached for
  it; it didn't exist). The cottage's correct self-critique becomes a possible self-fix.
- **S-137 — visibility-aware-census.** The coverage precondition censuses, per view, only cells
  visible from that view — a view cannot fail on a band it cannot see. Identity-class discipline in
  full (Rule 3). Unblocks the cottage's judge call without touching the camera or thresholds.
- **S-138 — proportion-milestone (terminal).** Cottage + barn (+ the saltcrag barn) re-run through
  the full loop; **this ticket owns all judge runs** (one per view). Bars: proportion conformance
  passes; the cottage **reaches the judge**; verdicts vs the T-127/T-132 baselines recorded; the
  glance — the sheets beside the concepts read right in their proportions. Both gap-budget
  arithmetics reported; the budget decision flagged to the reviewer, unchanged.

## Definition of done

- Programs carry **measured dimensions** (sketch-sourced, fallbacks recorded); the steep-pitch brush
  realizes >45° cleanly (`unmapped` empty, cage held); the workshop checks **proportion every round**
  and its geometry levers work (ledger shows a geometry revision accepted somewhere real).
- The cottage **reaches the judge** via the visibility-aware census (monotone proof committed; both
  arithmetics in the records).
- The milestone re-judges all three builds once; results vs baselines recorded honestly; the sheets
  pass the proportion glance or the residual is named with its measured ratio delta.
- Durable (replay byte-identical), registry-only, `npm test` green; journal + E-12.

## Orchestration notes

- S-133/S-134/S-135/S-137 are mutually independent (disjoint seams: program schema / brush module /
  conformance check / gate census) — parallel. S-136 follows S-133 (the levers act on the measured
  parameter surface). S-138 is terminal and owns the only judge runs.
- The saltcrag ratification taste pass (T-132 concern 1) remains pending with the user — this epic
  does not stamp it.
- **Honesty.** If the measured numbers disagree with the concept's look (TRELLIS proportions can
  drift from the concept), the conformance check is computed **against the concept**, and the sketch
  is the fallback — the concept is the contract. If steep courses read worse than 45° at some scale,
  that is a recorded finding with renders.

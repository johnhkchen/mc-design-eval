# T-190-01 — DESIGN: department-aware accept signal, then run the climb

## The decision in one line

Make the accept-gate **department-aware** (credit a tool that clears a major *in the department it targets*,
even when the whole-build scalar is flat because the judge's attention shifted to a pre-existing major), add
a cheap **no-op guard** (never re-score / accept a byte-identical occupancy), then **run the sustained climb**
with `recolor_roof` reachable and report the trajectory + glance + ceiling honestly. The gate change is the
minimal, evidence-named calibration T-189 §6.1 handed to S-190; it is additive and unit-tested. The run is
the deliverable.

## The problem, precisely (from Research)

`acceptsRound` accepts in the within-margin tie zone only if **whole-build** `wrongStyleBreadth` or `nMajor`
shrank. The roof-material fix produces neither: clearing the ROOF major lets the judge promote a pre-existing
WALL major, so whole-build `nMajor` stays 1 and breadth stays put. The scalar itself is flat-to-noisy
(graded cap pins it while any major remains; 0–76 vote variance). **Result with the gate as-is: the correct
grey roof is rolled back, the agent is told the roof tool "did not move toward the concept," and the climb
plateaus on a fix that actually worked.** Without a fix here, T-190 just re-runs T-188's plateau.

## Options considered

### A. Department-aware tie-break (CHOSEN, primary)
In the tie zone, after the existing whole-build shrink checks, also accept if **any department the tool
targets lost a major** (`beforeDeptMajors[d] > afterDeptMajors[d]` for some `d ∈ TOOL_DEPARTMENTS[tool]`).
The per-department major count is derived purely from the `items` the runner already carries (one `reduce`).

- **Pros:** Directly fixes the named failure mode — a tool that does its job in its own department is kept
  even when the judge's *attention* moves to the next real divergence. Honors the project stance ("the
  critique's *ranking* moved to the next real divergence; the wall did not change" — T-189 §3). Pure,
  additive, testable without GL/LLM. Self-limiting: only credits the tool's declared departments, so it
  can't rubber-stamp an unrelated change.
- **Cons:** Needs the tool's target departments threaded into the gate (the runner knows the pick; pass
  `TOOL_DEPARTMENTS[pick]`). A tool that genuinely worsens its own department while clearing a fluke major
  is still possible in principle — mitigated because a real regression (Δ ≤ −margin) still rejects *before*
  the tie zone is reached; the department credit only applies inside the tie band.

### B. No-op occupancy guard (CHOSEN, secondary)
Before scoring a candidate, compute a stable digest of its cells; if it equals the current build's digest,
treat it as a no-op — don't spend a diagnose, don't accept. Kills T-188's +8 phantom (re-scoring a
byte-identical gable) and the `oscillated` false-positive (idempotent accept-then-reject).

- **Pros:** Removes a whole class of vote-noise artifacts and saves spend. Tiny pure helper, unit-testable.
  `recolor_roof` is byte-identical to `apply_gable_roof` only in *position* (the block id differs), so the
  digest must include the block id — it does — and the two roofs hash differently, so the guard does not
  suppress the real material change.
- **Cons:** None material. A digest over sorted `pos|block` keys is O(n log n), trivial at gatehouse scale.

### C. Raise VOTES 3→5 to de-noise the scalar (REJECTED as the primary fix)
Cuts vote variance but is the wrong lever: the failure is **structural** (attention-shift keeps the
whole-build major count flat), not merely noisy. More votes wouldn't make a flat `nMajor` move. It also
multiplies spend. Keep VOTES=3; the department-aware signal is what unblocks the roof fix. (Noted as a future
knob, not used here.)

### D. Drop the graded cap / change `styleFidelityScore` (REJECTED)
That is the *measurement* term (E-45/E-47), shared with the frozen-instrument-adjacent crater harness.
Re-tuning it to make the climb feel better would be exactly the "measurement discipline leaking into
creation" the project warns against, and would silently move pinned crater numbers. **Out of bounds.** The
gate (a creation-loop decision) is the right place to add steering, not the score.

### E. Run as-is and just report the plateau (REJECTED)
Defensible under anti-hedge (report the failure), but T-189 *already* localized this failure with evidence
and explicitly scoped the fix to S-190. Re-reporting it without applying the one-line-named fix would be
abdicating the ticket. We apply the fix, then report whatever the run actually does (including if the fix is
insufficient).

## Chosen approach: A + B, then run

1. **`deptMajorCounts(items)`** — pure helper: `{ROOF: n, WALL: m, ...}` major counts per department.
2. **`acceptsRound` gains an optional 4th-arg context** `{targetDepartments, beforeDeptMajors,
   afterDeptMajors}`. Inside the tie zone, after the whole-build shrink checks, a target-department major
   drop accepts with reason `tie: ROOF cleared a major`. **Fully backward compatible** — with no context
   passed, behaviour is identical (CG1–CG3 unchanged).
3. **`buildDigest(cells)`** — pure stable digest over `pos|block`. Runner skips scoring an unchanged
   candidate (no spend, auto-reject as a no-op).
4. **Runner wiring:** thread `TOOL_DEPARTMENTS[pick.tool]` + before/after per-department majors into
   `acceptsRound`; add the digest no-op guard; redirect `trajectory.json` to `docs/active/work/T-190-01/`
   via a `CLIMB_OUT` env override (default stays T-188's path); copy first/best/last beside renders into the
   work dir (builds/ is gitignored).
5. **Run** `node …/picture-climb.mjs` (metered) with `CLIMB_OUT` set. Capture trajectory + beside sheets.
6. **Report** (`ceiling.md` + `review.md`): per-round trend, the glance check on first/best/last, the named
   ceiling (what plateaus, what no hand fixes), and the autonomy accounting.

## Why this is the right shape

- The fix lives in the **creation-loop gate**, pure and tested — the instrument and the score are untouched.
- It is **named by evidence**, not invented: T-189 §3/§6.1 said "department-aware or less noisy"; A is
  department-aware, B is less noisy. We do both because both are small and both were named.
- It is **falsifiable**: if, after the fix, the climb *still* plateaus or the glance disagrees with the
  critique's "improvement", that is a real, reportable result (the gradient still isn't the glance → E-47
  family; or the remaining gap is hands not built → E-49). We run it and report whichever way it falls.
- **What would make me wrong:** if the department-aware credit causes the gate to keep changes a human's
  glance calls *worse* (the gradient diverging from the glance) — the run's first/best/last glance check is
  exactly the test for that, and a disagreement is the headline, not a thing to bury.

## Risks & mitigations

- **Metered non-determinism / vote noise.** Report the per-round vote triples; lead the verdict with the
  glance, not the scalar. If a single run is ambiguous, the beside renders adjudicate.
- **The agent may not pick `recolor_roof`.** The MENU describes it for roof colour/material; the brown-roof
  critique names exactly that. If the agent still mis-picks, that is an agent-prompt finding to report (and
  a candidate hand-pick to demonstrate the gate change in isolation), not a silent failure.
- **Run cost/time.** ~5 rounds × (4 renders + 3 diagnoses) + picks. Bounded by `maxRounds=5`. Acceptable;
  the no-op guard trims wasted diagnoses.

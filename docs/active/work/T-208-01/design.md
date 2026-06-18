# T-208-01 Design — escaping the score-0 cold start (diverge, then converge)

The trap (research §2): at the score-0 floor every **detail** move lands on `acceptsRound` branch 5
(`tie (0): no shrink`) and rolls back, because the picture scalar has no gradient there and detail moves have
no `formCredit` analog. The escape must let detail hands **compound off 0**, **reject a deliberately-bad
compound**, stay **PURE where the decision lives**, and be a **no-op when the climb is healthy**.

Per [[diverge-before-converge-experiment-freedom]] I spike the three ticket candidates against the code reality
(research §4–6), pick on the glance, and keep the strongest with its rubber-stamp guard.

## Candidate A — Provisional-accept-then-judge-the-batch  ✅ CHOSEN

**Mechanism.** When the build is **form-ready** (closure ≥ 0.9) AND the scalar is **saturated at the floor**
(`prev.score ≤ FLOOR`, FLOOR=0), enter **batch mode**: provisionally apply up to `batchSize` agent-picked
detail hands as a **pure `occ → occ₁ → … → occ_N` chain** (no per-move score, no per-move gate), then score the
**compound `occ_N` once** and decide keep-all / roll-back-all via a pure `acceptsBatch(prevEv, compoundEv, …)`.

**Why it fits the code.** Tools are pure `occ → occ'` (research §4); the runner never mutates `occ` until
accept, so a batch is a pure chain scored once and committed or discarded wholesale — **no new snapshot
machinery**. The compound is judged by the **same `scoreBuild`** (4 azimuths, VOTES=3 median) as a normal
round, so the gradient the per-move judge lacked is supplied by *reading several changes at once* — which is
exactly "compounding several would read better." The pure decision is a small sibling of `acceptsRound`.

**Why it beats the rubber-stamp risk (the falsification).** The keep/rollback is the **picture judge over the
compound vs the pre-batch build** — not a hand-built structural oracle that a bad batch could game. A
deliberately-bad compound (wrong colours, flooded openings) scores **≤ the pre-batch build** (or adds a
whole-build major) → `acceptsBatch` **rejects** it and the runner rolls back to `occ₀`. This is the AC's
"must reject a worse batch," and it is deterministic to unit-test (feed a regressed/added-major compound).

**`acceptsBatch` (PURE, the unit-tested core):** keep the compound iff
1. `delta = compound.score − prev.score >= batchMargin` (batchMargin=1: escaping 0 to *any* real read is the
   signal we want) **OR** a major cleared (department-dominant over the union of the batch's targeted depts);
   **AND**
2. **no new whole-build major** (`compound.nMajor ≤ prev.nMajor` per-department: no targeted/any dept major
   rose) — the rubber-stamp guard; **AND**
3. `delta >= 0` — never keep a compound that **regressed** the scalar (the deliberately-bad-compound reject).

If the compound *also* ties at 0 (judge still saturated even on the stacked build) → **reject, roll back, and
report the residual**: that is the ticket's third failure mode ("score so unreliable no batch signal is
trustworthy → the real fix is de-noising the judge"). The mechanism does **not** rubber-stamp its way past a
judge that cannot see the compound; it names that honestly.

**Anti-hedge gating.** Batch mode is entered **only** at the cold-start floor on a closed form. A healthy climb
(scalar already > 0, or form not yet closed) never enters it — `acceptsBatch` delegates to the unchanged
per-move `acceptsRound`. So even if **T-207 reaches the picture** (this ticket → no-op), the mechanism, if
landed, is **inert** on that trajectory. It is a guarded escape at a code-confirmed trap, not a new always-on
behaviour (precedent: failure-state gating, [[global-offset-flips-near-tone-wholesale]]).

## Candidate B — Structural fallback signal (when scalar=0, decide on structural deltas)  ❌ rejected as primary

**Idea.** Compute GL-free predicates from `occ` + the recognition program — pale field present? wide arch?
slate roof? — and keep a detail move on a positive **structural** delta when the scalar saturates.

**Why rejected (folded into A instead).** (1) **Rubber-stamp fragility:** every detail placement adds cells,
so the predicate must measure *the right* structure toward the concept — a hand-built oracle that a
deliberately-bad batch (right structure, wrong colour) can satisfy while the glance worsens. The ticket's
falsification is precisely "reject a worse batch"; a structural-presence oracle is the **weakest** guard
against it. (2) **New surface:** it needs a new occ-reading detail-structure metric per department (≈ the
work of a new recognition pass), versus A which **reuses the existing judge** as the fidelity signal. (3)
Candidate A already captures B's intent — "read the structure" — but via the *actual picture judge over the
compound*, which is a strictly stronger, harder-to-game signal. A may borrow one cheap structural fact (e.g.
the existing `eaveRingClosure` must not drop) as a **cheap pre-filter** before spending on the compound score,
but the *decision* stays the judge-over-compound.

## Candidate C — Lower the judge's floor / finer diagnose scale  ❌ rejected (named as the fallback)

**Idea.** Make `DiagnoseBuild` / `styleFidelityScore` differentiate near the bad end so single moves register.

**Why rejected now.** It is a **measure change to the frozen-arc judge** (the E-47 picture-anchored
`DiagnoseBuild` prompt + `styleFidelityScore`), the highest blast radius: it re-bases every score in the
E-47→E-52 arc and risks lifting wrong-picture builds (the very confound E-46/E-47 fought). The ticket itself
scopes C as the **last resort** — "*if* the score is so unreliable no batch/structural signal is trustworthy,
the real fix is de-noising the judge." So we try the **contained gate fix (A) first**; only if A's compound
*also* can't move the judge off 0 (A's reject-and-report path) is C licensed — and then it is named as the
residual, not silently attempted here.

## Decision

**Adopt Candidate A** (provisional-accept-then-judge-the-batch), with B's cheap structural fact only as a
no-regress pre-filter and C named as the documented fallback. Rationale, grounded in research:
- It supplies the **missing gradient** by judging the compound (the per-move judge's saturation is the whole
  bug); it is the only candidate whose keep/rollback is the **actual picture judge**, so its rubber-stamp guard
  is the strongest and its falsification is clean and deterministic.
- It is **minimal**: one pure function (`acceptsBatch`) beside `acceptsRound`, a batch loop in the runner that
  reuses pure-`occ` tools and the existing `scoreBuild`. No new metric, no judge change, no snapshot machinery.
- It is **safely contingent**: gated to the cold-start floor, inert on a healthy/successful climb, so building
  it does not perturb the T-207 trajectory and is a no-op if T-207 already reached the picture.

## The contingent branch (read T-207 first, at Implement)

Per AC #1 the *first* decision is T-207's finding:
- **T-207 reached the picture** → record this ticket a **no-op/deferred** with the trajectory evidence; do
  **not** land the mechanism (anti-hedge: evidence didn't demand it). Stop.
- **T-207 stalled at 0 on the genuinely-closed form** (closure ≥ 0.9 throughout, score never left 0, every
  detail round `tie (0): no shrink`) → the gap is confirmed → **land Candidate A** + the bad-compound
  falsification test, then re-climb to prove the build **leaves 0** (or name the residual if even the compound
  can't, → C).
- **T-207 still in-flight at Implement** → build & unit-test the **pure, deterministic** parts (`acceptsBatch`
  + the bad-compound reject + the cold-start gating, all in `npm test`) since they are required regardless and
  inert when healthy, but do **not** fabricate the live re-climb verdict: gate it on T-207's terminal
  trajectory and record the metered re-run as the pending validation.

## What is explicitly NOT done

No change to the frozen judge (`DiagnoseBuild`, `styleFidelityScore`) or `measurements/`; no change to the
per-move `acceptsRound` healthy path; no new occ-reading detail metric; subscription shim only.
`CLIMB_DEFAULTS` stays frozen — batch size / FLOOR follow the `CLIMB_MAX_ROUNDS` env-knob precedent.

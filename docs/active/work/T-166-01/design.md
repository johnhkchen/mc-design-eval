# T-166-01 — Design

Decide the bake-off architecture, the scoring rules, and the fixtures. Grounded in Research; leads with how
each claim can fail.

## Decision summary

Two live harnesses under `experiments/eval-alignment/` (beside the E-38 probe, NOT in `npm test`,
instrument untouched), sharing **one pure tested scoring module** `src/workshop/bakeoff-score.mjs`:

- `bakeoff.mjs` — **Claim 1** (split vs fused dispatch correctness on a fixed state set).
- `clean-wrong-style.mjs` — **Claim 2** (the crater: clean build × matched vs wrong-style concept under the
  per-style Layer-A judge, with a control isolating the style_profile).

The pure module holds every decision that can be unit-tested deterministically; the harnesses are thin I/O
+ live-call shells (mirroring `diagnose-smoke.mjs`). Findings recorded in `FINDINGS.md`; `review.md` is the
handoff.

## Claim 1 — the bake-off

### What is scored
For each **state** = (concept image, build renders, recognized program, pack, **ground-truth department
G**), run both paths and ask: did the path's *worst-defect department* equal G?

- **Split worst-dept** = `dispatch[0].department` (the router's worst-first item; `dispatchToVerdict`
  already treats `resolved[0]` as worst). Typed by construction.
- **Fused worst-dept** = `regionToDepartment(firstMajorIssue.region)` — the **lossy keyword adapter**. If
  no major issue, the first issue. Record `matched:false` when the region text hits no keyword (default
  WALL) so the adapter's lossiness is visible, not hidden.

Correctness aggregated over states × votes. Report per-state rows + totals, **fused-wins included**.

### Ground truth — how it stays honest
Only **glaring, unambiguous** worst defects are labelled (roofless → ROOF; gaping wall holes → WALL; no
arched gate where the concept has one → OPENING). Each state records the **why** (one sentence) and a
render path so a human can re-check. Ambiguous states are **excluded and logged** (no silent cap). This is
an analyst label, not a model label — stated as a limitation.

### Why split *could* win, lose, or tie (all reportable)
- **Win:** the typed `department` + the per-style `expected` focus Layer A on the construction element;
  the fused free-text region is vaguer and the adapter still resolves it correctly less often.
- **Lose/tie:** if the fused region almost always contains the obvious keyword ("roof"), the adapter is
  near-perfect and the two-call split buys nothing → recommend collapse. **This is a real possible result.**

## Claim 2 — the crater

### The manipulation (single clean A/B + one control)
Hold **build renders FIXED** (clean rustic gatehouse) and **program FIXED** (a minimal synthetic gatehouse
program — masses: stone walls, gable roof, arched gate; identical in every condition, so it is *not* a
variable). Vary only the (concept, style_profile) pair:

| cond | concept | pack → style_profile | prediction |
|------|---------|----------------------|------------|
| **A. MATCHED** | gatehouse (rustic) | rustic | high — build matches concept *and* expected grammar |
| **B. WRONG**   | classical (arc-A / chapelle) | guildhall (classical) | **crater** — rustic build, classical expected: missing pilasters/quoins/round-arch/hip/ashlar |
| **C. CONTROL** | classical (arc-A) | **rustic** | isolates: how much of B's drop is the *profile* vs the concept image alone |

Score per condition via `styleFidelityScore(critique)` (below); votes=3 to estimate noise. **Spread = A −
B.** Compare to E-38's flat scalar 22–32 (on disk). The control C attributes the crater: if B ≪ C, the
per-style `expected` is doing the work (not just the model reading the concept image).

### The score derived from the structured Critique
The per-style Layer A emits no 0–100. Define an explicit, explainable scalar:

```
styleFidelityScore(critique) = clamp(100 − Σ_items penalty(severity), 0, 100)
penalty(major) = 20,  penalty(minor) = 8
```

Report it **alongside the raw evidence** that actually carries the meaning: `nItems`, `nMajor`,
`departments[]`, and the concatenated `missing` strings (the qualitative crater — "missing round-arched
voussoirs / dressed ashlar / pilasters"). The scalar is a convenience; the `missing` list is the proof. The
rule is stated so a reviewer can recompute it.

### How claim 2 fails (and what each failure routes to)
- **No crater (A ≈ B):** the per-style `expected` is cosmetic; the model scores intrinsic brokenness and
  ignores style → **the most important negative** → route to a deeper-measurement epic (the blindness is in
  the model's *reading*, not the prompt). Reported, not softened.
- **Crater but B ≈ C:** the drop is the concept image alone, the style_profile adds nothing → the per-style
  lever is inert; same routing.
- **Confounded concept:** arc-A is a monument with an exotic palette. Mitigation: triangulate with a
  second building-shaped non-rustic concept; if the crater holds across both AND the matched rustic stays
  high, the gradient is real despite per-concept confounds. The clean fix (a bespoke house-scale guildhall
  concept) is **named** as a follow-up.

## Options considered & rejected

1. **Co-vary the program with the style** (recognize the classical concept into a classical program).
   *Rejected:* an extra metered recognition call per condition; the held-fixed synthetic program is a
   cleaner single-variable A/B and reproducible. Named as a stronger follow-up.
2. **Put scoring in the harness file only.** *Rejected:* the scoring rules (region→dept map, score
   formula, worst-dept extraction) are exactly what a reviewer must trust — they belong in a **pure,
   unit-tested** module so `npm test` covers them and they don't drift.
3. **Score claim 1 on the loop *verdict*** (does it climb?). *Rejected:* T-164-02 established the split
   path can't *apply* an idiom (generator gap). The scorable thing is **dispatch correctness**, exactly as
   the ticket says.
4. **Fire an image-gen call for a perfect guildhall house concept.** *Rejected for the default run:*
   outward/metered, and T-165-02 set the restraint. Named as the clean follow-up; triangulation covers the
   confound for now.
5. **Many votes / large state set.** *Rejected:* spend. Small fixed set, low votes, re-runnable. The
   committed numbers are an honestly-sized sample, stated as such.

## Test strategy
- **Pure module** `bakeoff-score.mjs` → `bakeoff-score.test.mjs` (in `npm test`): `regionToDepartment`
  keyword cases + default-WALL flag; `styleFidelityScore` boundaries + clamp; `worstDepartmentOfDispatch`/
  `…OfFusedReply`; `dispatchCorrectness` aggregation. Deterministic, no GL/IO/model.
- **Harnesses** are metered witnesses (NOT in `npm test`), like the smokes; their JSON + PNG outputs are
  committed evidence. Guarded so a missing asset throws loudly.
- **Frozen instrument + transport-guard untouched;** full suite stays green.
</content>

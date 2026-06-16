---
id: E-40
title: style-distance-severity
type: epic
status: open
priority: high
depends_on: [E-39]
spec: "§9"
stories: [S-167, S-168, S-169]
---

## Background (read this first — self-contained)

**Milestone rung: still the measurement spine for M2 ("a style invented in an afternoon") — E-39 proved
the judge can *see* style; this epic makes the measure *score* it.** Governed by
`docs/knowledge/project-direction.md` (the differentiator is the measurement) and
`docs/knowledge/anti-hedge-directive.md`. Forward plan: `docs/active/ROADMAP.md`.

**The finding that motivates this epic (E-39 referee, T-166-01).** A clean rustic build scored against a
*wrong-style* concept did **not** crater: matched 52, wrong-style 46/40, control 58 — all inside the ±12
noise. The refinement that matters: this is **not** because the judge can't read style — the per-style
Layer A correctly names the wrong-style grammar (guildhall quoins/pilasters/voussoirs). **The blindness is
in `severity → scalar`.** Today `styleFidelityScore = 100 − Σ penalty(severity)` (major 20 / minor 8) — it
sums *missing-element presence*, so swapping the concept produces a similar item count and a near-identical
score. **A present-but-wrong-style element is not scored as a defect at all.** The defect-dominated
principle says the worst defect should cap the grade; "wrong style" is currently not even on the axis list.

**The fix.** Make **style distance** a first-class, capping severity, derived from the Critique's own
`expected` vs `present` mismatch (a present element from a different grammar than `expected` = a MAJOR
style defect). Then a clean wrong-style build is *capped low* even when nothing is missing — which is what
should have made the fixture crater.

**Two rules carried from E-39:**
1. **Validate before you trust, and especially before you freeze.** A severity term that craters the
   fixture but *disagrees with a human* is mis-calibrated, not fixed. This epic builds the labeled corpus
   first and proves agreement; promoting the term into the **frozen instrument** is a separate, gated,
   deliberate step — not done casually (the de-freeze lesson).
2. **Don't block on the roof.** The matched ceiling was only 52 because the test build is itself defective
   (cleaner builds are the roof line). Use **synthetic/clean fixtures** so this epic's validation isn't
   gated on the roof epic.

## Stories

- **S-167 — the labeled defect corpus.** A consensus/single-rater-labeled **≥8–10-state, multi-department**
  corpus — including **clean × wrong-style pairs** — with ground truth on (a) the worst-defect department
  and (b) pairwise "which is more faithful to its concept." The test asset everything validates against,
  and the under-powering fix for E-39's 2-state bake-off.
- **S-168 — the style-distance severity term.** Derive style distance from `expected` vs `present`
  (present-but-wrong-style = MAJOR / capping); fold it into the score so wrong-style caps. Pure, tested.
- **S-169 — validation + the crater re-run (the proof).** Re-run the clean × wrong-style fixture and the
  bake-off (now on the S-167 corpus) with the new term: does it **crater AND agree with the human labels**?
  Report honestly; **recommend** (do not silently execute) whether to promote the term to the frozen
  instrument.

## How this epic can fail (state it up front)

- **Crater without agreement.** The term makes the fixture drop but a human disagrees (it over-penalizes a
  legitimately-close style) → mis-calibration is the finding; the term needs a distance scale, not a flag.
- **No stable human signal on the hard middle.** If the rater can't reliably rank the contested pairs, then
  "style fidelity" isn't a stable target and the premise itself wobbles — the *most* important possible
  refutation; report it, don't paper over it. (Single-rater for now; note it as a limitation, not
  inter-rater agreement we don't have.)
- **Ceiling too low to measure.** If even synthetic-clean fixtures can't lift matched above the noise floor,
  cleaner builds (the roof) are a hard prerequisite — name it and stop, don't force a result.

## Done when

A style-distance severity term caps clean wrong-style builds (the fixture craters), the term **agrees with
the labeled corpus** on the hard pairs (or its disagreement is characterized), the bake-off is re-judged on
a ≥8–10-state corpus, and a clear, evidence-backed recommendation on frozen-instrument promotion is on
record. The frozen instrument is untouched within this epic unless that promotion is separately approved.

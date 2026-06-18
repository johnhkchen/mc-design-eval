---
id: E-45
title: recalibrate-style-distance-term
type: epic
status: open
priority: high
depends_on: [E-44]
spec: "§9.1"
stories: [S-180, S-181, S-182]
---

## Background (read this first — the constraint is now the measure)

**Milestone rung: M1, instrument-repair — "the ruler must rank a faithful build above its wrong-style
twin."** Not a build milestone; the twin of E-34 (the *proportion* ruler) for the *style-distance* term.

E-44 closed the E-38→E-44 measurement arc with a decisive, robust negative (T-178-01): on a *fully-faithful*
gatehouse at **VOTES=6**, the matched build (13±12) did **not** separate from its wrong-style twin (0±0) —
A−B=13, inside the ±12 noise. T-173-01's celebrated 28 was a **VOTES=2 sampling artifact** (per-vote
`[0,4,20,28,28,0]`). Making the build faithful did **not** lift matched; raising votes **dissolved** the
crater. **The residual gate is the measure, not the build.**

The mechanism is specific and audited. Against its **own matched concept**, the faithful build earns
**WALL:replace 6/6** and **OPENING:replace 6/6** — *identical* to its wrong-style twin
(`replaceContrast = −0.20`, verdict NO CONTRAST). `styleFidelityScore` hard-caps the score whenever
`itemStyleClass` returns `wrong-style` for **any** item; Layer A (`DiagnoseBuild`) emits `replace`/wrong-style
on present-but-imperfect elements **without conditioning on whether the element matches the concept** — so the
cap floors matched and wrong-style alike, and faithfulness/completeness cannot buy the score back.

Governed by `docs/knowledge/project-direction.md` (the differentiator IS the measurement — so a measure that
can't tell right from wrong is the project's core defect, worth fixing precisely) +
`docs/knowledge/anti-hedge-directive.md`. **The frozen instrument stays frozen** — the style-distance term
under repair lives in the *creation-loop* scoring (`src/workshop/bakeoff-score.mjs`) and Layer A
(`baml_src/department.baml`), not under `measurements/`; this epic **recommends** promotion, it does not
execute the freeze.

### The fork this epic must resolve before fixing (don't pre-commit)

T-178-01 localizes the defect to "the measure" but **two distinct loci can produce the same collapse**, and
the fix differs:

- **Locus R — the reading.** Layer A genuinely *mis-reads* a faithful element as wrong-style — emits
  `replace` where the build's material matches the concept. Fix is the **judge contract/prompt**
  (`DiagnoseBuild`): condition `replace`/wrong-style on concept-mismatch; emit `add`/`remove` (recoverable)
  for a right-material-but-imperfect element. Needs a golden re-pin (diff the prompt first —
  [[recognition-prompt-embeds-program-schema]]).
- **Locus S — the scoring.** Layer A emits the *right* semantic content (expected/present/missing) but the
  structural `itemStyleClass`/`kind` bucketing mis-labels it `wrong-style`, and/or the **single-`replace`
  hard cap** floors a build that is faithful-except-one-element. Fix is the **scalar**: a graded
  style-distance instead of a binary cap.

A **strong leading hypothesis (test it, don't assume it): both, and the dark-oak roof proves why.** The
faithful build's roof is genuinely `dark_oak` vs the concept's grey roof — so a *correct* judge **should**
tag ROOF:replace on the matched build. That means concept-conditioning alone (Locus R) won't lift matched if
the cap stays binary — one *legitimate* roof `replace` still floors it. The binary cap is the disease that a
graded distance (Locus S) cures: an otherwise-faithful build with one off element must still rank well above a
build that is wrong in every department. So the roof mismatch is not noise to remove — it is the **ideal
fixture for the graded cap.**

## Stories

- **S-180 — locate the defect: reading vs scoring (diagnostic spike).** Replay the committed T-178-01
  per-vote Layer A outputs; for every matched-build `replace` tag, classify it **R** (semantically wrong —
  the element matches the concept yet was tagged wrong-style) or **S** (semantically right — genuinely off
  vs the concept, but the binary cap floors an otherwise-faithful build). Output: the R/S split + which
  locus (or both) to fix, on evidence. No fix yet.
- **S-181 — re-calibrate the identified locus.** Per S-180: make Layer A's `replace`/wrong-style
  concept-conditional (R) and/or replace the single-`replace` hard cap with a graded style-distance (S), in
  the creation-loop scoring. Unit-test the new scoring on synthetic critique sets (faithful-except-one vs
  wrong-in-all). If the judge prompt changes, diff it and re-pin the golden deliberately.
- **S-182 — two-sided crater confirmation @ VOTES≥6 + promote recommendation.** Re-run the *same* crater
  (`corpus-referee.mjs`, `CRATER_BUILD=builds/gatehouse/faithful-covered`) at VOTES≥6: the re-calibrated
  term must make matched **separate** (A−B well outside ±12, `replaceContrast` positive) **AND** keep the
  genuinely-wrong-style twin **capped** (no E-40 under-penalty / E-39 blindness regression — a two-sided
  test, not a one-sided lift). Recommend PROMOTE (spell out the guarded freeze step, don't execute) or
  localize the next residual.

## How this epic can fail (state it up front — anti-hedge)

- **It's the reading, and the judge can't be fixed by prompt.** If Layer A tags a *material-matching* wall
  `replace` even with a concept-conditional prompt, the VLM genuinely can't tell faithful from wrong-style at
  the element level — a deeper recognition defect, not a scalar one. That refutes "re-calibrate the term" and
  points at the judge model/contract. (The embarrassing branch: the measure isn't mis-calibrated, it's
  mis-reading.)
- **The graded cap separates but under-penalizes.** Softening the cap may let a genuinely wrong-style build
  climb — E-40's original disease, inverted. S-182's two-sided test is the guard; if the wrong-style twin
  lifts too, the cap was softened too far.
- **The corpus is too thin to validate.** Matched vs 2 wrong-style concepts on one subject is a narrow base;
  a clean two-sided result here is necessary, not sufficient. Name the breadth gap; a labeled multi-state
  corpus is the real promotion bar (the standing E-40 owed item).
- **Promotion temptation.** The moment the crater separates, the pull to freeze the term is the freeze
  leaking back into creation. Recommend with evidence; the owned, guarded freeze is a separate step.
- **Over-fitting to this fixture.** Tuning thresholds until *this* gatehouse separates risks a term that
  works only here. Prefer a principled change (concept-conditional tag; monotone graded distance) over a
  tuned constant; report any constant and its sensitivity.

## Done when

The R/S locus is identified on evidence; the term is re-calibrated at that locus (concept-conditional tag
and/or graded cap), unit-tested; and the same crater at VOTES≥6 shows matched separating from its wrong-style
twin (outside ±12, `replaceContrast` positive) **while the wrong-style twin stays capped** — with a
PROMOTE-or-localize recommendation and the breadth caveat named. Or a failure above is reported as a precise,
auditable localization (reading-not-scoring; over-soft cap). Frozen instrument untouched.
</content>

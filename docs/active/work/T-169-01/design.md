# T-169-01 Design — how the referee is built and what it must prove

Grounded in research.md. The live probe already told us the headline: the structural classifier
mis-fires (matched and wrong both floor). The design must (a) capture that result rigorously across the
full fixture set, (b) measure corpus agreement honestly, (c) re-run the dispatch bake-off on the bigger
state set, and (d) produce a defensible promotion recommendation. The embarrassing result is the
deliverable; the design is about recording it without laundering it.

## Decision 1 — one consolidated harness, NEW file (not edits to the precedents)

**Chosen:** a new `experiments/eval-alignment/corpus-referee.mjs` running all three AC sections,
writing `results/corpus-referee.json` + beside-concept PNGs, importing the tested helpers from
`bakeoff-score.mjs` and `defect-corpus.mjs`.

- *Rejected: edit `clean-wrong-style.mjs` / `bakeoff.mjs` in place.* They are E-39's cited evidence;
  their `results/*.json` are the **baseline** this ticket compares against. Overwriting them destroys
  the comparison and muddies which run produced which number. The ticket says "build **on**" them —
  reuse their patterns (asset-guard-first, beside-PNG-first, `toB64` JPEG sniff, `VOTES` loop), not
  their output files.
- *Rejected: three separate files.* The three sections share the build-render loading, the `toB64`
  sniff, the asset guard, and the same corpus — one file with three sections is less duplication and
  one result document for FINDINGS to quote.

## Decision 2 — persist the full critique items (the gap that blocked offline re-scoring)

`critiqueEvidence` drops `present`. The harness will, per vote, persist
`items: [{department, severity, present, missing, styleClass}]` alongside the evidence bundle. This is
the audit trail proving *why* each score capped — without it the recommendation is unfalsifiable.
`styleClass` is computed by the same `itemStyleClass` the scorer uses (no second classifier).

## Decision 3 — corpus agreement is ORDERING, reported by confidence bucket, not averaged

AC #2: "agreement with the human pairwise labels on the contested pairs separately from the easy pairs."
- For each pair state: diagnose the build against the **matched** concept (subject's matched pack) and
  against the **wrong-style** concept (guildhall pack, mirroring `clean-wrong-style.mjs`'s B condition —
  the closest classical profile we ship). Score each with `styleFidelityScore`.
- **Agreement = does the score ORDER match the human `moreFaithful`?** i.e. `matchedScore > wrongScore`
  when the human said `moreFaithful:"matched"`. Magnitude is reported beside it but the label is an
  ordering, so the metric is an ordering.
- **Bucketing:** `high` confidence ⇒ "easy"; `medium`/`low` ⇒ "contested". The corpus has only `high`
  pairs ⇒ the contested bucket is **empty by construction** (the contested case `cottage-cream-vs-pink`
  was excluded as sub-threshold noise). The report states this plainly: *we can confirm agreement on the
  easy pairs and we cannot test the contested middle here because the corpus deliberately excludes it.*
  That is the honest answer to "separately," not a dodge.
- This bucketing is a PURE decision ⇒ it goes in `bakeoff-score.mjs` as `pairAgreement(rows)` with a
  unit test (keeps `npm test` meaningful; single-sources the easy/contested split).

## Decision 4 — bake-off on the 4 single corpus states, split vs fused

AC #3: "the ≥8–10-state bake-off can now actually discriminate split vs fused." The corpus's **4
single** states each carry a worst-department ground truth — that is the dispatch fixture (the 4 pairs
have no department ground truth; they are the crater/agreement fixture). Run split (DiagnoseBuild→
RouteCritique) vs fused (CritiqueWorkshopRound→region) exactly as `bakeoff.mjs` does, feed rows to the
existing `dispatchCorrectness`. 4 states > E-39's 2 — more power to separate split from fused.

**Honest caveat, stated up front:** the style-distance term does NOT touch dispatch routing (department
selection), so AC #3 does not test the term — it tests whether a bigger state set changes the E-39
split-vs-fused verdict. The ticket lists it because the corpus is what made ≥8 states possible; the
result is reported on its own terms (fused-wins included, per AC).

## Decision 5 — votes and spend envelope

`VOTES=2` for all three sections (matches `clean-wrong-style`; the headline finding is robust to votes —
both conditions floor regardless). Call budget: crater 4×2=8; agreement 4 pairs×2 concepts×2=16;
bake-off 4 states×2 votes×3 calls=24 ⇒ ~48 image diagnose calls. Probe-before-spend; asset-guard before
each section; beside-PNGs written first. Run in background (≈10–15 min). If the model path drops
mid-run, the partial JSON + the already-probed headline still ground the recommendation.

## Decision 6 — the recommendation is DO-NOT-PROMOTE (re-calibrate), pre-justified by the probe

The probe already shows the structural rule over-penalizes the matched (close) style to the floor — the
ticket's named failure: *"craters but disagrees with the human (over-penalizes a close style →
recommend graded re-calibration, NOT promotion)."* The full run will confirm/quantify, but the design
commits to honesty: **do not promote**; the term as built is unusable on live Layer A output because the
model emits `present`+`missing` for every item, so `itemStyleClass` cannot separate replace from
add-onto-incomplete. The prerequisite is the **typed `kind` discriminator** (the T-168 schema-feedback)
so only true `replace` items cap — that is a re-pinned E-39 ticket, not a promotion of the current term.
`recommendation.md` carries the evidence and the explicit "frozen instrument untouched here."

## What gets written
- `experiments/eval-alignment/corpus-referee.mjs` (new harness)
- `experiments/eval-alignment/results/corpus-referee.json` (live evidence, full items)
- beside-concept PNGs under `docs/active/work/T-169-01/`
- `pairAgreement` + test in `bakeoff-score.mjs` / `bakeoff-score.test.mjs`
- `FINDINGS.md` (the three results, read honestly) + `recommendation.md` (promote/recalibrate/don't)
- `package.json` script `corpus-referee`

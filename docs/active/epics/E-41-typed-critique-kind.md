---
id: E-41
title: typed-critique-kind
type: epic
status: open
priority: high
depends_on: [E-40]
spec: "§9"
stories: [S-170]
---

## Background (read this first — self-contained)

**Milestone rung: the measurement spine for M2, continued.** E-40's style-distance term *collapsed* (matched
and wrong-style both floored). The root cause is certain and the fix is one additive field. Governed by
`docs/knowledge/project-direction.md` + `docs/knowledge/anti-hedge-directive.md`. Blueprint:
`docs/active/work/T-168-01/schema-feedback.md`.

**The finding (E-40 / T-169-01).** `styleFidelityScore` caps an item as "wrong-style" via `itemStyleClass`
(`src/workshop/bakeoff-score.mjs`), which — absent a typed tag — infers style-class from the *emptiness* of
the `present`/`missing` strings: `present ∧ missing → wrong-style (capping)`. That is too coarse: a build
with the **right base material but a missing detail** (`present="plain plaster", missing="timber studs"`) is
structurally identical to a **wrong-material replace** (`present="brick", missing="rustic masonry"`) — both
are `present ∧ missing`. So the term caps *correct-but-incomplete* builds, flooring everything (pinned as
test BO11).

**The fix (already half-built).** `itemStyleClass` **already** short-circuits on a typed `item.kind`:
`replace → wrong-style`, `add → absent (not capping)`, `remove → match`, *before* the structural fallback.
Layer A just doesn't emit `kind` yet. So the entire epic is: **add `kind: "add" | "replace" | "remove"` to
`CritiqueItem` in `baml_src/department.baml`, teach `DiagnoseBuild` to judge it, re-pin the prompt golden.**
The judge — which can see whether the plaster is the right base material — decides, where the scalar can't.

**The wrinkle that orders this before E-42 (build faithfulness).** The typed tag fixes the over-cap of
*incomplete-but-right* builds. It does **not** rescue a build that is genuinely material-wrong against its
own concept — e.g. the E-40 "matched" gatehouse (plank/log siding, no cobblestone), which a *correct* judge
tags `replace` → still capped. That is the term working correctly; the gatehouse crater fixture will keep
flooring until E-42 supplies a materially-faithful build. So this epic's proof separates the two cases:
the term must stop capping incomplete-but-right builds (provable now), and the crater separates *iff* a
materially-faithful matched build exists (else that absence is the evidence for E-42).

## Stories

- **S-170 — typed `kind` on the critique contract, emitted by Layer A, and the re-run proof.** One additive
  enum field + one `DiagnoseBuild` prompt line + a deliberate prompt-golden re-pin (this is the *owning*
  ticket for that re-pin), then the live corpus re-run.

## How this epic can fail (state it up front)

- **The judge tags `kind` unreliably.** If `DiagnoseBuild` can't consistently distinguish a wrong-material
  `replace` from a right-material-missing-detail `add`, the tag is no better than the structural rule —
  report the confusion matrix, not a pass.
- **Everything still floors.** If even the corpus's truly-matched-and-faithful states stay capped after the
  tag lands, the bug isn't the tag — re-examine `styleFidelityScore`'s cap logic.
- **No faithful build to demonstrate the crater.** Expected and *fine* — that is the hand-off to E-42, not a
  failure of this epic. Say so explicitly.

## Done when

`CritiqueItem` carries a judged `kind`; `DiagnoseBuild` emits it (prompt re-pinned in this epic); the
over-cap of incomplete-but-right builds is gone (BO11's correction fires live); and the crater re-run is
reported — separating cleanly if a faithful build exists, or naming the build-faithfulness gap as the E-42
hand-off if not. Frozen instrument untouched.

---
id: E-39
title: structured-feedback-and-style-fidelity
type: epic
status: open
priority: high
depends_on: [E-38]
spec: "§9"
stories: [S-163, S-164, S-165, S-166]
---

## Background (read this first — self-contained)

**Milestone rung: the measurement spine for M2 ("a style invented in an afternoon").** You cannot climb
toward a style the metric cannot see. E-38 proved the build-quality eval works *and* found exactly where
it is blind; this epic fixes that blindness and makes the feedback actionable.

Governed by `docs/knowledge/project-direction.md` (the differentiator is the **measurement**) and
`docs/knowledge/anti-hedge-directive.md` (every story states how it can fail). Full prior context:
`docs/findings/2026-06-15-sprint-retro-foundations-through-measurement.md`.

**The finding that motivates this epic (E-38 wrong-style probe).** Holding a build fixed and varying only
the concept it is scored against: the defect-dominated eval craters a house-vs-koi-fish to q=3 (it is NOT
blind to gross category errors) — but **within the building family it is effectively style-blind**:
gatehouse=30, barn=32, cottage=27, church=22, a spread inside the eval's own noise (`±` up to 12 per
call). In the only regime we operate in, the measure gives the agent **no gradient toward matching the
concept's specific identity or style** — which is *why* every build homogenizes to the one rustic grammar
the generator owns. Nothing penalizes using the wrong style. **Fix the measure, not the generator.**

**The architecture (designed 2026-06-15).** Replace the single scalar/fused verdict with a typed,
two-layer, construction-addressed feedback path — built on the BAML stack already in the repo
(`baml_src/`, `src/baml/bridge.mjs`), reusing the idiom-registry as the construction-department catalogue:

- **Layer A — diagnostic judge ("what's wrong"), PER-STYLE.** Emits structured
  `CritiqueItem {department, expected, present, missing, severity}`. The `expected` field carries the
  style knowledge — one BAML suite per style — so a *rustic* judge knows a rustic roof and a *different*
  style's judge knows its own. This is the within-family gradient the scalar eval lacked.
- **Layer B — technical judge / router ("what to do"), UNIFIED.** Maps each critique item to a
  construction **department** and an available idiom. Style-agnostic: a roof problem routes to the roof
  department regardless of style.
- **The contract is the `Department` enum, GENERATED FROM the idiom-registry** (single source of truth),
  so the judge can only name departments the builder has tools for — the router never dead-ends.

**Two hard rules (lessons, not preferences):**
1. **Keep the creation/measurement wall.** This is the *creation* loop (it iterates the build). The frozen
   scalar instrument stays separate and reproducible (the de-freeze lesson; `critique.baml` already warns
   "WORKSHOP CRITIQUE, NOT THE FROZEN JUDGE"). This epic does not touch the frozen instrument.
2. **One composition point for the department vocabulary** — generated, never hand-listed twice, or the
   judge and the builder drift.

## Stories

- **S-163 — the typed contract.** `Department` enum generated from the idiom-registry + the `Critique`/
  `CritiqueItem` BAML classes, with conformance tests. Everything depends on it.
- **S-164 — split diagnose from dispatch.** Layer A (`DiagnoseBuild → Critique`) and Layer B
  (`RouteCritique → dispatch`), replacing the fused `WorkshopReply` in the creation loop.
- **S-165 — per-style diagnosis on a declared style.** Recognition declares `style`; the suite is selected
  by it; add a *second, genuinely different* style so differentiation is testable at all.
- **S-166 — the proof.** The falsifiable bake-off: split-beats-fused dispatch + a *clean build × wrong-
  style concept* fixture that must crater. Reported honestly wherever it lands.

## How this epic can fail (state it up front)

- **Split doesn't beat fused.** If the router merely echoes the diagnosis, the two-call cost buys nothing →
  report it and collapse back. (S-166 is the referee.)
- **The judge asks for the unbuildable.** Mitigated by the generated `Department` enum (S-163) — but if
  style fidelity needs idioms the registry lacks, *that gap is the finding* and routes to a generator epic.
- **Per-style `expected` is just relabeled defect-detection.** If the style-aware judge still scores
  intrinsic brokenness and ignores style, the clean×wrong-style fixture won't crater → the blindness is
  deeper than the prompt, and that is the honest result.

## Done when

The creation loop runs on split diagnose→route with a generated department contract; a clean build scored
against a same-family **wrong-style** concept **craters** (the within-family gradient exists); split is
shown to beat — or honestly fail to beat — the fused judge on dispatch; ≥2 genuinely different styles are
distinguished; the frozen instrument is untouched. Each with witnessed evidence and reported failures.

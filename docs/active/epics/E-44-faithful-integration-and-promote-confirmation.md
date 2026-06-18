---
id: E-44
title: faithful-integration-and-promote-confirmation
type: epic
status: open
priority: high
depends_on: [E-43]
spec: "§9.1"
stories: [S-177, S-178, S-179]
---

## Background (read this first — the constraint moved to the build, on purpose)

**Milestone rung: M1, closing the measurement arc — "the ruler is promotable, and the build no longer
gates it."** The E-38 → E-43 arc ended with the crater **separating for the first time** (T-173-01: matched
28 ≫ wrong-style 0) — but the verdict was explicitly **PROMOTE-PENDING-CONFIRMATION**, fragile for two
named, build-side reasons:

1. **No single *fully*-faithful build.** S-171 (faithful stone walls) and S-172 (roof-as-construction
   covering) live on **different pipelines and were never integrated**. The build the crater ran on has
   faithful walls but a residual **dark-oak prism roof** that still earns a `replace` (wrong-style) tag on
   some matched votes — the matched build self-caps on its own roof.
2. **The separation is a 2-vote coin-flip.** "Craters / doesn't" hinges on the wrong-style twin earning 2
   vs 1 `replace` tags at VOTES=2. The *direction* is the result; the *magnitude* is ±noise.

Both are creation-loop tasks, not term-scale re-calibration — **which is itself the arc's headline: the
residual gate is the build, not the measure.** This epic discharges exactly those two, then completes the
one treatment-vocabulary leak E-43 reported, so the promote recommendation can be made (or refuted) on
solid evidence.

Governed by `docs/knowledge/project-direction.md` (the differentiator is the measurement) +
`docs/knowledge/anti-hedge-directive.md` (every story states how it fails) + the pipeline philosophy
(creation is free; the frozen instrument stays separate — **we recommend the promote, we do not casually
freeze it**).

### What's already in hand (don't rebuild it)

- **Faithful walls** — `builds/gatehouse/faithful/` (S-171, stone_bricks/cobblestone, the materially-correct
  envelope the crater already used).
- **Roof-as-construction covering** — the T-172-01 pipeline that *kills the generateRoof prism* (covering
  mode, multi-ridge per `masses[]`). It just was never run on the faithful walls.
- **The crater harness** — `experiments/eval-alignment/corpus-referee.mjs` with `CRATER_BUILD` /
  `CRATER_ONLY` env gates (T-173-01) and `VOTES` already a knob; the `kind`-emitting Layer A (E-41).
- **The treatment grammar** — `treatment-grammar.mjs` (E-43), edges-from-geometry, which **composes cleanly
  onto the roof's eave/ridge** but **leaks on the raking verge (sloped line) and the voussoir arch head
  (curve)** — the two element-specific edges the wall row/column model can't name.

## Stories

- **S-177 — one fully-faithful gatehouse.** Run the T-172-01 covering roof on the S-171 faithful walls →
  a *single* build with faithful materials AND a constructed (non-prism) roof. Kill the residual
  `dark_oak_planks` prism; the roof reads as a covered, eave-banded roof, not a solid mass. Closure held;
  no per-subject hardcoding. The deliverable is the build dir + 4-azimuth renders beside the concept.
- **S-178 — confirm (or refute) the crater, robustly.** Re-run the crater on the S-177 fully-faithful build
  at **VOTES ≥ 4–6** against (a) matched and (b) same-family wrong-style concepts. A robust separation
  (spread well outside noise, *not* a 1-vote coin-flip; the matched build no longer self-caps on its roof)
  → a **PROMOTE recommendation with evidence**. If it stays fragile or collapses → localize the residual
  gate precisely (term scale vs build) and recommend accordingly. **Recommend; do not execute the freeze**
  (that's a separate, owned, pin-guarded step gated on this result).
- **S-179 — complete the treatment vocabulary (the E-43 leak).** The raking verge (a sloped line, per-column
  along the pitch) and the voussoir arch head (a curve) — the two edges the wall corner/top/row model can't
  express. Add the missing derivations/brushes so the *same* treatment grammar names them, and prove the
  gatehouse's verge board and arch head read on the render. (Enables a crisper roof in S-177's spirit, but
  does not block the crater — kept as a parallel completion, not a prerequisite.)

## How this epic can fail (state it up front — anti-hedge)

- **The two pipelines don't compose.** The covering roof may assume a footprint/occupancy the faithful-walls
  build doesn't present, or vice-versa — integration may need a real seam, not a flag flip. If so, *that
  seam* is the standing wall and the finding; name it, don't paper it with a prism fallback.
- **Higher votes don't firm the crater.** At VOTES≥4 the separation may stay a coin-flip — then the gate was
  the **term's distance scale** after all, not the build, and the recommendation flips to re-calibrate
  (a valid, sharp localization — the opposite of this epic's bet, reported honestly).
- **The fully-faithful build *still* self-caps.** Even with a constructed roof, some other element may earn
  a `replace` against the matched concept (e.g. a wrong opening material). Then "fully faithful" was a
  misnomer and the next defect is named.
- **The verge/voussoir derivations don't generalize.** A per-column sloped line and an arch curve may need
  element-local geometry the footprint model still can't supply on a *gable* or *multi-ridge* roof — if so,
  the edge classifier (not the brush) is the real sub-problem (the E-43 "hard geometry" risk, now concrete).
- **Promotion temptation.** The pull to *freeze the term* the moment the crater separates is the freeze
  leaking back into creation. We recommend with evidence and let the owned, guarded step do the freeze —
  never edit the frozen instrument inside this epic.

## Done when

A single build carries faithful materials AND a constructed (non-prism) roof, rendered beside the concept;
the crater re-run at VOTES≥4–6 yields a robust verdict (separates → PROMOTE recommendation with evidence; or
stays fragile/collapses → residual gate localized and recommendation flipped); and the treatment grammar
names the raking verge and voussoir head so they read on the render — or each failure above is reported as
a precise, auditable localization. Frozen instrument untouched.
</content>
</invoke>

---
id: E-06
title: phase-1-study
type: epic
status: open
priority: high
depends_on: [E-03, E-04, E-05]
spec: "§8, §11"
stories: []
---

## Goal

Run the **Phase-1 study**: the 3 × 3 trial matrix (three archetypes × three build targets) on the pinned model, each cell scored and token-tracked, and produce the quality-per-token analysis that is the Phase-1 result (§8, §9).

## Why it matters

This is the point of the whole instrument. Holding the build set fixed across archetypes is what makes the comparison fair; the matrix answers which prompting methods meaningfully improve styled, palette-constrained design quality — and at what token cost.

## Scope

**In:**
- End-to-end smoke trial first: single-shot archetype × house target, full path (prompt → artifact → schematic export → render → score → token count → logged transcript).
- Add path and landscape targets; run the full 3 × 3 matrix on the pinned model.
- Per-cell scoring (automatic metrics + rubric via E-05) and token tracking.
- Quality-per-token analysis: efficiency frontier across archetypes, not a single winner. Reproducible, keyed by §5 metadata.

**Out:**
- Model sweep across multiple models (E-07).
- Generalization across many styles (Phase 1 isolates archetype effects; open question §12).

## Candidate stories

- End-to-end smoke trial (single-shot × house).
- Full 3 × 3 matrix run on the pinned model.
- Quality-per-token analysis + Phase-1 writeup.

## Definition of done

- All nine cells run, scored, and token-tracked, with transcripts logged.
- A written Phase-1 conclusion framed as a quality-per-token frontier, reproducible from the trial records.

## Open questions (from §12)

- Build-set scale: fixed target sizes/seeds across archetypes (needed for fair token comparison).
- Single style/palette for Phase 1 vs a small set to test generalization.

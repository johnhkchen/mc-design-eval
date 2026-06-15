---
id: E-04
title: evaluation-and-scoring
type: epic
status: open
priority: high
depends_on: [E-01, E-02]
spec: "§9"
stories: []
---

## Goal

Build the **evaluation layer**: the automatic metrics (palette adherence, survival buildability, token tracking) and the qualitative design rubric. Every trial is scored on **quality and cost together** (§9), keyed to the trial record.

## Why it matters

The metrics are what turn "did the model design well?" into a partially automatable, reproducible question, and what makes the Phase-1 matrix a result rather than an anecdote. Quality-per-token is the framing, not a single winner.

## Scope

**In:**
- **Palette validator:** count of placements outside the declared whitelist; palette coverage/diversity. Runs on every build.
- **Survival-buildability validator:** static check over the artifact — unsupported gravity blocks, attachment blocks with no valid face, creative-only blocks.
- **Token tracking:** input vs output per trial; per-turn context growth (iterative); image tokens separated (multimodal). Sourced from Agent SDK message objects.
- **Design rubric:** fixed rubric per target capability (house: enclosure coherence; path: continuity/terrain; landscape: composition/material judgment) + named-style adherence. Definition + scoring guide.

**Out:**
- The human-scoring **UI** (E-05) — this epic defines the rubric; E-05 serves it.
- Running the matrix (E-06).

## Candidate stories

- Palette adherence validator.
- Survival-buildability validator.
- Token-tracking hooks off Agent SDK message objects.
- Design rubric definition + scoring guide (per target + style).

## Definition of done

- The three automatic metrics run on any trial and write into the trial record.
- A fixed, documented rubric exists, ready to be human-scored (E-05) or model-scored.

## Open questions (from §12)

- Rubric: human-scored, model-scored, or both (cost/turnaround per matrix cell).
- Survival-buildability scope: static check only, or also flag tedious-to-scaffold geometry.

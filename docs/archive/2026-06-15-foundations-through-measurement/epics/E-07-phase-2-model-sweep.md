---
id: E-07
title: phase-2-model-sweep
type: epic
status: deferred
priority: low
depends_on: [E-06]
spec: "§1, §11"
stories: []
---

## Goal

**Phase 2 (deferred):** open the model axis. Parameterize the model ID and sweep across models on the prompting archetypes that proved worth their token cost in Phase 1 (§1 sequencing).

## Why it matters

The methods-first sequencing (§1) is load-bearing: with the artifact contract and evaluation spine fixed by Phase 1, the model sweep is cheap — only the model ID varies. This epic only becomes real once E-06 has identified which archetypes move the needle.

## Scope

**In (when activated):**
- Parameterize the single-sourced model ID (set up in E-03) into a sweep dimension.
- Run the worthwhile archetypes (per E-06) across a set of current model IDs.
- Comparative analysis, inheriting the Phase-1 scoring spine and rating UI unchanged.

**Out:**
- New archetypes, new targets, or scoring changes — Phase 2 reuses the Phase-1 instrument as-is.

## Candidate stories

- Model-ID sweep parameterization.
- Cross-model run on Phase-1-winning archetypes.
- Cross-model comparative analysis.

## Definition of done

- Models compared on the archetypes that justified their cost in Phase 1, scored on the same spine, reproducible.

## Notes

- Status is `deferred` until E-06 completes and the worthwhile archetypes are known.
- Model IDs (§4): pin by current IDs in config; do not hardcode deprecated strings (older Opus 4 / Sonnet 4 IDs retire 2026-06-15).

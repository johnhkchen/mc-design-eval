---
id: E-03
title: experiment-harness
type: epic
status: open
priority: high
depends_on: [E-01, E-02]
spec: "§4, §7"
stories: [S-004, S-005]
---

## Goal

Build the **Claude Agent SDK experiment harness** that runs each trial, varies the prompting archetype as the single independent variable, and owns full transcript + token logging (§4). Implement the three Phase-1 archetypes as named, versioned configs (§7).

## Why it matters

The harness is what makes prompting-method experiments clean: vary one input, hold the loop constant, capture comparable traces. The archetypes are the variable under test in Phase 1; everything else is held fixed.

## Scope

**In:**
- Agent SDK trial runner (the Node package — not `claude -p`), with the render harness (E-02) wired as a tool.
- Model ID pinned in config, single-sourced so Phase 2 (E-07) can sweep it.
- Three archetypes as versioned configs: **single-shot**, **iterative / phase-based additive**, **multimodal enhanced**.
- Per-trial transcript logging and native token accounting (input vs output; per-turn growth for iterative; image tokens separated for multimodal).

**Out:**
- Scoring/validators (E-04) and the rating UI (E-05) — the harness produces the trial record they consume.
- Model sweep (E-07).
- `allow_insecure_coding` / LLM-writes-and-runs-code paths are explicitly out (§3).

## Candidate stories

- Agent SDK trial runner + pinned-model config + transcript/token logging.
- Single-shot archetype config.
- Iterative (phase-based additive) archetype config.
- Multimodal-enhanced archetype config.

## Definition of done

- A trial runs end-to-end for any archetype, producing an artifact + full transcript + token counts keyed by §5 metadata.
- Archetypes are attributable to a versioned config, not incidental wording drift.

## Notes

- Billing (§4): Agent SDK usage is metered API spend as of 2026-06-15; enable overflow billing so batches don't halt mid-run.

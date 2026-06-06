# T-015-01 · Review — concept-input-variant matrix

## Outcome
Default stage-1 concept INPUT VARIANT chosen: **C (render only)** — confirms the ticket's prior on the
evidence. This is a comparison ticket; the deliverables are images + a journal entry + a decision, all
produced with **no source/prompt change**. `npm test` stays green (133/133).

## What changed
**Created — concept images** (`benchmarks/temple-facade/concepts/`, flash, 48 blocks):
- Regenerated fresh against the current prompt: `taj/horyuji/chapelle/arc/mausoleum-A-flash.png`,
  same five `-C-flash.png` (taj/chapelle overwritten; horyuji/arc/mausoleum new).
- New `-B-flash.png` for all five references.
- New base controls: `taj-base-flash.png`, `horyuji-base-flash.png`.
- 17 matrix cells total. Pre-existing `taj-A-flash-seg.png` left untouched.

**Modified — journal:** `docs/knowledge/design-learnings.md` — appended one section
`## Stage-1 concept-art · input-variant matrix (E-09, T-015-01) · 2026-06-05` with setup, per-variant
synthesis, decision + image-grounded rationale, and three observed prompt weaknesses (S-017 input).

**Created — RDSPI work artifacts** (`docs/active/work/T-015-01/`): research.md, design.md,
structure.md, plan.md, progress.md (full per-cell rubric), review.md (this file).

**Not changed (by design):** `conceptart.mjs`, `baml-concept.mts`, `baml_src/conceptart.baml`,
`baml_client/**`, `src/nano-banana.mjs`, schema/validation/`src/**`. No `npm run baml:gen` needed.

## Acceptance criteria — status
- [x] **Matrix generated:** B and C for all 5 refs (A re-generated fresh too); base added for 2 refs
      (taj, horyuji). Saved under `concepts/`. 17 cells, all succeeded first try.
- [x] **Each concept viewed and assessed** on the three targets; per-variant strengths/weaknesses
      recorded (most voxel-honest / most faithful / best-segmented → all C). Full rubric in progress.md.
- [x] **Default variant chosen with image-grounded rationale:** C, one paragraph naming specific cells
      (taj-A white dome, arc-A figures, chapelle-B filigree, 5/5 black bg for C).
- [x] **Journal entry appended** to design-learnings.md (chosen variant + why, per-variant notes, prompt
      weaknesses for S-017).
- [x] **No source/prompt change; `npm test` stays green** (133/133). No diff to record.

## Decision rationale (condensed)
C is the only variant black-background in 5/5 cells (segmentation is the whole point of this stage — it
feeds TRELLIS). A failed to white on 2/5 and copied the reference literally (white Taj marble dome; Arc
human figures); B failed to white on 2/5 and pulled in filigree/text. C's palette is doc-correct in
every cell because it refines our own doc-grounded render, and it cannot copy a reference it never sees.
C wins all three stage-1 targets simultaneously.

## Test coverage & gaps
- **Regression:** `npm test` 133/133 — confirms no collateral damage (none expected; no source edit).
- **No unit tests added** — correct for a comparison ticket; there is no new code. The "test" is the
  17-cell generation succeeding and the eyeball assessment, both done.
- **Gap (inherent to image models):** the assessment is single-sample per cell. Image generation is
  non-deterministic, so a given cell's exact rendering is a draw. The decision rests on *consistent
  tendencies across 5 references* (e.g. A/B's white-background drift, C's 5/5 black), not any single
  lottery image — which is the right level of confidence for an eyeball comparison. If S-016's regression
  check ever sees C drift to white, that would be the signal to revisit.

## Open concerns / handoff
- **S-016 (lock default):** set variant **C** as the orchestrator default in `conceptart.mjs` and
  re-run all 5 references to confirm no regression. The matrix here is the baseline to compare against.
- **S-017 (robustness) inherits three prompt weaknesses** (all documented in the journal):
  1. Black-bg instruction is overridden when a reference photo is attached (only bites A/B, not C).
  2. "NO text" too weak for inscription-bearing buildings (mausoleum plaques across A/B/C; taj-base
     calligraphy) → strengthen to "replace nameplates with blank/rosette panels."
  3. Figural-relief copying survives the "inspiration only / no figures" clauses (arc-A).
  Notably, #1 and #3 only affect the reference-attached variants — a structural argument that C (which
  never sees the photo) is the safer default beyond just this matrix's scores.
- **No critical issues require human attention.** The ticket made no code change, tests are green, and
  the decision is documented and reproducible (every cell regenerable via
  `node benchmarks/temple-facade/conceptart.mjs --variant=<V> [--ref=<r>]`).

## Commit note
Per RDSPI, the image artifacts plus journal + work artifacts are the durable record. Note: run
directories under `benchmarks/temple-facade/runs/` are gitignored, but `concepts/` is not — the 17 PNGs
and the design-learnings.md edit are stageable. Committing is left to the operator / Lisa per the chain's
convention.

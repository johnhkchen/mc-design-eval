# T-018-01 · Structure — file-level blueprint

This is the shape of the change, not the prose. Because the design resolved to a confirm-only
synthesis, the file footprint is intentionally tiny: **one file modified (append), zero source files
touched, zero files created** beyond the RDSPI work artifacts that Lisa tracks.

## Files MODIFIED

### `docs/knowledge/design-learnings.md` — append one section (the deliverable)

- **Operation:** append-only at EOF (currently 1049 lines). No edits to any existing line; the three
  predecessor stage-1 sections (matrix @885, lock @951, hardened @987) stay verbatim — they are the
  reproducibility trail.
- **New section heading (mirrors the T-014-01 consolidation precedent and the `## Stage-1
  concept-art · …` naming already in the file):**

  `## Stage-1 concept-art · CONSOLIDATION + stage-2 handoff (E-09, T-018-01 — synthesis, NOT a trial) · 2026-06-05`

- **Internal block order (the public shape of the section):**
  1. One-line lead: stage 1 is **DONE**; what this section is (terminal synthesis of S-015…S-017).
  2. **Locked artifacts — confirmed.** Bulleted: `conceptart.baml` @33de8c8 (the 3 clause tightenings);
     `conceptart.mjs` default=C @565f32f matching S-016; client regenerable via `npm run baml:gen`.
  3. **Best input variant + why** (C; the structural by-construction argument + the matrix evidence).
  4. **What makes a concept voxel-ready** (the 4 criteria: isolated / segmentable / resolution-
     disciplined / faithful+colorful).
  5. **The load-bearing prompt rules** (the small clause set, each tagged with the failure it prevents,
     incl. the "white-near-the-bg-clause" wording trap).
  6. **Residual caveats** (non-determinism; the concentric-square medallion).
  7. **Handoff to stage 2** (one paragraph — the guarantee TRELLIS consumes).
  8. Closing: `npm test` 133/133 green; no source/rubric/brief edit this ticket.

- **Length target:** ~55–70 lines, proportional to a pointer-style synthesis.

## Files NOT changed (explicit, by design)

| file | why untouched |
|------|---------------|
| `baml_src/conceptart.baml` | already the locked strong version (33de8c8); confirm-only |
| `benchmarks/temple-facade/conceptart.mjs` | default already C (565f32f); confirm-only |
| `benchmarks/temple-facade/baml-concept.mts`, `src/nano-banana.mjs` | no logic change in scope |
| `baml_client/**` | no `baml_src` edit ⇒ no `npm run baml:gen` needed |
| `benchmarks/temple-facade/concepts/*.png` | no re-generation (design Decision 1) |
| schema / rubric / brief / `src/**` | constraint: no rubric/brief edits, no experiment |
| ticket frontmatter `T-018-01.md` | Lisa owns phase/status transitions — never hand-edited |

## Files CREATED — RDSPI work artifacts (Lisa-tracked, under `docs/active/work/T-018-01/`)

`research.md` · `design.md` · `structure.md` (this file) · `plan.md` · `progress.md` · `review.md`.
These are the process record, not the product; the product is the `design-learnings.md` section.

## Ordering that matters

1. Confirm locks + green test **before** writing the section, so the section asserts only verified
   facts (done in research/design; re-checked in plan step 1).
2. Append the section.
3. Re-run `npm test` (markdown-only change ⇒ expected green) to satisfy the explicit criterion.
4. Write `progress.md`, then `review.md`.

No inter-file dependencies beyond this; no interface or module-boundary changes anywhere (it is a
documentation append). Commit is left to the operator / Lisa per the chain's convention — the durable
record is the journal section, already in the working tree.

# T-015-01 · Plan — concept-input-variant matrix

Ordered, independently-verifiable steps to execute the experiment. No source change; the "tests" here
are (a) the smoke cell succeeds, (b) all 17 PNGs exist and are viewable, (c) `npm test` stays green.

## Step 0 — Preconditions (verify, don't change)
- `.env` present with `GEMINI_API_KEY` (Research confirmed). `baml_client/` generated (confirmed).
- Work dir `docs/active/work/T-015-01/` exists (confirmed).
- **Verify:** nothing to change; proceed.

## Step 1 — Smoke-test the pipeline on one cheap cell
Run a single `base` cell (no image attached, fastest, isolates auth + tsx + BAML render + Nano Banana):
```
node benchmarks/temple-facade/conceptart.mjs --variant=base --ref=horyuji
```
- **Verify:** stdout shows `ok <ms>ms (0 img, <n> chars) → …/horyuji-base-flash.png` and the PNG exists
  and is non-trivial in size. If it FAILS on auth, stop and report (no code change permitted to fix —
  it would be an env issue). This is the go/no-go gate before fanning out.

## Step 2 — Generate variant A for all five references (regenerate fresh)
```
node benchmarks/temple-facade/conceptart.mjs --variant=A
```
- **Verify:** five `ok` lines (`1 img` each); `taj/horyuji/chapelle/arc/mausoleum-A-flash.png` updated.
- Rerun any single FAILED cell with `--ref=<name>`.

## Step 3 — Generate variant B for all five references
```
node benchmarks/temple-facade/conceptart.mjs --variant=B
```
- **Verify:** five `ok` lines, each `2 img` (ref + render); five `*-B-flash.png` created.

## Step 4 — Generate variant C for all five references
```
node benchmarks/temple-facade/conceptart.mjs --variant=C
```
- **Verify:** five `ok` lines, each `1 img` (render only); five `*-C-flash.png` (taj/chapelle
  overwritten, horyuji/arc/mausoleum created).

## Step 5 — Generate the second base control
```
node benchmarks/temple-facade/conceptart.mjs --variant=base --ref=taj
```
- **Verify:** `taj-base-flash.png` exists (`0 img`). With Step 1's horyuji-base, both controls present.
- **Matrix complete check:** `ls concepts/` shows 17 matrix PNGs (A×5, B×5, C×5, base×2) plus the
  pre-existing `taj-A-flash-seg.png`.

## Step 6 — View and assess every concept (eyeball-only)
Read each PNG and score on the 3-axis rubric (fidelity / inspiration-not-blueprint / voxel-honest
detail; Hi/Med/Lo + one-line note). Batch by variant so each variant's tendency is judged across the
five references. Pay special attention on the three primary targets noted in the ticket; record:
- which variant is **most voxel-honest**, **most faithful** (palette+massing), **best-segmented**;
- the characteristic failure mode of each variant (e.g. A: reference-palette bleed; C: low detail).
- **Verify:** every cell has a rubric row in `progress.md`.

## Step 7 — Choose the default variant
Apply the decision rule (Design): Hi on fidelity AND voxel-honest detail across the most references,
tie-break on cleanest segmentation. Write a one-paragraph, image-grounded rationale naming specific
files. Confirm or overturn the ticket's prior (C).
- **Verify:** a single variant is named with rationale citing concrete images.

## Step 8 — Append the journal section to design-learnings.md
Append `### Stage-1 concept-art · variant matrix (E-09, T-015-01) · 2026-06-05` with: setup, per-cell
rubric table, per-variant synthesis, decision + rationale, and observed prompt weaknesses (S-017 input).
- **Verify:** section appended at end of the attempt log; style matches surrounding entries.

## Step 9 — Confirm tests green
```
npm test
```
- **Verify:** validate self-test passes, invalid-artifact check passes, `test:unit` passes. No source
  was touched, so this should be unchanged-green. Record the result in `progress.md`.

## Step 10 — Write progress.md and review.md
- `progress.md`: the run log (cell outputs, the full rubric table, deviations if any).
- `review.md`: handoff — files created/modified, what to verify, open concerns, S-017 hand-off.

## Testing strategy summary
- **Smoke (Step 1):** one-cell go/no-go for the whole pipeline.
- **Per-batch verification (Steps 2–5):** each `ok` line confirms image count + output path; failed
  cells are individually re-runnable (orchestrator isolates failures).
- **Completeness check (Step 5):** `ls` confirms all 17 matrix cells present.
- **Regression (Step 9):** `npm test` green proves no collateral damage (expected, since no source edit).
- **No unit tests are added** — there is no new code to test; the deliverable is images + a journal
  entry + a decision. This is appropriate for a comparison ticket.

## Rollback / idempotency
Every generation overwrites its deterministic path; rerunning is safe and reproducible. If a journal
edit is wrong, it is a localized append that can be re-edited. No git history is rewritten; commits (if
any) are incremental per the RDSPI Implement convention.

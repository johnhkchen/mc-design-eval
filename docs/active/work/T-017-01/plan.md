# T-017-01 — Plan

Ordered, independently verifiable steps. The loop (edit → regen client → regen images → view) may
repeat; the plan names the exit condition.

## Step 0 — Baseline (DONE in research)

- `npm test` green (133/133). ✔
- Round-0 audit of all 5 default-C images recorded (research.md table): arc + mausoleum fail
  resolution; chapelle fails segmentation (dark-on-dark) + minor filigree; taj + horyuji pass both.
- Verify: table exists, baseline test green. ✔

## Step 1 — Tighten `FacadeConceptPrompt` (edits 1–3)

Apply the three targeted wording changes from design.md / structure.md:
1. HARD LIMIT #1 (figures) — add doc-override + blank/rosette replacement for niches.
2. HARD LIMIT #2 (text) — name nameplate/plaque/cartouche/tablet; blank/rosette replacement.
3. Segmentation clause — pure `#000000` (no tint/gradient); outermost elements (spires/finials/
   pinnacles/roof crest) in a light high-contrast palette color, never dark/dim.
- Verify: `git diff baml_src/conceptart.baml` shows exactly these three edits; prompt still reads
  coherently; signature unchanged.

## Step 2 — Regenerate the BAML client

- `npm run baml:gen`.
- Verify: command exits 0; `baml_client/` mtime updated; a quick grep of the generated client (or
  `b.request.FacadeConceptPrompt` smoke) carries the new wording.

## Step 3 — Smoke gate (one reference, the cheapest signal)

- Regenerate a single previously-failing reference first: `node benchmarks/temple-facade/conceptart.mjs
  --ref arc` (default variant C). VIEW `concepts/arc-C-flash.png`.
- Verify: the worker logs `[C/flash]`, 1 img; the new prompt text actually reached the model (figures
  gone confirms the regen took). If arc still shows figures, the regen didn't take or the wording is
  too weak → fix before spending the full batch.

## Step 4 — Regenerate the full default-C set

- `node benchmarks/temple-facade/conceptart.mjs` (no flags → all 5 refs, default C, Flash, 48).
- Verify: 5 cells log `ok … [C/flash]`; 5 PNGs updated under `concepts/`.

## Step 5 — Audit all 5 (the acceptance VIEW)

- Read each of the 5 `concepts/<ref>-C-flash.png`. For each record segmentation pass/fail and
  resolution pass/fail with the specific issue if any (mirror the research.md table → final column).
- Verify (exit condition): **no reference fails either property.** Specifically —
  - arc: no human/animal figures (niches are blank/rosette panels).
  - mausoleum: no nameplate/glyph above the arch (blank/rosette panel).
  - chapelle: pure black bg, spires/pinnacles light enough to not merge; no fine gable filigree.
  - taj, horyuji: no regression (still pass both) — confirm the light-edge rule didn't bleach them.

## Step 6 — Iterate on residual failures (conditional loop)

For any reference still failing at step 5:
- If it looks like a one-off bad draw (e.g. lone white-bg drift, per the horyuji precedent), redraw
  just that `--ref` once and re-view (lottery vs. tendency).
- If it persists across a redraw, apply the matching wording tightening (incl. conditional edit 4 for
  filigree) and loop back to step 2.
- Verify: convergence — every reference clean on a fresh draw and the prompt no longer invites the
  leak. Note any reference that required a redraw (residual draw variance, not a prompt failure).

## Step 7 — Regression gate

- `npm test`.
- Verify: still green (133/133). The prompt text isn't under test, but regen touches `baml_client/`;
  this confirms nothing imported broke.

## Step 8 — Commit the change

- Stage `baml_src/conceptart.baml`, regenerated `baml_client/`, the 5 `concepts/*-C-flash.png`.
- Commit: `feat(E-09 stage-1): harden concept segmentation + resolution discipline (T-017-01)`.
- Verify: working tree clean except the work-dir artifacts + journal; commit message references the
  ticket.

## Step 9 — Journal entry

- Append to `docs/knowledge/design-learnings.md` a `T-017-01` section: round-0 → final per-reference
  audit table, the prompt diff(s), the verdict (all 5 cleanly segmentable + resolution-disciplined),
  and any redraw notes.
- Verify: section present; reproducible (concepts saved, prompt diff committed).

## Step 10 — Review artifact

- Write `progress.md` (running) and `review.md` (handoff): files changed, what was verified, open
  concerns (residual draw variance), and the green test.

## Testing strategy

- **No new unit tests.** The change is a generative-prompt wording edit; correctness is judged by
  eyeball VIEW of the output images, per the ticket ("eyeball-only"). Adding a unit test for prompt
  text would be a brittle string-assert with no behavioral value.
- **Regression gate:** existing `npm test` (133 tests) must stay green — guards the regenerated
  client and untouched modules.
- **Acceptance test = the step-5 audit:** every reference passes both properties on view. This is
  the ticket's binding criterion and is recorded in the journal.

## Exit condition (definition of done)

All 5 references, default variant C: segmentation clean (isolable) AND resolution-disciplined (no
figures/text/filigree), recorded pass/fail in the journal; prompt diff committed + client
regenerated; `npm test` green; concepts saved under `concepts/`.

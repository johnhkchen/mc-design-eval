# T-015-01 · Design — concept-input-variant matrix

## Decision in one line
Run the full B/C matrix for all five references on flash, re-use existing A, add `base` controls for
two references, **view every PNG**, score each on the three stage-1 targets, and pick a default input
variant with an image-grounded rationale — making **no source/prompt change**.

This is an experiment ticket. "Design" here = the experimental design (what to generate, how to judge,
how to decide), not a software architecture.

## Goal restated
Choose the single best INPUT VARIANT (A | B | C | base) for the stage-1 concept generator, so S-016 can
lock it as the orchestrator default. The variable under test is *what we attach to Nano Banana*, with
resolution fixed at 48 blocks.

## What the variants actually trade off
From Research, each variant changes only the image set + the `attached` instruction:
- **A (ref only)** — richest source of architectural character, but the reference carries the WRONG
  palette (white marble, etc.). Risk: color bleed (memory: *reference grounds craft not color*) and
  literal copying (target 2). Strength: crisp, plausible architecture (target 3).
- **B (ref + our render)** — has both the palette-correct render and the palette-wrong reference. May
  get the best of both, OR the two images may fight (reference palette wins, or massing gets muddled).
- **C (our render only)** — palette is guaranteed correct (our render already obeys the doc) and massing
  is our own, so fidelity (target 1) should be highest and reference-copying (target 2) impossible.
  Risk: our render is low-detail/flawed, so the concept may inherit those flaws or look impoverished.
- **base (doc only)** — pure text-to-image; no image grounding. Control to measure how much any image
  helps at all. Risk: drifts off-massing because nothing anchors geometry.

## Options considered for HOW to run/judge

### Option 1 — Generate only the gaps, judge ad hoc
Generate just the missing cells (B×5, C×3, base×2), eyeball them, write up.
- **Pro:** fewest generations (~10), cheapest, fast.
- **Con:** A images were generated in a prior session; mixing old-A with fresh-B/C risks comparing
  across prompt drift. Ad-hoc judging is hard to reproduce / defend in the journal.

### Option 2 — Regenerate the entire matrix fresh, score with a fixed rubric (CHOSEN)
Regenerate A/B/C for all 5 (15 cells) + base for 2 (taj, horyuji) = **17 cells**, all flash, in one
session against the current prompt. Then view all and score each cell on a fixed 3-axis rubric
(fidelity / inspiration-not-blueprint / voxel-honest-detail), each Hi/Med/Lo, before deciding.
- **Pro:** every image is generated against the *same current prompt* — clean apples-to-apples. The
  rubric makes the per-variant notes (an acceptance criterion) systematic and the default choice
  defensible. Cost is still pennies × 17.
- **Con:** ~17 generations instead of ~10; a few minutes longer. Acceptable — generation is metered and
  explicitly fine per the ticket.

### Option 3 — Add `--pro` (Nano Banana Pro) to the comparison
Also run the winner family on the Pro model for quality headroom.
- **Pro:** might reveal the ceiling.
- **Con:** confounds the variable (model ≠ input variant). Out of scope: this ticket isolates input
  variant; model choice belongs to a later ticket. **Rejected.**

### Option 4 — Build an automated LLM-judge to score concepts
- **Pro:** repeatable scoring.
- **Con:** the ticket explicitly says **eyeball-only**, and an automated judge is a code change this
  ticket forbids. **Rejected** — defer any judge to a later story.

## Chosen approach (Option 2) — rationale
The ticket's acceptance criteria demand: (a) B and C for all 5 refs + base for ≥2; (b) each concept
viewed and assessed with per-variant strengths/weaknesses; (c) a default chosen with image-grounded
rationale; (d) a journal entry. Option 2 satisfies all four with the cleanest evidence base. Regenerating
A too (rather than reusing stale A) costs ~5 extra pennies and removes the prompt-drift confound, which
is worth it for a decision that S-016/S-017/S-018 all inherit. Staying on flash keeps the comparison
honest (all precedents are flash) and defers the model question.

## Scope of base controls
Add `base` for **taj** and **horyuji** — taj is the founding reference (richest doc, best-known
target) and horyuji is the generalization stress-test (very different massing: timber pagoda vs Mughal
cube). Two structurally dissimilar controls bound how much image-grounding matters across the spectrum.

## Judging rubric (applied per cell, eyeball)
For each PNG, record three marks + a one-line note:
1. **Fidelity** — does the palette match the doc's named colors and the massing match its description?
   (Hi = palette + massing both right; Lo = reference palette bled in or massing wrong.)
2. **Inspiration-not-blueprint** — does it borrow character without copying the reference literally?
   (A is most at risk; C cannot fail this.)
3. **Voxel-honest detail** — bold block-scale ornament only; no sub-block figures/text/filigree, clean
   silhouette against black, cleanly segmentable. (The 48-block discipline.)
Then a per-variant synthesis: which variant is most voxel-honest, most faithful, best-segmented.

## Decision rule
Pick the variant that is **Hi on fidelity AND voxel-honest detail across the most references**, breaking
ties toward the one that also segments cleanest (matters most for the downstream TRELLIS stage). The
ticket's prior is C; confirm or overturn it from the images. Record the rationale in one paragraph
grounded in specific images.

## Risks & mitigations
- **Gemini transient failures** → orchestrator already isolates per-cell failures; rerun the single
  failed `--ref --variant` cell.
- **Non-determinism** (image models vary run-to-run) → judge on architectural *tendencies* of each
  variant, not single-image lottery; note if any cell looks like an outlier and rerun once if so.
- **`.env` key not picked up** → nano-banana falls back to `.env`; if a cell errors on auth, that's the
  signal. No code change needed.
- **`npm test` regression** → none expected (no source touched); run it at the end to confirm green.

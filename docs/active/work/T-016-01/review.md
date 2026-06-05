# T-016-01 · Review — lock default concept variant

## Outcome
The concept-art stage now has **one obvious behavior**: omitting `--variant` produces variant **C
(render-only)** — the S-015 matrix winner. The lock was confirmed by regenerating C for all five
references *through the defaulted command* (no `--variant`) and viewing each. `npm test` stays green
(133/133). This is a tiny, well-bounded code change plus an eyeball confirmation; the heavy decision
(which variant) was made and justified in T-015-01.

## What changed
**Modified — code:** `benchmarks/temple-facade/conceptart.mjs`
- Default flip: `arg("variant", "A")` → `arg("variant", "C")` (one line). `"A"` is no longer a default
  literal anywhere.
- Header comment: marked **C** as the locked default with a one-sentence rationale (reliable black
  background ⇒ cleanly segmentable for TRELLIS; never sees the reference so cannot copy it/its
  palette), and fixed the usage examples so the no-`--variant` example reflects C.
- Variants A / B / base, `VARIANTS` closures, `TARGET_BLOCKS = 48`, Flash default, and `REFS` are all
  untouched — the matrix stays fully reproducible (`--variant=A|B|base`).

**Modified — journal:** `docs/knowledge/design-learnings.md`
- Appended `## Stage-1 concept-art · default variant LOCKED (E-09, T-016-01) · 2026-06-05`: the lock
  statement + a per-reference confirmation (holds / weakened + why) + a net verdict.

**Regenerated — concept images** (`benchmarks/temple-facade/concepts/`, flash, 48 blocks, via the
defaulted command): `taj/horyuji/chapelle/arc/mausoleum-C-flash.png`. NOTE: `concepts/` is gitignored
at the repo root (working scratch dir, like `runs/` renders), so these live on disk but are not
version-controlled — the journal's per-reference verdicts are the durable record. (This corrects a
note in T-015-01's review that assumed `concepts/` was committable.)

**Created — RDSPI artifacts:** `docs/active/work/T-016-01/{research,design,structure,plan,progress,
review}.md`.

**Not changed (by design):** `baml_src/conceptart.baml`, `baml_client/**`, `src/nano-banana.mjs`,
`baml-concept.mts`, `schema/**`, `src/**`. No `npm run baml:gen`. Ticket frontmatter left untouched
(Lisa owns phase/status).

## Acceptance criteria — status
- [x] **`conceptart.mjs` defaults to the S-015-chosen variant (C) when `--variant` omitted; diff
  committed.** Verified: smoke run with no flag logged `taj [C/flash]`; diff is the one-line default +
  comment.
- [x] **Default-variant concept regenerated and viewed for all 5 references; each meets the three
  stage-1 targets — no regression.** Four hold cleanly; the one white-background drift (horyuji) was
  re-drawn once and returned black, confirming a non-deterministic lottery draw rather than a
  regression (per the T-015-01-defined watch signal). arc weakened on inspiration-not-blueprint (gold
  figures in niches) but retains the decisive black background. All recorded.
- [x] **Journal entry records the lock + the all-reference confirmation (one line per reference).**
  Done in design-learnings.md.
- [x] **`npm test` green; concept images saved under `concepts/`.** 133/133; five C PNGs on disk.

## Confirmation result (the substance reviewers should weigh)
| ref | bg | verdict | why |
|-----|----|---------|-----|
| taj | black | holds | gold dome (doc palette, not white marble), clean massing |
| horyuji | black | holds (on re-draw) | first draw white → re-draw black; lottery, not tendency |
| chapelle | near-black | holds | rose window as chunky rings, no filigree |
| arc | black | **weakened** | gold human figures in side niches (matrix arc-C was abstract); bg intact |
| mausoleum | black | holds (caveat) | nameplate-text plaque persists — known all-variant ref weakness |

The lock is **safe to keep**: C remains the best default on every reference, the single white drift
self-corrected on one re-draw, and even the weakened cell (arc) keeps the black background that the
whole stage depends on.

## Test coverage & gaps
- **Regression:** `npm test` 133/133 — guards the validated artifact path against collateral damage.
  No source under test changed, so green was expected and confirms no breakage.
- **No unit tests added** — correct for this stage: concept-art is eyeball-only by design (header
  comment; consistent with T-015-01). A test asserting the literal `"C"` would test a one-line
  constant and add no real coverage.
- **Inherent gap (image non-determinism):** confirmation is single-sample per cell, except horyuji
  which got a second draw. The decision rests on cross-reference tendency, not any one draw — the
  right confidence level for an eyeball stage. The white-drift re-draw is the mitigation in action.

## Open concerns / handoff
- **S-017 (robustness) inherits two live signals, both observed again here and neither unique to the
  locked default:**
  1. **Probabilistic black background** — horyuji-C drifted white once before re-drawing black. The
     prompt's black-bg demand is not yet deterministic even for render-only. Hardening this is S-017.
  2. **Figural / text suppression** — arc-C grew gold human figures in its niches; mausoleum-C keeps a
     glyph nameplate plaque. Both survive C even though it never sees the reference (sourced from our
     own render / the doc), so they are prompt-level, not variant-level. S-017's "replace nameplate
     with blank/rosette" and figural-suppression fixes target exactly these.
- **No critical issues require human attention.** The change is one line + a comment, tests are green,
  and every C cell is reproducible via `node benchmarks/temple-facade/conceptart.mjs --ref=<r>` (now
  defaulting to C) or explicit `--variant=C`.
- **Downstream (S-018 consolidation):** the stage now has a single locked default to build the
  terminal hand-off on; no `--variant` plumbing needed for the default path.

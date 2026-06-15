# T-017-01 — Review

Handoff for a human reviewer. Goal: harden the stage-1 concept generator so every reference (default
variant C, Flash, 48 blocks) is both **cleanly segmentable** and **resolution-disciplined**, via
prompt tightening only. **Outcome: achieved — all 5 references pass both properties.**

## What changed

| file | change | committed? |
|------|--------|-----------|
| `baml_src/conceptart.baml` | `FacadeConceptPrompt` tightened in 3 clauses (figures, text, segmentation) over 2 iterations (+22/−8) | **yes** (33de8c8) |
| `docs/knowledge/design-learnings.md` | appended T-017-01 journal: round-0 + final audit tables, prompt diff, white-bg wording lesson, verdict | **yes** (33de8c8) |
| `baml_client/**` | regenerated via `npm run baml:gen` | no — **gitignored** (regenerable; the source-of-truth is `baml_src/`) |
| `benchmarks/temple-facade/concepts/*-C-flash.png` (×5) | regenerated; the acceptance evidence | no — **gitignored** (reproducible, local-only, image-heavy) |
| `docs/active/work/T-017-01/*` | RDSPI artifacts (research/design/structure/plan/progress/review) | tracked separately by Lisa |

No code/logic files changed: `conceptart.mjs`, `baml-concept.mts`, `nano-banana.mjs`, schema,
scripts, and the run-dir fixtures (`design-doc.md` / `render.png`) are all untouched. The default
variant (C), `TARGET_BLOCKS=48`, and the Flash model are all held constant per the ticket.

## Acceptance criteria — status

- [x] **All 5 references generated under default variant and VIEWed; per-reference segmentation +
      resolution recorded pass/fail.** Done — round-0 and final tables in the journal and design.md.
      Final: taj ✓✓, horyuji ✓✓, chapelle ✓✓, arc ✓✓, mausoleum ✓✓.
- [x] **Any failure fixed by a `FacadeConceptPrompt` tightening (diff committed, client regenerated),
      then re-confirmed across all 5.** Done — 3 leaks (arc figures, mausoleum glyph, chapelle
      dark-on-dark) closed; all 5 regenerated under the identical final prompt and re-viewed; none
      left failing.
- [x] **Journal entry: per-reference audit table, prompt diff(s), verdict.** Done (design-learnings.md).
- [x] **`npm test` green; concept images saved under `concepts/`.** 133/133 green; 5 PNGs present in
      `benchmarks/temple-facade/concepts/`.

## How the leaks were closed (root-cause, not per-reference)

- **arc — human figures in niches → gold sunburst rosettes.** The HARD LIMITS block now explicitly
  *overrides the design document* and routes any statuary niche to a blank/rosette panel. C never
  sees the reference photo, so the figures were invented from the doc's language — the override is
  the correct fix.
- **mausoleum — glyph nameplate → blank/geometric panel + rosette frieze.** Named the specific
  offender (nameplate/plaque/cartouche/tablet) and, after the glyph relocated into the frieze in
  iter-1, added a frieze clause ("plain color-blocking or rosettes ONLY, never glyph rows").
- **chapelle — dark-navy bg + blue-spire merge → pure-black bg + gold-framed edges.** Background
  clause hardened to forbid any non-black backdrop; outermost elements (spires/finials/pinnacles)
  required in a bright palette color so the top edge can't vanish into black.

## Test coverage & gaps

- **Regression gate:** `npm test` (133 tests) green — guards the untouched modules and the
  regenerated client imports. Unchanged from baseline.
- **No new unit tests** — by design. The deliverable is a generative-prompt wording change whose
  correctness is an image judgment ("eyeball-only", per the ticket). A string-assert on prompt text
  would be brittle and behaviorally meaningless. The acceptance test is the step-5 VIEW audit,
  recorded in the journal.
- **Gap (inherent, not closeable here):** there is no *automated* segmentation/resolution metric.
  Verification is human VIEW. If this stage is run at scale later, an automated check (e.g. bg-purity
  histogram + a small classifier for figures/text) would be the natural follow-on — out of scope.

## Open concerns / flags for human attention

1. **Generation non-determinism.** "Held" means the prompt no longer *invites* the leak and a fresh
   draw is clean — not a statistical guarantee. A future bad draw is possible (cf. the horyuji
   white-bg lottery in T-016-01). If a reference regresses on a later run, redraw before re-editing.
2. **Wording-trap recorded.** Naming "white" near the background clause caused a white-bg regression
   in iter-1 (chapelle + mausoleum). The fix is in place and documented; reviewers editing this
   prompt should keep "white/light" out of the background paragraph.
3. **Geometric medallion in the former-nameplate panel** (horyuji, mausoleum): a chunky concentric-
   square/maze emblem. Judged PASS — it is block-scale geometric ornament with no legible letters,
   i.e. exactly the intended "replace text with bold geometric ornament" behavior. Flagged so it is
   not mistaken for residual glyph text on review. If a stricter bar is wanted, route that panel to a
   plain rosette explicitly.
4. **Artifacts are gitignored.** The committed proof is the prompt diff + the journal tables; the
   PNGs live locally under `concepts/`. Anyone reproducing runs `npm run baml:gen` then
   `node benchmarks/temple-facade/conceptart.mjs` (no flags) to regenerate all 5.

## Verdict

Ticket complete. All 5 references cleanly segmentable + resolution-disciplined under the locked
default; prompt fix committed at root; client regenerated; tests green; journal records the evidence.
Hands off cleanly to S-018 (concept stage consolidation / stage-2 handoff).

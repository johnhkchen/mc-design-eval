# T-018-01 · Review — concept stage consolidation (terminal link)

Handoff for a human reviewer. **Goal:** distill the E-09 stage-1 concept-art chain (S-015 matrix →
S-016 lock → S-017 harden) into durable knowledge, confirm the locked prompt + default, and record the
stage-2 (TRELLIS) handoff. **This is synthesis, not a new experiment.** **Outcome: achieved.**

## What changed

| file | change | committed? |
|------|--------|-----------|
| `docs/knowledge/design-learnings.md` | appended one section — `## Stage-1 concept-art · CONSOLIDATION + stage-2 handoff (E-09, T-018-01 …)` (file 1049 → 1144 lines; heading at L1051) | working tree (Lisa/operator commits per chain convention) |
| `docs/active/work/T-018-01/*` | RDSPI artifacts (research/design/structure/plan/progress/review) | Lisa-tracked |

**No source, prompt, client, schema, rubric, brief, or image files were changed** — this is a
confirm-only synthesis. The deliverable is knowledge, not code.

## Locks confirmed (the substance of acceptance criterion 1)

- `baml_src/conceptart.baml` — working tree **clean** against commit **33de8c8** (T-017-01). Read this
  session; contains all three hardening clauses (HARD-LIMITS-override-the-doc, named text offenders +
  frieze clause, pure-black bg + bright outermost edges). This **is** the strong, locked version.
- `benchmarks/temple-facade/conceptart.mjs` — clean against **565f32f** (T-016-01); line 76
  `arg("variant", "C")`. Default matches the S-016 decision.
- `baml_client/**` regenerable via `npm run baml:gen` (gitignored; `baml_src/` is source-of-truth). No
  `baml:gen` run needed this ticket — no `baml_src` edit.

## Acceptance criteria — status

- [x] **`conceptart.baml` confirmed locked; default in `conceptart.mjs` matches S-016.** Confirmed
  clean + committed; default = C. No edit required.
- [x] **`design-learnings.md` gains a stage-1 concept-art section** distilling the chain — best variant
  (C) + structural rationale, the four voxel-ready criteria, the load-bearing prompt rules, and the
  residual caveats. Appended.
- [x] **One-paragraph stage-2 handoff recorded** — the "Handoff to stage 2 (TRELLIS)" paragraph states
  the concept output is isolated, cleanly-segmentable, resolution-disciplined, and faithful+colorful,
  i.e. directly TRELLIS-consumable.
- [x] **`npm test` green.** 133/133, run before and after the edit.

## The synthesis, in one breath (what a reviewer should take away)

C (render-only) is the locked default because feeding the model **our own controlled render instead of
the wild reference** makes the two photo-dependent failure modes — palette-copying and figural-relief-
copying — impossible by construction, and keeps the background reliably black (the matrix measured A
2/5 white · B 2/5 white · **C 0/5 white**). A voxel-ready concept = isolated + cleanly-segmentable
(pure-black bg, bright outer silhouette) + resolution-disciplined (block-scale only; HARD LIMITS
override the doc) + faithful & colorful. The prompt clauses that carry this are individually load-
bearing — the section tags each with the specific leak it closes so a future editor knows what not to
delete (including the "keep 'white' out of the background paragraph" wording trap).

## Test coverage & gaps

- **Regression gate:** `npm test` 133/133 green, before (baseline) and after (post-append) — guards
  against collateral damage. A markdown-only change cannot affect tests; re-run because the criterion
  is explicit.
- **No new tests — by design**, consistent with the entire stage-1 chain. Concept quality is an image
  judgment ("eyeball-only"); the deliverable here is a *journal section* whose acceptance test is human
  review. A string-assert on prompt text or on the literal default `"C"` would test a constant and add
  no behavioral coverage.
- **Inherent gap (carried, not introduced):** there is no automated segmentation/resolution metric;
  verification across the chain was human VIEW. If stage 1 runs at scale, a bg-purity histogram + a
  small figure/text classifier is the natural follow-on (out of scope).

## Open concerns / flags for human attention

1. **Generation non-determinism (carried forward).** "Locked/held" means the prompt no longer invites
   the leak and a fresh draw is clean — not a statistical guarantee. On any future regression, **redraw
   before re-editing** the prompt (horyuji's one-off white drift in T-016-01 self-corrected on a single
   re-draw).
2. **Concentric-square medallion in former-nameplate panels** (horyuji, mausoleum) is the *intended*
   geometric-ornament replacement for text — block-scale, no legible letters. Flagged so it is not
   mistaken for residual glyph text; route to a plain rosette if a stricter bar is wanted.
3. **No re-generation was done** (the ticket permitted at most one). Deliberate: the T-017-01 final
   audit already shows all 5 references PASS under the identical locked prompt; a fresh single draw
   would add non-determinism risk without adding confidence. The standing audit is the illustration.
4. **Artifacts gitignored.** The durable proof is the prompt diff (33de8c8) + the journal sections; the
   PNGs live locally under `concepts/`. Reproduce: `npm run baml:gen` then
   `node benchmarks/temple-facade/conceptart.mjs` (no flags → variant C).

## Verdict

Ticket complete. Stage 1 of the E-09 pipeline is **closed and documented**: locked prompt confirmed at
root, default confirmed = C, the chain distilled into a self-contained `design-learnings.md`
consolidation section, the stage-2 handoff contract stated, and `npm test` green (133/133). Hands off
cleanly to TRELLIS reconstruction (stage 2).

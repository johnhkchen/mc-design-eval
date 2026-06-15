# T-017-01 — Progress

## Done

- **Step 0 — Baseline.** `npm test` green (133/133). Round-0 audit of all 5 default-C images
  recorded (research.md): arc fails resolution (human figures), mausoleum fails resolution (glyph
  nameplate), chapelle fails segmentation (dark-navy bg + blue-spire dark-on-dark merge) + minor
  gable filigree; taj + horyuji pass both.
- **Step 1 — Prompt tighten (iter-1).** `baml_src/conceptart.baml`: figures clause (doc-override +
  blank/rosette niche replacement), text clause (nameplate/plaque/cartouche + blank/rosette),
  filigree clause (no spiked finials), segmentation clause (pure #000000 + light outermost edges).
- **Step 2 — `npm run baml:gen`** (14 files written).
- **Step 3 — Smoke (arc).** Discovered the orchestrator's arg parser needs the `=` form
  (`--ref=arc`, not `--ref arc` — the space form silently matches no reference). arc redrew with
  figures **gone** (niches → abstract gold ornament). Regen confirmed effective.
- **Step 4 — Full regen.** All 5 default-C concepts regenerated.
- **Step 5 — Audit (iter-1).** taj/horyuji/arc clean. **Regression found:** chapelle + mausoleum
  drew on a **white background**, and mausoleum relocated its glyph into the door frieze. Root cause:
  iter-1 segmentation wording listed "white, light stone" as edge-color examples adjacent to the
  background instruction — nudged a white backdrop.
- **Step 6 — Iterate (iter-2).** Removed "white" from edge examples; front-loaded an explicit
  "NEVER white/light/grey/navy" background ban; added a frieze clause ("plain color-blocking or
  rosettes ONLY — never glyph-like square characters or symbol panels"). `npm run baml:gen`.
  Regenerated chapelle + mausoleum → black bg restored, frieze glyphs gone, central panel now a
  chunky geometric medallion (not text). Regenerated taj + horyuji + arc under the **identical final
  prompt** so all 5 are on one prompt version.
- **Step 5' — Final audit.** All 5 pass BOTH segmentation and resolution (table in design-learnings
  journal). Exit condition met.
- **Step 7 — Regression gate.** `npm test` green (133/133).
- **Step 9 — Journal.** Appended the T-017-01 section to `docs/knowledge/design-learnings.md`:
  round-0 + final audit tables, the prompt diff, the white-bg wording-trap lesson, the verdict.

## Remaining

- **Step 8 — Commit** the prompt source + journal (`baml_client/` and `concepts/` are gitignored —
  regenerable/local-only by project convention; concepts saved locally satisfies the criterion).
- **Step 10 — review.md.**

## Deviations from plan

- **Arg-parser quirk (Step 3):** had to use `--ref=arc`; not a code change, just usage. Left
  `conceptart.mjs` untouched (out of this ticket's scope; the defaulted no-flag command — the one
  that matters — works correctly).
- **Two prompt iterations instead of one:** the first segmentation rewrite introduced a white-bg
  regression (documented). The fix was a wording correction, not a new mechanism. Net change is
  still confined to `FacadeConceptPrompt`.
- **No `conditional edit 4` needed as a separate step:** the filigree finial clause was folded into
  iter-1; chapelle's gable came back as a chunky stepped peak, so no further tightening required.

# T-040-01 — Review: palette-aware-concept

Handoff for a human reviewer. What changed, how it's tested, what to watch. Epic E-14 / story S-040 —
the **concept end**: make Nano Banana preview the *true block value* via the value-true swatch grid.

## Acceptance criteria — status

| AC | Requirement | Status |
|----|-------------|--------|
| AC1 | `.v2` exists beside untouched `.v1`; `baml:gen` regenerates cleanly | ✅ `SculptureConceptPromptV2` appended (diff = 58 insertions, 0 deletions; `.v1` byte-identical); `baml:gen` exit 0, fn present in `baml_client/` |
| AC2 | Real-block swatch grid attached as multimodal input; prompt instructs value-matching | ✅ `concept-ab.mjs` attaches `<subject>.swatch.png` via the `images` array; the `.v2` VALUE-TRUE block instructs matching to it. Live run: 1 image attached per call |
| AC3 | A/B recorded for ≥2 subjects (moai + organic), honesty note + cost | ✅ `a-b-note.md` — moai + pineapple, both favor `.v2`; segmentation/quality cost recorded |
| AC4 | Artifacts saved (both concepts + swatch grid); `npm test` green | ✅ 8 PNGs + 2 `ab.json`; `npm test` 348/348 |

## Files changed

**New (mine):**
- `src/color/palette-swatch.mjs` — pure card→swatch adapter (`cardToSwatchGrid`,
  `paletteSwatchLegend`, `buildPaletteSwatch`). Reuses E-10 `renderGridSwatch`; no new pixel logic;
  GL/network/model-free.
- `src/color/palette-swatch.test.mjs` — 14 tests, groups A–F.
- `benchmarks/sculpture/concept-ab.mjs` — live A/B runner (off the test glob).
- `docs/active/work/T-040-01/` — 6 RDSPI phase docs, `a-b-note.md`, 8 PNGs, 2 `ab.json`.

**Modified (mine):**
- `baml_src/conceptart.baml` — appended `SculptureConceptPromptV2` (`.v1` untouched).
- `benchmarks/sculpture/baml-concept.mts` — additive `variant:"v2"` branch (default path byte-identical).

**Not committed by me (left for their owners):** `baml_client/` (gitignored, regenerates on demand);
the concurrent T-041 thread's files (`value-match-*`, `artifact.value-matched.json`, etc.); ticket
frontmatter edits. Staging was audited before each commit.

## Design recap (why these choices)

- **`.v2` as a new BAML function, not an edit:** the frozen-prompt rule (E-13 reproducibility) is
  load-bearing; the same pattern as `FacadeConceptPrompt` vs `SculptureConceptPrompt`.
- **Both image *and* text:** the swatch grid grounds the model on true *pixels* (the point — names
  mislead); the text legend supplies the name↔value mapping the image can't label.
- **Pure module reusing `renderGridSwatch`:** keeps the card→grid adapter unit-tested and off the live
  path; `image-grid.mjs` stays cohesive (image→grid), `palette-swatch.mjs` is palette→grid.

## Test coverage

- **Unit (offline, on the `src/**/*.test.mjs` glob):** `palette-swatch.test.mjs` covers layout
  (cols/rows/null-fill), color fidelity (legend rgb + a sampled rendered pixel), legend text
  (name/block/hex/L\*, ΔE only when snapped), determinism, validation (empty/malformed/bad-cols), and
  the **resolver round-trip** (`resolveValueTruePalette` → dark block → dark pixel). 14/14.
- **Full suite:** 348/348; `reuse-boundary.test.mjs` green (`cielab.mjs` untouched).
- **Gaps (intentional):** the live seam — `baml-concept.mts` `.v2` branch and `concept-ab.mjs` — is
  exercised by the live run, not unit tests (it touches `tsx` + Nano Banana). The `.v2` BAML *render*
  could get a lightweight assertion (render the prompt, assert the swatch legend interpolates) but is
  not currently covered; see Open concerns.

## A/B result (the substance)

Both subjects: `.v2` previewed the truer, **lower/more-muted** value than `.v1`.
- **moai** — `.v1` light-mid gray body; `.v2` dark slate matching `gray_concrete` **L\*24.3**, deep
  maroon pukao matching `red_nether_bricks` **L\*12.4**. The single biggest E-13 value-drift fixed.
- **pineapple** — `.v1` candy-bright yellow; `.v2` muted amber matching `hay_block` **L\*57.9**, with
  rust `orange_terracotta` (L\*44.5) in the grooves and a bright-tip/dark-base crown.

Segmentation held (darker values kept off the outline, as instructed); no form/quality regression.

## Open concerns / TODO

1. **Bright-silhouette vs value-honesty conflict (the one to watch).** `.v2` keeps `.v1`'s "outer
   silhouette in bright palette colors" rule *and* tells the model to honor true (often dark) values.
   For these two palettes a light-enough block existed to carry the edge, so no conflict bit. For an
   **all-dark palette** the two directives pull apart — the model must either darken the outline (risk
   merging into black, breaking segmentation) or disobey value-honesty on the edge. **S-042's ΔE gate
   should flag this case.** Documented in `a-b-note.md`.
2. **Palette source is the build `artifact.json`, not concept-time prose.** For this A/B the
   value-true card came from the run's committed manifest (clean, deterministic). In a true forward
   loop the concept precedes the artifact, so S-042 must decide how the proposed palette is extracted
   from the design doc (parse the prose §3, or have stage-1 emit a structured manifest). Noted in
   research.md / a-b-note.md.
3. **`pngjs` can't re-decode Nano Banana PNGs** ("unrecognised content at end of stream"). Harmless
   here (we only write swatches and copy concepts; the Read tool renders them fine), but any future
   code that needs to *decode* a concept PNG must use the project's `decodeImage` (sharp/jimp path),
   not `PNG.sync.read`.
4. **`.v2` is single-rater, n=2, qualitative.** The honesty verdict is a visual read, not a measured
   ΔE(concept-pixel → true-block). S-042 could quantify it by sampling `.v2` body pixels and computing
   ΔE to the swatch — turning "looks darker" into a number. Out of scope for S-040.
5. **Cost:** each `.v2` is a metered PRO image call. Fine for A/B; if S-042 runs `.v2` on every loop
   iteration, budget accordingly (or drop to flash and re-validate value fidelity).

## Critical issues for human attention

None blocking. The frozen `.v1` is provably untouched, `npm test` is green, and the A/B substantiates
the story hypothesis. The one judgment call worth a human glance is **concern #1** — whether the
co-design loop should relax the bright-silhouette rule when value-honesty demands a dark outline. That
is an S-042 design decision, surfaced here so it isn't discovered late.

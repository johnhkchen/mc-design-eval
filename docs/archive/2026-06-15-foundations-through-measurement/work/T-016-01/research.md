# T-016-01 · Research — lock default concept variant

Descriptive map of what exists and how it connects. No solutions proposed here.

## The ticket in one line
T-015-01 ran the input-variant matrix and chose **C (render only)** as the best stage-1 concept
input. T-016-01 makes C the *committed default* of the concept-art stage (the variant used when
`--variant` is omitted), then regenerates C for all 5 references and views them to confirm no
regression vs the S-015 matrix.

## Upstream decision (the prior this ticket inherits)
`docs/active/work/T-015-01/{review.md,progress.md}` and the journal section
`## Stage-1 concept-art · input-variant matrix (E-09, T-015-01) · 2026-06-05` in
`docs/knowledge/design-learnings.md` record the decision:
- **Default = C (render only).** C was the only variant black-background in **5/5** cells
  (segmentation depends on the black background — it feeds TRELLIS downstream). A failed to white on
  2/5 (taj, horyuji) and copied references literally (taj white marble dome; arc human figures). B
  failed to white on 2/5 (chapelle, arc) and pulled in filigree/text.
- C's palette is doc-correct in every cell because it refines our own doc-grounded prismarine render,
  and it cannot copy a reference it never sees.
- The matrix is the **baseline** this ticket's regeneration must not regress against.

## The file that changes: `benchmarks/temple-facade/conceptart.mjs`
The stage-1 series orchestrator (~87 lines). Relevant facts:
- **Default variant lives on one line:** `const variant = arg("variant", "A");` (line 71). The
  default string `"A"` is the only thing that determines behavior when `--variant` is omitted. This
  is the single line the ticket asks to flip to `"C"`.
- Variants are defined in the `VARIANTS` map (lines 50–55):
  - `A = (r) => ({ images: [r.ref], attached: REF_ONLY })` — reference photo only
  - `B = (r) => ({ images: [r.ref, renderPath(r.run)], attached: REF_PLUS_RENDER })` — both
  - `C = (r) => ({ images: [renderPath(r.run)], attached: RENDER_ONLY })` — our render only
  - `base = () => ({ images: [], attached: NONE })` — design-doc only
- `arg(k, d)` (line 69) supports `--variant=C` and `--variant C` forms; default `d` returned when the
  flag is absent. So flipping the default does not affect explicit `--variant=A/B/base` callers.
- `TARGET_BLOCKS = 48` (line 23) is held constant — the ticket reaffirms "Resolution constant (48)".
- `model` defaults to `flash` unless `--pro` is passed (line 70) — ticket says Flash.
- Output path: `concepts/<ref>-<variant>-<model>.png` (line 78). So C/flash cells write to
  `concepts/<ref>-C-flash.png` for all five refs — **the same filenames T-015-01 already produced**;
  regenerating overwrites them in place (image generation is non-deterministic, so the bytes differ).
- The five references and their champion-era runs (lines 26–32):
  `taj→015, horyuji→019, chapelle→020, arc→021, mausoleum→022`. Each contributes a design-doc and a
  prismarine render that C consumes.

## Generation mechanics
- `conceptart.mjs` spawns `npx tsx baml-concept.mts` per cell, piping a JSON job on stdin and parsing
  a one-line JSON result on stdout (`runCell`, lines 57–66).
- `baml-concept.mts` (45 lines): reads the design doc, has BAML render the `FacadeConceptPrompt`
  request to extract the composed **prompt text** (BAML's `b.parse` is never called — image output is
  not a BAML parse target), attaches the image(s) as multimodal inputs, and calls
  `generateImage(...)` from `src/nano-banana.mjs`. Writes the PNG to `outPath`.
- For variant **C**, the attached image is only `renderPath(r.run)` — our own render — so no
  reference photo is ever sent. This is the structural reason C can't copy the reference or inherit
  its background.

## Dependencies that must exist for C to run (verified present)
For each ref the C cell reads `runs/<run>-vRefRevise-designdoc/{design-doc.md,render.png}`:
- 015 (taj), 019 (horyuji), 020 (chapelle), 021 (arc), 022 (mausoleum) — **all five design-doc.md and
  render.png confirmed present** on disk. C is runnable for all five.
- `concepts/` already holds the T-015-01 outputs including `*-C-flash.png` for all five refs.

## Credentials / env
- `.env` is present and contains `GEMINI_API_KEY` and `MODAL_ENDPOINT_URL`. Per prior session note,
  `src/nano-banana.mjs` reads the key directly from `.env` (not the shell environment). The matrix in
  T-015-01 ran successfully against this same `.env`, so the path is known-good.
- BAML rendering only needs a placeholder `ANTHROPIC_API_KEY` (set in-process by `baml-concept.mts`
  if absent) because the rendered request is never actually sent to Anthropic — only its text is
  extracted.

## Test surface
- `npm test` = `validate-artifact --self-test` (valid example) + `validate-artifact` (invalid example)
  + `npm run test:unit` (`node --test "src/**/*.test.mjs"`). T-015-01 reported **133/133** green.
- The concept-art stage is **not under test** — it is an eyeball-only stage (stated in the
  `conceptart.mjs` header comment and in `task.mjs`/README). There is no unit test that touches
  `conceptart.mjs`, `baml-concept.mts`, or `src/nano-banana.mjs`. Flipping the default string cannot
  break the suite; the test run is a regression guard against collateral damage only.

## Constraints / assumptions surfaced
- **Eyeball-only confirmation.** The acceptance criterion "viewed for all 5 references … no
  regression" is a visual judgement against three stage-1 targets: fidelity (doc palette + massing),
  inspiration-not-blueprint, and resolution-fit (cleanly segmentable on a black background). There is
  no automated metric.
- **Non-determinism.** Regenerated C images will not be byte-identical to T-015-01's. The regression
  bar is *tendency*, not pixel match — specifically, C should stay black-background and doc-palette in
  all five, consistent with the matrix's 5/5 black observation. If a regenerated C drifts to white,
  that is the documented signal to revisit (per T-015-01 review).
- **Single source of behavior.** Because `arg("variant", …)` is the only place the default is read,
  there is no risk of a second stale default elsewhere. (Confirmed: `"A"` appears once as a default.)
- **No prompt/source-of-truth change.** The BAML prompt (`baml_src/conceptart.baml`), the client
  (`baml_client/**`), and `nano-banana.mjs` are untouched — the ticket is a default flip plus a
  confirmation run, not a prompt change (those weaknesses are S-017's scope).
- **Out of scope:** the three prompt weaknesses logged for S-017 (black-bg override under a reference
  photo; weak no-text clause; figural-relief copying) — none of which affect C, since C sees no
  reference photo. This ticket does not attempt to fix them.

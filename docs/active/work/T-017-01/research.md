# T-017-01 — Research

Epic E-09 / story S-017. Harden two pipeline-critical properties of the stage-1 concept-art
generator across all 5 references: **segmentation** (cleanly isolable subject) and **resolution
discipline** (no sub-block figures / text / filigree). This phase maps what exists; it proposes
nothing.

## The stage-1 concept pipeline (what it is, where it lives)

The concept stage turns a finalized design doc + our own prismarine render into a clean,
voxelizable concept image (Nano Banana / Gemini), to be fed to TRELLIS in stage 2. Three files
carry it:

1. **`baml_src/conceptart.baml`** — `FacadeConceptPrompt(design_doc, target_blocks, attached)`.
   BAML owns the versioned *text* prompt. `client ClaudeStub` only shapes `.request`; `b.parse`
   is never called (image output isn't a BAML parse target). This is the **single file this
   ticket edits**: any robustness fix is a wording change here, followed by `npm run baml:gen`.
   - Current prompt already asserts (a) single isolated subject on solid **black `#000000`**, no
     ground/shadow/surroundings, centered + fully visible, studio lighting; (b) Minecraft block
     style, ~`target_blocks` wide, "block-scale detail ONLY"; (c) **HARD LIMITS**: no human/animal
     figures, no relief scenes/statues, no text/letters/numerals/calligraphy/inscriptions, no
     filigree/tracery/lacework/sub-block ornament — "replace with BOLD GEOMETRIC block ornament";
     (d) palette fidelity to the doc; (e) a segmentation clause: keep the OUTER SILHOUETTE in
     lighter palette colors, do NOT place black/near-black blocks along the outline (they merge
     with the bg), reserve dark tones for recessed interior areas.

2. **`benchmarks/temple-facade/baml-concept.mts`** — one-cell worker (run via `tsx`). Reads a JSON
   job on stdin `{ designDocPath, images[], targetBlocks, model, outPath, attached }`, renders the
   BAML request, extracts the composed prompt text, attaches reference image(s) as multimodal
   inputs, calls `generateImage`, writes the PNG to `outPath`. No prompt logic lives here.

3. **`benchmarks/temple-facade/conceptart.mjs`** — series orchestrator. Per reference × variant it
   spawns the worker. **Default variant is `C` (render-only)**, locked by T-016-01. `TARGET_BLOCKS
   = 48` is held constant (resolution is NOT the variable). `--ref`, `--variant`, `--pro` flags.
   - Variants: A = [reference], B = [reference, ourRender], C = [ourRender] (default), base = [].
   - The 5 references with their champion-era runs: `taj`(015), `horyuji`(019), `chapelle`(020),
     `arc`(021), `mausoleum`(022). Each run dir holds `design-doc.md` + `render.png` — both confirmed
     present for all 5.

4. **`src/nano-banana.mjs`** — Gemini transport. `generateImage({prompt, images, model, retries=2})`
   → `{base64, mediaType, ms, model}`. `NANO_BANANA_FLASH = "gemini-3.1-flash-image-preview"` (this
   ticket's model). Key from `GEMINI_API_KEY` (env or `.env`; confirmed present). Retries on
   5xx/429 only. Generation is metered (~pennies/image) — fine.

Outputs land at `benchmarks/temple-facade/concepts/<ref>-<variant>-flash.png`. The C-variant images
from T-016-01 are present for all 5 and serve as the round-0 audit baseline.

## Why C is the locked default (inherited constraint)

T-015-01 matrix + T-016-01 lock: C is the only variant that reliably yields a black background
(segmentable) and, seeing only our own doc-grounded render, cannot copy a reference photo or its
palette. **This ticket does not reopen the variant choice** — it hardens the prompt under C.

## Round-0 audit (all 5 default-C images viewed)

| ref       | segmentation                                              | resolution discipline                          |
|-----------|----------------------------------------------------------|------------------------------------------------|
| taj       | PASS — pure black, crisp orange/gold silhouette          | PASS — bold color-blocking, no text/figures     |
| horyuji   | PASS — pure black, crisp red silhouette                  | PASS — bold; gold bar panel reads abstract      |
| chapelle  | **FAIL** — bg is dark *navy*, blue spires/pinnacles merge | borderline — small star/finial filigree on gable|
| arc       | PASS — pure black, crisp                                  | **FAIL** — gold human figures in both niches    |
| mausoleum | PASS — pure black, crisp white                           | **FAIL** — gold glyph nameplate above arch      |

Three concrete leaks, all already predicted by the T-015-01 / T-016-01 journals as S-017's
inheritance:

- **Figural relief survives "no figures"** even though C never sees the reference photo (arc) —
  the figures are being invented from the doc's niche/statuary language.
- **Nameplate / inscription survives "no text"** for buildings with a signature inscription
  (mausoleum; previously taj-base calligraphy). The journal's recommended fix is explicit:
  replace any nameplate/inscription/calligraphy with a blank or rosette panel.
- **Dark-on-dark merge** (chapelle): the bg rendered as dark navy rather than `#000000`, and the
  blue pinnacles at the extreme silhouette edge are a dark/medium tone — exactly the case the
  ticket calls out ("dark-blue outer edge against a black background"). The existing segmentation
  clause forbids *black* on the outline but not a *dim saturated* tone, and doesn't forbid a
  *tinted* background.

## Constraints & assumptions

- **Eyeball-only.** Pass/fail is a human-style VIEW of each PNG (Read it). No automated metric.
- **Generation is non-deterministic.** The horyuji white-bg drift in T-016-01 redrew black on one
  retry — a single bad draw is a lottery, not necessarily a tendency. Re-confirmation may need a
  redraw; a *persistent* failure across draws is what indicts the prompt.
- **Background color is mooted by stage-2 rembg** — the bar is "cleanly isolable," not a specific
  color. But an *ambiguous silhouette* (dark-on-dark) defeats rembg, so chapelle is a real failure.
- **Only `conceptart.baml` may change.** Editing the prompt requires `npm run baml:gen` to refresh
  `baml_client/`. `npm test` must stay green (it does not exercise the BAML prompt text; baseline
  run in flight).
- **Palette fidelity must survive the fix.** Any segmentation-edge wording must not force a recolor
  that violates the doc's palette (design-learnings: craft vs. color must stay separated).

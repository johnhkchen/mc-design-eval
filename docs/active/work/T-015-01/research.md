# T-015-01 · Research — concept-input-variant matrix

Epic E-09 / Story S-015. First run-the-test of the stage-1 concept-art chain. This is a
**comparison/experiment ticket**, not a code change: generate concept-art images across input
variants for five references, view each, and pick the strongest INPUT VARIANT for the Nano Banana
concept stage. Resolution is held constant at 48 blocks (NOT the variable).

## What exists, where

### Orchestrator — `benchmarks/temple-facade/conceptart.mjs`
The series driver. For each `reference × variant` it spawns `baml-concept.mts` (via `npx tsx`) and
writes `concepts/<ref>-<variant>-<model>.png`. Key facts:
- `TARGET_BLOCKS = 48`, hard-coded constant (line 23). Held fixed — confirms the ticket's framing.
- `REFS` (lines 26–32): five references, each mapped to a champion-era `vRefRevise` run that supplies
  both its design doc and its prior prismarine render:
  - `taj` → run 015, `horyuji` → 019, `chapelle` → 020, `arc` → 021, `mausoleum` → 022.
- `docPath(run)` → `runs/<run>-vRefRevise-designdoc/design-doc.md`;
  `renderPath(run)` → `runs/<run>-vRefRevise-designdoc/render.png`. Both confirmed present on disk for
  all five runs.
- `VARIANTS` (lines 50–55) — what is attached to Nano Banana, plus a variant-specific instruction
  string (`attached`) injected into the BAML prompt tail:
  - **A** = `[ref]` + REF_ONLY — reference photo as inspiration only (fresh generation).
  - **B** = `[ref, ourRender]` + REF_PLUS_RENDER — everything: reference for inspiration **and** our
    render to refine.
  - **C** = `[ourRender]` + RENDER_ONLY — upscale: refine our blocky render into a clean concept.
  - **base** = `[]` + NONE — design-doc only, no image (control).
- CLI: `--variant=A|B|C|base` (default A), `--ref=<name>` (default: all), `--pro` (else flash).
  Output filename encodes ref/variant/model, so reruns of the same cell overwrite in place.
- Failure is per-cell and non-fatal: a thrown cell prints `FAILED:` and the loop continues.

### Concept cell — `benchmarks/temple-facade/baml-concept.mts`
Reads a JSON job on stdin `{ designDocPath, images[], targetBlocks, model, outPath, attached }`.
- BAML renders the prompt TEXT only (`b.request.FacadeConceptPrompt(doc, targetBlocks, attached)`,
  line 25); `b.parse` is never called. ANTHROPIC_API_KEY is stubbed to `"baml-render-only"` (line 24)
  because BAML needs *a* key to render even though the request is never sent to Claude.
- The prompt text is extracted from the rendered request body (lines 26–30), images are base64'd with
  MIME inferred from extension (`.jpg/.jpeg`→jpeg, `.webp`→webp, else png; lines 32–36), and the real
  call is `generateImage()` → Nano Banana / Gemini. Output written to `outPath`; a JSON result record
  (`ms`, `model`, `mediaType`, `promptChars`, `imageCount`) is emitted on stdout.

### Image client — `src/nano-banana.mjs`
- `NANO_BANANA_PRO = "gemini-3-pro-image-preview"`, `NANO_BANANA_FLASH = "gemini-3.1-flash-image-preview"`.
- `generateImage({ prompt, images, model, retries=2 })` → Gemini `v1beta` generateContent; returns
  `{ base64, mediaType, ms, model }`.
- **Auth**: reads `GEMINI_API_KEY` from `process.env` first, else parses the gitignored `.env`
  (lines 14–20). `.env` on disk contains `GEMINI_API_KEY` + `MODAL_ENDPOINT_URL`. The shell env does
  NOT have the key set — generation depends on the `.env` fallback. Verified `.env` present.

### Prompt — `baml_src/conceptart.baml` → `FacadeConceptPrompt`
The versioned concept prompt. Salient instructions (relevant to S-017 hand-off):
- Head-on FRONT ELEVATION, single isolated structure on solid **black (#000000)** background, no ground
  plane / shadow / sky / surroundings → for clean segmentation.
- Centered, fully visible with margin, bright even studio lighting.
- Minecraft block style, ~`{{target_blocks}}` blocks wide, block-scale detail only.
- HARD LIMITS: no figures/animals/statues, no text/letters/calligraphy/inscriptions, no
  filigree/tracery/lacework/sub-block ornament. Replace with bold geometric block ornament.
- Realize THIS design doc — massing, proportion, motifs, and above all PALETTE (named colors; colorful,
  never white/monochrome).
- Keep OUTER SILHOUETTE in lighter palette colors; do NOT place black/near-block along the outline
  (they merge with the background and break segmentation); reserve dark tones for recessed interiors.
- `{{ design_doc }}` then `{{ attached }}` (the variant string) appended last.
- `baml_client/` is generated and present; `FacadeConceptPrompt` is wired in. After any prompt edit,
  `npm run baml:gen` is required — but this ticket makes no prompt change.

### Design doc shape (example: `runs/015-vRefRevise-designdoc/design-doc.md`, Taj)
"Temple of the Lapis Meridian" — Indo-Persian. Palette is a deliberate **amber↔azure complementary**:
Red Sandstone (dominant), Blue Glazed Terracotta (support), Gold Block (accent), Dark Prismarine (jade
note) — explicitly refuses the reference's white marble. Massing: chamfered cube, central pointed-arch
iwan ≈ ½ facade width, onion dome whose belly overhangs its drum, four chattris. This is the fidelity
target the concept must hit: the doc's colorful palette and massing, NOT the reference's white stone.

## Current state of `concepts/` (prior work)
```
arc-A-flash.png        chapelle-A-flash.png   chapelle-C-flash.png
horyuji-A-flash.png    mausoleum-A-flash.png  taj-A-flash-seg.png
taj-A-flash.png        taj-C-flash.png
```
- **Variant A exists for all 5 references** (flash). Re-usable per the ticket.
- Variant **C** already exists for `taj` and `chapelle` only.
- `taj-A-flash-seg.png` is a segmentation-overlay artifact from prior exploration (not a variant cell).
- **Missing for the matrix**: B for all 5; C for `horyuji`, `arc`, `mausoleum`; base for ≥2 refs.

## The three stage-1 assessment targets (from the ticket)
1. **Fidelity** to the design doc's palette / massing / style (NOT the reference's colors).
2. **Reference as inspiration, not blueprint** — borrows proportion/rhythm/character, doesn't copy.
3. **Detail within 48-block resolution** — no sub-block figures, text, or filigree; bold block ornament.
Evaluation is **eyeball-only**: each PNG is Read (viewed) and judged. Generation is metered (~pennies/
image) and explicitly fine.

## Relevant prior learnings (memory + design-learnings.md)
- `docs/knowledge/design-learnings.md` (894 lines) holds the attempt log; newest section is the
  S-006…S-009 consolidation (line 832). This ticket appends a new **stage-1 concept-art** section.
- Memory: *Reference grounds craft not color* — a grounding image steals the brief's palette unless
  craft (from ref) and color (from brief) are split; directly relevant to scoring B/C, which attach
  our render (palette-correct) and/or the reference (palette-wrong).
- Memory: *3-D reference vs flat facade* — the vRefRevise 2nd pass can detach masses; round-0 sometimes
  beats it. The renders feeding B/C are these vRefRevise champion renders.
- Memory: *Onion dome & bay framing* and *Facade recess by exclusion* — concrete massing failure modes
  to watch for when judging dome/relief fidelity.

## Constraints & assumptions
- **No source/prompt change required.** This is a comparison. If a change is made, record the diff;
  `npm test` (validate self-test + invalid check + `test:unit`) must stay green. Nothing in this ticket
  touches schema/validation code, so test risk is low.
- Generation requires the `.env` `GEMINI_API_KEY` (no shell env). Model = flash (default) is sufficient;
  A-flash precedents are all flash, so matrix stays flash for apples-to-apples.
- The `attached` string is the ONLY thing that differs between variants besides the image set — so the
  comparison isolates "what images + which instruction" cleanly.
- Output filenames overwrite deterministically; regenerating A is safe and reproducible.
- Expected outcome (ticket's hypothesis): **C** wins (most voxel-honest, palette-correct because it
  refines our own render) — but decide on the evidence after viewing.

# T-040-01 — Research: palette-aware-concept

Epic E-14 / story S-040, the **concept end** of the co-design loop. Map the code that generates a
sculpture concept image so we can make Nano Banana preview the *true block value*, not an imagined hue.
Descriptive only — no solutions here.

## The problem this ticket closes

`[[concept-image-not-color-value-preview]]`: Nano Banana's concept previews block **hue** but not
**value (L\*)**. A design doc *names* `gray_concrete`; the concept shows a mid/light gray; only the
render exposes the block's true value. Measured on the live E-13 manifests:

- moai (`001-vConcept-moai`): `gray_concrete` is **L\*24.3** (`#373a3e`) — markedly *dark*, yet
  concept art tends to render "gray concrete" as a far lighter stone. `red_nether_bricks` is L\*12.4.
- pineapple (`013-vConcept-a-pineapple`): `honey_block` is absent from the table and snaps to
  `hay_block` (L\*57.9); `green_concrete` is L\*36 (dark).

So the surprise the render later exposes is a **value** surprise. T-039-01 already pinned name→true
value; this ticket feeds that truth back into the concept stage.

## The concept generation path (what exists, end to end)

The sculpture concept is **stage 2** of the three-stage `vConcept` chain in
`benchmarks/sculpture/run.mjs` (`runVConcept`, lines 62–113):

1. **Stage 1 — design doc** (text, `requestText`) → `design-doc.md`. Names a palette in prose
   ("§3. Color palette: Dominant Gray Concrete; Supporting Andesite, Cobblestone Stairs; Accent Red
   Nether Bricks").
2. **Stage 2 — concept image** (`runBamlConcept`, lines 82–91) → `concept.png`. Shells out to
   `benchmarks/sculpture/baml-concept.mts` via `npx tsx`, passing a JSON job on stdin:
   `{ designDocPath, images:[], targetBlocks:scale, model:"pro", outPath }`.
3. **Stage 3 — 3-D build** (`requestDesignArtifactWithImage`) grounded on the single concept view.

### `baml-concept.mts` — the concept transport (the seam to extend)

`benchmarks/sculpture/baml-concept.mts` (48 lines) is the only place the concept prompt is rendered
and sent:

- `b.request.SculptureConceptPrompt(designDoc, targetBlocks, attached)` **renders** the prompt text
  (BAML's `.request`; `b.parse` is never called — image output isn't a BAML parse target). The text
  is pulled out of `req.body.json().messages` by filtering `type:"text"` parts and joining.
- Reference images in `images:[paths]` are read to base64 and passed to `generateImage`. For
  sculpture, `images` is normally `[]` (doc-only concept).
- `generateImage({ prompt, images, model })` (from `src/nano-banana.mjs`) calls Nano Banana / Gemini
  and writes the returned image to `outPath`.

This file is the natural attach point: it already reads images → base64 and already renders a BAML
concept fn. Adding a `.v2` branch here is additive.

### `src/nano-banana.mjs` — the image transport (unchanged)

`generateImage({ prompt, images=[], model=NANO_BANANA_PRO, retries=2 })` builds
`parts = [...images.map(inlineData), {text:prompt}]` and POSTs to Gemini
`:generateContent` with `responseModalities:["IMAGE"]`. **Multiple images are already supported** —
`images` is an array, each becomes an `inlineData` part. So attaching a swatch grid is "add one more
entry to `images`", no client change. Reads `GEMINI_API_KEY` from env or `.env` (present locally).

### `baml_src/conceptart.baml` — the prompt (the frozen .v1)

Two sibling functions, kept separate so each stays reproducible:
- `FacadeConceptPrompt(design_doc, target_blocks, attached)` — E-09 facade, frozen.
- `SculptureConceptPrompt(design_doc, target_blocks, attached)` — E-13 sculpture, **the .v1 to
  freeze**. Frames a freestanding 3/4 object on black. Its palette instruction (lines 84–91) says
  "use its actual named colors; commit to dominant/supporting/accent hierarchy" — i.e. it asks the
  model to *imagine* the named colors. Nothing pins it to the blocks' true rendered value.

The repo convention (from `FacadeConceptPrompt` vs `SculptureConceptPrompt`, and the ticket) is:
**clone the frozen prompt into a new sibling, never edit it.** `baml:gen` (`baml-cli generate
--from baml_src`, v0.222.0 installed) regenerates `baml_client/` from these `.baml` sources.

## T-039-01's output — the contract we consume

`src/color/value-palette.mjs` exports `resolveValueTruePalette(input, opts)`:
- Accepts `string[]`, `{manifest}`, **or a DesignArtifact with `palette.manifest`** — so the live
  `artifact.json` (`{palette:{manifest:[...]}}`) is a direct input.
- Returns `{ schema:"value-true-palette/v1", card:[{name, block, hex, rgb, lab, value, snapped,
  deltaE}], manifest, snappedCount }`.
- Verified live on both A/B subjects (see numbers above). `card[].hex`/`rgb` are exactly what a swatch
  grid needs; `card[].value` (L\*) and `name`/`snapped` are exactly what a value-legend needs.

Also exported: `hexToRgb`. The card was *designed for S-040's swatch grid* (T-039-01 design.md
Decision 3).

## E-10 swatch rendering — what to reuse

`src/color/image-grid.mjs` is the E-10 image→grid module. The relevant pure primitive:

- **`renderGridSwatch(result, {cell=12})`** (lines 217–243): takes a *GridResult* shape
  (`{grid, n, m, legend:[{block,rgb}]}`) and paints each filled cell as a `cell×cell` solid block of
  its matched block's table color; air (null) cells stay transparent. Pure — returns
  `{width, height, data:Uint8ClampedArray}` RGBA. **No encode dep.**
- It keys color off `result.legend` (`Map(legend.map(l=>[l.block,l.rgb]))`), and lays out by
  `result.grid` / `result.n` / `result.m`. So any object with those four fields renders — it does
  **not** require a real image-derived grid. A *synthetic* GridResult built from the value-true card
  (one cell per block, color from `card[].rgb`) will render a clean palette swatch grid.

PNG encoding pattern (from `scripts/image-to-grid.mjs`, lines 74–79): lazy `import("pngjs")`, wrap the
RGBA buffer in a `PNG`, `PNG.sync.write`. devDep, off the core path.

## The A/B subjects (live data already on disk)

Each `benchmarks/sculpture/runs/NNN-*/` holds `artifact.json` (`palette.manifest`), `design-doc.md`,
and the **`.v1` `concept.png`** generated with `model:"pro"`. For the AC's "moai + one organic":
- **moai** — `001-vConcept-moai` (5-block manifest, 1 snap).
- **organic** — `013-vConcept-a-pineapple` (4-block manifest, 1 snap: `honey_block`→`hay_block`).

The existing `concept.png` is the `.v1` arm; a freshly generated `.v2` concept (same pro model, same
design doc, + swatch grid + value instruction) is the experimental arm. A fair A/B requires the same
Nano Banana model — `pro` — for both.

## Constraints & assumptions

- **Frozen-prompt rule (load-bearing):** `SculptureConceptPrompt` must not change one character, or
  E-13 `.v1` runs stop reproducing. The new variant is a *new function*; `git diff` must read as an
  addition.
- **`baml:gen` must stay clean** — the new fn must parse and regenerate `baml_client/`.
- **Test path is pure-only:** `npm test` runs `node --test "src/**/*.test.mjs"` plus artifact
  validation. Any new `src/` code must stay GL/network/model-free to be unit-testable; the live Nano
  Banana A/B is a benchmark script, not a unit test.
- **Multimodal value-match is a prompt-level instruction**, not enforced — the model may still
  drift; the A/B measures *whether* it helps, and at what segmentation/quality cost.
- **Palette source for the concept:** at true concept time the palette is in the design-doc prose,
  not yet an artifact. For this A/B the cleanest, deterministic palette source is the run's
  `artifact.json` manifest (the blocks the model committed to) fed through `resolveValueTruePalette`.
  This is a defensible stand-in and must be documented in the A/B note.

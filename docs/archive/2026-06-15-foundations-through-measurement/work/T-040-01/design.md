# T-040-01 — Design: palette-aware-concept

Decisions for the `.v2` palette-aware concept, grounded in Research. Three moving parts: a new BAML
prompt variant, a pure card→swatch-grid module, and an A/B runner. The frozen `.v1` prompt is never
touched.

## What we are deciding

1. The shape of the `.v2` BAML function (signature, what it adds over `.v1`).
2. How the value-true swatch grid image is produced and where that code lives.
3. How the swatch is attached + how the A/B is run and recorded.

## Decision 1 — `.v2` is a new sibling BAML function, not an edit

Add `SculptureConceptPromptV2(design_doc, target_blocks, palette_swatches, attached)` beside the
untouched `SculptureConceptPrompt`. BAML has no dotted method versioning; "`.v2` variant" = a new
named function (the same pattern as `FacadeConceptPrompt` vs `SculptureConceptPrompt`). `git diff`
then reads as a pure addition and `baml:gen` regenerates `baml_client/` with both fns.

**Signature:** clone `.v1`'s `(design_doc, target_blocks, attached)` and insert one param,
`palette_swatches: string` — the value-true legend rendered as text (per-block: requested name →
real block → hex → **L\* value** → snapped?). The image swatch grid is attached out-of-band through
the existing `images` array (Research: `generateImage` already takes N images), so it needs **no new
BAML param** — BAML only renders text.

**Body delta over .v1:** keep every `.v1` instruction (3/4 freestanding object, black background,
segmentation rules, voxel hard-limits) verbatim, and *insert one value-honesty block*:

> An exact **SWATCH GRID of the real Minecraft blocks** for this build is attached. Each swatch is
> the block's **true in-render color and value** — frequently **darker** than the block's name
> suggests. Match the object's surfaces to these *real swatch values*, not to an imagined or
> idealized hue. Where the design doc names a block, use the swatch's value for that block. The
> legend below maps each named block to its true value (L\* 0–100):
> `{{ palette_swatches }}`

This directly attacks the value-drift in `[[concept-image-not-color-value-preview]]`: the model now
sees the true (often dark) values both as pixels (the grid) and as numbers (the legend).

*Rejected — edit `.v1` in place / add an optional param to `.v1`:* breaks the frozen-prompt rule;
E-13 reproductions would change. Non-starter (Research constraint).

*Rejected — encode the palette as text only (no image):* the whole insight is that *names* mislead
and only the *rendered pixel* tells the truth. A text-only "L\*24" is weaker grounding for an image
model than the actual dark swatch. We attach **both** — image for perceptual grounding, text for the
name↔value mapping the image can't label.

## Decision 2 — A new pure module `src/color/palette-swatch.mjs`, reusing `renderGridSwatch`

The card→swatch-grid logic is pure (no GL/network/model) so it lives in `src/color/` and is
unit-tested under the `src/**/*.test.mjs` glob. It **reuses** E-10's `renderGridSwatch` rather than
re-implementing cell painting (the ticket's "reuse renderGridSwatch / image-grid.mjs").

Two exports:

- **`cardToSwatchGrid(card, { cols } = {})`** → a *synthetic GridResult* (`{grid, n, m, legend}`)
  that `renderGridSwatch` consumes unchanged. Layout: lay the card's entries left-to-right, top-to-
  bottom into `cols` columns (default `min(card.length, 4)`), `m = ceil(len/cols)` rows; trailing
  cells are `null` (transparent). `legend = card.map(c => ({ block:c.block, rgb:c.rgb }))` — the
  color source `renderGridSwatch` keys on. One swatch **per card entry** (per requested name), even
  if two names snap to the same block (their swatches are identical color — that *is* the honest
  picture). Pure; no encode.

  > Note: `renderGridSwatch` makes each cell `cell×cell` px (caller passes a large `cell`, e.g. 96,
  > so swatches read clearly). The grid carries no text labels — `renderGridSwatch` paints solid
  > color only; the names/values ride in the *text legend* (below) instead.

- **`paletteSwatchLegend(card)`** → the `palette_swatches` string for the prompt: one line per entry,
  `"<name> → <block>  <hex>  L*<value>  [snapped ΔE<deltaE>]"`. Deterministic, no rounding surprises
  (values already rounded by T-039-01). This is the text the BAML `.v2` interpolates.

**Why a new module, not a function in `image-grid.mjs`:** `image-grid.mjs` is specifically *image→
grid* (decode, downsample, match). A card→grid adapter is a different direction (palette→grid). Keep
`image-grid.mjs` cohesive; `palette-swatch.mjs` imports `renderGridSwatch` from it. No cycle
(`palette-swatch` → `image-grid` + `value-palette`; neither imports back).

*Rejected — synthesize the GridResult inline in the runner:* it would be untested (runners aren't on
the test glob) and would duplicate the legend/layout logic the A/B and any future S-042 consolidation
both need. A pure, tested module is the reusable seam.

*Rejected — a bespoke labeled-swatch renderer (text drawn on the PNG):* drawing text needs a font
raster dep and pixels the value-honesty doesn't require. The image's job is *true color*; the legend
text does the labeling. Cheaper and stays inside `renderGridSwatch`.

## Decision 3 — Attach via the `images` array; A/B in a dedicated benchmark runner

**Attach:** extend `baml-concept.mts` with an *additive* `.v2` branch. When the stdin job carries
`variant:"v2"` (+ `paletteSwatches`), call `b.request.SculptureConceptPromptV2(...)` and let the
already-present `images:[...]` carry the swatch PNG. When `variant` is absent/`"v1"`, the file behaves
exactly as today — E-13 path untouched. One `if`, no default-behavior change.

**Run + record:** a new `benchmarks/sculpture/concept-ab.mjs`:
1. For each subject dir (`001-vConcept-moai`, `013-vConcept-a-pineapple`): read `artifact.json` →
   `resolveValueTruePalette(artifact)` → card.
2. `cardToSwatchGrid(card)` → `renderGridSwatch` → encode PNG (lazy `pngjs`, the
   `image-to-grid.mjs` pattern) → save `<work>/<subject>.swatch.png`.
3. `paletteSwatchLegend(card)` → the legend text.
4. Shell `baml-concept.mts` with `variant:"v2"`, `images:[swatchPng]`, `paletteSwatches`, `model:
   "pro"` → `<work>/<subject>.v2.png`.
5. Copy the run's existing `.v1` `concept.png` → `<work>/<subject>.v1.png`.
6. Emit `<work>/<subject>.ab.json` (palette card, snappedCount, mean/min/max L\*, paths) for the note.

**A/B read:** after generation, the v1 and v2 PNGs are inspected (visually, via the Read tool) and
the human-readable comparison — *does `.v2` preview the truer, often-darker value? any segmentation
or quality cost?* — is written into `a-b-note.md`. The structured L\* data in `*.ab.json` anchors the
qualitative read in numbers.

**Model fairness:** both arms use Nano Banana **pro** (the `.v1` concepts were pro). Same model, same
design doc, same target_blocks — the *only* change is the swatch grid + value instruction, so any
difference is attributable to the `.v2` mechanism (spec §7 "hold everything constant except the
variable").

*Rejected — regenerate the `.v1` arm too:* the on-disk `concept.png` *is* a real `.v1` pro output;
regenerating wastes a metered call and adds Nano Banana run-to-run noise to the comparison. Use the
existing `.v1` as-is.

## Determinism, cost, boundary

- **Pure module is deterministic:** layout and legend are functions of the card only; no `Math.random`
  / `Date`. Snapshot-stable.
- **Cost:** 2 live Nano Banana **pro** image calls (one per subject). Bounded and economical; the
  `.v1` arm is free (on disk). The design docs are reused (no `claude -p` calls — `ANTHROPIC_API_KEY`
  absent locally, and not needed).
- **Boundary:** `palette-swatch.mjs` imports only `renderGridSwatch` (`image-grid.mjs`) and
  `resolveValueTruePalette`/`hexToRgb` (`value-palette.mjs`) — both already pure. No new GL/asset/
  network dep; `cielab.mjs`'s reuse-boundary guard stays green. The live seam (`nano-banana.mjs`,
  `concept-ab.mjs`) stays out of the test glob.

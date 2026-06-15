# T-040-01 — Structure: palette-aware-concept

The file-level blueprint. Five touched paths: one BAML addition, one new pure module + its test, one
additive edit to the concept transport, and one new live A/B runner. Plus generated `baml_client/`.

## Files

### 1. `baml_src/conceptart.baml` — MODIFY (pure addition)

Append a new function after `SculptureConceptPrompt` (the `.v1`, untouched):

```baml
// Stage-1 concept-art prompt — vConcept SCULPTURE, PALETTE-AWARE .v2 (T-040-01 / S-040 / E-14).
// Sibling of SculptureConceptPrompt, kept SEPARATE so the .v1 prompt stays frozen (E-13 runs stay
// reproducible). Adds ONE thing over .v1: it consumes a value-true palette legend and is told to
// match the ATTACHED SWATCH GRID's real block values (often darker than the name implies), closing
// the value-drift gap (concept blocked hue but not value). The swatch grid image is attached by the
// harness via the same multimodal path as any reference image; BAML renders only the TEXT.
function SculptureConceptPromptV2(design_doc: string, target_blocks: int, palette_swatches: string, attached: string) -> string {
  client ClaudeStub
  prompt #"
    <verbatim .v1 body: 3/4 freestanding object, black bg, segmentation, voxel hard-limits,
     palette/silhouette rules — copied character-for-character from SculptureConceptPrompt>

    VALUE-TRUE PALETTE (this is the .v2 addition): An exact SWATCH GRID of the REAL Minecraft blocks
    for this build is attached as an image. Each swatch is that block's TRUE in-render color and
    VALUE — frequently DARKER than the block's name suggests. Match every surface to these real
    swatch VALUES, not to an imagined or idealized hue: if a block's true swatch is dark, paint it
    dark. The legend maps each named block to its true value (L* lightness, 0=black .. 100=white):
    {{ palette_swatches }}

    {{ design_doc }}

    {{ attached }}
  "#
}
```

- **Invariant:** the `.v1` body text is copied byte-for-byte; only the new VALUE-TRUE block + the
  `{{ palette_swatches }}` slot are new. `git diff` shows additions only on `SculptureConceptPrompt`'s
  region (none) — the whole hunk is a new function.
- After editing, run `npm run baml:gen` → regenerates `baml_client/` (sync_request/async_request/
  parser/etc.) with `SculptureConceptPromptV2`. The generated files are committed (the repo commits
  `baml_client/`).

### 2. `src/color/palette-swatch.mjs` — NEW (pure)

The card→swatch adapter. ~70 lines. Public interface:

```js
import { renderGridSwatch } from "./image-grid.mjs";   // E-10 reuse — cell painter

/** Lay a value-true card into a synthetic GridResult that renderGridSwatch consumes unchanged. */
export function cardToSwatchGrid(card, { cols } = {});
//   → { grid: (string|null)[][], n, m, legend: [{block, rgb}] }
//   cols default = min(card.length, 4); m = ceil(card.length / cols)

/** The value legend text the BAML .v2 interpolates (one line per card entry). */
export function paletteSwatchLegend(card);
//   → "<name> → <block>  <hex>  L*<value>[  snapped ΔE<deltaE>]\n..."

/** Convenience: card → { swatch:{width,height,data}, legend:string } in one call. */
export function buildPaletteSwatch(card, { cols, cell = 96 } = {});
//   → { swatch: renderGridSwatch(cardToSwatchGrid(card,{cols}), {cell}), legend, cols, rows }
```

- Validates `card` is a non-empty array of `{block, rgb}` (throws actionably otherwise).
- **No I/O, no encode** — returns RGBA + text. The runner encodes to PNG.
- Imports: `renderGridSwatch` (image-grid.mjs) only; optionally `hexToRgb` is *not* needed (rgb is on
  the card). Stays GL/network/model-free.

### 3. `src/color/palette-swatch.test.mjs` — NEW

Unit suite, `node --test` glob. Groups:
- **A — layout:** N entries → `n=cols`, `m=ceil(N/cols)`; trailing cells are `null`; `grid` is `m×n`.
- **B — color fidelity:** every filled cell's `legend` rgb equals the card entry's rgb; rendered
  swatch (via `renderGridSwatch`) paints the true color at a sampled pixel.
- **C — legend text:** one line per entry; contains `name`, `block`, `hex`, `L*<value>`; snapped
  entries carry `ΔE`; unsnapped do not.
- **D — determinism:** two calls on the same card are deep-equal (grid + legend).
- **E — validation:** empty/malformed card throws; single-entry card → 1×1 grid.
- **F — integration with real resolver:** `resolveValueTruePalette(["gray_concrete","honey_block"])`
  → `buildPaletteSwatch` produces a swatch whose dark `gray_concrete` value is reflected (a low-L\*
  pixel), proving the value-honesty round-trips from T-039-01 through to pixels.

### 4. `benchmarks/sculpture/baml-concept.mts` — MODIFY (additive `.v2` branch)

Add an optional `variant` + `paletteSwatches` to the stdin job; default path unchanged:

```ts
const { designDocPath, images = [], targetBlocks = 32, model = "pro", outPath,
        attached = "", variant = "v1", paletteSwatches = "" } = JSON.parse(await readStdin());
...
const req: any = variant === "v2"
  ? await b.request.SculptureConceptPromptV2(designDoc, targetBlocks, paletteSwatches, attached)
  : await b.request.SculptureConceptPrompt(designDoc, targetBlocks, attached);
```

- `variant` absent → `"v1"` → byte-identical to today (E-13 reproducible).
- Swatch image rides in the existing `images` array — no transport change.

### 5. `benchmarks/sculpture/concept-ab.mjs` — NEW (live, off the test glob)

The A/B orchestrator. ~120 lines, structure:
- `SUBJECTS = [{ key:"moai", run:"001-vConcept-moai" }, { key:"pineapple", run:"013-vConcept-a-pineapple" }]`.
- `runBamlConcept(input)` — copy of run.mjs's spawn-tsx helper (or import is impractical across the
  mts boundary; a local copy is fine and isolated to this script).
- For each subject:
  1. read `runs/<run>/artifact.json`; `resolveValueTruePalette(artifact)` → card.
  2. `buildPaletteSwatch(card)` → encode PNG → `OUT/<key>.swatch.png` (lazy `pngjs`).
  3. spawn `baml-concept.mts` with `variant:"v2"`, `images:[swatchPng]`, `paletteSwatches`,
     `designDocPath`, `targetBlocks`, `model:"pro"`, `outPath:OUT/<key>.v2.png`.
  4. copy `runs/<run>/concept.png` → `OUT/<key>.v1.png`.
  5. write `OUT/<key>.ab.json` = `{ subject, run, snappedCount, card, valueStats:{meanL,minL,maxL},
     paths:{v1, v2, swatch} }`.
- `OUT = docs/active/work/T-040-01`. Guarded on `GEMINI_API_KEY`; prints a clear skip if absent.
- Usage banner: `node benchmarks/sculpture/concept-ab.mjs`.

### 6. `docs/active/work/T-040-01/` — artifacts

- `<key>.swatch.png`, `<key>.v1.png`, `<key>.v2.png`, `<key>.ab.json` (×2 subjects).
- `a-b-note.md` — the recorded A/B (which previews value more honestly; segmentation/quality cost).
- The six RDSPI phase docs.

## Ordering of changes

1. `palette-swatch.mjs` + test → `npm test` green (pure, no live dep). Commit.
2. `conceptart.baml` `.v2` + `npm run baml:gen` → regenerate `baml_client/`; confirm clean. Commit.
3. `baml-concept.mts` `.v2` branch (additive). Commit (or fold with 2).
4. `concept-ab.mjs` runner → run live (GEMINI present) → produce swatch/v1/v2/ab artifacts. Commit.
5. Inspect v1 vs v2 → write `a-b-note.md`. Commit.

## Module boundaries (unchanged guarantees)

- `palette-swatch.mjs` is pure; sits beside `value-palette.mjs` / `image-grid.mjs` in `src/color/`.
- `cielab.mjs` untouched → `reuse-boundary.test.mjs` stays green.
- Live Nano Banana stays in `benchmarks/` (`concept-ab.mjs` + `baml-concept.mts`), never in `src/`.
- `SculptureConceptPrompt` (`.v1`) unchanged → E-13 runs reproduce bit-for-bit.

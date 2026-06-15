# T-040-01 — Progress: palette-aware-concept

## Status: complete

All four acceptance criteria met; `npm test` green (348 tests, 0 fail); live A/B run (2 Nano Banana
PRO calls). Committed across three commits (see below).

## Steps executed (per plan.md)

### Step 1–2 — pure module `src/color/palette-swatch.mjs` + tests ✅
Implemented `cardToSwatchGrid` (card → synthetic GridResult, row-major into `min(len,4)` cols),
`paletteSwatchLegend` (name→block→hex→L\* text), and `buildPaletteSwatch` (one-call swatch RGBA +
legend), all reusing E-10's `renderGridSwatch` — zero new pixel logic. 14 tests, groups A–F
(layout, color fidelity, legend text, determinism, validation, **resolver round-trip**). The
round-trip test proves a dark block (`gray_concrete` L\*24) paints a dark swatch pixel.
`node --test` on the file: 14/14. **Commit 1** (`feat … card→swatch-grid module + tests`).

### Step 3 — BAML `.v2` + regenerate ✅
Appended `SculptureConceptPromptV2(design_doc, target_blocks, palette_swatches, attached)` to
`baml_src/conceptart.baml` — the `.v1` body copied character-for-character, plus one VALUE-TRUE block
and the `{{ palette_swatches }}` slot. `git diff` = **58 insertions, 0 deletions**;
`SculptureConceptPrompt` untouched (**AC1 frozen-prompt**). `npm run baml:gen` exit 0, wrote 14 files;
`SculptureConceptPromptV2` present in `baml_client/` (**AC1 regenerates cleanly**).

### Step 4 — `.v2` branch in `baml-concept.mts` ✅
Added `variant`/`paletteSwatches` to the stdin job (defaults `"v1"`/`""`) and a ternary selecting
`b.request.SculptureConceptPromptV2(...)` vs the `.v1` call. Absent/`"v1"` is byte-identical to the
E-13 path; the swatch image rides the existing `images` array. **Commit 2** (`… .v2 + transport
branch`).

### Step 5–6 — A/B runner + live run ✅
`benchmarks/sculpture/concept-ab.mjs`: per subject, `artifact.json` → `resolveValueTruePalette` →
`buildPaletteSwatch` → swatch PNG (lazy pngjs) → spawn `baml-concept.mts` `variant:"v2"` with the
swatch attached → copy on-disk `.v1` → write `ab.json`. `--dry` does the deterministic half only.
Dry run verified both subjects; **live run** generated both `.v2` concepts (moai 21.5s, pineapple
33.5s; PRO; 1 image attached each) — **AC2** (swatch attached as a multimodal input + value-match
instruction). All 8 image artifacts + 2 `ab.json` written to `docs/active/work/T-040-01/` (**AC4
artifacts**).

### Step 7 — A/B note ✅
Inspected all six images (Read tool reads the PNGs). `a-b-note.md` records the verdict for **both**
subjects: `.v2` previews the truer, more muted/darker value (moai body dark slate vs `.v1`'s light
gray; pineapple muted amber vs `.v1`'s candy yellow), with the segmentation-held / latent-risk read
and the S-042 recommendation (**AC3**). **Commit 3** (`… A/B (moai + pineapple) + note`).

## Deviations from plan / design

1. **`baml_client/` is gitignored** — so the regenerated client is *not* committed (it regenerates on
   demand via `baml:gen`). AC1 only requires clean regeneration, which holds. Commit 2 carries the
   `.baml` source + the `.mts` branch, not the generated files.
2. **`pngjs` sync-reader rejects the Nano Banana PNGs** ("unrecognised content at end of stream" — the
   Gemini output carries trailing/ancillary chunks). This affects *reading* them with `PNG.sync.read`
   only; the images are valid (the Read tool renders them fine, and they are the deliverable). Our own
   swatch PNGs read cleanly. No code change needed — the runner only *writes* swatch PNGs and *copies*
   the concept PNGs; it never re-decodes a concept.
3. **No other deviations.** Module shape, BAML signature, transport branch, and A/B structure are
   exactly as designed.

## Verification log

- `node --test src/color/palette-swatch.test.mjs` → 14/14.
- `npm test` → **348/348** (other concurrent threads added tests; all green; `reuse-boundary` still
  green — `cielab.mjs` untouched).
- `git diff baml_src/conceptart.baml` → additions only; `.v1` region unchanged.
- `npm run baml:gen` → exit 0; `grep SculptureConceptPromptV2 baml_client/` → present.
- Live A/B → `moai.{swatch,v1,v2}.png` + `moai.ab.json`, `pineapple.{…}` — all present; `.v2` PNGs
  353 KB / 531 KB (non-trivial).
- Staging audited: only `benchmarks/sculpture/concept-ab.mjs` + `docs/active/work/T-040-01/` committed
  — concurrent T-041 thread files and ticket edits were explicitly **not** staged.

## What the next stories inherit

`buildPaletteSwatch` + `paletteSwatchLegend` + `SculptureConceptPromptV2` + the `concept-ab.mjs`
seam are ready. S-041 (build end) already has the value-true `card`; S-042 (co-design loop + ΔE gate)
can drive the concept arm via `variant:"v2"` and should watch the bright-silhouette-vs-true-value
conflict flagged in `a-b-note.md` for all-dark palettes.

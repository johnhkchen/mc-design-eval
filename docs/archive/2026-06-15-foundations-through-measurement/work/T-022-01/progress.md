# T-022-01 — Progress: image → real-block grid

Implement phase. Plan executed in order; all five steps complete; `npm test` 196/196 green.

## Step 1 — Refactor: export `decodeImage` — ✅ DONE

`src/color/palette-extract.mjs`: lifted the JPEG/PNG magic-sniff + lazy-decode out of
`extractPaletteFromImage` into `export async function decodeImage(path)`; rewrote the extractor to call
it. Behavior-preserving. `npm test` 182/182 green.
Commit `refactor(E-10): export decodeImage from palette-extract (T-022-01)`.

## Steps 2–3 — Core + tests — ✅ DONE

`src/color/image-grid.mjs` created (core + decode shell + swatch renderer), `src/color/image-grid.test.mjs`
created (14 tests, six groups). `npm test` 196/196 green (+14).
Commit `feat(E-10): image→block-grid core + tests (T-022-01)`.

Public surface as designed: `GRID_DEFAULTS`, `gridDims`, `gridFromPixels`, `comparePalettes`,
`renderGridSwatch`, `describeGrid`, `gridFromImage`. `GridResult` carries `grid` (m×n of block-id|null),
dims, `paletteMode`, `missing`, cell tallies, `outOfPalette`, `blockCounts`, `usedBlocks`, `legend`,
`meanDeltaE`, `description`.

## Step 4 — CLI + npm script — ✅ DONE

`scripts/image-to-grid.mjs` + `package.json` `grid:build`. Flags mirror `extract-palette.mjs` plus
`--n`, `--coverage`, `--cell`, `--out`. Writes a gitignored swatch PNG via lazy `pngjs`.
Commit `feat(E-10): image-to-grid CLI + swatch viz (T-022-01)`.

Verified on `taj-C-flash.png`:
- **Discover:** `48×48 grid · 1202/2304 filled · 57 blocks · mean ΔE 6.47 · outOfPalette 0`. Swatch
  PNG is a visibly recognizable low-res Taj (dome, iwan, windows, chhatris, plinth).
- **Validate** vs `palettes/neoclassical.json`: `outOfPalette 0`, 4 blocks, mean ΔE 28.8, 21
  non-full-cube manifest ids reported in `missing`.
- **Determinism:** two `--json` runs → byte-identical grid JSON *and* swatch PNG.
- `.grid.png` confirmed gitignored (`git check-ignore` hit).

## Step 5 — Docs + journal — ✅ DONE

`src/README.md`: added the `image-grid.mjs` (S-022) subsection under the color layer.
`docs/knowledge/design-learnings.md`: added the T-022-01 worked example — discover/validate numbers,
the palette-adherence reading, and the **extracted-vs-declared** result for taj-C vs neoclassical
(`present 1 / missing 42 / added 56`, with the read that taj ≠ neoclassical so divergence is expected).
Commit `docs(E-10): image-grid CLI docs + taj extracted-vs-declared (T-022-01)`.

## Deviations from the plan

- **None material.** Plan folded Step 2's commit into Step 3 (core + tests land together); done exactly
  so. The Step-4 "determinism mismatch" was a false alarm — `npm run` echoes the differing `--out`
  path into stdout; the underlying grid JSON and PNG are byte-identical (re-verified invoking `node`
  directly). No code change needed.

## Acceptance criteria — status

- [x] Function/CLI samples to N×M, assigns block via engine + palette; N param, default 48.
- [x] Visualization produced and saved (gitignored swatch PNG; `renderGridSwatch` + CLI `--out`).
- [x] Palette adherence: validate → 0 out-of-palette (tested, Group C); discover → only extracted
      blocks (tested). `outOfPalette` measured independently, not assumed.
- [x] Extracted-vs-declared computed (`comparePalettes`) and recorded for taj-C in the journal.
- [x] Tests on synthetic image: dims correct, every cell a palette block, known region → expected
      block. `npm test` 196/196 green.

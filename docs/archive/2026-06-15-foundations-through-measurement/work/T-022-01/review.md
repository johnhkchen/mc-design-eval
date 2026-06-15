# T-022-01 — Review: image → real-block grid

Self-assessment and handoff. The ticket's final E-10 application: sample a concept image to a fixed
N-wide block grid, map each cell to a real block, visualize, and demonstrate the E-10 thesis (palette
adherence + resolution cap + extracted-vs-declared). **Done; `npm test` 196/196 green.**

## What changed

| File | Action | Summary |
|------|--------|---------|
| `src/color/palette-extract.mjs` | modified | Extracted `export async function decodeImage(path)` from `extractPaletteFromImage` (behavior-preserving refactor) so the grid sampler reuses one decoder. |
| `src/color/image-grid.mjs` | **created** | The S-022 pipeline: pure core (`gridFromPixels`, `comparePalettes`, `renderGridSwatch`, `gridDims`, `describeGrid`) + lazy decode shell (`gridFromImage`). ~260 lines. |
| `src/color/image-grid.test.mjs` | **created** | 14 tests, six groups, on synthetic RGBA buffers — no binary fixtures, decode-free. |
| `scripts/image-to-grid.mjs` | **created** | CLI (`npm run grid:build`); flags mirror `extract-palette.mjs` + `--n/--coverage/--cell/--out`; writes a gitignored swatch PNG. |
| `package.json` | modified | Added `"grid:build"`. |
| `src/README.md` | modified | `image-grid.mjs` (S-022) subsection under the color layer. |
| `docs/knowledge/design-learnings.md` | modified | T-022-01 worked example (discover/validate numbers, adherence, extracted-vs-declared). |

Four commits: `fa30533` (refactor) → `a5f7ae0` (core+tests) → `0e31fee` (CLI) → `1f91732` (docs).

## How it works (one paragraph)

`gridFromImage` decodes (reusing `palette-extract`'s `decodeImage`) then `gridFromPixels`: resolve the
candidate palette (`resolvePalette` — all 305 blocks, or a whitelist/manifest subset); compute
`m = round(n·H/W)`; one forward pass buckets every pixel into its cell, splitting foreground vs.
background (`isBackground`); each cell with foreground fraction ≥ `coverageThreshold` (0.5) averages
*only its foreground* pixels → `srgbToLab` → `nearestLab` over the candidate palette → a block id;
the rest are air (`null`). The result carries the grid, cell tallies, a measured `outOfPalette`, a
`legend`, and `meanDeltaE`. `renderGridSwatch` paints each cell its matched block's table color (air
transparent); the CLI encodes that to a gitignored PNG.

## Test coverage

14 new tests (182 → 196). By acceptance criterion:

- **AC1 (N×M sampling, engine+palette, N default 48):** Group A (geometry — `gridDims` square/wide/
  tall/clamp; grid shape matches dims) + Group B (assignment). `GRID_DEFAULTS.n === 48`.
- **AC2 (visualization saved, gitignored):** Group E (swatch dims; a filled cell = its block's table
  rgb at alpha 255; air = alpha 0; rejects `cell ≤ 0`). Gitignore verified via `git check-ignore` on
  the real run (CLI default `--out` lands beside the gitignored concept image).
- **AC3 (palette adherence):** Group C — validate mode `outOfPalette === 0` and every non-null cell ∈
  whitelist; discover mode uses only real table blocks; `missing` surfaces non-table ids. `outOfPalette`
  is computed by an independent membership scan, so the test verifies the invariant rather than
  trusting it.
- **AC4 (extracted-vs-declared):** Group D — `comparePalettes` present/missing/added partition
  (disjoint + exhaustive; empty-used edge). Recorded for taj-C in the journal.
- **AC5 (synthetic-image tests, npm green):** Groups A–B (dims, every cell a palette block, known
  region → expected block, derived from the committed table) + Group F (determinism: two runs
  deep-equal; `describeGrid`). `npm test` 196/196.

Expectations are derived independently of the code (region painted at a block's own table rgb must
return that block by definition of nearest-match) — the repo idiom from `palette-extract.test.mjs`.

## Verification beyond unit tests

Real-concept run on `taj-C-flash.png` (1024²): discover → `48×48 · 1202/2304 filled · 57 blocks ·
mean ΔE 6.47 · outOfPalette 0`; the swatch PNG is a recognizably low-res Taj (dome, iwan, windows,
chhatris, plinth) — eyeballed and confirmed. Validate vs neoclassical → `outOfPalette 0`, 21
non-full-cube ids reported `missing`. Output byte-deterministic (grid JSON + PNG identical across
runs, confirmed invoking `node` directly to avoid npm's command-echo noise).

## Open concerns / limitations

1. **Coverage threshold is a fixed default (0.5).** Tuned for the locked bright-silhouette-on-dark
   concept series; surfaced as `--coverage`. A facade on a non-dark or busy background would need
   `--drop none`/a different threshold. Documented in the module header and journal; not auto-detected
   by design (D4 — Otsu rejected as over-engineering for the locked input).
2. **Near-black foreground is dropped** (inherited from S-021's background contract). Acceptable for
   the stage-1 prompt; `--drop none` opts out. Same caveat already on the extractor.
3. **Swatch viz is flat-2-D, not a voxel render.** Per the ticket's "reuse E-02 render *or* a simple
   swatch render" — chose the swatch (dep-light, deterministic, unit-testable). It shows *placed block
   colors*, which is the honest preview; it is not a 3-D/textured render. E-02 integration remains
   available if a textured preview is wanted later.
4. **No JSON grid is persisted by default.** The CLI writes the PNG; the full grid is available via
   `--json` (stdout). No ticket requirement for a committed grid file, and grids (like renders) are
   reproducible local artifacts, so none is committed. If a downstream consumer needs the grid on disk,
   add `--out-json`.
5. **`comparePalettes` against a *real* own-manifest** wasn't run — the taj concept has no neoclassical
   intent, so the recorded comparison is illustrative of the metric (correctly showing near-total
   divergence). When a concept is generated *from* a specific manifest, the same call becomes the
   literal fidelity signal. No code change needed; it's a data/usage note.

## Critical issues for a human reviewer

None. The one risk flagged in the plan (R1, refactor breaking the extractor suite) did not
materialize — the decode lift is behavior-preserving and the full suite stayed green at every step.
The `decodeImage` export is the only change to existing tested code; its sole behavioral surface (the
error message prefix changed from `extractPaletteFromImage:` to `decodeImage:`) is not asserted by any
test and is strictly more accurate.

## Suggested follow-ups (out of scope here)

- S-023 consolidation: de-dupe `block-table.mjs`'s transitional `srgbToLab` against `cielab.mjs`
  (already flagged in that file; unrelated to this ticket).
- Optional `--out-json` to persist the grid for a 3-D placement step (the E-09 voxel path).
- CIEDE2000 metric (the `nearest`/`nearestLab` `metric` seam is already pluggable) if CIE76 banding
  on flat fields proves visible at higher resolutions.

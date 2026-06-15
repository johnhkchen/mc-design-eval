# T-022-01 — Design: image → real-block grid

Decisions for sampling a concept image to an N×M block grid, matching each cell to a real block, and
demonstrating the E-10 thesis (palette adherence + resolution cap + extracted-vs-declared). Grounded
in the research: reuse the S-020 engine, the S-019 table, and the S-021 decode/background/palette
machinery; add only the *spatial reduction* and the *grid-specific reporting*.

## D1 — New module vs. extend `palette-extract.mjs`

**Decision: a new sibling module `src/color/image-grid.mjs`** that imports the reusable pieces from
`palette-extract.mjs` (`isBackground`, `rgbToHex`, `resolvePalette`, `DEFAULTS`) + `cielab.mjs`
(`srgbToLab`, `nearestLab`, `deltaE`) + `block-table.mjs` (`loadBlockTable`).

Rejected — *fold into palette-extract*: the two produce different shapes (ordered palette list vs.
2-D grid) and have different reductions (cluster-merge vs. spatial-bucket). Bolting grid logic onto
the extractor would muddy a clean, tested module. A sibling keeps each focused and lets T-022 reuse
the extractor's exports without owning them. This matches the repo's one-module-per-concept layout.

## D2 — Reuse the decode shell (small refactor to `palette-extract.mjs`)

The JPEG/PNG magic-sniff + lazy-decode lives inline in `extractPaletteFromImage` and is **not**
exported. T-022 needs the identical decode.

**Decision: extract a tiny `export async function decodeImage(path) → {width,height,data}` in
`palette-extract.mjs`**, and rewrite `extractPaletteFromImage` to call it. `image-grid.mjs`'s decode
shell calls the same `decodeImage`. One decoder, one place that touches `jpeg-js`/`pngjs`, zero
duplicated magic bytes.

Rejected — *duplicate the sniff in image-grid*: violates DRY for the exact logic the research flagged
as the only binary-dep touchpoint; two copies drift. Rejected — *new `decode.mjs` module*: needless
file churn; the decoder already has a settled home. The refactor is behavior-preserving and covered
by the existing `palette-extract.test.mjs` (the pure core is untouched; only the shell is reorganized).

## D3 — Grid geometry: aspect-correct M from N

**Decision:** `n` is the parameter (default **48**). `m = max(1, round(n · H / W))`. Cell (gx,gy)
owns source pixels with `gx = floor(x · n / W)`, `gy = floor(y · m / H)` (a forward box mapping — every
source pixel falls in exactly one cell; `x<W` ⇒ `gx<n`). This is **area down-sampling**, the right
reduction for "every cell summarizes a region", and it makes the resolution cap literal.

Rejected — *point/nearest sampling* (read one pixel per cell center): throws away most pixels and is
noise-sensitive on JPEG; area-average is both more faithful and naturally yields the per-cell
foreground coverage we need for the air decision. Rejected — *square grid (M=N)*: research showed
`taj-A` is 1265×832; forcing square distorts the facade.

## D4 — Air cells via foreground-coverage threshold

A facade is a silhouette on near-black. Each cell aggregates its pixels into `fgCount` (non-background,
summed rgb) and `bgCount` (background, via the reused `isBackground`).

**Decision:** `coverage = fgCount / (fgCount + bgCount)`. If `coverage ≥ coverageThreshold`
(default **0.5**) and `fgCount > 0`, the cell is **filled** → `meanRgb = sumRgb / fgCount` →
`srgbToLab` → `nearestLab(palette)` → block id. Otherwise the cell is **air** (`null`). Background
pixels never pollute a filled cell's mean (we average only the foreground pixels), so an edge cell that
is half facade reports the facade color, not a black-muddied blend.

Rejected — *no air, map every cell* (incl. background→nearest-to-black): produces a solid rectangle,
makes coverage/adherence meaningless, and contradicts the silhouette intent. Rejected — *Otsu/auto
threshold*: over-engineered; the prompt guarantees a clean dark field, so a fixed, documented 0.5
(tunable via `--coverage`) is honest and deterministic. The 0.5 default is the "majority of the cell
is the subject" rule.

## D5 — Two palette modes, reusing `resolvePalette`

**Decision:** one pipeline, candidate palette chosen by `whitelist`:
- **discover** (`whitelist` undefined) — match against all 305 full-cube blocks. Answers "what blocks
  would this facade need?".
- **validate** (`whitelist` = manifest `.blocks` or id list) — match against that subset only.
  `nearestLab` can then *only* return a manifest block ⇒ palette adherence is structural.

`resolvePalette` already returns `{palette, missing}` and throws on an all-missing whitelist — reused
verbatim. `missing` (e.g. neoclassical's stairs/slabs, absent from the full-cube table) is surfaced in
the result, never silently dropped.

## D6 — Palette-adherence check (§9), computed not assumed

**Decision:** the result carries an explicit `outOfPalette` count = number of **filled** cells whose
assigned block ∉ the candidate-palette key set. In validate mode this is `0` by construction; the
**test asserts it `=== 0`** rather than trusting the invariant. Also expose `filledCells`, `airCells`,
`totalCells`, and a `blockCounts` tally so coverage/diversity (spec §9 "coverage/diversity of palette
use") is reportable. This makes the E-10 thesis a measured number, not a claim.

## D7 — Extracted-vs-declared comparison

**Decision:** a pure helper `comparePalettes(usedBlocks, declaredBlocks) → {present, missing, added}`:
- `present` = declared ids that appear in the grid,
- `missing` = declared ids that never appear (the doc asked, the image didn't deliver),
- `added`  = grid ids not in the manifest (the image introduced — only possible in discover mode).

Run discover-mode on one real concept, compare its `usedBlocks` to a manifest, record the three sets
in the journal. This is the "did the concept honor the doc?" signal the ticket asks for.

## D8 — Visualization: pure swatch buffer + lazy PNG encode

**Decision:** a pure `renderGridSwatch(result, {cell=12}) → {width, height, data}` that paints each
filled cell as a `cell×cell` block of the matched block's **table rgb** (looked up via a legend the
core builds), air cells transparent (alpha 0). The CLI lazily imports `pngjs` to encode and write the
buffer to a **gitignored** path (default alongside the input, e.g. `<image>.grid.png`, or `--out`).

Rejected — *E-02 prismarine render*: heavy GPU/Playwright path for a flat 2-D field; the ticket
permits the swatch and the research deemed it overkill. Keeping the swatch buffer **pure** lets it be
unit-tested (dimensions, a known cell's color) with no binary dep, consistent with the module split.
Using the **block's** color (not the source pixel color) makes the viz show *what was actually placed*
— the honest picture of the resolution + palette reduction.

## D9 — CLI + npm script, mirroring `extract-palette.mjs`

**Decision:** `scripts/image-to-grid.mjs`, wired as `npm run grid:build`. Flags mirror the extractor:
`--n <int>` (default 48), `--whitelist <ids|path.json>`, `--drop <#hex|none>`, `--tol <n>`,
`--coverage <0..1>`, `--cell <px>`, `--out <png>`, `--json`. Human output: a compact summary
(dims, filled/air, outOfPalette, top blocks, missing) + writes the viz PNG. `--json` prints the full
result (grid included). Reuses the extractor's `parseHex`/`resolveWhitelist` conventions.

## Determinism

Single forward pass over pixels in fixed order; stable Map iteration for the legend; sort by count then
id; integer cell math; no `Math.random`/`Date`. Identical input ⇒ byte-identical grid JSON and PNG —
asserted by re-run comparison in the CLI smoke and noted in review (as T-021 did).

## What this design deliberately does NOT do

No dithering (ticket). No 3-D voxelization (that is E-09's Trellis path, not E-10). No new color math
(reuses `cielab.mjs` whole). No server/Mineflayer. No committing of renders or concept images.

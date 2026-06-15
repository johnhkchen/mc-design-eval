# T-022-01 — Structure: image → real-block grid

The blueprint. Files, public interfaces, internal organization, ordering. No code — the shape of it.

## File inventory

| File | Action | Purpose |
|------|--------|---------|
| `src/color/palette-extract.mjs` | **modify** | Extract & export `decodeImage(path)`; rewrite `extractPaletteFromImage` to call it. Behavior-preserving. |
| `src/color/image-grid.mjs` | **create** | The T-022 core + decode shell + swatch renderer. |
| `src/color/image-grid.test.mjs` | **create** | Unit tests on synthetic RGBA buffers (no binary fixtures). |
| `scripts/image-to-grid.mjs` | **create** | CLI; mirrors `extract-palette.mjs`. |
| `package.json` | **modify** | Add `"grid:build": "node scripts/image-to-grid.mjs"`. |
| `src/README.md` | **modify** | Document `image-grid.mjs` + the CLI under the color layer. |
| `docs/knowledge/design-learnings.md` | **modify** | Record the extracted-vs-declared result for one real concept (the journal). |
| `.gitignore` | **verify** | Confirm the chosen viz output path is ignored (concepts/ already is; default `--out` lands beside the gitignored input). |

## `src/color/palette-extract.mjs` — the refactor (D2)

Add, near the decode shell:

```
export async function decodeImage(path) → { width, height, data }   // Uint8Array/Buffer RGBA8
```
- Body = the current magic-sniff (JPEG `FF D8` → jpeg-js; PNG `89 50 4E 47` → pngjs; else throw),
  lifted verbatim out of `extractPaletteFromImage`.
- `extractPaletteFromImage(path, opts)` becomes: `const img = await decodeImage(path); return
  extractPaletteFromPixels(img, opts);`
- No change to the pure core, `DEFAULTS`, `resolvePalette`, `isBackground`, `rgbToHex`, or any
  exported signature already relied on by tests. Pure-refactor; existing suite must stay green.

## `src/color/image-grid.mjs` — public surface

```
export const GRID_DEFAULTS = Object.freeze({
  n: 48,                    // grid width in cells (the held-constant resolution)
  coverageThreshold: 0.5,   // min foreground fraction for a cell to be filled (else air)
  // background removal inherited from palette-extract DEFAULTS:
  dropColor: [0,0,0], dropTolerance: 24, alphaThreshold: 128,
});

// PURE CORE (no I/O, no decode dep) — fully unit-testable on synthetic RGBA buffers:
export function gridFromPixels(img, opts = {}) → GridResult
export function comparePalettes(usedBlocks, declaredBlocks) → { present, missing, added }
export function renderGridSwatch(result, { cell = 12 } = {}) → { width, height, data }

// DECODE SHELL (lazy import via palette-extract's decodeImage):
export async function gridFromImage(path, opts = {}) → GridResult
```

### `GridResult` shape
```
{
  grid,            // m arrays of length n; each entry = block-id string | null (air)
  n, m,            // grid dims (cols, rows)
  width, height,   // source image dims
  paletteMode,     // "discover" | "validate"
  missing,         // whitelist ids not found in the block table (from resolvePalette)
  totalCells, filledCells, airCells,
  outOfPalette,    // # filled cells whose block ∉ candidate palette key set (0 in validate)
  blockCounts,     // { [blockId]: cellCount }, all distinct blocks used
  usedBlocks,      // string[] distinct block ids, sorted by count desc then id
  legend,          // [{ block, rgb:[3], hex, cells, pct }] sorted like usedBlocks — drives viz + report
  meanDeltaE,      // mean ΔE of filled cells to their matched block (match-quality signal)
  description,     // one-line human summary
}
```

### Internal organization (top → bottom)
1. Imports: `srgbToLab, nearestLab, deltaE` (cielab), `loadBlockTable` (block-table),
   `isBackground, rgbToHex, resolvePalette, DEFAULTS as PE_DEFAULTS, decodeImage` (palette-extract).
2. `const TABLE = loadBlockTable();` + `const BY_BLOCK = new Map(TABLE.blocks.map(b=>[b.block,b]));`
   (block→rgb lookup for the legend/viz).
3. Small pure helpers: `round1/round2`, `gridDims(width,height,n)` → `{n,m}`.
4. `aggregateCells(img, n, m, bgOpts)` — single forward pass; returns `cells` = length n·m array of
   `{ sumR,sumG,sumB, fgCount, bgCount }`. Pixel→cell index `gy*n+gx`.
5. `gridFromPixels` — orchestrates: resolve palette → dims → aggregate → per-cell fill/air decision +
   `nearestLab` → assemble grid, counts, legend, metrics, description.
6. `comparePalettes` — set logic (D7).
7. `renderGridSwatch` — allocate `Uint8ClampedArray(w*h*4)`; for each cell paint a `cell×cell` block
   of its legend rgb (alpha 255) or leave transparent (air). `w = n·cell`, `h = m·cell`.
8. `describeGrid(result)` — `"48×31 grid · 612/1488 cells filled · 9 blocks · mean ΔE 6.3"`.
9. `gridFromImage` — `decodeImage(path)` then `gridFromPixels`.

### Key internal contracts
- Per-cell mean uses **fgCount only** (background pixels excluded from the average) — D4.
- A filled cell with `fgCount>0` always gets a non-null block (palette is non-empty, guaranteed by
  `resolvePalette`). Air ⇔ `coverage < threshold` (or `fgCount === 0`).
- `outOfPalette` computed by membership test against the resolved candidate key Set — independent of
  how matching was done, so the test genuinely verifies the invariant.

## `src/color/image-grid.test.mjs` — coverage map (mirrors palette-extract.test.mjs idiom)

- **Helpers:** `solid(w,h,[r,g,b])` and `withRegion(...)` to build synthetic RGBA buffers inline.
- **Group A — geometry:** `gridDims`/`gridFromPixels` produce `n` cols and `m = round(n·H/W)` rows;
  `grid.length === m`, every row length `n`; non-square image → non-square grid.
- **Group B — cell assignment:** a synthetic image with a known solid foreground region over a black
  field → that region's cells map to the **expected block** (a block whose table color is nearest the
  region color); background cells are `null` (air).
- **Group C — palette adherence (§9):** validate mode with a small whitelist → `outOfPalette === 0`
  and every non-null cell ∈ whitelist; `missing` surfaces ids absent from the table.
- **Group D — comparePalettes:** present/missing/added partition correctly; disjoint and exhaustive.
- **Group E — swatch render:** dims `n·cell × m·cell`; a known filled cell's center pixel equals the
  block's table rgb at alpha 255; an air cell's pixel is alpha 0.
- **Group F — determinism:** two `gridFromPixels` runs on the same buffer deep-equal.

## `scripts/image-to-grid.mjs` — CLI shape

- `parseArgs`: positional `<image>`; `--n`, `--whitelist`, `--drop #hex|none`, `--tol`,
  `--coverage`, `--cell`, `--out`, `--json`. Reuse `parseHex` + `resolveWhitelist` conventions from
  `extract-palette.mjs` (copy the two tiny helpers; they are not exported there).
- Flow: `gridFromImage(image, opts)` → if `--json` print full result; else print `description`, a
  summary block (mode, dims, filled/air, outOfPalette, top-N legend rows, missing), then encode the
  swatch via lazy `pngjs` and write to `--out` (default `<image>.grid.png`), logging the path.
- Default `--out` path sits beside the (gitignored) concept image, so the PNG is gitignored too.

## Ordering of changes (commit boundaries → see plan.md)
1. Refactor + export `decodeImage` (palette-extract) — suite stays green.
2. `image-grid.mjs` core (`gridFromPixels`, `comparePalettes`, `renderGridSwatch`, `gridFromImage`).
3. `image-grid.test.mjs` — all six groups; `npm test` green.
4. CLI + `package.json` script; verify on a real concept; capture extracted-vs-declared.
5. Docs: `src/README.md` + journal entry.

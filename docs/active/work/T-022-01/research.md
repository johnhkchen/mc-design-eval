# T-022-01 — Research: image → real-block grid

Epic E-10 / story S-022, the final E-10 application. Given a concept image, sample it to a fixed
N-wide grid and map **each cell** to a real, survival-obtainable Minecraft block (via the S-020
engine, against a palette). Output the block grid + a visualization, and use the grid to demonstrate
the E-10 thesis: (1) every cell is a real obtainable block — the §9 palette-adherence check passes;
(2) detail is capped at the grid resolution. Also compute **extracted-vs-declared** agreement.

This is the sibling of T-021-01 (palette extraction). T-021 answered *"which blocks does this facade
use?"* (cluster → merge → ordered palette). T-022 answers *"lay this facade out on a block grid"*
(sample → per-cell match → 2-D array). Same engine, same table, same decode shell — a different
spatial reduction. Descriptive survey below; decisions deferred to design.

## Dependencies (all merged, on `main`)

**S-020 color engine — `src/color/cielab.mjs`** (commit `526d5bb`). Pure, zero-project-import math.
- `srgbToLab([r,g,b])` — 8-bit sRGB (0–255) → CIE L\*a\*b\* (D65). Validates range, throws on bad input.
- `deltaE76` / `deltaE` (alias) — Euclidean ΔE in Lab.
- `nearestLab(targetLab, palette, {metric})` — argmin ΔE over `palette:[{key,lab}]`, returns
  `{key, deltaE, lab}`. **Takes a Lab target directly** (no rgb round-trip). Each cell's mean color,
  once in Lab, matches with this — exactly the caller T-021 added it for.
- `nearest(rgb, palette)` — sRGB convenience wrapper that delegates to `nearestLab`.

**S-019 block→Lab table — `src/color/block-table.mjs` + `block-lab-table.json`** (commit `4ffe3ca`).
Committed runtime table, **305 blocks** (455 excluded), each `{block, texture, rgb:[3], lab:[3]}`.
Loaded dep-free via `loadBlockTable()` → `{version, requestedVersion, generatedFrom, blocks[],
excluded[]}`. The set is `full-cube ∧ ¬tinted ∧ ¬denylisted` — exactly discover-mode's candidate set.
Effective version `1.20.2` (from requested `1.20.1`).

**S-021 palette extractor — `src/color/palette-extract.mjs`** (commits `92abd37`/`07d66e3`/`d8d8be8`).
The direct sibling, and a rich source of reusable pieces. Already exports (and unit-tests) several
helpers T-022 needs verbatim:
- `DEFAULTS` — `{k:8, dropColor:[0,0,0], dropTolerance:24, alphaThreshold:128}`. The background
  removal contract is identical for T-022.
- `isBackground(r,g,b,a,opts)` — the near-black / low-alpha background test (tolerance, not exact `===`).
- `rgbToHex([r,g,b])` — for the report/legend.
- `resolvePalette(whitelist)` — resolves the candidate palette as `[{key,lab,rgb}]`; `undefined`
  whitelist → all 305 blocks (discover), an id list → the subset (validate). Returns `{palette,
  missing}` and throws if the whitelist matches nothing. **Reusable as-is for both T-022 modes.**
- `extractPaletteFromImage(path, opts)` — the decode shell. Sniffs JPEG/PNG magic bytes, lazily
  imports `jpeg-js`/`pngjs`, returns the extraction. The JPEG/PNG sniff-and-decode logic (lines
  ~280–311) is **not currently exported as a standalone**; T-022 needs the same decode and should
  reuse it rather than duplicate the magic-byte sniff.

## The data we feed it: concept images

`benchmarks/temple-facade/concepts/` — 18 files (gitignored, E-09 stage-1 output). Five facades (taj,
horyuji, chapelle, arc, mausoleum) × variants A/B/C, plus a few `-base`/`-seg`. Locked default is
**variant C, Flash**: single front-elevation subject, centered with margin, on a **near-black
`#000000` field**, bright high-contrast silhouette, block-scale ornament (resolution-disciplined).

⚠️ **Format surprise (verified, inherited from T-021):** despite the `.png` extension these are
**baseline JPEG** (`FF D8` magic; `pngjs` rejects them). `taj-C-flash.png` is 1024×1024;
`taj-A-flash.png` is 1265×832 (so **not all square** — the grid's M rows must derive from the image
aspect ratio, not be assumed equal to N). Background is **near**-black, not exact (`[1,1,1]` corner
from JPEG quantization) → background removal needs the tolerance, confirming reuse of `isBackground`.

## The declared manifest (validate mode + extracted-vs-declared)

`palettes/*.json` — style whitelists validated by `palettes/palette.schema.json`. `neoclassical.json`
has 43 ids in `.blocks` (e.g. `quartz_block`, `smooth_quartz`, `stone_bricks`, `white_concrete`,
`glass`, `sea_lantern`), plus an advisory `groups` view. `industrial.json` is the other. Spec §6/§9:
`.blocks` is the binding material constraint injected into the prompt; the §9 validator counts
placements **outside** that whitelist. The extractor CLI already accepts `--whitelist <path.json>`
(reads `.blocks`) or a comma list — T-022's CLI should mirror that exact contract.

The neoclassical list includes **non-full-cube** ids (stairs, slabs, walls, panes, `lantern`,
`end_rod`). Those are **not in the 305-block table** (table is full-cube only) → `resolvePalette`
returns them in `missing`. So validate-mode against a real manifest matches only the manifest's
full-cube subset; `missing` must be surfaced, not silently dropped. This is expected and already
modeled by `resolvePalette`.

## Visualization options

- **Simple swatch render (favored by ticket).** Each cell → an S×S square of the matched block's
  representative table color (`block.rgb`); air/background cells → transparent. Encode with `pngjs`
  (already a devDep, lazily imported on the decode path). Dep-light, deterministic, no GPU.
- **E-02 render (`src/render-tool.mjs`).** `createRenderServer`, `renderSummary`, `coerceArtifact` —
  the prismarine-viewer headless WebGL path. Renders an actual voxel world to PNG. Heavy (Playwright/
  headless-gl), 3-D, and aimed at DesignArtifacts, not a flat 2-D color field. Overkill here; the
  ticket explicitly permits the swatch alternative.

## Repo conventions this work must match

- **ESM `.mjs`, Node 20+.** No build step. `npm test` = validate-artifact self-test + invalid check +
  `node --test "src/**/*.test.mjs"`. Current suite **182 tests green** (post-T-021).
- **Module boundary idiom** (block-table, palette-extract): a **pure core** (no I/O, no decode dep,
  fully unit-testable on synthetic RGBA buffers — no binary fixtures committed) + an **isolated decode
  shell** that lazily imports `jpeg-js`/`pngjs`. T-022 must follow this split so its tests never touch
  binary deps.
- **Test idiom** (`src/color/*.test.mjs`): `node:test` + `node:assert/strict`, comment-bannered
  groups, expectations derived independently of the code under test; synthetic RGBA buffers built
  inline. T-021's `palette-extract.test.mjs` is the closest template.
- **CLI idiom** (`scripts/extract-palette.mjs`): hand-rolled `parseArgs`, `--whitelist file|ids`,
  `--json`, human table by default; wired as an npm script (`palette:extract`). T-022's CLI mirrors it.
- **Output policy:** renders/visualizations are **gitignored, local-only** (`concepts/`,
  `benchmarks/.../runs/`). The block-grid viz PNG must land under a gitignored path; the durable
  record is the journal (`docs/knowledge/design-learnings.md`).

## Constraints & assumptions surfaced

- **Dithering OFF** (ticket): per-cell nearest match only — no error diffusion. Clean flat color
  fields. Simplifies the core to one `nearestLab` per filled cell.
- **N is a parameter, default 48** (held-constant concept-series resolution). M derives from aspect:
  `M = round(N · H / W)`. This *is* the "detail capped at resolution" thesis — the grid is the cap.
- **Air cells exist.** A silhouette on black means many cells are background. They must map to
  *nothing* (null/air), not to the nearest block to black — otherwise the grid is a solid rectangle
  and palette-adherence/coverage numbers are meaningless. Need a per-cell foreground-coverage
  threshold deciding filled vs. air.
- **Palette adherence is zero by construction in validate mode** (`nearestLab` can only return a
  whitelist key) — but the ticket requires it be *computed and tested*, not assumed. The check must be
  an explicit count over the produced grid, asserted `=== 0`.
- **Extracted-vs-declared** is a set comparison: discover-mode used-blocks vs. the manifest →
  `{present, missing, added}`. To be recorded for one real concept in the journal.
- **Determinism:** like T-021, identical input must yield byte-identical output (no `Math.random`,
  stable cell iteration, stable sort). Verified expectation, not just hope.

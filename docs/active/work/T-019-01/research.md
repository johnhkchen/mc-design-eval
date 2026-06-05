# T-019-01 — Research: block→Lab color table

Descriptive map of what exists and what the ticket touches. No solutions here.

## Ticket in one line

Build a cached **block→Lab color table** from `minecraft-assets` (1.20.1) for every
full-cube, survival-obtainable block: representative color = mean of opaque texture pixels
(side face for directional, first frame for animated) → CIE L\*a\*b\*. Output is the data the
S-020 color engine and S-021 palette extractor consume.

## Where this sits in the epic

- **E-10** = block palette + CIE-Lab matching. DAG: T-019-01 (this) and T-020-01 (portable
  color engine, `src/color/cielab.mjs`) are the two **wave-0** tickets, `depends_on: []`,
  running in parallel on the same branch. T-021/022/023 are serial downstream.
- The governing research is `docs/knowledge/cielab-block-matching.md`. It is prescriptive
  about the math (sRGB→linear→XYZ(D65)→Lab, CIE76 ΔE) and about the table's gotchas
  (directional/animated/tinted/alpha/non-full-cube). This ticket is the **"Minecraft adapter"**
  half of that doc; T-020 is the project-agnostic engine half.
- Because T-019 and T-020 are parallel and both need an sRGB→Lab conversion, T-019 cannot
  import `src/color/cielab.mjs` (may not exist yet). It must embed its own conversion.
  S-023 (consolidation) is the ticket that later de-dupes the two. This is by design.

## The asset source: `minecraft-assets`

Confirmed facts (probed against the copy installed in `render/node_modules`):

- **Not installed at the repo root.** Deps at root are `@boundaryml/baml` (dep) and
  `ajv`/`ajv-formats`/`tsx` (dev). `minecraft-assets@1.17.0` + `minecraft-data@3.110.2` live
  only in the **`render/` sub-package** (`render/node_modules`), which is a separate npm
  project. The render harness uses them for `prismarine-viewer` textures.
- **No 1.20.1 dataset.** v1.17.0 ships `1.19.1`, `1.20.2`, `1.21.x`, … but **not** `1.20.1`.
  The package's exported function resolves `"1.20.1"` to the **last-of-major** = **`1.20.2`**.
  1.20.1↔1.20.2 block textures are identical for our purposes, but the table must record the
  *effective* version (`1.20.2`) so the provenance is honest.
- **Loadable API.** `import mcAssets from 'minecraft-assets'` (default import; `module.exports`
  is a function) then `mcAssets('1.20.1')` returns an object exposing:
  `directory` (absolute path to `.../data/1.20.2/`), `version` (`"1.20.2"`), `blocksModels`,
  `blocksTextures`, `blocks`, `getImageContent(name)` (base64 data-URI of a texture), etc.
- **The "CJS-require gotcha" (memory + research doc).** The package is CommonJS; the root is
  ESM (`"type":"module"`). Default-import interop works, but the robust path the ticket
  endorses is to **resolve `.directory` and read the data files directly** — no reliance on the
  package's internal `require` graph. Texture PNGs live under `<directory>/blocks/<name>.png`.

## The data shape (probed)

Two JSON indexes + a directory of PNGs, all under `<directory>`:

- **`blocks_models.json`** — `name → { parent, textures, [elements] }`. This is the authority
  for *cube-ness* and *which face*:
  - `parent: "minecraft:block/cube_all"` → single texture `textures.all` (e.g. `stone`,
    `gold_block`, `cobblestone`, `bricks`, `oak_planks`, `glass`, `sea_lantern`).
  - `parent: "minecraft:block/cube_column"` → directional, side face `textures.side`
    (e.g. `oak_log`, `quartz_block`).
  - `parent: "minecraft:block/cube_bottom_top"` → side face `textures.side` (e.g. `sandstone`).
  - Distribution of `block/cube*` parents (1.20.2): `cube_all`×246, `cube_column`×67,
    `cube_column_horizontal`×20, `cube_bottom_top`×20, `cube`×11, plus a long tail
    (`cube_column_uv_locked_*`, `cube_mirrored*`, `cube_directional`, `cube_top`, …).
  - **Texture refs** look like `"minecraft:block/oak_log"` or `"block/dirt"` → strip the
    `minecraft:` / `block/` prefix → PNG file stem.
- **`blocks_textures.json`** — array of `{ name, blockState, model, texture }`. Its `name` set
  is the list of **real blocks** (use it to intersect the model keys, so we don't treat model
  *templates* as blocks).
- **`blocks/` directory** — 928 PNGs. Probed IHDRs reveal a **color-type/bit-depth zoo**:
  - color types: indexed(3)×744, RGBA(6)×155, RGB(2)×19, gray(0)×8, gray+alpha(4)×2.
  - bit depths: 8×315, 4×581, 2×31, 1×1 — i.e. indexed PNGs use **sub-byte packing** and
    carry `PLTE` (+ `tRNS` for palette alpha).
  - **Animated** textures are vertical strips: `sea_lantern.png` is 16×80 (5 frames),
    accompanied by a `.png.mcmeta`. First frame = the top `width × width` block.

## What "full-cube survival-obtainable" resolves to (probed)

- Filtering model keys (∩ real-block names) to `parent` starting `block/cube*`, then dropping
  any model carrying `tintindex`, yields **308** candidate blocks.
- **Biome-tinted blocks fall out for free.** `oak_leaves`/`birch_leaves`/… use
  `parent: block/leaves` (not cube\*); `grass_block` uses `block/block` with `tintindex`;
  `vine`/`water`/`lava`/`lily_pad` are non-cube. None reach the cube filter. (0 tinted models
  survived the cube filter in the probe.) The greyscale-tint hazard is therefore mostly handled
  by the cube filter; a small explicit tint denylist is still warranted as belt-and-suspenders.
- **Most technical blocks fall out for free too.** `command_block` (`template_command_block`),
  `barrier`/`light` (item-particle only), `jigsaw`/`structure_block` are non-cube. A few
  **full-cube non-survival** blocks remain (`spawner` — transparent cage cube_all;
  `infested_*` — cube_all clones of stone textures), which need a small explicit denylist.
- `redstone_block` (cube_all, red) is a clean extra sanity-test candidate.

## Existing conventions to match

- **Module style:** ESM `.mjs`, heavy top-of-file doc comment explaining *why* (see
  `src/palette.mjs`, `src/config.mjs`). Pure functions separated from I/O; I/O reads by file
  path, not by importing sibling node_modules.
- **Tests:** `node:test` + `node:assert/strict`, files `*.test.mjs` colocated in `src/`. The
  `test:unit` script globs `src/**/*.test.mjs`; root `npm test` runs validate + `test:unit`.
  Offline, deterministic, derive expectations independently (see `src/palette.test.mjs`).
- **CLIs:** live in `scripts/*.mjs` (`validate-artifact.mjs`, `run-trial.mjs`), wired as npm
  scripts.
- **Gitignore:** `node_modules/`, `trials/`, `baml_client/`, benchmark renders. There is **no**
  rule yet for a color-table output; a small committed JSON is consistent with how palettes
  (`palettes/*.json`) are committed.

## Constraints & assumptions

- No PNG decoder is present anywhere (`pngjs` is **not** installed — an earlier `find` hit was a
  false positive from exit-code chaining). Node's built-in `zlib.inflateSync` exists, but a
  hand-rolled decoder would have to cover 5 color types × 4 bit depths × PLTE/tRNS × 5 filters.
- **Network is available** (`npm view pngjs version` → `7.0.0` succeeded), so adding a
  dependency is viable.
- The downstream consumer (S-020 engine, S-021 extractor) wants **data**, not the texture
  toolchain — so whatever decode/asset deps this ticket adds should not leak into the runtime
  color engine.
- "Survival-obtainable" cannot be derived perfectly from assets alone (no items/loot graph at
  hand); the real obtainability gate downstream is the palette manifest whitelist (§6/S-021).
  This ticket's job is a *broad, honest, documented* full-cube table, not a curated palette.

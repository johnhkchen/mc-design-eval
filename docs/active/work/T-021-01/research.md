# T-021-01 — Research: canonical palette extraction

The headline E-10 deliverable (story S-021): given a facade concept image, produce the
**canonical block palette** it uses — an ordered `{block, repColor, coveragePct}[]` plus a
one-line human description. This maps every region of the image to a real, survival-obtainable
Minecraft block, in CIE-Lab space. Descriptive survey below; decisions are deferred to design.

## What already exists (the two dependencies, both merged)

**S-020 color engine — `src/color/cielab.mjs`** (commit `526d5bb`). Pure, zero-project-import
math core. Exports:
- `srgbToLab([r,g,b])` — 8-bit sRGB (0–255) → CIE L\*a\*b\* (D65). Validates range, throws on bad input.
- `deltaE76(lab,lab)` / `deltaE` (alias) — Euclidean ΔE in Lab.
- `nearest(rgb, palette, { metric })` — argmin ΔE over `palette: [{key, lab}]`, returns
  `{ key, deltaE, lab }`. **Converts the rgb target to Lab internally**, then scans.
- The T-020 review (open concern #3) explicitly anticipates this ticket: *"If a future caller
  already holds Lab, add a thin `nearestLab(lab, palette)` rather than range-sniffing."* Our
  cluster centroids live in Lab — this is that caller.

**S-019 block→Lab table — `src/color/block-table.mjs` + `block-lab-table.json`** (commit `4ffe3ca`).
Committed runtime table, **305 blocks** (455 excluded), each `{ block, texture, rgb:[3], lab:[3] }`.
`lab` is rounded to 3 decimals. Loaded dep-free via `loadBlockTable()` → `{ version, requestedVersion,
generatedFrom, blocks[], excluded[] }`. The set is `full-cube ∧ ¬tinted ∧ ¬denylisted` — exactly
the "full survival full-cube set" the ticket's discover-mode matches against. Effective version
`1.20.2` (resolved from requested `1.20.1`).

## The data we feed it: concept images

`benchmarks/temple-facade/concepts/` — 18 files. Five benchmark facades (taj, horyuji, chapelle,
arc, mausoleum) × variants A/B/C plus a few `-base`/`-seg`. The locked stage-1 default is **variant
C, Flash** (per `design-learnings.md` T-017-01 handoff): single front-elevation subject, centered
with margin, on a **pure-black `#000000` field** with a bright high-contrast silhouette, block-scale
ornament only (resolution-disciplined).

⚠️ **Format surprise (verified):** despite the `.png` extension these are **baseline JPEG**
(`file` reports `JPEG image data, JFIF … baseline`; magic `FF D8`). `pngjs` rejects them
(`unrecognised content at end of stream`). `taj-C-flash.png` is 1024×1024; `taj-A-flash.png` is
1265×832. The background is **near**-pure-black, not exact: corner pixel decodes to `[1,1,1]`
(JPEG quantization noise around `#000000`). Center samples are chromatic (`[31,69,57]`). Two
consequences for design: (1) the decode layer must handle JPEG, not just PNG; (2) background
removal needs a **tolerance**, not an exact `=== [0,0,0]` test.

## Decode options surveyed

- `pngjs@7` — installed (root devDep, used by `block-table.mjs`). PNG only; **rejects the JPEGs**.
- `jpeg-js` — pure-JS baseline-JPEG decoder, **no native build**. Verified in this repo: installs
  clean, `jpeg.decode(buf,{useTArray:true})` returns `{width,height,data: RGBA Uint8Array}`,
  decoded `taj-C` to 1024×1024×4 bytes correctly. The natural sibling to `pngjs` (both pure-JS,
  both devDeps, both decode-to-RGBA).
- `render/node_modules/canvas` (node-canvas) — present but inside the **render/ subpackage**;
  importing across the package boundary couples this module to render and pulls a native dep.
- `sharp`, `jimp` — not installed.

## Repo conventions this work must match

- **ESM `.mjs`, Node 20+.** No build step; `node --test "src/**/*.test.mjs"` auto-discovers suites
  (`npm test` runs validate + `test:unit`). Current suite: **166 tests green** across the color layer.
- **Test idiom** (`src/color/*.test.mjs`): `node:test` + `node:assert/strict`, grouped with comment
  banners, expectations **derived independently of the code under test** (Group A pins math to the
  CIELAB definition; Group C asserts color *properties* of the committed table, not re-runs of the
  builder). Synthetic pixel buffers are built inline as `{width,height,data:Uint8Array.from([...])}`
  (see `block-table.test.mjs` `png()` helper) — the pattern our synthetic-image test reuses.
- **Build-time deps imported lazily** so they never leak onto the portable/runtime path
  (`block-table.mjs` lazy-imports `minecraft-assets`/`pngjs` inside `resolveAssets`/`buildBlockTable`;
  the runtime `loadBlockTable` pulls zero asset deps). The decode dep should follow this: lazy,
  isolated to a decode helper, off the pure-pixel core.
- **Scripts in `scripts/`** are thin CLI wrappers over a `src/` module + an `npm run` alias
  (`build:block-table` → `scripts/build-block-table.mjs` → `buildBlockTable`). The palette CLI
  follows that shape.
- **Portability boundary is load-bearing** (cielab.mjs header, T-020 review). The engine must stay
  project/Minecraft-free. The *extractor* is the application layer and may import the table + a
  decoder; it must not pollute `cielab.mjs` with anything beyond the anticipated `nearestLab`.
- **`palette.mjs`** (root `src/`) is **unrelated** — it formats a hand-authored style *whitelist*
  for prompts (T-004-02). Name collision only; not a base to build on. But its whitelist files
  (`palettes/<id>.json`, field `blocks: string[]`) are the natural source for the ticket's
  **whitelist mode** (validate a declared manifest) if we want a real example.

## The technique (from `docs/knowledge/cielab-block-matching.md`)

Application point #1, "concept image → real-block palette." Governing notes: match **in Lab**
(perceptually uniform, unlike RGB); **CIE76** ΔE is sufficient, keep it pluggable; representative
color = mean of opaque pixels; **argmin ΔE** over the palette; palette is small (linear scan fine —
we only match K≈6–12 centroids, not every pixel, so no k-d tree needed); **dithering off** for
clean architectural color fields. Background/biome-tint handling: exclude. The doc frames the
palette-vs-fidelity tradeoff (fewer blocks = larger color error) as itself a measurable design lever
— which is why the ticket wants both **discover** (full set) and **validate** (whitelist) modes.

## Ticket shape, restated against the above

Pipeline: **decode** (JPEG/PNG → RGBA) → **drop background** (near-`#000000`, tolerance) and
transparent pixels → **cluster foreground in Lab** (median-cut or k-means, K≈6–12) → per centroid
`nearest`/`nearestLab` to the table (full set *or* whitelist subset) → **merge** centroids hitting
the same block (sum coverage) → sort by coverage → emit `{block, repColor(hex+lab), coveragePct}[]`
+ one-line description.

## Constraints & assumptions surfaced

- **Determinism is required for testing.** k-means needs seeding/`Math.random`; median-cut is
  deterministic by construction. The independent-expectation test idiom strongly favors a
  deterministic clusterer.
- **The core must be decode-agnostic and dep-free** to stay unit-testable on synthetic RGBA buffers
  (no JPEG fixture committed). Decode is a separable shell.
- **Black blocks are collateral.** Dropping near-black background also drops any near-black
  *foreground*. Acceptable: the locked stage-1 prompt forbids black/dark backgrounds *and* mandates
  bright silhouettes, so foreground is not pure black. Must be documented, and `dropColor` made a
  parameter so a non-black-bg image can opt out.
- **Coverage is of the foreground** (post-background-drop), not the whole frame — otherwise a large
  black margin dominates the percentages.
- **Centroids are Lab; the table is Lab.** Matching should use Lab directly (`nearestLab`), not
  round-trip a mean-rgb back through `srgbToLab` (double conversion, small error). This is the one
  sanctioned `cielab.mjs` addition.
- **`npm test` must stay green** (currently 166); the new suite adds to the glob automatically.

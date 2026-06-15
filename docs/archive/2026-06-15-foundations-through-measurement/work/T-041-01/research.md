# T-041-01 — Research: value-matched-build

Story S-041, epic E-14 — the **build end**. Descriptive map of the code this ticket wires together.
No solutions here; just what exists, where, and the constraints that bound the design.

## The problem (from the E-13 frontier + the moai value case)

E-13 measured that on angular sculptural forms the dominant failure was **value drift**: the model
names a block by *hue*, the concept previews a *hue*, and only the render exposes the block's true
*value* (L\*). The documented case is the **moai** — faithful form, but `gray_concrete` (L\* ≈ 24)
rendered far darker than the medium-gray the concept showed. T-039-01 (S-039) built the shared
**value-honest contract** (`resolveValueTruePalette`) that pins name→true-value up front. S-040 wires
it into concept generation. **This ticket wires it into the live build:** after the model proposes the
artifact, make *placement block choice* hit the **concept's realized value**, not the model's name.

Division of labor (ticket): the **model owns form + where** (region → intent); the **engine owns
which block** hits that region's value. So the build *prompt* does not change — only a post-build,
pure block-substitution step is added.

## The build path (where the change lands)

- **`benchmarks/sculpture/run.mjs`** — the LIVE, metered, GL runner. `runVConcept()` chains: stage 1
  design doc (`requestText`) → stage 2 ONE 3/4 concept image (`runBamlConcept` → `concept.png`) →
  stage 3 3-D build (`requestDesignArtifactWithImage` → `res.artifact`). Then `main()` writes
  `artifact.json`, renders `render-3q.png` (`renderArtifact`, `SCULPTURE_VIEW_3Q`) + a rock turntable,
  and writes `summary.json` + regenerates the README gallery. This is I/O + the live seam + rendering
  only; **prompt wording lives in `src/sculpture.mjs`**. The concept image (`concept.png`) is already
  saved in every run dir — the realized-palette source is on disk.
- **`src/sculpture.mjs`** — pure, unit-tested prompt builders + the archetype descriptor
  (`VCONCEPT_SCULPTURE`, id `vconcept-sculpture.v1` single-sourced from `config.mjs`). `.v1` versions
  the doc/concept/build prompt construction; "any change that could move results bumps it → `.v2`".
  `composeSculptureBuildPrompt` already tells the model to honor "its dominant/supporting/accent
  palette hierarchy" — the model still chooses *names*; we will re-choose the *blocks* after.
- **`src/config.mjs`** — single-sources every method id, incl. `VCONCEPT_SCULPTURE_METHOD_ID`. A `.v2`
  id belongs here (the established pattern: "one spelling … a Phase-2 sweep stays greppable").

## What a DesignArtifact looks like (the thing we rewrite)

- **`src/artifact.mjs`** + `schema/design-artifact.schema.json` — the validated shape. Relevant:
  - `palette.manifest`: `blockId[]`, **namespaced** (`minecraft:gray_concrete`), `uniqueItems`.
  - `placements[]`: each has `op` (`voxel|line|box|fill`), coords, and **`block`** (namespaced
    `blockId`) + optional `state`. `block` is the field the snap rewrites; placement array order is
    application order (preserve it). Schema enforces shape only — **not** whitelist membership.
  - Table ids are **bare** (`gray_concrete`); artifact ids are **namespaced**. Normalize before any
    table lookup (the same mismatch T-039-01 flagged as the most likely silent bug).

## The color engine to reuse (all GL-free, network-free, already proven)

- **`src/color/value-palette.mjs`** (T-039-01, my dependency) — `resolveValueTruePalette(input, opts)`
  → `{ schema, card[], manifest, snappedCount }`. Each card row: `{ name, block, hex, rgb, lab,
  value (L\*), snapped, deltaE }`. **This is the value-honest anchor for a model-named block** — a
  real block passes through as itself; a non-cube/imaginary name (`honey_block`, `oak_stairs`) snaps to
  a real full-cube block. Exports `normalizeName`, `hexToRgb` too.
- **`src/color/palette-extract.mjs`** — `extractPaletteFromImage(path, {k})` →
  `{ palette:[{ block, repColor:{hex,rgb,lab}, coveragePct, deltaE, blockColor }], description, … }`
  (discover mode = match each realized color cluster to the nearest real full-cube block). **PNG decode
  is pure pngjs — NO GL.** This is the *realized palette* source the ticket names: each cluster's
  `block` is already the value-true block for that realized color; `repColor.lab` is the realized value.
- **`src/color/image-grid.mjs`** — `gridFromImage(path,{n})` → spatial N×M grid of value-true blocks.
  The ticket names it as an alternative; it carries per-cell color but **no placement↔pixel mapping
  exists**, so a grid cannot be aligned to 3-D placements. The dominant-palette extractor is the usable
  source; the grid is for a 2-D facade.
- **`src/color/cielab.mjs`** — `nearestLab(targetLab, palette)` → `{key, deltaE, lab}` (argmin ΔE).
  The snap primitive; imports nothing (reuse-boundary guarded — must not be touched).
- **`src/color/block-table.mjs`** / `block-lab-table.json` — 305 real, survival, full-cube, untinted
  blocks; "in the table" ⟺ "real value-true block". Loaded once at import by the extractor/resolver.

## Render seam (the GL/metered part of the A/B)

- **`render/src/render-tool.mjs`** — `renderArtifact(artifact, {outPath, view})`; exports `GL_AVAILABLE`
  (probed **true** in this environment). `src/render-tool.mjs` `renderSummary(report)` → `{placed,
  unmapped, bounds}`. The render is the only GL step; the snap + extraction are pure/cheap.

## Empirical grounding (offline probe of committed runs — no model, no GL)

Ran `extractPaletteFromImage` + `resolveValueTruePalette` over the committed moai/sword/pineapple runs
and computed a **hue-anchor snap** (each model block's value-honest Lab → `nearestLab` over the
realized clusters → that cluster's value-true block):

- **moai (001):** `gray_concrete` L24.3 → `deepslate_bricks` L29.8 (**+5.5**, the drift cure);
  `andesite/cobblestone_stairs/stone_bricks` → `copper_ore`/`copper_ore` (collapse — concept has fewer
  distinct mid-grays than the manifest); `red_nether_bricks` → `chiseled_nether_bricks`.
- **sword (007):** `iron_block`,`polished_andesite`,`gold_block` ≈ no-op (already value-true);
  `dark_oak_log` → `spruce_log` (−5), `stone` → `polished_andesite` (+3.2).
- **pineapple (013):** `honey_block`→`hay_block` (value-honest already = hay_block, realized matches),
  `lime_concrete`→`melon`; oranges/greens ≈ stable.

This confirms: the snap **cures the moai body value** modestly and honestly, sometimes **collapses**
several model blocks onto one realized cluster (a real tradeoff to surface), and is **deterministic**.

## Constraints & assumptions surfaced

1. **No placement↔pixel mapping.** The model emits 3-D placements with block *names*, the concept is a
   2-D image. Association of a placement to a realized color must go through the *name's* value-honest
   color (the bridge), not pixels. The extractor's dominant palette — not the grid — is the source.
2. **A real block can still be value-true** → the snap must be a no-op when the model's choice already
   matches the realized value (honest "nothing to fix"), and must show regressions honestly.
3. **Additive.** `.v1` artifact/render must stay byte-identical; the value-matched output is new files
   + a `.v2` method id. AC1 is explicit.
4. **Determinism.** `nearestLab` + the extractor's deterministic median-cut + stable iteration ⇒ a
   reproducible swap. No `Math.random`/`Date` in the snap.
5. **Test boundary.** The block-choice logic is pure (table read + arithmetic) ⇒ unit-tested under the
   `src/**/*.test.mjs` glob with no model/GL/network. The A/B *render* is GL/metered (AC accepts this).
6. **The A/B needs no live model** — committed `artifact.json` + `concept.png` per run let the A/B run
   offline; only the value-matched *render* spends GL.

# T-039-01 — Research: value-true-palette-snap

Story S-039, epic E-14. Descriptive map of the codebase regions this ticket touches.

## The problem this ticket addresses (from the E-13 frontier)

E-13 measured that on angular sculptural forms the dominant failure was **value drift**, not
structure or palette identity. The design doc *names* a block (`gray_concrete`), the concept
preview shows a *hue*, and only the final render exposes the block's true *value* (L\*). The three
views were never pinned to a single source of truth, so a block whose name sounded right rendered
far darker/lighter than intended and capped the score. S-039 builds the **shared color contract**
that pins all three to the committed block→Lab table up front, before any concept or build runs.

## Existing color engine (`src/color/`) — what to reuse

The directory is already a layered, well-bounded color stack from epic E-10. Everything this
ticket needs exists; nothing new in the *math* is required.

- **`cielab.mjs`** — the portable, zero-dependency color core.
  - `srgbToLab([r,g,b])` → `[L*,a*,b*]` (8-bit sRGB in, D65 Lab out). Pure, validated input.
  - `deltaE76` / `deltaE` — CIE76 Euclidean ΔE; pluggable metric.
  - `nearestLab(targetLab, palette, {metric})` → `{key, deltaE, lab}` — argmin ΔE over a
    `[{key, lab}]` palette. **This is the snap primitive.** Linear scan; fine for the 305-entry table.
  - `nearest(rgb, palette)` — sRGB convenience wrapper over `nearestLab`.
  - **Boundary (load-bearing):** this file imports *nothing* — no relative paths, no Minecraft deps.
    Enforced by `reuse-boundary.test.mjs` (static import scan + functional proof). My new module
    must NOT add imports to this file; it imports *from* it instead.

- **`block-table.mjs`** — the block→Lab table builder + runtime loader.
  - `loadBlockTable(path?)` → the committed `block-lab-table.json` (runtime path, zero asset deps).
  - The build path (`buildBlockTable`, `resolveAssets`) lazily imports `minecraft-assets`/`pngjs` —
    build-time only, never on the runtime/test path. I will not touch the build path.
  - `classifyBlock` documents *why* a block is in or out: only `block/cube*`-parent models, with
    **no `tintindex`** (biome-tinted excluded), minus a denylist of non-survival/impostor cubes.
    Consequence: **every entry in the table is a real, survival-obtainable, full-cube, untinted block.**
    So "is a real full-cube block" ⟺ "present in the table." This equivalence is the spine of S-039.

- **`block-lab-table.json`** — the committed data. Top keys: `version, requestedVersion,
  generatedFrom, blocks, excluded`. **305** block entries; each
  `{ block, texture, rgb:[r,g,b], lab:[L,a,b] }` with `lab` rounded to 3 decimals and `rgb` integers.
  Spot-checks: `gray_concrete` ✔ present; `oak_stairs` ✘ absent (non-cube); `gold_leaf` ✘ absent
  (imaginary, never a real id). These are exactly the AC fixtures.

- **`palette-extract.mjs`** — canonical palette extraction from a concept image.
  - `resolvePalette(whitelist?)` → `{ palette:[{key,lab,rgb}], missing }`. With **no** whitelist it
    returns the full table as a ready `[{key,lab,rgb}]` candidate set — the exact shape `nearestLab`
    wants, **with `rgb` carried alongside** (so I can recover hex per matched block). The ticket
    names `resolvePalette` as a thing to reuse; this is why.
  - `rgbToHex([r,g,b])` → `"#rrggbb"` — pure, exported. Reuse for the card's `hex` field.
  - Module-loads `TABLE = loadBlockTable()` once at import; this is the established runtime pattern.

- **`image-grid.mjs`** — concept-image → block grid sampler (2-D adapter). Not directly used by
  S-039, but confirms the reuse pattern: adapters import the engine + table, never re-implement math.

## How design docs name blocks (the input side)

- **`schema/design-artifact.schema.json`** — `palette.manifest` is `blockId[]` where `blockId` is a
  **namespaced** id, regex-shaped like `minecraft:smooth_stone` (see the valid example:
  `["minecraft:smooth_stone", "minecraft:stone_bricks", "minecraft:iron_block", ...]`). The schema
  enforces shape and `uniqueItems`, **not** whitelist membership (that is E-04's job). So a manifest
  can legally contain non-cube ids (`minecraft:oak_stairs`) and even ids that don't exist.
- **Table ids are bare** (`oak_planks`), manifest ids are **namespaced** (`minecraft:oak_planks`).
  The resolver must normalize the namespace away before lookup. This mismatch is the single most
  likely silent bug.

## Test conventions & constraints

- `npm test` = artifact self-test/validate **then** `npm run test:unit` =
  `node --test "src/**/*.test.mjs"`. My new test file under `src/color/` is auto-collected by the glob.
- Existing color tests (`*.test.mjs`) use `node:test` + `node:assert/strict`, are **offline,
  deterministic, synthetic-fixture-based**, and pin values to color theory, not to re-running builders.
- AC demands the resolver run under that glob with **no model / no GL / no network**. The whole
  call chain (`loadBlockTable` reads a committed JSON; `srgbToLab`/`nearestLab` are pure arithmetic)
  already satisfies this. No Playwright/headless-gl anywhere near this path.

## Constraints & assumptions surfaced

1. **"Nearest by ΔE" needs a target color.** A bare imaginary/non-cube *name* carries no color by
   itself. The snap therefore needs a *proxy color* per unresolved name. Two sources exist: a
   caller-supplied color hint (the concept's proposed hue — the natural E-14 co-design input), or a
   color *derived from the name* (token/material match against table names). The contract must
   accommodate both; Design decides the resolution order.
2. **Real block ⇒ value is fixed.** For a name already in the table, value-honesty means returning
   *its* table value — a wished hue must not override a real block's true render.
3. **Determinism** is an explicit AC. Any name-derived snap needs a fully ordered tiebreak.
4. **The return shape is a shared contract** consumed by S-040 (concept swatch grid) and S-041
   (build target values). It must carry, per block: original requested name, the resolved real block
   id, true hex/rgb/Lab, the L\* value, and the `snapped` provenance. Design must shape it for both.
5. **Reuse boundary holds:** the new module lives in `src/color/`, imports the engine/table/extractor,
   and adds no Minecraft/GL deps — so it stays on the pure runtime/test path.

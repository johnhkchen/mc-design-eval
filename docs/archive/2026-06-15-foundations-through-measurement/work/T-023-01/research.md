# T-023-01 — Research: color-layer consolidation & reuse hook

Terminal ticket of Epic E-10 / story S-023. Gated on `T-022-01`. Goal is not new capability but
**consolidation**: prove the reuse boundary that lets Epic E-09's voxelizer reuse the color engine,
de-dupe the one known duplication, and write the stage journal. Descriptive map below.

## The color layer as it stands

Four modules under `src/color/`, layered bottom-up. Each was built by a separate `depends_on: []`
ticket in the E-10 wave (S-019/S-020/S-021/S-022); S-023 is where they are reconciled.

| Module | Story | Role | Imports (non-builtin) |
|--------|-------|------|------------------------|
| `cielab.mjs` | S-020 | **Portable engine.** sRGB→Lab, ΔE (CIE76, pluggable metric), `nearest`/`nearestLab` argmin over a palette. | **none** |
| `block-table.mjs` | S-019 | block→Lab table: build path (`minecraft-assets`+`pngjs`, lazy) + runtime `loadBlockTable` over committed JSON. | `minecraft-assets`, `pngjs` (lazy, build-time only) |
| `palette-extract.mjs` | S-021 | "which blocks does this facade use?" — decode → drop bg → median-cut cluster in Lab → match. | `cielab`, `block-table`, `jpeg-js`/`pngjs` (decode) |
| `image-grid.mjs` | S-022 | "lay this facade on a block grid" — decode → downsample → per-cell nearest block / air. | `cielab`, `block-table`, `palette-extract` |

The committed data file `block-lab-table.json` (~116 KB, 305 full-cube survival blocks) is the
runtime artifact; nothing on the hot path imports `minecraft-assets`.

## The reuse boundary (the load-bearing claim)

`cielab.mjs` is deliberately the one module with **zero project knowledge**. Its own header
(lines 5–11) states the contract: *"the one piece of E-10 with ZERO mc-design-eval / Minecraft /
DesignArtifact knowledge. It takes a palette as plain `[{ key, lab }]` data and returns a key; it
never touches block ids, artifacts, files, or the network. That boundary is load-bearing — both
application points (concept-image→grid, 2D; voxel-grid→blocks, 3D) reuse this same engine, and a
stray `../` import would quietly couple it to the project."*

Verified by inspection: `grep -nE "^import" src/color/cielab.mjs` returns **nothing** — the engine
imports neither a Node builtin nor a package. Its public surface:

- `srgbToLab(rgb)` — 8-bit sRGB → CIE-Lab (D65). Pure.
- `deltaE76` / `deltaE` (alias) — Euclidean ΔE in Lab; the default, swappable metric.
- `nearestLab(targetLab, palette, {metric?})` — argmin over `[{key, lab}]`; used by callers holding
  a Lab centroid (no rgb round-trip).
- `nearest(rgb, palette, opts)` — converts then delegates to `nearestLab`.

The palette is **caller-supplied plain data**, not loaded by the engine. That is exactly what makes
it reusable: S-021 feeds it median-cut centroids, S-022 feeds it per-cell averages, and **E-09's
voxelizer can feed it voxel surface colors** — same `nearest()`, same `[{key, lab}]` palette shape.

## The one known duplication (the consolidation target)

`block-table.mjs` carries its **own** `srgbToLab` (lines 35–75) — a full second copy of the
inverse-gamma + sRGB/XYZ matrix + Lab-companding math. This is **intentional and documented**
(lines 18–21, "DUPLICATION NOTE"):

> `srgbToLab` below mirrors the conversion that S-020's `src/color/cielab.mjs` will own. T-019-01 and
> T-020-01 are parallel `depends_on: []` tickets, so this ticket cannot import a file that may not
> exist yet. **S-023 (consolidation) is the designated de-dupe**: downstream code should depend on
> `cielab.mjs` for conversion, NOT on this.

So this ticket is the named owner of the de-dupe. Two material facts constrain it:

1. **block-table's `srgbToLab` rounds to 3 decimals** (`round3`); cielab's does not. The committed
   `block-lab-table.json` holds rounded Lab values, and `block-table.test.mjs` reads them back.
2. **The math is constant-for-constant identical** to cielab's (same matrix, same D65, same δ
   breakpoint). Verified empirically: across 4096 RGB triples, `block-table.srgbToLab(rgb)` equals
   `round3(cielab.srgbToLab(rgb))` with **max abs diff 0**. So delegating block-table's conversion
   to cielab and re-applying `round3` is provably output-preserving — the JSON would rebuild
   byte-identical, and the approximate (`≈`) srgbToLab tests stay green.

`block-table.test.mjs`'s `srgbToLab` tests assert *bands* (`L ≈ 100`, `b < -50`), not exact triples,
so they are insensitive to the refactor either way.

## Testing & invariants in play

- `npm test` = `validate-artifact --self-test` (good+bad schema examples) **then** `node --test
  "src/**/*.test.mjs"`. Current baseline: **196/196** green.
- The color-layer suites: `cielab.test.mjs` (incl. `nearestLab`), `block-table.test.mjs`,
  `palette-extract.test.mjs`, `image-grid.test.mjs`. All synthetic — no binary fixtures.
- Determinism is a standing property (extractor + grid both byte-deterministic across runs).
- No existing test asserts the *import boundary* of any module — AC1 is a genuinely new guard.

## E-09 reuse context (why the boundary matters now)

E-09 is the image→3-D-voxel pipeline (Nano Banana concept art → TRELLIS reconstruction → voxelize).
Its **stage 4** turns a voxel grid into a `DesignArtifact`: each voxel's surface needs a block id.
That is the *same* nearest-color problem the 2-D adapters solve, one dimension up. The reuse plan:
E-09 holds a per-design palette (drawn from the S-019 table, which is plain `{key, lab}` data), and
for each voxel surface color calls `nearest(rgb, palette)` → block key → places it in the artifact.
No new color math; the engine is the shared core. Confirming `cielab.mjs` stays project-free is what
makes that import safe from E-09's tree.

## Documentation surfaces

- `docs/knowledge/design-learnings.md` — the injected knowledge file. Has two E-10 worked-example
  H2 sections (T-021-01 extraction, T-022-01 grid) at the end (lines 1148, 1195). AC2 adds a
  **color-layer consolidation** section after them; AC3's E-09 handoff paragraph lives there too.
- `src/README.md` — already documents the color layer (cielab/block-table/palette-extract/
  image-grid sections); a consolidation note + boundary statement belong here.
- `docs/knowledge/cielab-block-matching.md` — the governing technique doc (referenced by every
  module header); the reuse boundary is its practical consequence.

## Constraints & assumptions

- **No behavior change permitted on the committed table.** The de-dupe must keep
  `block-lab-table.json` byte-identical (proven feasible above) — no rebuild required.
- **Direction of dependency:** engine ← table ← adapters. block-table importing cielab is the
  correct (downward) direction; cielab must never import upward. The AC1 test enforces the latter.
- **Scope discipline:** the ACs are a boundary test, a journal section, an E-09 handoff paragraph,
  and green tests. The de-dupe is the codebase's own named S-023 task (block-table note) and is the
  substance of "consolidation," so it is in scope; nothing else (no new metric, no CIEDE2000, no
  E-09 code) is.

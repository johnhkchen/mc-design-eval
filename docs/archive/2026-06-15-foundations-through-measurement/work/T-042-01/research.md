# T-042-01 — Research: codesign-ab-and-consolidate

Story S-042, epic E-14 — the **terminal link**, gated on both ends of the co-design loop
(`depends_on: [T-040-01, T-041-01]`, both `done`). The job is to run the **full loop** (palette-aware
concept → value-matched build) on the E-13 sculptural subjects, add a **concept↔render Δvalue feedback
gate**, **measure the gap closure vs the E-13 baseline**, journal it, and hand the before/after beat to
E-12. This is descriptive: what exists, where, how it connects, and the constraints the measurement
inherits. No solutions proposed here.

## The loop, as built by the two dependencies

The co-design loop has two ends, each already implemented and committed:

- **Concept end (T-040-01 / S-040).** `baml_src/conceptart.baml` gained a `SculptureConceptPrompt`
  **`.v2`** variant that consumes the value-true palette (T-039) and attaches a rendered swatch grid of
  the *real* blocks (`src/color/palette-swatch.mjs` `cardToSwatchGrid` / `buildPaletteSwatch`) as a
  multimodal input via `src/nano-banana.mjs`. The `.v1` prompt is frozen. A/B artifacts live in
  `docs/active/work/T-040-01/` (`moai.{v1,v2}.png`, `pineapple.{v1,v2}.png`, `*.ab.json`, `*.swatch.png`,
  `a-b-note.md`). Method id: `VCONCEPT_SCULPTURE_METHOD_ID_V2 = "vconcept-sculpture.v2"` (`src/config.mjs`).

- **Build end (T-041-01 / S-041).** `src/color/value-build.mjs` `snapArtifactToValueTrue(artifact,
  realized, opts)` re-chooses each placement's block so it hits the **concept's realized value**, not the
  model's name-by-hue: per distinct model-named block, hue-anchor via `resolveValueTruePalette([name])`
  (T-039), `nearestLab` over the concept's realized palette clusters, adopt that cluster's value-true
  block. Pure, GL-free, never mutates the input (`structuredClone`). Returns `{ artifact, swaps[],
  manifest, changedPlacements, realizedUsed }`; each swap row carries `valueHonestL`, `toL`, `deltaE`,
  `valueShift`, `changed`. Schema `VALUE_MATCHED_SCHEMA = "value-matched-build/v1"`.

The wiring: `benchmarks/sculpture/value-match-shared.mjs` `writeValueMatch({dir, runId, artifact,
conceptPath, k, renderArtifact, renderSummary})` is the extract→snap→write(+optional render) glue shared
by the **live runner** (`run.mjs --value-match`, default off) and the **offline A/B**
(`value-match-ab.mjs`). It extracts the realized palette with `extractPaletteFromImage(conceptPath,{k})`,
snaps, and writes `.v2` sidecars (`artifact.value-matched.json`, `value-swaps.{json,md}`) plus optionally
`render-3q.value.png`. The `.v1` outputs are byte-untouched.

## Committed artifacts the measurement can reuse (no model call needed)

Three run dirs carry both ends already (`benchmarks/sculpture/runs/`):

| run | placements | `.v1` manifest (model name-by-hue) | `.v2` manifest (value-matched) |
|---|---|---|---|
| `001-vConcept-moai` | 35 | gray_concrete, andesite, cobblestone_stairs, red_nether_bricks, stone_bricks | copper_ore, deepslate_bricks, chiseled_nether_bricks |
| `007-vConcept-a-sword` | 10 | iron_block, polished_andesite, dark_oak_log, gold_block, stone | polished_andesite, gold_block, spruce_log, iron_block |
| `013-vConcept-a-pineapple` | 124 | honey_block, orange_terracotta, green_concrete, lime_concrete | hay_block, orange_terracotta, green_concrete, melon |

Each dir holds `artifact.json` (.v1), `artifact.value-matched.json` (.v2), `concept.png`,
`render-3q.png` (.v1 render), `render-3q.value.png` (.v2 render), `value-swaps.{json,md}`. The top-level
`benchmarks/sculpture/value-match-ab.md` already tabulates per-region swaps and side-by-side render links.
**GL is available in this environment** (`render/src/render-tool.mjs` `GL_AVAILABLE === true`), so re-renders
are possible — but the renders already exist, so the consolidation can run **fully offline**.

## The measurement primitives that exist

- `src/color/cielab.mjs` — `srgbToLab`, `deltaE76` (= `deltaE`), `nearestLab(targetLab, palette)`. The
  portable ΔE core.
- `src/color/image-grid.mjs` — **`comparePalettes(usedBlocks, declaredBlocks)`** → `{present, missing,
  added}` (categorical block-id partition; NOT a ΔE). Also `gridFromPixels` reports a per-cell `meanDeltaE`.
- `src/color/value-palette.mjs` — `resolveValueTruePalette(input, opts)` → `{ card[], manifest[],
  snappedCount }`; each card row carries `{ name, block, hex, rgb, lab, value (L*), snapped, deltaE }`. The
  **value-honest contract** (T-039): a real full-cube block resolves to itself; a non-cube/imaginary name
  snaps to the real block it maps to. `normalizeName` strips `minecraft:`.
- `src/color/palette-extract.mjs` — `extractPaletteFromImage(path, {k})` → `{ palette:[{block,
  repColor:{lab}, ...}], ... }`, `describePalette`. Decodes PNG/JPEG (pngjs, no GL).

## The key constraint: render PNGs are background-dominated

Probing `extractPaletteFromImage` on the committed renders shows the **viewer scene dominates**: the moai
`.v1` render reads as `glass 79% ...`, the `.v2` render `glass 79% ...` — the prismarine-viewer sky/floor
matches to `glass`, not the sculpture. So a "realized-block palette" extracted **directly from the render
PNG** is polluted and would require sculpture/background **segmentation**. This is the "cost segmentation"
caveat the ticket anticipates.

The segmentation-free signal already in hand: by T-039's **table invariant** (the table holds only real,
survival, full-cube, untinted blocks → *a real full-cube block renders as itself*), the build's realized
values are exactly `resolveValueTruePalette(manifest).card[].lab`. So the **placed manifest at its
value-true Lab** is a faithful, GL-free proxy for "what the render shows", weighted by placement count.

## ΔE-to-target before/after — what AC1 asks for

AC1: "concept↔render ΔE before (`.v1`) vs after (`.v2`) using `comparePalettes` (realized-block palette
vs the T-039 target palette)". Decomposed:

- **reference / "concept side"** = the concept's realized palette (`extractPaletteFromImage(concept.png)`)
  — what the Nano-Banana concept *previewed*. (Resolving it through T-039 gives the achievable target.)
- **realized / "render side"** = the build's placed manifest at value-true Lab (the segmentation-free proxy).
- **ΔE_before** = palette distance(`.v1` placed values, reference); **ΔE_after** = distance(`.v2` placed
  values, reference). Gap closure = before − after.
- `comparePalettes` supplies the categorical present/missing/added; ΔE is layered on via `nearestLab`.

**Honesty constraint surfaced now (not hidden):** the `.v2` build was *snapped against this same realized
palette*, so ΔE_after is small partly **by construction**. The measurement is therefore most valuable as a
**regression/threshold gate** and as a record of the residual (under-correction from hue-anchor +
many-to-one collapse, per T-041 review §1–2), not as a surprise-free proof. The E-13 baseline verdict for
the moai is "**Competent**, faithful form, *drifted value*" (`pr/assets/sculptures.md`,
`design-learnings.md` §"Fidelity-vs-concept frontier", line ~1391).

## Where the outputs land

- `docs/knowledge/design-learnings.md` (1456 lines; last section "Fidelity-vs-concept frontier (E-13
  sculpture set, S-038)" at line 1391) — append a **value-true (E-14)** section after it.
- `pr/assets/` — the E-12 handoff desk. `frames/` holds curated `pair-*.png` stills; `sculptures.md` is
  the sculptural best-of (moai row = "Faithful form, drifted *value* … reads darker than the pale tuff").
  The before/after value beat + improved renders go here.
- `npm test` = `validate-artifact` self-tests + `test:unit` (`node --test "src/**/*.test.mjs"`).
  **Baseline: 348/348 green.** Any new pure module must carry a `*.test.mjs` under `src/color/`.

## Assumptions & boundaries

- No live model/Nano-Banana re-run is required to satisfy the ACs; the committed `.v1`/`.v2` artifacts for
  three subjects already exercise both loop ends. A live full-loop re-run is metered (model + image gen) —
  treat as optional/deferred, mirroring how T-040/T-041 gated their live paths.
- The gate must be a **pure** module (`src/color/*.mjs`) to be unit-testable under the existing glob.
- `.v1` reproducibility is a hard AC: the consolidation must be **additive** — touch no `.v1` artifact, no
  frozen prompt, no existing module's behavior.

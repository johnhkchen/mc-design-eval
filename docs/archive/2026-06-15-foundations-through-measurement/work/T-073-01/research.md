# T-073-01 — concept-refine-pass · Research

The terminal E-21 step: a **concept-grounded material-correction pass**. T-071 defined the material map,
T-072 placed it by geometric feature — but feature heuristics mis-zone some regions. This pass lets the
LLM correct material *regions* against the concept, the **material analogue of E-15's form surgical loop**,
reusing its machinery with a **material target**. This file maps what exists and how it connects. No
solutions proposed.

## The E-15 surgical loop (the machinery to reuse)

**`src/revise/loop.mjs` — `reviseLoop(artifact, opts)`** is fully **target-agnostic**. Its accept gate is a
pure numeric compare: `after > before + epsilon`. The only thing that knows *what is right* lives behind
three injectable seams:
- `score(artifact, R) => number` — THE accept signal. Default `liveFormScore(cfg)` lazy-imports the render
  stack, renders R-framed via `observeRegion`, and calls `resolveFormTarget(cfg).scoreRender(path, R)`.
- `diagnose(artifact, R, observation?)` — names a defect+route; may be async (where model work + stashing
  live). Default `proceduralDiagnose` (model-free).
- `tweakFor(route, attempt, intent) => (inRegion, sub) => placements[]` — the SYNC edit applied under the
  lock. Default `scopedTweakFor`.

Structural termination (walks a fixed region list, ≤ regions×perRegion attempts), spatial lock (an
accepted region's `subBounds` pushed to `locked`; any later region overlapping it → `locked-overlap`
skip), and a per-iteration `trace`. The input is never mutated; `current` is rebound from
`applyRegionEdit`. **P14-safe by construction.**

**`src/revise/region.mjs`** — `selectRegion(artifact, spec)` → frozen `R = {subBounds, placements,
indices, ...}` (in-region = every placement FULLY contained in subBounds). `applyRegionEdit(artifact, R,
edit)` is THE region-lock: replaces R's in-region placements, keeps everything outside R byte-identical,
re-checks every edited voxel is inside subBounds (`RegionEditOutOfBoundsError`), **rebuilds
`palette.manifest` from the placed blocks**, throws if the edit would empty the build. `observeRegion`
renders a tight crop framed on R (lazy GL).

**`src/form/form-target.mjs` — the SEAM precedent for this ticket.** `conceptFormTarget({conceptPath})`
and `glbFormTarget({glbPath})` both answer one question: `scoreRender(renderPath, R) => Promise<number>`
in [0,1]. `resolveFormTarget(cfg)` picks one (`cfg.formTarget` pass-through, else `conceptPath`). E-16
swapped concept→GLB with **zero loop change** — the proof that a new target plugs in here. A material
target is the exact analogue.

**`src/revise/form-edit.mjs` — the EDITOR precedent.** `makeFormEditor()` returns `{diagnose, tweakFor,
stash, proposals}` sharing a private stash. The crux: the loop applies the tweak **synchronously** but a
model call is **async** — so the async `diagnose` does the model work and STASHES the proposed edit
(keyed by `regionKey(subBounds)`); the sync `tweakFor` REPLAYS it. The router: `relief`/`material` routes
→ procedural; any other → the LLM editor. `applyFormEdit(inRegion, subBounds, ops)` is the PURE edit-op
core over `{add, remove, move, swap}` — each bounds-checked (`placementInBounds`), an over-reaching op
**rejected** (recorded, never thrown), never empties a non-empty region. `defaultProposeEdit` is the live
leaf: spawns `baml-revise.mts` with the crop + indexed in-region placements.

**`src/revise/tweak.mjs`** — `proceduralDiagnose`, `boxesIntersect`, `scopedTweakFor`. Already has a
**`materialPass`** (a block swap of every in-region voxel — positions byte-identical, geometry unchanged)
and a `material` route. That is the recolor primitive in spirit, but whole-region uniform; the LLM editor
proposes per-placement swaps.

## The material side (T-071 + T-072, the upstream)

**`src/form/material-map.mjs`** — PURE parse/validate of the multimodal map. Exports `PLACEMENT_RULES`
(closed: walls, corners-edges, roof, base, trim, openings), `parseMaterialMap`, `paletteFromMap`
("defines E-21's allowed palette"), `isKnownBlock` (table membership, injectable table),
`normalizeBlock`, `nearTonePairs`/`preservesDistinctGreys`. **Axiom (stated here): two distinct block ids
ARE two distinct materials** — the basis for a "distinct material role" check. `baml_src/materialmap.baml`
+ `src/form/baml-material-map.mts` are the live bridge.

**`src/form/feature-classify.mjs`** — `classifyFeatures(occupancy) → Map<cell, feature>`,
`assignFeatureBlocks`, `FEATURE_RULE`, `featureBlockMatrix`. The pure core T-072 uses.

**`benchmarks/sculpture/material-assign.mjs`** — T-072's IMPURE runner. Voxelize GLB → classify → assign
→ render → write `material-assign/gatehouse/artifact.json` (an AJV-valid DesignArtifact, manifest =
`[cobblestone, dark_oak_log, dark_oak_planks, deepslate_tiles, stone_bricks]`) + `gatehouse.json` (record
+ matrix + verdict). **This artifact is this ticket's input "before".**

**`src/form/palette-augment.mjs`** — E-19/E-18 gated secondary palette: `augmentPalette/augmentReport`,
cap `K=2`. The "≤2 gated secondary (E-19)" in the palette policy. PURE, takes a decoded texture.

## Concept + design-doc assets (the target source)

`benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/`
holds `concept.png` (the grounding image — the material target source) and `design-doc.md` (palette §3:
stone_bricks walls, cobblestone banding/buttress, deepslate_tiles roof, dark_oak_log accent). The
material map's `gatehouse.json` records `generatedFrom.concept` pointing at this same `concept.png`.

## The color engine (deterministic metric building blocks)

`src/color/cielab.mjs` — `srgbToLab`, `deltaE`(76), `nearestLab`, `nearestFlat`, `FLAT_LAMBDA`.
`src/color/palette-extract.mjs` — `decodeImage(path)` (RGBA), `aggregateForeground(img, opts)` (sky/bg
drop), `medianCutLab(points, k)` (dominant clusters), `DEFAULTS`. The same primitives `palette-augment`
and the silhouette metric compose. No new color math is needed — a region-color-agreement metric is a
thin composition over these.

## BAML transport

`baml_src/revise.baml` (`ReviseRegion`, the op-union form editor) and `materialmap.baml` (`MaterialMap`,
multimodal) are the two relevant precedents. The transport idiom (every fn): BAML renders the prompt,
`claude -p` (subscription) runs it via `requestTextWithImage` in the `.mts` bridge, `b.parse.X` parses.
`baml_client/**` is gitignored (`npm run baml:gen`). The metered `.mts` bridges are NOT unit-tested.

## Constraints & assumptions surfaced

- **The accept gate must be deterministic** (the loud E-15 lesson: model variance confounds a hill-climb;
  the form loop's gate is deterministic silhouette IoU, the model only PROPOSES). A material accept gate
  has to be a deterministic colorimetric agreement, not a per-iteration LLM judgment.
- **Recolor-only / no geometry** (AC#1) ⇒ the edit vocabulary is **swap only** — a subset of
  `applyFormEdit`'s ops; positions byte-identical, so the form/silhouette is untouched by construction.
- **Palette policy** (AC#2/#3): allowed = design-doc manifest ∪ ≤2 gated secondary ∪ LLM
  concept-justified additions. "Off-palette" checked against THIS augmented set. The distinct-material-
  role gate is NOT a tonal gate (near-tone is the *point*); by the codebase axiom it is "a block id not
  already in the allowed palette, carrying a concept justification."
- The gatehouse GLB + concept.png are gitignored/run-local; an absent asset must be a skip, not an error
  (the runner idiom). The committed JSON/MD record + `--offline` re-verify is the durable proof.
- `npm test` must never pull GL or a metered call — the pure core (metric, palette policy, swap-apply)
  is unit-tested; the live multimodal call + render are exercised by the committed run only.

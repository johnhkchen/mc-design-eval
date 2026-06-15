# T-071-01 — llm-material-map · Progress

All six plan steps complete. `npm test` green (691 cases). The live metered sweep ran in-session and
both saved maps preserve near-tone-distinct materials. Branch: `main`.

## Step log

### Step 1 — BAML function + regenerated client ✅
- `baml_src/materialmap.baml`: `enum PlacementRule { Walls CornersEdges Roof Base Trim Openings }`,
  classes `MaterialRole` / `MaterialMapResult`, fn `MaterialMap(design_doc, concept: image)`. Prompt
  carries the anti-collapse directive + palette-prior-not-cap + the closed placementRule vocab.
- `npm run baml:gen` → `b.request.MaterialMap` / `b.parse.MaterialMap` present in `baml_client/`.
  `baml_client/` is **gitignored** (regenerate via `baml:gen`), so only the `.baml` is committed.
- Commit `e…`: `feat(E-21 T-071-01): MaterialMap BAML fn …`.

### Step 2 — Pure core `src/form/material-map.mjs` ✅
- `PLACEMENT_RULES`, `PLACEMENT_RULE_MAP`, `normalizePlacementRule`, `normalizeBlock`, `isKnownBlock`,
  `parseMaterialMap`, `assertMaterialMap`, `paletteFromMap`, `nearTonePairs`, `preservesDistinctGreys`,
  `MaterialMapError`. Membership against the E-10 block→Lab table; namespace boundary via `material.mjs`.
- Collect-don't-throw: bad rows → `dropped`; dedup on `(block, placementRule)`; never merges by color.
- Commit: `feat(E-21 T-071-01): pure material-map parse/validate core`.

### Step 3 — Unit tests `src/form/material-map.test.mjs` ✅
- 15 cases: vocab freeze, normalizers, membership (real + injected stub), parse happy/drop-unknown-
  block/drop-bad-rule/dedup/palette/stats/missing-array, assert, palette, nearTonePairs,
  preservesDistinctGreys (true on gatehouse, false on single/far-tone). No live import.
- `npm test` → 691 pass. Commit: `test(E-21 T-071-01): material-map core unit tests (15 cases)`.

### Step 4 — Live bridge `src/form/baml-material-map.mts` ✅
- Mirrors `baml-review.mts`. **DEVIATION (renamed):** plan called it `material-map.mts`; tsx swaps
  `.mjs`→`.mts` on import when a same-basename `.mts` exists, so `import "./material-map.mjs"` resolved
  to the bridge itself (`PLACEMENT_RULE_MAP` "not exported"). Renamed to **`baml-material-map.mts`**
  (the `baml-` prefix the other bridges already use), which fixes resolution. Import/syntax smoke
  (empty stdin → fails at `JSON.parse`, after imports load) passes.
- Commit: `feat(E-21 T-071-01): live tsx bridge for MaterialMap (baml-material-map.mts)`.

### Step 5 — Cottage doc + runner + npm script ✅
- `benchmarks/sculpture/runs/014-vConcept-a-cottage/design-doc.md` authored from the concept (the
  cottage had only `concept.png`); names the visible near-tone materials as a prior.
- `benchmarks/sculpture/material-map.mjs` (live + `--offline`); `"material:map"` npm script.
- `--offline` path verified on a seeded `gatehouse.raw.json` (write path, no live call) before the
  live run. Commit folded into Step 6's commit.

### Step 6 — Live run → saved maps (metered) ✅
- `npm run material:map` ran live (`claude -p` subscription, multimodal). Both subjects written:
  `material-map/{gatehouse,cottage}.{json,raw.json}` (committed — JSON is the durable record; no PNGs).
- **Gatehouse**: 5 distinct, `preservesNearTone=true`. stone_bricks (walls) AND cobblestone (corners)
  kept apart — `nearTonePairs` records their ΔL=2.08 (the exact collapse a mean-color match merges).
  Also deepslate_tiles roof, dark_oak_log voussoir, dark_oak_planks door. 0 dropped.
- **Cottage**: 7 distinct, `preservesNearTone=true`. stone_bricks+cobblestone, dark_oak_log (timber)
  vs spruce_planks (roof) vs dark_oak_planks (eaves), white_terracotta plaster, bricks chimney. 3
  dropped: `spruce_door`, `dark_oak_trapdoor`, `lantern` — non-full-cube fixtures absent from the
  full-cube survival table; collect-don't-throw caught them, recorded in `dropped`.
- Commit: `feat(E-21 T-071-01): material-map runner + cottage doc + saved maps (live run)`.

## Deviations from plan
1. **Bridge renamed** `material-map.mts` → `baml-material-map.mts` (tsx basename-swap; see Step 4).
2. The gatehouse live reply varies run-to-run (model is non-deterministic). The committed map (5
   entries) differs slightly from an earlier exploratory call (8 entries) — both preserve the
   stone_bricks/cobblestone distinction. The committed one is the authoritative artifact.

## AC status (all met)
- AC#1 multimodal BAML fn → structured map: `materialmap.baml` + bridge ✅
- AC#2 preserves near-tone (gatehouse stone_bricks AND cobblestone): committed map + `preservesNearTone=true` ✅
- AC#3 validated vs vocabulary, palette is prior not cap, may add blocks back: `isKnownBlock`,
  no cap, `paletteFromMap` (cottage added bricks/white_terracotta/spruce_planks beyond the doc) ✅
- AC#4 run on gatehouse + cottage, maps saved: `material-map/<subj>.json` committed ✅
- AC#5 pure parse/validate unit-tested, `npm test` green: 15 cases, 691 total ✅

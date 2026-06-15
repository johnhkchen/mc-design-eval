# T-071-01 — llm-material-map · Plan

Ordered, independently-verifiable steps. Each ends at a committable point. Testing strategy per step.

## Step 1 — BAML function + regenerated client
- Add `baml_src/materialmap.baml` (enum `PlacementRule`, classes `MaterialRole` /
  `MaterialMapResult`, fn `MaterialMap(design_doc, concept: image)`), prompt per design Decision 2.
- Run `npm run baml:gen`; confirm `b.request.MaterialMap` / `b.parse.MaterialMap` exist in
  `baml_client/`.
- **Verify:** `node -e "import('./baml_client/index.ts')…"` not needed — instead grep the generated
  `baml_client/` for `MaterialMap` (request + parse). `npm test` still green (client regen is inert to
  the JS suite).
- **Commit:** `feat(E-21 T-071-01): MaterialMap BAML fn (concept image + doc → material map) + client`.

## Step 2 — Pure core `src/form/material-map.mjs`
- Implement `PLACEMENT_RULES`, `PLACEMENT_RULE_MAP`, `normalizePlacementRule`, `normalizeBlock`,
  `isKnownBlock`, `parseMaterialMap`, `assertMaterialMap`, `paletteFromMap`, `nearTonePairs`,
  `preservesDistinctGreys`, `MaterialMapError` (structure.md interfaces).
- Key behaviors: collect-don't-throw on bad rows (record in `dropped`); dedup on `(block,
  placementRule)`; never merge by color; palette = distinct namespaced blocks; near-tone via table Lab.
- **Verify:** module imports cleanly (`node -e "import('./src/form/material-map.mjs')"`).
- **Commit:** `feat(E-21 T-071-01): pure material-map parse/validate core`.

## Step 3 — Unit tests `src/form/material-map.test.mjs`
- Tests per structure.md (vocab freeze; normalizers; `isKnownBlock` with injected stub table + real
  `stone_bricks`/`cobblestone`; `parseMaterialMap` happy/drop-unknown-block/drop-bad-rule/dedup/
  palette/stats; `assertMaterialMap` empty-throws; `paletteFromMap`; `nearTonePairs`;
  `preservesDistinctGreys` true on stone_bricks+cobblestone, false on single block).
- Gatehouse-like fixture: `[{role:"structural walls", block:"minecraft:stone_bricks",
  placementRule:"Walls"}, {role:"corner buttresses", block:"cobblestone",
  placementRule:"CornersEdges"}, {role:"roof", block:"deepslate_tiles", placementRule:"Roof"},
  {role:"arch voussoir", block:"dark_oak_log", placementRule:"Trim"}]` → 4 kept, near-tone preserved.
- **Verify:** `npm test` green (the gate: `node --test "src/**/*.test.mjs"` + the artifact self-test).
- **Commit:** `test(E-21 T-071-01): material-map core unit tests (NN cases)`.

## Step 4 — Live bridge `src/form/material-map.mts`
- Copy `baml-review.mts`; swap to `MaterialMap(doc, Image)`; doc optional (fallback string);
  map enum→kebab via the pure core's `PLACEMENT_RULE_MAP`; stdout `{materials}`.
- **Verify (no metered call):** `npx tsx --eval` import-check / `node --check` equivalent — confirm the
  file parses and imports resolve (`tsx` can typecheck-load without invoking `claude -p` only if we
  guard execution; simplest: a syntax/import smoke by spawning with empty stdin and asserting it fails
  *after* the import, not at import). Keep it light — the real exercise is Step 6.
- **Commit:** `feat(E-21 T-071-01): live tsx bridge for MaterialMap`.

## Step 5 — Cottage design doc + runner + npm script
- Author `benchmarks/sculpture/runs/014-vConcept-a-cottage/design-doc.md` (~15 lines, palette names the
  visible near-tone cottage materials).
- Add `benchmarks/sculpture/material-map.mjs` runner (live + `--offline`), writing
  `material-map/<subj>.json` (+ `<subj>.raw.json`).
- Add `"material:map"` to `package.json` scripts.
- **Verify:** `--offline` path runs without a live call when a `.raw.json` is seeded (seed a tiny
  gatehouse raw fixture to prove the offline branch + write path); `npm test` still green.
- **Commit:** `feat(E-21 T-071-01): cottage design-doc + material-map runner + npm script`.

## Step 6 — Live run → saved maps (metered)
- Run `npm run material:map` (live `claude -p` subscription, multimodal). For each subject capture the
  reply, validate via the pure core, write `material-map/<subj>.json` + `.raw.json`.
- **Acceptance check (the AC#2 guard):** assert `gatehouse.json` has **stone_bricks AND cobblestone as
  separate roles** (`preservesDistinctGreys` true; both in `palette`). Inspect `cottage.json` for the
  timber/plaster/stone split.
- If the live call is unavailable in-session: seed `.raw.json` from a hand-validated model reply
  obtained out-of-band is NOT acceptable as a substitute; instead document the metered-run status in
  progress.md, leave the runner + offline path proven, and flag in review.md that the live run is the
  one remaining metered step. (Prior E-19 tickets ran live in-session, so attempt it first.)
- **Commit:** `feat(E-21 T-071-01): gatehouse + cottage material maps (live run)`.

## Testing strategy summary
- **Unit (pure, `npm test`):** Step 3 — all parse/validate/vocab/near-tone logic. Zero live calls.
- **Smoke (offline):** Step 5 — runner `--offline` write path on a seeded raw fixture.
- **Integration (metered, manual):** Step 6 — the real multimodal call on the two concepts; verified by
  the `preservesDistinctGreys` acceptance check on the gatehouse map.
- **Regression:** `npm test` green after every step (the suite must never depend on a live call).

## Risk / mitigation
- *Generated client drift* — commit `baml_client/` exactly as `baml:gen` emits; no hand edits.
- *Model returns a block not in the table* — collected in `dropped`, surfaced by the runner; not fatal.
- *Model over-merges greys anyway* — the prompt directive + `preservesDistinctGreys` make the failure
  visible (the map would show one grey block); flagged, not hidden.
- *Cottage doc bias* — keep the doc short and concept-faithful; the image is the primary signal.

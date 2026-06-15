# T-071-01 — llm-material-map · Review

Handoff. The E-21 "define style" step ships: a multimodal `MaterialMap` BAML function that, given the
concept image + design doc, returns a structured material map preserving near-tone-distinct materials
(the stone_bricks-vs-cobblestone collapse). All 5 ACs met; `npm test` green (691). 6 commits, additive.

## What changed (files)

**Created**
- `baml_src/materialmap.baml` — the multimodal fn (`MaterialMap(design_doc, concept: image) ->
  MaterialMapResult`), closed `PlacementRule` enum, anti-collapse + palette-prior-not-cap prompt.
- `src/form/material-map.mjs` — PURE parse/validate core (the heart; unit-tested).
- `src/form/material-map.test.mjs` — 15 unit cases.
- `src/form/baml-material-map.mts` — LIVE tsx bridge (metered; not unit-tested).
- `benchmarks/sculpture/material-map.mjs` — impure runner (live + `--offline`).
- `benchmarks/sculpture/runs/014-vConcept-a-cottage/design-doc.md` — cottage prior (was image-only).
- `benchmarks/sculpture/material-map/{gatehouse,cottage}.{json,raw.json}` — the saved maps (AC#4).

**Modified**
- `package.json` — `"material:map"` script.

**Generated (gitignored, not committed)** — `baml_client/**` (regenerate with `npm run baml:gen`).

**Untouched** — `src/artifact.mjs`, the schema, the block→Lab table, `material.mjs`, every frozen BAML
fn, all existing runners. Purely additive; zero regression surface beyond the new files.

## Test coverage

- **Pure core (unit, `npm test`):** 15 cases cover the closed vocabulary (frozen), all three
  normalizers, table membership (real table + an injected stub to decouple from the 305-table),
  `parseMaterialMap` across happy-path / unknown-block-dropped / bad-rule-dropped / missing-block /
  not-an-object / dedup / empty-array, `assertMaterialMap` throw paths, `paletteFromMap`,
  `nearTonePairs`, and the AC#2 property `preservesDistinctGreys` (true on the gatehouse fixture, false
  on a single-block and on a far-tone pair). Suite total **691 pass, 0 fail**.
- **Offline smoke:** the runner's `--offline` branch verified on a seeded `gatehouse.raw.json` (proves
  the validate + write path with no metered call).
- **Live integration (metered, manual):** the real multimodal sweep ran in-session on both concepts;
  verified by `preservesNearTone=true` on each committed map.

**Coverage gaps (by design):** the `.mts` bridge and the runner's live branch are NOT unit-tested —
they pull metered `claude -p` + BAML render, which the suite must never depend on (the project idiom).
They are exercised by the committed live sweep instead. This matches `baml-review.mts` / `e19-build.mjs`.

## Results (the AC#2 evidence)

- **Gatehouse** — 5 distinct materials, `preservesNearTone=true`. **stone_bricks (walls) AND
  cobblestone (corners-edges)** returned as separate roles — `nearTonePairs` records their ΔL*=2.08,
  precisely the distinction a mean-color match merges. Also deepslate_tiles (roof), dark_oak_log
  voussoir, dark_oak_planks door. 0 dropped.
- **Cottage** — 7 distinct, `preservesNearTone=true`. stone_bricks + cobblestone; dark_oak_log
  (timber frame) vs spruce_planks (roof field) vs dark_oak_planks (eaves) — three near-tone browns
  kept apart; white_terracotta plaster; bricks chimney cap. The map **added blocks beyond the doc**
  (AC#3 "palette is a prior not a cap"): white_terracotta, spruce_planks, bricks were concept-justified.

## Open concerns / flags for a human reviewer

1. **Non-full-cube fixtures are dropped (expected, but a future-E-21 decision).** The cottage map
   dropped `spruce_door`, `dark_oak_trapdoor`, `lantern` — they are not in the block→Lab table (which
   is *full-cube survival blocks only*). The model reasonably named them for the `openings` region, but
   they are not voxel *materials*. Current behavior (drop + record in `dropped`) is correct for a
   material map that feeds a voxel build. **If** E-21 downstream wants door/trapdoor/lantern placement,
   that needs a separate fixtures channel — out of scope here, but worth a note on the epic.
2. **`preservesDistinctGreys` is a screen, not a guarantee of correctness.** It returns true if *any*
   two distinct blocks are within ΔL*≤12 — it proves the map *can* hold near-tone materials apart, not
   that every distinction the concept shows was captured. It's the right AC#2 gate (the failure was
   *collapse*), but a human should still eyeball the map vs the concept for completeness.
3. **Model non-determinism.** Re-running `material:map` will produce a slightly different map (entry
   count, rationale wording) — both preserve the key distinctions. The committed `.json` is the
   authoritative artifact; `.raw.json` lets `--offline` re-validate the exact committed reply.
4. **`baml_client/` is gitignored.** A fresh checkout must run `npm run baml:gen` before the bridge can
   import the client. This is the existing project convention (true of every BAML fn), not new here.
5. **The map is the contract for the *next* ticket.** `material-map/v1` (`{schema, subject, map,
   palette, dropped, stats, preservesNearTone, nearTonePairs}`) "defines E-21's allowed palette." The
   downstream assign-by-geometric-feature step (not this ticket) consumes `placementRule` → a geometric
   selector. Keep the schema stable or version-bump it.

## Verification commands
- `npm test` → 691 pass.
- `node benchmarks/sculpture/material-map.mjs --offline` → re-validates the committed raw replies.
- `node benchmarks/sculpture/material-map.mjs` → live metered re-run (subscription).

# T-092-01 — concept-derived-zone-map — Plan

Five steps, each independently verifiable and atomically committable. GL/decode only in steps 4-5.

## Step 1 — band-profile pure core + unit tests

**Files:** `src/color/band-profile.mjs`, `src/color/band-profile.test.mjs`.

Implement per structure.md: `rowProfile`, `robustExtent`, `mapRowsToLayers`, `segmentLayerBands`,
`snapBands`, `resolveBandRoles`, `extractConceptZoneMap`, exported constants.

**Tests (synthetic images — the AC's wording — plus direct grid-array cases):**
- *Happy path*: synthetic RGBA (white background) of a "building": bottom ~25% grey stripe
  (stone_bricks table color), middle ~45% cream stripe (white_terracotta), top ~30% brown stripe
  (spruce_planks), plus a thin grey chimney column rising above the top stripe. Run through
  `gridFromPixels({whitelist, cellMeans:true, dropColor:[255,255,255]})` →
  `extractConceptZoneMap` with synthetic `floorLines`/`layerCounts`/`upperTop`. Expect: chimney
  rows excluded from the robust extent; 2 wall bands tiling `[yMin, upperTop-1]`; roof dominant =
  spruce_planks; dominant roles resolved via a synthetic material map.
- *Secondaries*: vertical dark_oak_log studs (~20% width) inside the cream stripe → band dominant
  stays plaster; log appears in `secondaries` by share; a map block with `placementRule: "trim"`
  appears in secondaries even at ~0 share (CROSS_BAND_RULES union).
- *Snapping*: detected boundary within `SNAP_TOLERANCE` of a floor-line snaps to it; a boundary
  farther away (the plinth case) is NOT moved.
- *Merging*: a 1-layer band merges into its neighbour (`MIN_BAND_HEIGHT`).
- *Tiling/totality*: bands clamp/extend to cover the wall y-extent exactly, bottom-up, no gaps.
- *Fallbacks* (each returns `{readable:false, reason}`): near-empty grid → `too-few-cells`;
  all-narrow silhouette → `extent-too-short`; 50/50 two-block noise in a band → `weak-dominant:*`;
  dominant block absent from the material map → `unmapped-dominant:*`.

**Verify:** `npm run test:unit` green. **Commit:** `feat(E-25 T-092-01): band-profile pure core —
concept height-band extractor (+tests)`.

## Step 2 — zone-map view core + unit tests

**Files:** `src/view/zone-map.mjs`, `src/view/zone-map.test.mjs`.

Implement `layerCounts`, `zonesFromBands`, `diffZoneMaps` per structure.md.

**Tests (synthetic occupancy, zone-fill.test.mjs hut pattern):**
- `layerCounts`: counts per y match a hand-built hut; yMin correct.
- `zonesFromBands`: roof cells (roofKeys / y ≥ upperTop) → "roof"; wall voxels → containing band;
  y below band0 / between-band gaps clamp to nearest band (zoneOf is total); zones policy has
  `preserve` = secondary blocks, `splat` = preserve − dominant; named space preserved.
- Round-trip: `zoneFill(occ, zonesFromBands(…))` recolors a wall voxel to its band dominant and
  keeps a ≥minRun stud (proves direct consumability by the existing fill).
- `diffZoneMaps`: a prior (stone base to storeyDivide) vs derived (stone plinth shorter + plaster
  above) yields the expected `wallDiffs` runs; roof dominant change detected.

**Verify:** `npm run test:unit` green. **Commit:** `feat(E-25 T-092-01): zone-map view core —
zonesFromBands + layer counts + prior diff (+tests)`.

## Step 3 — durable-skin integration

**File:** `benchmarks/sculpture/durable-skin.mjs`.

- `buildSkin(def, {zoneSource="derived"})`; derived path = extract (reusing the step-1 gridResult)
  → `zonesFromBands`; fallback/`"prior"` path = `def.policy` + `structuralZones.zoneOf`,
  source + reason recorded. Derived named-space policy → `mapPolicy(…, sub)`.
- `zoneMapRecord` agreement assert (throw on divergence, value-select precedent).
- Legacy splat-only baseline pinned to prior zones + legacy palettes (unchanged behavior).
- Generalized gates: plaster invariant (zero on zones whose policy lacks the block), per-wall-band
  foreign-dominant residue ≤ `UPPER_RESIDUE_MAX`, roof materials fraction as today.
- Return + record + `--offline` gain the `zoneMap` section; export `buildSkin`, `SUBJECTS`.
- `SUBJECTS.*.zoneMapRecord` entries added; `policy` re-commented as the recorded fallback.

**Verify:** `npm test` green (runner outside the glob; this step must not break any pure core).
Sanity: `node -e` import check of the runner module. **Commit:** `feat(E-25 T-092-01):
durable-skin consumes the concept-derived zone map — prior demoted to recorded fallback`.

## Step 4 — zone:map runner, live derivation, committed maps + before/after

**Files:** `benchmarks/sculpture/zone-map.mjs`, `package.json`.

Runner per structure.md. Then run live: `npm run zone:map` (both subjects + cottage renders).

**Verify against AC3 (the substance gate — inspect, don't assume):**
- `zone-map/cottage.json`: a LOW stone band (plinth — yRange ending well below storeyDivide) with
  plaster-dominant band(s) covering the rest of the ground storey AND the upper storey; timber log
  in secondaries; diff vs prior shows the ground-storey flip.
- `zone-map/gatehouse.json`: stone-dominant wall band(s), `deepslate_tiles` roof, **no brown
  (wood-dominant) wall band**; diff vs prior recorded.
- Frames: `zonemap-cottage-{before,after,strip}.png` — after shows half-timbering over a plinth on
  the ground storey; before shows the all-stone ground storey.
- If a map comes out wrong: adjust only the generic constants (with measured rationale in the
  module comment) — never a subject branch (E-25 Rule 3). If the concept is genuinely unreadable,
  record the fallback honestly (E-25 Rule 6) and surface it in review.md.

**Commit:** `feat(E-25 T-092-01): zone:map runner — derived maps saved+diffed, cottage
before/after frames` (records + frames included).

## Step 5 — refreshed durable skins end-to-end (AC5)

Run `npm run skin:cottage` and `npm run skin:gatehouse` (derived-by-default; agreement asserted
against the step-4 records). Then `npm run skin:cottage -- --offline` re-asserts the committed
record.

**Verify:** double-run byte-equality holds; coverage gate + band evidence pass (or the failure is
investigated — a derived-map gate failure is a finding, not a tuning license); plaster invariant
(generalized) passes; renders + strip refreshed. `npm test` green.
**Commit:** `feat(E-25 T-092-01): durable skins rebuilt on concept-derived zone maps`.

## Progress tracking

`progress.md` updated after every step (done / remaining / deviations). Deviations from this plan
get a dated note with rationale before proceeding.

## Test strategy summary

- **Unit (steps 1-2):** every pure function, synthetic inputs only, no fixtures, no GL — runs in
  `npm run test:unit`.
- **Integration (steps 4-5):** the live runners ARE the integration tests (E-24 pattern):
  reproducibility throw, agreement throw, coverage/band/invariant gates, AJV on artifacts.
- **Visual (AC):** committed frames; the review references them.

## Rollback / safety

- Steps 1-2 are additive (new modules) — zero blast radius.
- Step 3 changes default behavior of `skin:*`; the `zoneSource:"prior"` switch preserves the old
  path exactly (used by the runner for "before" and available for bisection).
- Committed durable-skin records are regenerated in step 5 only after the step-4 inspection gate.

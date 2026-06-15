# T-092-01 — concept-derived-zone-map — Progress

## Completed (all five plan steps)

- **Step 1 — band-profile pure core** (`51f4398`): `src/color/band-profile.mjs` +
  `band-profile.test.mjs` (20 tests). rowProfile / robustExtent / mapRowsToLayers /
  segmentLayerBands / snapBands / resolveBandRoles / extractConceptZoneMap; honest refusals
  (`too-few-cells`, `extent-too-short`, `weak-dominant:*`, `unmapped-dominant:*`).
- **Step 2 — zone-map view core** (`b515961`): `src/view/zone-map.mjs` + tests (8).
  layerCounts / zonesFromBands (structuralZones' roof contract verbatim, total zoneOf, named-space
  policies) / diffZoneMaps (per-y wall runs + roof pair). Round-trip into `zoneFill` proven.
- **Step 3 — durable-skin integration** (`f106d70`): `buildSkin(def, {zoneSource:"derived"})`
  default; prior = recorded fallback (`prior-fallback` + reason) or forced `"prior"`; committed
  zone-map record agreement THROW; legacy splat-only replay pinned to prior zone geometry; plaster
  invariant + band-residue gates generalized for N wall bands; `--offline` extended.
- **Step 4 — zone:map runner + records + frames** (`b78ecbb`): `benchmarks/sculpture/zone-map.mjs`
  (`npm run zone:map`), committed `zone-map/{cottage,gatehouse}.{json,md}` + the cottage
  before/after/strip frames (`pr/assets/frames/zonemap-cottage-*.png`). Plus the two extractor
  upgrades described under Deviations.
- **Step 5 — durable skins rebuilt** (`41b4070`): both subjects re-run derived-by-default;
  double-run byte-equal; agreement vs committed records; all gates pass; `--offline` green both.
  `npm test`: 1084/1084.

## Deviations from plan (both dated 2026-06-10, found in step 4's live run)

1. **Anchored row→layer mapping added.** Plan assumed plain linear mapping over robust extents.
   The real cottage showed roof rows leaking below the geometric eave (3/4-view foreshortening) —
   spruce dominated wall layers y7..10. Fix (generic): pin the map at the widest-silhouette line
   when it is a narrow plateau (the eave overhang — measured: cottage max layer y14 = upperTop,
   gatehouse y18 = upperTop); broad plateaus fall back to linear (`ANCHOR_MAX_PLATEAU`).
2. **Field-class dominance added.** Plan let any block win a band. The real cottage's wall rows are
   majority feature/roof cells (studs, shadows, shutters, roof slopes stacked into the same rows by
   the 3/4 view) — `dark_oak_log` won every wall layer over ALL cells. Fix (map-driven, generic): a
   wall band's dominant is decided among `placementRule:"walls"` blocks; the roof's among
   `placementRule:"roof"` blocks; features can only be secondaries. New refusal `no-field-cells`.

## The finding (AC3 vs the actual concept — recorded, not tuned away)

Direct crop inspection of `runs/014-vConcept-a-cottage/concept.png` shows the ground storey is
**entirely stone up to the jetty beams** — no plaster below the upper storey. The derived cottage
walls therefore CONFIRM the prior (`diff.wallDiffs: []`); the epic/ticket claim that this concept
shows "plaster on both storeys over a low plinth" is not supported by the image. The real
concept-vs-prior divergence the extractor found is the **roof dominant: `dark_oak_planks`, not
`spruce_planks`** — the derived skin's roof is visibly closer to the concept's dark roof (see
`zonemap-cottage-strip.png`). Gatehouse: all-stone walls, `deepslate_tiles` roof, no brown band
(AC satisfied). E-25 Rules 2/6: the concept is immutable and the honest reading wins over the
expected reading.

## Remaining

Nothing — Review phase next (review.md).

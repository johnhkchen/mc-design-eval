# T-092-01 — concept-derived-zone-map — Structure

## Files

| File | Action | Role |
|---|---|---|
| `src/color/band-profile.mjs` | create | Pure extractor: concept grid → height bands → roles |
| `src/color/band-profile.test.mjs` | create | Unit tests on synthetic RGBA-derived grids |
| `src/view/zone-map.mjs` | create | Pure occupancy side: layer counts, bands → `{zoneOf, zones}`, diff |
| `src/view/zone-map.test.mjs` | create | Unit tests on synthetic occupancy |
| `benchmarks/sculpture/durable-skin.mjs` | modify | Derive-by-default zone source, generalized gates, record |
| `benchmarks/sculpture/zone-map.mjs` | create | Impure T-092 runner: save+diff maps, cottage before/after |
| `package.json` | modify | `"zone:map"` script |
| `benchmarks/sculpture/zone-map/{cottage,gatehouse}.json|.md` | generated+committed | The saved derived maps + diffs |
| `pr/assets/frames/zonemap-cottage-{before,after,strip}.png` | generated+committed | AC evidence frames |

No deletions. `spray-paint.mjs`, `value-select.mjs`, `surface-pattern.mjs` untouched (committed
per-ticket records). `structural-read.mjs`, `zone-fill.mjs` untouched (already name-agnostic).

## `src/color/band-profile.mjs` (pure; imports nothing from src/view — plain-data inputs)

Constants (exported, with measured/argued rationale comments):
`EXTENT_WIDTH_FLOOR = 0.25`, `MIN_BAND_HEIGHT = 2`, `SNAP_TOLERANCE = 2`,
`SECONDARY_MIN_SHARE = 0.05`, `MIN_DOMINANT_SHARE = 0.3`, `MIN_PROFILE_CELLS = 200`,
`MIN_EXTENT_LAYERS = 4`, `CROSS_BAND_RULES = Object.freeze(["trim", "corners-edges", "openings"])`.

```js
rowProfile(gridResult)            // {rows:[{filled, counts:Record<bare,number>}], maxWidth}
                                  //   one entry per grid row (top→bottom, grid order)
robustExtent(widths, floor)       // → {lo, hi} first/last index with width ≥ floor·max(widths)
                                  //   shared by rows (filled counts) and layers (occupied counts)
mapRowsToLayers(rows, rowExt, layerExt) // → Map<y, {filled, counts}>; linear index map, row i
                                  //   (top of image = HIGH y); accumulates histograms per voxel y
segmentLayerBands(byY, {yLo, yHi, minBandHeight}) // → [{yRange:[lo,hi], dominant, share, counts}]
                                  //   dominant runs over y ∈ [yLo, yHi]; sub-min bands merge into
                                  //   same-dominant neighbour, else taller neighbour
snapBands(bands, floorLines, tolerance) // boundary between band i/i+1 snaps to nearest floor-line
                                  //   within tolerance; bands re-clamped, empty bands dropped
resolveBandRoles(bands, materialMap, opts) // attach dominantRole + secondaries
                                  //   secondaries = share ≥ SECONDARY_MIN_SHARE ∪ map blocks with
                                  //   placementRule ∈ CROSS_BAND_RULES (always incl. role refs)
extractConceptZoneMap(input, opts = {}) // THE orchestrator (everything above, in order)
```

`extractConceptZoneMap` input (all plain data):
```js
{ gridResult,           // gridFromPixels validate-mode result (grid of bare ids | null)
  floorLines,           // number[] from structuralZones
  layerCounts,          // {yMin, counts:number[]} occupied cells per y (from src/view/zone-map)
  upperTop,             // number — wall/roof divide (geometry, from structuralZones)
  materialMap }         // the material-map/v1 JSON ({map:[{role, block, placementRule}], …})
```
Returns ONE of:
```js
{ readable: true,
  bands: [{ name:"band0", yRange:[lo,hi], dominantBlock, dominantRole, share,
            secondaries:[{block, role, share}] }],   // bottom-up, tiling [yMin, upperTop-1]
  roof:  { dominantBlock, dominantRole, share, secondaries:[…] },  // all rows mapping to y ≥ upperTop
  params:{ …all thresholds used… } }
{ readable: false, reason: "too-few-cells" | "extent-too-short" | "weak-dominant:<band>" |
  "unmapped-dominant:<block>" }
```
Rules encoded here: bands clamp/extend to tile `[yMin, upperTop-1]` exactly (zoneOf must be total);
wall segmentation only below `upperTop`; roof = one aggregated histogram. Bare/namespaced ids both
accepted, bare emitted (zoneFill namespaces on placement).

## `src/view/zone-map.mjs` (pure; imports `bareBlock` from occupancy.mjs only)

```js
layerCounts(occ)                  // → {yMin, counts:number[]} occupied per y (chimney incl.)
zonesFromBands({bands, roof, roofKeys, upperTop})
   // → { zoneOf(voxel) → "roof" | "band<i>",   // roof: roofKeys.has(key) || y >= upperTop;
   //     zones }                                // else band containing y (clamped to nearest end)
   // zones = { [band.name]: {dominant, preserve, splat}, roof: {…} } in NAMED space:
   //   preserve = secondaries' blocks; splat = preserve − dominant (dedup, order-stable)
diffZoneMaps({ prior, derived, yMin })
   // prior  = { zones:{base,upper,roof}, storeyDivide, upperTop }
   // derived = { bands, roof }
   // → { wallDiffs:[{yRange, prior, derived}],     // maximal y-runs where per-y dominant differs
   //     roofDominant:{prior, derived, changed} }
```
`zoneOf` mirrors `structuralZones`' roof rule verbatim (membership ∪ eave threshold) so the derived
map changes *assignments*, never the wall/roof geometry contract.

## `benchmarks/sculpture/durable-skin.mjs` changes (impure wiring only)

- Imports: `extractConceptZoneMap` (band-profile), `layerCounts`, `zonesFromBands`, `diffZoneMaps`
  (zone-map).
- `SUBJECTS.<key>.zoneMapRecord = "zone-map/<key>.json"` (both subjects). `policy` stays — now
  documented as THE FALLBACK PRIOR + the legacy/diff baseline.
- `buildSkin(def, { zoneSource = "derived" } = {})` — exported (with `SUBJECTS`) for the runner:
  - After `structuralZones`: when `zoneSource === "derived"`, call `extractConceptZoneMap` with the
    step-1 `gridResult` (already computed), `floorLines`, `layerCounts(occSealed)`, `upperTop`,
    `matMap`. Readable → `zonesFromBands(…, roofKeys, upperTop)` gives `zoneOf` + named-space
    zones; unreadable (or `zoneSource === "prior"`) → prior `def.policy` + `structuralZones.zoneOf`,
    with `zoneMap.source = "prior" | "prior-fallback"` + reason. Derived policy passes through
    `mapPolicy(…, sub)` exactly like the prior does today.
  - Record agreement: if `def.zoneMapRecord` exists on disk and source is `"concept"`, canonical
    bands+roof must match the committed record or THROW (value-select precedent).
  - Legacy splat-only baseline: unchanged — always prior zones (`structuralZones.zoneOf`) + legacy
    palettes.
  - Gate generalization (D8): plaster invariant → zero count on zones whose policy lacks the block;
    `bands` evidence → `roofMaterialsFraction` (as today) + per-wall-band foreign-dominant residue
    ≤ `UPPER_RESIDUE_MAX`.
  - Return adds `zoneMap: {source, reason?, bands, roof, diff}`; record gains a `zoneMap` section;
    `--offline` checks extended (zoneMap source recorded, residue bounds re-asserted on record).

## `benchmarks/sculpture/zone-map.mjs` (impure runner — npm run zone:map)

CLI: `--subject cottage|gatehouse|all` (default `all`), `--no-render`.
1. For each subject: `buildSkin(def)` (derived) → take `r.zoneMap` + prior → write
   `zone-map/<subj>.json` (`schema: "zone-map/v1"`, inputs, derived bands/roof, prior policy +
   boundaries, diff, params, fallback record if any) + a human `.md` table.
2. Cottage before/after (unless `--no-render`): `buildSkin(cottage, {zoneSource:"prior"})` and the
   derived result from step 1; `tryRenderAngle`-style renders (front + oblique 225°) of both final
   artifacts; compose strip (concept | prior | derived); copy to
   `pr/assets/frames/zonemap-cottage-{before,after,strip}.png`.
3. Console summary: bands table, diff lines, fallback notices. Never writes durable-skin records.

`zone-map/v1` record shape:
```js
{ schema:"zone-map/v1", subject, inputs:{concept, map, build},
  source:"concept"|"prior-fallback", reason?,            // fallback recorded, never silent
  derived:{ bands, roof }, prior:{ policy, storeyDivide, upperTop },
  diff:{ wallDiffs, roofDominant }, params }
```

## Ordering (matters)

1. `src/color/band-profile.mjs` + tests — no deps on anything new.
2. `src/view/zone-map.mjs` + tests — consumes band shapes (data only).
3. `durable-skin.mjs` integration (zoneSource, gates, record, exports) — compiles against 1+2;
   `npm test` must stay green (runner is outside the glob; cores fully covered).
4. `zone-map.mjs` runner + `package.json` script → run live → commit `zone-map/*.json|md` + frames.
5. Re-run `skin:cottage` + `skin:gatehouse` (now derived-by-default, asserting agreement with the
   step-4 records) → commit refreshed durable-skin records/artifacts/frames.

## Boundary notes

- `band-profile.mjs` lives in `src/color` (sibling of `value-select.mjs` — both read a GridResult
  + the material map); it takes `floorLines`/`layerCounts` as plain arrays so it imports zero
  view-layer code. `zone-map.mjs` lives in `src/view` (occupancy + zoneOf are view-layer concerns).
- All thresholds are exported constants in pipeline code — generic, not per-subject (E-25 Rule 3);
  subjects contribute only registry data (paths, fallback policy, invariant block name).
- No new decode paths, no new image reads: the extractor consumes the value-true step's gridResult.

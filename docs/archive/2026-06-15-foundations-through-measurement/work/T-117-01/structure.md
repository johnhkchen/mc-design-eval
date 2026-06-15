# T-117-01 structure — file-level blueprint

## Modified: `src/color/band-profile.mjs` (the only logic change)

Three additions, no signature breaks, no new threshold constants.

1. **New exported pure function** (placed with the other role helpers, after `resolveBandRoles`):

   ```
   /**
    * Role-aware field resolution from the committed map's own data (T-117-01): bare feature-block
    * key → bare walls-block key, for blocks the map BOTH classifies as wall-adjacent features
    * (placementRule corners-edges/trim/openings/base on every row — never walls, never roof) AND
    * records as a near-tone pair of a walls block (materialMap.nearTonePairs, either orientation).
    * Several walls partners → min dL, tie lexicographic. Maps without pairs → empty Map.
    * @param {{map:object[], nearTonePairs?:{a:string,b:string,dL:number}[]}} materialMap
    * @returns {Map<string,string>}
    */
   export function fieldResolution(materialMap)
   ```

   Internals: build per-bare-key rule sets from `materialMap.map` (a block can carry several rows —
   barn stone_bricks is corners-edges AND base); walls-keyed set; eligibility test; scan
   `nearTonePairs ?? []` with `bare()` on both ends.

2. **`segmentLayerBands` opts gain `fieldResolve`** (Map|null, default null). Replace the two
   dominance/share uses of `filterCounts(counts, fieldBlocks)` with a projection helper:

   ```
   /** Project a histogram into field space: field keys pass through, resolved keys re-key to
    *  their field block, everything else drops. fieldResolve null ⇒ exactly filterCounts. */
   function projectFieldCounts(counts, fieldBlocks, fieldResolve)
   ```

   Used at: per-layer dominant (`doms` loop) and the post-merge `b.share` computation. Band
   `counts` remain the ORIGINAL histograms (secondaries contract unchanged). With
   `fieldBlocks === null` (maps without rule annotations) the projection stays unrestricted —
   `fieldResolve` is only meaningful alongside `fieldBlocks` and is ignored without it.

3. **Orchestrator rung in `extractConceptZoneMap`**, replacing the single segment-then-refuse
   pair at lines 421–424:

   ```
   let bands = segmentLayerBands(byY, { yLo: layerExt.yLo, yHi: wallYHi, minBandHeight: o.minBandHeight, fieldBlocks });
   if (!bands.length && fieldBlocks) {
     const resolve = fieldResolution(materialMap);
     if (resolve.size) {
       bands = segmentLayerBands(byY, { yLo: layerExt.yLo, yHi: wallYHi, minBandHeight: o.minBandHeight, fieldBlocks, fieldResolve: resolve });
       if (bands.length) params.fieldResolution = Object.fromEntries([...resolve.entries()].sort());
     }
   }
   if (!bands.length) return refuse("no-field-cells");
   ```

   `params.fieldResolution` is conditional (the `anchor` precedent) → legacy params byte-stable.
   Module header gets a short T-117 paragraph (the rung model, the global-offset rationale).

## Modified: `src/color/band-profile.test.mjs`

New group at the end ("Group F: role-aware field resolution (T-117-01)"):

- `fieldResolution` direct tests: barn-transcribed map literal (cobblestone=walls,
  stone_bricks=corners-edges+base, dark_oak_planks=roof, oak_planks=openings; real
  `nearTonePairs` incl. {cobblestone, stone_bricks, dL:2.082}) → Map {stone_bricks→cobblestone,
  oak_planks→cobblestone}; roof block ineligible; pairless map → empty; missing nearTonePairs →
  empty; min-dL choice between two walls partners.
- `segmentLayerBands` with `fieldResolve`: layers whose only cells are resolved keys produce a
  field-dominant band with projected share; `fieldResolve:null` output deep-equals current
  behavior on the same input.
- **The barn ΔL 2.082 witness** (end-to-end): synthetic gridResult whose wall rows are
  stone_bricks-keyed (the wholesale-flip state the probe measured), roof rows dark_oak_planks,
  through `extractConceptZoneMap` with the barn-transcribed map → `readable:true`, single wall
  band `dominantBlock:"cobblestone"`, `dominantRole:"structural wall infill"`,
  `params.fieldResolution` recorded, stone_bricks present among secondaries (corners-edges).
- **Honest-refusal negative**: same grid shape, map literal whose walls block has NO recorded
  near-tone partner (e.g., walls=white_terracotta, feature=dark_oak_log, pairs empty or
  non-walls-touching) → `readable:false, reason:"no-field-cells"`.
- **Legacy invariance**: a rung-1-readable grid (existing Group E fixture pattern) asserts
  `params.fieldResolution === undefined`.

## Data/records (no logic)

- **Created** `benchmarks/sculpture/zone-map/barn.prior-fallback.json` — byte copy of the current
  refusal record, preserved before regeneration (AC: history beside the derivation).
- **Regenerated** `benchmarks/sculpture/zone-map/barn.json` + `barn.md` — by
  `node benchmarks/sculpture/zone-map.mjs --subject barn --no-render` (direct node; loud-fail mode).
- **Regenerated-and-verified byte-identical** `zone-map/{cottage,gatehouse,church}.{json,md}` —
  by the full sweep `node benchmarks/sculpture/zone-map.mjs --no-render`; `git diff --stat` must
  show only barn files. Any other diff is a stop-and-name event (T-113 discipline).
- **Created** `benchmarks/sculpture/kit/barn.{json,raw.json,md}` — by
  `node benchmarks/sculpture/kit-extract.mjs --subject=barn` (direct node: npm swallows the flag
  and a sweep would regenerate every subject's pins — T-119's protected territory).

## Modified: `benchmarks/sculpture/durable-skin.mjs` (registry data only)

Barn def: `zoneMapRecord: null → "zone-map/barn.json"`, `kitRecord: null → "kit/barn.json"`;
the two flip-comments collapse into provenance notes (T-117-01). No code paths change; setting
`zoneMapRecord` arms the existing agrees-with-record divergence throw for barn.

## Explicitly untouched (the contract perimeter)

`src/form/kit.mjs` (bandRefsFromZoneRecord throw verbatim), `benchmarks/sculpture/
generated-milestone.mjs` (kit precondition verbatim), `kit-extract.mjs` (barn entry already
points at zone-map/barn.json), `src/color/image-grid.mjs`, `src/view/zone-map.mjs`,
`benchmarks/sculpture/zone-map.mjs`, all committed legacy pins (`kit/{cottage,gatehouse,
church}.*`, `value-select/*`), every threshold constant.

## Ordering

1. Lens + tests (band-profile.mjs, band-profile.test.mjs) — commit, suite green.
2. Barn zone map: preserve refusal copy → regenerate barn → full sweep → legacy byte-check →
   flip `zoneMapRecord` → re-run `--subject barn` (the armed divergence assert passes) — commit.
3. Kit: live `--subject=barn` extraction → flip `kitRecord` — commit.
4. Full `npm test`; review.md — commit.

Step 2 carries the known risk that buildSkin, proceeding past zones with a derived barn policy
for the first time, throws at a later gate; that outcome would be recorded and surfaced, not
patched around in this ticket.

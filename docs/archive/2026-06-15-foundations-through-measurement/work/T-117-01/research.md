# T-117-01 research — role-aware zone lens

Descriptive map of everything the ticket touches. No solutions here (design.md decides).

## The failure, reproduced and measured

`npm run challenge:barn` (T-116) stalled at zone derivation: `extractConceptZoneMap` returned
`{readable:false, reason:"no-field-cells"}` and the committed `benchmarks/sculpture/zone-map/barn.json`
records `source: "prior-fallback"`. Probe of the actual pipeline inputs (this session, live run of
`gridFromPixels` on the barn concept with the map's palette as whitelist, n=96 — the exact
durable-skin step-1 call):

- grid blockCounts: `{ dark_oak_planks: 2026, stone_bricks: 752 }` — **zero cobblestone, zero
  oak_planks** out of 2778 filled cells (96×52 grid, meanΔE 12.63).
- palette Lab (committed table): cobblestone `[53.3, 0.6, -0.4]`, stone_bricks `[51.2, 0, 0]` —
  the ΔL 2.082 near-tone pair the ticket names.
- Every one of the 752 grey cells is nearer stone_bricks; the margin `ΔE(cell,stone_bricks) −
  ΔE(cell,cobblestone)` is uniformly ≈ −2.1 (quartiles −2.16/−2.11/−2.10/−2.09/−2.03).

Reading: the concept render is **globally darker** than the table colors by roughly the pair's own
separation, so the whole cobble field flips to stone_bricks *wholesale*. This is an illumination
offset, not per-cell noise — no per-cell Lab refinement (chroma weighting, tighter metric) can split
a pair whose distinction is almost purely L\* under an unknown global L\* shift. The same phenomenon
is already documented on the kit side (kit-extract removes a median `lightnessOffset` before
flagging mismatches).

## The lens (pure core)

`src/color/band-profile.mjs` (465 lines, T-092) — PURE, plain-data inputs, exported generic
constants, unit-tested in `band-profile.test.mjs` (synthetic maps + real committed table colors).

- `rowProfile(gridResult)` → per-row histograms of the validate-mode grid.
- `robustExtent`, `anchorIndex`, `mapRowsToLayers` → image-row→voxel-y calibration (anchored
  piecewise-linear when both axes show a narrow widest-silhouette plateau).
- `segmentLayerBands(byY, {yLo, yHi, minBandHeight, fieldBlocks})` — **the failing stage**. Per
  layer, the dominant is `dominantOf(filterCounts(h.counts, fieldBlocks))`; `fieldBlocks` is the
  set of map blocks with `placementRule:"walls"`. When *no* layer in the wall extent has any
  field-key cell, every per-layer dominant is null → returns `[]`.
- `extractConceptZoneMap(input, opts)` — orchestrator. Line 424: `if (!bands.length) return
  refuse("no-field-cells")`. Roof is symmetric: dominant decided among `placementRule:"roof"`
  blocks; an empty roof-class histogram refuses `weak-dominant:roof`.
- `resolveBandRoles(band, materialMap)` — secondaries from the band's **original** counts;
  `CROSS_BAND_RULES = ["trim","corners-edges","openings"]` blocks are always carried as
  secondaries (so stone_bricks piers survive as secondaries regardless of dominance).
- `params` in the returned record = `{...DEFAULTS-merged-opts, n, m, anchored, anchor?}` —
  conditional keys exist already (`anchor` only when anchored). Anything added unconditionally
  to params would byte-diff every regenerated legacy record.

## The quantize feeding it

`src/color/image-grid.mjs` `gridFromPixels` — validate mode snaps each cell's foreground mean to
the nearest whitelist block by plain ΔE76 (`nearestLab`). The whitelist *is already the map's
palette* (`bareList(matMap.palette)` at durable-skin.mjs:354) — the AC's "not a quantization to a
global table" is already true at the pixel level; the collapse is *within* the map's own palette,
driven by the global lightness offset above.

## The committed map data the fix can lean on

All four material maps (`material-map/{cottage,gatehouse,church,barn}.json`) carry:

- `map[].placementRule` ∈ walls / corners-edges / base / roof / trim / openings — the E-21 "assign
  by geometric feature" semantics. Features (corners-edges/trim/openings) are linear and by
  construction never row-dominant (band-profile's own header states this).
- `nearTonePairs: [{a, b, dL}]` — computed at map-generation time by
  `src/form/material-map.mjs:nearTonePairs(map, {tol:12})`: all block pairs with |ΔL\*| ≤ 12,
  ascending. Every map records the cobblestone↔stone_bricks pair at exactly dL 2.082.
- Barn roles: cobblestone=walls, stone_bricks=corners-edges AND base, dark_oak_planks=roof,
  oak_planks=openings. **Church is structurally identical** (cobblestone=walls,
  stone_bricks=corners-edges/base) yet derived successfully at T-110 — its concept's grey field
  snapped to cobble, so the legacy path works when illumination cooperates.
- Cottage walls = {stone_bricks, white_terracotta} (the pair runs the *other* way there);
  gatehouse walls = {stone_bricks}.

## Callers and contracts (the "no contract relaxed" perimeter)

- `benchmarks/sculpture/durable-skin.mjs:buildSkin` (the deterministic core) calls
  `extractConceptZoneMap` up to three times: the component-pin attempt (line 421), the
  pin-rejection occupancy re-read (427), and the main derivation (447). On readable it builds the
  policy via `src/view/zone-map.mjs:zonesFromBands`; on refusal it falls back to the prior and
  records the reason. If `def.zoneMapRecord` is set it **throws on divergence** from the committed
  record (line 470) — the byte-identity assert the AC invokes.
- `benchmarks/sculpture/zone-map.mjs` (runner) — `npm run zone:map [-- --subject k --no-render]`;
  sweeps SUBJECTS via buildSkin, writes `zone-map/<k>.{json,md}`. A sweep DEFERS a subject whose
  buildSkin throws; an explicit `--subject` fails loudly.
- `src/form/kit.mjs:bandRefsFromZoneRecord` (lines ~118–135, the ticket's "kit.mjs:122") — throws
  unless `source === "concept"` with derived bands. **Keep verbatim.**
- `benchmarks/sculpture/kit-extract.mjs` — separate SUBJECTS list; barn entry already points at
  `zone-map/barn.json` (it currently throws there). Live model call is RECOGNITION (strong tier,
  subscription shim), not a judge. `--subject=barn` must be passed via **direct node invocation**
  (npm swallows flags without `--`; a dropped flag once live-swept all subjects' pins — and pin
  protection is T-119's ticket, not this one).
- `benchmarks/sculpture/generated-milestone.mjs:476` — requires a committed kit/v1 record.
  **Keep verbatim.**
- Registry: `durable-skin.mjs` SUBJECTS.barn has `zoneMapRecord: null` / `kitRecord: null` with
  comments naming the flip targets (`zone-map/barn.json`, `kit/barn.json`) — data-only change.
- `segmentLayerBands` has **no callers outside band-profile.mjs and its test** — its signature can
  grow compatibly.

## Constraints and risks surfaced

1. **Legacy byte-identity**: cottage/gatehouse/church derive bands successfully today (rung-1
   succeeds), and `params` must not grow unconditional keys. Any fix gated on the *current failure
   condition* (empty rung-1 segmentation) leaves their code path — and records — untouched.
2. **Refusal must survive**: re-snapping pixels against field blocks alone would make every
   concept "readable". The honest-refusal AC rules out any unconditional re-attribution.
3. **The roof side** has the symmetric starvation mode (`weak-dominant:roof`) — not the barn
   witness; out of scope unless free.
4. **Downstream of derivation**: with a derived (not prior) barn policy, buildSkin proceeds into
   seal/fill/coverage stages it has only run under the prior. A later gate could throw on
   `zone:map -- --subject barn`; that would be a finding, not a reason to relax anything.
5. **Old refusal record**: regenerating `zone-map/barn.json` overwrites the committed
   prior-fallback record; the AC wants it retained as history *beside* the derivation.
6. **kit-extract side-effects**: the sweep regenerates every subject's kit pins; barn must be run
   `--subject=barn` (direct node). Reskin/pin-rotation policy is T-119; committed legacy pins must
   not be touched.
7. **Test idiom**: band-profile.test.mjs uses inline synthetic material-map literals plus real
   committed-table colors via `loadBlockTable()` — the ΔL 2.082 witness can be expressed with the
   real cobblestone/stone_bricks table entries and a map literal transcribing barn's roles/pairs.

## Inputs on disk (verified)

- Refusal record `zone-map/barn.json`: `source:"prior-fallback"`, `reason:"no-field-cells"`,
  grid 96×52, anchored at row 29 ↔ y 0; prior policy transcribed from map roles; `derived: null`.
- `challenge/barn/base-artifact.json` exists (T-116 provision, scale 48); structural zones read
  single floor line, storeyDivide 6, upperTop 13 (occupancy; barn has no componentPlan).
- `material-map/barn.json` as quoted above; `glb/barn.glb` present.
- `npm test` currently green at 1514 tests (suite state per E-29 closure).

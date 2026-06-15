# T-092-01 — concept-derived-zone-map — Research

Descriptive map of what exists. No solutions proposed here.

## 1. The defect, located precisely

The zone *assignments* are a hard-coded building prior. They live in exactly two places:

- `benchmarks/sculpture/durable-skin.mjs:85-150` — `SUBJECTS.<key>.policy`: per-subject
  `{base, upper, roof}` each `{dominant, preserve[], splat[]}` in NAMED (pre-substitution) block
  space. This is what the composed pipeline (`npm run skin:cottage|gatehouse`) actually applies.
- `benchmarks/sculpture/spray-paint.mjs:73-95` — `ZONE_POLICY`, the T-085/T-090 per-ticket
  measurement record. Per the durable-skin header (lines 22-25), per-ticket runners stay untouched
  as committed records.

The cottage prior assigns the whole ground storey `dominant: stone_bricks`; the concept
(`runs/014-vConcept-a-cottage/concept.png`, verified by direct inspection) shows a **low rough-stone
plinth only** (roughly the lower half of the ground storey), with cream plaster + dark timber
half-timbering on **both** storeys above it, brown plank roof, cobble chimney with brick cap.
Zone *boundaries* (storeyDivide/upperTop) are geometric and correct; the per-zone *dominants and
boundary placement vs. the concept's bands* are the prior's invention.

## 2. Zone machinery (consumers of a zone map)

`src/view/zone-fill.mjs` — all pure, **zone-name-agnostic** (keyed by whatever `zoneOf` returns):

- `zoneFill(occ, {zoneOf, zones, faces?, minRun=2, skin, regions?})` (line 134) — recolors skin
  voxels to the zone dominant; keeps the dominant, keeps `preserve` materials in ≥minRun runs, keeps
  declared `regions` unconditionally. Zones absent from `zones` are untouched. Returns
  `{placements, filled, kept, byZone, byRegion}`.
- `exposedVoxelEntries(occ)` (line 65) — the full 6-dir exposure shell (T-090's skin).
- `surfaceZoneHistogram(occ, zoneOf, {skin})` (line 185) → `{[zone]: {total, byBlock}}`.
- `dominantCoverage(hist, zones)` (line 208) — decorates with intended dominant + fraction.

`src/view/face-resemblance.mjs` — `coverageGate(coverage, {threshold=0.5, zones})` (line 73)
iterates `Object.keys(zones)`; also zone-name-agnostic.

`src/view/face-paint.mjs` — `paintFace(occ, dir, target, {allowed, zoneOf, allowedByZone})`:
the splat's zone gate takes a `Map<zoneName, Set<block>>`; name-agnostic too.

**Conclusion: nothing in the pure cores assumes the names base/upper/roof.** The name coupling is
entirely in `durable-skin.mjs`: `exposedBlockByZone` seeds `{base:0, upper:0, roof:0}` (line 185),
the plaster invariant checks `.base/.roof` (line 357), `zoneMaterialsFraction(cov,"roof",…)` and the
`upperResidue` check (lines 371-384), and the offline re-assert mirrors of these.

## 3. The geometric y-axis (what bands must align to)

`src/view/structural-read.mjs`:

- `storeyBands(occ, {floorFillThreshold=0.6})` (line 49) → `{bands, floorLines}`. `floorLines` =
  y's whose layer fill ≥ 60% of footprint — floor slabs, a pure geometry signal. The `bands`
  (dominant-block-per-layer groups) are exactly what the ticket forbids using (corrupted by the
  material noise being fixed).
- `structuralZones(occ, opts)` (line 257) → `{zoneOf, storeyDivide, upperTop, roofKeys, floorLines}`.
  `storeyDivide = floorLines[1]` (else minY+6); `upperTop = floorLines[last]` if ≥3 lines (else
  storeyDivide+7); roof = `roofKeys` membership (+y top-exposed cells) OR `y >= upperTop`.
  Module comments (lines 264-269) document why: roofRegion under-covers a noisy pitched roof, so the
  eave line bounds "upper" geometrically.

Important nuance for this ticket: the cottage's **plinth top is not a floor line** (it is not a
floor slab — it sits mid-ground-storey). The floor-lines give the storey divide and the eave; a
concept band boundary may legitimately fall between them.

## 4. Concept reading machinery (the locator pattern, T-086)

`src/color/image-grid.mjs`:

- `gridFromPixels(img, {n, whitelist, dropColor, cellMeans, coverageThreshold=0.5})` (line 112) —
  pure; area-downsamples RGBA to an n×m grid (`m = round(n·H/W)`), drops background
  (`dropColor`±tolerance 24), and assigns each filled cell the nearest-Lab block from `whitelist`
  (validate mode). Returns `grid` (bare ids | null), opt-in `cellMeans` (true foreground mean RGB
  per cell), `blockCounts`, `legend`, `filledCells`. Air cells = mostly-background.
- `gridFromImage(path, opts)` (line 262) is the only decode shell (delegates to
  `palette-extract.mjs#decodeImage`, PNG/JPEG).

`src/color/value-select.mjs` (T-086, pure):

- `SAMPLE_GRID_N = 96` (line 51) — role-swatch quantize width, measured stable n=48…128.
- `estimateBorderColor(img)` (line 165) — background estimate from the 1-px border (concept
  backgrounds are near-white; the default near-black drop removes nothing).
- `sampleRoleSwatches(gridResult, namedBlocks)` (line 188) — the **locator pattern**: in validate
  mode the NAMED block locates its concept region; the swatch is the region's true mean color.
- `selectValueTrueMap(map, swatches)` (line 300) — role → value-true block decisions. Cottage's
  committed substitution (`value-select/cottage.json`): `stone_bricks→tuff`,
  `white_terracotta→sandstone`.

So: **a validate-mode quantize of the concept against the named manifest already exists in the
pipeline** (durable-skin lines 251-257 computes it for value-true selection: `whitelist =
bareList(matMap.palette)`, `n = SAMPLE_GRID_N`, `dropColor = estimateBorderColor`, `cellMeans:
true`). A per-row reading of that same grid is the obvious raw material for a height-band profile,
and it is computed before any zone work.

## 5. E-21 material roles (what a band's color resolves to)

`benchmarks/sculpture/material-map/{cottage,gatehouse}.json` — schema `material-map/v1`:
`map: [{role, block, placementRule, rationale}]`, `palette: [namespaced ids]`, `nearTonePairs`.
Cottage: 7 roles (stone_bricks=ground wall field, cobblestone=quoins/plinth/chimney,
dark_oak_log=timber frame [trim], white_terracotta=plaster infill, spruce_planks=roof field,
dark_oak_planks=eaves [roof], bricks=chimney cap [trim]). Gatehouse: 5 roles, walls=stone_bricks,
corners=cobblestone, roof=deepslate_tiles, arch=dark_oak_log [trim], gate leaf=dark_oak_planks
[openings]. `block → role` is 1:1 within each map. `placementRule ∈ {walls, corners-edges, trim,
roof, openings}` — note "trim"/"corners-edges" mark **linear features that cross height bands**
(timber studs, quoins, chimney shaft) and are by construction never a band's row-dominant.

## 6. The composed pipeline (integration surface)

`benchmarks/sculpture/durable-skin.mjs` `buildSkin(def)` (line 243), deterministic, double-run
byte-equality proof, no LLM:

1. value-true selection in named space (the gridResult described in §4) → `substitution`;
   divergence from the committed record **throws**.
2. `applySubstitution` on the build; `mapPolicy(def.policy, sub)` — THE one renaming point
   (line 154). Everything below runs in the shipped palette.
3. seal (roof+walls) → `structuralZones(occSealed)` → `zoneFill(…, skin:"exposure")` base coat.
4. secondaries splat (front=concept quantize, side=GLB), zone-gated via `allowedByZone`
   (from `policy.splat`), with a coverage PRECONDITION on the front candidate.
5. the E-23 splat-only baseline replayed (legacy palettes, prior zones) as the before-evidence.
6. coherent surface (T-087 course basin-fill + salt strip keyed on `zones` policy).
7. terminal gates: plaster invariant (`white_terracotta` count must be 0 on base+roof shells —
   note: under the derived cottage map, plaster on the *ground storey above the plinth* becomes
   **legitimate**, so this hard-coded base-zone check is in direct tension with this ticket),
   coverage gate ≥0.5 per zone, band evidence (roof materials ≥0.9, upper residue ≤0.05).
8. record: `durable-skin/<subj>.json|md` + `artifact.json` + sha256; `--offline` re-asserts.

Renders: `tryRenderAngle` via `src/view/multi-angle.mjs` (GL, best-effort); committed frames at
`pr/assets/frames/durable-<subj>-{before,after,strip}.png`.

## 7. Rules and constraints binding this ticket

- **E-25 Rule 2**: concept images immutable. The extractor reads `concept.png`; never writes/crops.
- **E-25 Rule 3**: zero subject-specific code; a subject is a registry entry. The current
  `SUBJECTS.policy` blocks are *data in a registry*, but per the epic they must become the recorded
  **fallback only** — never overriding a readable concept.
- **E-24 Rule 2 / durable-skin determinism**: anything added to `buildSkin` must be a pure function
  of committed inputs (concept PNG + material map + build artifact); double-run byte-equality and
  the `--offline` sha re-check must keep passing.
- Acceptance shape: extractor output `{bands: [{yRange, dominantRole, secondaries}]}`; fallback
  *recorded* when used; maps for both subjects **saved and diffed against the prior maps**;
  `npm test` green; an end-to-end cottage run with a before/after render.
- Ticket constraint repeated: align to **floor-lines**, never to `storeyBands().bands`
  (dominant-block bands — corrupted by the very noise being fixed).

## 8. Test conventions

`npm test` = artifact validate (good+bad) + `node --test "src/**/*.test.mjs"` (~1035 tests).
Pure cores live in `src/<area>/x.mjs` with sibling `x.test.mjs` building synthetic inputs in-file
(zone-fill.test.mjs builds a synthetic hut; image-grid.test.mjs builds synthetic RGBA buffers —
no binary fixtures committed). Impure runners live in `benchmarks/sculpture/*.mjs` behind named
npm scripts and are never under the test glob.

## 9. Facts that will shape any solution (assumptions surfaced)

- The concept is a 3/4 view on a near-white background; the foreground silhouette includes roof
  overhangs and a chimney rising past the ridge — image-row extents are not all "wall".
- A per-row dominant over the validate-mode grid mixes materials at band transitions and at gables
  (roof slopes flank upper-storey plaster in the same rows); any row segmentation sees noisy rows.
- Linear features (timber studs ~15-25% of a storey's cells, quoins, chimney) are present in every
  wall row but never row-dominant; they are exactly the `preserve`/`splat` materials today.
- The image-row → voxel-y correspondence is not given anywhere today; the build's y-extent comes
  from `occ.bounds`, the image's from the grid's filled rows. Perspective makes it approximate.
- `value-select/cottage.json` proves the named manifest *does* locate concept regions reliably
  enough to drive committed decisions (the same locator the band profile would lean on).
- The gatehouse has no committed value-select record (`valueSelectRecord: null`) — its durable-skin
  run is its own value-true result; any new gatehouse map record follows the same pattern.

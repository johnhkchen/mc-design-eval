# T-097-01 fixture-path-proof — Structure

File-level blueprint. Two created modules, one created runner, four modified modules, four modified
test files, one package.json line, one committed reference directory.

## Created

### `src/form/fixture-card.mjs` (pure)
The test-card generator and the proven state vocabulary (D1/D6).
- `export const CARD_ROWS` — frozen array of `{id, block, state|null, note}` rows: trapdoor ×6,
  fence ×5, stairs ×5, slab ×3, door ×4 (two 2-cell pairs: lower+upper), lantern ×2 — 25 rows. `id`
  is a stable slug (`trapdoor-north-open`, `fence-ew`, …). Door upper/lower are separate rows sharing
  a column (upper sits at y+1). The grammar (S-099) imports this table; states never restated.
- `export function cardLayout(rows = CARD_ROWS)` — pure layout: groups rows by block family, one
  family per z-line, 3-block x-pitch, fixtures at y=1 on a y=0 baseplate (smooth_stone, sized to the
  grid + 1-cell margin); returns `{cells: [{id, pos, block, state|null}], baseplate: {from, to}}`.
- `export function fixtureCard(opts = {})` — assembles the full schema-valid artifact: metadata
  (trial_id `fixture-card`, prompting_method_id `procedural/fixture-card@1`, model_id from
  `PHASE1_MODEL_ID`, seed 0, server_state_id `none/in-memory-voxel-world@1.20.1`), style, palette
  manifest = sorted unique blocks, one `{op:"voxel"}` (or `fill` for the baseplate) per cell.
  Deterministic: same input → byte-identical artifact. Does NOT validate (round-trip pattern:
  callers run `assertArtifact`).
- Imports: `PHASE1_MODEL_ID` from `../config.mjs` only. No table loads, no view imports.

### `src/form/fixture-card.test.mjs`
- Card passes the LIVE gate: `assertArtifact(fixtureCard())` — the AC #2 regression pin (offline).
- Row coverage: every FORM class needed by the kit (trapdoor/fence/stairs/slab/door/lantern) present;
  every trapdoor facing present; fence rows carry explicit connection booleans.
- Layout invariants: no two cells share a coordinate; all fixtures at y=1; determinism (two calls
  deep-equal); baseplate covers every fixture column.
- Decoder round-trip (D2): import `stateProps` from `../../render/src/version.mjs` (precedent:
  staged-loop.test.mjs imports render modules); synthetic descriptor tests (pinned radix examples)
  + for each CARD_ROW, `stateProps(...)` over the real minecraft-data descriptor inverts
  `blockStateId(block, state)` — block + every specified property round-trips.

### `benchmarks/sculpture/fixture-card.mjs` (impure runner)
The verification ladder (D1) + the committed regression reference. Shape follows shell-integrity.mjs
(seam invariant: wiring only, no logic).
1. `fixtureCard()` → `assertArtifact` (gate).
2. `expandArtifact` → `buildWorldFromVoxels(voxels, {strict:false})` → **fail loudly unless
   `unmapped.length === 0`**; print any unmapped rows.
3. Read-back: for each non-baseplate cell, `world.getBlockStateId(Vec3)` → `decodeStateId(id)` →
   assert block name + each specified property matches the row; collect per-row pass/fail table.
4. Best-effort renders via `renderViews(card, [...MULTI_ANGLE_GATE.azimuths, "front"], …)` into
   `benchmarks/sculpture/fixture-card/`; sha256 each PNG.
- Writes `benchmarks/sculpture/fixture-card/card.json` (the artifact), `record.json`
  (`schema: "fixture-card/v1"`, per-row verdicts, unmapped, render hashes), `fixture-card.md`
  (human table). Exit non-zero on any ladder failure (steps 1–3 only; render absence is recorded,
  not fatal — `reproducibility-excludes-gl-from-decisions`).

### `benchmarks/sculpture/fixture-card/` (committed reference)
`card.json`, `record.json`, `fixture-card.md`, `card-{front,+x+z,+x-z,-x-z,-x+z}.png`.

## Modified

### `render/src/version.mjs`
- `export function stateProps(block, states, stateId)` — pure inverse of `composeStateId` over an
  injected descriptor: returns `{name, properties: Record<string,string>}` (enum → value string,
  bool → "true"/"false", int → decimal string; matches the schema's stringly map). Throws if
  stateId outside `[minStateId, maxStateId]`.
- `export function decodeStateId(stateId)` — scans `mcData().blocksArray` for the owning block
  (memoized range index), delegates to `stateProps`. Used by the runner only.
- Internals `decodeDefaultIndices` refactored to share the same per-property radix walk (no
  behavior change to `blockStateId`).

### `src/view/occupancy.mjs` (D3)
- `occupancyFromCells(cellList)` — each cell may now carry `form` ("fixture"|"rail") and `state`;
  builds sparse `forms`/`states` Maps. Returned object gains `forms`, `states`,
  `formOf(x,y,z)` (cube when occupied and not in `forms`; null when empty), `solid(x,y,z)`.
  Existing fields (`cells`, `has`, `block`, `bounds`, `dims`, `size`) byte-identical in behavior.
- `artifactOccupancy(artifact, opts = {})` — passes each voxel's `state` through and classifies
  `form` via `opts.formOf ?? derivedFormClass` (import from `../form/kit.mjs`; only stores non-cube).
- `export function solidOccupancy(occ)` — derived Occupancy of cube cells only (D5); returns `occ`
  itself when `forms` is empty (zero-cost for all existing builds).
- JSDoc typedef updated.

### `src/view/structural-read.mjs` (D5)
- `openings(occ, dir)` — projects `solidOccupancy(occ)`; for each detected component, computes
  `dressing: {cells: number, blocks: string[]}` from non-solid occupied cells of `occ` whose
  projected (u,v) lies in the component's cellsUV (reuse `orthoSpec`/projection helpers — no new
  projection math). Return shape: existing fields unchanged + `dressing`.
- No other function changes (footprint/storeyBands/wallFields still read full occupancy — fixtures
  are placed mass for those reads).

### `src/view/shell-integrity.mjs` (D4)
- `closureCheck(occ, {regions})` — `occAt` uses `occ.solid ?? occ.has` (defensive: synthetic
  occupancies built by older helpers still work) plus `inRegion`; new return field
  `dressed: {cells: number}` — count of occupied non-solid cells inside regions. `closed` definition
  unchanged.
- `export function strayFixtures(occ, regions = [])` — list of `{key, pos, block, form}` for
  occupied non-solid cells outside every region. Pure detector; not part of the closure verdict.
- `rebuildArtifact(occ, template)` — emits `state` on a placement when `occ.states` has the cell;
  docstring caveat replaced.
- `plugClosure` internal re-occupancy loop must carry `form`/`state` of surviving cells forward
  (it rebuilds occupancy from `current.cells` — extend to copy `forms`/`states` entries).

### Test files
- `src/view/occupancy.test.mjs` — forms/states storage, formOf/solid semantics, sparse default
  (cube-only input → empty forms, `solidOccupancy` returns same object), artifactOccupancy
  classification with injected formOf and with the real kit classifier.
- `src/view/structural-read.test.mjs` — hut with fence-infilled window: opening still detected as
  window with `dressing.cells > 0`; undressed window: `dressing.cells === 0`; door variant.
- `src/view/shell-integrity.test.mjs` — AC #4 both ways: (a) dressed opening inside region →
  `closed: true`, `dressed.cells > 0`; (b) same fixture cells with NO region → breach (hole
  semantics); (c) `strayFixtures` flags a fence in a wall field, empty for dressed-only build;
  (d) rebuildArtifact state round-trip.
- `src/form/fixture-card.test.mjs` — as above.

### `package.json`
- `"card:fixtures": "node benchmarks/sculpture/fixture-card.mjs"`.

## Boundaries & ordering

1. Decoder (version.mjs) and card module are independent of the occupancy work — land first
   (they prove AC #1/#2 path).
2. Occupancy third class lands before structural-read/shell-integrity changes (both consume
   `solid`/`forms`).
3. Runner + committed reference last (consumes 1; renders need GL).
No deletions. No schema change expected (D6); if the gate rejects a card state at step 1, the
minimal `blockState` extension is made in `schema/design-artifact.schema.json` and recorded.

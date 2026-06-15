# T-097-01 fixture-path-proof — Research

Descriptive map of everything the fixture path touches. No solutions proposed here.

## 1. The artifact contract already carries state

- `schema/design-artifact.schema.json` — every placement shape (`voxel`/`line`/`box`/`fill`) has an
  optional `state: {$ref blockState}`. `blockState` = object, `minProperties: 1`,
  `additionalProperties: {type: "string"}` — **stringly typed**, so booleans must be `"true"`/`"false"`
  and there is no per-block property whitelist (semantics deferred to E-04 per the schema description).
- `src/artifact.mjs` — the live AJV gate (`Ajv2020 {allErrors, strict, discriminator}`) compiles that
  file verbatim. `parseArtifact`/`assertArtifact` are the single untrusted-input gate. Nothing in the
  gate inspects state values; any `{string: string}` map with ≥1 key passes today.
- `src/expand.mjs` — `expandPlacement` attaches `state` to each emitted voxel **only when the placement
  carries it** (`voxelAt`); last-write-wins replaces block AND state whole (no merge). So state flows
  losslessly artifact → `Voxel[] {pos, block, state?}`.

## 2. The render path applies state, and verification hooks exist

- `render/src/world.mjs` → `buildWorldFromVoxels`: `setBlock(world, pos, block, state)` per voxel;
  any throw is caught into `unmapped[] {pos, block, state, reason}` (TOTAL construction). `strict: true`
  throws after the full scan listing every unmapped voxel. **`unmapped` empty is the AC's witness.**
- `render/src/version.mjs` → `blockStateId(name, state)`: pins **1.20.1**, resolves name + partial
  state map to the numeric global state id via big-endian mixed-radix composition over
  `minecraft-data`'s ordered `states[]`. Omitted properties take the block **default** (not index 0).
  `valueIndex` accepts the schema's string forms (`"true"`/`"false"` for bools, strings for enums/ints).
  Unknown block / unknown property / illegal value each throw a located error → lands in `unmapped`.
  Private helpers `decodeDefaultIndices` / `composeStateId` exist; **no exported decoder** (id →
  property map) — reading back a placed block's properties currently requires re-deriving this math.
- `prismarine-world` worlds expose `getBlockStateId(pos)` — a read-back channel for programmatic
  verification (write-id vs independently-computed expected id).
- Render entry points: `renderViews(artifact, angles, opts)` (`src/view/multi-angle.mjs`) is what
  runners use (shell-integrity, multi-angle-gate); angle vocabulary includes the four config gate
  azimuths `MULTI_ANGLE_GATE.azimuths = ["+x+z","+x-z","-x-z","-x+z"]` (`src/config.mjs`) plus
  named ortho views (`front`, `right`, …). Lower-level: `renderBuild(build, opts)`
  (`render/src/render.mjs`) renders a `BuildResult` with comparable framing.
- **Whether prismarine-viewer actually renders these states correctly is the unproven half** — no
  pipeline stage has ever emitted a non-cube block (repo-wide grep confirms: zero trapdoor/fence
  placements in any generator, benchmark artifact, or test).

## 3. 1.20.1 state vocabularies for the four required fixture types (verified via minecraft-data)

| block | properties (enum values / bool) |
|---|---|
| `*_trapdoor` | facing ∈ {north,south,west,east}, half ∈ {top,bottom}, open (bool), powered (bool), waterlogged (bool) |
| `*_fence` | east/north/south/west/waterlogged — **all bools**; connections are explicit state, and our in-memory world has **no neighbor updates**, so an unstated fence renders as a lone post |
| `*_stairs` | facing ∈ {n,s,w,e}, half ∈ {top,bottom}, shape ∈ {straight, inner/outer left/right}, waterlogged |
| `*_slab` | type ∈ {top,bottom,double}, waterlogged |

Live kit records already recognize fixtures the pipeline then drops: cottage = `spruce_trapdoor`,
`spruce_door` (facing/half/hinge/open/powered), `lantern` (hanging); gatehouse = `stone_brick_stairs`.

## 4. Occupancy is solid-or-empty; consumers assume it

- `src/view/occupancy.mjs` — `occupancyFromCells(cellList)` takes `{pos, block}` (state silently
  dropped by `artifactOccupancy`'s map). `Occupancy` = `{bounds, dims, size, cells: Map<"x,y,z",
  blockId>, has(), block()}`. PURE, no deps beyond `expand.mjs`.
- Consumers iterating `occ.cells` as `[key, block]` or calling `occ.has` (any change to the Map value
  shape breaks them): `surface-grid.mjs` (`projectSurface` front-most hit via `occ.has`),
  `structural-read.mjs` (footprint, storeyBands, **openings** — enclosed-air detection on the projected
  mask, roofRegion, wallFields), `shell-integrity.mjs` (componentStrip, fillVoids, **closureCheck**
  `occAt = occ.has || inRegion`, plugClosure, rebuildArtifact — which explicitly documents "per-voxel
  state is not carried"), `zone-fill.mjs`, `hollow-carve.mjs`, `cutaway.mjs`, plus runners via
  `artifactOccupancy`.
- Semantics gap (the ticket's core): a fence-infilled window cell is **occupied** → `openings()` no
  longer sees the enclosed-air component (identity lost, AC #5) and `closureCheck` counts it as sealing
  skin (a dressed hole reads as wall); conversely if fixtures were naively excluded from occupancy the
  same window reads as a breach (a hole). Neither is "dressed".

## 5. Form classification already exists (one source of truth candidate)

- `src/form/kit.mjs` — `FORM_CLASSES = ["cube","fixture","rail"]`; `derivedFormClass(block)`:
  cube iff in the full-cube block→Lab table (`loadBlockTable()`, the E-10 305-block table via
  `src/color/block-table.mjs` — full-cube by construction), else `rail` by name pattern
  `/(?:fence|wall|pane|bars|rail|chain)$/`, else `fixture`. PURE (committed-JSON load only), already
  under the test glob. Caveat: "cube iff in the 305 table" — any full-cube block absent from the table
  would be misclassified non-cube (the table is the curated Lab set, not an exhaustive cube census).
- `openingRegions(occ, dirs)` (`shell-integrity.mjs`) back-projects each `openings()` bbox to a world
  AABB; `closureCheck`/`fillVoids` consume those as the allow-list ("honorary skin"). This is the
  existing vocabulary for "an `openings` aperture" in AC #4.

## 6. Test & runner conventions

- `npm test` = schema self-test + `node --test "src/**/*.test.mjs"` (1129 tests green at HEAD).
  PURE modules live under `src/`, are GL/network/Date/random-free. Impure wiring (GL renders, file
  I/O, model calls) lives in `benchmarks/sculpture/*.mjs` runners; renders are best-effort evidence,
  **decisions gate on deterministic checks only** (`reproducibility-excludes-gl-from-decisions`).
- Regression-reference precedent: committed frames under `pr/assets/frames/` and per-runner out dirs
  (`benchmarks/sculpture/<runner>/`); committed JSON records with a `schema` tag (e.g. `kit/v1`).
- Runner registration: `package.json` scripts (`kit:extract`, `shell:cottage`, …).

## 7. Constraints & assumptions surfaced

1. No air op — artifacts are ADD-only; a test-card is a fresh artifact, not an edit.
2. The world writes state ids directly: **no neighbor updates** — fence connections, stair shapes,
   door halves must be fully explicit in the artifact or they render in default state.
3. `metadata` requires trial_id/prompting_method_id/model_id/seed/server_state_id — the test-card
   artifact must carry full metadata to pass the live gate.
4. Schema booleans are strings; `valueIndex` tolerates both. Schema likely needs **no change** (AC #2
   expects "extend only if rejected" — to be proven, not assumed).
5. `rebuildArtifact` drops state by design; any occupancy that carries fixture info must keep that
   round-trip honest or document the loss.
6. Subject-specific constants are banned (E-25 Rule 3); fixture semantics must be policy/data-driven.
7. GL renders exist on this machine (committed frames at HEAD); the card render is feasible locally.

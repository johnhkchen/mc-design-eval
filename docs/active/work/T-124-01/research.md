# T-124-01 — style-pack-and-idioms — Research

Phase 1 of 6 (RDSPI). Descriptive map of what exists; no solutions proposed here.

## 1. Ticket scope (restated)

Five deliverables: (a) the **pack contract** — schema + pure loader for `palette` / `idioms` /
`proportions` / `decoration` / `conformance`, with a **`provenance`** material story the palette
derives from (diegetic, not optical); (b) **conformance checks** (pure, tested both ways): courses
even within a band, declared symmetry held, openings on rhythm, palette in-pack, watertight/
single-component; (c) the **idiom registry** — name → canonical generator, existing generators
registered, gaps built: **dormer, chimney, jetty**; (d) the first pack, **`rustic`**
(Tudor/farmstead, covering cottage + barn), human-reviewable; (e) every milestone idiom realizes on
synthetic specs with a committed render card, `unmapped` empty, no per-building constants,
`npm test` green.

## 2. The generator inventory (what the registry will register)

All pure (no GL/IO/Date/random), all under the `src/**/*.test.mjs` glob:

| Idiom (ticket name) | Canonical generator | File |
|---|---|---|
| gable/hip roof | `generateRoof(gables, family, opts)` → `{cells, counts, heights, owner, bandFloor, sheetKeys, capKeys}` | `src/view/roof-generate.mjs:191` |
| roof course family | `roofFamily(kitRows, vocab)` → `{field, stairs, slab, findings}` | `src/view/roof-generate.mjs:49` |
| pyramid/hip cap fit | `roof-hip-fit.mjs` (E-29 T-112); ridge fit `roof-ridge-fit.mjs` (T-109) | `src/form/` |
| arch | `archRing(spec)` → `{aperture, ring, headCells, jambCells}`; `flatHead(spec)` | `src/form/shaped-vocab.mjs:179,197` |
| stair/slab vocab | `stairRun(spec)`, `slabStep(spec)` | `src/form/shaped-vocab.mjs:68,100` |
| timber-frame grammar | `placementGrammar(occ, read, kit, opts)`; `bindKit(kitEntries,{bandNames})` | `src/form/placement-grammar.mjs` |
| opening treatments | `dressOpenings(targetOcc, apertures, treatments)`; `treatmentsFromKit(kitRecord, opts)` | `src/view/opening-dressing.mjs` |
| hollow/floor | `markHollowable` / `carveArtifact` (`src/view/hollow-carve.mjs`); `generateFloorplan(occ, read, spec)` (`src/view/floorplan.mjs:109`) |
| whole-provision | `generateProvision(fit, {family, policy, …})` → `{artifact, occ, provenance, roofPlan}` | `src/form/provision-generate.mjs:85` |

**Gaps confirmed absent:** no dormer generator; no jetty generator; chimney exists only as a
*protected mass* (`chimneyColumns(record, occ)` in `src/view/roof-swap.mjs:70` detects and protects
stacks during roof swap — nothing *generates* one). **No registry pattern exists anywhere** —
generators are imported and called directly by name (roof-fit → roof-generate → roof-swap chain);
the only name→value maps are small state vocabularies (`STAIR_FACING`, `ASCENT_FACING`).

**The generator idiom to follow** (`shaped-vocab.mjs` is the exemplar, T-105): module-level
`*_SCHEMA` tag + frozen `*_DEFAULTS`; `spec → placements[]` where a placement is
`{pos:[x,y,z], block, state?}`; validate spec shape and **throw** on malformation (fail-loud,
the `occupancyFromCells` precedent); block states only from the T-097-proven vocabulary
(stairs `{facing, half, shape:"straight"}`, slabs `{type}`); subject-agnostic — specs carry geometry
and block ids, no block-name or dimension constants in the module; exhaustive orientation tests
(all 4 ascents × variants) in a colocated `.test.mjs`.

## 3. Palette curation tooling (E-14/T-086) — what "value-validated once" can mean

- `src/color/block-table.mjs` — `loadBlockTable()` reads the committed
  `src/color/block-lab-table.json`: **305 full-cube, survival-obtainable, untinted blocks**, each
  `{block, texture, rgb, lab, var}`. "Is a real full-cube block" ≡ "in table".
- `src/color/value-select.mjs` — `familyOf(block)` (semantic families: log/planks/stone/brick/
  smooth), `familyCandidates`, `isExcludedCandidate`, `weightedDeltaE` (chroma weight **w=2** —
  hue drift reads as wrong material; T-086), `selectValueTrueBlock` /`selectValueTrueMap`
  (named-prior + ≥15% margin + ≥24 cells to switch). These need a concept *sample* to score
  against; without one they still give family/table/exclusion verdicts.
- `src/color/value-palette.mjs` — `resolveValueTruePalette()`: snap names → table entries, report
  true hex/Lab/L* (the "value-honest card").
- `src/color/cielab.mjs` — `deltaE76`, `nearestLab`, `nearestFlat` (λ=0.1 variance penalty).

Memory pins that bear directly: *value-drift-is-hue-not-lightness* (chroma-weighted select, report
true ΔE separately); *kit-verification-shading-offset* (remove global concept ΔL before flagging);
*concept-image-not-color-value-preview* (named blocks can render far darker than a concept shows).

## 4. Vocabulary authority (T-113) — where the pack must feed in

`src/form/material-vocabulary.mjs` is THE one composition point:
`composeVocabulary({policyNamed, policySpace, substitution, kitOverrides, kit, componentPlan,
allowed, …})` → `{combined, sub(), zones, ownSets, fixtures, treatments, record}`. The zone policy
shape is `Record<zone, {dominant, preserve?:[], splat?:[]}>`; `ownSetsOf(zones)` derives the
own-vocabulary sets used by settle-fixpoint and kit-presence. A conformance test
(`material-vocabulary.conformance.test.mjs`) structurally pins that no stage re-composes its own
vocabulary. **Any pack→build path must enter through this seam** (the story says the pack is the
authority's "natural data source on this path"). The kit path it parallels: kit/v1 files
(`benchmarks/sculpture/kit/{cottage,barn,…}.json`) carry per-entry
`{block, role, formClass, whereUsed, confidence, valueCheck:{verdict: "verified"|"flagged-mismatch"|…}}`
— the barn's `flagged-mismatch` roof entries are the failure mode the pack retires (T-121/T-122:
optics cannot decide materials; GLB textures are never read).

## 5. Conformance-check primitives that already exist

- **Watertight:** `closureCheck(occ, {regions?})` → `{closed, byDirection, mouths}` —
  `src/view/shell-integrity.mjs:308` (6-ray flood, declared openings count as skin).
- **Single component:** `componentLabels` / `strayVoxelStats` / `speckVerdict` —
  `src/form/voxel-components.mjs` (6-connectivity, deterministic label order).
- **Palette-in-set:** `kitPresence` (`src/form/kit-presence.mjs:73`) detects FOREIGN blocks vs zone
  own-vocabulary (fixpoint semantics, T-100); `allowedPalette(occ, bandNames, policy)`
  (`src/view/palette-cans.mjs`) builds the allowed union.
- **Courses/bands:** hydrology primitives `spillLevels` (`src/view/surface-pattern.mjs`),
  `regularizeRoofCourses`, `sealRoof` (`src/view/surface-coherence.mjs`) — repair-oriented, not
  predicate-oriented. **No existing pure predicates** for "courses even within a band", "declared
  symmetry held", or "openings aligned to rhythm" — these are new.
- Cage/morphology lessons (memory): closure gates are *no-regress vs input*; cage-solid shells make
  every layer read as a floor line — definitions must supply wallTop/floor lines explicitly.

## 6. Schema/validation + render + test infrastructure

- **AJV pattern** (`src/artifact.mjs`, T-001): JSON schema under `schema/*.schema.json`
  (draft 2020-12), `Ajv2020({allErrors, strict, discriminator})` + ajv-formats, memoized validator,
  non-throwing `parseArtifact` + fail-fast `assertArtifact` + `formatErrors`. Second schema already
  coexists: `schema/component-record.schema.json`. A pack schema follows this pattern verbatim.
- **Render card precedent** (T-097): pure layout `cardLayout(rows)` over `CARD_ROWS`
  (`src/form/fixture-card.mjs`) + impure benchmark runner `benchmarks/sculpture/fixture-card.mjs`
  that builds the artifact, renders via `renderArtifact(artifact, {outPath, view})`
  (`render/src/render-tool.mjs:50`), checks **`unmapped` empty** and state read-back.
  `renderOrbit` (`render/src/orbit.mjs:146`) does multi-azimuth sheets.
- **Tests:** `npm run test:unit` = `node --test "src/**/*.test.mjs"`, colocated files; `npm test`
  prepends artifact self-tests. Note: only `src/**` is globbed — pure code must live under `src/`
  to be tested; `benchmarks/**` runners are not unit-tested. `npm run` swallows flags without `--`
  (memory: a dropped flag once live-swept kit pins).

## 7. The two covered subjects (rustic pack ground truth)

Registries in `benchmarks/sculpture/durable-skin.mjs` (SUBJECTS map):

- **cottage** — concept `runs/014-vConcept-a-cottage/concept.png`; policy zones
  `base {dominant: stone_bricks, …}`, `upper`, `roof`; kit/material-map/zone-map under
  `benchmarks/sculpture/{kit,material-map,zone-map}/cottage.json`. Memory: concept ground storey is
  **stone** (plinth claim refuted); roof dominant divergence = dark_oak_planks.
- **barn** — concept `runs/017-…stone-tithe-barn…/concept.png`; policy `base {dominant:
  cobblestone}`, `roof`; same sibling records. The kit's auto-flag disabled its own roof
  (T-121/T-122) — the canonical motivation for human curation.

Both have committed material-map/v1 rows `{role, block, placementRule, rationale}` — the closest
existing thing to a curated palette, but optical-pipeline-derived, with no provenance story.

## 8. Constraints & assumptions surfaced

1. **Purity split:** contract/loader/checks/generators must be pure `src/` modules; anything
   touching GL or disk-render lives in `benchmarks/` runners (GL excluded from decisions —
   reproducibility memory).
2. **No per-building constants** (E-31 Rule 2); the generalization grep now checks *building*
   names — `rustic` pack data naming cottage/barn concepts is data, not code, but generator code
   must stay style-blind too. The grep matches comments (memory), so wording matters.
3. **Fail-loud specs** for generators; **named-findings degradation** for pack-level operations
   (the all-flagged-kit lesson: degrade, never stall — `zone-lens-gates-first-run`).
4. **Render-state validity:** dormer/chimney/jetty may only emit T-097-proven states; anything
   else must be full cubes. `unmapped` empty through the render is an acceptance criterion.
5. **Diegetic provenance:** the pack's role→block rationale cites a narrative (local stone/timber,
   wealth class, roofing economy); precedence contract: concept evidence > pack assignment >
   vernacular default; GLB textures never read for materials.
6. **Sibling work:** T-123-01 (GLB conditioning) is in flight in another thread (its ticket file is
   locally modified); S-124 is declared independent of S-123 — no shared files expected, but the
   registry will later be consumed by S-125/S-126 (parallel-roots memory: shared deps need their
   own ticket — the registry is exactly this ticket's deliverable, so siblings consume, not build).

## 9. Open questions carried to Design

- Pack file format: JSON validated by AJV (like artifacts) vs `.mjs` module (like CARD_ROWS)?
- Registry granularity: register raw generators vs thin spec-normalizing adapters?
- Do pack conformance checks *wrap* existing integrity keepers (closureCheck, componentStrip) or
  only add the new regularity predicates and reference the keepers by name?
- Where dormer/chimney/jetty sit: extend `shaped-vocab.mjs` vs a new module per the roof-generate
  precedent (they are roof-coupled constructs, not opening heads).
- How "value-validated once at pack-authoring time" is recorded so it doesn't silently re-run
  (pins/guarded-write precedent T-119 applies to committed records).

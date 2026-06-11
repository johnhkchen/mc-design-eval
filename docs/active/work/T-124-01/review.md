# T-124-01 — style-pack-and-idioms — Review

Phase 6 of 6. Handoff document: what changed, how it is tested, and what a human should look at.

## What shipped (against the acceptance criteria)

1. **The pack contract** — `schema/style-pack.schema.json` (draft 2020-12, strict,
   `additionalProperties:false` throughout) + `src/pack/style-pack.mjs`: memoized Ajv gate
   (`parseStylePack`/`assertStylePack`, the artifact.mjs idiom, `formatErrors` reused), a
   **semantic validation layer** (`validateStylePack`) for everything JSON Schema can't say, and
   `loadStylePack` (fail-loud). ✅
2. **The provenance field** — `provenance.sources` is the diegetic material story; every palette
   role must cite source keys (referential integrity enforced — a dangling citation fails the
   pack). `MATERIAL_PRECEDENCE` exports the three-tier contract (concept evidence > pack
   assignment > vernacular default) for S-125. GLB textures are structurally unreadable on this
   path — no GLB input exists in `src/pack/` or below. "Value-validated once": E-14/T-086
   verdicts are committed in the pack (`palette[].valueCheck`) and **re-derived
   deterministically** from the committed block-Lab table at validation time (formClass via the
   kit ground-truth rule, table membership, family, Lab to 1e-9, excluded-candidate rejection) —
   a stale snapshot fails. ✅
3. **Conformance checks** — `src/pack/conformance.mjs`, all pure, all tested both ways:
   `courses-even` (in-band vocabulary + single-material courses unless the band declares
   `mixed`), `symmetry-held` (declared plane only, half-integral planes supported),
   `openings-rhythm` (edge-to-edge spacing bounds + shared sill per wall group),
   `palette-in-pack` (T-100 foreign-block semantics over palette ∪ decoration), plus
   `watertight`/`single-component` as thin wrappers over the E-25 keepers
   (`closureCheck`/`componentStrip` — reuse, not reimplementation). `runConformance` runs exactly
   the pack-listed checks; unknown name throws. Declarations are explicit (bands/plane/openings)
   — never inferred (the cage-solid-shell lesson). ✅
4. **The idiom registry** — `src/pack/idiom-registry.mjs`: 11 `construct` entries (uniform
   spec → `{cells,…}`: roof.gable/hip/pyramid adapters over `generateRoof`, arch + head.flat over
   shaped-vocab, course.stairs/slab, and the new dormer/chimney/jetty/plinth) + 4 `pass` entries
   (timber-frame, opening-dressing, hollow, floorplan — name-registered with natural signatures,
   deliberately not force-fitted into spec→placements). Every entry carries a `paramsSchema`
   (style-level partials; compiles under Ajv, accepts `{}`). **Gap generators built** in
   `src/form/idiom-constructs.mjs`, shaped-vocab charter (fail-loud specs, T-097-proven states
   only, subject-agnostic): dormer ×4 facings with the aperture-as-labels contract, chimney with
   crown-oversail/slab caps + `columns` for roof-swap protection, jetty with `upperWallLine`
   metadata, plinth band. ✅
5. **The first pack** — `packs/rustic.json` (Tudor/farmstead family): 6 provenance sources
   (fieldstone, quarried ashlar, oak coppice, sawn softwood, lime render, kiln brick), 13 palette
   roles each citing its source, three-band zone seats (base/upper/roof) that `packPolicy`
   reshapes into the T-113 `composeVocabulary` policy (smoke-tested against the real authority),
   15 idioms with style defaults, 45° pitch class, opening rhythm 2–5. Grounded line-by-line in
   the committed cottage/barn material maps; the cottage's ashlar ground storey vs the pack's
   fieldstone default is documented in the role rationale as the precedence worked example. ✅
6. **Render card + green tests** — `src/pack/idiom-card.mjs` (pure layout, 20 committed synthetic
   specs, coverage pin: every registry construct must appear) +
   `benchmarks/sculpture/idiom-card.mjs` (`npm run idioms:card`): AJV gate pass, **`unmapped: 0`**
   (2715/2715 voxels placed), 5 renders (4 gate azimuths + front) committed with sha256 receipts
   under `benchmarks/sculpture/idiom-card/`. No per-building constants anywhere in code (style
   data lives only in the pack + the card's committed spec table, CARD_ROWS status).
   **`npm test`: 1703/1703 pass.** ✅

## Files

- **Created (src):** `src/form/idiom-constructs.mjs`(+test), `src/pack/idiom-registry.mjs`(+test),
  `src/pack/conformance.mjs`(+test), `src/pack/style-pack.mjs`(+test),
  `src/pack/idiom-card.mjs`(+test) — 5 modules, 50 new unit tests, all pure.
- **Created (other):** `schema/style-pack.schema.json`, `packs/rustic.json`, `packs/README.md`,
  `scripts/validate-pack.mjs`, `benchmarks/sculpture/idiom-card.mjs` + committed card outputs
  (card.json, record.json, idiom-card.md, 5 PNGs).
- **Modified:** `package.json` (scripts `pack:validate`, `idioms:card` — no test-chain changes).
- **Deleted:** none.

## Test coverage

Strong: constructs (orientation-exhaustive ×4 facings/edges, malformed-spec throws on every
generator), conformance (both ways on every check + driver), pack semantics (each rule has a
failing fixture + the rustic pack validates against the real 305 table), registry (realization +
determinism + state legality per construct), card (overlap-free layout, coverage pin, AJV gate).
**Gaps:** (a) the impure runner (`benchmarks/sculpture/idiom-card.mjs`) is not unit-tested
(seam-invariant: wiring only — same status as fixture-card); (b) render PNGs are evidence with
sha256 receipts, not a gated comparison (`reproducibility-excludes-gl-from-decisions`); (c) no
per-cell state read-back on the idiom card — the state vocabulary is pinned by the T-097
CARD_ROWS card, and the idiom card emits only that vocabulary (asserted offline).

## Open concerns / known limitations

1. **`roof.pyramid` is the adapter's hip-cap record**, not roof-hip-fit's fitted output — correct
   for program-driven realization (corner shapes verified per quadrant) but untested against
   fitted real-subject records. S-125's program executor should reuse these adapters.
2. **`plinth` was listed in the ticket as an existing generator; it did not exist** — built here
   (`plinthBand`). Worth a glance that its semantics (perimeter band, optional inset) match what
   S-125's recognition vocabulary expects.
3. **`courses-even` semantics are deliberately simple** (single-material per course unless the
   band opts into `mixed`). Real timber-frame bands will need the `mixed` flag; if the workshop
   wants run-regularity within mixed courses, that's an S-126 extension (reuse zone-fill `inRun`
   per the surface-paint memory).
4. **Pass-idiom params are unconstrained** (`additionalProperties:true`) — their real input
   contracts live in their own modules; the registry only resolves names. Tightening is S-125/126
   work when programs start carrying pass parameters.
5. **The rustic pack's rationale prose names cottage/barn** as worked examples. The
   generalization grep checks *code* for building names (E-31 Rule 2 sanctions per-style data);
   if the grep ever sweeps `packs/`, these strings will match (the grep-matches-comments memory).
6. **`jetty` realizes context-free** (beam + joists + the new wall line as metadata) — on the
   card it reads as an abstract ledge; its full read needs the storey walls, which arrive with
   the S-125 program executor.
7. **Sibling activity:** T-123-01 (form-sketch) landed `sketch:*` npm scripts in parallel; no
   file conflicts with this ticket.

## For the human reviewer

Read `packs/rustic.json` top to bottom against the two concepts (the AC's line-by-line check) —
especially the six `provenance.sources` narratives and each role's rationale. Then eyeball
`benchmarks/sculpture/idiom-card/view-card-+x+z.png`: dormers should read as dormers, the
chimney crown should oversail, both gable axes should be present. `npm run pack:validate` and
`npm run idioms:card` reproduce both verdicts.

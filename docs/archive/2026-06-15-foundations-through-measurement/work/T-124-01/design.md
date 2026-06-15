# T-124-01 — style-pack-and-idioms — Design

Phase 2 of 6. Decisions grounded in `research.md`; alternatives recorded with rejection reasons.

## D1. Pack format: committed JSON + AJV schema + pure loader

**Decision.** The pack is a **JSON data artifact** (`packs/rustic.json`) validated by
`schema/style-pack.schema.json` (draft 2020-12) through a pure loader module following the
`artifact.mjs` idiom exactly: memoized `Ajv2020({allErrors, strict, discriminator})`, non-throwing
`parseStylePack`, fail-fast `assertStylePack`, `formatErrors` reuse.

**Why.** (a) The AC demands a *human-reviewable artifact* readable "line by line" against the
concepts — data, not code. (b) E-31 Rule 2 says the pack file is the **only** style-specific
artifact; JSON makes "no style code" structurally checkable (the generalization grep stays
meaningful — style names live in one data file). (c) Two schemas already coexist under `schema/`;
the pattern is proven.

**Rejected:** pack as `.mjs` module (CARD_ROWS-style). Code-shaped packs invite per-style logic,
defeat the grep, and can't be schema-gated. Rejected: per-subject pack files (that re-creates the
kit-per-subject failure mode this ticket retires).

**Location.** New top-level `packs/` (style packs are product artifacts serving "every building of
the style, and later, the town" — not benchmark-subject data like `benchmarks/sculpture/kit/`).

## D2. Pack contract shape (the five required fields + provenance)

```jsonc
{
  "schema": "style-pack/v1",
  "style": "rustic",
  "provenance": {                       // the material STORY — diegetic, not optical
    "setting": "…",                     // free narrative
    "sources": { "<key>": "…" },        // named availability facts (local-fieldstone, oak-coppice, …)
    "wealthClass": "…", "roofingEconomy": "…"
  },
  "palette": [ { "role": "wall.plinth", "block": "cobblestone",
                 "rationale": "…", "provenance": ["local-fieldstone"],   // MUST cite source keys
                 "valueCheck": { "lab": [..], "family": "stone", "inTable": true } } ],
  "idioms":  [ { "name": "roof.gable", "params": { /* style defaults/bounds */ } } ],
  "proportions": { "storeyHeight": {"min":3,"max":4}, "pitchClasses": [45],
                   "openingRhythm": {"minSpacing":2,"maxSpacing":5} },
  "decoration": [ { "item": "lantern", "where": ["door"], "block": "lantern" } ],
  "conformance": { "checks": ["courses-even","symmetry-held","openings-rhythm",
                              "palette-in-pack","watertight","single-component"],
                   "params": { /* per-check thresholds, named */ } }
}
```

**Provenance is enforced referentially:** every palette entry's `provenance` array must name keys
that exist in `provenance.sources` — schema can't express this, so a semantic validation layer
(`validateStylePack`) checks it (plus: idiom names resolvable in the registry, palette blocks in
the 305 table for cubes / known fixture-rail vocabulary otherwise, proportions sane). The
**precedence contract** ships as an exported constant
`MATERIAL_PRECEDENCE = ["concept-evidence", "pack-assignment", "vernacular-default"]` consumed by
S-125; the "GLB textures never read" rule is a structural property (no GLB input exists anywhere
on the pack path) restated in the module doc and pinned by the absence of any glb import — noted
for the reviewer rather than tested.

## D3. "Value-validated once at pack-authoring time" — committed snapshot, deterministic re-check

**Decision.** The E-14/T-086 verdicts are run **once by the pack author** and the results are
**committed inside the pack** (`palette[].valueCheck`: family, table Lab, inTable). A unit test
*recomputes* these from the committed `block-lab-table.json` (`loadBlockTable`, `familyOf`,
`isExcludedCandidate`) and asserts the snapshot matches — deterministic, no optical sampling on
the hot path, no silent re-runs (T-119 guarded-record spirit). Concept-swatch *scoring*
(`selectValueTrueBlock`) is an authoring aid, not a load-time dependency: the pack records
table-truth (real Lab/L* per block), which is what kills the "named block renders darker than the
concept showed" drift.

**Rejected:** re-running value selection at load time (needs concept images → optical path back in
the loop — exactly what the ticket retires) and validating only at load without a snapshot (the
human reviewer should see the value evidence *in the artifact* they review).

## D4. Conformance checks: new pure predicates + thin wrappers over E-25 keepers

**Decision.** New module of **pure predicates**, each returning `{name, passed, findings[]}` with
a driver `runConformance(build, declarations, pack)` → `{passed, checks[]}`:

- `coursesEvenCheck` — within each declared band, the band-material boundary y is uniform across
  footprint columns and each course (y-layer) is single-material from the band's set. Definition
  is column-comparative, not repair-oriented (the existing `spillLevels` machinery repairs; this
  *judges*).
- `symmetryHeldCheck` — a *declared* mirror plane (`{axis:"x"|"z", at}`) must map occupancy onto
  itself; undeclared symmetry is never demanded (declared-only, per AC wording).
- `openingsRhythmCheck` — opening centers along a wall run must keep spacing within the pack's
  `openingRhythm` bounds and share a sill line per storey.
- `paletteInPackCheck` — every placed bare block ∈ palette ∪ decoration ∪ derived shaped family
  (stairs/slabs of palette cubes); foreign block = fail with named cells (T-100 foreign
  semantics).
- `watertightCheck` / `singleComponentCheck` — **wrappers** delegating to `closureCheck`
  (declared openings as regions) and `speckVerdict`/`componentLabels`. No re-implementation; the
  pack's check list is one vocabulary, the E-25 keepers stay the single source of truth.

Inputs stay primitive (`occ`, `placements`, plus a `declarations` object: bands with wallTop/floor
lines, symmetry plane, opening boxes) — the cage-solid-shell lesson says definitions must supply
storey lines, never infer them from occupancy. Checks are gates (verdicts), never mutate.

**Rejected:** folding checks into the existing repair passes (repair ≠ judgement; the workshop
needs cheap deterministic verdicts per round) and inferring symmetry/bands from the build (the
declared program is the contract; inference re-opens detector-fragility, T-116 lesson).

## D5. Idiom registry: uniform `construct` entries + documented `pass` entries

**Decision.** `IDIOM_REGISTRY`: frozen map `name → {kind, generate, paramsSchema, source}`.

- `kind:"construct"` — **spec → placements** generators, uniformly callable: `roof.gable`,
  `roof.hip`, `roof.pyramid` (thin adapters over `generateRoof` + gable-record construction),
  `arch`, `head.flat`, `course.stairs`, `course.slab` (shaped-vocab), and the new `dormer`,
  `chimney`, `jetty`, `plinth`. These are what "realize canonically on synthetic specs" — the
  render card iterates exactly this set.
- `kind:"pass"` — build-transform stages with their natural signatures (`timber-frame` →
  `placementGrammar`, `opening-dressing` → `dressOpenings`, `hollow` → `markHollowable`/
  `carveArtifact`, `floorplan` → `generateFloorplan`). Registered for name-resolution (S-125
  programs name them) but not force-fitted into spec→placements.

`paramsSchema` is a JSON-schema fragment per idiom (the ticket's "idioms (names + parameter
schemas)"); pack idiom defaults are validated against it in `validateStylePack`.

**Rejected:** one uniform signature for everything (grammar/dressing need full build context — a
fake uniform adapter would hide required inputs and break purity); no registry, direct imports
(S-125's recognized programs arrive as *names* — a name→generator table is the deliverable).

## D6. Gap generators: new pure module `src/form/idiom-constructs.mjs`

Follow the `shaped-vocab.mjs` idiom verbatim (frozen `*_DEFAULTS`, spec validation that throws,
canonical emission order, only T-097-proven states, subject-agnostic):

- **`dormerGable(spec)`** — `{origin, facing(±x|±z), width(odd ≥3), depth(≥2), eaveY, wallBlock,
  roofBlock(stairs id), faceBlock?, sill?}` → cheek walls (full cubes), front gable face with a
  window aperture (reported as aperture keys for the dressing pass, mirroring archRing's label
  contract), mini stair roof (walk courses both pitches), ridge cap row. Returns `{cells,
  aperture, ridgeY}`.
- **`chimneyStack(spec)`** — `{base, footprint{w,d}, height(≥1), block, cap?("crown"|"slab"|null),
  capBlock?}` → solid shaft courses; crown = one-ring oversail course of full cubes at top
  (memory: dome-belly/oversail must overhang to read); slab cap uses proven `{type}` state.
  Returns `{cells, topY, columns}` — `columns` feeds the existing `chimneyColumns` protection.
- **`jettyOverhang(spec)`** — `{edge:{axis, side(±), range:[lo,hi]}, y, overhang(=1), beamBlock,
  joistBlock?, joistEvery?}` → bressummer beam course projecting `overhang` beyond the wall line
  along the edge range, optional joist ends beneath (full cubes), returns `{cells, upperWallLine}`
  so the caller raises the upper storey flush with the new line.
- **`plinthBand(spec)`** — `{footprint:{x0,x1,z0,z1}, y0, courses(≥1), block, inset?}` →
  perimeter band of full-cube courses. (The ticket lists plinth among "existing" generators;
  research found none — building it here is the honest gap-fill and it is trivial.)

Exhaustive orientation tests: dormer ×4 facings, jetty ×4 edges, chimney cap variants, plinth
inset/no-inset — the stairRun 4×2 test pattern.

**Rejected:** extending `shaped-vocab.mjs` (its charter is fit-seam opening heads + slope
courses); composing dormers from raw stairRun calls in benchmarks (must be unit-tested, pure,
registry-resolvable).

## D7. Pack → vocabulary-authority seam

`packPolicy(pack, bandNames)` → the `policyNamed` zone policy (`{dominant, preserve}` per band)
derived from palette roles, so the pack feeds `composeVocabulary` as its natural data source
(T-113 stays the ONE composition point; no new composition site). Small, pure, tested. The kit
path remains untouched — the pack path is parallel, selected by the caller (S-126 wiring is out
of scope here).

## D8. Render card: pure layout + impure runner, committed PNG

`idiomCardLayout()` (pure, in `src/pack/`) lays every milestone **construct** idiom out on a
baseplate grid from synthetic specs (the fixture-card pattern); runner
`benchmarks/sculpture/idiom-card.mjs` builds the artifact, renders 4 azimuths via
`renderArtifact`/`renderOrbit`, **fails on non-empty `unmapped`**, writes
`benchmarks/sculpture/idiom-card/*.png` + a small JSON receipt; npm script `idioms:card` (args
after `--`, per the flag-swallowing memory). PNGs + receipt are committed (fixture-card
precedent). No pins are written (no judge involvement → no pin-guard surface).

## D9. The rustic pack content (authored in Implement, reviewed as data)

Roles from the two subjects' committed maps/policies, assigned from the **story** (provenance
sources: local fieldstone, oak coppice timber, lime render, yeoman wealth class, wooden-shingle
roofing economy): `wall.plinth`(cobblestone), `wall.field.ground`(stone variants),
`wall.field.upper`(white render family), `frame.timber`(dark oak), `roof.field`(dark-oak/spruce
stair family), `roof.ridge`, `chimney.stack`(bricks/cobble), openings (spruce door/trapdoor/
fence + lantern in decoration). Cottage's stone_bricks-vs-cobblestone divergence is the worked
example of precedence: pack default cobblestone, concept evidence may override per subject.
Proportions from the concepts: storey 3–4, pitch class 45° (stair-legal), opening rhythm 2–5.

## D10. Out of scope (guarding the seam)

No workshop loop (S-126), no recognition prompt/schema (S-125), no judge or gate calls, no changes
to kit machinery or `composeVocabulary` internals, no GLB conditioning (T-123 sibling). The
deliverable boundary is: contract + checks + registry + constructs + pack + card, all pure or
render-only.

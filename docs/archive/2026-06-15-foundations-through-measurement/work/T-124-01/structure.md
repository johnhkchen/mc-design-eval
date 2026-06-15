# T-124-01 — style-pack-and-idioms — Structure

Phase 3 of 6. File-level blueprint: what is created/modified, module boundaries, public
interfaces, and the build order. No file is deleted.

## Created files

### 1. `src/form/idiom-constructs.mjs` — the gap generators (pure)

Charter: roof-feature and band constructs the milestone pack needs, in the `shaped-vocab.mjs`
idiom (spec → placements; THROW on malformed spec; only T-097-proven states; subject-agnostic —
no block names or dimensions hardcoded). No imports from `src/pack/` (constructs are below the
pack layer).

```js
export const IDIOM_CONSTRUCTS_SCHEMA = "idiom-constructs/v1";
export const IDIOM_CONSTRUCT_DEFAULTS = Object.freeze({ joistEvery: 2, dormerMinWidth: 3, … });

export function dormerGable(spec)
//  {origin:[x,y,z], facing:"+x"|"-x"|"+z"|"-z", width(odd≥3), depth(≥2),
//   wallBlock, roofBlock, faceBlock?=wallBlock}
//  → {cells:[{pos,block,state?}], aperture:string[], ridgeY:number}
//  cheeks + gable face (aperture cells OMITTED from cells, reported as keys — the archRing
//  label contract), stair roof both pitches (walk), ridge row.

export function chimneyStack(spec)
//  {base:[x,y,z], footprint?:{w:1..,d:1..}=1×1, height(≥1), block,
//   cap?: "crown"|"slab"|null, capBlock?=block}
//  → {cells, topY, columns:Set<"x,z">}   // columns feeds roof-swap chimney protection

export function jettyOverhang(spec)
//  {edge:{axis:"x"|"z", side:"+"|"-", range:[lo,hi]}, y, overhang?=1,
//   beamBlock, joistBlock?, joistEvery?}
//  → {cells, upperWallLine:{axis, at}}   // caller raises the upper storey flush to this line

export function plinthBand(spec)
//  {footprint:{x0,x1,z0,z1}, y0, courses(≥1), block, inset?=0}
//  → {cells}                             // perimeter band of full-cube courses
```

### 2. `src/pack/idiom-registry.mjs` — name → canonical generator (pure)

```js
export const IDIOM_REGISTRY_SCHEMA = "idiom-registry/v1";
export function idiomNames()            // sorted names (deterministic)
export function getIdiom(name)          // entry or THROW (unknown idiom is fail-loud)
export const IDIOM_REGISTRY = Object.freeze({
  // kind:"construct" — uniform spec→{cells,…}; the render card iterates exactly these
  "roof.gable":   { kind:"construct", generate: roofGableConstruct,  paramsSchema:{…}, source:"src/view/roof-generate.mjs" },
  "roof.hip":     { kind:"construct", generate: roofHipConstruct,    … },
  "roof.pyramid": { kind:"construct", generate: roofPyramidConstruct,… },
  "arch":         { kind:"construct", generate: archConstruct,       source:"src/form/shaped-vocab.mjs" },
  "head.flat":    { kind:"construct", generate: flatHeadConstruct,   … },
  "course.stairs":{ kind:"construct", generate: stairRun,            … },
  "course.slab":  { kind:"construct", generate: slabStep,            … },
  "dormer":       { kind:"construct", generate: dormerGable,         source:"src/form/idiom-constructs.mjs" },
  "chimney":      { kind:"construct", generate: chimneyStack,        … },
  "jetty":        { kind:"construct", generate: jettyOverhang,       … },
  "plinth":       { kind:"construct", generate: plinthBand,          … },
  // kind:"pass" — build-transform stages; registered for name resolution, natural signatures
  "timber-frame":     { kind:"pass", fn: placementGrammar,   source:"src/form/placement-grammar.mjs" },
  "opening-dressing": { kind:"pass", fn: dressOpenings,      source:"src/view/opening-dressing.mjs" },
  "hollow":           { kind:"pass", fn: markHollowable,     source:"src/view/hollow-carve.mjs" },
  "floorplan":        { kind:"pass", fn: generateFloorplan,  source:"src/view/floorplan.mjs" },
});
```

Roof adapters (`roofGableConstruct` etc., module-private but exported for tests) accept a simple
spec `{footprint:{x0,x1,z0,z1}, ridgeAxis, eaveY, ridgeY, blocks:{field,stairs,slab}, ends?}`,
build the gable record(s) `generateRoof` expects (template: the roof-generate.test.mjs fixtures),
call `generateRoof`, and return `{cells, …}`. `paramsSchema` values are plain JSON-schema
fragments (objects), validated by ajv inside `validateStylePack` — not compiled here (keeps this
module dependency-light).

### 3. `schema/style-pack.schema.json` — the pack JSON Schema (draft 2020-12)

Top-level required: `schema("style-pack/v1")`, `style`, `provenance{setting, sources(minProperties 1)}`,
`palette[]{role, block, rationale, provenance[](minItems 1), valueCheck{family, lab, inTable}}`,
`idioms[]{name, params}`, `proportions{storeyHeight{min,max}, pitchClasses[], openingRhythm{minSpacing,maxSpacing}}`,
`decoration[]{item, block, where[]}`, `conformance{checks[], params}`.
`additionalProperties:false` throughout (strict, reviewable line by line).

### 4. `src/pack/style-pack.mjs` — loader + semantic validation + authority seam (pure)

```js
export const STYLE_PACK_SCHEMA = "style-pack/v1";
export const MATERIAL_PRECEDENCE = Object.freeze(["concept-evidence","pack-assignment","vernacular-default"]);
export function loadPackSchema()                  // schema/style-pack.schema.json
export function compilePackValidator(schema?)     // artifact.mjs idiom, memoized internally
export function parseStylePack(input)             // → {ok, pack} | {ok:false, code, errors}
export function assertStylePack(input)            // throw-on-invalid
export function validateStylePack(pack, {registry?, blockTable?})
//  semantic layer (beyond JSON Schema): provenance refs resolve to provenance.sources keys;
//  idiom names resolve in the registry and pack params validate vs paramsSchema;
//  cube palette blocks in the 305 table with valueCheck.{family,lab} matching a recompute
//  (familyOf + table Lab) — the committed-snapshot re-check from design D3;
//  non-cube blocks classified fixture/rail by the kit.mjs formClass rule;
//  proportions sane (min≤max, pitch classes stair-legal).
//  → {ok, findings:[{level:"error"|"warn", where, msg}]}
export function loadStylePack(path)               // readFileSync + assert + validate (fail-loud)
export function packPolicy(pack, bandNames)       // → policyNamed for composeVocabulary (T-113 seam)
```

`formatErrors` is imported from `src/artifact.mjs` (reuse, not copy). IO is limited to the
committed-file idiom (`loadPackSchema`, `loadStylePack`) — same purity class as
`loadBlockTable`/`loadSchema`.

### 5. `src/pack/conformance.mjs` — the per-round gate predicates (pure)

```js
export const CONFORMANCE_SCHEMA = "pack-conformance/v1";
export const CONFORMANCE_DEFAULTS = Object.freeze({ speckFraction: 0.02, … });
// every check: (build, declarations, params) → {name, passed, findings:[string]}
export function coursesEvenCheck(occ, {bands})        // band boundary y uniform per column; single-material courses
export function symmetryHeldCheck(occ, {plane})       // declared {axis,at} mirror maps occ onto itself
export function openingsRhythmCheck({openings, walls}, {openingRhythm})  // spacing in bounds, shared sill per storey
export function paletteInPackCheck(occ, pack)         // bare blocks ⊆ palette ∪ decoration ∪ shaped family
export function watertightCheck(occ, {regions})       // wraps closureCheck (shell-integrity)
export function singleComponentCheck(occ, params)     // wraps componentLabels + speckVerdict
export function runConformance({occ, declarations}, pack)  // → {passed, checks:[…]} driven by pack.conformance.checks
```

Imports: `closureCheck`/`openingRegions` (src/view/shell-integrity.mjs), `componentLabels`/
`speckVerdict` (src/form/voxel-components.mjs), `bareBlock` (src/view/occupancy.mjs). Declarations
carry explicit band floor/wallTop lines (cage-solid-shell lesson) — never inferred. Unknown check
name in a pack → THROW (fail-loud; the pack was validated upstream).

### 6. `src/pack/idiom-card.mjs` — pure card layout

```js
export const IDIOM_CARD_SCHEMA = "idiom-card/v1";
export const IDIOM_CARD_SPECS = Object.freeze([ /* one synthetic spec per construct idiom,
  incl. dormer ×4 facings, jetty ×4 edges, chimney ×3 caps, both roof axes */ ]);
export function idiomCardLayout(specs?)   // → {cells, baseplate, plots:[{idiom, origin, label}]}
```

Grid placement mirrors `cardLayout` (fixture-card): fixed pitch, one row per idiom family,
deterministic order. Blocks used in specs come from the rustic palette (data passed in specs —
the module itself stays block-name-free except the committed spec table, which is the card's
fixture data, same status as CARD_ROWS).

### 7. `benchmarks/sculpture/idiom-card.mjs` — impure render runner

Mirrors `benchmarks/sculpture/fixture-card.mjs`: layout → artifact (AJV-gated via
`assertArtifact`) → `renderArtifact` ×4 azimuths → **exit non-zero if `unmapped` non-empty** →
write `benchmarks/sculpture/idiom-card/{card-az###.png, idiom-card.json}` (receipt: specs hash,
counts, unmapped, paths). No pins written; no judge calls.

### 8. `packs/rustic.json` — the first pack (data artifact, design D9)

Plus `packs/README.md` (5 lines: what a pack is, how it's validated, pointer to schema + loader).

## Modified files

- `package.json` — add scripts: `"idioms:card": "node benchmarks/sculpture/idiom-card.mjs"` and
  `"pack:validate": "node scripts/validate-pack.mjs packs/rustic.json"` (thin CLI:
  `scripts/validate-pack.mjs`, created, ~20 lines, calls `loadStylePack` and prints findings).
  Nothing in the existing `test` chain changes — new `*.test.mjs` files ride the existing glob.

## Test files (colocated, node:test)

- `src/form/idiom-constructs.test.mjs` — exhaustive orientation: dormer ×4 facings (cell counts,
  aperture placement, stair states legal per facing), jetty ×4 edge sides (beam line off-wall,
  upperWallLine), chimney (1×1/2×2, crown oversail ring, slab cap state), plinth (inset,
  perimeter-only); malformed-spec throws for every generator (both-ways).
- `src/pack/idiom-registry.test.mjs` — every name resolves; constructs callable on minimal specs
  and return non-empty cells with legal states; unknown name throws; registry frozen.
- `src/pack/style-pack.test.mjs` — schema accepts a minimal valid pack / rejects each missing
  field; semantic validator both-ways (dangling provenance ref, unknown idiom, off-table cube,
  wrong valueCheck Lab snapshot, insane proportions); `packPolicy` shape; **rustic.json itself
  loads + validates clean** (the pack is under test).
- `src/pack/conformance.test.mjs` — each check both-ways on synthetic fixtures (even vs ragged
  band boundary; mirrored vs perturbed occ; rhythmic vs off-rhythm openings; in-pack vs foreign
  block; closed vs holed shell; single vs two-component); `runConformance` honors the pack's
  check list and throws on unknown names.
- `src/pack/idiom-card.test.mjs` — layout deterministic, plots non-overlapping, every construct
  idiom present, all states from the proven vocabulary.

## Build order (dependency-driven)

1. `idiom-constructs.mjs` (+tests) — leaf, no new deps.
2. `idiom-registry.mjs` (+tests) — imports 1 + existing generators.
3. `style-pack.schema.json` + `style-pack.mjs` (+tests) — imports 2 (registry for validation),
   color/block-table, artifact.formatErrors.
4. `conformance.mjs` (+tests) — imports E-25 keepers; independent of 3 (parallel-safe).
5. `packs/rustic.json` (+ rustic load test inside style-pack.test.mjs) — needs 3; authored against
   cottage/barn concepts + committed maps.
6. `idiom-card.mjs` (pure) + runner + npm scripts — needs 2 + 5 (palette blocks for specs);
   render, commit PNGs + receipt.

Each step is one atomic commit; `npm test` green at every boundary.

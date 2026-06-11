# T-128-01 — brush-registry — Structure

Phase 3 of 6. File-level changes, module boundaries, public interfaces, ordering.

## Module map (new edges only)

```
schema/brush.schema.json                      (new — the descriptor schema)
src/pack/idiom-registry.mjs                   (modified — metadata + 4 surface entries + brush aliases)
   imports += zone-fill, face-paint, surface-pattern        (src/view — same layer it already imports)
src/pack/brush-preview.mjs                    (new, pure — substrates + pass-preview realization)
   imports boxShell (src/workshop/program.mjs), occupancyFromCells (src/view/occupancy.mjs)
src/pack/brush-contract.mjs                   (new — schema gate + semantic validator)
   imports idiom-registry (default), brush-preview, idiom-card (card spec ids), artifact.formatErrors
src/pack/brush-catalog.mjs                    (new, pure — layout + artifact + markdown page)
   imports idiom-registry, brush-preview, idiom-card (specs), config (model id)
benchmarks/sculpture/brush-catalog.mjs        (new, impure runner — gate/render/commit)
benchmarks/sculpture/brush-catalog/           (new committed outputs)
src/pack/brush-door.conformance.test.mjs      (new — single-door tripwire)
package.json                                  (modified — "brush:catalog" script)
```

No cycles: idiom-registry imports techniques only; brush-preview imports workshop/program (which
imports idiom-registry — safe, preview is never imported by it); contract/catalog sit on top.
**Deleted: nothing. Renamed: nothing.** (Wrap, don't fork; siblings in flight.)

## 1. `src/pack/idiom-registry.mjs` (modified, additive only)

Existing exports untouched: `IDIOM_REGISTRY`, `IDIOM_REGISTRY_SCHEMA`, `idiomNames()`, `getIdiom()`,
all construct functions. Every entry gains three frozen fields:

- `composition: {consumes: string[], emits: string[]}` — closed vocabulary (see §3).
  Constructs: `{consumes:["spec"], emits:["cells"]}`. Passes: e.g. timber-frame
  `{consumes:["occupancy","kit","zones"], emits:["placements","report"]}`; hollow
  `{consumes:["occupancy"], emits:["removeSet","report"]}` (its `apply` emits `artifact`).
- `tests: string` — repo-relative path to the module test that proves the technique
  (e.g. `roof.gable` → `"src/view/roof-generate.test.mjs"`; surface ops → their module tests).
- `preview:` either `{card: string[]}` (construct — ids into `IDIOM_CARD_SPECS`, ≥1) or
  `{substrate: SubstrateDecl, params: object, realize: (occ) => {cells}}` (pass — `realize` closes
  over the already-imported pass fn; returns merged substrate+effect cells, last-writer-wins).

New entries (kind `"pass"`, sources in src/view): `surface.fill` (`zoneFill`), `surface.paint`
(`paintFace`, plus `merge: mergePaints`, `apply: applyPaint`), `surface.roof-courses`
(`regularizeRoofCourses`), `surface.strip-salt` (`stripStraySalt`). Each with a real (closed)
`paramsSchema` for its style-level params (`skin`, `minRun`, `minKeep`, `minExtent`, `priority` —
from the researched signatures), unlike the four inherited open pass schemas (kept as-is, S-125/126
territory).

New brush-facing exports (aliases over the same table — the E-32/S-131 surface):
```js
export const BRUSH_REGISTRY = IDIOM_REGISTRY;
export const brushNames = idiomNames;        // sorted
export const getBrush = getIdiom;            // throws on unknown
```

## 2. `schema/brush.schema.json` (new)

Draft 2020-12, strict, `additionalProperties:false`. Validates the serializable descriptor:

```
{ schema: "brush/v1", name, kind: "construct"|"pass", source, tests,
  composition: { consumes: [enum…] (minItems 1), emits: [enum…] (minItems 1) },
  paramsSchema: object,
  preview: oneOf[ {card: string[] (minItems 1)},
                  {substrate: {kind:"shell"|"solid", spec:object}, params: object} ] }
```

(`realize`/`generate`/`fn` are functions — they exist only on the live entry, never in the
descriptor; the semantic layer checks them.)

## 3. `src/pack/brush-contract.mjs` (new)

The style-pack idiom, applied to the registry. IO limited to committed-file reads (schema, declared
test/source files) — the loadBlockTable purity class.

```js
export const BRUSH_SCHEMA = "brush/v1";
export const BRUSH_SCHEMA_PATH = …;
export const BRUSH_CONSUMES = Object.freeze(["spec","occupancy","zones","features","kit","artifact"]);
export const BRUSH_EMITS    = Object.freeze(["cells","placements","report","removeSet","artifact"]);
export function loadBrushSchema(path?)           // JSON read
export function compileBrushValidator(schema?)   // Ajv2020 strict + memoized via getValidator()
export function brushDescriptor(name, entry)     // entry → serializable descriptor (pure)
export function parseBrushDescriptor(input)      // {ok,descriptor} | {ok:false,code,errors} (formatErrors reused)
export function assertBrushDescriptor(input)     // fail-fast
export function validateBrushRegistry(registry = BRUSH_REGISTRY,
    { cardSpecs = IDIOM_CARD_SPECS, readFile = fs } = {})   // injectable for tests
  // → {ok, count, findings:[{level:"error"|"warn", brush, msg}]}
```

Semantic rules (each one failing fixture in tests): (1) descriptor schema-valid; (2) `paramsSchema`
compiles under Ajv and accepts `{}`; (3) kind/composition consistency — construct ⇒ consumes
includes `spec` ∧ emits includes `cells` ∧ `generate` is a function; pass ⇒ consumes includes
`occupancy` ∧ emits includes `placements` or `removeSet` ∧ `fn` is a function (`apply`, `merge`
functions when present); (4) composition terms ⊆ vocabularies; (5) preview resolvable — construct:
every `preview.card` id exists in `cardSpecs` and ≥1; pass: `realizePassPreview` returns ≥1 cell;
(6) `tests` file exists and its text mentions the source export's name; (7) `source` file exists
and exports the named function (text match, the conformance-test technique).

## 4. `src/pack/brush-preview.mjs` (new, pure)

```js
export const PREVIEW_SUBSTRATE_KINDS = Object.freeze(["shell","solid"]);
export function previewSubstrate(decl)           // {kind:"shell",spec} → boxShell(spec).cells
                                                 // {kind:"solid",spec:{footprint,y0,height,block}} → local fill loop
export function realizePassPreview(name, entry)  // substrate cells → occupancyFromCells → entry.preview.realize(occ)
                                                 // → {cells} merged last-writer-wins; throws if empty
```

Header documents the workshop→pack import direction note (design risk #3).

## 5. `src/pack/brush-catalog.mjs` (new, pure)

```js
export const BRUSH_CATALOG_SCHEMA = "brush-catalog/v1";
export function catalogPlots()        // one representative plot per brush: constructs → first preview.card
                                      // spec realized via generate; passes → realizePassPreview. 19 plots.
export function brushCatalogLayout()  // the idiomCardLayout algorithm over catalogPlots (baseplate, wrap, gap)
export function catalogCoverage()     // every registry brush plotted; {brushes, missing} — the widened pin
export function brushCatalog({modelId?})          // schema-valid artifact (fill + voxels), idiomCard pattern
export function brushCatalogMarkdown({descriptors, plots, brushCount, renders})
                                      // the committed page: per-brush section (name, kind, source, composition,
                                      // param docs walked from paramsSchema properties — open schemas rendered
                                      // honestly as "open (see module contract)"), plot location, render receipts,
                                      // the excluded-inventory table (D3 reasons), and the baseline count.
```

## 6. `benchmarks/sculpture/brush-catalog.mjs` (new, impure runner)

The idiom-card runner ladder: `assertArtifact(brushCatalog())` → expand → `buildWorldFromVoxels`
asserts `unmapped===0` → coverage pin (19/19, fail-loud) → `validateBrushRegistry` must be clean →
5 renders (4 gate azimuths + front) with sha256 receipts (evidence, never verdict) → writes
`benchmarks/sculpture/brush-catalog/{catalog.json, record.json, brush-catalog.md, view-*.png}`.
`record.json`: `{schema:"brush-catalog/v1", brushCount, constructs, passes, verdict:{gate,
unmapped, contractOk}, plots, renders:[{file,sha256}]}` — **brushCount is the factory baseline**.
package.json: `"brush:catalog": "node benchmarks/sculpture/brush-catalog.mjs"`.

## 7. `src/pack/brush-door.conformance.test.mjs` (new)

The T-113 tripwire instance. `TECHNIQUE_MODULES` = the ten generator/op files (research §3).
Closed sweep over `src/pack`, `src/recognition`, `src/workshop`, `src/form`, `src/view`,
`benchmarks/sculpture` (non-test files): an import of a technique module is allowed only in
(a) `src/pack/idiom-registry.mjs` (the door), (b) brush-preview/brush-catalog (the card machinery),
(c) the technique modules themselves (intra-layer composition, enumerated — e.g. surface-pattern
uses zone-fill helpers), (d) the **enumerated legacy runners** with one-line reasons (final list
from grep during implement; expected: durable-skin, spray-paint, challenge-milestone,
styled-milestone, dress-openings, hollow-cottage, floorplan-cottage, placement-grammar,
hollow-cottage-milestone, surface-pattern, …). Plus: the registry must export
`BRUSH_REGISTRY`/`brushNames`/`getBrush` (the cannot-rot assertion), and the allowlist entries
must exist on disk.

## 8. Tests (new/modified)

- `src/pack/brush-contract.test.mjs` — descriptor gate both ways; every semantic rule has a
  passing and a failing fixture (fixture mini-registry, injected `readFile`); **the meta-test:**
  `validateBrushRegistry()` over the real registry is clean with `count === 19`.
- `src/pack/brush-preview.test.mjs` — substrate builders (shell hollow/true holes via boxShell
  delegation; solid filled), every pass preview realizes non-empty + deterministic (twice,
  deep-equal), realized cells stay within substrate bbox ∪ declared effect bounds.
- `src/pack/brush-catalog.test.mjs` — plots overlap-free (the card test pattern), coverage pin
  19/19, artifact gate-shape, markdown names every brush + the count + excluded table.
- `src/pack/idiom-registry.test.mjs` (modified) — new entries: shape, kind, paramsSchema compiles
  and accepts `{}`, alias exports identical (`BRUSH_REGISTRY === IDIOM_REGISTRY`).
- Existing tests must stay green untouched (the additive-fields claim, proven by the suite).

## 9. Ordering (matters)

1. `schema/brush.schema.json` + `brush-contract.mjs` (+test, fixture-registry only — real-registry
   meta-test arrives in step 3) — the contract exists before anything registers through it.
2. `idiom-registry.mjs` metadata + surface entries (+test updates) — the inventory registers.
3. `brush-preview.mjs` (+test) — pass previews realize; enable the contract meta-test (19, clean).
4. `brush-catalog.mjs` (+test) — layout/page over the validated registry.
5. Runner + committed catalog outputs + package.json script.
6. `brush-door.conformance.test.mjs` — grep-enumerated allowlist, last (the sweep needs the final
   import graph).
7. Byte-identity suite (challenge ×4 `--offline`/`--repro`, durable-skin `--offline`,
   `workshop:replay`/`workshop:offline`, `pack:validate`, full `npm test`, idiom-card dir
   `git diff` clean) — recorded in progress.md.

Each step commits atomically with `npm test` green (per-step verification in plan.md).

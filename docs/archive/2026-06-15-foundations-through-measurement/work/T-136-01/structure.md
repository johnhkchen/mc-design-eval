# T-136-01 geometry-levers — Structure

## New files

### `src/workshop/geometry.mjs` (pure — the levers)
The mass-level revision channel. No model, no GL, no IO. Public surface:

- `GEOMETRY_PARAM_KEYS` — frozen `["pitchClass", "eaveHeight", "storeys", "storeyHeight",
  "width", "depth"]` (the T-133 measured surface as flat scalars; `eaveHeight` is exclusive
  with `storeys`/`storeyHeight` — it factorizes through `factorEave`).
- `resolveMass(source, id)` — `id` is a source mass id, or a compiled element id resolved to its
  owning mass by the compile naming rule (`${massId}-…`, longest matching mass id). Returns
  `{massId, mass}` or null.
- `applyGeometryAdjust({source, pack, budget}, {massId, params})` — apply params to one mass
  (width/depth resize `rect` keeping origin; eaveHeight → `factorEave` with the pack band),
  `assertBuildingProgram` + `validateProgramAgainstPack` (any finding throws — the round records
  `apply-failed`), `compileProgram`, budget restored, `assertWorkshopProgram`. Returns
  `{program, source}` (both frozen).
- `substituteMass({source, pack, budget}, {massId, mass})` — same pipeline with a whole replacement
  fragment (re-recognize's applier core AND replay's re-application path).
- `prunePaint(program, paint)` — filter paint placements to positions occupied by
  `realizeProgram(program)`; returns `{paint, pruned}`. Deterministic; replay uses the same call.
- `ratioGuard({current, candidate, targets})` — `silhouetteRatios` both sides vs targets; reject
  iff the max relative deviation strictly increases. `targets == null` → `{ok:true, vacuous:true}`.

Imports: `../recognition/measured-program.mjs` (factorEave, silhouetteRatios),
`../recognition/program.mjs` (assert/validate), `../recognition/compile.mjs` (compileProgram),
`./program.mjs` (assertWorkshopProgram, realizeProgram). All pure per ISO4's ban list.

### `src/workshop/rerecognize.mjs` (pure — the fragment exchange contract)
- `rerecognizeRenderArgs({pack, sketch, mass, issues})` — typed inputs for the BAML function:
  `pack_digest`, `sketch_digest` (reuse `packDigest`/`sketchDigest` from recognition/prompt.mjs),
  `mass_json`, `critique_block` (the round's issues serialized), `mass_schema_json` (the masses
  item subschema extracted from `loadProgramSchema()`).
- `parseMassReply(text, {source, massId, pack, budget})` — strip → JSON → `substituteMass` (the
  whole-program gates ARE the fragment validation) → returns `{mass, program, source}`. Throws =
  MALFORMED = bounded re-ask upstream.

### `baml_src/rerecognize.baml`
`class MassFragment`-free design: the function returns a free-form JSON the .mjs parser gates
(the recognition precedent — `RecognizeBuildingProgram` is parsed by parseProgramReply, not by
BAML types). `function ReRecognizeMass(pack_digest, sketch_digest, mass_json, critique_block,
mass_schema_json) -> string` with the prompt skeleton. (If the bridge requires a typed return,
mirror loosely as `string`; transport parsing stays in parseMassReply.) NOTE: never name a BAML
field `params` (reserved — the T-128 bridge lesson).

### `benchmarks/sculpture/geometry-levers.mjs` (impure — the proof runner)
The measured-proportions precedent at NEW paths, composing the workshop with levers live:
- `leverRels(key, packRel)` → `benchmarks/sculpture/levers/<runKey>.{ledger.json, final.json,
  record.json, md}` + `levers/<runKey>/round-N/` renders.
- live: read committed seed (`chainRels(key, pack).seed`), source
  (`recognitionRels(key, pack).program`), sketch (`form-sketch/<key>.json`), pack; preflight
  pins (domain "workshop"); run `runWorkshopLoop` with `source = {program, targets:
  sketchTargetRatios(sketch)}`, the critique exchange (CritiqueWorkshopRound, op
  `workshop-critique`), and an injected `re-recognize` applier (ReRecognizeMass via
  `runTieredOp({tier:"strong"})` — op `workshop-rerecognize` — wrapped in `runReplyPolicy` with
  `parseMassReply`); write ledger/final/record/digest. Record carries per-round
  before/after/target ratios — the capability finding either way.
- `--replay`: `replayLedger({ledger, pack})` byte-compare. `--offline`: extended `offlineAssert`.
- No judge import, no gate-record path; joins ISO1's list.

### Tests
`src/workshop/geometry.test.mjs`, `src/workshop/rerecognize.test.mjs`; extensions in existing
test files (below). New BAML golden fixture dir `src/baml/fixtures/rerecognize/` if the fixture
harness requires one (mirror the critique fixture pattern).

## Modified files

- **`src/workshop/actions.mjs`** — `parseAction` ctx gains optional `source`:
  - `adjust-params`: if `elementId` names a program element → legacy spec-merge form (unchanged);
    else if it resolves via `resolveMass(source, …)` → geometry form: params keys must be ⊆
    `GEOMETRY_PARAM_KEYS`, numeric, eaveHeight exclusivity enforced; parse returns
    `{action, massId, params}` (massId marks the form for the applier and replay).
  - `re-recognize`: elementId valid if a program element OR a source mass id.
  - `DEFAULT_APPLIERS["adjust-params"]`: geometry form routes to `applyGeometryAdjust` (pure —
    stays a default applier); returns `{kind:"geometry", program, source}`. Legacy form unchanged
    (`{kind:"program"}`). Geometry form without ctx.source → `{kind:"unavailable"}`.
- **`src/workshop/loop.mjs`** — `runWorkshopLoop` accepts `source` (optional `{program,
  targets}`); applier ctx gains `{source, pack, budget}`; `await applyAction(...)`; result kinds
  `geometry`/`recognize` set `candidateProgram`, `candidateSource`, prune paint
  (`prunePaint`), run `ratioGuard` after the conformance comparison (reject reason
  `"ratio-guard: …"`); accepted rounds advance `current`+`source`+pruned paint; round entry
  `applied` records `{kind:"geometry", paintPruned}` or `{kind:"recognize", mass, replies,
  askCount, paintPruned}`; ledger root gains `source` (the seed source program) and
  `targets` when present.
- **`src/workshop/critique.mjs`** — `critiqueRenderArgs` gains `source_block` (masses JSON +
  current/target ratios + geometry key vocabulary; empty string when no source — sketchless
  prompts byte-identical) and threads `source` into `parseWorkshopReply` ctx.
- **`src/workshop/replay.mjs`** — `replayLedger({ledger, pack})`: track `source`; kinds
  `geometry` (re-derive via applyGeometryAdjust), `recognize` (substituteMass with the recorded
  fragment), prune paint at the same acceptance points; throw if geometry/recognize rounds exist
  and `pack` absent. `offlineAssert({…, pack})`: final conformance re-check uses the REPLAYED
  program's declarations; recognize rounds must carry non-empty `applied.replies` and bounded
  `applied.askCount`.
- **`src/workshop/isolation.test.mjs`** — ISO4 named list += `geometry.mjs`, `rerecognize.mjs`;
  `workshopFiles()` += `benchmarks/sculpture/geometry-levers.mjs`.
- **`baml_src/critique.baml`** — template: `{{ source_block }}` param; sanctioned-action lines
  document the geometry form and mass-targeted re-recognize. Reply classes unchanged
  (`WorkshopAdjustParams` already carries elementId + scalar map).
- **`src/model-tier.mjs`** — `OP_ROUTING` += `workshop-rerecognize` (strong). Check for a
  generated scoping-rationale record pinned against the table; regen if so.
- **`package.json`** — `levers:cottage`, `levers:cottage:replay`, `levers:cottage:offline`
  (and `levers:barn` once cottage proves).
- **Test extensions** — `actions.test.mjs` (dual grounding, vocabulary errors),
  `loop.test.mjs` (geometry round-trip integration incl. replay byte-equality — AC1's named
  integration case; ratio-guard rollback; paint pruning; injected recognize applier),
  `replay.test.mjs` (new kinds, pack-required error, offline invariants),
  `critique.test.mjs` (source block, sourceless byte-identity).
- **BAML golden** — `src/baml/fixtures/critique/prompt.golden.txt` re-minted only if the
  fixture subject renders a non-empty source block (it should not — fixture is sourceless; a
  test asserts byte-identity instead).

## Boundaries

- `src/pack/conformance.mjs` — **untouched** (T-135's file).
- `benchmarks/sculpture/workshop.mjs`, `pattern-book.mjs` — **untouched** (replayLedger/
  offlineAssert changes are backward-compatible for ledgers without geometry rounds).
- No committed pin is rewritten; all new records under `benchmarks/sculpture/levers/`.

## Ordering

1. `geometry.mjs` + tests (the pure levers stand alone).
2. `actions.mjs` grounding + applier, tests.
3. `loop.mjs` threading + guard + pruning, tests (integration: geometry round-trips replay).
4. `replay.mjs` + `offlineAssert`, tests.
5. `rerecognize.mjs` + `baml_src/rerecognize.baml` + OP_ROUTING row, tests.
6. `critique.mjs` source block + `critique.baml` + fixture assert.
7. `geometry-levers.mjs` runner + isolation list + npm scripts; `npm test` green.
8. Live cottage proof run; `--replay`/`--offline` green; record + digest committed.

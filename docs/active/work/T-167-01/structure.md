# T-167-01 Structure — files, interfaces, ordering

The blueprint. Four new files, one edit; no deletions.

## Files

### CREATE `schema/defect-corpus.schema.json` (JSON Schema, draft 2020-12)

Mirrors the other `schema/*.schema.json` headers. Top-level object:

```
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "defect-corpus/v1",
  "type": "object", "additionalProperties": false,
  "required": ["schema","rater","states"],
  "properties": {
    "schema": { "const": "eval-alignment/defect-corpus/v1" },
    "rater":  { "type": "string", "minLength": 1 },
    "notes":  { "type": "string" },
    "states": { "type": "array", "minItems": 8, "items": { "$ref": "#/$defs/state" } },
    "excluded": { "type": "array", "items": { "$ref": "#/$defs/excluded" } }
  },
  "$defs": {
    "state": discriminated on "kind" via oneOf [singleState, pairState],
    "singleState": required id,kind:"single",subject,concept,renderDir,axis,labels{worstDepartment,confidence}; optional note
    "pairState":   required id,kind:"pair",subject,renderDir,axis,labels{matchedConcept,wrongStyleConcept,moreFaithful,confidence}; optional note
    "excluded":    required id,reason; optional renderDir
  }
}
```

- `confidence`: enum `["high","medium","low"]`.
- `moreFaithful`: enum `["matched","wrongStyle"]`.
- `worstDepartment`: **not** enumerated in JSON Schema (kept as `string`); membership in `DEPARTMENTS`
  is enforced in the loader so there is exactly one composition point (`src/pack/departments.mjs`).
  JSON Schema can't import the .mjs constant, so duplicating the enum here would be drift bait.
- `minItems: 8` on `states` encodes the AC's "≥8" structurally.

### CREATE `experiments/eval-alignment/corpus/defect-corpus.json`

The data, conforming to the schema. Content fixed in Plan/Implement (8 states + exclusions, labels from
this session's direct render inspection). `schema:"eval-alignment/defect-corpus/v1"`; `rater` names the
single agent-rater + date + the no-aggregation limitation.

### CREATE `src/workshop/defect-corpus.mjs` (pure-ish loader, follows `style-pack.mjs`)

Public interface:

```js
export const DEFECT_CORPUS_SCHEMA = "eval-alignment/defect-corpus/v1";
export const CORPUS_SCHEMA_PATH  = resolve(here,"..","..","schema","defect-corpus.schema.json");
export const CORPUS_PATH         = resolve(here,"..","..","experiments","eval-alignment","corpus","defect-corpus.json");

export function loadCorpusSchema(path = CORPUS_SCHEMA_PATH): object
export function compileCorpusValidator(schema = loadCorpusSchema()): ValidateFn  // memoized

// non-throwing: {ok:true, corpus} | {ok:false, errors:string[]}
export function parseDefectCorpus(json): Result

// fail-fast: returns corpus or throws with formatErrors()+semantic message
export function loadDefectCorpus(path = CORPUS_PATH): Corpus

// pure helpers over an already-parsed corpus (no IO) — what S-168/S-169 import:
export function singleStates(corpus): SingleState[]
export function pairStates(corpus): PairState[]
export function assertSemantics(corpus): void   // throws on the checks JSON Schema can't express
```

Semantic checks in `assertSemantics` (beyond JSON Schema):
1. every `single.labels.worstDepartment` is in `DEPARTMENTS` (imported from `../pack/departments.mjs`);
2. all `state.id` unique (and disjoint from `excluded[].id`);
3. (path existence is asserted in the TEST, not here — keeps these helpers IO-free for reuse).

Reuse `formatErrors` from `../artifact.mjs`; `Ajv2020` + `addFormats` exactly as `style-pack.mjs`.

### CREATE `src/workshop/defect-corpus.test.mjs` (runs under `npm run test:unit`)

`node:test` + `node:assert/strict`. Cases:
- `loadDefectCorpus()` succeeds on the committed corpus; `corpus.states.length >= 8`.
- schema validity: a deliberately-malformed fixture (inline object) → `parseDefectCorpus().ok === false`.
- every `worstDepartment` ∈ `DEPARTMENTS`; ids unique.
- `singleStates`/`pairStates` partition `states` by `kind` (counts sum to total).
- **path existence**: for each state, `concept`/`renderDir` (single) and `matchedConcept`/
  `wrongStyleConcept`/`renderDir` (pair) resolve to existing files/dirs under repo root (`existsSync`).
- `excluded` non-empty (the AC's "no padding" evidence) and each entry has a `reason`.

### EDIT `package.json` (one line, optional convenience)

Add `"corpus:check": "node -e \"import('./src/workshop/defect-corpus.mjs').then(m=>{m.loadDefectCorpus();console.log('corpus OK',m.loadDefectCorpus().states.length,'states')})\""`
— a no-spend reader for humans. Non-load-bearing; the real gate is the unit test under `test:unit`.

## Module boundaries

- `defect-corpus.mjs` depends only on `node:fs`, `node:path`, `ajv`, `../artifact.mjs` (formatErrors),
  `../pack/departments.mjs` (DEPARTMENTS). It does **not** depend on `bakeoff-score.mjs` — the corpus is
  upstream data; the scoring core stays pure and unaware of it. S-168 will import *both* and join them.
- No BAML, no model, no GL. Reading the corpus needs no spend (AC).

## Ordering of changes (so each step is independently verifiable)

1. Schema file → validate it is well-formed JSON Schema (compile under Ajv in a scratch check).
2. Loader module → unit-testable against the schema even before the data exists (negative fixture).
3. Corpus data file → `loadDefectCorpus()` now succeeds.
4. Test file → encodes every AC; `npm test` green.
5. `package.json` convenience script.

## Touch-isolation / concurrency

All files are **new** except `package.json` (one additive line). No other ticket in E-40 is live on
these paths (T-168-01/T-169-01 depend on this ticket). Per the shared-file lesson, the `package.json`
edit is additive and I will re-Read immediately before editing.

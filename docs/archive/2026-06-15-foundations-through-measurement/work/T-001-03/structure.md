# Structure — T-001-03 structured-output-binding

The blueprint. Files created/modified, module boundaries, public interfaces,
internal organization, and the order changes land. Not code — the shape of it.

## File inventory

| File | Status | Role |
|---|---|---|
| `src/artifact.mjs` | **create** | Pure core: schema load, ajv validator, `parseArtifact`, `assertArtifact`, `formatErrors`, `toModelSchema`, JSDoc typedefs. No SDK, no network. |
| `src/sdk-binding.mjs` | **create** | SDK edge: `designArtifactOutputFormat()`, `extractArtifact()` (pure) + `requestDesignArtifact()` (lazy-imports the SDK). |
| `src/artifact.test.mjs` | **create** | `node:test` suite for the pure core (valid/invalid fixtures, malformed JSON, located errors, projection). |
| `src/sdk-binding.test.mjs` | **create** | `node:test` suite for the pure SDK-edge functions (output-format object, result extraction) via mock result objects. |
| `src/README.md` | **modify** | Add a "Validation & SDK binding" section pointing at the new modules. (Owned by `src/`; T-001-02's expansion section untouched.) |
| `package.json` | **modify (maybe)** | Add `@anthropic-ai/claude-agent-sdk` as an `optionalDependencies` entry. `test:unit` already globs `src/**/*.test.mjs` — no script change needed. |

Not touched: `schema/*` (consumed read-only), `scripts/validate-artifact.mjs`
(Decision 6), `src/expand.mjs` (T-001-02). Disjoint file set from any concurrent
ticket.

## Module boundary: `src/artifact.mjs` (pure core)

Imports only `node:fs`, `node:url`, `node:path`, `ajv/dist/2020.js`, `ajv-formats`
— the exact T-001-01 idiom. No SDK import anywhere in this file.

```js
// JSDoc typedefs (the "typed artifact"):
//   Coordinate, BlockId, BlockState, Metadata, Style, Palette,
//   Placement, DesignArtifact

export const SCHEMA_PATH        // resolved abs path to design-artifact.schema.json
export function loadSchema()    // → parsed JSON Schema object (full, with discriminator)
export function compileValidator(schema?)  // → ajv validate fn; defaults to loadSchema()
export function formatErrors(errors)       // → string[]  located "at <path>: <msg>" lines
export function parseArtifact(input, opts?) // → { ok:true, artifact } | { ok:false, code, errors }
export function assertArtifact(input)       // → artifact (frozen) | throws Error(joined lines)
export function toModelSchema(schema?)      // → projected schema (no discriminator/$schema/$id)
```

Internal organization (top → bottom): file-top contract comment → typedefs →
path/schema loading → validator compile (module-level memoized singleton so repeat
`parseArtifact` calls don't recompile) → `formatErrors` → `parseArtifact` /
`assertArtifact` → `toModelSchema`.

Internal helpers (not exported): `getValidator()` (lazy memoized compile),
`deepStripKeys(node, keys)` (recursive clone-and-strip powering `toModelSchema`).

### `parseArtifact` contract (the AC #2/#3 surface)

- Input: a JSON `string` **or** a parsed `object`.
- `string` → `JSON.parse` in try/catch; on throw → `{ ok:false,
  code:"invalid_json", errors:[ "  could not parse JSON: <msg>" ] }`.
- Validate with the memoized ajv fn. On failure → `{ ok:false,
  code:"schema_invalid", errors: formatErrors(validate.errors) }`.
- On success → `{ ok:true, artifact: Object.freeze(data) }`.
- Never throws for invalid *content* (only for genuine misuse like `null`/
  `undefined`, which `assertArtifact` callers don't hit).

### `toModelSchema` contract (Decision 4)

- Deep-clone the full schema, recursively delete every `discriminator` key, delete
  top-level `$schema` and `$id`. Return the clone. The input schema object is not
  mutated (purity — the same loaded schema still drives ajv with discriminator).

## Module boundary: `src/sdk-binding.mjs` (SDK edge)

Imports `parseArtifact`, `toModelSchema` from `./artifact.mjs`. Does **not**
statically import the SDK.

```js
export const SDK_PACKAGE = "@anthropic-ai/claude-agent-sdk"
export function designArtifactOutputFormat()  // → { type:"json_schema", schema: toModelSchema() }
export function extractArtifact(result)        // → parseArtifact(payloadOf(result))
export async function requestDesignArtifact({ prompt, model, options? })
                                               // → { artifact, raw }  (LIVE: dynamic import)
```

- `designArtifactOutputFormat()` — pure; returns the object spread into
  `query({ options: { outputFormat: ... } })`.
- `extractArtifact(result)` — pure; `payloadOf(result)` (internal, tolerant)
  reads `result.structured_output` if present, else `result.result`, else throws a
  clear "no structured payload on result" error; the payload is then run through
  `parseArtifact`. Returns the `parseArtifact` result object.
- `requestDesignArtifact(...)` — the only impure/live function. Steps: dynamic
  `import(SDK_PACKAGE)` (catch → throw "install <pkg> to run live trials"); call
  `query({ prompt, options: { ...options, outputFormat: designArtifactOutputFormat(),
  model } })`; iterate to the terminal `result` message; return `{ artifact:
  extractArtifact(result), raw: result }`. Documented; excluded from unit tests.

## Test structure

`src/artifact.test.mjs` (node:test + node:assert/strict), reads the committed
fixtures via `node:fs`:
- valid fixture → `ok:true`, artifact deep-equals parsed file, artifact is frozen.
- valid fixture passed as a **string** → `ok:true` (string path).
- invalid fixture → `ok:false`, `code:"schema_invalid"`, errors include a line
  naming the bare-id manifest entry and a line for the missing `block`.
- malformed JSON string (`"{ not json"`) → `ok:false`, `code:"invalid_json"`.
- targeted negatives mutating the valid fixture: missing required metadata field;
  unknown placement op; non-integer coordinate; extra top-level property — each
  `ok:false` with a located message at the expected `instancePath`.
- `formatErrors` extras: `additionalProperties` names the property; `enum` lists
  allowed values (mutate `metadata.target`).
- `assertArtifact`: returns artifact on valid; throws with joined message on
  invalid.
- `toModelSchema`: result has no `$schema`/`$id`; no `discriminator` anywhere
  (deep scan); original loaded schema still *has* discriminator (purity);
  projected schema still validates the good fixture and rejects the bad one when
  compiled standalone (without `discriminator: true`).

`src/sdk-binding.test.mjs`:
- `designArtifactOutputFormat()` → `{ type:"json_schema", schema }`; schema has no
  `discriminator`; compiling that schema accepts the valid fixture, rejects the
  invalid one.
- `extractArtifact({ structured_output: <valid obj> })` → `ok:true`.
- `extractArtifact({ result: "<valid json string>" })` → `ok:true` (text path).
- `extractArtifact({ structured_output: <invalid obj> })` → `ok:false` with located
  errors.
- `extractArtifact({})` → throws "no structured payload".
- Does **not** import the SDK or call `requestDesignArtifact`.

## Ordering of changes (atomic commits)

1. `src/artifact.mjs` — pure core (typedefs, load, validate, parse, project).
2. `src/artifact.test.mjs` — core suite; `npm run test:unit` green.
3. `src/sdk-binding.mjs` — SDK edge (pure fns + lazy live wrapper).
4. `src/sdk-binding.test.mjs` — edge suite; `npm test` green end-to-end.
5. `package.json` optionalDependency + `src/README.md` section.

Each step is independently runnable: after 2 the core is fully tested; 3–4 add the
edge; 5 is docs/dep metadata. No step depends on the SDK being installed.

# Plan — T-001-03 structured-output-binding

Ordered, independently-verifiable steps. Each step ends green and commits
atomically. Testing strategy and per-AC verification at the end.

## Step 1 — Pure core `src/artifact.mjs`

Create the SDK-free validation core.

- File-top contract comment (mirrors `expand.mjs`): what this owns (shape
  validation against the source-of-truth schema), what it does not (Minecraft
  semantics, `from≤to`, SDK calls).
- JSDoc typedefs: `Coordinate`, `BlockId`, `BlockState`, `Metadata`, `Style`,
  `Palette`, `Placement`, `DesignArtifact`.
- `SCHEMA_PATH`, `loadSchema()` — resolve and parse
  `schema/design-artifact.schema.json` relative to `import.meta.url`.
- `compileValidator(schema = loadSchema())` — `new Ajv2020({ allErrors:true,
  strict:true, discriminator:true })` + `addFormats`; return `ajv.compile(schema)`.
- `getValidator()` — module-level memoized singleton over `compileValidator()`.
- `formatErrors(errors)` — port T-001-01's mapping verbatim (instancePath/(root) +
  message + `additionalProperties`/`enum` extras).
- `parseArtifact(input)` — string→JSON.parse (try/catch → `invalid_json`); validate
  → `schema_invalid` with `formatErrors`; success → `{ ok:true, artifact:
  Object.freeze(data) }`.
- `assertArtifact(input)` — call `parseArtifact`; throw `Error(errors.join("\n"))`
  on failure, else return artifact.
- `toModelSchema(schema = loadSchema())` — deep-clone, recursively strip
  `discriminator`, drop top-level `$schema`/`$id`.

**Verify:** `node -e` smoke — `parseArtifact` of the valid fixture is `ok:true`;
of the invalid fixture is `ok:false` with located lines. **Commit.**

## Step 2 — Core test suite `src/artifact.test.mjs`

`node:test` + `node:assert/strict`. Load fixtures via `node:fs` + path relative to
`import.meta.url`. Cases per `structure.md`:

- valid fixture (object) → ok, deep-equal, frozen.
- valid fixture (string) → ok.
- invalid fixture → not ok, `schema_invalid`, error lines for bare manifest id and
  missing `block`.
- malformed JSON string → not ok, `invalid_json`.
- targeted negatives (clone valid, mutate): missing `metadata.seed`; op `"sphere"`;
  `pos:[0,1.5,0]`; extra top-level prop → each located at expected path.
- `formatErrors` extras: `additionalProperties` names prop; `enum` lists allowed
  (`metadata.target = "barn"`).
- `assertArtifact` returns / throws.
- `toModelSchema`: no `$schema`/`$id`; no `discriminator` (deep scan helper);
  original schema retains `discriminator` (purity); projected schema compiled
  *without* `discriminator:true` still accepts good / rejects bad fixture.

**Verify:** `npm run test:unit` — new tests pass alongside the 20 expansion tests.
**Commit.**

## Step 3 — SDK edge `src/sdk-binding.mjs`

- File-top comment: binds the schema as the Agent SDK `outputFormat` (spec §4/§5);
  pure config/extraction here, the one live call isolated behind dynamic import;
  tests must not call it (metered billing).
- `SDK_PACKAGE` constant.
- `designArtifactOutputFormat()` → `{ type:"json_schema", schema: toModelSchema() }`.
- `payloadOf(result)` (internal, tolerant): `structured_output` ?? parse of
  `result` ?? throw "no structured payload on SDK result".
- `extractArtifact(result)` → `parseArtifact(payloadOf(result))`.
- `requestDesignArtifact({ prompt, model, options })` → dynamic import (clear error
  if missing); `query({ prompt, options:{ ...options, model, outputFormat:
  designArtifactOutputFormat() } })`; drain to terminal `result`; return
  `{ artifact: extractArtifact(result), raw: result }`. JSDoc says: live/metered,
  not unit-tested.

**Verify:** `node -e` smoke — `designArtifactOutputFormat()` shape; `extractArtifact`
on a mock `{ structured_output: <valid> }` is ok. **Commit.**

## Step 4 — SDK edge test suite `src/sdk-binding.test.mjs`

Cases per `structure.md`: output-format object well-formed + schema accepts good /
rejects bad; `extractArtifact` over `{structured_output}` (obj), `{result}` (string)
ok; over invalid payload not ok with located errors; over `{}` throws. No SDK
import; `requestDesignArtifact` not called.

**Verify:** `npm test` (schema gate + full `test:unit`) green end-to-end. **Commit.**

## Step 5 — Dependency + docs

- `package.json`: add `optionalDependencies: { "@anthropic-ai/claude-agent-sdk":
  "^0.3.0" }` (binds the dependency without forcing install or breaking SDK-free
  tests; the live wrapper errors clearly if absent). Attempt a real
  `npm install --save-optional`; if it fails (network/native), keep the manifest
  entry and note install is deferred — tests are unaffected either way.
- `src/README.md`: add a "Validation & SDK binding" section — `parseArtifact` is the
  upstream gate T-001-02 assumes; `designArtifactOutputFormat` wires the schema to
  the SDK; note the model-facing projection and the metered live call.

**Verify:** `npm test` still green. **Commit.**

## Testing strategy

- **Unit (node:test), no network, no SDK:** every AC is reachable as plain-data.
  Pure functions (`parseArtifact`, `formatErrors`, `toModelSchema`,
  `designArtifactOutputFormat`, `extractArtifact`) are fully covered.
- **Fixtures as payloads:** the committed `valid-/invalid-industrial-house.json`
  are the canonical valid/invalid payloads (AC #4) — same fixtures the schema gate
  and the expander use, so all three modules agree on one ground truth.
- **Live path:** `requestDesignArtifact` is integration-only and metered; it is
  documented and smoke-shaped but deliberately **not** invoked in CI. Manual
  verification (with the SDK installed + credentials) is a follow-up, noted in
  Review.
- **Determinism:** all unit tests are pure and offline ⇒ stable in CI.

## Per-AC verification map

| AC | Verified by |
|---|---|
| #1 schema wired as SDK structured-output format | `designArtifactOutputFormat()` returns `{type:"json_schema", schema}` whose schema validates good / rejects bad (sdk-binding test); `requestDesignArtifact` uses it (code-reviewed, live-only). |
| #2 helper returns typed artifact or clear error | `parseArtifact` ok→frozen typed artifact; not-ok→`{code,errors}` (artifact test). |
| #3 malformed/partial rejected, actionable (field+why) | invalid fixture + targeted negatives assert located `at <path>: <msg>` lines; `invalid_json` path (artifact test). |
| #4 tests cover valid and invalid payloads | valid + invalid committed fixtures exercised in both suites; `npm test` green. |

## Risks & mitigations

- **SDK identifier drift** (`outputFormat`/`structured_output` from docs, not the
  installed pkg): isolated in `sdk-binding.mjs`; `extractArtifact` is tolerant
  (`structured_output` ?? `result`); a rename is a one-line fix. Flagged in Review.
- **`discriminator` rejected by the API:** pre-empted by `toModelSchema` stripping
  it; ajv still uses the full schema for crisp errors.
- **Cross-ticket file conflict:** none — disjoint file set; no edits to
  `expand.mjs` or `validate-artifact.mjs`.

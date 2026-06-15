# Research — T-001-03 structured-output-binding

Descriptive map of the terrain this ticket touches. What exists, where, how it
connects, and the constraints that will shape the design. No solutions here.

## What the ticket asks for

Spec §4–§5; epic E-01. Bind the design-artifact schema (T-001-01) as the **Claude
Agent SDK's enforced structured-output format**, and provide a **parse/validate
helper** that yields a typed artifact on success or a clear, actionable error on
failure. Acceptance criteria:

1. Schema wired as the Agent SDK structured-output format; model output conforms.
2. A parse/validate helper returns a typed artifact, or a clear validation error.
3. Malformed/partial outputs rejected with actionable messages (which field, why).
4. Tests cover valid and invalid sample payloads.

The ticket explicitly scopes this to "the SDK-binding module, separate from the
primitive-expansion module (T-001-02), so the two run concurrently." T-001-02 owns
`src/expand.mjs`; this ticket must not touch it.

## The contract being bound (T-001-01, done)

`schema/design-artifact.schema.json` — JSON Schema **draft 2020-12**, the single
source of truth (`schema/README.md` is the human field reference). Key shape:

- Top level `additionalProperties: false`, required: `schema_version`, `metadata`,
  `style`, `palette`, `placements`.
- `$defs` holds `coordinate`, `blockId` (namespaced `^[a-z0-9_.-]+:[a-z0-9_]+$`),
  `blockState`, `metadata`, `style`, `palette`, and the placement union.
- `placements` is an ordered array; each item is `#/$defs/placement`, a
  **discriminated `oneOf`** over `voxel` / `line` / `box` / `fill` with
  `discriminator: { propertyName: "op" }`.
- Uses: `$ref`, `$defs`, `oneOf`, `const`, `pattern`, `enum`, `format: date-time`,
  `minItems`, `uniqueItems`, `additionalProperties: false`, plus the non-standard
  **OpenAPI `discriminator`** keyword.

Two committed conformance fixtures exist and are the natural test payloads:
- `schema/examples/valid-industrial-house.json` — full artifact, all four ops,
  stateful + stateless voxels.
- `schema/examples/invalid-industrial-house.json` — two seeded faults: a
  bare (un-namespaced) `stone_bricks` in the manifest, and a `voxel` placement
  missing its required `block`.

## How T-001-01 already validates (the idiom to match)

`scripts/validate-artifact.mjs` is the established validation pattern:

- Imports `Ajv2020` from `ajv/dist/2020.js` and `addFormats` from `ajv-formats`.
- Compiles with `new Ajv2020({ allErrors: true, strict: true, discriminator: true })`.
- `formatErrors(errors)` maps each ajv error to a located, human line:
  `at <instancePath|(root)>: <message>` with extras for `additionalProperties`
  (names the unexpected property) and `enum` (lists allowed values).
- Exposes a `--self-test` of six negative fixtures plus `--expect valid|invalid`.

`ajv@^8.17.1` and `ajv-formats@^3.0.1` are the only runtime deps in
`package.json`. `node -e` confirms `ajv/dist/2020.js` imports cleanly under Node
v22.22.0. The `discriminator: true` option is what yields the crisp single-branch
placement errors (vs. noisy `oneOf` failures) — see T-001-01 review concern #5.

## Module conventions in `src/`

`src/expand.mjs` (T-001-02, done) establishes the house style for this directory:

- Pure ESM `.mjs`, no transpile. Rich **JSDoc `@typedef`s** stand in for types
  (`Coordinate`, `Voxel`, `Placement`) — this is how "typed artifact" is expressed
  in a no-TypeScript stack.
- Pure functions, named exports, a file-top doc comment stating the contract
  boundary ("input is assumed schema-valid… validated upstream by T-001-01 /
  **T-001-03**"). T-001-02 already names this ticket as its upstream validator.
- Unit tests in `src/<name>.test.mjs` using built-in `node:test` + `node:assert`.
  `package.json#scripts.test:unit` globs `"src/**/*.test.mjs"`, so any new
  `*.test.mjs` under `src/` is picked up automatically; `npm test` runs the schema
  gate then `test:unit`. Node 22 needs the glob (bare dir arg unsupported) — already
  handled in the script.
- `src/README.md` documents expansion and refers to validation as an upstream
  concern owned here.

## How the Agent SDK exposes structured output (external research)

The harness is the **Node** package `@anthropic-ai/claude-agent-sdk` (spec §4:
"Decided: the JavaScript package"), not `claude -p`, not the Python SDK. **It is
not currently installed** (`node_modules/@anthropic-ai` absent). Findings from the
official Claude Agent SDK docs (verify exact identifiers against the installed
package at implement time — see constraints):

- **First-class structured output:** `query({ prompt, options: { outputFormat: {
  type: "json_schema", schema } } })`. `schema` accepts a **raw JSON Schema** or a
  Zod schema. The SDK enforces the schema and retries internally; the validated
  object surfaces on the **result** message (`subtype: "success"`, field reported
  as `structured_output`), with an error subtype when retries are exhausted.
- **Custom in-process tools:** `tool(name, description, zodShape, handler)` wrapped
  by `createSdkMcpServer({ name, version, tools })`, passed via
  `options.mcpServers` and gated by `options.allowedTools`
  (`mcp__<server>__<tool>`). The Node `tool()` helper expects a **Zod** input
  shape; the handler receives typed, validated input.
- **Reading results:** iterate the `query()` async generator; `assistant` messages
  carry `tool_use` blocks (`block.input` is the tool's validated input);
  `result` messages carry `structured_output` / `result`.

Two viable mechanisms therefore exist for "force one structured artifact":
(a) a forced tool whose **input schema is the artifact** (requires re-expressing
the schema as Zod in the Node SDK), or (b) the **`outputFormat` json_schema**
feature (takes our JSON Schema directly). The design phase chooses between them.

## Constraints & assumptions surfaced

- **Single source of truth.** The repo's whole premise (T-001-04, T-001-01) is one
  canonical definition per concept. Re-authoring the schema as Zod would fork the
  source of truth — a strong pull toward the JSON-Schema-native `outputFormat`.
- **`discriminator` is non-standard.** It is an OpenAPI keyword, not JSON Schema
  2020-12. ajv honors it via an opt-in; the Anthropic structured-output validator
  may not, and may reject or ignore unknown keywords. A model-facing projection of
  the schema may be needed. (T-001-01 review concern #5 foresaw this.)
- **No live model calls in tests.** Spec §4: as of 2026-06-15 Agent SDK usage is
  **metered at full API rates**. CI/unit tests must not call `query()`. The
  testable surface is therefore the *binding configuration* (the `outputFormat`
  object) and the *extraction + validation* of a result — both plain-data
  operations needing no network and no installed SDK.
- **SDK not installed / requires a subprocess.** The live path spawns the `claude`
  runtime. Importing the package at module top would break SDK-free unit tests;
  isolation (lazy/dynamic import) is implied.
- **`from`/`to` ordering & block-registry checks are out of scope** (T-001-02 /
  E-04 respectively) — the schema is a shape contract only; this helper validates
  shape, not Minecraft semantics.
- **SDK field-name risk.** The external API identifiers above (`outputFormat`,
  `structured_output`) come from docs, not the installed package. The design should
  keep extraction tolerant and the live call thin and isolated so a name change is
  a one-line fix.

## Where this connects

- **Upstream:** depends on T-001-01 (schema + ajv idiom). Reuses the schema file
  and mirrors `formatErrors`.
- **Downstream:** T-001-02's `expandArtifact` assumes schema-valid input and names
  T-001-03 as the validator — this helper is that gate. E-03 (experiment harness,
  T-004-01) will call the binding to run trials and log clean artifacts. E-04
  validators consume artifacts that passed this gate.

# Design — T-001-03 structured-output-binding

Research fixed the terrain: one canonical JSON Schema (T-001-01) is the source of
truth; ajv (`Ajv2020`, `discriminator: true`, `addFormats`) is the established
validation idiom; the Node Agent SDK offers two ways to force structured output;
tests must not make metered live calls; and the SDK is not installed. This phase
decides the binding mechanism, the module split, the helper contract, and the
model-facing schema treatment.

## Decision 1 — Binding mechanism: `outputFormat` json_schema, not a forced Zod tool

**Options.** (a) Register a forced custom tool whose input schema *is* the
artifact, capture `tool_use.input`. (b) Use the SDK's first-class
`outputFormat: { type: "json_schema", schema }` and read `structured_output` off
the result.

**Decision: (b), `outputFormat` with our raw JSON Schema.** Rationale grounded in
research:

- The Node `tool()` helper takes a **Zod** input shape. Option (a) forces us to
  re-author the entire artifact contract as Zod — a **second source of truth** that
  will drift from `design-artifact.schema.json`. The repo's organizing principle
  (T-001-01, T-001-04) is exactly one canonical definition per concept. Forking it
  is the cardinal sin here.
- `outputFormat` accepts a **raw JSON Schema**, so the same file that ajv compiles
  is the file the model is constrained by — true single-sourcing, zero translation.
- (a) also conflates two concerns: a *tool* is a capability the agent invokes; the
  artifact is the agent's *output*. `outputFormat` models "the answer has this
  shape" directly, which is what §5 describes ("the LLM's output is a design
  artifact").

**Rejected (a)** for the Zod fork and the conceptual mismatch. Noted as a fallback:
if a future SDK version drops/limits `outputFormat`, a Zod tool generated *from*
the JSON Schema (not hand-maintained) would preserve single-sourcing.

## Decision 2 — Two modules: pure core + thin SDK edge

**Options.** (a) One module doing schema-load, validate, SDK wiring, and live
`query()`. (b) Split: a pure, SDK-free **`src/artifact.mjs`** (load, validate,
parse, project) and a thin **`src/sdk-binding.mjs`** (build the `outputFormat`
option, extract+validate a result, the live call).

**Decision: (b).** Rationale:

- **Testability without metered calls or an installed SDK.** ACs #2/#3/#4 are
  entirely about parse/validate of plain data; AC #1 is about *producing the
  `outputFormat` config object* and *extracting+validating a result object*. None
  of these need the network or the SDK package. Keeping them in an SDK-free module
  (and SDK-free functions in the edge module) means `npm test` exercises every AC
  with no live `query()` (respecting spec §4 metered-billing) and no dependency on
  the uninstalled package.
- **Reuse.** T-001-02 names T-001-03 as its upstream validator; E-04 and the
  exporter validate artifacts too. A pure `parseArtifact` is the reusable gate for
  *any* artifact regardless of provenance (model output, a file, a fixture) — it
  must not drag in the SDK.
- **Isolation of the volatile part.** The only genuinely SDK-coupled, network-
  touching code (`requestDesignArtifact`) is quarantined behind a **dynamic
  import**, so (i) unit tests never load the package, (ii) a wrong API identifier
  is a one-line fix in one place, (iii) the package can stay an
  `optionalDependency`.

**Rejected (a):** it would force the SDK to be installed to run tests and tempt a
live call into the test path.

## Decision 3 — The parse/validate helper contract

`parseArtifact(input) → result`, the load-bearing function (AC #2/#3). Shape,
chosen to mirror `scripts/validate-artifact.mjs`'s `{ ok, errors }` but richer:

```js
// success
{ ok: true, artifact }                         // artifact: frozen, typed DesignArtifact
// failure
{ ok: false, code, errors }                    // errors: string[] of located lines
//   code ∈ "invalid_json" | "schema_invalid"
```

- **Input flexibility.** Accepts a JSON **string** (parse first; on failure return
  `code: "invalid_json"` with the parser message) or an already-parsed **object**
  (validate directly). The SDK may hand back either a parsed object or text; the
  exporter/fixtures hand strings. One helper covers all callers.
- **Actionable errors (AC #3).** Reuse T-001-01's `formatErrors` shape exactly:
  `at <instancePath|(root)>: <message>` with the `additionalProperties` (names the
  property) and `enum` (lists allowed) extras. The discriminator keeps placement
  errors single-branch. This is verbatim "which field, why."
- **Typed + immutable success.** Returns the artifact `Object.freeze`d, documented
  by a JSDoc `@typedef DesignArtifact` (+ `Metadata`/`Style`/`Palette`/`Placement`)
  — the no-TypeScript stack's form of "typed artifact" (matches `expand.mjs`).
- **No throwing on invalid input.** Validation failure is a *value*, not an
  exception — callers branch on `ok`. (A genuine programming misuse, e.g. passing
  `undefined`, may still throw.) This matches the script's exit-code discipline.

A convenience `assertArtifact(input) → artifact` (throws a single Error whose
message is the joined located lines) is provided for call sites that prefer
fail-fast, but `parseArtifact` is the primitive.

## Decision 4 — Model-facing schema projection (`toModelSchema`)

The schema ajv compiles is not necessarily the schema the SDK/API will accept.
Research flagged `discriminator` as non-standard and the structured-output
validator may reject unknown keywords or the `$schema`/`$id` meta-fields.

**Decision: ship a pure projection `toModelSchema(schema)`** that deep-clones and:
- strips every `discriminator` key (recursively) — the `oneOf` + `const` on `op`
  already make the union unambiguous to a standards validator; `discriminator` is
  only an ajv error-quality optimization, not semantics;
- drops top-level `$schema` and `$id` (dialect/identity meta the `json_schema`
  output format does not need).

It keeps `$defs`/`$ref`, `oneOf`, `const`, `pattern`, `enum`, `format`,
`additionalProperties`, etc. **Our own ajv validation always uses the FULL schema**
(with discriminator) for crisp errors; only the model-facing copy is projected.
This is conservative and reversible — if the SDK proves to accept `discriminator`,
the projection is a no-op we can relax. Keeping it pure makes it unit-testable
with zero SDK.

**Rejected:** passing the raw schema unprojected (risks API rejection of
`discriminator`/meta and a confusing runtime failure far from this module) and
maintaining a separate hand-written model schema file (re-introduces a second
source of truth — the very thing Decision 1 avoids).

## Decision 5 — `designArtifactOutputFormat()` and `extractArtifact()`

The SDK edge exposes two **pure** functions plus one live wrapper:

- `designArtifactOutputFormat() → { type: "json_schema", schema: <projected> }`
  — the exact object spread into `query({ options })`. Pure ⇒ unit-testable that it
  is well-formed and that its schema validates the good fixture and rejects the bad
  one (closing AC #1 without a live call).
- `extractArtifact(result) → parseArtifact(...)` — given an SDK **result message**,
  pull the structured payload (tolerant: prefer `structured_output`, fall back to
  `result`/text) and run it through `parseArtifact` for defense-in-depth. The SDK
  validates and retries, but we re-validate against the source-of-truth schema so a
  logged artifact is *guaranteed* conformant regardless of SDK behavior. Pure over
  a plain result object ⇒ testable with a hand-built mock result.
- `requestDesignArtifact({ prompt, model, ...opts }) → Promise<{ artifact, raw }>`
  — the only live function: **dynamically imports** `@anthropic-ai/claude-agent-sdk`
  (clear error if absent), runs `query()` with the output format, drains the
  iterator, and returns `extractArtifact(result)`. Documented, not unit-tested
  (would be a metered call); this is the AC #1 wiring in executable form.

## Decision 6 — Self-containment vs. DRY with the existing script

`formatErrors`/`Ajv2020` setup duplicate ~20 lines of
`scripts/validate-artifact.mjs`. **Decision: re-implement them in `src/artifact.mjs`
rather than refactor the script to import the new module.** The ticket scopes work
to "the SDK-binding module, separate from…"; touching T-001-01's script couples
two tickets' files for marginal DRY. The duplication is small, stable (the schema
contract is frozen), and called out in Review as an optional future consolidation
(the script *could* later import `src/artifact.mjs`). Lower coupling wins here.

## What this design explicitly does not do

- No live trial run, no transcript logging, no token accounting (E-03 / T-004-01).
- No Zod schema, no second contract definition — `outputFormat` takes the JSON
  Schema directly.
- No Minecraft-semantic validation (block registry, state legality, gravity/
  attachment, `from≤to`) — that is E-04 / T-001-02. This gate is shape-only.
- Does not install or pin a specific SDK version as a hard dep; it binds to the
  documented surface and isolates the call so an identifier change is contained.

# Review — T-001-03 structured-output-binding

Handoff document. What changed, how it's covered, what a reviewer should look at,
and what remains open.

## What changed

Binds the design-artifact contract (T-001-01) as the Claude Agent SDK's enforced
structured-output format and adds the parse/validate gate every artifact consumer
needs. Files (created unless noted; nothing deleted):

| File | Role |
|---|---|
| `src/artifact.mjs` | **The gate.** Pure, SDK-free validation core: `parseArtifact`, `assertArtifact`, `formatErrors`, `compileValidator`/`loadSchema`, `toModelSchema`, full JSDoc typedefs. |
| `src/sdk-binding.mjs` | **The binding.** `designArtifactOutputFormat()`, `extractArtifact()` (pure) + `requestDesignArtifact()` (live, dynamic-import). |
| `src/artifact.test.mjs` | 17 `node:test` cases — parse/validate, located errors, projection. |
| `src/sdk-binding.test.mjs` | 7 `node:test` cases — output-format object, result extraction. |
| `src/README.md` *(modified)* | Added "Validation & SDK binding" section. |
| `package.json` / `package-lock.json` *(modified)* | `@anthropic-ai/claude-agent-sdk` as `optionalDependencies`. |

Five atomic commits (`31995ef`, `5642cc9`, `36c78bc`, `af94d93`, `e74aef0`), one
per plan step. Phase artifacts live in `docs/active/work/T-001-03/`. Disjoint file
set from concurrent tickets — no edit to `src/expand.mjs` (T-001-02) or
`scripts/validate-artifact.mjs` (T-001-01).

## Acceptance criteria — status

- **AC-1 — schema wired as the SDK structured-output format.** ✅
  `designArtifactOutputFormat()` returns `{ type:"json_schema", schema }` and
  `requestDesignArtifact()` spreads it into `query({ options:{ outputFormat } })`.
  The shape was verified against the installed SDK's `JsonSchemaOutputFormat` type
  (v0.3.162). "Model output conforms" is enforced twice: by the SDK (with retries)
  and again by `extractArtifact` re-validating against the source-of-truth schema.
- **AC-2 — parse/validate helper returns a typed artifact or a clear error.** ✅
  `parseArtifact` → `{ ok:true, artifact }` (frozen, JSDoc-typed `DesignArtifact`)
  or `{ ok:false, code, errors }`. `assertArtifact` is the fail-fast variant.
- **AC-3 — malformed/partial rejected with actionable messages (field, why).** ✅
  Errors are located `at <instancePath|(root)>: <message>` lines, with extras that
  name the offending `additionalProperties` key and list `enum` allowed values.
  Malformed JSON is distinguished (`code:"invalid_json"`) from schema failures
  (`code:"schema_invalid"`).
- **AC-4 — tests cover valid and invalid payloads.** ✅ Both suites exercise the
  committed `valid-`/`invalid-industrial-house.json` fixtures; `npm test` exits 0
  (schema gate + 44 unit tests).

## Test coverage

`npm test` → schema self-test + good/bad fixture gate + **44** unit tests (20
expand, 17 artifact, 7 sdk-binding), 0 fail. All offline and deterministic.

Covered:
- Valid fixture as object **and** as string; frozen, deep-equal to source.
- Invalid fixture: `schema_invalid`, error lines for the bare manifest id
  (`/palette/manifest/1`) and the missing `block` (`/placements/1`).
- Malformed JSON string → `invalid_json`.
- Targeted negatives located at path: missing `metadata.seed`, unknown op,
  non-integer coordinate, extra top-level property; `enum` allowed-values listing.
- `formatErrors(null/undefined)` → `[]`; `assertArtifact` return/throw.
- `toModelSchema`: drops `$schema`/`$id`, strips the `discriminator` **key** (a
  structural scan, not a substring match — the word also occurs in a description),
  is pure (canonical schema retains discriminator), and the projected schema
  validates good / rejects bad standalone (no discriminator option).
- `designArtifactOutputFormat` shape + that its schema actually constrains;
  `extractArtifact` over `structured_output` (object), `result` (text), invalid
  payload (located errors), and empty result (throws).

**Gaps / not covered (intentional or deferred):**
- **`requestDesignArtifact` is not unit-tested.** It is the only live, metered path
  (spec §4 — full API rates as of 2026-06-15) and needs credentials + a subprocess.
  Its logic is thin (build options → drain iterator → `extractArtifact`) and its
  data shapes are covered by the pure tests; an end-to-end smoke with the SDK
  installed is a recommended follow-up (manual, not CI).
- No fixture for the SDK error terminal (`error_max_structured_output_retries`);
  the handling is code-reviewed against the type, not asserted.

## Open concerns / notes for the reviewer

1. **SDK API surface is verified for v0.3.162 only.** `outputFormat`/`json_schema`
   and `structured_output` were confirmed in the installed `sdk.d.ts`. A future SDK
   bump could rename these; the blast radius is contained to `sdk-binding.mjs`
   (`designArtifactOutputFormat` + `payloadOf`), and `extractArtifact` is already
   tolerant (`structured_output ?? result`). Re-verify on SDK upgrade.

2. **`discriminator` is stripped for the model, kept for ourselves.** The API's
   structured-output validator may not honor the OpenAPI `discriminator` keyword, so
   `toModelSchema` removes it; ajv still uses the full schema for crisp single-branch
   placement errors. If the model ever returns a placement that fails the bare
   `oneOf`, the SDK-side error may be noisier than ours — but `extractArtifact`
   re-validates with the discriminator-aware validator, so the *logged* error stays
   crisp. Worth a live check that the API accepts the projected schema as-is.

3. **Double validation is deliberate.** The SDK validates + retries; we re-validate.
   This guarantees a logged artifact conforms regardless of SDK behavior, at the
   cost of one extra ajv pass per trial (negligible). If profiling ever flags it,
   the re-validation could be made opt-out — but defense-in-depth is the right
   default for a measurement instrument.

4. **`formatErrors` / ajv setup duplicates ~20 lines of
   `scripts/validate-artifact.mjs`** (Decision 6 — kept the ticket's file set
   disjoint from T-001-01's). The contract is frozen so drift risk is low; an easy
   future DRY is to have the script `import { formatErrors, compileValidator } from
   "../src/artifact.mjs"`. Optional, not blocking.

5. **`optionalDependencies` pulls 95 transitive packages.** Acceptable: it is
   optional (offline tests and the pure binding never load it) and only the live
   harness (E-03) needs it installed. If footprint matters, it could become a
   documented peer/manual install instead.

6. **`structured_output` is typed `unknown` in the SDK** — there is no compile-time
   guarantee it is even an object. `parseArtifact` handles that (a non-object simply
   fails schema validation with located errors), so a surprising payload degrades to
   a clear rejection, not a crash.

## Downstream readiness

- **T-001-02** (`expand.mjs`) already names T-001-03 as its upstream validator;
  `parseArtifact`/`assertArtifact` are that gate and share the fixtures.
- **E-03 / T-004-01** (experiment harness) can now call `requestDesignArtifact` to
  run a trial and get a re-validated, typed artifact for clean logging.
- **E-04** validators consume artifacts that passed this shape gate; semantic checks
  (block registry, state legality, gravity/attachment) remain their job.

## Verdict

All four acceptance criteria met and demonstrated by `npm test` (44 unit tests +
the schema gate, all green and offline). The binding mechanism (`outputFormat` with
the raw JSON Schema) preserves the single-source-of-truth contract — no Zod fork —
and was verified against the installed SDK types. Open concerns are correctly-placed
scope boundaries (E-04 semantics, the metered live path) plus low-cost follow-ups
(a live smoke test, optional DRY). No blocking issues. Safe to advance.

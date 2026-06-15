# T-001-01 — Plan: design-artifact schema

Ordered, independently-verifiable steps with the testing strategy. Each step is
a clean commit. Maps to the structure blueprint and closes the four AC.

## Testing strategy

This ticket has no application logic to unit-test — the deliverable is a
*declarative* schema. The meaningful tests are **conformance tests**: does a
known-good artifact validate, and does a known-bad one fail at the expected
field? The `scripts/validate-artifact.mjs` runner + `npm test` *is* the test
suite for AC-4.

- **Positive conformance:** the valid sample must compile-and-validate clean
  (zero ajv errors). Exercises every `op` and the optional `state` path so a
  silent over-restriction (e.g. forgetting to allow `state`) is caught.
- **Negative conformance:** the malformed sample must fail, and the runner must
  surface a *located* error (`instancePath` + message) — proving AC-4's
  "which field, why" usefully, not just a boolean.
- **Branch coverage of failure modes:** beyond the one canonical malformed
  file, the runner's assertion set checks several targeted violations
  (additional-property rejection, bad block-ID pattern, non-integer coord,
  empty rationale, missing required metadata) by validating small inline
  fixtures — so each schema rule that matters has a failing witness.
- **No CI yet** (greenfield); `npm test` run locally is the verification gate.
  The exit code is the pass/fail signal a later CI step can adopt unchanged.

Verification criterion for the whole ticket: `npm test` exits 0, with the valid
sample reported VALID and every negative fixture reported INVALID at its
expected path.

## Steps

### Step 1 — Toolchain bootstrap  *(commit: "chore: add Node toolchain + ajv")*
- Write root `package.json` (`type: module`, `private: true`, devDeps `ajv`,
  `ajv-formats`, scripts placeholder) and `.gitignore` (`node_modules/`).
- `npm install` to produce `package-lock.json`.
- **Verify:** `node -e "import('ajv').then(()=>console.log('ok'))"` resolves;
  lockfile present.
- **Why first:** the runner cannot import ajv until this exists.

### Step 2 — Author the schema  *(commit: "feat(schema): design-artifact JSON Schema")*
- Write `schema/design-artifact.schema.json` per `structure.md`:
  `$schema` 2020-12, stable `$id`, root with five required keys +
  `additionalProperties:false`, and the `$defs` (coordinate, blockId,
  blockState, metadata, style, palette, placement `oneOf` over the four ops).
- Encode every D-decision: integer-triple coords (D3), namespaced block-ID
  pattern (D4), optional string-map `state` (D5), required `trial_id` (D6),
  closed objects (D7), distinct `box`/`fill` ops (D2).
- **Verify:** schema is itself valid JSON (`node --check` equivalent: parse it)
  and compiles under ajv without meta-schema errors — confirmed in Step 3 when
  the runner first compiles it.

### Step 3 — Validation runner  *(commit: "feat: artifact validation runner")*
- Write `scripts/validate-artifact.mjs`: load schema, `new Ajv2020()`,
  `addFormats`, `compile`, validate each CLI-arg file; print `VALID` or
  `INVALID` + the located errors; support `--expect valid|invalid` so the
  process exit code encodes the assertion.
- Add npm scripts `validate`, `validate:good`, `validate:bad`, `test`.
- **Verify:** running it against any throwaway JSON compiles the schema (proves
  the schema is meta-valid) and prints a verdict.

### Step 4 — Valid sample  *(commit: "test(schema): valid sample artifact")*
- Author `schema/examples/valid-industrial-house.json`: full metadata
  (trial_id, prompting_method_id, model_id, current model ID per spec §4, seed,
  server_state_id, target=house), `industrial`-style intent + rationale, a
  palette manifest of real survival-obtainable IDs, and placements covering
  **all four ops** plus one placement with `state` (stairs facing/half) and
  one without.
- **Verify:** `npm run validate:good` → `VALID`, exit 0.

### Step 5 — Malformed sample + negative assertions  *(commit: "test(schema): malformed sample + negative cases")*
- Author `schema/examples/invalid-industrial-house.json`: copy of the valid one
  with a single clear defect (a `voxel` missing `block`; a bare un-namespaced
  block ID). 
- Extend the runner's `test` path with the small inline negative fixtures
  (additional-property, bad pattern, non-integer coord, empty rationale,
  missing required metadata) — each asserted INVALID at its expected path.
- **Verify:** `npm run validate:bad` → `INVALID` with a located error;
  `npm test` → exits 0 (all positive+negative expectations met).

### Step 6 — Field reference  *(commit: "docs(schema): field reference README")*
- Write `schema/README.md`: per-field table, the four op geometries, pointers
  to spec §5 and the example files.
- **Verify:** links resolve; field list matches the schema (manual diff).

## Risks & mitigations

- **ajv Draft-2020 entry point.** ajv 8 splits 2020-12 into `ajv/dist/2020`.
  Mitigation: import `Ajv2020` from that path; Step 3 surfaces it immediately.
- **`oneOf` ambiguity.** If two op subschemas could both match, `oneOf` fails
  even valid input. Mitigation: distinct `op` `const` per branch guarantees
  exactly-one match; the valid sample (all four ops) is the regression test.
- **Over-strict block-ID pattern.** Could reject legitimate IDs (e.g. IDs with
  digits). Mitigation: pattern allows `[a-z0-9_]`; the valid sample uses real
  IDs spanning the character classes.
- **Toolchain precedent.** Introducing `package.json` commits the repo to Node.
  Mitigation: JSON Schema stays language-neutral (design D1); only the *harness*
  is Node, and devDeps only — no runtime lock-in for T-001-03.

## Definition of done (traces to AC)

- AC-1 (voxels + box/line/fill): Step 2 `$defs.placement` oneOf; Step 4 sample
  exercises all four.
- AC-2 (palette manifest + style intent + metadata fields): Step 2 root + metadata.
- AC-3 (machine-validatable, committed): Step 2 schema file committed.
- AC-4 (valid passes, malformed fails): Steps 4–5; `npm test` green.

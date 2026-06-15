# T-001-01 — Review: design-artifact schema

Handoff document. What changed, how well it's covered, what a reviewer should
look at, and what remains open.

## What changed

First code-bearing ticket in the repo. Files created (nothing modified beyond
introducing root config; nothing deleted):

| File | Role |
|---|---|
| `schema/design-artifact.schema.json` | **The contract.** JSON Schema 2020-12 for the design artifact. |
| `schema/README.md` | Human field reference; points to spec §5 and examples. |
| `schema/examples/valid-industrial-house.json` | Positive conformance fixture (AC-4). |
| `schema/examples/invalid-industrial-house.json` | Negative conformance fixture (AC-4). |
| `scripts/validate-artifact.mjs` | ajv runner: `--expect`, `--self-test`, located errors. |
| `package.json`, `package-lock.json`, `.gitignore` | Node toolchain (new repo precedent). |

Six atomic commits, one per plan step. Phase artifacts (`research`/`design`/
`structure`/`plan`/`progress`/this) live in `docs/active/work/T-001-01/`.

## Acceptance criteria — status

- **AC-1 — voxels + box/line/fill.** ✅ `placements` is a single ordered array;
  each item is a discriminated `oneOf` over `voxel`, `line`, `box`, `fill`. The
  valid sample exercises all four. Hollow (`box`) vs solid (`fill`) are distinct
  ops, not a flag.
- **AC-2 — palette manifest + style intent + metadata.** ✅ `palette.manifest`
  (declared materials), `style.{name,rationale}`, and `metadata` carrying
  `prompting_method_id`, `model_id`, `seed`, `server_state_id` (all required)
  plus `trial_id` (the §9/§10 join key) and optional `target`/`created_at`.
- **AC-3 — machine-validatable definition committed.** ✅ JSON Schema Draft
  2020-12 committed at `schema/design-artifact.schema.json`; compiles under ajv
  strict mode with no warnings.
- **AC-4 — valid passes, malformed fails.** ✅ `npm test` exits 0: valid sample
  VALID; malformed sample INVALID with two located errors; six negative
  self-test fixtures each fail at the expected path.

## Test coverage

The deliverable is declarative, so "tests" are conformance checks via the runner
(`npm test`). Covered:

- Positive: full artifact with every op + stateful/stateless placements.
- Negative (each a located failure): additional top-level property; bare
  un-namespaced block id; non-integer coordinate; empty style rationale; missing
  required metadata field; unknown placement op; plus the committed malformed
  file (manifest pattern + missing `block`).

**Gaps / not covered (intentional or deferred):**

- No witness for `box`/`fill`/`line` *branch-internal* errors (e.g. a `box`
  missing `to`); only `voxel` branch errors are fixtured. The discriminator makes
  these behave identically, but an explicit fixture per op would be stronger.
- `uniqueItems` on the palette manifest and the `state` empty-object rejection
  (`minProperties: 1`) are enforced by the schema but have no dedicated negative
  fixture.
- `created_at` `format: date-time` is validated (ajv-formats loaded) but only the
  valid path is exercised; no malformed-timestamp fixture.
- Coordinate ordering (`from` ≤ `to`) is **not** constrained — see open concerns.

## Open concerns / notes for the reviewer

1. **`from`/`to` ordering is unconstrained.** A `box`/`fill`/`line` with
   `from > to` on some axis is currently valid. JSON Schema can't express a
   cross-field inequality cleanly, so this is deliberately left to the expander
   (T-001-02), which should normalize min/max corners. **Flag for T-001-02:**
   document and handle inverted ranges; don't assume `from` is the min corner.

2. **`state` values are stringly-typed and unvalidated.** The schema accepts any
   string-valued map; it does not know that `facing` ∈ {north,…} or that a given
   property is legal for a given block. That validation needs the Minecraft
   block registry and belongs to the buildability validator (E-04) / exporter
   (T-002-02), not the contract. Called out so no one assumes `state` is
   semantically checked.

3. **Block ids are pattern-checked, not registry-checked.** `minecraft:foobar`
   passes the schema. Real-block + survival-obtainable checks are E-04's job
   (palette validator) — by design (§9 keeps palette adherence a *measured*
   metric, not a schema gate). The sample uses real survival blocks, but nothing
   enforces that at the schema layer.

4. **Toolchain precedent.** This ticket introduces Node + ajv as the repo's
   first toolchain. The *contract* stays language-neutral (JSON Schema), so
   T-001-03 may bind it from Python or TS; only the validation *harness* is Node.
   If the project later standardizes on Python, the schema is unaffected; only
   `scripts/validate-artifact.mjs` would be re-homed.

5. **Discriminator dependency.** Clean placement errors rely on ajv's
   `discriminator` option (an OpenAPI-ism, not core 2020-12). A different
   validator (e.g. Python `jsonschema`) will still validate correctly via plain
   `oneOf` but will emit noisier errors. T-001-03 should keep using a
   discriminator-aware validator if it wants the crisp messages, or post-process
   `oneOf` errors itself.

6. **`schema_version` is declared but has no consumer yet.** Set to `1.0.0`. The
   first real evolution (e.g. adding a `sphere`/`cylinder` op, or a `region`
   delete op) should bump it and the contract should define a compatibility
   policy. No migration tooling exists yet — fine for Phase 1.

## Downstream readiness

The contract is ready for its dependents to start:
- **T-001-02** (expansion): has a stable op set + semantics + the ordering rule
  (array order → last-writer-wins). Must handle inverted `from`/`to` (concern 1).
- **T-001-03** (SDK binding): can register `schema/design-artifact.schema.json`
  as the structured-output format and reuse the runner's error-formatting
  approach for its parse/validate helper.
- The `$defs.blockId` pattern is the shared vocabulary with T-001-04's palette,
  enabling E-04 to diff placements against a manifest with no id-format
  mismatch.

## Verdict

All four acceptance criteria met and demonstrated by `npm test`. No blocking
issues. The open concerns are correctly-placed scope boundaries (validation that
belongs to E-04/T-001-02) plus a few low-cost test-fixture gaps that a follow-up
could close. Safe to advance.

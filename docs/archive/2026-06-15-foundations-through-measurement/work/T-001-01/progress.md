# T-001-01 — Progress: design-artifact schema

Tracks execution of `plan.md`. All steps complete; `npm test` green.

## Completed steps

- [x] **Step 1 — Toolchain bootstrap.** `package.json` (`type: module`,
  `private`, devDeps `ajv ^8`, `ajv-formats ^3`, npm scripts) + `.gitignore`;
  `npm install` → `package-lock.json`. First code-bearing files in the repo.
  _Commit:_ `chore: add Node toolchain + ajv for schema validation`.

- [x] **Step 2 — Schema.** `schema/design-artifact.schema.json` (Draft 2020-12):
  five required top-level keys, all objects closed, `$defs` for coordinate,
  blockId, blockState, metadata, style, palette, and the placement `oneOf` over
  voxel/line/box/fill.
  _Commit:_ `feat(schema): design-artifact JSON Schema (the contract spine)`.

- [x] **Step 3 — Validation runner.** `scripts/validate-artifact.mjs` — compiles
  the schema with `Ajv2020`, `--expect valid|invalid`, `--self-test`, located
  errors. _Commit:_ `feat: artifact validation runner with discriminated errors`.

- [x] **Step 4 — Valid sample.** `schema/examples/valid-industrial-house.json` —
  all four ops, a stateful + stateless placement, full metadata.
  _Commit:_ `test(schema): valid sample design artifact (industrial house)`.

- [x] **Step 5 — Malformed sample + negative cases.**
  `schema/examples/invalid-industrial-house.json` (bare block id + voxel missing
  `block`); negative fixtures live in the runner's `--self-test`.
  _Commit:_ `test(schema): malformed sample design artifact`.

- [x] **Step 6 — Field reference.** `schema/README.md`.
  _Commit:_ `docs(schema): field reference for the design-artifact contract`.

## Deviation from plan

**Added a `discriminator` on `placement.op` (D2 refinement during Step 3).**
The plan assumed a plain `oneOf`. With `allErrors: true`, a bad placement
produced ~12 lines of noise (errors from all four branches) — directly at odds
with T-001-03's "which field, why" requirement. Switched to ajv's
`discriminator: { propertyName: "op" }` (option `discriminator: true`), which
required adding `"type": "object"` to the `placement` def. Result: a wrong op
yields a single `value of tag "op" must be in oneOf`, and a branch error points
only at the matched branch. This is a strict improvement and is reflected in the
schema + runner commits. No other deviations.

**Note:** ajv strict mode rejected `required: ["op"]` on the discriminator
wrapper (`strictRequired` — `op` not in that schema's `properties`); dropped it,
since each branch already requires `op` and the discriminator enforces presence.

## Verification

- `npm test` → exit 0. Valid sample VALID; malformed sample INVALID with two
  located errors (`/palette/manifest/1` pattern, `/placements/1` missing
  `block`); six negative self-test fixtures each fail at their expected path;
  base artifact VALID.
- Schema compiles cleanly under ajv strict mode (no meta-schema warnings).

## Concurrency observation

A sibling thread (`T-001-04`, style palette) committed to the same branch
during this work (Lisa `max_threads=2`, file-locked shared branch). No file
overlap — T-001-04 touched palette data/validator/docs; this ticket touched
`schema/design-artifact.schema.json`, the runner, examples, and root toolchain
files. The block-ID vocabulary is shared by *convention* (`$defs.blockId`
pattern matches the palette's IDs) but neither ticket imports the other's files.

# T-001-01 — Structure: design-artifact schema

The blueprint: files created/modified, their boundaries and interfaces, and the
order they land. Not code — the shape of the code.

## Files created

```
package.json                                  # repo toolchain (NEW — first in repo)
.gitignore                                    # ignore node_modules/
schema/
  design-artifact.schema.json                 # THE spine (AC-3)
  README.md                                   # human-facing field reference
  examples/
    valid-industrial-house.json               # AC-4 positive sample
    invalid-industrial-house.json             # AC-4 negative sample
scripts/
  validate-artifact.mjs                        # AC-4 runnable proof (ajv runner)
```

No files modified except `package.json`/`.gitignore` being newly introduced.
Nothing deleted. This footprint is deliberately self-contained under
`schema/`, `scripts/`, and root config so it does not collide with the
concurrently-running `T-001-04` (which writes palette data — see boundary note).

## Module boundaries

### `schema/design-artifact.schema.json` — the contract (sole authority)

JSON Schema Draft 2020-12. The *only* normative artifact; everything else in
this ticket references or exercises it. Internal organization:

- Root object: `schema_version`, `metadata`, `style`, `palette`, `placements`;
  `additionalProperties: false`; all five `required`.
- `$defs` block holding reusable subschemas so the root reads cleanly:
  - `$defs.coordinate` — `[int,int,int]` (D3).
  - `$defs.blockId` — pattern-checked namespaced string (D4).
  - `$defs.blockState` — `object` with string-valued `additionalProperties` (D5).
  - `$defs.metadata` — the reproducibility block (D6).
  - `$defs.style` — `{ name, rationale }`.
  - `$defs.palette` — `{ palette_id?, manifest[] }`.
  - `$defs.placement` — `oneOf` the four op subschemas:
    - `$defs.voxelPlacement`  — `{ op:"voxel", pos, block, state? }`
    - `$defs.linePlacement`   — `{ op:"line", from, to, block, state? }`
    - `$defs.boxPlacement`    — `{ op:"box",  from, to, block, state? }`
    - `$defs.fillPlacement`   — `{ op:"fill", from, to, block, state? }`
  - Each op subschema: `op` is a `const`, `additionalProperties:false`, its own
    `required`. `oneOf` + distinct `const`s = exactly one match → targeted error.

Public interface (what consumers rely on, the stable surface):
- The five top-level keys and their types.
- `metadata.trial_id` as the join key (§9/§10).
- The four `op` values and their geometry semantics (D2).
- `$defs.blockId` pattern (so T-001-04 palette IDs and placement blocks share
  one vocabulary).
- `$id` set to a stable URI (`https://mc-design-eval/schema/design-artifact.json`)
  so T-001-03 can register/reference it.

### `schema/examples/*.json` — conformance fixtures

- `valid-industrial-house.json`: exercises **every** branch — at least one of
  each `op` (voxel, line, box, fill), a placement *with* `state` (e.g. stairs
  `facing`/`half`) and one without, full required metadata, a multi-item
  palette manifest, non-empty style rationale. Doubles as living documentation
  and as the fixture T-001-02/03 can reuse.
- `invalid-industrial-house.json`: violates a **single, clearly-locatable**
  rule (chosen: a `voxel` placement missing `block`, plus a bare/un-namespaced
  block ID) so the failure message is unambiguous and the negative test asserts
  on a known path. One canonical malformed file; the unit-ish assertions in the
  runner cover other failure modes (see `plan.md`).

### `scripts/validate-artifact.mjs` — the proof harness

Pure ESM Node script. Boundary: **reads** the schema and one or more JSON files,
**reports** pass/fail; it owns no schema knowledge of its own. Interface:

```
node scripts/validate-artifact.mjs <file.json> [<file2.json> ...]
  → compiles schema/design-artifact.schema.json with ajv (2020) + ajv-formats
  → for each file: print VALID, or INVALID + ajv error list (instancePath,
    message) → first located error per AC-4 "which field, why"
  → exit 0 iff all files match their expectation when run via npm scripts
```

`package.json` scripts wire the AC-4 demonstration:
- `npm run validate:good` → expects VALID on the valid sample (exit 0).
- `npm run validate:bad`  → expects INVALID on the malformed sample; the script
  exits non-zero on unexpected results so the negative case is self-checking.
- `npm test` → runs both and the assertion set; green = AC-4 satisfied.

The runner takes an optional `--expect valid|invalid` flag so a single script
serves both positive and negative assertions and the npm scripts encode intent.

### `package.json` — toolchain root (new precedent)

- `"type": "module"` (ESM, matches `.mjs`).
- devDependencies: `ajv` (^8), `ajv-formats` (^3).
- scripts: `validate`, `validate:good`, `validate:bad`, `test`.
- Minimal `name`/`version`/`private:true`; no app deps — this ticket introduces
  *only* what AC-4 needs. Later tickets extend it.

### `schema/README.md` — field reference

Human-readable companion: each field, type, required/optional, and the four
`op` geometries with one-line examples. Points to the spec §5 and to the
example files. Not normative (the `.schema.json` is) but the on-ramp.

## Ordering of changes (why this order)

1. `package.json` + `.gitignore` + `npm install` — toolchain must exist before
   the runner can import ajv. Commit (lockfile + manifest).
2. `schema/design-artifact.schema.json` — the contract itself. Commit.
3. `scripts/validate-artifact.mjs` — needs the schema to point at. Commit.
4. `examples/*.json` — authored against the finished schema; validated by the
   runner as they are written. Commit.
5. `schema/README.md` — documents the now-final shape. Commit.

Each step is independently committable and verifiable (the runner verifies 2–4).

## Boundary note — concurrency with T-001-04

`T-001-04` (style-palette-whitelist) authors palette *data* and may choose a
`palettes/` or `schema/palettes/` location. To avoid a collision and keep the
seam clean, this ticket:
- Puts the artifact schema under `schema/` and does **not** create a palette
  file or a `palettes/` dir (that is T-001-04's to place).
- Shares the **block-ID vocabulary** via `$defs.blockId` so a T-001-04 palette's
  block IDs and this artifact's placement blocks validate identically, but does
  not import or hard-reference any palette file (palette adherence is E-04).
- The example's `palette.manifest` is authored inline (self-contained), not by
  referencing a T-001-04 file, so the two tickets never touch the same file.

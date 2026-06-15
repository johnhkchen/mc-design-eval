# Structure — T-001-04 style-palette-whitelist

The blueprint: every file this ticket creates, its responsibility, its interface,
and the order they must land. All files live under `palettes/` (Design decision 2)
so this ticket's footprint is disjoint from every concurrent ticket.

## File tree (all created, none modified, none deleted)

```
palettes/
├── package.json            # scoped Node module: deps + the validate/test scripts
├── .gitignore              # node_modules/
├── README.md               # the format definition in prose + authoring guide
├── palette.schema.json     # JSON Schema (draft 2020-12) — the FORMAT definition
├── validate.mjs            # two-layer validator (structural + semantic), CLI
└── industrial.json         # the first style palette (the DATA)
```

Nothing outside `palettes/` is touched. No root `package.json`, no shared
lockfile, no edits to existing docs/spec/tickets. This is the concurrency
guarantee from Design, made concrete.

## `palettes/palette.schema.json` — the format definition

JSON Schema, `$schema` = draft 2020-12. This file *is* the deliverable for AC #1
("a JSON format for a style palette is defined"). Public contract:

- `$id`: a stable URI, e.g. `https://mc-design-eval/palettes/palette.schema.json`.
- `type: object`, `additionalProperties: false`.
- `required`: `["id", "name", "minecraftVersion", "description", "blocks"]`.
- Properties:
  - `id`: `string`, `pattern ^[a-z][a-z0-9-]*$` (kebab-case style id).
  - `name`: `string`, `minLength 1` (human display name).
  - `minecraftVersion`: `string`, `pattern ^\d+\.\d+(\.\d+)?$` (e.g. `1.20.4`).
  - `description`: `string`, `minLength 1` (one-line style intent, prompt-facing).
  - `blocks`: `array`, `minItems 1`, `uniqueItems true`, items =
    `string` `pattern ^[a-z][a-z0-9_]*$` (bare block IDs — Design decision 1).
  - `groups`: optional `object`, `additionalProperties` = array of the same
    block-id string type. Advisory grouping (Design decision 4). The
    blocks-superset invariant is enforced in `validate.mjs`, not expressible in
    pure JSON Schema across the two fields.

This schema validates *itself's instances* — it is the "own format definition"
that AC #4 refers to.

## `palettes/validate.mjs` — the runnable check (AC #3 + AC #4)

A small ES-module CLI. Node 22 (confirmed), `type: module` via `package.json`.

Interface: `node validate.mjs <path-to-palette.json>` → exit 0 on pass, exit 1
with a printed reason on fail. Internal order:

1. **Load** the palette JSON and `palette.schema.json`. Parse error → fail.
2. **Layer A (structural).** Compile `palette.schema.json` with Ajv and validate
   the palette. On failure, print Ajv errors → exit 1. (Satisfies AC #4.)
3. **Layer B (semantic).** `require('minecraft-data')(palette.minecraftVersion)`;
   guard that the version is known to `minecraft-data` (else fail with a clear
   message). Build `validNames = new Set(mcData.blocksArray.map(b => b.name))`.
   - For each `id` in `blocks`: strip optional `minecraft:` prefix; fail if not in
     `validNames` (invalid block) or if in the `NON_SURVIVAL` exclusion set
     (creative/technical only). Collect *all* offenders, print them, exit 1.
     (Satisfies AC #3.)
4. **Invariant.** Every id in any `groups` value must be in `blocks`. Offenders →
   exit 1. (Enforces Design decision 4's single-source-of-truth rule.)
5. **Pass.** Print a one-line summary (`✓ industrial: 28 blocks valid &
   survival-obtainable for 1.20.4`) and exit 0.

Module-level constant `NON_SURVIVAL` (a `Set`) holds the curated exclusion list
from Design decision 5, with a comment per category. Kept in the validator
because it is cross-palette policy, not per-file shape.

No custom error framework — plain `console.error` + `process.exit`. Dependencies:
`ajv`, `minecraft-data`. Both confirmed reachable.

## `palettes/industrial.json` — the data (AC #2)

An instance of the schema. Fields:
- `id`: `"industrial"`, `name`: `"Industrial"`, `minecraftVersion`: `"1.20.4"`.
- `description`: one prompt-facing line naming the material family.
- `blocks`: ~28 bare IDs, all survival-obtainable in 1.20.4 (final roster fixed in
  Implement and *proven* by `validate.mjs`, not by hand).
- `groups`: `structure`, `concrete`, `metal`, `glazing`, `accent` — every member
  also present in `blocks` (invariant).

The roster is authored in Implement, then the validator is the judge. If any block
fails Layer B, it is swapped for a survival-obtainable equivalent and re-run until
green — the file is not "done" until `validate.mjs` exits 0 over it.

## `palettes/package.json` — the scoped module

- `"name": "mc-design-eval-palettes"`, `"private": true`, `"type": "module"`.
- `"scripts"`: `"validate": "node validate.mjs"`,
  `"test": "node validate.mjs industrial.json"` — so `npm test` is the zero-arg
  check the Plan and Review reference.
- `"dependencies"`: `ajv` (^8), `minecraft-data` (^3). Pinned to the major
  versions confirmed reachable (`ajv@8.20.0`, `minecraft-data@3.110.2`).
- No build step, no bundler, no TS — this is a data + validator module.

## `palettes/.gitignore`

One line: `node_modules/`. Keeps the installed deps out of the commit; the
validator is reproducible from `package.json`.

## `palettes/README.md` — format documentation

Prose companion to the schema: what a palette is, the field-by-field format, the
bare-name + `minecraft:`-stripping rule, the version-pinning requirement, the
`groups` advisory-and-subset rule, the exclusion-set policy, and "how to author a
new style" (copy `industrial.json`, edit, `npm run validate <file>`). This is the
human-readable half of AC #1.

## Ordering of changes (matters for verifiable increments)

1. `package.json` + `.gitignore` → `npm install` (brings deps in; nothing to
   verify yet but unblocks everything).
2. `palette.schema.json` → the format exists (AC #1, machine half).
3. `validate.mjs` → the check exists; runs but has nothing valid to check yet.
4. `industrial.json` → author the roster; run `validate.mjs`; iterate to green
   (AC #2, #3, #4 all become satisfiable here).
5. `README.md` → the format's prose half (AC #1 complete).

Each of steps 2–5 is an atomic, independently-committable unit (Plan sequences the
commits). Step 4 is where the acceptance criteria are *demonstrated*, by a green
validator run captured in `progress.md`.

## Interfaces other tickets will later rely on (informational)

- **T-004-02** reads `industrial.json`, uses `blocks` as the injected whitelist
  and `description`/`groups` for prompt framing. Stable contract: `blocks` is the
  authoritative flat set; `groups` is optional sugar.
- **E-04 validator** reads `blocks` as the membership set for palette-adherence
  scoring, applying the same `minecraft:`-stripping normalization on placement IDs
  that `validate.mjs` applies to palette IDs — keeping the two sides' vocabulary
  identical. Documented in README so the future validator matches.

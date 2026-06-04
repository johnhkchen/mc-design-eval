# Plan — T-001-04 style-palette-whitelist

Ordered, independently-verifiable steps. Each step ends in a commit. The whole
ticket's footprint is `palettes/` (Structure), so no cross-ticket coordination is
needed beyond the file lock.

## Testing strategy

There is no application logic to unit-test here — the deliverable is *data plus its
format definition*. The test is therefore the **validator itself**, run over the
authored palette:

- **Layer A (structural):** `validate.mjs` compiles `palette.schema.json` with Ajv
  and checks `industrial.json` against it → proves AC #1 (format defined) and AC #4
  (palette validates against its own format).
- **Layer B (semantic):** the same run checks every block ID against
  `minecraft-data@1.20.4` and the survival exclusion set → proves AC #2 (palette
  authored, survival-obtainable) and AC #3 (every ID valid + obtainable).
- **Negative test:** to prove the validator actually *fails* on bad input (a
  validator that always passes proves nothing), run it transiently against a
  deliberately-broken palette (an invalid block id and a creative-only block) and
  confirm a non-zero exit. This is a throwaway check captured in `progress.md`, not
  committed — the committed artifacts stay clean.
- **Zero-arg gate:** `npm test` (= `node validate.mjs industrial.json`) is the
  single command Review cites as the green check.

Verification criterion for "done": `npm test` exits 0 with a summary line, and the
negative test exits non-zero.

## Step 1 — Scaffold the scoped module

- Create `palettes/package.json` (`type: module`, `private`, `validate` + `test`
  scripts, deps `ajv@^8`, `minecraft-data@^3`).
- Create `palettes/.gitignore` (`node_modules/`).
- Run `npm install` inside `palettes/` (sandbox-disabled — network needed).
- **Verify:** `npm install` succeeds; `node -e "import('ajv')"` and
  `require('minecraft-data')` resolve. Lockfile `package-lock.json` is generated.
- **Commit:** `T-001-04: scaffold palettes module (ajv + minecraft-data)`.

## Step 2 — Define the format (JSON Schema)

- Write `palettes/palette.schema.json` per Structure: draft 2020-12, required
  fields, `id`/`minecraftVersion`/block-id patterns, `blocks` (minItems 1, unique),
  optional `groups`, `additionalProperties: false`.
- **Verify:** Ajv compiles the schema without error (a one-off
  `node -e` that loads + compiles it). A malformed schema would throw at compile.
- **Commit:** `T-001-04: define style-palette JSON Schema (format definition)`.
  (Satisfies AC #1, machine half.)

## Step 3 — Build the validator

- Write `palettes/validate.mjs`: load palette + schema; Layer A (Ajv); Layer B
  (minecraft-data existence + `NON_SURVIVAL` exclusion set, collect-all-offenders);
  groups⊆blocks invariant; pass/fail with exit codes and printed reasons.
- Encode the `NON_SURVIVAL` set from Design decision 5 with per-category comments.
- **Verify:** run against a tiny inline-valid stub palette → exit 0; against a stub
  with one bogus block (`not_a_real_block`) and one creative-only block
  (`command_block`) → exit 1 naming both. (This is the negative test; stubs are not
  committed.)
- **Commit:** `T-001-04: add two-layer palette validator (structural + semantic)`.

## Step 4 — Author the `industrial` palette and prove it green

- Write `palettes/industrial.json`: `id/name/minecraftVersion/description`, the
  ~28-block `industrial` roster, and `groups` (structure/concrete/metal/glazing/
  accent) with every member also in `blocks`.
- **Verify (the acceptance demonstration):** `npm test` → must exit 0 with the
  summary line. If any block fails Layer B, swap it for a survival-obtainable
  equivalent and re-run until green. Capture the final green output in
  `progress.md`.
- **Commit:** `T-001-04: author industrial style palette (28 survival blocks)`.
  (Satisfies AC #2, #3, #4.)

## Step 5 — Document the format

- Write `palettes/README.md`: what a palette is; field-by-field format; bare-name +
  `minecraft:`-stripping rule; version-pinning requirement; `groups` advisory +
  subset rule; exclusion-set policy; "author a new style" recipe; the contract
  T-004-02 and E-04 rely on.
- **Verify:** README's field list matches `palette.schema.json` exactly (manual
  cross-read — no drift between prose and schema).
- **Commit:** `T-001-04: document palette format and authoring guide`.
  (Completes AC #1, prose half.)

## Step 6 — Final gate + Review artifact

- Re-run `npm test` from a clean state to confirm reproducibility.
- Run `git status` to confirm the working tree footprint is exactly `palettes/`
  (plus the `docs/active/work/T-001-04/` artifacts) and nothing leaked outside it.
- Write `review.md` (the Review phase).

## Risks and mitigations

- **`minecraft-data` lacks `1.20.4` block data.** Unlikely (`3.110.2` is recent and
  1.20.4 is well-established), but if so: fall back to the nearest covered 1.20.x
  the package ships and pin the palette to that exact string. The version is data
  in the file, so this is a one-line change, not a code change. Decided in Implement
  against the actually-installed package, recorded in `progress.md`.
- **A chosen block is creative-only or version-gated.** The validator catches it;
  Step 4's iterate-to-green loop is the mitigation. No block ships unverified.
- **`npm install` blocked by sandbox.** Run the install step with the sandbox
  disabled (network is required and the action is a routine dependency fetch).
- **Ambiguous obtainability (e.g. `dirt_path`, `farmland`).** Keep the exclusion set
  conservative — exclude only unambiguous creative/technical blocks; do not put such
  edge blocks in the `industrial` roster at all, sidestepping the judgement call for
  this palette while leaving the policy documented for future styles.

## Definition of done (maps to acceptance criteria)

- AC #1 — `palette.schema.json` + `README.md` define the format. (Steps 2, 5)
- AC #2 — `industrial.json` authored, survival-obtainable. (Step 4)
- AC #3 — every block ID valid + obtainable, proven by `validate.mjs` Layer B.
  (Step 4)
- AC #4 — `industrial.json` validates against `palette.schema.json` via Layer A.
  (Step 4)
All four are demonstrated by a single green `npm test`, with a negative run proving
the check has teeth.

# Design — T-001-04 style-palette-whitelist

Research fixed: JSON format defined by a JSON Schema; core field is a whitelist of
canonical Minecraft block IDs in placement vocabulary; a pinned `minecraftVersion`
makes "valid block ID" decidable; `minecraft-data` is the existence oracle and a
curated exclusion set enforces survival-obtainability. This phase decides the open
questions and the concrete shape.

## Decision 1 — Identifier form: bare names, normalized on read

**Options.** (a) Namespaced everywhere (`minecraft:stone`). (b) Bare everywhere
(`stone`). (c) Accept both, normalize to one canonical form.

**Decision: store bare names (`stone`) in the palette; treat `minecraft:` as an
optional, stripped prefix.** Rationale grounded in research:

- `minecraft-data`'s block `name` field is **bare** (`oak_planks`), so bare names
  match the existence oracle with zero transformation — the cheapest path to a
  mechanical AC #3 check.
- Bare names are more prompt-legible (T-004-02 injects them into a brief; `stone,
  iron_block, glass_pane` reads better than the namespaced form).
- Accepting both (option c) invites two spellings of the same block, which breaks
  the validator's set-membership the moment a placement uses the other spelling.
  Rejected: one canonical form is the whole point of a whitelist.
- The format's contract: the validator strips a leading `minecraft:` before
  comparison, so an artifact that emits namespaced IDs still matches. The *palette
  file itself* is held to bare names by the schema (pattern enforced) so the
  authored data has exactly one spelling.

## Decision 2 — File layout: everything under `palettes/`

**Options.** (a) Root `package.json` + `schemas/` + `palettes/` at repo root.
(b) A self-contained `palettes/` directory holding the schema, the palette data,
the validator, and its own scoped `package.json`.

**Decision: option (b) — a self-contained `palettes/` module.** Rationale:

- **Concurrency safety (decisive).** Research flagged the `max_threads = 2`,
  same-branch hazard. T-001-04 is declared independent; T-001-01 (also wave-0,
  also JSON-Schema-flavored) is the ticket most likely to introduce a root
  `package.json`. Two tickets creating root `package.json` on one branch is a
  content conflict the file lock cannot resolve cleanly. Confining every file this
  ticket writes to `palettes/` guarantees a **disjoint file set** from any
  concurrent ticket — exactly the "correct dependency modeling" the RDSPI doc asks
  for instead of relying on the lock.
- **Honest scoping.** This ticket is "data + its format." A scoped module says
  exactly that and does not pretend to set the repo-wide toolchain. If T-001-01 or
  a later ticket establishes a root build, the palette validator can be lifted up
  then; until then it stands alone and runs alone.
- **Cost:** a second `node_modules` under `palettes/` and a tiny duplication of
  `package.json` boilerplate. Accepted — isolation is worth more than DRY here,
  and `palettes/.gitignore` keeps `node_modules/` out of the commit.

## Decision 3 — Validation in two layers, one entrypoint

AC #4 ("validates against its own format definition") and AC #3 ("every block ID
is valid + survival-obtainable") are two different kinds of check. They compose:

- **Layer A — structural (JSON Schema).** Does the file have the right shape:
  required fields, types, `id` pattern, non-empty unique `blocks`, bare-name
  pattern on each block? Enforced by `palette.schema.json` via **Ajv** (the
  project's JSON-Schema validator vocabulary, per T-001-01; `ajv@8` confirmed
  reachable).
- **Layer B — semantic (Minecraft reality).** For the declared
  `minecraftVersion`: does each block `name` exist in `minecraft-data`'s block
  list (validity), and is it absent from the curated obtainability exclusion set
  (survival-obtainability)? `minecraft-data@3` confirmed reachable.

**One entrypoint** `palettes/validate.mjs <palette.json>` runs A then B and exits
non-zero on any failure, printing the offending blocks. This single command *is*
the satisfaction of AC #3 and AC #4 and is what the Implement phase runs and the
Review phase cites. A `package.json` script (`npm test`) wraps it over the
`industrial` palette so the check is one command with no arguments.

**Rejected:** a hand-rolled structural validator (reinvents JSON Schema, diverges
from T-001-01's idiom) and eyeballing block validity (not mechanically checkable,
fails the spirit of "validates against its format").

## Decision 4 — The palette schema (the format definition)

A JSON Schema (draft 2020-12) at `palettes/palette.schema.json`. Shape:

```jsonc
{
  "id":        "industrial",          // kebab-case, ^[a-z][a-z0-9-]*$, the key
  "name":      "Industrial",          // human display name
  "minecraftVersion": "1.20.4",       // the version block IDs are valid against
  "description": "Concrete, iron, ...", // one-line style intent for the prompt
  "blocks": [                          // THE whitelist — the load-bearing field
    "stone", "smooth_stone", "iron_block", "glass_pane", ...
  ],
  "groups": {                          // OPTIONAL framing, derived view only
    "structure": ["stone", "smooth_stone", ...],
    "metal":     ["iron_block", ...],
    "glazing":   ["glass", "glass_pane", ...],
    "accent":    ["lantern", ...]
  }
}
```

- `blocks` is the single source of truth — a flat, **unique**, non-empty array of
  bare block IDs (`minItems: 1`, `uniqueItems: true`, each
  `^[a-z][a-z0-9_]*$`). The validator only ever trusts `blocks`.
- `groups` is **optional, derived, advisory.** It exists purely to make the
  palette legible to humans and to a prompt (T-004-02 can present "structure /
  metal / glazing / accent" rather than a flat dump). To prevent it becoming a
  shadow second source of truth, the validator enforces an invariant: **every ID
  appearing in any group must also appear in `blocks`.** Groups never *add*
  blocks; they only organize the canonical set. This keeps one source of truth
  while still serving the prompt's need for structure.
- `minecraftVersion` is required and drives Layer B. Decision: pin **`1.20.4`** —
  a widely-supported stable release fully covered by `minecraft-data` and
  Litematica, predating 1.21-only blocks so the roster is conservative. Recorded
  in the file, not hardcoded in the validator, so future palettes can pin
  differently and the render harness can single-source it later.
- `additionalProperties: false` at the top level so a typo'd field is caught, not
  silently ignored.

## Decision 5 — Survival-obtainability exclusion set

`minecraft-data` answers existence, not obtainability. The validator carries a
small, **commented, curated denylist** of IDs that exist but a survival player
cannot obtain or place legally (spec §6: "nothing may require creative-only
placement"). Categories: technical air (`air`, `cave_air`, `void_air`),
admin/creative-only (`barrier`, `command_block`, `chain_command_block`,
`repeating_command_block`, `structure_block`, `structure_void`, `jigsaw`,
`light`, `bedrock`, `debug_stick`-style), portal/dynamic
(`end_portal`, `end_gateway`, `nether_portal`, `moving_piston`,
`fire`, `soul_fire`), and unobtainable-by-survival blocks (`spawner`,
`end_portal_frame`, `petrified_oak_slab`, `farmland`/`dirt_path` only via tools —
kept permissive: those are obtainable as *states*, excluded only if truly
unplaceable). The denylist is intentionally conservative: it excludes the
unambiguous creative/technical blocks and is documented so future styles inherit
the same bar. It lives in the validator, not the schema, because it is a *policy*
that applies across all palettes, not a per-file shape.

This makes "survival-obtainable" a checkable predicate: `exists(id, version)
&& !excluded(id)`.

## Decision 6 — The `industrial` roster (scope ~28 blocks)

Picked to be buildable-complete (a styled structure needs structure + floor +
roof + glazing + accents + lighting) yet genuinely constraining. All survival-
obtainable in 1.20.4, all verified mechanically in Implement. Material family:
greys and dark metals, concrete, exposed stone/iron, utilitarian glass and
lighting. Grouped as structure / concrete / metal / glazing / accent-and-light.
Exact list is committed in Implement and verified by the validator, not asserted
here — the validator is the authority, not this prose.

## What this design explicitly does not do

- Does not resolve spec §12's "one palette or a set for Phase 1" — it makes
  *adding* palettes one-file-cheap and ships exactly one.
- Does not build the prompt-injection formatter (that is T-004-02's job); it only
  guarantees the data is trivially injectable (flat `blocks`, optional `groups`).
- Does not establish a repo-root toolchain; the `palettes/` module is deliberately
  liftable but standalone.

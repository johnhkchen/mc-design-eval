# Design-artifact schema

`design-artifact.schema.json` is the **contract spine** of the instrument: the
structured object an LLM emits in place of bot commands (spec §5). Every
downstream layer — primitive expansion (T-001-02), the Agent SDK
structured-output binding (T-001-03), the schematic exporter (T-002-02), the
palette/buildability validators (E-04), and the rating app (§10) — reads this
one artifact. The artifact is the single source of truth; schematics and renders
are deterministic derivations *from* it, never re-authored.

The normative definition is the `.schema.json` (JSON Schema Draft 2020-12). This
README is the human on-ramp; when the two disagree, the schema wins.

## Validate

```bash
npm install
npm run validate:good   # the valid sample passes
npm run validate:bad    # the malformed sample fails (with located errors)
npm test                # self-test of negative cases + both samples
```

Or validate any file directly:

```bash
node scripts/validate-artifact.mjs path/to/artifact.json
```

## Top-level shape

| Field            | Type     | Required | Notes |
|------------------|----------|----------|-------|
| `schema_version` | string   | yes | Semver of this contract, e.g. `1.0.0`. |
| `metadata`       | object   | yes | Reproducibility + trial identity. |
| `style`          | object   | yes | Named style intent + rationale. |
| `palette`        | object   | yes | Declared materials. |
| `placements`     | array    | yes | ≥1 placements; **array order is application order**. |

Objects are **closed** (`additionalProperties: false`): an unexpected or
misspelled key is a validation error pointing at that key.

### `metadata`

| Field                 | Type    | Required | Notes |
|-----------------------|---------|----------|-------|
| `trial_id`            | string  | yes | The key scores, renders, and human ratings join on (§9/§10). |
| `prompting_method_id` | string  | yes | Named, versioned archetype (§7), e.g. `single-shot.v1`. |
| `model_id`            | string  | yes | Pinned model id — a *current* id, not a retired one (§4). |
| `seed`                | integer | yes | Held constant across a trial cell for comparability. |
| `server_state_id`     | string  | yes | World/server state the trial assumes. |
| `target`              | enum    | no  | `house` \| `path` \| `landscape` — the rubric branches on it. |
| `created_at`          | string  | no  | RFC 3339 / ISO date-time. |

### `style`

`name` (the named style, e.g. `industrial`) + `rationale` (short non-empty
justification — enables style scoring and post-hoc analysis).

### `palette`

`manifest` (required): a non-empty, unique array of block ids the design commits
to use. `palette_id` (optional): a reference to a style-palette whitelist
(T-001-04). The schema only checks that manifest entries are well-formed block
ids — whether placements *stay within* the palette is a measured metric handled
by the palette validator (E-04), not enforced here.

## Placements

Each placement is tagged by `op`. `op` is a discriminator, so a wrong/unknown op
or a branch-specific error points at the offending placement, not a wall of
oneOf noise.

| `op`    | Geometry | Fields |
|---------|----------|--------|
| `voxel` | single block at `pos` | `pos`, `block`, `state?` |
| `line`  | straight lattice line `from`→`to`, inclusive | `from`, `to`, `block`, `state?` |
| `box`   | **hollow** rectangular shell spanning `from`..`to` (6 faces) | `from`, `to`, `block`, `state?` |
| `fill`  | **solid** cuboid spanning `from`..`to` | `from`, `to`, `block`, `state?` |

`box` vs `fill` is hollow-vs-solid — chosen as distinct ops rather than a
`hollow` flag so expansion (T-001-02) and export never have to guess intent.

### Shared field types

- **Coordinate** (`pos`/`from`/`to`): `[x, y, z]`, exactly three **integers**
  (Minecraft is an integer voxel lattice). Negative values are allowed (local
  origin). Floats are rejected.
- **`block`**: a **namespaced** Minecraft block id matching
  `^[a-z0-9_.-]+:[a-z0-9_]+$`, e.g. `minecraft:stone_bricks`. Bare ids like
  `stone_bricks` are rejected.
- **`state`** (optional): a non-empty map of block-state properties, all
  string-valued, e.g. `{"facing":"north","half":"bottom","waterlogged":"true"}`.
  Carries the orientation/face data the buildability check (E-04) and the
  exporter (T-002-02) need for stairs, slabs, torches, ladders, etc.

## Examples

- [`examples/valid-industrial-house.json`](examples/valid-industrial-house.json)
  — exercises all four ops, a stateful and a stateless placement, full metadata.
- [`examples/invalid-industrial-house.json`](examples/invalid-industrial-house.json)
  — a bare block id and a voxel missing `block`; fails with two located errors.

## Scope boundary

This schema *defines* the contract. It does **not** expand primitives to voxels
(T-001-02), bind to the Agent SDK (T-001-03), author palette whitelists
(T-001-04), export schematics (T-002-02), or enforce palette/buildability
(E-04). Those consume the contract.

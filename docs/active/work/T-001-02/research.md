# T-001-02 — Research: placement-primitive expansion

Descriptive map of the codebase as it bears on expanding `box`/`line`/`fill`
primitives (plus explicit `voxel`s) into a normalized, deduplicated voxel set.
What exists, where, how it connects, and the constraints expansion inherits.
No solutions here — those are `design.md`.

## What this ticket is

Epic E-01, spec §5. The design artifact (T-001-01) lets a model express
geometry compactly as primitives (`box`, `line`, `fill`) alongside explicit
`voxel`s, to stay within token budgets on large builds. Downstream consumers
need *explicit voxels*:

- **T-003-02 (voxel-world-construction, S-003)** — `depends_on: [T-003-01,
  T-001-02]`. Its Context says directly: *"Consumes the expanded voxel set
  produced by S-001 T-001-02"*; it writes each voxel's block type and state into
  an in-memory `prismarine-world`. This is the cross-section seam.
- The schematic exporter (T-002-02, deferred this phase) and the validators
  (E-04) also need explicit voxels (palette adherence, survival-buildability are
  per-voxel checks).

So T-001-02 owns a **primitive-expansion module**: artifact in → normalized
voxel set out. The ticket Context and S-001 both name it as a distinct module,
run concurrently with T-001-03 (structured-output binding) which touches a
different module.

## The contract being consumed (T-001-01, already landed)

`schema/design-artifact.schema.json` (Draft 2020-12) is the source of truth.
Relevant shapes (verbatim from the schema):

- **`coordinate`** — `[x,y,z]`, exactly three **integers**; negatives allowed
  (local origin). Floats rejected by the schema.
- **`blockId`** — namespaced string `^[a-z0-9_.-]+:[a-z0-9_]+$`.
- **`blockState`** — optional non-empty `Record<string,string>` (orientation/
  face data: `facing`, `half`, `waterlogged`, …).
- **`placements`** — ordered array, `minItems: 1`. The schema description is
  explicit and load-bearing for this ticket:

  > *"Array order is application order: when placements overlap, downstream
  > expansion (T-001-02) resolves by last-writer-wins over this order."*

- **`placement`** — a `oneOf` discriminated on `op`:
  - `voxel` — `{ op, pos, block, state? }` — one block at `pos`.
  - `line`  — `{ op, from, to, block, state? }` — *"straight lattice line
    from..to, inclusive"*.
  - `box`   — `{ op, from, to, block, state? }` — *"the **hollow** rectangular
    shell (6 faces) spanning from..to inclusive"*.
  - `fill`  — `{ op, from, to, block, state? }` — *"the **solid** cuboid
    spanning from..to inclusive"*.

`schema/README.md` confirms `box` vs `fill` is hollow-vs-solid, *"chosen as
distinct ops rather than a `hollow` flag so expansion (T-001-02) and export
never have to guess intent."* It also names this ticket as the owner of the
overlap rule and explicitly scopes the schema as *not* doing the expansion.

Note the schema does **not** require `from <= to` per axis, and places no
constraint on a `line`'s slope. Both are gaps expansion must resolve (design).

## Fixtures available to reuse

- `schema/examples/valid-industrial-house.json` — exercises all four ops, one
  stateful (`stairs` with `facing`/`half`) and one stateless voxel, a `fill`
  floor `[0,0,0]→[6,0,6]`, a `box` shell `[0,1,0]→[6,4,6]`, a `line` beam
  `[0,4,0]→[6,4,0]` (axis-aligned). A ready-made integration input for
  expansion; its geometry is realistic (a 7×7 house).
- `schema/examples/invalid-industrial-house.json` — malformed; not an expansion
  input but confirms the validation seam is upstream of this module.

## Toolchain reality (what the repo actually does)

CLAUDE.md names **TypeScript (Node 20+)** as the Phase-1 language, but the repo
currently ships **plain ESM `.mjs`** with no TS toolchain — no `tsconfig.json`,
no `typescript` dependency, no build step. Two precedents:

- `scripts/validate-artifact.mjs` — ESM, `ajv/dist/2020.js` + `ajv-formats`,
  located-error formatting (`instancePath` + message), an inline `--self-test`
  of negative fixtures, exit-code-driven, wired through `package.json` scripts.
- `palettes/validate.mjs` — ESM, two-layer validator, `NON_SURVIVAL` policy set,
  `fail(msg, details)` with bulleted located reasons, exit 0/1.

Root `package.json`: `"type": "module"`, devDeps `ajv`/`ajv-formats`, scripts
`validate` / `validate:good` / `validate:bad` / `test`. `test` today runs the
schema self-test + both samples. `node_modules/` holds only ajv & friends.
Node in this environment is **v22.22.0** — `node:test` and `node:assert` are
built in, and `node --test <dir>` discovers `*.test.mjs` files. The established
ethos (per both modules and T-001-01's structure.md) is **minimal deps, single
toolchain, self-contained module, located/actionable errors**.

`palettes/` is a *separate* nested package (own `package.json`, `minecraft-data`
dep) because it is reference data. The schema lives in the **root** package
under `schema/` + `scripts/`. T-001-02 is part of the same S-001 contract as the
schema, so it belongs to the root package, not a nested one.

## Established patterns to honor

1. **ESM `.mjs`, zero new runtime deps** unless justified. Expansion is pure
   integer geometry — it needs no library.
2. **Located, actionable errors** ("which field, why") — the through-line of
   both existing validators and AC-4 of T-001-01.
3. **Self-checking via `package.json` scripts**; `npm test` is the green gate.
4. **Self-contained footprint** to avoid colliding with the concurrent
   T-001-03 (file locking is the safety net, not the design — per the workflow's
   Concurrency section). T-001-03 touches the SDK-binding module; T-001-02 must
   touch disjoint files. The root `package.json` is the one shared file (a
   `test` script line) — a known, minimal contention point.

## Constraints & open questions surfaced (resolved in design)

- **Coordinate ordering of `from`/`to`** is unconstrained by the schema →
  expansion must normalize per-axis min/max.
- **`line` slope** is unconstrained → "straight lattice line" needs a precise,
  deterministic voxelization rule (axis-aligned? diagonals? arbitrary slopes?).
- **"Deterministic and order-independent" vs "last-writer-wins over array
  order"** (AC-3) appear to pull opposite ways → must be reconciled: the *result
  set* is a deterministic function of the artifact and independent of internal
  iteration order, while genuine cross-placement overlaps resolve by the
  documented array-order rule. A canonical output ordering is needed so two runs
  are byte-identical.
- **State on overlap** — when a later placement overwrites a coordinate, does
  its `state` replace or merge with the earlier one? (design decides; replace is
  the natural reading of "last-writer-wins".)
- **Degenerate `box`** (a flat or 1-thick shell) — the surface predicate must
  behave sanely (a flat box is a solid plane).
- **Validation responsibility** — is expansion given a schema-valid artifact, or
  must it re-validate? (design: validation is upstream; expansion adds only the
  expansion-specific guard the schema can't express — the `line` slope rule.)

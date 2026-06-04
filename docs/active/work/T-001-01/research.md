# T-001-01 — Research: design-artifact schema

Descriptive map of what exists, what consumes this schema, and the constraints
that bind its shape. No solutions proposed here — see `design.md`.

## 1. What this ticket is

Define the **design-artifact schema** — the structured object an LLM emits in
place of bot commands (spec §5). It is the *spine* of the instrument: every
downstream layer reads it. Deliverable is a machine-validatable definition
(JSON Schema or equivalent) committed to the repo, plus a sample that validates
cleanly and a malformed sample that fails.

Acceptance criteria (verbatim intent):
1. Placements as **both** explicit voxels (coord + block type) **and**
   primitives (box / line / fill).
2. Palette manifest (declared materials), style intent (named style + short
   rationale), metadata (prompting-method ID, model ID, seed, server-state ID).
3. Machine-validatable definition committed to the repo.
4. A valid sample validates cleanly; a malformed sample fails validation.

## 2. Repository state (greenfield)

This is the **first code-bearing ticket** in the repo. Current contents:

```
docs/specification.md            # the full spec (read in full)
docs/knowledge/rdspi-workflow.md # the six-phase workflow this ticket follows
docs/active/{epics,stories,tickets}/  # planning artifacts only
CLAUDE.md, README.md, LICENSE    # near-empty scaffolding
.lisa.toml                       # Lisa config (max_threads=2, dirs)
```

There is **no `package.json`, no `pyproject.toml`, no `src/`** — no language or
build toolchain is committed yet. T-001-01 therefore also implicitly sets the
first precedent for where schema/code lives and how validation runs.

Runtimes available on this machine: **Node v22.22.0 + npm 10.9.4**, Python
3.14.4 (no `jsonschema` installed). The render ecosystem the spec commits to
(`prismarine-viewer`, Mineflayer — all PrismarineJS) is Node/JS, so Node is the
path of least resistance for a validation harness.

## 3. Who reads this schema (downstream consumers)

From the story (`S-001`) DAG and sibling tickets:

- **T-001-02 — placement-primitive-expansion** (`depends_on: [T-001-01]`).
  Expands box/line/fill primitives into a normalized, deduplicated **explicit
  voxel set**; deterministic, order-independent, documented overlap rule
  (last-writer-wins). → The schema must make primitives *and* voxels
  unambiguous to expand: explicit op type, well-defined coordinate bounds, and
  an ordering the expander can rely on (placement list order).

- **T-001-03 — structured-output-binding** (`depends_on: [T-001-01]`). Wires
  the schema as the **Claude Agent SDK structured-output format**; provides a
  parse/validate helper returning a typed artifact or an actionable error. →
  The schema must be expressible as the SDK's structured-output JSON Schema and
  must be strict enough that malformed/partial model output is rejected with a
  clear "which field, why" message. Implies `additionalProperties: false` and
  precise `required` lists so violations point at a field.

- **T-002-02 — schematic exporter** (cross-story, deferred from active queue
  but still a known consumer). Reads the normalized voxel set + palette and
  emits a `.litematic`/`.schem`. → Needs block IDs that map to real Minecraft
  blocks, and ideally block-state info (facing/half) so stairs/slabs export
  with correct orientation.

- **E-04 validators** (palette adherence + survival buildability). Palette
  validator counts placements whose block is outside the declared whitelist;
  buildability validator does a static check (gravity support, attachment
  faces, no creative-only blocks). → Schema benefits from carrying block-state
  properties (orientation, half, waterlogged) so the buildability check has
  something to read; and the palette manifest must be a clean list to diff
  against placements.

- **T-001-04 — style-palette-whitelist** (independent, wave 0). Defines a JSON
  palette: `style id/name + whitelist of survival-obtainable block IDs`. This
  is *reference data*, a sibling — **not** owned by this ticket. But the
  artifact's `palette manifest` should be reconcilable with a T-001-04 palette
  (same block-ID vocabulary; ideally a `palette_id` link).

- **Rating web app (§10)** and **evaluation (§9)** key every trial by the §5
  **metadata** (trial ID). → Metadata must carry a stable trial identifier and
  the reproducibility fields, and human scores/automatic metrics/token counts
  attach to the same record keyed by it.

## 4. Constraints extracted from the spec

- **§5 minimum shape (binding):** placements (voxels + primitives), palette
  manifest, style intent (name + rationale), metadata (prompting-method ID,
  model ID, seed, server-state ID). The AC restates this — it is the contract.
- **Artifact is the single source of truth.** Schematic export and renders are
  deterministic derivations *from* it (§5). Nothing downstream re-queries the
  model. → The artifact must be self-contained and reproducible.
- **Block vocabulary is external.** Block IDs are standard survival-obtainable
  Minecraft IDs (T-001-04 note) — the schema does **not** invent them. So the
  schema should *shape*/*pattern*-check block IDs, not enumerate them. Whitelist
  enforcement is the palette validator's job (E-04), not the schema's.
- **Token budget pressure (§5, §7, §11).** Primitives exist specifically to keep
  large builds within token budgets; the iterative archetype's growing context
  (§7) makes compactness matter. → Primitives must be genuinely compact (a box
  is ~2 coords, not N voxels) and the schema must not force verbose envelopes.
- **Survival buildability (§6, §9).** Static check needs orientation/face data
  for attachment blocks (stairs, slabs, torches, ladders) and to know
  gravity-affected blocks. → Optional block-state carries this; geometry uses an
  integer voxel grid (Minecraft is integer-cell).
- **Reproducibility / comparability (§7, §9).** Phase 1 holds everything
  constant but the prompting archetype. Metadata is what makes a trial
  reproducible and a cell of the 3×3 matrix attributable. `seed` and
  `server-state ID` are explicitly named.
- **Open question still live (spec §12, first bullet):** "explicit voxel list,
  primitive ops, or both." The AC has already *decided* both — this ticket
  resolves that open question by building the union.

## 5. Conventions / patterns to honor

- **Litematica / Minecraft block IDs** are namespaced: `minecraft:stone_bricks`.
  Block states are key→value string maps (`facing=north`, `half=bottom`,
  `waterlogged=true`). Coordinates are integer cells; a build has a local
  origin.
- **JSON Schema** is the spec's own suggested form ("JSON Schema or
  equivalent") and is also exactly what the Agent SDK consumes for structured
  output (T-001-03) — a single language-neutral artifact serves both the schema
  AC here and the SDK binding next door, and can be validated from either
  Python or TS later. Draft 2020-12 is the current dialect.
- **RDSPI / Lisa:** artifacts go in `docs/active/work/T-001-01/`. Multiple
  tickets share one branch with file-locking; this ticket should avoid
  scattering files where a sibling (esp. T-001-04 palette data) would collide.

## 6. Assumptions (to confirm in Design)

- A single language-neutral **JSON Schema** file is the right form for the
  spine (vs. a TS type, a Python pydantic model, or a Zod schema as source of
  truth). Leaning JSON Schema because it is consumed by both the SDK binding
  and any-language validator without re-authoring.
- **Node + a JSON-Schema validator (ajv)** is the validation harness for the AC
  demo, establishing Node as the repo toolchain. Acceptable first precedent
  given the JS render ecosystem; does not preclude a Python SDK binding later
  since JSON Schema is neutral.
- Block-state support is **in scope now** (optional field) to spare downstream a
  schema migration, even though no AC names it. Primitive *expansion* itself is
  explicitly **out of scope** (that is T-001-02) — this ticket only *defines*
  the primitive shapes.

## 7. Out of scope (explicit)

- Primitive → voxel expansion logic (T-001-02).
- Agent SDK wiring / parse helper (T-001-03).
- Authoring palette whitelists (T-001-04); schematic export (T-002-02);
  validators (E-04). This ticket defines the *contract*, not its consumers.

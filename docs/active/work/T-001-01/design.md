# T-001-01 — Design: design-artifact schema

Decisions, with rejected alternatives. Grounded in `research.md`.

## D1. Source-of-truth form: **JSON Schema (Draft 2020-12)**

Options considered:

| Option | Pro | Con |
|---|---|---|
| **JSON Schema** (chosen) | Language-neutral; *is* the Agent SDK structured-output format (T-001-03 consumes it directly); validatable from Node (ajv) or Python (jsonschema) with no re-authoring; spec's own suggested form | Verbose to hand-author; no native code types (codegen needed if TS types wanted) |
| TS type + `zod` | First-class types; runtime validation | Couples the spine to TS; SDK binding would re-derive a JSON Schema anyway; Python consumers re-author |
| Python `pydantic` | Clean if SDK binding is Python | Same coupling problem inverted; render stack is JS |
| Hand-rolled validator | Full control | Reinvents a solved problem; not "machine-validatable definition" in any standard sense |

**Decision: JSON Schema 2020-12 is the single source of truth.** The spine must
not pick a language; both the SDK binding (T-001-03) and any future validator
read the same `.schema.json`. This also literally satisfies AC-3 ("JSON Schema
or equivalent"). If typed objects are wanted later, codegen *from* the schema is
a downstream convenience, not the contract.

## D2. Placement model: **tagged union over a single `placements` array**

The AC mandates both explicit voxels and box/line/fill primitives. Options for
representing the union:

- **(A) One `placements: []` array, each element tagged by an `op` field**
  (`op: "voxel" | "box" | "line" | "fill"`), schema enforces per-`op` shape via
  `oneOf`. ← chosen
- (B) Separate arrays: `voxels: []`, `boxes: []`, ... — Rejected: loses a single
  global placement *order*, which T-001-02's "last-writer-wins" overlap rule
  needs; forces the expander to interleave four lists with an invented priority.
- (C) Free-form objects, validate in code — Rejected: defeats "reject malformed
  with which-field-why" (T-001-03) and AC-4.

**Decision: (A).** A single ordered array with an `op` discriminator. Order in
the array *is* the application order — this gives T-001-02 a deterministic,
documented basis for last-writer-wins without inventing cross-array priority.
`oneOf` keyed on `op` `const` yields targeted validation errors.

Primitive semantics defined by the contract (expansion is T-001-02's job, but
the *meaning* must be fixed here so the expander and exporter agree):

- `voxel` — a single block at `pos`.
- `line` — blocks along the straight lattice line `from → to` (inclusive).
- `box` — the **hollow** rectangular shell spanning `from..to` (6 faces).
- `fill` — the **solid** cuboid spanning `from..to`.

`box` vs `fill` (hollow vs solid) is the one genuinely ambiguous pair; naming
them distinctly now avoids a `hollow: bool` flag that the expander would have to
branch on and that models forget to set.

## D3. Coordinates: **`[x, y, z]` integer triple**

Minecraft is an integer voxel lattice. A fixed-length 3-tuple of integers
(`minItems/maxItems: 3`) is more compact than `{x,y,z}` objects (matters for
token budget, §5/§7) and unambiguous. No floats — non-integer coords are a
validation failure, which is correct (you cannot place a block at x=1.5).
Negative coordinates are allowed (builds use a local origin and may extend in
any direction).

## D4. Block identifiers: **pattern-checked namespaced strings, not enumerated**

Block IDs are an external vocabulary (research §4). The schema enforces *shape*
only: `^[a-z0-9_.-]+:[a-z0-9_]+$` (namespaced, e.g. `minecraft:stone_bricks`;
the `.-` in the namespace permits modded IDs without over-fitting). Requiring
the namespace keeps the pipeline clean (no "is it `stone` or `minecraft:stone`?"
ambiguity downstream) and gives T-001-03 a crisp rejection for bare IDs.

Whitelist membership (is this block *in the declared palette*?) is **not**
checked by the schema — that is the palette validator (E-04). The schema's job
is well-formedness; palette adherence is a measured metric, deliberately (§9).

## D5. Block state: **optional `state` map — in scope now**

No AC names block state, but research §3/§4 shows survival buildability (E-04)
and the exporter (T-002-02) need orientation for stairs/slabs/torches. Adding it
later forces a schema migration that ripples through T-001-02/03. Cost now is
one optional field: `state: { <prop>: <string> }` (e.g.
`{"facing":"north","half":"bottom","waterlogged":"true"}`), additionalProperties
constrained to strings (Minecraft block states are stringly-typed). Optional, so
simple builds stay terse. **Decision: include it.** Cheap insurance (research
§6, spec principle of keeping the contract fixed while prompts vary).

## D6. Top-level shape

```
DesignArtifact {
  schema_version : semver string         (required — lets the contract evolve)
  metadata       : { ... }               (required — §5 reproducibility)
  style          : { name, rationale }   (required — §5 style intent)
  palette        : { palette_id?, manifest[] }  (required — §5 palette manifest)
  placements     : Placement[]           (required, minItems 1)
}
```

`metadata` (AC-2, §5 + the trial key from §9/§10):

```
metadata {
  trial_id            : string  (required — the key §9/§10 join on)
  prompting_method_id : string  (required — AC)
  model_id            : string  (required — AC; a current ID, not a retired one — §4)
  seed                : integer (required — AC)
  server_state_id     : string  (required — AC)
  target              : "house"|"path"|"landscape"  (optional — §8 rubric needs it)
  created_at          : date-time string            (optional)
}
```

- `trial_id` is elevated to required because the entire scoring/rating spine
  keys on it (§9, §10); an artifact with no trial key cannot be filed.
- `target` is optional (the harness may set it) but enumerated so the rubric
  (§8/§9) can branch reliably when present.

`style`: `name` (string, the named style, e.g. `industrial`) + `rationale`
(string, `minLength` > 0 — a committed rationale, not empty; §5 "short
rationale" enables post-hoc analysis).

`palette`: `manifest` (array of block IDs, `minItems: 1`, `uniqueItems: true` —
the declared materials, §5) + optional `palette_id` linking to a T-001-04
palette file. Manifest is *declared intent*; the validator later diffs actual
placements against it.

## D7. Strictness: **`additionalProperties: false` everywhere**

Closed objects throughout. Rationale: T-001-03 must reject malformed/partial
output with "which field, why"; open objects silently swallow typos
(`pallette`, `postion`) and let partial model output pass. Closed objects turn
every typo into a located error. Cost: the schema must be edited to add fields —
acceptable and even desirable for a contract meant to stay fixed (§5).

## D8. What we deliberately do **not** add

- No `bounds`/bounding-box (derivable from placements; would duplicate truth).
- No `hollow` flag (D2 resolves it by distinct `op`s).
- No palette-membership enforcement in-schema (D4 — that's E-04).
- No expansion output / normalized voxel set (that's T-001-02's artifact).
- No SDK plumbing (T-001-03).

## D9. Validation harness for AC-4

Use **Node + `ajv` + `ajv-formats`** (for `date-time`) via a minimal repo-root
`package.json` and a `scripts/validate-artifact.mjs` runner. This establishes
Node as the repo toolchain (consistent with the JS render stack) and gives a
runnable proof: a valid sample passes, a malformed sample fails with a located
error. Draft 2020-12 → ajv 8 with `2020` entry point.

Alternative (Python `jsonschema`) rejected only because it is not installed and
the render stack is JS — JSON Schema neutrality means this choice does not bind
T-001-03 to Node.

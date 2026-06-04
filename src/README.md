# Placement-primitive expansion

`expand.mjs` turns a design artifact's `placements` (the compact authoring
vocabulary — `voxel` / `line` / `box` / `fill`) into a **normalized,
deduplicated set of explicit voxels** (spec §5, ticket T-001-02). Primitives
keep large builds inside an LLM's token budget; downstream consumers want
voxels. This module is the bridge: artifact in, voxel array out.

Its consumers read explicit voxels, never primitives — the voxel-world
construction (T-003-02), the schematic exporter (T-002-02), and the E-04
buildability/palette validators. So expansion must be **deterministic** (same
artifact ⇒ byte-identical output) and **order-independent** for non-overlapping
placements, with a single documented rule for resolving overlaps.

The normative semantics are the code + its unit suite (`expand.test.mjs`). This
README is the human on-ramp; when the two disagree, the tests win.

## Contract boundary

Input is assumed **schema-valid** (validated upstream by T-001-01 / T-001-03).
This module does no I/O, reads no `minecraft-data`, and knows nothing about
palettes or rendering — it is pure integer lattice geometry. It owns exactly one
guard the JSON Schema cannot express: the `line` straight-lattice rule (below).

## Public API

```js
import { expandArtifact, expandPlacement, voxelKey } from "./expand.mjs";
```

- **`expandArtifact(artifact) → Voxel[]`** — the primary seam (named by
  T-003-02). Expands every placement, deduplicates, returns voxels in canonical
  order.
- **`expandPlacement(placement) → Voxel[]`** — one placement's voxels, in
  canonical order, no cross-placement dedup. Exposed for tests and reuse.
- **`voxelKey(pos) → "x,y,z"`** — the canonical identity/dedup key. Exposed so
  downstream uses the same key.

A `Voxel` is `{ pos: [x, y, z], block: string, state?: Record<string,string> }`.
`state` is **present only when the source placement carried it** — a stateless
voxel has no `state` key (not `state: undefined`).

## Op geometries

Coordinates are integer lattice cells. `from`/`to` are **corner-order
independent**: each axis is normalized to `[min, max]` first (`bounds`), so
`from`/`to` and `to`/`from` produce the same set.

| Op      | Inputs       | Voxel set |
|---------|--------------|-----------|
| `voxel` | `pos`        | the single cell at `pos`. |
| `fill`  | `from`,`to`  | every cell of the solid cuboid — `(dx+1)(dy+1)(dz+1)` cells. |
| `box`   | `from`,`to`  | the **hollow shell**: cells of the cuboid where any axis is on a face (`x∈{lo,hi}` ∨ `y∈{lo,hi}` ∨ `z∈{lo,hi}`). Interior cells are omitted. |
| `line`  | `from`,`to`  | a straight lattice line, inclusive of both ends — `n+1` cells (see below). |

Degenerate cases fall out naturally: a flat `box` (one axis equal) is a solid
plane (every cell is on that face); a `1×1×1` `box` or `fill` is a single voxel.

### The `line` straight-lattice rule

Let `d = to − from` and `n = max(|dx|, |dy|, |dz|)`. A line is **well-formed**
only if every nonzero axis delta equals `±n` — i.e. axis-aligned, or a uniform
2-D / 3-D diagonal (each step is a unit vector in `{−1,0,+1}³`). Such a line
expands to the `n+1` cells `from + i·sign(d)` for `i ∈ [0..n]`.

A line whose axis deltas are unequal and nonzero (e.g. `dx=4, dz=2`) has **no
unambiguous lattice voxelization** — there is no single integer step vector that
hits both endpoints. Rather than pick an arbitrary rasterization (Bresenham has
several reasonable variants), expansion **throws a located Error**. In a
*measurement* instrument, an honest, named failure beats a silently-guessed
shape. Authors who want a slanted run use a sequence of axis-aligned/uniform
segments. (Generalized rasterization is a possible future extension — see
`docs/active/work/T-001-02/review.md`.)

An unknown `op` likewise throws (`unknown placement op "<op>"`) — defensive
depth behind the schema, which should already have rejected it.

## Overlap rule — last-writer-wins, full replace

Placements are applied in **artifact array order** (the artifact defines array
order as application order — see `schema/README.md`). When two placements write
the same coordinate, the **later placement wins**: its `block` *and* `state`
replace the earlier voxel **whole**. There is no state merge — if the later
placement is stateless, the shared cell ends up stateless, stripping any earlier
`state`.

This is the one rule needed to make a *set* (the dedup target) out of an
*ordered list* of placements, and it is the rule the acceptance criteria name.

## Determinism & order-independence

- **Determinism:** `expandArtifact` is a pure function of the artifact. The same
  artifact always expands to a byte-identical voxel array — emission order is
  fixed by the canonical sort, not by `Map` insertion order.
- **Canonical output order:** ascending `y` (ground up), then `z`, then `x`.
  Downstream may rely on this stable, diffable order.
- **Order-independence:** reordering **non-overlapping** placements yields an
  identical voxel array (the canonical sort erases authoring order). Reordering
  *overlapping* placements does change the result — that is the overlap rule
  doing its job, not a violation of determinism.

Both properties are **machine-checked** in `expand.test.mjs` (expand-twice
deep-equal; reorder ⇒ identical), so they are guarantees, not just prose.

## Validation & SDK binding (T-001-03)

Two sibling modules turn untrusted input into a schema-valid, typed artifact and
wire that schema to the experiment harness. They share `src/`'s conventions (pure
ESM, JSDoc typedefs, `node:test`) and depend on `schema/design-artifact.schema.json`
as the single source of truth — never re-stating the shape.

### `artifact.mjs` — the validation gate

```js
import { parseArtifact, assertArtifact, toModelSchema } from "./artifact.mjs";
```

- **`parseArtifact(input) → ParseResult`** — the gate `expand.mjs` assumes upstream.
  Accepts a JSON **string** or a parsed **object**. Returns
  `{ ok:true, artifact }` (frozen, typed `DesignArtifact`) or
  `{ ok:false, code, errors }` where `code ∈ {"invalid_json","schema_invalid"}` and
  `errors` are located `at <path>: <why>` lines (the same format as the schema gate
  — "which field, why"). Validation failure is a *value*, not a throw.
- **`assertArtifact(input) → DesignArtifact`** — fail-fast variant; returns the
  artifact or throws with the joined located message.
- **`toModelSchema() → object`** — the canonical schema projected for a standards
  validator: the non-standard OpenAPI `discriminator` keyword and the `$schema`/`$id`
  meta-fields are stripped (the `oneOf` + `const op` keep the union unambiguous).
  Our own ajv validation keeps using the full schema (with `discriminator`) for
  crisp single-branch placement errors; only the model-facing copy is reduced.

Shape-only: it does **not** check Minecraft semantics (block registry, state
legality — E-04) or the `from ≤ to` corner rule (normalized by `expand.mjs`).

### `sdk-binding.mjs` — Claude Agent SDK structured output

```js
import { designArtifactOutputFormat, extractArtifact, requestDesignArtifact } from "./sdk-binding.mjs";
```

- **`designArtifactOutputFormat() → { type:"json_schema", schema }`** — the object
  spread into `query({ options:{ outputFormat } })`. Binds our schema directly as the
  SDK's enforced structured-output format (spec §4/§5) — no Zod re-authoring, so the
  contract has exactly one definition. Verified against the installed SDK's
  `JsonSchemaOutputFormat` type.
- **`extractArtifact(result) → ParseResult`** — pulls the structured payload off an
  SDK terminal `result` message (`structured_output`, falling back to `result` text)
  and re-validates it through `parseArtifact` for defense in depth.
- **`requestDesignArtifact({ prompt, model, options }) → { artifact, raw }`** — the
  one **live, metered** call (spec §4: Agent SDK bills at full API rates). It
  dynamically imports `@anthropic-ai/claude-agent-sdk` (an `optionalDependency`;
  clear error if absent) so the rest of the module — and the test suite — stay
  offline. **Not exercised by `npm test`.**

## Trial runner (T-004-01)

`config.mjs` + `trial.mjs` are the **E-03 experiment-harness skeleton** (spec §4,
§11 step 5): run one trial through the Claude Agent SDK and log a clean,
metadata-keyed record. The runner reaches the SDK **only** through
`sdk-binding.mjs` — there is exactly one live, metered seam in the codebase.

### `config.mjs` — single source of harness config

```js
import { PHASE1_MODEL_ID, DEFAULT_PROMPTING_METHOD_ID, SAFE_TRIAL_OPTIONS, FORBIDDEN_TOOLS } from "./config.mjs";
```

- **`PHASE1_MODEL_ID`** — the pinned model id (spec §4), in **one place**, mirroring
  `render/src/version.mjs`. Phase 2 sweeps the model by overriding this constant or
  passing `model` to `runTrial`.
- **`SAFE_TRIAL_OPTIONS`** — Agent SDK options that **disable code execution**
  (AC #4 / spec §3): `allowedTools: []`, `permissionMode: "dontAsk"` (deny without
  prompting — a headless run must never hang), and `disallowedTools` naming the
  shells explicitly. The runner never sets `bypassPermissions`.

### `trial.mjs` — the runner

```js
import { runTrial, tallyUsage, serializeTranscript, buildTrialRecord, assertSafeOptions } from "./trial.mjs";
```

- **`runTrial({ prompt, metadata?, model?, outDir?, options? }) → { record, artifact, dir }`**
  — the **live, metered** call. Merges + asserts safe options, requests a validated
  artifact via the binding (collecting every message), and writes the trial store
  under `trials/<trial_id>/`. Keyed solely off `artifact.metadata.trial_id` (the
  artifact is the one source; a mismatching passed `metadata.trial_id` throws).
  **Not exercised by `npm test`** — run it with `npm run trial:run`.
- **`tallyUsage(messages, result) → { turns, totals }`** — per-`assistant`-turn
  input/output tokens (spec §7/§9 turn-over-turn growth) plus the SDK's **billed
  aggregate** totals from the result message. Pure.
- **`serializeTranscript(messages) → string`** — the full transcript as JSONL.
- **`buildTrialRecord({ artifact, tally, result, finishedAt }) → TrialRecord`** —
  the per-trial row E-04 scoring and the §10 rating app join on; identity fields are
  pulled from the artifact so the record can't disagree with it. Pure.
- **`assertSafeOptions(options)`** — throws if merged options would enable a
  code-exec tool or bypass permissions (AC #4). Pure.

The trial store (gitignored) per trial: `artifact.json`, `transcript.jsonl` (every
SDK message, one per line), `trial.json` (the record).

## Single-shot archetype (T-004-02)

A **prompting archetype** (spec §7) is a *named, versioned* configuration of how the
harness constructs a prompt — so a trial's result is attributable to the archetype,
not to incidental wording drift. **Single-shot** is archetype 1: ONE generation, no
feedback, no revision. It is a thin prompt-construction policy layered on the runner
— it contributes only the prompt and the seed identity, then hands them to
`runTrial` (the single SDK seam). Three modules:

```js
import { SINGLE_SHOT, buildSingleShotPrompt, assertAttribution, runSingleShotTrial } from "./single-shot.mjs";
import { loadPalette, formatPaletteBlocks } from "./palette.mjs";
import { TARGET_BRIEFS, STYLE_BRIEFS } from "./briefs.mjs";
```

- **`palette.mjs`** — the shared seam to the T-001-04 palettes (consumer #1).
  `loadPalette(id)` reads `palettes/<id>.json` by path (no re-validation — that is
  `palettes/validate.mjs`'s authoring-time job); `formatPaletteBlocks(palette)`
  renders the whitelist group-by-group for prompt injection. Pure formatter, unit-tested.
- **`briefs.mjs`** — frozen `TARGET_BRIEFS` (house | path | landscape, the spec §8
  ladder) and `STYLE_BRIEFS` (industrial). **Shared across archetypes** (§7 holds the
  target and style constant; only the archetype varies), so it lives outside any one
  archetype. House is the milestone target; path/landscape are ready for the 3×3 matrix.
- **`single-shot.mjs`** —
  - **`buildSingleShotPrompt(spec) → { prompt, seedMetadata }`** (pure): assembles a
    deterministic prompt from the target brief + named style brief + the injected
    palette whitelist **as the binding material constraint** (only-these-blocks; outside
    = violation), and pins every reproducibility field including
    `prompting_method_id = SINGLE_SHOT.id`. Same spec in → byte-identical prompt out.
  - **`SINGLE_SHOT`** — the descriptor; `id` is single-sourced from
    `config.DEFAULT_PROMPTING_METHOD_ID` (`"single-shot.v1"`). The `.v1` suffix is the
    versioning: changing prompt construction bumps it so old trials stay attributable.
  - **`assertAttribution(artifact)`** (pure): throws unless the artifact's
    `metadata.prompting_method_id` equals the archetype id. The harness can't stamp the
    model-authored, frozen artifact, so attribution (AC #4) is prompt-driven **and**
    verified — a mislabeled trial fails loudly instead of logging a wrong row.
  - **`runSingleShotTrial(spec) → { record, artifact, dir }`** — the **live, metered**
    wrapper: build prompt → `runTrial` → `assertAttribution`. Not in `npm test`;
    `npm run trial:run` demonstrates it (house / industrial).

## Test & verify

```bash
npm run test:unit   # expansion + artifact + sdk-binding + trial + palette + single-shot suites (node:test)
npm test            # schema gate + the unit suites
npm run trial:run   # LIVE, METERED single trial (spec §4) — not part of npm test
```

The artifact/sdk-binding/trial suites use the committed `schema/examples/*`
fixtures and mock SDK message objects as the canonical payloads and never make a
live SDK call. Only `trial:run` does.

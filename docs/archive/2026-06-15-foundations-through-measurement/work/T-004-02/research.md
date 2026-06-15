# Research — T-004-02 single-shot-archetype

Map of what exists, where, and how it connects. Descriptive only — no solutions.
The ticket: a named, *versioned* config that constructs the single-shot prompt
(target brief + injected palette whitelist + named style brief) and produces a
complete, schema-valid artifact in **one** generation, attributable to the config.

## Where this ticket sits

Epic E-03, spec §7 archetype 1. It is the **second** of S-004's three tickets and
the last gate before the milestone:

```
T-001-03 (binding) ─> T-004-01 (runner) ─> T-004-02 (THIS) ─┐
T-001-04 (palette) ─────────────────────────────────────────┴─> T-004-03 (smoke)
```

`depends_on: [T-004-01, T-001-04]` — both are `phase: done`. So this ticket builds
on a working trial runner and a validated palette; it does not modify either.
T-004-03 (the milestone) will *consume* this archetype to build a house through
the render tool, so the archetype's public surface must be cleanly callable.

## The runner this archetype feeds (T-004-01) — `src/trial.mjs`

`runTrial({ prompt, metadata, model, outDir, options })` is the live seam. Reading
it precisely (lines 178–215):

- It takes a **prompt string** in and reaches the SDK only through
  `requestDesignArtifact` (`src/sdk-binding.mjs`) — the single metered door.
- It defaults `model` to `PHASE1_MODEL_ID` and merges `options` over
  `SAFE_TRIAL_OPTIONS`, re-asserting safety via `assertSafeOptions`.
- The trial **record key is `artifact.metadata.trial_id`** — pulled from the
  returned artifact, never from a separate block. If a caller passes
  `metadata.trial_id` that disagrees with the artifact's, `runTrial` throws
  (`trial_id mismatch`, line 194). There is **no equivalent check today for
  `prompting_method_id`** — attribution currently rests on the model populating it.
- It writes `trials/<trial_id>/{artifact.json,transcript.jsonl,trial.json}`.
- `buildTrialRecord` (line 122) copies `prompting_method_id`, `model_id`,
  `schema_version` **from the artifact** into the record. So whatever the model
  writes into `metadata.prompting_method_id` is what lands in `trial.json` — the
  attribution field this ticket's AC #4 turns on.

**Key constraint:** the archetype's only lever on the artifact's metadata is the
**prompt text**. The artifact is produced by the model under schema enforcement;
the harness does not post-stamp metadata (the artifact is frozen, `artifact.mjs`
line 140). So "attributable to this config" must be driven by prompt directives
*and* (optionally) verified after the fact.

## The config seam (T-004-01) — `src/config.mjs`

Already single-sources the harness configuration (spec §4):

- `PHASE1_MODEL_ID = "claude-opus-4-8"` — the pin `runTrial` uses by default.
- `DEFAULT_PROMPTING_METHOD_ID = "single-shot.v1"` — **already declared here** with
  a comment ("single-shot archetype is the Phase-1 baseline; multi-shot/multimodal
  are later, versioned configs layered on top of the runner"). This is the id this
  ticket's archetype must own and stamp into metadata.
- `SAFE_TRIAL_OPTIONS` / `FORBIDDEN_TOOLS` — the no-code-exec posture. A
  structured-output-only single-shot trial needs **no tools**, so the archetype
  adds nothing here; it inherits the safe defaults unchanged.

So the archetype's identity string already exists as a constant. What does not yet
exist is the code that **constructs the prompt** from target + palette + style.

## The current prompt construction (the thing this ticket replaces)

`scripts/run-trial.mjs` lines 16–21 hold a hand-written `SAMPLE_PROMPT`: a single
English sentence naming trial_id, model_id, prompting_method_id, seed,
server_state_id, target, "use the industrial palette", "7x7 base". This is exactly
the "incidental wording drift" the ticket warns against — it is ad-hoc, not
versioned, and the palette is named but **not injected** (the model is told "use
the industrial palette" but never given the whitelist). This script is the
demonstrable entrypoint the archetype should take over.

## The palette to inject (T-001-04) — `palettes/`

A palette is **data**: `palettes/industrial.json`, validated by
`palettes/validate.mjs` against `palettes/palette.schema.json`. Shape (confirmed):

- `id` ("industrial"), `name` ("Industrial"), `minecraftVersion` ("1.20.4"),
  `description` (one-line, prompt-facing material intent), `blocks` (the 37-entry
  **whitelist — the single source of truth**, bare ids like `stone`,
  `iron_block`), and optional `groups` (advisory: structure / concrete / metal /
  glazing / accent — every member also in `blocks`).
- `palettes/README.md` lines 8–12 name **this ticket explicitly** as consumer #1:
  "Prompt injection (single-shot-archetype, T-004-02) — the `blocks` whitelist is
  injected into the trial prompt as *the* allowed material set." T-001-04's design
  (Decision 6) deliberately left "the prompt-injection formatter ... T-004-02's
  job"; it only guarantees the data is "trivially injectable (flat `blocks`,
  optional `groups`)."

**Identifier-form rule (palettes/README §"bare names").** Palette `blocks` are
*bare* (`stone`). The design-artifact schema's `blockId` is *namespaced*
(`minecraft:stone` — see the valid fixture's `palette.manifest`). The agreed
normalization both sides apply: **strip a leading `minecraft:`, then compare.** So
the prompt can present bare names while the artifact emits namespaced ids and they
still reconcile; the archetype must be aware of the two spellings.

**No JS palette loader exists yet.** `palettes/validate.mjs` reads the file
directly with `JSON.parse(readFileSync(...))`; nothing under `src/` imports a
palette. The render side and the future E-04 adherence check will also need to
load palettes, so a loader is a shared, currently-missing concern.

## The artifact contract the generation must satisfy — `schema/` + `src/artifact.mjs`

`schema/design-artifact.schema.json` (T-001-01), compiled by `src/artifact.mjs`.
Required top-level: `schema_version`, `metadata`, `style`, `palette`, `placements`.

- `metadata` (required, `additionalProperties:false`): `trial_id`,
  `prompting_method_id`, `model_id`, `seed` (integer), `server_state_id`; optional
  `target` (enum `house|path|landscape`), `created_at`. These are the fields the
  prompt must pin so the artifact is attributable and reproducible.
- `style` (required): `{ name, rationale }` — both non-empty strings. The "named
  style brief" the ticket mentions maps onto `style.name`; `rationale` is the
  model's account of how it realized the style.
- `palette` (required): `{ palette_id?, manifest }` — `manifest` is a non-empty,
  unique array of namespaced block ids the design declares it uses. `palette_id`
  optionally references the whitelist (T-001-04). The binding constraint the
  ticket wants is: `manifest ⊆ whitelist` (measured later by E-04, but *asked for*
  by the prompt here).
- `placements`: the op union (voxel/line/box/fill), each with a `block`.

The SDK binding (`src/sdk-binding.mjs`) feeds `toModelSchema()` as the SDK's
`outputFormat`, so the model is **already constrained** to emit a conforming
object and the harness **re-validates** (`extractArtifact`). "One generation
produces a complete, schema-valid artifact" (AC #2) is therefore guaranteed by the
existing pipeline *provided the archetype routes through `runTrial`* and issues no
revision turns. Single-shot = one `query()`, no tools, no feedback loop.

## The spec's definition of "single-shot" (§7) — what must be true

> **Single-shot.** One generation produces the complete design artifact. No
> feedback, no revision. ... a single large output; baseline against which the
> others must justify their overhead.

And §7's framing of an archetype: "a named, *versioned* configuration of how the
harness constructs prompts and structures turns — so results are attributable to
the archetype, not to incidental wording drift." Spec §8 fixes the three targets
(house / path / landscape) as the constant build set; §7 says "same target, same
palette, same style brief, same seed, same server state, same pinned model" — the
archetype is the *only* variable. So the prompt construction must be a stable,
parameterized function of (target, palette, style, seed, server_state, model,
trial_id), not free prose.

## Existing patterns to mirror

- **Module style:** flat `src/*.mjs`, ESM, a long file-top comment stating the
  ticket, the spec section, and what is pure vs. live. JSDoc typedefs over plain
  objects. Pure logic separated from I/O and tested with `node:test`
  (`src/trial.test.mjs`, `src/artifact.test.mjs`).
- **"Single source" idiom:** `config.mjs` / `render/src/version.mjs` — a value
  that must not drift lives in exactly one exported constant.
- **Live-vs-pure split:** `runTrial` / `requestDesignArtifact` are metered and
  excluded from `npm test`; everything around them is pure and tested. The
  archetype's prompt builder is pure (testable); any live wrapper is not.
- **CLI:** `scripts/run-trial.mjs` mirrors `render/src/cli.mjs` — top-level await,
  one-line summary, explicit exit, friendly "SDK not installed" message.
- **README:** `src/README.md` has per-ticket sections (T-001-03, T-004-01); a new
  archetype section would follow that pattern.

## Constraints & assumptions surfaced

- The archetype cannot *force* metadata values into the artifact (model-authored,
  schema-enforced, frozen). Attribution is prompt-driven; the only enforcement
  hook available is a post-generation **assert** (the runner already does this for
  `trial_id`; nothing does it for `prompting_method_id`).
- Bare-vs-namespaced block ids are two spellings of one set; the prompt injects
  bare names, the artifact emits namespaced — reconciliation is "strip
  `minecraft:`".
- `palettes/` is a self-contained module with its own `node_modules`; importing
  *its validator* from `src/` is undesirable, but **reading its JSON data** is
  fine (it is just a file path).
- Path and landscape targets are spec-defined (§8) but **not separately ticketed**
  in S-004; T-004-03 (the milestone) needs only **house**. Target briefs beyond
  house are anticipatory data, not required surface.
- `created_at` is optional and timestamp-shaped; consistent with the runner's
  decision to keep clock reads out of pure functions, any timestamp should be
  injected, not read inside pure prompt construction.

# Structure — T-004-02 single-shot-archetype

The blueprint: files, module boundaries, public interfaces, ordering. Not code.

## File-level changes

| File | Action | Purpose |
|------|--------|---------|
| `src/palette.mjs` | **create** | Shared palette loader + prompt-facing block formatter (AC #3). |
| `src/palette.test.mjs` | **create** | Unit suite: load `industrial`, format blocks (with/without groups). |
| `src/briefs.mjs` | **create** | Shared, frozen `TARGET_BRIEFS` + `STYLE_BRIEFS` data (AC #1). |
| `src/single-shot.mjs` | **create** | The archetype: descriptor, `buildSingleShotPrompt`, `assertAttribution`, live `runSingleShotTrial` (AC #1–#4). |
| `src/single-shot.test.mjs` | **create** | Unit suite over the pure surface (prompt builder + attribution). No live call. |
| `scripts/run-trial.mjs` | **modify** | Replace ad-hoc `SAMPLE_PROMPT` with a call through the archetype. |
| `src/README.md` | **modify** | Add "Single-shot archetype (T-004-02)" section. |

No deletes. `src/trial.mjs`, `src/sdk-binding.mjs`, `src/config.mjs`,
`src/artifact.mjs`, `palettes/**`, `render/**`, `schema/**` untouched (config is
imported from, not modified).

## `src/palette.mjs` — shared palette access

File-top comment: shared palette loader (consumer #1 of T-001-04, per
`palettes/README.md`); reads palette *data* by path — not an import of the
`palettes/` validator module; no re-validation (authoring-time job of
`palettes/validate.mjs`). Pure formatter + a thin file read.

```
PALETTES_DIR = resolve(here, "..", "palettes")           // sibling dir

@typedef Palette { string id, name, minecraftVersion, description,
                   string[] blocks, Object<string,string[]> [groups] }

loadPalette(id) -> Palette
  // JSON.parse(readFileSync(join(PALETTES_DIR, `${id}.json`)))
  // throws a clear error if the file is missing (names the id + dir)

formatPaletteBlocks(palette) -> string
  // if palette.groups: one line per group "- <group>: a, b, c"
  //   plus any blocks not in any group under "- other: ...".
  // else: a single comma-joined line of palette.blocks.
  // Bare names exactly as authored. Deterministic (stable key order).
```

`loadPalette` is the only I/O; `formatPaletteBlocks` is pure. Both unit-tested
(the former against the shipped `industrial.json`, a deterministic repo file).

## `src/briefs.mjs` — shared target & style briefs

File-top comment: shared across archetypes (spec §7 — same target/style brief
across §7's three archetypes); frozen data, no logic.

```
TARGET_BRIEFS : Readonly<{ house: Brief, path: Brief, landscape: Brief }>
  // keyed by the schema metadata.target enum. Each:
  //   { headline: string, brief: string }   // spec §8 capability, as a build brief
  // house ships as the milestone target; path/landscape are anticipatory data.

STYLE_BRIEFS : Readonly<{ industrial: StyleBrief }>
  // { name: string, brief: string }  // architectural intent; pairs with the
  //                                   // industrial palette's material description.
```

All `Object.freeze`d. No exported functions. Imported by `single-shot.mjs` (and,
later, sibling archetypes).

## `src/single-shot.mjs` — the archetype

File-top comment: E-03 spec §7 archetype 1; a *named, versioned* prompt-construction
policy over the T-004-01 runner; pure prompt builder + attribution guard are
unit-tested, the live `runSingleShotTrial` is metered and not (spec §4); reaches
the SDK only via `runTrial` (never a direct SDK import).

### Imports
`runTrial` from `./trial.mjs`; `PHASE1_MODEL_ID`, `DEFAULT_PROMPTING_METHOD_ID`
from `./config.mjs`; `loadPalette`, `formatPaletteBlocks` from `./palette.mjs`;
`TARGET_BRIEFS`, `STYLE_BRIEFS` from `./briefs.mjs`.

### Descriptor (Decision 2)
```
SINGLE_SHOT = Object.freeze({
  id: DEFAULT_PROMPTING_METHOD_ID,   // "single-shot.v1" — single-sourced
  version: 1,
  label: "Single-shot (one generation, no revision)",
})
```

### Typedefs (JSDoc)
```
@typedef TrialSpec {
  "house"|"path"|"landscape" target,
  string paletteId,            // e.g. "industrial"
  string style,                // STYLE_BRIEFS key, e.g. "industrial"
  string trialId,
  number seed,
  string serverStateId,
  string [model],              // defaults to PHASE1_MODEL_ID downstream
  string [createdAt],          // optional ISO timestamp (injected, not clock-read)
}
@typedef SeedMetadata  // the metadata the prompt pins (mirrors the artifact's)
```

### Public surface (pure — unit-tested)
- **`buildSingleShotPrompt(spec) -> { prompt: string, seedMetadata: SeedMetadata }`**
  1. Validate the spec shape: `target ∈ TARGET_BRIEFS`, `style ∈ STYLE_BRIEFS`,
     non-empty `paletteId`/`trialId`/`serverStateId`, integer `seed`. Throw a clear
     error otherwise (a misconfigured archetype must fail before a metered call).
  2. `palette = loadPalette(spec.paletteId)`; `blocks = formatPaletteBlocks(palette)`.
  3. Assemble `prompt` from fixed, ordered sections (stable wording — versioned):
     - **Role/Task:** produce ONE complete design artifact in a single generation;
       no follow-up, no revision (spec §7 single-shot).
     - **Target brief:** `TARGET_BRIEFS[target]`.
     - **Style brief:** `STYLE_BRIEFS[style]` + palette `description`.
     - **Material constraint (binding):** `formatPaletteBlocks` output, framed as
       the ONLY allowed set; every placement's `block` must be on it; outside =
       violation; emit `minecraft:`-prefixed ids drawn from the bare whitelist;
       set `palette.palette_id = "<id>"` and `palette.manifest ⊆ whitelist`.
     - **Metadata directives:** pin `trial_id`, `prompting_method_id = SINGLE_SHOT.id`,
       `model_id`, `seed`, `server_state_id`, `target`, (optional) `created_at`.
     - **Style object directive:** `style.name = "<style>"`, a `rationale`.
  4. `seedMetadata` = the exact metadata object the prompt pins (so a caller/test
     can compare what was asked for).
- **`assertAttribution(artifact, archetype = SINGLE_SHOT) -> void`**
  Throws if `artifact?.metadata?.prompting_method_id !== archetype.id`. Pure,
  unit-tested. Enforces AC #4 (Decision 5 layer 2).

### Live surface (metered — NOT unit-tested)
- **`runSingleShotTrial(spec) -> Promise<{ record, artifact, dir }>`**
  1. `{ prompt, seedMetadata } = buildSingleShotPrompt(spec)`.
  2. `result = await runTrial({ prompt, metadata: seedMetadata, model: spec.model,
     outDir: spec.outDir })` — the single metered seam; `metadata` seeds the
     runner's existing `trial_id` agreement check.
  3. `assertAttribution(result.artifact)` — fail a mislabeled trial loudly.
  4. return `result`.

## `src/single-shot.test.mjs` — pure-core suite

Mock-free; uses the real shipped `industrial` palette (a repo file). No SDK import,
`runSingleShotTrial` never called.
- `buildSingleShotPrompt` (house/industrial): prompt **contains** each whitelist
  block (e.g. `iron_block`); contains the binding-constraint phrasing; contains the
  house target headline and the industrial style brief; pins
  `prompting_method_id: single-shot.v1`, the `trial_id`, `seed`, `server_state_id`,
  `target house`. `seedMetadata.prompting_method_id === SINGLE_SHOT.id`.
- spec validation: throws on unknown `target`, unknown `style`, missing
  `trialId`, non-integer `seed`.
- determinism: two calls with the same spec produce byte-identical prompts.
- `assertAttribution`: passes when `metadata.prompting_method_id` matches; throws
  on mismatch and on missing metadata.

## `src/palette.test.mjs`
- `loadPalette("industrial")`: returns an object whose `blocks` includes
  `iron_block` and whose `id === "industrial"`; throws on an unknown id.
- `formatPaletteBlocks`: with the industrial palette, output mentions each group
  name and every block; with a `groups`-less palette object, output is the flat
  comma list; deterministic across calls.

## `scripts/run-trial.mjs` — rewire to the archetype

Replace the hand-written `SAMPLE_PROMPT` block with:
```
runSingleShotTrial({
  target: "house", paletteId: "industrial", style: "industrial",
  trialId: "phase1-house-singleshot-demo", seed: 42,
  serverStateId: "flat-creative-superflat.v1",
})
```
Keep the existing summary print + SDK-not-installed friendly error. The CLI is now
a *demonstration of the archetype*, not a parallel prompt source.

## Ordering of changes (commit boundaries → plan.md)

1. `src/palette.mjs` + `src/palette.test.mjs` — leaf module, no dependents.
2. `src/briefs.mjs` — pure data, no dependents yet.
3. `src/single-shot.mjs` pure surface + `src/single-shot.test.mjs` — the heart;
   depends on 1 & 2; fully `npm test`-verifiable.
4. `runSingleShotTrial` live wrapper (in `single-shot.mjs`) + `scripts/run-trial.mjs`
   rewire — the metered leg + entrypoint (not CI-verified).
5. `src/README.md` docs.

1–3 are verifiable via `npm test`; 4 is the unverified-by-CI live path; 5 is docs.

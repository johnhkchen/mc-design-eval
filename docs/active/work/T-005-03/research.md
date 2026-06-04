# Research — T-005-03 iterative-multimodal.v1 archetype

Descriptive map of what exists and how it connects, for layering a new named,
versioned prompting archetype — `iterative-multimodal.v1` — on the existing trial
machinery. No solutions here; those are in `design.md`.

## What the ticket asks for

A second archetype alongside `single-shot.v1` (spec §7, archetypes 2+3): a
harness-orchestrated **generate → render → see → revise** loop.

- **Round 0:** build an initial artifact from a base prompt (target=house,
  style=`neoclassical`, palette injected as the binding constraint) —
  `buildSingleShotPrompt`-style construction.
- **Rounds 1..N:** render the prior artifact to a WIP PNG, feed that image + a
  versioned revision instruction back through the multimodal seam, re-validate the
  emitted complete artifact. Default N=3, configurable.
- **Stop** after N rounds or on a no-op revision; last artifact is final.
- Every round stays schema-valid and in-palette; attributable to
  `iterative-multimodal.v1`.

## Existing pieces this layers on (all present, all tested or documented)

### The single live seam — `src/sdk-binding.mjs`

Two live, metered request functions over a shared private spine `invokeClaude`
(spawn → stream → validate). Both re-validate the emitted text against the
source-of-truth schema and **throw** on failure.

- `requestDesignArtifact({ prompt, model, onMessage })` — text path (`claude -p
  --output-format stream-json --verbose`). Returns `{ artifact, raw }`.
- `requestDesignArtifactWithImage({ prompt, images, model, onMessage })` —
  **the seam this ticket needs** (T-005-02). Adds `--input-format stream-json`,
  writes a structured user message (schema-scaffolded text + base64 image blocks)
  on stdin. `images` is one-or-more `Buffer`/`{data}`/`{base64}`; empty throws
  pre-spawn. Same `{ artifact, raw }` return, same `onMessage` streaming, same
  re-validation. Image tokens ride inside the turn's `message.usage.input_tokens`.
- Pure helpers (exported, unit-tested): `toImageBlock`, `buildImageTurn`,
  `serializeStreamJsonInput`, `withSchemaInstruction`, `stripToJson`,
  `extractArtifact`.
- **Open concern from T-005-02 (review.md):** the stream-json input envelope has
  not been round-tripped against the live CLI. Documented fallback = render MCP
  server via `--mcp-config` + `toToolResult` image block. This is an AC-#2-of-that-
  ticket pending item, and a live risk for *our* AC #2.

### The render core — `render/src/render-tool.mjs`

`renderArtifact(artifact, { outPath, view, strict }) → RenderReport` — builds a
fresh in-memory voxel world and renders headless to a PNG. Report: `{ path, bytes,
placed, unmapped[], bounds, view }`. Construction is **total** (unmappable blocks
recorded in `unmapped`, never thrown) unless `strict`. A fresh world per call, so
rounds cannot bleed. Heavy GL/prismarine deps — must be **lazy-imported** so pure
unit tests never load them. `GL_AVAILABLE` is re-exported as a skip gate.

### The render tool wrapper — `src/render-tool.mjs`

Pure, tested helpers I can reuse without the SDK/GL:
- `derivePath(outDir, trialId, n)` — `<trialId>.png` for n=0, else `<trialId>-rev<n>.png`;
  sanitizes the (model-authored) trial id so it cannot escape `outDir`.
- `renderSummary(report)` — the single loggable build summary `{ path, bytes,
  placed, unmapped, bounds, unmapped_detail? }` shared by tool result and record.
- `coerceArtifact`, `toToolResult` (for the MCP fallback path).
- `createRenderServer` — the live in-process MCP server (lazy SDK + GL). Only
  needed if we take the `--mcp-config` fallback.

### The runner — `src/trial.mjs`

`runTrial({ prompt, metadata, model, outDir, options })` is the **single-call**
runner single-shot uses. It calls `requestDesignArtifact`, tallies usage, and
writes `artifact.json` / `transcript.jsonl` / `trial.json` under `outDir/<trial_id>/`.
Pure, reusable helpers (no SDK):
- `tallyUsage(messages, result) → { turns[], totals }` — per-assistant-turn input/
  output (incl. image tokens) + the billed aggregate. Built *for* this iterative
  archetype (its header calls out "turn-over-turn context growth").
- `serializeTranscript(messages) → JSONL`.
- `buildTrialRecord({ artifact, tally, result, finishedAt })` — pulls identity from
  the artifact; `finishedAt` is a param, not a clock read (testable).
- `assertSafeOptions(options)` — code-exec / permission-bypass guard.

`runTrial` is **single-turn**: it writes the whole store from one call and keys
off one artifact. An N-round loop needs multi-call accumulation, so this archetype
orchestrates the seam directly (like `smoke-trial.mjs` does for rendering) rather
than calling `runTrial` per round.

### The single-shot archetype — `src/single-shot.mjs` (the template to mirror)

- `SINGLE_SHOT = { id: "single-shot.v1", version, label }` (id single-sourced from
  config). The `.v1` suffix is the versioning that makes trials attributable.
- `assertSpec(spec)` — validates target ∈ TARGET_BRIEFS, style ∈ STYLE_BRIEFS,
  non-empty paletteId/trialId/serverStateId, integer seed. Fails before any call.
- `buildSingleShotPrompt(spec) → { prompt, seedMetadata }` — PURE. Ordered sections:
  Target brief → Style brief + palette description → **Material constraint
  (binding)** with the whole whitelist via `formatPaletteBlocks` → required
  metadata pins (incl. `prompting_method_id`) → style record. Deterministic:
  same spec → byte-identical prompt.
- `assertAttribution(artifact, archetype = SINGLE_SHOT)` — PURE; throws unless
  `metadata.prompting_method_id === archetype.id`. **Already parameterized** — I can
  pass my descriptor to reuse it verbatim.
- `runSingleShotTrial(spec)` — thin live glue: build prompt → `runTrial` → assert.
  NOT unit-tested (spec §4).

### Smoke trial — `src/smoke-trial.mjs` (the orchestration template)

Shows the layering for an archetype that orchestrates the seam + render directly:
reuse pure building blocks, **lazy-import** the render core inside the live
function, write the store, NOT unit-tested. Its `attachRender(record, summary,
imageName)` is the pattern for folding render info into a record immutably.

### Briefs & palette — `src/briefs.mjs`, `src/palette.mjs`, `palettes/neoclassical.json`

- `STYLE_BRIEFS.neoclassical` (T-005-01, shipped) — the aesthetic vocabulary:
  columned portico (shaft/capital/base), entablature + cornice, triangular
  pediment, stepped stylobate, rhythmed tall windows, bilateral symmetry, pale
  marble/ashlar. This is exactly the revision-prompt detail vocabulary the ticket
  names (columns, entablature, pediment, steps, window rhythm).
- `TARGET_BRIEFS.house` — the round-0 target.
- `loadPalette(id)` → `{ id, name, minecraftVersion, description, blocks[], groups? }`;
  `formatPaletteBlocks(palette)` → grouped, prompt-ready whitelist. `palettes/
  neoclassical.json` is a shipped 43-block palette validated for MC 1.20.1.
- **No palette-adherence checker exists.** `palette.mjs` header explicitly defers
  it ("the future E-04 adherence check is consumer #2 and can share it"). Schema
  validation does NOT check block ∈ whitelist. AC #3 ("re-validated schema +
  palette-adherent") therefore requires a NEW in-palette check.

### Artifact validation — `src/artifact.mjs`

`parseArtifact` / `assertArtifact` (located ajv errors), `toModelSchema`. Placement
blocks are namespaced `minecraft:<id>`; the palette whitelist stores **bare** ids.
A palette check must normalize the `minecraft:` prefix. `palette.manifest` and each
`placement.block` are the block-bearing fields.

### Config — `src/config.mjs`

`PHASE1_MODEL_ID = "claude-opus-4-8"`, `DEFAULT_PROMPTING_METHOD_ID =
"single-shot.v1"`, `SAFE_TRIAL_OPTIONS`, `FORBIDDEN_TOOLS`. The iterative archetype
id is NOT single-sourced here yet (single-shot's is). Adding it keeps the "one
spelling" discipline.

## Test conventions (npm test = `node --test`)

- One `*.test.mjs` per module; pure surface only. Import the module but **never call
  the live function**, so neither the SDK nor GL loads (the test running at all is
  the proof the heavy deps are lazy). 109 tests green at baseline.
- Determinism asserted by byte-identical re-runs; metadata pins asserted by regex on
  the prompt text; real shipped palettes used as fixtures.

## Constraints & assumptions surfaced

1. **Per-round re-validation is partly free, partly new.** Schema re-validation is
   inside the seam (throws). Palette-adherence is NOT — must be added (pure).
2. **Attribution across rounds is the model's job, guarded by the harness.** The
   revision turns go through `requestDesignArtifactWithImage`, which does NOT assert
   attribution. Every round's prompt must re-pin `prompting_method_id` + `trial_id`,
   and the loop must `assertAttribution` each round (AC #4) and check `trial_id` is
   stable (the join key cannot drift mid-trial).
3. **Round-0 wording must differ from single-shot.** Single-shot's prompt says "ONE
   response… no revision" — false for an iterative round 0. Reuse the *structure*
   (target/style/palette/metadata), not that sentence.
4. **No tools needed.** The harness renders deterministically via `renderArtifact`
   (not an emergent model tool call), so rounds run tool-free — no `SAFE_TRIAL_
   OPTIONS` wiring, mirroring how single-shot reaches the seam.
5. **Live AC #2 risk inherited from T-005-02:** the stream-json image envelope is
   unverified against the live CLI. Out of `npm test` scope, but must be flagged.
6. **No-op detection needs a definition.** "No-op revision" = the emitted artifact's
   build is materially identical to the prior round's (placements/style). Must be a
   pure, deterministic comparison.
7. **Heavy deps lazy.** The live loop lazy-imports the render core; the module's
   top-level imports stay pure so the unit suite is offline + GPU-free.

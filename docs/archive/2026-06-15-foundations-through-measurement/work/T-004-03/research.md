# T-004-03 Research — end-to-end-smoke-trial

**The milestone.** Wire the render tool (T-003-04) into the harness and run the
single-shot archetype building a **house** end to end: `prompt → artifact →
materialize → render → saved image`, with transcript and token counts logged.
This ticket is the lone DAG sink (`depends_on: [T-004-02, T-003-04]`); scoring/rating
are out of scope. This is descriptive — what already exists and where the seam is.

## The pieces this milestone composes (all already built)

The end-to-end path is assembled from finished, tested components. Nothing here
needs new domain logic — the work is *composition + persistence of the image*.

### 1. Generation — `src/single-shot.mjs` (T-004-02)

- `buildSingleShotPrompt(spec)` — PURE. Assembles the frozen, versioned prompt from
  `TARGET_BRIEFS[target]` + `STYLE_BRIEFS[style]` + the injected palette whitelist.
  Returns `{ prompt, seedMetadata }`. `seedMetadata` pins `trial_id`,
  `prompting_method_id` (`single-shot.v1`), `model_id`, `seed`, `server_state_id`,
  `target`.
- `assertAttribution(artifact)` — PURE. Throws unless
  `artifact.metadata.prompting_method_id === "single-shot.v1"` (AC #4 of T-004-02).
- `runSingleShotTrial(spec)` — LIVE glue: `buildSingleShotPrompt` → `runTrial` →
  `assertAttribution`. Returns `{ record, artifact, dir }`. Only passes
  `prompt, metadata, model, outDir` to `runTrial` — **does not forward extra SDK
  options** (so it cannot, as written, add an in-session tool).
- `TrialSpec`: `{ target, paletteId, style, trialId, seed, serverStateId, model?,
  createdAt?, outDir? }`. `house` is the milestone target.

### 2. The metered SDK seam — `src/trial.mjs` (T-004-01)

- `runTrial({ prompt, metadata?, model?, outDir="trials", options={} })` — LIVE.
  The ONE place the SDK is reached (via `requestDesignArtifact`). Flow: merge
  `options` over `SAFE_TRIAL_OPTIONS` → `assertSafeOptions` → request artifact (with
  `onMessage` capturing every message) → tally usage → build record → write
  `trials/<trial_id>/{artifact.json, transcript.jsonl, trial.json}`. Returns
  `{ record, artifact, dir }`.
- `options` is merged into the query and flows through to the SDK — so `mcpServers`
  and `allowedTools` can be threaded in **without changing `runTrial`**.
- `assertSafeOptions` rejects only the `FORBIDDEN_TOOLS` (Bash, etc.) and
  permission-bypass. An `mcp__render__render` entry in `allowedTools` passes.
- PURE, `npm test`-covered: `tallyUsage`, `serializeTranscript`, `buildTrialRecord`,
  `assertSafeOptions`. The LIVE `runTrial` is glue, not unit-tested (spec §4 billing).
- The trial store dir is `join(outDir, trial_id)`; it is `mkdirSync`'d here.

### 3. The SDK binding — `src/sdk-binding.mjs` (T-001-03)

- `requestDesignArtifact({ prompt, model, options, onMessage })` — LIVE, the only
  `query()` call site. Spreads caller `options`, adds `outputFormat` (structured
  output bound to the artifact schema). Non-`success` terminal → throws.
- So a single-shot trial is **structured-output-only**: the model emits one JSON
  artifact; it does not, by the prompt's design, take tool-calling turns.

### 4. The render tool — `src/render-tool.mjs` + `render/src/render-tool.mjs` (T-003-04)

- `render/src/render-tool.mjs#renderArtifact(artifact, { outPath, view, strict })`
  — the render-domain core. `buildWorldFromArtifact` → `renderBuild` → writes a PNG
  to `outPath`, returns `RenderReport` `{ path, bytes, placed, unmapped[], bounds,
  view }`. Stateless (fresh world per call). GL-gated (skips without headless WebGL).
- `src/render-tool.mjs` — the SDK wrapper. PURE helpers (`npm test`-covered):
  `derivePath`, `coerceArtifact`, `toToolResult` (builds the loggable summary +
  optional base64 image block), `toErrorResult`. LIVE `createRenderServer(opts)` —
  dynamically imports the SDK (`tool`, `createSdkMcpServer`) + zod and returns an
  in-process MCP server surfaced as `mcp__render__render`. Its handler sanitizes the
  out path, lazily imports the GL core, renders, and returns `toToolResult`.
- `RENDER_SERVER_NAME = "render"`, `RENDER_TOOL_NAME = "render"` → the tool name the
  harness adds to `allowedTools` is `mcp__render__render`.

### 5. Config & invariants — `src/config.mjs`

- `PHASE1_MODEL_ID = "claude-opus-4-8"`, `DEFAULT_PROMPTING_METHOD_ID =
  "single-shot.v1"`.
- `SAFE_TRIAL_OPTIONS` = `{ allowedTools: [], disallowedTools: FORBIDDEN_TOOLS,
  permissionMode: "dontAsk" }`. **Crucially**, its docstring already states the
  intended wiring: *"When the render tool is later exposed to the harness (spec §4)
  it is added to `allowedTools` as an `mcp__render__*` tool — a non-code-exec
  in-process tool — without touching this posture."* This ticket realizes that.

### 6. The current entrypoint — `scripts/run-trial.mjs`

- `npm run trial:run` → `runSingleShotTrial({ target:"house", paletteId:"industrial",
  style:"industrial", trialId:"phase1-house-singleshot-demo", seed:42,
  serverStateId:"flat-creative-superflat.v1" })`. Prints status/model/tokens/cost.
  **It does NOT render an image today** — that is the gap this ticket closes.

## The trial store (where the image must land)

`trials/<trial_id>/` (gitignored). Today holds `artifact.json`, `transcript.jsonl`,
`trial.json` (the record with `usage.totals` token counts). AC #3 requires the image
"alongside" these — i.e. in this same dir. `render/out/` (also gitignored) already
holds prior sample renders incl. `phase1-house-singleshot-0001.png`.

## Boundaries, patterns, constraints

- **PURE / LIVE split is the house style.** Every module isolates one
  dynamically-imported, metered/GPU-bound function; everything else is pure and
  `npm test`-covered offline. New code must follow this — pure helpers tested, the
  live composition documented as out-of-`npm test`.
- **`render/` is a separate dependency island.** prismarine/three/GL live in
  `render/node_modules`; the top-level package has neither the SDK nor GL as hard
  deps (SDK is `optionalDependencies`). Top-level modules reach the render core only
  via **dynamic** `import("../render/src/render-tool.mjs")`, so importing them for
  pure tests never loads GL.
- **One source of truth, no re-stamping.** The record's identity fields are read
  from the artifact (`buildTrialRecord`); attribution is asserted, not stamped.
- **`runTrial` writes `trial.json` itself.** Anything that wants to add a field to
  the record (e.g. a render summary) must rewrite that file or write a sidecar.
- **Single-shot won't call the tool.** The archetype is "one generation, no
  revision," so even with `mcp__render__render` available the model emits structured
  output without a render turn. The milestone image therefore comes from the harness
  rendering the *final* artifact, not from a model tool call. AC #1 ("wired as an
  invocable tool") and AC #2–4 ("materialize → render → saved image") are two
  distinct obligations met by two mechanisms (availability vs. post-generation render).

## Open questions for Design

1. Thread the render server into the single-shot *session* (genuine AC #1 wiring per
   config's documented intent) vs. only render post-generation?
2. New orchestrator module vs. extending `runSingleShotTrial`/`runTrial`?
3. Record the render summary in `trial.json` (rewrite) vs. a `render.json` sidecar?
4. Reuse `toToolResult`'s summary shape for the record, or a new shape?

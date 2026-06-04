# Research — T-005-02 multimodal-render-feedback-seam

Map of the codebase as it bears on giving the model a *rendered WIP image* plus
text on the default `claude -p` path and getting back a validated artifact.
Descriptive only — options and the decision live in `design.md`.

## The seam this ticket extends

`src/sdk-binding.mjs` is the SINGLE live, metered seam (spec §4). Everything below
hangs off it.

- `requestDesignArtifact({ prompt, model, options = {}, onMessage })` — the lone
  live function (sdk-binding.mjs:131). It:
  1. builds CLI args `["-p", "--output-format", "stream-json", "--verbose"]`, plus
     `--model <id>` when `model` is set;
  2. `spawn(CLAUDE_CLI, args, { stdio: ["pipe","pipe","pipe"] })` — no shell;
  3. writes the **schema-scaffolded prompt** to stdin as raw text via
     `child.stdin.end(withSchemaInstruction(prompt))` (default `--input-format
     text`, so stdin *is* the prompt);
  4. reads stdout, splitting on `\n`, `JSON.parse`-ing each line, calling
     `onMessage(msg)` once per message in order, and capturing the terminal
     `msg.type === "result"`;
  5. on close: errors if no result, if `result.subtype !== "success"`, or if
     re-validation fails; otherwise returns `{ artifact, raw: result }`.
- `options` is currently **reserved / ignored** (`void options;`) on the CLI path —
  the jsdoc explicitly says SDK-shaped `mcpServers`/`outputFormat` "do not translate
  to the CLI — multimodal tool wiring arrives later via `--mcp-config`." That later
  is **this ticket** (or its sibling wiring).

### Pure helpers already in the module (all unit-tested offline)

- `withSchemaInstruction(prompt)` — appends an "Output format (required)" section
  plus the model-facing JSON Schema, asking for a bare JSON object. A property of
  the *invocation path*, not the archetype. (sdk-binding.mjs:55)
- `stripToJson(text)` — strips a ```` ```json ```` fence / surrounding prose down to
  the outermost `{…}`. (sdk-binding.mjs:76)
- `payloadOf(result)` (private) — prefers SDK `structured_output`, else the
  free-form `result` string → `stripToJson`. (sdk-binding.mjs:94)
- `extractArtifact(result)` — `parseArtifact(payloadOf(result))`; re-validates
  against the source-of-truth schema. (sdk-binding.mjs:109)
- `designArtifactOutputFormat()` — the SDK-path `json_schema` option (unused by the
  CLI path, kept for the drop-in SDK alternative).

These shape options/payloads with **no process and no network**; only
`requestDesignArtifact` spawns, and it is deliberately NOT unit-tested (spec §4:
live + metered). This split is the module's organizing rule and the template this
ticket must follow.

## How a turn's messages and tokens flow to the runner

`src/trial.mjs` (the runner) consumes the stream the seam emits:

- `runTrial` passes `onMessage: (m) => messages.push(m)` and then calls
  `tallyUsage(messages, raw)`.
- `tallyUsage` (trial.mjs:72) builds a **per-turn** breakdown by reading each
  `assistant` message's nested `message.usage` (`input_tokens`, `output_tokens`,
  `cache_*`). The terminal `result.usage` gives billed `totals`.
- Consequence relevant to AC #3: **image tokens are not a separate field** — they
  land inside the image-bearing turn's `message.usage.input_tokens`. As long as the
  new seam streams every message unchanged to `onMessage`, the runner's existing
  tally captures per-turn usage *including* image tokens with zero runner change.
  (Spec §9's "track image tokens *separately* from text" is a later runner/archetype
  concern, not this seam's.)

## What already produces an image (the thing the model will see)

- `render/src/render-tool.mjs` `renderArtifact(artifact, { outPath, view })` →
  writes a PNG, returns a `RenderReport` (`path`, `bytes`, `placed`, `unmapped`,
  `bounds`). Pinned to Minecraft 1.20.1 (render/src/version.mjs; the coral-bug fix).
- `src/render-tool.mjs` wraps that as an in-process Agent SDK MCP tool. Two pieces
  are directly relevant:
  - `toToolResult(report, { embedImage, pngBuffer })` (render-tool.mjs:105) ALREADY
    emits an **image content block**: `{ type: "image", data: <base64>, mimeType:
    "image/png" }` when `embedImage` is set. This is the *documented alternative*
    delivery route (the model sees the image when it calls the render tool).
  - `createRenderServer({ outDir, embedImage })` builds the MCP server;
    `embedImage` defaults true. This server is what `--mcp-config` would load on the
    CLI path.
- Sample PNGs already exist under `render/out/*.png` (e.g.
  `phase1-house-singleshot-0001.png`), usable as live-test inputs. `render/out/` is
  gitignored, so unit tests must NOT depend on those files — construct bytes inline.

## The CLI's image-input capability (verified against `claude --help`)

- `--input-format <text|stream-json>` — "realtime streaming input … only works with
  --print". Default `text` (what the current seam uses).
- `--output-format stream-json` — already used; emits the per-message stream the
  runner consumes.
- `--include-partial-messages`, `--replay-user-messages` — optional; not required.
- `--mcp-config <configs…>` — "Load MCP servers from JSON files or strings." The
  route for the render-tool fallback.

So the platform exposes a `stream-json` **input** channel. Its message envelope is
the Anthropic message object (passthrough): a user message whose `content` is an
array of blocks — `{type:"text",…}` and `{type:"image",source:{type:"base64",
media_type,data}}`. The current seam writes raw text to stdin; switching this turn
to `--input-format stream-json` lets us write that structured user message instead.

## Constraints & assumptions

- **Text-only path must stay byte-identical** (AC #4): same args, same raw-text
  stdin, same tests. Any refactor must preserve it exactly.
- **Live image round-trips are unmetered-test-forbidden** (spec §4) AND need real
  image bytes — so AC #2 ("confirmed by a live round-trip") is a *documented manual
  verification*, not part of `npm test`. New logic must be split so the **shaping**
  of the message/content is pure and offline-testable (mirrors the existing module).
- **Tests run via** `node --test "src/**/*.test.mjs"` (package.json). New pure tests
  belong in `src/sdk-binding.test.mjs`; they may build tiny `Buffer`s inline.
- **Safety posture** (config.mjs `SAFE_TRIAL_OPTIONS` / `FORBIDDEN_TOOLS`,
  trial.mjs `assertSafeOptions`): sending an image adds no tool and no code-exec
  surface, so the posture is untouched on the primary path. (The `--mcp-config`
  fallback would add the non-code-exec `mcp__render__render` tool — already
  anticipated by `renderToolOptions` in smoke-trial.mjs.)
- **Unknowns to pin in Design/Plan:** exact stream-json user-message envelope the
  CLI accepts, and whether closing stdin (`end()`) is sufficient to make the CLI
  process a single-message input without a `--replay`/`result` handshake. The live
  round-trip in Plan is the verification gate; the render-MCP route is the fallback
  if the envelope is rejected.

# Design — T-005-02 multimodal-render-feedback-seam

Research fixed the terrain: one live seam (`requestDesignArtifact`) that spawns
`claude -p --output-format stream-json --verbose`, writes a schema-scaffolded
prompt to stdin as raw text, streams every message to `onMessage`, and re-validates
the terminal payload. The CLI exposes `--input-format stream-json` for structured
input. The render tool already emits image content blocks; the runner already
captures per-turn usage. This phase decides the delivery mechanism, the module
split, and the helper contract.

## Decision 1 — Delivery mechanism: `--input-format stream-json`, not `--mcp-config`

**Options.**
- **(a) Stream-json input.** Run the turn with `--input-format stream-json`; write a
  single Anthropic user-message object to stdin whose `content` carries a text block
  (the schema-scaffolded prompt) **and** one or more image blocks (base64 PNG). The
  model sees the image as direct visual input.
- **(b) Render-tool image return.** Keep text input; load the render MCP server via
  `--mcp-config`; the model only sees an image when it *calls* `render` and the tool
  returns an image content block (`toToolResult` already does this).

**Decision: (a), with (b) retained as the documented fallback.** Rationale grounded
in research:

- The ticket's own framing names (a) as "the most likely route" and (b) as the
  alternative "if CLI image input proves unworkable." (a) is the *direct* analogue
  of what the seam already does — write to stdin, read the stream — just with a
  structured user message instead of raw text. It changes one flag and the stdin
  payload; the entire stdout/validation spine is reused unchanged.
- (a) delivers the image **deterministically as the turn's input**. The seam, not
  the model's emergent choice, decides the model sees its build — exactly the
  "let the model *see* its build and revise it" mechanism the ticket asks for. With
  (b) the image only appears if the model elects to call the tool, conflating "did
  the model see it" with "did the model choose to render," which muddies the very
  signal the multimodal archetype measures.
- (a) keeps the safety posture untouched: **no tool, no code-exec surface** is added
  (config.mjs). (b) adds the `mcp__render__render` tool to the session — safe
  (non-code-exec, already anticipated by `renderToolOptions`) but strictly more
  surface than the primary path needs.
- (a) preserves per-turn token capture for free: the image rides inside the turn's
  `message.usage.input_tokens`, which `tallyUsage` already reads (AC #3).

**Rejected (b)** as the primary, but it is real insurance: the render server and its
image-bearing `toToolResult` already exist, so if the live round-trip shows the CLI
rejects the stream-json envelope, the fallback is a *wiring* change (add
`--mcp-config`), not new rendering code. Documented in `structure.md` / `review.md`.

## Decision 2 — A NEW function, not a flag on `requestDesignArtifact`

**Options.** (a) Add `images` to `requestDesignArtifact` and branch internally.
(b) Add a sibling `requestDesignArtifactWithImage({ prompt, images, … })`.

**Decision: (b), a sibling function.** Rationale:

- AC #1 literally asks for "a new seam function (e.g. `requestDesignArtifactWithImage`)".
- AC #4 demands the **text-only path and all current tests are unaffected**. A
  sibling with its own arg shape guarantees the text path's signature, args, and
  stdin behavior are byte-identical — the safest possible way to satisfy "unchanged."
- The two paths differ in exactly two places (one CLI flag; a structured-vs-raw
  stdin payload) and share everything else. That shared everything wants to be ONE
  implementation (Decision 3), not duplicated under a branch.

**Rejected (a)** — an internal branch makes the common path's behavior depend on an
optional arg, and risks perturbing the text path (against AC #4).

## Decision 3 — Extract the spawn/stream/validate spine into a private core

Both public functions do the identical thing after stdin: spawn, line-split stdout,
`onMessage` per message, capture the terminal `result`, check `subtype`, and
`extractArtifact`. Today that ~70-line body lives inside `requestDesignArtifact`.

**Decision.** Extract a private `async invokeClaude({ args, stdin, onMessage })`
that owns spawn + the stdout loop + exit handling + result/subtype checks +
re-validation, returning `{ artifact, raw }`. `requestDesignArtifact` and
`requestDesignArtifactWithImage` become thin wrappers that only differ in the `args`
and the `stdin` string they hand it.

- **Why:** one implementation of the error-prone streaming/validation logic →
  no drift between the two live paths, and the text path's behavior is *defined by
  the same code it always ran* (the wrapper just forwards the same args + stdin).
- **Risk control:** the text wrapper must produce the **exact** prior args array
  (`["-p","--output-format","stream-json","--verbose", …model]`) and the exact prior
  stdin (`withSchemaInstruction(prompt)`), so the refactor is behavior-preserving.

## Decision 4 — Pure, offline-testable message/content shaping

The new logic that CAN be tested without a process is the construction of the
stream-json user message. Make it pure helpers (mirroring `withSchemaInstruction` /
`stripToJson`), and keep file I/O (reading a PNG off disk) and the spawn in the
live wrapper.

- `toImageBlock(image)` — normalize one image into an Anthropic image block
  `{ type:"image", source:{ type:"base64", media_type, data } }`. Accepts a `Buffer`
  (default `media_type: "image/png"`) or `{ data: Buffer|Uint8Array, mediaType? }`
  or `{ base64: string, mediaType? }`. Base64-encodes buffers. Throws on empty/bad
  input — a malformed image must fail before a metered call.
- `buildImageTurn(prompt, images)` — returns the full user-message object
  `{ type:"user", message:{ role:"user", content:[ textBlock, ...imageBlocks ] } }`,
  where `textBlock` is `{ type:"text", text: withSchemaInstruction(prompt) }`.
  Reusing `withSchemaInstruction` keeps the **artifact contract identical** — the
  revision turn must still emit a bare schema-valid JSON object, re-validated by the
  same `extractArtifact`. Throws when `images` is empty (AC #1 = "one or more").
- `serializeStreamJsonInput(message)` — `JSON.stringify(message) + "\n"`: the CLI
  reads newline-delimited JSON; a single message is one line then EOF.

These three are unit-tested over inline `Buffer`s. The live wrapper composes them.

## Decision 5 — Image bytes accepted as buffers/objects; disk read at the edge

The pure helpers take already-loaded bytes (Buffer / base64), so they stay offline.
The live `requestDesignArtifactWithImage` accepts the same `images` items the
helpers do; if a future caller wants to pass a path, a one-line `readFileSync` at
the wrapper edge converts it — kept out of the pure core. For this ticket the seam
accepts `Buffer | {data} | {base64}` items and leaves path-reading to the caller
(the smoke/iterative archetype already holds `report.path`).

## What this design explicitly does NOT do

- No change to `trial.mjs` / `tallyUsage` — per-turn image tokens already flow
  through (AC #3). A *separately labelled* image-token field is a later archetype
  concern (spec §9), tracked as an open concern in `review.md`.
- No multi-turn conversation loop. This seam delivers prompt+image → one validated
  artifact. The iterative generate→render→feedback loop is T-005-03's job, layered
  on this seam.
- No live test added to `npm test`. AC #2 is a documented manual round-trip.

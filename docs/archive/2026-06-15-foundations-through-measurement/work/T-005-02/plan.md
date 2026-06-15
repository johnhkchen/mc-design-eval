# Plan — T-005-02 multimodal-render-feedback-seam

Ordered, independently verifiable steps. Each step is one atomic commit. Tests run
with `npm test` (validators + `node --test "src/**/*.test.mjs"`).

## Step 1 — Extract the spawn/stream/validate core (behavior-preserving)

- In `src/sdk-binding.mjs`, lift the body of `requestDesignArtifact` (everything
  after building `args` + the stdin string) into a private
  `async function invokeClaude({ args, stdin, onMessage })` returning
  `{ artifact, raw }`. Keep the `child.error` launch message, the no-result error,
  the `subtype !== "success"` error, and the `extractArtifact` re-validation exactly
  as they are.
- Reduce `requestDesignArtifact` to: build the **same** args
  (`["-p","--output-format","stream-json","--verbose"]` + optional `--model`),
  set `stdin = withSchemaInstruction(prompt)`, `void options;`, and
  `return invokeClaude({ args, stdin, onMessage })`.
- **Verify:** `npm test` green. The change is mechanical and behavior-preserving;
  the existing pure tests (extract/strip/withSchema) are untouched and must still
  pass. Diff review confirms args + stdin are byte-identical to before.
- **Commit:** `sdk-binding: extract invokeClaude spawn/stream/validate core (no behavior change)`.

## Step 2 — Add the pure image-shaping helpers

- Add `toImageBlock(image)`, `buildImageTurn(prompt, images)`,
  `serializeStreamJsonInput(message)` per `structure.md` (exported, grouped with the
  existing pure helpers).
- `toImageBlock`: normalize `Buffer`/`{data,mediaType}`/`{base64,mediaType}` →
  `{type:"image",source:{type:"base64",media_type,data}}`; default
  `media_type:"image/png"`; throw on empty bytes / empty base64.
- `buildImageTurn`: throw on empty `images`; text block uses
  `withSchemaInstruction(prompt)`; append one `toImageBlock` per image in order.
- `serializeStreamJsonInput`: `JSON.stringify(message)+"\n"`.
- **Verify:** unit tests in Step 3 cover these; running `npm test` after Step 3
  exercises them. (Helpers added and tested in one commit is acceptable — combine
  Steps 2+3 into one commit if cleaner.)

## Step 3 — Unit-test the pure helpers (offline)

- In `src/sdk-binding.test.mjs` add the import for the three new symbols and a test
  group building inline `Buffer`s (PNG magic `0x89 0x50 0x4e 0x47`), asserting:
  - `toImageBlock(Buffer)` → png block; `source.data` base64-decodes to the bytes.
  - `toImageBlock({data, mediaType:"image/jpeg"})` honors the media type.
  - `toImageBlock({base64})` passthrough.
  - `toImageBlock(Buffer.alloc(0))` / `toImageBlock(null)` throw.
  - `buildImageTurn("BASE", [buf])` → `type:"user"`, `message.role:"user"`,
    `content[0].type==="text"` whose text matches `/Output format \(required\)/`
    and `/"title": "DesignArtifact"/`, and `content[1].type==="image"`.
  - `buildImageTurn("BASE", [b1,b2])` preserves image count + order.
  - `buildImageTurn("BASE", [])` and `buildImageTurn("BASE")` throw.
  - `serializeStreamJsonInput(msg)` ends with `"\n"`, has no interior newline, and
    `JSON.parse(trim)` deep-equals `msg`.
- **Verify:** `npm test` green; new tests run and pass.
- **Commit:** `sdk-binding: add pure image-turn shaping helpers + unit tests`.

## Step 4 — Add the live `requestDesignArtifactWithImage`

- Add the exported live function per `structure.md`:
  args = text-path args **plus** `--input-format stream-json`;
  `stdin = serializeStreamJsonInput(buildImageTurn(prompt, images))`;
  delegate to `invokeClaude`. `void options;`.
- Update the module header jsdoc: document the multimodal path, that it streams
  every message to `onMessage` (so `tallyUsage` still captures per-turn usage incl.
  image tokens — AC #3), and the `--mcp-config` render-tool fallback (Decision 1).
- **Verify:** `npm test` green (the live fn is not invoked by tests, exactly as
  `requestDesignArtifact` is not). Confirm the module still imports cleanly:
  `node -e "import('./src/sdk-binding.mjs').then(m=>console.log(typeof m.requestDesignArtifactWithImage))"`.
- **Commit:** `sdk-binding: add requestDesignArtifactWithImage (claude -p multimodal seam)`.

## Testing strategy

- **Unit (in `npm test`, offline):** all three pure helpers — shaping, defaults,
  ordering, error throws, serialization round-trip. This is the AC #4 guarantee that
  "new pure helpers (message/content shaping) are unit-tested offline."
- **Regression (in `npm test`):** the entire existing suite must stay green,
  proving the text-only path and current tests are unaffected (AC #4). The
  `invokeClaude` extraction is the only touch to the text path and is mechanical.
- **Live round-trip (manual, NOT in `npm test`) — the AC #2 gate:** with the CLI
  logged in, run a one-off script that loads an existing render PNG (e.g.
  `render/out/phase1-house-singleshot-0001.png`), calls
  `requestDesignArtifactWithImage({ prompt: "<describe what you see in this render, then …>", images:[buf] })`,
  and prints the streamed messages. **Pass criteria:** (1) a `result` message with
  `subtype:"success"`; (2) the model's text references something visually present in
  the render (confirming it *saw* the image, not just the prompt); (3) the returned
  artifact re-validates; (4) the image-bearing turn's `message.usage.input_tokens`
  is materially higher than a text-only turn (image tokens present).
  - **If the CLI rejects the stream-json envelope:** fall back to Decision 1(b) —
    load the render server via `--mcp-config` and have the tool return the image
    block. The render server + `toToolResult` image path already exist; this is a
    wiring change, documented in `review.md`.

## Verification checklist (maps to ACs)

- AC #1 — `requestDesignArtifactWithImage(prompt, images≥1)` returns
  `{ artifact, raw }` via the `claude -p` path. (Step 4 + live round-trip.)
- AC #2 — live round-trip shows the model referencing the render. (Manual gate.)
- AC #3 — every message still streamed to `onMessage`; per-turn usage incl. image
  tokens capturable by `tallyUsage` (unchanged runner). (Design Decision 1; Step 4.)
- AC #4 — text path + all current tests unaffected; new pure helpers unit-tested
  offline. (Steps 1 & 3; `npm test`.)

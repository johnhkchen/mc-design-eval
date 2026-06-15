# Review — T-005-02 multimodal-render-feedback-seam

Handoff document. What changed, how it's tested, and the open concerns a human (and
the dependent ticket T-005-03) needs before relying on this seam.

## What changed

Extended the single live seam (`src/sdk-binding.mjs`) so a trial turn can send the
model a rendered WIP image plus text on the default `claude -p` path and get back a
re-validated artifact — the mechanism that lets the model *see* its build and revise.

### `src/sdk-binding.mjs` (modify)
- **`invokeClaude({ args, stdin, onMessage })`** (new, private) — the shared
  spawn → stream → validate spine, lifted verbatim from `requestDesignArtifact`. One
  implementation of the error-prone streaming/validation logic for both live paths.
- **`requestDesignArtifact`** — now a thin wrapper over `invokeClaude` with the
  **same** args and the same raw-text stdin as before. Behavior-preserving.
- **`toImageBlock` / `buildImageTurn` / `serializeStreamJsonInput`** (new, pure,
  exported) — shape an Anthropic image content block, the stream-json user message
  (schema-scaffolded text + image blocks), and the newline-delimited input line.
- **`requestDesignArtifactWithImage({ prompt, images, model, options, onMessage })`**
  (new, live) — text-path args **plus** `--input-format stream-json`; stdin is the
  serialized image turn; delegates to `invokeClaude`. Validates images pre-spawn.
- Module header updated to document the multimodal path + the `--mcp-config` fallback.

### `src/sdk-binding.test.mjs` (modify)
- +10 offline unit tests for the three pure helpers (inline PNG-magic buffers).

### `docs/active/work/T-005-02/` (add)
- `research.md`, `design.md`, `structure.md`, `plan.md`, `progress.md`, this file.

No changes to `trial.mjs`, `config.mjs`, `render-tool.mjs`, or any schema.

## Test coverage

- **`npm test`: 109/109 pass** (95 → 109). The new tests cover, offline:
  buffer→base64 round-trip, `{data,mediaType}` with a non-png type, `{base64}`
  passthrough, empty/missing-bytes throws, the user-message shape (schema directive
  present in the text block), image count+order preservation, the empty-images throw,
  and the single-line/newline/JSON-round-trip of the serialized input.
- **Regression:** the entire prior suite stays green, evidencing the text-only path
  and current tests are unaffected (AC #4). The only text-path touch is the
  mechanical `invokeClaude` extraction; args + stdin are byte-identical.

### Coverage gaps (by design, spec §4)
- `requestDesignArtifactWithImage` and `invokeClaude` are **not** exercised by
  `npm test` — they spawn the metered CLI and (for images) need real bytes, exactly
  as `requestDesignArtifact` has always been untested. Their risk is contained to the
  thin glue; all decision logic is in the pure, tested helpers.

## AC status

- **AC #1 — new seam fn accepts prompt + ≥1 PNG → validated artifact + result via
  `claude -p`:** ✓ implemented (`requestDesignArtifactWithImage`); empty images throw
  pre-spawn. Final confirmation is the live round-trip below.
- **AC #2 — image delivered as visual input, confirmed by a live round-trip:**
  ⏳ **pending a manual metered run** (not automatable in `npm test`). Procedure in
  `plan.md`: feed `render/out/phase1-house-singleshot-0001.png`, confirm the model's
  response references what's visually in the render, the artifact re-validates, and
  the image-bearing turn's `input_tokens` jumps. **This is the one item a human must
  run before T-005-03 depends on the seam.**
- **AC #3 — full stream still to `onMessage`; per-turn usage incl. image tokens
  capturable by `tallyUsage`:** ✓ by construction — `invokeClaude` streams every
  message unchanged, and image tokens ride inside the turn's `message.usage.
  input_tokens` that `tallyUsage` already reads. No runner change.
- **AC #4 — text path + current tests unaffected; new pure helpers unit-tested
  offline:** ✓ — text path is a behavior-preserving wrapper; 109/109 green; the three
  helpers are offline-tested.

## Open concerns / TODOs

1. **Stream-json input envelope is unverified against the live CLI (the one real
   risk).** The user-message shape (`{type:"user",message:{role,content:[…]}}` with
   `image` blocks `{source:{type:"base64",media_type,data}}`) is the Anthropic
   message-object passthrough and matches what the render tool already emits, but the
   `claude -p --input-format stream-json` path has not been round-tripped here. If the
   CLI rejects it, the **documented fallback** is to load the render MCP server via
   `--mcp-config` and let `toToolResult` return the image block (that code already
   exists). Resolve during the AC #2 round-trip.
2. **Closing stdin to signal end-of-input.** `invokeClaude` does `child.stdin.end()`
   after one message; this should make the CLI process the single input and emit a
   `result`. If a `result` never arrives on the stream-json path, a `--replay-user-
   messages` handshake or an explicit end marker may be needed — surfaced by the same
   round-trip (the seam already errors clearly on "no result message").
3. **Image-token *separate* accounting (spec §9) is not done here and is out of
   scope.** This seam makes image tokens *capturable* (inside the turn usage); a
   distinctly-labelled image-token field is a runner/archetype concern for T-005-03.
4. **Path-based image inputs.** The seam accepts `Buffer`/`{data}`/`{base64}`; a
   caller holding a `report.path` reads the file at the edge (one `readFileSync`). If
   T-005-03 prefers passing paths, add a thin path-accepting convenience there rather
   than pushing I/O into the pure core.
5. **Not committed.** Working-tree changes are intentionally uncommitted (on `main`;
   harness rule = commit only when asked). See `progress.md` for the suggested commit.

## Critical issues needing human attention

None blocking the artifact set. The **one gating action** before T-005-03 builds on
this seam is the **AC #2 live round-trip** (concern #1) — it is the only thing that
distinguishes "the envelope is right" from "the envelope needs the `--mcp-config`
fallback," and it cannot run inside `npm test`.

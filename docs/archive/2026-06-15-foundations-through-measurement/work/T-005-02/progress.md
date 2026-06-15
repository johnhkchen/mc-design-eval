# Progress — T-005-02 multimodal-render-feedback-seam

## Status: implementation complete, all unit tests green (109/109)

`npm test` → `tests 109 / pass 109 / fail 0` (was 95 before this ticket; +14 new,
all for the pure image-shaping helpers). The module imports cleanly and all five
relevant exports resolve as functions.

## Steps executed (vs. plan.md)

### Step 1 — extract `invokeClaude` core ✓
`src/sdk-binding.mjs`: lifted the spawn → stdout line-loop → terminal-result capture
→ no-result/`subtype`/re-validation error path → `extractArtifact` body out of
`requestDesignArtifact` into a private `async invokeClaude({ args, stdin, onMessage })`
returning `{ artifact, raw }`. `requestDesignArtifact` is now a thin wrapper that
builds the **identical** args (`["-p","--output-format","stream-json","--verbose"]`
+ optional `--model`) and stdin (`withSchemaInstruction(prompt)`), then delegates.
Behavior-preserving — no arg or stdin change to the text path (AC #4).

### Steps 2+3 — pure image-shaping helpers + unit tests ✓
Added (exported, grouped with `withSchemaInstruction`/`stripToJson`):
- `toImageBlock(image)` — `Buffer`/`Uint8Array`/`{data,mediaType}`/`{base64,mediaType}`
  → `{type:"image",source:{type:"base64",media_type,data}}`; default media_type
  `image/png`; throws on null / empty bytes / missing `data`&`base64`.
- `buildImageTurn(prompt, images)` — `{type:"user",message:{role:"user",content:[
  {type:"text",text:withSchemaInstruction(prompt)}, ...images.map(toImageBlock)]}}`;
  throws when `images` is missing/empty.
- `serializeStreamJsonInput(message)` — `JSON.stringify(message)+"\n"`.

Tests added to `src/sdk-binding.test.mjs` (inline PNG-magic buffers, no `render/out`
dependency): buffer round-trip, `{data,mediaType}` honoring a non-png type, `{base64}`
passthrough, empty/missing throws, user-message shape incl. the schema directive in
the text block, image count+order preservation, empty-images throw, and the
serialization single-line/newline/round-trip.

### Step 4 — live `requestDesignArtifactWithImage` ✓
Added the exported live function: same args as the text path **plus** `--input-format
stream-json`; stdin = `serializeStreamJsonInput(buildImageTurn(prompt, images))`;
`buildImageTurn` runs pre-spawn so missing/empty images throw before any metered
call; delegates to `invokeClaude`. `void options;` for parity. Updated the module
header to document the multimodal path, the unchanged per-turn token capture, and the
`--mcp-config` render-tool fallback.

## Deviations from plan

- Steps 1–4 were applied as a small set of edits to one file rather than four
  separate commits — see "Commits" below. The logical sequencing in plan.md still
  holds and each step is individually described above.

## Commits

**Not committed.** The working tree carries the change set below, left uncommitted
because (a) the harness rule is to commit only when the user asks, and (b) we are on
the default branch `main`. Ready to commit as one or more atomic commits when
requested (suggested message: `sdk-binding: multimodal claude -p seam
(requestDesignArtifactWithImage) + pure image-turn helpers`).

Changed files:
- `src/sdk-binding.mjs` — `invokeClaude` core; `toImageBlock` / `buildImageTurn` /
  `serializeStreamJsonInput`; `requestDesignArtifactWithImage`; header jsdoc.
- `src/sdk-binding.test.mjs` — +10 offline unit tests for the new helpers.
- `docs/active/work/T-005-02/*` — RDSPI artifacts.

## Remaining (out of `npm test`, see plan.md "Testing strategy")

- AC #2 live round-trip (manual, metered): feed an existing render PNG, confirm the
  model references what it saw, the artifact re-validates, and the image-bearing
  turn's `input_tokens` reflects image tokens. Fallback to `--mcp-config` if the
  stream-json envelope is rejected.

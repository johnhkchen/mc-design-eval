# Structure — T-005-02 multimodal-render-feedback-seam

The blueprint. File-level changes, the public/private interfaces, and the ordering.
No code — the shape of the code.

## Files

| File | Change | Why |
| --- | --- | --- |
| `src/sdk-binding.mjs` | **modify** | Add pure shaping helpers + the new live `requestDesignArtifactWithImage`; extract the private spawn/stream/validate core. |
| `src/sdk-binding.test.mjs` | **modify** | Add offline unit tests for the new pure helpers. |
| `docs/active/work/T-005-02/*` | **add** | RDSPI artifacts (this set). |

No changes to `trial.mjs`, `config.mjs`, `render-tool.mjs`, or any schema: the
runner already captures the per-turn usage the image rides in, and no tool/posture
changes on the primary path (design Decisions 1 & 4).

## `src/sdk-binding.mjs` — target shape

Order within the file (new items grouped with the existing pure surface, the live
function beside `requestDesignArtifact`):

### New pure helpers (exported, beside `withSchemaInstruction` / `stripToJson`)

```
export function toImageBlock(image)
```
- Input: `Buffer | Uint8Array | { data: Buffer|Uint8Array, mediaType?: string }
  | { base64: string, mediaType?: string }`.
- Output: `{ type: "image", source: { type: "base64", media_type, data } }`
  (Anthropic content-block shape; `media_type` defaults `"image/png"`).
- Rules: base64-encode raw bytes; pass through an already-base64 string; **throw**
  on null/empty bytes or an empty base64 string ("image N is empty").
- Pure. No I/O.

```
export function buildImageTurn(prompt, images)
```
- Input: the trial prompt string + a non-empty array of `images` (each a
  `toImageBlock` input).
- Output: a stream-json **user message** object:
  ```
  { type: "user",
    message: { role: "user",
      content: [ { type: "text", text: withSchemaInstruction(prompt) },
                 ...images.map(toImageBlock) ] } }
  ```
- Rules: **throw** when `images` is missing/empty (AC #1: "one or more"). Reuses
  `withSchemaInstruction` so the artifact contract is byte-identical to the text
  path (same schema directive → same `extractArtifact` re-validation).
- Pure.

```
export function serializeStreamJsonInput(message)
```
- `JSON.stringify(message) + "\n"`. One newline-delimited JSON line for the CLI's
  `--input-format stream-json`. Pure. (Named generically; one message today, but the
  format is line-per-message.)

### New private core (not exported)

```
async function invokeClaude({ args, stdin, onMessage })
```
- Extracted verbatim from the current body of `requestDesignArtifact` (spawn →
  stdout line loop calling `onMessage` → capture terminal `result` → flush →
  exit/no-result/subtype errors → `extractArtifact` → return `{ artifact, raw }`).
- Spawns `CLAUDE_CLI` with `args` (no shell), `child.stdin.end(stdin)`.
- Single source of the streaming + validation + error-message logic for BOTH live
  paths (design Decision 3).

### Existing live function (refactored to a thin wrapper, behavior-preserving)

```
export async function requestDesignArtifact({ prompt, model, options = {}, onMessage })
```
- Builds the **exact same** args as today: `["-p","--output-format","stream-json",
  "--verbose"]` + (`--model <model>` when set). `void options;` retained.
- `stdin = withSchemaInstruction(prompt)` (exactly as today, raw text;
  `--input-format` stays default `text`).
- Delegates to `invokeClaude({ args, stdin, onMessage })`.
- Public signature, args, and stdin are **unchanged** (AC #4).

### New live function

```
export async function requestDesignArtifactWithImage(
  { prompt, images, model, options = {}, onMessage } = {})
```
- `void options;` (reserved, same as the text path).
- Validates `images` non-empty up front (delegated to `buildImageTurn`, which
  throws) — fail before any spawn.
- Args: `["-p","--output-format","stream-json","--verbose",
  "--input-format","stream-json"]` + (`--model <model>` when set). The added flag is
  the ONLY arg difference from the text path.
- `stdin = serializeStreamJsonInput(buildImageTurn(prompt, images))`.
- Delegates to `invokeClaude({ args, stdin, onMessage })` → returns
  `{ artifact, raw }`, identical contract to the text path.
- LIVE + METERED, image-bearing. **Not** unit-tested (spec §4). Jsdoc states the
  manual round-trip verification (AC #2) and points at the `--mcp-config` fallback.

## `src/sdk-binding.test.mjs` — additions

New `describe`/`test` block "image input shaping (claude -p stream-json path)",
offline, building tiny inline `Buffer`s (e.g. `Buffer.from([0x89,0x50,0x4e,0x47])`,
the PNG magic — no dependency on `render/out/`):

- `toImageBlock` wraps a `Buffer` as a base64 png block (default media_type;
  base64 of the buffer round-trips back to the bytes).
- `toImageBlock` accepts `{ data, mediaType }` and honors a non-png `mediaType`.
- `toImageBlock` accepts `{ base64 }` passthrough.
- `toImageBlock` throws on empty/missing bytes.
- `buildImageTurn` returns `type:"user"`, `message.role:"user"`, `content[0]` a
  text block whose text contains the schema directive (`/Output format \(required\)/`
  and `/"title": "DesignArtifact"/`), and one image block per input in order.
- `buildImageTurn` throws on empty/missing `images`.
- `serializeStreamJsonInput` is single-line, newline-terminated, and
  `JSON.parse`-round-trips to the message.

`requestDesignArtifactWithImage` is **not** called (metered + needs a real image),
matching how `requestDesignArtifact` is already untested.

## Interface summary (module's new public surface)

| Symbol | Kind | Tested by `npm test` |
| --- | --- | --- |
| `toImageBlock` | pure | yes |
| `buildImageTurn` | pure | yes |
| `serializeStreamJsonInput` | pure | yes |
| `requestDesignArtifactWithImage` | live/metered | no (documented round-trip) |
| `invokeClaude` | private | indirectly (via existing text-path docs) |

## Ordering of changes

1. Extract `invokeClaude`; reduce `requestDesignArtifact` to a wrapper. Run tests —
   must stay green with zero behavior change (the text path is exercised only
   structurally, but the refactor is mechanical).
2. Add the three pure helpers. Add their unit tests. Run tests.
3. Add `requestDesignArtifactWithImage`. Update the module header jsdoc to describe
   the multimodal path + fallback. Run tests (live fn untested).
4. Commit per step (atomic).

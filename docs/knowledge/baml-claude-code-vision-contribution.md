# BAML `ClaudeCodeClient` and image input: contribution brief

Status: research only. Nothing was posted, opened or built. Everything below was read from a shallow
clone of `BoundaryML/baml` at `canary` commit `99edb5d249850ed92db987148feb78f551a93250`
(2026-10-10). Claims I did not verify are marked **(guess)** or **(untested)**.
Line numbers refer to that SHA. Permalink base:
`https://github.com/BoundaryML/baml/blob/99edb5d249850ed92db987148feb78f551a93250/`

Short form: `S = baml_language/crates/baml_builtins2/baml_std` (all permalinks are `<base>/<path>#Lx-Ly`).

## 0. Read first: their contribution rules

`CONTRIBUTING.md` says robot-generated drive-by PRs "will be rejected", and asks contributors to
introduce themselves in Discord `#contributing` and engage on the issue or PR. So the order is:
talk to the maintainers (Discord or an issue) before sending code. This brief is the prep for that.

## 1. The gap

`ClaudeCodeClient.invoke` flattens the whole prompt to one string and passes it as the last argv
element. Media is lost in two places:

1. Instruction text: `input.prompt(...).text()` renders media as a placeholder such as
   `[image::base64(iVBOR...uQmCC, len=2406244)]` (`S/claude_code/ns_internal/cli.baml#L255`).
2. Journal text: `transcript_text` uses `u.text()` for `UserMessage` and `done.text()` for
   `ToolCompleted`; `content.text()` turns each `Media` block into `[image]` (`cli.baml#L13`, `#L34`;
   `S/ai/ns_content/content.baml#L98-L113`).

The model answers without the image, and a `--json-schema` forces a plausible fake answer.

Minimal repro (syntax copied from the in-repo `AnthMockVision` test fixture,
`baml_tests/baml_src/ns_llm_anthropic/anthropic_client.baml#L115`; **(untested)** as written):

```baml
function Look(picture: image) -> string {
    client: "claude-code/haiku"
    prompt: `
      ${role("user")}
      Reply with the dominant color of ${picture}
    `
}
test "sees" {
    // any real PNG; a 1x1 red pixel makes the failure obvious
    let img = baml.media.Image.from_file("red.png");
    assert.contains(Look(img).to_lower_case(), "red")   // fails today: model never sees the pixels
}
```

Why the user-land workaround works (`/Volumes/ext1/swe/repos/minecraft-design/baml_src/eyes.baml`,
`ClaudeEyes`): it walks `prompt.messages()` -> `parts`, emits Anthropic content blocks, and sends ONE
stream-json user message on stdin to `claude -p --input-format stream-json --output-format stream-json
--verbose --json-schema <schema>`, then reads the `"type":"result"` line. It ignores the journal,
roles, tools, MCP, cache delimiters and non-image media. The upstream change is "do that, but inside
the existing client and without losing what it already does".

## 2. Read these files, in this order

| # | File and lines | Why it matters |
|---|---|---|
| 1 | `/Volumes/ext1/swe/repos/minecraft-design/baml_src/eyes.baml` | The working proof; the target behavior in ~100 lines. |
| 2 | [`S/claude_code/cli.baml#L4-L67`](https://github.com/BoundaryML/baml/blob/99edb5d249850ed92db987148feb78f551a93250/baml_language/crates/baml_builtins2/baml_std/claude_code/cli.baml#L4-L67) | The class, `new` defaults, `render` (throws `PreviewUnsupported`), `invoke` (delegates to `internal.invoke`). Note `capture_wire` is declared INERT (#L15-L18). |
| 3 | [`S/claude_code/ns_internal/cli.baml#L249-L418`](https://github.com/BoundaryML/baml/blob/99edb5d249850ed92db987148feb78f551a93250/baml_language/crates/baml_builtins2/baml_std/claude_code/ns_internal/cli.baml#L249-L418) | `invoke`: the single place where prompt text, schema, argv, process start and result parsing meet. Text at #L255 and #L262-L266; argv #L271-L297; `start_process` #L299-L303; stdin close #L316-L318; result parse #L365-L416. |
| 4 | [`.../ns_internal/cli.baml#L6-L49`](https://github.com/BoundaryML/baml/blob/99edb5d249850ed92db987148feb78f551a93250/baml_language/crates/baml_builtins2/baml_std/claude_code/ns_internal/cli.baml#L6-L49) | `transcript_text`: the journal fold (second place media dies). |
| 5 | [`.../ns_internal/cli.baml#L54-L131`](https://github.com/BoundaryML/baml/blob/99edb5d249850ed92db987148feb78f551a93250/baml_language/crates/baml_builtins2/baml_std/claude_code/ns_internal/cli.baml#L54-L131) | `envelope_schema` and `tool_protocol`: how BAML tools ride a `{outcome: ...}` envelope. Does not change, but it constrains the design (section 4.4). |
| 6 | [`.../ns_internal/cli.baml#L135-L223`](https://github.com/BoundaryML/baml/blob/99edb5d249850ed92db987148feb78f551a93250/baml_language/crates/baml_builtins2/baml_std/claude_code/ns_internal/cli.baml#L135-L223) | `_read_result` and `_log_cc_event`: the stream reader. Already tolerates `image` block types in logged events (#L213). |
| 7 | [`S/ai/spec.baml#L27-L103`](https://github.com/BoundaryML/baml/blob/99edb5d249850ed92db987148feb78f551a93250/baml_language/crates/baml_builtins2/baml_std/ai/spec.baml#L27-L103) | `MediaPart = Image\|Audio\|Video\|Pdf`, `CacheDelimiter`, `PromptPart = string\|MediaPart\|CacheDelimiter`, `PromptMessage{role,content,parts,metadata}`, `Prompt.text()/messages()`. The comment at #L70-L71 says provider clients are meant to use `parts`. |
| 8 | [`S/anthropic/ns_internal/messages.baml#L301-L478`](https://github.com/BoundaryML/baml/blob/99edb5d249850ed92db987148feb78f551a93250/baml_language/crates/baml_builtins2/baml_std/anthropic/ns_internal/messages.baml#L301-L478) | The HTTP lowering to copy: `_anth_supported_image_mime` (#L311), `_media_block` (#L316-L344), `_lower_block` position/modality table (#L346-L395), `_prompt_blocks` (#L416-L446), `_lower_prompt` (#L448-L478). |
| 9 | [`.../anthropic/ns_internal/messages.baml#L480-L600`](https://github.com/BoundaryML/baml/blob/99edb5d249850ed92db987148feb78f551a93250/baml_language/crates/baml_builtins2/baml_std/anthropic/ns_internal/messages.baml#L480-L600) | `_lower_journal`: how the HTTP client turns `UserMessage` / `ToolCompleted` (with media) into wire blocks; the model for the journal path. |
| 10 | [`S/ai/ns_wire/wire.baml#L246-L329`](https://github.com/BoundaryML/baml/blob/99edb5d249850ed92db987148feb78f551a93250/baml_language/crates/baml_builtins2/baml_std/ai/ns_wire/wire.baml#L246-L329) and [`#L479`](https://github.com/BoundaryML/baml/blob/99edb5d249850ed92db987148feb78f551a93250/baml_language/crates/baml_builtins2/baml_std/ai/ns_wire/wire.baml#L479) | The shared, public helpers: `ai.wire.resolve_media(media, fetch_url)` -> `{url?, base64?, mime_type}` for all four media kinds; `ai.wire.prompt_parts(message, default_cache_args)` (trims text around cache delimiters). |
| 11 | [`S/ai/ns_internal/media_resolve.baml#L5-L80`](https://github.com/BoundaryML/baml/blob/99edb5d249850ed92db987148feb78f551a93250/baml_language/crates/baml_builtins2/baml_std/ai/ns_internal/media_resolve.baml#L5-L80) | URL / `data:` / base64 resolution. `fetch_url=true` downloads with a 30 s deadline and returns base64 (typed `NetworkFailure` on failure). |
| 12 | [`S/ai/ns_events/events.baml#L13-L74`](https://github.com/BoundaryML/baml/blob/99edb5d249850ed92db987148feb78f551a93250/baml_language/crates/baml_builtins2/baml_std/ai/ns_events/events.baml#L13-L74) | `UserMessage.content` and `ToolCompleted.content` are `Block[]` (Text or Media), not strings. Added by #4807. |
| 13 | [`S/baml/ns_sys/sys.baml#L1-L14`](https://github.com/BoundaryML/baml/blob/99edb5d249850ed92db987148feb78f551a93250/baml_language/crates/baml_builtins2/baml_std/baml/ns_sys/sys.baml#L1-L14), [`#L195-L208`](https://github.com/BoundaryML/baml/blob/99edb5d249850ed92db987148feb78f551a93250/baml_language/crates/baml_builtins2/baml_std/baml/ns_sys/sys.baml#L195-L208) | `ProcessOptions.stdin` ("`start_process` writes it and then closes the pipe") and `start_process`. This is the stdin delivery mechanism. |
| 14 | [`S/claude_code/baml.toml`](https://github.com/BoundaryML/baml/blob/99edb5d249850ed92db987148feb78f551a93250/baml_language/crates/baml_builtins2/baml_std/claude_code/baml.toml) | Package deps are only `baml`, `log`, `ai`. It does NOT depend on `anthropic`, so the Anthropic helpers in item 8 are not reachable without adding a dependency or hoisting them into `ai.wire`. |

## 3. Where the code is embedded, and the tests

- Builtins are plain `.baml` files embedded with `include_str!` via the `builtin!` macro
  (`baml_builtins2/src/lib.rs#L71-L79`); the claude_code entries are at `#L268-L269` and the package
  manifest at `#L121`. No build.rs step: edit the `.baml`, rebuild the crate. A new std file would need
  a new `builtin!(...)` line; editing the two existing files does not.
- The `"claude-code/<model>"` string shorthand maps to `ClaudeCodeClient.new(model = model)` in
  `baml_compiler2_ast/src/lower_cst.rs#L885`.
- Existing tests touching the client:
  - `baml_tests/tests/shell.rs#L442-L507` `claude_code_client_preserves_process_wait_timeout` (Rust,
    unix-only): writes a fake `claude` shell script into a tempdir, passes it as `executable`, and
    calls `cl.invoke(...)` from BAML via the `baml_test!` macro. This is the template for a no-network
    test. It builds the `ModelTurnInput` from a spec (`Spec@spec()`, `spec.prompt_template`,
    `ai.Journal.new(spec)`).
  - `baml_tests/baml_src/ns_llm_on_event/llm_on_event.baml#L159-L172` `claude_code_transcript_with_media`
    asserts the CURRENT `[image]` placeholder text from `claude_code.internal.transcript_text`
    (fixture `media_journal` at `ns_llm_mock/mock_provider.baml#L545-L561`, `media_png` at `#L589`).
    `#L174-L215` cover `tool_protocol` and tool-call escaping.
  - Snapshot mentions of `claude-code`/`ClaudeCodeClient.new` exist only as the client-shorthand table
    in `snapshots/baml_src/ns_fixtures/ns_llm_quoted_prompt/mir.snap` (#L162, #L325, #L795) and
    `.../ns_optional_function_parameters/hir.snap` (#L23). They would change only if the
    `ClaudeCodeClient.new` parameter list or fields change (mir.snap prints its 8 argument slots).
    No snapshot contains the body of `invoke`. Per `TEST_INSTRUCTIONS.md`, IR goldens are opt-in, so a
    body-only change should touch no `.snap`.

## 4. Proposed change

### 4.1 Shape

Keep the existing text/argv path byte-for-byte when the prompt and journal contain no media. Add a
second path used only when any media is present. This bounds the blast radius (the stream-json input
mode may differ from print mode in ways I did not test, e.g. hooks or session handling **(guess)**).

```baml
// ns_internal/cli.baml (sketch, not compiled)
function has_media(prompt: ai.Prompt, j: ai.Journal) -> bool { ... }   // scan parts + UserMessage/ToolCompleted blocks

function media_block(m: ai.MediaPart) -> json {                          // throws ai.errors.InvalidRequest
    match (m) {
        let img: baml.media.Image => {
            let r = ai.wire.resolve_media(m, true);                      // true: fetch http(s) URLs -> base64
            if (!supported_image_mime(r.mime_type)) { throw reject(`...${r.mime_type}...`) }
            { "type": "image", "source": { "type": "base64", "media_type": r.mime_type, "data": r.base64 ?? "" } }
        },
        let pdf: baml.media.Pdf => { ...same with "type": "document" ... },   // see 4.3
        let a: baml.media.Audio => throw reject("claude-code: audio input is not supported"),
        let v: baml.media.Video => throw reject("claude-code: video input is not supported"),
    }
}

function prompt_blocks(prompt: ai.Prompt) -> json[]   // per message: header text? + text parts + media_block; skip CacheDelimiter
function journal_blocks(j: ai.Journal) -> json[]      // same labels as transcript_text, but UserMessage.content / ToolCompleted.content keep Media blocks

// in invoke, when has_media(...):
let content = prompt_blocks(prompt) ++ [text(tail)] ++ journal_blocks(j) ++ [text(tool_protocol)];
let line = baml.json.stringify({ "type": "user", "message": { "role": "user", "content": content } }) + "\n";
args = ["-p", "--input-format", "stream-json", "--output-format", "stream-json", "--verbose", ...same flags..., "--json-schema", schema]; // NO trailing prompt arg
start_process(c.executable, args, ProcessOptions { ..., stdin: line })
```

The stream-json message shape is exactly what `eyes.baml` sends and what works live:
`{"type":"user","message":{"role":"user","content":[{"type":"text","text":...},{"type":"image","source":{"type":"base64","media_type":"image/png","data":"..."}}]}}\n`, then EOF.

### 4.2 What stays the same

`--model`, `--permission-mode`, `--no-session-persistence`, `--tools`, MCP flags, `--json-schema`
(`envelope_schema` when the toolbox is non-empty), `_read_result`, usage and `outcome` parsing. Only the
prompt transport (argv string -> stdin JSON) and the two text builders change. Note the stock code
already calls `p.stdin.close()` (#L316-L318); with `ProcessOptions.stdin` set that close is redundant
but harmless **(guess)**.

### 4.3 Non-image media: reject, do not degrade

Recommendation: throw `ai.errors.InvalidRequest` (fields `provider, status_code, detail, raw_body`, as
used at `cli.baml#L344-L349`) for audio and video, mirroring the Anthropic client, which rejects them
with `_reject` and has the same modality table in a comment (`messages.baml#L346-L358`). Silent
degradation to a placeholder is the exact bug being fixed, so degrading would repeat it.
PDF: lower to `{"type":"document","source":{"type":"base64","media_type":"application/pdf","data":...}}`
as the HTTP client does. Whether `claude -p` stream-json input accepts `document` blocks is **untested**;
either test it live or reject PDF in v1 and say so in the error.
Image mime: the Messages API accepts only jpeg/png/gif/webp on base64 sources; the HTTP client checks
this client-side (#L311-L343) because `infer_mime_type` can produce `image/svg+xml` or a wrong guess.
Copy the check.

### 4.4 Journal and tool-protocol path

`transcript_text` is called whenever the journal has entries, which happens on the 2nd+ turn of an
agent run with BAML tools (the toolbox is non-empty; `invoke` appends `tool_protocol`, #L262-L264).
Media can enter the journal as `UserMessage` blocks or inside `ToolCompleted.content` (a tool that
returns a screenshot). Plan: factor `transcript_text` into a block-producing core
(`transcript_blocks`) where text lines stay identical and `Media` blocks are emitted as real image blocks
at the position the placeholder occupied; keep `transcript_text` as a thin text wrapper so the existing
`[image]` tests and the text-only path are unchanged. Everything remains folded into ONE user message
(the current design: "the conversation folds into it; the CLI's own session state is unused", #L4-L5).
Open point: image blocks inside a single user message under a "tool result id=... :" label are not
`tool_result` blocks; I expect the model to read them fine **(guess)**. True multi-turn
(assistant/tool_result messages replayed over stream-json input) would be a larger change; whether the
CLI accepts non-user messages on stdin is **untested**.

### 4.5 Roles and cache delimiters

`Prompt.text()` emits role headers; the content-block path must decide what to do per message. Simplest
faithful option: emit the same header line as a text block before each message's blocks (I did not read
the Rust `text()` implementation, so the exact header format is **unknown**; check it before matching).
Drop `CacheDelimiter` parts (the CLI manages its own caching); use `ai.wire.prompt_parts(message)` so
text adjacent to a delimiter is trimmed consistently with other clients. Skip empty text blocks (the API
rejects them; `eyes.baml` does the same with `s.length() > 0`). `ClaudeEyes` flattens roles with no
headers, which is a behavior difference from the stock client that the PR should not introduce
silently.

### 4.6 `render()` preview

Keep `PreviewUnsupported` (the client has no `baml.http.Request`). Optional nicety, not required:
nothing in the API exposes the planned stdin payload without a new method; skip it. Do not fabricate a
`baml.http.Request`; the class comment (#L15-L18) says this client never fabricates wire records.

### 4.7 Shared helper or local copy?

`claude_code` cannot call `anthropic.internal._media_block` (not a declared dependency, and
underscore-private by convention **(guess: I did not find a compiler-enforced rule)**). Options:
(a) local ~40 lines in `claude_code/ns_internal` (smallest diff, duplicates the mime check);
(b) hoist an "Anthropic content block from MediaPart" function into `ai.wire` (public, both clients use
it; touches the Anthropic client, which raises review cost). I recommend (a) for the first PR and
raising (b) as a question.

## 5. Claude CLI side, trade-offs

- Stdin vs argv: `getconf ARG_MAX` here is 1048576 (macOS). The repro image is 2.4 MB of base64, so
  it cannot be an argv element at all. On Linux a single argv string is capped far lower (128 KiB,
  `MAX_ARG_STRLEN`, from general knowledge, not checked here). Stdin is the only way to send inline
  images; `ProcessOptions.stdin` supports it.
- `claude --help` (2.1.293 here) documents `--input-format stream-json` ("realtime streaming input")
  and `--replay-user-messages`; it requires `-p`, and `--output-format stream-json` for the latter.
  That image blocks work in a user message is proven by `ClaudeEyes`, not by documentation I read.
- Deadlock risk (**guess**): `start_process` writes the whole stdin and "waits for the child to consume
  it" before returning (`sys.baml#L195-L201`). Fine as long as the CLI reads stdin before emitting
  large output, which `claude -p` seems to do. Test with a multi-MB payload.
- URL images: `resolve_media(m, true)` downloads and inlines base64 (30 s cap, typed errors). The
  alternative, passing `{"type":"url"}` sources through, is **untested** against the CLI. Fetching is the
  safe default; passing through saves bandwidth.
- File-path images (`Image.from_file` already loads base64 in memory, so this mostly does not arise).
  The other route, "write temp file, enable `Read`, tell the model the path", changes `--tools`,
  permissions and cwd, and the model may decline to read it. Not recommended.
- Cost/latency: images go through the CLI's normal vision path and count as input tokens; nothing to do
  client-side.

## 6. Tests to add

1. BAML-level (preferred by `TEST_INSTRUCTIONS.md`: default to a `test` block in
   `baml_tests/baml_src/ns_<topic>/`): pure-function tests for the block builders, in
   `ns_llm_on_event/llm_on_event.baml` next to the existing claude_code tests. Build a prompt with a
   spec taking `image` (pattern: `AnthMockVision@spec(picture).prompt()`), call
   `claude_code.internal.prompt_blocks(...)`, assert block order, the base64 source, the supported-mime
   rejection (svg), and audio/video -> `InvalidRequest`. Add a `media_journal`-based test for
   `transcript_blocks` (fixture exists).
2. Keep `claude_code_transcript_with_media` unchanged (placeholder text stays, since the text path is
   untouched).
3. Rust, model on `shell.rs#L442-L507`: fake `claude` script that records its inputs, e.g.
   `#!/bin/sh` then `printf '%s\n' "$@" > "$0.argv"; cat > "$0.stdin"; printf '%s\n'
   '{"type":"result","structured_output":"ok","usage":{"input_tokens":1,"output_tokens":1}}'`.
   Assert: (a) with an image, argv contains `--input-format` and `stream-json` and NO prompt string,
   and `$0.stdin` parses as one JSON line with an `image` block whose `data` equals the input;
   (b) text-only prompt keeps the old argv shape (prompt as last arg, no `--input-format`) and empty
   stdin; (c) a >1 MB image still works (guards the argv regression). Unix-only (`#[cfg(unix)]`), like
   the existing one. Use `output_type` string so `structured_output: "ok"` suffices.
4. Snapshots: none expected unless `ClaudeCodeClient.new` gains a parameter (then
   `ns_llm_quoted_prompt/mir.snap` and possibly `hir.snap` change). Accept with
   `cargo insta test --test-runner=nextest --dnd --accept -p baml_tests -- corpus_` (command from
   `baml_tests/README.md`). I recommend adding no parameter.
5. A live smoke (not CI): the repro in section 1 against a real `claude`.

## 7. Open design questions for the maintainers

1. Fast path only when media is present (my proposal), or always stream-json input? The latter is
   simpler but changes every existing user's process invocation.
2. Hoist the Anthropic block lowering into `ai.wire`, or duplicate it in `claude_code`?
3. Roles: emit text headers like `Prompt.text()` does, or map `system` messages to
   `--append-system-prompt`/`--system-prompt` (**flag existence not checked here**)?
4. Journal media inside a folded single message, versus true multi-turn replay?
5. PDF in v1 or reject? URL images fetched or passed through?
6. Open PR #5121 ("Redesign process APIs with explicit subprocess lifetimes") may change
   `start_process`/`ProcessOptions.stdin`; should this wait for it or be written against the new API?
7. Should media rejection be `InvalidRequest` (mirrors Anthropic) or a new error?

## 8. Build and try it locally

From `README-DEV.md` and `TEST_INSTRUCTIONS.md` (I did not run any of this):

```bash
./scripts/setup-dev.sh                      # mise + pinned Rust toolchain (rust-toolchain.toml)
cd baml_language
cargo build -p baml_cli                     # produces target/debug/baml-cli (bin name from crates/baml_cli/Cargo.toml)
baml toolchain use "$PWD/target/debug/baml-cli"   # or: BAML_VERSION=$PWD/target/debug/baml-cli baml check
target/debug/baml-cli test --from crates/baml_tests/baml_src -i "claude_code"   # BAML corpus tests
cargo test -p baml_tests --test shell claude_code                                # Rust test (guess at exact filter)
cargo fmt -- --config imports_granularity="Crate" --config group_imports="StdExternalCrate"
cargo test --lib --workspace --exclude 'sdk_test_*'                              # full lib suite before a PR
```

Because std `.baml` is `include_str!`-embedded, every edit needs `cargo build -p baml_cli` again.
`baml toolchain use <path>` is documented in `baml toolchain --help` (local toolchains section);
`baml toolchain use nightly` (or the previous pinned one) switches back. Our repro project is
`/Volumes/ext1/swe/repos/minecraft-design/baml_src/` (swap `ClaudeEyes` for the stock client to see
the gap, then for the patched build to see the fix).

## 9. Existing issues and PRs (read-only `gh` searches, 2026-10-10)

- Issue #2673 (open, Oct 2025) "[feat] allow using claude code as a client<llm>": the request that led
  to this client; discussion is about `claude -p --output-format json`; no mention of images.
  Issue #2229 (closed) "[feat] Claude Code support": earlier version, no content.
- No open or closed issue or PR matched `claude_code image`, `claude-code vision`, `ClaudeCodeClient`
  with media, or `stream-json` input for the client (searches: "claude_code image", "ClaudeCodeClient",
  "claude-code vision", "claude code client media", "claude code", "image input CLI client",
  "stream-json"). Absence of a hit is not proof; search Discord too.
- History of the client directory (via `gh api commits?path=`): #4352 (initial builtin providers),
  #4430 (native clients), #4807 (`ai.events` content-block vocabulary: why `UserMessage`/`ToolCompleted`
  carry `Block[]`), #5116 (error taxonomy), #5151 (JSON literals). Read #4807 before the journal change.
- PR #5121 (open): process API redesign (`baml.sys.run`/`shell`/`subprocess`, `input` accepts text or
  bytes, capture options). Directly relevant to how stdin is passed; check merge order.
- `typescript2/app-feedback/src/lib/mock-data.ts#L287` mentions `ClaudeCodeClient` in a `GH-4377`
  entry about `timeout_ms`; it sits in a mock-data file with `version: "0.16.2"` and appears to be
  fixture data for the feedback app, not a real issue. The `claude_code_client_preserves_process_wait_timeout`
  test at `shell.rs#L442` is the related real regression test.

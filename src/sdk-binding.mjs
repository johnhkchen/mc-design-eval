// Model-invocation binding for the experiment harness (T-001-03).
//
// The SINGLE live, metered seam (spec §4). It runs one trial: send the prompt,
// constrain the model to the design-artifact schema (T-001-01), and return the
// validated artifact plus the terminal result, streaming every message to a
// caller-supplied hook so the runner (T-004-01) can log the full transcript and
// per-turn token usage.
//
// DEFAULT PATH — `claude -p` shim (spec §4): trials shell out to the `claude -p`
// headless CLI authenticated by the Claude SUBSCRIPTION, not the Agent SDK over a
// metered API key. We run `--output-format stream-json --verbose`, which emits the
// same per-message stream (assistant turns carrying `message.usage`, a terminal
// `result` carrying `usage`/`total_cost_usd`/`subtype`) the runner already consumes
// — so transcript + token logging are unchanged. Schema-enforced structured output
// is NOT available on this path, so we (a) append the schema to the prompt asking
// for a bare JSON object and (b) re-validate the emitted text against the
// source-of-truth schema (the same located errors as parseArtifact).
//
// MULTIMODAL PATH (T-005-02, spec §7 archetype 3): requestDesignArtifactWithImage
// delivers a rendered WIP image plus text via `--input-format stream-json` — a
// structured user message (text + base64 image blocks) on stdin instead of raw
// text — so the model can SEE its build and revise it. It shares the exact
// spawn/stream/validate spine (invokeClaude) with the text path, so transcript +
// per-turn token logging (incl. image tokens, which ride in the turn's usage) are
// unchanged. Its message shaping is PURE and offline-tested (toImageBlock /
// buildImageTurn / serializeStreamJsonInput).
//
// The Agent SDK package remains a drop-in alternative behind this same seam (see
// designArtifactOutputFormat + SDK_PACKAGE, retained for that path). Most of this
// module is PURE (option/payload shaping, JSON extraction) and unit-tested with no
// CLI and no network; only the two request* functions spawn a process and are not
// tested (spec §4: live + metered).

import { spawn } from "node:child_process";
import { parseArtifact, toModelSchema } from "./artifact.mjs";

/** The Node Agent SDK package — the drop-in alternative path (loaded lazily there). */
export const SDK_PACKAGE = "@anthropic-ai/claude-agent-sdk";

/** The Claude headless CLI binary; overridable for tests / non-standard installs. */
export const CLAUDE_CLI = process.env.CLAUDE_CLI || "claude";

/**
 * The structured-output option for the Agent SDK alternative path: spread into
 * `query({ options })` to platform-enforce the schema. Unused by the default
 * `claude -p` path (the CLI cannot enforce it), but kept as the binding for the SDK
 * path and exercised by the unit suite. Its schema is the model-facing projection
 * (discriminator/meta stripped — see toModelSchema).
 * @returns {{ type: "json_schema", schema: object }}
 */
export function designArtifactOutputFormat() {
  return { type: "json_schema", schema: toModelSchema() };
}

/**
 * Wrap a trial prompt with the output-format scaffolding the `claude -p` path needs:
 * a JSON-only directive plus the model-facing schema, since the CLI cannot enforce
 * structured output. PURE. The archetype's own (versioned) prompt is left untouched
 * — the schema instruction is a property of the invocation path, not the archetype,
 * exactly mirroring what `outputFormat` does for the SDK path.
 * @param {string} prompt
 * @returns {string}
 */
export function withSchemaInstruction(prompt) {
  const schema = JSON.stringify(toModelSchema(), null, 2);
  return [
    prompt,
    "",
    "## Output format (required)",
    "Respond with ONLY a single JSON object conforming to the JSON Schema below.",
    "No prose, no explanation, and no Markdown code fences — output the JSON object alone.",
    "",
    schema,
  ].join("\n");
}

/**
 * Reduce a model text response to the bare JSON object: strip a surrounding
 * Markdown code fence, then, if prose still brackets it, slice the outermost
 * `{ … }`. PURE; a no-op on already-clean JSON. Defends the `claude -p` path, where
 * output is not schema-enforced and the model may wrap or annotate the object.
 * @param {string} text
 * @returns {string}
 */
export function stripToJson(text) {
  let s = String(text).trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  if (!s.startsWith("{")) {
    const first = s.indexOf("{");
    const last = s.lastIndexOf("}");
    if (first >= 0 && last > first) s = s.slice(first, last + 1);
  }
  return s;
}

/**
 * Pull the structured payload out of a terminal result message. Prefers the SDK's
 * validated `structured_output` (SDK path); otherwise takes the free-form `result`
 * text (the `claude -p` path) and reduces it to JSON via stripToJson.
 * @param {Record<string, *>} result
 * @returns {string | object}
 */
function payloadOf(result) {
  if (result && result.structured_output !== undefined) return result.structured_output;
  if (result && typeof result.result === "string") return stripToJson(result.result);
  throw new Error(
    "no structured payload on result (expected `structured_output` or a `result` string)",
  );
}

/**
 * Extract and re-validate an artifact from a terminal result message against the
 * source-of-truth schema, so any logged artifact is guaranteed conformant and any
 * failure carries the same located, actionable errors as parseArtifact.
 * @param {Record<string, *>} result
 * @returns {import("./artifact.mjs").ParseResult}
 */
export function extractArtifact(result) {
  return parseArtifact(payloadOf(result));
}

/**
 * Build an Anthropic image content block from one image. PURE; no I/O. Accepts a
 * `Buffer`/`Uint8Array` of raw bytes (base64-encoded here), or an object carrying
 * already-loaded bytes (`{ data, mediaType }`) or base64 (`{ base64, mediaType }`).
 * `media_type` defaults to "image/png" (the render harness emits PNG). Throws on
 * empty/missing bytes so a malformed image fails BEFORE a metered call.
 * @param {Buffer | Uint8Array | { data: Buffer|Uint8Array, mediaType?: string } | { base64: string, mediaType?: string }} image
 * @returns {{ type: "image", source: { type: "base64", media_type: string, data: string } }}
 */
export function toImageBlock(image) {
  if (image == null) throw new Error("toImageBlock: image is null/undefined");
  let mediaType = "image/png";
  let data;
  if (Buffer.isBuffer(image) || image instanceof Uint8Array) {
    data = Buffer.from(image).toString("base64");
  } else if (typeof image === "object") {
    if (image.mediaType) mediaType = image.mediaType;
    if (typeof image.base64 === "string") {
      data = image.base64;
    } else if (image.data != null && (Buffer.isBuffer(image.data) || image.data instanceof Uint8Array)) {
      data = Buffer.from(image.data).toString("base64");
    } else {
      throw new Error("toImageBlock: expected `data` (Buffer) or `base64` (string)");
    }
  } else {
    throw new Error("toImageBlock: expected a Buffer or { data } / { base64 } object");
  }
  if (!data) throw new Error("toImageBlock: image is empty");
  return { type: "image", source: { type: "base64", media_type: mediaType, data } };
}

/**
 * Shape the stream-json USER MESSAGE that delivers a rendered WIP image plus text to
 * the model on the `claude -p --input-format stream-json` path (spec §7 multimodal).
 * PURE. The text block reuses `withSchemaInstruction` so the artifact contract is
 * IDENTICAL to the text path — the revision turn must still emit a bare schema-valid
 * object, re-validated by the same `extractArtifact`. Throws when no image is given
 * (AC #1: "one or more").
 * @param {string} prompt
 * @param {Array<Parameters<typeof toImageBlock>[0]>} images  one or more images
 * @returns {{ type: "user", message: { role: "user", content: object[] } }}
 */
export function buildImageTurn(prompt, images) {
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error("buildImageTurn: at least one image is required");
  }
  const content = [
    { type: "text", text: withSchemaInstruction(prompt) },
    ...images.map(toImageBlock),
  ];
  return { type: "user", message: { role: "user", content } };
}

/**
 * Serialize one stream-json input message to the newline-delimited line the CLI
 * reads on `--input-format stream-json` (one JSON object per line, then EOF). PURE.
 * @param {object} message
 * @returns {string}
 */
export function serializeStreamJsonInput(message) {
  return JSON.stringify(message) + "\n";
}

/**
 * The shared spawn → stream → validate spine for BOTH live `claude -p` paths
 * (text-only and image). Spawns the CLI (no shell) with `args`, writes `stdin` and
 * closes it, parses the stream-json message stream (calling onMessage per message in
 * order, before any throw), captures the terminal `result`, and re-validates its
 * payload against the source-of-truth schema. Private — the public wrappers differ
 * only in the `args` and `stdin` they pass.
 * @param {{ args: string[], stdin: string, onMessage?: (m: object) => void }} params
 * @returns {Promise<{ artifact: import("./artifact.mjs").DesignArtifact, raw: object }>}
 */
async function invokeClaude({ args, stdin, onMessage }) {
  const child = spawn(CLAUDE_CLI, args, { stdio: ["pipe", "pipe", "pipe"] });
  child.stdin.end(stdin);

  let result = null;
  let buf = "";
  let stderr = "";
  const handleLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let msg;
    try {
      msg = JSON.parse(trimmed);
    } catch {
      return; // ignore any non-JSON noise on the stream
    }
    if (typeof onMessage === "function") onMessage(msg);
    if (msg.type === "result") result = msg;
  };

  child.stdout.on("data", (chunk) => {
    buf += chunk.toString();
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      handleLine(buf.slice(0, idx));
      buf = buf.slice(idx + 1);
    }
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const exitCode = await new Promise((resolve, reject) => {
    child.on("error", (err) =>
      reject(
        new Error(
          `failed to launch \`${CLAUDE_CLI} -p\` (${err.message}) — ` +
            "is the Claude CLI installed and on PATH and logged in?",
        ),
      ),
    );
    child.on("close", (code) => resolve(code));
  });
  if (buf.trim()) handleLine(buf); // flush a final unterminated line

  if (result === null) {
    throw new Error(
      `\`${CLAUDE_CLI} -p\` produced no result message (exit ${exitCode})` +
        (stderr.trim() ? `:\n${stderr.trim()}` : ""),
    );
  }
  if (result.subtype !== "success") {
    throw new Error(
      `\`claude -p\` ended without a valid artifact (subtype: ${result.subtype})` +
        (result.errors?.length ? `:\n${result.errors.join("\n")}` : ""),
    );
  }

  const parsed = extractArtifact(result);
  if (!parsed.ok) {
    throw new Error(
      `model output failed re-validation (${parsed.code}):\n${parsed.errors.join("\n")}`,
    );
  }
  return { artifact: parsed.artifact, raw: result };
}

/**
 * Run one live trial via the `claude -p` subscription shim and return the validated
 * artifact. LIVE and METERED (subscription credits — see file header / spec §4).
 * Not unit-tested. Feeds the schema-scaffolded prompt to the CLI as raw text on
 * stdin (default `--input-format text`) and re-validates the terminal result.
 *
 * @param {Object} params
 * @param {string} params.prompt   the trial prompt (archetype-constructed)
 * @param {string} [params.model]  pinned model id (single-sourced by the harness)
 * @param {Record<string, *>} [params.options] reserved; SDK-shaped options
 *   (mcpServers/outputFormat) do not translate to the CLI — multimodal tool wiring
 *   arrives later via `--mcp-config`. Single-shot needs no tools.
 * @param {(message: object) => void} [params.onMessage] called once per stream-json
 *   message in order, before any throw, so the runner can capture the transcript
 *   and per-turn usage. Must not mutate the message.
 * @returns {Promise<{ artifact: import("./artifact.mjs").DesignArtifact, raw: object }>}
 */
export async function requestDesignArtifact({ prompt, model, options = {}, onMessage, retries = 2 } = {}) {
  void options; // reserved (see jsdoc); single-shot runs tool-free on the CLI path
  const args = ["-p", "--output-format", "stream-json", "--verbose"];
  if (model) args.push("--model", model);

  // Heavy prompts sometimes make the model narrate ("Done. The ...") instead of emitting only
  // the JSON. Retry once with a stern corrective rather than failing the whole (metered) run.
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const stdin = withSchemaInstruction(
      attempt === 0
        ? prompt
        : prompt +
            "\n\nIMPORTANT: your previous reply was NOT a valid JSON artifact (it began with prose). " +
            "Output ONLY the single JSON object — no prose, no 'Done', no explanation, no code fences.",
    );
    try {
      return await invokeClaude({ args, stdin, onMessage });
    } catch (e) {
      lastErr = e;
      if (!/re-validation|invalid_json|no structured payload|valid artifact/i.test(e.message)) throw e;
    }
  }
  throw lastErr;
}

/**
 * Run one live MULTIMODAL trial via the `claude -p` shim: deliver a prompt PLUS one
 * or more rendered WIP images to the model and return the validated artifact (spec
 * §7 archetype 3). LIVE and METERED, image-bearing. Not unit-tested (spec §4; needs
 * real image bytes) — its message/content shaping is the PURE, offline-tested
 * `buildImageTurn`/`toImageBlock`/`serializeStreamJsonInput`.
 *
 * Identical to `requestDesignArtifact` except it adds `--input-format stream-json`
 * and writes a structured user message (text + base64 image blocks) on stdin instead
 * of raw text. The image rides inside that turn's `message.usage.input_tokens`, so
 * the runner's `tallyUsage` captures per-turn usage incl. image tokens unchanged
 * (AC #3); every message is still streamed to `onMessage`.
 *
 * AC #2 (the model demonstrably SEES the image) is verified by a documented live
 * round-trip, not `npm test`. If the CLI ever rejects this stream-json envelope, the
 * documented fallback is to load the render MCP server via `--mcp-config` and have
 * its tool return the image as a content block (render-tool.mjs `toToolResult`).
 *
 * @param {Object} params
 * @param {string} params.prompt   the trial / revision prompt
 * @param {Array<Parameters<typeof toImageBlock>[0]>} params.images  one or more images
 * @param {string} [params.model]  pinned model id
 * @param {Record<string, *>} [params.options] reserved (parity with the text path)
 * @param {(message: object) => void} [params.onMessage] called once per message in order
 * @returns {Promise<{ artifact: import("./artifact.mjs").DesignArtifact, raw: object }>}
 */
export async function requestDesignArtifactWithImage(
  { prompt, images, model, options = {}, onMessage } = {},
) {
  void options; // reserved (see jsdoc); parity with the text path
  const turn = buildImageTurn(prompt, images); // throws on missing/empty images, pre-spawn
  const args = [
    "-p",
    "--output-format",
    "stream-json",
    "--verbose",
    "--input-format",
    "stream-json",
  ];
  if (model) args.push("--model", model);
  return invokeClaude({ args, stdin: serializeStreamJsonInput(turn), onMessage });
}

/**
 * Spawn `claude -p` (no shell), write stdin, stream the stream-json messages to
 * onMessage in order, and return the terminal result (no validation). The shared spawn
 * core for the plain-text and plain-text+image paths below. Private.
 * @param {{ args: string[], stdin: string, onMessage?: (m: object) => void }} p
 * @returns {Promise<{ result: object|null, exitCode: number, stderr: string }>}
 */
async function _runClaude({ args, stdin, onMessage }) {
  const child = spawn(CLAUDE_CLI, args, { stdio: ["pipe", "pipe", "pipe"] });
  child.stdin.end(stdin);

  let result = null;
  let buf = "";
  let stderr = "";
  const handleLine = (line) => {
    const t = line.trim();
    if (!t) return;
    let m;
    try {
      m = JSON.parse(t);
    } catch {
      return;
    }
    if (typeof onMessage === "function") onMessage(m);
    if (m.type === "result") result = m;
  };
  child.stdout.on("data", (c) => {
    buf += c.toString();
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      handleLine(buf.slice(0, i));
      buf = buf.slice(i + 1);
    }
  });
  child.stderr.on("data", (c) => {
    stderr += c.toString();
  });
  const exitCode = await new Promise((resolve, reject) => {
    child.on("error", (e) =>
      reject(new Error(`failed to launch \`${CLAUDE_CLI} -p\` (${e.message}) — is it installed/logged in?`)),
    );
    child.on("close", (c) => resolve(c));
  });
  if (buf.trim()) handleLine(buf);
  return { result, exitCode, stderr };
}

/** Turn a terminal result into its plain text, throwing on no-result / non-success. */
function textOf(result, exitCode, stderr) {
  if (result === null) {
    throw new Error(
      `\`${CLAUDE_CLI} -p\` produced no result (exit ${exitCode})` +
        (stderr.trim() ? `:\n${stderr.trim()}` : ""),
    );
  }
  if (result.subtype !== "success") {
    throw new Error(`\`claude -p\` call failed (subtype: ${result.subtype})`);
  }
  return typeof result.result === "string" ? result.result : "";
}

/**
 * Run one live `claude -p` call and return the model's PLAIN TEXT response — no schema
 * instruction, no artifact validation. For stages that precede the build, e.g. a design
 * document (lore/aesthetic/palette rationale) the build then realizes. LIVE and METERED.
 *
 * `effort` maps to the CLI's `--effort` (reasoning-effort knob — the closest tunable to
 * "temperature", which `claude -p` does not expose); `system` to `--system-prompt`.
 * @param {{ prompt: string, model?: string, effort?: string, system?: string,
 *   onMessage?: (m: object) => void }} params
 * @returns {Promise<{ text: string, raw: object }>}
 */
export async function requestText({ prompt, model, effort, system, onMessage } = {}) {
  const args = ["-p", "--output-format", "stream-json", "--verbose"];
  if (model) args.push("--model", model);
  if (effort) args.push("--effort", String(effort));
  if (system) args.push("--system-prompt", system);
  const { result, exitCode, stderr } = await _runClaude({ args, stdin: prompt, onMessage });
  return { text: textOf(result, exitCode, stderr), raw: result };
}

/**
 * Like requestText but with image input and NO schema — the model SEES the image(s) and
 * returns plain text. The basis for the LLM-as-judge (render in, rubric scores out).
 * Distinct from requestDesignArtifactWithImage, which forces the design-artifact schema.
 * @param {{ prompt: string, images: Array<Parameters<typeof toImageBlock>[0]>, model?: string,
 *   effort?: string, onMessage?: (m: object) => void }} params
 * @returns {Promise<{ text: string, raw: object }>}
 */
export async function requestTextWithImage({ prompt, images, model, effort, onMessage } = {}) {
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error("requestTextWithImage: at least one image is required");
  }
  const content = [{ type: "text", text: prompt }, ...images.map(toImageBlock)];
  const turn = { type: "user", message: { role: "user", content } };
  const args = ["-p", "--output-format", "stream-json", "--verbose", "--input-format", "stream-json"];
  if (model) args.push("--model", model);
  if (effort) args.push("--effort", String(effort));
  const { result, exitCode, stderr } = await _runClaude({
    args,
    stdin: serializeStreamJsonInput(turn),
    onMessage,
  });
  return { text: textOf(result, exitCode, stderr), raw: result };
}

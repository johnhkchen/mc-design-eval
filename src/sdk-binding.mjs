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
// The Agent SDK package remains a drop-in alternative behind this same seam (see
// designArtifactOutputFormat + SDK_PACKAGE, retained for that path). Most of this
// module is PURE (option/payload shaping, JSON extraction) and unit-tested with no
// CLI and no network; only requestDesignArtifact spawns a process and is not tested
// (spec §4: live + metered).

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
 * Run one live trial via the `claude -p` subscription shim and return the validated
 * artifact. LIVE and METERED (subscription credits — see file header / spec §4).
 * Not unit-tested. Spawns the CLI (no shell), feeds the schema-scaffolded prompt on
 * stdin, parses the stream-json message stream (calling onMessage per message in
 * order), and re-validates the terminal result's payload.
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
export async function requestDesignArtifact({ prompt, model, options = {}, onMessage } = {}) {
  void options; // reserved (see jsdoc); single-shot runs tool-free on the CLI path
  const args = ["-p", "--output-format", "stream-json", "--verbose"];
  if (model) args.push("--model", model);

  const child = spawn(CLAUDE_CLI, args, { stdio: ["pipe", "pipe", "pipe"] });
  child.stdin.end(withSchemaInstruction(prompt));

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

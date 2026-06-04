// Claude Agent SDK structured-output binding (T-001-03).
//
// Wires the design-artifact schema (T-001-01) as the Agent SDK's ENFORCED
// structured-output format (spec §4/§5): the model is constrained to emit a JSON
// object conforming to our schema, and we read it back, re-validated, as a typed
// artifact. This is the seam E-03 (the experiment harness) uses to keep per-trial
// logging clean and malformed designs out of the pipeline.
//
// Binding mechanism: the SDK's `outputFormat: { type: "json_schema", schema }`,
// fed our JSON Schema directly — so there is no second source of truth (a Zod
// re-authoring of the contract was rejected; see design.md, Decision 1).
//
// This module is mostly PURE: building the output-format option and extracting an
// artifact from a result are plain-data operations over objects, unit-testable
// with no SDK and no network. The single live, metered call (requestDesignArtifact)
// is isolated behind a dynamic import and is NOT exercised by the test suite
// (spec §4: Agent SDK usage bills at full API rates as of 2026-06-15).

import { parseArtifact, toModelSchema } from "./artifact.mjs";

/** The Node Agent SDK package (loaded lazily, only for live trials). */
export const SDK_PACKAGE = "@anthropic-ai/claude-agent-sdk";

/**
 * The structured-output option to spread into `query({ options })`. Its schema is
 * the model-facing projection of the canonical contract (discriminator/meta
 * stripped — see toModelSchema). This is the AC #1 binding, as a plain object.
 * @returns {{ type: "json_schema", schema: object }}
 */
export function designArtifactOutputFormat() {
  return { type: "json_schema", schema: toModelSchema() };
}

/**
 * Pull the structured payload out of an SDK terminal result message. Tolerant of
 * the exact field name (the SDK surfaces validated structured output on
 * `structured_output`; we fall back to the free-form `result` text) so a future
 * SDK rename is a one-line change here, not a leak into callers.
 * @param {Record<string, *>} result
 * @returns {string | object}
 */
function payloadOf(result) {
  if (result && result.structured_output !== undefined) return result.structured_output;
  if (result && typeof result.result === "string") return result.result;
  throw new Error(
    "no structured payload on SDK result (expected `structured_output` or a `result` string)",
  );
}

/**
 * Extract and re-validate an artifact from an SDK result message. The SDK already
 * enforces the schema with retries; we re-validate against the source-of-truth
 * schema (defense in depth) so any logged artifact is guaranteed conformant and
 * any failure carries the same located, actionable errors as parseArtifact.
 * @param {Record<string, *>} result an SDK terminal `result` message
 * @returns {import("./artifact.mjs").ParseResult}
 */
export function extractArtifact(result) {
  return parseArtifact(payloadOf(result));
}

/**
 * Run one live trial: constrain the model to the artifact schema and return the
 * validated artifact. LIVE and METERED — dynamically imports the SDK and calls
 * `query()`. Not unit-tested (see file header). Throws a clear error if the SDK
 * package is not installed.
 *
 * @param {Object} params
 * @param {string} params.prompt   the trial prompt
 * @param {string} [params.model]  pinned model id (single-sourced by the harness)
 * @param {Record<string, *>} [params.options] extra `query` options (mergeable)
 * @param {(message: object) => void} [params.onMessage] pure observation hook,
 *   called once per yielded SDK message in stream order, BEFORE any throw. Lets a
 *   caller (the T-004-01 trial runner) capture the full transcript and per-turn
 *   token usage without opening a second SDK seam. Must not mutate the message.
 * @returns {Promise<{ artifact: import("./artifact.mjs").DesignArtifact, raw: object }>}
 */
export async function requestDesignArtifact({ prompt, model, options = {}, onMessage } = {}) {
  let sdk;
  try {
    sdk = await import(SDK_PACKAGE);
  } catch (err) {
    throw new Error(
      `${SDK_PACKAGE} is not installed — run \`npm install ${SDK_PACKAGE}\` to run live trials (${err.message})`,
    );
  }

  const queryOptions = {
    ...options,
    ...(model ? { model } : {}),
    outputFormat: designArtifactOutputFormat(),
  };

  let result = null;
  for await (const message of sdk.query({ prompt, options: queryOptions })) {
    if (typeof onMessage === "function") onMessage(message);
    if (message.type === "result") result = message;
  }
  if (result === null) {
    throw new Error("SDK query produced no result message");
  }
  // A non-success terminal (e.g. subtype "error_max_structured_output_retries")
  // means the model could not produce a conforming artifact within the retry
  // budget — report it as the binding failure it is, not a missing-payload error.
  if (result.subtype !== "success") {
    throw new Error(
      `SDK query ended without a valid artifact (subtype: ${result.subtype})` +
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

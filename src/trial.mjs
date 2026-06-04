// Agent SDK trial runner — the E-03 experiment-harness skeleton (T-004-01).
//
// Runs ONE trial through the Claude Agent SDK package (spec §4, §11 step 5): a
// prompt and pinned model in, a validated design artifact plus a fully-logged
// transcript and per-turn token tally out, written to a per-trial store keyed by
// the §5 metadata `trial_id`. This is the harness Phase-1 prompting-method
// comparisons are built on; the §7 archetypes (multi-shot, multimodal) layer
// prompt construction on top of this runner without changing its spine.
//
// It reaches the SDK ONLY through sdk-binding.mjs (T-001-03) — never a direct SDK
// import — so there is exactly one live, metered seam in the codebase (AC #2).
//
// Split: the token tally, transcript serialization, record assembly, and the
// safe-options guard are PURE functions, unit-tested over plain objects shaped to
// the SDK's message types — no SDK, no network. The single live call (runTrial) is
// thin glue + I/O and is NOT exercised by `npm test` (spec §4: Agent SDK billing
// is metered at full API rates).

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { requestDesignArtifact } from "./sdk-binding.mjs";
import {
  PHASE1_MODEL_ID,
  SAFE_TRIAL_OPTIONS,
  FORBIDDEN_TOOLS,
} from "./config.mjs";

/**
 * @typedef {Object} TurnUsage One assistant turn's token usage (per-turn, AC #3).
 * @property {number} index                       0-based position among assistant turns
 * @property {number} input_tokens                context tokens read this turn
 * @property {number} output_tokens               tokens the model emitted this turn
 * @property {number} cache_read_input_tokens
 * @property {number} cache_creation_input_tokens
 */
/**
 * @typedef {Object} UsageTally
 * @property {TurnUsage[]} turns   per-assistant-turn breakdown, in stream order
 * @property {Object} totals       the SDK's billed aggregate (from the result msg):
 *   { input_tokens, output_tokens, cache_read_input_tokens,
 *     cache_creation_input_tokens, total_cost_usd, num_turns, byModel }
 */
/**
 * @typedef {Object} TrialRecord The per-trial row scoring (E-04) and the rating
 *   app (§10) join on. Keyed by metadata.trial_id.
 * @property {import("./artifact.mjs").Metadata} metadata
 * @property {string} model_id
 * @property {string} prompting_method_id
 * @property {string} schema_version
 * @property {string} status               SDK result subtype ("success" | error subtype)
 * @property {UsageTally} usage
 * @property {string} finished_at          ISO date-time (supplied by the caller)
 */

/** Coerce a possibly-missing numeric usage field to a number (defensive). */
function num(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/**
 * Build the token tally from the full SDK message stream and the terminal result.
 * Per-turn input-vs-output comes from each `assistant` message's nested
 * `message.usage` (spec §7/§9: the iterative archetype needs turn-over-turn
 * context growth, so the per-turn breakdown is first-class even when single-shot
 * has one turn). The `totals` come from the result message's `usage`/`modelUsage`
 * — the SDK's BILLED aggregate — not a sum of turns, which can differ under cache
 * accounting and retries (spec §4/§9).
 * @param {object[]} messages  every message yielded by query(), in stream order
 * @param {object} result      the terminal SDKResult message
 * @returns {UsageTally}
 */
export function tallyUsage(messages, result) {
  const turns = [];
  for (const m of messages ?? []) {
    if (!m || m.type !== "assistant") continue;
    const u = (m.message && m.message.usage) || {};
    turns.push({
      index: turns.length,
      input_tokens: num(u.input_tokens),
      output_tokens: num(u.output_tokens),
      cache_read_input_tokens: num(u.cache_read_input_tokens),
      cache_creation_input_tokens: num(u.cache_creation_input_tokens),
    });
  }
  const ru = (result && result.usage) || {};
  const totals = {
    input_tokens: num(ru.input_tokens),
    output_tokens: num(ru.output_tokens),
    cache_read_input_tokens: num(ru.cache_read_input_tokens),
    cache_creation_input_tokens: num(ru.cache_creation_input_tokens),
    total_cost_usd: num(result && result.total_cost_usd),
    num_turns: num(result && result.num_turns),
    byModel: (result && result.modelUsage) || {},
  };
  return { turns, totals };
}

/**
 * Serialize the full transcript as JSONL — one SDK message object per line, in
 * stream order (spec §9: "log the full Agent SDK transcript per trial"). JSONL is
 * the format that survives partial writes and streams append-only.
 * @param {object[]} messages
 * @returns {string}
 */
export function serializeTranscript(messages) {
  return (messages ?? []).map((m) => JSON.stringify(m)).join("\n") + "\n";
}

/**
 * Assemble the per-trial record (pure). The identity fields are pulled FROM THE
 * ARTIFACT (model_id, prompting_method_id, schema_version, metadata) so the record
 * cannot disagree with the artifact it describes — the artifact is the one source
 * (no separate metadata block to fork). `finishedAt` is a parameter, not a clock
 * read, so this stays deterministically testable.
 * @param {Object} p
 * @param {import("./artifact.mjs").DesignArtifact} p.artifact
 * @param {UsageTally} p.tally
 * @param {object} p.result        terminal SDKResult message
 * @param {string} p.finishedAt    ISO date-time
 * @returns {TrialRecord}
 */
export function buildTrialRecord({ artifact, tally, result, finishedAt }) {
  return {
    metadata: artifact.metadata,
    model_id: artifact.metadata.model_id,
    prompting_method_id: artifact.metadata.prompting_method_id,
    schema_version: artifact.schema_version,
    status: (result && result.subtype) || "unknown",
    usage: tally,
    finished_at: finishedAt,
  };
}

/**
 * Enforce AC #4 on a (merged) options object: no code-execution tool may be
 * enabled and permissions may not be bypassed. Throws — a trial that could run
 * code is not a valid trial, and a silent default is not enough (a caller's
 * `options` override could otherwise re-open the door). Pure; no SDK.
 * @param {Record<string, *>} options
 * @returns {void}
 */
export function assertSafeOptions(options = {}) {
  const allowed = options.allowedTools ?? [];
  const offending = allowed.filter((t) => FORBIDDEN_TOOLS.includes(t));
  if (offending.length) {
    throw new Error(
      `unsafe trial options: code-execution tools enabled (${offending.join(", ")}) — ` +
        "the allow_insecure_coding path is out of scope (spec §3)",
    );
  }
  if (options.permissionMode === "bypassPermissions") {
    throw new Error(
      'unsafe trial options: permissionMode "bypassPermissions" is forbidden in a trial (spec §3)',
    );
  }
  if (options.allowDangerouslySkipPermissions === true) {
    throw new Error(
      "unsafe trial options: allowDangerouslySkipPermissions must not be set in a trial (spec §3)",
    );
  }
}

/**
 * Run ONE live, metered trial end to end (AC #1–#4). LIVE — reaches the SDK
 * through requestDesignArtifact (the single seam) and writes files. Not unit-
 * tested (spec §4). Its logic is otherwise the pure functions above, which are.
 *
 * @param {Object} p
 * @param {string} p.prompt                 the trial prompt
 * @param {import("./artifact.mjs").Metadata} [p.metadata] optional seed metadata;
 *   if it carries a trial_id it must match the artifact's, else runTrial throws —
 *   the record is always keyed off the artifact (the one source).
 * @param {string} [p.model]                model override (defaults to the pin)
 * @param {string} [p.outDir]               trial store root (defaults to "trials")
 * @param {Record<string, *>} [p.options]   extra query options (merged over SAFE_TRIAL_OPTIONS)
 * @returns {Promise<{ record: TrialRecord, artifact: import("./artifact.mjs").DesignArtifact, dir: string }>}
 */
export async function runTrial({ prompt, metadata, model, outDir = "trials", options = {} } = {}) {
  const mergedOptions = { ...SAFE_TRIAL_OPTIONS, ...options };
  assertSafeOptions(mergedOptions);

  const messages = [];
  const { artifact, raw } = await requestDesignArtifact({
    prompt,
    model: model ?? PHASE1_MODEL_ID,
    options: mergedOptions,
    onMessage: (m) => messages.push(m),
  });

  const trialId = artifact.metadata && artifact.metadata.trial_id;
  if (!trialId) {
    throw new Error("artifact metadata has no trial_id — cannot key the trial record");
  }
  if (metadata && metadata.trial_id && metadata.trial_id !== trialId) {
    throw new Error(
      `trial_id mismatch: caller metadata "${metadata.trial_id}" != artifact "${trialId}"`,
    );
  }

  const tally = tallyUsage(messages, raw);
  const record = buildTrialRecord({
    artifact,
    tally,
    result: raw,
    finishedAt: new Date().toISOString(),
  });

  const dir = join(outDir, trialId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "artifact.json"), JSON.stringify(artifact, null, 2) + "\n");
  writeFileSync(join(dir, "transcript.jsonl"), serializeTranscript(messages));
  writeFileSync(join(dir, "trial.json"), JSON.stringify(record, null, 2) + "\n");

  return { record, artifact, dir };
}

// Unit suite for the trial runner's PURE core (T-004-01, AC #3/#4).
//
// Covers tallyUsage / serializeTranscript / buildTrialRecord / assertSafeOptions
// over plain mock objects shaped to the installed SDK's message types
// (@anthropic-ai/claude-agent-sdk sdk.d.ts). The SDK is never imported and
// runTrial() is never called — the suite is offline and free of metered API calls
// (spec §4).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  tallyUsage,
  serializeTranscript,
  buildTrialRecord,
  assertSafeOptions,
} from "./trial.mjs";
import { SAFE_TRIAL_OPTIONS } from "./config.mjs";

// --- mock SDK objects (shaped to sdk.d.ts) --------------------------------

const assistantMsg = (usage) => ({
  type: "assistant",
  message: { role: "assistant", usage },
  uuid: "u",
  session_id: "s",
});

const systemMsg = () => ({ type: "system", subtype: "init", uuid: "u", session_id: "s" });

const successResult = (over = {}) => ({
  type: "result",
  subtype: "success",
  result: "{}",
  num_turns: 2,
  total_cost_usd: 0.0123,
  usage: {
    input_tokens: 1500,
    output_tokens: 800,
    cache_read_input_tokens: 200,
    cache_creation_input_tokens: 50,
  },
  modelUsage: { "claude-opus-4-8": { inputTokens: 1500, outputTokens: 800, costUSD: 0.0123 } },
  uuid: "u",
  session_id: "s",
  ...over,
});

const artifactFixture = {
  schema_version: "1.0.0",
  metadata: {
    trial_id: "phase1-house-singleshot-0001",
    prompting_method_id: "single-shot.v1",
    model_id: "claude-opus-4-8",
    seed: 42,
    server_state_id: "flat-creative-superflat.v1",
  },
  style: { name: "industrial", rationale: "x" },
  palette: { manifest: ["minecraft:stone"] },
  placements: [],
};

// --- tallyUsage (AC #3) ---------------------------------------------------

test("tallyUsage builds one ordered turn per assistant message; skips non-assistant", () => {
  const messages = [
    systemMsg(),
    assistantMsg({ input_tokens: 100, output_tokens: 40, cache_read_input_tokens: 0, cache_creation_input_tokens: 10 }),
    assistantMsg({ input_tokens: 300, output_tokens: 90, cache_read_input_tokens: 20, cache_creation_input_tokens: 0 }),
  ];
  const { turns } = tallyUsage(messages, successResult());
  assert.equal(turns.length, 2);
  assert.deepEqual(turns[0], {
    index: 0,
    input_tokens: 100,
    output_tokens: 40,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 10,
  });
  assert.equal(turns[1].index, 1);
  assert.equal(turns[1].input_tokens, 300);
});

test("tallyUsage coerces missing per-turn usage fields to 0", () => {
  const { turns } = tallyUsage([assistantMsg(undefined)], successResult());
  assert.deepEqual(turns[0], {
    index: 0,
    input_tokens: 0,
    output_tokens: 0,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 0,
  });
});

test("tallyUsage totals come from the result message (billed aggregate), not the turn sum", () => {
  // Per-turn sum (140) deliberately differs from the result aggregate (800 output).
  const messages = [assistantMsg({ input_tokens: 100, output_tokens: 140 })];
  const { totals } = tallyUsage(messages, successResult());
  assert.equal(totals.input_tokens, 1500);
  assert.equal(totals.output_tokens, 800);
  assert.equal(totals.cache_read_input_tokens, 200);
  assert.equal(totals.total_cost_usd, 0.0123);
  assert.equal(totals.num_turns, 2);
  assert.deepEqual(totals.byModel, {
    "claude-opus-4-8": { inputTokens: 1500, outputTokens: 800, costUSD: 0.0123 },
  });
});

test("tallyUsage tolerates an empty/absent result and message list", () => {
  const t = tallyUsage(undefined, undefined);
  assert.deepEqual(t.turns, []);
  assert.equal(t.totals.input_tokens, 0);
  assert.deepEqual(t.totals.byModel, {});
});

// --- serializeTranscript (AC #3) ------------------------------------------

test("serializeTranscript emits one JSON line per message with a trailing newline", () => {
  const messages = [systemMsg(), assistantMsg({ input_tokens: 1, output_tokens: 2 })];
  const out = serializeTranscript(messages);
  assert.equal(out.endsWith("\n"), true);
  const lines = out.trimEnd().split("\n");
  assert.equal(lines.length, 2);
  assert.deepEqual(JSON.parse(lines[0]), messages[0]);
  assert.deepEqual(JSON.parse(lines[1]), messages[1]);
});

// --- buildTrialRecord (AC #3) ---------------------------------------------

test("buildTrialRecord pulls identity from the artifact and uses the passed finishedAt", () => {
  const tally = tallyUsage([assistantMsg({ input_tokens: 1, output_tokens: 2 })], successResult());
  const rec = buildTrialRecord({
    artifact: artifactFixture,
    tally,
    result: successResult(),
    finishedAt: "2026-06-04T18:00:00Z",
  });
  assert.equal(rec.metadata.trial_id, "phase1-house-singleshot-0001");
  assert.equal(rec.model_id, "claude-opus-4-8");
  assert.equal(rec.prompting_method_id, "single-shot.v1");
  assert.equal(rec.schema_version, "1.0.0");
  assert.equal(rec.status, "success");
  assert.equal(rec.finished_at, "2026-06-04T18:00:00Z");
  assert.equal(rec.usage.turns.length, 1);
});

test("buildTrialRecord reflects an error result subtype as the status", () => {
  const rec = buildTrialRecord({
    artifact: artifactFixture,
    tally: tallyUsage([], successResult()),
    result: { type: "result", subtype: "error_max_structured_output_retries" },
    finishedAt: "2026-06-04T18:00:00Z",
  });
  assert.equal(rec.status, "error_max_structured_output_retries");
});

// --- assertSafeOptions (AC #4) --------------------------------------------

test("assertSafeOptions passes the canonical safe options", () => {
  assert.doesNotThrow(() => assertSafeOptions(SAFE_TRIAL_OPTIONS));
});

test("assertSafeOptions throws when a code-execution tool is allowed", () => {
  assert.throws(() => assertSafeOptions({ allowedTools: ["Bash"] }), /code-execution tools enabled/);
  assert.throws(() => assertSafeOptions({ allowedTools: ["Read", "Task"] }), /Task/);
});

test("assertSafeOptions throws on bypassPermissions and allowDangerouslySkipPermissions", () => {
  assert.throws(
    () => assertSafeOptions({ allowedTools: [], permissionMode: "bypassPermissions" }),
    /bypassPermissions/,
  );
  assert.throws(
    () => assertSafeOptions({ allowedTools: [], allowDangerouslySkipPermissions: true }),
    /allowDangerouslySkipPermissions/,
  );
});

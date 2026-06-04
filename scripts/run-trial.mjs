// `npm run trial:run` — launch ONE live, metered trial end to end (T-004-01).
//
// The demonstrable entrypoint for the E-03 harness skeleton: prompt → Agent SDK
// (model pinned by config) → validated artifact → logged transcript + per-turn
// token tally, written under trials/<trial_id>/. Mirrors render/src/cli.mjs.
//
// LIVE AND METERED (spec §4: Agent SDK usage bills at full API rates). This is the
// one place a real trial is launched — it is NOT part of `npm test`. Requires the
// optional @anthropic-ai/claude-agent-sdk dependency and API credentials.

import { runTrial } from "../src/trial.mjs";
import { PHASE1_MODEL_ID, DEFAULT_PROMPTING_METHOD_ID } from "../src/config.mjs";

// A minimal single-shot house brief (spec §8 target #1). The artifact's own
// metadata is the source of truth for trial_id/model_id; this prompt seeds it.
const SAMPLE_PROMPT = [
  "Design a small survival-buildable house as a structured design artifact.",
  `Use metadata.trial_id "phase1-house-singleshot-demo", model_id "${PHASE1_MODEL_ID}",`,
  `prompting_method_id "${DEFAULT_PROMPTING_METHOD_ID}", seed 42, server_state_id "flat-creative-superflat.v1",`,
  'target "house". Use the industrial palette and keep the footprint within a 7x7 base.',
].join(" ");

try {
  const { record, dir } = await runTrial({ prompt: SAMPLE_PROMPT });
  const t = record.usage.totals;
  console.log(`wrote trial → ${dir}`);
  console.log(
    `  status=${record.status} model=${record.model_id} turns=${t.num_turns} ` +
      `in=${t.input_tokens} out=${t.output_tokens} cost=$${t.total_cost_usd}`,
  );
  process.exit(0);
} catch (err) {
  console.error("trial failed:");
  console.error("  " + (err && err.message));
  if (err && /not installed/.test(err.message)) {
    console.error("Install the optional SDK: npm install @anthropic-ai/claude-agent-sdk");
  }
  process.exit(1);
}

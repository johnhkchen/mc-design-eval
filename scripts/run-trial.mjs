// `npm run trial:run` — launch ONE live, metered single-shot trial (T-004-02).
//
// The demonstrable entrypoint for the E-03 harness: it runs the single-shot
// archetype (spec §7 archetype 1) building a HOUSE in the industrial style →
// Agent SDK (model pinned by config) → validated, attributable artifact → logged
// transcript + per-turn token tally, written under trials/<trial_id>/. The prompt
// is no longer hand-written here; it is constructed by the versioned archetype
// (src/single-shot.mjs) so results are attributable to the config, not to wording
// drift in this script.
//
// LIVE AND METERED (spec §4: Agent SDK usage bills at full API rates). This is the
// one place a real trial is launched — it is NOT part of `npm test`. Requires the
// optional @anthropic-ai/claude-agent-sdk dependency and API credentials.

import { runSingleShotTrial } from "../src/single-shot.mjs";

try {
  const { record, dir } = await runSingleShotTrial({
    target: "house",
    paletteId: "industrial",
    style: "industrial",
    trialId: "phase1-house-singleshot-demo",
    seed: 42,
    serverStateId: "flat-creative-superflat.v1",
  });
  const t = record.usage.totals;
  console.log(`wrote trial → ${dir}`);
  console.log(
    `  status=${record.status} model=${record.model_id} ` +
      `method=${record.prompting_method_id} turns=${t.num_turns} ` +
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

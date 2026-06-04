// `npm run trial:run` / `npm run smoke:run` — launch the end-to-end milestone trial
// (T-004-03; the "see an image" milestone).
//
// The demonstrable entrypoint for the E-03 harness: it runs the single-shot archetype
// (spec §7 archetype 1) building a HOUSE in the industrial style end to end —
// prompt → Agent SDK (model pinned by config) → validated, attributable artifact →
// materialize → headless render → SAVED IMAGE — with the transcript and per-turn
// token tally logged, all written under trials/<trial_id>/. The render tool is wired
// into the session as an invocable tool; the milestone image is the harness's
// deterministic render of the final artifact (single-shot does not revise).
//
// LIVE AND METERED (spec §4: Agent SDK usage bills at full API rates) and needs
// headless GL for the render. This is the one place a real trial is launched — it is
// NOT part of `npm test`. Requires the optional @anthropic-ai/claude-agent-sdk
// dependency and API credentials.

import { runSmokeTrial } from "../src/smoke-trial.mjs";

try {
  const { record, dir, imagePath } = await runSmokeTrial({
    target: "house",
    paletteId: "industrial",
    style: "industrial",
    trialId: "phase1-house-singleshot-demo",
    seed: 42,
    serverStateId: "flat-creative-superflat.v1",
  });
  const t = record.usage.totals;
  const r = record.render;
  console.log(`wrote trial → ${dir}`);
  console.log(
    `  status=${record.status} model=${record.model_id} ` +
      `method=${record.prompting_method_id} turns=${t.num_turns} ` +
      `in=${t.input_tokens} out=${t.output_tokens} cost=$${t.total_cost_usd}`,
  );
  console.log(`  image → ${imagePath} (placed=${r.placed} unmapped=${r.unmapped})`);
  process.exit(0);
} catch (err) {
  console.error("trial failed:");
  console.error("  " + (err && err.message));
  if (err && /not installed/.test(err.message)) {
    console.error("Install the optional SDK: npm install @anthropic-ai/claude-agent-sdk");
  }
  process.exit(1);
}

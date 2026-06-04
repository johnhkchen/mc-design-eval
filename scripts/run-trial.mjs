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
// LIVE AND METERED (spec §4): the model is invoked via the `claude -p` subscription
// shim, and the render needs headless GL. This is the one place a real trial is
// launched — it is NOT part of `npm test`. Requires the `claude` CLI installed, on
// PATH, and logged in (subscription credits, not a pay-as-you-go API key).

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
  if (err && /Claude CLI/.test(err.message)) {
    console.error("Ensure the `claude` CLI is installed, on PATH, and logged in (`claude login`).");
  }
  process.exit(1);
}

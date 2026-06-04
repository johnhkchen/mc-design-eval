// `npm run trial:iterative` — launch the end-to-end neoclassical ITERATIVE trial
// (T-005-04; the "watch it get better" deliverable for S-005).
//
// Runs the `iterative-multimodal.v1` archetype (spec §7 archetypes 2+3) building a
// HOUSE in the neoclassical style end to end on the `claude -p` subscription path:
// round 0 draft → render → see → revise for N rounds, saving a WIP render PER ROUND
// (round-0.png … round-N.png) plus the final render.png, all under
// trials/<trial_id>/, with per-round token usage (input vs output — the iterative
// archetype's context grows turn over turn, spec §7/§9) and total cost in trial.json.
//
// LIVE AND METERED (spec §4): the model is invoked via the `claude -p` shim and the
// per-round renders need headless GL. This is NOT part of `npm test`. Requires the
// `claude` CLI installed, on PATH, and logged in (subscription credits).

import { join } from "node:path";
import { runIterativeTrial, FINAL_IMAGE_NAME } from "../src/iterative-multimodal.mjs";

try {
  const { record, dir } = await runIterativeTrial({
    target: "house",
    paletteId: "neoclassical",
    style: "neoclassical",
    trialId: "phase1-house-iter-neoclassical",
    seed: 7,
    serverStateId: "flat-creative-superflat.v1",
  });

  const a = record.archetype;
  const t = record.usage.totals;
  console.log(`wrote trial → ${dir}`);
  console.log(
    `  archetype=${a.id} rounds=${a.rounds_run}/${a.rounds_configured} stopped=${a.stopped_reason}`,
  );
  for (const r of record.rounds) {
    const tt = r.usage.totals;
    console.log(
      `  round ${r.round} ${String(r.mode).padEnd(10)} ` +
        `in=${tt.input_tokens} out=${tt.output_tokens}` +
        (r.image ? `  → ${r.image}` : ""),
    );
  }
  console.log(
    `  total cost=$${t.total_cost_usd}  (in=${t.input_tokens} out=${t.output_tokens})`,
  );
  console.log(`  final image → ${join(dir, FINAL_IMAGE_NAME)}`);
  process.exit(0);
} catch (err) {
  console.error("iterative trial failed:");
  console.error("  " + (err && err.message));
  if (err && /Claude CLI/.test(err.message)) {
    console.error("Ensure the `claude` CLI is installed, on PATH, and logged in (`claude login`).");
  }
  process.exit(1);
}

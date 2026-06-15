// Throwaway helper (T-006-01): score an arbitrary render PNG with the frozen categorical
// judge (median-of-3), so round-0 (the build, pre-revision) can be A/B'd against render.png.
// main() in run.mjs only judges render.png; this reuses the same judgeRender seam vN-bestof uses.
//   node docs/active/work/T-006-01/judge-round0.mjs <path-to.png>
import { judgeRender } from "../../../../benchmarks/temple-facade/judge.mjs";
import { TEMPLE_FACADE_TASK } from "../../../../benchmarks/temple-facade/task.mjs";

const imagePath = process.argv[2];
if (!imagePath) {
  console.error("usage: node judge-round0.mjs <render.png>");
  process.exit(1);
}
const score = await judgeRender({ imagePath, brief: TEMPLE_FACADE_TASK.goal, samples: 3 });
console.log(JSON.stringify({
  imagePath,
  proportion: score.proportion,
  color: score.color,
  detail: score.detail,
  fidelity: score.fidelity,
  overall: score.overall,
  perSample: score.perSample,
  notes: score.notes,
}, null, 2));

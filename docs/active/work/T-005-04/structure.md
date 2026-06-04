# T-005-04 — Structure: file-level blueprint

Three files change; one is new. No deletions.

## 1. `src/iterative-multimodal.mjs` (MODIFIED)

### New pure exports (unit-tested)

```js
/** The canonical per-round WIP image name (mirrors smoke-trial's milestone name). */
export function roundImageName(round) { return `round-${round}.png`; }

/** The canonical final image name, written inside the trial store. */
export const FINAL_IMAGE_NAME = "render.png";
```

### `buildIterativeRecord` (MODIFIED — additive, back-compatible)

Signature gains two optional params:

```js
export function buildIterativeRecord({
  artifact, rounds, roundsConfigured, stoppedReason, finishedAt,
  finalRender, finalImage,           // NEW, both optional
}) { … }
```

Behavior unchanged except: when `finalRender` is provided, attach a top-level `render`
block built like `attachRender` —
`const { path, ...rest } = renderSummary(finalRender); record.render = { image: finalImage ?? FINAL_IMAGE_NAME, ...rest };`
Existing fields (`metadata`, `model_id`, `prompting_method_id`, `schema_version`, `archetype`,
`status`, `usage.totals`, `rounds`, `finished_at`) are untouched, so the 26 existing tests
that never pass `finalRender` see byte-identical output.

### `runIterativeTrial` (MODIFIED — the live loop, not unit-tested)

Import change: drop `derivePath` from the `./render-tool.mjs` import (now unused here); keep
`renderSummary`. Keep `basename`? No longer needed (image names come from `roundImageName`);
remove `basename` from the `node:path` import, add `copyFileSync` to the `node:fs` import.

New control flow (replaces the current round-0 + loop bodies):

```
render round 0:
  generate first (text seam) → guard → write artifact-round0.json
  img0 = join(dir, roundImageName(0))
  report0 = await renderArtifact(first, { outPath: img0 })
  roundRecords.push(buildRoundRecord({ round:0, mode:"text", messages:m0, raw:raw0,
                                       render: report0, image: roundImageName(0) }))
  current = first; currentImagePath = img0; currentReport = report0

for r = 1..N:
  png = readFileSync(currentImagePath)          // render of the PRIOR round's output
  next = await requestDesignArtifactWithImage({ prompt: pr, images:[png], … }) → guard
  write artifact-round{r}.json
  imgR = join(dir, roundImageName(r))
  reportR = await renderArtifact(next, { outPath: imgR })
  roundRecords.push(buildRoundRecord({ round:r, mode:"multimodal", messages:mk, raw:rawk,
                                       render: reportR, image: roundImageName(r) }))
  noop = isNoOpRevision(current, next)
  current = next; currentImagePath = imgR; currentReport = reportR
  if (noop) { stoppedReason = "noop"; break }

finalize:
  copyFileSync(currentImagePath, join(dir, FINAL_IMAGE_NAME))
  write artifact.json (current); write transcript.jsonl
  record = buildIterativeRecord({ artifact: current, rounds: roundRecords,
            roundsConfigured: rounds, stoppedReason, finishedAt: new Date().toISOString(),
            finalRender: currentReport, finalImage: FINAL_IMAGE_NAME })
  write trial.json
  return { record, artifact: current, dir, rounds: roundRecords }
```

Semantic shift documented in the function header: each `round-N.png` is now the render of
round N's **output** (round 0 included); the image fed into revision r is `round-(r-1).png`;
`render.png` is a copy of the final `round-N.png`.

## 2. `scripts/run-iterative-trial.mjs` (NEW)

Mirror of `scripts/run-trial.mjs`. Header comment: the runnable iterative-multimodal
neoclassical trial (T-005-04), LIVE + METERED via `claude -p`, needs headless GL, NOT part of
`npm test`. Body:

```js
import { join } from "node:path";
import { runIterativeTrial, FINAL_IMAGE_NAME } from "../src/iterative-multimodal.mjs";

try {
  const { record, dir } = await runIterativeTrial({
    target: "house", paletteId: "neoclassical", style: "neoclassical",
    trialId: "phase1-house-iter-neoclassical", seed: 7,
    serverStateId: "flat-creative-superflat.v1",
  });
  const a = record.archetype, t = record.usage.totals;
  console.log(`wrote trial → ${dir}`);
  console.log(`  archetype=${a.id} rounds=${a.rounds_run}/${a.rounds_configured} stopped=${a.stopped_reason}`);
  for (const r of record.rounds) {
    const tt = r.usage.totals;
    console.log(`  round ${r.round} ${r.mode.padEnd(10)} in=${tt.input_tokens} out=${tt.output_tokens}` +
                (r.image ? `  → ${r.image}` : ""));
  }
  console.log(`  total cost=$${t.total_cost_usd}  (in=${t.input_tokens} out=${t.output_tokens})`);
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
```

## 3. `package.json` (MODIFIED)

Add one script line after `trial:run` / `smoke:run`:

```json
"trial:iterative": "node scripts/run-iterative-trial.mjs",
```

## 4. `src/iterative-multimodal.test.mjs` (MODIFIED)

Add tests (no SDK/GL):
- `roundImageName(0)` → `"round-0.png"`, `roundImageName(3)` → `"round-3.png"`.
- `FINAL_IMAGE_NAME` === `"render.png"`.
- `buildIterativeRecord` with `finalRender`/`finalImage` attaches a top-level `render`
  block with the relative image name and NO absolute `path`; without them, `record.render`
  is `undefined` (back-compat).

## Module boundaries (unchanged)

- One live seam: model calls still only via `sdk-binding.mjs`.
- GL/prismarine core still lazy-imported inside `runIterativeTrial`.
- Pure helpers stay pure and SDK/GL-free → `npm test` stays offline.
- `trials/` remains git-ignored; the produced store is a local artifact unless force-added.

## Ordering of changes

1. Pure helpers + `buildIterativeRecord` extension + their unit tests (verifiable by `npm test`).
2. `runIterativeTrial` loop rewrite (no test gate; covered by the live run).
3. Runner script + `package.json` entry.
4. Live run to produce the trial store and satisfy AC #4.

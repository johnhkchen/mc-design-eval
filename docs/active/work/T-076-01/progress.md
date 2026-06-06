# T-076-01 Progress — resemblance-gate

## Done
- **Step 1–4 — pure core** `src/form/resemblance.mjs` + `src/form/resemblance.test.mjs`.
  - form half: `formScores` (meshIoU + conceptIoU, reuses `extractSilhouette`/`normalizeSilhouette`/`iou`).
  - material half: `buildPalette` (artifact→top-K block Lab), `setAgreement` (symmetric set coverage),
    `zoneAgreement` (Z×Z grid, mean-fg Lab snapped to block-table via `nearestLab`).
  - `resemblanceRow` orchestrator (schema-tagged, deterministic, immutable refs echoed).
  - triptych math: `resampleRgba` (box + letterbox), `silhouetteToRgba`, `composeTriptych`.
  - judge: `buildResemblancePrompt` (fixed, Rule 5) + `parseResemblanceVerdict` (stripToJson + enum/gap
    validation; gap-integrity per Rule 7).
  - **20 new unit cases pass; root `npm test` 812 pass / 0 fail** (was 792).

- **Step 5 — impure runner** `benchmarks/sculpture/resemblance.mjs` (`runResemblanceGate` + CLI + `--offline`)
  + `package.json` `"resemblance"` script. node-canvas (render pkg) draws panel labels; falls back to
  label-free encode if unavailable. `--offline` verified GL-free + model-free.
- **Step 6 — gatehouse run (LIVE, Rule 6 reproduced).** Fixed-lens re-render + one metered `claude -p`
  judge call ($0.11; 10505 in / 341 out tok).
  - form: meshIoU **0.929**, conceptIoU **0.611** (concept ≈ 3/4 → camera mismatch, expected).
  - material: set **0.75**, zone **0.304** (low — roof zoning drift, consistent with the verdict).
  - **verdict: "drifted"**, named gap **form @ the roof/upper gable** (Rule 7): "the upper roof dissolves
    into a noisy lighter mass with no clean gable ridge". Matches the human triptych read.
  - outputs committed: `gatehouse-{triptych.png, minecraft.png, perceptual.json, verdict.json,
    resemblance.md}`.

## Remaining
- **Step 7** — `review.md`.

## Deviations
- Verdict parser is hand-rolled (not BAML/ajv) per design D4 — lighter, keeps parse pure.
- `resampleRgba` accepts BOTH `{width,height}` (decoded) and `{w,h}` (panel) shapes — decoded images and
  panel buffers use different conventions; the resize is the one seam that bridges them.
- Single metered judge sample (not the temple-facade N-median); `samples` is a reserved knob S-077 can raise
  without touching parse logic (Rule 5 keeps the threshold fixed within a comparison set).

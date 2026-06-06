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

## Remaining
- **Step 5** — impure runner `benchmarks/sculpture/resemblance.mjs` (`runResemblanceGate` + CLI + `--offline`)
  + `package.json` script.
- **Step 6** — run on the gatehouse (live if GL+subscription, else `--offline`); commit triptych + perceptual
  row + verdict + md.
- **Step 7** — `review.md`.

## Deviations
- None so far. Verdict parser is hand-rolled (not BAML/ajv) per design D4 — lighter, keeps parse pure.

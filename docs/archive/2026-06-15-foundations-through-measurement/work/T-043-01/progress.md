# T-043-01 · Progress — form-fidelity-metric

## Status: implementation complete, all tests green

### Done

- **`src/form/form-fidelity.mjs`** — new module (new `src/form/` dir).
  - Pure core: `extractSilhouette` (reuses `isBackground`), `bboxOf`, `normalizeSilhouette` + `resampleInto`
    (bbox-crop → inverse-mapped resample into G×G; `aspect` letterbox / `stretch` fill), `iou`, `regionIoU`,
    `formFidelity`. Decode shell: `formFidelityFromPair` (only `decodeImage` caller; only async).
  - Exports `FORM_FIDELITY_SCHEMA`, `FORM_DEFAULTS`, `RENDER_BG`, `CONCEPT_BG`.
  - Honesty ledger (5 limits) in the module header, mirroring `value-gate.mjs`'s self-critique.
- **`src/form/form-fidelity.test.mjs`** — 30 tests, groups A–H. A–G pure/synthetic (RGBA buffers + tiny
  masks); H runs the real pipeline on the committed E-13 pairs.
- **`benchmarks/sculpture/form-baseline.mjs`** + committed **`form-baseline.json`** / **`form-baseline.md`**
  — per-subject baseline over all 13 committed pairs. Mean IoU 0.479; lowest moai 001 (0.197), highest
  moai 010 (0.818).

### Deviation from plan (documented)

- **Plan Step 2/3 said forward-accumulate per-cell** (echoing `image-grid`'s `aggregateCells`). Forward
  accumulation leaves **resampling gaps when upsampling** (a tiny synthetic blob → larger grid leaves empty
  target columns), which failed test B3. Switched to **inverse (pull) mapping**: each target cell pulls the
  source window it covers. Correct under both down- and up-sampling. The real images always *downsample*
  (512²/1408×768 → 128), so this is a correctness/robustness improvement with no behavior change on the
  fixtures. Same coverage-threshold semantics.

### Verification

- `node --test src/form/form-fidelity.test.mjs` → 30/30 pass.
- `npm test` → 399/399 pass (was 369; +30 form tests). No regression.
- `node benchmarks/sculpture/form-baseline.mjs` → clean run over all 13 subjects, deterministic output.

### Commits

1. `feat(E-15 T-043-01): formFidelity — silhouette IoU (whole + per-region) + tests`
2. `feat(E-15 T-043-01): per-subject form-fidelity baseline (the E-15 "before")`

(Pure core + fixture tests landed together since they share one small module; baseline is its own commit.)

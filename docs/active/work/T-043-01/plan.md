# T-043-01 · Plan — form-fidelity-metric

Ordered, independently-verifiable steps. Each step ends green and is committed atomically.

## Testing strategy (up front)

- **Unit (synthetic, pure):** the bulk — groups A–G on hand-built RGBA buffers and tiny masks. No fixtures,
  no GL, no decode. This is the determinism/contract proof (identity=1, disjoint=0, region restriction,
  inputs-not-mutated, deep-equal repeat). Mirrors `value-gate.test.mjs`.
- **Fixture-backed (group H):** the ticket's explicit ask — `formFidelityFromPair` on the **committed**
  E-13 pairs; asserts `iou∈[0,1]`, both sides segment (`fgCount>0`), coverage sane. Proves the real
  pipeline end-to-end on real images.
- **Verification command:** `npm run test:unit` (the form tests) and `npm test` (full suite incl. schema
  self-test). Target: full suite green, no regressions (was 369 passing).
- **Baseline as artifact-test:** running `form-baseline.mjs` and getting a clean json/md over all 13 pairs
  is itself an integration check that the pipeline survives every real subject.

## Step 1 — pure core: silhouette + bbox

- Add module header + `FORM_FIDELITY_SCHEMA`, `FORM_DEFAULTS`, `RENDER_BG`, `CONCEPT_BG`, `round2/round3`.
- Implement `extractSilhouette(img, bgOpts)` (forward pass via imported `isBackground`) and `bboxOf`.
- Tests **A**: fg count on a synthetic 4×4 buffer with known fg/bg; black-bg and sky-bg presets each
  segment a planted blob; empty buffer → `bbox:null,fgCount:0`; off-center blob → tight bbox.
- Verify: `node --test src/form/form-fidelity.test.mjs` green. **Commit.**

## Step 2 — pure core: normalization (alignment)

- Implement `cropResampleAspect` (crop to bbox → letterbox `aspect` / fill `stretch` via per-cell coverage
  aggregation ≥ `coverageThreshold`) and `normalizeSilhouette`.
- Tests **B**: output dims exactly `G×G`; aspect-fit of a tall (e.g. 2×6) blob leaves empty edge columns
  (letterbox); stretch-fit fills both axes; an already-full mask normalizes to (near-)full.
- Verify green. **Commit** (may fold into Step 3 commit if small).

## Step 3 — pure core: IoU + regionIoU + orchestrator

- Implement `iou(a,b)` (dim-check throw; both-empty→1), `regionIoU(a,b,region)` (normalized rect, cell-
  center test, degenerate→0), and `formFidelity(renderImg, conceptImg, opts)` assembling segment→normalize
  →iou(+regionIoU) and the `render`/`concept` sub-objects (coverage, bbox, aspect), all rounded.
- Tests **C/D/E/F/G**: identity=1, disjoint=0, partial=known fraction, both-empty=1; dim-mismatch throws;
  region restriction (box-around-overlap == whole iou; disjoint-corner box=0; degenerate=0); determinism
  deep-equal + inputs-not-mutated + `iou∈[0,1]` + region echoed; `stretch`≠`aspect` on a non-square subject;
  custom `grid`.
- Verify `node --test src/form/form-fidelity.test.mjs` green. **Commit:**
  `feat(E-15 T-043-01): formFidelity — silhouette IoU (whole + per-region) pure core`.

## Step 4 — decode shell + fixture tests

- Implement `formFidelityFromPair(renderPath, conceptPath, opts)` (lazy `decodeImage` ×2 → `formFidelity`).
- Tests **H**: resolve runs dir via `import.meta.url`; on moai/koi/heart assert `iou∈[0,1]`, both
  `fgCount>0`, `render.coverage` in a plausible band; loop all discovered pairs asserting the invariant.
- Verify `npm run test:unit` green (form + all existing). **Commit:**
  `test(E-15 T-043-01): fixture-backed form-fidelity on committed E-13 pairs`.

## Step 5 — baseline generator + committed artifact

- Write `benchmarks/sculpture/form-baseline.mjs` (discover pairs, derive subject from `summary.json`, run
  pipeline, emit deterministic json + md table with a short "what's low and why" reading).
- Run it: `node benchmarks/sculpture/form-baseline.mjs` → produces `form-baseline.{json,md}`.
- Sanity-check the numbers by eye (IoU ordering should roughly track subject "renderability": blocky moai
  high, thin koi/sword low — consistent with E-13 findings).
- **Commit:** `feat(E-15 T-043-01): per-subject form-fidelity baseline (the E-15 "before")`.

## Step 6 — limits note, full-suite green, review

- Confirm the honesty ledger (5 limits) is present as a clear in-module comment block (mirrors the E-14
  gate's self-critique) and echoed in `form-baseline.md`.
- Run `npm test` (schema self-test + full unit suite) → green, no regression.
- Write `review.md` (changes, coverage, open concerns/limits, handoff to S-045).

## Risks & mitigations

- **R1 absolute IoU is low (camera/renderer mismatch).** Expected and acceptable — the loop uses the
  *relative* Δ. Mitigate by asserting only `∈[0,1]` + sanity bands in tests, not absolute targets; record
  the honest "before" in the baseline and explain it.
- **R2 background collateral eats a subject** (dark-on-black / blue-on-sky). For the 13 committed subjects
  the sampled coverages are sane (moai ~20%); group H asserts `fgCount>0` so a total wipe-out would fail
  loudly. Note the caveat; tolerances are knobs.
- **R3 aspect-fit vs stretch judgment.** Both implemented; `aspect` default justified in design (proportion
  is the E-13 defect). A wrong default is a one-line flip, not a rewrite — and the test covers both.
- **R4 fixture test brittleness** if a run dir is pruned. Group H discovers dynamically and asserts the
  invariant over whatever pairs exist; representative-subject asserts guarded to those known committed.
- **R5 determinism.** No `Date`/RNG anywhere; baseline `generatedFrom` is a static glob string; floats
  rounded; dir discovery sorted. Deep-equal-repeat test enforces it.

## Definition of done (maps to acceptance criteria)

- [ ] `formFidelity` module: silhouette extract (both bgs) + normalize/align + whole IoU + region IoU,
      deterministic. → Steps 1–3.
- [ ] Unit tests on committed E-13 pairs; IoU∈[0,1]; identity=1; disjoint=0; region restricts; both bgs. →
      Steps 1–4 (synthetic A–G + fixture H).
- [ ] Baseline IoU per E-13 subject committed (`form-baseline.{md,json}`). → Step 5.
- [ ] Honest limits note (alignment/scale + single-view), mirroring the E-14 self-critique. → Steps 1 & 6.
- [ ] `npm test` green. → Step 6.

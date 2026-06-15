# T-043-01 · Review — form-fidelity-metric

Handoff document. What changed, how well it's tested, what to watch. Read this instead of every diff.

## What this ticket delivered

The **form** hill-climb number for E-15's surgical-revision loop — the analogue of E-14's concept↔render
color gate. Color already had a number to climb; form did not. Now a deterministic **silhouette IoU**
between a build's `render-3q.png` and its `concept.png` gives the loop both a whole-object and a per-region
form-fidelity signal. This ticket only *measures*; the accept-gate that consumes it is S-045.

## Files

| Action | Path | Notes |
|--------|------|-------|
| create | `src/form/form-fidelity.mjs` | The metric module (new `src/form/` dir). ~280 lines incl. header. |
| create | `src/form/form-fidelity.test.mjs` | 30 tests (A–H). |
| create | `benchmarks/sculpture/form-baseline.mjs` | Baseline generator. |
| create | `benchmarks/sculpture/form-baseline.json` | Committed baseline data. |
| create | `benchmarks/sculpture/form-baseline.md` | Committed baseline table + limits. |
| create | `docs/active/work/T-043-01/*.md` | RDSPI artifacts (research → review). |

No existing files edited; no deletions. Two commits (`942d934`, `28f5fa6`) on `main`.

## Public interface (`src/form/form-fidelity.mjs`)

- `extractSilhouette(img, bgOpts)` → `{w,h,data:Uint8Array,fgCount,bbox|null}` — background-segment a
  decoded RGBA image to a binary mask. Reuses E-10's `isBackground`.
- `normalizeSilhouette(mask, {grid,fit,coverageThreshold})` → `{w:G,h:G,data,fgCount}` — bbox-crop +
  resample to a common grid; `fit:'aspect'` (default, proportion-preserving) | `'stretch'`.
- `iou(a,b)` / `regionIoU(a,b,region)` → number — set IoU on aligned masks; region is a normalized
  `[0,1]` sub-box.
- `formFidelity(renderImg, conceptImg, opts)` → result `{schema,grid,fit,iou,regionIoU?,region?,render,
  concept}` — the orchestrator (pure).
- `formFidelityFromPair(renderPath, conceptPath, opts)` — async decode shell (only `decodeImage` caller).
- Constants: `FORM_FIDELITY_SCHEMA`, `FORM_DEFAULTS` (grid 128, fit aspect, cov 0.5), `RENDER_BG`,
  `CONCEPT_BG`.

## Test coverage

`npm test` → **399/399 pass** (was 369; +30). `node --test src/form/form-fidelity.test.mjs` → 30/30.

- **A–G synthetic/pure** (no fixtures, no GL, no decode) — segmentation fg-count + both bg presets + empty/
  tight bbox; normalization dims + aspect-letterbox vs stretch-fill; `iou` identity=1 / disjoint=0 /
  partial=known-fraction / both-empty=1 / dim-mismatch-throws; `regionIoU` restriction + degenerate=0;
  determinism (deep-equal repeat) + inputs-not-mutated + `iou∈[0,1]`; knobs (stretch≠aspect, custom grid).
- **H fixture-backed** (the ticket's explicit ask) — `formFidelityFromPair` on the committed E-13 pairs:
  representative moai/koi/heart score `∈[0,1]` with both sides segmenting and sane render coverage; *every*
  discovered pair upholds the invariant; full-frame region IoU == whole IoU on a real pair.

**Maps to acceptance criteria:** all five boxes are satisfied — module with whole+region IoU and
deterministic segmentation (A–G, F); unit tests on committed pairs incl. IoU range / identity / disjoint /
region restriction / both backgrounds (C, E, H); per-subject baseline committed (`form-baseline.{md,json}`);
limits note in module header + baseline md; `npm test` green.

### Coverage gaps (honest)

- No test pins an **absolute** IoU value for a real subject — by design (camera/renderer mismatch makes
  absolutes noisy; the loop uses the relative Δ). H asserts ranges and invariants, not magnitudes.
- The **baseline `.json` is not regression-tested** — it's a generated artifact, not asserted by the suite.
  If a future render-rig change shifts the silhouettes, the committed baseline would silently drift until
  someone re-runs the generator. Acceptable (it's a snapshot "before"), but worth knowing.
- Rotation/3-D back-face fidelity is **out of scope and untestable from one view** (see limits).

## Baseline result (the E-15 "before")

Mean silhouette IoU **0.479** over 13 subjects. Lowest: moai 001 (0.197 — small in frame, concept is a
large close-up head). Highest: moai 010 (0.818), pineapple 013 (0.789), pineapple 004 (0.755 — compact,
blocky subjects register best). Thin/elongated subjects (bow-and-arrow 0.350, heart 0.347) score lower, as
expected. These are the numbers the rest of E-15 must move up.

## Open concerns / things a reviewer should weigh

1. **`fit:'aspect'` default is a judgment call.** It *preserves proportion*, so it penalizes the exact E-13
   failure mode (koi flattening, aortic arch not looping). `'stretch'` would hide that. If S-045's loop
   wants pure-outline matching it can pass `fit:'stretch'` — but the default is deliberate. One-line flip,
   both paths tested.
2. **Background tolerances are tuned to these 13 subjects** (sky 24, black 40). A future subject that is
   sky-blue or near-black would lose foreground to segmentation (the inherited E-10 caveat). H asserts
   `fgCount>0`, so a *total* wipe-out fails loudly, but partial erosion would pass silently.
3. **Inverse-mapping deviation** from the plan (forward → pull resample) — documented in `progress.md`. It
   fixes an upsampling gap; no behavior change on the always-downsampling real fixtures.
4. **Schema is `form-fidelity/v1`** — version-bump if the result shape changes for downstream consumers.

## Handoff to S-045

The accept-gate can call `formFidelity(renderImg, conceptImg, { region })` per revision and keep a tweak
only if `iou` (or the region's `regionIoU`) rose. The baseline json is the starting scoreboard. No further
work needed in this module for the gate to consume it; thresholds and accept/rollback logic live in S-045.

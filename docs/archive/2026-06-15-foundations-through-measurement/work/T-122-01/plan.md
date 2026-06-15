# T-122-01 ridge-height-closure — Plan

Ordered, independently verifiable steps. Suite must be green (`npm test`) at every commit
boundary. No judge spend before step 8. All committed-record writes ride `--rotate-pins`.

## Step 0 — Diagnosis record (no code)

Write the diagnosis into `progress.md` FIRST (AC 1): the fit→generator→cells trace with the
real numbers (already measured in research §3):

- cottage `gable-roof-2-roof-3`: ridge.y 21 / plane-intersect 18.864 / apexLine 22.792 / GLB
  ridge profile 22.445 / max generated surface **18.577** → built apex cell 18 (+slab),
  committed ridge mean −4.324 (the −4.015 headline is a T-118-era rake `rawDelta`; footnoted);
- cottage `gable-roof-0-roof-4`: 24 / 22.54 / 24.333 / — / **22.268**;
- barn `gable-roof-1-roof-8`: 19.5 / 19.126 / 20.991 (3-bin) / 19.5 flat / **19.098** on the
  unramped half, hip plane (pitch 0.231 from v=−24) ramping the lo half 13.5→19; instrument
  anchor artifact −2.3 (buildEave 15.75 vs pooled glbEave 13.45, asymmetric eaves).

Named mechanisms (a) shallow side planes, (b) misfitted hip ceiling, (c) apex evidence never
consumed, (d) instrument anchor mismatch. Verification: numbers reproducible via the one-liner
evaluations recorded in progress.md.

## Step 1 — Sampler move + shared anchors + instrument repair  [commit 1]

1. Move `glbHeightAt` from roof-region-diff.mjs to roof-fit.mjs (export); import back.
2. Add `gableEaveAnchors(gable, glbAt)` to roof-fit.mjs (per-side medians, symmetric drop).
3. `heightProfiles` consumes it; `anchors` gains `perSide`/`dropped`; docstring fixed.
4. Tests: roof-fit.test.mjs (sampler + anchors), roof-region-diff.test.mjs (asymmetric-eave
   phantom-delta regression; symmetric case unchanged).

Verify: `npm test` green; `node benchmarks/sculpture/roof-diff.mjs --subject barn --path
generated` (dry, un-rotated → pin-guard must REFUSE the changed record — that refusal is the
expected proof the anchors moved barn's numbers; capture the fresh mean from stdout/refusal
context or a temp out-dir copy). Cottage generated mean must be ≈ unchanged (−4.324 ± noise).

## Step 2 — `dominantLine` extraction + `fitRidgeProfile` + `closeRidge`  [commit 2]

1. Extract `dominantLine`; `fitRidgeLine` regression tests prove byte-stable outputs.
2. `fitRidgeProfile` (sampled per-bin max over cross-section, shared exclusion).
3. `closeRidge` with sanity gates + named refusals + hip arbitration + apexCheck.
4. Tests incl. **the witness**: committed cottage cross-gable literals in → old surface tops
   ≤ 19 (the −4-class deficit) → closed gable realizes target 22.4-class within ±1.

Verify: `npm test` green; witness test fails if closure is reverted (checked by temporarily
reverting closeRidge call in the test's "old gable" leg — structural, not manual).

## Step 3 — `fitProvision` integration + generator realization tests  [commit 3]

1. Closure step wired after `ridgeFit` (closed gables recorded; closure blocks on ridgeFit;
   refusals → findings `stage: "ridge-closure"`).
2. provision-fit.test.mjs integration; roof-generate.test.mjs: ridge cells at fitted height ±1
   both axes, cross-gable max-merge, stair/slab caps `unmapped` empty.

Verify: `npm test` green. Pure-check: rerun the research §3 evaluation script against a
LOCALLY regenerated fit (in-memory, no record write): cottage cross-gable max surface ≈ 22.4,
barn ridge line flat ≈ its target, hip refuted.

## Step 4 — `--skip-gate` + roof-diff comment hygiene  [commit 4]

1. generated-milestone: `--skip-gate` early-return between artifact persistence and
   `spawnGate`; summary line; no record/md write.
2. roof-diff.mjs:16 comment de-specialized.

Verify: `npm test` green; `node benchmarks/sculpture/generated-milestone.mjs --subject
cottage --skip-gate` WITHOUT `--rotate-pins` → pin-guard refuses on the first changed artifact
(fail-closed proof), no judge spawn observed.

## Step 5 — Skip-gate chain runs (artifacts + fits move)  [commit 5: artifacts]

- `npm run generated:cottage -- --skip-gate --rotate-pins`
- `npm run generated:barn -- --skip-gate --rotate-pins`

Verify: chains complete (double-run byte-equal, zero-blob holds); `generated/{s}/provision-fit
.json` shows closure blocks (cottage cross to≈22.5; barn hip refuted, to≈19.5-class); artifact
roof cells rise accordingly. Committed milestone records intentionally stale until step 8
(named in progress.md).

## Step 6 — Instrument verification BEFORE judging  [commit 6: roof-diff records]

- Preserve before-state: copy current `roof-diff/{cottage,barn}-generated.{json,md}` +
  committed sheets into `docs/active/work/T-122-01/artifacts/before/`.
- `npm run diff:roof -- --subject cottage --path generated --rotate-pins`; same for barn.
- Refresh the remaining 6 records (anchor repair moved them): `npm run diff:roof --
  --rotate-pins` (all subjects × paths) — judge-free.

ACCEPT (AC 3) before proceeding: cottage cross-gable + barn ridge eave-relative mean within
**±1**; no other region's missing/extra totals worsen beyond noise (compare byregion before/
after); per-view IoU vs GLB no-regress (cage holds). If any regresses: STOP, record the
rollback (revert the artifact commit), name the residual — do not proceed to judging.

## Step 7 — `--repro` / `--offline` mid-checks

`npm run diff:roof -- --repro` green across records. (Milestone `--repro` for cottage/barn
still compares against the stale committed record → expected DIVERGE until step 8; noted.)

## Step 8 — The one owned re-judge  [commit 7: verdicts]

- `npm run generated:cottage -- --rotate-pins` (full chain re-derives byte-identical artifacts,
  gate runs: one judge run per view, T-114 bounded re-asks only on malformed).
- `npm run generated:barn -- --rotate-pins`.

Verify: instrument receipts `frozen, diffs: []` (same-ruler); movement vs T-121 profiles
(cottage 12/2 0/4, barn 12/2 0/4) recorded — improvements or residuals named WITH the diff
deltas that explain them; barn record `generalization.clean: true` (AC 5); retired pins named
in the commit message (T-119 policy). Suite conformance tripwires, if fired, resolved via the
sanctioned judge-free paths (`--distill-only --rotate-pins`) — never hand-edits.

## Step 9 — Reproducibility closure + hygiene sweep  [commit 8 if needed]

- `npm run generated:cottage -- --repro` and `-- --offline`; same for barn — all exit 0.
- `npm run diff:roof -- --repro` again post-rotation.
- Generalization grep: subject keys absent from touched runners; `npm test` green.
- Frames: before/after ridge-region sheets under `pr/assets/frames/` (diff:roof emits) +
  before-state preserved in the work dir.

## Step 10 — Review artifact

`review.md`: files changed, the closure numbers (before → after per gable), test coverage map,
gaps (church/gatehouse generated staleness handoff; apexLine-vs-profile divergence record;
k-sample verdict stability still deferred), critical flags.

## Testing strategy summary

- **Unit (new)**: sampler, anchors (4 cases), dominantLine regression, fitRidgeProfile ×2 axes,
  closeRidge (witness + 3 sanity refusals + 2 hip cases + apexCheck), provision-fit
  integration, roof-generate realization ×3. All pure, deterministic, no GL.
- **Instrument (records)**: roof-diff before/after on both subjects, byregion no-worsen,
  per-view IoU no-regress, `--repro` byte-stability.
- **Chain**: double-run byte-equality + zero-blob (existing machinery); `--skip-gate` refusal
  path fail-closed.
- **Judge**: exactly two gated runs (the owned re-judge); receipts assert ruler stability.

## Failure playbook

- Closure refused on a real subject (sanity gate) → the gable stays as-fitted, residual named;
  ticket still ships diagnosis + instrument repair + closure for the passing gables; the
  refusal is the honest record.
- Chain stalls downstream (zone lens / grammar on the taller roof) → named finding; fix only if
  mechanical (T-116/T-121 precedent), else record and stop before judge spend.
- Gate verdict worsens despite instrument closure → verdicts recorded honestly (E-25 Rule 6);
  the instrument receipts + diff deltas explain; no re-rolls.

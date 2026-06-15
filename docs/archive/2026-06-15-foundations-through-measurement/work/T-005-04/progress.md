# T-005-04 — Progress

## Step 1 — pure helpers + record extension ✅

- `src/iterative-multimodal.mjs`: added `roundImageName(round)` → `round-<r>.png` and
  `FINAL_IMAGE_NAME = "render.png"`; extended `buildIterativeRecord` with optional
  `finalRender`/`finalImage` that attach a top-level `render` block (relative image name +
  build summary, absolute path stripped) — mirrors smoke-trial's `attachRender` and the
  single-shot baseline record format. Back-compatible (omitted ⇒ no `render` block).
- `src/iterative-multimodal.test.mjs`: added `roundImageName`/`FINAL_IMAGE_NAME` test and a
  `buildIterativeRecord` with/without-`finalRender` test (asserts no abs path, round-image list).
- **Verify:** `npm test` → **133 pass / 0 fail** (was 131; +2 test functions). SDK/GL not loaded.

## Step 2 — loop rewrite ✅

- `src/iterative-multimodal.mjs runIterativeTrial`: now renders **each round's output** once to
  `round-<r>.png` (round 0 = draft), feeds the prior round's PNG into revision r, copies the
  final `round-<N>.png` to `render.png`, and passes `finalRender`/`finalImage` to the record.
  Imports updated: dropped unused `derivePath`/`basename`, added `copyFileSync`. Header comment
  updated to document the new round-image semantics.
- **Verify:** `node --check` clean; `npm test` still 133 pass (loop is live, not unit-tested —
  this confirms no pure-helper regression and the module imports clean without the SDK/GL).

## Step 3 — runner + npm entry ✅

- `scripts/run-iterative-trial.mjs` (new): mirrors `scripts/run-trial.mjs`; fixed neoclassical
  house spec (`trialId: phase1-house-iter-neoclassical`, seed 7), prints rounds, per-round
  in/out tokens + image, total cost, final image path; `exit 0/1` with the Claude-CLI hint.
- `package.json`: added `"trial:iterative": "node scripts/run-iterative-trial.mjs"`.
- **Verify:** `node --check` clean; dynamic import resolves `runIterativeTrial` /
  `roundImageName` / `FINAL_IMAGE_NAME`.

## Step 4 — live run (AC #1/#2/#4)

- LIVE + metered via `claude -p`, needs headless GL. Status recorded below after the run.

## Deviations from plan

- None structural. AC #3 (per-round tokens + total cost) required **no** code change — it was
  already satisfied by `buildRoundRecord`/`tallyUsage`/`sumTotals`; the only record addition was
  referencing the round-image list + final image (AC #2).

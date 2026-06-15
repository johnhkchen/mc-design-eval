# T-005-04 — Plan: ordered, verifiable steps

Each step is independently committable. Steps 1–2 are gated by `npm test`; steps 3–4 are
the live, metered surface (not in `npm test`), gated by the actual run.

## Step 1 — Pure helpers + record extension (TDD-able)

**Edit** `src/iterative-multimodal.mjs`:
- Add `export function roundImageName(round)` → `` `round-${round}.png` ``.
- Add `export const FINAL_IMAGE_NAME = "render.png"`.
- Extend `buildIterativeRecord` destructure with optional `finalRender`, `finalImage`; when
  `finalRender` present, attach top-level `record.render = { image: finalImage ?? FINAL_IMAGE_NAME, ...renderSummary(finalRender) without path }`.

**Edit** `src/iterative-multimodal.test.mjs`:
- `roundImageName` cases (0, 3).
- `FINAL_IMAGE_NAME` constant.
- `buildIterativeRecord` with + without `finalRender` (attaches/omits `render`, no abs path).

**Verify:** `npm test` (full suite) passes; new tests included; no SDK/GL import pulled in.
Target test count: 131 (current) + ~3 new = ~134.

## Step 2 — Rewrite the `runIterativeTrial` live loop

**Edit** `src/iterative-multimodal.mjs`:
- Imports: drop `derivePath` + `basename` (unused after rewrite); add `copyFileSync` to the
  `node:fs` import; keep `renderSummary`, `readFileSync`, `writeFileSync`, `mkdirSync`, `join`.
- Render round 0's draft → `round-0.png`; attach its render to the round-0 record.
- Loop r=1..N: feed the **prior** round's PNG (`currentImagePath`), take the revision, render
  the revision's output → `round-r.png`, attach to the round-r record; carry
  `current/currentImagePath/currentReport` forward; break on no-op.
- Finalize: `copyFileSync(currentImagePath, join(dir, FINAL_IMAGE_NAME))`; write `artifact.json`,
  `transcript.jsonl`; `buildIterativeRecord(..., finalRender: currentReport, finalImage: FINAL_IMAGE_NAME)`;
  write `trial.json`.
- Update the function header comment to describe the new round-image semantics.

**Verify:** `npm test` still passes (loop is not unit-tested; this confirms no pure-helper
regression and that the module still imports clean). Lint by eye for the dropped imports.

## Step 3 — Runner script + npm entry

**Create** `scripts/run-iterative-trial.mjs` per Structure §2.
**Edit** `package.json`: add `"trial:iterative": "node scripts/run-iterative-trial.mjs"`.

**Verify (offline):** `node -e "import('./src/iterative-multimodal.mjs').then(m => console.log(typeof m.runIterativeTrial, m.FINAL_IMAGE_NAME))"`
prints `function render.png`. `npm run trial:iterative` resolves the script (will then attempt
a live call — see Step 4). Confirm `node --check scripts/run-iterative-trial.mjs`.

## Step 4 — Live run (the deliverable; AC #1/#2/#4)

Run `npm run trial:iterative` once (LIVE, metered, needs `claude` logged in + headless GL).

**Verify by AC:**
- AC #1: exits 0; summary printed.
- AC #2: `trials/phase1-house-iter-neoclassical/` contains `round-0.png … round-3.png` (or
  fewer if a no-op stopped early) **plus** `render.png`; `trial.json` `rounds[*].image` lists
  them and the top-level `render.image` = `render.png`.
- AC #3: `trial.json` `rounds[*].usage.totals.{input_tokens,output_tokens}` present per round;
  `usage.totals.total_cost_usd` present; record keyed by `metadata.trial_id`.
- AC #4: open `round-0.png` → `render.png` and compare by eye to
  `trials/phase1-house-singleshot-demo/render.png` — expect a more detailed, more coherent
  neoclassical building (columns/entablature/pediment emerging round over round).

If the environment lacks a logged-in `claude` CLI or headless GL, the script exits 1 with the
hint; document that in `progress.md`/`review.md` and flag for a human to run — the code path is
otherwise complete and the pure surface is test-green.

## Testing strategy

- **Unit (npm test):** the two pure additions only. Everything SDK/GL stays out of `npm test`
  (spec §4), consistent with `trial.mjs`/`smoke-trial.mjs`/`iterative-multimodal.mjs`.
- **Integration (manual/live):** the `npm run trial:iterative` run is the integration test; its
  artifacts under `trials/` are the evidence.
- **Regression guard:** existing 131 tests must remain green; the loop rewrite must not change
  any pure helper's signature in a breaking way (only additive optional params).

## Commit sequence

1. `T-005-04: round-image helpers + final-render block on iterative record`
2. `T-005-04: render each round's output (round-N.png) + final render.png in the loop`
3. `T-005-04: add scripts/run-iterative-trial.mjs + npm run trial:iterative`

(Live-run artifacts are git-ignored; commit them only if a human chooses to force-add the
progression for the gallery, mirroring the temple benchmark.)

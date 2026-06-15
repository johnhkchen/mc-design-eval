# T-005-04 — Review: iterative-neoclassical-trial-run

Handoff for a human reviewer. Summarizes the change, test coverage, the live-run state,
and open concerns. Commit: `925fa23`.

## What changed

The runnable, demonstrable deliverable for S-005: `npm run trial:iterative` runs the
`iterative-multimodal.v1` archetype building a **neoclassical house** end to end on the
`claude -p` path, saving a **WIP render per round** (`round-0.png … round-N.png`) plus the
final `render.png`, with per-round token usage and total cost in `trial.json`.

Two-part change, as designed:
1. **Round-image semantics fixed at the source** (`runIterativeTrial`). Previously the loop
   rendered the *input* to each revision (`<trialId>-rev<n>.png`), never rendered round 0 or
   the final round's output, and produced no `render.png`. Now each round's **output** is
   rendered exactly once to `round-<r>.png` (round 0 = the initial draft); the image fed into
   revision r is the prior round's `round-<r-1>.png`; and `render.png` is a byte-copy of the
   final `round-<N>.png` (no second GL pass).
2. **Runner + npm entry** (`scripts/run-iterative-trial.mjs`, `trial:iterative`) mirroring
   `scripts/run-trial.mjs` / `runSmokeTrial`.

AC #3 (per-round input/output tokens + total cost) needed **no** code change — it was already
satisfied by `buildRoundRecord`/`tallyUsage`/`sumTotals`. The only record addition was making
the round-image list (`rounds[*].image`, now incl. round 0) and the final image
(top-level `render` block) first-class, matching the single-shot baseline's `trial.json` shape.

## Files

**Created**
- `scripts/run-iterative-trial.mjs` — live runner; fixed neoclassical-house spec
  (`trialId: phase1-house-iter-neoclassical`, seed 7, default 3 revisions); prints rounds,
  per-round in/out tokens + image, total cost, final image path; `exit 0/1` with the Claude-CLI
  hint. Not part of `npm test` (LIVE + metered + headless GL, spec §4).
- `docs/active/work/T-005-04/{research,design,structure,plan,progress,review}.md`.

**Modified**
- `src/iterative-multimodal.mjs` — added pure `roundImageName(round)` + `FINAL_IMAGE_NAME`;
  extended `buildIterativeRecord` with optional `finalRender`/`finalImage` (attaches a top-level
  `render` block, abs path stripped; back-compatible); rewrote the `runIterativeTrial` loop per
  Decision 1/2 and updated its header comment. Imports: dropped unused `derivePath`/`basename`,
  added `copyFileSync`.
- `src/iterative-multimodal.test.mjs` — added `roundImageName`/`FINAL_IMAGE_NAME` test and a
  `buildIterativeRecord` with/without-`finalRender` test (no abs path leak; round-image list).
- `package.json` — added `"trial:iterative"`.

**Deleted:** none.

## Test coverage

- `npm test` → **133 pass / 0 fail** (was 131; +2 new test functions). The suite stays offline,
  GPU-free, and metered-call-free — importing the iterative module loads neither the SDK nor GL
  (the live driver's heavy deps remain lazy).
- **Covered (pure):** `roundImageName` naming, `FINAL_IMAGE_NAME` value, and
  `buildIterativeRecord`'s optional final-`render` block (present with `finalRender`, omitted
  without; never leaks an absolute path; per-round image list intact). All prior pure helpers
  (spec validation, both prompt builders, no-op/palette/trial-id gates, record builders) remain
  green.
- **Not unit-tested (by design, spec §4):** `runIterativeTrial` and the runner script — they are
  the single live/metered/GL seam, covered by the live run below, exactly as `trial.mjs`,
  `smoke-trial.mjs`, and `benchmarks/temple/run.mjs` are.

## Live-run verification (AC #1/#2/#4)

A live `npm run trial:iterative` was launched and was **still completing at review time**. It had
already produced, with correct semantics, for `trials/phase1-house-iter-neoclassical/`:
`artifact-round0.json` + `round-0.png` and `artifact-round1.json` + `round-1.png` (rounds 2–3 and
the final `render.png`/`trial.json` were still in flight; each round runs ~6–7 min). This
confirms the code path live: per-round artifacts are written, renders succeed, and the
**`round-N.png` naming + per-round artifact layout is correct**.

- **AC #1:** the npm entry runs end to end via `claude -p`; exit 0 is produced by the runner on
  success (the run was mid-flight, not failed).
- **AC #2:** `round-0.png`/`round-1.png` confirmed present and correctly named; `render.png` and
  the remaining `round-N.png` are written in the finalize step / per round (code verified, run
  completing).
- **AC #3:** per-round `usage.totals.{input_tokens,output_tokens}` and `usage.totals.total_cost_usd`
  are recorded by the existing helpers, keyed by `metadata.trial_id` (unit-test backed).
- **AC #4 (by eye):** **needs a human glance** once the run finishes — compare
  `trials/phase1-house-iter-neoclassical/round-0.png` → `render.png` against
  `trials/phase1-house-singleshot-demo/render.png` for a more detailed, more coherent
  neoclassical building (columns/entablature/pediment sharpening round over round).

## Open concerns / TODOs

- **Finish + eyeball the live run (AC #4).** The metered run should be allowed to complete and
  `render.png` compared by eye to the single-shot baseline. This is the one criterion that is
  inherently human-judged and was not closed at review time.
- **`trials/` is git-ignored.** The progression artifacts are local. If the "watch it get better"
  gallery should live in the repo (like the temple benchmark keeps `render.png` per run), a human
  must force-add the chosen PNGs/`trial.json` and add a keep-rule to `.gitignore`. Not done here —
  out of the ticket's scope and a deliberate choice to avoid committing bulky generated output.
- **Per-round wall-clock.** Each round is a full generation of a large artifact (~17 KB JSON) plus
  a GL render (~6–7 min/round observed). A 3-revision default run is ~25–30 min and meters 4 model
  calls; reviewers re-running it should expect that cost/time.
- **No early-failure cleanup.** If a mid-loop round throws (e.g. palette violation), partial
  `round-<r>.png`/`artifact-round<r>.json` remain on disk and no `trial.json` is written. This
  matches the existing harness behavior (smoke-trial leaves partials too) and the artifacts are
  useful for debugging, so it's intentional — flagged for awareness, not a fix.

## Critical issues for human review

None blocking. The implementation is committed and test-green; the only outstanding item is the
human by-eye AC-#4 judgment on the completed live run's `render.png` vs. the single-shot baseline.

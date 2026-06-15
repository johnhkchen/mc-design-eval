# T-005-04 — Design: iterative-neoclassical-trial-run

Decisions, with rationale grounded in Research. The work splits into two parts: a
**runner script** (clearly missing) and a **fix to the round-image / final-render
semantics** inside `runIterativeTrial` (the only way to satisfy AC #2 honestly).

## Decision 1 — Where the round-image fix lives: in `runIterativeTrial`, not the runner

**Options.**
- (A) Leave `runIterativeTrial` as-is; have the new runner do a final render + rename the
  `<trialId>-rev<n>.png` files to `round-N.png` afterward.
- (B) Fix the loop at the source: render **each round's OUTPUT** once, name it `round-N.png`,
  feed that same file forward into the next revision, and copy the last one to `render.png`.

**Choice: B.** Option A would re-render the final artifact (a second GL pass, wasteful) and
would still leave round 0 unrendered unless the runner re-derived it; renaming model-authored
paths after the fact is fragile. The archetype is the natural owner of "what image represents
round N." Today the loop renders the *input* to each revision (`<trialId>-rev<r>.png` is a
render of round r-1's output) and never renders round N — so the per-round images are
semantically off-by-one and the "watch it get better" final frame is missing entirely. B makes
every round's image mean "the build as it stood after that round," which is exactly the
progression the ticket and S-005 want, and renders each artifact exactly once.

**New loop shape.** Render round 0's draft → `round-0.png` (this PNG is what's fed into round
1's revision). For r=1..N: feed the prior round's PNG, take the revision, render it →
`round-r.png` (fed into r+1). After the loop, the final artifact == the last round's output and
is already rendered; `render.png` is a byte-copy of that last `round-N.png` (no extra GL pass).
This is +1 render vs. today (round 0 now renders) but removes the off-by-one and yields the
final frame for free.

## Decision 2 — Image naming: a new pure helper, leave `derivePath` alone

`derivePath` is unit-tested and is the in-session render tool's path scheme
(`mcp__render__render` revision turns) — changing it would ripple into `render-tool.test.mjs`
and the live tool. Instead add a tiny pure helper `roundImageName(round)` → `round-${round}.png`
to `iterative-multimodal.mjs`, and a `FINAL_IMAGE_NAME = "render.png"` constant mirroring
`smoke-trial.mjs`'s `RENDER_IMAGE_NAME`. The loop builds absolute paths with
`join(dir, roundImageName(r))`. `derivePath` is then unused by the iterative module, so it is
dropped from that module's import (kept where it is still used).

Rejected: importing `RENDER_IMAGE_NAME` from `smoke-trial.mjs` for single-sourcing. It would
couple the archetype to the single-shot module for a one-word constant; a local const with a
"mirrors smoke-trial" comment is lower coupling and the convention ("render.png") is already
de-facto shared via the baseline record format.

## Decision 3 — Record the round-image list + final image in `trial.json` (AC #2/#3)

`buildIterativeRecord` already carries per-round rows; each row's `image` field will now exist
for **every** round (round 0 included), so the round-by-round image list is already in
`record.rounds[*].image`. To make the FINAL image first-class and keep the record consistent
with the single-shot baseline (`trials/phase1-house-singleshot-demo/trial.json` has a top-level
`render: { image: "render.png", bytes, placed, unmapped, bounds }`), extend
`buildIterativeRecord` with two **optional** params `finalRender` (a `RenderReport`) and
`finalImage` (name). When present it attaches a top-level `render` block via the existing
`renderSummary` (absolute path stripped), exactly mirroring `attachRender`. Optional params
keep the existing 26 unit tests green (they don't pass them → block omitted) while letting the
live run populate it.

Per-round token usage (input/output) and `total_cost_usd` are **already** recorded —
`buildRoundRecord` → `tallyUsage` gives each round `usage.turns[*].{input_tokens,output_tokens}`
and `usage.totals`, and `sumTotals` aggregates `total_cost_usd` into `record.usage.totals`. No
change needed for AC #3 beyond the image references above. The record stays keyed by the §5
`trial_id` (identity pulled from the final artifact).

## Decision 4 — The runner script + npm entry (AC #1)

Add `scripts/run-iterative-trial.mjs` mirroring `run-trial.mjs`: import `runIterativeTrial`,
call it with the fixed neoclassical-house spec, print a summary, `process.exit(0/1)`, and on a
`/Claude CLI/` error print the install+login hint. Add `"trial:iterative":
"node scripts/run-iterative-trial.mjs"` to `package.json` scripts.

**Fixed spec.** `target: "house"`, `paletteId: "neoclassical"`, `style: "neoclassical"`,
`trialId: "phase1-house-iter-neoclassical"`, `seed: 7` (matches the unit-suite's iterative
seed), `serverStateId: "flat-creative-superflat.v1"` (same world-state as the baseline),
default rounds (3 → one draft + three render-grounded revisions, four model calls). The
`trialId` is distinct from the baseline so the two sit side by side under `trials/` for the
by-eye AC-#4 comparison.

**Summary print (AC, ticket §"Print a summary").** One block: archetype id + rounds
configured/run + stop reason; then a per-round line — `round N  mode  in=… out=…` from
`record.rounds[*].usage.totals`; then `total cost=$…` from `record.usage.totals.total_cost_usd`
and the final image path (`<dir>/render.png`). This makes the per-round token growth (spec §7/§9:
context grows turn over turn) legible at the console, not just in the JSON.

## Decision 5 — Live-run posture

The runner is LIVE + METERED + needs headless GL, exactly like `run-trial.mjs` /
`bench:temple`, so it is NOT added to `npm test`; only the new pure helpers
(`roundImageName`, extended `buildIterativeRecord`) get unit tests. `npm test` must stay green
and SDK/GL-free. The actual metered run is the demonstrable deliverable and is executed once to
produce the trial store + satisfy AC #4 by eye.

## Rejected alternatives

- **Re-rendering the final artifact separately** (not copying round-N.png): wasteful second GL
  pass for a byte-identical image; copy is correct because round-N.png already *is* the final
  artifact's render.
- **A bespoke per-round `images: []` array on the record**: redundant with `rounds[*].image`;
  would fork the source of truth for the image list.
- **Changing `derivePath`/the in-session tool naming to `round-N`**: out of scope, breaks
  `render-tool.test.mjs`, and conflates the harness loop's renders with the model-invoked tool's.

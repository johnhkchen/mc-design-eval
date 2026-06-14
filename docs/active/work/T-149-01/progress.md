# T-149-01 Progress — re-skin-reverdict

Tracking the deterministic slice (committed here) and the live operator runbook (documented, not run).

## Step 1 — relief-merge helper ✅

- `src/workshop/articulate.mjs`: `realizeWithArticulation(workshopProgram, articulation)` +
  `mergePlacements(skin, relief)`. Empty/no-placement plan ⇒ returns `realizeProgram`'s object
  unchanged (byte-identical, structural no-regression). Facade-present ⇒ folds the plan's proud relief
  onto the skin (last-wins by pos key), recomputes manifest, re-asserts.
- `src/workshop/articulate.test.mjs` AR1–AR6: facade-less byte-identity (real barn program, empty
  plan); facade-bearing relief construction (the brush placements appear, last-wins on overlap);
  per-round idempotence; manifest closure; the `reliefNoRegress` silhouette charter; `mergePlacements`
  front-in-place + append-fresh ordering. **6/6 green.**
- Deviation from structure.md: AR1 asserts byte-identity (the meaningful guarantee) rather than object
  identity — the test calls `realizeProgram` separately, so a `===` object check is the wrong probe;
  AR2 compares each position against the LAST relief placement (applyArticulation may emit overlapping
  brush cells — quoin inside a pilaster face — and the merge is last-wins).

## Step 2 — adopt in seedWorkshopProgram ✅

- `seed.mjs`: destructure `articulation` from `compileProgram`; realize via `realizeWithArticulation`;
  carry the articulation report (additive). Inert on facade-less programs.
- Verify: full `npm test` 2098/2098; `patternbook:repro` + `patternbook:offline` byte-identical for
  cottage + barn; seed + workshop suites green. Commit `9e…` (Step 2).

## Step 3 — adopt in the loop + replay; geometry stays skin ✅

- `loop.mjs:realize`: recompile the plan from `currentSource` each round (re-recognition aware) →
  `realizeWithArticulation`. `replay.mjs`: reconstruct the same articulation from the seed source +
  pinned pack so a relieved build reproduces byte-identically (the essential, non-obvious site).
  `geometry.mjs` left on `realizeProgram` (lever silhouette must exclude relief — `reliefNoRegress`
  charter).
- Verify: `npm test` 2098/2098; `patternbook:repro`/`offline`, `workshop:replay`/`offline`
  byte-identical (the replay path now exercises `compileProgram(source, pack)` on real cottage/barn →
  empty plan → identical). Commit (Step 3).

## Step 4 — milestone:facade successor ✅

- `benchmarks/sculpture/facade-milestone.mjs` (`milestone:facade` / `:baselines` / `:repro`): pure I/O
  over committed gate records; both arithmetics per row; baselines snapshotted pre-rotation; `--repro`
  byte-identical; no model/GL; self-grep clean. `facade-milestone.test.mjs` FM1–FM7 (7/7 via
  `node --test`). Committed records: `facade-baselines.json`, `facade-milestone.json`,
  `pr/assets/facade-milestone.md`. Commit (Step 4).
- Note: `npm test` is `src/**` only (the project tests benchmark runners via their `:repro` script —
  proportion-milestone has no unit test either). The milestone test is run with `node --test
  benchmarks/sculpture/facade-milestone.test.mjs` and the `:repro` script is the committed-bytes gate.

## Step 5 — operator runbook — documented in review.md, NOT executed

The live texture verdict needs `claude -p` + headless GL + the epic's only judge runs
(non-reproducible). The exact command sequence + retired-pin template is in `review.md`. Not run in
this session by design (singular judge runs are not burned speculatively, and a fabricated verdict
would violate "recorded honestly").

## Step 6 — docs ✅

- `design-learnings.md`: appended the "Facade grammar & relief (E-35)" terminal section + E-12 handoff.
- `review.md`: the S-149 handoff + operator runbook.

## Deviations from plan

- Plan Step 3 considered threading articulation only through the loop; research during implement
  showed `replayLedger` ALSO realizes the final — so the replay site was added (essential for the
  byte-identity contract of any future relieved chain). Documented in the commit + learnings.
- The milestone test lives in `benchmarks/` (matching the runner-tested-by-repro convention) rather
  than `src/`, so it is not picked up by `npm test`; the `:repro` script is the CI-equivalent gate.

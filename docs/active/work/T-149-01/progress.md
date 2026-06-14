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

## Step 2 — adopt in seedWorkshopProgram (pending)

## Step 3 — adopt in the loop + geometry decision (pending)

## Step 4 — milestone:facade successor (pending)

## Step 5 — operator runbook (documented in review.md; NOT executed — needs model + GL + the epic's
only judge runs)

## Step 6 — docs (design-learnings E-35 + E-12 handoff; review.md) (pending)

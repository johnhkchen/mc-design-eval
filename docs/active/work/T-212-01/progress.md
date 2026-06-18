# T-212-01 — Progress

**Epic E-55 / Story S-212. The bar.** All plan steps complete. No deviations.

## Done

- **Step 1 — `corpus.json`** ✅ Six climb-states S0–S5 spanning seed colonnade → dressed compound, all
  rule-input fields copied verbatim from the T-211 + T-208 trajectory JSONs. Glance-rank recorded
  (`agent-vision-glance, pending human confirmation`), S4/S5 contestable adjacency named. Routing fields
  corrected after Step-1 verification (M2 = single-pick batch at floor; construct_walls = form move).
- **Step 2 — `experiments/eval-alignment/accept-rule-replay.mjs`** ✅ Imports the *real*
  `acceptsRound`/`acceptsBatch`/`coldStartFloor` from `src/workshop/climb-gate.mjs` (no fork). Reconstructs
  before/after bundles, re-reads each trajectory round for the exact recorded opts, recomputes the decision,
  asserts it equals the recorded `gate.accept`, and computes agreement vs the glance. Exports `loadCorpus`,
  `replayMove`, `agreement` for S-213 reuse. Out of `npm test` (sibling to `picture-climb.mjs`).
- **Step 3 — ran the harness** ✅ → `agreement-report.json`. **Reproducibility PASS** (recomputed ==
  recorded for all 6 moves). **Agreement 2/5 = 40%.** Disagreements: M2 gable, M4 arch (headline,
  `median([8,0,48])=8` discards the 48), M6 compound (stale-closure reject = the T-209-fixed bug;
  T-209-corrected → keep, but only because it was at the floor — the asymmetry).
- **Step 4 — `agreement-report.md`** ✅ The human bar: corpus table, glance-rank, per-move table, the
  headline, the floor-only-batch asymmetry, the S-213 max-aggregator preview, honest limitations.
- **Step 5 — verify** ✅ `npm test` **2438/2438 green** (baseline unchanged). `git status` on
  `src/`/`measurements/`/`benchmarks/` is **empty** — frozen instrument untouched. Zero metered spend.

## Falsifiable claim — result

Claim: the corpus is human-rankable AND the current rule measurably + reproducibly disagrees (discards
the +48 arch). **Held.** Rankable: YES (clear gradient, STOP condition did not fire). Disagrees: YES
(40% agreement; rolls back the gable, the arch, the compound). Reproducible: YES (harness assertion PASS;
median is deterministic). Corpus narrowness (one subject, two unrendered states, cross-trajectory) named,
not hidden.

## Deviations from plan

None. One in-flight correction (M2 routing = batch not per-move; construct_walls isFormMove=true) caught by
the Step-1/Step-3 reproducibility assertion exactly as the plan's R1 mitigation predicted.

## Handed to S-213

The bar (`corpus.json` + the harness + the agreement metric) and the two named seams: non-median
aggregator (the arch/gable) and batch-while-improving (the floor-only asymmetry). The harness's
`aggregatorPreview` shows max-of-votes flips M2/M4 to keep while still rolling back M5 — the candidate to
spike, with the no-rubber-stamp falsification still to run in T-213.

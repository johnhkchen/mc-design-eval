# T-212-01 — Plan: ordered steps + verification

**Epic E-55 / Story S-212.** Sequence the implementation. Each step is independently verifiable; commits
are atomic. No metered spend; `npm test` green throughout (no `src/` change).

## Step 1 — Write `corpus.json`

Author the manifest (`accept-rule-corpus/v1`) with the six states S0–S5 and the moves M1–M5(+the T-208
compound), pulling `scores`/`deptMajors`/`closure`/`evidence` **verbatim** from the two trajectory JSONs.

- **Source of truth:** copy fields from `docs/active/work/T-211-01/trajectory.json` (S0–S4) and
  `docs/active/work/T-208-01/trajectory.json` (S5/the compound). Do not invent numbers.
- **Glance-rank:** record the order `S0<S1<S2<S3<S4<S5`, `source: agent-vision-glance, pending human
  confirmation`, and the `[S4,S5]` contestable adjacency.
- **Verify:** `node -e` loads the JSON, asserts every `state.scores` matches the corresponding trajectory
  round's `scoreAfter.scores` (or round-0 `score` for the seed). Catches transcription drift immediately.

## Step 2 — Write `accept-rule-replay.mjs`

Implement the harness per structure.md: `loadCorpus`, `bundleBefore`/`bundleAfter`, `replayMove` (calls
the real `acceptsRound`/`acceptsBatch` + `coldStartFloor`), `aggregatorPreview`, `agreement`, `main`.

- Import from `../../src/workshop/climb-gate.mjs` (the real rule).
- `median` defined identically to the runner (`xs.sort((a,b)=>a-b)[floor(n/2)]`) for the preview.
- **Reproducibility assertion:** for each move, recompute the decision and compare to the trajectory's
  recorded `gate.accept`. Collect mismatches; exit nonzero if any.
- **No side effects** beyond writing the two report files under the work dir.

## Step 3 — Run the harness → `agreement-report.json`

`node experiments/eval-alignment/accept-rule-replay.mjs`. Inspect stderr summary.

- **Expected:** reproducibility assertion PASSES (recomputed == recorded for every move) — proves the
  disagreement is structural/deterministic, not a fluke.
- **Expected agreement:** current rule agrees on the form moves (close_shell, construct_walls = KEEP,
  matches glance) and **disagrees** on the gable (M2) and the centered arch (M4) — both glance-KEEP,
  rule-ROLLBACK. Headline: `median([8,0,48])=8` discards the 48.
- If the reproducibility assertion FAILS, stop and diagnose (the recorded inputs or the rule drifted) —
  do not paper over; the bar must be sound.

## Step 4 — Write `agreement-report.md`

Author the human bar from the **generated** numbers (never hand-typed results). Sections per structure.md
§report. Lead with the falsifiable verdict (anti-hedge): rankable YES, disagreement reproducible YES,
corpus-narrowness named.

## Step 5 — Verify + commit

- `npm test` → expect the same green count as baseline (2438/2438); confirm `git status` shows **no**
  change under `src/`, `measurements/`, `benchmarks/`.
- `git diff --stat` sanity: only `docs/active/work/T-212-01/*` and `experiments/eval-alignment/accept-rule-replay.mjs`.
- Commit: `docs(T-212-01): rankable corpus + replay harness — current accept-rule disagreement quantified`.

## Testing strategy

| What | How | Why no unit test in the suite |
|---|---|---|
| Corpus integrity | Step-1 `node -e` assertion (scores == trajectory) | One-shot data check; the data is the artifact, not shipped code. |
| Rule reproducibility | Step-3 in-harness assertion (recomputed == recorded) | The harness *is* the test; it's integration evidence (out of suite, like `picture-climb.mjs`). |
| The aggregator math | `median([8,0,48])=8` already verified live in Research §harness | Deterministic, shown. |
| Frozen instrument intact | `git status` clean under `src/`/`measurements/` + `npm test` green | The AC's actual requirement. |

**No new file under `src/` and no new entry in `npm test`** — by design. The harness is creation-loop
tooling (the family of `experiments/eval-alignment/*`), explicitly out of the frozen suite. This is the
same convention T-201/T-205/T-207/T-208 followed for the metered runner.

## Risks & mitigations

- **R1 — after-bundle reconstruction is wrong** (nMajor/wrongStyleBreadth for rolled-back moves). *Mit:*
  the reproducibility assertion catches it — if my reconstruction were wrong, the recomputed decision
  would diverge from the recorded `gate.accept` and the harness exits nonzero. So the assertion is both
  the proof *and* the guard on my reconstruction.
- **R2 — glance-rank disputed by a human** (esp. S4/S5). *Mit:* flagged `pending human confirmation`;
  the contestable adjacency is named and shown not to affect the headline (both are rule-rolled-back
  KEEP-worthy moves).
- **R3 — corpus too narrow to be a fair bar** (one subject, six states, two unrendered). *Mit:* named
  explicitly in the report's "honest verdict"; the rankable core is the four rendered states; S-213's
  contest is still fair because both candidate and current rule face the *same* corpus.
- **R4 — STOP condition** (states not rankable). *Mit:* already assessed in Design — they ARE clearly
  rankable (open colonnade → roofed pale compound is an obvious glance gradient), so the STOP does not
  fire. If Step-1/Step-4 review reversed that, the ticket would stop and report (redirect upstream), per
  the AC — but it does not.

## Definition of done (maps to AC)

- [x→impl] Quality-varied corpus assembled from on-disk T-208/T-211 builds + renders, glance-rank recorded.
- [x→impl] Replay harness runs each through the current rule, reports agreement vs the glance (8/0/48 quantified).
- [x→impl] Recorded honestly: rankable? reproducible? — both answered from generated numbers, not asserted.
- [x→impl] Zero metered spend; `npm test` green; frozen instrument untouched.

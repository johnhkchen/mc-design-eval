# T-213-01 — Plan: ordered, verifiable steps

**Epic E-55 / Story S-213.** Each step is independently committable and verified. Frozen instrument
untouched throughout; the contest runs offline (zero metered spend).

## Step 1 — gate helpers (pure, additive, default-OFF)

Add to `src/workshop/climb-gate.mjs`:
- `VOTE_AGGREGATORS` (frozen): `median`, `max`, `mean`, `trimmedMean` (drop-lowest, mean rest).
- `aggregateVotes(scores, kind="median")`: `[]`→`NaN`; unknown kind→median.
- `BATCH_MODES` (frozen `["floor","improving"]`) + `batchEligible({score,closure,mode,scoreFloor,formReadyThreshold})`:
  `"floor"`→`coldStartFloor`; `"improving"`→`closure ≥ FORM_READY_CLOSURE` at any score.

**Verify:** the change is purely additive — no existing function body edited. `node --check`.

## Step 2 — unit tests (the bar's KEEP + the falsification's REJECT)

Add to `src/workshop/climb-gate.test.mjs` (CG-AGG1–4, CG-BWI1–4 per structure.md). The load-bearing pair:
- **CG-AGG2 (KEEP):** trimmedMean/max/mean keep the M4 arch (`agg([8,8,8])→agg([8,0,48])`, accept/improved).
- **CG-AGG3 (NO-RUBBER-STAMP):** the spike `[40,40,40]→[0,0,48]` — trimmedMean/mean/median REJECT
  (`/regressed/`), **max KEEPS** (the recorded trade).
- **CG-BWI1:** `batchEligible({mode:"floor"})` ≡ `coldStartFloor` (default-OFF identity).
- **CG-BWI3:** off-floor `batchMargin:4` rejects a +2 compound, keeps a +12 (no off-floor rubber-stamp).

**Verify:** `npm test` green (all prior cases + new). This is the AC's "unit-tested in the CG-B2/B8 style".

**Commit 1:** `feat(T-213-01): vote aggregators + batch-while-improving entry (pure, default-OFF) + tests`.

## Step 3 — the contest harness (offline, reuses the S-212 bar)

Create `experiments/eval-alignment/accept-rule-spike.mjs`:
- Import `loadCorpus`, `replayMove`, `agreement` from `accept-rule-replay.mjs`; `aggregateVotes`,
  `batchEligible`, `acceptsRound`, `acceptsBatch`, `CLIMB_DEFAULTS`, `BATCH_DEFAULTS`, `TOOL_DEPARTMENTS` from
  the gate.
- `candidateDecision(move, corpus, {aggregator, batchMode})`: form move → `replayMove`; detail/batch →
  real gate with aggregated `before/after.score` from corpus `scores`.
- `rejectBattery(aggregator)`: M5 + spike + regression; each must ROLL.
- `contest()`: `["median","max","mean","trimmedMean"]`; agreement + reject per candidate; pick the winner.
- `main()`: write `contest-report.json`; stderr table; nonzero only if the winner can't reproduce the corpus.

**Verify:** `node experiments/eval-alignment/accept-rule-spike.mjs` runs, writes the JSON, exits 0. Inspect:
median ≈ 40% (matches the S-212 replay — cross-check), trimmedMean = 100% with reject battery 3/3 PASS,
max = 100% agreement but reject battery FAIL (spike kept).

## Step 4 — the contest report (verdict from the generated numbers)

Write `docs/active/work/T-213-01/contest-report.md` from `contest-report.json` (never hand-fabricated):
the contest table, the monotonic-corpus trap, the winner + reason, the judge-gradient check (no rubber-stamp
needed → not redirected), the S-214 handoff.

**Commit 2:** `docs(T-213-01): accept-rule contest — trimmedMean beats median, no rubber-stamp`.

## Step 5 — runner wiring (opt-in knobs for S-214's re-climb)

Wire `picture-climb.mjs` (default OFF, byte-identical):
- `CLIMB_AGGREGATOR` (default "median") in `scoreBuild`'s `score`.
- `CLIMB_BATCH_MODE` (default "floor") at the batch-entry predicate; off-floor `batchMargin = margin`.

**Verify:** `npm test` still green (runner is out of the glob, but `node --check` it; confirm the import line
resolves). No metered run. Default knobs ⇒ prior climbs re-run unchanged.

**Commit 3:** `feat(T-213-01): wire CLIMB_AGGREGATOR + CLIMB_BATCH_MODE knobs (default OFF) for S-214`.

## Testing strategy

- **Unit (in `npm test`):** the gate helpers — default-OFF identity (CG-AGG1, CG-BWI1), the KEEP cases
  (agreement), the REJECT cases (no-rubber-stamp). This is where correctness is asserted deterministically.
- **Offline contest (out of `npm test`):** `accept-rule-spike.mjs` over the corpus — the agreement numbers
  and the reject battery, written to the report. Cross-checked against the S-212 replay (median ≈ 40%).
- **No integration / metered run.** S-214 owns the actual re-climb with the winning knobs.

## Risks & mitigations

- **Monotonic corpus rewards rubber-stamping (research §1).** → The reject battery is load-bearing and run
  per candidate; the winner must pass it. `max`'s false 5/5 is reported as the cautionary case.
- **mean knife-edge on M2 (+4.0 at margin 4).** → Prefer trimmedMean (+6 robust); report the fragility.
- **Default drift.** → CG-AGG1/CG-BWI1 assert byte-identity to the current median/coldStartFloor before
  anything else.
- **Over-claiming batch-while-improving.** → Reported as a complementary entry-symmetry change with no
  isolated corpus win (the corpus's only compound is at-floor); falsified but not credited as a second win.
- **Spike harness drift from the real gate.** → It calls the *real* `acceptsRound`/`acceptsBatch` and reuses
  the S-212 `agreement()`; form moves go through `replayMove`. No decision logic is re-implemented.

## Definition of done (maps to AC)

- [ ] ≥2 candidates implemented in the gate, pure/opt-in/default-OFF (aggregator family + batch-while-improving).
- [ ] Each scored on the bar AND a deliberately-worse build it must reject (CG-AGG3, CG-BWI3 + reject battery).
- [ ] Contest recorded; winner (trimmedMean + batch-while-improving) picked with reason.
- [ ] Judge-gradient redirect recorded IF every candidate had to rubber-stamp (it didn't — noted explicitly).
- [ ] `npm test` green; frozen instrument untouched.

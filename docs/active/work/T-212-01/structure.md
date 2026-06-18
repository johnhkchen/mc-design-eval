# T-212-01 — Structure: files, interfaces, ordering

**Epic E-55 / Story S-212.** The blueprint. No code here — the shape of the corpus manifest, the replay
harness, and the report, plus what each exposes for S-213.

## Files

| Path | Action | Purpose |
|---|---|---|
| `docs/active/work/T-212-01/corpus.json` | **create** | The rankable corpus manifest (states S0–S5 + glance-ranks). The bar's data. |
| `experiments/eval-alignment/accept-rule-replay.mjs` | **create** | The replay harness. Imports the real rule; reads `corpus.json`; emits the agreement report. Out of `npm test` (sibling to `picture-climb.mjs`). |
| `docs/active/work/T-212-01/agreement-report.json` | **create (generated)** | Machine output of the harness: per-move glance vs rule, agreement fraction, reproducibility assertion result. |
| `docs/active/work/T-212-01/agreement-report.md` | **create** | Human-readable bar: the corpus table, the glance-rank, the disagreements quantified, the honest verdict. |
| `src/**`, `measurements/**`, `benchmarks/**` | **untouched** | Frozen instrument + scorer unchanged. No new test. `npm test` green by construction. |

No source file under `src/` is created or modified — the harness *imports* `src/workshop/climb-gate.mjs`,
it does not change it.

## `corpus.json` — schema

```jsonc
{
  "schema": "accept-rule-corpus/v1",
  "subject": "gatehouse",
  "concept": "benchmarks/sculpture/runs/015-…/concept.png",
  "glanceRank": {                       // recorded glance, source flagged
    "source": "agent-vision-glance, pending human confirmation",
    "order": ["S0","S1","S2","S3","S4","S5"],   // worst → best
    "contestableAdjacencies": [["S4","S5"]]
  },
  "states": [
    {
      "id": "S0",
      "label": "seed open colonnade",
      "rank": 1,                        // 1 = worst
      "render": "docs/active/work/T-211-01/beside-first.png",
      "renderless": false,
      "source": { "trajectory": "docs/active/work/T-211-01/trajectory.json", "round": 0 },
      "scores": [0,0,0],
      "medianScore": 0,
      "evidence": { "nMajor": 4, "wrongStyleBreadth": 2 },
      "deptMajors": { "ROOF":1, "WALL":2, "OPENING":1 },
      "closure": 0.667
    }
    // … S1–S5
  ],
  "moves": [                            // the applied transitions to replay
    {
      "id": "M1", "tool": "close_shell", "from": "S0", "to": "S1",
      "trajectory": "…T-211…", "round": 1,
      "glanceVerdict": "keep"           // derived: rank(to) > rank(from)
    }
    // … one per applied round across T-211 + the T-208 compound
  ]
}
```

`evidence`/`deptMajors`/`closure` carry exactly the fields `acceptsRound`/`acceptsBatch` consume, copied
verbatim from the trajectory JSONs (single source of truth — the harness can also re-read the trajectory
to cross-check). `glanceVerdict` per move is *derived* from the ranks (kept in the file for readability,
recomputed and verified by the harness).

## `accept-rule-replay.mjs` — interface

Pure-ish ESM script (reads JSON, no GL, no LLM, no network). CLI:

```
node experiments/eval-alignment/accept-rule-replay.mjs [--corpus <path>] [--json <out>] [--md <out>]
```

Defaults: corpus = `docs/active/work/T-212-01/corpus.json`; writes the JSON + MD reports beside it.

**Internal shape (functions, top-down):**

- `loadCorpus(path)` → `{states, moves, glanceRank}` (states keyed by id).
- `bundleBefore(state)` / `bundleAfter(move, states)` → the `{score, scores, nMajor, wrongStyleBreadth}`
  evidence bundles the rule needs. `nMajor`-after = `sum(deptMajorsAfter)` (Research §5); `wrongStyleBreadth`
  carries forward when not separately recorded (documented in a comment, with the reason).
- `replayMove(move, states)` → `{ ruleDecision, recordedDecision, glanceVerdict, reason, reproducible }`.
  Calls the *real* `acceptsRound` (or `acceptsBatch` for the batch move, gated by `coldStartFloor`) with
  the reconstructed opts, then compares to the move's recorded `gate.accept` from the trajectory.
- `aggregatorPreview(scores, aggregator)` → the decision a `max`/`mean` aggregator *would* make on the
  recorded votes (clearly labelled "S-213 preview"). Read-only illustration; not the deliverable.
- `agreement(results)` → `{ matches, total, fraction, disagreements: [...] }`.
- `main()` → builds `agreement-report.json`, prints a summary table to stderr, returns nonzero only on a
  *reproducibility* failure (a recomputed decision that disagrees with the recorded one — that would mean
  the corpus or the rule drifted, and the bar is invalid).

**What it exports for S-213** (so the spike reuses the bar, not a fork): the module also
`export`s `replayMove`, `agreement`, and `loadCorpus`, so S-213's candidate-rule harness can `import`
them and swap the aggregator/accept function, judged against the *same* corpus + the *same* agreement
metric. This is the "specify the bar crisply so the contest is fair" requirement.

## `agreement-report.md` — sections (the human bar)

1. **The corpus** — the six states table with renders + scores + ranks.
2. **The glance-rank** — order, the S4/S5 contestable adjacency, the "is it rankable?" verdict (YES).
3. **Current-rule agreement** — per-move glance vs rule, the fraction, the disagreements listed.
4. **The headline** — `8/0/48` arch + `[0,12,0]` gable: median discards the minority, deterministic.
5. **The floor-only-batch asymmetry** — S5 reported both ways (stale vs T-209-corrected closure).
6. **Honest verdict** — rankable? reproducible? corpus too narrow? (the three AC questions answered).
7. **Handoff to S-213** — the bar + how to import the harness; the candidate hypotheses (max-aggregator,
   batch-while-improving) the disagreements point at.

## Ordering of changes

1. `corpus.json` (data first — it is the bar).
2. `accept-rule-replay.mjs` (the harness over the data).
3. Run the harness → `agreement-report.json` (generated evidence).
4. `agreement-report.md` (write the human verdict from the generated numbers — never hand-fabricated).
5. `npm test` (confirm green; no src touched) + commit.

## Boundaries / invariants

- **Determinism:** the harness has no `Date.now`/`Math.random`/network — same corpus → same report.
- **Frozen instrument:** imports `climb-gate.mjs` read-only; touches nothing under `measurements/`.
- **No metered spend:** all inputs are committed; the only "judgement" is the recorded human/vision rank.
- **Fail-loud:** if a recomputed decision ≠ the recorded one, the harness exits nonzero and the report
  flags it — a silently-drifted bar is worse than no bar.

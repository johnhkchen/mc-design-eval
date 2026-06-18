# T-213-01 — Structure: files, interfaces, ordering

**Epic E-55 / Story S-213.** The blueprint. The shape of the gate helpers, the runner wiring, the contest
harness, and the report — no code here.

## Files

| Path | Action | Purpose |
|---|---|---|
| `src/workshop/climb-gate.mjs` | **modify** (additive) | Add `VOTE_AGGREGATORS`, `aggregateVotes`, `batchEligible`. Pure, exported, default-OFF. Existing fns untouched. |
| `src/workshop/climb-gate.test.mjs` | **modify** (additive) | `CG-AGG#` (aggregator: keep + no-rubber-stamp) and `CG-BWI#` (batch-while-improving: entry + reject) cases. In `npm test`. |
| `experiments/eval-alignment/accept-rule-spike.mjs` | **create** | The contest. Imports the S-212 bar (`loadCorpus`/`replayMove`/`agreement`) + the gate; scores each candidate; runs the reject battery; writes the report. OUT of `npm test`. |
| `docs/active/work/T-213-01/contest-report.json` | **create (generated)** | Machine output: agreement per candidate, the reject battery, the winner. |
| `docs/active/work/T-213-01/contest-report.md` | **create** | Human verdict: the contest table, the winner + reason, the judge-gradient check, the S-214 handoff. |
| `src/**` (scorer), `measurements/**`, `benchmarks/**` | **untouched** | Frozen instrument unchanged. |

## `climb-gate.mjs` — new exports (additive, pure)

```js
// Vote aggregators (T-213-01). The gate consumes a single .score scalar; today the runner passes the MEDIAN
// of the per-vote scores. These are the candidate aggregators S-213 contests, opt-in via the runner's
// CLIMB_AGGREGATOR knob (default "median" → byte-identical). PURE; the gate functions are UNCHANGED — the
// aggregator only decides which scalar the caller passes as before.score/after.score.
export const VOTE_AGGREGATORS = Object.freeze({
  median:      (xs) => [...xs].sort((a,b)=>a-b)[Math.floor(xs.length/2)],
  max:         (xs) => Math.max(...xs),
  mean:        (xs) => xs.reduce((a,b)=>a+b,0) / xs.length,
  trimmedMean: (xs) => { const s=[...xs].sort((a,b)=>a-b).slice(1); return s.length ? s.reduce((a,b)=>a+b,0)/s.length : [...xs][0]; },
});
export function aggregateVotes(scores, kind = "median") { … }   // [] → NaN; unknown kind → median

export const BATCH_MODES = Object.freeze(["floor", "improving"]);
export function batchEligible({ score, closure, mode = "floor", scoreFloor, formReadyThreshold } = {}) { … }
//   mode "floor"     → delegates to coldStartFloor (byte-identical to T-208)
//   mode "improving" → eligible on ANY closed form (closure ≥ threshold), any score
```

- `aggregateVotes("median")` over the same array must equal the runner's existing `median` for any input, so
  the default path is provably byte-identical (asserted in a test).
- `batchEligible({mode:"floor"})` must equal `coldStartFloor` for the same inputs (asserted).
- No mutation of inputs; no `Date.now`/`Math.random`/I/O.

## `climb-gate.test.mjs` — new cases

- **CG-AGG1** — `VOTE_AGGREGATORS.median` ≡ the runner's median for `[0,12,0]`, `[8,0,48]`, `[8,8,8]` (the
  default-OFF byte-identity guard).
- **CG-AGG2** — KEEP: with `trimmedMean`, the M4 arch keeps. `acceptsRound({score:agg([8,8,8])},{score:agg([8,0,48])},{margin:4})`
  → accept, reason `/improved/`. Same for `max` and `mean`.
- **CG-AGG3** — NO-RUBBER-STAMP (the falsification, CG-B2 style): the spike `[40,40,40]→[0,0,48]`.
  `trimmedMean`/`mean`/`median` → REJECT (`/regressed/`); `max` → KEEP — the documented trade, asserted so the
  rubber-stamp is a recorded fact, not a footnote.
- **CG-AGG4** — `aggregateVotes([], k)` → `NaN`; unknown kind → median; single-element array stable.
- **CG-BWI1** — `batchEligible({mode:"floor"})` ≡ `coldStartFloor` across the CG-coldStart fixtures (off
  floor, open form, NaN, configurable floor) — default-OFF byte-identity.
- **CG-BWI2** — `batchEligible({mode:"improving", score:8, closure:1.0})` → true (off the floor, closed) where
  floor mode is false; open form (`closure 0.6`) → false; NaN closure → false (fail-safe).
- **CG-BWI3** — NO-RUBBER-STAMP: off the floor with `batchMargin:4`, a +2 compound (`{score:8}→{score:10}`)
  is REJECTED by `acceptsBatch` ("compound tie at floor — no read"); a +12 compound is KEPT. Proves the
  off-floor margin stops the +1 rubber-stamp the ticket warns of.
- **CG-BWI4** — `BATCH_MODES` frozen + shape sanity.

## `accept-rule-spike.mjs` — interface

Pure ESM (reads JSON, no GL/LLM/network). CLI:
```
node experiments/eval-alignment/accept-rule-spike.mjs [--corpus <path>] [--json <out>] [--md <out>]
```
Defaults: corpus = `…/T-212-01/corpus.json`; reports → `…/T-213-01/contest-report.{json,md}`.

Functions (top-down):
- `candidateDecision(move, corpus, { aggregator, batchMode })` → `{ ruleDecision, reason }`. Form move →
  `replayMove` (aggregator-invariant). Detail/batch move → real `acceptsRound`/`acceptsBatch` with
  `before/after.score = aggregateVotes(state.scores, aggregator)`, plus the corpus's dept/closure fields.
- `agreementFor(corpus, candidate)` → reuse imported `agreement()` over the candidate's per-move decisions.
- `rejectBattery(aggregator)` → the no-rubber-stamp set: M5 (`[8,8,8]→[8,0,0]`), spike (`[40,40,40]→[0,0,48]`),
  regression (`[8,8,8]→[2,2,2]`); each must ROLL. Returns `{passed, results}`.
- `contest()` → for `["median","max","mean","trimmedMean"]` × batch modes: `{agreement, reject}`. Picks the
  winner = max agreement among candidates whose reject battery fully passes; ties → most robust margin.
- `main()` → writes `contest-report.json`, prints the table to stderr, exits nonzero only if the WINNER fails
  reproducibility against the corpus (a drifted bar).

Exports `candidateDecision`, `rejectBattery`, `contest` so S-214 imports the winner's evaluation, not a fork.

## `contest-report.md` — sections

1. **The contest** — agreement per candidate vs the current median, the reject battery beside it.
2. **The monotonic-corpus trap** — why agreement alone is insufficient; `max`'s false 5/5 → the spike.
3. **The winner + reason** — trimmedMean (+ batch-while-improving complement); the trade `max` loses.
4. **Judge-gradient check** — did any passing candidate require rubber-stamping? (No → not redirected.)
5. **Frozen instrument** — untouched; the change is aggregate/accept, not scoring.
6. **Handoff to S-214** — the env knobs (`CLIMB_AGGREGATOR`, `CLIMB_BATCH_MODE`) + the winner to re-climb.

## Runner wiring — `picture-climb.mjs` (opt-in, default OFF)

- Import `aggregateVotes`, `batchEligible` (extend line 50).
- `const AGG = process.env.CLIMB_AGGREGATOR || "median";` and in `scoreBuild` set
  `score: AGG === "median" ? med.score : aggregateVotes(scores, AGG)` (items/ev still from the median sample).
- `const BATCH_MODE = process.env.CLIMB_BATCH_MODE || "floor";` line 777 →
  `batchEligible({ score: prev.score, closure, mode: BATCH_MODE, scoreFloor: SCORE_FLOOR })`; pass
  `batchMargin = coldStartFloor({…}) ? BATCH_DEFAULTS.batchMargin : margin` to the line-812 `acceptsBatch`.
- All defaults reproduce the current bytes; the contest itself runs offline (zero spend) — the runner change
  is the S-214 lever, verified only by the default-identity unit tests here.

## Ordering of changes

1. `climb-gate.mjs` helpers + `climb-gate.test.mjs` cases → `npm test` green (default-identity proven first).
2. `accept-rule-spike.mjs` → run → `contest-report.json` (generated evidence).
3. `contest-report.md` (verdict from the generated numbers, never hand-fabricated).
4. Runner wiring (opt-in knobs) → `npm test` still green (no metered run).
5. Commit.

## Invariants

- **Default-OFF byte-identity** — `aggregateVotes(_, "median")` ≡ median; `batchEligible({mode:"floor"})` ≡
  `coldStartFloor`; runner defaults unchanged. Unit-tested, not asserted.
- **Frozen instrument** — no scorer/`measurements/` edit.
- **No metered spend** — contest is offline over the corpus.
- **Fail-loud** — spike exits nonzero if the winner can't reproduce the corpus.

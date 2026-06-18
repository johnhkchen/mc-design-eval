# T-213-01 — Research: the accept-rule spike, mapped

**Epic E-55 / Story S-213.** Descriptive map of the code the spike touches and the bar it is judged against.
The S-212 bar (`docs/active/work/T-212-01/`) is the fixed measuring stick; T-213 implements ≥2 candidate
accept-rules, judges each by agreement with the glance-rank, and falsifies against a deliberately-worse build.

## 1. The bar (T-212-01, committed 5f936a6)

- **`corpus.json`** — `accept-rule-corpus/v1`. Six states S0–S5 (worst→best), six applied moves M1–M6. Each
  state carries `scores` (the 3 per-vote DiagnoseBuild reads), `medianScore`, `evidence.{nMajor,
  wrongStyleBreadth}`, `deptMajors`, `closure`. Each move carries `kind` (`per-move`|`batch`),
  `isFormMove`, `from`/`to`, `recordedDecision`, `glanceVerdict`, and the disagreement note.
- **`accept-rule-replay.mjs`** — the harness. Exports `loadCorpus`, `replayMove`, `agreement`,
  `aggregatorPreview`. Recomputes the CURRENT rule's decision via the *real* `acceptsRound`/`acceptsBatch`
  and asserts it equals the recorded `gate.accept` (reproducibility PASS). Pure: no GL/LLM/network.
- **`agreement-report.{json,md}`** — current rule agrees with the glance on **2/5 = 40%** (M5 excluded).
  It rolls back three glance-KEEP moves: **M2** gable `[0,12,0]`, **M4** arch `[8,0,48]` (the headline),
  **M6** compound `[20,20,0]` (under the recorded *stale* closure — T-209-corrected it KEEPS).

### The disagreements, by mechanism (from the report)
- **M2** `apply_gable_roof`, kind=batch, at floor. Compound `median([0,12,0])=0`, delta 0 → "compound tie
  at floor — no read" → ROLL. The 12 (one judge saw the roof) is discarded.
- **M4** `rebuild_arch`, kind=per-move, OFF floor. `median([8,0,48])=8`, before 8 → delta 0 → tie-zone, no
  coverage shrink → ROLL. **The headline:** the centered arch — the gatehouse's defining feature — is thrown
  away because the lone 48 is discarded. Deterministic: `median([8,0,48])` is always 8.
- **M6** `batch[gable+arch+relief]`, at floor. Under T-209-corrected closure the batch ACCEPTS (compound +20
  off the floor) — **but only because it was reached AT the score floor**. The same dressing reached OFF the
  floor (M4-style per-move) is rolled back. The **floor-only-batch asymmetry**.

### CRITICAL corpus property (anti-hedge trap)
The corpus is **monotonic** — S0<S1<…<S5, every applied move except M5 is glance-KEEP. So an **all-KEEP rule
scores 5/5 by rubber-stamping.** Agreement-on-the-corpus *alone cannot* distinguish a good rule from "keep
everything." The **no-rubber-stamp falsification is therefore load-bearing**, not a checkbox: a candidate
must keep the arch AND reject a build that is genuinely worse. M5 (the one in-corpus glance-ROLL, excluded
from the fraction) plus synthetic worse-build fixtures are the reject set the contest turns on.

## 2. The gate under test — `src/workshop/climb-gate.mjs` (PURE, in `npm test`)

The module supplies the climb's *decisions* (no GL/LLM/I/O). Relevant surface:

- **`acceptsRound(before, after, opts)`** — per-move keep/roll. Computes `delta = after.score - before.score`.
  Branches in order: form-move routing (closure-decided when `isFormMove` + form gap) → `delta ≥ margin`
  ("improved") → department-dominant override → form-credit → `delta ≤ -margin` ("regressed") → tie-zone
  (coverage shrink) → reject. **`after.score`/`before.score` are SCALARS** — the caller (runner) passes the
  **median** of the per-vote `scores`. The gate never sees the raw votes.
- **`acceptsBatch(before, after, opts)`** — compound keep/roll at the cold-start floor. Guards: form-integrity
  (no reopen) → `delta < 0` regressed → added-major → `delta ≥ batchMargin` ("off the floor") → dept-dominant
  → "compound tie at floor — no read". Same scalar `.score` contract.
- **`coldStartFloor({score, closure, scoreFloor, formReadyThreshold})`** — batch ENTRY predicate: true iff
  `score ≤ scoreFloor` AND `closure ≥ FORM_READY_CLOSURE`. **This is the floor-only gate** — the runner only
  batches when this is true (line 777).
- **Constants:** `CLIMB_DEFAULTS.margin = 4`, `BATCH_DEFAULTS = {batchSize:4, scoreFloor:0, batchMargin:1}`,
  `FORM_READY_CLOSURE = 0.9`. `closureDecidedMove(tool)` selects wall-shell form moves (M1/M3) → decided on
  closure alone, **aggregator-invariant**.

### Where the median actually lives
The median is computed in the **runner**, not the gate: `experiments/eval-alignment/picture-climb.mjs:96`
`const median = (xs) => [...xs].sort((a,b)=>a-b)[Math.floor(xs.length/2)]`, applied in `scoreBuild`
(line 558–560): `const scores = samples.map(s=>s.score); const med = samples.find(s=>s.score===median(scores))`,
returning `{ ...med.ev, score: med.score, scores, ... }`. **The `.score` the gate consumes is the median of
`scores`.** So the **non-median aggregator candidate is purely a change to which scalar the runner derives
from `scores`** — the gate functions need not change at all for the aggregator to take effect. This is the
key seam: implement the aggregators as pure exported helpers; the gate stays byte-stable.

## 3. The runner — `experiments/eval-alignment/picture-climb.mjs` (metered, OUT of `npm test`)

- Imports the gate (line 50). `median` local (line 96). Env knobs already follow the opt-in/default-OFF
  pattern: `CLIMB_MAX_ROUNDS`, `CLIMB_BATCH_SIZE` (default 0 = OFF), `CLIMB_SCORE_FLOOR`, `GUARD_ONLY`.
- **Batch entry (line 777):** `if (BATCH_SIZE > 0 && coldStartFloor({ score: prev.score, closure, scoreFloor: SCORE_FLOOR }))`
  — the floor-only gate. Batch-while-improving relaxes THIS predicate.
- **Compound judged (line 812):** `acceptsBatch(prev, compound, {…, closureBefore: closure, closureAfter})`.
- **Per-move judged (line 878):** `acceptsRound(prev, candScore, {margin, …, isFormMove: closureDecidedMove(pick.tool)})`.
- `scoreBuild` (line 528) is where `score` is set from the votes — the aggregator wires in here.

The runner is metered (calls `claude -p`); the contest must NOT re-run it. The spike judges candidates
**offline over the corpus** (zero spend), exactly as the S-212 replay does.

## 4. The test conventions — `src/workshop/climb-gate.test.mjs`

`node:test` + `assert/strict`. ~50 cases. Naming: `CG#` (round), `CG-FR#` (form-ready), `CG-FC#`
(form-credit), `CG-FS#` (form-stability), `CG-B#` (batch), `CG-coldStart#`. **The falsification style the
ticket cites — CG-B2 / CG-B8** — asserts the gate REJECTS a deliberately-bad compound (added-major,
reopened-form) on a picture gain. New candidates follow this: a KEEP test (agrees with glance) AND a
REJECT test (no-rubber-stamp). Every `TOOL_DEPARTMENTS`/`TOOL_STAGE` entry is asserted, and `BATCH_DEFAULTS`
frozen-shape is checked — additions must keep those green.

## 5. Constraints / assumptions

- **Frozen instrument untouched.** The contest changes how the climb *aggregates/accepts*, never how
  `DiagnoseBuild` *scores*. No `measurements/**`, no `benchmarks/**`, no scorer edit.
- **Pure, opt-in, default OFF.** New gate helpers must not alter any existing-caller output: the default
  ("median", batch mode "floor") must be byte-identical, so every prior climb re-runs unchanged.
- **Determinism.** The spike harness, like the replay, has no `Date.now`/`Math.random`/network — same corpus
  → same contest report.
- **Before-scores availability.** A consistent aggregator needs the per-vote arrays for BOTH endpoints. The
  corpus states carry `scores` for every state, so the spike sources both from `corpus.json` (single source
  of truth) — cleaner than re-deriving from the trajectory (which records only the median per round).
- **Net-minor guard data.** The corpus carries `deptMajors` but not per-dept `{major,minor}` items; the
  dept-dominant net guard degrades to majors-only on the corpus. Moot for M2/M4: with a non-median
  aggregator they keep via `delta ≥ margin` before the override is consulted.

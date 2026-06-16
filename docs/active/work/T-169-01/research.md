# T-169-01 Research — crater re-run, corpus agreement, promotion recommendation

Descriptive map of what exists and how it connects. The referee for the style-distance term
(T-168-01), on the S-167 corpus (T-167-01). E-40 / S-169.

## What this ticket consumes (the two upstream deliverables)

### The scoring core — `src/workshop/bakeoff-score.mjs` (T-168-01, landed)
- `styleFidelityScore(critique)` — the 0-100 scalar. Now two terms:
  - missing-element severity (unchanged from E-39): each `absent`/`match` item subtracts
    `PENALTY[severity]` (major 20 / minor 8);
  - **style-distance (new)**: each `wrong-style` item subtracts `PENALTY.major + WRONG_STYLE.distance`
    (32) **and** caps the whole score at `WRONG_STYLE.cap` (40).
- `itemStyleClass(item)` — the PURE STRUCTURAL classifier. Reads only emptiness of the
  expected/present/missing triple:
  - `present` non-empty **and** `missing` non-empty ⇒ `"wrong-style"` (capping)
  - `present` empty ⇒ `"absent"`
  - `present` non-empty, `missing` empty ⇒ `"match"`
  - a typed `kind: "add"|"replace"|"remove"` short-circuits the structural read (forward-compat; the
    tag does not exist in `department.baml` yet — it is the scoped E-39 schema feedback).
- `critiqueEvidence(critique)` — the harness evidence bundle: `score, nItems, nMajor, departments,
  missing` (E-39) + `nWrongStyle, wrongStyleCapped` (E-40 additive). **Does NOT persist `present`** —
  the field the new classifier keys on is not in the saved evidence. This is why the E-39 votes cannot
  be re-scored offline: re-deriving the new term needs a live re-run.
- `dispatchCorrectness(rows)` / `worstDepartmentOfDispatch` / `worstDepartmentOfFusedReply` /
  `regionToDepartment` — the split-vs-fused bake-off referee (E-39 claim 1), unchanged by E-40.
- `PENALTY = {major:20, minor:8}`, `WRONG_STYLE = {cap:40, distance:12}` — single-sourced constants.

### The labeled corpus — `experiments/eval-alignment/corpus/defect-corpus.json` (T-167-01, landed)
Loaded by `src/workshop/defect-corpus.mjs` (`loadDefectCorpus`, `singleStates`, `pairStates`,
`statePaths`, `assertSemantics`). 8 states:
- **4 single** (worst-construction-department ground truth): `barn-roofless` (ROOF/high),
  `barn-holey-walls` (WALL/medium), `cottage-plain-upper` (WALL/medium),
  `gatehouse-gaping-gate` (OPENING/medium).
- **4 pair** (`moreFaithful` ground truth, all `"matched"`, **all confidence `high`**):
  `gatehouse-vs-arc`, `gatehouse-vs-chapelle`, `cottage-vs-arc`, `cottage-vs-chapelle`.
- `excluded[]` logs the contested/ambiguous cases that were deliberately kept out — including
  `cottage-cream-vs-pink` (the sub-threshold same-style wobble) and `massing-proportion-axis`.

**Consequence for AC #2:** the corpus has **no contested pairs** (the contested one was excluded as
noise). "Agreement on the contested middle, separately from the easy pairs" can therefore only report
the easy bucket as populated and the contested bucket as empty — itself an honest finding, not a gap to
paper over.

## The two precedent harnesses (the ticket says "build on")

### `experiments/eval-alignment/clean-wrong-style.mjs` (claim-2 crater, E-39)
- 4 conditions on a FIXED clean gatehouse build (`builds/gatehouse/new-roof`, 4 azimuths) + a FIXED
  synthetic gatehouse PROGRAM: `A-matched` (rustic concept + rustic pack), `B-arc` (arc-A classical +
  guildhall pack), `B2-chapelle` (gothic + guildhall), `C-control` (arc-A + rustic pack).
- Per condition: `VOTES=2` DiagnoseBuild calls via `runTieredOp({tier:"strong"})` over the `claude -p`
  shim, parsed by `bamlParse`, scored by `critiqueEvidence`. Writes beside-concept PNGs (no GL —
  `decodeImage` + `pngjs`) FIRST so evidence survives a stopped run; asset-guards before any spend.
- **E-39 baseline result** (`results/clean-wrong-style.json`): A=52, B=46, B2=40, C=58. Spread A−B=6,
  **inside** the ±12 noise ⇒ verdict "DID NOT CRATER" under the severity-only scalar.

### `experiments/eval-alignment/bakeoff.mjs` (claim-1 dispatch, E-39)
- 2 states (`barn-r1` ROOF, `cottage-newroof` WALL), `VOTES=3`, split (DiagnoseBuild→RouteCritique→
  `resolveDispatch`) vs fused (CritiqueWorkshopRound→region→`regionToDepartment`).
- **E-39 baseline result** (`results/bakeoff.json`): split 3/6, fused 6/6 ⇒ "FUSED WINS". Cottage split
  mis-routed WALL→CHIMNEY all 3 votes.

## Live model path — PROBED, available
- `runTieredOp` reaches `claude -p` via `src/sdk-binding.mjs`; model `claude-opus-4-8`, `tier:"strong"`.
- Text probe: `PROBE_OK` in ~3s. Image diagnose probe (1 vote, gatehouse A-matched + B-arc): returned
  parseable Critiques in ~15s each. **The path is live and metered.**

## The load-bearing live observation (from the diagnose probe — drives Design)
On live Layer A output, **every** divergent department item carries BOTH a non-empty `present` (what
the build has) AND a non-empty `missing` (what the style wants) — the model's diagnostic register is
"here is what's there, here is what's absent" for each item. So `itemStyleClass` returns `"wrong-style"`
for **nearly every item**, including the MATCHED condition:
- `A-matched` (clean gatehouse vs its own rustic concept): score **4** — every item classed wrong-style.
- `B-arc` (same build vs classical arc-A): score **0**.

The new term therefore does not produce a *crater* (matched ≫ wrong); it **collapses both to the
floor** (4 vs 0, a 4-pt gap deep inside the ±12 noise). This is failure mode **F1** (BO11's pin:
present-but-detail-incomplete is structurally indistinguishable from wrong-material replace) realized at
full scale, and **F3** (the live read does not distinguish matched from wrong via emptiness).

## Constraints & boundaries
- `experiments/` is creation-loop, editable; **not** under the `measurements/` frozen prefix → no
  pin-guard. The frozen instrument is untouched by this ticket (AC).
- `critiqueEvidence` did not persist `present` ⇒ the re-run must capture full items for audit.
- Spend is metered; probe-before-spend is the rule (memory: zero-token notice replies burn re-ask
  budget). Asset-guard before every spend (both precedents do).
- `npm test` runs `src/**/*.test.mjs`; the harness lives in `experiments/` and is not in the glob — any
  new PURE decision logic should live in `bakeoff-score.mjs` with a unit test to stay single-sourced.

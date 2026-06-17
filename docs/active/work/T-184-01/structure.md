# T-184-01 — Structure

File-level blueprint. One new PURE module + its test (in `npm test`), one pair-set data file, one
instrument-builder script (GL-free, model-free), one metered harness, the generated instrument + results +
report. Nothing under `measurements/`. Mirrors the `defect-corpus.mjs` / `corpus-referee.mjs` split exactly.

## Created — pure core (in `npm test`)

### 1. `src/workshop/style-agreement.mjs` (new) — the agreement + decomposition arithmetic
PURE (no GL/IO/model/Date/random; `src/**/*.test.mjs` glob). Imports nothing from `bakeoff-score.mjs` at
runtime except the `styleFidelityScore` consumers pass scores IN — actually it takes already-computed scores,
so it has **no** import of the scorer (keeps it pure data-math; the harness joins scores↔pairs). Exports:

- `DESIGN_CELL(state)` → `{pack:"matched"|"foreign", picture:"right"|"wrong"}` | `null` for hard-middle.
  Pure mapping from `cellType` + `pack` basename: match/wrong-pack-right-picture ⇒ picture right;
  same-pack-wrong-picture/cross ⇒ picture wrong; pack ends `rustic.json` ⇒ matched, else foreign.
- `packVsConceptDecomposition(scoredStates)` — `scoredStates` = `[{id, subject, cellType, pack, score}]`.
  Buckets by `DESIGN_CELL`; returns `{cells:{matchedRight, matchedWrong, foreignRight, foreignWrong}:{n,mean,
  ids}, conceptImageEffect, packEffect, perSubject:{...}, verdict}`. `conceptImageEffect = matchedRight.mean −
  matchedWrong.mean`; `packEffect = matchedRight.mean − foreignRight.mean`. `verdict`: "PACK-DRIVEN" if
  packEffect > conceptImageEffect + NOISE; "PICTURE-DRIVEN" if conceptImageEffect > packEffect + NOISE; else
  "MIXED/INSEPARABLE". `NOISE` is a param (default 12, the project band), single-sourced.
- `termPairVerdict(pair, scoreById)` → `"A"|"B"|"tie"` (argmax score; equal ⇒ tie).
- `pairwiseAgreement(pairs, scoreById, labelById /*pairId→"A"|"B"|"tie"*/)` → `{overall, byBucket:{easy,
  hardMiddle}}` each `{n, agree, rate, pairs:[{id, bucket, termPick, label, termScoreA, termScoreB, agree}]}`.
  agree: mutual tie ⇒ agree; one tie one decisive ⇒ disagree; both decisive ⇒ equal picks.
- `interLabelAgreement(perPairVotes /*pairId→["A","B",...]*/)` → per-pair majority fraction + bucketed means;
  `{byBucket, overall, verdict}` — verdict "ILL-POSED (low self-consistency on the hard middle)" when
  hardMiddle mean fraction < a threshold (param, default 0.67), else "LABELABLE". This is the proxy
  self-consistency stand-in; the harness flags it non-human.
- `rankConcordance(pairs, scoreById, labelById)` — concordant/discordant pair count → a τ-like
  `(C−D)/(C+D)` over the labeled decisive pairs (the rank-correlation the AC names). Reported beside accuracy.
- `recommendation({decomposition, agreement, interLabel, licensing})` → `{go:boolean|null, label, rationale}`
  encoding the design's verdict map: DO-NOT-PROMOTE if PACK-DRIVEN; ill-posed if interLabel ILL-POSED; not
  validated if easy≫hardMiddle agreement; GO-LEANING if PICTURE-DRIVEN + hard-middle agreement clears bar —
  but `go` is forced `null` (recommend-only) when `licensing===false` (proxy can refute, not license).

### 2. `src/workshop/style-agreement.test.mjs` (new) — in `npm test`
Pure unit tests on synthetic inputs (no model, no corpus IO):
- SA1: `DESIGN_CELL` maps each cellType+pack correctly; hard-middle ⇒ null.
- SA2: `packVsConceptDecomposition` — a PACK-DRIVEN fixture (foreignRight tanks, matchedWrong stays high) →
  packEffect ≫ conceptImageEffect → "PACK-DRIVEN"; a PICTURE-DRIVEN fixture → inverse; empty foreignRight cell
  handled (mean null, effect null, not NaN).
- SA3: `pairwiseAgreement` — buckets split; tie semantics (mutual tie agrees, asymmetric tie disagrees);
  easy/hardMiddle reported separately; rates correct.
- SA4: `interLabelAgreement` — unanimous votes ⇒ fraction 1.0 "LABELABLE"; split votes on the hard middle ⇒
  low fraction "ILL-POSED".
- SA5: `rankConcordance` — all-concordant ⇒ +1, all-discordant ⇒ −1, mixed in between.
- SA6: `recommendation` — PACK-DRIVEN ⇒ go:false DO-NOT-PROMOTE; PICTURE-DRIVEN + good agreement + licensing
  true ⇒ go:true; same but licensing false ⇒ go:null (recommend-only); ILL-POSED ⇒ go:false ill-posed.

## Created — data

### 3. `experiments/eval-alignment/corpus/labels/pairs.json` (new)
The curated pair set (design Decision 3). Shape:
```
{ "schema":"eval-alignment/style-label-pairs/v1",
  "note":"...curated; hard-middle reported separately; intended = single-rater reference, NOT the label...",
  "pairs":[ {"id":"P1","bucket":"easy","a":"gh-match","b":"gh-samepack-classical","intended":"A",
             "rationale":"faithful gatehouse vs classical-concept wrong-picture"}, ... ] }
```
`a`/`b` are corpus state ids. 8 pairs (3 easy + 5 hard-middle). Loaded + validated lightly by the harness
(ids must exist in the corpus; buckets ∈ {easy, hardMiddle}; intended ∈ {A,B,tie}) — a tiny inline check, no
new schema file needed (the data is small and the harness asserts referential integrity against the corpus).

## Created — metered harness + instrument builder (NOT in `npm test`)

### 4. `experiments/eval-alignment/style-label.mjs` (new) — instrument builder (GL-free, model-free)
Mirrors `corpus-build.mjs`. Steps: (1) load corpus + pairs.json; asset-guard every referenced `beside` PNG
exists (before any work). (2) For each pair compose `corpus/labels/instrument/<id>.png` = stateA.beside ‖
gutter ‖ stateB.beside (reuse a local `composeTwo` lifted from the referee — GL-free `decodeImage`+PNG).
(3) Write `corpus/labels/labels-template.json` — every pair id, `bucket`, the two state ids, an empty
`"humanLabel": ""` (to be "A"/"B"/"tie"), and top-of-file `instructions`. (4) Print a summary. Flags:
`GUARD_ONLY=1`. No model spend, no GL. This is the human-gate prep — replayable.

### 5. `experiments/eval-alignment/style-agreement-run.mjs` (new) — the metered harness
Mirrors `corpus-referee.mjs` (asset-guard-first, `VOTES` env default 6, `GUARD_ONLY=1`, no re-ask). Steps:
1. Load corpus + pairs.json + (if present) `corpus/labels/labels.human.json`.
2. Asset-guard: every state's 4 view PNGs + pack + concept; every pair's instrument composite (built by #4).
   `GUARD_ONLY` exits clean here.
3. **Score each state once** (VOTES-averaged) via the referee's `diagnose({program: SUBJECT_PROGRAMS[subject],
   pack, concept, renders})` — `SUBJECT_PROGRAMS` = {gatehouse (referee's verbatim), cottage, barn} fixed
   synthetic programs defined locally. `scoreById[id] = round(mean(votes))`; persist per-vote + the item audit.
4. **LLM-proxy labels** (fallback): for each pair, N=VOTES holistic pairwise-judge calls
   (`runTieredOp({tier:"strong", prompt, images:[instrument composite]})`, parse `{pick}`); majority ⇒
   proxy label; per-pair vote array ⇒ inter-label self-consistency. Skipped per-pair vote dropped+logged on
   malformed.
5. **Join via the pure core:** `labelById` = human labels if `labels.human.json` present (`labelSource:human`,
   `licensing:true`), else proxy majority (`labelSource:llm-proxy`, `licensing:false`). Call
   `pairwiseAgreement`, `interLabelAgreement`, `rankConcordance`, `packVsConceptDecomposition`,
   `recommendation`.
6. Write `experiments/eval-alignment/results/style-agreement.json` (schema tag, votes, labelSource, licensing,
   scoredStates, decomposition, agreement, interLabel, concordance, recommendation) + a console verdict block.

`SUBJECT_PROGRAMS`, `composeTwo`, `toB64`, `mean`/`std`/`round`, `renderB64s`, `diagnose` are local helpers
(the referee idiom — kept local, tiny). The harness imports `diagnose`-equivalents by re-implementing the
~6-line helper rather than importing the referee (the referee is a script with top-level `main()`, not a
module; re-implement, do not refactor it — minimal blast radius, the `pack-edit-blast-radius` lesson).

## Created — generated output (committed where stable)
- `experiments/eval-alignment/corpus/labels/instrument/<pairId>.png` — 8 pairwise composites (GL-free,
  deterministic → committable).
- `experiments/eval-alignment/corpus/labels/labels-template.json` — the fillable human template.
- `experiments/eval-alignment/results/style-agreement.json` — the run result (proxy-fallback labels in this
  loop; re-runnable with `labels.human.json` for the real gate).
- `docs/active/work/T-184-01/FINDINGS.md` — the interpreted GO/NO-GO report.

## Modified
- `package.json` — add `"style:label"` and `"style:agreement"` script entries (direct `node`, no flag
  swallowing). Additive.

## Deleted — none.

## Module boundaries / why this split
- `style-agreement.mjs` is **pure math**, unit-tested, S-185-freeze-irrelevant (it is gate evidence, not the
  instrument) — kept out of `bakeoff-score.mjs` so the frozen surface stays minimal.
- `style-label.mjs` (GL-free instrument prep) and `style-agreement-run.mjs` (metered) are the only IO/model
  shells; both asset-guard before any work and self-validate referential integrity against the corpus.
- No `measurements/` path appears anywhere. The freeze is S-185, behind the human labels + sign-off.

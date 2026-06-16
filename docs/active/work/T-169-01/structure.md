# T-169-01 Structure — the blueprint

File-level changes, interfaces, ordering. No code, the shape of it.

## Files

| File | Action | Why |
|------|--------|-----|
| `src/workshop/bakeoff-score.mjs` | **modify** (additive) | + `pairAgreement(rows)` pure helper — the easy/contested bucketing for AC #2, single-sourced + tested |
| `src/workshop/bakeoff-score.test.mjs` | **modify** (append) | + BO12 pinning `pairAgreement` (ordering agreement, bucket split, empty-contested case) |
| `experiments/eval-alignment/corpus-referee.mjs` | **create** | the live referee: crater + corpus-agreement + bake-off, one result doc |
| `experiments/eval-alignment/results/corpus-referee.json` | **create** (by run) | live evidence, full items persisted |
| `package.json` | **modify** | + `"corpus-referee": "node experiments/eval-alignment/corpus-referee.mjs"` |
| `docs/active/work/T-169-01/FINDINGS.md` | **create** | the three results read honestly |
| `docs/active/work/T-169-01/recommendation.md` | **create** | promote / re-calibrate / do-not-promote + evidence |
| `docs/active/work/T-169-01/*.png` | **create** (by run) | beside-concept renders (AC #1) |

No deletions. No edits to `clean-wrong-style.mjs` / `bakeoff.mjs` (precedents, kept intact). No edits to
`measurements/**` (frozen). No edit to `department.baml` (the `kind` tag is a re-pinned E-39 ticket — we
only *recommend* it).

## `pairAgreement(rows)` — the new pure helper (bakeoff-score.mjs)

```
/**
 * Pairwise-label agreement for the style-distance crater, split by confidence bucket so the easy pairs
 * and the contested middle are reported SEPARATELY (never averaged — the corpus's contested pairs were
 * excluded as noise, so the contested bucket may be empty, and that must show).
 * agree := the scored ordering matches the human moreFaithful label.
 *   moreFaithful "matched" ⇒ agree iff matchedScore > wrongScore
 *   moreFaithful "wrong"   ⇒ agree iff wrongScore  > matchedScore   (defensive; corpus has none)
 * bucket := confidence==="high" ? "easy" : "contested".
 * @param {Array<{key, confidence, moreFaithful, matchedScore, wrongScore}>} rows
 * @returns {{ easy:{n,agree,rate,pairs[]}, contested:{n,agree,rate,pairs[]}, overall:{n,agree,rate} }}
 */
export function pairAgreement(rows)
```
- `pairs[]` carries `{key, matchedScore, wrongScore, margin, agree}` (margin = matchedScore−wrongScore).
- `rate` = `n ? agree/n : 0`; empty bucket ⇒ `{n:0, agree:0, rate:0, pairs:[]}` (no NaN).
- PURE: no IO/model/Date/random. Lives beside `dispatchCorrectness`.

## `corpus-referee.mjs` — the harness shape

Imports: `MULTI_ANGLE_GATE` (config), `loadStylePack`, `runTieredOp`, `bamlRender`/`bamlParse`,
`diagnoseRenderArgs`, `routeRenderArgs`/`resolveDispatch`, `critiqueRenderArgs`, `ACTION_NAMES`,
`decodeImage`; from `bakeoff-score.mjs`: `critiqueEvidence`, `itemStyleClass`, `styleFidelityScore`,
`worstDepartmentOfDispatch`, `worstDepartmentOfFusedReply`, `dispatchCorrectness`, `pairAgreement`,
`BAKEOFF_SCHEMA`; from `defect-corpus.mjs`: `loadDefectCorpus`, `singleStates`, `pairStates`, `REPO_ROOT`.

Local helpers (mirrors precedents, kept local — small): `toB64(p)` (JPEG/PNG sniff), `composeTwo(...)`
(beside-PNG via `decodeImage`+`pngjs`), `mean`, `itemsOf(critique)` (persist
`{department,severity,present,missing,styleClass:itemStyleClass(it)}`).

Fixed inputs reused from the precedents: the synthetic gatehouse `PROGRAM` (crater build is held fixed
= `builds/gatehouse/new-roof`); per-subject matched packs = `packs/rustic.json`; wrong-style pack =
`packs/guildhall.json`.

### Section A — CRATER (AC #1)
- Conditions A-matched / B-arc / B2-chapelle / C-control (verbatim from `clean-wrong-style.mjs`).
- Per condition × VOTES: DiagnoseBuild → `critiqueEvidence` + `itemsOf`. Persist scores + items.
- Report `A,B,B2,C` means; spreads `A−B, A−B2, A−C, C−B`; `cratered := (A−B) > 2*NOISE` (NOISE=12);
  **and** `collapsed := A <= NOISE && B <= NOISE` (the new failure signature — both floored).
- Write beside-PNGs `crater-matched.png` / `crater-wrongstyle.png` / `crater-wrongstyle-2.png` FIRST.

### Section B — CORPUS AGREEMENT (AC #2)
- For each `pairStates(corpus)` state: build renders from `state.renderDir` (4 azimuths).
  - matched: DiagnoseBuild vs `labels.matchedConcept`, rustic pack → `matchedScore` (mean over votes).
  - wrong:   DiagnoseBuild vs `labels.wrongStyleConcept`, guildhall pack → `wrongScore`.
  - row = `{key, confidence: labels.confidence, moreFaithful: labels.moreFaithful, matchedScore,
    wrongScore, matchedItems, wrongItems}`.
- `pairAgreement(rows)` → easy/contested/overall. Persist rows (with items) + the agreement summary.

### Section C — BAKE-OFF (AC #3)
- For each `singleStates(corpus)`: split (DiagnoseBuild→RouteCritique→`worstDepartmentOfDispatch`) vs
  fused (CritiqueWorkshopRound→`worstDepartmentOfFusedReply`), VOTES each. Ground =
  `labels.worstDepartment`. Rows → `dispatchCorrectness`. Persist rows + summary + per-state.
- Uses each subject's matched pack (`packs/rustic.json`) + synthetic program stand-ins where a subject
  has no committed recognition/workshop program (mirrors `bakeoff.mjs`; logged as stand-in).

### Output JSON shape (`results/corpus-referee.json`)
```
{ schema, tier, votes, noiseBand,
  crater:   { conditions:[{key,tier,scoreMean,votes:[{score,nWrongStyle,items:[...]}]}], spreads, cratered, collapsed, verdict },
  agreement:{ rows:[{key,confidence,moreFaithful,matchedScore,wrongScore,matchedItems,wrongItems}], summary:pairAgreement, verdict },
  bakeoff:  { rows:[...], summary:dispatchCorrectness, verdict },
  baseline: { e39CleanWrongStyle:{A,B,B2,C}, e39Bakeoff:{split,fused,verdict} } }
```

## Ordering of changes
1. `pairAgreement` + BO12 (pure, testable offline) → `npm test` green.
2. `corpus-referee.mjs` + `package.json` script (asset-guard, no spend yet).
3. Probe one diagnose (already done) → run live → `corpus-referee.json` + PNGs.
4. `FINDINGS.md` + `recommendation.md` from the actual numbers.

## Test cases (BO12)
- ordering agree (matched 40 > wrong 4, high) ⇒ easy.agree=1, contested empty.
- ordering disagree (matched 4 < wrong 40, high) ⇒ easy.agree=0.
- a medium-confidence row ⇒ lands in contested, not easy.
- empty rows ⇒ all buckets `{n:0,...rate:0}`, no NaN.
- `moreFaithful:"wrong"` branch (defensive) scored correctly.

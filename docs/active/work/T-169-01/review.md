# T-169-01 Review — crater re-run, corpus agreement, promotion recommendation

Handoff doc. What changed, test coverage + gaps, open concerns, AC checklist. The referee for the
style-distance term (T-168-01) on the S-167 corpus (T-167-01). E-40 / S-169.

## Verdict in one paragraph

The style-distance term **fails on live data — informatively.** It does not crater (separate matched
from wrong-style); it **collapses both to the floor** (matched gatehouse scores 2/100 against its own
concept). Root cause is mechanical and certain: live Layer A emits a non-empty `present` AND `missing`
for *every* divergent department, so the structural `itemStyleClass` classes nearly everything
`"wrong-style"` and the cap fires on correct builds. **Recommendation: DO NOT PROMOTE; re-calibrate via
the typed `kind` discriminator first** (the scoring core is already wired to read it). Frozen instrument
untouched.

## What changed

Additive only; no deletions; no edits to the E-39 precedents (`clean-wrong-style.mjs`, `bakeoff.mjs`) or
their baseline results; no `measurements/**` (frozen) edit; no `department.baml` edit.

| File | Change | Commit |
|------|--------|--------|
| `src/workshop/bakeoff-score.mjs` | +`pairAgreement(rows)` pure helper (easy/contested ordering agreement) | `5a7d34b` |
| `src/workshop/bakeoff-score.test.mjs` | +BO12 / BO12b (bucket split, empty-contested no-NaN, defensive `wrong` branch) | `5a7d34b` |
| `experiments/eval-alignment/corpus-referee.mjs` | **new** metered harness: crater + agreement + bake-off, full item triples persisted | `26c2635` |
| `package.json` | +`corpus-referee` script | `26c2635` |
| `experiments/eval-alignment/results/corpus-referee.json` | **new** live evidence | `d041c06` |
| `docs/active/work/T-169-01/crater-*.png` | **new** beside-concept renders (AC #1) | `d041c06` |
| `docs/active/work/T-169-01/FINDINGS.md`, `recommendation.md`, RDSPI artifacts | **new** | `af94282` |

## Results (evidence: `results/corpus-referee.json`)

- **Crater (AC #1):** A-matched=2, B-arc=0, B2-chapelle=2, C-control=0. Spread A−B=2, inside ±12. E-39
  baseline was 52/46/40/58. `collapsed=true`. The new term made *both* conditions worse, not just wrong.
- **Agreement (AC #2):** easy 3/4 by ordering (margins +2, +16, −2, +4); only one pair separates beyond
  noise; `cottage-vs-arc` inverts the human (matched 0 < wrong 2). Contested bucket **empty by
  construction** — the corpus excludes its only contested pair, so the middle is untestable here (stated,
  not averaged away).
- **Bake-off (AC #3):** split 6/8 (75%) > fused 5/8 (62.5%) → "SPLIT WINS", reversing E-39's fused-wins
  now that ≥8 states give the comparison power. Marginal (one row); the deciding cell is
  `gatehouse-gaping-gate` OPENING, which the typed split path names and the fused region path misses.

## Test coverage

`npm test`: **2241 pass, 0 fail** (2239 pre-ticket; +2 = BO12, BO12b).

- **BO12/BO12b** pin `pairAgreement`: easy/contested split by confidence, ordering agreement, margins,
  empty-contested → rate 0 (not NaN), empty-input safety, and the defensive `moreFaithful:"wrong"`
  branch. The bucketing decision (the one new piece of pure logic) is single-sourced + tested.
- All prior scoring math (BO1–BO11) unchanged-green — the term's mechanics were pinned in T-168.

### Gaps (flagged, by design)
- **The harness is not unit-tested** — it is live, metered IO in the `experiments/` glob, same as the
  precedents. Its correctness rests on the asset-guard (21 assets verified before any spend) and the
  persisted full-item audit trail (every `present`/`missing`/`styleClass`), which is what makes the
  collapse falsifiable rather than asserted.
- **VOTES=2** — small. The collapse is robust to vote count (every item classes wrong-style regardless),
  but the agreement margins (±2–4) are within per-call noise; only the +16 pair is a real separation.
  More votes would tighten the means, not change the verdict.
- **Single-rater corpus** (T-167 limitation, inherited) — the `moreFaithful` labels are one analyst's
  ground truth, not inter-rater agreement.

## Open concerns for the human reviewer

1. **The promotion gate is a separate E-39 ticket, not this one.** The fix (typed `CritiqueItem.kind`)
   edits `department.baml` and re-pins the `DiagnoseBuild` prompt golden — owning E-39 ticket, by the
   prompt-golden re-pin discipline. `recommendation.md` lays out the ordered path: land the tag → re-run
   `corpus-referee` (no code change; `itemStyleClass` reads `kind` automatically) → only then a separate
   re-pinned promotion ticket. **Do not promote the current term.**
2. **The bake-off SPLIT-WINS reversal is real but marginal and orthogonal.** One row (6 vs 5); it tests
   state-count power for the E-39 claim-1, not the style-distance term. Don't let it leak into a
   "the term works" reading — the two are independent. Worth its own E-39 follow-up on a larger,
   non-roof-clustered state set.
3. **`pairAgreement` measures ORDERING, not magnitude** — by design, since the human label is an
   ordering. On collapsed scores it will report "agreement" for a +2 margin of noise. FINDINGS reads the
   magnitudes beside the ordering so the 3/4 is not over-claimed; a future graded re-calibration should
   add a magnitude/separation threshold, not just ordering.
4. **`results/corpus-referee.json` is creation-loop evidence, not a pinned artifact** — re-running
   overwrites it. It is committed for re-inspection; it is not under pin-guard (it lives in
   `experiments/`, not `measurements/`).

## AC checklist

- [x] **Crater re-run with the new term** — matched vs wrong-style scores + spread vs ±12 reported
      (2/0/2/0, spread 2, COLLAPSED); renders beside both concepts (`crater-*.png`).
- [x] **Corpus agreement** — S-167 corpus scored; easy-pair agreement (3/4) reported **separately** from
      the contested middle (empty by construction, stated honestly — not averaged).
- [x] **Bake-off re-run on the ≥8-state corpus** — split-vs-fused dispatch on the 4 single states
      (split 6/8, fused 5/8, SPLIT WINS), reported honestly with the marginality + orthogonality caveats.
- [x] **Written promotion recommendation** — `recommendation.md`: **do-not-promote / re-calibrate**, with
      evidence; promotion is a separate re-pinned ticket if/when warranted. Frozen instrument untouched.
- [x] **`npm test` green** — 2241 pass.

## Note on the anti-hedge directive

This landed in the claim's DO-NOT-PROMOTE branch ("over-penalizes a close style"), and worse than
anticipated (collapses both; inverts one easy pair). That embarrassing result is the deliverable — the
ticket existed to find where the term fails, and it found a specific, mechanical, fixable failure. No
green hid a disagreement; the per-item `present` strings in the evidence make the collapse auditable.

# T-170-02 Review — rerun-crater-with-typed-kind

Epic **E-41** / Story **S-170**. Handoff doc: what changed, test coverage + gaps, open concerns, AC
checklist. The payoff measurement of the E-40 → E-41 arc.

## Verdict in one paragraph

The typed `kind` Layer A (T-170-01) **removes the E-40 over-cap.** Live re-run: the floor-collapse is gone
(`collapsed` true→false; scores 2/0/2/0 → 8/14/18/46; control 0→46), the corpus pairwise agreement rose to
**4/4 with the E-40 cottage-vs-arc inversion fixed**, and the tag is emitted **100% reliably (0/28
untagged)**. The crater still does not *separate* (matched 8 ≮ wrong 14/18) — but because the held-fixed
"matched" build is itself material-wrong (MATCHED `replaceRate` 0.71 > WRONG 0.40), which is the **correct**
answer and the explicit **E-42 hand-off**, not a term failure. **Recommendation: DO-NOT-PROMOTE yet; the
blocker moved from the term to build faithfulness (E-42).** Frozen instrument untouched.

## What changed

Additive only. No deletions; no `measurements/**`, `department.baml`, gate vocabulary, or scoring-math edit.

| File | Change | Commit |
|------|--------|--------|
| `src/workshop/bakeoff-score.mjs` | +`kindReliability(conditions)` pure helper (per-condition tag distribution + MATCHED/WRONG replace contrast) | `054873d` |
| `src/workshop/bakeoff-score.test.mjs` | +BO13 (distribution, contrast, 3 verdict branches, untagged + empty safety) | `054873d` |
| `experiments/eval-alignment/corpus-referee.mjs` | `itemsOf` captures raw `kind`; env-gated `OUT_DIR`/`RESULTS` (T-169-01 defaults); `runCrater` folds in `kindReliability`; `KIND:` console line | `7b1286b` |
| `experiments/eval-alignment/results/corpus-referee-kind.json` | **new** live evidence (E-40 baseline `corpus-referee.json` byte-unchanged) | `29cf631` |
| `docs/active/work/T-170-02/crater-*.png` | **new** beside-concept renders (AC #1) | `29cf631` |
| `docs/active/work/T-170-02/{research,design,structure,plan,FINDINGS}.md` | **new** RDSPI artifacts | `bc8d844` |

## Results (evidence: `results/corpus-referee-kind.json`)

- **Crater (AC #1):** A=8 B=14 B2=18 C=46; `collapsed=false`, `cratered=false`. E-40 was 2/0/2/0
  `collapsed=true`. The over-cap floor is removed; C-control's 0→46 is the cleanest single proof.
- **Kind reliability (AC #2):** 0/28 untagged. byTier replaceRate MATCHED 0.71 / WRONG 0.40 / CONTROL 0.17
  → `replaceContrast=−0.31` ("NO CONTRAST"). The negative contrast is the material-wrong matched build
  earning genuine `replace` tags — confound, quantified — not a tag misfire.
- **Agreement (AC #2/#3):** 4/4 ordered correctly, margins +26/+16/+24/+28 (all beyond ±12). E-40 was 3/4
  with `cottage-vs-arc` inverted; now matched 24 ≫ wrong 0. Contested middle empty by construction (stated).
- **Bake-off (orthogonal):** split 5/8 > fused 4/8, "SPLIT WINS" (E-40 6/8 > 5/8). Same direction; not a
  promotion gate for this term.

## Test coverage

`npm test`: **2242 pass / 0 fail** (2241 pre-ticket; +1 = BO13).

- **BO13** pins `kindReliability`: per-condition add/replace/remove/untagged counts, `replaceRate`/
  `cappingRate`, `byTier` aggregation, `replaceContrast` = WRONG − MATCHED, the three verdict branches
  (DISCRIMINATES / NO CONTRAST / UNRELIABLE), `styleClass` recompute when absent, and empty/single-tier
  safety (null contrast, no NaN). The one new piece of logic is single-sourced + tested.
- BO8/BO11 (kind→class mapping, the F1 correction) unchanged-green; the scoring math was not touched.

### Gaps (flagged, by design)
- **The harness is not unit-tested** — live metered IO in the `experiments/` glob (the established
  property). Its correctness rests on the asset-guard (21 assets before spend) and the persisted full-item
  `kind`+`styleClass` audit trail, which makes every FINDINGS claim falsifiable.
- **VOTES=2** — small; run-to-run `kind` tagging of the gatehouse wall (`add` vs `replace`) is the dominant
  variance (crater A=8 vs agreement matched 24–40 for the same build+concept). More votes would tighten the
  means; the *direction* (over-cap gone, agreement 4/4) is robust across both votes.
- **No per-item `kind` ground truth** in the corpus — reliability is condition-level and confounded by the
  build's real material errors. A literal per-item reliability number is not obtainable here (stated in
  FINDINGS, not averaged away).

## Open concerns for the human reviewer

1. **The recommendation shifted; the promotion gate is still a separate, later ticket.** E-40 said
   "re-calibrate the term." T-170-02 shows the term + tag work (over-cap gone, agreement 4/4); the blocker
   is now **build faithfulness (E-42)**. Promotion remains a separate re-pinned ticket *after* E-42 supplies
   a faithful build and this referee is re-run and shows matched-faithful ≫ wrong. **Do not promote now.**
2. **The crater's `DID NOT CRATER` / `NO CONTRAST` headline reads as failure but is the predicted success
   branch.** The ticket explicitly says a capped material-wrong gatehouse is the *correct* answer and the
   evidence for E-42. The negative `replaceContrast` is the matched build's real material errors, not a tag
   defect — read it beside the 0/28-untagged reliability and the 4/4 agreement.
3. **Re-run mechanics for E-42 (T-173-01).** Re-run with
   `REFEREE_OUT_DIR=docs/active/work/T-173-01 REFEREE_RESULTS=experiments/eval-alignment/results/corpus-referee-faithful.json`
   once a faithful build replaces `builds/gatehouse/new-roof`. The harness is now parameterized for exactly
   this. The crater build path (`CRATER_BUILD`) is still hardcoded to the gatehouse — T-173-01 either points
   it at the faithful build dir or adds a build env-gate (a one-line follow-up, noted not done here).
4. **`corpus-referee-kind.json` is creation-loop evidence, not pinned** — re-running with the same routing
   overwrites it. Committed for re-inspection; lives in `experiments/`, not `measurements/` (not pin-guarded).

## AC checklist

- [x] **Live re-run with the `kind`-emitting Layer A; matched-faithful vs wrong-style vs E-40 baseline,
      with renders** — 8/14/18/46 vs 2/0/2/0; `crater-*.png` beside both concepts.
- [x] **`kind` reliability reported separately from the score** — 0/28 untagged; per-condition + byTier
      replaceRate; `replaceContrast=−0.31`; the no-per-item-ground-truth caveat stated.
- [x] **Recorded honestly: over-cap gone? crater separates? E-42 hand-off named?** — over-cap GONE;
      crater does NOT separate (matched build is material-wrong); E-42 hand-off explicit (T-171/172/173);
      recommendation re-assessed to DO-NOT-PROMOTE-yet, blocker moved to faithfulness. No faked crater.
- [x] **`npm test` green; frozen instrument untouched** — 2242 pass; baseline byte-unchanged.

## Anti-hedge note

The claim landed in its named "no faithful matched build → hand off to E-42, do not fake a crater" branch.
The surface result looks like a failure (`DID NOT CRATER`, `NO CONTRAST`); the substance is a success — the
over-cap E-40 found is provably gone (0/28 untagged, `collapsed=false`, agreement 4/4 with the inversion
fixed), and the residual gap is provably the build, not the term. The per-item audit trail in
`corpus-referee-kind.json` makes that separation auditable rather than asserted.

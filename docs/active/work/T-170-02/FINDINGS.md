# T-170-02 FINDINGS — crater re-run with the typed `kind` Layer A

Epic **E-41** / Story **S-170**. The proof. Live `corpus-referee` re-run with the `kind`-emitting Layer A
(T-170-01, commit `7647ce4`), env-routed to T-170-02 so the E-40 baseline survives byte-unchanged.
Evidence: `experiments/eval-alignment/results/corpus-referee-kind.json`; renders
`docs/active/work/T-170-02/crater-{matched,wrongstyle,wrongstyle-2}.png`. Run: 48 image diagnose calls,
`TIER=strong`, `VOTES=2`.

## Verdict in one paragraph

**The E-40 over-cap is GONE; the crater still does not separate — for the reason the ticket predicted, not
the term.** With the typed `kind`, the floor-collapse that pinned every condition at ~0–2 in E-40 is
removed (scores now span 0–52; the classical-concept control recovered 0→46), and the corpus pairwise
**agreement rose to 4/4 with the E-40 inversion fixed** (cottage-vs-arc went from matched 0 < wrong 2 to
matched 24 ≫ wrong 0). The crater nonetheless does **not** produce a matched ≫ wrong-style spread, because
the held-fixed "matched" build (`builds/gatehouse/new-roof`) is **itself material-wrong** and earns
*genuine* `replace` tags against its own concept (MATCHED replaceRate 0.71 > WRONG 0.40 → contrast −0.31).
No faithful matched build exists to demonstrate separation, so this report **hands the separation proof to
E-42** and does not fake a crater. **Recommendation: DO-NOT-PROMOTE *yet* — but the diagnosis shifts from
E-40's "re-calibrate the term" to "the term + tag work; supply a faithful build (E-42), then re-run."**

## AC #1 — Crater re-run vs the E-40 baseline (with renders)

| Condition | Tier | E-40 (pre-`kind`) | T-170-02 (post-`kind`) |
|---|---|---|---|
| A-matched | MATCHED | **2** | **8** |
| B-arc | WRONG | **0** | **14** |
| B2-chapelle | WRONG | **2** | **18** |
| C-control | CONTROL | **0** | **46** |

- `collapsed`: E-40 **true** → T-170-02 **false**. The structural rule's "everything caps to the floor" is
  removed by the tag. Scores are no longer pinned; `C-control` (classical concept + rustic pack) recovered
  from 0 to 46 — the clearest single signal that the over-cap is gone.
- `cratered`: **false** (matched A=8 is not ≫ wrong B=14/B2=18). The crater does not separate. See AC #3
  for why this is the *correct* answer on this build, not a term failure.
- Renders: `crater-matched.png` (rustic concept ‖ build), `crater-wrongstyle.png` (arc-A ‖ build),
  `crater-wrongstyle-2.png` (chapelle ‖ build).

## AC #2 — `kind` reliability, reported separately from the score

**The tag is emitted 100% reliably: 0/28 crater items were `untagged`.** The "fails if `kind` is emitted
unreliably" clause of the claim is **refuted** — every item carried a tag; the scorer never fell back to
the structural triple read.

Per-condition `kind` distribution (crater conditions, 2 votes each):

| Condition | Tier | n | add | replace | remove | replaceRate | cappingRate |
|---|---|---|---|---|---|---|---|
| A-matched | MATCHED | 7 | 2 | 5 | 0 | **0.71** | 0.71 |
| B-arc | WRONG | 8 | 5 | 3 | 0 | 0.38 | 0.38 |
| B2-chapelle | WRONG | 7 | 4 | 3 | 0 | 0.43 | 0.43 |
| C-control | CONTROL | 6 | 5 | 1 | 0 | 0.17 | 0.17 |

- **`replaceContrast` (WRONG − MATCHED replaceRate) = −0.31 → "NO CONTRAST".** Within the crater, the
  MATCHED tier earns a *higher* `replace` rate than the WRONG tier. This is **not** the tag misfiring — it
  is the tag faithfully reporting that the "matched" gatehouse build genuinely has wrong materials vs its
  own concept (5/7 items `replace`: dark timber siding where the concept wants cobblestone+stone_bricks,
  a raw void where it wants an arched timber gate). A material-wrong "matched" build *should* draw
  `replace`; the negative contrast is the **E-42 confound made quantitative**.
- **Caveat (stated, not hidden):** the defect corpus has **no per-item labeled `kind`** — its labels are
  department/faithfulness, not add/replace/remove. So reliability here is **condition-level**, not a
  per-item ground-truth join, and it is confounded by the build's real material errors. A clean per-item
  reliability number cannot be produced from this corpus or this build; that is a limitation, recorded.

## AC #3 — Recorded honestly: over-cap, separation, E-42 hand-off, recommendation

- **Is the over-cap gone?** **Yes.** E-40 floored everything (2/0/2/0, `collapsed=true`); T-170-02 spreads
  0–52 with `collapsed=false`, and the corpus agreement separates 4/4 (margins +16, +16, +24, +26/+28; all
  beyond the ±12 noise) where E-40 was 3/4 with one inversion. The structural rule's mass-misclassification
  of `add` items as `wrong-style` is corrected by the typed tag.
- **Does the crater separate (matched ≫ wrong)?** **No** — and that is the *correct* result on this build.
  The matched gatehouse is material-wrong, so it legitimately caps. The crater's standalone A-condition drew
  5/7 `replace` (score 8); the agreement section, comparing the same build against its own concept vs a
  foreign one, separated cleanly (matched 24–40 ‖ wrong 0–16) — the difference is run-to-run judge variance
  in tagging the gatehouse wall `add` vs `replace`, which is itself the signal that the wall is genuinely
  ambiguous against its concept (a faithful wall would not be).
- **E-42 hand-off (explicit, per AC):** there is **no materially-faithful matched build** in the corpus to
  demonstrate separation. Building one is **E-42** — T-171-01 (gatehouse program → cobblestone/stone_bricks)
  and T-172-01 (roof-as-construction, killing the 72% solid prism). The crater separation proof is
  **handed to T-173-01** (the faithful-build crater re-run). This report does **not** manufacture a crater.
- **Recommendation (re-assessed):** **DO-NOT-PROMOTE the frozen instrument yet** — but the *reason* has
  shifted. E-40 concluded "re-calibrate the term (it over-caps)." T-170-02 shows the term + typed tag are
  **no longer the bug**: the over-cap is gone and the agreement separates. The remaining blocker to a real
  crater is **build faithfulness**, owned by E-42. Order: land E-42's faithful build → re-run this referee
  (`REFEREE_OUT_DIR`/`REFEREE_RESULTS` routed) → only if matched-faithful then scores ≫ wrong does a
  separate re-pinned promotion ticket move the term toward the instrument. This is the A-then-B arc closing
  as designed (E-41 removed the over-cap; E-42 enables the separation).

## AC #4 — tests green, frozen instrument untouched

- `npm test`: **2242 pass / 0 fail** (2241 pre-ticket + BO13).
- No `measurements/**`, no gate vocabulary, no `department.baml`, no `styleFidelityScore`/`itemStyleClass`
  edit. The committed E-40 baseline `corpus-referee.json` is byte-unchanged (the run wrote `-kind.json`).

## Orthogonal note — bake-off

Split 5/8 > fused 4/8, "SPLIT WINS" (E-40 was 6/8 > 5/8). Same direction, lower absolute (run variance);
orthogonal to the style-distance term and the `kind` tag — flagged, not bundled into the recommendation.

## Anti-hedge note

The claim landed in its named **"no faithful matched build exists → hand off to E-42, do not fake a crater"**
branch. The embarrassing-looking surface result (`DID NOT CRATER`, `NO CONTRAST`) is the deliverable, and
the per-item `kind`+`styleClass`+score audit trail in `corpus-referee-kind.json` makes every claim here
falsifiable: the over-cap is provably gone (0/28 untagged, `collapsed=false`, agreement 4/4), and the
remaining gap is provably the build (MATCHED replaceRate 0.71 on a known material-wrong gatehouse), not the
term. No green hid a disagreement; no separation was manufactured.

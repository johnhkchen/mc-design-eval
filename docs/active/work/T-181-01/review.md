# T-181-01 — Review

Implemented BOTH loci the T-180-01 AUDIT named, in the creation-loop scoring / Layer A only. The frozen
instrument (`measurements/`) is untouched. `npm test` green (2289/2289; +6 BO14). Recommend, don't freeze.

## What changed

Two separable commits:

**Commit 1 — S fix (`aef5ab0`): graded style-distance replaces the binary cap.**
- `src/workshop/bakeoff-score.mjs`:
  - `styleFidelityScore` — the wrong-style branch is now **severity-respecting** (`PENALTY[severity] ??
    PENALTY.major` + `WRONG_STYLE.distance`, replacing the forced 32-per-replace), and the binary
    `min(score, 40)` is replaced by a **breadth-graded cap** `max(WRONG_STYLE.cap, 100 − distance·b)` where
    `b` = distinct wrong-style departments. Cap grades 88/76/64/52/40 for b=1..5.
  - New module-local `wrongStyleBreadth(items)` + `gradedCapFor(b)` (single source for breadth, shared with
    `critiqueEvidence`).
  - `critiqueEvidence` — additive `wrongStyleBreadth`, `gradedCap` (no field removed; back-compat).
  - `WRONG_STYLE` doc rewritten (cap = wrong-in-all floor; distance = double-duty unit). **Value unchanged**.
- `src/workshop/bakeoff-score.test.mjs` — appended **BO14a–f**.

**Commit 2 — R fix (`951c7bb`): concept-conditional `DiagnoseBuild` prompt + golden re-pin.**
- `baml_src/department.baml` — one `CONCEPT-CONDITIONAL` sentence: same-style-family + missing-detail ⇒
  `add`, not capping `replace`.
- `src/baml/fixtures/diagnose/prompt.golden.txt` — re-pinned deterministically (render mode, no metered
  call). `docs/active/work/T-181-01/prompt-diff.txt` records exactly the inserted sentence (no other drift).

## Test coverage

- **BO14a** — faithful-except-one (incl. the legit dark-oak roof:replace) = 68 vs wrong-in-all = 0; spread
  ≥50. The headline falsifiable claim: the binary-cap collapse is gone in isolation. ✅
- **BO14b (regression fixture)** — reconstructs the OLD math inline and shows it crushed faithful (40) into
  the wrong-in-two band (36); NEW decompresses to 68 vs 36. The named "binary-cap collapse" as a pinned
  fixture. ✅
- **BO14c** — score non-increasing in breadth; `gradedCap` strictly decreasing 88→40 (graded, not binary). ✅
- **BO14d** — severity-respecting: minor wrong-style (80) > major (68); missing severity defaults to major. ✅
- **BO14e** — the legit roof anchor separates; evidence reports `wrongStyleBreadth`/`gradedCap`; two
  same-department wrong items = breadth 1 (departments, not item count). ✅
- **BO14f** — duplicates BO9's matched=40 / wrong=4 so a future edit can't silently drift the E-40 pins. ✅
- **Back-compat** — BO7/BO9/BO10/BO11/BO13 all unchanged and green; no existing test needed editing (a
  strong signal the change is minimal). FX-DB1 re-pinned green; FX-DB2 (parse) untouched green.
- **Full suite**: 2289/2289.

## Open concerns / known limitations

1. **R efficacy is NOT proven here — by design.** Whether the judge actually stops tagging faithful stone
   `replace` is a live, metered question → **S-182**'s two-sided crater. The falsifiable claim names this
   hedge explicitly: if a concept-conditional prompt can't stop Layer A, it's the reading, hand back to the
   judge model. This ticket proves the SCORING mechanism (S) at unit level and lands the contract rule (R).
2. **`distance=12` does double duty** (per-item surcharge AND cap step). Coupling is intentional and
   principled (one style-distance unit), but if S-182 wants to tune them independently, that's a follow-up
   constant — would touch BO7's one-source deepEqual deliberately.
3. **The graded cap rarely BINDS for low breadth** — the per-item penalty already grades, so for an
   otherwise-complete build the score is `100 − Σpenalty` and the cap is a safety ceiling. `wrongStyleCapped`
   still means "the style-distance term fired" (≥1 wrong-style), not "the cap bound" — documented in the
   evidence field; the new `gradedCap` reports the actual ceiling for transparency.
4. **One-subject breadth** (standing E-40 caveat, restated in the AUDIT) — this proves the mechanism on the
   gatehouse twins, not a population. A labeled multi-state corpus remains the real promotion bar; S-182 must
   name it.
5. **Wrong-in-all stays floored under the softening** — BO14a/e confirm 5 major replaces → 0; the
   severity-respecting change only lifts MINOR wrong-style (defensibly less wrong). The falsifiable claim's
   "cap softened too far" failure mode is checked: lifting faithful did NOT lift wrong-in-all.

## Handoff to S-182

The recalibrated term (graded cap + concept-conditional prompt) is ready for the live two-sided crater.
S-182 should confirm: (a) the matched/faithful build now separates clearly above its wrong twins at VOTES≥6
(the E-44 collapse threshold), AND (b) wrong-in-all stays capped — both sides, or the cap was softened too
far. `critiqueEvidence.gradedCap`/`wrongStyleBreadth` are the new evidence fields to report beside the score.

## Recommendation

**Recommend — do not freeze.** No pin rotation, no `measurements/` edit; one same-ticket golden re-pin with
a recorded diff. The S fix is the load-bearing, unit-proven deliverable and stands alone; the R fix is the
contract-level companion whose payoff S-182 confirms live.
</content>

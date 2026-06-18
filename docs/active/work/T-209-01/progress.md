# T-209-01 — Progress

## Status: COMPLETE — all steps done, `npm test` green (2438/2438)

## Steps

- [x] **Step 1 — rewrite `eaveRingClosure`** (`src/view/wall-generate.mjs`). Census the wall plane below the
      eave (`[floor..eaveY-1]`, guarded for single-course walls), keep the full band for the no-program
      fallback, add the ±1-outward-proud tolerance. Doc comment rewritten with the rationale + the
      registration full-face limitation. Committed.
- [x] **Step 2 — reconcile existing literals.** Two real-fixture diagnostics shifted (both still `< 0.9`,
      verdict unchanged): WG-CS10 colonnade 0.608 → **0.667**, WG-CS12 reopened 0.839 → **0.875**. Updated
      with rationale. Folded into the Step 1 commit.
- [x] **Step 3 — WG-CS15–19** (`src/view/wall-generate.test.mjs`). Four real-build fixtures + the consumer
      integration, with a PURE `gableRoof` helper mirroring the runner. Committed.
- [x] **Step 4 — evidence probe** (`docs/active/work/T-209-01/closure-probe.mjs`). Committed.
- [x] **Step 5 — full suite + review.** `npm test` 2438/2438 green; `review.md` written.

## Measured results (real gatehouse build, AC fixtures)

```
fixture                       closure   verdict   AC
seed (open colonnade)          0.667     OPEN      1 ✓ (T-206 invariant held)
after close_shell              1.000     ready
after apply_gable_roof         1.000     ready
after relief_walls (T-208)     0.964     ready     2,4 ✓ (collapse 1.000→0.068 gone)
extent-preserving mid-reopen   0.794     OPEN      3 ✓
  + relief                     ~0.77     OPEN      3 ✓
```

The probe ladder (`node docs/active/work/T-209-01/closure-probe.mjs`):
`0.667 (OPEN) → 1.000 → 1.000 → 0.964 (form-ready)`.

## Deviations from plan

- **None structural.** The plan anticipated the WG-CS10/12 literal shifts (Step 2) and they happened exactly
  as predicted — both stayed `< 0.9`, so the invariant held and only the literals were updated.
- The `acceptsBatch` integration (WG-CS19) confirms the form-integrity guard does not fire on the
  close→gable→relief compound (`closureBefore` 1.000, `closureAfter` 0.964, both ≥0.9) → the +20 batch is
  accepted, not rejected as a reopen.

## Honest notes carried to review

- **Eave-exclusion is the load-bearing fix; ±1-outward-proud is a guarded margin** — on this build it does
  not change the relieved reading (0.964 either way), it only lifts the colonnade (0.608→0.667) and a reopen
  (0.794→0.814), both still well under 0.9. Documented; the fallback if any margin proves thin is to drop the
  proud branch (eave-exclusion alone passes all four fixtures).
- **Registration rescales to the data** → a whole-face loss reads ~1.0 (out of this metric's reach). Fixture
  3 is therefore an extent-preserving mid-face hole, and the limitation is named in the metric's doc comment
  and `design.md`.

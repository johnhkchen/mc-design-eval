# T-185-01 — Plan

Ordered steps. The verdict gates everything; the branch deliverable is built only after the verdict is read.
Commit incrementally. **`measurements/` is never written by this loop** — asserted at Step 5 and again in Review.

## Step 1 — obtain the T-184-01 verdict (the blocking dependency)
Wait for the sibling metered run to land `experiments/eval-alignment/results/style-agreement.json` (it writes
atomically at the end). Monitor `docs/active/work/T-184-01/run-votes6.log` and the results path; do NOT re-run
the harness ([[ticket-double-dispatch]]).
- **Verify:** `results/style-agreement.json` exists, parses, has `recommendation.go ∈ {false,null}`,
  `labelSource:"llm-proxy"`, `licensing:false`, 12 `scoredStates`, a `decomposition` with both effects.
- **No commit** (read-only step).

## Step 2 — write FINDINGS.md (the honest verdict read; AC #1)
Read the decomposition (conceptImageEffect vs packEffect, pooled + per-subject), bucketed agreement (easy vs
hard-middle SEPARATELY), inter-label self-consistency, concordance, the recommendation. Record the **actual**
numbers. State the branch chosen and cite the evidence.
- **Verify:** FINDINGS.md names `recommendation.label` + `go`, the two effects, the agreement buckets, and the
  branch. No hoped-for numbers.
- **Commit:** `docs(T-185-01): FINDINGS — T-184-01 verdict read + branch selected`.

## Step 3 — execute the matching branch

### If `go === null` (GO-LEANING) → Branch A: stage the guarded PROMOTE package
1. `promotion-package/style-distance/bakeoff-score.frozen.mjs` — byte-exact copy of the scorer + a frozen-copy
   header (source commit, "frozen measurement copy").
2. `promotion-package/style-distance/diagnose-build.golden.json` — the rendered `DiagnoseBuild` prompt
   (verbatim, gatehouse-self-concept anchor) + the pinned reply text.
3. `promotion-package/style-distance/{style-distance.json, style-distance.md}` — the record twin + human twin
   (schema `measurements/style-distance/v1`, source, constants, gateEvidence pulled from results JSON).
4. `promotion-package/promote.mjs` — idempotent, dry-run default, `--apply` does `guardedWriteRecord` into
   `measurements/style-distance/`; asserts `isInstrumentPath` true for each target. Direct `node`, reads argv.
5. `promotion-package/verify-replay.mjs` — re-derive the frozen scorer + diff bytes; re-render the prompt + diff
   the golden. Exit non-zero on drift.
6. `promotion-package/README.md` — the reviewer sign-off checklist (verify-replay → dry-run → corpus+human gate
   → `--apply` → commit → re-verify).
- **Verify:** `node promotion-package/verify-replay.mjs` GREEN; `node promotion-package/promote.mjs` (dry-run)
  lists the exact `measurements/style-distance/` targets and confirms PinGuard membership, writing NOTHING;
  `git status --porcelain measurements/` EMPTY.
- **Commit:** `feat(T-185-01): staged guarded style-distance promotion package (sign-off-ready, measurements/ untouched)`.

### If `go === false` (DO-NOT-PROMOTE) → Branch B: localization + follow-on stub
1. `docs/active/work/T-185-01/LOCALIZATION.md` — the concept-image-conditioning localization: the exact seam
   (`diagnoseRenderArgs`/`styleProfileBlock`, pack-derived spec), the confound, the falsifiable repair, the
   decomposition numbers proving PACK-DRIVEN (or the ill-posed/inconclusive reason).
2. `docs/active/tickets/T-186-01.md` (+ `docs/active/stories/S-186.md` if the epic structure needs it) — the
   follow-on stub: claim, seam, AC (re-run the T-184 decomposition; show `conceptImageEffect` dominates).
   Confirm ids against `docs/active/epics/README.md`.
- **Verify:** `git status --porcelain measurements/` EMPTY; `git status --porcelain src/` EMPTY (no code touched
  — the fix is the follow-on's scope). LOCALIZATION.md names the seam + the falsifiable repair.
- **Commit:** `docs(T-185-01): DO-NOT-PROMOTE — concept-image-conditioning localization + T-186-01 follow-on stub`.

## Step 4 — npm test green
- **Verify:** `npm test` green (2302; this loop adds no `src/**/*.test.mjs` in either branch — the package
  scripts are not unit-tested model/IO shells, like the referee).
- (No separate commit; folded into the branch commit or Step 5.)

## Step 5 — structural assertion: measurements/ untouched
- **Verify:** `git status --porcelain measurements/` EMPTY and `git log --oneline -- measurements/` shows no new
  commit from this loop. This is the no-autonomous-freeze guarantee, asserted mechanically (AC: "the no-silent
  -overwrite guard intact"; nothing under `measurements/` changed).

## Step 6 — progress.md + review.md
- `progress.md`: steps done, the branch taken, any deviations.
- `review.md`: files created/modified, the verdict at full strength, test coverage + gaps, open concerns (esp.
  the human sign-off still pending for Branch A, or the follow-on fix for Branch B), and the explicit note that
  the freeze (if any) awaits the human.
- **Commit:** `docs(T-185-01): progress + review — terminal act complete (verdict: <label>)`.

## Testing strategy
- **No new unit tests** (both branches): the gate math is already unit-tested in T-184's `style-agreement.mjs`;
  the PROMOTE package's `verify-replay.mjs` is the *empirical* byte-repro check (run, not asserted in `npm
  test`, like the referee — model/IO/argv shell). `npm test` must stay green (regression guard).
- **Byte-repro (Branch A):** `verify-replay.mjs` is the AC's "post-pin replay verified" — re-runnable, proves
  determinism before and after the human applies.
- **Structural (both):** `git status --porcelain measurements/` EMPTY is the no-autonomous-freeze proof.

## Risks & mitigations
- **Verdict never lands / run stalls:** monitor with bounded backoff; if the run dies, the partial log + the
  committed harness let a re-run reproduce it — but do NOT decide on a partial ([[e44-faithful-integration-promote]]:
  VOTES=2 lied). Surface the stall in `review.md` rather than forcing a verdict.
- **Equivocal verdict (MIXED / INCONCLUSIVE):** routes to Branch B (DO-NOT-PROMOTE) by the recommendation's own
  logic — never promote on a tie ([[anti-hedge-falsifiable-commitment]]).
- **Accidental `measurements/` write:** the package writes only under `docs/active/work/`; `promote.mjs --apply`
  is human-invoked; Step 5 asserts emptiness.
- **Pin replay drift:** `verify-replay.mjs` fails closed (non-zero) → do not stage a non-reproducible pin.
</content>

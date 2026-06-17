# T-181-01 — Plan

Ordered, independently-verifiable steps. S (commit 1) is the load-bearing unit-proven fix; R (commit 2) is
the contract-level concept-conditional prompt + deterministic golden re-pin. `npm test` green at each commit;
nothing under `measurements/`.

## Step 1 — S fix: graded style-distance in `styleFidelityScore`

- Edit `src/workshop/bakeoff-score.mjs`:
  - Add module-local `wrongStyleBreadth(items)` → count of distinct `department` (fallback `__item${i}`)
    among `itemStyleClass(it)==="wrong-style"` items.
  - `styleFidelityScore`: wrong-style penalty `(PENALTY[severity] ?? PENALTY.major) + WRONG_STYLE.distance`;
    cap `Math.min(score, Math.max(WRONG_STYLE.cap, 100 - breadth*WRONG_STYLE.distance))` when breadth>0.
  - `critiqueEvidence`: additive `wrongStyleBreadth`, `gradedCap`.
  - Rewrite the `WRONG_STYLE` + `styleFidelityScore` doc comments (cap=floor, distance=double-duty, graded).
- **Verify:** `node -e` spot-check faithful-except-one=68, two-wrong=36, wrong-in-all=0, monotone b=1..5.

## Step 2 — S tests: BO14 suite + regression fixture

- Append BO14a–f to `src/workshop/bakeoff-score.test.mjs` (per structure.md). The OLD-math regression
  reconstruction (BO14b) is the named "binary-cap collapse" fixture.
- **Verify:** `npm test` green; BO1-BO13 unchanged and passing (esp. BO7/BO9/BO10).

## Step 3 — Commit 1 (S)

- `npm test` green, confirm `git status` shows only `bakeoff-score.mjs` + `.test.mjs` + work artifacts.
- Commit: `feat(T-181-01): graded style-distance replaces binary cap (S fix) + BO14`.

## Step 4 — R fix: concept-conditional `DiagnoseBuild` prompt

- Edit `baml_src/department.baml`: append the same-style-family sentence to the `kind`-tagging instruction.
- Regenerate the golden deterministically: throwaway script calling
  `bamlBatch([{fn:"DiagnoseBuild",mode:"render",args:diagnose/inputs.json,images:{concept,renders}}])`,
  write `R[0].prompt` to `src/baml/fixtures/diagnose/prompt.golden.txt`. (Render mode = no metered call.)
- **Verify:** `git diff` shows the golden changed by exactly the inserted sentence (+ Jinja whitespace);
  capture it to `docs/active/work/T-181-01/prompt-diff.txt`.

## Step 5 — Full suite + scope guard

- **Verify:** `npm test` green (FX-DB1 re-pinned, FX-DB2 parse pin untouched). `git status --porcelain`
  shows **no path under `measurements/`**. `git diff --stat` is exactly: `bakeoff-score.mjs`,
  `bakeoff-score.test.mjs`, `department.baml`, `prompt.golden.txt`, + `docs/active/work/T-181-01/*`.

## Step 6 — Commit 2 (R)

- Commit: `feat(T-181-01): concept-conditional replace tag in DiagnoseBuild + golden re-pin`.

## Testing strategy

- **Unit (gating):** BO14 in the PURE `bakeoff-score.test.mjs` glob — the falsifiable claim lives here
  (faithful-except-one ≫ wrong-in-all; old-collapse regression; monotonicity; severity; legit roof).
- **Fixture (gating):** FX-DB1 re-pins the deterministic prompt render; FX-DB2 (parse) proves the schema is
  untouched. Both run under `npm test`.
- **NOT tested here (documented):** the R fix's *live efficacy* (does the judge stop tagging faithful stone
  `replace`?) — needs metered votes → **S-182**'s two-sided crater. The falsifiable claim names this hedge.

## Verification criteria (done = all)

- [ ] faithful-except-one (incl. legit roof:replace) scores ≥60 and ≥50 above wrong-in-all (≤5).
- [ ] OLD-math regression fixture shows the binary-cap collapse (faithful crushed to 40, ~two-wrong band);
      NEW lifts it clearly above.
- [ ] `score(b)` strictly decreasing over b=1..5.
- [ ] BO7/BO9/BO10/BO11/BO13 unchanged and green (no E-40 pin drift).
- [ ] If the prompt changed: `prompt-diff.txt` recorded + golden re-pinned in THIS ticket; FX-DB1 green.
- [ ] `npm test` green; nothing under `measurements/`; recommend-not-freeze.

## Rollback / risk

- If the golden re-render fails in this env (bridge unavailable), **commit 1 (S) still stands** as the proven
  fix; document R as a precisely-specified prompt diff for S-182 and do NOT hand-edit the golden (a
  hand-authored golden that doesn't match the real render would make FX-DB1 lie).
</content>

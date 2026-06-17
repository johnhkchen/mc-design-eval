# T-181-01 — Progress

## Step 1 — S fix (graded style-distance) ✅
- `src/workshop/bakeoff-score.mjs`:
  - `WRONG_STYLE` doc rewritten (cap=wrong-in-all floor; distance=double-duty unit). Value unchanged → BO7 holds.
  - Added module-local `wrongStyleBreadth(items)` (distinct wrong-style departments) + `gradedCapFor(b)`.
  - `styleFidelityScore`: severity-respecting per-replace (`PENALTY[sev] ?? major`) + `distance`; graded cap
    `max(cap, 100 − distance·breadth)` replacing the binary `min(score,40)`.
  - `critiqueEvidence`: additive `wrongStyleBreadth`, `gradedCap`.
- Spot-check: faithful=68, two-wrong=36, wrong-in-all=0, minor=80, BO9 matched=40/wrong=4. ✅

## Step 2 — S tests (BO14a–f) ✅
- Appended to `bakeoff-score.test.mjs`: faithful≫wrong-in-all; old-collapse regression fixture; monotone
  cap 88→40; severity-respecting; legit-roof + breadth-vs-count; BO9 back-compat guard.
- `node --test bakeoff-score.test.mjs` → 23/23. Full `npm test` → **2289/2289 green** (was 2283; +6 BO14).

## Step 3 — Commit 1 (S) ✅
- Committed on branch `main` (work branch). Scope: bakeoff-score.mjs + .test.mjs + work artifacts only.

## Step 4 — R fix (concept-conditional DiagnoseBuild prompt) — in progress
- Append the same-style-family sentence; regenerate `prompt.golden.txt` deterministically; capture diff.

## Step 5/6 — full suite + scope guard + commit 2 — pending

## Deviations
- None. The graded-cap design is backward-compatible with every existing E-40 pin (BO7/BO9/BO10/BO11/BO13),
  which is why no existing test needed editing — a strong signal the change is minimal/principled.
</content>

# T-178-01 — Design

Goal: run the crater Section A at **VOTES≥4–6** on `builds/gatehouse/faithful-covered`, report spread vs ±12
noise + **std across votes** + the per-item `kind`/`styleClass` audit + comparison to T-173-01, and land a
PROMOTE / re-calibrate / do-not-promote recommendation with evidence. Recommend, do not freeze.

## What has to change vs. what is already there

Almost everything is wired (T-173-01 made `CRATER_BUILD`/`CRATER_ONLY` env-driven). **Two gaps:**

1. **VOTES is hardcoded** (`const VOTES = 2;`). The ticket's *explicit lever* is votes ≥ 4–6 → must be
   env-overridable.
2. **No std is reported.** The harness persists every vote's `score` but only aggregates `scoreMean`. The
   ticket requires **std across votes** (the headline robustness number — fragile-vs-robust is literally a
   variance question). Must be computed and written into the result JSON.

Everything else (conditions, scoring, kindReliability, beside-PNG composition, asset guard, no-re-ask) is
correct and reused unchanged.

## Option A — env-overridable VOTES + std in the harness (CHOSEN)

Make `VOTES = Number(process.env.VOTES ?? 2)` and add a `std` (population stddev) to each condition's report
alongside `scoreMean`, computed from the already-collected `votes[].score`. Run with `VOTES=6`. Write to a
new result file `corpus-referee-faithful-covered.json` (no clobber of committed baselines).

- **Pros:** minimal, additive, in the *creation-side metered harness* (allowed). Default stays `2` → the
  E-40/T-170-02/T-173-01 reproductions are byte-unchanged when env is unset. std is derivable from data the
  harness already keeps, so it's a pure reporting add. Reuses the entire crater path verbatim → the run is
  directly comparable to T-173-01.
- **Cons:** edits the shared `corpus-referee.mjs` (sibling tickets T-176/T-179 also touch eval-alignment, but
  not this file — [[shared-file-commit-sweep]] applies: re-Read before edit, additive only, commit green).
- **Why it wins:** the ticket *names* VOTES as "the explicit lever"; the change is the smallest thing that
  pulls it, and std falls out for free.

## Option B — a new bespoke runner (REJECTED)

Write a fresh `crater-confirm.mjs` that imports the scoring and re-implements the vote loop with std.

- **Rejected:** duplicates `runCrater` (conditions, beside-PNG, guard, kindReliability) — every divergence is
  a way for the run to *not* be comparable to T-173-01, which is the whole point of the re-run. More code,
  more risk, no benefit. The harness was already built env-parameterized for exactly this.

## Option C — VOTES=4 vs VOTES=6 (decision within A)

The ticket says "≥4–6". The robustness claim hinges on tightening the means until the std is small enough to
trust the spread. **Choose VOTES=6** — the explicit upper. Rationale: T-173-01's matched scored 40/16 (a
24-point swing) at VOTES=2; with the capping mechanic, the score is a near-bimodal function of the `replace`
count (0/1 replace → 40, 2 → 0), so the *mean* needs several samples to estimate the true `replace`-rate per
condition. 6 votes gives a defensible mean ± std; 4 would leave the std itself noisy. Cost (24 calls) is
acceptable for the measurement payoff of the whole epic.

## How the verdict is decided (anti-hedge branches, decided up front)

Read off `A = mean(A-matched)`, `B = mean(B-arc)`, `B2 = mean(B2-chapelle)`, `C = mean(C-control)`, each
with its std, plus the per-item `replace`-count distribution and `replaceContrast`.

| Outcome | Signature | Recommendation |
|---|---|---|
| **Robust crater** | `A−B` well outside ±12 **and** `> 2·NOISE=24`; std small enough that `A−B` clears the bar at `mean−std`; matched no longer self-caps (its `replace` count ≈ 0); ideally `A−B2` also clears now that the roof is faithful | **PROMOTE** (with the exact guarded freeze step spelled out for the human, NOT executed) |
| **Fragile / collapses** | `A−B` shrinks at higher votes, or std so large the bar is a coin-flip; or `A` and `B` both floor | **RE-CALIBRATE** the term's distance *scale* — the gate was the measure, not the build (the *opposite* of the bet, reported honestly) |
| **Wrong-style twin clears** | `B` (and/or B2) rises above the noise floor — term under-penalizes | **DO-NOT-PROMOTE** — term under-penalizes the close style |
| **Build still earns `replace`** | matched still carries a persistent `replace` item (esp. ROOF) across votes | It wasn't fully faithful → **name the residual defect, hand back to S-177** |

These are mutually exclusive reads of the same numbers; the run picks one, reported with the per-vote trail.

## std definition

Population std over the `votes[].score` array per condition: `sqrt(mean((x−mean)²))`. Population (not sample)
because we treat the votes as the full sampled set for that condition at that N; both are fine, population is
simpler and the N is fixed. Reported per condition and surfaced for A and B in the verdict line.

## Outputs

- `experiments/eval-alignment/results/corpus-referee-faithful-covered.json` — the committed result (AC #1).
- `docs/active/work/T-178-01/{crater-matched,crater-wrongstyle,crater-wrongstyle-2}.png` — beside-concept
  composites (AC #2), written by `runCrater` to `REFEREE_OUT_DIR`.
- `docs/active/work/T-178-01/FINDINGS.md` — the report + recommendation (AC #2/#3/#4).
- The faithful-covered build's own `view-*.png` + `beside-concept.png` referenced from FINDINGS (AC #2).

## What is explicitly NOT touched

`measurements/`, `src/workshop/bakeoff-score.mjs` (the scoring), the committed baseline result JSONs, the
held-FIXED PROGRAM/conditions, and the default `VOTES=2`. Frozen instrument untouched (AC #5).

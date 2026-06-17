# T-178-01 — Plan

Ordered, independently-verifiable steps. The code change is tiny; the spend is the long pole; the report is
the deliverable.

## Step 1 — Make VOTES env-overridable + add std (harness edit)

- Re-Read `experiments/eval-alignment/corpus-referee.mjs` immediately before editing (sibling-sweep guard).
- Edit line 57: `const VOTES = Number(process.env.VOTES ?? 2);`
- Add `std` helper next to `mean`; emit `scoreStd` in the `conditions.push` in `runCrater`.
- Append `±std` to the A/B verdict console line (operator nicety; JSON is canonical).
- **Verify:** `GUARD_ONLY=1 ... npm run corpus-referee` (no spend) parses + loads + prints the guard line
  for `builds/gatehouse/faithful-covered`. Confirms the edit didn't break import/parse.
- **Commit:** `feat(T-178-01): VOTES env-overridable + scoreStd in crater harness` (additive, default
  unchanged).

## Step 2 — Run the crater at VOTES=6 (the spend)

```
CRATER_BUILD=builds/gatehouse/faithful-covered \
CRATER_ONLY=1 \
VOTES=6 \
REFEREE_OUT_DIR=docs/active/work/T-178-01 \
REFEREE_RESULTS=experiments/eval-alignment/results/corpus-referee-faithful-covered.json \
npm run corpus-referee
```
- 4 conditions × 6 votes = 24 image-diagnose calls (strong tier / opus). Run in background; it is the long
  pole.
- **Verify:** result JSON written; the console VERDICT line prints A/B/B2/C; beside-PNGs in the work dir.
- No re-ask on any malformed vote — that's harness policy; a degenerate vote is data, not an error to retry.

## Step 3 — Read the result; build the spread + std + audit

- From `corpus-referee-faithful-covered.json`: pull `crater.scores` (means), each condition's `scoreStd` and
  raw `votes[].score`, the per-item `kind`/`styleClass` trail, and `kindReliability`.
- Compute: `A−B`, `A−B2`, `A−C`, `C−B`; does `A−B` clear `2·NOISE=24`? Does it clear at `mean−std`?
- Audit: per-condition `replace`-count distribution across the 6 votes (the cap driver); does matched
  (A) still carry any persistent ROOF/WALL `replace` (self-cap)? Compare to T-173-01's 28/0 and the prism
  roof's residual `replace`.

## Step 4 — Decide the verdict + write FINDINGS.md

Pick exactly one branch (from design.md's decision table), grounded in the numbers:
- **Robust crater** → PROMOTE recommendation; spell out the guarded freeze step (which file under
  `measurements/`, which pin) for the human — **do not execute**.
- **Fragile/collapse** → re-calibrate the term's distance scale (gate = measure, not build).
- **Twin clears** → do-not-promote (term under-penalizes).
- **Matched still `replace`** → name the residual defect, hand back to S-177.

FINDINGS.md must contain: spread table vs ±12 + vs T-173-01 (28/0) + vs T-170-02 (8/14); std across votes;
per-item audit; honest robustness read (no softening a non-separation); the recommendation with evidence;
renders referenced (beside-concept composites + the faithful-covered views).

## Step 5 — Regression guard + finalize

- `npm test` — green (only a metered harness changed; the suite shouldn't move). Note any pre-existing
  failures (TG26 sibling-uncommitted per T-177-01 observations) and confirm they are NOT mine.
- Confirm `measurements/` untouched (`git status` shows nothing under it).
- **Commit:** the result JSON + beside-PNGs + FINDINGS.
- Write progress.md (Implement artifact) and review.md (Review artifact).

## Testing strategy

- **No unit tests** — the change is a metered experiment harness not in `npm test`; its correctness is the
  `GUARD_ONLY` dry-run (parse/load) + the actual run producing a well-formed JSON. Adding a unit test for a
  one-line env read + a 1-line std helper would be ceremony; the std formula is verified by eye against the
  raw `votes[].score` in the report.
- **Integration verification** = the run itself: 24 votes complete, JSON schema intact, beside-PNGs render.
- **Frozen-instrument guard** = `git status` clean under `measurements/`; `npm test` green.

## Verification criteria (maps to AC)

- AC#1: result committed to `results/` at VOTES=6, matched vs wrong-style. ✓ Step 2/5.
- AC#2: report with spread vs ±12, **std across votes**, vs T-173-01 (28/0), per-item `kind`/`styleClass`
  audit, renders beside both concepts. ✓ Step 4.
- AC#3: recorded honestly — robust/fragile/collapse; residual gate localized (term scale vs build). ✓ Step 4.
- AC#4: PROMOTE/re-calibrate/do-not-promote recommendation; if PROMOTE, exact guarded freeze step (file,
  pin), not executed. ✓ Step 4.
- AC#5: `npm test` green; frozen instrument untouched. ✓ Step 5.

# T-178-01 — Structure

The blueprint. Two tiny additive edits to one metered harness file, one run, two written reports. No new
modules, no `src/` change, no `measurements/` change.

## Files MODIFIED

### `experiments/eval-alignment/corpus-referee.mjs` (the only code change)

Two additive edits, both inside the existing crater path:

1. **VOTES env-overridable** (line 57):
   ```js
   const VOTES = Number(process.env.VOTES ?? 2);   // T-178-01: ≥4–6 lever; default 2 keeps E-40/T-173-01 reproducible
   ```
   - Boundary: default unchanged when env unset → every prior reproduction (corpus-referee.json,
     corpus-referee-kind.json, corpus-referee-faithful.json) stays byte-identical on re-run.

2. **std per condition** in `runCrater` (the `conditions.push(...)` at ~line 152). Add a local
   `std` helper near `mean` (line ~83) and emit `scoreStd`:
   ```js
   const std = (a) => { const m = mean(a); return a.length ? Math.sqrt(mean(a.map((v) => (v - m) ** 2))) : 0; };
   ...
   const scores = votes.map((x) => x.score);
   conditions.push({ ...c, scoreMean: round(mean(scores)), scoreStd: round(std(scores)), votes });
   ```
   - The `votes` array (with per-vote `score` + full item triple) is *already* persisted, so this is pure
     reporting over data on hand.

3. **Surface std in the verdict console line** (optional, ~line 277) — append `±std` to A/B for the operator;
   the JSON is the source of truth.

No other lines change. `CRATER_BUILD`, `CRATER_ONLY`, `REFEREE_OUT_DIR`, `REFEREE_RESULTS`, conditions,
scoring import, kindReliability, beside-PNG, guard — all reused verbatim.

## Files CREATED (artifacts / results, not code)

### `experiments/eval-alignment/results/corpus-referee-faithful-covered.json`
The run output, via `REFEREE_RESULTS=...`. Same schema as `corpus-referee-faithful.json` plus `scoreStd` per
condition and `votes: VOTES` at top level. Committed (AC #1). Does NOT overwrite any baseline.

### `docs/active/work/T-178-01/crater-{matched,wrongstyle,wrongstyle-2}.png`
Beside-concept composites written by `runCrater` to `REFEREE_OUT_DIR`. Committed (AC #2). (Build PNGs under
`builds/` are gitignored — per T-177-01, only artifact.json/SOURCE.md commit there; the beside composites in
the work dir are the committed renders.)

### `docs/active/work/T-178-01/FINDINGS.md`
The report (AC #2/#3/#4). Sections:
- **Headline** — robust / fragile / collapse, one sentence, lead with how it could have failed.
- **Spread table** — A/B/B2/C means **± std**, A−B, A−B2, A−C, C−B; the ±12 noise band and the 2·NOISE=24
  bar; a row for T-173-01 (28/0 @ VOTES=2) and T-170-02 (8/14) for comparison.
- **Per-item `kind`/`styleClass` audit** — the `replace`-count per condition per vote (what drives the cap);
  whether matched still self-caps (any ROOF/WALL `replace`); `replaceContrast` + its verdict.
- **Robustness read** — std across votes; does A−B clear 24 at `mean−std`? coin-flip or stable?
- **Recommendation** — PROMOTE / re-calibrate / do-not-promote, with the *exact guarded freeze step*
  (file + pin) spelled out for the human if PROMOTE — NOT executed.

### `docs/active/work/T-178-01/progress.md`, `review.md`
RDSPI artifacts.

## Files NOT touched (guardrails)

- `measurements/**` — frozen instrument (pin-guard prefix). Zero edits.
- `src/workshop/bakeoff-score.mjs` — the scoring math. Zero edits (std is computed in the harness, not the
  scorer).
- `experiments/eval-alignment/results/corpus-referee*.json` (the three baselines) — never overwritten; new
  file name.
- `src/view/treatment-grammar*.mjs` — sibling T-179-01's files (already modified in the tree); do not touch.

## Ordering that matters

1. Edit harness (VOTES env + std) **before** the run.
2. `npm test` after the edit, **before** the spend, to catch any breakage cheaply (the harness isn't in the
   suite, but a typo could still break import-time). Actually the harness is not imported by tests — the real
   guard is a `GUARD_ONLY=1` dry-run of the edited file (no spend) to confirm it parses and loads.
3. Run the metered crater (the spend).
4. Write FINDINGS from the result JSON.
5. `npm test` green + commit.

## Risk register

- **Variance still large at VOTES=6** → that *is* a finding (fragile). Report the std honestly; do not bump
  to VOTES=10 chasing a crater (anti-hedge: a non-separation is valuable).
- **A malformed judge reply** → harness already returns a degenerate critique (no re-ask). One bad vote shows
  as an outlier in the std; report it, don't retry ([[spend-limit-reply-failure-mode]]).
- **Sibling commit sweep** on eval-alignment files → re-Read `corpus-referee.mjs` immediately before editing;
  additive edits only ([[shared-file-commit-sweep]]).

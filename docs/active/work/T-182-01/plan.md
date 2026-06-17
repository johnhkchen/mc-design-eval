# T-182-01 — Plan

Ordered, independently verifiable steps. The metered run is the load-bearing step; everything else is
pre-flight, interpretation, and provenance. No production code changes → the testing strategy is "the
instrument and the suite stay green," not new unit tests (the scoring mechanism was unit-tested in T-181-01's
BO14; this ticket tests the *live* behavior, which is empirical and cannot be a unit test).

## Step 1 — Pre-flight asset guard (DONE)

`GUARD_ONLY=1 …npm run corpus-referee` → `7 assets present`. ✅ Verified before any artifact assumed the run
would work. Also confirmed the R fix is compiled into `baml_client/inlinedbaml.ts` and committed (clean `git
status`), so the metered run exercises the concept-conditional prompt, not a stale client.

**Verify:** guard prints `assets present` and exits clean; `grep CONCEPT-CONDITIONAL baml_client/` hits.

## Step 2 — Metered crater re-run (background)

```
CRATER_ONLY=1 CRATER_BUILD=builds/gatehouse/faithful-covered VOTES=6 \
REFEREE_RESULTS=experiments/eval-alignment/results/corpus-referee-recalibrated.json \
REFEREE_OUT_DIR=docs/active/work/T-182-01 \
npm run corpus-referee 2>&1 | tee docs/active/work/T-182-01/run-votes6.log
```

~24 strong-tier image-diagnose calls (4 conditions × 6 votes). Run in background; monitor the log for the
per-vote `[crater] … vN: score=…` lines and the final `CORPUS REFEREE VERDICT` block.

**Verify:** the run exits 0; `corpus-referee-recalibrated.json` exists with `.crater.conditions` length 4 and
each condition carrying 6 votes; the three beside PNGs exist in the work dir; `corpus-referee-faithful-
covered.json` (T-178-01) is byte-unchanged (the baseline survived).

**Rollback risk:** none — read-only against production; only writes a new result file + PNGs + log. If the run
errors mid-way (malformed reply, auth), no re-ask burns budget; re-invoke the whole command (idempotent —
overwrites its own sink).

## Step 3 — Read and classify the result

Parse `.crater`: `scores {A,B,B2,C}`, per-condition `scoreStd`, per-vote `votes[].score` arrays, per-item
`votes[].items[]` audit, `spreads`, `kindReliability.replaceContrast`, `cratered`/`collapsed`/`verdict`.

Classify into exactly one of the design's four outcomes:
- **two-sided separation** → A−B > 24, B stays low, `replaceContrast > 0`, matched drops WALL/OPENING `replace`.
- **one-sided lift** → B also lifts → TIGHTEN.
- **under-penalty / non-separation** → A still floored → RE-LOCALIZE (hand to judge model).
- **fixture over-fit** → separation rides a constant → report sensitivity.

**Verify:** the chosen class is supported by BOTH the scalar (A−B vs ±12 at mean and mean−std) AND the
mechanism (per-item audit + `replaceContrast`), not the scalar alone (the T-178-01 lesson).

## Step 4 — Write `FINDINGS.md`

Per structure.md's 7-section shape. Lead with how it could have failed (anti-hedge). Include the spread table
with the T-178-01 (13/0) and T-173-01 (28/0) rows for comparison, the per-vote arrays, the per-item audit, the
three renders, the localization, the recommendation **with the breadth caveat**, and — only if PROMOTE — the
exact unexecuted guarded freeze step.

**Verify:** every AC2 element present (A−B vs ±12, std, replaceContrast, per-item kind/styleClass audit,
comparison rows, renders); the recommendation names the breadth caveat and the labeled-corpus bar.

## Step 5 — Suite + instrument check

`npm test` → expect 2289/2289 green (no production change → no test should move). Confirm `git status` shows no
edits under `measurements/`, `src/`, `baml_src/`, `baml_client/`, or `corpus-referee.mjs`.

**Verify:** suite green; `git status --short measurements/ src/ baml_src/` empty.

## Step 6 — Commit

One commit: the result JSON + the three PNGs + the log + all work-dir artifacts (research → FINDINGS). Message:
`docs(T-182-01): crater re-run @VOTES=6 on recalibrated term — <one-line verdict>`. The run is the unit of
work; there is no incremental production change to stage separately.

**Verify:** commit contains `corpus-referee-recalibrated.json` and the work-dir artifacts; nothing under
`measurements/`.

## Step 7 — `review.md`

Self-assessment: what changed (a result file + a report, no code), test coverage (suite green, no new tests by
design — the live behavior is the test, recorded in FINDINGS), open concerns (breadth gap; R-fix efficacy
finding; whether the labeled corpus is now the gating next step), and the handoff (PROMOTE path's exact freeze
step, or the re-localization target). **Stop after review.md** — Lisa handles transitions.

## Testing strategy summary

No new unit tests. The S-fix mechanism is already covered by BO14 (T-181-01). This ticket's "test" is the
*empirical* two-sided crater — its result lives in the committed JSON + FINDINGS, reproducible by re-running
Step 2. The suite-green check (Step 5) is the regression guard that nothing leaked into production or the
instrument.

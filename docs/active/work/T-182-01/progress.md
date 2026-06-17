# T-182-01 — Progress

## Done
- **Step 1 — pre-flight (DONE).** `GUARD_ONLY=1` run → `7 assets present`. Confirmed R fix compiled into
  `baml_client/inlinedbaml.ts` and committed (`git status` clean); the metered run exercises the
  concept-conditional prompt, not a stale client.
- **Planning artifacts** research/design/structure/plan written.
- **Step 2 — metered run LAUNCHED** in background (id `b3tqgqb0f`), logging to `run-votes6.log`. Command exactly
  per plan: `CRATER_ONLY=1 CRATER_BUILD=builds/gatehouse/faithful-covered VOTES=6
  REFEREE_RESULTS=…corpus-referee-recalibrated.json REFEREE_OUT_DIR=docs/active/work/T-182-01`.

- **Step 2 — run COMPLETE** (exit 0). Results: A=41±7, B=19±9, B2=20±0, C=48±10; A−B=22; replaceContrast=+0.245
  (DISCRIMINATES, flipped from T-178-01's −0.20). Matched earns 0/25 `replace`; wrong twins 6/25 & 6/24.
  `corpus-referee-recalibrated.json` written; 3 beside PNGs written; T-178-01 baseline byte-unchanged.
- **Step 3 — classified:** two-sided directional separation; mechanism fixed; scalar marginal (A−B<24) +
  pack-confounded (C−B=29 vs A−C=−7) → PROMOTE-LEANING, gate on labeled corpus, do not freeze.
- **Step 4 — FINDINGS.md written.**
- **Step 5 — `npm test` 2289/2289 green; `measurements/`/`src/`/`baml_*`/`corpus-referee.mjs` untouched.**

## Remaining
- Step 6 commit, Step 7 review.md.

## Deviations
- None. Env-knob invocation (design Option A), new result filename (clobber-safe), zero production edits.

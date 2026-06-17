# T-191-01 — PROGRESS

## Done

- **Step 1 — `deptItemCounts` helper + CG13.** `deptItemCounts(items)` → `{[dept]:{major,minor}}`, pure,
  the net companion to `deptMajorCounts`. CG13 green.
- **Step 2 — `departmentDominant` + override path in `acceptsRound`.** Private `departmentDominant({...})`
  encodes (a) cleared a targeted major, (b) no new major in any targeted dept, (c) net guard — no targeted
  dept's total burden grew (active only when item counts supplied; degrades to major-only otherwise). Wired
  into `acceptsRound` **before** the regression reject so it fires on regressions. Removed the now-subsumed
  T-190 tie-zone department leg. Two new optional params (`beforeDeptItems`, `afterDeptItems`). JSDoc updated.
- **Step 3 — falsification tests.** CG11 4th case UPDATED to the intended semantic break (past-margin
  regression + cleared targeted major + no net growth now KEEPS, reason `…department-dominant override`).
  CG14 KEEPS the real recorded T-190 grey-roof shape (ROOF `{1,1}`→`{0,1}`, WALL/OPENING promoted, Δ −12).
  CG15 REJECTS the adversarial fixture (ROOF `{1,0}`→`{0,2}`) via the net guard AND asserts the major-only
  path LEAKS (keeps it) — the documented reason the net guard exists. CG16 rejects a genuinely-bad change
  that clears nothing (ROOF major `1→1`).
- **Step 4 — runner wiring.** `picture-climb.mjs` imports `deptItemCounts`, computes before/after item
  counts at the decision site, passes them to `acceptsRound`, and records `deptItemsBefore/After` in the
  trajectory. `GUARD_ONLY=1` run clean (wiring + render seam, zero spend, GL available).
- **Step 5 — full suite green.** `npm test` → 2326 pass, 0 fail. `git status` scoped to the three intended
  source files + this work dir; no frozen-instrument file changed.
- **Committed** Steps 1–4 in one atomic commit (the pure rule + tests + runner wiring are one logical change).

## Pure-fixture falsification result (the primary, deterministic proof)

The override is a **decision**, so the KEEP and the REJECT are proven deterministically by unit fixtures
built from the *real recorded* T-190-01 round-3 counts (not synthetic guesses):

- **KEEP (CG14):** the exact T-190 shape — `recolor_roof` clears the ROOF major, judge promotes UNtargeted
  WALL+OPENING majors, whole-build Δ −12, ROOF total burden falls 2→1 — is now **ACCEPTED** by the override.
  Pre-T-191 this rolled back at the regression branch. The ruler now follows the glance.
- **REJECT (CG15):** an adversarial fixture that clears the ROOF major but adds 2 ROOF minors (net 1→2) is
  **REJECTED** by the net guard; the major-only path is shown to LEAK it. Department-trust did **need** the
  net (net-minor) tightening — the major-only guard alone is insufficient, exactly as S-191 anticipated.
- **REJECT (CG16):** a genuinely-bad change that clears nothing is rejected as a plain regression.

## Step 6 — the metered KEEP re-run (corroborating glance proof)

Attempting `CLIMB_OUT=docs/active/work/T-191-01/trajectory.json node experiments/eval-alignment/picture-climb.mjs`
(GL confirmed available; metered LLM spend, non-deterministic). Outcome + observed vote bands recorded in
`review.md`. If the run cannot complete in this environment, the deterministic CG14 keep (grounded in the
real recorded counts) + CG15/CG16 rejects stand as the falsification; reported honestly, not hidden.

## Deviations from plan

- Steps 1–4 committed together rather than as four commits: the override is meaningless without its tests and
  the runner can't be exercised without it — one atomic logical unit. The plan's per-step *verification* was
  still performed in order (CG13 → override → CG14–16 → runner guard → full suite).

# T-191-01 — PLAN: ordered, independently-verifiable steps

Each step is small enough to commit atomically. Testing strategy: the gate rule is **pure**, so the KEEP and
the adversarial REJECT are both *unit-tested* (they are decisions, not run outcomes) — the unit fixtures are
the primary proof and gate `npm test`. The metered re-run is the *corroborating* glance proof; if the
environment cannot run it (GL/LLM spend), the unit reject + the trajectory-grounded keep fixture still
satisfy the falsification, reported honestly.

## Step 1 — `deptItemCounts` helper + unit test (pure)

- Add `deptItemCounts(items)` to `climb-gate.mjs` (structure §1a).
- Add **CG13** to `climb-gate.test.mjs`: `{major,minor}` per dept; ignores no-department items; `[]`/`undefined`
  → `{}`.
- **Verify:** `node --test src/workshop/climb-gate.test.mjs` — CG13 green, CG1–CG12 still green.
- **Commit:** `feat(T-191-01): deptItemCounts — per-department {major,minor} for the net guard`.

## Step 2 — `departmentDominant` + override path in `acceptsRound` (pure)

- Add private `departmentDominant({...})` (structure §1b): rule (a) cleared, (b) no new major in a target,
  (c) no net total growth in a target (skipped when item counts absent → major-only).
- Wire it into `acceptsRound` (structure §1c): override path **before** the regression reject; remove the
  now-subsumed tie-zone department leg; add `beforeDeptItems`/`afterDeptItems` params; update JSDoc.
- **Verify (intermediate):** CG1–CG3, CG10, CG12 unchanged green; CG11 first three cases green; CG11 4th
  case will fail until Step 3 updates it (expected — note it in `progress.md`).
- **Commit:** `feat(T-191-01): department-dominant override fires on a scalar regression (net-guarded)`.

## Step 3 — falsification tests: KEEP, REJECT, leak, bad-change (pure)

- **CG11 4th case (UPDATE):** past-margin regression + cleared ROOF major + item counts showing no net
  growth → now **KEEP** (`/department-dominant override/`). First three CG11 cases unchanged.
- **CG14 (NEW) — KEEP the real grey roof:** the T-190 trajectory shape (ROOF `{1,1}`→`{0,1}`, WALL/OPENING
  majors promoted, delta −12) → accept, reason `/ROOF cleared a major \(department-dominant override\)/`.
- **CG15 (NEW) — REJECT the adversarial + document the leak:** ROOF `{1,0}`→`{0,2}`, delta −12.
  - with item counts → reject `/regressed/` (net guard (c));
  - without item counts → accept `/department-dominant override/` (the documented major-only leak).
- **CG16 (NEW) — genuinely-bad change:** ROOF major `1→1` (not cleared), delta −12 → reject `/regressed/`.
- **Verify:** `node --test src/workshop/climb-gate.test.mjs` — all green (CG1–CG16).
- **Commit:** `test(T-191-01): falsify the override — KEEP grey roof, REJECT adversarial, document the leak`.

## Step 4 — wire item counts into the runner

- `picture-climb.mjs`: import `deptItemCounts`; compute `beforeDeptItems`/`afterDeptItems`; pass to
  `acceptsRound`; record `deptItemsBefore/After` in the trajectory (structure §3).
- **Verify (no spend):** `GUARD_ONLY=1 node experiments/eval-alignment/picture-climb.mjs` — wiring + render
  seam runs, zero spend, no throw; confirm the import resolves and the decision site is well-formed.
- **Commit:** `feat(T-191-01): runner threads deptItemCounts into the department-dominant gate`.

## Step 5 — full test suite green

- **Verify:** `npm test` — artifact self-test + unit suite all green. Confirm no frozen-instrument file
  changed (`git status` shows only the three intended files + this work dir).
- No separate commit (covered by Steps 1–4); this is the green-bar checkpoint before the metered run.

## Step 6 — the metered KEEP re-run (corroborating glance proof)

- Run: `CLIMB_OUT=docs/active/work/T-191-01/trajectory.json node experiments/eval-alignment/picture-climb.mjs`.
- **Expected:** round-3 `recolor_roof` KEPT (gate reason `… department-dominant override`), the grey
  `deepslate_tiles` roof sticks, trend continues past 60; copy the round-3 beside-concept render into the
  work dir (`round-grey-kept-beside.png`); capture `run.log`.
- **Report the vote bands** (the grey vs brown vote spreads) so keep/reject is calibrated, not asserted.
- **If GL/LLM unavailable or the run cannot complete:** record that honestly in `progress.md`/`review.md` and
  lean on the trajectory-grounded CG14 keep fixture (built from the *real recorded* T-190 round-3 counts) +
  the CG15 adversarial reject. Do **not** fabricate a render.
- **Commit (if run completes):** `docs(T-191-01): metered KEEP re-run — grey roof sticks past 60 + beside render`.

## Step 7 — Review artifact

- Write `review.md`: files changed, the rule, KEEP + REJECT evidence, whether department-trust held or needed
  the net tightening, the observed vote bands, and whether vote-noise reduction is also needed.

## Testing strategy summary

| Claim | How verified | Where |
|---|---|---|
| Override KEEPS the glance-correct roof | unit fixture from real T-190 counts (CG14) + metered re-run (Step 6) | test + run.log |
| Override REJECTS a genuinely-bad change | CG15 (adversarial) + CG16 (no-clear) | unit |
| Major-only guard leaks; net guard plugs it | CG15 dual assertion (with/without item counts) | unit |
| No regression in existing gate behavior | CG1–CG12 unchanged green | unit |
| Frozen instrument untouched | `git status` scoped to 3 files + work dir | checkpoint |

## Risks & mitigations

- **Net guard too strict → kills the real keep.** Mitigated: rule (c) is *total-item*, not *no-new-minor*;
  the recorded ROOF total falls 2→1, so it survives even with a persisting minor (design §Option C).
- **Metered run vote-noise flips the keep.** Mitigated: report the bands; the unit keep is grounded in the
  recorded medians; if flips appear, name vote-noise reduction as the co-lever (ticket-anticipated).
- **CG11 break read as a regression.** Mitigated: explicitly documented as the one *intended* semantic
  change in design §"intended break" and structure §2.

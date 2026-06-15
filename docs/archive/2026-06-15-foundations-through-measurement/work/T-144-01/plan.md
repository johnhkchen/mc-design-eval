# T-144-01 Plan — glance-true-budget

Ordered, independently verifiable steps. Baseline first; commit per coherent unit; **stage only
T-144 files** (T-142 just landed on the same branch — [[shared-file-commit-sweep]]).

## Step 0 — Baseline (verify green before touching anything)
- `npm test` → record the green count (expect ~2020 after T-142). If red on entry, stop and report.
- Confirm committed gate records pass offline: `npm run gate:offline -- --subject cottage --label
  patternbook` (and barn-patternbook) → records valid pre-change.
**Gate:** baseline green captured.

## Step 1 — Config parameter (the calibrated cap)
- `src/config.mjs`: add `minorBudget: 10` to `MULTI_ANGLE_GATE` with the derivation doc comment;
  keep `gapBudget: 2`.
- Update `multi-angle-gate.test.mjs:18-22` to also assert `minorBudget===10` (keep `gapBudget===2`,
  frozen).
**Verify:** `node --test src/form/multi-angle-gate.test.mjs` — the contract test green.
**Commit:** `feat(T-144-01): minorBudget=10 — calibrated v2 cap beside legacy gapBudget`.

## Step 2 — Pure core: `budgetVerdict` + v2 aggregate (the heart)
- Add `MULTI_ANGLE_BUDGET_SCHEMA` export.
- Add pure `budgetVerdict(decidedViews, {gapBudget, minorBudget})` (identity-first, severity-aware,
  legacy beside).
- Rewire `aggregateMultiAngle` DECIDE branch to call it; return additive v2 fields + `legacy` block.
  REFUSE branch **byte-unchanged**. Update JSDoc.
- Rewrite the budget unit tests (`multi-angle-gate.test.mjs:114-144`) for v2:
  - all-same-object 0-gap → PASS, `legacy.passed===true`, `policy` set.
  - all-same-object **8-minor** → v2 PASS, `legacy.passed===false`, `minorCount===8`.
  - all-same-object **11-minor** → v2 FAIL `{angle:"(all)",reason:"minor-budget"}`,
    `legacy.passed===false`.
  - one drifted view → v2 FAIL `{angle, reason:"drifted"}`, `majorCount>=1`.
  - coverage-fail view → v2 FAIL `{angle, reason:"coverage"}`.
  - REFUSE cases (`:148-171`) — assert unchanged (no `policy`/`legacy` on a refusal).
- **Add the anchor regression test** (data-driven, the four committed shapes) → PASS/PASS/FAIL/PASS.
**Verify:** `node --test src/form/multi-angle-gate.test.mjs` green; `node --test
src/form/gate-instrument.test.mjs src/form/judge-reply.test.mjs` green (they import the core).
**Commit:** `feat(T-144-01): budget policy v2 — identity-first, severity-aware, legacy beside`.

## Step 3 — Runner contract + offline tolerance
- `benchmarks/sculpture/multi-angle-gate.mjs`: add `minorBudget` to the `contract` block; add the
  tolerant offline clause (v2 records require `legacy` + numeric `minorBudget`; v1 records unchanged).
- Optionally append the v2 summary to the console/md lines (additive).
**Verify:**
  - `npm run gate:offline -- --subject barn --label patternbook` and `--subject cottage --label
    patternbook` → **still valid** (committed v1 records, no policy field).
  - `node --check benchmarks/sculpture/multi-angle-gate.mjs`.
**Commit:** `feat(T-144-01): runner emits minorBudget; offline checker tolerant of v2 records`.

## Step 4 — Dual reporting in consumers (additive)
- `head-to-head.mjs gateRow`: pass through `policy/legacyPassed/majorCount/minorCount/minorBudget`
  (null on v1). `headToHeadMd`: v2-aware gaps cell **only when policy present**; v1 fixtures render
  byte-identical.
- `factory/receipts.mjs verdictCell`: additive v2 annotation when `row.policy` present.
**Verify:** `node --test src/form/head-to-head.test.mjs src/factory/receipts.test.mjs` → green
(fixtures are v1 → unchanged output).
**Commit:** `feat(T-144-01): head-to-head + receipts surface v2 beside legacy (additive)`.

## Step 5 — The calibration sweep + committed evidence record (AC2)
- New `benchmarks/sculpture/budget-calibration.mjs`: read committed `multi-angle/*.json`, re-derive
  `{v2, legacy}` via the pure `budgetVerdict`, assert the binding anchors, flag coverage-refused as
  noted-not-rescored, `guardedWriteRecord` → `budget-calibration.{json,md}`.
- `package.json`: add `"gate:calibrate": "node benchmarks/sculpture/budget-calibration.mjs"`.
- Run `npm run gate:calibrate` → writes the record; **non-zero exit if any anchor mismatches**
  (self-checking). Confirm committed gate records' mtimes/SHAs **unchanged** (sweep is read-only).
**Verify:** the record shows barn-patternbook PASS-v2/FAIL-legacy, saltcrag same, cottage-patternbook
FAIL-v2; `git status` shows **only** the two new calibration files dirty (no gate-record drift).
**Commit:** `feat(T-144-01): budget-calibration sweep + committed evidence (anchors proven)`.

## Step 6 — Isolation & full regression (AC4)
- `node --test src/workshop/isolation.test.mjs` → green (the frozen-seam scan).
- `npm test` → full suite green; the new anchor unit + v2 budget cases pass; no pre-existing test
  regressed. If any milestone/witness test went red, diagnose: it should be a **fixture that pins
  the old `gap-budget` reason or a snapshot of the aggregate** — update minimally and additively, or
  if it pins a committed record's *recorded* (v1) verdict, leave the record alone (records untouched).
- Re-confirm no committed gate record changed: `git status --short benchmarks/sculpture/multi-angle/`
  shows only `budget-calibration.*`.
**Commit (if fixups needed):** `test(T-144-01): pin v2 anchors; update fixtures off legacy gap-budget`.

## Testing strategy
- **Unit (pure, runs under the glob):** `budgetVerdict`/`aggregateMultiAngle` v2 cases + the
  four-anchor regression — this is the primary AC2/AC1 proof and needs no IO.
- **Integration (offline, no judge):** `gate:offline` on committed records proves AC "records valid";
  `gate:calibrate` proves the sweep + anchors end-to-end and writes the committed evidence.
- **Isolation:** the frozen-seam scan proves no judge/prompt/azimuth/severity/camera change (AC4).
- **No GL, no metered judge anywhere in this ticket.**

## Verification criteria (maps to AC)
- **AC1 policy v2:** `budgetVerdict` is identity-first + severity-aware with a derived `minorBudget`;
  design.md records formula + rejected alternatives + derivation. ✔ via Step 2 + design.md.
- **AC2 anchors:** barn-patternbook, saltcrag PASS-v2; cottage-patternbook FAIL-v2; both arithmetics
  per verdict in the committed `budget-calibration` record; coverage-refused noted. ✔ Steps 2,5.
- **AC3 dual reporting, versioned:** aggregate emits v2 (deciding) + legacy ≤2 beside, `policy` tag,
  schema versioned; head-to-head/receipts/milestone-snapshots carry both; committed records valid.
  ✔ Steps 1–4.
- **AC4 frozen seam:** no judge, no prompt/azimuth/severity/camera change; isolation green;
  witnesses green-or-SKIP; `npm test` green incl. anchor regressions. ✔ Step 6.

## Rollback / risk
- Every code change additive; if a milestone fixture proves brittle, the v2 md is gated behind
  `policy != null` so v1 paths are byte-stable — revert is a one-field change.
- The sweep is read-only over committed records; the pin-guard refuses an unsanctioned record
  rotation, so an accidental gate-record write is structurally blocked.

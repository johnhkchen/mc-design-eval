# T-144-01 Structure — glance-true-budget

The blueprint. Five touched files + two new files (runner + its committed record/md). Every code
change is **additive** to keep committed records valid and the blast radius contained.

## 1. `src/config.mjs` — MODIFY (`:42-53`)

Add `minorBudget` beside the kept `gapBudget`, update the doc comment to record the derivation.

```js
export const MULTI_ANGLE_GATE = Object.freeze({
  azimuths: Object.freeze(["+x+z", "+x-z", "-x-z", "-x+z"]),
  gapBudget: 2,       // LEGACY flat budget — kept for dual reporting & committed-record validity
  minorBudget: 10,    // v2 (T-144-01): calibrated cap on total MINOR gaps when identity-first PASSes.
                      // Derivation: glance-passing observed ceiling 8 (barn ×2); structural ceiling
                      // 4×MAX_GAPS_PER_VIEW=12; 10 = midpoint, bites at >2.5 papercuts/view, clears
                      // both barn anchors with headroom. Calibrated, then frozen (E-34).
});
```
Public interface: `MULTI_ANGLE_GATE.minorBudget` (number). `gapBudget` unchanged → offline contract
check (`gate:offline:289`) stays green on every committed record.

## 2. `src/form/multi-angle-gate.mjs` — MODIFY

### 2a. New schema tag (near `:33-34`)
```js
export const MULTI_ANGLE_BUDGET_SCHEMA = "multi-angle-budget/v2";
```

### 2b. New pure helper `budgetVerdict(views, opts)` (before `aggregateMultiAngle`)
The deciding arithmetic, factored so the runner **and** the calibration sweep call one definition.
Input: the per-azimuth list already validated by the aggregate (each `{coverage, verdict}` or a
short-circuit). Output:
```js
/** @returns {{policy, passed, majorCount, minorCount, minorBudget,
 *             gapCount, gapBudget, legacyPassed, failures, gaps}} */
function budgetVerdict(decidedViews, { gapBudget, minorBudget }) { ... }
```
Logic (severity-aware, identity-first):
- Walk views in azimuth order. Coverage-fail → `failures.push {angle, reason:"coverage"}`.
- `verdict !== "same object"` → `failures.push {angle, reason: verdict}`.
- Tally `majorCount` / `minorCount` from every view's `gaps[].severity`; push `{angle, region,
  attribute}` into `gaps` (legacy shape, severity-blind — unchanged for consumers).
- `gapCount = gaps.length` (legacy tally — identical to today).
- **v2 budget overflow:** if `failures.length===0 && (majorCount>0 || minorCount>minorBudget)` →
  `failures.push {angle:"(all)", reason: majorCount>0 ? "major-gap" : "minor-budget"}`. (majorCount>0
  with zero identity-failures is structurally unreachable, but the clause makes the policy total.)
- `passed = failures.length === 0` (v2).
- `legacyPassed = identityClean && gapCount <= gapBudget` where `identityClean` = no coverage/drift
  failure (the old rule, computed independently so the legacy column is exact).

### 2c. `aggregateMultiAngle` DECIDE branch (`:172-198`) — rewire to `budgetVerdict`
- Keep stages 1 (REFUSE, **byte-unchanged** — no policy/legacy on refusals).
- Replace the inline tally + `gap-budget` push (`:173-188`) with a `budgetVerdict(decidedViews,
  {gapBudget, minorBudget})` call, where `gapBudget = opts.gapBudget ?? MULTI_ANGLE_GATE.gapBudget`
  and `minorBudget = opts.minorBudget ?? MULTI_ANGLE_GATE.minorBudget`.
- Return (additive, order preserves existing keys):
  ```js
  { schema, decided:true, passed: bv.passed, policy: MULTI_ANGLE_BUDGET_SCHEMA,
    majorCount: bv.majorCount, minorCount: bv.minorCount, minorBudget,
    gapCount: bv.gapCount, gapBudget, gaps: bv.gaps, failures: bv.failures,
    legacy: { passed: bv.legacyPassed, gapBudget, gapCount: bv.gapCount }, views: outcomes() }
  ```
- JSDoc on `aggregateMultiAngle` updated: opts gains `minorBudget`; return gains the v2 fields.

**Invariants preserved:** `passed`, `gapCount`, `gapBudget`, `gaps`, `failures`, `schema`, `decided`,
`views` all still present with compatible types → `composeKitAwareVerdict`, `gateRow`, milestone
runners, the offline checker, and `recordMd` keep reading the same keys. `viewOutcomeLabel`,
`gateInstrumentDiff`, the parser, and the prompt are **untouched**.

## 3. `benchmarks/sculpture/multi-angle-gate.mjs` — MODIFY (runner, low-touch)

- **`gateCensuses`/render/judge/persist paths: untouched.** The aggregate is consumed at `:538-540`
  and `:692-694`; the richer return rides into the record automatically (`record.aggregate =
  aggregate`, `:570`). No change needed for the record to carry v2.
- **Contract block (`:558-563`):** add `minorBudget: MULTI_ANGLE_GATE.minorBudget` beside
  `gapBudget` (additive — committed records lack it; offline checker must not *require* it, see 3a).
- **3a. Offline checker (`:286-323`):** `contract` check keeps `gapBudget === ...gapBudget` (still
  2). Add a tolerant clause: *if* `rec.aggregate.policy === MULTI_ANGLE_BUDGET_SCHEMA` then assert
  `rec.aggregate.legacy` present and `typeof rec.aggregate.minorBudget === "number"`; else (legacy
  v1 record) the existing checks stand. This keeps **committed v1 records valid** and validates
  fresh v2 records.
- Console/md lines (`:584`, `:726`, `recordMd:744-746`) read `gapCount/gapBudget` — keep; optionally
  append the v2 policy summary additively (no existing test pins runner stdout).

## 4. `src/form/head-to-head.mjs` — MODIFY (additive dual-report)

`gateRow` (`:28-44`) gains (after `gapBudget`):
```js
policy: rec.aggregate.policy ?? null,
legacyPassed: rec.aggregate.legacy ? rec.aggregate.legacy.passed : null,
majorCount: rec.aggregate.majorCount ?? null,
minorCount: rec.aggregate.minorCount ?? null,
minorBudget: rec.aggregate.minorBudget ?? null,
```
`headToHeadMd` (`:97`): when `r.policy` present, the gaps cell reads `minor/minorBudget (maj N)`;
when null (v1 fixture) it renders **exactly as today** (`gapCount/gapBudget`). The existing test
fixtures have no `policy` → byte-identical md → `head-to-head.test.mjs` H2H6/H2H7 stay green.

## 5. `src/factory/receipts.mjs` — MODIFY (additive)

`verdictCell` (`:19-23`): when `row.policy` present, append ` [v2: minor row.minorCount/row.minorBudget,
maj row.majorCount; legacy row.legacyPassed]`; else unchanged. `receipts.test.mjs` fixtures use v1
rows (no policy) → unchanged output.

## 6. `benchmarks/sculpture/budget-calibration.mjs` — **NEW** (impure sweep, AC2)

- Imports the pure `budgetVerdict` (export it) + `MULTI_ANGLE_GATE`, `MULTI_ANGLE_BUDGET_SCHEMA`.
- Reads every `benchmarks/sculpture/multi-angle/*.json` (glob), skips refusals/undecided.
- For each, re-derives `{v2, legacy}` from committed `views[].gaps[]` and tallies same/drift/major/
  minor; flags `coverageRefused` records as `noted, not re-scored`.
- Asserts the binding anchors; non-zero exit if any anchor mismatches.
- `guardedWriteRecord` (pin-guard) → `multi-angle/budget-calibration.{json,md}`, schema
  `budget-calibration/v1`, carrying the `minorBudget` derivation text. **Opens committed gate
  records read-only.**
- npm script `gate:calibrate` (package.json) — see Plan.

## 7. `src/form/multi-angle-gate.test.mjs` — MODIFY (v2 regressions, AC4)

- `:18-22`: extend to assert `MULTI_ANGLE_GATE.minorBudget === 10` (keep `gapBudget===2`, frozen).
- `:114-127`: **rewrite** the flat-≤2 cases for v2: all-same-object zero-gap PASS (keep); add an
  all-same-object **8-minor PASS** case (`minorCount 8 ≤ 10`, `legacy.passed===false`,
  `policy===MULTI_ANGLE_BUDGET_SCHEMA`); add an **11-minor minor-budget FAIL** case
  (`failures:[{angle:"(all)",reason:"minor-budget"}]`); a **drifted** case still FAILs v2 with
  `majorCount` reported.
- `:129-144`: drifted/coverage cases — assert they still FAIL (identity-first) + check the new
  `policy/legacy/majorCount` fields are populated.
- **New anchor regression test** (data-driven): inline the four anchors' gap shapes (barn 8-minor,
  saltcrag 8-minor, cottage 2-same/2-drift-4-major, synthetic 2-minor) and assert v2 PASS/PASS/
  FAIL/PASS — pinning AC2 as a unit (no IO, runs under the test glob).

## 8. `benchmarks/sculpture/budget-calibration.test.mjs` — **NEW** (optional, light)

If the sweep has any pure tally helper not already in `budgetVerdict`, unit it; otherwise the AC2
unit lives in (7). Keep the runner thin so #7 carries the coverage.

## Ordering (where it matters)

config → `budgetVerdict` + schema tag + `aggregateMultiAngle` rewire (the core) → tests for the core
→ runner contract/offline tolerance → head-to-head/receipts additive → calibration sweep + record →
full `npm test`. Steps 4–6 depend only on the core's return shape; the sweep depends on the exported
`budgetVerdict`.

## Module boundaries (unchanged)

Pure core (`multi-angle-gate.mjs`) owns the arithmetic + the new schema tag; the impure runner owns
GL/judge/IO/exit-codes; the calibration sweep owns the read-only re-derivation evidence. The judge
contract seam (prompt/parser/azimuths/severity/reply-policy/camera) is **not crossed**.

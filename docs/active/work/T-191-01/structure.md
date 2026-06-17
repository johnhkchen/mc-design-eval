# T-191-01 — STRUCTURE: file-level changes

Three files change. No files created or deleted. No frozen-instrument files touched.

## 1. `src/workshop/climb-gate.mjs` (MODIFY — the pure gate)

### 1a. New helper `deptItemCounts(items)` (add after `deptMajorCounts`, ~line 54)

Per-department `{major, minor}` counts, the net-guard companion to `deptMajorCounts`. Pure, no mutation.

```js
/**
 * Per-department {major, minor} item counts, derived purely from a critique's `items` — the net companion
 * to deptMajorCounts. The department-dominant override (T-191-01) needs TOTAL burden per targeted dept (not
 * just majors) so it can REJECT a tool that clears a targeted major while adding new minors in its own
 * target (net degradation), while KEEPING a major→fewer-or-equal-total improvement. Skips no-department
 * items; counts only "major"/"minor" severities.
 * @param {Array<{department?:string, severity?:string}>} items
 * @returns {{[department:string]: {major:number, minor:number}}}
 */
export function deptItemCounts(items = []) { ... }
```

### 1b. New private `departmentDominant({...})` (add above `acceptsRound`)

Returns the cleared department name (string) or `null`. Encodes rule (a)+(b)+(c) from design.md:
- requires `targetDepartments` (array) + `beforeDeptMajors` + `afterDeptMajors`; else `null` (inert).
- (a) `cleared = targetDepartments.find(d => num(beforeDeptMajors[d]) > num(afterDeptMajors[d]))`; if none → `null`.
- (b) for every `d` in targets: if `num(afterDeptMajors[d]) > num(beforeDeptMajors[d])` → `null` (new major in a target).
- (c) **only when `beforeDeptItems` && `afterDeptItems` are supplied**: for every `d` in targets, with
  `tot = m.major + m.minor`, if `tot(after[d]) > tot(before[d])` → `null` (net degradation). When item counts
  are absent, (c) is skipped → the **major-only** guard (documents the leak in a test).
- else → return `cleared`.

### 1c. `acceptsRound` — add the override path + two params (MODIFY lines 85–105)

- Signature gains `beforeDeptItems = null, afterDeptItems = null` in the opts object (additive; existing
  callers/tests unaffected).
- Control flow becomes:
  1. `delta >= margin` → accept `improved +N` (unchanged).
  2. **NEW:** `const dom = departmentDominant({ targetDepartments, beforeDeptMajors, afterDeptMajors, beforeDeptItems, afterDeptItems });`
     `if (dom) return { accept:true, delta, reason: \`${dom} cleared a major (department-dominant override)\` };`
     — placed **before** the regression reject so it fires on regression *and* tie.
  3. `delta <= -margin` → reject `regressed N` (unchanged; now only reached when the override did not fire).
  4. tie zone: keep ONLY the whole-build coverage-shrink break (`breadthShrank || majorsShrank`). **Remove**
     the old tie-zone department leg (lines 100–103) — `departmentDominant` in step 2 subsumes it.
  5. reject `no shrink` (unchanged).
- Update the JSDoc block to describe the override (cleared-major ∧ no-new-major ∧ no-net-growth overrides a
  whole-build regression) and the new params.

## 2. `src/workshop/climb-gate.test.mjs` (MODIFY — pure unit tests)

- Import `deptItemCounts` alongside the existing names.
- **CG11 (UPDATE the 4th case):** the current "regression past margin still rejects despite a cleared ROOF
  major" assertion is the intended semantic break. Change it to assert the override now **KEEPS** that case
  *when item counts are present and show no net growth* (reason `/department-dominant override/`). Keep the
  first three CG11 cases unchanged (tie keep / not-cleared reject / no-context reject).
- **CG13 (NEW) — `deptItemCounts`:** counts {major,minor} per dept, ignores no-department items, empty/undef
  → `{}`. Mirror CG10's shape.
- **CG14 (NEW) — override KEEPS the real grey roof on a past-margin regression:** before score 60 / after 48
  (delta −12), `targetDepartments:["ROOF"]`, beforeItems `{ROOF:{major:1,minor:1}}`, afterItems
  `{ROOF:{major:0,minor:1}, WALL:{major:1,minor:0}, OPENING:{major:1,minor:0}}`, with matching deptMajors.
  Assert accept + reason `/ROOF cleared a major \(department-dominant override\)/`.
- **CG15 (NEW) — override REJECTS the adversarial fixture (net guard) AND documents the major-only leak:**
  before 60 / after 48, targets `["ROOF"]`, beforeItems `{ROOF:{major:1,minor:0}}`, afterItems
  `{ROOF:{major:0,minor:2}}` (cleared the major, added 2 minors → total 1→2).
  - With item counts → **reject** `regressed` (net guard (c) blocks the override).
  - Without item counts (major-only) → **accept** `/department-dominant override/` — the documented leak the
    net guard plugs (this is the explicit anti-hedge "it fails like this, here's the fix").
- **CG16 (NEW) — override does NOT fire on a genuinely-bad change:** before 60 / after 48, targets `["ROOF"]`,
  ROOF major `1→1` (not cleared), assert reject `regressed` (no clear → no override → regression reject).
- Existing CG1–CG10, CG12 stay byte-unchanged.

## 3. `experiments/eval-alignment/picture-climb.mjs` (MODIFY — the runner)

- Line 45 import: add `deptItemCounts` to the `climb-gate.mjs` import list.
- Decision site (lines 304–309): compute item counts and pass them to the gate:
  ```js
  const beforeDeptMajors = deptMajorCounts(prev.items);
  const afterDeptMajors  = deptMajorCounts(candScore.items);
  const beforeDeptItems  = deptItemCounts(prev.items);
  const afterDeptItems   = deptItemCounts(candScore.items);
  const gate = acceptsRound(prev, candScore,
    { margin, targetDepartments, beforeDeptMajors, afterDeptMajors, beforeDeptItems, afterDeptItems });
  ```
- Trajectory record (lines 315–317): add `deptItemsBefore: beforeDeptItems, deptItemsAfter: afterDeptItems`
  so the keep/reject is auditable from `trajectory.json` (the after-minor counts the old run lacked).
- Run with `CLIMB_OUT=docs/active/work/T-191-01/trajectory.json` so T-188/T-190 evidence is untouched.

## Ordering of changes (matters)

1. `climb-gate.mjs` (1a → 1b → 1c) — the pure rule first.
2. `climb-gate.test.mjs` — lock the rule (KEEP + adversarial REJECT + leak documentation) under `npm test`
   **before** spending on the metered run.
3. `picture-climb.mjs` — wire item counts; then the metered KEEP re-run.

## Module boundaries (unchanged)

- All decision logic stays in `climb-gate.mjs` (pure, in `npm test`). The runner only *gathers* evidence
  (`deptItemCounts(prev.items)`) and *passes* it. No GL/LLM/I/O enters the gate. No new module; no public
  API beyond the one new exported helper.
